import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { PlanetFlight, sampleFlightTiming } from '../js/three/flight.js';
import { createPlanet } from '../js/three/planets.js';
import { createShip } from '../js/three/characters.js';

function atlasItem(kind) {
  const model = kind === 'ship' ? createShip(THREE) : createPlanet(THREE, kind);
  const pivot = new THREE.Group();
  pivot.add(model);
  const camera = new THREE.OrthographicCamera(-1.8, 1.8, 1.8, -1.8, .1, 50);
  camera.position.set(...(kind === 'ship' ? [3.6, 2.5, 7] : [0, 1.1, 7]));
  camera.lookAt(0, 0, 0);
  camera.updateMatrixWorld();
  return { kind, model, pivot, camera };
}

const layouts = [
  { width: 1440, height: 900, originRect: { left: 95, top: 618, width: 220, height: 145 }, destinationRect: { left: 1100, top: 435, width: 210, height: 210 } },
  { width: 390, height: 844, originRect: { left: 12, top: 641, width: 144, height: 101 }, destinationRect: { left: 215, top: 265, width: 160, height: 145 } },
  { width: 390, height: 844, originRect: { left: 12, top: 641, width: 144, height: 101 }, destinationRect: { left: 215, top: 520, width: 160, height: 145 } },
];

test('navigation handoff occurs under a complete atmosphere wash and fades to the product', () => {
  for (const mode of ['enter', 'return']) {
    assert.equal(sampleFlightTiming(.91, mode).readyToReveal, false);
    assert.equal(sampleFlightTiming(.92, mode).readyToReveal, true);
    assert.equal(sampleFlightTiming(.92, mode).wash, 1);
    assert.equal(sampleFlightTiming(1, mode).wash, 0);
  }
  assert.equal(sampleFlightTiming(.8).phase, 'entry');
  assert.equal(sampleFlightTiming(.5, 'intro').wash, 0);
});

test('planet journey keeps the spacecraft in frame and reaches the solid surface on desktop and portrait', () => {
  const shipItem = atlasItem('ship');
  for (const world of ['cindra', 'commissionmatch', 'mangue']) {
    const planetItem = atlasItem(world);
    for (const layout of layouts) {
      const journey = new PlanetFlight(THREE, { ...layout, shipItem, planetItem, world });
      const originalCameraZ = journey.camera.position.z;
      for (let i = 0; i <= 90; i += 1) {
        const progress = i / 100;
        journey.update(progress, progress * journey.duration / 1000);
        const screen = journey.ship.position.clone().project(journey.camera);
        assert.ok(Number.isFinite(screen.x) && Number.isFinite(screen.y) && Number.isFinite(screen.z), `${world}: finite projection`);
        if (progress >= .12 && progress <= .8) {
          assert.ok(Math.abs(screen.x) < .9 && Math.abs(screen.y) < .9, `${world} ${layout.width}px p=${progress}: ship stays visible (${screen.x},${screen.y})`);
          assert.ok(screen.z > -1 && screen.z < 1, `${world}: ship is in front of the camera`);
          const destination = journey.destinationPoint.clone().project(journey.camera);
          assert.ok(Math.abs(destination.x) < .9 && Math.abs(destination.y) < .9, `${world}: destination stays visible during transit`);
        }
      }
      assert.ok(journey.camera.position.z < originalCameraZ / 4, 'Camera visibly approaches the planet');
      assert.ok(journey.ship.position.distanceTo(journey.destinationPoint) < journey.radius, 'The ship really enters the opaque globe');
      journey.dispose();
    }
  }
});

test('seeking, resize, return and intro do not mutate atlas models or accumulate transforms', () => {
  const shipItem = atlasItem('ship');
  const planetItem = atlasItem('mangue');
  const snapshot = item => {
    const values = [];
    item.model.traverse(object => values.push(...object.position.toArray(), ...object.quaternion.toArray(), ...object.scale.toArray()));
    return values;
  };
  const originalShip = snapshot(shipItem), originalPlanet = snapshot(planetItem);
  for (const mode of ['enter', 'return', 'intro']) {
    const journey = new PlanetFlight(THREE, { ...layouts[0], shipItem, planetItem, world: 'mangue', mode });
    journey.update(.5, 2.9);
    const expected = [...journey.ship.position.toArray(), ...journey.ship.quaternion.toArray(), ...journey.camera.position.toArray()];
    journey.update(.97, 5.626);
    journey.update(.5, 2.9);
    assert.deepEqual([...journey.ship.position.toArray(), ...journey.ship.quaternion.toArray(), ...journey.camera.position.toArray()], expected);
    journey.resize(390, 844);
    for (const progress of [0, .2, .5, .8, 1]) {
      journey.update(progress, progress * journey.duration / 1000);
      journey.scene.updateMatrixWorld(true);
      journey.scene.traverse(object => assert.ok(object.matrixWorld.elements.every(Number.isFinite)));
    }
    journey.dispose();
    journey.dispose();
  }
  assert.deepEqual(snapshot(shipItem), originalShip);
  assert.deepEqual(snapshot(planetItem), originalPlanet);
});

test('portrait framing includes the whole ship and engine plumes, including the lower Mangue approach', () => {
  const shipItem = atlasItem('ship');
  const vertex = new THREE.Vector3();
  for (const layout of layouts.slice(1)) {
    const planetItem = atlasItem('mangue');
    const journey = new PlanetFlight(THREE, { ...layout, shipItem, planetItem, world: 'mangue' });
    for (let step = 20; step <= 78; step += 2) {
      const progress = step / 100;
      journey.update(progress, progress * journey.duration / 1000);
      journey.ship.updateWorldMatrix(true, true);
      const projectedBounds = new THREE.Box3();
      journey.ship.traverseVisible(object => {
        if (!object.isMesh) return;
        const positions = object.geometry.getAttribute('position');
        for (let i = 0; i < positions.count; i += 1) {
          vertex.fromBufferAttribute(positions, i).applyMatrix4(object.matrixWorld).project(journey.camera);
          projectedBounds.expandByPoint(vertex);
        }
      });
      const { min, max } = projectedBounds;
      assert.ok(min.x >= -.94 && max.x <= .94 && min.y >= -.94 && max.y <= .94,
        `top=${layout.destinationRect.top} p=${progress}: full projected ship stays inside the viewport (${min.x},${max.x},${min.y},${max.y})`);
      assert.ok(min.z > -1 && max.z < 1, 'Every ship vertex remains in front of the camera');
    }
    journey.dispose();
  }
});
