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
    // A comet now and then rewards whoever lingers in the galaxy.
    this.comet = null;
    this.nextComet = performance.now() + 7000;
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
    this.drawComet(time, intensity);
  }
  drawComet(time, intensity) {
    const { ctx, width:w, height:h } = this;
    if (!this.comet && time > this.nextComet && !intensity && document.body.dataset.world === 'galaxy') {
      const angle = Math.PI * (.8 + Math.random() * .1);
      this.comet = { start:time, duration:1800 + Math.random() * 900, x:w * (.45 + Math.random() * .6), y:h * (Math.random() * .3 - .05), angle, travel:Math.max(w, h) * (.55 + Math.random() * .3) };
    }
    const comet = this.comet;
    if (!comet) return;
    const t = (time - comet.start) / comet.duration;
    if (t >= 1 || intensity) {
      this.comet = null;
      this.nextComet = time + 16000 + Math.random() * 22000;
      return;
    }
    const eased = 1 - Math.pow(1 - t, 1.6), fade = Math.sin(t * Math.PI);
    const dx = Math.cos(comet.angle), dy = -Math.sin(comet.angle);
    const x = comet.x + dx * comet.travel * eased, y = comet.y - dy * comet.travel * eased;
    const tail = 150 * fade + 30;
    const gradient = ctx.createLinearGradient(x, y, x - dx * tail, y + dy * tail);
    gradient.addColorStop(0, `rgba(255,236,244,${.85 * fade})`);
    gradient.addColorStop(.25, `rgba(239,171,195,${.4 * fade})`);
    gradient.addColorStop(1, 'rgba(239,171,195,0)');
    ctx.strokeStyle = gradient;
    ctx.lineWidth = 1.6;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x - dx * tail, y + dy * tail);
    ctx.stroke();
    ctx.fillStyle = `rgba(255,246,250,${fade})`;
    ctx.beginPath();
    ctx.arc(x, y, 1.6, 0, Math.PI * 2);
    ctx.fill();
  }
  start() { if (!this.frame && !this.paused && !document.hidden && this.ctx) this.frame = requestAnimationFrame(this.tick); }
  setPaused(value) { this.paused = value; if (value) { cancelAnimationFrame(this.frame); this.frame = 0; this.endWarp(); } else this.start(); }
  warp(duration = 2800) { if (!this.paused) this.flight = { start:performance.now(), duration }; }
  endWarp() { this.flight = null; this.draw(performance.now()); }
  visibility() { if (document.hidden) { cancelAnimationFrame(this.frame); this.frame = 0; } else this.start(); }
}
