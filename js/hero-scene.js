/* Hero plate: one generated image (assets/images/hero-plate.webp), many worlds.
   Hovering a creature sends a burning ink front across the hero and repaints the
   plate and the copy into that creature's world. Nothing is cut out or moved: every
   mode is a shader reading of the same image, so the art stays whole and in register.
   Decorative only: without WebGL2 the CSS background plate and the copy stand alone.
   Phones paint the opening frame as a small image first (scripts/hero-sketch-frame.html). */
(() => {
  const IMG_W = 1536, IMG_H = 1024;
  const SAFE_X = 440; // plate x where the parchment ends and the torn sky begins

  // Hotspots in plate pixels, tested in order (the knight sits in front of the stag).
  const SPOTS = [
    { mode: 4, x: 1000, y: 690, rx: 70, ry: 160, la: 'Eques', pt: 'antes de imaginar' },
    { mode: 3, x: 800, y: 610, rx: 120, ry: 210, la: 'Cervus lanternarius', pt: 'a vigília' },
    { mode: 1, x: 765, y: 190, rx: 185, ry: 185, la: 'Sphaera mundi', pt: 'o firmamento' },
    { mode: 2, x: 1230, y: 430, rx: 300, ry: 130, la: 'Cetus stellarum', pt: 'o abismo' },
    { mode: 5, x: 1280, y: 170, rx: 270, ry: 130, la: 'Insula errans', pt: 'a aurora' },
    { mode: 5, x: 1360, y: 780, rx: 190, ry: 110, la: 'Civitas', pt: 'a aurora' },
  ];
  const NIGHT = new Set([1, 2, 3]); // modes that darken the page under the copy
  const TOUR = [1, 2, 3, 5, 4, 0];

  const params = new URLSearchParams(location.search);
  const frozenAt = params.has('at') ? parseFloat(params.get('at')) : null;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const VERT = `#version 300 es
  in vec2 a; void main(){ gl_Position = vec4(a, 0., 1.); }`;

  const FRAG = `#version 300 es
  precision highp float;
  uniform sampler2D uPlate;
  uniform vec2 uRes;
  uniform vec3 uFit;      // scale, x0, y0 in device px
  uniform float uT, uMotion, uLod;
  uniform vec2 uMouse;    // plate px
  uniform int uA, uB;     // mode outside / inside the wave
  uniform vec2 uO;        // wave origin, plate px
  uniform float uR;       // wave radius, plate px
  out vec4 outColor;

  const vec2 IMG = vec2(1536., 1024.);
  const vec3 PAPER = vec3(.902, .831, .710);
  const vec3 GOLD = vec3(.88, .70, .38);
  const vec3 INK = vec3(.23, .17, .11);
  const vec2 SPH = vec2(765., 190.);
  const vec2 SUN = vec2(1180., 650.);
  const vec2 WHALE = vec2(1230., 430.);
  const vec2 KNIGHT = vec2(1000., 690.);
  const vec2 LANT[6] = vec2[6](vec2(755., 465.), vec2(845., 463.), vec2(903., 469.),
                               vec2(788., 508.), vec2(937., 523.), vec2(817., 547.));

  float fall(float a, float b, float x) { return 1. - smoothstep(a, b, x); }
  float hash(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
  float noise(vec2 p) {
    vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
    return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y);
  }
  float luma(vec3 c) { return dot(c, vec3(.299, .587, .114)); }
  vec3 hsv(vec3 c) {
    vec4 K = vec4(0., -1. / 3., 2. / 3., -1.);
    vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
    vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));
    float d = q.x - min(q.w, q.y);
    return vec3(abs(q.z + (q.w - q.y) / (6. * d + 1e-6)), d / (q.x + 1e-6), q.x);
  }

  // Explicit LOD: the plate is sampled inside per-pixel branches, where implicit mip selection is undefined.
  vec3 tex(vec2 p) { return textureLod(uPlate, clamp(p, vec2(.5), IMG - .5) / IMG, uLod).rgb; }
  // Left of the plate the parchment continues: a mirror of its own edge that
  // fades into plain paper, so wide screens never show where the image ends.
  vec3 plate(vec2 p) {
    if (p.x < 0.) {
      float e = -p.x;
      vec3 m = tex(vec2(min(e, 400.), p.y));
      return mix(m, PAPER * (.975 + .05 * noise(p * .04)), smoothstep(140., 390., e));
    }
    return tex(p);
  }

  struct S { vec3 c; float L; float v; float gold; float lapis; float red; vec2 g; };
  S see(vec2 p) {
    float k = 1.25;
    vec3 c, l, r, u, d;
    if (p.x >= k) { // every tap lands on the plate: skip the parchment branch
      c = tex(p); l = tex(p - vec2(k, 0.)); r = tex(p + vec2(k, 0.));
      u = tex(p - vec2(0., k)); d = tex(p + vec2(0., k));
    } else {
      c = plate(p); l = plate(p - vec2(k, 0.)); r = plate(p + vec2(k, 0.));
      u = plate(p - vec2(0., k)); d = plate(p + vec2(0., k));
    }
    S s;
    s.c = clamp(c + (c - (l + r + u + d) * .25) * .6, 0., 1.); // unsharp: the plate is upscaled
    s.L = luma(c);
    s.g = vec2(luma(r) - luma(l), luma(d) - luma(u));
    vec3 h = hsv(c);
    s.v = h.z;
    s.gold = smoothstep(.22, .42, h.y) * smoothstep(.05, .09, h.x) * fall(.12, .17, h.x) * smoothstep(.42, .65, h.z);
    s.lapis = smoothstep(.52, .58, h.x) * fall(.69, .75, h.x) * smoothstep(.25, .45, h.y);
    s.red = (fall(.03, .06, h.x) + smoothstep(.94, .97, h.x)) * smoothstep(.4, .6, h.y) * smoothstep(.22, .38, h.z);
    return s;
  }

  float twinkle(vec2 p, float speed) {
    float h = hash(floor(p / 12.));
    return pow(.5 + .5 * sin(uT * speed * (1. + h * 1.5) + h * 60.), 4.);
  }
  float lanterns(vec2 p, float sig) {
    float g = 0.;
    for (int i = 0; i < 6; i++) {
      vec2 q = p - LANT[i];
      float fi = float(i);
      float f = .82 + .18 * sin(uT * 8.3 + fi * 2.1) * sin(uT * 5.1 + fi);
      g += exp(-dot(q, q) / (2. * sig * sig)) * f;
    }
    return g;
  }
  float stars(vec2 p, float cellSize, float density) {
    vec2 cell = floor(p / cellSize);
    vec2 sp = (cell + .2 + .6 * vec2(hash(cell + 3.1), hash(cell + 7.7))) * cellSize;
    return step(1. - density, hash(cell)) * fall(.4, 1.8, length(p - sp)) * (.35 + .65 * twinkle(p, 3.));
  }

  // 0 · Prancha: the plate as printed, with gilding that catches the cursor's light.
  vec3 m0(vec2 p) {
    S s = see(p);
    vec3 c = s.c;
    vec3 n = normalize(vec3(-s.g * 7., 1.));
    vec3 H = normalize(normalize(vec3(uMouse - p, 300.)) + vec3(0., 0., 1.));
    c += pow(max(dot(n, H), 0.), 60.) * s.gold * vec3(1., .86, .56) * 1.1;
    vec2 dm = uMouse - p;
    c *= .95 + .09 * exp(-dot(dm, dm) / (2. * 320. * 320.));
    c += s.gold * smoothstep(.78, .95, s.v) * twinkle(p, 2.2) * vec3(1., .9, .62) * .55;
    c += lanterns(p, 26.) * vec3(1., .7, .36) * .38;
    return c;
  }

  // 1 · Firmamento: the world becomes a celestial chart, gold lines on lapis, orbits everywhere.
  vec3 orbits(vec2 p) {
    vec2 q = p - SPH;
    float acc = 0.;
    for (int k = 0; k < 6; k++) {
      float fk = float(k), dir = mod(fk, 2.) * 2. - 1.;
      float a = .35 + fk * .47, cs = cos(a), sn = sin(a);
      vec2 r = vec2(cs * q.x + sn * q.y, -sn * q.x + cs * q.y);
      r.y /= .30 + .07 * fk;
      float R = 250. + fk * 190.;
      float dd = abs(length(r) - R);
      acc += fall(.8, 2.2, dd) * .5;
      float ang = atan(r.y, r.x) + uT * (.05 + .03 * fk) * dir;
      acc += smoothstep(.9, .96, fract(ang * 48. / 6.2832)) * fall(3., 9., dd) * .45;
      float th = uT * (.14 + .05 * fk) * dir + fk * 1.9;
      float dp = length(r - R * vec2(cos(th), sin(th)));
      acc += fall(6., 9., dp) + exp(-dp * dp / 600.) * .35;
    }
    return acc * GOLD;
  }
  // How much darker a pixel is than its surroundings: the burin lines, without the flat tones.
  float lines(vec2 p, float L, float r) {
    vec3 sum;
    if (p.x >= r) sum = tex(p + vec2(r, 0.)) + tex(p - vec2(r, 0.)) + tex(p + vec2(0., r)) + tex(p - vec2(0., r));
    else sum = plate(p + vec2(r, 0.)) + plate(p - vec2(r, 0.)) + plate(p + vec2(0., r)) + plate(p - vec2(0., r));
    return luma(sum) * .25 - L;
  }
  vec3 m1(vec2 p) {
    S s = see(p);
    float ink = max(smoothstep(.05, .22, length(s.g)), smoothstep(.07, .18, lines(p, s.L, 3.)) * .6);
    vec2 dq = p - SPH;
    vec3 bg = mix(vec3(.035, .05, .14), vec3(.09, .13, .31), exp(-dot(dq, dq) / (2. * 650. * 650.)));
    bg += vec3(.02, .03, .07) * noise(p * .008 + uT * .03);
    bg *= .55 + .75 * s.L; // keep the forms, as a dim blue print of the plate
    vec3 c = mix(bg, GOLD * 1.05, ink * .9);
    c += s.gold * GOLD * (.3 + .45 * twinkle(p, 2.5));
    c = mix(c, s.c * 1.05, s.red * .6);
    c += orbits(p);
    c += stars(p, 26., .22) * vec3(1., .93, .75);
    return c;
  }

  // 2 · Abismo: the whole world sinks under the star whale's sea.
  float caustic(vec2 uv, float time) {
    vec2 p = mod(uv * 6.28318, 6.28318) - 250.;
    vec2 i = p;
    float c = 1., inten = .005;
    for (int n = 0; n < 5; n++) {
      float t = time * (1. - (3.5 / float(n + 1)));
      i = p + vec2(cos(t - i.x) + sin(t + i.y), sin(t - i.y) + cos(t + i.x));
      c += 1. / length(vec2(p.x / (sin(i.x + t) / inten), p.y / (cos(i.y + t) / inten)));
    }
    c /= 5.;
    c = 1.17 - pow(c, 1.4);
    return pow(abs(c), 8.);
  }
  vec3 m2(vec2 p) {
    vec2 w = vec2(sin(p.y * .018 + uT * 1.3) + .5 * sin(p.y * .041 - uT * .9),
                  cos(p.x * .016 + uT * 1.1) + .5 * cos(p.x * .035 + uT * .7)) * 5. * uMotion;
    S s = see(p + w);
    float depth = smoothstep(-100., 1100., p.y);
    vec3 c = mix(s.c, s.c * vec3(.30, .36, .86) + vec3(.02, .03, .13), .84);
    c *= mix(.95, .45, depth);
    c += vec3(1., .88, .62) * caustic(p * .0016 + vec2(.0, uT * .01), uT * .45) * .4 * (1. - depth * .7);
    float ray = pow(.5 + .5 * sin(p.x * .011 + p.y * .0045 + sin(uT * .25) * 2.), 14.);
    c += vec3(.62, .66, 1.) * ray * (1. - depth) * .22;
    vec2 dw = (p - WHALE) / vec2(330., 170.);
    float nearWhale = exp(-dot(dw, dw) * 1.5);
    c += s.gold * smoothstep(.62, .9, s.v) * vec3(1., .85, .5) * (.45 + 1.5 * nearWhale) * (.5 + .5 * twinkle(p, 2.));
    // bubbles rising in loose columns
    float col = floor(p.x / 46.), hb = hash(vec2(col, 2.));
    float by = mod(p.y + uT * (40. + 50. * hb) + hb * 900., 300.);
    vec2 bc = vec2((col + .5) * 46. + sin(uT * 1.7 + hb * 9. + p.y * .02) * 8., 150.);
    float br = 2.5 + 4. * hash(vec2(col, 5.));
    float ring = fall(.6, 1.6, abs(length(vec2(p.x, by) - bc) - br));
    c += step(.62, hb) * ring * vec3(.85, .85, 1.) * .5;
    return c;
  }

  // 3 · Vigília: night falls; only the stag's lanterns, and the one you carry, give light.
  vec3 m3(vec2 p) {
    S s = see(p);
    vec2 dm = p - uMouse;
    float light = lanterns(p, 115.) * .55 + exp(-dot(dm, dm) / (2. * 210. * 210.)) * 1.15;
    vec3 c = s.c * vec3(.10, .12, .24) + vec3(.008, .01, .03);
    c += s.c * vec3(1.15, .9, .62) * clamp(light, 0., 1.3);
    c += s.gold * GOLD * .2 * (.6 + .4 * twinkle(p, 1.6));
    c += lanterns(p, 13.) * vec3(1., .82, .5) * .9;
    for (int i = 0; i < 22; i++) {
      float fi = float(i);
      vec2 h = vec2(hash(vec2(fi, 1.)), hash(vec2(fi, 2.)));
      vec2 fp = vec2(-200. + h.x * 1700., 260. + h.y * 700.)
              + vec2(sin(uT * (.25 + h.y * .3) + fi), cos(uT * (.3 + h.x * .3) + fi * 1.7)) * 70.;
      vec2 q = p - fp;
      float blink = .5 + .5 * sin(uT * (1.2 + h.x) + fi * 3.);
      c += (exp(-dot(q, q) / 40.) + exp(-dot(q, q) / 700.) * .25) * blink * vec3(1., .78, .4);
    }
    return c;
  }

  // 4 · Gravura: the world before imagination, an ink sketch. The cursor is a lens that colours it in.
  vec3 sketch(S s, vec2 p) {
    float edge = smoothstep(.05, .24, length(s.g));
    float dark = fall(.2, .62, s.L) * (1. - s.lapis * .7);
    float ink = max(edge, dark * .8);
    vec3 c = mix(PAPER * (.97 + .05 * noise(p * .05)), INK, ink * .82);
    return mix(c, s.c, s.red * .85);
  }
  vec3 m4(vec2 p) {
    S s = see(p);
    vec3 c = sketch(s, p);
    float d = length(p - uMouse);
    float lens = fall(150., 200., d);
    c = mix(c, s.c, lens);
    c += exp(-pow((d - 175.) / 6., 2.)) * GOLD * .9;
    return c;
  }

  // 5 · Aurora: the lapis sky turns to dawn and the gilding catches a passing sunrise.
  vec3 m5(vec2 p) {
    S s = see(p);
    vec3 dawn = mix(vec3(.95, .58, .40), vec3(.34, .19, .42), smoothstep(800., 30., p.y));
    vec3 c = mix(s.c, dawn * (.5 + .95 * s.L), s.lapis * .95);
    vec2 ds = p - SUN;
    c += vec3(1., .68, .38) * exp(-dot(ds, ds) / (2. * 280. * 280.)) * .5;
    c *= mix(vec3(1.01, .99, .97), vec3(1.06, .98, .9), clamp(s.lapis + fall(.4, .75, s.L), 0., 1.));
    float sweep = p.x + p.y * .6 - (mod(uT * 520., 3200.) - 600.);
    c += s.gold * exp(-sweep * sweep / 3600.) * vec3(1., .85, .52) * 1.2;
    return c;
  }

  vec3 shade(int m, vec2 p) {
    if (m == 1) return m1(p);
    if (m == 2) return m2(p);
    if (m == 3) return m3(p);
    if (m == 4) return m4(p);
    if (m == 5) return m5(p);
    return m0(p);
  }

  void main() {
    vec2 f = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y);
    vec2 p = (f - uFit.yz) / uFit.x;
    // m: how much of world uB a pixel shows. Outside a wave that is all of it.
    vec2 pr = p;
    float k = 0., rim = 0., m = 1.;
    if (uA != uB) {
      vec2 dv = p - uO;
      k = length(dv) + (noise(p * .012) - .5) * 90. - uR;
      rim = exp(-k * k / (2. * 32. * 32.));
      pr = p - normalize(dv + .001) * rim * 28. * uMotion; // the front refracts what it passes
      m = 1. - smoothstep(-12., 12., k);
    }
    // One call site for at most two worlds: the six worlds are inlined once, not four
    // times, which keeps the shader quick to compile. The loop count is not a constant,
    // so the compiler cannot unroll it back.
    bool both = m >= .001 && m <= .999;
    int n = both ? 2 : 1;
    vec3 cA = vec3(0.), cB = vec3(0.);
    for (int i = 0; i < n; i++) {
      vec3 c = shade(i == 1 || m < .001 ? uA : uB, pr);
      if (i == 0) cB = c; else cA = c;
    }
    vec3 col = both ? mix(cA, cB, m) : cB;
    if (uA != uB) {
      float flame = noise(p * .05 + vec2(0., uT * 3.));
      col = mix(col, col * vec3(.5, .35, .25), exp(-pow((k - 26.) / 18., 2.)) * .5); // scorch ahead of the front
      col += rim * vec3(1., .64, .26) * (.45 + .9 * flame);
      col += exp(-k * k / 30.) * vec3(1., .93, .75) * .7;
    }
    col += (hash(f + fract(uT) * 91.) - .5) * .022;
    outColor = vec4(clamp(col, 0., 1.), 1.);
  }`;

  const hero = document.querySelector('.hero-inner');
  const canvas = hero && hero.querySelector('.hero-scene');
  if (!canvas) return;
  const copy = hero.querySelector('.hero-copy');
  const h1 = hero.querySelector('#hero-title');
  const lede = hero.querySelector('.hero-description');
  const tag = hero.querySelector('.hero-tag');
  const art = hero.querySelector('.hero-art');
  const gl = canvas.getContext('webgl2', { antialias: false, premultipliedAlpha: false });
  if (!gl) { hero.classList.add('hero-plain'); return; }

  // The driver builds the program while the plate downloads. Any query made before it
  // is done (even for an extension) waits for it, so extensions come first and the
  // result is read only once the plate is ready, polled where the browser allows.
  const parallel = gl.getExtension('KHR_parallel_shader_compile');
  function compile(type, src) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    return s;
  }
  const prog = gl.createProgram();
  const frag = compile(gl.FRAGMENT_SHADER, FRAG);
  gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT));
  gl.attachShader(prog, frag);
  gl.linkProgram(prog);
  const U = {};
  const built = () => new Promise(resolve => {
    const poll = () => !parallel || gl.getProgramParameter(prog, parallel.COMPLETION_STATUS_KHR) ? resolve() : setTimeout(poll, 20);
    poll();
  }).then(() => {
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getShaderInfoLog(frag) || gl.getProgramInfoLog(prog));
    gl.useProgram(prog);
    for (const n of ['uPlate', 'uRes', 'uFit', 'uT', 'uMotion', 'uLod', 'uMouse', 'uA', 'uB', 'uO', 'uR']) U[n] = gl.getUniformLocation(prog, n);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, 'a');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  });

  // Layout. Wide screens: the canvas fills the hero and the tear lands just right of
  // the copy. Phones (the site's 850px breakpoint): the plate fills the space below the copy.
  const narrow = matchMedia('(max-width: 850px)');
  let fit = { scale: 1, x0: 0, y0: 0 }, dpr = 1, size = { w: 1, h: 1 };
  // A GPU that falls behind renders fewer pixels, never fewer than one per CSS pixel.
  const pace = glPace(() => { if (img.complete) layout(); });
  function layout() {
    if (sketching && !phone.matches) endSketch();
    const stacked = narrow.matches;
    const sharpest = Math.min(devicePixelRatio || 1, 1.75);
    dpr = Math.max(Math.min(1, sharpest), sharpest * pace.scale);
    h1.style.fontSize = '';
    lede.style.maxWidth = '';
    canvas.style.top = canvas.style.height = '';
    const W = hero.clientWidth, H = hero.clientHeight;
    const left = copy.offsetLeft;
    let scale, x0, y0, w = W, h = H;
    if (!stacked) {
      const tx = Math.max(W * .41, left + 360); // the tear lands here
      fitHeadline(tx - left - 80, 104);
      lede.style.maxWidth = Math.max(260, Math.min(420, tx - left - 70)) + 'px';
      scale = Math.max(H / IMG_H, (W - tx) / (IMG_W - SAFE_X));
      x0 = tx - SAFE_X * scale;
      y0 = Math.min(0, Math.max(H - IMG_H * scale, H * .5 - IMG_H * .5 * scale));
    } else {
      fitHeadline(W - left * 2 - 36, Math.min(62, innerHeight * .064));
      const top = Math.ceil(copy.getBoundingClientRect().bottom - hero.getBoundingClientRect().top) + 12;
      h = Math.max(H - top, 300);
      canvas.style.top = top + 'px';
      canvas.style.height = h + 'px';
      scale = Math.max(h / IMG_H, w / (IMG_W - 560));
      x0 = Math.min(0, Math.max(w - IMG_W * scale, w * .5 - 1010 * scale));
      y0 = Math.min(0, Math.max(h - IMG_H * scale, h * .5 - 600 * scale));
      if (sketching) {
        art.style.top = top + 'px';
        art.style.height = h + 'px';
        art.style.backgroundSize = `${SKETCH.w * scale}px ${IMG_H * scale}px`;
        art.style.backgroundPosition = `${x0 + SKETCH.x * scale}px ${y0}px`;
      }
    }
    size = { w, h };
    if (live && texW < IMG_W && !phone.matches) sharpen();
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    fit = { scale, x0, y0 };
    gl.viewport(0, 0, canvas.width, canvas.height);
  }
  function fitHeadline(avail, max) {
    h1.style.fontSize = '100px';
    const w = h1.scrollWidth;
    h1.style.fontSize = Math.max(34, Math.min(max, 100 * avail / w)) + 'px';
  }
  function toPlate(cx, cy) {
    const r = canvas.getBoundingClientRect();
    return [(cx - r.left - fit.x0) / fit.scale, (cy - r.top - fit.y0) / fit.scale];
  }
  function toScreen(px, py) {
    const r = canvas.getBoundingClientRect();
    return [px * fit.scale + fit.x0 + r.left, py * fit.scale + fit.y0 + r.top];
  }

  // Mode machine: one wave at a time; a request during a wave waits for it.
  let cur = 4, wave = null, pending = null;
  const mouse = [900, 520];
  function go(mode, origin) {
    if (wave) { pending = { mode, origin }; return; }
    if (mode === cur) return;
    const [ax, ay] = [-fit.x0 / fit.scale, -fit.y0 / fit.scale];
    const [bx, by] = [(size.w - fit.x0) / fit.scale, (size.h - fit.y0) / fit.scale];
    let maxR = 0;
    for (const [cx, cy] of [[ax, ay], [bx, ay], [ax, by], [bx, by]]) maxR = Math.max(maxR, Math.hypot(cx - origin[0], cy - origin[1]));
    wave = { from: cur, to: mode, o: origin, t0: performance.now(), maxR: maxR + 160, dur: reduced ? 450 : 1300 };
    cur = mode;
    // The copy re-inks when the front reaches it.
    const r = copy.getBoundingClientRect();
    const [qx, qy] = toPlate(r.left + r.width / 2, r.top + r.height / 2);
    const reach = Math.min(1, Math.hypot(qx - origin[0], qy - origin[1]) / wave.maxR);
    const u = 1 - Math.pow(1 - reach, 1 / 2.4);
    hero.style.setProperty('--ink-delay', (u * wave.dur | 0) + 'ms');
    document.body.classList.toggle('hero-night', NIGHT.has(mode));
    // js/hero-sound.js may score the change; pan follows where the front starts.
    const [sx] = toScreen(origin[0], origin[1]);
    document.dispatchEvent(new CustomEvent('hero:world', { detail: {
      mode, from: wave.from, pan: Math.max(-1, Math.min(1, sx / innerWidth * 2 - 1)), auto: auto || !introDone,
    } }));
  }

  let desired = 4, timer = 0;
  function want(mode, origin, delay) {
    if (mode === desired) return;
    desired = mode;
    clearTimeout(timer);
    timer = setTimeout(() => go(mode, origin), delay);
  }
  function spotAt(px, py) {
    return SPOTS.find(s => ((px - s.x) / s.rx) ** 2 + ((py - s.y) / s.ry) ** 2 < 1);
  }
  let auto = false;
  function showTag(s, cx, cy) {
    if (!s) { tag.classList.remove('is-on'); return; }
    tag.innerHTML = `<i>${s.la}</i><span>${s.pt}</span>`;
    const x = Math.min(cx + 22, innerWidth - tag.offsetWidth - 12);
    tag.style.transform = `translate(${Math.round(x)}px, ${Math.round(cy + 18)}px)`;
    tag.classList.add('is-on');
  }

  let img = { complete: false }, live = false;
  // Runs only while the hero chapter is on screen and the tab is visible.
  const isActive = () => document.body.dataset.section === 'inicio' && !document.hidden;
  let raf = 0, introDone = false, touring = 0, idleTimer = 0;
  function stopTour() { clearInterval(touring); touring = 0; clearTimeout(idleTimer); }
  function startTourSoon() {
    stopTour();
    if (reduced || frozenAt !== null || !isActive()) return;
    idleTimer = setTimeout(() => {
      let i = 0;
      const next = () => {
        if (!isActive()) { stopTour(); return; }
        const mode = TOUR[i++ % TOUR.length];
        const s = SPOTS.find(sp => sp.mode === mode);
        desired = mode;
        auto = true;
        go(mode, s ? [s.x, s.y] : [SAFE_X + 300, 560]);
        if (s) { const [cx, cy] = toScreen(s.x, s.y); showTag(s, cx, cy); } else showTag(null);
      };
      next();
      touring = setInterval(next, 4200);
    }, 7000);
  }
  function sync() {
    if (isActive()) {
      if (!raf && live) { pace.reset(); raf = requestAnimationFrame(frame); }
      if (introDone && !touring) startTourSoon();
    } else {
      cancelAnimationFrame(raf);
      raf = 0;
      stopTour();
      showTag(null);
    }
  }
  document.addEventListener('portfolio:sectionchange', sync);
  document.addEventListener('visibilitychange', sync);

  addEventListener('pointermove', e => {
    if (e.pointerType !== 'mouse' || !introDone || !isActive()) return;
    auto = false;
    startTourSoon();
    const r = canvas.getBoundingClientRect();
    const inside = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
    const [px, py] = toPlate(e.clientX, e.clientY);
    mouse[0] = px; mouse[1] = py;
    const s = inside && !e.target.closest('a, button, .sidebar') ? spotAt(px, py) : null;
    hero.classList.toggle('is-pointing', !!s);
    showTag(s, e.clientX, e.clientY);
    if (s) want(s.mode, [px, py], 90);
    else want(0, [px, py], 380);
  }, { passive: true });
  hero.addEventListener('pointerdown', e => {
    if (e.pointerType === 'mouse' || !introDone || e.target.closest('a, button')) return;
    auto = false;
    stopTour();
    const [px, py] = toPlate(e.clientX, e.clientY);
    mouse[0] = px; mouse[1] = py;
    const s = e.target === canvas ? spotAt(px, py) : null;
    showTag(s, e.clientX, e.clientY);
    want(s ? s.mode : 0, [px, py], 0);
  }, { passive: true });

  // Phones get a 1152 px plate: their canvas never shows it wider than that. String
  // literals so the build fingerprints them; the preloads in index.html match.
  const PLATE = 'assets/images/hero-plate.webp', PHONE_PLATE = 'assets/images/hero-plate-1152.webp';
  // While it downloads, a phone shows the frame the opening starts on as a small image:
  // the plate columns its canvas can reach (SKETCH, plate px), drawn in the canvas's register.
  const PHONE_SKETCH = 'assets/images/hero-sketch-phone.webp', SKETCH = { x: 520, w: 980 };
  const FADE = 500; // the canvas fading in over the sketch, as in css/hero-scene.css
  const phone = matchMedia('(max-width: 440px)');
  let sketching = phone.matches, sketchedAt = 0;
  function endSketch() {
    sketching = false;
    hero.classList.remove('hero-sketched');
    art.removeAttribute('style');
  }
  const fits = () => { if (sketching || img.complete) layout(); };
  const resized = new ResizeObserver(fits);
  resized.observe(hero);
  resized.observe(copy);
  document.fonts?.ready.then(fits);
  let sketched = Promise.resolve();
  if (sketching) {
    layout();
    hero.classList.add('hero-sketched');
    const sketch = new Image();
    sketch.src = PHONE_SKETCH;
    // The plate waits for the sketch: on a slow connection they would share the bandwidth.
    sketched = sketch.decode().then(() => { sketchedAt = performance.now(); }, () => {});
  }
  // An ImageBitmap decoded off the main thread from the downloaded file (the fetch is
  // served from the HTTP cache). Uploading the <img> itself, or a bitmap made from it,
  // would decode the plate again on the main thread.
  function pixels(image) {
    return image.decode().then(() => !window.createImageBitmap ? image : fetch(image.src)
      .then(r => { if (!r.ok) throw new Error(r.status); return r.blob(); })
      .then(blob => createImageBitmap(blob))
      .catch(() => image));
  }
  let texture = null, texW = IMG_W; // texW: plate width in texels
  function upload(source) {
    if (texture) gl.deleteTexture(texture);
    texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, source);
    texW = source.naturalWidth || source.width;
    source.close?.();
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  }
  // A phone turned to landscape shows the plate wider: bring in the full one.
  let sharpening = false;
  function sharpen() {
    if (sharpening) return;
    sharpening = true;
    const full = new Image();
    full.src = PLATE;
    pixels(full).then(upload).catch(() => {});
  }
  sketched
    .then(() => {
      img = new Image();
      img.src = phone.matches ? PHONE_PLATE : PLATE;
      return pixels(img);
    })
    .then(source => built().then(() => source))
    .then(source => {
      upload(source);
      gl.uniform1i(U.uPlate, 0);
      live = true;
      layout();
      hero.classList.add('scene-live');
      if (sketching) setTimeout(endSketch, FADE);

      // ?mode=N shows a world directly; add &wave=u to freeze a front from the plate to it.
      if (params.has('mode')) {
        const m = +params.get('mode');
        if (params.has('wave')) {
          cur = 0; go(m, [1000, 640]);
          wave.frozen = parseFloat(params.get('wave'));
        } else { cur = m; document.body.classList.toggle('hero-night', NIGHT.has(m)); }
        desired = m; introDone = true;
        if (params.has('mx')) { mouse[0] = +params.get('mx'); mouse[1] = +params.get('my'); }
      } else if (document.body.dataset.section === 'inicio' && !reduced) {
        // Opening: the world starts as an ink sketch, then imagination floods out from the knight.
        // A phone has shown the sketch since its image arrived: the flood waits only for the
        // rest of that beat, and for the canvas to finish fading in.
        const hold = sketchedAt ? Math.max(FADE, 900 - (performance.now() - sketchedAt)) : 900;
        setTimeout(() => { desired = 0; go(0, [1000, 640]); }, hold);
        setTimeout(() => { introDone = true; startTourSoon(); }, hold + 1000);
      } else {
        cur = desired = 0; introDone = true;
      }
      sync();
    })
    .catch(error => {
      if (error instanceof DOMException) return; // a failed download keeps the CSS plate, or the sketch
      console.error(error);
      endSketch();
      hero.classList.add('hero-plain');
    });

  const t0 = performance.now();
  function frame(now) {
    raf = 0;
    if (!pace.ready(now)) { if (isActive()) raf = requestAnimationFrame(frame); return; }
    let a = cur, r = 0;
    if (wave) {
      const u = wave.frozen ?? Math.min(1, (now - wave.t0) / wave.dur);
      if (u >= 1) {
        wave = null;
        if (pending) { const p = pending; pending = null; go(p.mode, p.origin); }
      } else { a = wave.from; r = wave.maxR * (1 - Math.pow(1 - u, 2.4)); }
    }
    gl.uniform2f(U.uRes, canvas.width, canvas.height);
    gl.uniform3f(U.uFit, fit.scale * dpr, fit.x0 * dpr, fit.y0 * dpr);
    gl.uniform1f(U.uT, frozenAt ?? (now - t0) / 1000);
    gl.uniform1f(U.uMotion, reduced ? 0 : 1);
    gl.uniform1f(U.uLod, Math.max(0, Math.log2(texW / IMG_W / (fit.scale * dpr))));
    gl.uniform2f(U.uMouse, mouse[0], mouse[1]);
    gl.uniform1i(U.uA, wave ? a : cur);
    gl.uniform1i(U.uB, cur);
    gl.uniform2f(U.uO, wave ? wave.o[0] : 0, wave ? wave.o[1] : 0);
    gl.uniform1f(U.uR, r);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    if (isActive()) raf = requestAnimationFrame(frame);
  }
})();
