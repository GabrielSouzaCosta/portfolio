/* Goiaba Lunar's projects, one at a time, in two places: the window under the sky in #estudio, and the
   galaxy that the dive into the guava opens (js/studio-portal.js calls goiabaGalaxy.open). The spotlight
   in the sky (js/studio-scene.js) and this script keep each other in step through 'studio:select'. */
(() => {
  'use strict';

  const section = document.querySelector('#estudio');
  const win = section && section.querySelector('.studio-window');
  const galaxy = document.querySelector('#galaxia');
  if (!win || !galaxy) return;

  const root = document.documentElement;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const phone = matchMedia('(max-width: 760px)');
  const pages = [...win.querySelectorAll('.win-page')];
  const N = pages.length;
  const host = win.querySelector('.win-host');
  const count = win.querySelector('.win-count');
  const winLive = win.querySelector('.win-live');
  const projects = [...galaxy.querySelectorAll('.gx-project')];
  const planets = [...galaxy.querySelectorAll('.gx-planet')];
  const reticle = galaxy.querySelector('.gx-reticle');
  const gxLive = galaxy.querySelector('.gx-live');
  const name = (i) => pages[i].querySelector('h3').textContent;
  const pad = (n) => String(n).padStart(2, '0');
  let selected = 0;

  function select(i, { from = 'window', announce = false } = {}) {
    i = (i + N) % N;
    const changed = i !== selected;
    selected = i;
    pages.forEach((page, k) => { page.hidden = k !== i; });
    host.textContent = pages[i].dataset.host;
    count.textContent = `${pad(i + 1)} / ${pad(N)}`;
    if (announce && changed) winLive.textContent = `${pad(i + 1)} de ${N}: ${name(i)}`;
    if (from !== 'scene') document.dispatchEvent(new CustomEvent('studio:select', { detail: { index: i, from } }));
    if (!galaxy.hidden) show(i, changed);
  }
  win.querySelector('.win-prev').addEventListener('click', () => select(selected - 1, { announce: true }));
  win.querySelector('.win-next').addEventListener('click', () => select(selected + 1, { announce: true }));
  document.addEventListener('studio:select', (event) => {
    if (event.detail.from === 'scene') select(event.detail.index, { from: 'scene' });
  });

  /* ---------------- the galaxy ---------------- */
  function show(i, animate) {
    const lost = galaxy.contains(document.activeElement) && document.activeElement.closest('.gx-project');
    projects.forEach((project, k) => { project.hidden = k !== i; });
    planets.forEach((planet, k) => planet.setAttribute('aria-pressed', String(k === i)));
    planets[i].append(reticle);
    if (animate && !reduced.matches) {
      projects[i].classList.remove('is-entering');
      void projects[i].offsetWidth;
      projects[i].classList.add('is-entering');
    }
    galaxy.querySelector('.gx-projects').scrollTop = 0;
    if (lost) projects[i].querySelector('.gx-name').focus({ preventScroll: true });
  }
  // The stage is drawn at 1440 x 900 (phones: 390 wide) around the baked orbit; it covers the screen from the bottom.
  function fit() {
    const w = galaxy.clientWidth, h = galaxy.clientHeight;
    galaxy.style.setProperty('--s', (phone.matches ? w / 390 : Math.max(w / 1440, h / 900)).toFixed(4));
  }

  let opener = null, closing = null, surfaces = [];
  // While the galaxy is open the page's own wheel, swipe and key navigation stand down.
  const guarded = ['wheel', 'touchstart', 'touchmove', 'touchend', 'keydown'];
  const guardOptions = { capture: true, passive: true };
  function guard(event) {
    if (event.type === 'keydown') {
      if (event.key === 'Escape') close();
      else if (!event.target.closest('input, textarea') && (event.key === 'ArrowRight' || event.key === 'ArrowLeft')) {
        select(selected + (event.key === 'ArrowRight' ? 1 : -1), { from: 'galaxy' });
        gxLive.textContent = `${pad(selected + 1)} de ${N}: ${name(selected)}`;
      }
    }
    event.stopImmediatePropagation();
  }
  function moonCircle() {
    const moon = section.querySelector('.moon-link').getBoundingClientRect();
    const x = moon.left + moon.width / 2, y = moon.top + moon.height / 2;
    return { x, y, r: Math.max(8, moon.width / 2), far: Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y)) };
  }

  // landing: the dive already filled the screen with night, so the galaxy dawns in place;
  // otherwise it opens out of the guava.
  function open(i = selected, trigger = null, { landing = false } = {}) {
    if (!galaxy.hidden || closing) return;
    opener = trigger;
    select(i, { from: 'galaxy' });
    galaxy.hidden = false;
    fit();
    show(i, false);
    surfaces = [...document.querySelectorAll('.stage, .sidebar, .sound-toggle')].map((el) => [el, el.inert]);
    surfaces.forEach(([el]) => { el.inert = true; });
    guarded.forEach((type) => window.addEventListener(type, guard, guardOptions));
    root.classList.add('galaxy-open');
    document.dispatchEvent(new CustomEvent('galaxy:toggle', { detail: { open: true } }));
    if (!reduced.matches) {
      galaxy.classList.remove('is-landing');
      void galaxy.offsetWidth;
      galaxy.classList.add('is-landing');
      if (!landing && galaxy.animate) {
        const c = moonCircle();
        galaxy.animate([{ clipPath: `circle(${c.r}px at ${c.x}px ${c.y}px)` }, { clipPath: `circle(${c.far}px at ${c.x}px ${c.y}px)` }],
          { duration: 700, easing: 'cubic-bezier(.5, 0, .2, 1)' });
      }
    }
    projects[i].querySelector('.gx-name').focus({ preventScroll: true });
  }

  function close() {
    if (galaxy.hidden || closing) return;
    root.classList.remove('galaxy-open');
    document.dispatchEvent(new CustomEvent('galaxy:toggle', { detail: { open: false } }));
    const done = () => {
      closing = null;
      galaxy.hidden = true;
      guarded.forEach((type) => window.removeEventListener(type, guard, guardOptions));
      surfaces.forEach(([el, inert]) => { el.inert = inert; });
      (opener && opener.isConnected && !opener.closest('[inert]') ? opener : section.querySelector('#studio-link'))?.focus({ preventScroll: true });
    };
    if (reduced.matches || !galaxy.animate) { done(); return; }
    // The night closes back into the fruit.
    const c = moonCircle();
    closing = galaxy.animate([
      { clipPath: `circle(${c.far}px at ${c.x}px ${c.y}px)`, opacity: 1 },
      { clipPath: `circle(${c.r}px at ${c.x}px ${c.y}px)`, opacity: 1, offset: .82 },
      { clipPath: `circle(${c.r * .85}px at ${c.x}px ${c.y}px)`, opacity: 0 },
    ], { duration: 640, easing: 'cubic-bezier(.55, 0, .3, 1)', fill: 'forwards' });
    closing.finished.then(() => { closing.cancel(); done(); }, done);
  }

  galaxy.querySelector('.gx-close').addEventListener('click', close);
  planets.forEach((planet, i) => planet.addEventListener('click', () => {
    select(i, { from: 'galaxy' });
    gxLive.textContent = `${pad(i + 1)} de ${N}: ${name(i)}`;
  }));
  galaxy.querySelectorAll('.gx-next').forEach((button) => button.addEventListener('click', () => {
    select(+button.dataset.project, { from: 'galaxy' });
  }));
  galaxy.addEventListener('animationend', (event) => { if (event.target === galaxy) galaxy.classList.remove('is-landing'); });
  addEventListener('resize', () => { if (!galaxy.hidden) fit(); });
  phone.addEventListener('change', () => { if (!galaxy.hidden) fit(); });

  window.goiabaGalaxy = { open, close };
  window.goiabaProjects = { get selected() { return selected; } };
})();
