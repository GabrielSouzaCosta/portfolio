// Hero B test: the stag lives. The rig is firmament v2's (head and neck nod, lanterns and
// tassels on pendulums, ear and tail flicks, breath, blink), drawn in its own small WebGL canvas
// over the page. Lanterns glow, and gold dust from them drifts down onto the page. It also
// fits the 1440x900 page to the window and announces the scale as `stage:layout`.
(() => {
  const stage = document.getElementById('stage');
  const stagCanvas = stage.querySelector('canvas.stag');
  const dustCanvas = stage.querySelector('canvas.dust');
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const params = new URLSearchParams(location.search);
  const frozenAt = params.has('at') ? Number(params.get('at')) : null;

  // Page geometry, in stage px (the Brilliant frame is 1440x900).
  const PAGE = [1440, 900];
  const STAG = { x: 606, y: 266, scale: 290 / 883 };
  const PAD = 56;
  const BOX = [STAG.x - PAD, STAG.y - PAD, Math.round(883 * STAG.scale) + PAD * 2, Math.round(1109 * STAG.scale) + PAD * 2];

  // Rig, in sprite px of firmament/stag.webp (883x1109).
  const NECK = [639, 549];
  const PENDULUMS = [[452, 160, 125, 30], [584, 110, 90, 24], [700, 120, 90, 24], [565, 258, 150, 26], [852, 228, 112, 26],
    [607, 264, 112, 13], [504, 234, 76, 12], [784, 159, 70, 12], [624, 164, 60, 12]];
  const LANTERN_CENTERS = [[452, 238], [583, 160], [700, 172], [565, 322], [852, 290]];

  const fragment = `#version 300 es
  precision highp float;
  uniform sampler2D uStag;
  uniform vec2 uRes;
  uniform vec3 uBox;      // canvas origin in stage px, device px per stage px
  uniform vec3 uStagXf;   // sprite top-left in stage px, stage px per sprite px
  uniform float uLod, uTime, uHead, uEar, uTail, uBreath, uBlink;
  uniform float uSwing[9];
  uniform vec4 uPend[9];
  uniform vec2 uLant[5];
  out vec4 outColor;
  const vec2 STAG_PX = vec2(883., 1109.);

  mat2 rot(float a) { float c = cos(a), s = sin(a); return mat2(c, s, -s, c); }
  float inside(vec2 uv) { return step(0., uv.x) * step(uv.x, 1.) * step(0., uv.y) * step(uv.y, 1.); }
  float hash(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
  float noise(vec2 p) {
    vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
    return mix(mix(hash(i), hash(i + vec2(1., 0.)), f.x), mix(hash(i + vec2(0., 1.)), hash(i + vec2(1., 1.)), f.x), f.y);
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
    vec4 c = textureLod(uStag, uv, uLod) * inside(uv);
    float eye = 1. - smoothstep(6., 10., length((sp - vec2(751., 352.)) * vec2(1., 1.7)));
    return mix(c, textureLod(uStag, (sp - vec2(0., 15.)) / STAG_PX, uLod), eye * uBlink);
  }

  void main() {
    vec2 frag = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y);
    vec2 p = uBox.xy + frag / uBox.z;
    // A soft contact shadow so the stag stands on the page.
    vec2 feet = uStagXf.xy + vec2(400., 1098.) * uStagXf.z;
    float shadow = .2 * exp(-pow((p.x - feet.x) / 120., 2.) - pow((p.y - feet.y) / 6., 2.));
    vec4 c = stag(p);
    vec4 col = c + vec4(0., 0., 0., shadow) * (1. - c.a);
    // Lantern light: premultiplied with no alpha, so it adds light over the page and the plate.
    vec3 glow = vec3(0.);
    for (int i = 0; i < 5; i++) {
      float d = length(p - uLant[i]);
      float flicker = .78 + .22 * noise(vec2(uTime * 5., float(i) * 3.1));
      glow += vec3(1., .72, .32) * (exp(-d * d / (2. * 5. * 5.)) * .45 + exp(-d * d / (2. * 14. * 14.)) * .06) * flicker;
    }
    outColor = vec4(col.rgb + glow, col.a);
  }`;

  const vertex = `#version 300 es
  in vec2 aPos;
  void main() { gl_Position = vec4(aPos, 0., 1.); }`;

  const gl = stagCanvas.getContext('webgl2', { premultipliedAlpha: true, alpha: true, antialias: false });
  if (!gl) return;
  const compile = (type, src) => {
    const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
    return s;
  };
  const program = gl.createProgram();
  gl.attachShader(program, compile(gl.VERTEX_SHADER, vertex));
  gl.attachShader(program, compile(gl.FRAGMENT_SHADER, fragment));
  gl.linkProgram(program);
  gl.useProgram(program);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  const u = new Proxy({}, { get: (cache, name) => cache[name] ??= gl.getUniformLocation(program, name) });

  const ctx = dustCanvas.getContext('2d');

  // Fit the 1440x900 page to the window; "Ver o cervo de perto" zooms on the stag.
  let zoomed = false, k = 1, dpr = 1;
  function layout() {
    dpr = Math.min(devicePixelRatio || 1, 2);
    const fit = Math.min(innerWidth / PAGE[0], innerHeight / PAGE[1]);
    k = zoomed ? fit * 2.4 : fit;
    const cx = zoomed ? 860 : PAGE[0] / 2, cy = zoomed ? 400 : PAGE[1] / 2;
    stage.style.transform = `translate(${-cx * k}px, ${-cy * k}px) scale(${k})`;
    Object.assign(stagCanvas.style, { left: `${BOX[0]}px`, top: `${BOX[1]}px`, width: `${BOX[2]}px`, height: `${BOX[3]}px` });
    stagCanvas.width = Math.round(BOX[2] * k * dpr);
    stagCanvas.height = Math.round(BOX[3] * k * dpr);
    gl.viewport(0, 0, stagCanvas.width, stagCanvas.height);
    Object.assign(dustCanvas.style, { left: '0px', top: '0px', width: `${PAGE[0]}px`, height: `${PAGE[1]}px` });
    dustCanvas.width = Math.round(PAGE[0] * k * dpr);
    dustCanvas.height = Math.round(PAGE[1] * k * dpr);
    dispatchEvent(new CustomEvent('stage:layout', { detail: { k, dpr } }));
    if (still) requestAnimationFrame(frame);
  }
  addEventListener('resize', layout);
  document.querySelector('[data-zoom]').addEventListener('click', event => {
    zoomed = !zoomed;
    event.currentTarget.textContent = zoomed ? 'Ver a página inteira' : 'Ver de perto';
    layout();
  });

  const pulse = (t, period, width, offset = 0) => { const q = ((t + offset) % period + period) % period; return Math.exp(-((q - width) ** 2) / (width * width * .18)); };
  const rotate = ([x, y], [cx, cy], a) => { const c = Math.cos(a), s = Math.sin(a); return [cx + c * (x - cx) - s * (y - cy), cy + s * (x - cx) + c * (y - cy)]; };

  // Idle only: breath, a slow nod, now and then it lowers its head; the ear and tail flick; it blinks.
  function stagPose(t) {
    const graze = pulse(t, 17, 3.2, 6);
    const head = .035 * Math.sin(t * .45) + .1 * graze;
    const swing = PENDULUMS.map((_, i) => (.07 + .02 * (i % 3)) * Math.sin(t * (1.7 + .17 * i) + i * 1.9) + head * -.6);
    return { head, swing, ear: .38 * pulse(t, 6.3, .5), tail: .3 * pulse(t, 4.7, .45, 2), breath: .009 * Math.sin(t * 1.25), blink: pulse(t, 3.9, .14) > .5 ? 1 : 0 };
  }

  // Gold dust: born at a lantern, it drifts down and sideways, sways, and fades on the page.
  const motes = [];
  let nextMote = 0, rng = 1;
  const random = () => (rng = (rng * 16807) % 2147483647) / 2147483647;
  function spawn(t, lanterns) {
    const [x, y] = lanterns[Math.floor(random() * lanterns.length)];
    motes.push({ x, y, born: t, life: 5 + random() * 4, vx: -14 + random() * 18, vy: 6 + random() * 10, sway: 4 + random() * 8, phase: random() * 6.28, r: 1.3 + random() * 1.5 });
  }
  function stepDust(t, dt, lanterns) {
    if (t > nextMote) { spawn(t, lanterns); nextMote = t + .16 + random() * .3; }
    for (let i = motes.length - 1; i >= 0; i--) {
      const m = motes[i];
      if (t - m.born > m.life) { motes.splice(i, 1); continue; }
      m.x += m.vx * dt + Math.cos(t * 1.3 + m.phase) * m.sway * dt;
      m.y += m.vy * dt;
    }
  }
  function drawDust(t) {
    ctx.setTransform(k * dpr, 0, 0, k * dpr, 0, 0);
    ctx.clearRect(0, 0, PAGE[0], PAGE[1]);
    for (const m of motes) {
      const age = t - m.born;
      const a = Math.min(age / .5, 1) * Math.min(1, (m.life - age) / (m.life * .45));
      const twinkle = .7 + .3 * Math.sin(t * 7 + m.phase * 3);
      const halo = ctx.createRadialGradient(m.x, m.y, 0, m.x, m.y, m.r * 5);
      halo.addColorStop(0, `rgba(252, 220, 140, ${.75 * a * twinkle})`);
      halo.addColorStop(1, 'rgba(250, 214, 130, 0)');
      ctx.fillStyle = halo;
      ctx.beginPath(); ctx.arc(m.x, m.y, m.r * 5, 0, 6.2832); ctx.fill();
      ctx.fillStyle = `rgba(186, 136, 44, ${a})`;
      ctx.beginPath(); ctx.arc(m.x, m.y, m.r, 0, 6.2832); ctx.fill();
    }
  }

  function lanternsAt(pose) {
    return LANTERN_CENTERS.map((c, i) => {
      const [sx, sy] = rotate(rotate(c, PENDULUMS[i], pose.swing[i]), NECK, pose.head);
      return [STAG.x + sx * STAG.scale, STAG.y + sy * STAG.scale];
    });
  }
  // ?at=<s> freezes time; replay the dust up to that moment so the still frame shows it.
  if (frozenAt) for (let s = 0; s < frozenAt; s += 1 / 30) stepDust(s, 1 / 30, lanternsAt(stagPose(s)));

  const img = new Image();
  img.src = 'firmament/stag.webp';
  img.decode().then(() => {
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, gl.createTexture());
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.uniform1i(u.uStag, 0);
    gl.uniform4fv(u.uPend, PENDULUMS.flat());
    layout();
    requestAnimationFrame(frame);
  }).catch(error => console.warn('Serve the prototypes folder over http (python3 -m http.server 4173).', error));

  const origin = performance.now();
  let last = 0;
  function frame(now) {
    const t = still ? 12 : frozenAt ?? (now - origin) / 1000;
    const dt = Math.min(.05, Math.max(0, t - last)); last = t;
    const pose = stagPose(t);
    gl.uniform2f(u.uRes, stagCanvas.width, stagCanvas.height);
    gl.uniform3f(u.uBox, BOX[0], BOX[1], k * dpr);
    gl.uniform3f(u.uStagXf, STAG.x, STAG.y, STAG.scale);
    gl.uniform1f(u.uLod, Math.max(0, Math.log2(1 / (STAG.scale * k * dpr))));
    gl.uniform1f(u.uTime, t);
    gl.uniform1f(u.uHead, pose.head);
    gl.uniform1fv(u.uSwing, pose.swing);
    gl.uniform1f(u.uEar, pose.ear);
    gl.uniform1f(u.uTail, pose.tail);
    gl.uniform1f(u.uBreath, pose.breath);
    gl.uniform1f(u.uBlink, pose.blink);
    const lanterns = lanternsAt(pose);
    gl.uniform2fv(u.uLant, lanterns.flat());
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    if (!still) { stepDust(t, dt, lanterns); drawDust(t); }
    if (!still) requestAnimationFrame(frame);
  }
})();
