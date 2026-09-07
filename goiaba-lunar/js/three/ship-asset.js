import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { clone } from 'three/addons/utils/SkeletonUtils.js';

let asset;

/** Load once before the atlas and its flight copies are constructed. */
export async function loadShipAsset() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const url = new URL('assets/models/morfeu-scout-v04.glb', document.baseURI);
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) throw new Error(`Morfeu model: HTTP ${response.status}`);
    asset = await new GLTFLoader().parseAsync(await response.arrayBuffer(), url.href);
  } finally {
    clearTimeout(timeout);
  }
}

export function createBlenderShip(THREE) {
  if (!asset) return null;
  const model = clone(asset.scene);
  model.name = 'Morfeu · explorador orbital · Blender v04';
  // Flight copies are disposed independently of the atlas and cached source.
  const materials = new Map(), textures = new Map(), geometries = new Map();
  const copyMaterial = source => {
    if (materials.has(source)) return materials.get(source);
    const material = source.clone();
    for (const [key, value] of Object.entries(material)) {
      if (!value?.isTexture) continue;
      if (!textures.has(value)) textures.set(value, value.clone());
      material[key] = textures.get(value);
    }
    materials.set(source, material);
    return material;
  };
  model.traverse(object => {
    if (!object.isMesh) return;
    if (!geometries.has(object.geometry)) geometries.set(object.geometry, object.geometry.clone());
    object.geometry = geometries.get(object.geometry);
    object.material = Array.isArray(object.material) ? object.material.map(copyMaterial) : copyMaterial(object.material);
    object.castShadow = true;
    object.receiveShadow = false;
  });
  const mixer = new THREE.AnimationMixer(model);
  for (const clip of asset.animations) mixer.clipAction(clip).play();
  const head = model.getObjectByName('head');
  const look = new THREE.Quaternion();
  const euler = new THREE.Euler();
  const lids = [];
  model.traverse(object => { if (object.morphTargetDictionary?.Blink !== undefined) lids.push(object); });
  const cores = [...materials.values()].filter(material => material.name === 'Ship | ion cores');
  const clamp = value => Number.isFinite(value) ? THREE.MathUtils.clamp(value, 0, 1) : 0;
  model.userData.assetVersion = 'morfeu-scout-v04';
  model.userData.throttle = 0;
  model.userData.setFlight = value => { model.userData.throttle = clamp(value); };
  model.userData.animate = (time = 0, hover = 0, interaction = {}) => {
    mixer.setTime(Number.isFinite(time) ? time : 0);
    if (head) {
      const x = THREE.MathUtils.clamp(interaction.lookX || 0, -1, 1);
      const y = THREE.MathUtils.clamp(interaction.lookY || 0, -1, 1);
      look.setFromEuler(euler.set(-y * .07, x * .13, -clamp(interaction.pet) * .08));
      head.quaternion.multiply(look);
    }
    for (const lid of lids) {
      const index = lid.morphTargetDictionary.Blink;
      lid.morphTargetInfluences[index] = Math.max(lid.morphTargetInfluences[index], clamp(interaction.pet) * .75);
    }
    const thrust = clamp(interaction.thrust ?? model.userData.throttle);
    cores.forEach(material => { material.emissiveIntensity = .6 + thrust * 2; });
  };
  model.userData.disposeAnimation = () => { mixer.stopAllAction(); mixer.uncacheRoot(model); };
  model.userData.animate(0);
  return model;
}
