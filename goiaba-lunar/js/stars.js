/** A radial flight with acceleration, cruise and a gradual arrival. */
export class Starfield {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha:true });
    this.paused = false;
    this.frame = 0;
    this.flight = null;
    this.last = 0;
    let seed = 7825;
    const random = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    this.stars = Array.from({ length:180 }, () => ({ x:random(), y:random(), depth:.2 + random() * .8, phase:random() * Math.PI * 2 }));
    this.resize = () => {
      const ratio = Math.min(devicePixelRatio || 1, 1.5);
      this.width = innerWidth;
      this.height = innerHeight;
      canvas.width = Math.round(this.width * ratio);
      canvas.height = Math.round(this.height * ratio);
      this.ctx?.setTransform(ratio, 0, 0, ratio, 0, 0);
      this.draw(performance.now());
    };
    this.tick = time => {
      this.frame = 0;
      if (this.paused || document.hidden) return;
      if (time - this.last > 30) { this.draw(time); this.last = time; }
      this.frame = requestAnimationFrame(this.tick);
    };
    addEventListener('resize', this.resize);
    this.resize();
    this.start();
  }
  draw(time) {
    if (!this.ctx) return;
    const { ctx, width:w, height:h } = this;
    ctx.clearRect(0, 0, w, h);
    const progress = this.flight ? Math.min(1, Math.max(0, (time - this.flight.start) / this.flight.duration)) : 0;
    const intensity = this.flight ? Math.pow(Math.sin(progress * Math.PI), .85) : 0;
    for (const star of this.stars) {
      let x = star.x * w, y = star.y * h;
      const alpha = .15 + star.depth * .32 + Math.sin(time * .0005 + star.phase) * .1;
      if (intensity > .002) {
        const dx = x - w * .52, dy = y - h * .46;
        const stretch = 1 + intensity * (.3 + star.depth) * ((progress * 5 + star.phase) % 1);
        x = w * .52 + dx * stretch;
        y = h * .46 + dy * stretch;
        ctx.strokeStyle = `rgba(193,221,222,${Math.min(.75, alpha * intensity + .12)})`;
        ctx.lineWidth = .35 + star.depth * intensity;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + dx * intensity * .34, y + dy * intensity * .34);
        ctx.stroke();
      } else {
        ctx.fillStyle = `rgba(215,231,222,${alpha})`;
        ctx.beginPath();
        ctx.arc(x, y, star.depth * .8, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    if (this.flight && progress >= 1) this.flight = null;
  }
  start() { if (!this.frame && !this.paused && !document.hidden && this.ctx) this.frame = requestAnimationFrame(this.tick); }
  setPaused(value) { this.paused = value; if (value) { cancelAnimationFrame(this.frame); this.frame = 0; this.endWarp(); } else this.start(); }
  warp(duration = 2800) { if (!this.paused) this.flight = { start:performance.now(), duration }; }
  endWarp() { this.flight = null; this.draw(performance.now()); }
  visibility() { if (document.hidden) { cancelAnimationFrame(this.frame); this.frame = 0; } else this.start(); }
}
