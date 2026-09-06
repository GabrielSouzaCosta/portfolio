// Render planets headlessly: bundle planets.js to CJS, build a Scene per world,
// and produce JSON pixel stats + a PPM frame per world for visual comparison.
// Usage: node .shotgen/render.mjs [world ...]
import { buildSync } from 'esbuild';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const outfile = path.join(ROOT, '.shotgen/planets.cjs');
buildSync({
  entryPoints: [path.join(ROOT, 'js/three/planets.js')],
  bundle: true, format: 'cjs', platform: 'node', outfile, logLevel: 'silent',
});
const require = createRequire(import.meta.url);
const THREE = require(path.join(ROOT, 'node_modules/three'));
const { createPlanet } = require(outfile);

const W = 320, H = 320;
const worlds = process.argv.slice(2);
const targets = worlds.length ? worlds : ['cindra', 'commissionmatch', 'mangue'];

// Software rasterization via a camera ray march is overkill; use three's
// WebGLRenderer only if a GL context exists. Fallback: project the scene with
// a tiny CPU rasterizer (z-buffer, lambert + specular on triangle faces) —
// good enough to judge silhouette, palette and relief.
function render(scene, camera) {
  const frame = new Float32Array(W * H * 4);
  const depth = new Float32Array(W * H).fill(Infinity);
  camera.updateMatrixWorld(true);
  // resolve lights (match scene.js fallbacks simplified)
  const sun = new THREE.Vector3(-.45, .72, .55).normalize();
  const keyColor = new THREE.Color('#ffe8c4').multiplyScalar(1.6);
  const fillColor = new THREE.Color('#92bac9').multiplyScalar(.45);
  const fillDir = new THREE.Vector3(.6, .35, -.7).normalize();
  const ambient = new THREE.Color('#5a6a7d').multiplyScalar(.5);
  const eye = camera.position.clone();
  scene.updateMatrixWorld(true);
  const view = camera.matrixWorldInverse;
  const proj = camera.projectionMatrix;
  scene.traverse(o => {
    if (!o.isMesh || !o.visible) return;
    const mat = Array.isArray(o.material) ? o.material[0] : o.material;
    const baseColor = mat.color ? mat.color.clone() : new THREE.Color('#888');
    const emissive = mat.emissive ? mat.emissive.clone().multiplyScalar(mat.emissiveIntensity ?? 1) : new THREE.Color(0, 0, 0);
    const rough = mat.roughness ?? .8;
    const pos = o.geometry.getAttribute('position');
    const nrm = o.geometry.getAttribute('normal');
    const idx = o.geometry.index;
    const vert = new THREE.Vector3(), norm = new THREE.Vector3(), clip = new THREE.Vector3();
    const worldN = new THREE.Matrix3().getNormalMatrix(o.matrixWorld);

    const project = (i, out3) => {
      vert.fromBufferAttribute(pos, i).applyMatrix4(o.matrixWorld);
      out3.copy(vert); // world
      clip.set(vert.x, vert.y, vert.z).applyMatrix4(o.matrixWorld); // reuse
      const v4 = new THREE.Vector4(vert.x, vert.y, vert.z, 1).applyMatrix4(view).applyMatrix4(proj);
      return { sx: (v4.x / v4.w * .5 + .5) * W, sy: (1 - (v4.y / v4.w * .5 + .5)) * H, sz: v4.z / v4.w };
    };
    const pA = new THREE.Vector3();
    const tris = [];
    const count = idx ? idx.count : pos.count;
    for (let f = 0; f < count; f += 3) {
      const ia = idx ? idx.getX(f) : f, ib = idx ? idx.getX(f + 1) : f + 1, ic = idx ? idx.getX(f + 2) : f + 2;
      const A = project(ia, pA), B = project(ib, pA), C = project(ic, pA);
      tris.push([A, B, C, ia, ib, ic]);
    }
    for (const [A, B, C, ia] of tris) {
      // flat normal at A (close enough for judging look)
      norm.fromBufferAttribute(nrm, ia).applyMatrix3(worldN).normalize();
      const n = norm;
      const lam = Math.max(0, n.dot(sun));
      const fill = Math.max(0, n.dot(fillDir));
      let color = baseColor.clone().multiply(
        ambient.clone()
          .add(keyColor.clone().multiplyScalar(lam))
          .add(fillColor.clone().multiplyScalar(fill))
      );
      // crude fresnel sheen for polished materials
      const toEye = eye.clone().sub(pA).normalize();
      const fres = Math.pow(1 - Math.max(0, n.dot(toEye)), 3);
      color.add(new THREE.Color(1, 1, 1).multiplyScalar(fres * (1 - rough) * .8));
      color.add(emissive);
      // rasterize
      const minX = Math.max(0, Math.floor(Math.min(A.sx, B.sx, C.sx)));
      const maxX = Math.min(W - 1, Math.ceil(Math.max(A.sx, B.sx, C.sx)));
      const minY = Math.max(0, Math.floor(Math.min(A.sy, B.sy, C.sy)));
      const maxY = Math.min(H - 1, Math.ceil(Math.max(A.sy, B.sy, C.sy)));
      const d = (B.sy - C.sy) * (A.sx - C.sx) + (C.sx - B.sx) * (A.sy - C.sy);
      if (Math.abs(d) < 1e-7) continue;
      for (let y = minY; y <= maxY; y++) for (let x = minX; x <= maxX; x++) {
        const l1 = ((B.sy - C.sy) * (x + .5 - C.sx) + (C.sx - B.sx) * (y + .5 - C.sy)) / d;
        const l2 = ((C.sy - A.sy) * (x + .5 - C.sx) + (A.sx - C.sx) * (y + .5 - C.sy)) / d;
        const l3 = 1 - l1 - l2;
        if (l1 < 0 || l2 < 0 || l3 < 0) continue;
        const z = l1 * A.sz + l2 * B.sz + l3 * C.sz;
        const px = y * W + x;
        if (z >= depth[px]) continue;
        depth[px] = z;
        frame[px * 4] = Math.min(1, color.r); frame[px * 4 + 1] = Math.min(1, color.g);
        frame[px * 4 + 2] = Math.min(1, color.b); frame[px * 4 + 3] = 1;
      }
    }
  });
  return { frame, depth };
}

function savePNG(file, frame) {
  // minimal PNG encoder
  const zlib = require('zlib');
  const raw = Buffer.alloc((W * 3 + 1) * H);
  for (let y = 0; y < H; y++) {
    raw[y * (W * 3 + 1)] = 0;
    for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 4;
      raw[y * (W * 3 + 1) + 1 + x * 3] = Math.round(Math.pow(frame[i], .4545) * 255);
      raw[y * (W * 3 + 1) + 2 + x * 3] = Math.round(Math.pow(frame[i + 1], .4545) * 255);
      raw[y * (W * 3 + 1) + 3 + x * 3] = Math.round(Math.pow(frame[i + 2], .4545) * 255);
    }
  }
  const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    return c >>> 0;
  });
  const crc32 = buf => {
    let c = 0xffffffff;
    for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
  };
  const chunk = (type, data) => {
    const t = Buffer.from(type, 'ascii');
    const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
    const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(Buffer.concat([t, data])));
    return Buffer.concat([len, t, data, crc]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(W, 0); ihdr.writeUInt32BE(H, 4);
  ihdr[8] = 8; ihdr[9] = 2; // 8-bit RGB
  const png = Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
  fs.writeFileSync(file, png);
}

// convert any stale PPMs then write PNGs only
function writePPM(file, frame) {
  const head = Buffer.from(`P6\n${W} ${H}\n255\n`);
  const body = Buffer.alloc(W * H * 3);
  for (let i = 0; i < W * H; i++) {
    // black background
    body[i * 3] = Math.round(Math.pow(frame[i * 4], .4545) * 255);
    body[i * 3 + 1] = Math.round(Math.pow(frame[i * 4 + 1], .4545) * 255);
    body[i * 3 + 2] = Math.round(Math.pow(frame[i * 4 + 2], .4545) * 255);
  }
  fs.writeFileSync(file, Buffer.concat([head, body]));
}

const stats = {};
for (const world of targets) {
  const scene = new THREE.Scene();
  const planet = createPlanet(THREE, world);
  const pivot = new THREE.Group();
  pivot.add(planet);
  pivot.rotation.z = world === 'mangue' ? .06 : -.08;
  scene.add(pivot);
  planet.userData.animate(12, 0);
  const camera = new THREE.OrthographicCamera(-2, 2, 2, -2, .1, 50);
  camera.position.set(0, 1.1, 7);
  camera.lookAt(0, 0, 0);
  // match scene.js fit: height = radius*2.16
  model_update(scene);
  let radius = planet.userData.bodyRadius * 1.6;
  scene.updateMatrixWorld(true);
  // live-fit like scene.js: measure max extent
  const box = new THREE.Box3().setFromObject(planet);
  const size = box.getSize(new THREE.Vector3());
  const height = Math.max(size.y, size.x) * 1.14;
  camera.left = -height / 2; camera.right = height / 2;
  camera.top = height / 2; camera.bottom = -height / 2;
  camera.updateProjectionMatrix();
  const { frame, depth } = render(scene, camera);
  // stats: fill fraction, mean luminance of lit pixels, palette
  let px = 0, lum = 0;
  const buckets = new Map();
  for (let i = 0; i < W * H; i++) {
    if (frame[i * 4 + 3] < .5) continue;
    px++;
    lum += .2126 * frame[i * 4] + .7152 * frame[i * 4 + 1] + .0722 * frame[i * 4 + 2];
    const key = [0, 1, 2].map(c => Math.round(frame[i * 4 + c] * 6)).join(',');
    buckets.set(key, (buckets.get(key) || 0) + 1);
  }
  const top = [...buckets.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);
  stats[world] = { fill: +(px / (W * H)).toFixed(3), meanLum: +(lum / px).toFixed(3), topColors: top.map(([k, n]) => `${k}:${((n / px) * 100).toFixed(1)}%`) };
  savePNG(path.join(ROOT, `.shotgen/${world}.png`), frame);
  depth.fill(Infinity);
}
function model_update() {}
console.log(JSON.stringify(stats, null, 2));
