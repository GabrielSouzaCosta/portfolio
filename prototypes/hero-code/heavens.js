// The portal, drawn in code: an engraved lapis sky, a gilt armillary sphere turning in 3D,
// the whale as a living constellation, a crescent moon, and a night city on the horizon,
// all inside a carved arch. Nothing here is a bitmap, so it stays sharp at any size.
(() => {
  const stage = document.getElementById('stage');
  const canvas = stage.querySelector('canvas.heavens');
  const ctx = canvas.getContext('2d');
  const frame = stage.querySelector('svg.frame');
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const params = new URLSearchParams(location.search);
  const frozenAt = params.has('at') ? Number(params.get('at')) : null;

  const PAGE = [1440, 900];
  const WIN = { x: 730, y: 60 };          // the arch window on the page
  const W = 580, H = 780, ARCH_R = 290;    // window size; the arch is a half circle on top
  const GROUND = H - 86;

  const TAU = Math.PI * 2, D2R = Math.PI / 180;
  const clamp01 = x => Math.min(1, Math.max(0, x));
  const smooth = (a, b, x) => { const t = clamp01((x - a) / (b - a)); return t * t * (3 - 2 * t); };
  const random = seed => () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const mix = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));

  // The near ground, with a small rise on the right where the knight stands.
  const KNIGHT = { x: 478, h: 70 };
  const groundAt = x => GROUND + 15 + 6 * Math.sin(x * .011 + .6) + 3 * Math.sin(x * .05) - 30 * Math.exp(-(((x - KNIGHT.x) / 62) ** 2));

  function archPath(c, inset = 0) {
    c.beginPath();
    c.moveTo(inset, H);
    c.lineTo(inset, ARCH_R);
    c.arc(W / 2, ARCH_R, ARCH_R - inset, Math.PI, 0);
    c.lineTo(W - inset, H);
    c.closePath();
  }

  // ---------------------------------------------------------------- the carved frame (SVG)
  function buildFrame() {
    const cx = WIN.x + W / 2, cy = WIN.y + ARCH_R, bottom = WIN.y + H;
    const arch = r => `M${cx - r} ${bottom}V${cy}A${r} ${r} 0 0 1 ${cx + r} ${cy}V${bottom}`;
    const beads = [];
    const rb = ARCH_R + 12;
    for (let a = 180; a <= 360.01; a += 3.2) beads.push([cx + rb * Math.cos(a * D2R), cy + rb * Math.sin(a * D2R)]);
    for (let y = cy + 16; y < bottom - 6; y += 16) beads.push([cx - rb, y], [cx + rb, y]);
    const star = (x, y, s) => `M${x} ${y - s}L${x + s * .28} ${y - s * .28}L${x + s} ${y}L${x + s * .28} ${y + s * .28}L${x} ${y + s}L${x - s * .28} ${y + s * .28}L${x - s} ${y}L${x - s * .28} ${y - s * .28}Z`;
    const impost = x => `<rect x="${x}" y="${cy - 7}" width="34" height="11" fill="#ece4d2" stroke="#b08d4a" stroke-width="1"/><path d="M${x + 3} ${cy - 2.5}h28" stroke="#b08d4a" stroke-width=".5"/>`;
    frame.innerHTML = `
      <path d="${arch(ARCH_R + 18)}" fill="none" stroke="#b08d4a" stroke-width="1.4"/>
      <path d="${arch(ARCH_R + 6)}" fill="none" stroke="#b08d4a" stroke-width=".7"/>
      <path d="${arch(ARCH_R + 1)}" fill="none" stroke="#2a2016" stroke-width="2"/>
      ${beads.map(([x, y]) => `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="1.5" fill="#b08d4a"/>`).join('')}
      ${impost(cx - ARCH_R - 23)}${impost(cx + ARCH_R - 11)}
      <path d="M${cx - ARCH_R - 30} ${bottom + 1}H${cx + ARCH_R + 30}" stroke="#2a2016" stroke-width="2"/>
      <path d="M${cx - ARCH_R - 36} ${bottom + 7}H${cx + ARCH_R + 36}" stroke="#b08d4a" stroke-width="1.2"/>
      <path d="M${cx - ARCH_R - 24} ${bottom + 12}H${cx + ARCH_R + 24}" stroke="#b08d4a" stroke-width=".5"/>
      <path class="keystone" d="${star(cx, cy - ARCH_R - 18, 9)}" fill="#b08d4a"/>
      <circle cx="${cx}" cy="${cy - ARCH_R - 18}" r="2" fill="#ece4d2"/>`;
  }

  // ---------------------------------------------------------------- static layers
  let ds = 1;                                     // device px per window px
  const layer = () => document.createElement('canvas');
  const skyLayer = layer(), cityLayer = layer();
  const lights = [];

  function paintSky(c) {
    const g = c.createRadialGradient(W * .56, H * .36, 10, W * .5, H * .42, H * .78);
    g.addColorStop(0, '#2f4d93'); g.addColorStop(.42, '#1e3373'); g.addColorStop(1, '#0a1230');
    c.fillStyle = g; c.fillRect(0, 0, W, H);
    const dusk = c.createLinearGradient(0, H * .55, 0, GROUND + 20);
    dusk.addColorStop(0, 'rgba(126, 146, 196, 0)'); dusk.addColorStop(1, 'rgba(160, 168, 206, .42)');
    c.fillStyle = dusk; c.fillRect(0, H * .5, W, H * .5);
    // A faint band of the galaxy.
    c.save(); c.translate(W * .5, H * .34); c.rotate(-.55);
    const band = c.createLinearGradient(0, -70, 0, 70);
    band.addColorStop(0, 'rgba(180, 196, 245, 0)'); band.addColorStop(.5, 'rgba(180, 196, 245, .09)'); band.addColorStop(1, 'rgba(180, 196, 245, 0)');
    c.fillStyle = band; c.fillRect(-520, -70, 1040, 140); c.restore();
    // Burin lines: engraved skies are cut as horizontal strokes that swell, thin and break.
    const r = random(11);
    for (let y = 1.5; y < GROUND; y += 2.8) {
      const depth = .17 - .1 * (y / H);
      for (let x = -r() * 30; x < W;) {
        const len = 18 + r() * 70;
        c.strokeStyle = `rgba(3, 7, 24, ${depth * (.55 + r() * .9)})`;
        c.lineWidth = .3 + r() * .55;
        c.beginPath(); c.moveTo(x, y + (r() - .5) * .4); c.lineTo(x + len, y + (r() - .5) * .4); c.stroke();
        x += len + (r() < .18 ? 2 + r() * 7 : 0);
      }
    }
    for (let i = 0; i < 460; i++) {
      const x = r() * W, y = r() * GROUND, s = r();
      c.fillStyle = s > .72 ? `rgba(246, 226, 170, ${.35 + r() * .5})` : `rgba(214, 224, 255, ${.2 + r() * .45})`;
      c.beginPath(); c.arc(x, y, .3 + s * s * 1.05, 0, TAU); c.fill();
    }
  }

  function paintCity(c) {
    const r = random(29);
    lights.length = 0;
    const poly = (pts, fill) => { c.fillStyle = fill; c.beginPath(); pts.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); c.closePath(); c.fill(); };
    const tower = (x, base, w, h, top, fill, lit) => {
      poly([[x, base], [x, base - h], [x + w, base - h], [x + w, base]], fill);
      const t = base - h;
      if (top === 'spire') poly([[x - 2, t], [x + w / 2, t - w * 2.6], [x + w + 2, t]], fill);
      if (top === 'gable') poly([[x - 2, t], [x + w / 2, t - w * .45], [x + w + 2, t]], fill);
      if (top === 'crenel') for (let m = x; m < x + w - 2; m += 5) poly([[m, t], [m, t - 4], [m + 3, t - 4], [m + 3, t]], fill);
      if (top === 'cone') poly([[x - 3, t], [x + w / 2, t - w * 1.3], [x + w + 3, t]], fill);
      if (lit) for (let k = 0; k < lit; k++) if (r() < .7) {
        const lx = x + 3 + r() * (w - 7), ly = base - 8 - r() * (h - 14);
        // Only windows above the wall and the hill can be seen.
        if (ly + 3 < GROUND - 12 && ly + 3 < groundAt(lx) - 4) lights.push({ x: lx, y: ly, w: 1.6, h: 2.6, p: r() * TAU, f: .6 + r() * 1.6 });
      }
    };
    // Far hills and the far city, paler with distance.
    c.fillStyle = '#26365f';
    c.beginPath(); c.moveTo(0, GROUND);
    for (let x = 0; x <= W; x += 10) c.lineTo(x, GROUND - 14 - 10 * Math.sin(x * .013) - 6 * Math.sin(x * .041 + 1));
    c.lineTo(W, GROUND + 20); c.lineTo(0, GROUND + 20); c.fill();
    for (let x = 6; x < W;) {
      const w = 10 + r() * 16, tall = r() < .22;
      tower(x, GROUND - 10, w, tall ? 46 + r() * 40 : 14 + r() * 22, tall ? (r() < .5 ? 'spire' : 'crenel') : 'gable', '#2a3a66', 0);
      x += w + r() * 10;
    }
    // The near city: houses, towers and a cathedral under the sphere.
    const near = '#0f1632';
    for (let x = -8; x < W;) {
      if (x > 268 && x < 430) { x = 432; continue; }
      const w = 16 + r() * 18, kind = r();
      if (kind < .2) tower(x, GROUND + 6, 13 + r() * 6, 70 + r() * 50, r() < .5 ? 'cone' : 'crenel', near, 3);
      else tower(x, GROUND + 6, w, 24 + r() * 26, 'gable', near, 2);
      x += w + r() * 4;
    }
    const cx = 350;
    tower(cx - 50, GROUND + 6, 100, 66, 'gable', near, 0);
    tower(cx - 58, GROUND + 6, 22, 112, 'spire', near, 2);
    tower(cx + 36, GROUND + 6, 22, 112, 'spire', near, 2);
    lights.push({ x: cx - 9, y: GROUND - 50, w: 18, h: 18, rose: true, p: 1.3, f: .5 });
    // City wall with merlons, then the dark ground.
    poly([[0, GROUND + 44], [0, GROUND - 4], [W, GROUND - 4], [W, GROUND + 44]], '#0b1129');
    for (let m = 2; m < W; m += 11) poly([[m, GROUND - 4], [m, GROUND - 10], [m + 6, GROUND - 10], [m + 6, GROUND - 4]], '#0b1129');
    c.fillStyle = '#070b1d';
    c.beginPath(); c.moveTo(0, H);
    for (let x = 0; x <= W + 8; x += 4) c.lineTo(x, groundAt(x));
    c.lineTo(W, H); c.fill();
    c.save();
    c.globalCompositeOperation = 'source-atop';
    for (let y = GROUND - 200; y < H; y += 2.4) {
      c.strokeStyle = `rgba(92, 112, 170, ${.1 + r() * .1})`; c.lineWidth = .45 + r() * .3;
      c.beginPath(); c.moveTo(0, y); c.lineTo(W, y + (r() - .5)); c.stroke();
    }
    c.restore();
  }

  function paintLayers() {
    for (const [cv, paint] of [[skyLayer, paintSky], [cityLayer, paintCity]]) {
      cv.width = Math.round(W * ds); cv.height = Math.round(H * ds);
      const c = cv.getContext('2d');
      c.setTransform(ds, 0, 0, ds, 0, 0);
      paint(c);
    }
  }

  // ---------------------------------------------------------------- the armillary sphere
  const SPH = { x: 350, y: 336, r: 98 };
  const TILT = -23.5 * D2R, ELEV = 21 * D2R, FOCAL = 1500;
  const rotY = ([x, y, z], a) => { const c = Math.cos(a), s = Math.sin(a); return [c * x + s * z, y, -s * x + c * z]; };
  const rotZ = ([x, y, z], a) => { const c = Math.cos(a), s = Math.sin(a); return [c * x - s * y, s * x + c * y, z]; };
  const rotX = ([x, y, z], a) => { const c = Math.cos(a), s = Math.sin(a); return [x, c * y - s * z, s * y + c * z]; };
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const norm = v => { const l = Math.hypot(...v); return v.map(x => x / l); };
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const LIGHT = norm([-.5, .65, .6]);
  const GOLD_DARK = [118, 84, 30], GOLD_LIGHT = [248, 226, 156];

  const OBL = 23.44 * D2R;
  const RINGS = [
    { n: [0, 1, 0], c: 0, r: 1, bw: .1, spin: true, ticks: 10 },                         // equator
    { n: [0, 1, 0], c: Math.sin(OBL), r: Math.cos(OBL), bw: .045, spin: true },            // tropics
    { n: [0, 1, 0], c: -Math.sin(OBL), r: Math.cos(OBL), bw: .045, spin: true },
    { n: [0, 1, 0], c: Math.cos(OBL), r: Math.sin(OBL), bw: .04, spin: true },             // polar circles
    { n: [0, 1, 0], c: -Math.cos(OBL), r: Math.sin(OBL), bw: .04, spin: true },
    { n: [1, 0, 0], c: 0, r: 1, bw: .07, spin: true },                                     // colures
    { n: [0, 0, 1], c: 0, r: 1, bw: .07, spin: true },
    { n: rotZ([0, 1, 0], OBL), c: 0, r: 1, bw: .15, spin: true, ticks: 10, major: 30 },     // ecliptic, the zodiac band
    { n: [0, 0, 1], c: 0, r: 1.16, bw: .075, ticks: 5, major: 30 },                         // fixed meridian
    { n: [0, 1, 0], c: 0, r: 1.24, bw: .08, world: true, ticks: 10, major: 90 },            // horizon
  ].map(ring => {
    const a = Math.abs(ring.n[1]) < .9 ? [0, 1, 0] : [1, 0, 0];
    const u = norm(cross(a, ring.n)), v = cross(ring.n, u);
    return { ...ring, u, v };
  });

  function toView(p, ring, spin) {
    if (!ring.world) { if (ring.spin) p = rotY(p, spin); p = rotZ(p, TILT); }
    return rotX(p, ELEV);
  }
  function project([x, y, z]) {
    const s = FOCAL / (FOCAL - z * SPH.r);
    return [SPH.x + x * SPH.r * s, SPH.y - y * SPH.r * s, z];
  }

  function drawSphere(c, t, alpha) {
    const spin = t * .16;
    const items = [];
    const SEG = 72;
    for (const ring of RINGS) {
      const nv = norm(toView(ring.n, ring, spin));
      const lam = Math.abs(dot(nv, LIGHT));
      const at = (rad, th) => {
        const p = [0, 1, 2].map(i => ring.n[i] * ring.c + rad * (ring.u[i] * Math.cos(th) + ring.v[i] * Math.sin(th)));
        return project(toView(p, ring, spin));
      };
      for (let i = 0; i < SEG; i++) {
        const a0 = i / SEG * TAU, a1 = (i + 1) / SEG * TAU;
        const o0 = at(ring.r, a0), o1 = at(ring.r, a1), i0 = at(ring.r - ring.bw, a0), i1 = at(ring.r - ring.bw, a1);
        const z = (o0[2] + o1[2] + i0[2] + i1[2]) / 4;
        const ticks = [];
        if (ring.ticks) for (let d = 0; d < 360; d += ring.ticks) {
          const th = d * D2R;
          if (th >= a0 && th < a1) ticks.push({ o: at(ring.r, th), i: at(ring.r - ring.bw * (ring.major && d % ring.major === 0 ? 1 : .5), th) });
        }
        items.push({ z, draw: () => {
          const depth = .58 + .42 * clamp01((z + 1.3) / 2.6);
          const [r, g, b] = mix(GOLD_DARK, GOLD_LIGHT, .25 + .75 * lam).map(v => v * depth);
          c.fillStyle = `rgb(${r | 0}, ${g | 0}, ${b | 0})`;
          c.beginPath(); c.moveTo(o0[0], o0[1]); c.lineTo(o1[0], o1[1]); c.lineTo(i1[0], i1[1]); c.lineTo(i0[0], i0[1]); c.closePath(); c.fill();
          c.strokeStyle = `rgba(58, 38, 10, ${.75 * depth})`; c.lineWidth = .55;
          c.beginPath(); c.moveTo(o0[0], o0[1]); c.lineTo(o1[0], o1[1]); c.moveTo(i0[0], i0[1]); c.lineTo(i1[0], i1[1]); c.stroke();
          for (const k of ticks) { c.beginPath(); c.moveTo(k.o[0], k.o[1]); c.lineTo(k.i[0], k.i[1]); c.stroke(); }
        } });
      }
    }
    // The polar axis, a gilt rod with finials.
    const axisRing = { spin: false };
    const tip = s => project(toView([0, s * 1.36, 0], axisRing, 0));
    const centre = project(toView([0, 0, 0], axisRing, 0));
    for (const s of [1, -1]) {
      const p = tip(s);
      items.push({ z: p[2] / 2, draw: () => {
        c.strokeStyle = '#4a330e'; c.lineWidth = 3.4; c.beginPath(); c.moveTo(centre[0], centre[1]); c.lineTo(p[0], p[1]); c.stroke();
        c.strokeStyle = '#e2c47c'; c.lineWidth = 1.8; c.beginPath(); c.moveTo(centre[0], centre[1]); c.lineTo(p[0], p[1]); c.stroke();
        const k = c.createRadialGradient(p[0] - 1.2, p[1] - 1.2, .5, p[0], p[1], 4.5);
        k.addColorStop(0, '#fbeab6'); k.addColorStop(1, '#8a6424');
        c.fillStyle = k; c.beginPath(); c.arc(p[0], p[1], 4.2, 0, TAU); c.fill();
      } });
    }
    // The earth at the centre, engraved with its own turning meridians.
    items.push({ z: 0, draw: () => {
      const gr = SPH.r * .27;
      const g = c.createRadialGradient(SPH.x - gr * .38, SPH.y - gr * .42, gr * .1, SPH.x, SPH.y, gr);
      g.addColorStop(0, '#fbe9b4'); g.addColorStop(.55, '#c99d48'); g.addColorStop(1, '#5e4116');
      c.fillStyle = g; c.beginPath(); c.arc(SPH.x, SPH.y, gr, 0, TAU); c.fill();
      c.save(); c.beginPath(); c.arc(SPH.x, SPH.y, gr, 0, TAU); c.clip();
      c.strokeStyle = 'rgba(74, 50, 14, .5)'; c.lineWidth = .55;
      const earth = { spin: true };
      for (let m = 0; m < 6; m++) {
        c.beginPath(); let on = false;
        for (let k = 0; k <= 48; k++) {
          const th = k / 48 * TAU;
          const p = [Math.cos(th) * Math.cos(m * Math.PI / 6) * .27, Math.sin(th) * .27, Math.cos(th) * Math.sin(m * Math.PI / 6) * .27];
          const q = project(toView(p, earth, spin));
          if (q[2] > 0) { on ? c.lineTo(q[0], q[1]) : c.moveTo(q[0], q[1]); on = true; } else on = false;
        }
        c.stroke();
      }
      for (const lat of [-.5, 0, .5]) {
        c.beginPath(); let on = false;
        for (let k = 0; k <= 48; k++) {
          const th = k / 48 * TAU, rr = Math.cos(lat) * .27;
          const q = project(toView([Math.cos(th) * rr, Math.sin(lat) * .27, Math.sin(th) * rr], earth, spin));
          if (q[2] > 0) { on ? c.lineTo(q[0], q[1]) : c.moveTo(q[0], q[1]); on = true; } else on = false;
        }
        c.stroke();
      }
      c.restore();
      c.strokeStyle = 'rgba(58, 38, 10, .8)'; c.lineWidth = .7; c.beginPath(); c.arc(SPH.x, SPH.y, gr, 0, TAU); c.stroke();
    } });

    c.save();
    c.globalAlpha = alpha;
    const glow = c.createRadialGradient(SPH.x, SPH.y, 0, SPH.x, SPH.y, SPH.r * 1.9);
    glow.addColorStop(0, 'rgba(240, 206, 130, .16)'); glow.addColorStop(1, 'rgba(240, 206, 130, 0)');
    c.fillStyle = glow; c.beginPath(); c.arc(SPH.x, SPH.y, SPH.r * 1.9, 0, TAU); c.fill();
    items.sort((a, b) => a.z - b.z).forEach(item => item.draw());
    c.restore();
  }

  // ---------------------------------------------------------------- the whale constellation
  // Drawn facing left, in figure units (about 340 x 110); the figure is placed and scaled below.
  const WHALE = {
    x: 62, y: 104, s: .86,
    outline: [[0, 30], [16, 14], [52, 3], [100, 0], [160, 3], [214, 14], [256, 29], [288, 43], [308, 33], [330, 13], [327, 34], [318, 50], [329, 67], [338, 85], [309, 64], [285, 58], [234, 74], [165, 86], [104, 85], [58, 74], [24, 58], [5, 43]],
    fin: [[96, 80], [112, 96], [126, 113], [134, 95], [142, 83]],
    mouth: [[6, 41], [36, 47], [70, 49]],
    stars: [[0, 30, 2.4], [52, 3, 2.2], [160, 3, 2.8], [256, 29, 2.4], [288, 43, 2], [330, 13, 2.6], [338, 85, 2.2], [165, 86, 2.6], [126, 111, 2.2], [24, 55, 1.9], [46, 32, 3.6]],
    links: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [4, 6], [4, 7], [7, 9], [9, 0], [7, 8]],
  };
  const swim = (t) => ([x, y]) => {
    const along = x / 340;
    const wave = 6.5 * Math.sin(x / 400 * TAU - t * 1.25) * along * along;
    return [WHALE.x + 9 * Math.sin(t * .13) + x * WHALE.s, WHALE.y + 6 * Math.sin(t * .21) + (y + wave) * WHALE.s];
  };
  function spline(c, pts, closed) {
    const n = pts.length, at = i => pts[closed ? (i + n) % n : Math.max(0, Math.min(n - 1, i))];
    c.moveTo(...pts[0]);
    for (let i = 0; i < (closed ? n : n - 1); i++) {
      const [p0, p1, p2, p3] = [at(i - 1), at(i), at(i + 1), at(i + 2)];
      c.bezierCurveTo(p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6, p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6, p2[0], p2[1]);
    }
    if (closed) c.closePath();
  }
  function starGlyph(c, x, y, r, a, rays) {
    const halo = c.createRadialGradient(x, y, 0, x, y, r * 5);
    halo.addColorStop(0, `rgba(255, 236, 180, ${.42 * a})`); halo.addColorStop(1, 'rgba(255, 236, 180, 0)');
    c.fillStyle = halo; c.beginPath(); c.arc(x, y, r * 5, 0, TAU); c.fill();
    c.fillStyle = `rgba(255, 244, 214, ${a})`;
    if (rays) {
      c.beginPath();
      for (let k = 0; k < 8; k++) { const ang = k * Math.PI / 4, len = k % 2 ? r * 1.4 : r * 3.6; c.lineTo(x + Math.cos(ang) * len, y + Math.sin(ang) * len); c.lineTo(x + Math.cos(ang + Math.PI / 8) * r * .45, y + Math.sin(ang + Math.PI / 8) * r * .45); }
      c.closePath(); c.fill();
    } else { c.beginPath(); c.arc(x, y, r * .7, 0, TAU); c.fill(); }
  }
  function drawWhale(c, t, reveal) {
    const at = swim(t);
    const outline = WHALE.outline.map(at), fin = WHALE.fin.map(at), mouth = WHALE.mouth.map(at);
    const figure = smooth(.55, 1, reveal);
    if (figure > 0) {
      // Engraved belly shading, cut along the body and clipped to the outline.
      c.save();
      c.beginPath(); spline(c, outline, true); c.clip();
      for (let yy = 40; yy < 90; yy += 3.4) {
        c.strokeStyle = `rgba(232, 206, 140, ${figure * (.06 + .2 * (yy - 40) / 50)})`; c.lineWidth = .7;
        c.beginPath();
        for (let x = -5; x <= 345; x += 8) { const [px, py] = at([x, yy]); x < 0 ? c.moveTo(px, py) : c.lineTo(px, py); }
        c.stroke();
      }
      c.restore();
      c.strokeStyle = `rgba(240, 216, 150, ${.66 * figure})`; c.lineWidth = 1.15;
      c.beginPath(); spline(c, outline, true); c.stroke();
      c.beginPath(); spline(c, fin, false); c.stroke();
      c.lineWidth = .8; c.beginPath(); spline(c, mouth, false); c.stroke();
    }
    // Lines draw in after their stars, then the stars twinkle.
    const stars = WHALE.stars.map(([x, y, r]) => [...at([x, y]), r]);
    WHALE.links.forEach(([a, b], i) => {
      const k = smooth(.15 + i * .045, .3 + i * .045, reveal);
      if (!k) return;
      const [ax, ay] = stars[a], [bx, by] = stars[b];
      c.strokeStyle = 'rgba(248, 228, 170, .62)'; c.lineWidth = .9;
      c.beginPath(); c.moveTo(ax, ay); c.lineTo(ax + (bx - ax) * k, ay + (by - ay) * k); c.stroke();
    });
    stars.forEach(([x, y, r], i) => {
      const k = smooth(i * .05, i * .05 + .12, reveal);
      if (!k) return;
      const tw = .78 + .22 * Math.sin(t * (1.4 + i * .37) + i * 2.1);
      starGlyph(c, x, y, r * 1.18, k * tw, i === stars.length - 1 || r > 2.5);
    });
  }

  // ---------------------------------------------------------------- moon, twinkles, comet
  function drawMoon(c, t, a) {
    const x = 470, y = 150, r = 24;
    c.save(); c.globalAlpha = a;
    const halo = c.createRadialGradient(x, y, r * .6, x, y, r * 3);
    halo.addColorStop(0, 'rgba(250, 228, 160, .18)'); halo.addColorStop(1, 'rgba(250, 228, 160, 0)');
    c.fillStyle = halo; c.beginPath(); c.arc(x, y, r * 3, 0, TAU); c.fill();
    c.beginPath(); c.rect(0, 0, W, H); c.arc(x + r * .48, y - r * .2, r * .92, 0, TAU, true); c.clip('evenodd');
    const g = c.createLinearGradient(x - r, y - r, x + r, y + r);
    g.addColorStop(0, '#fbe8b0'); g.addColorStop(1, '#b8893a');
    c.fillStyle = g; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill();
    c.strokeStyle = 'rgba(90, 60, 16, .55)'; c.lineWidth = .6;
    for (let k = -r; k < r; k += 3) { c.beginPath(); c.moveTo(x - r, y + k); c.lineTo(x - r + 12 + Math.sqrt(Math.max(0, r * r - k * k)) * .3, y + k); c.stroke(); }
    c.restore();
  }
  const TWINKLES = (() => { const r = random(5); return Array.from({ length: 34 }, () => ({ x: 20 + r() * (W - 40), y: 30 + r() * (GROUND - 160), r: .9 + r() * 1.3, w: .5 + r() * 1.6, p: r() * TAU })); })();
  function drawTwinkles(c, t, a) {
    for (const s of TWINKLES) {
      const k = Math.max(0, Math.sin(t * s.w + s.p)) ** 4;
      if (k > .02) starGlyph(c, s.x, s.y, s.r * (.7 + .5 * k), a * k, true);
    }
  }
  function drawComet(c, t) {
    const cycle = 9, local = ((t - 5) % cycle + cycle) % cycle;
    if (t < 5 || local > 1.5) return;
    const n = Math.floor((t - 5) / cycle), q = local / 1.5, e = 1 - (1 - q) ** 2, fade = Math.sin(Math.PI * q);
    const from = [540 - (n % 3) * 50, 60 + (n % 2) * 40], to = [from[0] - 300, from[1] + 150];
    const hx = from[0] + (to[0] - from[0]) * e, hy = from[1] + (to[1] - from[1]) * e;
    const tail = c.createLinearGradient(hx, hy, hx + 100, hy - 50);
    tail.addColorStop(0, `rgba(255, 236, 190, ${.85 * fade})`); tail.addColorStop(1, 'rgba(255, 236, 190, 0)');
    c.strokeStyle = tail; c.lineWidth = 1.4; c.lineCap = 'round';
    c.beginPath(); c.moveTo(hx, hy); c.lineTo(hx + 100, hy - 50); c.stroke();
    starGlyph(c, hx, hy, 1.6, fade, false);
  }

  // ---------------------------------------------------------------- the knight
  // Seen from behind on the rise, looking up at the heavens; his cape takes the wind.
  function drawKnight(c, t, a) {
    const fx = KNIGHT.x, fy = groundAt(KNIGHT.x) + 1, s = KNIGHT.h / 70;
    const P = (x, y) => [fx + x * s, fy + y * s];
    const shape = (pts, fill) => { c.fillStyle = fill; c.beginPath(); pts.forEach(([x, y], i) => i ? c.lineTo(...P(x, y)) : c.moveTo(...P(x, y))); c.closePath(); c.fill(); };
    const body = '#04071a';
    c.save(); c.globalAlpha = a;
    // Legs, sword, torso and helm.
    shape([[-7, 0], [-5.5, -30], [-1, -30], [-2.2, 0]], body);
    shape([[2.2, 0], [1, -30], [5.5, -30], [7.5, 0]], body);
    shape([[-9.5, -0.5], [-2, -0.5], [-2, 1.2], [-9.5, 1.2]], body);
    shape([[2, -0.5], [9.5, -0.5], [9.5, 1.2], [2, 1.2]], body);
    c.strokeStyle = body; c.lineWidth = 1.6 * s;
    c.beginPath(); c.moveTo(...P(-9, -34)); c.lineTo(...P(-12, -4)); c.stroke();
    shape([[-8, -30], [-9, -46], [-10, -54], [-4, -57], [4, -57], [10, -54], [9, -46], [8, -30]], body);
    c.beginPath(); c.fillStyle = body; c.arc(...P(0, -62), 6 * s, 0, TAU); c.fill();
    shape([[-6, -62], [-5.6, -57], [5.6, -57], [6, -62]], body);
    // Plume.
    c.strokeStyle = '#7a2418'; c.lineWidth = 1.4 * s; c.lineCap = 'round';
    c.beginPath(); c.moveTo(...P(0, -68)); c.quadraticCurveTo(...P(5, -76 + Math.sin(t * 1.7) * .6), ...P(11 + Math.sin(t * 1.3), -72)); c.stroke();
    // The cape: hangs from the shoulders, its hem lifted and rippling to the right.
    const wind = Math.sin(t * .9) * .5 + Math.sin(t * 2.3 + 1) * .25;
    const hem = [];
    for (let k = 0; k <= 8; k++) {
      const u = k / 8;
      hem.push([-9 + u * (36 + 6 * wind), -7 - u * (14 + 5 * wind) + Math.sin(u * 7 - t * 3.1) * (1.2 + u * 1.8)]);
    }
    c.fillStyle = '#9a3322';
    c.beginPath();
    c.moveTo(...P(-9.5, -55));
    c.quadraticCurveTo(...P(-12, -30), ...P(hem[0][0], hem[0][1]));
    hem.forEach(([x, y]) => c.lineTo(...P(x, y)));
    c.quadraticCurveTo(...P(20 + 4 * wind, -34), ...P(9.5, -55));
    c.closePath(); c.fill();
    // Folds, cut like an engraving, darker toward the body.
    c.save(); c.clip();
    c.strokeStyle = 'rgba(50, 10, 6, .45)'; c.lineWidth = .7 * s;
    for (let k = 1; k < 8; k++) {
      const [hx, hy] = hem[k];
      c.beginPath(); c.moveTo(...P(-6 + k * 1.8, -54)); c.quadraticCurveTo(...P(-4 + k * 2.6 + wind * k * .4, -30), ...P(hx, hy)); c.stroke();
    }
    c.restore();
    // Moonlight on the shoulder and the cape's edge.
    c.strokeStyle = 'rgba(246, 214, 150, .55)'; c.lineWidth = .7 * s;
    c.beginPath(); c.arc(...P(0, -62), 6 * s, -1.4, .2); c.stroke();
    c.beginPath(); c.moveTo(...P(9.5, -55)); c.quadraticCurveTo(...P(20 + 4 * wind, -34), ...P(...hem[8])); c.stroke();
    c.restore();
  }

  // ---------------------------------------------------------------- layout and loop
  let zoomed = false, k = 1, dpr = 1;
  function layout() {
    dpr = Math.min(devicePixelRatio || 1, 2);
    const fit = Math.min(innerWidth / PAGE[0], innerHeight / PAGE[1]);
    k = zoomed ? fit * 2.2 : fit;
    const cx = zoomed ? WIN.x + 300 : PAGE[0] / 2, cy = zoomed ? WIN.y + 300 : PAGE[1] / 2;
    stage.style.transform = `translate(${-cx * k}px, ${-cy * k}px) scale(${k})`;
    ds = k * dpr;
    canvas.width = Math.round(W * ds); canvas.height = Math.round(H * ds);
    paintLayers();
    if (still) requestAnimationFrame(render);
  }
  document.querySelector('[data-zoom]').addEventListener('click', event => {
    zoomed = !zoomed;
    event.currentTarget.textContent = zoomed ? 'Ver a página inteira' : 'Ver de perto';
    layout();
  });
  addEventListener('resize', layout);

  const origin = performance.now();
  function render(now) {
    const t = still ? 30 : frozenAt ?? (now - origin) / 1000;
    ctx.setTransform(ds, 0, 0, ds, 0, 0);
    ctx.clearRect(0, 0, W, H);
    ctx.save();
    archPath(ctx); ctx.clip();
    const skyIn = smooth(0, 1, t);
    ctx.globalAlpha = skyIn;
    ctx.drawImage(skyLayer, 0, 0, W, H);
    ctx.globalAlpha = 1;
    drawTwinkles(ctx, t, skyIn);
    drawMoon(ctx, t, smooth(.8, 2, t));
    drawComet(ctx, t);
    drawSphere(ctx, t, smooth(.5, 2.2, t));
    drawWhale(ctx, t, clamp01((t - 1.6) / 2.6));
    ctx.globalAlpha = skyIn;
    ctx.drawImage(cityLayer, 0, 0, W, H);
    for (const l of lights) {
      const f = .7 + .3 * Math.sin(t * l.f + l.p) * Math.sin(t * l.f * 2.3 + l.p);
      if (l.rose) {
        const g = ctx.createRadialGradient(l.x + 9, l.y + 9, 0, l.x + 9, l.y + 9, 9);
        g.addColorStop(0, `rgba(255, 196, 110, ${.95 * f})`); g.addColorStop(1, `rgba(196, 90, 50, ${.6 * f})`);
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(l.x + 9, l.y + 9, 8, 0, TAU); ctx.fill();
        ctx.strokeStyle = '#0f1632'; ctx.lineWidth = 1;
        for (let s = 0; s < 8; s++) { ctx.beginPath(); ctx.moveTo(l.x + 9, l.y + 9); ctx.lineTo(l.x + 9 + Math.cos(s * Math.PI / 4) * 8, l.y + 9 + Math.sin(s * Math.PI / 4) * 8); ctx.stroke(); }
      } else {
        ctx.fillStyle = `rgba(255, 200, 112, ${.85 * f})`;
        ctx.fillRect(l.x, l.y, l.w, l.h);
      }
    }
    drawKnight(ctx, t, skyIn);
    ctx.globalAlpha = 1;
    // A soft inner shadow, as if the sky sits deeper than the page.
    ctx.shadowColor = 'rgba(4, 8, 22, .7)'; ctx.shadowBlur = 26;
    ctx.strokeStyle = 'rgba(0, 0, 0, 1)'; ctx.lineWidth = 28;
    ctx.beginPath(); ctx.moveTo(-14, H + 60); ctx.lineTo(-14, ARCH_R); ctx.arc(W / 2, ARCH_R, ARCH_R + 14, Math.PI, 0); ctx.lineTo(W + 14, H + 60); ctx.stroke();
    ctx.restore();
    if (!still) requestAnimationFrame(render);
  }

  buildFrame();
  layout();
  requestAnimationFrame(render);
})();
