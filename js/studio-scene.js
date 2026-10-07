/* Goiaba Lunar — Fases da Goiaba.
   The studio's own night, drawn as true pixel art. One WebGL2 pass renders the scene at a low art
   resolution (a whole number of device pixels per art pixel) and the canvas is scaled up with
   image-rendering: pixelated. Fixed palette ramps with ordered (Bayer) dithering; no images.
   The guava moon is lit by Morfeu's star pointer: its phase follows the cursor, a crescent like the
   logo far away, the whole cut fruit right under it. The studio's projects orbit it as small moons,
   and a tuxedo cat lies on top and notices Morfeu. Draws only while the section is active, and is
   set up once the hero has settled, or when the visitor arrives here first.
   Debug: ?s-at=<s> freezes time; &s-mx=&s-my= place the cursor (CSS px in the section);
   &s-focus=0..2 spotlights a project; &s-intro=<s> freezes the arrival at that moment;
   &s-dive=<s> freezes the dive into the fruit (the way out to the studio). */
(() => {
  'use strict';

  const section = document.querySelector('#estudio');
  if (!section) return;
  const inner = section.querySelector('.studio-inner');
  const canvas = section.querySelector('.studio-gl');
  const slot = section.querySelector('.studio-sky');
  const copy = section.querySelector('.studio-copy');
  const moonLink = section.querySelector('.moon-link');
  const caption = section.querySelector('.moon-caption');
  const tag = section.querySelector('.orbit-tag');
  const items = [...section.querySelectorAll('.orbit-item')];
  const hits = [...section.querySelectorAll('.orbit-hit')];
  if (!inner || !canvas || !slot) return;

  const params = new URLSearchParams(location.search);
  const frozenAt = params.has('s-at') ? parseFloat(params.get('s-at')) : null;
  const frozenIntro = params.has('s-intro') ? parseFloat(params.get('s-intro')) : null;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover: hover) and (pointer: fine)');
  const TAU = Math.PI * 2;

  // Orbits in moon radii: a (half width), b (half height), tilt (rad), speed (rad/s), start angle.
  const SATS = [
    { size: .15, a: 1.46, b: .34, tilt: -.2, speed: .15, start: -1.25 },
    { size: .125, a: 1.84, b: .28, tilt: .12, speed: .1, start: 2.2 },
    { size: .115, a: 2.2, b: .23, tilt: -.33, speed: .072, start: 4.05 },
  ];

  const PALETTE = [
    ['#07061a', '#0b0920', '#100c29', '#161033', '#1e123d', '#2a1647', '#3b1a52', '#4f1d5a'], // 0 sky
    ['#151033', '#1e1a4c', '#28306a', '#334b88', '#5a4890', '#83458c', '#ac4c8c', '#d77aa6'], // 1 nebula
    ['#24220f', '#3a3818', '#4f4c22', '#605d30', '#7f7a33', '#958f36', '#b1aa3f', '#cfc767'], // 2 rind
    ['#4a0f33', '#6f1244', '#99175a', '#cc1b71', '#e0266f', '#ed3272', '#fa6187', '#ff9fb4'], // 3 flesh
    ['#4d2440', '#7a3c5a', '#a85f77', '#d08b98', '#eab3b4', '#f8d4c9', '#fff0e2', '#fffaf3'], // 4 pale layer
    ['#3a2620', '#5e4232', '#86664a', '#ad8c66', '#d5bda0', '#ead6b4', '#fbecd0', '#fffaf0'], // 5 seeds
    ['#08061a', '#0e0a24', '#140f2e', '#1b1439', '#231a45', '#2c2152', '#382a60', '#47366f'], // 6 night side
    ['#22183f', '#3a2a63', '#574089', '#7a5cb0', '#9e7fd6', '#cca7f1', '#e4d0ff', '#fbf6ff'], // 7 lavender
    ['#2a0f1c', '#561d22', '#88342a', '#b9532f', '#dd7740', '#f09d58', '#ffcd86', '#fff2c9'], // 8 Cindra
    ['#1f1630', '#382848', '#57425f', '#7f677c', '#ad929b', '#d6bdb9', '#efdfd3', '#fffaf0'], // 9 CommissionMatch
    ['#0f160f', '#1a2716', '#2a3e20', '#40592b', '#5d7737', '#83994c', '#afc074', '#dfe8b4'], // 10 Mangue
    ['#3a2a60', '#5d4790', '#8a6cc0', '#b9a0e6', '#e1cff8', '#f6e9ff', '#fff7ea', '#ffffff'], // 11 stars
    ['#3a1030', '#6a1f4f', '#9a3070', '#c4508e', '#e07aa8', '#efabc3', '#ffd3e2', '#fff4f8'], // 12 pink
  ];

  // Juquinha, the studio's tuxedo cat, curled up asleep on the moon (36 x 19): a round back lit by the
  // moon's glow, head resting on tucked white paws, closed eyes, pink ears, a blush. He breathes, an ear
  // twitches now and then, and when Morfeu comes close his blush deepens and he smiles in his sleep.
  const CAT_COLORS = {
    K: [20, 17, 32], D: [43, 40, 64], G: [60, 55, 86], H: [96, 88, 130], W: [251, 247, 240], w: [212, 202, 224],
    P: [242, 150, 178], B: [247, 178, 198], E: [150, 140, 182], p: [176, 96, 128],
  };
  const CAT_BODY = [
    '', '', '', '',
    '..........KKKKKKKK',
    '.......KKKDDDGGGDDKKK',
    '......KDDDGGHHHGGDDDDK',
    '.....KDDGGHHGGDDDDDDDDK',
    '....KDDGHHGDDDDDDDDDDDDK',
    '...KDDGHGDDDDDDDDDDDDDDDK',
    '...KDGGDDDDDDDDDDDDDDDDDDK',
    '..KDDGDDDDDDDDDDDDDDDDDDDK',
    '..KDDDDDDDDDDDDDDDDDDDDDDDK',
    '..KDDDDDDDDDDDDDDDDDDDDDDDDK',
    '..KDDDDDDDDDDDDDDDDDDDDDKKKWWWKKWWWK',
    '..KKDDDDDDDDDDDDDDDDDDDKWWWWWKWWWWWK',
    '.KGGKKKKKDDDDDDDDDKKKKKKWwWwWKWwWwWK',
    '.KDGGGGGGKKKKKKKKKGGGGGKKKKKKKKKKKK',
    '..KKKKKKKKKKKKKKKKKKKKKK',
  ];
  const CAT_HEAD = [
    '..K.........K..',
    '.KDK.......KDK.',
    '.KPDK.....KDPK.',
    'KDPPDKKKKKDPPDK',
    'KDDDDDDDDDDDDDK',
    'KDDDDDDWDDDDDDK',
    'KDEDDEDWDEDDEDK',
    'KDDEEDWWWDEEDDK',
    'KDWWWWWPWWWWWDK',
    'KBWWWWpWpWWWWBK',
    '.KWWWWWWWWWWWK.',
    '..KKWWWWWWWKK..',
    '....KKKKKKK....',
  ];
  const CAT_TWITCH = ['..K............', '.KDK.......KKK.'];   // the right ear flicks down
  const CAT_CONTENT = ['KBBWWWpWpWWWBBK', '.KWWWWWpWWWWWK.'];  // deeper blush, a sleepy smile
  const CAT_W = 36, CAT_H = 19;

  function catFrame(breath, twitch, content) {
    const px = new Uint8Array(CAT_W * CAT_H * 4);
    const put = (rows, ox, oy) => rows.forEach((row, y) => [...row].forEach((ch, x) => {
      const rgb = CAT_COLORS[ch];
      const X = ox + x, Y = oy + y;
      if (!rgb || X < 0 || Y < 0 || X >= CAT_W || Y >= CAT_H) return;
      const i = (Y * CAT_W + X) * 4;
      px[i] = rgb[0]; px[i + 1] = rgb[1]; px[i + 2] = rgb[2]; px[i + 3] = 255;
    }));
    put(CAT_BODY, 0, 0);
    if (breath) {
      // Breathing in: the round of the back rises one pixel.
      for (let x = 6; x <= 17; x++) {
        let top = 0;
        while (top < CAT_H && !px[(top * CAT_W + x) * 4 + 3]) top++;
        if (top < 1 || top >= CAT_H - 1) continue;
        px.copyWithin(((top - 1) * CAT_W + x) * 4, (top * CAT_W + x) * 4, (top * CAT_W + x) * 4 + 4);
        px.copyWithin((top * CAT_W + x) * 4, ((top + 1) * CAT_W + x) * 4, ((top + 1) * CAT_W + x) * 4 + 4);
      }
    }
    const head = CAT_HEAD.slice();
    if (twitch) head.splice(0, 2, ...CAT_TWITCH);
    if (content) head.splice(9, 2, ...CAT_CONTENT);
    put(head, 19, 2);
    return px;
  }

  const VERT = `#version 300 es
in vec2 aPos;
void main() { gl_Position = vec4(aPos, 0., 1.); }`;

  const FRAG = `#version 300 es
precision highp float;
precision highp int;
uniform vec2 uRes;
uniform float uTime;
uniform vec3 uMoon;
uniform vec3 uL;
uniform float uMosaic;
uniform vec4 uCopy;
uniform vec4 uCopy2;
uniform vec4 uSat[3];
uniform vec4 uOrb[3];
uniform vec4 uFx;
uniform vec4 uLink;
uniform vec2 uPar;
uniform vec2 uCat;
uniform vec4 uDive;   // centre x, y, warp 0..1, hole radius (art px)
uniform vec2 uSleep;  // base moon radius, Zzz on
uniform sampler2D uPal;
uniform sampler2D uCatTex;
out vec4 outColor;

const float TAU = 6.2831853;
const int SKY = 0, NEB = 1, RIND = 2, FLESH = 3, PALE = 4, SEED = 5, NIGHT = 6, LAV = 7, STAR = 11, PINK = 12;
const int B4[16] = int[16](0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5);
const int HEART[6] = int[6](54, 127, 127, 62, 28, 8);
const int Z4[4] = int[4](15, 2, 4, 15);
const int Z5[5] = int[5](31, 2, 4, 8, 31);
const float CW = ${CAT_W}., CH = ${CAT_H}.;

float th;

float hash(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * .1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3. - 2. * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y);
}
float fbm(vec2 p) {
  float s = 0., a = .5;
  for (int i = 0; i < 4; i++) { s += a * noise(p); p = p * 2.07 + 13.7; a *= .5; }
  return s / .9375;
}
vec3 shade(int row, int i) { return texelFetch(uPal, ivec2(clamp(i, 0, 7), row), 0).rgb; }
// A value from 0 to 1 picks a shade of a ramp; the Bayer threshold dithers between neighbours.
vec3 ramp(int row, float v) {
  float f = clamp(v, 0., 1.) * 7.;
  float i = floor(f);
  if (f - i > th) i += 1.;
  return shade(row, int(min(i, 7.)));
}
// 1 over the copy column, easing out around it: the night stays quiet behind the text.
float calm(vec2 c) {
  vec2 d = max(max(uCopy.xy - c, c - uCopy.zw), 0.);
  vec2 e = max(max(uCopy2.xy - c, c - uCopy2.zw), 0.);
  return 1. - smoothstep(0., 38., min(length(d), length(e)));
}

vec3 sky(vec2 c, float quiet) {
  float y = c.y / uRes.y;
  float v = .05 + .5 * pow(1. - y, 1.8);
  float dm = length(c - uMoon.xy) / uMoon.z;
  v += .26 * exp(-dm * .85);
  v *= 1. - .45 * quiet;
  return ramp(SKY, v);
}

// A stream of dust crossing behind the moon. Its bands drift through the ramp, like palette cycling.
vec3 nebula(vec2 c, vec3 col, float quiet) {
  vec2 q = c / uRes.y;
  vec2 mq = uMoon.xy / uRes.y;
  float n = fbm(q * 3.1 + vec2(uTime * .006, -uTime * .003));
  float m = fbm(q * 6.3 - vec2(uTime * .01, uTime * .004) + 4.);
  float d = (q.y - mq.y) + .55 * (q.x - mq.x) + (n - .5) * .42;
  float dens = exp(-d * d / .018) * (.35 + .9 * m) * (1. - .92 * quiet);
  float cyc = fract(m * 3.5 - uTime * .045);
  float v = dens * .8 + .14 * dens * sin(cyc * TAU);
  if (v > .14 + th * .16) col = ramp(NEB, v * 1.05 - .05);
  return col;
}

vec3 stars(vec2 px, vec3 col, float quiet) {
  vec2 a = px + floor(uPar * .5);
  if (hash(a * .37 + 11.) < .0075 * (1. - .8 * quiet)) {
    float b = hash(a + 5.3);
    if (b < uFx.y) {
      float tw = .5 + .5 * sin(uTime * (.8 + b * 2.4) + b * 50.);
      col = ramp(STAR, .18 + .55 * b * (.4 + .6 * tw));
    }
  }
  vec2 p = px + floor(uPar);
  vec2 cell = floor(p / 15.);
  float hc = hash(cell + 71.);
  if (hc < .2 * (1. - quiet) && hc * 5. < uFx.y) {
    vec2 ctr = cell * 15. + 3. + floor(vec2(hash(cell + 3.1), hash(cell + 8.7)) * 9.);
    vec2 d = abs(p - ctr);
    float tw = .5 + .5 * sin(uTime * (.5 + hc * 6.) + hc * 97.);
    float arm = tw > .78 ? 2. : (tw > .3 ? 1. : 0.);
    if ((d.x < .5 && d.y < arm + .5) || (d.y < .5 && d.x < arm + .5)) {
      float k = d.x + d.y;
      if (hash(cell + 1.7) < .3) col = shade(PINK, k < .5 ? 7 : (k < 1.5 ? 5 : 3));
      else col = shade(STAR, k < .5 ? 7 : (k < 1.5 ? 5 : 3));
    }
  }
  return col;
}

vec3 meteor(vec2 c, vec3 col) {
  float period = 9.;
  float k = floor(uTime / period), ph = uTime - k * period;
  if (ph > 1.1 || uFx.y < 1.) return col;
  vec2 start = vec2(mix(.48, .82, hash(vec2(k, 1.))) * uRes.x, mix(.78, .98, hash(vec2(k, 2.))) * uRes.y);
  vec2 dir = normalize(vec2(.86, -.5));
  vec2 head = start + dir * ph * uRes.y * .5;
  vec2 v = c - head;
  float along = -dot(v, dir), across = abs(dot(v, vec2(-dir.y, dir.x)));
  float len = 20.;
  if (along >= 0. && along < len && across < .55) {
    float f = 1. - along / len;
    if (f * (1.15 - ph) > th * .9) col = ramp(STAR, .35 + .65 * f);
  }
  return col;
}

void orbit(int i, vec2 c, bool front, float quiet, inout vec3 col) {
  vec4 o = uOrb[i];
  if (o.w <= th || quiet > .7) return;
  vec2 d = c - uMoon.xy;
  float cs = cos(o.z), sn = sin(o.z);
  vec2 q = vec2(cs * d.x + sn * d.y, -sn * d.x + cs * d.y);
  float a = atan(q.y / o.y, q.x / o.x);
  if (length(q - vec2(o.x * cos(a), o.y * sin(a))) > .7) return;
  if ((sin(a) < 0.) != front) return;
  bool focus = abs(uFx.x - float(i)) < .5;
  // Over the fruit only the spotlit orbit shows; the others would read as specks on the flesh.
  if (front && !focus && length(d) < uMoon.z + 1.) return;
  float s = (a + 3.1416) * (o.x + o.y) * .5;
  bool on = mod(floor(s - uTime * 2.), 4.) < 1.;
  if (!focus && !on) return;
  if (focus) col = ramp(PINK, on ? .8 : .5);
  else col = ramp(LAV, front ? .55 : .34);
}

bool satellite(int i, vec2 c, bool front, inout vec3 col) {
  vec4 s = uSat[i];
  if (s.z < .5 || (s.w >= 0.) != front) return false;
  vec2 d = (c - s.xy) / s.z;
  float r = length(d);
  float rim = 1. + 1. / s.z;
  bool focus = abs(uFx.x - float(i)) < .5;
  if (i == 1) {
    // CommissionMatch wears a paper ring: its near half crosses the sphere, its far half hides behind.
    vec2 rq = mat2(cos(.35), -sin(.35), sin(.35), cos(.35)) * d;
    float ell = length(vec2(rq.x, rq.y / .3));
    if (ell > 1.42 && ell < 1.92 && abs(ell - 1.64) > .07 && (rq.y < 0. || r > rim)) {
      float lit = .5 + .5 * dot(normalize(vec3(rq.x, 0., .4)), uL);
      col = ramp(9, .45 + .4 * lit + (ell > 1.64 ? -.12 : 0.));
      return true;
    }
  }
  if (r > rim + (focus ? 1. / s.z : 0.)) return false;
  if (r > rim) { col = shade(PINK, 6); return true; }
  if (r > 1.) { col = shade(NIGHT, 0); return true; }
  vec3 N = vec3(d, sqrt(1. - r * r));
  float lam = dot(N, uL);
  float lon = atan(N.x, N.z) + uTime * .22 + float(i) * 2.;
  float lat = N.y;
  int row = 8;
  float base;
  if (i == 0) {
    base = .4 + .5 * fbm(vec2(lon * 1.6, lat * 2.6) + 3.);
  } else if (i == 1) {
    row = 9;
    float band = fract(lat * 2.2 + .3);
    base = band < .3 ? .42 : .84;
    if (band < .3 && mod(floor(c.x) + floor(c.y), 3.) < 1.) base = .28;
  } else {
    row = 10;
    float n = fbm(vec2(lon * 2.2, lat * 3.) + 9.);
    base = abs(n - .5) < .05 ? .86 : .32 + .3 * n;
  }
  if (lam + (th - .5) * .14 > 0.) {
    col = ramp(row, base * (.62 + .38 * pow(max(lam, 0.), .6)) + .06);
  } else {
    col = ramp(NIGHT, .2 + .18 * N.z + (base - .5) * .14);
    if (i == 0 && lam < -.06) {
      // Cindra keeps its windows lit through the night.
      vec2 g = vec2(lon * 5., lat * 4.);
      float w = hash(floor(g) + 40.);
      if (w < .34 && fract(g.x) < .45 && fract(g.y) < .5) col = shade(8, fract(uTime * .4 + w * 9.) < .8 ? 6 : 5);
    }
  }
  return true;
}

// Two rings of seeds, each seed a small radial oval with a lit side.
float seed(vec2 d, float R, float rs, float n, float off) {
  float ang = atan(d.y, d.x);
  float k = floor(ang / TAU * n - off + .5);
  float ak = (k + off) / n * TAU + (hash(vec2(k, n)) - .5) * .06;
  float rr = (rs + (hash(vec2(n, k)) - .5) * .025) * R;
  vec2 u = vec2(cos(ak), sin(ak));
  vec2 v = d * R - u * rr;
  float sz = max(1.5, R * .03);
  float along = dot(v, u), across = dot(v, vec2(-u.y, u.x));
  float e = along * along / (sz * sz * 2.4) + across * across / (sz * sz);
  if (e < 1.) return across > .3 && along > -.5 ? 3. : 2.;
  return e < 1.9 ? 1. : 0.;
}

void bigMoon(vec2 c, bool behind, inout vec3 col) {
  float R = uMoon.z;
  vec2 d = (c - uMoon.xy) / R;
  float r = length(d);
  float full = .5 + .5 * uL.z;
  if (r > 1.) {
    if (behind) return;   // a moon passing behind keeps its own pixels, not the glow's scanlines
    float e = (r - 1.) * R;
    vec2 n2 = d / r;
    float toward = max(dot(n2, uL.xy), 0.) + max(uL.z, 0.) * .7;
    if (e < 1.) { col = ramp(LAV, .3 + .55 * clamp(toward, 0., 1.)); return; }
    if (uFx.w > 0.) {
      float wave = mod(uTime * 16., 22.) + 1.5;
      if (abs(e - wave) < .5 && mod(floor(atan(d.y, d.x) * R * .5), 3.) < 2.) { col = ramp(PINK, .75 - wave / 40.); return; }
    }
    // The logo's glow: soft light laid in scanlines.
    float g = exp(-e / (R * .17)) * (.3 + .7 * clamp(toward, 0., 1.)) * (.45 + .55 * full);
    if (mod(c.y - .5, 2.) < 1.) { if (g > .1 + th * .3) col = ramp(LAV, .06 + g * .45); }
    else if (g > .5 + th * .3) col = ramp(LAV, .04 + g * .3);
    return;
  }
  vec3 N = vec3(d, sqrt(1. - r * r));
  float lam = dot(N, uL);
  int row = FLESH;
  float base;
  float ink = 0.;
  if (r > .885) {
    row = RIND;
    base = .48 + .5 * (fbm(d * 7. + 2.) - .5);
    if (hash(floor(c) + 7.) < .06) base += .14;
  } else if (r > .84) {
    row = PALE;
    base = .8;
  } else {
    base = .7 + .22 * (fbm(d * 5.) - .5) - .14 * smoothstep(.42, 0., r);
    if (hash(floor(c)) < .05) base -= .12;
    float sd = max(seed(d, R, .48, 12., 0.), seed(d, R, .655, 16., .5));
    if (sd > 1.5) { row = SEED; base = sd > 2.5 ? .86 : .62; }
    else if (sd > .5) base -= .22;
    // Little sparkles in the flesh, as in the logo.
    vec2 sc = d * uSleep.x + 1024.;
    vec2 cell = floor(sc / 9.);
    float hs = hash(cell + 19.);
    if (row == FLESH && hs < .16) {
      vec2 ctr = cell * 9. + 2. + floor(vec2(hash(cell + 2.), hash(cell + 5.)) * 5.);
      vec2 ad = abs(floor(sc) - ctr);
      float tw = .5 + .5 * sin(uTime * (1. + hs * 9.) + hs * 70.);
      if (tw > .45 && ((ad.x < .5 && ad.y < 1.5) || (ad.y < .5 && ad.x < 1.5))) { row = SEED; base = ad.x + ad.y < .5 ? 1. : .8; ink = 1.; }
    }
  }
  if (lam + (th - .5) * .12 > 0.) {
    float spec = pow(max(dot(reflect(-uL, N), vec3(0, 0, 1)), 0.), 10.) * .22;
    float v = base * (.56 + .44 * pow(max(lam, 0.), .55)) + spec;
    col = ramp(row, ink > 0. ? base : v);
  } else {
    float v = .14 + .2 * N.z + (row == RIND ? .08 : 0.) + (row == SEED ? .1 : 0.) + (row == PALE ? .04 : 0.);
    col = ramp(NIGHT, v);
  }
}

float catAlpha(vec2 l) {
  if (l.x < 0. || l.y < 0. || l.x >= CW || l.y >= CH) return 0.;
  return texelFetch(uCatTex, ivec2(int(l.x), int(CH) - 1 - int(l.y)), 0).a;
}
// The cat, with a one-pixel lavender rim so a black cat still reads on the night side.
bool cat(vec2 px, inout vec3 col) {
  vec2 l = px - uCat;
  if (l.x < -1. || l.y < -1. || l.x > CW || l.y > CH) return false;
  if (catAlpha(l) > .5) { col = texelFetch(uCatTex, ivec2(int(l.x), int(CH) - 1 - int(l.y)), 0).rgb; return true; }
  float n = catAlpha(l + vec2(1, 0)) + catAlpha(l - vec2(1, 0)) + catAlpha(l + vec2(0, 1));
  if (n > .5 && l.y > 1.) { col = shade(LAV, 4); return true; }
  return false;
}

void heart(vec2 px, inout vec3 col) {
  if (uFx.z < 0. || uFx.z > 1.) return;
  vec2 l = px - (uCat + vec2(23., 18. + floor(uFx.z * 9.)));
  if (l.x < 0. || l.y < 0. || l.x > 6. || l.y > 5.) return;
  if (uFx.z > .7 && th < (uFx.z - .7) / .3) return;
  if (((HEART[5 - int(l.y)] >> (6 - int(l.x))) & 1) == 1) col = shade(PINK, l.y > 3.5 && l.x < 2.5 ? 7 : 5);
}

// Zzz drifting up from Juquinha's head while he sleeps.
void zzz(vec2 px, inout vec3 col) {
  if (uSleep.y < .5) return;
  for (int k = 0; k < 3; k++) {
    float ph = fract(uTime * .2 + float(k) / 3.);
    vec2 o = uCat + vec2(32. + floor(ph * 8. + sin(ph * 6. + float(k) * 2.) * 1.5), 15. + floor(ph * 16.));
    int n = ph < .45 ? 4 : 5;
    vec2 l = px - o;
    if (l.x < 0. || l.y < 0. || l.x >= float(n) || l.y >= float(n)) continue;
    if (min(ph / .12, (1. - ph) / .35) < th) continue;
    int r = n - 1 - int(l.y);
    int bits = n == 4 ? Z4[r] : Z5[r];
    if (((bits >> (n - 1 - int(l.x))) & 1) == 1) col = shade(LAV, ph < .5 ? 6 : 5);
  }
}

// The dive: stars stretched into streaks rushing out of the centre.
vec3 warp(vec2 c, vec3 col, float amt) {
  vec2 v = c - uDive.xy;
  float rr = length(v);
  float a = atan(v.y, v.x);
  float bins = 240.;
  float bin = floor(a / TAU * bins);
  if (abs(a - (bin + .5) / bins * TAU) * rr > .65) return col;
  float h = hash(vec2(bin, 3.));
  if (h > .6) return col;
  float far = length(uRes) * .75;
  float pos = fract(h * 7.13 + uTime * (.7 + h * 1.6)) * far * 1.3;
  float len = (4. + rr * .35) * amt;
  if (rr < pos && rr > pos - len) {
    float f = (rr - pos + len) / len;
    if (f > th * .85) col = ramp(h < .2 ? PINK : STAR, .3 + .65 * f);
  }
  return col;
}

void link(vec2 c, inout vec3 col) {
  if (uLink.z <= 0. || uFx.x < 0.) return;
  vec4 s = uSat[int(uFx.x)];
  vec2 ab = s.xy - uLink.xy;
  float len = length(ab);
  vec2 u = ab / len;
  vec2 v = c - uLink.xy;
  float along = dot(v, u), across = abs(dot(v, vec2(-u.y, u.x)));
  if (along > 0. && along < len * uLink.z - s.z - 3. && across < .6 && mod(floor(along - uTime * 10.), 4.) < 2.) col = shade(PINK, 5);
}

void main() {
  vec2 px = floor(gl_FragCoord.xy);
  if (uMosaic > 1.) px = floor(px / uMosaic) * uMosaic + floor(uMosaic * .5);
  th = (float(B4[int(mod(px.x, 4.)) + int(mod(px.y, 4.)) * 4]) + .5) / 16.;
  vec2 c = px + .5;
  float quiet = calm(c);
  vec3 col = sky(c, quiet);
  col = nebula(c, col, quiet);
  col = stars(px, col, quiet);
  col = meteor(c, col);
  for (int i = 0; i < 3; i++) orbit(i, c, false, quiet, col);
  bool behind = false;
  for (int i = 0; i < 3; i++) behind = satellite(i, c, false, col) || behind;
  if (uDive.z > 0.) col = warp(c, col, uDive.z);
  bigMoon(c, behind, col);
  cat(px, col);
  heart(px, col);
  zzz(px, col);
  for (int i = 0; i < 3; i++) orbit(i, c, true, quiet, col);
  for (int i = 0; i < 3; i++) satellite(i, c, true, col);
  link(c, col);
  if (uDive.w > 0.) {
    // Through the fruit and out into the night where the studio begins.
    float hd = length(c - uDive.xy);
    if (hd < uDive.w) col = warp(c, shade(NIGHT, hd < uDive.w - 6. ? 0 : 1), 1.);
    else if (hd < uDive.w + 2.) col = shade(PINK, 7);
    else if (hd < uDive.w + 5. && th < .5) col = shade(FLESH, 7);
  }
  outColor = vec4(col, 1.);
}`;

  function start() {
    const gl = canvas.getContext('webgl2', { antialias: false, alpha: false, depth: false, stencil: false, preserveDrawingBuffer: frozenAt !== null, powerPreference: 'low-power' });
    if (!gl) return;

    function compile(type, src) {
      const shader = gl.createShader(type);
      gl.shaderSource(shader, src);
      gl.compileShader(shader);
      return shader;
    }
    const vs = compile(gl.VERTEX_SHADER, VERT), fs = compile(gl.FRAGMENT_SHADER, FRAG);
    const program = gl.createProgram();
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('[studio]', gl.getShaderInfoLog(fs) || gl.getProgramInfoLog(program));
      return;
    }
    gl.useProgram(program);
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const aPos = gl.getAttribLocation(program, 'aPos');
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);
    const u = {};
    for (const name of ['uRes', 'uTime', 'uMoon', 'uL', 'uMosaic', 'uCopy', 'uCopy2', 'uSat', 'uOrb', 'uFx', 'uLink', 'uPar', 'uCat', 'uDive', 'uSleep', 'uPal', 'uCatTex']) u[name] = gl.getUniformLocation(program, name);

    function texture(unit, w, h, data) {
      const t = gl.createTexture();
      gl.activeTexture(gl.TEXTURE0 + unit);
      gl.bindTexture(gl.TEXTURE_2D, t);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, data);
      return t;
    }
    const pal = new Uint8Array(8 * PALETTE.length * 4);
    PALETTE.forEach((row, y) => row.forEach((hex, x) => {
      const i = (y * 8 + x) * 4;
      pal[i] = parseInt(hex.slice(1, 3), 16); pal[i + 1] = parseInt(hex.slice(3, 5), 16); pal[i + 2] = parseInt(hex.slice(5, 7), 16); pal[i + 3] = 255;
    }));
    texture(0, 8, PALETTE.length, pal);
    texture(1, CAT_W, CAT_H, catFrame(false, false, false));
    gl.uniform1i(u.uPal, 0);
    gl.uniform1i(u.uCatTex, 1);
    let catKey = '0,0,0';

    // ---- layout: CSS pixels to art pixels (origin bottom left) ----
    let dpr = 1, P = 3, unit = 3, artW = 1, artH = 1;
    let box = { left: 0, top: 0 };
    const moon = { x: 0, y: 0, r: 40 };
    const copyArt = [0, 0, 0, 0], copyArt2 = [-999, -999, -999, -999];
    const orbitsArt = SATS.map(() => [0, 0, 0]);

    function layout() {
      const w = inner.clientWidth, h = inner.clientHeight;
      if (!w || !h) return;
      dpr = Math.min(window.devicePixelRatio || 1, 3);
      const narrow = w <= 850;
      P = Math.max(1, Math.round((narrow ? 2.4 : 3.1) * dpr * pace.scale ** -0.5));
      unit = P / dpr;
      artW = Math.ceil(w / unit);
      artH = Math.ceil(h / unit);
      if (canvas.width !== artW || canvas.height !== artH) { canvas.width = artW; canvas.height = artH; }
      canvas.style.width = `${artW * unit}px`;
      canvas.style.height = `${artH * unit}px`;
      box = inner.getBoundingClientRect();
      const s = slot.getBoundingClientRect();
      const cx = s.left - box.left + s.width / 2, cy = s.top - box.top + s.height / 2;
      const rCss = narrow ? Math.min(w * .22, s.height * .34) : Math.min(s.width * .29, s.height * .33, 250);
      moon.r = Math.max(18, Math.round(rCss / unit));
      moon.x = Math.round(cx / unit);
      moon.y = Math.round(artH - cy / unit);
      // The night stays quiet behind the words: the copy column, or on phones the text above and below the sky.
      const toArt = (els, out) => {
        const rs = els.filter(Boolean).map((el) => el.getBoundingClientRect()).filter((r) => r.width);
        if (!rs.length) { out.fill(-999); return; }
        out[0] = (Math.min(...rs.map((r) => r.left)) - box.left) / unit; out[2] = (Math.max(...rs.map((r) => r.right)) - box.left) / unit;
        out[1] = artH - (Math.max(...rs.map((r) => r.bottom)) - box.top) / unit; out[3] = artH - (Math.min(...rs.map((r) => r.top)) - box.top) / unit;
      };
      const q = (sel) => section.querySelector(sel);
      if (narrow) {
        toArt([q('.studio-wordmark'), q('#studio-title'), q('.studio-lede')], copyArt);
        toArt([q('.studio-orbits'), q('.studio-cta')], copyArt2);
      } else {
        toArt([copy], copyArt);
        copyArt2.fill(-999);
      }
      SATS.forEach((sat, i) => { orbitsArt[i] = [sat.a * moon.r, sat.b * sat.a * moon.r, sat.tilt]; });
      // The moon is the studio's link (and the portal's starting point).
      if (moonLink) Object.assign(moonLink.style, {
        left: `${(moon.x - moon.r) * unit}px`, top: `${(artH - moon.y - moon.r) * unit}px`,
        width: `${moon.r * 2 * unit}px`, height: `${moon.r * 2 * unit}px`,
      });
      if (caption) Object.assign(caption.style, {
        left: `${moon.x * unit}px`,
        top: `${(artH - moon.y + moon.r + Math.max(SATS[2].b * SATS[2].a, .5) * moon.r + 14) * unit}px`,
      });
    }

    // ---- state ----
    let time = frozenAt ?? 0;
    let last = performance.now();
    let introStart = null;
    let tourStart = 0;
    const pointer = { x: 0, y: 0, inside: false, at: -99 };
    if (params.has('s-mx')) { pointer.inside = true; pointer.cssX = parseFloat(params.get('s-mx')); pointer.cssY = parseFloat(params.get('s-my')); }
    const L = [-.15, 0, -.99];
    const sats = SATS.map((s) => ({ angle: s.start, scale: 1, x: 0, y: 0, r: 0, z: 0 }));
    let focus = params.has('s-focus') ? parseInt(params.get('s-focus'), 10) : -1;
    let focusFrom = null;     // the list row that asked for the spotlight, if any
    let linkGrow = 0;
    let heartAt = -99;
    let dive = params.has('s-dive') ? { start: (frozenAt ?? 0) - parseFloat(params.get('s-dive')), onDone: null, done: false } : null;
    const DIVE = 1.5;
    let moonHover = false;
    let raf = 0, keepUntil = 0;
    const pace = window.glPace ? glPace(() => layout()) : { scale: 1, reset() {}, ready: () => true };

    const lightFrom = (ang, phi) => [Math.cos(ang) * Math.sin(phi), Math.sin(ang) * Math.sin(phi), Math.cos(phi)];
    // Without a cursor the moon keeps its own month: the logo's crescent, waxing to the open fruit and back.
    const tourLight = (t) => lightFrom(Math.PI - .25 + .5 * Math.sin(TAU * t / 56), 1.18 + .92 * Math.cos(TAU * t / 28));
    const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

    function pointerArt() {
      if (pointer.cssX === undefined) return null;
      return [pointer.cssX / unit, artH - pointer.cssY / unit];
    }

    function step(dt) {
      const intro = introStart === null ? -1 : (frozenIntro ?? (time - introStart));
      const arrived = intro >= 0;
      // light
      let target;
      const p = pointerArt();
      const dp = dive ? time - dive.start : -1;
      if (dive) target = lightFrom(Math.PI * .75, .04);   // the whole fruit opens before the dive
      else if (!arrived) target = lightFrom(Math.PI - .05, Math.PI - .06);
      else if (p && pointer.inside) {
        const vx = (p[0] - moon.x) / moon.r, vy = (p[1] - moon.y) / moon.r;
        const dist = Math.hypot(vx, vy);
        target = lightFrom(Math.atan2(vy, vx), .1 + 2.12 * smooth(.5, 3.2, dist));
      } else target = tourLight(time - tourStart);
      const k = frozenAt !== null || reduced ? 1 : 1 - Math.exp(-dt * (dive ? 9 : arrived && intro < 2 ? 2.4 : 3.6));
      for (let i = 0; i < 3; i++) L[i] += (target[i] - L[i]) * k;
      const n = Math.hypot(L[0], L[1], L[2]) || 1;
      L[0] /= n; L[1] /= n; L[2] /= n;
      // orbits
      const touch = !fine.matches;
      if (touch && arrived && !dive && !items.some((it) => it.matches(':focus')) && frozenAt === null) {
        // Phones: the spotlight visits each project in turn.
        const cycle = (time - tourStart - 2.5) / 4.5;
        const next = cycle < 0 ? -1 : Math.floor(cycle) % 3;
        if (next !== focus) items.forEach((it, i) => it.classList.toggle('is-lit', i === next));
        focus = next;
        focusFrom = null;
      }
      sats.forEach((s, i) => {
        const o = SATS[i];
        if (frozenAt !== null) s.angle = o.start + o.speed * time;
        else if (!reduced) s.angle += o.speed * dt * (focus === i ? .18 : 1) * (dive ? 1 + 40 * dp : 1);
        const pop = reduced || frozenAt !== null && frozenIntro === null ? 1 : Math.min(1, Math.max(0, (intro - .75 - i * .2) / .4));
        s.scale = pop >= 1 ? 1 : pop <= 0 ? 0 : 1 + 2.4 * (pop - 1) ** 3 + 1.4 * (pop - 1) ** 2;
        if (dive) s.scale *= Math.max(0, 1 - dp / (.28 + i * .05));   // the moons fall into the fruit
        const [a, b, tilt] = orbitsArt[i];
        const ex = a * Math.cos(s.angle), ey = b * Math.sin(s.angle);
        const sin = Math.sin(s.angle);
        s.z = -sin;
        s.x = Math.round(moon.x + Math.cos(tilt) * ex - Math.sin(tilt) * ey);
        s.y = Math.round(moon.y + Math.sin(tilt) * ex + Math.cos(tilt) * ey);
        s.r = Math.max(3, Math.round(o.size * moon.r * (1 - .1 * sin))) * s.scale;
        if (dive && s.r < 2.5) s.r = 0;   // gone, rather than a speck
      });
      linkGrow = focus >= 0 && focusFrom ? Math.min(1, linkGrow + dt / .35) : 0;
      // the dive: the fruit swells to fill the screen, then opens onto the night
      const view = { x: moon.x, y: moon.y, r: moon.r, warp: 0, hole: 0 };
      if (dive) {
        const ease = (x) => { const t = Math.min(1, Math.max(0, x)); return t * t * (3 - 2 * t); };
        const toCentre = ease((dp - .05) / .75);
        const cx = (innerWidth / 2 - box.left) / unit, cy = artH - (innerHeight / 2 - box.top) / unit;
        view.x = moon.x + (cx - moon.x) * toCentre;
        view.y = moon.y + (cy - moon.y) * toCentre;
        view.r = moon.r * Math.exp(7.2 * Math.min(1, Math.max(0, (dp - .1) / .95)) ** 1.7);
        view.warp = ease((dp - .15) / .35);
        const open = Math.min(1, Math.max(0, (dp - .78) / .55));
        view.hole = open > 0 ? 2 + Math.hypot(innerWidth, innerHeight) / unit * .6 * open ** 1.5 : 0;
        if (dp >= DIVE && !dive.done) { dive.done = true; dive.onDone?.(); }
      }
      // Juquinha: asleep. He breathes, an ear flicks now and then, and Morfeu close by makes him smile.
      const catX = Math.round(view.x) - 18, catY = Math.round(view.y + view.r) - 2;
      const near = !!(p && pointer.inside && Math.hypot(p[0] - (catX + 26), p[1] - (catY + 9)) < 34);
      const breath = !reduced && (time % 3.4) < 1.5;
      const twitch = !reduced && ((time % 9.5) < .22 || (near && (time % 2.1) < .18));
      const key = `${+breath},${+twitch},${+near}`;
      if (key !== catKey) {
        catKey = key;
        gl.activeTexture(gl.TEXTURE1);
        gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, CAT_W, CAT_H, gl.RGBA, gl.UNSIGNED_BYTE, catFrame(breath, twitch, near));
      }
      return { intro, catX, catY, view };
    }

    let tagSize = [0, 0];
    function place() {
      // The invisible links ride on the small moons, so Morfeu gets curious over them.
      sats.forEach((s, i) => {
        const hit = hits[i];
        if (!hit) return;
        const size = (s.r + 4) * 2 * unit;
        hit.style.width = hit.style.height = `${size}px`;
        hit.style.transform = `translate(${s.x * unit - size / 2}px, ${(artH - s.y) * unit - size / 2}px)`;
        hit.style.zIndex = s.z >= 0 ? 3 : 1;
      });
      if (tag) {
        const s = dive ? null : sats[focus];
        if (!s || s.r < 2) { tag.classList.remove('is-on'); return; }
        const item = items[focus];
        if (tag.dataset.for !== String(focus)) {
          tag.dataset.for = focus;
          tag.querySelector('b').textContent = item.dataset.name;
          tag.querySelector('span').textContent = item.dataset.status;
          tag.dataset.tone = item.dataset.tone;
          tagSize = [tag.offsetWidth, tag.offsetHeight];
        }
        tag.classList.add('is-on');
        const [tw, th] = tagSize;
        let x = (s.x + s.r + 5) * unit;
        if (x + tw > inner.clientWidth - 12) x = (s.x - s.r - 5) * unit - tw;
        tag.style.transform = `translate(${Math.round(x)}px, ${Math.round((artH - s.y) * unit - th / 2)}px)`;
      }
    }

    function draw(now) {
      raf = 0;
      if (!pace.ready(now)) { if (running()) raf = requestAnimationFrame(draw); return; }
      const dt = Math.min(.05, Math.max(0, (now - last) / 1000));   // a frame can be stamped before kick()
      last = now;
      if (frozenAt === null && !reduced) time += dt;
      const { intro, catX, catY, view } = step(dt);
      const mosaic = intro < 0 ? 24 : intro < .12 ? 16 : intro < .24 ? 8 : intro < .36 ? 4 : intro < .48 ? 2 : 1;
      const p = pointerArt();
      gl.viewport(0, 0, artW, artH);
      gl.uniform2f(u.uRes, artW, artH);
      gl.uniform1f(u.uTime, time);
      gl.uniform3f(u.uMoon, view.x, view.y, view.r);
      gl.uniform3f(u.uL, L[0], L[1], L[2]);
      gl.uniform1f(u.uMosaic, reduced ? 1 : mosaic);
      gl.uniform4f(u.uCopy, copyArt[0], copyArt[1], copyArt[2], copyArt[3]);
      gl.uniform4f(u.uCopy2, copyArt2[0], copyArt2[1], copyArt2[2], copyArt2[3]);
      gl.uniform4fv(u.uSat, sats.flatMap((s) => [s.x, s.y, s.r, s.z]));
      gl.uniform4fv(u.uOrb, orbitsArt.flatMap(([a, b, tilt], i) => [a, b, tilt, reduced || frozenIntro === null && frozenAt !== null ? 1 : Math.min(1, Math.max(0, (intro - .5 - i * .15) / .5))]));
      const heartAge = (time - heartAt) / 1.1;
      gl.uniform4f(u.uFx, dive ? -1 : focus, reduced ? 1 : Math.min(1, Math.max(0, intro / 1.3)), heartAge >= 0 && heartAge <= 1 ? heartAge : -1, moonHover && !reduced && !dive ? 1 : 0);
      let lx = 0, ly = 0;
      if (focusFrom) {
        const r = focusFrom.getBoundingClientRect();
        lx = (r.right - box.left) / unit + 3; ly = artH - (r.top + r.height / 2 - box.top) / unit;
      }
      gl.uniform4f(u.uLink, lx, ly, dive ? 0 : linkGrow, 0);
      const par = p && pointer.inside ? [Math.round((p[0] / artW - .5) * -6), Math.round((p[1] / artH - .5) * -4)] : [0, 0];
      gl.uniform2f(u.uPar, par[0], par[1]);
      gl.uniform2f(u.uCat, catX, catY);
      gl.uniform4f(u.uDive, view.x, view.y, view.warp, view.hole);
      gl.uniform2f(u.uSleep, moon.r, !reduced && !dive && intro > 1.5 ? 1 : 0);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      place();
      if (running()) raf = requestAnimationFrame(draw);
      else if (frozenAt !== null) window.__studioFrame = (window.__studioFrame || 0) + 1;
    }

    const isActive = () => document.body.dataset.section === 'estudio';
    function running() { return frozenAt === null && !reduced && !document.hidden && (isActive() || performance.now() < keepUntil); }
    function kick() { if (!raf) { last = performance.now(); pace.reset(); raf = requestAnimationFrame(draw); } }
    function arrive() {
      if (introStart !== null) return;
      introStart = frozenAt !== null ? time - 10 : time + (reduced ? -10 : .3);
      tourStart = introStart + 1.2;
      section.classList.add('is-arrived');
    }
    function sync() {
      if (isActive()) { arrive(); kick(); }
      else { keepUntil = performance.now() + 1100; kick(); }
    }
    // Reduced motion and frozen frames: still pictures, redrawn only when something changes.
    function invalidate() { if (!raf) raf = requestAnimationFrame(draw); }

    // ---- input ----
    section.addEventListener('pointermove', (event) => {
      if (event.pointerType !== 'mouse') return;
      box = inner.getBoundingClientRect();
      pointer.cssX = event.clientX - box.left;
      pointer.cssY = event.clientY - box.top;
      pointer.inside = true;
      invalidate();
    }, { passive: true });
    section.addEventListener('pointerleave', () => { pointer.inside = false; moonHover = false; invalidate(); });
    section.addEventListener('pointerdown', (event) => {
      const p = pointerArt();
      if (event.pointerType !== 'mouse' || !p) return;
      const cx = moon.x + 4, cy = moon.y + moon.r + 7;   // Juquinha, between his back and his head
      if (Math.hypot(p[0] - cx, p[1] - cy) < 30) { heartAt = time; invalidate(); }
    }, { passive: true });
    inner.parentElement.addEventListener('scroll', () => { box = inner.getBoundingClientRect(); }, { passive: true });
    if (moonLink) {
      moonLink.addEventListener('pointerenter', () => { moonHover = true; });
      moonLink.addEventListener('pointerleave', () => { moonHover = false; });
    }
    const spotlight = (i, from) => { focus = i; focusFrom = from; if (!from) linkGrow = 0; invalidate(); };
    const release = (i) => { if (focus === i) { focus = -1; focusFrom = null; invalidate(); } };
    items.forEach((item, i) => {
      item.addEventListener('pointerenter', () => spotlight(i, item));
      item.addEventListener('pointerleave', () => release(i));
      item.addEventListener('focus', () => spotlight(i, item));
      item.addEventListener('blur', () => release(i));
    });
    hits.forEach((hit, i) => {
      hit.addEventListener('pointerenter', () => { spotlight(i, null); items[i]?.classList.add('is-lit'); });
      hit.addEventListener('pointerleave', () => { release(i); items[i]?.classList.remove('is-lit'); });
    });

    document.addEventListener('portfolio:sectionchange', sync);
    document.addEventListener('visibilitychange', sync);
    new ResizeObserver(() => { layout(); invalidate(); if (!raf && isActive()) kick(); }).observe(inner);
    document.fonts?.ready.then(() => { layout(); invalidate(); });

    // js/studio-portal.js hands the way out to the scene: a dive into the fruit instead of a flat overlay.
    window.goiabaPortal = {
      ready: () => !reduced && !document.hidden && isActive() && canvas.width > 1,
      depart(onDone) {
        box = inner.getBoundingClientRect();
        dive = { start: time, onDone, done: false };
        moonHover = false;
        kick();
      },
      cancel() { dive = null; invalidate(); },
    };

    layout();
    section.classList.add('has-gl');
    if (dive) document.documentElement.classList.add('studio-departing');
    if (frozenAt !== null) arrive();
    raf = requestAnimationFrame(draw);   // one still frame, so the night is painted before the visit
    sync();
  }

  let started = false;
  const begin = () => { if (!started) { started = true; start(); } };
  const here = () => document.body.dataset.section === 'estudio';
  if (here()) begin();
  else {
    document.addEventListener('portfolio:sectionchange', () => { if (here()) begin(); });
    const idle = window.requestIdleCallback ? (fn) => requestIdleCallback(fn, { timeout: 2000 }) : (fn) => setTimeout(fn, 0);
    const settle = () => setTimeout(() => idle(begin), 3200);
    if (document.readyState === 'complete') settle();
    else addEventListener('load', settle, { once: true });
  }
})();
