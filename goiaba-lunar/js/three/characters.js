import { createBlenderShip } from './ship-asset.js';

/* Sculpted locally from geometry. +Y is up; both characters face +Z. */

function workshop(THREE) {
  const material = (color, metalness = 0, roughness = 0.65, extra = {}) =>
    new THREE.MeshStandardMaterial({ color, metalness, roughness, ...extra });
  const add = (parent, geometry, paint, position = [0, 0, 0], scale) => {
    const mesh = new THREE.Mesh(geometry, paint);
    mesh.position.set(...position);
    if (scale) mesh.scale.set(...scale);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  };
  const sphere = new THREE.SphereGeometry(1, 28, 18);
  const orb = (parent, paint, position, scale) => add(parent, sphere, paint, position, scale);
  const tube = (parent, points, radius, paint, segments = 28) => {
    const curve = new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p)));
    return add(parent, new THREE.TubeGeometry(curve, segments, radius, 7, false), paint);
  };
  const limb = (parent, start, end, radius, paint, flatten = 1) => {
    const a = new THREE.Vector3(...start), b = new THREE.Vector3(...end);
    const direction = b.clone().sub(a);
    const mesh = add(parent, new THREE.CapsuleGeometry(radius, Math.max(0.01, direction.length() - radius * 2), 6, 14), paint);
    mesh.position.copy(a.add(b).multiplyScalar(0.5));
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
    mesh.scale.z = flatten;
    return mesh;
  };
  const shape = (parent, points, depth, bevel, paint) => {
    const path = new THREE.Shape();
    path.moveTo(...points[0]);
    points.slice(1).forEach(p => path.lineTo(...p));
    path.closePath();
    const geometry = new THREE.ExtrudeGeometry(path, {
      depth, steps: 1, bevelEnabled: bevel > 0, bevelThickness: bevel,
      bevelSize: bevel, bevelSegments: 3, curveSegments: 12,
    });
    geometry.translate(0, 0, -depth / 2);
    return add(parent, geometry, paint);
  };
  const lathe = (parent, points, paint, position, scale) =>
    add(parent, new THREE.LatheGeometry(points.map(p => new THREE.Vector2(...p)), 36), paint, position, scale);
  return { material, add, orb, tube, limb, shape, lathe };
}

function surface(THREE, columns, rows, sample) {
  const vertices = [], indices = [];
  for (let row = 0; row <= rows; row++) {
    for (let col = 0; col <= columns; col++) {
      vertices.push(...sample(col / columns, row / rows));
      if (row < rows && col < columns) {
        const a = row * (columns + 1) + col, b = a + columns + 1;
        indices.push(a, b, a + 1, b, b + 1, a + 1);
      }
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

const bounded = (value, fallback = 0, min = 0, max = 1) =>
  Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : fallback;

// Bake surfaces that share a material within their animated parent. The outline,
// lighting and per-part motion remain unchanged while many small draw calls vanish.
function batchStaticMeshes(THREE, parent, keep = new Set()) {
  const batches = new Map();
  parent.updateMatrix();
  for (const child of parent.children) {
    if (!child.isMesh || keep.has(child.geometry) || child.material.transparent || Array.isArray(child.material)) continue;
    const key = child.material.uuid;
    if (!batches.has(key)) batches.set(key, []);
    batches.get(key).push(child);
  }
  for (const meshes of batches.values()) {
    if (meshes.length < 2) continue;
    const vertices = [], normals = [];
    for (const mesh of meshes) {
      mesh.updateMatrix();
      const geometry = mesh.geometry.index ? mesh.geometry.toNonIndexed() : mesh.geometry.clone();
      geometry.applyMatrix4(mesh.matrix);
      vertices.push(...geometry.attributes.position.array);
      normals.push(...geometry.attributes.normal.array);
      geometry.dispose();
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
    const combined = new THREE.Mesh(geometry, meshes[0].material);
    combined.name = 'superfície · ' + meshes[0].material.color.getHexString();
    combined.castShadow = true;
    combined.receiveShadow = true;
    meshes.forEach(mesh => parent.remove(mesh));
    // This runs during construction, before GPU upload. Shared primitives retain
    // their attributes; any remaining mesh can still upload those normally.
    new Set(meshes.map(mesh => mesh.geometry)).forEach(source => source.dispose());
    parent.add(combined);
  }
}

/** An elongated, dark-steel medieval miniature, with layered forged plates. */
export function createKnight(THREE) {
  const { material, add, orb, tube, limb, shape, lathe } = workshop(THREE);
  const knight = new THREE.Group();
  knight.name = 'Gabriel · cavaleiro errante';
  const steel = material('#34494c', 0.72, 0.34);
  const lightSteel = material('#778d8b', 0.72, 0.32);
  const edge = material('#c5c7af', 0.68, 0.31);
  const bronze = material('#ad8751', 0.72, 0.35);
  const black = material('#111f24', 0.2, 0.79);
  const leather = material('#4f342d', 0, 0.9);
  const burgundy = material('#6f3541', 0, 0.95);
  const capeFront = material('#294c42', 0, 0.96, { side: THREE.FrontSide, vertexColors: true });
  const capeBack = material('#733e49', 0, 0.96, { side: THREE.BackSide });

  const sleeve = (parent, start, end, top, bottom, paint = steel) => {
    const a = new THREE.Vector3(...start), b = new THREE.Vector3(...end);
    const half = a.distanceTo(b) / 2;
    const mesh = lathe(parent, [[0, -half], [bottom * 0.82, -half], [bottom, -half + 0.015], [top, half - 0.025], [top * 0.86, half], [0, half]],
      paint, a.clone().add(b).multiplyScalar(0.5).toArray(), [1, 1, 0.86]);
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), a.sub(b).normalize());
    return mesh;
  };
  const plate = (parent, outline, paint, position, depth = 0.025, bevel = 0.008) => {
    const mesh = shape(parent, outline, depth, bevel, paint);
    mesh.position.set(...position);
    return mesh;
  };

  // A continuous cut of cloth, sculpted in broad folds and animated at its hem.
  const capeGeometry = surface(THREE, 24, 32, (u, v) => {
    const across = u * 2 - 1;
    const width = 0.315 + 0.32 * Math.sin(v * 1.52);
    return [
      across * width + 0.24 * Math.sin(v * 1.6),
      0.72 - v * 1.96 + 0.15 * v ** 3 * Math.sin(u * Math.PI * 2 + 0.5),
      -0.20 - 0.43 * v + Math.sin(u * Math.PI * 4 + 0.5) * (0.013 + v * 0.115) + Math.sin(v * Math.PI) * 0.06,
    ];
  });
  const capeColors = [];
  for (let row = 0; row <= 32; row++) {
    for (let col = 0; col <= 24; col++) {
      const tint = new THREE.Color(col === 0 || col === 24 || row === 32 ? '#bbb397' : '#ffffff');
      capeColors.push(tint.r, tint.g, tint.b);
    }
  }
  capeGeometry.setAttribute('color', new THREE.Float32BufferAttribute(capeColors, 3));
  const capeRest = capeGeometry.attributes.position.array.slice();
  add(knight, capeGeometry, capeFront);
  add(knight, capeGeometry, capeBack);

  // Slim cuirass, layered fauld and a cloth skirt keep the silhouette continuous.
  lathe(knight, [[0, -0.43], [0.17, -0.40], [0.22, -0.18], [0.28, 0.14], [0.245, 0.33], [0.13, 0.41], [0, 0.41]], black, [0, 0.3, 0], [1, 1, 0.74]);
  lathe(knight, [[0, -0.30], [0.21, -0.29], [0.225, -0.13], [0.29, 0.16], [0.27, 0.27], [0.16, 0.35], [0, 0.35]], steel, [0, 0.33, 0], [1, 1, 0.78]);
  tube(knight, [[-0.21, 0.52, 0.135], [-0.13, 0.64, 0.163], [0, 0.663, 0.174], [0.13, 0.64, 0.163], [0.21, 0.52, 0.135]], 0.011, edge, 24);
  tube(knight, [[0, 0.65, 0.177], [0, 0.44, 0.236], [0, 0.18, 0.216], [0, 0.041, 0.173]], 0.013, lightSteel);
  sleeve(knight, [0, 0.87, 0], [0, 0.67, 0], 0.126, 0.158, black);
  lathe(knight, [[0.14, -0.019], [0.17, -0.018], [0.15, 0.02], [0.126, 0.035]], lightSteel, [0, 0.736, 0], [1, 1, 0.8]);
  tube(knight, [[-0.19, 0.06, 0.095], [0, 0.035, 0.192], [0.19, 0.06, 0.095]], 0.014, bronze, 20);
  for (let i = 0; i < 4; i++) {
    lathe(knight, [[0.216 + i * 0.007, 0.025], [0.24 + i * 0.011, -0.052], [0.226 + i * 0.011, -0.07]], i % 2 ? steel : lightSteel,
      [0, -0.024 - i * 0.062, 0], [1, 1, 0.76]);
  }
  lathe(knight, [[0.23, 0.05], [0.26, -0.04], [0.28, -0.20], [0.25, -0.22]], burgundy, [0, -0.18, -0.008], [1, 1, 0.72]);
  lathe(knight, [[0.217, -0.022], [0.228, -0.02], [0.228, 0.024], [0.217, 0.027]], leather, [0, 0.061, 0], [1, 1, 0.78]);
  plate(knight, [[-0.032, -0.024], [0.032, -0.024], [0.032, 0.024], [-0.032, 0.024]], bronze, [0.035, 0.064, 0.185], 0.014, 0.006);
  // A single small crescent, formed in metal on the breastplate.
  const crescent = add(knight, new THREE.TorusGeometry(0.052, 0.009, 6, 24, Math.PI * 1.48), bronze, [0.117, 0.45, 0.204]);
  crescent.rotation.z = -0.73;

  const legGroups = [];
  const legs = [
    { hip: [-0.135, -0.24, 0], knee: [-0.18, -0.77, 0.045], ankle: [-0.15, -1.27, 0.13] },
    { hip: [0.135, -0.24, 0], knee: [0.24, -0.70, -0.07], ankle: [0.34, -1.14, -0.23] },
  ];
  for (const { hip, knee, ankle } of legs) {
    const leg = new THREE.Group();
    leg.position.set(...hip);
    knight.add(leg);
    legGroups.push(leg);
    const k = knee.map((v, i) => v - hip[i]), a = ankle.map((v, i) => v - hip[i]);
    limb(leg, [0, 0.04, 0], a, 0.081, black);
    sleeve(leg, [0, 0.015, 0], [k[0], k[1] + 0.027, k[2]], 0.125, 0.09);
    sleeve(leg, [k[0], k[1] - 0.045, k[2]], [a[0], a[1] - 0.02, a[2]], 0.104, 0.068);
    const kneeGuard = plate(leg, [[-0.069, 0.055], [-0.091, -0.008], [-0.057, -0.091], [0, -0.123], [0.066, -0.077], [0.09, -0.011], [0.067, 0.055]], lightSteel, [k[0], k[1], k[2] + 0.078], 0.035, 0.012);
    kneeGuard.rotation.y = Math.sign(hip[0]) * 0.10;
    tube(leg, [[k[0], k[1] - 0.13, k[2] + 0.09], [a[0], a[1] + 0.19, a[2] + 0.084], [a[0], a[1] - 0.008, a[2] + 0.055]], 0.008, edge, 14);
    const tasset = plate(leg, [[-0.103, 0.02], [0.102, 0.02], [0.091, -0.20], [0.048, -0.25], [-0.084, -0.214]], steel, [0, 0.014, 0.112], 0.02, 0.011);
    tasset.rotation.x = -0.13;
    const boot = shape(leg, [[-0.095, 0.04], [0.069, 0.025], [0.155, -0.05], [0.289, -0.097], [0.275, -0.135], [-0.093, -0.136]], 0.145, 0.022, steel);
    boot.rotation.y = -Math.PI / 2;
    boot.position.set(...a);
    for (const z of [0.077, 0.13, 0.18]) {
      tube(leg, [[a[0] - 0.072, a[1] - 0.084, a[2] + z], [a[0], a[1] - 0.045 - z * 0.18, a[2] + z + 0.01], [a[0] + 0.072, a[1] - 0.084, a[2] + z]], 0.007, lightSteel, 12);
    }
  }

  const arms = [];
  let swordHand;
  for (const side of [-1, 1]) {
    const arm = new THREE.Group();
    arm.position.set(side * 0.305, 0.65, 0);
    knight.add(arm);
    arms.push(arm);
    const elbow = [side * 0.145, -0.345, 0.024];
    const hand = side < 0 ? [-0.24, -0.68, 0.13] : [0.32, -0.31, 0.20];
    limb(arm, [0, 0, 0], elbow, 0.082, black);
    sleeve(arm, [0, -0.025, 0], elbow, 0.104, 0.077);
    sleeve(arm, elbow, hand, 0.094, 0.065);
    const elbowPlate = plate(arm, [[-0.051, 0.058], [-0.08, -0.035], [0, -0.099], [0.081, -0.028], [0.052, 0.058]], lightSteel, [elbow[0], elbow[1], elbow[2] + 0.066], 0.02, 0.008);
    elbowPlate.rotation.z = side * -0.17;
    const gauntlet = new THREE.Group();
    gauntlet.position.set(...hand);
    arm.add(gauntlet);
    sleeve(gauntlet, [0, 0.063, -0.013], [0, -0.075, 0.024], 0.075, 0.056, lightSteel);
    for (let j = 0; j < 3; j++) {
      tube(gauntlet, [[-0.037, -0.011 - j * 0.017, 0.066], [0, -0.016 - j * 0.017, 0.075], [0.037, -0.011 - j * 0.017, 0.066]], 0.006, steel, 10);
    }
    if (side < 0) swordHand = gauntlet;
    // Three overlapping shoulder lames, each a curved shell rather than a sphere.
    for (let layer = 0; layer < 3; layer++) {
      const shoulder = add(knight, new THREE.SphereGeometry(1, 28, 12, 0, Math.PI * 2, 0, 1.50), layer === 0 ? lightSteel : steel,
        [side * (0.327 + layer * 0.025), 0.649 - layer * 0.043, 0], [0.193 - layer * 0.01, 0.118 - layer * 0.01, 0.205 - layer * 0.014]);
      shoulder.rotation.z = -side * 0.34;
    }
    orb(knight, bronze, [side * 0.255, 0.686, 0.144], [0.019, 0.019, 0.012]);
  }

  const head = new THREE.Group();
  head.position.set(0, 1.087, 0);
  head.rotation.y = -0.13;
  knight.add(head);
  lathe(head, [[0, -0.24], [0.155, -0.235], [0.226, -0.15], [0.246, 0.016], [0.217, 0.164], [0.125, 0.262], [0.036, 0.294], [0, 0.3]], steel, [0, 0, 0], [1, 1, 0.87]);
  // Projected sallet visor: a slender slit over a beaked, faceted lower plate.
  const face = surface(THREE, 32, 8, (u, v) => {
    const angle = (u - 0.5) * 2.46;
    const radius = 0.257 + Math.sin(v * Math.PI) * 0.038 - v ** 3 * 0.055;
    return [Math.sin(angle) * (0.245 - v * 0.022), -0.006 - v * 0.20, Math.cos(angle) * radius + Math.cos(angle) ** 8 * 0.02];
  });
  add(head, face, lightSteel);
  const slit = surface(THREE, 32, 1, (u, v) => {
    const angle = (u - 0.5) * 2.50;
    return [Math.sin(angle) * 0.249, 0.032 - v * 0.035, Math.cos(angle) * 0.264 + 0.005];
  });
  add(head, slit, black);
  tube(head, [[-0.228, 0.05, 0.097], [-0.13, 0.052, 0.232], [0, 0.055, 0.273], [0.13, 0.052, 0.232], [0.228, 0.05, 0.097]], 0.009, edge, 28);
  tube(head, [[0, 0.057, -0.205], [0, 0.242, -0.11], [0, 0.305, 0], [0, 0.22, 0.139], [0, 0.057, 0.217]], 0.009, lightSteel, 24);
  const tailGuard = surface(THREE, 24, 4, (u, v) => {
    const angle = Math.PI * 0.44 + u * Math.PI * 1.12;
    return [Math.sin(angle) * (0.213 + v * 0.045), -0.14 - v * 0.098, Math.cos(angle) * (0.213 + v * 0.12)];
  });
  add(head, tailGuard, steel);
  for (const side of [-1, 1]) {
    orb(head, bronze, [side * 0.233, -0.013, 0.083], [0.015, 0.015, 0.011]);
    for (let i = 0; i < 4; i++) {
      const x = side * (0.055 + i * 0.032);
      orb(head, black, [x, -0.081 - i * 0.005, 0.308 - x * x * 2.25], [0.006, 0.012, 0.004]);
    }
  }
  // A short aventail closes the collar; the head never floats above the torso.
  lathe(head, [[0.176, -0.20], [0.164, -0.27], [0.138, -0.29]], black, [0, 0, 0], [1, 1, 0.87]);

  const sword = new THREE.Group();
  sword.position.set(0, -0.03, 0.035);
  sword.rotation.z = -0.20;
  swordHand.add(sword);
  sleeve(sword, [0, 0.095, 0], [0, -0.13, 0], 0.026, 0.024, leather);
  orb(sword, bronze, [0, 0.118, 0], [0.043, 0.041, 0.026]);
  const blade = plate(sword, [[-0.046, -0.175], [-0.041, -0.92], [0, -1.075], [0.041, -0.92], [0.046, -0.175]], edge, [0, 0, 0], 0.019, 0.004);
  const bladeVertices = blade.geometry.attributes.position;
  for (let i = 0; i < bladeVertices.count; i++) {
    const x = bladeVertices.getX(i), z = bladeVertices.getZ(i);
    bladeVertices.setZ(i, z + Math.sign(z) * Math.max(0, 0.013 - Math.abs(x) * 0.28));
  }
  blade.geometry.computeVertexNormals();
  tube(sword, [[-0.151, -0.194, 0], [-0.102, -0.159, 0], [0, -0.152, 0], [0.102, -0.159, 0], [0.151, -0.194, 0]], 0.015, bronze, 22);

  for (const part of [head, sword, ...legGroups, ...arms]) batchStaticMeshes(THREE, part);
  batchStaticMeshes(THREE, knight, new Set([capeGeometry]));
  knight.rotation.z = -0.055;
  knight.userData.animate = (time = 0, hover = 0, interaction = {}) => {
    time = Number.isFinite(time) ? time : 0;
    const lookX = bounded(interaction.lookX, 0, -1, 1), lookY = bounded(interaction.lookY, 0, -1, 1);
    const wave = bounded(interaction.wave), warmth = bounded(hover);
    head.rotation.y = -0.13 + lookX * 0.27 + Math.sin(time * 0.34) * 0.025;
    head.rotation.x = -lookY * 0.11;
    arms[1].rotation.z = warmth * 0.12 + wave * (0.71 + Math.sin(time * 6) * 0.17);
    arms[1].rotation.x = Math.sin(time * 0.6) * 0.025 - wave * 0.12;
    legGroups[1].rotation.x = Math.sin(time * 0.46 + 1) * 0.035;
    const positions = capeGeometry.attributes.position;
    for (let row = 0; row <= 32; row++) {
      const v = row / 32, weight = v * v;
      for (let col = 0; col <= 24; col++) {
        const index = row * 25 + col, base = index * 3, u = col / 24;
        positions.setXYZ(index,
          capeRest[base] + Math.sin(time * 1.15 - v * 3 + u * 4) * 0.028 * weight,
          capeRest[base + 1] + Math.sin(time * 1.45 - v * 3 + u * 6) * 0.024 * weight,
          capeRest[base + 2] + Math.sin(time * 1.35 - v * 3.6 + u * 5) * (0.065 + warmth * 0.018) * weight);
      }
    }
    positions.needsUpdate = true;
    capeGeometry.computeVertexNormals();
  };
  return knight;
}

function createMorfeu(THREE, kit) {
  const { material, add, orb, shape, tube } = kit;
  const cat = new THREE.Group();
  cat.name = 'Morfeu · piloto';
  const ginger = material('#db8e43', 0, 0.84);
  const orange = material('#eda65e', 0, 0.83);
  const stripe = material('#a96234', 0, 0.91);
  const white = material('#f6ecd5', 0, 0.9);
  const pink = material('#cb887e', 0, 0.87);
  const dark = material('#30261f', 0, 0.72);
  const amber = material('#ceaa52', 0.1, 0.26);
  const glint = material('#fff8dc', 0.05, 0.2, { emissive: '#eee2b4', emissiveIntensity: 0.14 });

  orb(cat, ginger, [0, 0.05, -0.012], [0.215, 0.25, 0.178]);
  orb(cat, white, [0, 0.03, 0.127], [0.163, 0.202, 0.08]);
  for (const side of [-1, 1]) {
    orb(cat, white, [side * 0.156, -0.087, 0.207], [0.079, 0.064, 0.092]);
    tube(cat, [[side * 0.17, 0.11, 0.056], [side * 0.192, 0.06, 0.063]], 0.015, stripe, 8);
  }

  const head = new THREE.Group();
  head.position.set(0, 0.37, 0.014);
  cat.add(head);
  orb(head, orange, [0, 0, 0], [0.29, 0.242, 0.231]);
  // White cheeks meet a tapered forehead blaze on the curved head surface.
  for (const side of [-1, 1]) {
    orb(head, white, [side * 0.128, -0.097, 0.163], [0.147, 0.121, 0.084]);
    orb(head, white, [side * 0.044, -0.089, 0.235], [0.073, 0.05, 0.042]);
  }
  const blaze = shape(head, [[-0.017, 0.237], [0.025, 0.236], [0.044, 0.093], [0.076, -0.064], [-0.074, -0.064], [-0.036, 0.091]], 0.005, 0.008, white);
  const blazePositions = blaze.geometry.attributes.position;
  for (let i = 0; i < blazePositions.count; i++) {
    const x = blazePositions.getX(i), y = blazePositions.getY(i);
    const radius = Math.max(0, 1 - (x / 0.29) ** 2 - (y / 0.242) ** 2);
    blazePositions.setZ(i, blazePositions.getZ(i) + Math.sqrt(radius) * 0.231 + 0.004);
  }
  blaze.geometry.computeVertexNormals();
  const ears = [], eyes = [], pupils = [];
  for (const side of [-1, 1]) {
    const ear = new THREE.Group();
    ear.position.set(side * 0.199, 0.164, -0.035);
    ear.scale.x = side;
    head.add(ear);
    ears.push(ear);
    shape(ear, [[-0.102, -0.065], [-0.01, 0.193], [0.033, 0.207], [0.118, -0.07]], 0.071, 0.021, ginger);
    const inside = shape(ear, [[-0.058, -0.039], [0.019, 0.139], [0.075, -0.042]], 0.008, 0.010, pink);
    inside.position.z = 0.048;
    const eye = new THREE.Group();
    eye.position.set(side * 0.13, 0.024, 0.214);
    head.add(eye);
    eyes.push(eye);
    orb(eye, dark, [0, 0, 0], [0.095, 0.101, 0.030]);
    orb(eye, amber, [0, 0, 0.018], [0.076, 0.086, 0.023]);
    const pupil = new THREE.Group();
    pupil.position.z = 0.034;
    eye.add(pupil);
    pupils.push(pupil);
    orb(pupil, dark, [0, 0.004, 0], [0.044, 0.070, 0.016]);
    orb(pupil, glint, [-0.017, 0.035, 0.013], [0.018, 0.021, 0.005]);
    orb(pupil, glint, [0.020, -0.026, 0.014], [0.007, 0.008, 0.004]);
    tube(head, [[side * 0.196, 0.142, 0.137], [side * 0.16, 0.116, 0.188]], 0.014, stripe, 9);
    tube(head, [[side * 0.101, 0.185, 0.126], [side * 0.089, 0.15, 0.178]], 0.013, stripe, 8);
    tube(head, [[side * 0.266, -0.003, 0.092], [side * 0.238, -0.019, 0.162]], 0.012, stripe, 8);
    tube(head, [[side * 0.197, -0.092, 0.216], [side * 0.28, -0.087, 0.21], [side * 0.342, -0.072, 0.187]], 0.0036, dark, 12);
    tube(head, [[side * 0.19, -0.112, 0.216], [side * 0.296, -0.136, 0.198]], 0.0036, dark, 9);
  }
  const nose = shape(head, [[-0.03, -0.07], [0.03, -0.07], [0, -0.098]], 0.012, 0.006, pink);
  nose.position.z = 0.276;
  tube(head, [[-0.047, -0.117, 0.266], [-0.027, -0.124, 0.271], [0, -0.107, 0.278], [0.027, -0.124, 0.271], [0.047, -0.117, 0.266]], 0.004, dark, 18);

  const tail = new THREE.Group();
  tail.position.set(-0.13, -0.05, -0.17);
  cat.add(tail);
  tube(tail, [[0, 0, 0], [-0.15, 0.10, -0.015], [-0.21, 0.24, 0.005], [-0.18, 0.35, 0.025], [-0.11, 0.37, 0.042]], 0.032, ginger, 30);
  tube(tail, [[-0.197, 0.29, 0.015], [-0.18, 0.35, 0.025], [-0.11, 0.37, 0.042]], 0.033, white, 14);

  batchStaticMeshes(THREE, head);
  batchStaticMeshes(THREE, cat);
  cat.userData.animate = (time, interaction = {}) => {
    const lookX = bounded(interaction.lookX, 0, -1, 1), lookY = bounded(interaction.lookY, 0, -1, 1);
    const pet = bounded(interaction.pet);
    head.rotation.y = lookX * 0.28 + Math.sin(time * 0.45) * 0.038;
    head.rotation.x = -lookY * 0.13 + pet * 0.08;
    head.rotation.z = Math.sin(time * 0.63) * 0.025 + pet * Math.sin(time * 4.2) * 0.04;
    const phase = ((time + 0.74) % 5.7 + 5.7) % 5.7;
    const blink = Math.exp(-(((phase - 0.19) / 0.071) ** 2)) + 0.44 * Math.exp(-(((phase - 0.43) / 0.055) ** 2));
    const openness = Math.max(0.045, 1 - blink * 0.965 - pet * 0.54);
    for (let i = 0; i < eyes.length; i++) {
      eyes[i].scale.y = openness;
      pupils[i].position.x = lookX * 0.012;
      pupils[i].position.y = lookY * 0.01;
      const side = i ? 1 : -1;
      ears[i].rotation.z = side * (Math.sin(time * 0.8 + i) * 0.028 + pet * 0.14);
      ears[i].rotation.x = lookY * 0.13 + Math.sin(time * 0.47 + i) * 0.022;
    }
    tail.rotation.z = Math.sin(time * 1.1) * (0.075 + pet * 0.16);
    tail.rotation.y = Math.sin(time * 0.68) * 0.10;
  };
  return cat;
}

/** A dark-teal reconnaissance fighter, with inset ivory panels and lit exhausts. */
export function createShip(THREE) {
  const blenderShip = createBlenderShip(THREE);
  if (blenderShip) return blenderShip;
  const kit = workshop(THREE);
  const { material, add, orb, tube, limb, shape, lathe } = kit;
  const ship = new THREE.Group();
  ship.name = 'Morfeu · explorador orbital';
  const frame = material('#294e51', 0.67, 0.35);
  const darkFrame = material('#152f35', 0.65, 0.43);
  const metal = material('#617e7d', 0.75, 0.32);
  const ivory = material('#d7cfb5', 0.35, 0.47);
  const lightEdge = material('#ebe4cc', 0.54, 0.33);
  const copper = material('#a26c4c', 0.67, 0.38);
  const paint = material('#ad6456', 0.25, 0.56);
  const black = material('#10232a', 0.18, 0.72);
  const glass = new THREE.MeshPhysicalMaterial({ color: '#89bcb0', metalness: 0.05, roughness: 0.14, transparent: true, opacity: 0.24, depthWrite: false, side: THREE.DoubleSide, clearcoat: 1, clearcoatRoughness: 0.12 });
  const glow = material('#b5f5d9', 0, 0.24, { emissive: '#75e1c2', emissiveIntensity: 1.4 });
  const jetPaint = new THREE.MeshBasicMaterial({ color: '#71ddc5', transparent: true, opacity: 0.25, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending });
  const jetCorePaint = new THREE.MeshBasicMaterial({ color: '#e0fff0', transparent: true, opacity: 0.50, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending });

  // Octagonal cross-sections narrow to a long, edged nose rather than a triangle slab.
  const stations = [[-1.04, 0.225, 0.123], [-0.70, 0.325, 0.185], [-0.12, 0.348, 0.20], [0.42, 0.235, 0.147], [1.25, 0.084, 0.068], [1.62, 0.014, 0.018]];
  const positions = [], indices = [];
  stations.forEach(([z, width, height], ring) => {
    [[-0.68, 1], [0.68, 1], [1, 0.41], [1, -0.46], [0.62, -1], [-0.62, -1], [-1, -0.46], [-1, 0.41]].forEach(([x, y]) => positions.push(x * width, y * height, z));
    if (ring < stations.length - 1) {
      for (let j = 0; j < 8; j++) {
        const a = ring * 8 + j, b = ring * 8 + (j + 1) % 8;
        indices.push(a, a + 8, b, b, a + 8, b + 8);
      }
    }
  });
  for (let j = 1; j < 7; j++) {
    indices.push(0, j, j + 1);
    const last = (stations.length - 1) * 8;
    indices.push(last, last + j + 1, last + j);
  }
  const hull = new THREE.BufferGeometry();
  hull.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  hull.setIndex(indices); hull.computeVertexNormals();
  add(ship, hull, frame);

  const heightAt = z => {
    for (let i = 0; i < stations.length - 1; i++) {
      const a = stations[i], b = stations[i + 1];
      if (z >= a[0] && z <= b[0]) return a[2] + (z - a[0]) / (b[0] - a[0]) * (b[2] - a[2]);
    }
    return 0.04;
  };
  const deckPanel = (outline, paintMaterial, offset = 0.01) => {
    const mesh = shape(ship, outline, 0.014, 0.009, paintMaterial);
    const p = mesh.geometry.attributes.position;
    for (let i = 0; i < p.count; i++) p.setZ(i, p.getZ(i) - heightAt(p.getY(i)) - offset);
    mesh.geometry.computeVertexNormals();
    mesh.rotation.x = Math.PI / 2;
    return mesh;
  };
  for (const side of [-1, 1]) {
    deckPanel([[side * 0.032, 0.46], [side * 0.158, 0.43], [side * 0.054, 1.22], [side * 0.015, 1.49]], ivory);
    deckPanel([[side * 0.185, -0.72], [side * 0.252, -0.60], [side * 0.264, -0.03], [side * 0.20, 0.17], [side * 0.163, 0.12]], ivory);
  }
  deckPanel([[-0.027, 0.48], [0.027, 0.48], [0.021, 1.01], [-0.021, 1.01]], paint, 0.016);
  tube(ship, [[0, 0.08, 1.26], [0, 0.16, 0.43], [0, 0.145, 0.34]], 0.012, lightEdge, 16);

  const wings = [], exhausts = [];
  for (const side of [-1, 1]) {
    for (const level of [-1, 1]) {
      const wing = new THREE.Group();
      wing.position.set(side * 0.26, level * 0.045, -0.17);
      wing.rotation.z = side * level * 0.245;
      wing.scale.x = side;
      ship.add(wing);
      wings.push({ wing, side, level });
      const wingPlan = [[0, -0.55], [1.19, -0.90], [1.45, -0.78], [1.49, -0.49], [0.28, 0.48], [0, 0.43]];
      const wingMesh = shape(wing, wingPlan, 0.057, 0.026, darkFrame);
      wingMesh.rotation.x = Math.PI / 2;
      const panel = shape(wing, [[0.09, 0.29], [0.285, 0.397], [1.40, -0.497], [1.37, -0.62], [1.17, -0.69], [0.54, -0.12]], 0.011, 0.011, ivory);
      panel.rotation.x = Math.PI / 2;
      panel.position.y = level * 0.052;
      const internal = shape(wing, [[0.07, -0.43], [0.43, -0.53], [0.63, -0.29], [0.20, 0.22]], 0.012, 0.009, frame);
      internal.rotation.x = Math.PI / 2;
      internal.position.y = level * 0.054;
      const insignia = shape(wing, [[0.91, -0.27], [1.055, -0.385], [1.005, -0.55], [0.86, -0.425]], 0.008, 0.004, paint);
      insignia.rotation.x = Math.PI / 2;
      insignia.position.y = level * 0.071;
      tube(wing, [[0.075, level * 0.065, -0.43], [0.51, level * 0.065, -0.54], [1.22, level * 0.065, -0.73]], 0.011, metal, 16);

      const engine = new THREE.Group();
      engine.position.set(1.21, level * 0.025, -0.51);
      wing.add(engine);
      // Revolved casings include a thick front intake, rear neck, and hollow nozzle.
      const casing = lathe(engine, [[0.111, -0.43], [0.149, -0.39], [0.158, -0.29], [0.143, 0.18], [0.121, 0.34], [0.104, 0.37]], metal, [0, 0, 0]);
      casing.rotation.x = Math.PI / 2;
      const shell = add(engine, new THREE.CylinderGeometry(0.151, 0.153, 0.23, 28, 1, true), ivory, [0, 0, 0.08]);
      shell.rotation.x = Math.PI / 2;
      const intake = add(engine, new THREE.TorusGeometry(0.112, 0.016, 8, 32), copper, [0, 0, 0.376]);
      add(engine, new THREE.CircleGeometry(0.104, 28), black, [0, 0, 0.368]);
      orb(engine, darkFrame, [0, 0, 0.377], [0.036, 0.036, 0.066]);
      for (let vane = 0; vane < 6; vane++) {
        const angle = vane / 6 * Math.PI * 2;
        const blade = shape(engine, [[0.024, -0.006], [0.089, -0.009], [0.086, 0.012], [0.028, 0.024]], 0.004, 0, metal);
        blade.position.z = 0.373;
        blade.rotation.z = angle;
      }
      const nozzle = lathe(engine, [[0.106, 0.105], [0.139, 0.056], [0.131, -0.068], [0.104, -0.08], [0.099, -0.068], [0.106, 0.105]], darkFrame, [0, 0, -0.485]);
      nozzle.rotation.x = Math.PI / 2;
      const rearRim = add(engine, new THREE.TorusGeometry(0.119, 0.010, 7, 28), copper, [0, 0, -0.57]);
      const lit = add(engine, new THREE.CircleGeometry(0.096, 28), glow, [0, 0, -0.566]);
      lit.rotation.y = Math.PI;
      for (let petal = 0; petal < 6; petal++) {
        const angle = petal / 6 * Math.PI * 2;
        tube(engine, [[Math.cos(angle) * 0.14, Math.sin(angle) * 0.14, -0.42], [Math.cos(angle) * 0.125, Math.sin(angle) * 0.125, -0.552]], 0.007, metal, 6);
      }
      const plume = new THREE.Group();
      plume.name = 'jato · ' + side + ' · ' + level;
      plume.position.z = -0.571;
      engine.add(plume);
      const jet = add(plume, new THREE.CylinderGeometry(0.008, 0.093, 1, 24, 5, true), jetPaint, [0, 0, -0.5]);
      jet.rotation.x = -Math.PI / 2;
      jet.castShadow = false;
      const core = add(plume, new THREE.CylinderGeometry(0.003, 0.047, 0.72, 20, 4, true), jetCorePaint, [0, 0, -0.36]);
      core.rotation.x = -Math.PI / 2;
      core.castShadow = false;
      plume.scale.set(0.78, 0.78, 0.18);
      exhausts.push(plume);

      // Long wingtip probes read as a single precise edge at thumbnail size.
      const probe = add(wing, new THREE.CylinderGeometry(0.014, 0.024, 0.72, 12), metal, [1.40, 0, -0.02]);
      probe.rotation.x = Math.PI / 2;
      const probeMount = add(wing, new THREE.CylinderGeometry(0.04, 0.045, 0.21, 18), darkFrame, [1.40, 0, -0.31]);
      probeMount.rotation.x = Math.PI / 2;
      orb(wing, copper, [1.40, 0, 0.34], [0.024, 0.024, 0.037]);
      batchStaticMeshes(THREE, engine);
      batchStaticMeshes(THREE, wing);
    }
  }

  // Cockpit: a raised coaming and aft roll bar, with the windscreen below his eyes.
  orb(ship, darkFrame, [0, 0.206, -0.23], [0.327, 0.139, 0.416]);
  orb(ship, black, [0, 0.281, -0.22], [0.274, 0.072, 0.35]);
  const rim = add(ship, new THREE.TorusGeometry(1, 0.025, 8, 44), metal, [0, 0.285, -0.23], [0.30, 0.4, 0.3]);
  rim.rotation.x = Math.PI / 2;
  const seat = shape(ship, [[-0.186, -0.09], [0.186, -0.09], [0.174, 0.235], [0.13, 0.29], [-0.13, 0.29], [-0.174, 0.235]], 0.044, 0.031, leatherMaterial(material));
  seat.position.set(0, 0.3, -0.41);
  const cat = createMorfeu(THREE, kit);
  cat.position.set(0, 0.407, -0.19);
  ship.add(cat);
  tube(ship, [[-0.283, 0.285, -0.47], [-0.258, 0.56, -0.48], [0, 0.775, -0.53], [0.258, 0.56, -0.48], [0.283, 0.285, -0.47]], 0.021, metal, 32);
  const windscreen = surface(THREE, 24, 5, (u, v) => {
    const angle = (u - 0.5) * 2.4;
    return [Math.sin(angle) * (0.265 + v * 0.025), 0.475 - v * 0.208, 0.035 + Math.cos(angle) * (0.285 + v * 0.055)];
  });
  const windshield = add(ship, windscreen, glass);
  windshield.castShadow = false;
  tube(ship, Array.from({ length: 11 }, (_, i) => {
    const angle = (i / 10 - 0.5) * 2.4;
    return [Math.sin(angle) * 0.265, 0.475, 0.035 + Math.cos(angle) * 0.285];
  }), 0.009, lightEdge, 26);
  for (const side of [-1, 1]) {
    const rudder = shape(ship, [[-0.96, 0.135], [-0.95, 0.43], [-0.68, 0.415], [-0.39, 0.16]], 0.026, 0.014, frame);
    rudder.rotation.y = Math.PI / 2;
    rudder.position.set(side * 0.19, 0, -1.30);
    rudder.rotation.z = side * -0.10;
    const vent = shape(ship, [[-0.12, -0.038], [0.12, -0.038], [0.12, 0.038], [-0.12, 0.038]], 0.014, 0.009, black);
    vent.rotation.x = Math.PI / 2;
    vent.position.set(side * 0.14, 0.20, -0.77);
    for (let slat = 0; slat < 4; slat++) {
      tube(ship, [[side * 0.14 - 0.07, 0.218, -0.81 + slat * 0.025], [side * 0.14 + 0.07, 0.218, -0.81 + slat * 0.025]], 0.007, metal, 4);
    }
  }
  orb(ship, copper, [0, 0.105, 1.035], [0.032, 0.018, 0.065]);

  batchStaticMeshes(THREE, ship);
  ship.userData.exhausts = exhausts;
  ship.userData.exhaustOrigin = new THREE.Vector3(0, 0, -1.25);
  ship.userData.throttle = 0;
  ship.userData.setFlight = value => { ship.userData.throttle = bounded(value); };
  ship.userData.animate = (time = 0, hover = 0, interaction = {}) => {
    time = Number.isFinite(time) ? time : 0;
    if (typeof interaction === 'number') interaction = { thrust: interaction, flight: interaction };
    interaction ||= {};
    const thrust = bounded(interaction.thrust, ship.userData.throttle);
    const flight = bounded(interaction.flight), warmth = bounded(hover);
    cat.userData.animate(time, interaction);
    for (const { wing, side, level } of wings) {
      wing.rotation.z = side * level * (0.245 + warmth * 0.022 + flight * 0.075);
    }
    for (let i = 0; i < exhausts.length; i++) {
      const pulse = 1 + Math.sin(time * 17 + i * 1.7) * 0.055;
      const width = 0.74 + thrust * 0.29;
      exhausts[i].scale.set(width, width, (0.17 + thrust * 0.94 + warmth * 0.07) * pulse);
    }
    glow.emissiveIntensity = 1.3 + thrust * 2.2 + Math.sin(time * 7.1) * 0.09;
    jetPaint.opacity = 0.18 + thrust * 0.24;
    jetCorePaint.opacity = 0.33 + thrust * 0.3;
  };
  ship.position.y = -0.23;
  return ship;
}

function leatherMaterial(material) {
  return material('#714b3a', 0, 0.88);
}
