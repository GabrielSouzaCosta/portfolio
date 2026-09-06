var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// js/three/planets.js
var planets_exports = {};
__export(planets_exports, {
  createPlanet: () => createPlanet
});
module.exports = __toCommonJS(planets_exports);
function createPlanet(THREE, world) {
  const planet = new THREE.Group();
  planet.name = `planet-${world}`;
  const up = new THREE.Vector3(0, 1, 0);
  const animated = [];
  const material = (color, properties = {}) => new THREE.MeshStandardMaterial({
    color,
    roughness: 0.62,
    metalness: 0.05,
    ...properties
  });
  const metal = (color, properties = {}) => new THREE.MeshStandardMaterial({
    color,
    roughness: 0.28,
    metalness: 0.86,
    ...properties
  });
  const sphere = (radius, paint, resolution = 56) => new THREE.Mesh(new THREE.SphereGeometry(radius, resolution, Math.round(resolution * 0.65)), paint);
  const point = (latitude, longitude, radius = 1) => new THREE.Vector3(
    Math.sin(longitude) * Math.cos(latitude) * radius,
    Math.sin(latitude) * radius,
    Math.cos(longitude) * Math.cos(latitude) * radius
  );
  const curveMesh = (points, thickness, paint, segments = 48) => {
    const curve = new THREE.CatmullRomCurve3(points.map((p) => p.isVector3 ? p : new THREE.Vector3(...p)));
    return new THREE.Mesh(new THREE.TubeGeometry(curve, segments, thickness, 8, false), paint);
  };
  function place(object, latitude, longitude, radius, parent = planet) {
    const normal = point(latitude, longitude);
    object.position.copy(normal).multiplyScalar(radius);
    object.quaternion.setFromUnitVectors(up, normal);
    parent.add(object);
    return object;
  }
  function geometry(positions, indices) {
    const result = new THREE.BufferGeometry();
    result.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    result.setIndex(indices);
    result.computeVertexNormals();
    return result;
  }
  function lacquer([deep, mid, glow], { roughness = 0.34, sheen, mottle = 0.1 } = {}) {
    const paint = new THREE.MeshPhysicalMaterial({
      color: mid,
      roughness,
      metalness: 0.12,
      clearcoat: 0.9,
      clearcoatRoughness: 0.32
    });
    if (sheen) {
      paint.sheen = 0.6;
      paint.sheenColor = new THREE.Color(sheen);
      paint.sheenRoughness = 0.5;
    }
    const lightDirection = new THREE.Vector3(-0.42, 0.72, 0.55).normalize();
    paint.onBeforeCompile = (shader) => {
      shader.uniforms.deep = { value: new THREE.Color(deep) };
      shader.uniforms.glow = { value: new THREE.Color(glow) };
      shader.uniforms.lightDirection = { value: lightDirection };
      shader.uniforms.mottle = { value: mottle };
      shader.vertexShader = shader.vertexShader.replace("#include <common>", "#include <common>\nvarying vec3 vObjectNormal;").replace("#include <beginnormal_vertex>", "#include <beginnormal_vertex>\nvObjectNormal = normal;");
      shader.fragmentShader = shader.fragmentShader.replace("#include <common>", `#include <common>
          varying vec3 vObjectNormal;
          uniform vec3 deep; uniform vec3 glow; uniform vec3 lightDirection; uniform float mottle;
          float orbHash(vec3 p) { return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453); }
          float orbNoise(vec3 p) {
            vec3 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
            float a = orbHash(i), b = orbHash(i + vec3(1.0,0,0)), c = orbHash(i + vec3(0,1,0)), d = orbHash(i + vec3(1.0,1.0));
            float e = orbHash(i + vec3(0,0,1)), g = orbHash(i + vec3(1,0,1)), h = orbHash(i + vec3(0,1,1)), k = orbHash(i + vec3(1.0,1.0,1.0));
            return mix(mix(mix(a,b,f.x), mix(c,d,f.x), f.y), mix(mix(e,g,f.x), mix(h,k,f.x), f.y), f.z);
          }`).replace("#include <color_fragment>", `#include <color_fragment>
          {
            vec3 n = normalize(vObjectNormal);
            float height = n.y * 0.5 + 0.5;
            float light = clamp(dot(n, lightDirection) * 0.5 + 0.5, 0.0, 1.0);
            float tone = clamp(height * 0.62 + light * 0.38, 0.0, 1.0);
            vec3 graded = mix(deep, glow, smoothstep(0.04, 0.96, tone));
            float grain = (orbNoise(n * 5.1) * 0.6 + orbNoise(n * 11.3) * 0.4 - 0.5) * mottle;
            diffuseColor.rgb = graded * diffuseColor.rgb * (1.0 + grain);
          }`);
    };
    return paint;
  }
  function glass(radius, tint, opacity = 0.12) {
    const paint = new THREE.MeshPhysicalMaterial({
      color: tint,
      roughness: 0.13,
      metalness: 0,
      transmission: 0.88,
      thickness: 0.35,
      transparent: true,
      opacity: 0.3,
      depthWrite: false,
      clearcoat: 1,
      clearcoatRoughness: 0.18
    });
    const shell = sphere(radius, paint, 72);
    shell.name = "glass-shell";
    shell.renderOrder = 3;
    planet.add(shell);
    animated.push((time, hover, approach) => {
      paint.opacity = opacity + Math.sin(time * 0.5) * 0.012 + hover * 0.07 + approach * 0.05;
    });
    return shell;
  }
  function filigree(points, radius, thickness, paint, { dew, relief = 4e-3, segments = 64 } = {}) {
    const path = new THREE.CatmullRomCurve3(points.map(([lat, lon]) => point(lat, lon)));
    const tube = new THREE.Mesh(new THREE.TubeGeometry(path, segments, thickness, 7, false), paint);
    const positions = tube.geometry.attributes.position;
    for (let i = 0; i < positions.count; i += 1) {
      const v = new THREE.Vector3(positions.getX(i), positions.getY(i), positions.getZ(i));
      v.normalize().multiplyScalar(radius + relief + (v.length() - radius - relief < 0 ? 0 : 0));
      positions.setXYZ(i, v.x, v.y, v.z);
    }
    tube.geometry.computeVertexNormals();
    planet.add(tube);
    if (!dew) return tube;
    const drops = [];
    for (let i = 0; i < dew.count; i += 1) {
      const drop = sphere(dew.radius, dew.paint, 20);
      planet.add(drop);
      drops.push({ drop, offset: i / dew.count });
    }
    animated.push((time) => {
      for (const { drop, offset } of drops) {
        const u = (time * (dew.speed ?? 0.028) + offset) % 1;
        const sat = Math.min(u / 0.1, (1 - u) / 0.1, 1);
        drop.visible = sat > 0.02;
        if (!drop.visible) {
          drop.position.set(0, 0, 0);
          continue;
        }
        drop.position.copy(path.getPoint(u).normalize().multiplyScalar(radius + relief + dew.radius * 0.62));
        drop.scale.setScalar((0.8 + Math.sin(u * Math.PI) * 0.45) * Math.min(sat * 6, 1));
      }
    });
    return tube;
  }
  function hoop(inner, outer, depth, paint, segments = 160) {
    const outline = [
      [inner + 1e-3, -depth],
      [inner + (outer - inner) * 0.38, -depth * 1.02],
      [outer, -depth * 0.32],
      [outer, depth * 0.32],
      [inner + (outer - inner) * 0.38, depth * 1.02],
      [inner + 1e-3, depth],
      [inner - 1e-3, depth * 0.4],
      [inner - 1e-3, -depth * 0.4],
      [inner + 1e-3, -depth]
    ].map(([r, y]) => new THREE.Vector2(r, y));
    return new THREE.Mesh(new THREE.LatheGeometry(outline, segments), paint);
  }
  function glints(radius, tint, count = 70, size = 5) {
    const positions = new Float32Array(count * 3);
    const phases = new Float32Array(count);
    for (let i = 0; i < count; i += 1) {
      const p = point(
        Math.asin(i * 2.399963 % 2 - 1),
        i * 2.399963 * Math.PI,
        radius
      );
      positions.set([p.x, p.y, p.z], i * 3);
      phases[i] = i * 0.618034 % 1;
    }
    const paint = new THREE.ShaderMaterial({
      uniforms: {
        tint: { value: new THREE.Color(tint) },
        rotation: { value: 0 },
        time: { value: 0 },
        sizeBase: { value: size }
      },
      vertexShader: `uniform float rotation; uniform float time; uniform float sizeBase;
        attribute float phase; varying float vPhase;
        void main() {
          vPhase = phase;
          float c = cos(rotation), s = sin(rotation);
          vec3 p = vec3(position.x * c + position.z * s, position.y, -position.x * s + position.z * c);
          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          gl_Position = projectionMatrix * mv;
          gl_PointSize = sizeBase * (0.75 + 0.25 * sin(time * 1.7 + phase * 43.0));
        }`,
      fragmentShader: `uniform vec3 tint; uniform float time; varying float vPhase;
        void main() {
          float d = length(gl_PointCoord - 0.5);
          float twinkle = 0.35 + 0.65 * pow(0.5 + 0.5 * sin(time * 2.1 + vPhase * 37.0), 2.0);
          float a = pow(max(0.0, 1.0 - d * 2.0), 2.6) * twinkle;
          gl_FragColor = vec4(tint, a);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }`,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
    const starGeometry = new THREE.BufferGeometry();
    starGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    starGeometry.setAttribute("normal", new THREE.BufferAttribute(positions.slice(), 3));
    starGeometry.setAttribute("phase", new THREE.BufferAttribute(phases, 1));
    const stars = new THREE.Points(starGeometry, paint);
    stars.renderOrder = 4;
    planet.add(stars);
    animated.push((time) => {
      paint.uniforms.time.value = time;
      paint.uniforms.rotation.value = planet.parent ? planet.parent.rotation.y : 0;
    });
    return stars;
  }
  function lathe(profile, paint, smooth = false, segments = 96) {
    const points = profile.map(([radius, height]) => new THREE.Vector2(radius, height));
    const outline = smooth ? new THREE.SplineCurve(points).getPoints(64) : points;
    outline.forEach((p) => {
      p.x = Math.max(0, p.x);
    });
    return new THREE.Mesh(new THREE.LatheGeometry(outline, segments), paint);
  }
  function atmosphere(radius, color, strength = 0.13) {
    const paint = new THREE.ShaderMaterial({
      uniforms: { tint: { value: new THREE.Color(color) }, strength: { value: strength } },
      vertexShader: `varying vec3 worldNormal; varying vec3 worldPosition;
        void main() { vec4 p = modelMatrix * vec4(position, 1.0); worldPosition = p.xyz;
          worldNormal = normalize(mat3(modelMatrix) * normal); gl_Position = projectionMatrix * viewMatrix * p; }`,
      fragmentShader: `uniform vec3 tint; uniform float strength; varying vec3 worldNormal; varying vec3 worldPosition;
        void main() { float edge = 1.0 - max(0.0, dot(normalize(worldNormal), normalize(cameraPosition - worldPosition)));
          gl_FragColor = vec4(tint, pow(edge, 4.2) * strength);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }`,
      transparent: true,
      depthWrite: false,
      side: THREE.FrontSide
    });
    const shell = sphere(radius, paint, 72);
    shell.name = "thin-atmosphere";
    shell.renderOrder = 2;
    planet.add(shell);
    animated.push((time, hover, approach) => {
      paint.uniforms.strength.value = strength + hover * 0.04 + approach * 0.07;
    });
  }
  function makeCindra() {
    const radius = 0.875;
    const body = lacquer(["#241723", "#5c2c29", "#d07a44"], { roughness: 0.37, sheen: "#ff9a55", mottle: 0.12 });
    planet.add(sphere(radius, body, 96));
    const obsidian = material("#1c131b", { roughness: 0.3, metalness: 0.2 });
    const mesa = material("#452730", { roughness: 0.5 });
    const ember = material("#ff8a3d", { emissive: "#e4620f", emissiveIntensity: 0.85, roughness: 0.4 });
    const mesas = [];
    [
      [0.34, -0.72, 0.155, 0.09, 1.35],
      [-0.3, 0.62, 0.12, 0.075, 0.7],
      [0.05, 1.95, 0.1, 0.06, 2.2],
      [-0.55, -1.9, 0.085, 0.055, 1.6],
      [0.68, 2.6, 0.07, 0.045, 0.4]
    ].forEach(([lat, lon, w, h, turn], index) => {
      const normal = point(lat, lon);
      const east = new THREE.Vector3(Math.cos(lon), 0, -Math.sin(lon));
      const north = new THREE.Vector3().crossVectors(normal, east).normalize();
      const rock = new THREE.Mesh(new THREE.SphereGeometry(1, 40, 20), index % 2 ? mesa : obsidian);
      rock.scale.set(w, h, w * 0.66);
      rock.rotation.y = turn;
      place(rock, lat, lon, radius - h * 0.18);
      mesas.push(rock);
      animated.push((time, hover) => {
        const breathe = 1 + Math.sin(time * 0.55 + index * 1.7) * 0.012 + hover * 0.02;
        rock.scale.y = h * breathe;
      });
      void normal;
      void east;
      void north;
    });
    const veinPaint = material("#241016", { roughness: 0.55 });
    const veinPaths = [
      [[0.52, 0.25], [0.3, -0.05], [0.02, -0.28], [-0.22, -0.42]],
      [[-0.4, 1.1], [-0.15, 1.5], [0.16, 1.8]],
      [[0.66, -1.7], [0.42, -1.95], [0.2, -2.3]],
      [[-0.08, -0.85], [-0.3, -1.2], [-0.46, -1.6]],
      [[0.1, 2.9], [0.3, 3.3], [0.55, 3.7]]
    ];
    const beads = [];
    veinPaths.forEach((path, veinIndex) => {
      const crease = (r, t, paint) => {
        const mesh = curveMesh(path.map(([lat, lon]) => point(lat, lon, r)), t, paint, 64);
        planet.add(mesh);
        return mesh;
      };
      crease(radius - 35e-4, 0.014, veinPaint);
      const emberSeam = crease(radius - 45e-4, 38e-4, ember);
      veinPaths[veinIndex].forEach((_, pointIndex) => {
        if ((pointIndex + veinIndex) % 2) return;
        const [lat, lon] = path[pointIndex];
        const bead = sphere(0.012, ember, 16);
        bead.position.copy(point(lat, lon, radius + 2e-3));
        planet.add(bead);
        beads.push({ bead, phase: veinIndex * 1.1 + pointIndex * 0.7 });
      });
      void emberSeam;
    });
    animated.push((time) => {
      ember.emissiveIntensity = 0.8 + Math.sin(time * 1.3) * 0.12;
      for (const { bead, phase } of beads) {
        const swell = 1 + Math.max(0, Math.sin(time * 0.9 + phase)) * 0.3;
        bead.scale.setScalar(swell);
      }
    });
    glass(radius + 0.03, "#ff8a5e", 0.1);
    const hearth = new THREE.Group();
    hearth.add(lathe([[0, -0.02], [0.2, -0.015], [0.235, 0.01], [0.205, 0.052], [0.165, 0.07], [0.13, 0.052], [0.115, 0.01]], obsidian, true));
    const bed = sphere(0.088, ember, 40);
    bed.scale.set(1, 0.16, 0.85);
    bed.position.y = 0.012;
    hearth.add(bed);
    function flame(height, paint, bend) {
      const mesh = lathe([[0, 0], [0.042, 6e-3], [0.055, 0.05], [0.036, 0.116], [0.018, 0.166], [0, 0.218]], paint, true, 64);
      const vertices = mesh.geometry.attributes.position;
      for (let i = 0; i < vertices.count; i += 1) {
        const rise = vertices.getY(i) / 0.218;
        vertices.setXYZ(i, vertices.getX(i) * height / 0.218 + rise * rise * bend, rise * height, vertices.getZ(i) * height / 0.218 * 0.62);
      }
      mesh.geometry.computeVertexNormals();
      return mesh;
    }
    const fire = new THREE.Group();
    const outerFlame = flame(0.21, material("#e8763a", { emissive: "#c14d0e", emissiveIntensity: 0.5, roughness: 0.5 }), 0.045);
    const core = flame(0.145, material("#ffd9a0", { emissive: "#ffa630", emissiveIntensity: 1.1, roughness: 0.45 }), -0.02);
    core.position.set(-0.02, 3e-3, 0.03);
    fire.add(outerFlame, core);
    fire.position.y = 0.026;
    hearth.add(fire);
    const glowLight = new THREE.PointLight("#ff8338", 0.26, 0.9, 2);
    glowLight.position.set(0, 0.14, 0.06);
    hearth.add(glowLight);
    place(hearth, 0.48, 0.36, radius - 0.01);
    animated.push((time, hover) => {
      fire.scale.y = 1 + Math.sin(time * 2) * 0.032 + hover * 0.1;
      fire.rotation.z = Math.sin(time * 1.6) * 0.025;
      glowLight.intensity = 0.24 + Math.sin(time * 2.2) * 0.04;
    });
    const moon = new THREE.Group();
    moon.add(sphere(0.1, material("#3a2b33", { roughness: 0.3, metalness: 0.15 }), 48));
    const scar = new THREE.Mesh(new THREE.TorusGeometry(0.03, 6e-3, 8, 40), ember);
    scar.position.z = 0.093;
    moon.add(scar);
    planet.add(moon);
    animated.push((time, hover) => {
      const phase = time * 0.1 + 3.75;
      moon.position.set(Math.cos(phase) * 1.22, 0.26 + Math.sin(phase) * 0.28, Math.sin(phase) * 0.84);
      moon.rotation.y = time * 0.15 + hover * 0.12;
    });
    atmosphere(radius + 0.042, "#e8795a", 0.13);
    planet.userData.surfaceColor = "#8a4537";
    planet.userData.atmosphereColor = "#cf7a55";
  }
  function makeCommissionMatch() {
    const radius = 0.83;
    const body = lacquer(["#141c10", "#2c3820", "#8c9360"], { roughness: 0.39, sheen: "#d8cf9c", mottle: 0.09 });
    planet.add(sphere(radius, body, 96));
    const brass = metal("#c9a25e", { roughness: 0.3 });
    const ink = material("#0e150b", { roughness: 0.5 });
    const seams = [
      [[-0.62, -1.64], [-0.15, -1.03], [0.2, -0.35], [0.13, 0.34], [0.43, 0.94], [0.89, 1.36]],
      [[-0.78, -0.71], [-0.55, 0.27], [-0.11, 1.29], [0.14, 2.1], [0.59, 2.95]],
      [[0.61, -2.32], [0.51, -1.62], [0.65, -0.77], [1.08, -0.22]],
      [[-0.64, 2.36], [-0.18, 2.79], [0.09, 3.55], [0.41, 4.16]],
      [[0.08, 1.3], [0.34, 1.64], [0.6, 2.08]]
    ];
    seams.forEach((path, index) => {
      filigree(path, radius - 4e-3, 0.011, ink, { segments: 72 });
      if (index % 2 === 0) {
        filigree(path.map(([lat, lon]) => [lat + 6e-3, lon + 4e-3]), radius - 3e-3, 35e-4, brass, { segments: 72 });
      } else if (index === 1) {
        filigree(path, radius, 45e-4, brass, {
          segments: 72,
          dew: {
            count: 2,
            radius: 0.0114,
            paint: material("#efe6c8", { roughness: 0.18, emissive: "#8a7c48", emissiveIntensity: 0.18 })
          }
        });
      }
    });
    glints(radius + 6e-3, "#f5eccb", 78, 4.6);
    glass(radius + 0.026, "#d9ce9f", 0.09);
    const rings = new THREE.Group();
    const ringSpecs = [
      [1.1, 1.16, 42e-4, brass],
      [1.24, 1.37, 3e-3, material("#e8e0c2", { roughness: 0.22, metalness: 0.55 })],
      [1.34, 1.375, 35e-4, brass]
    ];
    for (const [inner, outer, depth, paint] of ringSpecs) rings.add(hoop(inner, outer, depth, paint));
    rings.rotation.set(0.25, 0, -0.4);
    planet.add(rings);
    const moon = new THREE.Group();
    moon.add(sphere(0.104, material("#b06a64", { roughness: 0.3 }), 56));
    const crescent = new THREE.Mesh(new THREE.TorusGeometry(0.034, 6e-3, 8, 48, Math.PI * 1.4), brass);
    crescent.position.set(-5e-3, 7e-3, 0.1);
    crescent.rotation.z = -0.6;
    moon.add(crescent);
    planet.add(moon);
    animated.push((time, hover) => {
      const phase = time * 0.11 + 0.77;
      moon.position.set(Math.cos(phase) * 1.14, 0.35 + Math.sin(phase) * 0.3, Math.sin(phase) * 0.98);
      moon.rotation.set(0.1, time * 0.18, 0.1);
      rings.rotation.x = 0.25 + Math.sin(time * 0.2) * 0.02 + hover * 0.04;
    });
    atmosphere(radius + 0.036, "#9aa96f", 0.11);
    planet.userData.surfaceColor = "#39422b";
    planet.userData.atmosphereColor = "#a8ab7d";
  }
  function makeMangue() {
    const radius = 0.865;
    const body = lacquer(["#03282c", "#0d5257", "#4da58e"], { roughness: 0.27, sheen: "#8fd4bd", mottle: 0.14 });
    planet.add(sphere(radius, body, 96));
    const stone = material("#3c4a3a", { roughness: 0.58 });
    const moss = material("#57724a", { roughness: 0.55 });
    const brightMoss = material("#7d9a5f", { roughness: 0.5 });
    const bark = material("#8a6f52", { roughness: 0.6 });
    const waterLine = material("#bfdcd2", { roughness: 0.2, metalness: 0.15 });
    const islets = [
      [0.32, -0.55, 0.1, 0.045],
      [-0.2, 0.55, 0.085, 0.04],
      [0.48, 2.3, 0.09, 0.042],
      [-0.58, -2.2, 0.075, 0.034],
      [-0.6, -0.2, 0.05, 0.026],
      [0.06, 1.3, 0.055, 0.028]
    ];
    islets.forEach(([lat, lon, w, h], index) => {
      const rock = new THREE.Mesh(new THREE.SphereGeometry(1, 36, 18), stone);
      rock.scale.set(w, h, w * 0.72);
      rock.rotation.y = index * 1.3;
      place(rock, lat, lon, radius - h * 0.5);
      const cap = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 16), index % 2 ? moss : brightMoss);
      cap.scale.set(w * 0.82, h * 0.82, w * 0.6);
      cap.rotation.y = index * 0.7;
      place(cap, lat + 4e-3, lon, radius - h * 0.12);
    });
    const tides = [
      [[0.46, 0.02], [0.21, 0.11], [-0.04, 0.08], [-0.23, -0.03]],
      [[0.53, 0.13], [0.3, 0.23], [0.1, 0.23]],
      [[-0.53, -0.77], [-0.72, -0.9], [-0.79, -1.16]],
      [[0.04, 1.05], [0.25, 1.19], [0.49, 1.41]],
      [[-0.25, 0.04], [-0.42, 0.14], [-0.61, 0.23], [-0.78, 0.18]],
      [[-0.42, 0.14], [-0.45, 0.29], [-0.57, 0.43]],
      [[0.6, -0.9], [0.75, -1.25], [0.82, -1.6]],
      [[-0.7, 0.8], [-0.85, 1.1], [-0.92, 1.45]]
    ];
    tides.forEach((path, index) => {
      filigree(path, radius + index % 3 * 15e-4, index === 0 ? 45e-4 : 28e-4, waterLine, { relief: 2e-3, segments: 56 });
    });
    glints(radius + 5e-3, "#dcf4ea", 90, 4.2);
    glass(radius + 0.024, "#59a491", 0.09);
    function canopy(paint, size, phase) {
      const shape = new THREE.SphereGeometry(1, 40, 24);
      const vertices = shape.attributes.position;
      for (let i = 0; i < vertices.count; i += 1) {
        const x = vertices.getX(i), y = vertices.getY(i), z = vertices.getZ(i);
        const angle = Math.atan2(z, x);
        const lobe = 1 + Math.cos(angle * 3 + phase) * 0.045 * (1 - y * y);
        vertices.setXYZ(i, x * size[0] * lobe, y * size[1], z * size[2] * lobe);
      }
      shape.computeVertexNormals();
      return new THREE.Mesh(shape, paint);
    }
    const foliage = material("#38603f", { roughness: 0.5 });
    const crown = material("#557a4a", { roughness: 0.48 });
    const litLeaf = material("#7fa06a", { roughness: 0.45 });
    function mangrove(size, phase) {
      const tree = new THREE.Group();
      tree.add(curveMesh([[0, 0.03, 0], [0.012, 0.16, 0], [-0.02, 0.3, 6e-3]], 0.014, bark, 32));
      tree.add(curveMesh([[0.01, 0.15, 0], [-0.07, 0.07, 0.04], [-0.125, -0.02, 0.068]], 0.01, bark, 28));
      tree.add(curveMesh([[0.01, 0.14, 0], [0.085, 0.06, 0.02], [0.12, -0.024, 0.045]], 9e-3, bark, 28));
      tree.add(curveMesh([[0.01, 0.15, -2e-3], [0.04, 0.05, -0.07], [0.025, -0.022, -0.125]], 8e-3, bark, 28));
      const leaves = new THREE.Group();
      const left = canopy(foliage, [0.15, 0.075, 0.11], phase);
      left.position.set(-0.09, 0.3, 0.03);
      const right = canopy(crown, [0.125, 0.068, 0.1], phase + 1);
      right.position.set(0.08, 0.318, -0.028);
      const top = canopy(litLeaf, [0.115, 0.055, 0.09], phase + 2);
      top.position.set(-8e-3, 0.375, 0.01);
      leaves.add(left, right, top);
      tree.add(leaves);
      tree.scale.setScalar(size);
      animated.push((time, hover) => {
        leaves.rotation.z = Math.sin(time * 0.55 + phase) * 0.015 + hover * 0.015;
        leaves.rotation.x = Math.sin(time * 0.42 + phase) * 9e-3;
      });
      return tree;
    }
    place(mangrove(1, 0.2), 0.7, -0.75, radius + 0.04);
    place(mangrove(0.72, 2.1), -0.58, -0.21, radius + 0.045);
    place(mangrove(0.8, 3.4), 0.5, 2.26, radius + 0.042);
    const bloom = new THREE.Group();
    bloom.add(sphere(0.018, material("#c9787f", { roughness: 0.35 }), 24));
    bloom.add(sphere(0.011, material("#e3a3a6", { roughness: 0.3 }), 16));
    bloom.children[1].position.set(0.014, 0.012, 6e-3);
    place(bloom, -0.36, 0.43, radius + 0.05);
    atmosphere(radius + 0.034, "#459c8c", 0.15);
    planet.userData.surfaceColor = "#0e5a58";
    planet.userData.atmosphereColor = "#58a58d";
  }
  if (world === "commissionmatch") makeCommissionMatch();
  else if (world === "mangue") makeMangue();
  else makeCindra();
  planet.traverse((object) => {
    if (object.isMesh && !object.material.isShaderMaterial) {
      object.castShadow = true;
      object.receiveShadow = true;
    }
  });
  planet.userData.animate = (time = 0, hover = 0, interaction = {}) => {
    const approach = THREE.MathUtils.clamp(Number(interaction?.approach ?? interaction?.progress ?? 0) || 0, 0, 1);
    for (const animate of animated) animate(time, hover, approach);
  };
  planet.userData.animate(0, 0);
  planet.userData.kind = "planet";
  planet.userData.world = world;
  planet.userData.bodyRadius = world === "commissionmatch" ? 0.83 : world === "mangue" ? 0.865 : 0.875;
  planet.userData.surfaceRadius = planet.userData.bodyRadius;
  return planet;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  createPlanet
});
