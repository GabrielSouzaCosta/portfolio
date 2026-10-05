/* Essência — Rota artis, a working volvelle.
   One WebGL2 scene: four paper discs cut from one engraved plate (assets/images/volvella-plate.webp),
   stacked in real perspective, lit by a lamp that follows the cursor (gold specular from volvella-maps.webp:
   normal xy, gold mask, star sparkle), geared to a pointer you drag. Each house (Visão, Direção, Execução)
   lights its own effect on the page. Draws only while the section is active, and is set up only
   after the hero has settled, or when the visitor arrives here first.
   Debug: ?e-at=<s> freezes time; &e-mx=&e-my= place the cursor; &e-house=0..2; &e-fx=<s since lock>; &e-explode=0..1.
   Source art and the cut-out script live outside the repo; prototypes/essencia-b.html is the standalone study. */
(() => {
  'use strict';

  const section = document.querySelector('#essencia');
  if (!section) return;
  const inner = section.querySelector('.essence-inner');
  const slot = section.querySelector('.ess-slot');
  const canvas = section.querySelector('.ess-gl');
  const hit = section.querySelector('.ess-wheel-hit');
  const hint = section.querySelector('.ess-hint');
  const copy = section.querySelector('.ess-copy');
  const tabs = [...section.querySelectorAll('.ess-houses [role="tab"]')];
  const panel = section.querySelector('.ess-house');

  const params = new URLSearchParams(location.search);
  const frozenAt = params.has('e-at') ? parseFloat(params.get('e-at')) : null;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const TAU = Math.PI * 2;
  const HOUSES = [
    { num: 'I', latin: 'Domus prima', title: 'Visão', angle: -0.077, at: [-0.02, -0.26],
      text: 'Antes do código, a pergunta certa. Entendo o problema, as pessoas e o negócio, e enxergo o produto antes que ele exista.',
      tags: ['Descoberta', 'Pesquisa', 'Estratégia'] },
    { num: 'II', latin: 'Domus secunda', title: 'Direção', angle: -1.951, at: [-0.25, 0.10],
      text: 'Produto, design e arquitetura decididos juntos. Escolho o que construir primeiro, o que deixar para depois e a tecnologia que aguenta o caminho.',
      tags: ['Produto', 'UX & UI', 'Arquitetura'] },
    { num: 'III', latin: 'Domus tertia', title: 'Execução', angle: 2.428, at: [0.195, 0.225],
      text: 'Web e mobile de ponta a ponta, do banco de dados à interface, com agentes de IA acelerando cada etapa. Entrego, meço e ajusto.',
      tags: ['Web', 'Mobile', 'Agentes de IA'] },
  ];
  // Discs from the bottom up. Radii in wheel units (1 = plate half-size); each disc overlaps the one below.
  const RINGS = [
    { rin: 0.880, rout: 0.985, land: 1.05, spin: 0 },
    { rin: 0.508, rout: 0.896, land: 1.40, spin: 1 },
    { rin: 0.388, rout: 0.518, land: 1.72, spin: -1 },
    { rin: -1.0, rout: 0.398, land: 2.02, spin: 0 },
  ];
  const POINTER = { w: 220, h: 1451, px: 109, py: 1392, length: 1.0 };
  const POINTER_LAND = 2.7;
  const READY_AT = 2.8;
  const D = 2000; // camera distance, css px
  const LAMP_Z = 560;

  function fillHouse(h) {
    const d = HOUSES[h];
    section.dataset.house = String(h);
    tabs.forEach((t, i) => { t.setAttribute('aria-selected', String(i === h)); t.tabIndex = i === h ? 0 : -1; });
    panel.setAttribute('aria-labelledby', tabs[h].id);
    panel.querySelector('.ess-house-num').textContent = d.num;
    panel.querySelector('.ess-house-latin').textContent = d.latin;
    panel.querySelector('.ess-house-title').textContent = d.title;
    panel.querySelector('.ess-house-text').textContent = d.text;
    panel.querySelector('.ess-house-tags').replaceChildren(...d.tags.map((t) => Object.assign(document.createElement('li'), { textContent: t })));
  }

  /* ---------------- GL ---------------- */
  function start() {
    // No MSAA: every edge is already smoothed in the shaders, and a multisampled
    // full-screen buffer costs memory and bandwidth on every frame.
    const gl = canvas.getContext('webgl2', { antialias: false, alpha: false, premultipliedAlpha: true });
    if (!gl) {
      const img = document.createElement('img');
      img.src = 'assets/images/volvella-plate.webp'; img.alt = ''; img.className = 'ess-fallback';
      slot.prepend(img);
      hit.remove(); hint.remove();
      tabs.forEach((t, i) => t.addEventListener('click', () => select(i)));
      let current = 0;
      function select(i) { current = i; fillHouse(i); }
      fillHouse(current);
      return;
    }

    // Extensions first: any query made after the shaders are queued waits for them to build.
    const parallel = gl.getExtension('KHR_parallel_shader_compile');
    const aniso = gl.getExtension('EXT_texture_filter_anisotropic');
    const anisotropy = aniso && Math.min(8, gl.getParameter(aniso.MAX_TEXTURE_MAX_ANISOTROPY_EXT));

    const VS_PLANE = `#version 300 es
    in vec2 aPos;
    uniform vec2 uView, uCenter; uniform float uR, uZ; uniform mat3 uTilt;
    uniform vec2 uOffset; uniform mat2 uQuad; uniform vec2 uShift;
    out vec2 vP; out vec2 vUV; out vec3 vW;
    void main(){
      vec2 p = uQuad * aPos + uShift;
      vP = p; vUV = aPos * 0.5 + 0.5;
      vec3 w = uTilt * vec3((p + uOffset) * uR, uZ);
      vW = w;
      float s = ${D.toFixed(1)} / (${D.toFixed(1)} - w.z);
      vec2 scr = uCenter + w.xy * s;
      gl_Position = vec4(scr.x / uView.x * 2.0 - 1.0, 1.0 - scr.y / uView.y * 2.0, 0.0, 1.0);
    }`;

    const FS_RING = `#version 300 es
    precision highp float;
    in vec2 vP; in vec3 vW;
    uniform sampler2D uPlate, uMaps;
    uniform float uRin, uRout, uRot, uTime, uFlash, uMode, uSoft, uAlpha;
    uniform vec3 uLight, uLamp, uAmb, uGlow; uniform mat3 uTilt;
    uniform vec2 uE0, uE1, uE2;
    out vec4 o;
    float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
    void main(){
      float r = length(vP);
      float aa = fwidth(r) * 1.1 + uSoft;
      float band = (uRin < 0.0 ? 1.0 : smoothstep(uRin - aa, uRin + aa, r)) * (1.0 - smoothstep(uRout - aa, uRout + aa, r));
      float c = cos(uRot), s = sin(uRot);
      vec2 q = mat2(c, -s, s, c) * vP;          // into plate space
      vec2 tc = q * 0.5 + 0.5;
      vec4 alb = texture(uPlate, tc);
      vec4 mp = texture(uMaps, tc);
      float a = band * alb.a * uAlpha;
      if (uMode > 1.5) { o = vec4(0.0, 0.0, 0.0, a); return; }      // shadow
      vec3 L = normalize(uLight - vW);
      float dist = length(uLight - vW);
      float fall = 1.0 / (1.0 + pow(dist / 1900.0, 2.0));
      if (uMode > 0.5) {                                              // disc edge (paper thickness)
        vec3 side = vec3(0.30, 0.22, 0.12) * (uAmb * 1.4 + uLamp * fall * 0.7);
        o = vec4(side * a, a); return;
      }
      vec2 nxy = mat2(c, s, -s, c) * (mp.rg * 2.0 - 1.0);
      vec3 n = normalize(uTilt * vec3(nxy, sqrt(max(0.05, 1.0 - dot(nxy, nxy)))));
      float ndl = max(dot(n, L), 0.0);
      vec3 col = alb.rgb * (uAmb + uLamp * (0.35 + ndl) * fall * 1.15);
      vec3 H = normalize(L + vec3(0.0, 0.0, 1.0));
      float nh = max(dot(n, H), 0.0);
      float gold = mp.b;
      vec3 tint = vec3(1.0, 0.80, 0.46);
      col += gold * gold * tint * uLamp * fall * (pow(nh, 80.0) * 2.2 + pow(nh, 10.0) * 0.34);
      vec2 cell = floor(tc * 64.0);
      float tw = pow(0.5 + 0.5 * sin(uTime * (1.4 + hash(cell) * 2.2) + hash(cell + 7.0) * 40.0), 8.0);
      col += mp.a * tw * tint * 1.1;
      col += gold * uFlash * tint * 0.9;
      vec3 g = vec3(exp(-dot(q - uE0, q - uE0) / 0.0045), exp(-dot(q - uE1, q - uE1) / 0.0045), exp(-dot(q - uE2, q - uE2) / 0.0045));
      col += (vec3(1.0, 0.86, 0.55) * g.x * uGlow.x + vec3(0.62, 0.74, 1.0) * g.y * uGlow.y + vec3(1.0, 0.50, 0.22) * g.z * uGlow.z) * (0.35 + gold * 1.4);
      o = vec4(col * a, a);
    }`;

    const FS_POINTER = `#version 300 es
    precision highp float;
    in vec2 vUV; in vec3 vW;
    uniform sampler2D uSprite;
    uniform float uMode, uAlpha, uPhi, uAcross;
    uniform vec3 uLight, uLamp, uAmb; uniform mat3 uTilt;
    out vec4 o;
    void main(){
      vec4 t = uMode > 1.5 ? texture(uSprite, vUV, 3.5) : texture(uSprite, vUV);
      float a = t.a * uAlpha;
      if (uMode > 1.5) { o = vec4(0.0, 0.0, 0.0, a * 0.75); return; }
      float xs = clamp((vUV.x - 0.5) * uAcross, -0.98, 0.98);
      vec2 perp = vec2(cos(uPhi), sin(uPhi));
      vec3 n = normalize(uTilt * vec3(perp * xs, sqrt(1.0 - xs * xs)));
      vec3 L = normalize(uLight - vW);
      float fall = 1.0 / (1.0 + pow(length(uLight - vW) / 1500.0, 2.0));
      float ndl = max(dot(n, L), 0.0);
      vec3 H = normalize(L + vec3(0.0, 0.0, 1.0));
      float nh = max(dot(n, H), 0.0);
      vec3 col = t.rgb * (uAmb + uLamp * (0.2 + ndl) * fall);
      col += vec3(1.0, 0.85, 0.55) * uLamp * fall * (pow(nh, 60.0) * 1.8 + pow(nh, 8.0) * 0.18);
      o = vec4(col * a, a);
    }`;

    const VS_FULL = `#version 300 es
    in vec2 aPos; void main(){ gl_Position = vec4(aPos, 0.0, 1.0); }`;

    const FS_BG = `#version 300 es
    precision highp float;
    uniform vec2 uView, uCenter, uLampXY, uEye, uCompass, uAnvil, uBeamTo;
    uniform float uR, uTime, uDpr, uChart, uRays, uRhumb, uRhumbA, uForge, uIntro, uStrike;
    out vec4 o;
    float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
    float noise(float x){ float i = floor(x), f = fract(x); return mix(hash(vec2(i, 3.1)), hash(vec2(i + 1.0, 3.1)), f * f * (3.0 - 2.0 * f)); }
    float hair(float d, float w){ return 1.0 - smoothstep(w * 0.5, w * 0.5 + 1.0, abs(d)); }
    void main(){
      vec2 p = vec2(gl_FragCoord.x, uView.y * uDpr - gl_FragCoord.y) / uDpr;
      vec2 v = p - uCenter;
      float d = length(v);
      float ang = atan(v.y, v.x);
      vec3 col = mix(vec3(0.030, 0.042, 0.090), vec3(0.068, 0.088, 0.170), exp(-d / (uR * 2.2)));
      col *= 1.0 - 0.35 * smoothstep(0.4, 1.3, length((p / uView) - 0.5));
      float lampD = length(p - uLampXY);
      float lamp = exp(-lampD * lampD / (2.0 * 420.0 * 420.0));
      col += vec3(1.0, 0.76, 0.46) * 0.075 * lamp * uIntro;
      // engraved celestial chart around the wheel, revealed by the lamp
      float reveal = (0.16 + 1.1 * lamp) * smoothstep(d - 80.0, d, uIntro * 2600.0);
      float chart = 0.0;
      float rings[6] = float[6](1.055, 1.115, 1.30, 1.62, 2.05, 2.65);
      for (int i = 0; i < 6; i++) chart += hair(d - rings[i] * uR, i < 2 ? 0.9 : 0.6) * (i < 2 ? 0.9 : 0.55);
      float a2 = ang + uChart;
      float tickArc = abs(fract(a2 / TAU_ * 180.0 + 0.5) - 0.5) * (TAU_ / 180.0) * d;
      float majorArc = abs(fract(a2 / TAU_ * 36.0 + 0.5) - 0.5) * (TAU_ / 36.0) * d;
      float inTicks = step(1.055 * uR, d) * step(d, 1.115 * uR);
      chart += inTicks * max(hair(tickArc, 0.6) * 0.6, hair(majorArc, 0.9));
      float spokeArc = abs(fract(a2 / TAU_ * 24.0 + 0.5) - 0.5) * (TAU_ / 24.0) * d;
      chart += hair(spokeArc, 0.5) * smoothstep(1.115 * uR, 1.25 * uR, d) * (1.0 - smoothstep(1.6 * uR, 2.8 * uR, d)) * 0.45;
      chart *= 1.0 - 0.75 * smoothstep(uCenter.x + uR * 1.25, uCenter.x + uR * 1.6, p.x);
      col += vec3(0.69, 0.55, 0.29) * chart * reveal * 0.55;
      // star dust
      vec2 g = floor(p / 3.0);
      float st = step(0.9972, hash(g));
      col += vec3(0.85, 0.8, 0.7) * st * (0.25 + 0.5 * sin(uTime * (1.0 + hash(g + 2.0) * 3.0) + hash(g) * 50.0) * 0.5 + 0.25) * uIntro * 0.6;
      // I · Visão — rays from the eye, one beam swings to the text
      if (uRays > 0.001) {
        vec2 e = p - uEye; float er = length(e); float ea = atan(e.y, e.x);
        float rays = pow(noise(ea * 9.0 + uTime * 0.15) * 0.6 + noise(ea * 23.0 - uTime * 0.1) * 0.4, 3.0);
        rays *= smoothstep(uR * 0.15, uR * 0.9, er) * exp(-er / (uR * 2.6));
        vec2 bd = normalize(uBeamTo - uEye);
        float bdot = dot(normalize(e), bd);
        float beam = pow(max(bdot, 0.0), 220.0) * smoothstep(uR * 0.4, uR * 1.2, er) * exp(-er / (uR * 4.5));
        col += vec3(1.0, 0.86, 0.58) * (rays * 0.55 + beam * 0.55) * uRays;
      }
      // II · Direção — rhumb lines drawn out of the compass
      if (uRhumbA > 0.001) {
        vec2 e = p - uCompass; float er = length(e); float ea = atan(e.y, e.x);
        float k = floor(ea / (TAU_ / 32.0) + 0.5);
        float la = k * (TAU_ / 32.0);
        float perpD = er * abs(sin(ea - la));
        float along = er * cos(ea - la);
        float km = mod(k + 64.0, 8.0);
        float major = km < 0.5 ? 1.0 : (mod(k + 64.0, 4.0) < 0.5 ? 0.7 : 0.4);
        float reach = uRhumb * 2600.0;
        float line = hair(perpD, major > 0.9 ? 1.3 : 0.7) * step(0.0, along) * (1.0 - smoothstep(reach - 60.0, reach, along));
        vec3 lc = km < 0.5 ? vec3(0.95, 0.78, 0.45) : vec3(0.62, 0.72, 1.0);
        line *= 1.0 - 0.8 * smoothstep(uCenter.x + uR * 1.2, uCenter.x + uR * 1.55, p.x);
        float front = hair(er - reach * 0.62, 1.0) * 0.35 * (1.0 - uRhumb);
        col += (lc * line * major * exp(-er / 1900.0) + vec3(0.7, 0.78, 1.0) * front) * uRhumbA;
      }
      // III · Execução — the forge
      if (uForge > 0.001) {
        float fr = length(p - uAnvil);
        float flick = 0.75 + 0.25 * noise(uTime * 9.0) + 0.15 * noise(uTime * 23.0 + 4.0);
        col += vec3(1.0, 0.42, 0.14) * exp(-fr / (uR * 0.55)) * 0.42 * uForge * flick;
        col += vec3(0.30, 0.08, 0.02) * 0.10 * uForge * exp(-d / (uR * 2.0));
        col += vec3(1.0, 0.75, 0.45) * exp(-fr * fr / (uR * uR * 0.08)) * uStrike;
      }
      o = vec4(col, 1.0);
    }`.replace(/TAU_/g, '6.2831853');

    const VS_PART = `#version 300 es
    in vec4 aSeed; in float aKind;
    uniform vec2 uView, uCenter, uLampXY, uAnvil; uniform float uTime, uDpr, uR, uBurst, uIntro;
    uniform vec4 uPuffs; // land times for the four discs
    out vec4 vCol;
    float h(float x){ return fract(sin(x * 91.3458) * 47453.5453); }
    void main(){
      vec2 pos = vec2(-99.0); float size = 0.0; vec4 col = vec4(0.0);
      if (aKind < 0.5) {                       // dust in the lamp
        vec2 base = aSeed.xy * uView;
        float t = uTime * (0.006 + aSeed.z * 0.012);
        pos = vec2(base.x + sin(t * 6.0 + aSeed.w * 30.0) * 40.0, mod(base.y - uTime * (4.0 + aSeed.z * 9.0), uView.y + 40.0) - 20.0);
        float l = exp(-pow(length(pos - uLampXY) / 360.0, 2.0));
        float tw = 0.6 + 0.4 * sin(uTime * (1.0 + aSeed.z * 2.0) + aSeed.x * 60.0);
        size = (1.1 + aSeed.w * 1.9);
        col = vec4(1.0, 0.86, 0.62, (0.05 + 0.75 * l) * tw * uIntro);
      } else if (aKind < 1.5) {                // forge sparks, four points per spark make a streak
        float sub = floor(fract(aKind) * 10.0 + 0.5);
        float age = uTime - uBurst - aSeed.w * 0.12 - sub * 0.011;
        float life = 0.5 + aSeed.z * 1.1;
        if (age > 0.0 && age < life) {
          float an = -1.5708 + (aSeed.x - 0.5) * 3.4;
          float sp = 320.0 + pow(aSeed.y, 0.7) * 1100.0;
          float k = 2.2;
          float travel = (1.0 - exp(-k * age)) / k;
          pos = uAnvil + vec2(cos(an), sin(an)) * sp * travel + vec2(0.0, 0.5 * 900.0 * age * age);
          float f = age / life;
          size = (2.0 + aSeed.y * 3.0) * (1.0 - f * 0.5);
          col = vec4(mix(vec3(1.0, 0.95, 0.78), vec3(1.0, 0.35, 0.08), smoothstep(0.0, 0.55, f)) * 1.6, (1.0 - f) * (1.0 - sub * 0.22));
          size *= 1.0 - sub * 0.15;
        }
      } else if (aKind < 2.5) {                // embers rising
        float age = uTime - uBurst - aSeed.w * 0.9;
        float life = 2.4 + aSeed.z * 2.6;
        if (age > 0.0 && age < life) {
          float f = age / life;
          pos = uAnvil + vec2((aSeed.x - 0.5) * 220.0 * pow(age, 0.7) + sin(age * 2.6 + aSeed.y * 9.0) * 16.0, -age * (55.0 + aSeed.y * 95.0));
          size = 1.6 + aSeed.y * 2.0;
          col = vec4(1.0, 0.48 + 0.2 * aSeed.x, 0.16, sin(f * 3.14159) * 0.85);
        }
      } else {                                 // gold dust when a disc lands
        int i = int(aSeed.z * 3.999);
        float lt = i == 0 ? uPuffs.x : i == 1 ? uPuffs.y : i == 2 ? uPuffs.z : uPuffs.w;
        float rr = i == 0 ? 0.985 : i == 1 ? 0.896 : i == 2 ? 0.518 : 0.398;
        float age = uTime - lt;
        if (age > 0.0 && age < 1.1) {
          float an = aSeed.x * 6.2831853;
          float rad = rr * uR * (1.0 + age * (0.05 + aSeed.y * 0.10)) + aSeed.w * 10.0 * age;
          pos = uCenter + vec2(cos(an), sin(an)) * rad + vec2(0.0, -age * 14.0 * aSeed.y);
          size = 1.2 + aSeed.w * 2.0;
          col = vec4(1.0, 0.84, 0.50, pow(1.0 - age / 1.1, 2.0) * 0.9);
        }
      }
      vCol = col;
      gl_PointSize = size * uDpr * 2.0;
      gl_Position = vec4(pos.x / uView.x * 2.0 - 1.0, 1.0 - pos.y / uView.y * 2.0, 0.0, 1.0);
    }`;
    const FS_PART = `#version 300 es
    precision highp float;
    in vec4 vCol; out vec4 o;
    void main(){
      vec2 c = gl_PointCoord - 0.5;
      float f = exp(-dot(c, c) * 18.0);
      o = vec4(vCol.rgb * vCol.a * f, 0.0);
    }`;

    function compile(type, src) {
      const s = gl.createShader(type);
      gl.shaderSource(s, src); gl.compileShader(s);
      return s;
    }
    // Attributes get fixed slots, so only the uniforms wait for the link.
    function program(vs, fs, attributes) {
      const p = gl.createProgram();
      const shaders = [compile(gl.VERTEX_SHADER, vs), compile(gl.FRAGMENT_SHADER, fs)];
      for (const sh of shaders) gl.attachShader(p, sh);
      attributes.forEach((name, i) => gl.bindAttribLocation(p, i, name));
      gl.linkProgram(p);
      return { p, u: {}, shaders };
    }
    function link(pr) {
      if (!gl.getProgramParameter(pr.p, gl.LINK_STATUS)) throw new Error(pr.shaders.map((sh) => gl.getShaderInfoLog(sh)).join('\n') + gl.getProgramInfoLog(pr.p));
      const n = gl.getProgramParameter(pr.p, gl.ACTIVE_UNIFORMS);
      for (let i = 0; i < n; i++) { const info = gl.getActiveUniform(pr.p, i); pr.u[info.name.replace(/\[0\]$/, '')] = gl.getUniformLocation(pr.p, info.name); }
    }

    const progRing = program(VS_PLANE, FS_RING, ['aPos']);
    const progPointer = program(VS_PLANE, FS_POINTER, ['aPos']);
    const progBg = program(VS_FULL, FS_BG, ['aPos']);
    const progPart = program(VS_PART, FS_PART, ['aSeed', 'aKind']);
    // The driver builds the programs while the textures download. Their result is read only
    // once the textures are in, polled where the browser allows (KHR_parallel_shader_compile):
    // asked for earlier, it would freeze the page until the build is done.
    const programs = [progRing, progPointer, progBg, progPart];
    const built = () => new Promise((resolve) => {
      const poll = () => !parallel || programs.every((pr) => gl.getProgramParameter(pr.p, parallel.COMPLETION_STATUS_KHR)) ? resolve() : setTimeout(poll, 20);
      poll();
    }).then(() => programs.forEach(link));

    const quad = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, quad);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const vaoQuad = gl.createVertexArray();
    gl.bindVertexArray(vaoQuad);
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

    // particle seeds: 140 dust, 220 sparks, 70 embers, 280 landing dust
    const KINDS = [[0, 140], [1, 360], [2, 110], [3, 280]];
    const nPart = KINDS.reduce((s, k) => s + k[1] * (k[0] === 1 ? 4 : 1), 0);
    const seeds = new Float32Array(nPart * 5);
    let rnd = 1234567;
    const rand = () => ((rnd = (rnd * 16807) % 2147483647) / 2147483647);
    let j = 0;
    for (const [kind, n] of KINDS) for (let i = 0; i < n; i++) {
      const sd = [rand(), rand(), rand(), rand()];
      if (kind === 1) { for (let sub = 0; sub < 4; sub++) { seeds.set([...sd, 1 + sub / 10], j * 5); j++; } }
      else { seeds.set([...sd, kind], j * 5); j++; }
    }
    const vaoPart = gl.createVertexArray();
    gl.bindVertexArray(vaoPart);
    const pbuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, pbuf);
    gl.bufferData(gl.ARRAY_BUFFER, seeds, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 4, gl.FLOAT, false, 20, 0); // aSeed
    gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 1, gl.FLOAT, false, 20, 16); // aKind
    gl.bindVertexArray(null);

    // Decoded off the main thread where the browser can; an <img> decodes during the upload.
    function pixels(url, data) {
      const image = () => new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = url;
      });
      if (!window.createImageBitmap) return image();
      return fetch(url)
        .then((r) => { if (!r.ok) throw new Error(`${r.status} ${url}`); return r.blob(); })
        .then((blob) => createImageBitmap(blob, { premultiplyAlpha: 'none', colorSpaceConversion: data ? 'none' : 'default' }))
        .catch(image);
    }
    function texture(url, data) {
      return pixels(url, data).then((source) => {
        const t = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, t);
        // For the <img> fallback; an ImageBitmap carries the same choices itself.
        gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, data ? gl.NONE : gl.BROWSER_DEFAULT_WEBGL);
        gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
        source.close?.();
        gl.generateMipmap(gl.TEXTURE_2D);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        if (aniso) gl.texParameterf(gl.TEXTURE_2D, aniso.TEXTURE_MAX_ANISOTROPY_EXT, anisotropy);
        return t;
      });
    }
    // The plate comes in two sizes. 1024 px holds a wheel up to ~975 device px across
    // (phones, 1x screens); larger wheels get the 2048 px plate.
    let plateSize = 0;
    const plateFor = () => (2 * R * dpr > 975 ? 2048 : 1024);
    function plate() {
      plateSize = plateFor();
      // String literals so the build fingerprints them.
      return texture(plateSize === 2048 ? 'assets/images/volvella-plate.webp' : 'assets/images/volvella-plate-1024.webp');
    }

    /* ---------------- state ---------------- */
    let W = 0, H = 0, dpr = 1, cx = 0, cy = 0, R = 300;
    const mouse = { x: 0, y: 0, inside: false, has: false };
    const lamp = { x: 0, y: 0 };
    const tilt = { x: 0.05, y: -0.07 };
    let gap = 0.1;
    let phi = -2.7, phiV = 0, phiTarget = HOUSES[0].angle, stiff = 70, damp = 0.55;
    let dragging = false, dragMoved = 0, dragStart = null;
    let house = 0, pendingLock = 0;
    const lockAt = [-99, -99, -99];
    const level = [0, 0, 0];
    let time = 0, last = performance.now(), introStart = null;
    let raf = 0, keepUntil = 0;
    let ready = false;
    let touched = false, nextTour = Infinity;

    // A GPU that falls behind renders fewer pixels, never fewer than one per CSS pixel.
    const pace = glPace(() => layout());
    function layout() {
      W = inner.clientWidth; H = inner.clientHeight;
      const ib = inner.getBoundingClientRect(), sb = slot.getBoundingClientRect();
      const hintRoom = 44;
      R = Math.max(120, Math.min(sb.width * 0.47, (sb.height - hintRoom) * 0.47, 420));
      cx = sb.left - ib.left + sb.width / 2;
      cy = sb.top - ib.top + (sb.height - hintRoom * 0.5) / 2;
      const sharpest = Math.min(window.devicePixelRatio || 1, 2);
      dpr = Math.max(Math.min(1, sharpest), sharpest * pace.scale);
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
      const lx = cx - (sb.left - ib.left), ly = cy - (sb.top - ib.top);
      Object.assign(hit.style, { left: (lx - R) + 'px', top: (ly - R) + 'px', width: 2 * R + 'px', height: 2 * R + 'px' });
      Object.assign(hint.style, { left: lx + 'px', top: (ly + R + 18) + 'px' });
      if (!mouse.has) { lamp.x = cx - R * 0.55; lamp.y = cy - R * 0.85; }
    }

    function tiltMatrix(rx, ry) {
      const cxr = Math.cos(rx), sxr = Math.sin(rx), cyr = Math.cos(ry), syr = Math.sin(ry);
      // M = Ry * Rx (column-major). Rx: y'=y c - z s, z'=y s + z c. Ry: x'=x c + z s, z'=-x s + z c
      const rxm = [1, 0, 0, 0, cxr, sxr, 0, -sxr, cxr];
      const rym = [cyr, 0, -syr, 0, 1, 0, syr, 0, cyr];
      const m = new Float32Array(9);
      for (let c = 0; c < 3; c++) for (let r = 0; r < 3; r++) {
        let s = 0; for (let k = 0; k < 3; k++) s += rym[k * 3 + r] * rxm[c * 3 + k]; m[c * 3 + r] = s;
      }
      return m;
    }
    function project(m, x, y, z) { // wheel units -> screen css px
      const wx = m[0] * x * R + m[3] * y * R + m[6] * z, wy = m[1] * x * R + m[4] * y * R + m[7] * z, wz = m[2] * x * R + m[5] * y * R + m[8] * z;
      const s = D / (D - wz);
      return [cx + wx * s, cy + wy * s];
    }

    const ease = (x) => 1 - Math.pow(1 - Math.min(1, Math.max(0, x)), 3);
    const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
    const wrap = (a) => a - TAU * Math.round(a / TAU);

    function setHouse(h, fromWheel) {
      if (h === house && !fromWheel) return;
      house = h;
      section.dataset.house = String(h);
      hit.setAttribute('aria-valuenow', String(h + 1));
      hit.setAttribute('aria-valuetext', HOUSES[h].title);
      tabs.forEach((t, i) => { t.setAttribute('aria-selected', String(i === h)); t.tabIndex = i === h ? 0 : -1; });
      panel.classList.add('is-swapping');
      setTimeout(() => {
        fillHouse(h);
        requestAnimationFrame(() => panel.classList.remove('is-swapping'));
      }, frozenAt === null && !reduced ? 260 : 0);
    }

    function aimAt(h) {
      phiTarget = phi + wrap(HOUSES[h].angle - phi);
      stiff = 90; damp = 0.5;
      pendingLock = h + 1;
    }

    /* ---------------- input ---------------- */
    function local(e) { const b = inner.getBoundingClientRect(); return [e.clientX - b.left, e.clientY - b.top]; }
    inner.addEventListener('pointermove', (e) => {
      [mouse.x, mouse.y] = local(e); mouse.inside = true; mouse.has = true;
      if (dragging) {
        dragMoved += Math.abs(e.movementX) + Math.abs(e.movementY);
        const a = Math.atan2(mouse.x - cx, -(mouse.y - cy));
        phiTarget = phi + wrap(a - phi);
      }
    });
    inner.addEventListener('pointerleave', () => { mouse.inside = false; });
    // the wheel owns its gestures: keep the page's swipe navigation out of a drag
    for (const type of ['touchstart', 'touchmove', 'touchend']) hit.addEventListener(type, (e) => e.stopPropagation(), { passive: true });
    const touch = () => { touched = true; };
    hit.addEventListener('pointerdown', (e) => {
      touch();
      hit.setPointerCapture(e.pointerId);
      dragging = true; dragMoved = 0; dragStart = local(e);
      section.classList.add('is-dragging', 'has-turned');
      [mouse.x, mouse.y] = dragStart; mouse.has = true; mouse.inside = true;
      stiff = 240; damp = 0.85; pendingLock = 0;
    });
    function release() {
      if (!dragging) return;
      dragging = false;
      section.classList.remove('is-dragging');
      if (dragMoved < 6) {
        // a tap: pick the emblem under it, or aim where tapped
        const [x, y] = dragStart;
        const ux = (x - cx) / R, uy = (y - cy) / R;
        let best = -1, bd = 0.02;
        HOUSES.forEach((hh, i) => { const d = (ux - hh.at[0]) ** 2 + (uy - hh.at[1]) ** 2; if (d < bd) { bd = d; best = i; } });
        if (best < 0) { const a = Math.atan2(ux, -uy); best = nearest(a); }
        aimAt(best); return;
      }
      aimAt(nearest(phi + phiV * 0.16));
    }
    function nearest(a) {
      let best = 0, bd = 9;
      HOUSES.forEach((hh, i) => { const d = Math.abs(wrap(hh.angle - a)); if (d < bd) { bd = d; best = i; } });
      return best;
    }
    hit.addEventListener('pointerup', release);
    hit.addEventListener('pointercancel', release);
    hit.addEventListener('keydown', (e) => {
      const dir = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
      if (!dir) return;
      e.preventDefault(); touch(); section.classList.add('has-turned');
      aimAt((house + dir + 3) % 3);
    });
    tabs.forEach((t, i) => {
      t.addEventListener('click', () => { touch(); section.classList.add('has-turned'); aimAt(i); });
      t.addEventListener('keydown', (e) => {
        const dir = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
        if (!dir) return;
        e.preventDefault();
        const n = (i + dir + 3) % 3;
        tabs[n].focus(); tabs[n].click();
      });
    });

    /* ---------------- frame ---------------- */
    let tex = null;
    function draw(now) {
      raf = 0;
      if (frozenAt === null && !pace.ready(now)) { raf = requestAnimationFrame(draw); return; }
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      if (frozenAt !== null) { time = frozenAt; if (introStart === null) introStart = 0; } else time += dt;
      const t = introStart === null ? -10 : reduced ? time + 4 : time - introStart;
      const stepDt = frozenAt !== null ? 0 : dt;

      // lamp follows the cursor, else drifts above-left of the wheel
      const idleX = cx - R * 0.6 + Math.sin(time * 0.23) * R * 0.25, idleY = cy - R * 0.8 + Math.cos(time * 0.17) * R * 0.18;
      const tx = mouse.inside ? mouse.x : idleX, ty = mouse.inside ? mouse.y : idleY;
      const kl = frozenAt !== null ? 1 : 1 - Math.exp(-dt * 6);
      lamp.x += (tx - lamp.x) * kl; lamp.y += (ty - lamp.y) * kl;

      // tilt & explode
      const near = mouse.inside ? clamp(1.5 - Math.hypot(mouse.x - cx, mouse.y - cy) / R, 0, 1) : 0;
      const dx = mouse.inside ? clamp((mouse.x - cx) / R, -1.3, 1.3) : 0.45, dy = mouse.inside ? clamp((mouse.y - cy) / R, -1.3, 1.3) : -0.4;
      const trx = 0.04 + dy * 0.15 * (0.4 + 0.6 * near), tryy = -dx * 0.15 * (0.4 + 0.6 * near);
      const gTarget = params.has('e-explode') ? parseFloat(params.get('e-explode')) : dragging ? 1.0 : 0.12 + near * 0.55;
      const kt = frozenAt !== null ? 1 : 1 - Math.exp(-dt * 4);
      tilt.x += (trx - tilt.x) * kt; tilt.y += (tryy - tilt.y) * kt;
      gap += (gTarget - gap) * (frozenAt !== null ? 1 : 1 - Math.exp(-dt * 5));

      // pointer spring (+ entrance swing)
      if (t >= POINTER_LAND || frozenAt !== null) {
        if (frozenAt !== null) {
          const fh = params.has('e-house') ? parseInt(params.get('e-house'), 10) : 0;
          const settle = Math.max(0, t - POINTER_LAND);
          phi = HOUSES[fh].angle + (-2.6 - HOUSES[fh].angle) * Math.exp(-settle * 4.5) * Math.cos(settle * 9);
          if (t < POINTER_LAND) phi = -2.6;
        } else {
          const c = 2 * Math.sqrt(stiff) * damp;
          phiV += (stiff * (phiTarget - phi) - c * phiV) * stepDt;
          phi += phiV * stepDt;
          if (pendingLock && Math.abs(phiTarget - phi) < 0.03 && Math.abs(phiV) < 0.6) {
            const h = pendingLock - 1; pendingLock = 0;
            lockAt[h] = time; setHouse(h, true);
          }
        }
      }
      if (frozenAt !== null && params.has('e-house')) {
        const fh = parseInt(params.get('e-house'), 10);
        lockAt[fh] = time - (params.has('e-fx') ? parseFloat(params.get('e-fx')) : 0.6);
        if (house !== fh) setHouse(fh);
      }
      for (let i = 0; i < 3; i++) {
        const target = i === house && t > POINTER_LAND ? 1 : 0;
        level[i] = frozenAt !== null ? target : level[i] + (target - level[i]) * (1 - Math.exp(-dt * (target ? 2.5 : 1.6)));
      }
      if (ready && !touched && frozenAt === null && !reduced && time > nextTour && !pendingLock) { aimAt((house + 1) % 3); nextTour = time + 6.5; }
      if (!ready && t > READY_AT) { ready = true; nextTour = time + 7; section.classList.add('is-ready'); if (frozenAt === null && lockAt[0] < 0) lockAt[0] = time; }

      // gears
      const creatureRot = -phi * 0.42 + (reduced ? 0 : time * TAU / 260);
      const lapisRot = phi * 0.9 - (reduced ? 0 : time * TAU / 340);
      const chartRot = creatureRot * 0.5;

      const M = tiltMatrix(tilt.x, tilt.y);
      const Lw = [lamp.x - cx, lamp.y - cy, LAMP_Z];
      const intro = clamp(t / 1.6, 0, 1);
      const burst = (h) => Math.exp(-Math.max(0, time - lockAt[h]) / 1.3) * (lockAt[h] > -50 ? 1 : 0);
      const since = (h) => time - lockAt[h];

      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.bindVertexArray(vaoQuad);

      // background
      gl.disable(gl.BLEND);
      gl.useProgram(progBg.p);
      const u = progBg.u;
      const eye = project(M, HOUSES[0].at[0], HOUSES[0].at[1], 3 * 1.5 + gap * 3 * 30);
      const compass = project(M, HOUSES[1].at[0], HOUSES[1].at[1], 3 * 1.5 + gap * 3 * 30);
      const anvil = project(M, HOUSES[2].at[0], HOUSES[2].at[1] - 0.03, 3 * 1.5 + gap * 3 * 30);
      const cb = copy.getBoundingClientRect(), sb = inner.getBoundingClientRect();
      const beamTo = [cb.left - sb.left + 80, cb.top - sb.top + 120];
      gl.uniform2f(u.uView, W, H); gl.uniform2f(u.uCenter, cx, cy); gl.uniform1f(u.uR, R);
      gl.uniform1f(u.uTime, time); gl.uniform1f(u.uDpr, dpr); gl.uniform1f(u.uChart, chartRot);
      gl.uniform2f(u.uLampXY, lamp.x, lamp.y);
      gl.uniform2f(u.uEye, eye[0], eye[1]); gl.uniform2f(u.uCompass, compass[0], compass[1]); gl.uniform2f(u.uAnvil, anvil[0], anvil[1]);
      gl.uniform2f(u.uBeamTo, beamTo[0], beamTo[1]);
      gl.uniform1f(u.uRays, level[0] * 0.5 + burst(0) * 0.9);
      gl.uniform1f(u.uRhumb, ease(since(1) / 1.8));
      gl.uniform1f(u.uRhumbA, level[1] * 0.55 + burst(1) * 0.5);
      gl.uniform1f(u.uForge, level[2] * 0.45 + burst(2) * 0.9);
      gl.uniform1f(u.uIntro, intro);
      gl.uniform1f(u.uStrike, lockAt[2] > -50 ? Math.exp(-Math.max(0, time - lockAt[2]) / 0.12) * 0.9 : 0);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

      if (tex) {
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
        const ur = progRing.u;
        gl.useProgram(progRing.p);
        gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, tex.plate);
        gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, tex.maps);
        gl.uniform1i(ur.uPlate, 0); gl.uniform1i(ur.uMaps, 1);
        gl.uniform2f(ur.uView, W, H); gl.uniform2f(ur.uCenter, cx, cy); gl.uniform1f(ur.uR, R);
        gl.uniformMatrix3fv(ur.uTilt, false, M);
        gl.uniformMatrix2fv(ur.uQuad, false, [1, 0, 0, 1]);
        gl.uniform2f(ur.uShift, 0, 0);
        gl.uniform3f(ur.uLight, Lw[0], Lw[1], Lw[2]);
        gl.uniform3f(ur.uLamp, 1.05, 0.90, 0.70);
        gl.uniform3f(ur.uAmb, 0.36, 0.32, 0.31);
        gl.uniform1f(ur.uTime, time);
        gl.uniform2f(ur.uE0, ...HOUSES[0].at); gl.uniform2f(ur.uE1, ...HOUSES[1].at); gl.uniform2f(ur.uE2, ...HOUSES[2].at);

        const zs = [];
        let zBelow = 0;
        RINGS.forEach((ring, i) => {
          const p = ease((t - ring.land + 1.0) / 1.0);
          const after = t - ring.land;
          const bounce = after > 0 ? 14 * Math.exp(-after * 7) * Math.abs(Math.sin(after * 22)) : 0;
          const lift = (1 - p) * 1500 + bounce;
          const rot = (ring.spin === 0 ? (i === 0 ? 0.8 : -1.2) : ring.spin * 3.0) * Math.pow(1 - p, 2);
          const z = 1.5 * i + gap * 30 * i + lift + 4;
          zs.push(z);
          const alpha = clamp((t - ring.land + 1.0) / 0.35, 0, 1);
          const landed = t - ring.land;
          const flash = landed > 0 ? Math.exp(-landed / 0.35) : 0;
          const rotNow = rot + (i === 1 ? creatureRot : i === 2 ? lapisRot : 0);
          const extent = ring.rout + 0.02;
          gl.uniformMatrix2fv(ur.uQuad, false, [extent, 0, 0, extent]);
          gl.uniform1f(ur.uRin, ring.rin); gl.uniform1f(ur.uRout, ring.rout); gl.uniform1f(ur.uRot, rotNow);
          gl.uniform1f(ur.uAlpha, alpha);
          // shadow onto what is below (page for the bottom disc)
          const dz = Math.max(3, z - zBelow);
          gl.uniform1f(ur.uMode, 2); gl.uniform1f(ur.uZ, zBelow + 0.1);
          gl.uniform2f(ur.uOffset, -Lw[0] / LAMP_Z * dz / R * 0.9 + 0.004, -Lw[1] / LAMP_Z * dz / R * 0.9 + 0.012);
          gl.uniform1f(ur.uSoft, 0.004 + dz / R * 0.35);
          gl.uniform1f(ur.uAlpha, alpha * clamp(0.62 - lift / 1400, 0, 0.62));
          gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
          gl.uniform2f(ur.uOffset, 0, 0); gl.uniform1f(ur.uSoft, 0); gl.uniform1f(ur.uAlpha, alpha);
          // paper edge, then the face
          gl.uniform1f(ur.uMode, 1); gl.uniform1f(ur.uZ, z - 3.0);
          gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
          gl.uniform1f(ur.uMode, 0); gl.uniform1f(ur.uZ, z);
          gl.uniform1f(ur.uFlash, flash + (i === 3 ? (burst(0) + burst(1) + burst(2)) * 0.25 : 0));
          gl.uniform3f(ur.uGlow, i === 3 ? level[0] * 0.55 + burst(0) * 0.9 : 0, i === 3 ? level[1] * 0.55 + burst(1) * 0.9 : 0, i === 3 ? level[2] * 0.55 + burst(2) * 0.9 : 0);
          gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
          zBelow = z;
        });

        // pointer
        const pp = ease((t - POINTER_LAND + 0.6) / 0.6);
        const pz = zBelow + 6 + gap * 30 + (1 - pp) * 500;
        const k = POINTER.length / (POINTER.py - 8);
        const hw = POINTER.w / 2 * k, hh = POINTER.h / 2 * k;
        const ox = (POINTER.w / 2 - POINTER.px) * k, oy = (POINTER.h / 2 - POINTER.py) * k;
        const c = Math.cos(phi), s = Math.sin(phi);
        const pivot = [0, 0.02];
        const up = progPointer.u;
        gl.useProgram(progPointer.p);
        gl.activeTexture(gl.TEXTURE2); gl.bindTexture(gl.TEXTURE_2D, tex.pointer);
        gl.uniform1i(up.uSprite, 2);
        gl.uniform2f(up.uView, W, H); gl.uniform2f(up.uCenter, cx, cy); gl.uniform1f(up.uR, R);
        gl.uniformMatrix3fv(up.uTilt, false, M);
        gl.uniformMatrix2fv(up.uQuad, false, [c * hw, s * hw, -s * hh, c * hh]);
        gl.uniform2f(up.uShift, pivot[0] + c * ox - s * oy, pivot[1] + s * ox + c * oy);
        gl.uniform3f(up.uLight, Lw[0], Lw[1], Lw[2]);
        gl.uniform3f(up.uLamp, 1.0, 0.88, 0.70); gl.uniform3f(up.uAmb, 0.22, 0.22, 0.30);
        gl.uniform1f(up.uPhi, phi); gl.uniform1f(up.uAcross, POINTER.w / 22);
        const pa = clamp((t - POINTER_LAND + 0.6) / 0.25, 0, 1);
        const pdz = pz - zBelow;
        gl.uniform1f(up.uMode, 2); gl.uniform1f(up.uZ, zBelow + 0.2); gl.uniform1f(up.uAlpha, pa * clamp(0.9 - (1 - pp), 0, 0.9));
        gl.uniform2f(up.uOffset, -Lw[0] / LAMP_Z * pdz / R + 0.006, -Lw[1] / LAMP_Z * pdz / R + 0.014);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        gl.uniform1f(up.uMode, 0); gl.uniform1f(up.uZ, pz); gl.uniform1f(up.uAlpha, pa);
        gl.uniform2f(up.uOffset, 0, 0);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

        // particles
        gl.blendFunc(gl.ONE, gl.ONE);
        gl.useProgram(progPart.p);
        gl.bindVertexArray(vaoPart);
        const pu = progPart.u;
        gl.uniform2f(pu.uView, W, H); gl.uniform2f(pu.uCenter, cx, cy); gl.uniform2f(pu.uLampXY, lamp.x, lamp.y);
        gl.uniform2f(pu.uAnvil, anvil[0], anvil[1]);
        gl.uniform1f(pu.uTime, time); gl.uniform1f(pu.uDpr, dpr); gl.uniform1f(pu.uR, R); gl.uniform1f(pu.uIntro, intro);
        gl.uniform1f(pu.uBurst, lockAt[2]);
        const base = introStart ?? -99;
        gl.uniform4f(pu.uPuffs, base + RINGS[0].land, base + RINGS[1].land, base + RINGS[2].land, base + RINGS[3].land);
        gl.drawArrays(gl.POINTS, 0, nPart);
      }

      if (running()) raf = requestAnimationFrame(draw);
      else if (frozenAt !== null) window.__essFrame = (window.__essFrame || 0) + 1;
    }

    const isActive = () => document.body.dataset.section === 'essencia';
    function running() { return tex && frozenAt === null && !document.hidden && (isActive() || performance.now() < keepUntil); }
    function kick() { if (!raf && tex) { last = performance.now(); pace.reset(); raf = requestAnimationFrame(draw); } }
    function sync() {
      if (isActive()) {
        // the discs drop in when the visitor arrives, after the page slide settles
        if (introStart === null && frozenAt === null) introStart = time + (reduced ? 0 : 0.45);
        kick();
      } else {
        keepUntil = performance.now() + 1100;
        kick();
      }
    }
    document.addEventListener('portfolio:sectionchange', sync);
    document.addEventListener('visibilitychange', sync);
    new ResizeObserver(() => {
      layout();
      if (tex && !raf) raf = requestAnimationFrame(draw);
      // Grown past the small plate (a window made larger): swap in the large one.
      if (tex && plateSize < plateFor()) plate().then((t) => { gl.deleteTexture(tex.plate); tex.plate = t; kick(); }).catch(() => {});
    }).observe(inner);
    document.fonts?.ready.then(() => { layout(); if (tex && !raf) raf = requestAnimationFrame(draw); });

    section.classList.add('has-gl');
    if (reduced) section.classList.add('is-ready');
    layout();
    if (params.has('e-mx')) { mouse.x = parseFloat(params.get('e-mx')); mouse.y = parseFloat(params.get('e-my')); mouse.inside = mouse.has = true; lamp.x = mouse.x; lamp.y = mouse.y; }
    // String literals so the build fingerprints them.
    Promise.all([plate(), texture('assets/images/volvella-maps.webp', true), texture('assets/images/volvella-pointer.webp')])
      .then((textures) => built().then(() => textures))
      .then(([platePx, maps, pointer]) => {
        tex = { plate: platePx, maps, pointer };
        raf = requestAnimationFrame(draw);   // one still frame so the night is painted before the visit
        sync();
      })
      .catch((error) => {
        if (error instanceof Error) console.error(error); // a shader that failed to build
        section.classList.add('is-ready');
      });
  }

  // Four GL programs and up to ~1 MB of textures: none of it competes with the hero.
  // It starts once the hero has settled after load, or as soon as the visitor comes here.
  let started = false;
  const begin = () => { if (!started) { started = true; start(); } };
  const here = () => document.body.dataset.section === 'essencia';
  if (here()) begin();
  else {
    document.addEventListener('portfolio:sectionchange', () => { if (here()) begin(); });
    const idle = window.requestIdleCallback ? (fn) => requestIdleCallback(fn, { timeout: 2000 }) : (fn) => setTimeout(fn, 0);
    const settle = () => setTimeout(() => idle(begin), 2500);
    if (document.readyState === 'complete') settle();
    else addEventListener('load', settle, { once: true });
  }
})();
