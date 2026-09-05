(() => {
  'use strict';
  const section = document.querySelector('#contato');
  const stage = section?.querySelector('.cyclops-scene');
  const svg = stage?.querySelector('.cyclops-art > svg');
  if (!svg) return;
  const arm = svg.querySelector('.cyclops-club-arm');
  const body = svg.querySelector('.cyclops-body');
  const head = svg.querySelector('.cyclops-head');
  const pupil = svg.querySelector('.cyclops-pupil');
  const shadow = svg.querySelector('.cyclops-shadow');
  const provoke = stage.querySelector('.cyclops-provoke');
  const hint = stage.querySelector('.cyclops-hint');
  const announcement = section.querySelector('.cyclops-status');
  const contactForm = section.querySelector('form');
  const impact = stage.querySelector('.cyclops-impact');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const fine = matchMedia('(hover: hover) and (pointer: fine)');
  const animations = new Set();
  const timers = new Set();
  const shoulder = { x: 344, y: 246 };
  const crown = { x: 433, y: 73 };
  const restAngle = Math.atan2(crown.y - shoulder.y, crown.x - shoulder.x);
  const reach = Math.hypot(crown.x - shoulder.x, crown.y - shoulder.y);
  let active = document.body.dataset.section === 'contato';
  let busy = false;
  let frame = 0;
  let dwell = 0;
  let cooldown = 0;
  let lastAttempt = null;
  let pointer = { x: 0, y: 0, inside: false };
  let manual = false;

  const cursor = document.createElement('div');
  cursor.className = 'contact-head-cursor';
  cursor.setAttribute('aria-hidden', 'true');
  cursor.innerHTML = `<svg viewBox="0 0 40 40" fill="none"><g class="cursor-face" stroke="currentColor" stroke-width="1.35" stroke-linecap="round" stroke-linejoin="round"><path d="M8 18c-5-4-7 2-4 6l4 2m24-8c5-4 7 2 4 6l-4 2" fill="#eee7d8"/><path d="M8 17C7 8 12 3 20 3c9 0 14 6 13 15l-1 9c-1 5-7 10-12 10S9 32 8 27Z" fill="#eee7d8"/><path d="M9 14c2-2 3-5 3-7 2 3 5 4 8 3m-3-5c2 4 6 6 11 5m-3-4c2 2 5 4 7 8"/><path d="m11 17 5-1m8-1c2-1 4 0 5 1"/><path d="M12 21c1-1 3-1 4 0m8-1c1-1 3-1 4 0" stroke-width="1.1"/><path d="M14 21v1m12-2v1" stroke-width="2.2"/><path d="m20 20-2 6 3 1m-6 3c3 2 7 2 10-1"/><path d="m6 21 1 2m27-2-1 2m-22 3 2 1m14-1 2-1" stroke-width=".8"/></g></svg>`;
  document.body.append(cursor, impact);
  const face = cursor.querySelector('.cursor-face');
  arm.style.transformBox = 'view-box';
  arm.style.transformOrigin = `${shoulder.x}px ${shoulder.y}px`;
  provoke.hidden = false;

  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  function later(callback, delay) {
    const id = setTimeout(() => { timers.delete(id); callback(); }, delay);
    timers.add(id);
    return id;
  }
  function animate(element, frames, options) {
    const animation = element.animate(frames, { fill: 'forwards', ...options });
    animations.add(animation);
    // Finished animations are canceled too, so reentry always starts from CSS.
    return animation;
  }
  function localPoint(x, y) {
    const matrix = svg.getScreenCTM();
    if (!matrix) return null;
    return new DOMPoint(x, y).matrixTransform(matrix.inverse());
  }
  function screenPoint(point) {
    const matrix = svg.getScreenCTM();
    return matrix ? new DOMPoint(point.x, point.y).matrixTransform(matrix) : null;
  }
  function placeCursor(point) { cursor.style.transform = `translate3d(${point.x - 18}px, ${point.y - 18}px, 0)`; }
  function hideCursor() {
    document.body.classList.remove('contact-head-active');
    cursor.classList.remove('is-bait');
    pointer.inside = false;
  }
  function state(value, message) {
    stage.dataset.state = value;
    if (message) hint.textContent = message;
  }
  function clearDwell() {
    clearTimeout(dwell);
    timers.delete(dwell);
    dwell = 0;
  }
  function reset({ resting = false } = {}) {
    timers.forEach(clearTimeout);
    timers.clear();
    animations.forEach(animation => animation.cancel());
    animations.clear();
    cancelAnimationFrame(frame);
    frame = 0;
    dwell = 0;
    busy = false;
    manual = false;
    lastAttempt = null;
    cooldown = 0;
    hideCursor();
    pupil.style.transform = '';
    state(resting ? 'resting' : 'idle', resting ? 'Trégua. A sua ideia está em boas mãos.' : 'Cuidado. Ele leva o espaço pessoal a sério.');
  }
  function aimAt(point) {
    pupil.style.transform = `translate(${clamp((point.x - 253) * .065, -8, 8)}px, ${clamp((point.y - 174) * .045, -5, 5)}px)`;
  }
  function withinClubReach(point) {
    // He watches both sides, but never swings the club through his own face.
    return point.x > shoulder.x && point.y > 90 && point.y < 450
      && Math.hypot(point.x - shoulder.x, point.y - shoulder.y) <= reach * 1.18;
  }
  function aimPose(point) {
    let angle = (Math.atan2(point.y - shoulder.y, point.x - shoulder.x) - restAngle) * 180 / Math.PI;
    while (angle > 180) angle -= 360;
    while (angle < -180) angle += 360;
    angle = clamp(angle, -112, 180);
    const scale = clamp(Math.hypot(point.x - shoulder.x, point.y - shoulder.y) / reach, .65, 1.18);
    const radians = restAngle + angle * Math.PI / 180;
    return { angle, scale, tip: { x: shoulder.x + Math.cos(radians) * reach * scale, y: shoulder.y + Math.sin(radians) * reach * scale } };
  }
  function strike(target, explicitly = false) {
    if (!active || busy || document.hidden) return;
    clearDwell();
    if (reduced.matches) {
      state('resting', 'Ele viu você. Hoje, resolveu deixar passar.');
      announcement.textContent = 'O ciclope viu você e deixou passar. Pode escrever sua mensagem.';
      return;
    }
    busy = true;
    manual = explicitly;
    lastAttempt = { x: pointer.x, y: pointer.y };
    cooldown = performance.now() + 1700;
    aimAt(target);
    const pose = aimPose(target);
    const windup = pose.angle < 0 ? 23 : -26;
    state('windup', 'Ei… cuidado com a cabeça.');
    if (explicitly) {
      const bait = screenPoint(pose.tip);
      if (bait) { placeCursor(bait); cursor.classList.add('is-bait'); }
    }
    animate(arm, [{ transform: 'rotate(0deg)' }, { transform: `rotate(${windup}deg)` }], { duration: 470, easing: 'cubic-bezier(.22,.8,.25,1)' });
    animate(body, [{ transform: 'rotate(0deg)' }, { transform: `rotate(${pose.angle < 0 ? 2 : -3}deg)` }], { duration: 470, easing: 'ease-out' });
    animate(head, [{ transform: 'rotate(0deg)' }, { transform: 'rotate(-5deg) translateY(3px)' }], { duration: 430, easing: 'ease-out' });

    later(() => {
      if (!active) return;
      state('strike');
      animate(body, [{ transform: `rotate(${pose.angle < 0 ? 2 : -3}deg)` }, { transform: 'rotate(0deg)' }], { duration: 150, easing: 'ease-in' });
      animate(arm, [{ transform: `rotate(${windup}deg) scale(1)` }, { transform: `rotate(${pose.angle}deg) scale(${pose.scale})` }], { duration: 170, easing: 'cubic-bezier(.7,0,1,.45)' });
      later(() => {
        const tip = screenPoint(pose.tip);
        if (!tip) { reset(); return; }
        const hit = explicitly || (pointer.inside && Math.hypot(pointer.x - tip.x, pointer.y - tip.y) < 42);
        impact.style.left = `${tip.x}px`;
        impact.style.top = `${tip.y}px`;
        impact.querySelector('span').textContent = hit ? 'POW!' : 'Opa!';
        animate(impact, [{ opacity: 0, transform: 'scale(.6) rotate(-5deg)' }, { opacity: 1, transform: 'scale(1.15) rotate(2deg)', offset: .2 }, { opacity: 0, transform: 'scale(1.05) translateY(-16px)' }], { duration: 520, easing: 'ease-out' });
        animate(shadow, [{ transform: 'scaleX(1)' }, { transform: 'scaleX(1.07)', offset: .25 }, { transform: 'scaleX(1)' }], { duration: 360, easing: 'ease-out' });
        if (hit) animate(face, [
          { transform: 'scale(1)' },
          { transform: 'scale(1.85,.18) rotate(-8deg)', offset: .13 },
          { transform: 'scale(1.85,.18) rotate(-8deg)', offset: .36 },
          { transform: 'scale(.82,1.28) rotate(4deg)', offset: .7 },
          { transform: 'scale(1.08,.92)', offset: .87 },
          { transform: 'scale(1)' }
        ], { duration: 650, easing: 'ease-out' });
        state('recover', hit ? 'Nada que uma boa ideia não resolva.' : 'Por pouco. Ele precisa treinar a mira.');
        if (explicitly) announcement.textContent = 'Pof! O ciclope acertou a cabeça de brincadeira. Ela já se recuperou. O formulário continua disponível.';
        later(() => {
          animate(arm, [{ transform: `rotate(${pose.angle}deg) scale(${pose.scale})` }, { transform: 'rotate(-5deg) scale(1)', offset: .8 }, { transform: 'rotate(0deg) scale(1)' }], { duration: 510, easing: 'cubic-bezier(.22,.8,.25,1)' });
          animate(head, [{ transform: 'rotate(-5deg) translateY(3px)' }, { transform: 'rotate(0deg)' }], { duration: 400, easing: 'ease-out' });
          later(() => {
            animations.forEach(animation => animation.cancel());
            animations.clear();
            busy = false;
            manual = false;
            cursor.classList.remove('is-bait');
            state('idle');
          }, 530);
        }, 150);
      }, 175);
    }, 470);
  }

  function pointerStep() {
    frame = 0;
    if (!pointer.inside || !active || reduced.matches) return;
    if (!manual) placeCursor(pointer);
    const point = localPoint(pointer.x, pointer.y);
    if (!point) return;
    aimAt(point);
    const close = withinClubReach(point);
    if (busy) return;
    state(close ? 'watching' : 'idle');
    if (!close) { clearDwell(); return; }
    const moved = !lastAttempt || Math.hypot(pointer.x - lastAttempt.x, pointer.y - lastAttempt.y) > 35;
    if (!dwell && moved && performance.now() > cooldown) dwell = later(() => {
      dwell = 0;
      if (!pointer.inside || busy) return;
      const current = localPoint(pointer.x, pointer.y);
      if (current && withinClubReach(current)) strike(current);
    }, 190);
  }
  section.addEventListener('pointermove', event => {
    if (!active || event.pointerType !== 'mouse' || !fine.matches || reduced.matches) return;
    if (event.target.closest('form,a,button,input,textarea,select') || contactForm.contains(document.activeElement)) {
      hideCursor();
      clearDwell();
      return;
    }
    pointer = { x: event.clientX, y: event.clientY, inside: true };
    document.body.classList.add('contact-head-active');
    if (!frame) frame = requestAnimationFrame(pointerStep);
  }, { passive: true });
  section.addEventListener('pointerleave', () => { hideCursor(); clearDwell(); });
  contactForm.addEventListener('pointerenter', () => reset({ resting: true }));
  contactForm.addEventListener('focusin', () => reset({ resting: true }));
  provoke.addEventListener('click', () => {
    if (busy) return;
    strike({ x: 459, y: 391 }, true);
  });
  document.addEventListener('portfolio:sectionchange', event => {
    active = event.detail.id === 'contato';
    reset();
    announcement.textContent = '';
  });
  document.addEventListener('visibilitychange', () => { if (document.hidden) reset(); });
  window.addEventListener('blur', () => reset());
  window.addEventListener('resize', () => reset(), { passive: true });
  section.querySelector('.scene-scroll').addEventListener('scroll', () => reset(), { passive: true });
  reduced.addEventListener('change', () => reset());
  fine.addEventListener('change', () => reset());
  section.addEventListener('keydown', event => { if (event.key === 'Escape') reset(); });
})();
