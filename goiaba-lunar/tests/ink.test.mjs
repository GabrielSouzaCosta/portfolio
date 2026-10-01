import test from 'node:test';
import assert from 'node:assert/strict';
import { ALLURE } from '../js/ink-glyphs.js';
import { LINE, measure, quadratic, choosePlacement, write, roads } from '../js/ink.js';

const rect = (left, top, right, bottom) => ({ left, top, right, bottom });
const within = (r, [x, y]) => x > r.left && x < r.right && y > r.top && y < r.bottom;

// Layouts measured in the browser (css px).
const desktop = {
  size: [1440, 900], course: { sx:210, sy:639, qx:628, qy:438, ex:1086, ey:507 },
  obstacles: [[72,18,201,70],[1328,24,1368,64],[389,88,701,376],[101,137,320,260],[101,282,320,331],[341,401,569,628],[373,637,537,723],
    [741,193,930,361],[734,377,937,460],[1078,396,1274,592],[1095,594,1257,688],[72,584,302,729],[92,734,282,772]].map(r => rect(...r)),
};
const phone = {
  size: [390, 844], course: { sx:98, sy:692, qx:150, qy:620, ex:215, ey:650 },
  obstacles: [rect(47, 499, 116, 548), rect(204, 475, 383, 523), rect(209, 559, 354, 704), rect(224, 704, 339, 759),
    rect(12, 654, 156, 755), rect(255, 226, 359, 322), rect(26, 87, 199, 205)],
};

function lay({ size, course, obstacles }) {
  [globalThis.innerWidth, globalThis.innerHeight] = size;
  const path = measure(quadratic([course.sx, course.sy], [course.qx, course.qy], [course.ex, course.ey]));
  const placement = choosePlacement(path, obstacles);
  const parts = [];
  if (placement.mode === 'course') {
    const s0 = placement.s0 * path.length;
    write(LINE, (u, v) => { const p = path.at(s0 + u); return [p.x + p.ty * v, p.y - p.tx * v]; }, placement.scale, parts);
  } else {
    placement.lines.forEach((line, i) => {
      const x0 = placement.left + (i ? placement.indent : 0), y0 = placement.base + i * placement.lineGap;
      write(line, (u, v) => [x0 + u, y0 - v + Math.sin(u / 70 + i) * 2.4 * placement.scale / .1], placement.scale, parts);
    });
  }
  return { placement, points: parts.flatMap(part => part.points) };
}

test('the opening line is complete in the single-stroke hand', () => {
  for (const ch of new Set(LINE)) {
    assert.ok(ALLURE[ch], `glyph for "${ch}"`);
    for (const stroke of ALLURE[ch].slice(1)) for (const value of stroke) assert.ok(Number.isFinite(value));
  }
});

test('on wide screens the words are large and clear of every world and label', () => {
  const { placement, points } = lay(desktop);
  assert.ok(placement.scale >= .05, 'large enough to read');
  assert.equal(placement.lines?.length ?? 1, 1, 'one line');
  for (const point of points) for (const obstacle of desktop.obstacles) assert.ok(!within(obstacle, point), `letter at ${point} crosses a label or world`);
});

test('on phones the words find open paper, and still clear everything', () => {
  const { points } = lay(phone);
  for (const [x, y] of points) {
    assert.ok(x > 0 && x < phone.size[0] && y > 0 && y < phone.size[1], 'on screen');
    for (const obstacle of phone.obstacles) assert.ok(!within(obstacle, [x, y]), `letter at ${x},${y} crosses a label or world`);
  }
});

test('a road hides behind what it passes and reaches the world it goes to', () => {
  const line = Array.from({ length: 101 }, (_, i) => [i * 4, 100]);
  const parts = [];
  roads(line, [rect(100, 80, 200, 120), rect(380, 80, 420, 120)], parts);
  assert.equal(parts.length, 2, 'split where it passes behind');
  for (const [x] of parts.flatMap(part => part.points)) assert.ok(x < 97 || x > 203);
  assert.deepEqual(parts.at(-1).points.at(-1), [400, 100], 'arrives at its destination');
});
