/** A small zero-gravity toy that keeps the portfolio link's native click behavior. */
export function setupKnight() {
  const link = document.querySelector('.knight-link');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const position = { x:0, y:0 };
  const velocity = { x:0, y:0 };
  let bounds, drag = null, suppressClick = false;
  let frame = 0, lastTime = 0, tilt = 0, tiltSpeed = 0, scale = 1, scaleSpeed = 0;
  const inGalaxy = () => document.body.dataset.world === 'galaxy';
  const available = () => inGalaxy() && !document.body.classList.contains('is-traveling');
  const quiet = () => reduced.matches || document.body.classList.contains('motion-paused');
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

  function paint() {
    link.style.setProperty('--knight-x', `${position.x}px`);
    link.style.setProperty('--knight-y', `${position.y}px`);
    link.style.setProperty('--knight-tilt', `${tilt}deg`);
    link.style.setProperty('--knight-scale', scale);
  }

  function measure() {
    if (!inGalaxy()) return;
    const rect = link.getBoundingClientRect();
    const baseX = rect.left - position.x, baseY = rect.top - position.y;
    const margin = 20; // Room for the character's tilt as well as the link itself.
    const top = document.querySelector('.site-header').getBoundingClientRect().bottom + 12;
    const bottom = document.querySelector('.journey-rail').getBoundingClientRect().top - 20;
    bounds = {
      left:margin - baseX, right:Math.max(margin - baseX, innerWidth - margin - rect.width - baseX),
      top:top - baseY, bottom:Math.max(top - baseY, bottom - rect.height - baseY)
    };
    position.x = clamp(position.x, bounds.left, bounds.right);
    position.y = clamp(position.y, bounds.top, bounds.bottom);
    paint();
  }

  function wake() {
    if (!frame && available() && !document.hidden) frame = requestAnimationFrame(tick);
  }

  function stop() {
    cancelAnimationFrame(frame);
    frame = lastTime = 0;
    velocity.x = velocity.y = tilt = tiltSpeed = scaleSpeed = 0;
    scale = 1;
    paint();
  }

  function tick(time) {
    frame = 0;
    if (!available() || document.hidden) { stop(); return; }
    const dt = Math.min((time - (lastTime || time - 16.67)) / 1000, 1 / 30);
    lastTime = time;
    if (!bounds) measure();
    if (drag?.moved) {
      // About 30 ms of follow-through: close to the hand, without rigid event-by-event jumps.
      const follow = quiet() ? 1 : 1 - Math.exp(-34 * dt);
      position.x += (drag.target.x - position.x) * follow;
      position.y += (drag.target.y - position.y) * follow;
    } else if (!drag && !quiet()) {
      // Integrate exponential drag, keeping the throw consistent across frame rates.
      const damping = Math.exp(-.85 * dt);
      const travel = (1 - damping) / .85;
      position.x += velocity.x * travel;
      position.y += velocity.y * travel;
      velocity.x *= damping;
      velocity.y *= damping;
    }
    for (const [axis, min, max] of [['x', bounds.left, bounds.right], ['y', bounds.top, bounds.bottom]]) {
      if (position[axis] < min || position[axis] > max) {
        position[axis] = clamp(position[axis], min, max);
        if (!drag) velocity[axis] *= -.58;
      }
    }
    if (quiet()) {
      tilt = tiltSpeed = scaleSpeed = 0;
      scale = 1;
      velocity.x = velocity.y = 0;
    } else {
      const tiltTarget = clamp((drag?.moved ? drag.vx : velocity.x) * .025, -28, 28);
      // A softly damped rotational spring makes changes of direction feel like weight.
      tiltSpeed += ((tiltTarget - tilt) * 95 - tiltSpeed * 15) * dt;
      tilt += tiltSpeed * dt;
      scaleSpeed += (((drag ? 1.12 : 1) - scale) * 180 - scaleSpeed * 19) * dt;
      scale += scaleSpeed * dt;
    }
    paint();
    const moving = Math.hypot(velocity.x, velocity.y) > 4;
    const settling = Math.abs(tilt) > .05 || Math.abs(tiltSpeed) > .1 || Math.abs(scale - 1) > .001 || Math.abs(scaleSpeed) > .01;
    if (drag || moving || settling) wake();
    else stop();
  }

  function finish(cancelled = false) {
    if (!drag) return;
    const previous = drag;
    drag = null;
    suppressClick = previous.moved;
    if (cancelled) {
      Object.assign(position, previous.origin);
      velocity.x = velocity.y = 0;
      paint();
      if (inGalaxy()) measure();
    } else if (previous.moved && quiet()) {
      Object.assign(position, previous.target);
      paint();
    } else if (previous.moved && !quiet()) {
      // Holding before release means placing him; a flick means throwing him.
      const freshness = Math.exp(-Math.max(0, performance.now() - previous.lastMove - 70) / 90);
      velocity.x = clamp(previous.vx * freshness, -1600, 1600);
      velocity.y = clamp(previous.vy * freshness, -1600, 1600);
    }
    link.classList.remove('is-dragging');
    if (link.hasPointerCapture(previous.id)) link.releasePointerCapture(previous.id);
    wake();
  }

  link.addEventListener('dragstart', event => { if (inGalaxy()) event.preventDefault(); });
  link.addEventListener('pointerdown', event => {
    suppressClick = false;
    if (!available() || drag || !event.isPrimary || event.button !== 0 || !event.target.closest('.knight-model')) return;
    measure();
    velocity.x = velocity.y = 0;
    drag = {
      id:event.pointerId, x:event.clientX, y:event.clientY,
      lastX:event.clientX, lastY:event.clientY, lastMove:performance.now(), vx:0, vy:0,
      origin:{ ...position }, target:{ ...position }, moved:false
    };
    link.setPointerCapture(event.pointerId);
    wake();
  });
  link.addEventListener('pointermove', event => {
    if (!drag || event.pointerId !== drag.id) return;
    if (!available()) { finish(true); return; }
    const dx = event.clientX - drag.x, dy = event.clientY - drag.y;
    if (!drag.moved && Math.hypot(dx, dy) < 6) return;
    const now = performance.now(), dt = Math.max(.008, (now - drag.lastMove) / 1000);
    drag.vx = drag.vx * .35 + clamp((event.clientX - drag.lastX) / dt, -2000, 2000) * .65;
    drag.vy = drag.vy * .35 + clamp((event.clientY - drag.lastY) / dt, -2000, 2000) * .65;
    drag.lastX = event.clientX;
    drag.lastY = event.clientY;
    drag.lastMove = now;
    drag.target = {
      x:clamp(drag.origin.x + dx, bounds.left, bounds.right),
      y:clamp(drag.origin.y + dy, bounds.top, bounds.bottom)
    };
    drag.moved = true;
    link.classList.add('is-dragging');
    event.preventDefault();
    wake();
  });
  link.addEventListener('pointerup', event => { if (drag?.id === event.pointerId) finish(); });
  link.addEventListener('pointercancel', event => { if (drag?.id === event.pointerId) finish(true); });
  link.addEventListener('lostpointercapture', () => finish(true));
  link.addEventListener('click', event => {
    if (suppressClick && event.detail !== 0) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
    suppressClick = false;
  }, true);
  link.addEventListener('keydown', event => {
    if (!available()) return;
    const directions = { ArrowLeft:[-1,0], ArrowRight:[1,0], ArrowUp:[0,-1], ArrowDown:[0,1] };
    if (event.key === 'Escape') {
      event.preventDefault();
      finish(true);
      stop();
      position.x = position.y = 0;
      paint();
      measure();
    } else if (directions[event.key] && !event.altKey && !event.ctrlKey && !event.metaKey) {
      event.preventDefault();
      measure();
      const [x, y] = directions[event.key];
      if (quiet()) {
        position.x += x * 12;
        position.y += y * 12;
        paint();
        measure();
      } else {
        const impulse = event.shiftKey ? 650 : 240;
        velocity.x = clamp(velocity.x + x * impulse, -1600, 1600);
        velocity.y = clamp(velocity.y + y * impulse, -1600, 1600);
        wake();
      }
    }
  });
  addEventListener('resize', () => { finish(true); measure(); });
  new ResizeObserver(measure).observe(link);
  new MutationObserver(() => {
    if (!available() || quiet()) { finish(true); stop(); }
    if (inGalaxy()) measure();
  }).observe(document.body, { attributes:true, attributeFilter:['data-world', 'class'] });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { finish(true); stop(); }
  });
}
