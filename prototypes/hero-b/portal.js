// Hero B test: the portal lives. Gilt orrery with orbiting planets, twinkling stars, a comet
// now and then, the whale crossing the arch and coming round again, the turtle paddling, and a
// little depth: the sky slides behind the arch as the pointer moves. Palette buttons switch the
// headline accent (lapis, rubric, sepia).
(() => {
  const root = document.documentElement;
  const sky = document.querySelector('.sky');
  const stars = sky.querySelector('.stars');
  const glow = sky.querySelector('.glow');
  const whale = sky.querySelector('.whale');
  const turtle = sky.querySelector('.turtle');
  const world = document.querySelector('.world');
  const keystone = document.querySelector('.keystone');
  const canvas = sky.querySelector('canvas.heavens');
  const ctx = canvas.getContext('2d');
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const params = new URLSearchParams(location.search);
  const frozenAt = params.has('at') ? Number(params.get('at')) : null;
  const SKY = [600, 650];

  // Palette switch, remembered in the URL.
  const buttons = document.querySelectorAll('[data-palette]');
  function setPalette(name) {
    root.dataset.palette = name;
    buttons.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.palette === name)));
    params.set('palette', name);
    history.replaceState(null, '', `?${params}`);
  }
  buttons.forEach(b => b.addEventListener('click', () => setPalette(b.dataset.palette)));
  setPalette(params.get('palette') || 'lapis');

  let k = 1, dpr = 1;
  addEventListener('stage:layout', event => {
    ({ k, dpr } = event.detail);
    canvas.width = Math.round(SKY[0] * k * dpr);
    canvas.height = Math.round(SKY[1] * k * dpr);
  });

  const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
  addEventListener('pointermove', event => {
    mouse.tx = event.clientX / innerWidth * 2 - 1;
    mouse.ty = event.clientY / innerHeight * 2 - 1;
  });

  let seed = 7;
  const random = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const twinkles = Array.from({ length: 64 }, () => ({ x: random() * SKY[0], y: random() * 470, r: .5 + random() ** 3 * 1.6, w: .6 + random() * 1.8, p: random() * 6.28 }));

  // The orrery: rings tilted like a page in perspective, one or two planets per ring.
  const ORRERY = { cx: 300, cy: 232, tilt: -14 * Math.PI / 180, squash: .38 };
  const RINGS = [
    { rx: 110, alpha: .55, planets: [{ r: 3.6, speed: .2, phase: 2.6 }] },
    { rx: 190, alpha: .45, planets: [{ r: 5.2, speed: .12, phase: 4.1, ring: true }] },
    { rx: 270, alpha: .34, planets: [{ r: 3.2, speed: .075, phase: 2.9 }, { r: 2.4, speed: .075, phase: 6.0 }] },
    { rx: 350, alpha: .22, dashed: true, planets: [{ r: 2.8, speed: .045, phase: 5.2 }] },
  ];
  const ringPoint = (rx, a) => {
    const x = rx * Math.cos(a), y = rx * ORRERY.squash * Math.sin(a);
    const c = Math.cos(ORRERY.tilt), s = Math.sin(ORRERY.tilt);
    return [ORRERY.cx + c * x - s * y, ORRERY.cy + s * x + c * y];
  };

  function sparkle(x, y, r, a) {
    ctx.fillStyle = `rgba(240, 214, 150, ${a})`;
    ctx.beginPath();
    ctx.moveTo(x, y - r * 3); ctx.quadraticCurveTo(x, y, x + r * 3, y); ctx.quadraticCurveTo(x, y, x, y + r * 3); ctx.quadraticCurveTo(x, y, x - r * 3, y); ctx.quadraticCurveTo(x, y, x, y - r * 3);
    ctx.fill();
  }

  function drawHeavens(t) {
    ctx.setTransform(k * dpr, 0, 0, k * dpr, 0, 0);
    ctx.clearRect(0, 0, SKY[0], SKY[1]);
    for (const s of twinkles) {
      const a = .15 + .85 * Math.max(0, Math.sin(t * s.w + s.p)) ** 3;
      if (s.r > 1.2) sparkle(s.x, s.y, s.r * .8, a * .9);
      else { ctx.fillStyle = `rgba(240, 214, 150, ${a * .8})`; ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, 6.2832); ctx.fill(); }
    }
    ctx.save();
    ctx.translate(ORRERY.cx, ORRERY.cy); ctx.rotate(ORRERY.tilt);
    for (const ring of RINGS) {
      ctx.strokeStyle = `rgba(226, 196, 124, ${ring.alpha})`;
      ctx.lineWidth = .9;
      ctx.setLineDash(ring.dashed ? [2, 5] : []);
      ctx.beginPath(); ctx.ellipse(0, 0, ring.rx, ring.rx * ORRERY.squash, 0, 0, 6.2832); ctx.stroke();
    }
    ctx.restore();
    ctx.setLineDash([]);
    // The sun breathes.
    const halo = ctx.createRadialGradient(ORRERY.cx, ORRERY.cy, 0, ORRERY.cx, ORRERY.cy, 34);
    halo.addColorStop(0, `rgba(250, 220, 140, ${.35 + .1 * Math.sin(t * 1.1)})`);
    halo.addColorStop(1, 'rgba(250, 220, 140, 0)');
    ctx.fillStyle = halo; ctx.beginPath(); ctx.arc(ORRERY.cx, ORRERY.cy, 34, 0, 6.2832); ctx.fill();
    ctx.fillStyle = '#e8cf8c'; ctx.beginPath(); ctx.arc(ORRERY.cx, ORRERY.cy, 8.5, 0, 6.2832); ctx.fill();
    ctx.strokeStyle = 'rgba(232, 207, 140, .8)'; ctx.lineWidth = .8; ctx.beginPath(); ctx.arc(ORRERY.cx, ORRERY.cy, 15, 0, 6.2832); ctx.stroke();
    for (const ring of RINGS) for (const p of ring.planets) {
      const [x, y] = ringPoint(ring.rx, p.phase + t * p.speed);
      ctx.fillStyle = '#e8cf8c'; ctx.beginPath(); ctx.arc(x, y, p.r, 0, 6.2832); ctx.fill();
      if (p.ring) { ctx.strokeStyle = 'rgba(232, 207, 140, .9)'; ctx.lineWidth = .8; ctx.beginPath(); ctx.ellipse(x, y, p.r * 2.1, p.r * .7, -.3, 0, 6.2832); ctx.stroke(); }
    }
    // A comet every 11 s, high in the sky, falling toward the stag.
    const cycle = 11, local = ((t - 3) % cycle + cycle) % cycle;
    if (t > 3 && local < 1.6) {
      const n = Math.floor((t - 3) / cycle), q = local / 1.6;
      const from = [520 - 60 * (n % 3), 40 + 30 * (n % 2)], to = [from[0] - 330, from[1] + 170];
      const e = 1 - (1 - q) ** 2;
      const hx = from[0] + (to[0] - from[0]) * e, hy = from[1] + (to[1] - from[1]) * e;
      const fade = Math.sin(Math.PI * q);
      const tail = ctx.createLinearGradient(hx, hy, hx + 90, hy - 46);
      tail.addColorStop(0, `rgba(255, 232, 170, ${.9 * fade})`);
      tail.addColorStop(1, 'rgba(255, 232, 170, 0)');
      ctx.strokeStyle = tail; ctx.lineWidth = 1.6; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(hx, hy); ctx.lineTo(hx + 90, hy - 46); ctx.stroke();
      ctx.fillStyle = `rgba(255, 240, 200, ${fade})`; ctx.beginPath(); ctx.arc(hx, hy, 2, 0, 6.2832); ctx.fill();
    }
  }

  // The whale crosses the arch right to left in 46 s, then comes round again.
  const WHALE_LOOP = 1020, WHALE_SPEED = 22;
  function frame(now) {
    const t = still ? 20 : frozenAt ?? now / 1000;
    mouse.x += (mouse.tx - mouse.x) * .05;
    mouse.y += (mouse.ty - mouse.y) * .05;
    const mx = mouse.x, my = mouse.y;
    stars.style.transform = `translate(${-mx * 12 + Math.sin(t * .02) * 10}px, ${-my * 7 + Math.cos(t * .017) * 6}px)`;
    glow.style.opacity = (.85 + .15 * Math.sin(t * .3)).toFixed(3);
    const wx = ((70 + 380 - WHALE_SPEED * t) % WHALE_LOOP + WHALE_LOOP) % WHALE_LOOP - 450;
    const wy = 7 * Math.sin(t * .37);
    whale.style.transform = `translate(${wx - mx * 16}px, ${wy - my * 9}px) rotate(${(.9 * Math.cos(t * .37)).toFixed(3)}deg)`;
    turtle.style.transform = `translate(${10 * Math.sin(t * .09) - mx * 10}px, ${5 * Math.sin(t * .5 + 1) - my * 6}px)`;
    world.style.transform = `translate(${-mx * 3}px, ${-my * 2}px)`;
    keystone.style.opacity = (.75 + .25 * Math.exp(-(((t % 7) - 1) ** 2) * 6)).toFixed(3);
    drawHeavens(t);
    if (!still) requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
