/** Authored little worlds — polished orbs: lacquered bodies under glass,
 *  engraved seams, limestone inlays and quiet orbital jewelry. */
export function createPlanet(THREE, world) {
  const planet = new THREE.Group();
  planet.name = `planet-${world}`;
  const up = new THREE.Vector3(0, 1, 0);
  const animated = [];
  const material = (color, properties = {}) => new THREE.MeshStandardMaterial({
    color, roughness: 0.62, metalness: 0.05, ...properties,
  });
  const metal = (color, properties = {}) => new THREE.MeshStandardMaterial({
    color, roughness: 0.28, metalness: 0.86, ...properties,
  });
  const sphere = (radius, paint, resolution = 56) =>
    new THREE.Mesh(new THREE.SphereGeometry(radius, resolution, Math.round(resolution * 0.65)), paint);
  const point = (latitude, longitude, radius = 1) => new THREE.Vector3(
    Math.sin(longitude) * Math.cos(latitude) * radius,
    Math.sin(latitude) * radius,
    Math.cos(longitude) * Math.cos(latitude) * radius,
  );
  const curveMesh = (points, thickness, paint, segments = 48) => {
    const curve = new THREE.CatmullRomCurve3(points.map((p) =>
      p.isVector3 ? p : new THREE.Vector3(...p)));
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
    result.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    result.setIndex(indices);
    result.computeVertexNormals();
    return result;
  }

  // The body of each world is a lacquered orb: a physical material with a
  // clearcoat and a shader-baked vertical gradient plus soft mottling, so the
  // sphere reads deep rather than flat-toy. Colors stay in each world's voice.
  function lacquer([deep, mid, glow], { roughness = .34, sheen, mottle = .1 } = {}) {
    const paint = new THREE.MeshPhysicalMaterial({
      color: mid, roughness, metalness: .12, clearcoat: .9, clearcoatRoughness: .32,
    });
    if (sheen) {
      paint.sheen = .6;
      paint.sheenColor = new THREE.Color(sheen);
      paint.sheenRoughness = .5;
    }
    const lightDirection = new THREE.Vector3(-.42, .72, .55).normalize();
    paint.onBeforeCompile = (shader) => {
      shader.uniforms.deep = { value: new THREE.Color(deep) };
      shader.uniforms.glow = { value: new THREE.Color(glow) };
      shader.uniforms.lightDirection = { value: lightDirection };
      shader.uniforms.mottle = { value: mottle };
      shader.vertexShader = shader.vertexShader
        .replace('#include <common>', '#include <common>\nvarying vec3 vObjectNormal;')
        .replace('#include <beginnormal_vertex>', '#include <beginnormal_vertex>\nvObjectNormal = normal;');
      shader.fragmentShader = shader.fragmentShader
        .replace('#include <common>', `#include <common>
          varying vec3 vObjectNormal;
          uniform vec3 deep; uniform vec3 glow; uniform vec3 lightDirection; uniform float mottle;
          float orbHash(vec3 p) { return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453); }
          float orbNoise(vec3 p) {
            vec3 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
            float a = orbHash(i), b = orbHash(i + vec3(1.0,0,0)), c = orbHash(i + vec3(0,1,0)), d = orbHash(i + vec3(1.0,1.0));
            float e = orbHash(i + vec3(0,0,1)), g = orbHash(i + vec3(1,0,1)), h = orbHash(i + vec3(0,1,1)), k = orbHash(i + vec3(1.0,1.0,1.0));
            return mix(mix(mix(a,b,f.x), mix(c,d,f.x), f.y), mix(mix(e,g,f.x), mix(h,k,f.x), f.y), f.z);
          }`)
        .replace('#include <color_fragment>', `#include <color_fragment>
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

  // A transmissive shell: the "modern orb" cue — glass over the lacquer,
  // its fresnel edge breathing on hover.
  function glass(radius, tint, opacity = .12) {
    const paint = new THREE.MeshPhysicalMaterial({
      color: tint, roughness: .13, metalness: 0, transmission: .88, thickness: .35,
      transparent: true, opacity: .3, depthWrite: false, clearcoat: 1, clearcoatRoughness: .18,
    });
    const shell = sphere(radius, paint, 72);
    shell.name = 'glass-shell';
    shell.renderOrder = 3;
    planet.add(shell);
    animated.push((time, hover, approach) => {
      paint.opacity = opacity + Math.sin(time * .5) * .012 + hover * .07 + approach * .05;
    });
    return shell;
  }

  // A fine engraved stroke that hugs the sphere — the replacement for the wide
  // icing ribbons. Optionally carries traveling dew pearls along its length.
  function filigree(points, radius, thickness, paint, { dew, relief = .004, segments = 64 } = {}) {
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
        const u = (time * (dew.speed ?? .028) + offset) % 1;
        const sat = Math.min(u / .1, (1 - u) / .1, 1);
        drop.visible = sat > .02;
        if (!drop.visible) { drop.position.set(0, 0, 0); continue; }
        drop.position.copy(path.getPoint(u).normalize().multiplyScalar(radius + relief + dew.radius * .62));
        drop.scale.setScalar((.8 + Math.sin(u * Math.PI) * .45) * Math.min(sat * 6, 1));
      }
    });
    return tube;
  }

  // A polished metal hoop — the refined replacement for the rail-track rings.
  function hoop(inner, outer, depth, paint, segments = 160) {
    const outline = [
      [inner + .001, -depth], [inner + (outer - inner) * .38, -depth * 1.02],
      [outer, -depth * .32], [outer, depth * .32],
      [inner + (outer - inner) * .38, depth * 1.02], [inner + .001, depth],
      [inner - .001, depth * .4], [inner - .001, -depth * .4], [inner + .001, -depth],
    ].map(([r, y]) => new THREE.Vector2(r, y));
    return new THREE.Mesh(new THREE.LatheGeometry(outline, segments), paint);
  }

  // Sparkle stars scattered on the lacquer: points cross-faded with a rotation
  // uniform so the twinkles rotate with the planet instead of sliding over it.
  function glints(radius, tint, count = 70, size = 5) {
    const positions = new Float32Array(count * 3);
    const phases = new Float32Array(count);
    for (let i = 0; i < count; i += 1) {
      const p = point(
        Math.asin((i * 2.399963 % 2) - 1),
        i * 2.399963 * Math.PI,
        radius,
      );
      positions.set([p.x, p.y, p.z], i * 3);
      phases[i] = (i * .618034) % 1;
    }
    const paint = new THREE.ShaderMaterial({
      uniforms: {
        tint: { value: new THREE.Color(tint) },
        rotation: { value: 0 }, time: { value: 0 }, sizeBase: { value: size },
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
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    });
    const starGeometry = new THREE.BufferGeometry();
    starGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    starGeometry.setAttribute('normal', new THREE.BufferAttribute(positions.slice(), 3));
    starGeometry.setAttribute('phase', new THREE.BufferAttribute(phases, 1));
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
    outline.forEach((p) => { p.x = Math.max(0, p.x); });
    return new THREE.Mesh(new THREE.LatheGeometry(outline, segments), paint);
  }
  function atmosphere(radius, color, strength = .13) {
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
      transparent: true, depthWrite: false, side: THREE.FrontSide,
    });
    const shell = sphere(radius, paint, 72);
    shell.name = 'thin-atmosphere';
    shell.renderOrder = 2;
    planet.add(shell);
    animated.push((time, hover, approach) => { paint.uniforms.strength.value = strength + hover * .04 + approach * .07; });
  }

  function makeCindra() {
    const radius = .875;
    const body = lacquer(['#241723', '#5c2c29', '#d07a44'], { roughness: .37, sheen: '#ff9a55', mottle: .12 });
    planet.add(sphere(radius, body, 96));
    const obsidian = material('#1c131b', { roughness: .3, metalness: .2 });
    const mesa = material('#452730', { roughness: .5 });
    const ember = material('#ff8a3d', { emissive: '#e4620f', emissiveIntensity: .85, roughness: .4 });

    // Low obsidian ridge mesas: quiet relief, not terraced cake layers.
    const mesas = [];
    [
      [.34, -.72, .155, .09, 1.35], [-.3, .62, .12, .075, .7],
      [.05, 1.95, .1, .06, 2.2], [-.55, -1.9, .085, .055, 1.6], [.68, 2.6, .07, .045, .4],
    ].forEach(([lat, lon, w, h, turn], index) => {
      const normal = point(lat, lon);
      const east = new THREE.Vector3(Math.cos(lon), 0, -Math.sin(lon));
      const north = new THREE.Vector3().crossVectors(normal, east).normalize();
      const rock = new THREE.Mesh(new THREE.SphereGeometry(1, 40, 20), index % 2 ? mesa : obsidian);
      rock.scale.set(w, h, w * .66);
      rock.rotation.y = turn;
      place(rock, lat, lon, radius - h * .18);
      mesas.push(rock);
      animated.push((time, hover) => {
        const breathe = 1 + Math.sin(time * .55 + index * 1.7) * .012 + hover * .02;
        rock.scale.y = h * breathe;
      });
      void normal; void east; void north;
    });

    // Molten veins: dark grooves with ember seams that pulse in waves.
    const veinPaint = material('#241016', { roughness: .55 });
    const veinPaths = [
      [[.52, .25], [.3, -.05], [.02, -.28], [-.22, -.42]],
      [[-.4, 1.1], [-.15, 1.5], [.16, 1.8]],
      [[.66, -1.7], [.42, -1.95], [.2, -2.3]],
      [[-.08, -.85], [-.3, -1.2], [-.46, -1.6]],
      [[.1, 2.9], [.3, 3.3], [.55, 3.7]],
    ];
    const beads = [];
    veinPaths.forEach((path, veinIndex) => {
      const crease = (r, t, paint) => {
        const mesh = curveMesh(path.map(([lat, lon]) => point(lat, lon, r)), t, paint, 64);
        planet.add(mesh);
        return mesh;
      };
      crease(radius - .0035, .014, veinPaint);
      const emberSeam = crease(radius - .0045, .0038, ember);
      veinPaths[veinIndex].forEach((_, pointIndex) => {
        if ((pointIndex + veinIndex) % 2) return;
        const [lat, lon] = path[pointIndex];
        const bead = sphere(.012, ember, 16);
        bead.position.copy(point(lat, lon, radius + .002));
        planet.add(bead);
        beads.push({ bead, phase: veinIndex * 1.1 + pointIndex * .7 });
      });
      void emberSeam;
    });
    animated.push((time) => {
      ember.emissiveIntensity = .8 + Math.sin(time * 1.3) * .12;
      for (const { bead, phase } of beads) {
        const swell = 1 + Math.max(0, Math.sin(time * .9 + phase)) * .3;
        bead.scale.setScalar(swell);
      }
    });

    glass(radius + .03, '#ff8a5e', .1);

    // The kept cinder: a refined caldera — smooth basalt ring, quiet burn.
    const hearth = new THREE.Group();
    hearth.add(lathe([[0, -.02], [.2, -.015], [.235, .01], [.205, .052], [.165, .07], [.13, .052], [.115, .01]], obsidian, true));
    const bed = sphere(.088, ember, 40);
    bed.scale.set(1, .16, .85);
    bed.position.y = .012;
    hearth.add(bed);
    function flame(height, paint, bend) {
      const mesh = lathe([[0, 0], [.042, .006], [.055, .05], [.036, .116], [.018, .166], [0, .218]], paint, true, 64);
      const vertices = mesh.geometry.attributes.position;
      for (let i = 0; i < vertices.count; i += 1) {
        const rise = vertices.getY(i) / .218;
        vertices.setXYZ(i, vertices.getX(i) * height / .218 + rise * rise * bend, rise * height, vertices.getZ(i) * height / .218 * .62);
      }
      mesh.geometry.computeVertexNormals();
      return mesh;
    }
    const fire = new THREE.Group();
    const outerFlame = flame(.21, material('#e8763a', { emissive: '#c14d0e', emissiveIntensity: .5, roughness: .5 }), .045);
    const core = flame(.145, material('#ffd9a0', { emissive: '#ffa630', emissiveIntensity: 1.1, roughness: .45 }), -.02);
    core.position.set(-.02, .003, .03);
    fire.add(outerFlame, core);
    fire.position.y = .026;
    hearth.add(fire);
    const glowLight = new THREE.PointLight('#ff8338', .26, .9, 2);
    glowLight.position.set(0, .14, .06);
    hearth.add(glowLight);
    place(hearth, .48, .36, radius - .01);
    animated.push((time, hover) => {
      fire.scale.y = 1 + Math.sin(time * 2) * .032 + hover * .1;
      fire.rotation.z = Math.sin(time * 1.6) * .025;
      glowLight.intensity = .24 + Math.sin(time * 2.2) * .04;
    });

    const moon = new THREE.Group();
    moon.add(sphere(.1, material('#3a2b33', { roughness: .3, metalness: .15 }), 48));
    const scar = new THREE.Mesh(new THREE.TorusGeometry(.03, .006, 8, 40), ember);
    scar.position.z = .093;
    moon.add(scar);
    planet.add(moon);
    animated.push((time, hover) => {
      const phase = time * .1 + 3.75;
      moon.position.set(Math.cos(phase) * 1.22, .26 + Math.sin(phase) * .28, Math.sin(phase) * .84);
      moon.rotation.y = time * .15 + hover * .12;
    });
    atmosphere(radius + .042, '#e8795a', .13);
    planet.userData.surfaceColor = '#8a4537';
    planet.userData.atmosphereColor = '#cf7a55';
  }

  function makeCommissionMatch() {
    const radius = .83;
    const body = lacquer(['#141c10', '#2c3820', '#8c9360'], { roughness: .39, sheen: '#d8cf9c', mottle: .09 });
    planet.add(sphere(radius, body, 96));
    const brass = metal('#c9a25e', { roughness: .3 });
    const ink = material('#0e150b', { roughness: .5 });

    // Engraved brass seams — hairline calligraphy instead of piped ribbons.
    const seams = [
      [[-.62, -1.64], [-.15, -1.03], [.2, -.35], [.13, .34], [.43, .94], [.89, 1.36]],
      [[-.78, -.71], [-.55, .27], [-.11, 1.29], [.14, 2.1], [.59, 2.95]],
      [[.61, -2.32], [.51, -1.62], [.65, -.77], [1.08, -.22]],
      [[-.64, 2.36], [-.18, 2.79], [.09, 3.55], [.41, 4.16]],
      [[.08, 1.3], [.34, 1.64], [.6, 2.08]],
    ];
    seams.forEach((path, index) => {
      filigree(path, radius - .004, .011, ink, { segments: 72 });
      if (index % 2 === 0) {
        filigree(path.map(([lat, lon]) => [lat + .006, lon + .004]), radius - .003, .0035, brass, { segments: 72 });
      } else if (index === 1) {
        filigree(path, radius, .0045, brass, {
          segments: 72,
          dew: {
            count: 2, radius: .0114,
            paint: material('#efe6c8', { roughness: .18, emissive: '#8a7c48', emissiveIntensity: .18 }),
          },
        });
      }
    });

    glints(radius + .006, '#f5eccb', 78, 4.6);
    glass(radius + .026, '#d9ce9f', .09);

    // Three hairline hoops — jewelry, not toy train tracks.
    const rings = new THREE.Group();
    const ringSpecs = [
      [1.1, 1.16, .0042, brass],
      [1.24, 1.37, .003, material('#e8e0c2', { roughness: .22, metalness: .55 })],
      [1.34, 1.375, .0035, brass],
    ];
    for (const [inner, outer, depth, paint] of ringSpecs) rings.add(hoop(inner, outer, depth, paint));
    rings.rotation.set(.25, 0, -.4);
    planet.add(rings);

    const moon = new THREE.Group();
    moon.add(sphere(.104, material('#b06a64', { roughness: .3 }), 56));
    const crescent = new THREE.Mesh(new THREE.TorusGeometry(.034, .006, 8, 48, Math.PI * 1.4), brass);
    crescent.position.set(-.005, .007, .1);
    crescent.rotation.z = -.6;
    moon.add(crescent);
    planet.add(moon);
    animated.push((time, hover) => {
      const phase = time * .11 + .77;
      moon.position.set(Math.cos(phase) * 1.14, .35 + Math.sin(phase) * .3, Math.sin(phase) * .98);
      moon.rotation.set(.1, time * .18, .1);
      rings.rotation.x = .25 + Math.sin(time * .2) * .02 + hover * .04;
    });
    atmosphere(radius + .036, '#9aa96f', .11);
    planet.userData.surfaceColor = '#39422b';
    planet.userData.atmosphereColor = '#a8ab7d';
  }

  function makeMangue() {
    const radius = .865;
    const body = lacquer(['#03282c', '#0d5257', '#4da58e'], { roughness: .27, sheen: '#8fd4bd', mottle: .14 });
    planet.add(sphere(radius, body, 96));
    const stone = material('#3c4a3a', { roughness: .58 });
    const moss = material('#57724a', { roughness: .55 });
    const brightMoss = material('#7d9a5f', { roughness: .5 });
    const bark = material('#8a6f52', { roughness: .6 });
    const waterLine = material('#bfdcd2', { roughness: .2, metalness: .15 });

    // Low stone islets overgrown near the rim — relief kept small and quiet.
    const islets = [
      [.32, -.55, .1, .045], [-.2, .55, .085, .04], [.48, 2.3, .09, .042],
      [-.58, -2.2, .075, .034], [-.6, -.2, .05, .026], [.06, 1.3, .055, .028],
    ];
    islets.forEach(([lat, lon, w, h], index) => {
      const rock = new THREE.Mesh(new THREE.SphereGeometry(1, 36, 18), stone);
      rock.scale.set(w, h, w * .72);
      rock.rotation.y = index * 1.3;
      place(rock, lat, lon, radius - h * .5);
      const cap = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 16), index % 2 ? moss : brightMoss);
      cap.scale.set(w * .82, h * .82, w * .6);
      cap.rotation.y = index * .7;
      place(cap, lat + .004, lon, radius - h * .12);
    });

    // Tide inlays: thin flooded contours instead of thick splash strokes.
    const tides = [
      [[.46, .02], [.21, .11], [-.04, .08], [-.23, -.03]],
      [[.53, .13], [.3, .23], [.1, .23]],
      [[-.53, -.77], [-.72, -.9], [-.79, -1.16]],
      [[.04, 1.05], [.25, 1.19], [.49, 1.41]],
      [[-.25, .04], [-.42, .14], [-.61, .23], [-.78, .18]],
      [[-.42, .14], [-.45, .29], [-.57, .43]],
      [[.6, -.9], [.75, -1.25], [.82, -1.6]],
      [[-.7, .8], [-.85, 1.1], [-.92, 1.45]],
    ];
    tides.forEach((path, index) => {
      filigree(path, radius + (index % 3) * .0015, index === 0 ? .0045 : .0028, waterLine, { relief: .002, segments: 56 });
    });

    glints(radius + .005, '#dcf4ea', 90, 4.2);
    glass(radius + .024, '#59a491', .09);

    // Fewer, sleeker mangroves — one hero cluster and two quiet ones.
    function canopy(paint, size, phase) {
      const shape = new THREE.SphereGeometry(1, 40, 24);
      const vertices = shape.attributes.position;
      for (let i = 0; i < vertices.count; i += 1) {
        const x = vertices.getX(i), y = vertices.getY(i), z = vertices.getZ(i);
        const angle = Math.atan2(z, x);
        const lobe = 1 + Math.cos(angle * 3 + phase) * .045 * (1 - y * y);
        vertices.setXYZ(i, x * size[0] * lobe, y * size[1], z * size[2] * lobe);
      }
      shape.computeVertexNormals();
      return new THREE.Mesh(shape, paint);
    }
    const foliage = material('#38603f', { roughness: .5 });
    const crown = material('#557a4a', { roughness: .48 });
    const litLeaf = material('#7fa06a', { roughness: .45 });
    function mangrove(size, phase) {
      const tree = new THREE.Group();
      tree.add(curveMesh([[0, .03, 0], [.012, .16, 0], [-.02, .3, .006]], .014, bark, 32));
      tree.add(curveMesh([[.01, .15, 0], [-.07, .07, .04], [-.125, -.02, .068]], .01, bark, 28));
      tree.add(curveMesh([[.01, .14, 0], [.085, .06, .02], [.12, -.024, .045]], .009, bark, 28));
      tree.add(curveMesh([[.01, .15, -.002], [.04, .05, -.07], [.025, -.022, -.125]], .008, bark, 28));
      const leaves = new THREE.Group();
      const left = canopy(foliage, [.15, .075, .11], phase);
      left.position.set(-.09, .3, .03);
      const right = canopy(crown, [.125, .068, .1], phase + 1);
      right.position.set(.08, .318, -.028);
      const top = canopy(litLeaf, [.115, .055, .09], phase + 2);
      top.position.set(-.008, .375, .01);
      leaves.add(left, right, top);
      tree.add(leaves);
      tree.scale.setScalar(size);
      animated.push((time, hover) => {
        leaves.rotation.z = Math.sin(time * .55 + phase) * .015 + hover * .015;
        leaves.rotation.x = Math.sin(time * .42 + phase) * .009;
      });
      return tree;
    }
    place(mangrove(1, .2), .7, -.75, radius + .04);
    place(mangrove(.72, 2.1), -.58, -.21, radius + .045);
    place(mangrove(.8, 3.4), .5, 2.26, radius + .042);

    // A single pale bloom, kept from the old world as a quiet accent.
    const bloom = new THREE.Group();
    bloom.add(sphere(.018, material('#c9787f', { roughness: .35 }), 24));
    bloom.add(sphere(.011, material('#e3a3a6', { roughness: .3 }), 16));
    bloom.children[1].position.set(.014, .012, .006);
    place(bloom, -.36, .43, radius + .05);

    atmosphere(radius + .034, '#459c8c', .15);
    planet.userData.surfaceColor = '#0e5a58';
    planet.userData.atmosphereColor = '#58a58d';
  }

  if (world === 'commissionmatch') makeCommissionMatch();
  else if (world === 'mangue') makeMangue();
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
  planet.userData.kind = 'planet';
  planet.userData.world = world;
  planet.userData.bodyRadius = world === 'commissionmatch' ? .83 : world === 'mangue' ? .865 : .875;
  planet.userData.surfaceRadius = planet.userData.bodyRadius;
  return planet;
}
