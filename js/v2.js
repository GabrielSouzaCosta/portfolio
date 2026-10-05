'use strict';

// Temporary studio destination; replace with its landing page when ready.
const config = { studioUrl: 'https://goiabalunar.tech', contactEndpoint: '' };
const root = document.documentElement;
const scenes = [...document.querySelectorAll('.scene')];
const navigation = [...document.querySelectorAll('.section-link')];
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
const status = document.querySelector('#navigation-status');
let page = Math.max(0, scenes.findIndex(scene => '#' + scene.id === location.hash));
let lockedUntil = 0;
let lastWheel = 0;
let wheelTotal = 0;
let wheelDirection = 0;
let wheelTimer;
let touchStart = null;
let touchDelta = 0;
let touchClaimed = false;
let navigationDrag = false;

function resetPull() {
  root.classList.remove('dragging');
  root.style.setProperty('--drag', '0px');
  wheelTotal = 0;
  wheelDirection = 0;
}
function previewPull(delta) {
  const next = page + Math.sign(delta);
  if (next < 0 || next >= scenes.length) return;
  if (reducedMotion.matches) return;
  root.classList.add('dragging');
  root.style.setProperty('--drag', `${-Math.sign(delta) * Math.min(90, Math.abs(delta) * .38)}px`);
}
function setPage(index, { focus = false, history = true, initial = false } = {}) {
  if (index < 0 || index >= scenes.length) { resetPull(); return; }
  const changed = index !== page;
  resetPull();
  page = index;
  root.style.setProperty('--page', page);
  document.body.dataset.section = scenes[page].id;
  document.querySelector('.position-current').textContent = String(page + 1).padStart(2, '0');
  const exploreCue = document.querySelector('.explore-cue');
  const nextPage = page === scenes.length - 1 ? 0 : page + 1;
  exploreCue.href = '#' + scenes[nextPage].id;
  exploreCue.querySelector('.cue-label').textContent = page === scenes.length - 1 ? 'Voltar' : 'Explore';
  exploreCue.setAttribute('aria-label', page === scenes.length - 1 ? 'Voltar ao início' : 'Explore: próxima seção, ' + navigation[nextPage].querySelector('.nav-name').firstChild.textContent);

  scenes.forEach((scene, i) => {
    scene.classList.toggle('is-active', i === page);
    scene.inert = i !== page;
    if (i === page) scene.removeAttribute('aria-hidden');
    else scene.setAttribute('aria-hidden', 'true');
  });
  navigation.forEach((link, i) => {
    link.classList.toggle('active', i === page);
    link.classList.toggle('is-next', i === nextPage);
    if (i === page) link.setAttribute('aria-current', 'location');
    else link.removeAttribute('aria-current');
  });
  document.body.classList.remove('cat-pointer');
  if (changed) scenes[page].querySelector('.scene-scroll').scrollTop = 0;
  updateScrollState();
  if (history && location.hash !== '#' + scenes[page].id) window.history.pushState(null, '', '#' + scenes[page].id);
  if (focus) scenes[page].querySelector('h1,h2').focus({ preventScroll: true });
  if (!initial) status.textContent = `${page + 1} de ${scenes.length}: ${navigation[page].querySelector('.nav-name').childNodes[0].textContent}`;
  lockedUntil = performance.now() + (reducedMotion.matches ? 180 : 900);
  document.dispatchEvent(new CustomEvent('portfolio:sectionchange', { detail: { id: scenes[page].id, initial, changed } }));
}
function scrollContainer() { return scenes[page].querySelector('.scene-scroll'); }
function updateScrollState() {
  document.body.classList.toggle('scene-scrolled', scrollContainer().scrollTop > 0);
}
function canScroll(element, direction) {
  if (!element || element.scrollHeight <= element.clientHeight + 2) return false;
  return direction > 0 ? element.scrollTop + element.clientHeight < element.scrollHeight - 2 : element.scrollTop > 2;
}
function editableScroll(target, direction) {
  const textarea = target.closest('textarea');
  return textarea && canScroll(textarea, direction);
}

root.classList.add('enhanced');
setPage(page, { history: false, initial: true });
lockedUntil = 0;
// Paint every chapter in its starting position before enabling navigation motion.
requestAnimationFrame(() => requestAnimationFrame(() => root.classList.add('scene-transitions')));
scenes.forEach(scene => scene.querySelector('.scene-scroll').addEventListener('scroll', () => {
  if (scene === scenes[page]) updateScrollState();
}, { passive: true }));

// A new press is a fresh interaction, even if the previous swipe emitted no click.
document.addEventListener('pointerdown', () => { navigationDrag = false; }, { passive: true });
document.addEventListener('click', event => {
  if (navigationDrag && event.target.closest('.sidebar')) {
    event.preventDefault();
    navigationDrag = false;
    return;
  }
  const link = event.target.closest('a[href^="#"]');
  if (!link) return;
  if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey ||
      link.hasAttribute('download') || (link.target && link.target !== '_self')) return;
  if (link.classList.contains('skip-link')) {
    event.preventDefault();
    scenes[page].querySelector('h1,h2').focus({ preventScroll: true });
    return;
  }
  const targetPage = scenes.findIndex(scene => '#' + scene.id === link.getAttribute('href'));
  if (targetPage === -1) return;
  event.preventDefault();
  setPage(targetPage, { focus: !link.closest('.sidebar') });
});
window.addEventListener('popstate', () => {
  const index = scenes.findIndex(scene => '#' + scene.id === location.hash);
  setPage(Math.max(0, index), { history: false });
});
window.addEventListener('hashchange', () => {
  const index = scenes.findIndex(scene => '#' + scene.id === location.hash);
  if (index >= 0 && index !== page) setPage(index, { history: false });
});

// Accumulate one deliberate wheel gesture. A short pull springs back;
// momentum after a completed transition cannot skip another chapter.
window.addEventListener('wheel', event => {
  if (event.ctrlKey || Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;
  const multiplier = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? innerHeight : 1;
  const delta = event.deltaY * multiplier;
  if (Math.abs(delta) < .5) return;
  const now = performance.now();
  const direction = Math.sign(delta);
  if (editableScroll(event.target, direction)) return;
  if (now >= lockedUntil && canScroll(scrollContainer(), direction)) {
    resetPull();
    lastWheel = now;
    if (!event.target.closest('.scene-scroll')) {
      event.preventDefault();
      scrollContainer().scrollBy({ top: delta, behavior: 'instant' });
    }
    return;
  }
  event.preventDefault();
  if (now < lockedUntil) { lastWheel = now; return; }
  if (now - lastWheel < 160 && wheelTotal === 0) { lastWheel = now; return; }
  if (now - lastWheel > 230 || wheelDirection !== direction) wheelTotal = 0;
  wheelDirection = direction;
  wheelTotal += delta;
  lastWheel = now;
  clearTimeout(wheelTimer);
  const threshold = 125;
  if (Math.abs(wheelTotal) >= threshold) {
    setPage(page + direction);
    return;
  }
  previewPull(wheelTotal);
  wheelTimer = setTimeout(resetPull, 165);
}, { passive: false });

window.addEventListener('touchstart', event => {
  navigationDrag = false;
  const onNavigation = Boolean(event.target.closest('.sidebar'));
  if (event.touches.length !== 1 || (!onNavigation && event.target.closest('input,textarea,button,a'))) { touchStart = null; return; }
  touchStart = { x: event.touches[0].clientX, y: event.touches[0].clientY, lastY: event.touches[0].clientY, onNavigation };
  touchDelta = 0;
  touchClaimed = false;
}, { passive: true });
window.addEventListener('touchmove', event => {
  if (!touchStart || event.touches.length !== 1) return;
  touchDelta = touchStart.y - event.touches[0].clientY;
  const horizontal = touchStart.x - event.touches[0].clientX;
  if (Math.abs(horizontal) > Math.abs(touchDelta)) return;
  const direction = Math.sign(touchDelta);
  if (touchStart.onNavigation && Math.abs(touchDelta) > 7) navigationDrag = true;
  if (!touchClaimed && canScroll(scrollContainer(), direction)) {
    if (touchStart.onNavigation) {
      navigationDrag = true;
      event.preventDefault();
      scrollContainer().scrollBy({ top: touchStart.lastY - event.touches[0].clientY, behavior: 'instant' });
      touchStart.lastY = event.touches[0].clientY;
      touchStart.y = touchStart.lastY;
      touchDelta = 0;
    } else touchStart = null;
    return;
  }
  if (performance.now() < lockedUntil) { event.preventDefault(); return; }
  if (Math.abs(touchDelta) > 7) touchClaimed = true;
  if (touchClaimed) { event.preventDefault(); previewPull(touchDelta); }
}, { passive: false });
window.addEventListener('touchend', () => {
  if (touchStart && touchClaimed && performance.now() >= lockedUntil && Math.abs(touchDelta) >= 85) setPage(page + Math.sign(touchDelta));
  else resetPull();
  touchStart = null;
}, { passive: true });
window.addEventListener('touchcancel', () => { touchStart = null; resetPull(); }, { passive: true });

document.addEventListener('keydown', event => {
  if (event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey || event.target.closest('input,textarea,select,button,[contenteditable="true"]')) return;
  let direction = 0;
  if (['ArrowDown','PageDown'].includes(event.key) || (event.key === ' ' && !event.shiftKey && !event.target.closest('a'))) direction = 1;
  if (['ArrowUp','PageUp'].includes(event.key) || (event.key === ' ' && event.shiftKey)) direction = -1;
  if (event.key === 'Home') { event.preventDefault(); setPage(0, { focus: true }); return; }
  if (event.key === 'End') { event.preventDefault(); setPage(scenes.length - 1, { focus: true }); return; }
  if (!direction) return;
  if (canScroll(scrollContainer(), direction)) {
    event.preventDefault();
    const distance = event.key.startsWith('Arrow') ? 64 : scrollContainer().clientHeight * .75;
    scrollContainer().scrollBy({ top: direction * distance, behavior: reducedMotion.matches ? 'instant' : 'smooth' });
    return;
  }
  event.preventDefault();
  if (performance.now() >= lockedUntil) setPage(page + direction, { focus: true });
});
window.addEventListener('resize', resetPull);

// Lightweight celestial background: seeded stars, quiet twinkle, occasional trails.
const canvas = document.querySelector('.starfield');
const context = canvas.getContext('2d');
let starWidth = 0, starHeight = 0, starFrame = 0;
let seed = 23;
function random() { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }
const stars = Array.from({ length: 150 }, () => ({ x: random(), y: random(), size: .5 + random() * 1.3, phase: random() * Math.PI * 2, speed: .4 + random() * .5, pink: random() > .52 }));
function resizeStars() {
  const parent = canvas.parentElement;
  starWidth = parent.clientWidth; starHeight = parent.clientHeight;
  const ratio = Math.min(devicePixelRatio, 2);
  canvas.width = Math.round(starWidth * ratio); canvas.height = Math.round(starHeight * ratio);
  context.setTransform(ratio, 0, 0, ratio, 0, 0);
  startStars();
}
function drawStars(time) {
  starFrame = 0;
  if (document.hidden || page !== 2) return;
  context.clearRect(0, 0, starWidth, starHeight);
  const seconds = reducedMotion.matches ? 0 : time * .001;
  for (const star of stars) {
    const alpha = .2 + (Math.sin(seconds * star.speed + star.phase) + 1) * .25;
    context.fillStyle = star.pink ? `rgba(242,175,206,${alpha})` : `rgba(202,224,164,${alpha})`;
    const x = (star.x * starWidth + seconds * star.speed * 1.4) % starWidth;
    const y = star.y * starHeight;
    context.fillRect(x, y, star.size, star.size);
    if (star.size > 1.66) { context.fillRect(x - 2, y + .5, 5, .5); context.fillRect(x + .5, y - 2, .5, 5); }
  }
  const trail = seconds % 13;
  if (!reducedMotion.matches && trail < 1.4) {
    const x = starWidth * (.5 + trail * .23), y = starHeight * (.03 + trail * .14);
    const gradient = context.createLinearGradient(x - 95, y - 48, x, y);
    gradient.addColorStop(0, 'rgba(239,171,195,0)'); gradient.addColorStop(1, 'rgba(239,171,195,.6)');
    context.strokeStyle = gradient; context.lineWidth = 1;
    context.beginPath(); context.moveTo(x - 95, y - 48); context.lineTo(x, y); context.stroke();
  }
  if (!reducedMotion.matches) starFrame = requestAnimationFrame(drawStars);
}
function stopStars() { cancelAnimationFrame(starFrame); starFrame = 0; }
function startStars() {
  if (!starFrame && page === 2 && !document.hidden) starFrame = requestAnimationFrame(drawStars);
}
// The observer sizes the canvas on its first frame, after layout: sizing it here
// would force an extra synchronous layout of the whole page during startup.
new ResizeObserver(resizeStars).observe(canvas.parentElement);
reducedMotion.addEventListener('change', () => { stopStars(); resetPull(); startStars(); });
document.addEventListener('portfolio:sectionchange', () => { stopStars(); startStars(); });
document.addEventListener('visibilitychange', () => { stopStars(); startStars(); });

document.querySelectorAll('[data-studio-portal]').forEach(link => {
  if (config.studioUrl) link.href = config.studioUrl;
});

const form = document.querySelector('#contact-form');
const formStatus = document.querySelector('.form-status');
form.addEventListener('submit', async event => {
  event.preventDefault();
  if (!form.reportValidity()) return;
  if (!config.contactEndpoint) {
    formStatus.textContent = 'O formulário ainda não está recebendo mensagens. Este canal estará disponível em breve.';
    return;
  }
  const button = form.querySelector('button[type="submit"]');
  const label = button.querySelector('span');
  button.disabled = true; label.textContent = 'Enviando…'; formStatus.textContent = '';
  try {
    const response = await fetch(config.contactEndpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(Object.fromEntries(new FormData(form))), signal: AbortSignal.timeout(15000) });
    if (!response.ok) throw new Error('Message endpoint rejected request');
    formStatus.textContent = 'Mensagem enviada. Obrigado pelo contato!'; form.reset();
  } catch { formStatus.textContent = 'Não foi possível enviar. Seus campos foram preservados; tente novamente.'; }
  finally { button.disabled = false; label.textContent = 'Enviar mensagem'; }
});
