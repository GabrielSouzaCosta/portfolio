/** Mangue's preview: the galaxy turns into a page. Morfeu's course to Mangue
 * is written by hand, "Era uma vez...", so the letters are the road; as the
 * pen moves, colour comes back to the page, leaves open on the strokes and a
 * trail of light starts to walk the words. */
import { ALLURE } from './ink-glyphs.js';

export const LINE = 'Era uma vez...';
const NS = 'http://www.w3.org/2000/svg';
const PEN_SPEED = 720; // px per second
const LIFT = .07; // seconds between strokes

const element = (name, attributes = {}) => {
  const node = document.createElementNS(NS, name);
  for (const [key, value] of Object.entries(attributes)) node.setAttribute(key, value);
  return node;
};

// Catmull-Rom through the points: the font's polylines become a hand's curves.
function smooth(points) {
  if (points.length < 3) return points.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join('');
  let d = `M${points[0][0].toFixed(1)} ${points[0][1].toFixed(1)}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)], p1 = points[i], p2 = points[i + 1], p3 = points[Math.min(points.length - 1, i + 2)];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += `C${c1[0].toFixed(1)} ${c1[1].toFixed(1)} ${c2[0].toFixed(1)} ${c2[1].toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  return d;
}

/** A polyline measured by length, so words and roads can be laid along it. */
export function measure(points) {
  const table = [];
  let length = 0;
  points.forEach(([x, y], i) => {
    if (i) length += Math.hypot(x - points[i - 1][0], y - points[i - 1][1]);
    table.push([x, y, length]);
  });
  const at = s => {
    const clamped = Math.max(0, Math.min(length, s));
    let lo = 1, hi = table.length - 1;
    while (lo < hi) { const mid = (lo + hi) >> 1; if (table[mid][2] < clamped) lo = mid + 1; else hi = mid; }
    const [x0, y0, l0] = table[lo - 1], [x1, y1, l1] = table[lo];
    const f = l1 > l0 ? (clamped - l0) / (l1 - l0) : 0;
    const segment = Math.hypot(x1 - x0, y1 - y0) || 1;
    const tx = (x1 - x0) / segment, ty = (y1 - y0) / segment;
    const beyond = s - clamped;
    return { x: x0 + (x1 - x0) * f + tx * beyond, y: y0 + (y1 - y0) * f + ty * beyond, tx, ty };
  };
  return { length, at };
}

export const quadratic = ([sx, sy], [qx, qy], [ex, ey], steps = 120) => Array.from({ length: steps + 1 }, (_, i) => {
  const t = i / steps, u = 1 - t;
  return [u * u * sx + 2 * u * t * qx + t * t * ex, u * u * sy + 2 * u * t * qy + t * t * ey];
});

const widthOf = text => [...text].reduce((sum, ch) => sum + ALLURE[ch][0], 0);
// How far the letters reach past their advance box (the E's flourish, loops).
const extent = text => {
  let x = 0, left = 0, right = 0, top = 0, bottom = 0;
  for (const ch of text) {
    const [advance, ...glyph] = ALLURE[ch];
    for (const flat of glyph) for (let i = 0; i < flat.length; i += 2) {
      left = Math.min(left, x + flat[i]); right = Math.max(right, x + flat[i]);
      top = Math.max(top, flat[i + 1]); bottom = Math.min(bottom, flat[i + 1]);
    }
    x += advance;
  }
  return { left, right: Math.max(right, x), top, bottom };
};
const WIDTH = widthOf(LINE);
const BROKEN = ['Era uma', 'vez...'];
const inside = (r, x, y, pad) => x > r.left - pad && x < r.right + pad && y > r.top - pad && y < r.bottom + pad;

/** Where the words go: along the course if some stretch of it is clear of
 * every world and label (largest size first); otherwise in the clearest box
 * between Morfeu and Mangue, on one line or two, with roads joining them. */
export function choosePlacement(course, obstacles) {
  const { length, at } = course;
  const blocked = (x, y) => obstacles.some(r => inside(r, x, y, 6));
  const largest = Math.min(Math.max(innerWidth / 17000, .05), .085);
  for (const scale of [largest, largest * .85, largest * .72]) {
    const span = WIDTH * scale, k = scale / .1;
    let best = null;
    for (let s0 = 20; s0 + span < length - 40; s0 += 8) {
      let clear = true;
      for (let s = s0; clear && s <= s0 + span; s += 12) for (const v of [-18, 0, 24, 48]) {
        const p = at(s);
        if (blocked(p.x + p.ty * v * k, p.y - p.tx * v * k)) { clear = false; break; }
      }
      const score = Math.abs(s0 + span / 2 - length * .55);
      if (clear && (!best || score < best.score)) best = { score, mode: 'course', scale, s0: s0 / length };
    }
    if (best) return best;
  }
  const start = at(0), end = at(length), midX = (start.x + end.x) / 2, midY = (start.y + end.y) / 2;
  for (const scale of [.055, .048, .042, .036, .031]) {
    for (const lines of [[LINE], BROKEN]) {
      const lineGap = 560 * scale, indent = lines.length > 1 ? 380 * scale : 0;
      const bounds = lines.map((line, i) => ({ ...extent(line), shift: i ? indent : 0 }));
      const reachLeft = Math.min(...bounds.map(b => b.left * scale + b.shift));
      const width = Math.max(...bounds.map(b => b.right * scale + b.shift));
      const above = bounds[0].top * scale, below = -bounds.at(-1).bottom * scale + (lines.length - 1) * lineGap;
      let best = null;
      for (let left = 14 - reachLeft; left + width < innerWidth - 12; left += 6) {
        for (let base = 70 + above; base + below < innerHeight - 8; base += 6) {
          let clear = true;
          for (let x = left + reachLeft; clear && x <= left + width; x += 8) for (let y = base - above; y <= base + below; y += 7) {
            if (obstacles.some(r => inside(r, x, y, 12))) { clear = false; break; }
          }
          const score = Math.hypot(left + width / 2 - midX, base - midY);
          if (clear && (!best || score < best.score)) best = { score, mode: 'box', scale, lines, left, base, lineGap, indent };
        }
      }
      if (best) return best;
    }
  }
  return { mode: 'course', scale: largest * .6, s0: .3 };
}

/** Letters as strokes, placed by place(u, v): u along the line, v up. */
export function write(text, place, scale, parts) {
  let x = 0;
  for (const ch of text) {
    const [advance, ...glyph] = ALLURE[ch];
    for (const flat of glyph) {
      const points = [];
      for (let i = 0; i < flat.length; i += 2) points.push(place((x + flat[i]) * scale, flat[i + 1] * scale));
      parts.push({ kind: ch === 'E' ? 'initial' : ch === '.' ? 'dot' : 'letter', points });
    }
    x += advance;
  }
  return x * scale;
}

/** A road hides where it passes behind a world or a label, and emerges
 * from behind Morfeu's ship; only the world it arrives at does not hide it. */
export function roads(points, obstacles, parts, kind = 'road') {
  const [ex, ey] = points.at(-1);
  const hiding = obstacles.filter(r => !inside(r, ex, ey, 14));
  let run = [];
  for (const point of points) {
    if (hiding.some(r => inside(r, point[0], point[1], 3))) { if (run.length > 2) parts.push({ kind, points: run }); run = []; }
    else run.push(point);
  }
  if (run.length > 2) parts.push({ kind, points: run });
}

export function createInkStory(svg, { onBloom = () => {}, onEnd = () => {} } = {}) {
  const letters = svg.querySelector('.ink-letters');
  const leaves = svg.querySelector('.ink-leaves');
  const trail = svg.querySelector('.ink-trail');
  const nib = svg.querySelector('.ink-nib');
  const body = document.body;
  let strokes = [], sprouts = [], frame = 0, started = 0, course = null, key = '', done = false, getCourse = null, still = false, placement = null, obstaclesOf = () => [];

  function layout(c) {
    const course = measure(quadratic([c.sx, c.sy], [c.qx, c.qy], [c.ex, c.ey]));
    const obstacles = obstaclesOf();
    if (!placement || placement.width !== innerWidth) placement = { ...choosePlacement(course, obstacles), width: innerWidth };
    svg.dataset.layout = placement.mode;
    const { scale } = placement, parts = [], k = scale / .1;
    let tail;
    if (placement.mode === 'course') {
      const { length, at } = course;
      const s0 = placement.s0 * length, s1 = s0 + WIDTH * scale;
      const place = (s, v) => { const p = at(s); return [p.x + p.ty * v, p.y - p.tx * v]; };
      // The road out of Morfeu's hangar, a little unsteady, as a pen starting.
      const lead = [];
      for (let s = 0; s <= s0 - 10; s += 7) lead.push(place(s, Math.sin(s / 19) * 2.2));
      if (lead.length > 2) roads(lead, obstacles, parts);
      write(LINE, (u, v) => place(s0 + u, v), scale, parts);
      tail = [];
      for (let s = s1 + 10; s <= length; s += 7) tail.push(place(s, Math.sin((s - s1) / 23) * 3));
    } else {
      const { lines, left, base, lineGap, indent } = placement;
      const first = [left - 8, base];
      roads(quadratic([c.sx, c.sy], [Math.min(c.sx, first[0]) - 24 * k, first[1] - 6 * k], first, 30), obstacles, parts);
      let end = first;
      lines.forEach((line, i) => {
        const x0 = left + (i ? indent : 0), y0 = base + i * lineGap;
        // A hand's baseline drifts a little.
        const width = write(line, (u, v) => [x0 + u, y0 - v + Math.sin(u / 70 + i) * 2.4 * k], scale, parts);
        end = [x0 + width + 6, y0];
      });
      // The road runs on to Mangue if it can do so in the open; otherwise
      // (on phones, under the ship) the line ends in a flourish.
      const road = quadratic(end, [(end[0] + c.ex) / 2, Math.max(end[1], c.ey) + 12 * k], [c.ex, c.ey], 40);
      const hidden = road.filter(([x, y]) => obstacles.some(r => !inside(r, c.ex, c.ey, 14) && inside(r, x, y, 3))).length;
      tail = hidden < road.length * .2 ? road : quadratic(end, [end[0] + 40 * k, end[1] + 4 * k], [end[0] + 70 * k, end[1] - 22 * k], 20);
    }
    // After the words the road runs on to Mangue and forks: stories branch.
    if (tail.length > 2) roads(tail, obstacles, parts);
    const { length, at } = measure(tail.length > 1 ? tail : [[c.ex - 1, c.ey], [c.ex, c.ey]]);
    const fork = [], reach = 80 * k, radius = 7 * k;
    const p = at(length * .38), down = [-p.ty, p.tx];
    for (let i = 0; i <= 14; i++) {
      const u = i / 14, along = u * reach, drop = u * u * reach * .5;
      fork.push([p.x + p.tx * along + down[0] * drop, p.y + p.ty * along + down[1] * drop]);
    }
    // It ends in a small curl, the way a tendril or a flourish does.
    const [lx, ly] = fork.at(-1), [bx, by] = fork.at(-2);
    const heading = Math.atan2(ly - by, lx - bx), turn = heading - Math.PI / 2;
    const cx = lx + Math.cos(turn) * radius, cy = ly + Math.sin(turn) * radius;
    for (let n = 1; n <= 9; n++) {
      const angle = turn + Math.PI - n / 9 * Math.PI * 1.7;
      fork.push([cx + Math.cos(angle) * radius * (1 - n * .05), cy + Math.sin(angle) * radius * (1 - n * .05)]);
    }
    roads(fork, obstacles, parts, 'branch');
    return parts;
  }

  function build(parts) {
    letters.replaceChildren();
    leaves.replaceChildren();
    strokes = parts.map(part => {
      const path = element('path', { class: `ink-stroke is-${part.kind}`, d: smooth(part.points) });
      letters.append(path);
      return { path, kind: part.kind, length: path.getTotalLength() };
    });
    let clock = 0;
    for (const stroke of strokes) { stroke.begin = clock; clock += stroke.length / PEN_SPEED; stroke.end = clock; clock += LIFT; }
    trail.setAttribute('d', strokes.map(stroke => stroke.path.getAttribute('d')).join(''));
    // Leaves open where the ink has been: along the roads and on letter ends.
    sprouts = [];
    strokes.forEach((stroke, index) => {
      const spots = stroke.kind === 'road' || stroke.kind === 'branch'
        ? Array.from({ length: Math.floor(stroke.length / 30) }, (_, i) => (i + .6) * 30)
        : stroke.kind === 'letter' && index % 2 ? [stroke.length] : [];
      spots.forEach((at, i) => {
        const p = stroke.path.getPointAtLength(Math.min(at, stroke.length));
        const q = stroke.path.getPointAtLength(Math.max(0, Math.min(at, stroke.length) - 2));
        const angle = Math.atan2(p.y - q.y, p.x - q.x) * 180 / Math.PI + (i % 2 ? 55 : -55) + (stroke.kind === 'letter' ? -90 : 0);
        const holder = element('g', { transform: `translate(${p.x.toFixed(1)} ${p.y.toFixed(1)}) rotate(${angle.toFixed(0)})` });
        const leaf = element('path', { class: 'ink-leaf', d: 'M0 0C2.5-3.2 7-4 11.5-.4C7 3.2 2.5 3 0 0Z' });
        leaf.style.setProperty('--sway', `${(i * .37) % 1.6}s`);
        holder.append(leaf);
        leaves.append(holder);
        sprouts.push({ leaf, time: stroke.begin + Math.min(at, stroke.length) / PEN_SPEED + .5 });
      });
    });
    return clock;
  }

  function tick(now) {
    frame = 0;
    const c = getCourse?.();
    if (!c) return;
    const nextKey = [c.sx, c.sy, c.ex, c.ey].map(v => Math.round(v / 5)).join();
    let total = strokes.at(-1)?.end ?? 0;
    if (nextKey !== key) { key = nextKey; course = c; total = build(layout(c)); }
    const time = still ? Infinity : (now - started) / 1000;
    let pen = null;
    for (const stroke of strokes) {
      const drawn = Math.max(0, Math.min(1, (time - stroke.begin) / (stroke.end - stroke.begin)));
      stroke.path.style.strokeDasharray = `${stroke.length} ${stroke.length}`;
      stroke.path.style.strokeDashoffset = stroke.length * (1 - drawn);
      stroke.path.classList.toggle('is-drawn', drawn >= 1);
      if (drawn > 0 && drawn < 1) pen = stroke.path.getPointAtLength(stroke.length * drawn);
    }
    for (const sprout of sprouts) sprout.leaf.classList.toggle('is-open', time > sprout.time);
    if (pen) { nib.setAttribute('cx', pen.x.toFixed(1)); nib.setAttribute('cy', pen.y.toFixed(1)); }
    nib.classList.toggle('is-writing', !!pen);
    // Colour returns once the story has begun, not all at once.
    const bloom = time > total * .5;
    if (bloom !== body.classList.contains('ink-bloom')) { body.classList.toggle('ink-bloom', bloom); if (bloom) onBloom(); }
    if (time > total + .2 && !done) { done = true; body.classList.add('ink-alive'); }
    // Keep following the drifting layers while the page is open.
    if (!still) frame = requestAnimationFrame(tick);
  }

  return {
    start(courseOf, { paused = false, obstacles = () => [] } = {}) {
      cancelAnimationFrame(frame);
      getCourse = courseOf; still = paused; key = ''; done = false; placement = null; obstaclesOf = obstacles;
      body.classList.remove('ink-bloom', 'ink-alive');
      body.classList.add('ink-story');
      const origin = courseOf();
      if (origin) {
        body.style.setProperty('--ink-x', `${origin.ex.toFixed(0)}px`);
        body.style.setProperty('--ink-y', `${origin.ey.toFixed(0)}px`);
      }
      // The page turns first; then the pen touches down.
      started = performance.now() + (paused ? 0 : 520);
      frame = requestAnimationFrame(tick);
    },
    /** Morfeu flies into the page: the words stay where they were written. */
    hold() {
      if (!getCourse) return false;
      const last = course;
      getCourse = () => last;
      return true;
    },
    stop() {
      cancelAnimationFrame(frame);
      frame = 0; getCourse = null;
      const was = body.classList.contains('ink-story');
      body.classList.remove('ink-story', 'ink-bloom', 'ink-alive');
      nib.classList.remove('is-writing');
      if (was) onEnd();
    },
    get course() { return course; },
  };
}
