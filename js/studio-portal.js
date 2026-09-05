/* The moon opens a blue-to-pink portal before leaving for the studio. */
(() => {
  'use strict';

  const links = [...document.querySelectorAll('[data-studio-portal]')];
  const moon = document.querySelector('.moon-logo');
  const root = document.documentElement;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const status = document.querySelector('#navigation-status');
  let departure = null;
  if (!moon || !links.length) return;

  function reset({ focus = false } = {}) {
    if (!departure) return;
    const state = departure;
    departure = null;
    clearTimeout(state.safetyTimer);
    clearTimeout(state.arrivalTimer);
    state.animations.forEach(animation => animation.cancel());
    state.overlay.remove();
    state.surfaces.forEach(([element, inert]) => { element.inert = inert; });
    root.classList.remove('studio-departing');
    if (status) status.textContent = state.previousStatus;
    if (focus) state.trigger.focus({ preventScroll: true });
  }

  function navigate(state) {
    if (departure !== state || state.navigating) return;
    state.navigating = true;
    clearTimeout(state.safetyTimer);
    // Hold the colorful arrival frame while the other origin loads.
    window.location.assign(state.url);
  }

  function openPortal(event) {
    const trigger = event.currentTarget;
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey ||
        event.shiftKey || event.altKey || trigger.hasAttribute('download') ||
        (trigger.target && trigger.target !== '_self')) return;
    if (departure) { event.preventDefault(); return; }
    if (!moon.animate || !moon.complete || !moon.naturalWidth) return;
    const rect = moon.getBoundingClientRect();
    const style = getComputedStyle(moon);
    const size = parseFloat(style.width);
    if (!size || !rect.width || !rect.height) return;
    event.preventDefault();

    const overlay = document.createElement('div');
    overlay.className = 'studio-portal';
    overlay.setAttribute('aria-hidden', 'true');
    const state = departure = {
      overlay, trigger, url: trigger.href, animations: [], navigating: false,
      previousStatus: status?.textContent || '',
      surfaces: [...document.querySelectorAll('.stage, .sidebar')].map(element => [element, element.inert])
    };

    try {
      const width = root.clientWidth;
      const height = innerHeight;
      const diameter = Math.ceil(Math.hypot(width, height)) + 8;
      const logoSize = Math.min(size * 1.12, 360, width * .48, height * .5);
      const x = rect.left + rect.width / 2 - width / 2;
      const y = rect.top + rect.height / 2 - height / 2;
      const rotation = style.transform === 'none' ? 0 : (() => {
        const matrix = new DOMMatrixReadOnly(style.transform);
        return Math.atan2(matrix.b, matrix.a) * 180 / Math.PI;
      })();
      const field = document.createElement('div');
      field.className = 'studio-portal-field';
      Object.assign(field.style, {
        width: `${diameter}px`, height: `${diameter}px`,
        left: `${(width - diameter) / 2}px`, top: `${(height - diameter) / 2}px`
      });
      // Match the gradient to the image's upper blue and lower pink, rather
      // than leaving a flat blue field around a visibly cropped pink circle.
      field.style.setProperty('--portal-blue-stop', `${50 - logoSize / diameter * 8}%`);
      field.style.setProperty('--portal-pink-stop', `${50 + logoSize / diameter * 46}%`);
      const image = document.createElement('img');
      image.className = 'studio-portal-logo';
      image.src = moon.currentSrc || moon.src;
      image.alt = '';
      image.draggable = false;
      Object.assign(image.style, {
        width: `${logoSize}px`, height: `${logoSize}px`,
        left: `${(width - logoSize) / 2}px`, top: `${(height - logoSize) / 2}px`
      });
      overlay.append(field, image);
      document.body.append(overlay);

      let flight;
      if (reduced.matches) {
        flight = overlay.animate([{ opacity: 0 }, { opacity: 1 }], {
          duration: 160, easing: 'ease-out', fill: 'both'
        });
        state.animations.push(flight);
      } else {
        const timing = { duration: 1000, easing: 'cubic-bezier(.45, 0, .18, 1)', fill: 'both' };
        flight = field.animate([
          { transform: `translate(${x}px, ${y}px) scale(${size / diameter})` },
          { transform: 'translate(0px, 0px) scale(1)' }
        ], timing);
        state.animations.push(flight);
        state.animations.push(image.animate([
          { transform: `translate(${x}px, ${y}px) scale(${size / logoSize}) rotate(${rotation}deg)` },
          { transform: 'translate(0px, 0px) scale(1) rotate(0deg)' }
        ], timing));
      }
      state.surfaces.forEach(([element]) => { element.inert = true; });
      root.classList.add('studio-departing');
      document.body.classList.remove('cat-pointer');
      if (status) status.textContent = 'Abrindo o Goiaba Lunar…';
      flight.finished.then(() => {
        if (departure === state) state.arrivalTimer = setTimeout(() => navigate(state), 450);
      }).catch(() => {});
      state.safetyTimer = setTimeout(() => navigate(state), 2600);
    } catch {
      reset();
      window.location.assign(trigger.href);
    }
  }

  links.forEach(link => link.addEventListener('click', openPortal));
  for (const type of ['click', 'wheel', 'touchmove', 'keydown']) {
    window.addEventListener(type, event => {
      if (!departure || event.metaKey || event.ctrlKey || event.altKey) return;
      if (event.type === 'keydown' && event.key === 'Escape' && !departure.navigating) reset({ focus: true });
      event.preventDefault();
      event.stopImmediatePropagation();
    }, { capture: true, passive: false });
  }
  window.addEventListener('resize', () => { if (departure && !departure.navigating) reset({ focus: true }); });
  document.addEventListener('portfolio:sectionchange', () => reset());
  reduced.addEventListener('change', () => { if (departure && !departure.navigating) reset({ focus: true }); });
  window.addEventListener('pagehide', () => reset());
  window.addEventListener('pageshow', () => reset());
})();
