'use strict';

const assert = require('node:assert/strict');
const physics = require('../js/essence-physics.js');
const { createSpring, stepSpring, bowState, bowShape, stringShape, launch } = physics;
const close = (actual, expected, tolerance = 1e-9) => assert.ok(
  Math.abs(actual - expected) <= tolerance,
  `${actual} should be within ${tolerance} of ${expected}`,
);

// Rest geometry preserves the smooth grip in the final bow design.
assert.deepEqual(bowShape(0), [
  -182, 0, -170, 22, -152, 26, -145, -1, -131, -70, -42, -79, 0, -79,
  42, -79, 131, -70, 145, -1, 152, 26, 170, 22, 182, 0,
]);
for (const draw of [-42, -15, 0, 30, 75, 105, 130]) {
  for (const flex of [-35, 0, 35]) {
    for (const vibration of [-18, 0, 18]) {
      const state = bowState(draw, flex, vibration);
      assert.equal(state.limb.length, 26);
      assert.equal(state.string.length, 26);
      assert.ok([...state.limb, ...state.string].every(Number.isFinite));
      assert.deepEqual(state.limb.slice(12, 14), [0, -79]);
      assert.deepEqual(state.string.slice(0, 2), state.limb.slice(0, 2));
      assert.deepEqual(state.string.slice(-2), state.limb.slice(-2));
      assert.deepEqual(state.string.slice(12, 14), [0, draw]);
      assert.deepEqual(state.nock, { x: 0, y: draw });
      assert.deepEqual(state.string, stringShape(draw, vibration, flex));
    }
  }
}
const rest = bowState(0);
const loaded = bowState(105);
assert.ok(loaded.tips.right.x < rest.tips.right.x, 'loaded tips move inward');
assert.ok(loaded.tips.right.y > rest.tips.right.y, 'loaded limbs bend back');
assert.notDeepEqual(loaded.limb, rest.limb);
// A taut string does not become shorter as the bow is drawn. Each half keeps
// its 182-unit length, even while the limbs recoil independently of the nock.
for (let draw = 0; draw <= 105; draw += 1) {
  for (const flex of [-35, -15, 0, 15, 35]) {
    const state = bowState(draw, flex);
    for (const tip of Object.values(state.tips)) {
      close(Math.hypot(tip.x - state.nock.x, tip.y - state.nock.y), 182, 1e-9);
    }
  }
}
// With no vibration, every control point lies on its respective straight half.
for (const state of [rest, loaded]) {
  for (let i = 0; i < 26; i += 2) {
    const tip = i <= 12 ? state.tips.left : state.tips.right;
    const x = state.string[i];
    const y = state.string[i + 1];
    close((x - tip.x) * (state.nock.y - tip.y) - (y - tip.y) * (state.nock.x - tip.x), 0, 1e-8);
  }
}

// A released bow overshoots and then settles, at either common frame rate.
for (const hz of [60, 120]) {
  const state = createSpring(105);
  let overshot = false;
  for (let frame = 0; frame < hz * 4; frame += 1) {
    assert.equal(stepSpring(state, 0, 1 / hz), state);
    overshot ||= state.value < 0;
    assert.ok(Number.isFinite(state.value) && Number.isFinite(state.velocity));
  }
  assert.ok(overshot, 'spring should produce elastic recoil');
  close(state.value, 0, 1e-8);
  close(state.velocity, 0, 1e-7);
}
const at60 = createSpring(90);
const at120 = createSpring(90);
for (let frame = 0; frame < 18; frame += 1) stepSpring(at60, 0, 1 / 60);
for (let frame = 0; frame < 36; frame += 1) stepSpring(at120, 0, 1 / 120);
close(at60.value, at120.value, 1e-9);
close(at60.velocity, at120.velocity, 1e-9);

// Background-tab delays and malformed input cannot poison the animation.
const delayed = createSpring(105);
for (let i = 0; i < 200; i += 1) stepSpring(delayed, 0, 60);
close(delayed.value, 0, 1e-8);
const invalid = { value: NaN, velocity: Infinity };
stepSpring(invalid, NaN, Infinity);
assert.deepEqual(invalid, { value: 0, velocity: 0 });
for (const options of [
  { stiffness: 10000, damping: 0, mass: .05 },
  { stiffness: 10000, damping: 5000, mass: .05 },
  { stiffness: NaN, damping: Infinity, mass: -1 },
]) {
  const spring = createSpring(105);
  for (let frame = 0; frame < 600; frame += 1) {
    stepSpring(spring, 0, 10, options);
    assert.ok(Number.isFinite(spring.value) && Number.isFinite(spring.velocity));
    assert.ok(Math.abs(spring.value) < 200);
  }
}

let previousSpeed = -1;
for (let draw = 0; draw <= 130; draw += 5) {
  const velocity = launch(draw, -.2, .8);
  const speed = Math.hypot(velocity.vx, velocity.vy);
  assert.ok(speed > previousSpeed, 'more draw stores more arrow energy');
  previousSpeed = speed;
}
close(Math.hypot(...Object.values(launch(105, 1.1, .5))), Math.hypot(...Object.values(launch(105, 0))) / 2);
close(launch(105, Math.PI / 2).vx, 0);
assert.ok(launch(105, Math.PI / 2).vy > 0);
assert.deepEqual(launch(0), { vx: 0, vy: 0 });
assert.equal(globalThis.EssencePhysics, physics);
console.log('Essence physics: geometry, string attachment and length, springs and launch energy passed.');
