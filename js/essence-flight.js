'use strict';

// Logical world coordinates: x points right and gravity points down. Sampling
// an absolute time makes the entrance identical after dropped or skipped frames.
(function exposeFlight(root, factory) {
  const flight = factory();
  if (typeof module === 'object' && module.exports) module.exports = flight;
  if (root) root.EssenceFlight = flight;
})(typeof globalThis === 'object' ? globalThis : this, function createFlight() {
  const clamp = (value, low, high) => Math.max(low, Math.min(high, value));
  const number = (value, fallback) => Number.isFinite(value) ? value : fallback;

  function create(options = {}) {
    const input = options || {};
    const range = clamp(number(input.range, 3400), -1e6, 1e6);
    const duration = clamp(number(input.duration, 1.72), 1 / 240, 60);
    const impulse = clamp(number(input.impulse, .08), 0, duration);
    const gravity = clamp(number(input.gravity, 380), 0, 1e6);
    const deltaY = clamp(number(input.deltaY, 0), -1e6, 1e6);

    // String force falls linearly to zero during the release. Its normalized
    // velocity is 2s-s² and its integrated displacement is τ(s²-s³/3).
    // Afterwards the arrow has constant horizontal velocity and only gravity
    // changes its vertical velocity. Solve the two launch coefficients against
    // the destination so contact occurs at exactly the requested duration.
    const travelTime = duration - impulse / 3;
    const vx = range / travelTime;
    const vy = (deltaY - .5 * gravity * duration * duration) / travelTime;
    return Object.freeze({
      range, duration, impulse, gravity, deltaY, travelTime, vx, vy,
      launchAngle: Math.atan2(vy, vx),
    });
  }

  function sample(trip, time) {
    const t = clamp(typeof time === 'number' && !Number.isNaN(time) ? time : 0, 0, trip.duration);
    if (t === 0) return { x: 0, y: 0, vx: 0, vy: 0 };
    const releasing = t < trip.impulse;
    const s = releasing ? t / trip.impulse : 1;
    const displacement = releasing
      ? trip.impulse * (s * s - s * s * s / 3)
      : t - trip.impulse / 3;
    const velocity = releasing ? 2 * s - s * s : 1;
    return {
      x: trip.vx * displacement,
      y: trip.vy * displacement + .5 * trip.gravity * t * t,
      vx: trip.vx * velocity,
      vy: trip.vy * velocity + trip.gravity * t,
    };
  }

  return Object.freeze({ create, sample });
});
