import { cp, mkdir, readFile, readdir, rm, stat } from 'node:fs/promises';
import { resolve, dirname, extname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import { bundleStudio } from './bundle.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
export async function buildStudio(output = resolve(root, 'dist')) {
  await bundleStudio();
  const html = await readFile(resolve(root, 'index.html'), 'utf8');
  const localRefs = [...html.matchAll(/(?:src|href)="([^"#]+)"/g)].map(m => m[1]).filter(p => !/^(?:https?:|mailto:|#)/.test(p));
  for (const ref of localRefs) {
    const path = resolve(root, ref.split(/[?#]/)[0]);
    assert(path.startsWith(root), `Asset outside studio: ${ref}`);
    await stat(path);
  }
  await rm(output, { recursive:true, force:true });
  await mkdir(output, { recursive:true });
  const historical = new Set(['assets/audio', 'js/audio.js', ...['cindra', 'commissionmatch', 'mangue', 'morfeu'].map(name => `assets/art/${name}.webp`)]);
  for (const entry of ['index.html', 'styles.css', 'drawn.css', 'js', 'assets']) {
    await cp(resolve(root, entry), resolve(output, entry), {
      recursive:true,
      filter: source => {
        const path = relative(root, source);
        return !historical.has(path) && (!path.startsWith('assets/models/') || path === 'assets/models/morfeu-scout-v06.glb');
      }
    });
  }
  const files = await readdir(output, { recursive:true });
  let bytes = 0;
  for (const file of files) {
    const path=resolve(output,file); const info=await stat(path);
    if (!info.isFile()) continue;
    bytes += info.size;
    if (extname(path)==='.css') {
      const css=await readFile(path,'utf8');
      for (const [,ref] of css.matchAll(/url\(["']?([^)'"\s]+)["']?\)/g)) {
        if (/^(?:data:|https?:)/.test(ref)) continue;
        await stat(resolve(dirname(path), ref));
      }
    }
  }
  console.log(`Studio built: ${files.length} entries, ${(bytes/1024/1024).toFixed(2)} MiB. ${output}`);
  return { output, bytes };
}
if (process.argv[1] && resolve(process.argv[1])===fileURLToPath(import.meta.url)) await buildStudio();
