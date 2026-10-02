/* Site sound: the music (assets/music.mp3, D Dorian) and two quiet hero cues. When the
   hero turns to the whale's sea or the wandering island (js/hero-scene.js), a short
   synthesized cue in D plays low under the music. Off by default. Browsers allow audio only after a click or key, so the
   "Som" button turns it on, and the choice is remembered for the next visit. The music
   downloads only once sound is on; the cues are built by Web Audio, nothing to fetch. */
(() => {
  'use strict';
  const button = document.querySelector('.sound-toggle');
  const Context = window.AudioContext || window.webkitAudioContext;
  if (!button || !Context) return;
  button.hidden = false;

  const KEY = 'hero-sound';
  const remembered = () => { try { return localStorage.getItem(KEY) === 'on'; } catch { return false; } };
  const remember = value => { try { localStorage.setItem(KEY, value ? 'on' : 'off'); } catch { /* private mode */ } };

  let ctx = null, master, wet, noiseBuffer, on = remembered();
  const D4 = 293.66;
  const note = semitones => D4 * 2 ** (semitones / 12);
  const rand = (a, b) => a + Math.random() * (b - a);

  function setup() {
    ctx = new Context();
    const limiter = ctx.createDynamicsCompressor();
    limiter.threshold.value = -16;
    limiter.ratio.value = 6;
    master = ctx.createGain();
    master.gain.value = .5;
    master.connect(limiter).connect(ctx.destination);
    // A long, dark stone room, generated: decaying stereo noise.
    const verb = ctx.createConvolver();
    const length = ctx.sampleRate * 3.6;
    const impulse = ctx.createBuffer(2, length, ctx.sampleRate);
    for (let c = 0; c < 2; c++) {
      const data = impulse.getChannelData(c);
      for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / length) ** 2.8;
    }
    verb.buffer = impulse;
    const darken = ctx.createBiquadFilter();
    darken.type = 'lowpass';
    darken.frequency.value = 4200;
    wet = ctx.createGain();
    wet.gain.value = .45;
    wet.connect(darken).connect(verb).connect(master);
    noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const n = noiseBuffer.getChannelData(0);
    for (let i = 0; i < n.length; i++) n[i] = Math.random() * 2 - 1;
  }

  // A voice bus: panned, then sent dry to the master and wet into the room.
  function bus(pan = 0, level = 1, send = 1) {
    const p = ctx.createStereoPanner();
    p.pan.value = pan;
    const g = ctx.createGain();
    g.gain.value = level;
    const s = ctx.createGain();
    s.gain.value = send;
    p.connect(g);
    g.connect(master);
    g.connect(s).connect(wet);
    return p;
  }
  function envelope(param, t, attack, peak, decay) {
    param.setValueAtTime(.0001, t);
    param.exponentialRampToValueAtTime(peak, t + attack);
    param.exponentialRampToValueAtTime(.0001, t + attack + decay);
  }
  function tone(out, { f, t, type = 'sine', attack = .01, decay = 1, peak = .1, glide }) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f, t);
    if (glide) o.frequency.exponentialRampToValueAtTime(glide, t + attack + decay);
    envelope(g.gain, t, attack, peak, decay);
    o.connect(g).connect(out);
    o.start(t);
    o.stop(t + attack + decay + .05);
  }
  function noise(out, { t, decay, peak, type = 'bandpass', f = 1000, to, q = 1, attack = .02 }) {
    const s = ctx.createBufferSource(), fl = ctx.createBiquadFilter(), g = ctx.createGain();
    s.buffer = noiseBuffer;
    s.loop = true;
    fl.type = type;
    fl.frequency.setValueAtTime(f, t);
    if (to) fl.frequency.exponentialRampToValueAtTime(to, t + attack + decay);
    fl.Q.value = q;
    envelope(g.gain, t, attack, peak, decay);
    s.connect(fl).connect(g).connect(out);
    s.start(t, Math.random() * 1.5);
    s.stop(t + attack + decay + .05);
  }
  function lowpass(out, f, to, t, span) {
    const fl = ctx.createBiquadFilter();
    fl.type = 'lowpass';
    fl.frequency.setValueAtTime(f, t);
    if (to) fl.frequency.exponentialRampToValueAtTime(to, t + span);
    fl.connect(out);
    return fl;
  }

  // Only two creatures sing, quietly, under the music; the other worlds change in silence.
  const WORLDS = {
    // 2 Abismo: the sea closes over, the whale calls, bubbles climb.
    2: (out, t) => {
      noise(out, { t, decay: 2.2, peak: .15, type: 'lowpass', f: 520, to: 160, attack: .5 });
      tone(out, { f: 55, glide: 46, t, attack: .4, decay: 2.4, peak: .2 });
      const deep = lowpass(out, 900, 500, t, 2.4);
      tone(deep, { f: 196, glide: 262, t: t + .35, type: 'triangle', attack: .45, decay: .8, peak: .05 });
      tone(deep, { f: 262, glide: 174, t: t + 1.25, type: 'triangle', attack: .3, decay: 1.2, peak: .045 });
      for (let i = 0; i < 9; i++) {
        const f = rand(450, 900);
        tone(out, { f, glide: f * 2.6, t: t + rand(.3, 2), attack: .004, decay: .07, peak: .035 });
      }
    },
    // 5 Aurora: the wandering island wakes. A slow, deep horn call, the dawn light
    // rising behind it, and the first birds answering.
    5: (out, t) => {
      const horn = lowpass(out, 220, 520, t + .2, 1.4);
      for (const [s, at, len] of [[-24, .15, 1.1], [-17, 1.15, 1.6]]) {
        for (const detune of [-5, 5]) {
          tone(horn, { f: note(s), t: t + at, type: 'sawtooth', attack: .35, decay: len, peak: .07 });
          tone(horn, { f: note(s) * 2 * 2 ** (detune / 1200), t: t + at, type: 'triangle', attack: .4, decay: len, peak: .025 });
        }
      }
      const dawn = lowpass(out, 400, 2600, t + .6, 2.2);
      for (const s of [-12, -5, 2, 7]) tone(dawn, { f: note(s), t: t + .6, type: 'sine', attack: 1.4, decay: 2, peak: .03 });
      for (let i = 0; i < 5; i++) {
        const at = t + 1.5 + i * rand(.18, .32), f = rand(2400, 3600);
        tone(out, { f, glide: f * rand(1.15, 1.45), t: at, attack: .006, decay: rand(.07, .13), peak: .022 });
      }
    },
  };

  // Music, looped by overlapping each pass's own fade-out with the next pass's fade-in.
  const MUSIC = 'assets/music.mp3';
  const OVERLAP = 4.5, TAIL = .7, LEVEL = .34; // TAIL: the file ends in silence
  let music = null, nextPass = 0, passes = [], loopTimer = 0;
  async function startMusic() {
    if (!music) {
      const duck = ctx.createGain(), level = ctx.createGain();
      level.gain.value = .0001;
      level.connect(duck).connect(ctx.destination);
      music = { level, duck, buffer: fetch(MUSIC).then(r => r.arrayBuffer()).then(b => ctx.decodeAudioData(b)) };
    }
    let buffer;
    try { buffer = await music.buffer; } catch { music = null; return; }
    if (!on || loopTimer) return;
    const t = ctx.currentTime;
    fade(music.level.gain, LEVEL, 2.5);
    nextPass = t + .05;
    const queue = () => {
      while (nextPass < ctx.currentTime + 3) {
        const src = ctx.createBufferSource(), g = ctx.createGain(), length = buffer.duration - TAIL;
        src.buffer = buffer;
        g.gain.setValueAtTime(.0001, nextPass);
        g.gain.exponentialRampToValueAtTime(1, nextPass + .05);
        g.gain.setValueAtTime(1, nextPass + length - .05);
        g.gain.exponentialRampToValueAtTime(.0001, nextPass + length);
        src.connect(g).connect(music.level);
        src.start(nextPass);
        src.stop(nextPass + length + .05);
        passes.push(src);
        src.onended = () => { passes = passes.filter(p => p !== src); };
        nextPass += length - OVERLAP;
      }
    };
    queue();
    loopTimer = setInterval(queue, 1000);
  }
  function stopMusic() {
    if (!music) return;
    clearInterval(loopTimer);
    loopTimer = 0;
    fade(music.level.gain, .0001, 1.2);
    const t = ctx.currentTime;
    for (const p of passes) p.stop(t + 1.3);
    passes = [];
  }
  function fade(param, value, seconds) {
    const t = ctx.currentTime;
    param.cancelScheduledValues(t);
    param.setValueAtTime(Math.max(param.value, .0001), t);
    param.exponentialRampToValueAtTime(value, t + seconds);
  }
  // The music steps back while a world changes.
  function duck() {
    if (!loopTimer) return;
    const g = music.duck.gain, t = ctx.currentTime;
    g.cancelScheduledValues(t);
    g.setTargetAtTime(.8, t, .15);
    g.setTargetAtTime(1, t + .9, .6);
  }

  function play(mode, pan, auto) {
    const cue = WORLDS[mode];
    if (!cue || !on || !ctx || ctx.state !== 'running') return;
    duck();
    cue(bus(pan * .6, auto ? .22 : .35, .8), ctx.currentTime + .02);
  }

  document.addEventListener('hero:world', e => play(e.detail.mode, e.detail.pan, e.detail.auto));

  function render() {
    button.setAttribute('aria-pressed', String(on));
    button.setAttribute('aria-label', on ? 'Desativar som' : 'Ativar som');
  }
  async function unlock() {
    if (!ctx) setup();
    if (ctx.state !== 'running') await ctx.resume();
  }
  button.addEventListener('click', async () => {
    on = !on;
    remember(on);
    render();
    if (on) {
      await unlock();
      startMusic();
    } else if (ctx) {
      stopMusic();
    }
  });
  // A returning visitor who left sound on hears it from their first click or key.
  if (on) {
    const wake = () => { unlock().then(startMusic); removeEventListener('pointerdown', wake, true); removeEventListener('keydown', wake, true); };
    addEventListener('pointerdown', wake, true);
    addEventListener('keydown', wake, true);
  }
  document.addEventListener('visibilitychange', () => {
    if (!ctx) return;
    if (document.hidden) ctx.suspend();
    else if (on) ctx.resume();
  });
  render();
})();
