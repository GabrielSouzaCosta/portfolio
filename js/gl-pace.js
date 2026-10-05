/* Frame pacing shared by the WebGL scenes (js/hero-scene.js, js/essence.js).
   A high-refresh display draws at most about 90 times a second: 120 Hz draws every
   other frame, 90 Hz and 60 Hz every frame. When the GPU falls behind, the render
   scale steps down so the scene stays fluid; it never steps back up during the visit.
   Falling behind shows as uneven draws (missed frames) under ~43 fps, or anything
   under ~25 fps. A steady 30 fps is a cap (energy saver, low power mode), not a slow
   GPU, and keeps full resolution. */
window.glPace = function glPace(onScale) {
  const MIN_GAP = 10.5, SLOW_GAP = 23, VERY_SLOW_GAP = 40, UNEVEN = 3, WINDOW = 48, FLOOR = .65;
  let last = 0, gaps = [], scale = 1;
  function judge() {
    gaps.sort((a, b) => a - b);
    const median = gaps[WINDOW / 2], spread = gaps[WINDOW * 3 / 4] - gaps[WINDOW / 4];
    gaps = [];
    if (scale > FLOOR && (median > VERY_SLOW_GAP || (median > SLOW_GAP && spread > UNEVEN))) {
      scale *= .85;
      onScale(scale);
    }
  }
  return {
    get scale() { return scale; },
    // After a pause the next gap is not a frame time.
    reset() { last = 0; gaps = []; },
    // False: too soon after the previous draw; skip this frame.
    ready(now) {
      if (last && now - last < MIN_GAP) return false;
      if (last && gaps.push(now - last) === WINDOW) judge();
      last = now;
      return true;
    },
  };
};
