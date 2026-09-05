import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Script } from 'node:vm';
import { transform } from 'esbuild';

const root = fileURLToPath(new URL('../', import.meta.url));
const output = path.join(root, 'dist');
const assetRoot = path.join(root, 'assets') + path.sep;
const copied = new Map();
const emitted = new Map();
const originalHtml = readFileSync(path.join(root, 'index.html'), 'utf8');
const stylesheetTags = [...originalHtml.matchAll(/<link\b[^>]*>/gi)]
  .filter(([tag]) => attribute(tag, 'rel') === 'stylesheet');
const scriptTags = [...originalHtml.matchAll(/<script\b[^>]*>[\s\S]*?<\/script\s*>/gi)];

assert(stylesheetTags.length > 0, 'No stylesheets found in index.html.');
assert(scriptTags.length > 0, 'No scripts found in index.html.');
rmSync(output, { recursive: true, force: true });
mkdirSync(path.join(output, 'assets'), { recursive: true });

function attribute(tag, name) {
  return tag.match(new RegExp(`\\s${name}\\s*=\\s*(["'])(.*?)\\1`, 'i'))?.[2];
}

function localPath(reference, owner) {
  const pathname = reference.split(/[?#]/, 1)[0];
  assert(pathname && !/^(?:[a-z]+:|\/\/)/i.test(pathname), `Expected a local file: ${reference}`);
  const absolute = path.resolve(root, path.dirname(owner), pathname);
  assert(absolute.startsWith(root), `File escapes the project: ${reference}`);
  return absolute;
}

function emit(name, content) {
  const buffer = Buffer.isBuffer(content) ? content : Buffer.from(content);
  const digest = createHash('sha256').update(buffer).digest('hex').slice(0, 16);
  const extension = path.extname(name);
  const filename = `${path.basename(name, extension)}.${digest}${extension}`;
  const url = `/assets/${filename}`;
  if (emitted.has(url)) {
    assert(emitted.get(url).equals(buffer), `Fingerprint collision: ${url}`);
  } else {
    emitted.set(url, buffer);
    writeFileSync(path.join(output, 'assets', filename), buffer);
  }
  return url;
}

function asset(reference, owner = 'index.html') {
  if (/^(?:#|data:|https?:|\/\/)/i.test(reference)) return reference;
  if (emitted.has(reference)) return reference;
  const absolute = localPath(reference, owner);
  assert(absolute.startsWith(assetRoot), `Expected a file in assets/: ${reference}`);
  assert(/\.(?:webp|woff2)$/i.test(absolute) || absolute === path.join(root, 'assets/favicon.svg'),
    `Only optimized WebP images, WOFF2 fonts, and the SVG favicon may be served: ${reference}`);
  if (!copied.has(absolute)) copied.set(absolute, emit(path.basename(absolute), readFileSync(absolute)));
  const fragment = reference.includes('#') ? `#${reference.split('#').slice(1).join('#')}` : '';
  return copied.get(absolute) + fragment;
}

function srcset(value, rewrite) {
  return value.split(',').map(candidate => {
    const match = candidate.trim().match(/^(\S+)(?:\s+(\d+(?:\.\d+)?[wx]))?$/);
    assert(match, `Unsupported srcset candidate: ${candidate}`);
    return rewrite(match[1]) + (match[2] ? ` ${match[2]}` : '');
  }).join(', ');
}

function rewriteHtmlAssets(html, rewrite) {
  return html.replace(/<(?:link|img|source|image|script)\b[^>]*>/gi, tag =>
    tag.replace(/\s(href|src|srcset)\s*=\s*(["'])(.*?)\2/gi, (match, name, quote, value) => {
      const updated = name.toLowerCase() === 'srcset' ? srcset(value, rewrite) : rewrite(value);
      return ` ${name}=${quote}${updated}${quote}`;
    }));
}

const stylesheets = stylesheetTags.map(([tag]) => {
  assert(!/\s(?:media|disabled|title)(?:\s|=|>)/i.test(tag), `Conditional stylesheet needs explicit build support: ${tag}`);
  const reference = attribute(tag, 'href');
  assert(reference, `Stylesheet missing href: ${tag}`);
  const source = readFileSync(localPath(reference, 'index.html'), 'utf8');
  assert(!/@import\b/i.test(source), `Resolve CSS imports explicitly before bundling: ${reference}`);
  return source.replace(/url\(\s*(["']?)([^)'"\s]+)\1\s*\)/gi,
    (_match, _quote, value) => `url("${asset(value, reference.split('?')[0])}")`);
});

const scripts = scriptTags.map(([tag]) => {
  const opening = tag.slice(0, tag.indexOf('>') + 1);
  const reference = attribute(opening, 'src');
  assert(reference && /\sdefer(?:\s|>|=)/i.test(opening) && !/\s(?:async|type)(?:\s|>|=)/i.test(opening),
    `Build expects classic deferred scripts with src: ${opening}`);
  assert(/^\s*$/.test(tag.slice(opening.length).replace(/<\/script\s*>$/i, '')),
    `Inline script contents need explicit build support: ${opening}`);
  return readFileSync(localPath(reference, 'index.html'), 'utf8')
    .replace(/(["'])(assets\/[^"'\s]+\.(?:webp|woff2|svg)(?:\?[^"'\s]*)?)\1/g,
      (_match, quote, value) => `${quote}${asset(value)}${quote}`);
});

// Transform classic script text in HTML order. Bundling/importing the UMD physics
// files would change their browser globals and break the interactive bow.
const [css, js] = await Promise.all([
  transform(stylesheets.join('\n'), { loader: 'css', minify: true, legalComments: 'none' }),
  transform(scripts.join('\n;\n'), { loader: 'js', minify: true, target: 'es2022', legalComments: 'none' }),
]);
assert.equal(css.warnings.length, 0, JSON.stringify(css.warnings));
assert.equal(js.warnings.length, 0, JSON.stringify(js.warnings));
new Script(js.code, { filename: 'site.js' });
const cssUrl = emit('site.css', css.code);
const jsUrl = emit('site.js', js.code);

let html = originalHtml;
for (const [index, [tag]] of stylesheetTags.entries()) {
  html = html.replace(tag, index === 0 ? `<link rel="stylesheet" href="${cssUrl}">` : '');
}
for (const [index, [tag]] of scriptTags.entries()) {
  html = html.replace(tag, index === 0 ? `<script src="${jsUrl}" defer></script>` : '');
}
html = rewriteHtmlAssets(html, asset);
// Keep copy, inline SVG, and their significant whitespace byte-for-byte intact.
writeFileSync(path.join(output, 'index.html'), html);

for (const filename of readdirSync(path.join(root, 'assets/fonts')).sort()) {
  if (filename.endsWith('-OFL.txt') || filename === 'SOURCES.json') {
    emit(filename, readFileSync(path.join(root, 'assets/fonts', filename)));
  }
}

// Fail the build on dangling URLs, leaked source paths, or missing fingerprints.
const validateAsset = url => {
  if (/^(?:#|data:|https?:|\/\/)/i.test(url)) return url;
  assert(emitted.has(url.split('#')[0]), `Missing built asset: ${url}`);
  return url;
};
rewriteHtmlAssets(html, validateAsset);
for (const [, url] of css.code.matchAll(/url\(["']?([^)'"\s]+)["']?\)/g)) validateAsset(url);
for (const [, url] of js.code.matchAll(/["'](\/assets\/[^"']+)["']/g)) validateAsset(url);
assert(!/["'](?:\.\.\/)?assets\//.test(css.code + js.code), 'Unresolved source asset URL in a bundle.');
assert.equal((html.match(/<link\b[^>]*rel="stylesheet"/g) || []).length, 1);
assert.equal((html.match(/<script\b/g) || []).length, 1);
assert.equal(html.slice(html.indexOf('<body')), originalHtml.slice(originalHtml.indexOf('<body'))
  .replace(/<(?:link|img|source|image|script)\b[^>]*>/gi, tag => rewriteHtmlAssets(tag, asset)),
  'The build changed page content beyond asset URLs.');

// Vercel runs hit routes only after finding a file. Cache misses must never
// inherit immutable headers. Keep every generated asset covered by that phase.
const hosting = JSON.parse(readFileSync(path.join(root, 'vercel.json'), 'utf8'));
const immutablePatterns = [];
const earlierCachePatterns = [];
let phase = null;
for (const route of hosting.routes || []) {
  if (route.handle) phase = route.handle;
  if (phase === null && Object.keys(route.headers || {}).some(key => key.toLowerCase() === 'cache-control')) {
    earlierCachePatterns.push(new RegExp(route.src));
  }
  if (Object.values(route.headers || {}).some(value => value.includes('immutable'))) {
    assert.equal(phase, 'hit', 'Immutable caching must apply only to existing files.');
    assert.equal(route.continue, true, 'A cache header must not change file routing.');
    immutablePatterns.push(new RegExp(route.src));
  }
}
for (const url of emitted.keys()) {
  assert(immutablePatterns.some(pattern => pattern.test(url)), `Built asset is missing immutable caching: ${url}`);
  assert(!earlierCachePatterns.some(pattern => pattern.test(url)), `An earlier cache header shadows immutable caching: ${url}`);
}

const size = value => `${(Buffer.byteLength(value) / 1024).toFixed(1)} KiB`;
console.log(`Built dist/: ${stylesheetTags.length} stylesheets → ${size(css.code)} CSS; ${scriptTags.length} scripts → ${size(js.code)} JS.`);
console.log(`${emitted.size} fingerprinted files; HTML ${size(html)}; total ${size(Buffer.concat([...emitted.values(), Buffer.from(html)]))}.`);
