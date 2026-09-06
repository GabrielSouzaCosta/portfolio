// Build planets.js as a CommonJS require hook for puppeteer rendering
import { buildSync } from 'esbuild';
import { writeFileSync } from 'fs';
import { createRequire } from 'module';
import path from 'path';
import { fileURLToPath } from 'url';
const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const outfile = path.join(ROOT, '.shotgen/planets.cjs');
buildSync({
  entryPoints: [path.join(ROOT, 'js/three/planets.js')],
  bundle: true, format: 'cjs', platform: 'node', outfile, logLevel: 'silent',
});
const require = createRequire(import.meta.url);
const THREE = require('three');
const { createPlanet } = require(outfile);
console.log('build ok', typeof createPlanet);
