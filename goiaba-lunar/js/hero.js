/** The galaxy's first screen: Morfeu plots a course to whichever world is being
 * looked at, and that world shows its own medium for a moment. The planets'
 * shaders are driven by StudioObjects; this module owns the page layer. */
const NAMES = { cindra:'Cindra', commissionmatch:'CommissionMatch', mangue:'Mangue' };
import { createInkStory } from './ink.js';

const ROUTE_COLORS = { cindra:'#f4b894', commissionmatch:'#e6d8a8', mangue:'#9fdcc4' };
const RESTING_MESSAGE = 'Escolha um mundo.<br>Eu vou com você.';

export function setupHero(objects) {
  const galaxy = document.querySelector('#galaxia');
  const route = document.querySelector('#flight-route');
  const line = route.querySelector('.route-line');
  const draw = route.querySelector('.route-draw');
  const target = route.querySelector('.route-target');
  const ship = document.querySelector('#morfeu .ship-model');
  const message = document.querySelector('#morfeu-message');
  // The page stands still until the story brings it back to life.
  const ink = createInkStory(document.querySelector('#ink-script'), {
    onBloom: () => objects.setTempo?.(1), onEnd: () => objects.setTempo?.(1),
  });
  const narrow = matchMedia('(max-width: 760px)');
  let active = null, frame = 0;

  /** Morfeu's course to the active world, in viewport coordinates. */
  function course() {
    if (!active || galaxy.hidden) return null;
    const from = ship.getBoundingClientRect();
    const to = active.element.querySelector('.planet-art').getBoundingClientRect();
    if (!from.width || !to.width) return null;
    const sx = from.left + from.width * .6, sy = from.top + from.height * .38;
    const cx = to.left + to.width / 2, cy = to.top + to.height / 2;
    const distance = Math.hypot(cx - sx, cy - sy) || 1;
    // Stop at the atmosphere instead of disappearing into the planet.
    const rim = to.width * (active.world === 'commissionmatch' ? .34 : .46);
    const ex = cx - (cx - sx) / distance * rim, ey = cy - (cy - sy) / distance * rim;
    const nx = -(ey - sy) / distance, ny = (ex - sx) / distance;
    const bend = Math.min(150, distance * .24);
    // Arc to whichever side keeps the course clearest of the other worlds.
    const others = [...galaxy.querySelectorAll('.planet')].filter(planet => planet !== active.element)
      .flatMap(planet => [...planet.querySelectorAll('.planet-art, .planet-name, .planet-description')]).map(part => {
        const r = part.getBoundingClientRect();
        return [r.left + r.width / 2, r.top + r.height / 2];
      });
    const clearance = side => {
      const qx = (sx + ex) / 2 + nx * bend * side, qy = (sy + ey) / 2 + ny * bend * side;
      let nearest = Infinity;
      for (let i = 1; i < 10; i++) {
        const t = i / 10, x = (1 - t) ** 2 * sx + 2 * (1 - t) * t * qx + t * t * ex, y = (1 - t) ** 2 * sy + 2 * (1 - t) * t * qy + t * t * ey;
        for (const [ox, oy] of others) nearest = Math.min(nearest, Math.hypot(x - ox, y - oy));
      }
      return nearest;
    };
    const side = clearance(1) > clearance(-1) ? 1 : -1;
    return { sx, sy, qx:(sx + ex) / 2 + nx * bend * side, qy:(sy + ey) / 2 + ny * bend * side, ex, ey };
  }

  function plot() {
    frame = 0;
    const c = course();
    if (!c) return;
    const box = galaxy.getBoundingClientRect();
    const [sx, sy, qx, qy, ex, ey] = [c.sx - box.left, c.sy - box.top, c.qx - box.left, c.qy - box.top, c.ex - box.left, c.ey - box.top];
    const path = `M${sx.toFixed(1)} ${sy.toFixed(1)}Q${qx.toFixed(1)} ${qy.toFixed(1)} ${ex.toFixed(1)} ${ey.toFixed(1)}`;
    line.setAttribute('d', path);
    draw.setAttribute('d', path);
    target.setAttribute('cx', ex.toFixed(1));
    target.setAttribute('cy', ey.toFixed(1));
    // The layers drift with the pointer, so the course follows them.
    if (!objects.paused) frame = requestAnimationFrame(plot);
  }

  document.addEventListener('planet-focus', ({ detail }) => {
    const { world, on, element } = detail;
    element?.classList.toggle('is-revealed', on);
    if (on) {
      active = { world, element };
      route.style.setProperty('--route', ROUTE_COLORS[world]);
      route.classList.remove('is-plotted');
      cancelAnimationFrame(frame);
      endStory();
      if (world === 'mangue') {
        // Mangue's course is not plotted but written: see ink.js.
        // On phones the handwriting takes the place of Morfeu's message (hero.css).
        const parts = `.planet-art, .planet-label, .lunar, .galaxy-intro h1, .galaxy-intro p, #morfeu .ship-model, .studio-brand${narrow.matches ? '' : ', .morfeu-companion p'}`;
        const obstacles = () => [...document.querySelectorAll(parts)]
          .map(part => part.getBoundingClientRect()).filter(r => r.width);
        objects.setTempo?.(0);
        ink.start(course, { paused:objects.paused, obstacles });
        message.innerHTML = 'Era uma vez uma rota.<br>Vamos a Mangue?';
        return;
      }
      plot();
      route.getBoundingClientRect();
      route.classList.add('is-plotted');
      message.innerHTML = `Rota traçada para ${NAMES[world]}.<br>Vamos?`;
    } else if (active?.world === world) {
      const flying = world === 'mangue' && location.hash === '#mangue' && !objects.paused && ink.hold();
      active = null;
      cancelAnimationFrame(frame);
      frame = 0;
      if (flying) enterStory(); else endStory();
      route.classList.remove('is-plotted');
      message.innerHTML = RESTING_MESSAGE;
    }
  });

  // Flying to Mangue is flying into the story: the page stays written while
  // Morfeu crosses it, turns back to paper as he enters the atmosphere, and
  // lifts away when the world is revealed.
  let voyage = null;
  function endStory() {
    voyage?.watch.disconnect();
    clearTimeout(voyage?.timer);
    voyage = null;
    ink.stop();
    document.body.classList.remove('ink-voyage', 'ink-dive', 'ink-closing');
  }
  function enterStory() {
    const body = document.body;
    objects.setTempo?.(1);
    body.classList.add('ink-voyage');
    const finish = () => {
      watch.disconnect();
      clearTimeout(voyage.timer);
      body.classList.add('ink-closing');
      voyage.timer = setTimeout(endStory, 1300);
    };
    const watch = new MutationObserver(() => {
      if (body.dataset.flightPhase === 'entry' && !body.classList.contains('ink-dive')) body.classList.add('ink-dive');
      if (body.classList.contains('flight-revealed') || (seen && !body.classList.contains('is-traveling'))) finish();
      seen ||= body.classList.contains('is-traveling');
    });
    let seen = body.classList.contains('is-traveling');
    watch.observe(body, { attributes:true, attributeFilter:['class', 'data-flight-phase'] });
    // If no flight follows (it could not start), close the page anyway.
    voyage = { watch, timer:setTimeout(() => { if (!seen) finish(); }, 400) };
  }

  // Leaving the galaxy by click never produces a pointerleave; start clean.
  addEventListener('hashchange', () => Object.keys(NAMES).forEach(world => objects.preview(world, false)));

  // Touch screens have no hover: the galaxy shows its worlds in turn instead,
  // until the visitor touches something.
  const touch = matchMedia('(hover: none)');
  let showcase = 0, index = 0, showing = null, interacted = false;
  addEventListener('pointerdown', () => { interacted = true; }, { passive:true, capture:true });
  function tour() {
    if (showing) { objects.preview(showing, false); showing = null; }
    const ready = touch.matches && !interacted && !objects.paused && !galaxy.hidden && !document.hidden
      && !document.body.classList.contains('is-arriving') && !document.body.classList.contains('is-traveling');
    if (ready) {
      showing = Object.keys(NAMES)[index++ % 3];
      objects.preview(showing, true);
    }
    // Mangue's mangrove needs longer to grow than the others take to turn.
    showcase = setTimeout(tour, showing === 'mangue' ? 5600 : showing ? 3200 : 2400);
  }
  if (touch.matches) showcase = setTimeout(tour, 2600);
  return { stop() { clearTimeout(showcase); if (showing) objects.preview(showing, false); } };
}
