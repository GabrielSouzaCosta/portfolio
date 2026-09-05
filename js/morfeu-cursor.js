/* Morfeu is decorative: native targets receive every pointer and keyboard event. */
(() => {
  'use strict';
  const cursor = document.querySelector('.cat-cursor');
  const studio = document.querySelector('#estudio');
  if (!cursor || !studio) return;

  const fine = matchMedia('(hover: hover) and (pointer: fine)');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const position = cursor.querySelector('.morfeu-position');
  const pupils = cursor.querySelector('.morfeu-pupils');
  const eyes = cursor.querySelector('.morfeu-blink');
  const ears = [...cursor.querySelectorAll('.morfeu-ear')];
  const heart = cursor.querySelector('.morfeu-love');
  const reactions = new Set();
  let active = false;
  let frame = 0;
  let restTimer = 0;
  let sleepTimer = 0;
  let x = 0, y = 0, previousX = 0, previousY = 0;
  let lastMove = 0;
  let viewportWidth = innerWidth, viewportHeight = innerHeight;

  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

  function clearReactions() {
    reactions.forEach(animation => animation.cancel());
    reactions.clear();
    cursor.classList.remove('is-petting');
  }

  function reset() {
    active = false;
    cancelAnimationFrame(frame);
    clearTimeout(restTimer);
    clearTimeout(sleepTimer);
    frame = restTimer = sleepTimer = 0;
    clearReactions();
    document.body.classList.remove('cat-pointer');
    cursor.classList.remove('is-moving', 'is-curious', 'is-sleeping');
    cursor.style.setProperty('--morfeu-tilt', '0deg');
    cursor.style.setProperty('--morfeu-look-x', '0px');
    cursor.style.setProperty('--morfeu-look-y', '0px');
    pupils.style.transform = '';
  }

  function scheduleRest() {
    clearTimeout(restTimer);
    clearTimeout(sleepTimer);
    cursor.classList.remove('is-sleeping');
    restTimer = setTimeout(() => {
      cursor.classList.remove('is-moving');
      cursor.style.setProperty('--morfeu-tilt', '0deg');
      cursor.style.setProperty('--morfeu-look-x', '0px');
      cursor.style.setProperty('--morfeu-look-y', '0px');
      pupils.style.transform = '';
    }, 140);
    sleepTimer = setTimeout(() => {
      if (!active) return;
      cursor.classList.remove('is-curious');
      cursor.classList.add('is-sleeping');
    }, 4800);
  }

  function draw() {
    frame = 0;
    if (!active) return;
    cursor.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    // Flip only the companion's offset at the edges. The star never leaves the click point.
    const offsetX = x > viewportWidth - 108 ? -94 : 10;
    const offsetY = y > viewportHeight - 112 ? -100 : 8;
    position.style.transform = `translate(${offsetX}px, ${offsetY}px)`;
    const dx = x - previousX;
    const dy = y - previousY;
    // Keep the spine level during a walk; turn the silhouette toward deliberate travel.
    if (Math.abs(dx) > 2) cursor.classList.toggle('is-facing-right', dx > 0);
    cursor.style.setProperty('--morfeu-tilt', `${clamp(dx * .06, -2, 2)}deg`);
    cursor.style.setProperty('--morfeu-look-x', `${clamp(dx * .05, -2, 2)}px`);
    cursor.style.setProperty('--morfeu-look-y', `${clamp(dy * .04, -1.5, 1.5)}px`);
    const gazeDirection = cursor.classList.contains('is-moving') && cursor.classList.contains('is-facing-right') ? -1 : 1;
    pupils.style.transform = `translate(${clamp(dx * .08, -2, 2) * gazeDirection}px, ${clamp(dy * .06, -1, 1)}px)`;
    previousX = x;
    previousY = y;
  }

  function canShow(event) {
    return event.pointerType === 'mouse' && fine.matches && !reduced.matches &&
      !document.hidden && document.body.dataset.section === 'estudio' &&
      event.target instanceof Element && studio.contains(event.target);
  }

  function follow(event) {
    if (!canShow(event)) { if (active) reset(); return; }
    const now = performance.now();
    const distance = Math.hypot(event.clientX - x, event.clientY - y);
    const speed = distance / Math.max(8, now - lastMove);
    x = event.clientX;
    y = event.clientY;
    lastMove = now;
    if (!active) {
      previousX = x;
      previousY = y;
      active = true;
      draw();
      document.body.classList.add('cat-pointer');
    }
    cursor.classList.toggle('is-curious', Boolean(event.target.closest('a, button, [role="button"]')));
    const petting = cursor.classList.contains('is-petting');
    if (distance > (petting ? 3 : 1) && speed > .06) {
      if (petting) clearReactions();
      cursor.classList.add('is-moving');
    }
    scheduleRest();
    if (!frame) frame = requestAnimationFrame(draw);
  }

  function react(element, keyframes, options, onfinish) {
    const animation = element.animate(keyframes, options);
    reactions.add(animation);
    animation.onfinish = () => {
      reactions.delete(animation);
      if (onfinish) onfinish();
    };
  }

  window.addEventListener('pointermove', follow, { passive: true });
  window.addEventListener('pointerdown', event => {
    if (!canShow(event) || event.button !== 0) return;
    follow(event);
    cursor.classList.remove('is-moving');
    clearReactions();
    cursor.classList.add('is-petting');
    // A contented slow blink and a soft, slightly staggered ear wiggle.
    // Suspend the ambient eye/ear loops until this gesture has settled.
    ears.forEach((ear, index) => {
      const direction = index === 0 ? -1 : 1;
      react(ear, [
        { transform: 'rotate(0deg)', offset: 0 },
        { transform: `rotate(${direction * 12}deg)`, offset: .24 },
        { transform: `rotate(${direction * 5}deg)`, offset: .46 },
        { transform: `rotate(${direction * 10}deg)`, offset: .65 },
        { transform: 'rotate(0deg)', offset: 1 }
      ], { duration: 800, delay: index * 60, easing: 'ease-in-out' });
    });
    react(eyes, [
      { transform: 'scaleY(1)', offset: 0 },
      { transform: 'scaleY(.2)', offset: .24 },
      { transform: 'scaleY(.16)', offset: .62 },
      { transform: 'scaleY(.75)', offset: .86 },
      { transform: 'scaleY(1)', offset: 1 }
    ], { duration: 1050, easing: 'ease-in-out' }, () => cursor.classList.remove('is-petting'));
    react(heart, [
      { opacity: 0, transform: 'translateY(3px) scale(.5)' },
      { opacity: 1, transform: 'translateY(-2px) scale(1)', offset: .25 },
      { opacity: 0, transform: 'translateY(-15px) scale(.85)' }
    ], { duration: 720, easing: 'ease-out' });
  }, { passive: true });

  document.documentElement.addEventListener('pointerleave', reset);
  window.addEventListener('pointercancel', reset);
  window.addEventListener('blur', reset);
  window.addEventListener('keydown', reset);
  window.addEventListener('resize', () => {
    viewportWidth = innerWidth;
    viewportHeight = innerHeight;
    reset();
  });
  studio.addEventListener('scroll', reset, { capture: true, passive: true });
  document.addEventListener('portfolio:sectionchange', reset);
  document.addEventListener('visibilitychange', reset);
  fine.addEventListener('change', reset);
  reduced.addEventListener('change', reset);
})();
