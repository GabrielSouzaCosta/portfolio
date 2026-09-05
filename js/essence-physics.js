'use strict';

// Coordinates are in the bow's unrotated SVG space. The riser stays at
// (0, -79); positive draw moves the nocking point away from the riser.
(function exposePhysics(root, factory) {
  const physics = factory();
  if (typeof module === 'object' && module.exports) module.exports = physics;
  if (root) root.EssencePhysics = physics;
})(typeof globalThis === 'object' ? globalThis : this, function createPhysics() {
  const clamp = (value, low, high) => Math.max(low, Math.min(high, value));
  const number = (value, fallback = 0) => Number.isFinite(value) ? value : fallback;

  function createSpring(value = 0) {
    return { value: number(value), velocity: 0 };
  }

  // Bound elapsed time after a suspended tab. Small symplectic integration
  // steps preserve the spring's recoil; exponential damping remains stable
  // even when a caller requests very heavy damping.
  function stepSpring(state, target, dt, options = {}) {
    options = options || {};
    state.value = clamp(number(state.value), -1e6, 1e6);
    state.velocity = clamp(number(state.velocity), -1e6, 1e6);
    target = clamp(number(target), -1e6, 1e6);
    const elapsed = clamp(number(dt), 0, .1);
    if (!elapsed) return state;
    const stiffness = clamp(number(options.stiffness, 210), 0, 10000);
    const damping = clamp(number(options.damping, 22), 0, 5000);
    const mass = clamp(number(options.mass, 1), .05, 100);
    const frequency = Math.sqrt(stiffness / mass);
    const maxStep = Math.min(1 / 240, frequency ? .4 / frequency : 1 / 240);
    const steps = Math.ceil(elapsed / maxStep);
    const h = elapsed / steps;
    const decay = Math.exp(-damping / mass * h);
    for (let i = 0; i < steps; i += 1) {
      state.velocity += (target - state.value) * stiffness / mass * h;
      state.velocity *= decay;
      state.value += state.velocity * h;
    }
    return state;
  }

  function bowShape(draw = 0, flex = 0) {
    const pull = clamp(number(draw), -42, 130);
    const recoil = clamp(number(flex), -35, 35);
    // The outer limbs rotate back under load and the tips travel inward.
    // The inner riser controls remain fixed, preserving the grip silhouette.
    const bend = pull * .31 + recoil * .68;
    // The string has two 182-unit halves. Derive the tip span from the
    // nock-to-tip depth so drawing the bow bends its limbs without shortening
    // the string. This constraint also holds during the limbs' recoil.
    const stringDepth = pull - bend;
    const tipX = Math.sqrt(182 * 182 - stringDepth * stringDepth);
    const shortening = 182 - tipX;
    const shoulderX = 145 - shortening * .55;
    const shoulderY = -1 + bend * .78;
    return [
      -tipX, bend,
      -(170 - shortening * .94), 22 + bend * 1.04,
      -(152 - shortening * .66), 26 + bend * .98,
      -shoulderX, shoulderY,
      -(131 - shortening * .42), -70 + bend * .61,
      -42, -79,
      0, -79,
      42, -79,
      131 - shortening * .42, -70 + bend * .61,
      shoulderX, shoulderY,
      152 - shortening * .66, 26 + bend * .98,
      170 - shortening * .94, 22 + bend * 1.04,
      tipX, bend,
    ];
  }

  // Two cubic Hermite segments approximate each straight half of the string.
  // A small transverse standing wave has nodes at the tips and nocking point,
  // so adding vibration can never detach the string from the bow or arrow.
  function appendStringHalf(path, from, to, amplitude) {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const length = Math.hypot(dx, dy) || 1;
    const nx = -dy / length;
    const ny = dx / length;
    const point = t => {
      const wave = amplitude * Math.sin(Math.PI * t);
      return { x: from.x + dx * t + nx * wave, y: from.y + dy * t + ny * wave };
    };
    const tangent = t => {
      const wave = amplitude * Math.PI * Math.cos(Math.PI * t);
      return { x: dx + nx * wave, y: dy + ny * wave };
    };
    for (let half = 0; half < 2; half += 1) {
      const start = half / 2;
      const end = (half + 1) / 2;
      const p0 = point(start);
      // Use the literal endpoint to avoid floating-point sine residue.
      const p1 = half === 1 ? to : point(end);
      const t0 = tangent(start);
      const t1 = tangent(end);
      path.push(
        p0.x + t0.x / 6, p0.y + t0.y / 6,
        p1.x - t1.x / 6, p1.y - t1.y / 6,
        p1.x, p1.y,
      );
    }
  }

  function bowState(draw = 0, flex = 0, vibration = 0) {
    const limb = bowShape(draw, flex);
    const tips = {
      left: { x: limb[0], y: limb[1] },
      right: { x: limb[24], y: limb[25] },
    };
    const nock = { x: 0, y: clamp(number(draw), -42, 130) };
    const wave = clamp(number(vibration), -18, 18);
    const string = [tips.left.x, tips.left.y];
    appendStringHalf(string, tips.left, nock, wave);
    appendStringHalf(string, nock, tips.right, -wave * .72);
    return { limb, string, tips, nock };
  }

  function stringShape(draw = 0, vibration = 0, flex = 0) {
    return bowState(draw, flex, vibration).string;
  }

  function launch(draw, angle = 0, scale = 1) {
    const pull = clamp(number(draw), 0, 130);
    // Integrating F = k*x + k2*x² gives stored energy proportional to
    // x² + c*x³. Its square root determines the released arrow's speed.
    const speed = 11.2 * Math.sqrt(pull * pull + .0018 * pull * pull * pull)
      * clamp(number(scale, 1), 0, 100);
    const direction = number(angle);
    return { vx: Math.cos(direction) * speed, vy: Math.sin(direction) * speed };
  }

  return Object.freeze({ createSpring, stepSpring, bowShape, stringShape, bowState, launch });
});
