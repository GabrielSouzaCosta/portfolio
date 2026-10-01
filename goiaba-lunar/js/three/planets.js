/** Celestial worlds: spherical weather fields, suspended cloud veils and
 * scattered light. The products lend their palettes, never literal props. */
const WORLDS = {
  cindra: {
    radius: .875, seed: 3.7, bands: .32, twist: 1.45,
    colors: ['#271824', '#803f48', '#d78664', '#f4c49a'],
    haze: '#f3aa83', surface: '#8a4537', tilt: .28,
  },
  commissionmatch: {
    radius: .83, seed: 17.2, bands: .85, twist: .72,
    colors: ['#202c26', '#647155', '#b6b88a', '#eee3bd'],
    haze: '#ded7ab', surface: '#59644a', tilt: -.32,
  },
  mangue: {
    radius: .865, seed: 31.8, bands: .16, twist: 2.1,
    colors: ['#052c38', '#12626b', '#55ac98', '#c0ddba'],
    haze: '#8ae5cc', surface: '#0e5a58', tilt: .45,
  },
};

// Seamless object-space noise: no equirectangular seam or polar pinch.
const WEATHER = /* glsl */`
  float hash3(vec3 p) {
    p = fract(p * .3183099 + vec3(.11, .27, .43));
    p *= 17.0;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
  }
  float noise3(vec3 p) {
    vec3 i = floor(p), f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(mix(hash3(i), hash3(i + vec3(1,0,0)), f.x),
                   mix(hash3(i + vec3(0,1,0)), hash3(i + vec3(1,1,0)), f.x), f.y),
               mix(mix(hash3(i + vec3(0,0,1)), hash3(i + vec3(1,0,1)), f.x),
                   mix(hash3(i + vec3(0,1,1)), hash3(i + vec3(1,1,1)), f.x), f.y), f.z);
  }
  mat3 octaveTurn = mat3(.00, .80, .60, -.80, .36, -.48, -.60, -.48, .64);
  float fbm(vec3 p) {
    float sum = 0.0, weight = .53;
    for (int i = 0; i < 5; i++) {
      sum += weight * noise3(p);
      p = octaveTurn * p * 2.07 + 8.6;
      weight *= .48;
    }
    return sum;
  }
  vec3 weatherPosition(vec3 p) {
    float angle = p.y * uTwist + .22 * sin(p.y * 5.0) + uTime * .009;
    p.xz = mat2(cos(angle), -sin(angle), sin(angle), cos(angle)) * p.xz;
    return p * 1.85 + vec3(uSeed, 0.0, 0.0);
  }
  vec3 weatherWarp(vec3 p) {
    return vec3(fbm(p + vec3(0, 0, uTime * .007)),
                fbm(p + vec3(5.2, 1.3, 3.8)),
                fbm(p + vec3(2.7, 8.1, 1.4))) - .48;
  }
`;
const VERTEX = /* glsl */`
  varying vec3 vLocal;
  varying vec3 vWorld;
  varying vec3 vNormalWorld;
  varying vec3 vCenter;
  varying float vRadius;
  void main() {
    vLocal = position;
    vec4 world = modelMatrix * vec4(position, 1.0);
    vWorld = world.xyz;
    vCenter = (modelMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
    vRadius = length(vWorld - vCenter);
    vNormalWorld = normalize(mat3(modelMatrix) * normal);
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;
const UNIFORMS = /* glsl */`
  uniform float uTime, uSeed, uBands, uTwist, uHover, uReveal, uStyle, uPixel;
  uniform vec3 uDeep, uMid, uLight, uPearl, uHaze;
  varying vec3 vLocal, vWorld, vNormalWorld, vCenter;
  varying float vRadius;
`;
// On hover each planet turns, for a moment, into the medium of its own world:
// Cindra's pixel valley, CommissionMatch's engraved map, Mangue's written page.
const REVEAL = /* glsl */`
  const vec3 SUN = vec3(-.8165, .4082, .4082);
  float bayer4(vec2 p) {
    vec2 q = mod(floor(p), 4.0);
    float i = q.x + q.y * 4.0;
    return mod(i * 11.0 + floor(i / 4.0) * 7.0, 16.0) / 16.0;
  }
  float grain(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
  vec3 toned(vec3 shade, vec3 mid, vec3 light, float level) {
    return level < .5 ? shade * .62 : level < 1.5 ? shade : level < 2.5 ? mid : light;
  }
  float landAt(vec3 dir) { return fbm(dir * 1.7 + vec3(uSeed * .37, 1.3, 2.1)); }
  // Returns rgb and the dissolve mask in alpha.
  vec4 pixelWorld(vec2 offset, out bool outside) {
    vec3 local = normalize(vLocal - dFdx(vLocal) * offset.x - dFdy(vLocal) * offset.y);
    vec3 world = vWorld - dFdx(vWorld) * offset.x - dFdy(vWorld) * offset.y;
    vec2 d = (viewMatrix * vec4(world, 1.0)).xy - (viewMatrix * vec4(vCenter, 1.0)).xy;
    outside = length(d) > vRadius;
    vec3 nv = vec3(d, sqrt(max(0.0, vRadius * vRadius - dot(d, d)))) / vRadius;
    vec3 n = transpose(mat3(viewMatrix)) * nv;
    vec2 block = floor(gl_FragCoord.xy / uPixel);
    float day = dot(n, SUN);
    float level = clamp(floor((day * .5 + .5) * 3.2 + bayer4(block) * .9 - .55), 0.0, 3.0);
    float land = landAt(local);
    float cloud = fbm(local * 3.1 + vec3(uTime * .02, 0.0, 4.0));
    vec3 color;
    if (land < .43) color = toned(vec3(.141,.302,.459), vec3(.212,.451,.631), vec3(.341,.643,.792), level);
    else if (land < .46) color = toned(vec3(.659,.506,.310), vec3(.847,.698,.478), vec3(.937,.851,.643), level);
    else if (land < .57) color = toned(vec3(.247,.420,.208), vec3(.435,.612,.271), vec3(.651,.780,.388), level);
    else color = toned(vec3(.141,.247,.169), vec3(.243,.420,.227), vec3(.373,.561,.271), level);
    if (cloud > .7 && level > .5) color = mix(color, vec3(.957,.937,.878), level > 2.5 ? 1.0 : .82);
    // Rim of darker pixels, like a hand-placed sprite outline.
    if (nv.z < .22) color *= .55;
    float front = noise3(local * 5.0 + 2.0);
    return vec4(color, step(front, uReveal * 1.25 - .12));
  }
  vec4 engravedWorld(vec3 n, vec3 view) {
    vec3 local = normalize(vLocal);
    float land = landAt(local);
    float light = smoothstep(-.25, .95, dot(n, SUN));
    vec3 paper = vec3(.937,.890,.769), ink = vec3(.165,.133,.090);
    float lat = asin(clamp(local.y, -1.0, 1.0)), lon = atan(local.z, local.x);
    // Sea: engraved wavy lines that thicken in shadow. Land: form-following hatching.
    float sea = abs(fract(lat * 14.0 + .12 * sin(lon * 9.0 + lat * 6.0)) - .5) * 2.0;
    float hatch = abs(fract((lon * .8 + lat * 1.6) * 7.0) - .5) * 2.0;
    float cross = abs(fract((lon * .8 - lat * 1.6) * 7.0) - .5) * 2.0;
    float darkness = 1.0 - light;
    float lines = land < .5
      ? 1.0 - smoothstep(.18 + darkness * .55, .30 + darkness * .55, sea)
      : max(1.0 - smoothstep(darkness * .6, darkness * .6 + .12, hatch), darkness > .55 ? 1.0 - smoothstep((darkness - .55) * 1.4, (darkness - .55) * 1.4 + .12, cross) : 0.0);
    float mountains = smoothstep(.62, .66, land) * (1.0 - smoothstep(.2, .32, abs(fract(land * 38.0) - .5) * 2.0));
    float coast = 1.0 - smoothstep(0.0, fwidth(land) * 1.6, abs(land - .5));
    float limb = 1.0 - smoothstep(.10, .24, dot(n, view));
    float amount = clamp(max(max(lines * .9, coast), max(mountains * .8, limb)), 0.0, 1.0);
    vec3 color = mix(paper * (.9 + .1 * grain(gl_FragCoord.xy)), ink, amount);
    float front = fbm(local * 3.2 + 7.0);
    float edge = uReveal * 1.3 - .15;
    float mask = smoothstep(front - .03, front + .03, edge);
    color = mix(color, ink, (1.0 - smoothstep(0.0, .035, abs(front - edge))) * step(.01, uReveal) * step(uReveal, .99));
    return vec4(color, mask);
  }
  // Mangue is read through the page veil (hero.css), which inverts lightness
  // and keeps hue: it is drawn here as light ink on a dark sheet so that it
  // appears as a written page. Continents are handwriting; the sea is ruled.
  vec4 writtenWorld(vec3 n, vec3 view) {
    vec3 local = normalize(vLocal);
    float land = landAt(local);
    float lat = asin(clamp(local.y, -1.0, 1.0)), lon = atan(local.z, local.x);
    float rows = lat * 15.0, row = floor(rows), within = fract(rows);
    float x = lon * 15.0 * max(.25, cos(lat));
    float seed = hash3(vec3(row, 1.7, 2.3)) * 6.2832;
    // A line of cursive: small waves with the odd ascender loop, in words.
    float y = .42 + .13 * sin(x * 5.3 + seed) * sin(x * 1.7 + seed * 2.0) + .3 * pow(max(0.0, sin(x * .9 + seed * 3.0)), 14.0);
    float inWord = step(fract(x * .21 + hash3(vec3(row, 3.1, 4.7))), .8);
    float thickness = fwidth(rows) * 1.1;
    float script = (1.0 - smoothstep(.045, .045 + thickness, abs(within - y))) * inWord * step(.5, land);
    float ruled = (1.0 - smoothstep(0.0, thickness, abs(within - .1))) * (land < .5 ? .5 : .18);
    float coast = 1.0 - smoothstep(0.0, fwidth(land) * 1.6, abs(land - .5));
    // Each line is written left to right as the preview comes in.
    float written = step((lon + 3.1416) / 6.2832, uReveal * 1.45 - hash3(vec3(row, 5.3, 6.1)) * .45);
    float light = smoothstep(-.4, .95, dot(n, SUN));
    vec3 sheet = mix(vec3(.11,.1,.09), vec3(.02,.022,.026), light);
    vec3 color = sheet;
    color = mix(color, vec3(.62,.9,.95), ruled * .6);
    color = mix(color, vec3(.72,.95,.78), script * written);
    color = mix(color, vec3(.95,.62,.56), coast * .9);
    float limb = 1.0 - smoothstep(.05, .25, dot(n, view));
    color = mix(color, vec3(.85,.85,.82), limb * .8);
    return vec4(color, smoothstep(0.0, .35, uReveal));
  }
`;
const SURFACE = /* glsl */`
  ${UNIFORMS}
  ${WEATHER}
  ${REVEAL}
  void main() {
    vec3 n = normalize(vNormalWorld);
    vec3 view = normalize(cameraPosition - vWorld);
    vec3 sun = normalize(vec3(-1.0, .65, .65));
    vec3 p = weatherPosition(normalize(vLocal));
    vec3 warp = weatherWarp(p);
    vec3 current = p + warp * 1.65;
    float density = fbm(current * 1.5);
    float wisps = fbm(current * 3.2 + warp * .8);
    float latitude = normalize(vLocal).y;
    float belts = sin(latitude * 24.0 + warp.y * 13.0 + density * 7.0);
    float field = density * .72 + wisps * .28 + belts * uBands * .115;
    vec3 color = mix(uDeep, uMid, smoothstep(.22, .49, field));
    color = mix(color, uLight, smoothstep(.44, .66, field));
    float filaments = pow(1.0 - abs(sin((wisps * .65 + density * .35) * 36.0)), 10.0);
    float veil = smoothstep(.53, .76, wisps + belts * uBands * .055);
    color = mix(color, uPearl, veil * .38);
    color = mix(color, uLight, filaments * .055);
    float day = dot(n, sun);
    float light = smoothstep(-.16, .96, day);
    // A broad day/night terminator gives planetary depth without a lacquer hotspot.
    vec3 result = color * (.12 + light * .98);
    float limb = pow(1.0 - max(0.0, dot(n, view)), 3.4);
    float scattering = pow(max(0.0, dot(n, sun) + .28), 1.4);
    result += uHaze * limb * (.15 + scattering * .33);
    // Subsurface-looking light follows weather filaments, not random sparkles.
    result += uLight * filaments * smoothstep(.48, .65, density) * (.05 + uHover * .025);
    if (uReveal > .001) {
      vec4 styled;
      if (uStyle < .5) {
        bool outside;
        styled = pixelWorld(mod(gl_FragCoord.xy, uPixel) - uPixel * .5, outside);
        if (outside && styled.a > .5) discard;
      } else if (uStyle < 1.5) styled = engravedWorld(n, view);
      else styled = writtenWorld(n, view);
      result = mix(result, styled.rgb, styled.a);
    }
    gl_FragColor = vec4(result, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;
const CLOUDS = /* glsl */`
  ${UNIFORMS}
  ${WEATHER}
  void main() {
    vec3 n = normalize(vNormalWorld);
    vec3 p = weatherPosition(normalize(vLocal)) + vec3(.16, uTime * .005, .12);
    vec3 warp = weatherWarp(p);
    float cloud = fbm(p * 1.7 + warp * 1.9);
    float silk = fbm(p * 3.8 + warp * 2.2);
    float alpha = smoothstep(.43, .72, cloud * .72 + silk * .28) * .34 * (1.0 - uReveal);
    float daylight = smoothstep(-.4, .9, dot(n, normalize(vec3(-1.0,.65,.65))));
    vec3 tint = mix(uLight, uPearl, silk) * (.38 + daylight * .7);
    gl_FragColor = vec4(tint, alpha);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

export function createPlanet(THREE, world) {
  const spec = WORLDS[world] || WORLDS.cindra;
  const planet = new THREE.Group();
  planet.name = `planet-${world}`;
  const weather = new THREE.Group();
  weather.rotation.z = spec.tilt;
  planet.add(weather);
  const uniforms = {
    uTime: { value: 0 }, uHover: { value: 0 }, uReveal: { value: 0 }, uPixel: { value: 4 },
    uStyle: { value: ['cindra', 'commissionmatch', 'mangue'].indexOf(world) === -1 ? 0 : ['cindra', 'commissionmatch', 'mangue'].indexOf(world) },
    uSeed: { value: spec.seed }, uBands: { value: spec.bands }, uTwist: { value: spec.twist },
    uDeep: { value: new THREE.Color(spec.colors[0]) },
    uMid: { value: new THREE.Color(spec.colors[1]) },
    uLight: { value: new THREE.Color(spec.colors[2]) },
    uPearl: { value: new THREE.Color(spec.colors[3]) },
    uHaze: { value: new THREE.Color(spec.haze) },
  };
  const mesh = (radius, material, name) => {
    const object = new THREE.Mesh(new THREE.SphereGeometry(radius, 80, 56), material);
    object.name = name;
    weather.add(object);
    return object;
  };
  mesh(spec.radius, new THREE.ShaderMaterial({
    uniforms, vertexShader: VERTEX, fragmentShader: SURFACE,
  }), 'weather-surface');
  const clouds = mesh(spec.radius * 1.012, new THREE.ShaderMaterial({
    uniforms, vertexShader: VERTEX, fragmentShader: CLOUDS,
    transparent: true, depthWrite: false,
  }), 'suspended-clouds');
  clouds.renderOrder = 1;

  // Integrated optical depth through a thin spherical atmosphere. Zero opacity
  // at its outer boundary avoids the hard outline of an oversized glass shell.
  const atmosphere = mesh(spec.radius * 1.065, new THREE.ShaderMaterial({
    uniforms: { uTint: uniforms.uHaze, uHover: uniforms.uHover, uReveal: uniforms.uReveal },
    vertexShader: VERTEX,
    fragmentShader: /* glsl */`
      uniform vec3 uTint;
      uniform float uHover, uReveal;
      varying vec3 vWorld, vNormalWorld;
      void main() {
        vec3 n = normalize(vNormalWorld);
        vec3 view = normalize(cameraPosition - vWorld);
        float facing = max(0.0, dot(n, view));
        float opticalDepth = smoothstep(0.0, .19, facing) * exp(-facing * 6.5);
        float day = smoothstep(-.45, .9, dot(n, normalize(vec3(-1.0,.65,.65))));
        gl_FragColor = vec4(uTint, opticalDepth * (.23 + day * .48 + uHover * .08) * (1.0 - uReveal * .9));
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
    transparent: true, depthWrite: false,
  }), 'scattering-atmosphere');
  atmosphere.renderOrder = 2;

  if (world === 'commissionmatch') {
    // Broad translucent dust bands, with fine density variations and a gap.
    const rings = new THREE.Mesh(new THREE.RingGeometry(1.03, 1.36, 180, 1), new THREE.ShaderMaterial({
      uniforms: {
        uReveal: uniforms.uReveal,
        uInk: { value: new THREE.Color('#78816a') },
        uDust: { value: new THREE.Color('#d9cd9e') },
      },
      vertexShader: /* glsl */`
        varying vec3 vRing;
        void main() { vRing = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
      `,
      fragmentShader: /* glsl */`
        uniform vec3 uInk, uDust;
        uniform float uReveal;
        varying vec3 vRing;
        void main() {
          float r = length(vRing.xy);
          float grain = .5 + .5 * sin(r * 570.0 + sin(r * 113.0) * 2.0);
          float bands = .5 + .5 * sin(r * 82.0);
          float edge = smoothstep(1.03, 1.07, r) * (1.0 - smoothstep(1.30, 1.36, r));
          float gap = 1.0 - smoothstep(.008, .019, abs(r - 1.215));
          float alpha = edge * (.20 + bands * .23 + grain * .19) * (1.0 - gap * .91);
          // The planet blocks the sun across the rear sector of the rings.
          float shadow = smoothstep(-.7, .08, vRing.x + .25) * smoothstep(.1, .55, vRing.y);
          vec3 tint = mix(uInk, uDust, bands * .6 + grain * .4) * (1.0 - shadow * .65);
          // Engraved: a few crisp parchment-coloured circles.
          float engraved = edge * (1.0 - smoothstep(.25, .5, abs(fract(r * 24.0) - .5) * 2.0)) * (1.0 - gap);
          tint = mix(tint, vec3(.937,.890,.769) * (1.0 - shadow * .4), uReveal);
          gl_FragColor = vec4(tint, mix(alpha, engraved * .95, uReveal));
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }
      `,
      side: THREE.DoubleSide, transparent: true, depthWrite: false,
    }));
    rings.name = 'orbital-dust';
    rings.rotation.set(-1.12, -.15, -.34);
    rings.renderOrder = 3;
    planet.add(rings);
  }

  Object.assign(planet.userData, {
    kind: 'planet', world, bodyRadius: spec.radius, surfaceRadius: spec.radius,
    framingRadius: world === 'commissionmatch' ? 1.36 : spec.radius * 1.12,
    surfaceColor: spec.surface, atmosphereColor: spec.haze,
    animate(time = 0, hover = 0, interaction = {}) {
      const approach = THREE.MathUtils.clamp(Number(interaction?.approach ?? interaction?.progress ?? 0) || 0, 0, 1);
      uniforms.uTime.value = time;
      uniforms.uHover.value = hover + approach * .6;
      uniforms.uReveal.value = THREE.MathUtils.clamp(Number(interaction?.reveal) || 0, 0, 1);
      if (interaction?.pixel) uniforms.uPixel.value = interaction.pixel;
      clouds.rotation.y = time * .012;
      clouds.rotation.z = Math.sin(time * .035) * .018;
    },
  });
  return planet;
}
