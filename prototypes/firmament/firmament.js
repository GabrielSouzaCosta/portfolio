// Firmament hero prototype. The engraving draws itself in gold fire from the knight,
// the sky cracks and bursts open onto a turning orrery, and the cosmos spills into
// the medieval world: the whale swims out over the valley, stars fall, orbits and
// light cross the paper. One WebGL2 pass; every animation parameter comes from JS.
(() => {
  const hero = document.getElementById('hero');
  const canvas = hero.querySelector('canvas');
  const copy = hero.querySelector('.copy');
  const params = new URLSearchParams(location.search);
  const frozenAt = params.has('at') ? Number(params.get('at')) : null;
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const ART = [2560, 1280];
  const HOLE = [1599.3, 361.8, 243];
  const DRAW = [0.2, 4.4], STAG_DRAW = [1.9, 4.7], CRACK = [4.4, 5.3], TEAR = [5.3, 6.9];
  const WHALE = { size: [900, 384] }, TURTLE = { size: [420, 296], width: 125 };
  const STAG = { size: [883, 1109], x: 1296, feet: 938, scale: .56 };
  const NECK = [639, 549];
  // Lanterns then tassels: pivot x, y, length, half width (sprite px).
  const PENDULUMS = [[452, 160, 125, 30], [584, 110, 90, 24], [700, 120, 90, 24], [565, 258, 150, 26], [852, 228, 112, 26],
    [607, 264, 112, 13], [504, 234, 76, 12], [784, 159, 70, 12], [624, 164, 60, 12]];
  const LANTERN_CENTERS = [[452, 238], [583, 160], [700, 172], [565, 322], [852, 290]];

  const vertex = `#version 300 es
  in vec2 aPos;
  void main() { gl_Position = vec4(aPos, 0., 1.); }`;

  const fragment = `#version 300 es
  precision highp float;
  uniform sampler2D uWorld, uPaper, uMaps, uOrder, uCosmos, uWhale, uTurtle, uStag, uStagOrder, uMills;
  uniform vec2 uRes, uOffset, uMouse;
  uniform float uScale, uTime, uDraw, uStagDraw, uCrack, uTear, uBurst, uTearStart, uTopFade;
  uniform vec3 uHole;
  uniform vec4 uCalm;
  uniform vec4 uWhaleXf, uTurtleXf;
  uniform float uWhaleLod, uTurtleLod, uWhaleFar, uStagLod;
  uniform vec3 uStagXf;
  uniform float uHead, uEar, uTail, uBreath, uBlink;
  uniform float uSwing[9];
  uniform vec4 uPend[9];
  uniform vec2 uLant[5];
  uniform vec4 uStar;     // head xy, start xy
  uniform vec4 uStarFx;   // alpha, flash x, flash y, flash amount
  out vec4 outColor;

  const vec2 ART = vec2(2560., 1280.);
  const vec2 WHALE_PX = vec2(900., 384.);
  const vec2 TURTLE_PX = vec2(420., 296.);
  const vec2 STAG_PX = vec2(883., 1109.);
  const float TILT = -.12;
  const float SQUASH = .5;
  const float TAU = 6.2831853;
  const vec3 GOLD = vec3(.86, .67, .31);
  const vec3 SEPIA = vec3(.24, .16, .09);
  const vec3 FIRE = vec3(1., .64, .24);
  const vec3 LUMA = vec3(.299, .587, .114);

  float hash(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
  float noise(vec2 p) {
    vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
    return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y);
  }
  float fbm(vec2 p) { float v = 0., a = .5; for (int i = 0; i < 4; i++) { v += a * noise(p); p *= 2.03; a *= .5; } return v; }
  mat2 rot(float a) { float c = cos(a), s = sin(a); return mat2(c, s, -s, c); }
  float line(float d, float w) { float fw = max(fwidth(d), 1e-4); return 1. - smoothstep(w - fw, w + fw, abs(d)); }
  float inside(vec2 uv) { return step(0., uv.x) * step(uv.x, 1.) * step(0., uv.y) * step(uv.y, 1.); }

  // ---------- The orrery ----------
  vec2 toOrbit(vec2 d) { vec2 e = rot(TILT) * d; return vec2(e.x, e.y / SQUASH); }
  vec2 fromOrbit(vec2 e) { return rot(-TILT) * vec2(e.x, e.y * SQUASH); }
  float speed(float r) { return .1 * pow(r / 80., -1.5); }

  float orbits(vec2 p, float t) {
    vec2 e = toOrbit(p - uHole.xy);
    float r = length(e), ang = atan(e.y, e.x), rings = 0.;
    for (int i = 0; i < 14; i++) {
      float R = 40. + float(i) * 34. + mod(float(i), 2.) * 4.;
      float a = ang - speed(R) * t;
      float leaf = .72 + .28 * noise(vec2(a * R * .07, float(i) * 7.));
      rings = max(rings, line(r - R, .7) * leaf);
      if (mod(float(i), 3.) == 1.) {
        float tick = 1. - smoothstep(.04, .09, abs(fract(a * 60. / TAU + .5) - .5));
        rings = max(rings, tick * step(abs(r - R), 4.) * .8);
      }
    }
    return rings;
  }

  vec3 planet(vec3 col, vec2 p, vec2 c, float r, vec3 tint, float ringed) {
    vec2 v = (p - c) / r;
    float d = length(v);
    vec2 vr = rot(.38) * v; vr.y /= .3;
    float band = ringed * (1. - smoothstep(.1, .14, abs(length(vr) - 1.62)));
    col = mix(col, GOLD * .95, band * step(vr.y, 0.) * .9);
    vec3 n = vec3(v, sqrt(max(0., 1. - d * d)));
    vec3 Ldir = normalize(vec3((uHole.xy - c) / 200., .8));
    float shade = clamp(dot(n, Ldir) * .8 + .25, 0., 1.);
    float cut = smoothstep(-.35, .35, sin(dot(p, vec2(.8, .6)) * 1.9) - (shade * 2.2 - 1.));
    vec3 body = mix(mix(tint, SEPIA, cut * .55), SEPIA, smoothstep(.82, .97, d) * .8);
    col = mix(col, body, 1. - smoothstep(1. - 1.6 / r, 1., d));
    return mix(col, GOLD, band * step(0., vr.y) * .95);
  }

  vec3 gear(vec3 col, vec2 p, vec2 c, float R, float teeth, float turn) {
    vec2 v = p - c;
    float r = length(v), a = atan(v.y, v.x) - turn;
    float tooth = smoothstep(.3, .45, abs(fract(a * teeth / TAU) - .5));
    float outer = R + 4. * tooth;
    float rim = step(R - 7., r) * (1. - smoothstep(outer - .8, outer + .8, r));
    float hub = 1. - smoothstep(R * .22 - .8, R * .22 + .8, r);
    float spokes = (1. - smoothstep(1.8, 2.8, abs(sin(a * 3.)) * r)) * step(R * .2, r) * step(r, R - 6.);
    float body = max(max(rim, hub), spokes);
    col = mix(col, GOLD * (.82 + .18 * sin(a * 2. + 1.)), body);
    return mix(col, SEPIA, (line(r - (R - 7.), .6) * step(r, R) + line(r - R * .22, .6)) * .6);
  }

  vec3 sun(vec3 col, vec2 p, float t) {
    vec2 v = p - uHole.xy;
    float r = length(v), a = atan(v.y, v.x) + t * .04;
    float sector = a * 16. / TAU;
    float wavy = mod(floor(sector), 2.);
    float k = fract(sector + wavy * sin(r * .3) * .08);
    float len = mix(70., 54., wavy);
    float ray = (1. - abs(k - .5) * 2. > (r - 26.) / (len - 26.) ? 1. : 0.) * step(24., r) * step(r, len);
    col += GOLD * exp(-r * r / (2. * 80. * 80.)) * .35;
    col = mix(col, GOLD * (.85 + .15 * sin(r * .6)), ray * .9);
    vec3 face = mix(vec3(.98, .85, .52), GOLD, smoothstep(0., 28., r));
    face = mix(face, SEPIA, line(r - 27.5, .7) * .7);
    return mix(col, face, 1. - smoothstep(27., 29., r));
  }

  vec3 comet(vec3 col, vec2 p, vec2 from, vec2 to, float period, float offset, float t) {
    float ph = fract((t + offset) / period) / .22;
    if (ph > 1.) return col;
    vec2 head = mix(from, to, ph), dir = normalize(from - to);
    float s = clamp(dot(p - head, dir), 0., 90.);
    float d = length(p - head - dir * s);
    float w = mix(2.6, .4, s / 90.);
    float tail = pow(1. - s / 90., 1.6) * (1. - smoothstep(w * .4, w, d));
    float fade = smoothstep(0., .12, ph) * smoothstep(1., .8, ph);
    return col + (GOLD * tail * .9 + vec3(1., .9, .7) * exp(-dot(p - head, p - head) / 14.)) * fade;
  }

  vec4 turtle(vec2 p, float t) {
    vec2 sp = rot(-uTurtleXf.z) * (p - uTurtleXf.xy) * (TURTLE_PX.x / uTurtleXf.w) + TURTLE_PX * .5;
    float s = t * 1.2;
    vec2 a = vec2(212., 194.);
    float wa = smoothstep(186., 204., sp.y) * smoothstep(188., 206., sp.x) * (1. - smoothstep(292., 310., sp.x));
    sp = a + rot(-sin(s) * .3 * wa) * (sp - a);
    vec2 b = vec2(92., 172.);
    float wb = smoothstep(164., 182., sp.y) * (1. - smoothstep(108., 124., sp.x));
    sp = b + rot(-sin(s - .6) * .22 * wb) * (sp - b);
    vec2 c = vec2(336., 196.);
    float wc = smoothstep(326., 342., sp.x) * smoothstep(168., 184., sp.y);
    sp = c + rot(sin(s + 1.2) * .16 * wc) * (sp - c);
    vec2 uv = sp / TURTLE_PX;
    return textureLod(uTurtle, uv, uTurtleLod) * inside(uv);
  }

  vec3 cosmos(vec2 p, float t) {
    vec2 d = p - uHole.xy;
    vec3 col = texture(uCosmos, (vec2(800., 450.) + rot(-t * .012) * d / 1.45) / vec2(1600., 900.)).rgb;
    float star = clamp((col.r - col.b) * 4. - .15, 0., 1.);
    col += star * (noise(p * .3 + vec2(t * 2.1, -t * 1.3)) - .4) * vec3(.7, .5, .2);
    col += vec3(.05, .07, .18) * exp(-dot(d, d) / (2. * 200. * 200.));
    col = mix(col, GOLD * 1.05, orbits(p, t) * .9);
    col = sun(col, p, t);
    col = gear(col, p, uHole.xy + vec2(-150., -165.), 42., 20., t * .22);
    col = gear(col, p, uHole.xy + vec2(150., 150.), 30., 14., -t * .33);
    vec4 P[5] = vec4[5](vec4(108., 12., .6, 1.), vec4(176., 17., 2.4, 1.), vec4(244., 10., 4.1, 0.), vec4(312., 14., 1.2, 0.), vec4(74., 7., 5., 0.));
    vec3 T[5] = vec3[5](vec3(.92, .87, .74), GOLD, vec3(.78, .34, .2), vec3(.62, .71, .84), GOLD);
    for (int i = 0; i < 5; i++) {
      float th = P[i].z + speed(P[i].x) * t;
      vec2 c = uHole.xy + fromOrbit(P[i].x * vec2(cos(th), sin(th)));
      col = planet(col, p, c, P[i].y * (1. + .14 * sin(th)), T[i], P[i].w);
    }
    col = comet(col, p, uHole.xy + vec2(210., -200.), uHole.xy + vec2(-120., 120.), 9., 2., t);
    vec4 tu = turtle(p, t);
    return col * (1. - tu.a) + tu.rgb;
  }

  // ---------- Creatures ----------
  vec4 whale(vec2 p, float t) {
    vec2 sp = rot(-uWhaleXf.z) * (p - uWhaleXf.xy) * (WHALE_PX.x / max(uWhaleXf.w, 1.)) + WHALE_PX * .5;
    float u = sp.x / WHALE_PX.x;
    float bend = smoothstep(.28, 1., u);
    sp.y -= 24. * bend * bend * sin(TAU * u * .75 - t * 1.5) + 3. * sin(t * 1.5 - 1.) * (1. - u);
    vec2 root = vec2(300., 262.);
    float fin = 1. - smoothstep(55., 95., length(sp - vec2(325., 308.)));
    sp = root + rot(-sin(t * 1.5 + .7) * .16 * fin) * (sp - root);
    vec2 uv = sp / WHALE_PX;
    vec4 c = textureLod(uWhale, uv, uWhaleLod) * inside(uv);
    c.rgb = mix(c.rgb, vec3(.16, .22, .45) * c.a, uWhaleFar * .55);
    return c;
  }

  float headWeight(vec2 s) {
    float neck = (1. - smoothstep(420., 540., s.y)) * smoothstep(528., 548., s.x);
    float crown = (1. - smoothstep(300., 314., s.y)) * smoothstep(386., 400., s.x);
    return max(neck, crown);
  }

  vec4 stag(vec2 p) {
    vec2 sp = (p - uStagXf.xy) / uStagXf.z;
    vec2 neck = vec2(639., 549.);
    sp = neck + rot(-uHead * headWeight(sp)) * (sp - neck);
    for (int i = 0; i < 9; i++) {
      vec4 P = uPend[i];
      vec2 d = sp - P.xy;
      float w = (1. - smoothstep(P.w * .75, P.w, abs(d.x))) * smoothstep(-8., 2., d.y) * (1. - smoothstep(P.z, P.z + 12., d.y));
      sp = P.xy + rot(-uSwing[i] * w) * d;
    }
    vec2 ear = vec2(697., 342.);
    sp = ear + rot(-uEar * (1. - smoothstep(38., 60., length(sp - vec2(668., 306.))))) * (sp - ear);
    vec2 tail = vec2(108., 556.);
    sp = tail + rot(-uTail * (1. - smoothstep(42., 66., length(sp - vec2(84., 600.))))) * (sp - tail);
    float wb = 1. - smoothstep(150., 260., length((sp - vec2(330., 650.)) * vec2(.8, 1.3)));
    sp.y = 650. + (sp.y - 650.) / (1. + uBreath * wb);
    vec2 uv = sp / STAG_PX;
    vec4 c = textureLod(uStag, uv, uStagLod) * inside(uv);
    float eye = 1. - smoothstep(6., 10., length((sp - vec2(751., 352.)) * vec2(1., 1.7)));
    c = mix(c, textureLod(uStag, (sp - vec2(0., 15.)) / STAG_PX, uStagLod), eye * uBlink);
    float o = textureLod(uStagOrder, uv, 0.).r;
    float e = uStagDraw * 1.08 - o;
    float shown = smoothstep(0., .02, e);
    float fuse = exp(-pow(e / .014, 2.)) * c.a * (1. - smoothstep(.95, 1., uStagDraw));
    return vec4(c.rgb * shown + FIRE * fuse * 1.3, c.a * shown + fuse * .9 * (1. - shown));
  }

  void main() {
    vec2 frag = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y);
    vec2 p0 = (frag - uOffset) / uScale;
    float t = uTime;
    vec2 p = p0 + uMouse * vec2(5., 3.);

    // Wind in the cape and the oak, slow breath in the clouds.
    vec3 m0 = texture(uMaps, p / ART).rgb;
    vec2 q = p;
    q += m0.g * vec2(sin(q.y * .035 - t * 2.2 + q.x * .01) * 5. + sin(t * 1.3 + q.y * .02) * 3., sin(q.x * .05 - t * 1.8) * 2.5);
    q.x += m0.b * sin(t * .17 + q.y * .004) * 8.;
    vec3 maps = texture(uMaps, q / ART).rgb;
    vec3 ink = texture(uWorld, q / ART).rgb;
    vec3 paper = texture(uPaper, p / ART).rgb;
    vec3 ord = texture(uOrder, p / ART).rgb;
    // Until it tears, the sky patch and its curls are plain sheet.
    ink = mix(ink, paper, max(smoothstep(.02, .25, maps.r), ord.g * (1. - smoothstep(.7, 1., uTear))));

    // Windmills turn over the plate (their arms live in a small atlas).
    vec4 H[3] = vec4[3](vec4(922., 940., 56., .55), vec4(1110., 925., 52., -.42), vec4(780., 781., 18., .7));
    for (int i = 0; i < 3; i++) {
      vec2 l = rot(-t * H[i].w) * (p - H[i].xy) + 64.;
      vec2 uv = (l + vec2(float(i) * 128., 0.)) / vec2(384., 128.);
      vec4 arm = textureLod(uMills, uv, 0.) * step(0., l.x) * step(l.x, 128.) * step(0., l.y) * step(l.y, 128.);
      ink = ink * (1. - arm.a) + arm.rgb;
    }

    // The plate draws itself along its strokes, a hot gold tip running ahead of the ink.
    float amount = clamp((dot(paper, LUMA) - dot(ink, LUMA)) * 4., 0., 1.);
    float e = uDraw * 1.06 - ord.r;
    float shown = smoothstep(0., .012, e);
    float tip = exp(-pow(e / .01, 2.)) * amount * (1. - smoothstep(.96, 1., uDraw));
    float cool = smoothstep(0., .02, e) * (1. - smoothstep(.02, .09, e)) * amount;
    vec3 world = mix(paper, ink, shown);
    world = mix(world, world * vec3(1.35, 1.02, .6), cool * .6) + FIRE * tip * 1.4;

    // Above the plate (phones), bare parchment fades into it.
    if (uTopFade > 0.) world = mix(texture(uPaper, vec2(p.x, abs(p.y) + 20.) / ART).rgb, world, smoothstep(-10., 130., p.y));

    // Calm the plate under the copy so it stays easy to read.
    vec2 nearest = clamp(p, uCalm.xy, uCalm.zw);
    float calm = 1. - smoothstep(0., 140., length(p - nearest));
    world = mix(world, paper, calm * .66);

    // The sky: backlit, cracked, then burnt open onto the cosmos.
    float holeA = smoothstep(.05, .25, maps.r);
    float f = 1. - clamp((maps.r - .3) / .7, 0., 1.);
    float fn = f + (fbm(p * .012 + 3.) - .5) * .22;
    float front = uTear * 1.3 - fn;
    float open = holeA * smoothstep(0., .012, front) * step(.001, uTear);
    float scorch = holeA * (1. - open) * smoothstep(-.12, 0., front) * step(.001, uTear);
    float edge = holeA * exp(-pow(front / .016, 2.)) * (1. - smoothstep(.85, 1., uTear)) * step(.001, uTear);
    float flick = .75 + .25 * sin(t * 31.) * sin(t * 17.);
    // The crack runs out from the middle: a dark fissure with a white-hot core.
    float grow = smoothstep(0., .25, uCrack * 1.5 - length(p - uHole.xy) / uHole.z);
    float fissure = holeA * exp(-pow(f / .035, 2.)) * grow * (1. - open);
    float core = holeA * exp(-pow(f / .011, 2.)) * grow * (1. - open);
    world += vec3(.4, .25, .08) * holeA * uCrack * (1. - f) * .55 * (1. - open);
    world = mix(world, SEPIA * .45, fissure * .75);
    world += vec3(1., .78, .42) * core * 1.6 * flick;
    world = mix(world, SEPIA * .6, scorch * .85);

    vec3 sky = cosmos(p0 + uMouse * vec2(-18., -11.), t);
    vec3 col = mix(world, sky, open) + FIRE * edge * 1.2;

    // The cosmos spills out: orbits continue over the paper, stars settle on it, light pours out.
    float paperness = smoothstep(.7, .8, dot(world, LUMA)) * (1. - holeA) * (1. - calm);
    vec2 dh = p - uHole.xy;
    float reach = length(dh * vec2(1., 1.4)) / uHole.z;
    float spill = smoothstep(.6, 1., uTear);
    col = mix(col, GOLD * .95, orbits(p, t) * paperness * smoothstep(2.3, 1.05, reach) * .5 * spill);
    vec2 cell = floor(p / 30.), fc = fract(p / 30.) - .5 + (vec2(hash(cell + 3.), hash(cell + 9.)) - .5) * .5;
    float h = hash(cell);
    float glint = (exp(-abs(fc.x) * 60.) * exp(-abs(fc.y) * 9.) + exp(-abs(fc.y) * 60.) * exp(-abs(fc.x) * 9.)) * step(.955, h);
    col = mix(col, GOLD, glint * paperness * smoothstep(2.6, 1.1, reach) * (.55 + .45 * sin(t * 2. + h * 60.)) * spill);
    float ang = atan(dh.y, dh.x);
    float rays = pow(noise(vec2(ang * 9., t * .12)), 3.) * 1.6 + .12;
    float fall = exp(-max(length(dh) - uHole.z, 0.) / 600.) * (1. - holeA);
    col += vec3(1., .8, .5) * rays * fall * uBurst * .45 * (1. - calm * .8);

    // The stag stands on the ledge, in front of the opening.
    vec2 feet = uStagXf.xy + vec2(380., 1100.) * uStagXf.z;
    float shadow = exp(-pow((p.x - feet.x) / 210., 2.) - pow((p.y - feet.y + 4.) / 16., 2.));
    col *= 1. - .25 * shadow * uStagDraw;
    vec4 st = stag(p0 + uMouse * vec2(3., 2.));
    col = col * (1. - st.a) + st.rgb;

    // The whale leaves the cosmos and swims out over the world, its shadow on the paper.
    vec2 wp = p0 + uMouse * vec2(-10., -6.);
    vec4 ws = whale(wp - vec2(24., 34.) * (1. - uWhaleFar), t);
    col *= 1. - .2 * ws.a * (1. - open) * (1. - uWhaleFar);
    vec4 wh = whale(wp, t);
    col = col * (1. - wh.a) + wh.rgb;

    // A star falls out of the tear into the valley.
    if (uStarFx.x > 0.) {
      vec2 dir = normalize(uStar.zw - uStar.xy);
      float s = clamp(dot(p - uStar.xy, dir), 0., 260.);
      float dd = length(p - uStar.xy - dir * s);
      float tail = pow(1. - s / 260., 1.8) * (1. - smoothstep(.3, 3.4 * (1. - s / 300.), dd));
      col += (GOLD * tail + vec3(1., .92, .7) * exp(-dot(p - uStar.xy, p - uStar.xy) / 30.)) * uStarFx.x;
    }
    col += vec3(1., .78, .45) * exp(-dot(p - uStarFx.yz, p - uStarFx.yz) / (2. * 60. * 60.)) * uStarFx.w;

    // Embers thrown out as the sky tears.
    float age0 = t - uTearStart;
    if (age0 > 0. && age0 < 4.) {
      for (int i = 0; i < 40; i++) {
        float fi = float(i);
        float a = hash(vec2(fi, 1.7)) * TAU;
        float born = hash(vec2(fi, 5.1)) * 1.3;
        float age = age0 - born;
        float life = 1.4 + hash(vec2(fi, 9.3)) * 1.4;
        if (age <= 0. || age > life) continue;
        vec2 pos = uHole.xy + vec2(cos(a), sin(a)) * (uHole.z * .6 + (140. + 260. * hash(vec2(fi, 2.2))) * age) + vec2(0., 40. * age * age);
        float d = length(p - pos);
        col += FIRE * exp(-d * d / (2. * 3.2 * 3.2)) * (1. - age / life) * 1.4;
      }
    }

    for (int i = 0; i < 5; i++) {
      float d = length(p - uLant[i]);
      float flicker = .8 + .2 * noise(vec2(t * 5., float(i) * 3.1));
      col += vec3(1., .7, .3) * exp(-d * d / (2. * 13. * 13.)) * .38 * flicker * smoothstep(.85, 1., uStagDraw);
    }

    vec2 vig = frag / uRes - .5;
    col *= 1. - .16 * dot(vig, vig);
    col += .035 * (hash(frag + fract(t)) - .5);
    outColor = vec4(col, 1.);
  }`;

  const gl = canvas.getContext('webgl2', { antialias: false, alpha: false, powerPreference: 'high-performance' });
  if (!gl) { hero.classList.add('is-awake'); return; }

  function compile(type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader));
    return shader;
  }
  const program = gl.createProgram();
  gl.attachShader(program, compile(gl.VERTEX_SHADER, vertex));
  gl.attachShader(program, compile(gl.FRAGMENT_SHADER, fragment));
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program));
  gl.useProgram(program);

  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const aPos = gl.getAttribLocation(program, 'aPos');
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

  const u = {};
  for (let i = 0, n = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS); i < n; i++) {
    const name = gl.getActiveUniform(program, i).name.replace('[0]', '');
    u[name] = gl.getUniformLocation(program, name);
  }

  const load = src => new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
  function texture(unit, img, { premultiply = false, mips = false } = {}) {
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, gl.createTexture());
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, premultiply);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    if (mips) gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, mips ? gl.LINEAR_MIPMAP_LINEAR : gl.LINEAR);
  }

  const TEXTURES = [
    ['uWorld', 'world'], ['uPaper', 'paper'], ['uMaps', 'maps'], ['uOrder', 'order'], ['uCosmos', 'cosmos'],
    ['uWhale', 'whale', { premultiply: true, mips: true }], ['uTurtle', 'turtle', { premultiply: true, mips: true }],
    ['uStag', 'stag', { premultiply: true, mips: true }], ['uStagOrder', 'stag-order'], ['uMills', 'mills'],
  ];
  Promise.all(TEXTURES.map(([, file]) => load(`firmament/${file}.webp`))).then(images => {
    images.forEach((img, i) => { texture(i, img, TEXTURES[i][2]); gl.uniform1i(u[TEXTURES[i][0]], i); });
    gl.uniform3f(u.uHole, ...HOLE);
    gl.uniform4fv(u.uPend, PENDULUMS.flat());
    start();
  }).catch(error => {
    console.warn('Firmament needs a local server (python3 -m http.server 4173).', error);
    hero.classList.add('is-awake');
  });

  // Cover the viewport; keep the tear, the stag and the knight in frame.
  let view = { s: 1, x: 0, y: 0, dpr: 1 };
  function resize() {
    const dpr = Math.min(devicePixelRatio || 1, 1.5);
    const w = hero.clientWidth, h = hero.clientHeight;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    gl.viewport(0, 0, canvas.width, canvas.height);
    const r = copy.getBoundingClientRect(), top = hero.getBoundingClientRect();
    let s, x, y, portrait = w / h < .9;
    if (portrait) {
      // Phones: the copy sits on bare parchment, the scene rises beneath it.
      const below = r.bottom - top.top + 16;
      s = Math.min(.8, Math.max(.28, (h - 24 - below) / (938 - 105)));
      y = h - 24 - 938 * s;
      x = Math.min(0, Math.max(w - ART[0] * s, w / 2 - 1650 * s));
    } else {
      s = Math.max(w / ART[0], h / ART[1]);
      x = (w - ART[0] * s) * .8;
      y = (h - ART[1] * s) * .3;
    }
    view = { s, x, y, dpr };
    gl.uniform1f(u.uTopFade, portrait ? 1 : 0);
    const toArt = (cx, cy) => [(cx - top.left - x) / s, (cy - top.top - y) / s];
    gl.uniform4f(u.uCalm, ...toArt(r.left, r.top), ...toArt(r.right, r.bottom));
    if (still) requestAnimationFrame(frame);
  }
  addEventListener('resize', resize);

  const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
  addEventListener('pointermove', event => {
    mouse.tx = event.clientX / innerWidth * 2 - 1;
    mouse.ty = event.clientY / innerHeight * 2 - 1;
  });

  const clamp01 = x => Math.min(1, Math.max(0, x));
  const smooth = x => x * x * (3 - 2 * x);
  const ease = x => x < .5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2;
  const span = (t, [a, b], fn = ease) => fn(clamp01((t - a) / (b - a)));
  const pulse = (t, period, width, offset = 0) => { const k = ((t + offset) % period + period) % period; return Math.exp(-((k - width) ** 2) / (width * width * .18)); };
  const rotate = ([x, y], [cx, cy], a) => { const c = Math.cos(a), s = Math.sin(a); return [cx + c * (x - cx) - s * (y - cy), cy + s * (x - cx) + c * (y - cy)]; };

  // Catmull-Rom through [x, y, width]: the whale grows as it comes out of deep space.
  const WHALE_PATH = [[1690, 300, 60], [1660, 330, 80], [1560, 360, 160], [1470, 280, 280], [1330, 170, 420], [1020, 95, 560], [540, 70, 620], [-80, 110, 660], [-700, 160, 680]];
  function catmull(points, k) {
    const n = points.length - 1, f = Math.min(Math.max(k, 0), .9999) * n, i = Math.floor(f), t = f - i;
    const p0 = points[Math.max(i - 1, 0)], p1 = points[i], p2 = points[i + 1], p3 = points[Math.min(i + 2, n)];
    return p1.map((_, c) => .5 * (2 * p1[c] + (-p0[c] + p2[c]) * t + (2 * p0[c] - 5 * p1[c] + 4 * p2[c] - p3[c]) * t * t + (-p0[c] + 3 * p1[c] - 3 * p2[c] + p3[c]) * t * t * t));
  }
  function whaleAt(t) {
    const local = t - (TEAR[0] + 1.1), cycle = 46, travel = 24;
    const phase = ((local % cycle) + cycle) % cycle;
    if (local < 0 || phase > travel) return { xf: [-9999, -9999, 0, 1], far: 0 };
    const k = smooth(phase / travel) * .55 + phase / travel * .45;
    const [x, y, w] = catmull(WHALE_PATH, k), [x2, y2] = catmull(WHALE_PATH, k + .004);
    return { xf: [x, y, Math.atan2(y2 - y, x2 - x) - Math.PI, w], far: clamp01(1 - (w - 60) / 300) };
  }
  function turtleAt(t) {
    const cycle = 48, phase = ((t - TEAR[0] + 16) % cycle + cycle) % cycle / cycle;
    const k = Math.min(phase / .85, 1.2);
    return [1880 - 580 * k, 505 + 12 * Math.sin(k * 5) + 3 * Math.sin(t * 1.2), -.05 + .04 * Math.sin(t * .6), TURTLE.width];
  }
  function fallingStar(t) {
    const local = t - (TEAR[0] + 3.5), cycle = 13;
    if (local < 0) return { star: [0, 0, 0, 0], fx: [0, 0, 0, 0] };
    const phase = ((local % cycle) + cycle) % cycle;
    const from = [1470, 470], to = [760 + 120 * Math.sin(Math.floor(local / cycle) * 2.1), 760];
    const k = Math.min(phase / 1.3, 1);
    const flash = phase > 1.3 ? Math.exp(-(phase - 1.3) * 2.2) * .5 : 0;
    const head = [from[0] + (to[0] - from[0]) * k, from[1] + (to[1] - from[1]) * k ** 1.4];
    return { star: [...head, ...from], fx: [phase < 1.3 ? Math.sin(Math.PI * k) ** .5 : 0, to[0], to[1], flash] };
  }

  // The stag lives: it breathes, looks up when the sky breaks, lowers its head, flicks ear and tail.
  function stagPose(t) {
    const startle = t > TEAR[0] ? Math.exp(-((t - TEAR[0] - 1.2) ** 2) / 1.6) : 0;
    const graze = pulse(t, 17, 3.2, 6);
    const head = .035 * Math.sin(t * .45) - .12 * startle + .1 * graze;
    const wind = 1 + 2.2 * (t > TEAR[0] ? Math.exp(-(t - TEAR[0]) / 2.5) : 0);
    const swing = PENDULUMS.map((_, i) => (.07 + .02 * (i % 3)) * wind * Math.sin(t * (1.7 + .17 * i) + i * 1.9) + head * -.6);
    return { head, swing, ear: .38 * pulse(t, 6.3, .5) + .25 * startle, tail: .3 * pulse(t, 4.7, .45, 2), breath: .009 * Math.sin(t * 1.25), blink: pulse(t, 3.9, .14) > .5 ? 1 : 0 };
  }

  let origin = 0;
  function start() {
    resize();
    origin = performance.now();
    document.querySelector('.replay').addEventListener('click', () => { origin = performance.now(); hero.classList.remove('is-awake'); });
    requestAnimationFrame(frame);
  }

  function frame(now) {
    const t = still ? 40 : frozenAt ?? (now - origin) / 1000;
    if (t > 1.1) hero.classList.add('is-awake');
    mouse.x += (mouse.tx - mouse.x) * .05;
    mouse.y += (mouse.ty - mouse.y) * .05;
    const { s, x, y, dpr } = view;
    gl.uniform2f(u.uRes, canvas.width, canvas.height);
    gl.uniform2f(u.uOffset, x * dpr, y * dpr);
    gl.uniform1f(u.uScale, s * dpr);
    gl.uniform1f(u.uTime, t);
    gl.uniform2f(u.uMouse, mouse.x, mouse.y);
    gl.uniform1f(u.uDraw, span(t, DRAW, x => x));
    gl.uniform1f(u.uStagDraw, span(t, STAG_DRAW, smooth));
    gl.uniform1f(u.uCrack, span(t, CRACK, smooth) * (t < TEAR[1] ? 1 : 0));
    gl.uniform1f(u.uTear, span(t, TEAR, x => 1 - (1 - x) ** 2.2));
    gl.uniform1f(u.uTearStart, TEAR[0]);
    gl.uniform1f(u.uBurst, t < TEAR[0] ? 0 : Math.min(1, (t - TEAR[0]) / .4) * (.2 + .8 * Math.exp(-Math.max(0, t - TEAR[0] - .4) / 1.5)));

    const whale = whaleAt(t);
    gl.uniform4f(u.uWhaleXf, ...whale.xf);
    gl.uniform1f(u.uWhaleFar, whale.far);
    gl.uniform1f(u.uWhaleLod, Math.max(0, Math.log2(WHALE.size[0] / Math.max(whale.xf[3] * s * dpr, 1))));
    gl.uniform4f(u.uTurtleXf, ...turtleAt(t));
    gl.uniform1f(u.uTurtleLod, Math.max(0, Math.log2(TURTLE.size[0] / (TURTLE.width * s * dpr))));

    const top = STAG.feet - STAG.size[1] * STAG.scale;
    gl.uniform3f(u.uStagXf, STAG.x, top, STAG.scale);
    gl.uniform1f(u.uStagLod, Math.max(0, Math.log2(1 / (STAG.scale * s * dpr))));
    const pose = stagPose(t);
    gl.uniform1f(u.uHead, pose.head);
    gl.uniform1fv(u.uSwing, pose.swing);
    gl.uniform1f(u.uEar, pose.ear);
    gl.uniform1f(u.uTail, pose.tail);
    gl.uniform1f(u.uBreath, pose.breath);
    gl.uniform1f(u.uBlink, pose.blink);
    const lanterns = LANTERN_CENTERS.map((c, i) => {
      const swung = rotate(c, PENDULUMS[i], pose.swing[i]);
      const [sx, sy] = rotate(swung, NECK, pose.head);
      return [STAG.x + sx * STAG.scale, top + sy * STAG.scale];
    });
    gl.uniform2fv(u.uLant, lanterns.flat());

    // A tremor while the sky splits.
    const quake = t > CRACK[0] && t < TEAR[0] + .5 ? (t - CRACK[0]) / (TEAR[0] + .5 - CRACK[0]) : 0;
    canvas.style.transform = quake ? `translate(${(Math.random() - .5) * 3 * quake}px, ${(Math.random() - .5) * 3 * quake}px)` : '';

    const star = fallingStar(t);
    gl.uniform4f(u.uStar, ...star.star);
    gl.uniform4f(u.uStarFx, ...star.fx);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    if (!still) requestAnimationFrame(frame);
  }
})();
