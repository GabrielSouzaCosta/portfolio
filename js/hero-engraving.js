/* The hero opens as a pencil study (CSS) and the visitor's burin engraves it.
   Whatever is engraved comes alive: the cape, water, tree and clouds move, and
   each creature wakes once it is mostly cut. The strider walks the shore, the
   turtle crawls to drink, the bird takes off. Assets and their coordinates come
   from scripts/hero-life.py. Decorative only: copy and links never depend on it. */
(() => {
  'use strict';
  const hero = document.querySelector('.hero-inner');
  const art = hero && hero.querySelector('.hero-art');
  const canvas = hero && hero.querySelector('.hero-ink');
  const burin = hero && hero.querySelector('.hero-burin');
  if (!hero || !art || !canvas || !burin) return;

  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  // Without (scripting) support the CSS never swaps in the underdrawing.
  const gl = !reduced.matches && matchMedia('(scripting: enabled)').matches &&
    canvas.getContext('webgl', { alpha: true, premultipliedAlpha: true, antialias: false, depth: false, stencil: false });
  if (!gl) {
    hero.classList.add('ink-static');
    return;
  }
  hero.classList.add('ink-live');

  const PLATE_W = 1672, PLATE_H = 941;
  const MASK_SCALE = .5;
  const CELL = 22;
  const HATCH = -.62, CROSS = .52;
  const FINISH_AT = .62;
  const WAKE_AT = .5;
  // Plate regions the entrance cuts first: the knight, his cliff and the tree.
  const OPENING = [[1230, 250, 1500, 790], [940, 735, PLATE_W, PLATE_H], [1500, 300, PLATE_W, PLATE_H]];
  const LANDSCAPE = {
    ink: 'assets/images/hero-life/plate-ink.webp',
    sketch: 'assets/images/hero-life/plate-sketch.webp',
    motion: 'assets/images/hero-life/motion.webp'
  };

  // Boxes match scripts/hero-life.py. `faces` is the direction the drawing looks
  // (+1 right); `pivot` is the local point that travels (the feet, or the body).
  // Legs are [hip x, foot x, gait phase, hip y if not the body's].
  const CREATURES = [
    {
      name: 'turtle', box: [372, 672, 592, 781], faces: -1, pivot: [110, 106], grid: [6, 7], reflect: true,
      ink: 'assets/images/hero-life/turtle-ink.webp', sketch: 'assets/images/hero-life/turtle-sketch.webp',
      hip: 80, legs: [[76, 76, 0], [118, 118, .5], [152, 152, .25], [195, 195, .75]], range: [-120, 4],
      speed: 10, stride: 2.4, swing: .24, lift: 2.5, neck: [52, 74], head: 50
    },
    {
      name: 'strider', box: [600, 545, 890, 783], faces: 1, pivot: [140, 235], grid: [6, 8], reflect: true,
      ink: 'assets/images/hero-life/strider-ink.webp', sketch: 'assets/images/hero-life/strider-sketch.webp',
      hip: 152, legs: [[60, 36, .1, 150], [76, 72, 0], [90, 93, .5], [142, 130, .25], [162, 175, .75]], range: [-90, 40],
      speed: 24, stride: 1.8, swing: .135, lift: 5, neck: [180, 95]
    },
    {
      name: 'bird', box: [896, 204, 1296, 458], faces: 1, pivot: [300, 120], grid: [10, 10],
      ink: 'assets/images/hero-life/bird-ink.webp', sketch: 'assets/images/hero-life/bird-sketch.webp'
    }
  ];

  // ------------------------------------------------------------------ WebGL
  const VERTEX = `
    attribute vec2 aPos; attribute vec2 aUv;
    uniform vec4 uView;
    varying vec2 vUv; varying vec2 vPlate;
    void main() { vUv = aUv; vPlate = aPos; gl_Position = vec4(aPos * uView.xy + uView.zw, 0., 1.); }`;
  const PRECISION = `
    #ifdef GL_FRAGMENT_PRECISION_HIGH
    precision highp float;
    #else
    precision mediump float;
    #endif`;
  // The landscape moves only where it is already engraved.
  const LANDSCAPE_FRAGMENT = `${PRECISION}
    uniform sampler2D uSketch, uInk, uMask, uMotion;
    uniform float uTime; uniform vec2 uPlate;
    varying vec2 vUv; varying vec2 vPlate;
    void main() {
      vec3 m = texture2D(uMotion, vUv).rgb;
      float cut = texture2D(uMask, vUv).a;
      float t = uTime, x = vPlate.x, y = vPlate.y;
      vec2 d = m.r * vec2(3.6 * sin(t * 1.3 + y * .018) + 1.4 * sin(t * 2.3 + y * .05), sin(t * 1.7 + y * .03));
      d.x += m.g * 1.5 * sin(y * .9 + t * 1.8);
      float tree = step(1490., x);
      d += m.b * tree * vec2(2.2 * sin(t * 1.1 + y * .04), sin(t * 1.5 + x * .05));
      d.x += m.b * (1. - tree) * 10. * sin(t * .11 + y * .013);
      vec2 uv = vUv - d * cut / uPlate;
      gl_FragColor = vec4(mix(texture2D(uSketch, uv).rgb, texture2D(uInk, uv).rgb, cut), 1.);
    }`;
  // Creatures, and their reflections: broken strokes that ripple over open water.
  const CREATURE_FRAGMENT = `${PRECISION}
    uniform sampler2D uSketch, uInk, uMask, uMotion;
    uniform float uTime, uReflect, uAlpha; uniform vec2 uPlate;
    varying vec2 vUv; varying vec2 vPlate;
    void main() {
      vec2 uv = vUv;
      float fade = uAlpha;
      if (uReflect > .5) {
        uv.x += sin(vPlate.y * .8 + uTime * 2.) * .005;
        fade *= texture2D(uMotion, vPlate / uPlate).g * step(.4, fract(vPlate.y / 3.)) * .42;
      }
      float cut = texture2D(uMask, uv).a;
      gl_FragColor = mix(texture2D(uSketch, uv), texture2D(uInk, uv), cut) * fade;
    }`;

  function compile(type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader));
    return shader;
  }

  function program(fragment) {
    const handle = gl.createProgram();
    gl.attachShader(handle, compile(gl.VERTEX_SHADER, VERTEX));
    gl.attachShader(handle, compile(gl.FRAGMENT_SHADER, fragment));
    gl.bindAttribLocation(handle, 0, 'aPos');
    gl.bindAttribLocation(handle, 1, 'aUv');
    gl.linkProgram(handle);
    if (!gl.getProgramParameter(handle, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(handle));
    const uniforms = {};
    for (let i = 0; i < gl.getProgramParameter(handle, gl.ACTIVE_UNIFORMS); i++) {
      const name = gl.getActiveUniform(handle, i).name;
      uniforms[name] = gl.getUniformLocation(handle, name);
    }
    return { handle, uniforms };
  }

  function upload(handle, source, premultiply = true) {
    gl.bindTexture(gl.TEXTURE_2D, handle);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, premultiply);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
  }

  function texture(source, premultiply = true) {
    const handle = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, handle);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    upload(handle, source, premultiply);
    return handle;
  }

  function buffer(data, target = gl.ARRAY_BUFFER, usage = gl.STATIC_DRAW) {
    const handle = gl.createBuffer();
    gl.bindBuffer(target, handle);
    gl.bufferData(target, data, usage);
    return handle;
  }

  function load(src) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = reject;
      image.src = src;
    });
  }

  function engravingMask(width, height) {
    const mask = document.createElement('canvas');
    mask.width = Math.ceil(width * MASK_SCALE);
    mask.height = Math.ceil(height * MASK_SCALE);
    const context = mask.getContext('2d');
    context.setTransform(MASK_SCALE, 0, 0, MASK_SCALE, 0, 0);
    context.strokeStyle = context.fillStyle = '#000';
    context.lineCap = 'round';
    return { canvas: mask, context, texture: texture(mask), dirty: false };
  }

  // Coarse cells that carry ink; progress and the automatic tours use them.
  function inkCells(image, width, height, size, test) {
    const columns = Math.ceil(width / size), rows = Math.ceil(height / size);
    let data = null;
    try {
      const probe = document.createElement('canvas');
      probe.width = columns;
      probe.height = rows;
      const probeContext = probe.getContext('2d', { willReadFrequently: true });
      probeContext.imageSmoothingQuality = 'high';
      probeContext.drawImage(image, 0, 0, columns, rows);
      data = probeContext.getImageData(0, 0, columns, rows).data;
    } catch {
      // A tainted canvas (file://) cannot be read; count every cell instead.
    }
    const cells = [];
    for (let row = 0; row < rows; row++) {
      for (let column = 0; column < columns; column++) {
        const i = (row * columns + column) * 4;
        const x = (column + .5) * size, y = (row + .5) * size;
        if (!data || test(data, i)) cells.push({ x, y, ink: 0, visible: true });
      }
    }
    return cells;
  }

  // ------------------------------------------------------------------ state
  let landscapeProgram, creatureProgram, quad, quadUv;
  let landscape = null;
  const creatures = [];
  let place = { x: 0, y: 0, w: 0, h: 0, scale: 1 };
  let view = [0, 0, 0, 0];
  let ready = false, done = false;
  let frame = 0, lastTime = 0, idleTimer = 0, clock = 0;
  let tour = null;
  let last = null;
  let carvedOnce = false;
  const dot = document.createElement('canvas');
  dot.width = dot.height = 64;
  const dotContext = dot.getContext('2d');
  const glow = dotContext.createRadialGradient(32, 32, 0, 32, 32, 32);
  glow.addColorStop(0, '#000');
  glow.addColorStop(.55, '#000b');
  glow.addColorStop(1, '#0000');
  dotContext.fillStyle = glow;
  dotContext.fillRect(0, 0, 64, 64);

  const smooth = (a, b, v) => { const t = Math.max(0, Math.min(1, (v - a) / (b - a))); return t * t * (3 - 2 * t); };
  const approach = (value, target, step) => value + Math.max(-step, Math.min(step, target - value));

  function active() {
    return document.body.dataset.section === 'inicio' && !document.hidden;
  }

  function offset(value, remaining) {
    if (value === 'center') return remaining / 2;
    if (value === 'bottom' || value === 'right') return remaining;
    if (value === 'top' || value === 'left') return 0;
    return value.endsWith('%') ? remaining * parseFloat(value) / 100 : parseFloat(value) || 0;
  }

  // Mirror the CSS background placement so the plate lands on the underdrawing.
  function measure() {
    const width = hero.clientWidth, height = hero.clientHeight;
    const style = getComputedStyle(art);
    const size = style.backgroundSize.split(' ');
    const scale = size[0] === 'cover'
      ? Math.max(width / PLATE_W, height / PLATE_H)
      : size[0] === 'contain' ? Math.min(width / PLATE_W, height / PLATE_H)
      : size[1] && size[1] !== 'auto' ? parseFloat(size[1]) / PLATE_H : parseFloat(size[0]) / PLATE_W;
    const w = PLATE_W * scale, h = PLATE_H * scale;
    const position = style.backgroundPosition.split(' ');
    place = { x: offset(position[0], width - w), y: offset(position[1] || '50%', height - h), w, h, scale };
    view = [2 * scale / width, -2 * scale / height, 2 * place.x / width - 1, 1 - 2 * place.y / height];
    const ratio = Math.min(2, devicePixelRatio || 1, Math.max(1, 1 / scale));
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    // Only what the visitor can see has to be engraved; the seal covers the rest.
    const visible = (x, y) => {
      const sx = place.x + x * scale, sy = place.y + y * scale;
      return sx > 0 && sx < width && sy > 0 && sy < height;
    };
    for (const cell of landscape.cells) cell.visible = visible(cell.x, cell.y);
    for (const creature of creatures) creature.visible = visible(creature.home[0], creature.home[1]);
    request();
  }

  // ------------------------------------------------------------------ creatures
  function createCreature(def, inkImage, sketchImage) {
    const [x0, y0, x1, y1] = def.box;
    const w = x1 - x0, h = y1 - y0;
    const columns = Math.ceil(w / def.grid[0]), rows = Math.ceil(h / def.grid[1]);
    const count = (columns + 1) * (rows + 1);
    const local = new Float32Array(count * 2), uv = new Float32Array(count * 2);
    for (let row = 0, i = 0; row <= rows; row++) {
      for (let column = 0; column <= columns; column++, i += 2) {
        local[i] = column / columns * w;
        local[i + 1] = row / rows * h;
        uv[i] = column / columns;
        uv[i + 1] = row / rows;
      }
    }
    const indices = new Uint16Array(columns * rows * 6);
    for (let row = 0, i = 0; row < rows; row++) {
      for (let column = 0; column < columns; column++, i += 6) {
        const a = row * (columns + 1) + column, b = a + 1, c = a + columns + 1, d = c + 1;
        indices.set([a, b, c, b, d, c], i);
      }
    }
    const home = [x0 + def.pivot[0], y0 + def.pivot[1]];
    return {
      def, w, h, local, home, visible: true,
      mask: engravingMask(w, h),
      positions: new Float32Array(count * 2),
      mirrored: new Float32Array(count * 2),
      positionBuffer: buffer(new Float32Array(count * 2), gl.ARRAY_BUFFER, gl.DYNAMIC_DRAW),
      mirrorBuffer: buffer(new Float32Array(count * 2), gl.ARRAY_BUFFER, gl.DYNAMIC_DRAW),
      uvBuffer: buffer(uv),
      indexBuffer: buffer(indices, gl.ELEMENT_ARRAY_BUFFER),
      indexCount: indices.length,
      ink: texture(inkImage),
      sketch: texture(sketchImage),
      cells: inkCells(inkImage, w, h, 14, (data, i) => data[i + 3] > 90).map(cell => ({ lx: cell.x, ly: cell.y, ink: 0 })),
      x: home[0], y: home[1], flip: 1, scale: 1, rot: 0,
      awake: false, wake: 0,
      pose: { mode: 'rest', phase: 0, walk: 0, head: 0, headTarget: 0, timer: 1.2, dir: def.faces, turn: 0, s: 0, speed: 0, since: 0, flap: 0, facing: 1 }
    };
  }

  // Local drawing coordinates to the plate, through the creature's travel.
  function toPlate(creature, lx, ly, out, i) {
    const [px, py] = creature.def.pivot;
    const vx = (lx - px) * creature.flip * creature.scale, vy = (ly - py) * creature.scale;
    const c = Math.cos(creature.rot), s = Math.sin(creature.rot);
    out[i] = creature.x + vx * c - vy * s;
    out[i + 1] = creature.y + vx * s + vy * c;
  }

  function toLocal(creature, x, y) {
    if (Math.abs(creature.flip) < .3) return null;
    const [px, py] = creature.def.pivot;
    const dx = x - creature.x, dy = y - creature.y;
    const c = Math.cos(-creature.rot), s = Math.sin(-creature.rot);
    return [(dx * c - dy * s) / (creature.flip * creature.scale) + px, (dx * s + dy * c) / creature.scale + py];
  }

  // Positive angles swing a hanging limb toward +x, and lift a limb pointing +x.
  function turnVector(vx, vy, angle) {
    const c = Math.cos(angle), s = Math.sin(angle);
    return [vx * c + vy * s, -vx * s + vy * c];
  }

  // Walkers: legs swing about the hip in a lateral gait, planted while the body
  // passes over them; the head nods, or dips to graze and drink.
  function deformWalker(creature, lx, ly) {
    const { def, pose } = creature;
    let x = lx, y = ly;
    if (ly > def.hip - 4 && pose.walk > 0) {
      let best = null, weight = 0;
      for (const leg of def.legs) {
        const hipY = leg[3] || def.hip;
        const along = Math.max(0, Math.min(1, (ly - hipY) / (creature.h - hipY)));
        const centre = leg[0] + (leg[1] - leg[0]) * along;
        const w = 1 - Math.abs(lx - centre) / (def.name === 'turtle' ? 11 : 9);
        if (w > weight) { weight = w; best = leg; }
      }
      if (best) {
        const hipY = best[3] || def.hip;
        const phase = pose.phase + best[2] * Math.PI * 2;
        // The tail only sways; legs carry the gait.
        const angle = def.faces * def.swing * pose.walk * Math.sin(phase) * (best[3] ? .5 : 1);
        const [vx, vy] = turnVector(lx - best[0], ly - hipY, angle);
        const lift = def.lift * pose.walk * Math.max(0, Math.cos(phase)) * Math.max(0, (ly - hipY) / (creature.h - hipY));
        const w = Math.min(1, weight * 1.6);
        x += (best[0] + vx - lx) * w;
        y += (hipY + vy - lift - ly) * w;
      }
    }
    if (ly < def.hip + 6) y += Math.sin(pose.phase * 2) * pose.walk * (def.name === 'turtle' ? .8 : 1.3);
    const [nx, ny] = def.neck;
    const reach = def.name === 'turtle' ? smooth(def.head, def.head - 18, lx) : smooth(-8, 40, (lx - nx) + (ny - ly) * .6);
    if (reach > 0 && pose.head) {
      const [vx, vy] = turnVector(x - nx, y - ny, pose.head * reach);
      x = nx + vx;
      y = ny + vy;
    }
    return [x, y];
  }

  // The bird: the membrane beats toward its body line; tendrils trail in waves.
  function deformBird(creature, lx, ly) {
    const { pose } = creature;
    const axis = 108 + (392 - lx) * .25;
    let x = lx, y = ly;
    if (ly < axis) {
      const beat = pose.flap * (.5 - .5 * Math.cos(pose.phase));
      y += (axis - ly) * .48 * beat * smooth(0, 40, axis - ly);
      x -= (axis - ly) * .08 * beat;
    }
    const trailing = smooth(0, 26, ly - axis) * smooth(345, 270, lx);
    if (trailing > 0) {
      const d = Math.hypot(lx - 330, ly - 128);
      const wave = pose.s * 7 + pose.since * 3.2 - d * .03;
      y += trailing * 10 * (d / 300) * Math.sin(wave) * Math.max(.35, pose.flap);
      x += trailing * 3.5 * (d / 300) * Math.cos(wave);
    }
    return [x, y];
  }

  function stepWalker(creature, dt) {
    const { def, pose } = creature;
    const home = creature.home[0];
    pose.timer -= dt;
    if (pose.mode === 'rest') {
      pose.headTarget = 0;
      if (pose.timer < 0) { pose.mode = 'walk'; pose.timer = 3 + Math.random() * 4; }
    } else if (pose.mode === 'walk') {
      pose.walk = approach(pose.walk, 1, dt * 1.2);
      pose.headTarget = def.name === 'turtle' ? 0 : .07 + .03 * Math.sin(pose.phase * 2);
      const edge = home + (pose.dir > 0 ? def.range[1] : def.range[0]);
      if ((creature.x - edge) * pose.dir >= 0) { pose.mode = 'turn'; pose.turn = 0; }
      else if (pose.timer < 0) { pose.mode = 'pause'; pose.timer = 2.5 + Math.random() * 3; }
    } else if (pose.mode === 'pause') {
      pose.walk = approach(pose.walk, 0, dt * 1.5);
      // Graze (strider) or drink (turtle), with a small chewing bob.
      pose.headTarget = def.name === 'turtle' ? .3 + .03 * Math.sin(clock * 5) : -.17 + .025 * Math.sin(clock * 7);
      if (pose.timer < 0) {
        pose.mode = Math.random() < .3 ? 'turn' : 'walk';
        pose.turn = 0;
        pose.timer = 3 + Math.random() * 4;
      }
    } else if (pose.mode === 'turn') {
      pose.walk = approach(pose.walk, 0, dt * 2);
      pose.headTarget = 0;
      pose.turn += dt / 1.1;
      // A paper cut-out turns by folding flat and opening the other way.
      creature.flip = Math.cos(Math.PI * Math.min(1, pose.turn)) * pose.dir * def.faces;
      if (pose.turn >= 1) {
        pose.dir = -pose.dir;
        creature.flip = pose.dir * def.faces;
        pose.mode = 'walk';
        pose.timer = 3 + Math.random() * 4;
      }
    }
    if (pose.walk > 0) {
      // Travel speed and gait are tied, so planted feet do not slide.
      pose.phase += dt * Math.PI * 2 / def.stride * pose.walk;
      creature.x += def.speed * pose.walk * pose.dir * dt;
    }
    pose.head = approach(pose.head, pose.headTarget, dt * .5);
  }

  function stepBird(creature, dt) {
    const { pose } = creature;
    pose.since += dt;
    pose.flap = approach(pose.flap, pose.since < 1.2 ? 1 : .55 + .45 * Math.max(0, Math.sin(clock * .4)), dt);
    pose.phase += dt * Math.PI * 2 / (pose.since < 1.2 ? .55 : .85);
    pose.speed = approach(pose.speed, pose.since > 1.2 ? .15 : 0, dt * .06);
    pose.s += pose.speed * dt;
    // A lazy loop: a short reach that stays clear of the knight's helmet, a long
    // one back over the marsh, higher and smaller (farther away) at both ends.
    const k = Math.sin(pose.s);
    const height = (1 - Math.cos(2 * pose.s)) / 2;
    creature.x = creature.home[0] + k * (k > 0 ? 30 : 250);
    creature.y = creature.home[1] - (k > 0 ? 175 : 150) * height + 8 * Math.sin(pose.s * 3) - Math.min(1, pose.since / 1.2) * 6;
    creature.scale = 1 - .3 * height;
    const heading = Math.cos(pose.s) >= 0 ? 1 : -1;
    if (heading !== pose.facing && pose.turn === 0) pose.turn = .0001;
    if (pose.turn > 0) {
      pose.turn += dt / .9;
      creature.flip = Math.cos(Math.PI * Math.min(1, pose.turn)) * pose.facing;
      if (pose.turn >= 1) { pose.facing = heading; creature.flip = heading; pose.turn = 0; }
    }
    creature.rot = .1 * Math.sin(2 * pose.s) * pose.facing;
  }

  function stepCreature(creature, dt) {
    if (!creature.awake) return;
    if (creature.wake < 1) {
      // The rest of the creature inks itself in as it stirs.
      creature.wake = Math.min(1, creature.wake + dt / .8);
      creature.mask.context.globalAlpha = .16;
      creature.mask.context.fillRect(0, 0, creature.w, creature.h);
      creature.mask.dirty = true;
      if (creature.def.name !== 'bird') return;
    }
    if (creature.def.name === 'bird') stepBird(creature, dt);
    else stepWalker(creature, dt);
  }

  function wake(creature) {
    if (creature.awake) return;
    creature.awake = true;
    for (const cell of creature.cells) cell.ink = 1;
  }

  function pose(creature) {
    const deform = creature.def.name === 'bird' ? deformBird : deformWalker;
    const waterline = creature.y + 3;
    for (let i = 0; i < creature.local.length; i += 2) {
      const lx = creature.local[i], ly = creature.local[i + 1];
      const [x, y] = creature.awake ? deform(creature, lx, ly) : [lx, ly];
      toPlate(creature, x, y, creature.positions, i);
      creature.mirrored[i] = creature.positions[i];
      creature.mirrored[i + 1] = 2 * waterline - creature.positions[i + 1];
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, creature.positionBuffer);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, creature.positions);
    if (creature.def.reflect) {
      gl.bindBuffer(gl.ARRAY_BUFFER, creature.mirrorBuffer);
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, creature.mirrored);
    }
  }

  // ------------------------------------------------------------------ drawing
  function bindTextures(sketch, ink, mask) {
    [sketch, ink, mask, landscape.motion].forEach((handle, unit) => {
      gl.activeTexture(gl.TEXTURE0 + unit);
      gl.bindTexture(gl.TEXTURE_2D, handle);
    });
  }

  function useProgram({ handle, uniforms }) {
    gl.useProgram(handle);
    gl.uniform4fv(uniforms.uView, view);
    gl.uniform1f(uniforms.uTime, clock);
    gl.uniform2f(uniforms.uPlate, PLATE_W, PLATE_H);
    gl.uniform1i(uniforms.uSketch, 0);
    gl.uniform1i(uniforms.uInk, 1);
    gl.uniform1i(uniforms.uMask, 2);
    gl.uniform1i(uniforms.uMotion, 3);
  }

  function attributes(positions, uvs) {
    gl.bindBuffer(gl.ARRAY_BUFFER, positions);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, uvs);
    gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 0, 0);
  }

  function flush(mask) {
    if (!mask.dirty) return;
    upload(mask.texture, mask.canvas);
    mask.dirty = false;
  }

  function drawCreature(creature, reflect, alpha) {
    gl.uniform1f(creatureProgram.uniforms.uReflect, reflect ? 1 : 0);
    gl.uniform1f(creatureProgram.uniforms.uAlpha, alpha);
    bindTextures(creature.sketch, creature.ink, creature.mask.texture);
    attributes(reflect ? creature.mirrorBuffer : creature.positionBuffer, creature.uvBuffer);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, creature.indexBuffer);
    gl.drawElements(gl.TRIANGLES, creature.indexCount, gl.UNSIGNED_SHORT, 0);
  }

  function render() {
    flush(landscape.mask);
    for (const creature of creatures) { flush(creature.mask); pose(creature); }
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.enableVertexAttribArray(0);
    gl.enableVertexAttribArray(1);

    gl.disable(gl.BLEND);
    useProgram(landscapeProgram);
    bindTextures(landscape.sketch, landscape.ink, landscape.mask.texture);
    attributes(quad, quadUv);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    useProgram(creatureProgram);
    // Their own reflections join the plate's still ones only once they move.
    for (const creature of creatures) if (creature.def.reflect && creature.wake > 0) drawCreature(creature, true, creature.wake);
    for (const creature of creatures) drawCreature(creature, false, 1);
  }

  // ------------------------------------------------------------------ engraving
  // One touch of the burin: a few hatch cuts plus a soft core that closes the gaps.
  function cut(context, x, y, radius, strength) {
    const cuts = 4 + Math.round(radius / 12);
    for (let i = 0; i < cuts; i++) {
      const angle = Math.random() * Math.PI * 2;
      const distance = Math.sqrt(Math.random()) * radius;
      const cx = x + Math.cos(angle) * distance, cy = y + Math.sin(angle) * distance;
      const direction = (Math.random() < .72 ? HATCH : CROSS) + (Math.random() - .5) * .3;
      const length = radius * (.45 + Math.random() * .75);
      const dx = Math.cos(direction) * length / 2, dy = Math.sin(direction) * length / 2;
      context.globalAlpha = strength * (.3 + Math.random() * .45) * (1 - distance / radius * .55);
      context.lineWidth = 2 + Math.random() * 3.5;
      context.beginPath();
      context.moveTo(cx - dx, cy - dy);
      context.lineTo(cx + dx, cy + dy);
      context.stroke();
    }
    context.globalAlpha = strength * .2;
    context.drawImage(dot, x - radius * .85, y - radius * .85, radius * 1.7, radius * 1.7);
  }

  function credit(cells, x, y, radius, strength, keyX, keyY) {
    const reach = radius * radius;
    for (const cell of cells) {
      const dx = cell[keyX] - x, dy = cell[keyY] - y, d = dx * dx + dy * dy;
      if (d < reach) cell.ink = Math.min(1, cell.ink + strength * .17 * (1 - d / reach));
    }
  }

  function coverageOf(cells) {
    let sum = 0;
    for (const cell of cells) sum += cell.ink;
    return cells.length ? sum / cells.length : 1;
  }

  function carve(x, y, radius, strength) {
    cut(landscape.mask.context, x, y, radius, strength);
    credit(landscape.cells, x, y, radius, strength, 'x', 'y');
    landscape.mask.dirty = true;
    for (const creature of creatures) {
      if (creature.awake) continue;
      const point = toLocal(creature, x, y);
      const r = radius / creature.scale;
      if (!point || point[0] < -r || point[1] < -r || point[0] > creature.w + r || point[1] > creature.h + r) continue;
      cut(creature.mask.context, point[0], point[1], r, strength);
      credit(creature.cells, point[0], point[1], r, strength, 'lx', 'ly');
      creature.mask.dirty = true;
      if (coverageOf(creature.cells) >= WAKE_AT) wake(creature);
    }
  }

  function carveLine(from, to, radius, strength) {
    const distance = Math.hypot(to.x - from.x, to.y - from.y);
    const step = radius * .35;
    const steps = Math.max(1, Math.ceil(distance / step));
    for (let i = 1; i <= steps; i++) {
      carve(from.x + (to.x - from.x) * i / steps, from.y + (to.y - from.y) * i / steps, radius, strength);
    }
  }

  function coverage() {
    let sum = 0, count = 0;
    for (const cell of landscape.cells) if (cell.visible) { sum += cell.ink; count++; }
    for (const creature of creatures) {
      if (!creature.visible) continue;
      for (const cell of creature.cells) { sum += cell.ink; count++; }
    }
    return count ? sum / count : 1;
  }

  // Where the automatic engraver still has work, in plate coordinates.
  function unfinished(limit = .85) {
    const targets = landscape.cells.filter(cell => cell.visible && cell.ink < limit);
    const point = new Float32Array(2);
    for (const creature of creatures) {
      if (creature.awake || !creature.visible) continue;
      for (const cell of creature.cells) {
        if (cell.ink >= limit) continue;
        toPlate(creature, cell.lx, cell.ly, point, 0);
        targets.push({ x: point[0], y: point[1] });
      }
    }
    return targets;
  }

  function toScreen(point) {
    return { x: place.x + point.x * place.scale, y: place.y + point.y * place.scale };
  }

  function moveBurin(screen) {
    // The graver's point sits at (5.4, 40.6) of the 46px drawing.
    burin.style.transform = `translate(${screen.x - 5.4}px,${screen.y - 40.6}px)`;
  }

  function showBurin(visible) {
    burin.classList.toggle('is-visible', visible);
  }

  // A tour visits unfinished cells nearest-first, like a hand working the plate.
  function route(targets, start) {
    const pending = targets.slice();
    const path = [];
    let here = start;
    while (pending.length) {
      let best = 0, bestDistance = Infinity;
      for (let i = 0; i < pending.length; i++) {
        const d = (pending[i].x - here.x) ** 2 + (pending[i].y - here.y) ** 2;
        if (d < bestDistance) { bestDistance = d; best = i; }
      }
      here = pending.splice(best, 1)[0];
      path.push({ x: here.x + (Math.random() - .5) * CELL, y: here.y + (Math.random() - .5) * CELL });
    }
    return path;
  }

  function startTour(kind, targets, { duration, radius, strength, then }) {
    if (!targets.length) { then && then(); return; }
    const start = last || { x: targets[0].x, y: targets[0].y };
    const path = route(targets, start);
    let length = 0, previous = start;
    for (const point of path) { length += Math.hypot(point.x - previous.x, point.y - previous.y); previous = point; }
    tour = { kind, path, index: 0, at: { ...start }, speed: Math.max(length / duration, 400), radius, strength, then };
    showBurin(true);
    request();
  }

  function stepTour(elapsed) {
    let budget = tour.speed * elapsed;
    while (budget > 0 && tour.index < tour.path.length) {
      const target = tour.path[tour.index];
      const distance = Math.hypot(target.x - tour.at.x, target.y - tour.at.y);
      const move = Math.min(distance, budget);
      const next = distance ? {
        x: tour.at.x + (target.x - tour.at.x) * move / distance,
        y: tour.at.y + (target.y - tour.at.y) * move / distance
      } : target;
      carveLine(tour.at, next, tour.radius, tour.strength);
      tour.at = next;
      budget -= move;
      if (move === distance) tour.index++;
    }
    last = tour.at;
    moveBurin(toScreen(tour.at));
    if (tour.index >= tour.path.length) {
      const then = tour.then;
      tour = null;
      showBurin(false);
      then && then();
    }
  }

  // Waiting visitors, keyboards and touch screens still get the finished plate.
  function scheduleIdle(delay) {
    clearTimeout(idleTimer);
    if (done || !ready) return;
    idleTimer = setTimeout(() => {
      if (!active() || tour) { scheduleIdle(1500); return; }
      startTour('idle', unfinished(), { duration: carvedOnce ? 4 : 5.5, radius: 58, strength: .9, then: finish });
    }, delay);
  }

  function finish() {
    if (done) return;
    clearTimeout(idleTimer);
    const rest = unfinished(.95);
    if (rest.length) startTour('finish', rest, { duration: 1.1, radius: 70, strength: 1, then: seal });
    else seal();
  }

  // Close every remaining pinhole; whatever still sleeps wakes up.
  function seal() {
    done = true;
    hero.classList.remove('is-carving');
    for (const creature of creatures) wake(creature);
    let pass = 0;
    (function fill() {
      landscape.mask.context.globalAlpha = .16;
      landscape.mask.context.fillRect(0, 0, PLATE_W, PLATE_H);
      landscape.mask.dirty = true;
      if (++pass < 14) requestAnimationFrame(fill);
      else document.dispatchEvent(new CustomEvent('portfolio:plate-engraved'));
    })();
  }

  function checkProgress() {
    if (!done && !tour && coverage() >= FINISH_AT) finish();
  }

  // ------------------------------------------------------------------ loop
  // The plate keeps living while the hero is on screen; it rests otherwise.
  function loop(now) {
    frame = 0;
    if (!ready || !active()) { lastTime = 0; return; }
    const elapsed = Math.min(.05, lastTime ? (now - lastTime) / 1000 : 0);
    lastTime = now;
    clock = (clock + elapsed) % 3600;
    if (tour) stepTour(elapsed);
    for (const creature of creatures) stepCreature(creature, elapsed);
    render();
    request();
  }

  function request() {
    if (!frame && ready && active()) frame = requestAnimationFrame(loop);
  }

  function platePoint(event) {
    const rect = hero.getBoundingClientRect();
    const x = event.clientX - rect.left, y = event.clientY - rect.top;
    return { screen: { x, y }, plate: { x: (x - place.x) / place.scale, y: (y - place.y) / place.scale } };
  }

  hero.addEventListener('pointermove', event => {
    // The entrance and the final pass keep the burin; an idle tour hands it over.
    if (!ready || done || !active() || (tour && tour.kind !== 'idle')) return;
    const overControl = event.target.closest('a,button');
    const mouse = event.pointerType === 'mouse';
    hero.classList.toggle('is-carving', mouse);
    if (overControl || (!mouse && !event.pressure)) { showBurin(false); last = null; return; }
    tour = null;
    const { screen, plate: point } = platePoint(event);
    moveBurin(screen);
    showBurin(true);
    if (last) carveLine(last, point, 34 / place.scale * 1.6, 1);
    last = point;
    carvedOnce = true;
    checkProgress();
    scheduleIdle(4500);
  }, { passive: true });
  hero.addEventListener('pointerleave', () => {
    if (!tour) showBurin(false);
    hero.classList.remove('is-carving');
    last = null;
  });

  function settleStatic() {
    clearTimeout(idleTimer);
    cancelAnimationFrame(frame);
    frame = 0;
    tour = null;
    ready = false;
    done = true;
    showBurin(false);
    hero.classList.remove('ink-live', 'is-carving');
    hero.classList.add('ink-static');
  }

  reduced.addEventListener('change', () => { if (reduced.matches) settleStatic(); });
  canvas.addEventListener('webglcontextlost', settleStatic);
  document.addEventListener('visibilitychange', request);
  document.addEventListener('portfolio:sectionchange', () => {
    if (active()) { request(); if (!done) scheduleIdle(2500); } else { showBurin(false); clearTimeout(idleTimer); }
  });
  new ResizeObserver(() => { if (ready) measure(); }).observe(hero);

  Promise.all([
    load(LANDSCAPE.ink), load(LANDSCAPE.sketch), load(LANDSCAPE.motion),
    ...CREATURES.flatMap(def => [load(def.ink), load(def.sketch)])
  ]).then(([ink, sketch, motion, ...sprites]) => {
    landscapeProgram = program(LANDSCAPE_FRAGMENT);
    creatureProgram = program(CREATURE_FRAGMENT);
    quad = buffer(new Float32Array([0, 0, PLATE_W, 0, 0, PLATE_H, PLATE_W, PLATE_H]));
    quadUv = buffer(new Float32Array([0, 0, 1, 0, 0, 1, 1, 1]));
    landscape = {
      ink: texture(ink), sketch: texture(sketch), motion: texture(motion, false), mask: engravingMask(PLATE_W, PLATE_H),
      cells: inkCells(ink, PLATE_W, PLATE_H, CELL, (data, i) =>
        (data[i] * .299 + data[i + 1] * .587 + data[i + 2] * .114) / 255 < .83)
    };
    CREATURES.forEach((def, i) => creatures.push(createCreature(def, sprites[i * 2], sprites[i * 2 + 1])));
    ready = true;
    measure();
    const opening = landscape.cells.filter(cell => cell.visible && OPENING.some(([left, top, right, bottom]) =>
      cell.x >= left && cell.x <= right && cell.y >= top && cell.y <= bottom));
    const begin = () => startTour('opening', opening, {
      duration: 1.5, radius: 64, strength: 1,
      then: () => scheduleIdle(matchMedia('(hover: hover) and (pointer: fine)').matches ? 4000 : 700)
    });
    if (active()) begin();
    else document.addEventListener('portfolio:sectionchange', function once() {
      if (!active()) return;
      document.removeEventListener('portfolio:sectionchange', once);
      begin();
    });
  }).catch(error => {
    // WebGL refuses images from file:// pages; the README's local server fixes it.
    console.warn(location.protocol === 'file:'
      ? 'Hero engraving needs a local server (see README: python3 -m http.server 4173); showing the still plate.'
      : 'Hero engraving fell back to the still plate:', error);
    settleStatic();
  });
})();
