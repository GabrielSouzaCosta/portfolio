'use strict';

const assert = require('node:assert/strict');
const flight = require('../js/essence-flight.js');
const { create, sample } = flight;
const close = (actual, expected, tolerance = 1e-8) => assert.ok(
  Math.abs(actual - expected) <= tolerance,
  `${actual} should be within ${tolerance} of ${expected}`,
);
const finite = value => assert.ok(Object.values(value).every(Number.isFinite));
const trip = create();
assert.equal(globalThis.EssenceFlight, flight);
assert.ok(Object.isFrozen(flight));
assert.ok(Object.isFrozen(trip));
assert.equal(trip.range, 3400);
assert.equal(trip.duration, 1.72);
assert.equal(trip.impulse, .08);
assert.equal(trip.gravity, 380);
assert.equal(trip.deltaY, 0);
assert.ok(trip.launchAngle < 0 && trip.launchAngle > -.3);

// Different heights, directions and release lengths still reach the actual
// destination. The renderer does not need a final position correction.
for (const range of [-1200, 0, 3400, 4000]) {
  for (const deltaY of [-180, 0, 220]) {
    for (const duration of [1.6, 1.72, 1.8]) {
      for (const impulse of [0, .04, .08, duration]) {
        const route = create({ range, deltaY, duration, impulse });
        const impact = sample(route, duration);
        close(impact.x, range);
        close(impact.y, deltaY);
        finite(impact);
      }
    }
  }
}

// Release is a measurable acceleration from rest, with most forward speed
// acquired early and no additional thrust after the string has let go.
const atRest = sample(trip, 0);
assert.deepEqual(atRest, { x: 0, y: 0, vx: 0, vy: 0 });
let previousSpeed = 0;
let previousX = 0;
for (let step = 1; step <= 80; step += 1) {
  const pose = sample(trip, step / 1000);
  const speed = Math.hypot(pose.vx, pose.vy);
  assert.ok(pose.x > previousX, 'arrow moves forward throughout release');
  assert.ok(speed > previousSpeed, 'release increases speed from stored tension');
  previousX = pose.x;
  previousSpeed = speed;
}
assert.ok(sample(trip, .04).vx > sample(trip, .08).vx * .7);
assert.ok(sample(trip, .04).vx < sample(trip, .08).vx * .8);

// Position and velocity are continuous where the release ends. Numerical
// derivatives also confirm the reported velocity and the absence of a force
// jump at the release-to-gravity boundary.
const h = 1e-5;
const before = sample(trip, trip.impulse - h);
const boundary = sample(trip, trip.impulse);
const after = sample(trip, trip.impulse + h);
close((boundary.x - before.x) / h, boundary.vx, 1e-3);
close((after.x - boundary.x) / h, boundary.vx, 1e-3);
close((boundary.y - before.y) / h, boundary.vy, 3e-3);
close((after.y - boundary.y) / h, boundary.vy, 3e-3);
close((boundary.vx - before.vx) / h, 0, 4);
close((after.vx - boundary.vx) / h, 0);
close((boundary.vy - before.vy) / h, trip.gravity, .6);
close((after.vy - boundary.vy) / h, trip.gravity, 1e-6);

for (const time of [.02, .06, .2, .7, 1.4]) {
  const left = sample(trip, time - h);
  const right = sample(trip, time + h);
  const pose = sample(trip, time);
  close((right.x - left.x) / (2 * h), pose.vx, 2e-5);
  close((right.y - left.y) / (2 * h), pose.vy, 2e-5);
}

// In free flight, equal time intervals advance x equally and add only g*dt
// to vertical velocity. A constant downward second difference distinguishes
// this ballistic path from an eased curve towards the destination.
const free = [.2, .5, .8].map(time => sample(trip, time));
close(free[2].x - free[1].x, free[1].x - free[0].x);
close(free[2].vx, free[0].vx);
close(free[2].vy - free[0].vy, trip.gravity * .6);
close(free[2].y - 2 * free[1].y + free[0].y, trip.gravity * .3 ** 2);

// The default arrow visibly rises, turns under gravity, and strikes while
// descending. Its arc fits the logical 1000-unit viewport at desktop/mobile.
const apexTime = -trip.vy / trip.gravity;
const apex = sample(trip, apexTime);
assert.ok(apexTime > .8 && apexTime < 1);
assert.ok(apex.y < -130 && apex.y > -145);
close(apex.vy, 0);
assert.ok(sample(trip, apexTime - .1).vy < 0);
assert.ok(sample(trip, apexTime + .1).vy > 0);
assert.ok(sample(trip, trip.duration).vy > 0);
for (const viewportWidth of [320, 390, 768, 1440]) {
  const scale = viewportWidth / 1000;
  close(sample(trip, trip.duration).x * scale, viewportWidth * 3.4);
  assert.ok(Math.abs(apex.y * scale) < viewportWidth * .15);
}

// Sampling is independent of frame rate, call order and long background-tab
// delays. A repeated timestamp always returns the identical pose.
const checkpoints = [.04, .08, .6, 1.2, trip.duration];
const expected = checkpoints.map(time => sample(trip, time));
for (const hz of [24, 30, 60, 90, 120, 144]) {
  for (let frame = 0; frame <= Math.ceil(trip.duration * hz); frame += 1) {
    finite(sample(trip, frame / hz));
  }
  assert.deepEqual(checkpoints.map(time => sample(trip, time)), expected);
  assert.deepEqual([...checkpoints].reverse().map(time => sample(trip, time)), [...expected].reverse());
}
for (const time of [-Infinity, -1e6, -1, NaN, undefined, null, '1']) {
  assert.deepEqual(sample(trip, time), atRest);
}
for (const time of [trip.duration, trip.duration + 1e-9, 1000, Infinity]) {
  assert.deepEqual(sample(trip, time), sample(trip, trip.duration));
}
for (const options of [
  null,
  { range: NaN, duration: Infinity, impulse: -1, gravity: -20, deltaY: NaN },
  { range: 1e308, duration: 0, impulse: 1e308, gravity: 1e308, deltaY: -1e308 },
]) {
  const route = create(options);
  finite(route);
  for (const time of [-Infinity, 0, .01, route.duration / 2, route.duration, Infinity]) {
    finite(sample(route, time));
  }
}

console.log('Essence flight: exact contact, release acceleration, continuous force, ballistic gravity, arc and deterministic sampling passed.');
