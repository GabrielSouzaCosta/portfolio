import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { createPlanet } from '../js/three/planets.js';
import { createKnight, createShip } from '../js/three/characters.js';

const factories = {
  cindra: () => createPlanet(THREE, 'cindra'),
  commissionmatch: () => createPlanet(THREE, 'commissionmatch'),
  mangue: () => createPlanet(THREE, 'mangue'),
  knight: () => createKnight(THREE),
  ship: () => createShip(THREE)
};
for (const [name, create] of Object.entries(factories)) {
  test(`${name}: renderable 3D geometry has valid coordinates, indices and bounded animation`, () => {
    const model = create();
    let meshes = 0;
    model.traverse(object => {
      if (!object.isMesh) return;
      meshes++;
      const geometry = object.geometry;
      const positions = geometry.getAttribute('position');
      assert.ok(positions?.count > 2);
      for (const value of positions.array) assert.ok(Number.isFinite(value), `${name}: invalid vertex`);
      for (const value of geometry.getAttribute('normal').array) assert.ok(Number.isFinite(value), `${name}: invalid normal`);
      if (geometry.index) for (const index of geometry.index.array) assert.ok(index < positions.count, `${name}: invalid face`);
    });
    assert.ok(meshes > 0);
    const initial = new THREE.Box3().setFromObject(model);
    const size = initial.getSize(new THREE.Vector3());
    assert.ok(size.x > .5 && size.y > .5 && size.z > .5, 'Model has physical depth');
    for (const time of [0, 4, 30, 120]) {
      model.userData.animate?.(time,.8);
      const box = new THREE.Box3().setFromObject(model);
      assert.ok(box.getSize(new THREE.Vector3()).length() < 8, 'Animation stays inside its viewport budget');
    }
    const snapshot = () => {
      const values = [];
      model.traverse(object => values.push(...object.position.toArray(), ...object.quaternion.toArray(), ...object.scale.toArray()));
      return values;
    };
    model.userData.animate?.(4,0);
    const expected = snapshot();
    model.userData.animate?.(120,1);
    model.userData.animate?.(4,0);
    assert.deepEqual(snapshot(), expected, 'Animation can be paused/resumed without accumulating transforms');
  });
}

test('planet surfaces and animated silhouettes remain usable by the flight camera', () => {
  for (const world of ['cindra', 'commissionmatch', 'mangue']) {
    const model = createPlanet(THREE, world);
    const radius = model.userData.surfaceRadius;
    assert.ok(Number.isFinite(radius) && radius > .5 && radius < 1.25, `${world}: usable entry surface`);
    for (const key of ['surfaceColor', 'atmosphereColor']) {
      assert.match(model.userData[key], /^#[\da-f]{6}$/i, `${world}: flight transition color`);
    }
    const vertex = new THREE.Vector3();
    let relief = false;
    for (const [time, approach] of [[0, 0], [12, .5], [40, 1], [100, 0]]) {
      model.userData.animate(time, .8, { approach });
      model.updateMatrixWorld(true);
      model.traverse(object => {
        if (!object.isMesh) return;
        const positions = object.geometry.getAttribute('position');
        for (let i = 0; i < positions.count; i += 1) {
          vertex.fromBufferAttribute(positions, i).applyMatrix4(object.matrixWorld);
          const distance = vertex.length();
          assert.ok(Number.isFinite(distance) && distance <= 1.5, `${world}: geometry exceeds the flight framing budget`);
          if (!object.material.isShaderMaterial && distance > radius * 1.08) relief = true;
        }
      });
    }
    assert.ok(relief, `${world}: the surface has physical relief above its entry sphere`);
    const ray = new THREE.Raycaster(new THREE.Vector3(0, 0, 3), new THREE.Vector3(0, 0, -1));
    const opaqueHits = ray.intersectObject(model, true).filter(hit => !hit.object.material.transparent);
    assert.ok(opaqueHits.length > 0, `${world}: the approach camera meets a solid planet surface`);
    assert.ok(opaqueHits[0].point.length() >= radius * .95, `${world}: surface radius agrees with visible geometry`);
  }
});
