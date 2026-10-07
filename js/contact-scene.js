/* Contato — fol. iv, "Tem uma ideia gigante?"
   The portfolio's bodyguard: a cyclops drawn in sepia ink with hand-coloured washes on the
   hero's parchment. He watches the cursor (a little head) and, when it comes into reach,
   winds up and bonks it with his olivewood club. His club arm is a real joint chain
   (shoulder, elbow, wrist), so the swing travels in an arc and the fist keeps its grip.
   Canvas 2D only: .contact-paper holds the page, .contact-ink (above the copy) the giant.
   Debug: ?c-at=<s> freezes time, &c-mx=&c-my= place the cursor (CSS px in the section),
   &c-strike=<s> freezes a strike that many seconds in, &c-mood=calm|cheer, &c-bumps=<n>,
   &c-intro=<s> freezes the arrival. */
(() => {
  'use strict';
  const section = document.querySelector('#contato');
  const inner = section?.querySelector('.contact-inner');
  const paper = inner?.querySelector('.contact-paper');
  const canvas = inner?.querySelector('.contact-ink');
  const slot = inner?.querySelector('.giant-slot');
  if (!paper || !canvas || !slot) return;
  const hint = section.querySelector('.giant-hint');
  const provoke = section.querySelector('.giant-provoke');
  const status = section.querySelector('.giant-status');
  const form = section.querySelector('#contact-form');
  const scroller = inner.parentElement;
  const g = canvas.getContext('2d');
  const pg = paper.getContext('2d');

  const params = new URLSearchParams(location.search);
  const num = (k) => (params.has(k) ? +params.get(k) : null);
  const frozenAt = num('c-at');
  const frozenStrike = num('c-strike');
  const frozenIntro = num('c-intro');
  const reducedQ = matchMedia('(prefers-reduced-motion: reduce)');
  const fine = matchMedia('(hover: hover) and (pointer: fine)');
  let reduced = reducedQ.matches;

  const TAU = Math.PI * 2, DEG = Math.PI / 180;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const mix = (a, b, k) => a + (b - a) * k;
  const smooth = (k) => { k = clamp(k, 0, 1); return k * k * (3 - 2 * k); };
  const easeOut = (k) => 1 - (1 - clamp(k, 0, 1)) ** 3;
  const backOut = (k) => { k = clamp(k, 0, 1) - 1; return 1 + 2.2 * k ** 3 + 1.2 * k ** 2; };
  const hash = (n) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
  const P = (d) => new Path2D(d);

  // ---- palette: the hero's parchment, sepia ink, rubric, lapis and gilt ----------------------
  const INK = '#2b2017';
  const PAPER = '#e6d4b5';
  const PAPER_HI = '#f3e8d0';
  const SKIN = '#efd6b0';
  const HAIR = '#3a2a1e';
  const HIDE = '#c38d4f';
  const WOOD = '#a97b4c';
  const LAPIS = '#1e2d5c';
  const IRIS = '#2f4f97';
  const RUBRIC = '#9a3322';
  const WHITE = '#fbf3e1';
  let plate = false;                         // the arrival's uncoloured proof: every wash is paper
  const wash = (c) => (plate ? PAPER_HI : c);

  // ---- the giant: the original drawing, in its own 560x520 units -----------------------------
  // Feet stand on y=470. Pivots: waist (262,380), neck (258,236), relaxed shoulder (196,238),
  // club shoulder S0 (338,250). The club arm is rebuilt as a joint chain below.
  const GIANT = {
    legL: P('M207 362c-11 25-14 60-18 77-21 0-40 15-36 28 3 10 23 10 43 8l39-5c10-3 14-11 11-21l-9-78Z'),
    legR: P('M275 373c-2 31 8 54 14 69-11 7-14 20-6 28 9 8 36 7 57 5 20 0 26-9 20-17-6-7-20-13-31-14-1-16-1-40-11-73Z'),
    legHatch: P('M207 373c-9 24-10 43-11 64l12 9-8 20 34-5-6-29-4-56Zm79 14 12 49-5 13 4 22 17-1c-12-30-10-60-8-80Z'),
    toes: P('M170 461c-4 5-4 9-1 15m14-16c-3 7-2 11 1 16m17-18c-4 8-2 13 1 17m105-13c5 2 7 7 6 13m8-15c7 2 10 7 9 14m6-15c8 2 12 7 11 14M206 417l12 4m-14 1 13 4m84-12 14-4m-12 9 12-4M199 451c12 4 27 2 34-3m64 1c8-4 20-3 28 1M212 401l8 1m87-6 6-1'),
    armL: P('M198 233c-20-13-41 3-51 29-8 23-16 43-18 65-3 16 1 36 12 41 6 5 12 5 15 2 5 5 14 4 16-3 9 1 14-6 11-14l-6-25c14-23 29-44 29-66Z'),
    armLHatch: P('M157 267c-13 26-19 55-17 75 1 12 3 18 11 24l5-4-4-25c4-16 11-32 17-42l15-32Z'),
    armLLines: P('M156 369c-5-6-8-16-7-26m22 23c-7-5-11-15-10-25m16 7c-5-5-7-12-7-18m-20-5c5-2 13 0 17 5m-13-41c7-1 14 1 19 5m-25 1 14 6'),
    armLFine: P('m139 310 7 3m-9 4 6 3m-6 4 5 2m42-64 5 5m-8 0 5 5m-8 0 4 5'),
    torso: P('M211 209c-25 5-41 31-41 62 0 31 2 70 13 100 24 32 108 43 145 5 19-29 31-80 26-114-4-24-27-45-50-52Z'),
    torsoHatch: P('M191 237c-11 30-7 70 2 102 5 17 14 30 27 40-24-8-35-15-37-28-8-31-8-69-3-90Zm128 18c17 24 13 70-4 92-20 25-55 30-81 23 42 22 88 6 98-18 10-24 19-69 9-91Z'),
    hide: P('M297 210c-3 26-39 60-69 72-17 7-34 7-55 8-1 31 3 63 12 88l18 2 13 15 20-5 20 11 21-10 17 3 15-14 20 2c14-30 23-63 25-94-17-21-26-41-32-68Z'),
    hideLines: P('M178 309c46 4 109-27 130-69m-122 80c42-1 93-22 118-53m-108 64c24 1 54-7 76-18'),
    hideFur: P('M197 333c3 25 10 44 18 55m2-58c1 24 7 44 15 55m54-86c-8 33-14 63-10 85m28-95c-4 26-9 53-9 80m32-77c-2 22-8 44-16 62'),
    hideSpots: P('M206 352c4-3 9-2 10 2-2 4-8 4-10-2Zm52-44c5-2 9 0 9 4-3 3-8 2-9-4Zm44 8c4-3 8-1 8 3-3 3-7 2-8-3Zm-24 62c4-2 8 0 7 4-3 2-6 1-7-4Zm40-18c3-3 7-2 7 2-2 3-6 3-7-2ZM229 300c4-3 8-2 9 2-3 3-7 3-9-2Z'),
    belt: P('M183 346c46 21 103 21 147-2l-4 16c-43 24-96 22-140 1Z'),
    buckle: P('m259 349 22-1 2 21-24 2Z'),
    buckleIn: P('m265 355 10-1 1 10-10 1Zm8 4 15-2'),
    chest: P('M217 230c-6 13-8 25-7 36m15-30-7 15m18-14-8 18M248 258l8-9m-13 4 6-10'),
    knot: P('M310 227c-6 5-11 10-13 18l13 10 13-15Z'),
    knotLine: P('m307 233 8 9-7 5'),
    ears: P('M207 161c-13-16-31-19-37-13-5 5 7 29 24 35m106-22c12-17 30-23 36-18 7 7-4 28-23 39'),
    earsHatch: P('M177 152c0 8 8 20 17 26l5-5c-7-9-14-15-22-21Zm153-5c-8 4-15 11-21 21l6 9c10-8 16-19 15-30Z'),
    earLines: P('m183 156 17 17m121-18-13 17'),
    face: P('M198 160c-2-28 15-48 43-54 20-5 47 2 59 17 14 17 17 42 14 65 8 7 9 19 3 24-4 17-21 34-47 39-30 5-56-6-68-26-7-13-10-30-7-44-7-7-6-16 3-21Z'),
    faceHatch: P('M204 142c-6 15-1 30-2 39-2 15 0 34 13 47 10 9 22 14 41 16-22-9-28-19-33-30l-8-27 2-45Zm89-6c14 24 16 42 7 61l8 11c1 16-9 27-19 32 24-13 27-24 29-37l-7-12c7-24 0-43-18-55Z'),
    hair: P('M201 157c-12-17-8-36 4-43l-3-12 22-1c6-13 19-22 34-22l-4 16c15-7 31-7 45-1l-13 11c15 4 25 16 27 34l-13 12c-3-17-16-21-25-23l3-7c-10 9-27 11-42 6l-14 17-2-14c-11 8-13 16-14 25Z'),
    hairLight: P('M202 139c0-13 7-23 18-27m-14 29c1-9 7-17 14-21m6-15c6-10 14-17 25-20m-19 22c4-7 9-11 15-14m-4 23c15 4 32-1 43-13m-36 19c8 1 17-1 23-4m15 1c10 4 17 13 20 21m-19-16c5 4 9 9 11 16'),
    eye: P('M214 171c6-17 21-26 40-25 20 0 35 10 42 27-9 17-24 25-42 24-20 0-33-8-40-26Z'),
    eyeCrease: P('M220 167c10-13 24-18 39-16 11 1 23 7 30 16'),
    irisRays: P('m253 155-1 7m-8-4 4 7m-10 3 7 2m-7 7 7-1m-4 10 5-5m9 11-1-7m9 2-5-6m10-5-7-1m6-8-7 3m2-11-5 7'),
    nose: P('M247 199c-4 3-7 7-6 10 2 5 14 6 21 2 3-2 2-6-1-8'),
    nostrils: P('m247 209 2 1m7 0 2-1'),
    tuskL: P('M225 232c-4-5-5-13-3-20 7 3 12 10 13 23-4 0-7-1-10-3Z'),
    tuskR: P('M272 233c0-9 5-17 12-22 2 8 1 15-3 21l-9 1Z'),
    faceLines: P('M276 205c4 1 9 0 13-2m-70-8-7-2m7 7-8-1m79-2 10-3m-9 8 8-2M206 169l-3 8m101-9 2 8'),
    chin: P('M244 241l6 1m7 0 5-1m5-1 5-2m-50-26-6-4m79 14 4-5'),
  };
  const WAIST = [262, 380], NECK = [258, 236], SHOULDER_L = [196, 238];
  const S0 = [338, 250], L1 = 64, L2 = 60, CLUB = 140, CROWN = 30;
  const EYE_C = [255, 172];

  // The club, in its own frame: grip at the origin, crown toward +x.
  const CLUB_SHAFT = P('M-22 -7.5C16 -8.5 64 -10 112 -12.5L112 12.5C64 10 16 8.5 -22 7.5Z');
  const CLUB_KNOB = (() => { const p = new Path2D(); p.ellipse(-26, 0, 10, 9.5, 0, 0, TAU); return p; })();
  const CLUB_HEAD = (() => {
    const p = new Path2D();
    for (let i = 0; i <= 64; i++) {
      const a = i / 64 * TAU, r = 1 + .075 * Math.sin(a * 5 + .6) + .04 * Math.sin(a * 9 + 2.1);
      const x = 140 + Math.cos(a) * 34 * r, y = Math.sin(a) * 28 * r;
      if (i) p.lineTo(x, y); else p.moveTo(x, y);
    }
    p.closePath();
    return p;
  })();
  const CLUB_BAND = (() => { const p = new Path2D(); p.roundRect(97, -13.5, 13, 27, 3); return p; })();
  const CLUB_GRAIN = P('M118 -16c10-6 24-8 36-4m-30 22c12 5 28 5 40-2m-26-18c6 4 9 10 9 17');
  const SHAFT_GRAIN = P('M-8 -2.5C28 -3.5 62 -2 96 -4.5M2 3.5C38 4.5 70 2.5 95 5');
  const CLUB_KNOTS = P('M152 -9c4-3 9-1 9 3s-6 5-9 1M128 12c3-2 7-1 7 2s-5 4-7 0M158 13c2-2 5-1 5 1s-3 3-5 1');

  // ---- the visitor: the cursor is a little head (its own 40-unit box, centre at 20,20) --------
  const HEAD = {
    ears: P('M8 18c-5-4-7 2-4 6l4 2m24-8c5-4 7 2 4 6l-4 2'),
    skull: P('M8 17C7 8 12 3 20 3c9 0 14 6 13 15l-1 9c-1 5-7 10-12 10S9 32 8 27Z'),
    hair: P('M7.7 17.4C6.6 7.6 12 3 20 3c9 0 14.4 6 13.1 15.2-1.4-3.4-3.6-6.6-6-8.4-3.4 2.3-9.4 2.7-13 .4-1.7 3-3.9 5.3-6.4 7.2Z'),
    tuft: P('M19.4 3.6c-1.4-2.4-.4-4.8 2.6-5.6-.8 1.6-.4 3.4.8 5'),
    fringe: P('M12 10.6c.6-1.6.7-3 .4-4.2m6.5 5.4c.8-1.8.8-3.6.3-5m6 5.1c1.2-1.2 1.6-2.8 1.5-4.4'),
    nose: P('m20 20-2 6 3 1'),
    smile: P('m15 30c3 2 7 2 10-1'),
    wobble: P('M15.5 30.8c1.5-1.2 2.5 1.1 4 0s2.5-1.1 4 0'),
    browsOk: P('m11 17 5-1m8-1c2-1 4 0 5 1'),
    browsWorried: P('M10.6 17.2l5-2.2m8.8-.4 5 2.2'),
    eyesX: P('M12.4 19.6l3.2 3.2m0-3.2-3.2 3.2M24.4 18.6l3.2 3.2m0-3.2-3.2 3.2'),
    cheeks: P('m6 21 1 2m27-2-1 2'),
    sweat: P('M34.5 6c1.6 2.6 2.6 4.2 2.6 5.4a2.6 2.6 0 0 1-5.2 0c0-1.2 1-2.8 2.6-5.4Z'),
    plaster: P('M-5.5-3.5l11 7m0-7-11 7'),
  };

  // ---- layout -------------------------------------------------------------------------------
  let css = { w: 1, h: 1 }, dpr = 1, box = inner.getBoundingClientRect();
  const world = { fx: 0, fy: 0, s: 1 };
  let HATCH = null, CROSS = null, FINE = null;
  function layout() {
    dpr = Math.min(devicePixelRatio || 1, 2);
    css = { w: inner.offsetWidth, h: inner.offsetHeight };
    for (const c of [paper, canvas]) {
      const w = Math.round(css.w * dpr), h = Math.round(css.h * dpr);
      if (c.width !== w || c.height !== h) { c.width = w; c.height = h; }
    }
    box = inner.getBoundingClientRect();
    const r = slot.getBoundingClientRect();
    const sl = { x: r.left - box.left, y: r.top - box.top, w: r.width, h: r.height };
    const s = Math.min(sl.h / 452, sl.w / 520);
    world.s = s;
    world.fx = sl.x + (265 - 118) * s + Math.max(0, (sl.w - 520 * s) * .12);
    world.fy = sl.y + sl.h - 40 * s;
    HATCH = hatchPattern(6.2, .85, 25, .5);
    CROSS = hatchPattern(5.4, .8, -35, .42);
    FINE = hatchPattern(4.6, .7, 25, .36);
    paintPaper();
    if (frozenAt !== null) window.__contactWorld = { ...world, toScreen };
  }
  // Engraved hatching drawn at device resolution, laid in the giant's own units.
  function hatchPattern(spacing, width, angle, alpha) {
    const k = dpr * world.s, T = Math.max(3, Math.round(spacing * k));
    const c = document.createElement('canvas');
    c.width = c.height = T;
    const x = c.getContext('2d');
    x.strokeStyle = `rgba(43,32,23,${alpha})`;
    x.lineWidth = Math.max(1, width * k);
    x.beginPath(); x.moveTo(T / 2, -1); x.lineTo(T / 2, T + 1); x.stroke();
    const p = g.createPattern(c, 'repeat');
    p.setTransform(new DOMMatrix().rotateSelf(angle).scaleSelf(1 / k));
    return p;
  }
  const toLocal = (x, y) => [(x - world.fx) / world.s + 265, (y - world.fy) / world.s + 470];
  const toScreen = (lx, ly) => [world.fx + (lx - 265) * world.s, world.fy + (ly - 470) * world.s];
  function toGiant(c = g, ox = 0, oy = 0) {
    const k = dpr * world.s;
    c.setTransform(k, 0, 0, k, dpr * (world.fx + ox) - 265 * k, dpr * (world.fy + oy) - 470 * k);
  }
  // The upper body leans and bobs about the waist; the arm chain lives in that frame.
  function upperBody(c = g) {
    c.translate(WAIST[0], WAIST[1]); c.rotate(body.lean); c.translate(-WAIST[0], -WAIST[1] - body.bob);
  }
  function fromBody(x, y, lean, bob) {
    const dx = x - WAIST[0], dy = y - bob - WAIST[1], c = Math.cos(lean), s = Math.sin(lean);
    return [WAIST[0] + dx * c - dy * s, WAIST[1] + dx * s + dy * c];
  }
  function toBody(x, y, lean, bob) {
    const dx = x - WAIST[0], dy = y - WAIST[1], c = Math.cos(-lean), s = Math.sin(-lean);
    return [WAIST[0] + dx * c - dy * s, WAIST[1] + dx * s + dy * c + bob];
  }

  // ---- inking helpers -----------------------------------------------------------------------
  function inked(path, fill, lw = 2.8) {
    g.fillStyle = fill; g.fill(path);
    g.lineWidth = lw; g.strokeStyle = INK; g.lineJoin = g.lineCap = 'round';
    g.stroke(path);
  }
  // For unions built from overlapping pieces: a doubled stroke first, the fill over it,
  // so only the outer contour survives.
  function inkedUnion(path, fill, lw = 2.8) {
    g.lineWidth = lw * 2; g.strokeStyle = INK; g.lineJoin = g.lineCap = 'round';
    g.stroke(path);
    g.fillStyle = fill; g.fill(path);
  }
  function lines(path, lw, alpha = 1, color = INK) {
    g.globalAlpha *= alpha; g.lineWidth = lw; g.strokeStyle = color; g.lineCap = g.lineJoin = 'round';
    g.stroke(path); g.globalAlpha /= alpha;
  }
  function hatchIn(path, pattern = HATCH) { g.fillStyle = pattern; g.fill(path); }
  // Hatching on the side away from the light (upper left): the shape minus a copy of itself
  // nudged toward the light, whatever the current rotation.
  function shade(path, depth, pattern = HATCH) {
    const m = g.getTransform(), det = m.a * m.d - m.b * m.c;
    const k = -depth * dpr * world.s * .7071;
    const lx = (m.d * k - m.c * k) / det, ly = (-m.b * k + m.a * k) / det;
    g.save(); g.clip(path);
    const cut = new Path2D();
    cut.rect(-3000, -3000, 6000, 6000);
    cut.addPath(path, new DOMMatrix([1, 0, 0, 1, lx, ly]));
    g.fillStyle = pattern; g.fill(cut, 'evenodd');
    g.restore();
  }
  let glint = .5;
  function gilt(x0, y0, x1, y1, c = g) {
    if (plate) return PAPER_HI;
    const gr = c.createLinearGradient(x0, y0, x1, y1), k = clamp(glint, .2, .8);
    gr.addColorStop(0, '#7c5c24'); gr.addColorStop(k - .16, '#b9944f');
    gr.addColorStop(k, '#f5e3a2'); gr.addColorStop(k + .14, '#c9a35a'); gr.addColorStop(1, '#7f5f27');
    return gr;
  }
  function capsule(p, ax, ay, ra, bx, by, rb) {
    const dx = bx - ax, dy = by - ay, d = Math.max(1e-3, Math.hypot(dx, dy));
    const th = Math.atan2(dy, dx), al = Math.acos(clamp((ra - rb) / d, -1, 1));
    p.moveTo(ax + Math.cos(th + al) * ra, ay + Math.sin(th + al) * ra);
    p.arc(ax, ay, ra, th + al, th - al + TAU, false);
    p.arc(bx, by, rb, th - al, th + al, false);
    p.closePath();
    return p;
  }
  function star4(c, x, y, r, rot = 0) {
    c.beginPath();
    for (let i = 0; i < 8; i++) {
      const a = rot + i * Math.PI / 4, rr = i % 2 ? r * .3 : r;
      c.lineTo(x + Math.cos(a - Math.PI / 2) * rr, y + Math.sin(a - Math.PI / 2) * rr);
    }
    c.closePath();
  }

  // ---- the page -----------------------------------------------------------------------------
  function paintPaper() {
    const W = paper.width, H = paper.height;
    pg.setTransform(1, 0, 0, 1, 0, 0);
    pg.fillStyle = PAPER; pg.fillRect(0, 0, W, H);
    // Foxing and old stains, a lighter middle, then a burnt edge and the paper's fibres.
    for (let i = 0; i < 30; i++) {
      const x = hash(i * 3.1) * W, y = hash(i * 7.7 + 1) * H, r = (60 + hash(i * 1.3) * 340) * dpr;
      const gr = pg.createRadialGradient(x, y, 0, x, y, r);
      const a = .025 + hash(i * 5.9) * .05;
      gr.addColorStop(0, `rgba(146,104,58,${a})`); gr.addColorStop(1, 'rgba(146,104,58,0)');
      pg.fillStyle = gr; pg.fillRect(x - r, y - r, r * 2, r * 2);
    }
    const lit = pg.createRadialGradient(W * .62, H * .45, 0, W * .62, H * .45, Math.max(W, H) * .6);
    lit.addColorStop(0, 'rgba(250,240,218,.55)'); lit.addColorStop(1, 'rgba(250,240,218,0)');
    pg.fillStyle = lit; pg.fillRect(0, 0, W, H);
    const edge = pg.createRadialGradient(W / 2, H / 2, Math.min(W, H) * .35, W / 2, H / 2, Math.hypot(W, H) * .58);
    edge.addColorStop(0, 'rgba(120,80,40,0)'); edge.addColorStop(1, 'rgba(120,80,40,.2)');
    pg.fillStyle = edge; pg.fillRect(0, 0, W, H);
    pg.lineCap = 'round';
    for (let i = 0; i < 900; i++) {
      const x = hash(i * .37 + 9) * W, y = hash(i * .91 + 4) * H, a = hash(i * 2.3) * Math.PI, l = (3 + hash(i * 4.1) * 10) * dpr;
      pg.strokeStyle = `rgba(110,78,44,${.04 + hash(i) * .05})`;
      pg.lineWidth = dpr * .7;
      pg.beginPath(); pg.moveTo(x, y); pg.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); pg.stroke();
    }
    // The giant's world, in his units: an engraved glory, a sea of cloud and his rock.
    toGiant(pg);
    rays();
    clouds([[30, 500, .95], [500, 498, .85], [-130, 486, .7], [660, 488, .62]], .9);
    rock();
    for (const [x, y, r] of [[92, 150, 11], [566, 132, 8], [600, 300, 6], [118, 318, 6], [520, 420, 5]]) {
      star4(pg, x, y, r, 0);
      pg.fillStyle = gilt(x - r, y - r, x + r, y + r, pg); pg.fill();
      pg.lineWidth = .9; pg.strokeStyle = 'rgba(43,32,23,.7)'; pg.stroke();
    }
  }
  function rays() {
    const cx = 262, cy = 190;
    pg.save();
    pg.strokeStyle = 'rgba(122,92,50,.16)';
    pg.lineWidth = .8;
    for (let i = 0; i < 120; i++) {
      const a = i / 120 * TAU, r0 = 150 + (i % 2) * 22, r1 = 250 + (i % 3) * 40 + hash(i) * 30;
      pg.beginPath(); pg.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0); pg.lineTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1); pg.stroke();
    }
    pg.strokeStyle = 'rgba(176,141,74,.45)'; pg.lineWidth = 1.2;
    pg.beginPath(); pg.arc(cx, cy, 146, 0, TAU); pg.stroke();
    pg.strokeStyle = 'rgba(176,141,74,.3)'; pg.lineWidth = .8;
    pg.beginPath(); pg.arc(cx, cy, 138, 0, TAU); pg.stroke();
    pg.restore();
  }
  // Engraved cloud banks: scalloped tops, ruled shading underneath, a flat base.
  function clouds(list, alpha) {
    const c = pg;
    for (const [x0, base, k] of list) {
      const bank = new Path2D();
      const puffs = [[-70, -12, 30], [-38, -30, 36], [0, -40, 42], [40, -28, 34], [72, -12, 28], [-100, -2, 20], [100, -2, 20]];
      for (const [dx, dy, r] of puffs) { bank.moveTo(x0 + dx * k + r * k, base + dy * k); bank.ellipse(x0 + dx * k, base + dy * k, r * k, r * k * .9, 0, 0, TAU); }
      c.save();
      c.globalAlpha = alpha;
      c.beginPath(); c.rect(x0 - 140 * k, base - 120 * k, 280 * k, 120 * k); c.clip();
      c.lineWidth = 2; c.strokeStyle = 'rgba(70,52,34,.55)'; c.stroke(bank);
      c.fillStyle = '#ece0c6'; c.fill(bank);
      c.clip(bank);
      c.strokeStyle = 'rgba(70,52,34,.32)'; c.lineWidth = .75;
      for (let y = base - 46 * k; y < base; y += 3.2) {
        const w = (y - (base - 46 * k)) / (46 * k);
        c.globalAlpha = alpha * (.3 + w * .7);
        c.beginPath(); c.moveTo(x0 - 140 * k, y); c.lineTo(x0 + 140 * k, y + 1); c.stroke();
      }
      c.restore();
    }
  }
  function rock() {
    const c = pg;
    const top = P('M104 476C112 462 150 458 196 462 240 456 300 457 352 460 398 458 436 464 446 476 450 486 442 494 426 500L392 506 352 502 316 508 262 503 218 509 176 502 140 505 118 498C104 492 100 484 104 476Z');
    c.fillStyle = '#dcc6a0'; c.fill(top);
    c.save(); c.clip(top);
    c.strokeStyle = 'rgba(43,32,23,.42)'; c.lineWidth = .8;
    for (let i = 0; i < 46; i++) {
      const x = 100 + i * 8;
      c.beginPath(); c.moveTo(x, 480 + hash(i) * 6); c.lineTo(x + 10, 540); c.stroke();
    }
    c.fillStyle = '#dcc6a0';
    c.fill(P('M108 476C130 466 170 464 210 468 260 463 320 462 370 466 410 466 436 470 444 478 420 482 380 480 340 484 290 482 240 486 190 482 150 484 120 482Z'));
    c.restore();
    c.lineWidth = 2.2; c.strokeStyle = INK; c.lineJoin = 'round'; c.stroke(top);
    c.lineWidth = 1.2;
    c.stroke(P('M150 484c6 6 5 12-1 18m88-16c-4 7-3 13 3 20m80-18c7 5 8 11 4 17m60-20c-3 6 0 12 7 16M122 490c8 2 14 0 19-4'));
    // Grass, and a few flowers: gilt and rubric.
    c.lineWidth = 1.1;
    c.beginPath();
    for (let i = 0; i < 26; i++) {
      const x = 112 + i * 12.6 + hash(i * 3) * 6, y = 466 - Math.sin((x - 104) / 342 * Math.PI) * 6;
      for (let j = -1; j <= 1; j++) { c.moveTo(x + j * 2, y + 2); c.quadraticCurveTo(x + j * 3, y - 4, x + j * 5 + hash(i + j) * 2, y - 8 - hash(i * 7 + j) * 5); }
    }
    c.stroke();
    for (const [x, col] of [[124, RUBRIC], [168, '#d9b768'], [384, RUBRIC], [426, '#d9b768'], [404, '#d9b768']]) {
      const y = 458 - Math.sin((x - 104) / 342 * Math.PI) * 6;
      c.lineWidth = 1; c.beginPath(); c.moveTo(x, y + 8); c.quadraticCurveTo(x - 2, y + 2, x, y - 4); c.stroke();
      for (let k = 0; k < 5; k++) {
        const a = k / 5 * TAU;
        c.beginPath(); c.ellipse(x + Math.cos(a) * 3.2, y - 6 + Math.sin(a) * 3.2, 2.6, 2.6, 0, 0, TAU);
        c.fillStyle = col; c.fill(); c.lineWidth = .7; c.stroke();
      }
    }
  }

  // ---- poses --------------------------------------------------------------------------------
  // Club arm angles in radians, absolute in the upper body's frame: a1 upper arm, a2 forearm, a3 club.
  const pose = (a1, a2, a3) => ({ a1: a1 * DEG, a2: a2 * DEG, a3: a3 * DEG });
  const REST = pose(58, -52, -94);
  const READY = pose(40, -80, -117);
  const WIND = pose(-64, -104, -150);
  const CALM = pose(48, 6, 80);
  const CHEER = pose(-30, -75, -40);
  function chain(p) {
    const E = [S0[0] + Math.cos(p.a1) * L1, S0[1] + Math.sin(p.a1) * L1];
    const W = [E[0] + Math.cos(p.a2) * L2, E[1] + Math.sin(p.a2) * L2];
    const T = [W[0] + Math.cos(p.a3) * CLUB, W[1] + Math.sin(p.a3) * CLUB];
    return { E, W, T };
  }
  // The strike pose that puts the crown on a point: the closer the point, the more the elbow
  // and wrist stay bent; then the whole chain turns from the shoulder.
  const D2 = (b) => mix(-6, -76, b) * DEG, D3 = (b) => mix(-24, -54, b) * DEG;
  function tip(b) {
    const wx = L1 + Math.cos(D2(b)) * L2, wy = Math.sin(D2(b)) * L2, c = D2(b) + D3(b);
    const tx = wx + Math.cos(c) * CLUB, ty = wy + Math.sin(c) * CLUB;
    return { r: Math.hypot(tx, ty), phi: Math.atan2(ty, tx) };
  }
  const REACH_MAX = tip(0).r, REACH_MIN = tip(1).r;
  function solve(lx, ly) {
    const dx = lx - S0[0], dy = ly - S0[1], d = Math.hypot(dx, dy), th = Math.atan2(dy, dx);
    let lo = 0, hi = 1;
    for (let i = 0; i < 20; i++) { const m = (lo + hi) / 2; if (tip(m).r > d) lo = m; else hi = m; }
    const b = (lo + hi) / 2, a1 = th - tip(b).phi;
    return { a1, a2: a1 + D2(b), a3: a1 + D2(b) + D3(b) };
  }
  // Where the crown has to land so it comes down on top of the head, not through it.
  function aimFor(hx, hy, R) {
    const dx = hx - S0[0], dy = hy - S0[1], d = Math.hypot(dx, dy) || 1;
    const n = [-dy / d, dx / d];                       // the club's direction of travel there
    const off = CROWN * .9 + R * .62;
    return { x: hx - n[0] * off, y: hy - n[1] * off, n };
  }
  function zone(lx, ly, R) {
    const a = aimFor(lx, ly, R);
    const d = Math.hypot(a.x - S0[0], a.y - S0[1]), th = Math.atan2(a.y - S0[1], a.x - S0[0]);
    return lx > 372 && ly < 466 && ly > 30 && d > REACH_MIN + 8 && d < REACH_MAX - 4 && th > -82 * DEG && th < 72 * DEG;
  }
  const BAIT = [505, 330];
  function clampToZone(x, y) {
    const R = headR() / world.s;
    let [lx, ly] = toLocal(x, y);
    const dx = lx - S0[0], dy = ly - S0[1];
    const th = clamp(Math.atan2(dy, dx), -45 * DEG, 50 * DEG), d = clamp(Math.hypot(dx, dy), 175, 222);
    lx = S0[0] + Math.cos(th) * d; ly = S0[1] + Math.sin(th) * d;
    if (!zone(lx, ly, R)) [lx, ly] = BAIT;
    return toScreen(lx, ly);
  }

  // ---- state --------------------------------------------------------------------------------
  let time = frozenAt ?? performance.now() / 1000, raf = 0, keepUntil = 0, introStart = null;
  const pointer = { x: num('c-mx') ?? -999, y: num('c-my') ?? -999, inside: params.has('c-mx'), overForm: false };
  let mood = params.get('c-mood') || 'idle';
  let strike = null;
  let lastStrike = { end: -99, x: -999, y: -999, hit: true };
  let dwellSince = null, lastHm = -99;
  let bumps = num('c-bumps') ?? 0;
  let hit = null;                                       // the last blow: where, which way, landed or not
  let bait = null;                                      // a tapped head: { x, y, until }
  let speech = null;
  let blinkAt = time + 2;
  let gaze = [0, 0], gazeNext = 0, calmGaze = [.8, .3];
  const T_WIND = .4, T_SWING = .47, T_IMPACT = .59, T_HOLD = .97, T_END = 1.5;
  const LEAN_HIT = .06;
  const body = { ...REST, lean: 0, tilt: 0, bob: 0, armL: 0 };
  const FACES = {
    idle: { frown: 0, lift: 0, open: 1, squint: 0, pupil: 1, jaw: 0, curve: 0, grit: 0, smug: 0, blush: .25, happy: 0 },
    watch: { frown: .6, lift: -1, open: .92, squint: .2, pupil: .78, jaw: -3, curve: -3, grit: 0, smug: 0, blush: .1, happy: 0 },
    windup: { frown: 1, lift: -2, open: .82, squint: .42, pupil: .62, jaw: 3, curve: -4, grit: 1, smug: 0, blush: .15, happy: 0 },
    strike: { frown: .9, lift: 0, open: 1.08, squint: 0, pupil: .55, jaw: 9, curve: -5, grit: 1, smug: 0, blush: .1, happy: 0 },
    smug: { frown: -.25, lift: 2, open: .5, squint: .18, pupil: 1, jaw: 0, curve: 5, grit: 0, smug: 1, blush: .4, happy: 0 },
    miss: { frown: -.8, lift: 6, open: 1.12, squint: 0, pupil: .6, jaw: 12, curve: -8, grit: 0, smug: 0, blush: .2, happy: 0 },
    calm: { frown: -.5, lift: 3, open: .78, squint: .28, pupil: 1.08, jaw: 0, curve: 6, grit: 0, smug: 0, blush: .6, happy: 0 },
    cheer: { frown: -.8, lift: 6, open: 1, squint: 0, pupil: 1, jaw: 22, curve: 9, grit: 0, smug: 0, blush: .85, happy: 1 },
  };
  const face = { ...FACES.idle, lookX: 0, lookY: 0, blink: 0 };

  // ---- drawing: the giant -------------------------------------------------------------------
  function drawGiant() {
    g.save();
    // His shadow on the rock.
    g.fillStyle = 'rgba(70,46,22,.22)';
    g.beginPath(); g.ellipse(268 + body.lean * 60, 474, 126, 8, 0, 0, TAU); g.fill();
    g.fillStyle = 'rgba(70,46,22,.16)';
    g.beginPath(); g.ellipse(268, 473, 88, 5, 0, 0, TAU); g.fill();
    // Legs carry the weight; they stay planted.
    inked(GIANT.legL, wash(SKIN)); inked(GIANT.legR, wash(SKIN));
    hatchIn(GIANT.legHatch);
    lines(GIANT.toes, 1.4);
    // Everything above the waist leans, breathes and bobs.
    upperBody();
    leftArm();
    clubArm();
    torso();
    head();
    g.restore();
  }
  function leftArm() {
    g.save();
    g.translate(SHOULDER_L[0], SHOULDER_L[1]); g.rotate(body.armL); g.translate(-SHOULDER_L[0], -SHOULDER_L[1]);
    inked(GIANT.armL, wash(SKIN));
    hatchIn(GIANT.armLHatch);
    lines(GIANT.armLLines, 1.5); lines(GIANT.armLFine, 1);
    g.restore();
  }
  function clubArm() {
    const { E, W } = chain(body);
    // The club first: the fist will close over it.
    g.save(); g.translate(W[0], W[1]); g.rotate(body.a3); club(); g.restore();
    const arm = new Path2D();
    capsule(arm, S0[0], S0[1], 27, E[0], E[1], 22);
    capsule(arm, E[0], E[1], 24, W[0], W[1], 18);
    // The bicep swells on the side the forearm folds toward.
    const ux = Math.cos(body.a1), uy = Math.sin(body.a1), side = Math.sin(body.a2 - body.a1) < 0 ? -1 : 1;
    arm.moveTo(S0[0] + ux * 30 - uy * 8 * side + 27, S0[1] + uy * 30 + ux * 8 * side);
    arm.ellipse(S0[0] + ux * 30 - uy * 8 * side, S0[1] + uy * 30 + ux * 8 * side, 27, 21, body.a1, 0, TAU);
    inkedUnion(arm, wash(SKIN));
    shade(arm, 9);
    // Elbow crease and a hide wrap at the wrist.
    const fx = Math.cos(body.a2), fy = Math.sin(body.a2);
    g.lineWidth = 1.4; g.strokeStyle = INK; g.lineCap = 'round';
    g.beginPath();
    g.moveTo(E[0] - fy * 9 * side + fx * 4, E[1] + fx * 9 * side + fy * 4);
    g.quadraticCurveTo(E[0] + fx * 9, E[1] + fy * 9, E[0] + fy * 6 * side + fx * 7, E[1] - fx * 6 * side + fy * 7);
    g.stroke();
    g.save();
    g.translate(W[0] - fx * 25, W[1] - fy * 25); g.rotate(body.a2);
    const wrap = new Path2D(); wrap.roundRect(-6, -21, 13, 42, 5);
    inked(wrap, wash(HIDE), 2.2);
    lines(P('M-1-20v40M3-20v40'), 1, .7);
    g.restore();
    g.save(); g.translate(W[0], W[1]); g.rotate(body.a3); fist(body.a2 - body.a3); g.restore();
  }
  function club() {
    inked(CLUB_KNOB, wash(WOOD), 2.4);
    inked(CLUB_SHAFT, wash(WOOD), 2.6);
    shade(CLUB_SHAFT, 6, FINE);
    lines(SHAFT_GRAIN, 1, .7);
    inked(CLUB_HEAD, wash(WOOD), 2.8);
    shade(CLUB_HEAD, 12, HATCH);
    shade(CLUB_HEAD, 5, CROSS);
    lines(CLUB_GRAIN, 1.1, .8);
    lines(CLUB_KNOTS, 1.2, .9);
    g.fillStyle = gilt(97, -14, 110, 14); g.fill(CLUB_BAND);
    g.lineWidth = 1.6; g.strokeStyle = INK; g.stroke(CLUB_BAND);
    lines(P('M103.5-13v27'), .8, .7);
  }
  // A fist closed round the shaft: four fingers across it, the thumb locking them. In the
  // club's frame the wrist comes in from -y; the thumb sits on the end that points up.
  function fist(wrist) {
    const sy = Math.sin(wrist + Math.PI) < 0 ? 1 : -1;
    const sx = !strike && mood === 'calm' && Math.sin(body.a3) > .25 ? -1 : 1;
    g.scale(sx, sy);
    const hand = new Path2D();
    hand.roundRect(-20, -20, 41, 34, 12);
    for (const x of [-13.5, -4.5, 4.5, 13.5]) { hand.moveTo(x + 5.8, 13); hand.ellipse(x, 13, 5.8, 8.4, 0, 0, TAU); }
    inkedUnion(hand, wash(SKIN), 2.6);
    shade(hand, 7);
    lines(P('M-9 7v13M0 8v14M9 7v13'), 1.5);
    lines(P('M-16 -3c6 2 12 2 18 0'), 1, .6);
    const thumb = capsule(new Path2D(), -4, -11, 8, 16, 3, 6.6);
    inked(thumb, wash(SKIN), 2.3);
    lines(P('M12 -1c2 1 3 3 3 5'), 1.1, .8);
  }
  function torso() {
    inked(GIANT.torso, wash(SKIN));
    hatchIn(GIANT.torsoHatch);
    lines(GIANT.chest, 1.2);
    inked(GIANT.hide, wash(HIDE), 2.8);
    if (!plate) { g.fillStyle = 'rgba(110,62,26,.55)'; g.fill(GIANT.hideSpots); }
    shade(GIANT.hide, 14, HATCH);
    lines(GIANT.hideLines, 1.3); lines(GIANT.hideFur, 1.2, .75);
    inked(GIANT.belt, wash(LAPIS), 1.4);
    g.fillStyle = gilt(259, 348, 283, 371); g.fill(GIANT.buckle);
    g.lineWidth = 2; g.strokeStyle = INK; g.stroke(GIANT.buckle);
    lines(GIANT.buckleIn, 1.5);
    inked(GIANT.knot, wash(HIDE), 2);
    lines(GIANT.knotLine, 1.1);
  }
  function head() {
    g.save();
    g.translate(NECK[0], NECK[1]); g.rotate(body.tilt); g.translate(-NECK[0], -NECK[1]);
    inked(GIANT.ears, wash(SKIN), 3);
    hatchIn(GIANT.earsHatch);
    lines(GIANT.earLines, 1.4);
    inked(GIANT.face, wash(SKIN), 3);
    hatchIn(GIANT.faceHatch);
    if (!plate && face.blush > .02) {
      for (const [x, y] of [[221, 206], [296, 201]]) {
        const gr = g.createRadialGradient(x, y, 0, x, y, 17);
        gr.addColorStop(0, `rgba(196,82,58,${.42 * face.blush})`); gr.addColorStop(1, 'rgba(196,82,58,0)');
        g.fillStyle = gr; g.fillRect(x - 18, y - 18, 36, 36);
      }
    }
    inked(GIANT.hair, wash(HAIR), 3);
    lines(GIANT.hairLight, 1.1, .7, PAPER_HI);
    eye();
    brow();
    inked(GIANT.nose, wash(SKIN), 1.7);
    lines(GIANT.nostrils, 1.2);
    mouth();
    lines(GIANT.faceLines, 1.1);
    lines(GIANT.chin, 1);
    g.restore();
  }
  function eye() {
    const f = face, open = clamp(f.open * (1 - f.blink), 0, 1.2);
    if (f.happy > .5) {
      // Shut with joy: a high arch and two lashes.
      g.fillStyle = FINE; g.fill(GIANT.eye);
      lines(P('M218 182C228 160 282 158 292 180'), 4);
      lines(P('M216 184l-8 2m86-4 8 1'), 1.8);
      return;
    }
    g.fillStyle = wash(WHITE); g.fill(GIANT.eye);
    g.save(); g.clip(GIANT.eye);
    const ix = 253 + f.lookX * 9, iy = 174 + f.lookY * 5;
    const ir = g.createRadialGradient(ix - 3, iy - 4, 2, ix, iy, 21);
    ir.addColorStop(0, plate ? PAPER_HI : '#5b7cc4'); ir.addColorStop(1, plate ? PAPER_HI : IRIS);
    g.beginPath(); g.ellipse(ix, iy, 16, 20, 0, 0, TAU);
    g.fillStyle = ir; g.fill(); g.lineWidth = 1.7; g.strokeStyle = INK; g.stroke();
    g.save(); g.translate(ix - 253, iy - 174); lines(GIANT.irisRays, 1, .55, plate ? INK : '#d9e2f2'); g.restore();
    g.beginPath(); g.ellipse(ix, iy, 7.5 * f.pupil, 11 * f.pupil, 0, 0, TAU); g.fillStyle = INK; g.fill();
    g.beginPath(); g.ellipse(ix + 4, iy - 6, 3, 4, 0, 0, TAU); g.fillStyle = WHITE; g.fill();
    // The upper lid's shadow on the eyeball.
    g.fillStyle = FINE; g.fillRect(200, 140, 110, 12);
    // Lids: the upper one comes down for blinks and squints, the lower one rises.
    const lid = mix(188, 136, clamp(open, 0, 1)) - Math.max(0, open - 1) * 20;
    const up = new Path2D();
    up.moveTo(200, 120); up.lineTo(310, 120); up.lineTo(310, lid); up.quadraticCurveTo(255, lid + 22, 200, lid); up.closePath();
    g.fillStyle = wash(SKIN); g.fill(up);
    g.lineWidth = 2.6; g.strokeStyle = INK;
    g.beginPath(); g.moveTo(200, lid); g.quadraticCurveTo(255, lid + 22, 310, lid); g.stroke();
    if (f.squint > .02) {
      const lo = mix(206, 182, f.squint);
      const dn = new Path2D();
      dn.moveTo(200, 220); dn.lineTo(310, 220); dn.lineTo(310, lo); dn.quadraticCurveTo(255, lo - 16, 200, lo); dn.closePath();
      g.fillStyle = wash(SKIN); g.fill(dn);
      g.lineWidth = 1.6; g.beginPath(); g.moveTo(200, lo); g.quadraticCurveTo(255, lo - 16, 310, lo); g.stroke();
    }
    g.restore();
    g.lineWidth = 2.6; g.strokeStyle = INK; g.stroke(GIANT.eye);
    lines(GIANT.eyeCrease, 1, .6);
  }
  function brow() {
    // One heavy brow across the face: it dips in the middle when he frowns, arches when he's pleased.
    const f = face.frown, y = 149 - face.lift;
    const L = [210, y + 2 - f * 7], R = [292, y - f * 7], M = [251, y - 26 + f * 26];
    const t = 8 + Math.abs(f) * 2;
    const p = new Path2D();
    p.moveTo(L[0], L[1]);
    p.quadraticCurveTo(M[0], M[1] - t, R[0], R[1]);
    p.quadraticCurveTo(R[0] + 3, R[1] + 6, R[0] - 4, R[1] + 6);
    p.quadraticCurveTo(M[0], M[1] + t * .6, L[0] + 5, L[1] + 7);
    p.quadraticCurveTo(L[0] - 4, L[1] + 5, L[0], L[1]);
    g.fillStyle = wash(HAIR); g.fill(p);
    g.lineWidth = 1.2; g.strokeStyle = INK; g.stroke(p);
  }
  function mouth() {
    const f = face, j = Math.max(0, f.jaw), c = f.curve, sm = f.smug;
    const L = [219, 223 - c * .9 + sm * 4], R = [289, 219 - c * .9 - sm * 7];
    const p = new Path2D();
    p.moveTo(L[0], L[1]);
    p.bezierCurveTo(238, 233 + f.jaw * .25 - c * .3, 266, 234 + f.jaw * .25 - c * .3 - sm * 3, R[0], R[1]);
    p.bezierCurveTo(283, 237 + j, 246, 245 + j * 1.15, L[0] + 5, L[1] + 8);
    p.closePath();
    g.fillStyle = plate ? INK : '#3b1712'; g.fill(p);
    if (j > 6) {
      g.save(); g.clip(p);
      g.fillStyle = wash('#b4473a');
      g.beginPath(); g.ellipse(254, 242 + j, 20, 10, 0, 0, TAU); g.fill();
      g.restore();
    }
    if (f.grit > .3) {
      // Clenched: a band of teeth along the upper lip.
      g.save(); g.clip(p);
      g.fillStyle = wash(WHITE);
      g.beginPath(); g.moveTo(215, 222); g.bezierCurveTo(238, 233, 266, 234, 293, 218); g.lineTo(293, 232); g.bezierCurveTo(266, 244, 238, 243, 215, 232); g.fill();
      lines(P('M232 228v9m11-6v10m12-10v10m12-10v9m11-12v8'), 1.1, .9);
      g.restore();
    }
    g.lineWidth = 1.4; g.strokeStyle = INK; g.stroke(p);
    // The tusks ride on the jaw.
    g.save(); g.translate(0, j * .9 + sm * 1); inked(GIANT.tuskL, wash(WHITE), 1.8); g.restore();
    g.save(); g.translate(0, j * .8 - sm * 5); inked(GIANT.tuskR, wash(WHITE), 1.8); g.restore();
  }

  // ---- drawing: the club's travel -----------------------------------------------------------
  function smear() {
    if (!strike?.imp) return;
    const age = time - strike.start;
    if (age < T_SWING || age > T_IMPACT + .09) return;
    const fade = age > T_IMPACT ? 1 - (age - T_IMPACT) / .09 : 1;
    const pts = [];
    for (let i = 0; i <= 9; i++) {
      const a = Math.max(T_SWING, Math.min(age, T_IMPACT) - i * .014);
      const p = armAt(strike, a), c = chain(p);
      pts.push([c.W, c.T, p.a3]);
    }
    // A pale sweep where the club just was, then ruled speed lines along the crown's arc.
    g.save();
    upperBody();
    g.globalAlpha = .6 * fade;
    g.beginPath();
    pts.forEach(([w], i) => (i ? g.lineTo(w[0], w[1]) : g.moveTo(w[0], w[1])));
    for (let i = pts.length - 1; i >= 0; i--) {
      const [, t, a] = pts[i];
      g.lineTo(t[0] + Math.cos(a) * 30, t[1] + Math.sin(a) * 30);
    }
    g.closePath();
    g.fillStyle = PAPER_HI; g.fill();
    g.globalAlpha = .85 * fade;
    for (const off of [-22, -6, 12, 28]) {
      g.beginPath();
      pts.forEach(([, t, a], i) => {
        const x = t[0] + Math.cos(a) * off, y = t[1] + Math.sin(a) * off;
        if (i) g.lineTo(x, y); else g.moveTo(x, y);
      });
      g.lineWidth = off === 12 ? 2 : 1.2; g.strokeStyle = INK; g.lineCap = 'round'; g.stroke();
    }
    g.restore();
  }

  // ---- drawing: the visitor's head ----------------------------------------------------------
  const headR = () => Math.max(16, 25 * world.s);
  function visitor(x, y) {
    const k = headR() / 17, since = hit && !hit.missed ? time - hit.at : 99;
    const worried = (strike && time - strike.start < T_IMPACT) || (!strike && dwellSince !== null);
    g.save();
    g.setTransform(dpr * k, 0, 0, dpr * k, dpr * x, dpr * y);
    // Squashed along the blow, then springing back.
    if (since < .7) {
      const e = since / .7;
      const sq = e < .14 ? mix(1, .5, e / .14) : e < .36 ? .5 : e < .7 ? mix(.5, 1.22, (e - .36) / .34) : e < .87 ? mix(1.22, .93, (e - .7) / .17) : mix(.93, 1, (e - .87) / .13);
      const st = Math.min(1.45, 1 / Math.sqrt(sq));
      const a = Math.atan2(hit.n[1], hit.n[0]);
      g.rotate(a); g.scale(sq, st); g.rotate(-a);
    }
    g.translate(-20, -20);
    const fill = (path, c, lw = 1.35) => { g.fillStyle = c; g.fill(path); g.lineWidth = lw; g.strokeStyle = INK; g.lineJoin = g.lineCap = 'round'; g.stroke(path); };
    // Bumps from earlier bonks, under the hair.
    if (bumps > 0) {
      const grow = since < 2 ? backOut(clamp((since - .08) / .3, 0, 1)) : 1;
      const r = (3.4 + Math.min(bumps, 3) * 1.1) * (bumps > 1 || since > .08 ? Math.max(.2, grow) : 0);
      if (r > .5) {
        const bx = 23, by = 4 - r * .55;
        const bump = new Path2D(); bump.ellipse(bx, by, r * 1.05, r, -.2, 0, TAU);
        fill(bump, '#e7b49a', 1.2);
        if (bumps >= 3) { g.save(); g.translate(bx, by); lines(HEAD.plaster, 4.4); lines(HEAD.plaster, 2.6, 1, '#f6ead2'); g.restore(); }
      }
    }
    fill(HEAD.ears, SKIN);
    fill(HEAD.skull, SKIN);
    for (const cx of [10, 30]) {
      const gr = g.createRadialGradient(cx, 26, 0, cx, 26, 5);
      gr.addColorStop(0, 'rgba(196,82,58,.35)'); gr.addColorStop(1, 'rgba(196,82,58,0)');
      g.fillStyle = gr; g.fillRect(cx - 6, 20, 12, 12);
    }
    fill(HEAD.hair, '#6c4c33', 1.3);
    lines(HEAD.fringe, .8, .7, PAPER_HI);
    lines(HEAD.tuft, 1.3);
    lines(HEAD.nose, 1.2);
    lines(HEAD.cheeks, .8);
    if (since < 1.7) {
      lines(HEAD.eyesX, 1.4);
      g.beginPath(); g.ellipse(20, 30.5, 2.2, 2.8, 0, 0, TAU); g.fillStyle = INK; g.fill();
    } else {
      lines(worried ? HEAD.browsWorried : HEAD.browsOk, 1.2);
      const er = worried ? 1.9 : 1.3;
      for (const [ex, ey] of [[14.2, 21.4], [26, 20.4]]) {
        g.beginPath(); g.ellipse(ex, ey, er, er * 1.15, 0, 0, TAU); g.fillStyle = INK; g.fill();
        if (worried) { g.beginPath(); g.ellipse(ex + .6, ey - .7, .55, .55, 0, 0, TAU); g.fillStyle = WHITE; g.fill(); }
      }
      lines(worried ? HEAD.wobble : HEAD.smile, 1.3);
      if (worried) { g.save(); g.translate(0, ((time * 1.4) % 1) * 3); fill(HEAD.sweat, '#dce6f2', 1); g.restore(); }
    }
    // Stars round the head after a bonk.
    if (since < 2.3) {
      const life = clamp(1 - (since - 1.6) / .7, 0, 1);
      for (let i = 0; i < 3; i++) {
        const a = since * 5.2 + i * TAU / 3, sx = 20 + Math.cos(a) * 19, sy = 1 + Math.sin(a) * 5.5;
        star4(g, sx, sy, 4.2 * life * (Math.sin(a) > 0 ? 1.1 : .8), since * 3);
        g.fillStyle = gilt(sx - 4, sy - 4, sx + 4, sy + 4); g.fill();
        g.lineWidth = .8; g.strokeStyle = INK; g.stroke();
      }
    }
    g.restore();
  }

  // ---- drawing: the blow --------------------------------------------------------------------
  function burst() {
    if (!hit) return;
    const age = time - hit.at;
    if (age < 0 || age > 1) return;
    const k = Math.max(.7, world.s);
    g.save();
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (hit.missed) {
      if (age < .7) {
        g.globalAlpha = 1 - smooth((age - .4) / .3);
        g.font = `italic ${Math.round(30 * k)}px "Instrument Serif", Georgia, serif`;
        g.textAlign = 'center';
        g.translate(hit.x, hit.y - age * 30 * k); g.rotate(-.12);
        g.lineWidth = 5; g.strokeStyle = PAPER_HI; g.lineJoin = 'round'; g.strokeText('Fiu!', 0, 0);
        g.fillStyle = INK; g.fillText('Fiu!', 0, 0);
      }
      g.restore();
      return;
    }
    const pop = age < .1 ? backOut(age / .1) : 1;
    const out = 1 - smooth((age - .42) / .2);
    if (out > 0) {
      // A gilt starburst behind the word.
      g.save();
      g.translate(hit.x, hit.y); g.rotate(hit.spin);
      g.globalAlpha = out;
      g.beginPath();
      const R = 40 * k * pop;
      for (let i = 0; i < 24; i++) {
        const r = i % 2 ? R * (.48 + hash(i + hit.seed) * .12) : R * (.88 + hash(i * 3 + hit.seed) * .3);
        const a = i / 24 * TAU;
        g.lineTo(Math.cos(a) * r, Math.sin(a) * r);
      }
      g.closePath();
      const gr = g.createRadialGradient(0, 0, 0, 0, 0, R);
      gr.addColorStop(0, '#fbeec0'); gr.addColorStop(.55, '#e2c06e'); gr.addColorStop(1, '#a8833d');
      g.fillStyle = gr; g.fill();
      g.lineWidth = 2; g.strokeStyle = INK; g.lineJoin = 'round'; g.stroke();
      g.restore();
    }
    // Ink flecks thrown out.
    for (let i = 0; i < 10; i++) {
      const a = hash(i * 9 + hit.seed) * TAU, v = (140 + hash(i * 4 + hit.seed) * 160) * k, l = clamp(age / .5, 0, 1);
      const d0 = 30 * k + v * easeOut(l) * .5, d1 = d0 + (10 + hash(i) * 10) * k * (1 - l);
      g.globalAlpha = 1 - l;
      g.beginPath(); g.moveTo(hit.x + Math.cos(a) * d0, hit.y + Math.sin(a) * d0); g.lineTo(hit.x + Math.cos(a) * d1, hit.y + Math.sin(a) * d1);
      g.lineWidth = 2; g.strokeStyle = INK; g.lineCap = 'round'; g.stroke();
    }
    g.restore();
  }
  function burstWord() {
    if (!hit || hit.missed) return;
    const age = time - hit.at;
    if (age < 0 || age > .9) return;
    const k = Math.max(.7, world.s), pop = age < .12 ? backOut(age / .12) : 1;
    g.save();
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.globalAlpha = 1 - smooth((age - .62) / .28);
    g.translate(hit.x - 34 * k, hit.y - 40 * k - age * 16 * k); g.rotate(-.16); g.scale(pop, pop);
    g.font = `italic ${Math.round(44 * k)}px "Instrument Serif", Georgia, serif`;
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.lineJoin = 'round';
    g.lineWidth = 7; g.strokeStyle = PAPER_HI; g.strokeText('POW!', 0, 0);
    g.fillStyle = RUBRIC; g.fillText('POW!', 0, 0);
    g.lineWidth = 1.1; g.strokeStyle = INK; g.strokeText('POW!', 0, 0);
    g.restore();
  }
  // His lines appear on a little banderole, the speech scroll of the old manuscripts.
  function banderole() {
    if (!speech) return;
    const age = time - speech.at;
    if (age > speech.hold + .25) { speech = null; return; }
    const open = age < .2 ? easeOut(age / .2) : age > speech.hold ? 1 - smooth((age - speech.hold) / .22) : 1;
    const k = clamp(world.s, .62, 1.1), size = Math.round(25 * k);
    const [ax, ay] = toScreen(316, 84 - body.bob);
    g.save();
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.font = `italic ${size}px "Instrument Serif", Georgia, serif`;
    const tw = g.measureText(speech.text).width, w = tw + size * 1.2, h = size * 1.24;
    const x0 = ax + 18 * k, y0 = ay - h - 22 * k, cx = x0 + w / 2;
    g.beginPath(); g.rect(cx - (w / 2 + 16 * k) * open, y0 - 20, (w + 32 * k) * open, h + 60 * k); g.clip();
    g.lineWidth = 1.4; g.strokeStyle = INK; g.lineJoin = 'round';
    // The tail curls down toward him.
    g.fillStyle = '#e9d9b8';
    g.beginPath(); g.moveTo(x0 + 8 * k, y0 + h); g.quadraticCurveTo(x0 - 4 * k, y0 + h + 12 * k, ax, ay); g.quadraticCurveTo(x0 + 6 * k, y0 + h + 8 * k, x0 + 20 * k, y0 + h); g.closePath(); g.fill(); g.stroke();
    // Rolled ends, behind the band.
    for (const [ex, dir] of [[x0, -1], [x0 + w, 1]]) {
      g.beginPath(); g.moveTo(ex, y0 + 4 * k); g.lineTo(ex + dir * 12 * k, y0 + 10 * k); g.lineTo(ex + dir * 7 * k, y0 + h / 2 + 4 * k); g.lineTo(ex + dir * 12 * k, y0 + h + 6 * k); g.lineTo(ex, y0 + h); g.closePath();
      g.fillStyle = '#d9c39b'; g.fill(); g.stroke();
    }
    const band = new Path2D();
    band.moveTo(x0, y0); band.quadraticCurveTo(cx, y0 - 5 * k, x0 + w, y0);
    band.lineTo(x0 + w, y0 + h); band.quadraticCurveTo(cx, y0 + h - 5 * k, x0, y0 + h); band.closePath();
    g.fillStyle = PAPER_HI; g.fill(band); g.lineWidth = 1.6; g.stroke(band);
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillStyle = speech.rubric ? RUBRIC : INK;
    g.fillText(speech.text, cx, y0 + h / 2 - 1.5 * k);
    g.restore();
  }

  // ---- motion -------------------------------------------------------------------------------
  const lerpPose = (a, b, k) => ({ a1: mix(a.a1, b.a1, k), a2: mix(a.a2, b.a2, k), a3: mix(a.a3, b.a3, k) });
  const COCKED = { a1: WIND.a1 - .03, a2: WIND.a2 - .04, a3: WIND.a3 - .06 };
  // The arm during a strike, as a pure function of its age (debug stills can stop anywhere).
  function armAt(st, age) {
    if (age < T_WIND) return lerpPose(st.from, WIND, backOut(age / T_WIND));
    if (age < T_SWING) {
      const q = (age - T_WIND) / (T_SWING - T_WIND), tr = Math.sin(q * 40) * .012 * (1 - q);
      return { a1: mix(WIND.a1, COCKED.a1, q), a2: mix(WIND.a2, COCKED.a2, q) + tr, a3: mix(WIND.a3, COCKED.a3, q) };
    }
    const imp = st.imp;
    if (age < T_IMPACT) {
      // The shoulder leads and the wrist snaps last: a whip, not a windscreen wiper.
      const q = (age - T_SWING) / (T_IMPACT - T_SWING);
      return { a1: mix(COCKED.a1, imp.a1, q ** 1.6), a2: mix(COCKED.a2, imp.a2, q ** 2.1), a3: mix(COCKED.a3, imp.a3, q ** 3) };
    }
    if (age < T_HOLD) {
      // The club bounces off the skull and settles.
      const q = (age - T_IMPACT - .07) / .2, b = q > 0 && q < 1 ? Math.sin(q * Math.PI) * (1 - q) : 0;
      return { a1: imp.a1 - b * .05, a2: imp.a2 - b * .12, a3: imp.a3 - b * .28 };
    }
    return lerpPose(imp, st.to, smooth((age - T_HOLD) / (T_END - T_HOLD)));
  }
  function bodyAt(st, age) {
    if (age < T_SWING) { const k = easeOut(age / T_WIND); return { lean: mix(st.lean, -.075, k), tilt: mix(st.tilt, -.1, k), armL: mix(st.armL, .38, k) }; }
    if (age < T_IMPACT) { const q = (age - T_SWING) / (T_IMPACT - T_SWING); return { lean: mix(-.075, LEAN_HIT, q * q), tilt: mix(-.1, .08, q * q), armL: mix(.38, .1, q) }; }
    const q = smooth((age - T_IMPACT - .3) / (T_END - T_IMPACT - .3));
    return { lean: mix(LEAN_HIT, 0, q), tilt: mix(.08, 0, q), armL: mix(.1, 0, q) };
  }
  function speak(text, hold = 1.2, rubric = false) { speech = { text, at: time, hold, rubric }; }
  function setHint(text) { if (hint.textContent !== text) hint.textContent = text; }
  const restingHint = () => (bumps >= 3 ? 'Três galos. Que tal o formulário?' : 'Cuidado. Ele leva o espaço pessoal a sério.');
  function setMood(m) {
    if (m === mood) return;
    mood = m;
    if (m === 'calm') setHint('Trégua. A sua ideia está em boas mãos.');
    if (m === 'cheer') { speak('Recebido!', 2.6); setHint('Recebido. Ele mesmo vai entregar.'); }
    if (m === 'idle') setHint(restingHint());
    invalidate();
  }
  function headPos() {
    if (bait) return [bait.x, bait.y];
    if (pointer.inside && !pointer.overForm && fine.matches && mood === 'idle') return [pointer.x, pointer.y];
    return null;
  }
  function beginStrike(target) {
    const st = { start: time, from: { a1: body.a1, a2: body.a2, a3: body.a3 }, lean: body.lean, tilt: body.tilt, armL: body.armL, to: REST, imp: null, target: null, hit: null, bait: false };
    if (target) { bait = { x: target[0], y: target[1], until: time + T_END + 1.6 }; st.bait = true; }
    strike = st;
    speak('Ei!', .62, true);
    setHint('Ei… cuidado com a cabeça.');
    kick();
  }
  function lockTarget(st) {
    const hp = headPos() ?? toScreen(...BAIT);
    const [lx, ly] = toLocal(hp[0], hp[1]);
    const a = aimFor(lx, ly, headR() / world.s);
    st.target = { x: hp[0], y: hp[1], n: a.n };
    // Solved in the upper body's frame, as it will stand at the moment of impact.
    st.imp = solve(...toBody(a.x, a.y, LEAN_HIT, body.bob));
    st.to = mood === 'idle' && !st.bait ? READY : REST;
  }
  function resolveHit(st) {
    const hp = headPos(), R = headR();
    const landed = st.bait || !!(hp && Math.hypot(hp[0] - st.target.x, hp[1] - st.target.y) < R * 1.35);
    st.hit = landed;
    const n = st.target.n;
    hit = { at: st.start + T_IMPACT, n, missed: !landed, seed: Math.floor(st.start * 10) % 97, spin: hash(st.start) * .6 - .3,
      x: st.target.x - n[0] * R * .55, y: st.target.y - n[1] * R * .55 };
    if (landed) {
      bumps++;
      setHint(bumps >= 3 ? 'Três galos. Que tal o formulário?' : 'Nada que uma boa ideia não resolva.');
      if (st.bait) status.textContent = 'Pof! O ciclope acertou a cabeça de brincadeira. Ela já se recuperou. O formulário continua disponível.';
      if (frozenAt === null) { document.body.classList.remove('giant-thump'); void document.body.offsetWidth; document.body.classList.add('giant-thump'); }
    } else {
      [hit.x, hit.y] = toScreen(...fromBody(...chain(st.imp).T, LEAN_HIT, body.bob));
      setHint('Por pouco. Ele precisa treinar a mira.');
    }
    lastStrike = { end: st.start + T_END, x: st.target.x, y: st.target.y, hit: landed };
  }

  function step(dt) {
    const k = frozenAt !== null ? 1 : 1 - Math.exp(-dt * 9);
    const kf = frozenAt !== null ? 1 : 1 - Math.exp(-dt * 14);
    const introDone = introStart !== null && time - introStart > 1.5;
    if (bait && time > bait.until && !strike) bait = null;
    const hp = headPos();
    const R = headR() / world.s;
    const local = hp ? toLocal(hp[0], hp[1]) : null;
    const inZone = !!(local && zone(local[0], local[1], R)) && !reduced;

    // He decides.
    if (!strike && introDone && mood === 'idle' && !reduced && hp && !bait) {
      if (inZone) {
        if (dwellSince === null) {
          dwellSince = time;
          if (time - lastHm > 5 && time - lastStrike.end > 1.5) { speak('Hm?', .9); lastHm = time; }
        }
        const moved = Math.hypot(hp[0] - lastStrike.x, hp[1] - lastStrike.y) > 30;
        if (time - dwellSince > .36 && moved && time - lastStrike.end > .35) beginStrike(null);
      } else dwellSince = null;
    }
    if (strike) {
      const age = time - strike.start;
      if (!strike.imp && age >= T_SWING) lockTarget(strike);
      if (strike.hit === null && age >= T_IMPACT) resolveHit(strike);
      if (age >= T_END) {
        const st = strike;
        strike = null;
        dwellSince = null;
        Object.assign(body, st.to);
        if (st.bait && bait) bait.until = Math.min(bait.until, time + 1.4);
      }
    }

    // His arm and body.
    if (strike) {
      const age = time - strike.start;
      Object.assign(body, armAt(strike, age), bodyAt(strike, age));
    } else {
      const target = mood === 'calm' ? CALM : mood === 'cheer' ? CHEER : inZone ? READY : REST;
      body.a1 = mix(body.a1, target.a1, k); body.a2 = mix(body.a2, target.a2, k); body.a3 = mix(body.a3, target.a3, k);
      if (inZone && mood === 'idle' && frozenAt === null) body.a3 += Math.sin(time * 9) * .02;     // the club twitches, ready
      body.lean = mix(body.lean, mood === 'cheer' ? -.03 : inZone ? .02 : 0, k);
      body.tilt = mix(body.tilt, mood === 'calm' ? .07 : mood === 'cheer' ? -.06 : 0, k);
      body.armL = mix(body.armL, mood === 'cheer' ? 2.35 + Math.sin(time * 9) * .2 : 0, k * .9);
    }
    body.bob = Math.sin(time * 1.9) * 1.4 + (mood === 'cheer' && !strike ? Math.abs(Math.sin(time * 4.5)) * 5 : 0);

    // His face.
    let want = 'idle';
    if (strike) { const age = time - strike.start; want = age < T_SWING ? 'windup' : age < T_IMPACT + .12 || strike.hit === null ? 'strike' : strike.hit ? 'smug' : 'miss'; }
    else if (time - lastStrike.end < 1.3) want = lastStrike.hit ? 'smug' : 'miss';
    else if (mood === 'cheer') want = 'cheer';
    else if (mood === 'calm') want = 'calm';
    else if (inZone) want = 'watch';
    const F = FACES[want];
    for (const key in F) face[key] = key === 'happy' || key === 'grit' ? F[key] : mix(face[key], F[key], kf);
    // Blinks.
    if (time > blinkAt) blinkAt = time + 2.4 + hash(time) * 3.6;
    const bp = 1 - (blinkAt - time) / .16;
    face.blink = frozenAt === null && bp > 0 && want !== 'windup' ? Math.sin(clamp(bp, 0, 1) * Math.PI) : 0;
    // Where he looks.
    let look;
    if (strike?.target) { const [lx, ly] = toLocal(strike.target.x, strike.target.y); look = [lx - EYE_C[0], ly - EYE_C[1]]; }
    else if (hp) { const [lx, ly] = toLocal(hp[0], hp[1]); look = [lx - EYE_C[0], ly - EYE_C[1]]; }
    else if (mood === 'calm') look = [calmGaze[0] * 200, calmGaze[1] * 200];
    else if (mood === 'cheer') look = [30, 40];
    else {
      if (time > gazeNext) { gazeNext = time + 1.4 + hash(time * 3) * 2.4; gaze = [(hash(time) - .4) * 260, (hash(time * 5) - .55) * 120]; }
      look = gaze;
    }
    const m = Math.hypot(look[0], look[1]) + 90;
    face.lookX = mix(face.lookX, clamp(look[0] / m * 1.25, -1, 1), kf);
    face.lookY = mix(face.lookY, clamp(look[1] / m * 1.25, -1, 1), kf);
    glint = mix(glint, hp ? clamp(hp[0] / css.w, 0, 1) : .5 + Math.sin(time * .5) * .2, k);
  }

  // ---- frame --------------------------------------------------------------------------------
  function render() {
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.clearRect(0, 0, canvas.width, canvas.height);
    let ox = 0, oy = 0;
    if (hit && !hit.missed) {
      const a = time - hit.at;
      if (a > 0 && a < .26) { const s = (1 - a / .26) * 5 * world.s; ox = (hash(a * 97) - .5) * 2 * s; oy = (hash(a * 61 + 3) - .5) * 2 * s; }
    }
    const ip = introStart === null ? 0 : clamp((time - introStart) / 1.5, 0, 1);
    if (ip <= 0) return;
    toGiant(g, ox, oy);
    if (ip < 1) {
      // Arrival: the proof is inked from the head down, then the washes come in.
      const edge = mix(-40, 540, easeOut(ip / .62));
      g.save();
      g.beginPath(); g.moveTo(-200, -200); g.lineTo(800, -200);
      for (let x = 800; x >= -200; x -= 20) g.lineTo(x, edge + Math.sin(x * .05 + ip * 6) * 10);
      g.closePath(); g.clip();
      plate = true; drawGiant(); plate = false;
      g.restore();
      const c = smooth((ip - .45) / .55);
      if (c > 0) { g.save(); g.globalAlpha = c; drawGiant(); g.restore(); }
    } else drawGiant();
    toGiant(g, ox, oy);
    smear();
    burst();
    const hp = headPos();
    if (hp && !reduced) visitor(hp[0] + ox, hp[1] + oy);
    burstWord();
    banderole();
    window.__contactFrame = (window.__contactFrame || 0) + 1;
  }

  // ---- lifecycle ----------------------------------------------------------------------------
  let last = 0;
  const isActive = () => document.body.dataset.section === 'contato';
  function running() { return frozenAt === null && !reduced && !document.hidden && (isActive() || performance.now() < keepUntil); }
  function frame(now) {
    raf = 0;
    if (running()) raf = requestAnimationFrame(frame);
    const t = frozenAt ?? now / 1000;
    const dt = clamp(t - (last || t), 0, .05);
    last = t; time = t;
    step(dt);
    render();
  }
  function kick() { if (!raf) { last = 0; raf = requestAnimationFrame(frame); } }
  function invalidate() { if (!raf) raf = requestAnimationFrame(frame); }
  function arrive() {
    if (introStart !== null) return;
    introStart = reduced ? time - 9 : time + .3;
    if (!reduced) setTimeout(() => { if (isActive() && !strike && !speech) { speak('Hm?', 1); lastHm = time; } }, 2100);
  }
  function resetPlay() {
    strike = null; dwellSince = null; bait = null;
    pointer.inside = false;
    document.body.classList.remove('giant-head');
    if (mood !== 'calm') setHint(restingHint());
  }
  function sync() {
    if (isActive()) { arrive(); kick(); }
    else { resetPlay(); keepUntil = performance.now() + 900; kick(); }
  }

  // ---- input --------------------------------------------------------------------------------
  const SAFE = 'form,a,button,input,textarea,select,label,.contact-footer';
  section.addEventListener('pointermove', (event) => {
    if (event.pointerType !== 'mouse' || !fine.matches || reduced) return;
    box = inner.getBoundingClientRect();
    pointer.x = event.clientX - box.left;
    pointer.y = event.clientY - box.top;
    pointer.inside = true;
    pointer.overForm = !!event.target.closest(SAFE) || form.contains(document.activeElement);
    document.body.classList.toggle('giant-head', !pointer.overForm && mood === 'idle');
  }, { passive: true });
  section.addEventListener('pointerleave', () => { pointer.inside = false; document.body.classList.remove('giant-head'); });
  section.addEventListener('pointerdown', (event) => {
    if (event.target.closest(SAFE) || reduced || strike || introStart === null) return;
    box = inner.getBoundingClientRect();
    const x = event.clientX - box.left, y = event.clientY - box.top;
    if (event.pointerType === 'mouse' && fine.matches) {
      // A click in reach: no waiting, he swings now.
      const [lx, ly] = toLocal(x, y);
      if (mood === 'idle' && zone(lx, ly, headR() / world.s)) beginStrike(null);
      return;
    }
    // Touch: a tap puts a little head where he can reach it.
    if (mood !== 'idle') setMood('idle');
    beginStrike(clampToZone(x, y));
  });
  provoke.hidden = false;
  provoke.addEventListener('click', () => {
    if (reduced) {
      setHint('Ele viu você. Hoje, resolveu deixar passar.');
      status.textContent = 'O ciclope viu você e deixou passar. Pode escrever sua mensagem.';
      return;
    }
    if (strike) return;
    if (mood !== 'idle') setMood('idle');
    beginStrike(toScreen(...BAIT));
  });
  form.addEventListener('focusin', () => { if (!strike) setMood('calm'); document.body.classList.remove('giant-head'); });
  form.addEventListener('pointerenter', () => { if (!strike) setMood('calm'); });
  form.addEventListener('focusout', () => setTimeout(() => { if (!form.contains(document.activeElement) && !form.matches(':hover') && mood === 'calm') setMood('idle'); }, 0));
  form.addEventListener('pointerleave', () => { if (!form.contains(document.activeElement) && mood === 'calm') setMood('idle'); });
  // He reads along: the eye follows the field being written in.
  form.addEventListener('input', (event) => {
    const r = event.target.getBoundingClientRect();
    const [lx, ly] = toLocal(r.left - box.left + Math.min(r.width, 8 + event.target.value.length * 7), r.top - box.top + r.height / 2);
    const ex = lx - EYE_C[0], ey = ly - EYE_C[1], m = Math.hypot(ex, ey) + 1;
    calmGaze = [ex / m, ey / m];
  });
  form.addEventListener('contact:sent', () => { setMood('cheer'); setTimeout(() => { if (mood === 'cheer') setMood(form.matches(':hover') ? 'calm' : 'idle'); }, 4200); });
  document.addEventListener('portfolio:sectionchange', sync);
  document.addEventListener('visibilitychange', sync);
  scroller.addEventListener('scroll', () => { box = inner.getBoundingClientRect(); }, { passive: true });
  reducedQ.addEventListener('change', () => { reduced = reducedQ.matches; resetPlay(); invalidate(); kick(); });
  section.addEventListener('keydown', (event) => { if (event.key === 'Escape') resetPlay(); });
  document.addEventListener('animationend', (event) => { if (event.animationName === 'giant-thump') document.body.classList.remove('giant-thump'); });

  // ---- start --------------------------------------------------------------------------------
  function start() {
    layout();
    section.classList.add('has-giant');
    new ResizeObserver(() => { layout(); invalidate(); }).observe(inner);
    document.fonts?.load('italic 30px "Instrument Serif"').then(() => invalidate());
    if (frozenAt !== null) {
      introStart = frozenIntro !== null ? time - frozenIntro : time - 9;
      if (frozenStrike !== null) {
        // Replay the strike's decisions up to the frozen moment.
        strike = { start: time - frozenStrike, from: { ...READY }, lean: 0, tilt: 0, armL: 0, to: READY, imp: null, target: null, hit: null, bait: false };
        Object.assign(body, READY);
        for (const at of [0, T_SWING, T_IMPACT]) if (frozenStrike >= at) { time = strike.start + at; step(0); }
        time = frozenAt;
      }
    } else sync();
    raf = requestAnimationFrame(frame);
  }
  let started = false;
  const begin = () => { if (!started) { started = true; start(); } };
  if (isActive() || frozenAt !== null) begin();
  else {
    document.addEventListener('portfolio:sectionchange', () => { if (isActive()) begin(); });
    const idle = window.requestIdleCallback ? (fn) => requestIdleCallback(fn, { timeout: 2000 }) : (fn) => setTimeout(fn, 0);
    const settle = () => setTimeout(() => idle(begin), 3600);
    if (document.readyState === 'complete') settle();
    else addEventListener('load', settle, { once: true });
  }
})();
