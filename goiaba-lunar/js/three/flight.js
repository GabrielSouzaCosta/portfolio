import { createShip } from './characters.js';
import { createPlanet } from './planets.js';

const clamp = value => Math.max(0, Math.min(1, value));
const smooth = value => { const t = clamp(value); return t * t * (3 - 2 * t); };
const interval = (value, start, end) => smooth((value - start) / (end - start));
const mix = (a, b, amount) => a + (b - a) * amount;

/** Timing is separate from the renderer so navigation can reveal at the landing. */
export function sampleFlightTiming(progress, mode = 'enter') {
  const p = clamp(progress);
  if (mode === 'intro') return {
    phase: p < .72 ? 'cruise' : 'approach', wash: 0, readyToReveal: p >= .995,
  };
  if (mode === 'return') return {
    phase: p < .18 ? 'launch' : p < .76 ? 'cruise' : 'approach',
    wash: Math.max(1 - interval(p, 0, .14), interval(p, .86, .92) * (1 - interval(p, .92, 1))),
    readyToReveal: p >= .92,
  };
  return {
    phase: p < .12 ? 'launch' : p < .47 ? 'cruise' : p < .76 ? 'approach' : p < .9 ? 'entry' : 'reveal',
    wash: interval(p, .87, .92) * (1 - interval(p, .92, 1)), readyToReveal: p >= .92,
  };
}

/**
 * A camera journey between the actual atlas positions. Owns only its scene;
 * the page's existing renderer, animation loop and navigation own its lifetime.
 *
 * The long lens starts with the same apparent scale as each atlas viewport.
 * During the trip, the camera closes in while the spacecraft adopts its real
 * scale relative to the world. The opaque globe itself occludes the landing.
 */
export class PlanetFlight {
  constructor(THREE, options) {
    this.THREE = THREE;
    this.mode = options.mode || 'enter';
    this.world = options.world || options.planetItem?.kind || 'cindra';
    this.fromWorld = options.fromWorld || 'galaxy';
    this.duration = this.mode === 'intro' ? 2400 : this.mode === 'return' ? 4600 : 5800;
    this.elapsedAtStart = options.elapsed || 0;
    this.progress = 0;
    this.width = Math.max(1, options.width || 1);
    this.height = Math.max(1, options.height || 1);
    this.frameHeight = 10;
    this.cameraDistance = 32;
    this.sourceShip = options.shipItem;
    this.sourcePlanet = options.planetItem;
    this.origin = this.normalizedRect(options.originRect);
    this.destination = this.normalizedRect(options.destinationRect || options.originRect);
    this.scene = new THREE.Scene();
    this.scene.environment = options.environment?.texture || options.environment || null;
    this.scene.environmentIntensity = .22;
    this.camera = new THREE.PerspectiveCamera(
      THREE.MathUtils.radToDeg(2 * Math.atan(this.frameHeight / (2 * this.cameraDistance))),
      this.width / this.height, .005, 160,
    );
    this.camera.position.set(0, 0, this.cameraDistance);
    this.camera.lookAt(0, 0, 0);

    this.shipModel = createShip(THREE);
    this.ship = this.frameModel(this.shipModel, this.sourceShip, true);
    this.scene.add(this.ship);
    this.shipInitialOrientation = this.ship.userData.viewQuaternion.clone();
    this.shipInitialDirection = new THREE.Vector3(0, 0, 1).applyQuaternion(this.shipInitialOrientation);
    this.shipAlignmentInverse = this.shipInitialOrientation.clone().invert();
    this.shipForward = new THREE.Vector3();
    this.pathTangent = new THREE.Vector3();
    this.lookTarget = new THREE.Vector3();
    this.pathPosition = new THREE.Vector3();
    this.previousPosition = new THREE.Vector3();
    this.shipBounds = new THREE.Box3();
    this.targetQuaternion = new THREE.Quaternion();
    this.bankQuaternion = new THREE.Quaternion();
    this.axisZ = new THREE.Vector3(0, 0, 1);
    this.up = new THREE.Vector3(0, 1, 0);
    this.rotationMatrix = new THREE.Matrix4();

    this.atmosphereColor = new THREE.Color({
      cindra: '#efac70', commissionmatch: '#c7c69c', mangue: '#92d9c6',
    }[this.world] || '#d3e6ce');
    if (this.mode !== 'intro') {
      this.planetModel = createPlanet(THREE, this.world);
      this.planet = this.frameModel(this.planetModel, this.sourcePlanet, false);
      this.scene.add(this.planet);
      if (this.planetModel.userData.atmosphereColor) this.atmosphereColor.set(this.planetModel.userData.atmosphereColor);
      this.washColor = this.planetModel.userData.surfaceColor || this.planetModel.userData.atmosphereColor;
      this.surfaceRadius = this.planetModel.userData.surfaceRadius || {
        cindra: .96, commissionmatch: .855, mangue: .935,
      }[this.world] || 1;
      this.addAtmosphere();
    }
    this.addLights();
    this.addExhaust();
    this.addStars();
    this.resize(this.width, this.height);
    this.update(0, 0);
  }

  normalizedRect(rect) {
    const width = Math.max(1, rect?.width || this.width * .15);
    const height = Math.max(1, rect?.height || this.height * .22);
    const left = rect?.left ?? this.width * .5 - width / 2;
    const top = rect?.top ?? this.height * .5 - height / 2;
    return {
      x: (left + width / 2) / this.width,
      y: (top + height / 2) / this.height,
      width: width / this.width, height: height / this.height,
    };
  }

  frameModel(model, item, isShip) {
    const T = this.THREE;
    const outer = new T.Group();
    const view = new T.Group();
    const centered = new T.Group();
    const pose = new T.Group();
    if (item?.model) {
      model.position.copy(item.model.position);
      model.quaternion.copy(item.model.quaternion);
      model.scale.copy(item.model.scale);
    }
    if (item?.pivot) {
      pose.position.copy(item.pivot.position);
      pose.quaternion.copy(item.pivot.quaternion);
      pose.scale.copy(item.pivot.scale);
    }
    model.updateWorldMatrix(true, true);
    if (isShip) {
      const center = item?.eye && item?.camera
        ? item.camera.position.clone().sub(item.eye)
        : new T.Box3().setFromObject(model).getCenter(new T.Vector3());
      centered.position.copy(center).negate();
    }
    if (item?.camera) view.quaternion.copy(item.camera.quaternion).invert();
    else {
      const camera = new T.PerspectiveCamera();
      camera.position.set(...(isShip ? [3.6, 2.5, 7] : [0, 1.1, 7]));
      camera.lookAt(0, 0, 0);
      view.quaternion.copy(camera.quaternion).invert();
    }
    pose.add(model);
    centered.add(pose);
    view.add(centered);
    outer.add(view);
    outer.userData.viewQuaternion = view.quaternion.clone().multiply(pose.quaternion);
    outer.userData.pose = pose;
    outer.userData.poseQuaternion = pose.quaternion.clone();
    outer.userData.view = view;
    return outer;
  }

  addLights() {
    const T = this.THREE;
    const lightRig = new T.Group();
    // Preserve the atlas's camera-relative light direction at the handoff.
    if (this.sourcePlanet?.camera) lightRig.quaternion.copy(this.sourcePlanet.camera.quaternion).invert();
    lightRig.add(new T.HemisphereLight(0xe9f2ff, 0x303947, .65));
    const key = new T.DirectionalLight(0xffe8c4, 2.8);
    key.position.set(-3.5, 5.5, 6);
    lightRig.add(key);
    const rim = new T.DirectionalLight(0x92bac9, 1.4);
    rim.position.set(3, 2, -4);
    lightRig.add(rim);
    const fill = new T.DirectionalLight(0xb8d1c6, .2);
    fill.position.set(3, -1, 4);
    lightRig.add(fill);
    this.scene.add(lightRig);
    this.engineLight = new T.PointLight(0xd0f4d7, 0, 4, 2);
    this.scene.add(this.engineLight);
  }

  addAtmosphere() {
    const T = this.THREE;
    this.atmosphereMaterial = new T.ShaderMaterial({
      uniforms: { color: { value: this.atmosphereColor }, strength: { value: 0 } },
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vEye;
        void main() {
          vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
          vNormal = normalize(normalMatrix * normal);
          vEye = -viewPosition.xyz;
          gl_Position = projectionMatrix * viewPosition;
        }`,
      fragmentShader: `
        uniform vec3 color;
        uniform float strength;
        varying vec3 vNormal;
        varying vec3 vEye;
        void main() {
          float rim = pow(1.0 - max(0.0, dot(normalize(vNormal), normalize(vEye))), 3.4);
          gl_FragColor = vec4(color, rim * strength);
        }`,
      transparent: true, depthWrite: false, blending: T.AdditiveBlending,
    });
    this.atmosphere = new T.Mesh(new T.SphereGeometry(1, 72, 48), this.atmosphereMaterial);
    this.scene.add(this.atmosphere);
    this.contactMaterial = new T.MeshBasicMaterial({
      color: this.atmosphereColor, transparent: true, opacity: 0,
      depthWrite: false, blending: T.AdditiveBlending,
    });
    this.contact = new T.Mesh(new T.TorusGeometry(1, .021, 6, 72), this.contactMaterial);
    this.scene.add(this.contact);
  }

  addExhaust() {
    const T = this.THREE;
    this.particleCount = 72;
    this.particlePositions = new Float32Array(this.particleCount * 3);
    this.particleColors = new Float32Array(this.particleCount * 3);
    this.particleSizes = new Float32Array(this.particleCount);
    const alphas = new Float32Array(this.particleCount);
    for (let i = 0; i < this.particleCount; i += 1) {
      const amount = i / this.particleCount;
      const color = new T.Color('#eaf8db').lerp(new T.Color('#88bba6'), amount);
      color.toArray(this.particleColors, i * 3);
      this.particleSizes[i] = 2.2 + (1 - amount) * 2.5;
      alphas[i] = (1 - amount) ** 1.4 * .68;
    }
    const geometry = new T.BufferGeometry();
    geometry.setAttribute('position', new T.BufferAttribute(this.particlePositions, 3).setUsage(T.DynamicDrawUsage));
    geometry.setAttribute('color', new T.BufferAttribute(this.particleColors, 3));
    geometry.setAttribute('size', new T.BufferAttribute(this.particleSizes, 1));
    geometry.setAttribute('alpha', new T.BufferAttribute(alphas, 1));
    this.exhaustMaterial = new T.ShaderMaterial({
      uniforms: { strength: { value: 0 }, pixelRatio: { value: 1 } },
      vertexShader: `
        attribute float size;
        attribute float alpha;
        varying float vAlpha;
        varying vec3 vColor;
        uniform float pixelRatio;
        void main() {
          vColor = color;
          vAlpha = alpha;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = size * pixelRatio;
        }`,
      fragmentShader: `
        uniform float strength;
        varying float vAlpha;
        varying vec3 vColor;
        void main() {
          float distance = length(gl_PointCoord - 0.5) * 2.0;
          float glow = 1.0 - smoothstep(0.08, 1.0, distance);
          gl_FragColor = vec4(vColor, glow * vAlpha * strength);
        }`,
      transparent: true, vertexColors: true, depthWrite: false, blending: T.AdditiveBlending,
    });
    this.exhaust = new T.Points(geometry, this.exhaustMaterial);
    this.exhaust.frustumCulled = false;
    this.scene.add(this.exhaust);
  }

  addStars() {
    const T = this.THREE;
    const positions = new Float32Array(90 * 3);
    // Deterministic sparse parallax; the page's illustrated sky remains visible.
    for (let i = 0; i < 90; i += 1) {
      const a = ((i * .61803398875) % 1);
      const b = ((i * .41421356237 + .17) % 1);
      positions[i * 3] = (a - .5) * 40;
      positions[i * 3 + 1] = (b - .5) * 27;
      positions[i * 3 + 2] = -5 - ((i * .73205080757) % 1) * 23;
    }
    const geometry = new T.BufferGeometry();
    geometry.setAttribute('position', new T.BufferAttribute(positions, 3));
    this.starMaterial = new T.PointsMaterial({ color: 0xdddcc1, size: .026, transparent: true, opacity: 0, depthWrite: false });
    this.stars = new T.Points(geometry, this.starMaterial);
    this.scene.add(this.stars);
  }

  resize(width, height) {
    const T = this.THREE;
    this.width = Math.max(1, width);
    this.height = Math.max(1, height);
    const aspect = this.width / this.height;
    this.camera.aspect = aspect;
    this.camera.updateProjectionMatrix();
    const frameWidth = this.frameHeight * aspect;
    const pointFromRect = rect => new T.Vector3((rect.x - .5) * frameWidth, (.5 - rect.y) * this.frameHeight, 0);
    this.start = pointFromRect(this.origin);
    this.destinationPoint = pointFromRect(this.destination);
    this.shipScale = this.origin.height * this.frameHeight
      / Math.max(.1, this.sourceShip?.camera ? this.sourceShip.camera.top - this.sourceShip.camera.bottom : 3.3);
    this.planetScale = this.destination.height * this.frameHeight
      / Math.max(.1, this.sourcePlanet?.camera ? this.sourcePlanet.camera.top - this.sourcePlanet.camera.bottom : 2.7);
    this.radius = Math.max(.12, this.planetScale * (this.surfaceRadius || 1));
    const r = this.radius;
    const lateral = Math.min(1, aspect);
    const direction = this.destinationPoint.clone().sub(this.start);
    direction.z = 0;
    if (direction.lengthSq() < .01) direction.set(.4, .6, 0);
    direction.normalize();
    this.screenDirection = direction;
    const side = new T.Vector3(-direction.y, direction.x, 0);
    // A bounded arc keeps the entire trip inside a narrow mobile viewport.
    const arc = Math.min(frameWidth * .13, 1.05);
    const p1 = this.start.clone().lerp(this.destinationPoint, .22).addScaledVector(side, arc);
    const p2 = this.start.clone().lerp(this.destinationPoint, .65).addScaledVector(side, arc * .66);
    p1.z = r * 1.65;
    p2.z = r * 3.5;
    const p3 = this.destinationPoint.clone().add(new T.Vector3(-r * .38 * lateral, -r * .26, r * 2.75));
    const p4 = this.destinationPoint.clone().add(new T.Vector3(-r * .11 * lateral, -r * .11, r * 1.7));
    const end = this.destinationPoint.clone().add(new T.Vector3(-r * .025 * lateral, -r * .035, r * .86));
    this.path = new T.CatmullRomCurve3([this.start, p1, p2, p3, p4, end], false, 'centripetal');
    const introStart = this.start.clone().setX(-frameWidth * .5 - this.shipScale * 2.7);
    introStart.y += Math.min(.8, this.frameHeight * .08);
    const introMid = introStart.clone().lerp(this.start, .56);
    introMid.y -= .28;
    introMid.z = .6;
    this.introPath = new T.CatmullRomCurve3([introStart, introMid, this.start], false, 'centripetal');
    this.exhaustMaterial.uniforms.pixelRatio.value = Math.min(1.75, globalThis.devicePixelRatio || 1);
    if (this.planet) {
      this.planet.position.copy(this.destinationPoint);
      this.planet.scale.setScalar(this.planetScale);
      this.atmosphere.position.copy(this.destinationPoint);
      this.atmosphere.scale.setScalar(r * 1.035);
      this.contact.position.copy(this.destinationPoint).add(new T.Vector3(-r * .025 * lateral, -r * .035, r * .999));
    }
    this.update(this.progress, this.lastElapsed || 0);
  }

  pathAmount(progress) {
    return interval(progress, .12, .9);
  }

  sampleShip(progress, target) {
    const p = clamp(progress);
    if (this.mode === 'intro') return this.introPath.getPoint(smooth(p), target);
    this.path.getPoint(this.pathAmount(p), target);
    if (p < .12) target.addScaledVector(this.screenDirection, -Math.sin(p / .12 * Math.PI) * this.shipScale * .065);
    return target;
  }

  aimShip(p, returning) {
    const T = this.THREE;
    const path = this.mode === 'intro' ? this.introPath : this.path;
    const amount = this.mode === 'intro' ? smooth(p) : this.pathAmount(p);
    path.getTangent(Math.min(.9999, Math.max(.0001, amount)), this.pathTangent);
    if (returning) this.pathTangent.negate();
    // A local +Z nose follows the curve; a restrained bank makes the turn legible.
    this.rotationMatrix.lookAt(this.pathTangent, new T.Vector3(), this.up);
    this.targetQuaternion.setFromRotationMatrix(this.rotationMatrix);
    const bank = Math.sin(amount * Math.PI * 2) * .22 * (returning ? -1 : 1);
    this.bankQuaternion.setFromAxisAngle(this.axisZ, bank);
    this.targetQuaternion.multiply(this.bankQuaternion).multiply(this.shipAlignmentInverse);
    const orientation = this.mode === 'intro'
      ? 1 - interval(p, .62, 1)
      : returning ? interval(p, .04, .2) : interval(p, .005, .18);
    this.ship.quaternion.identity().slerp(this.targetQuaternion, orientation);
    this.shipForward.copy(this.shipInitialDirection).applyQuaternion(this.ship.quaternion).normalize();
  }

  update(progress, elapsedSeconds = progress * this.duration / 1000) {
    if (this.disposed) return sampleFlightTiming(progress, this.mode);
    this.progress = clamp(progress);
    this.lastElapsed = elapsedSeconds;
    const returning = this.mode === 'return';
    const p = returning ? (1 - this.progress) * .9 : this.progress;
    const r = this.radius;
    this.sampleShip(p, this.ship.position);
    const shrink = this.mode === 'intro' ? 0 : interval(p, .3, .8);
    const scale = mix(this.shipScale, r * .034, shrink);
    this.ship.scale.setScalar(scale);
    this.aimShip(p, returning);

    const throttle = this.mode === 'intro'
      ? .45 * (1 - interval(p, .72, 1))
      : interval(p, 0, .11) * (1 - interval(p, .89, .94));
    const animationTime = this.elapsedAtStart + elapsedSeconds;
    this.shipModel.userData.setFlight?.(throttle);
    this.shipModel.userData.animate?.(animationTime, 0, { thrust: throttle, flight: throttle });
    if (this.planetModel) {
      this.planetModel.userData.animate?.(animationTime, 0, { approach: interval(p, .47, .9), progress: p });
      const pose = this.planet.userData.pose;
      pose.quaternion.copy(this.planet.userData.poseQuaternion);
      // Keep the selected world's current longitude; approach adds only a gentle turn.
      pose.rotateY(elapsedSeconds * .036);
    }

    const chase = this.mode === 'intro' ? 0 : interval(p, .22, .88);
    const follow = this.mode === 'intro' ? 0 : interval(p, .14, .5);
    const landingFocus = interval(p, .53, .83);
    // Follow the spacecraft before tightening the lens. Multiplying the final
    // destination by the dolly amount leaves a growing lateral error offscreen.
    this.lookTarget.copy(this.ship.position).lerp(this.destinationPoint, .54 + landingFocus * .46);
    this.camera.position.x = this.lookTarget.x * follow;
    this.camera.position.y = this.lookTarget.y * follow;
    this.camera.position.z = this.cameraDistance * Math.pow(r * 1.84 / this.cameraDistance, chase);
    if (this.mode !== 'intro') {
      const lens = this.frameHeight / (2 * this.cameraDistance);
      const frameDistance = (point, padding) => point.z + Math.max(
        (Math.abs(point.x - this.camera.position.x) + padding) / (lens * this.camera.aspect),
        (Math.abs(point.y - this.camera.position.y) + padding) / lens,
      ) / .84;
      // Keep both subjects in the shot through transit; release the globe's
      // framing envelope only when its surface deliberately fills the image.
      const envelope = interval(p, .12, .26) * (1 - interval(p, .51, .68));
      const planetFit = frameDistance(this.destinationPoint, r);
      this.camera.position.z += Math.max(0, planetFit - this.camera.position.z) * envelope;
      // Wings and engine plumes can cross the edge while the center remains
      // visible. Frame their actual transformed bounds independently of the
      // planet, including the last bank before the globe occludes the ship.
      this.ship.updateWorldMatrix(true, true);
      this.shipBounds.setFromObject(this.ship);
      let shipFit = 0;
      const { min, max } = this.shipBounds;
      for (const x of [min.x, max.x]) for (const y of [min.y, max.y]) for (const z of [min.z, max.z]) {
        shipFit = Math.max(shipFit, z + Math.max(
          Math.abs(x - this.camera.position.x) / (lens * this.camera.aspect),
          Math.abs(y - this.camera.position.y) / lens,
        ) / .93);
      }
      const shipEnvelope = interval(p, .08, .18) * (1 - interval(p, .83, .86));
      this.camera.position.z += Math.max(0, shipFit - this.camera.position.z) * shipEnvelope;
    }
    this.lookTarget.set(this.camera.position.x, this.camera.position.y, 0);
    this.camera.lookAt(this.lookTarget);
    this.camera.updateMatrixWorld();
    this.engineLight.position.copy(this.ship.position).addScaledVector(this.shipForward, -scale * 1.3);
    this.engineLight.intensity = throttle * scale * scale * .8;
    this.engineLight.distance = Math.max(.1, scale * 5);
    this.starMaterial.opacity = this.mode === 'intro'
      ? Math.sin(p * Math.PI) * .3
      : interval(p, .12, .4) * (1 - interval(p, .74, .9)) * .42;
    if (this.atmosphereMaterial) {
      this.atmosphereMaterial.uniforms.strength.value = interval(p, .17, .56) * .45;
      const impact = interval(p, .82, .93);
      this.contact.scale.setScalar(r * mix(.035, .3, impact));
      this.contactMaterial.opacity = Math.sin(impact * Math.PI) * .3;
    }
    this.updateExhaust(p, elapsedSeconds, scale, throttle, returning);
    return sampleFlightTiming(this.progress, this.mode);
  }

  updateExhaust(p, time, scale, throttle, returning) {
    for (let i = 0; i < this.particleCount; i += 1) {
      const age = i / this.particleCount;
      const history = this.mode === 'intro' ? .12 : .062;
      const sample = clamp(p + (returning ? 1 : -1) * age * history);
      this.sampleShip(sample, this.previousPosition);
      this.previousPosition.addScaledVector(this.shipForward, -scale * (1.3 + age * .7));
      const width = scale * (.032 + age * .23);
      const angle = i * 2.39996323 + time * .7;
      this.previousPosition.x += Math.sin(angle) * width;
      this.previousPosition.y += Math.cos(angle * 1.31) * width;
      this.previousPosition.z += Math.sin(angle * .71) * width * .5;
      this.previousPosition.toArray(this.particlePositions, i * 3);
    }
    this.exhaust.geometry.attributes.position.needsUpdate = true;
    this.exhaustMaterial.uniforms.strength.value = throttle;
  }

  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    this.shipModel.userData.disposeAnimation?.();
    const geometries = new Set(), materials = new Set(), textures = new Set();
    this.scene.traverse(object => {
      if (object.isSkinnedMesh) object.skeleton.dispose();
      if (object.geometry) geometries.add(object.geometry);
      if (object.material) {
        const ownMaterials = Array.isArray(object.material) ? object.material : [object.material];
        ownMaterials.forEach(material => {
          materials.add(material);
          for (const property of ['map', 'normalMap', 'roughnessMap', 'metalnessMap', 'bumpMap', 'alphaMap', 'emissiveMap']) {
            if (material[property]) textures.add(material[property]);
          }
        });
      }
      object.shadow?.dispose();
    });
    geometries.forEach(geometry => geometry.dispose());
    materials.forEach(material => material.dispose());
    textures.forEach(texture => texture.dispose());
    this.scene.clear();
  }
}
