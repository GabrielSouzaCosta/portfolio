import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { createPlanet } from './planets.js';
import { createShip } from './characters.js';
import { PlanetFlight } from './flight.js';

/** One WebGL context; each model stays inside its semantic link's viewport. */
export class StudioObjects {
  constructor() {
    this.items = [];
    this.paused = false;
    this.elapsed = 0;
    this.lastTime = 0;
    this.frame = 0;
    this.dirty = true;
    this.pointer = { x:0, y:0 };
    this.look = { x:0, y:0 };
    this.canvas = document.createElement('canvas');
    this.canvas.id = 'object-canvas';
    this.canvas.setAttribute('aria-hidden', 'true');
    try {
      this.renderer = new THREE.WebGLRenderer({ canvas:this.canvas, alpha:true, antialias:true, powerPreference:'low-power' });
    } catch {
      document.body.dataset.renderMode = 'fallback';
      return;
    }
    const renderer = this.renderer;
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.75));
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = .98;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.autoClear = false;
    const pmrem = new THREE.PMREMGenerator(renderer);
    const room = new RoomEnvironment();
    this.environment = pmrem.fromScene(room, .04);
    room.dispose();
    pmrem.dispose();
    document.body.append(this.canvas);
    document.querySelectorAll('[data-model]').forEach(element => this.add(element));
    this.onResize = () => { this.dirty = true; this.requestFrame(); };
    this.onPointer = event => {
      this.pointer.x = event.clientX / innerWidth * 2 - 1;
      this.pointer.y = event.clientY / innerHeight * 2 - 1;
      if (!this.paused) this.requestFrame();
    };
    this.onVisibility = () => {
      if (document.hidden) { cancelAnimationFrame(this.frame); this.frame = 0; this.lastTime = 0; }
      else { this.dirty = true; this.requestFrame(); }
    };
    this.observer = new MutationObserver(() => { this.dirty = true; this.requestFrame(); });
    this.observer.observe(document.body, { attributes:true, attributeFilter:['data-world', 'class'] });
    this.resizeObserver = new ResizeObserver(this.onResize);
    this.resizeObserver.observe(document.body);
    this.items.forEach(item => this.resizeObserver.observe(item.element));
    addEventListener('resize', this.onResize);
    addEventListener('pointermove', this.onPointer, { passive:true });
    document.addEventListener('visibilitychange', this.onVisibility);
    this.canvas.addEventListener('webglcontextlost', event => {
      event.preventDefault();
      cancelAnimationFrame(this.frame);
      this.frame = 0;
      this.contextLost = true;
      document.body.dataset.renderMode = 'fallback';
      this.journey?.onComplete?.();
    });
    this.canvas.addEventListener('webglcontextrestored', () => {
      const restoredPmrem = new THREE.PMREMGenerator(renderer);
      const restoredRoom = new RoomEnvironment();
      const restoredEnvironment = restoredPmrem.fromScene(restoredRoom, .04);
      this.environment.dispose();
      this.environment = restoredEnvironment;
      this.items.forEach(item => { item.scene.environment = restoredEnvironment.texture; });
      restoredRoom.dispose();
      restoredPmrem.dispose();
      this.contextLost = false;
      this.dirty = true;
      this.requestFrame();
    });
    document.body.dataset.renderMode = 'webgl';
    this.requestFrame();
  }

  add(element) {
    const kind = element.dataset.model;
    const mini = element.closest('.journey-rail') !== null;
    const scene = new THREE.Scene();
    scene.environment = this.environment.texture;
    scene.environmentIntensity = .16;
    const model = kind === 'ship' ? createShip(THREE) : createPlanet(THREE, kind);
    const pivot = new THREE.Group();
    pivot.add(model);
    scene.add(pivot);
    scene.add(new THREE.HemisphereLight(0xe9f2ff, 0x303947, .65));
    const key = new THREE.DirectionalLight(0xffe8c4, 2.15);
    key.position.set(-3.5, 5.5, 6);
    key.castShadow = !mini;
    key.shadow.mapSize.set(1024,1024);
    Object.assign(key.shadow.camera, { left:-3, right:3, top:3, bottom:-3, near:.1, far:20 });
    key.shadow.bias = -.0003;
    key.shadow.normalBias = .006;
    scene.add(key);
    const rim = new THREE.DirectionalLight(0x8fb8d4, 1.7);
    rim.position.set(3, 2, -4);
    scene.add(rim);
    const fill = new THREE.DirectionalLight(0xb8d1c6, .2);
    fill.position.set(3, -1, 4);
    scene.add(fill);
    const camera = new THREE.OrthographicCamera(-2,2,2,-2,.1,50);
    const isCharacter = kind === 'ship';
    const eye = kind === 'ship' ? new THREE.Vector3(3.6,2.5,7) : new THREE.Vector3(0,1.1,7);
    camera.position.copy(eye);
    camera.lookAt(0,0,0);
    let radius = 0;
    if (!isCharacter) {
      model.updateWorldMatrix(true,true);
      const point = new THREE.Vector3();
      model.traverse(object => {
        const position = object.geometry?.getAttribute('position');
        if (!position) return;
        for (let i = 0; i < position.count; i++) {
          point.fromBufferAttribute(position,i).applyMatrix4(object.matrixWorld);
          radius = Math.max(radius,point.length());
        }
      });
      radius = Math.max(radius, model.userData.framingRadius || 0);
    }
    const item = { element, scene, camera, model, pivot, mini, kind, eye, radius, hover:0, targetHover:0, rect:null, rotation:{ x:0, y:0 }, velocity:0 };
    const target = element.closest('a, button');
    const onEnter = () => { item.targetHover = 1; if (!isCharacter) this.destination = item; this.requestFrame(); };
    const onLeave = () => { item.targetHover = 0; if (this.destination === item) this.destination = null; this.requestFrame(); };
    const onPet = () => { if (kind === 'ship') { item.petAt = this.elapsed; this.requestFrame(); } };
    target?.addEventListener('pointerenter', onEnter);
    target?.addEventListener('pointerleave', onLeave);
    target?.addEventListener('focus', onEnter);
    target?.addEventListener('blur', onLeave);
    if (kind === 'ship') target?.addEventListener('click', onPet);
    const onDown = event => {
      if (isCharacter || mini || event.button !== 0 || this.journey) return;
      item.drag = { id:event.pointerId, x:event.clientX, y:event.clientY, lastX:event.clientX, lastY:event.clientY, moved:false };
      item.velocity = 0;
      element.setPointerCapture(event.pointerId);
    };
    const onMove = event => {
      const drag = item.drag;
      if (!drag || drag.id !== event.pointerId) return;
      if (Math.hypot(event.clientX - drag.x,event.clientY - drag.y) > 6) drag.moved = true;
      if (drag.moved) {
        const dx = event.clientX - drag.lastX;
        item.rotation.y += dx * .013;
        item.rotation.x = THREE.MathUtils.clamp(item.rotation.x + (event.clientY - drag.lastY) * .009,-.8,.8);
        item.velocity = dx * .013;
        element.classList.add('is-dragging');
        event.preventDefault();
        this.requestFrame();
      }
      drag.lastX = event.clientX; drag.lastY = event.clientY;
    };
    const onUp = event => {
      if (!item.drag || item.drag.id !== event.pointerId) return;
      item.suppressClick = item.drag.moved ? performance.now() + 350 : 0;
      item.drag = null;
      element.classList.remove('is-dragging');
      if (element.hasPointerCapture(event.pointerId)) element.releasePointerCapture(event.pointerId);
    };
    const onClick = event => {
      if (event.detail && performance.now() < item.suppressClick) { event.preventDefault(); event.stopImmediatePropagation(); }
    };
    const onDragStart = event => event.preventDefault();
    if (!isCharacter && !mini) {
      target?.setAttribute('aria-description','Arraste o planeta para girar. Clique ou pressione Enter para viajar.');
      element.addEventListener('pointerdown',onDown);
      element.addEventListener('pointermove',onMove);
      element.addEventListener('pointerup',onUp);
      element.addEventListener('pointercancel',onUp);
      target?.addEventListener('click',onClick,true);
      target?.addEventListener('dragstart',onDragStart);
    }
    item.cleanup = () => {
      target?.removeEventListener('pointerenter', onEnter);
      target?.removeEventListener('pointerleave', onLeave);
      target?.removeEventListener('focus', onEnter);
      target?.removeEventListener('blur', onLeave);
      if (kind === 'ship') target?.removeEventListener('click', onPet);
      element.removeEventListener('pointerdown',onDown);
      element.removeEventListener('pointermove',onMove);
      element.removeEventListener('pointerup',onUp);
      element.removeEventListener('pointercancel',onUp);
      target?.removeEventListener('click',onClick,true);
      target?.removeEventListener('dragstart',onDragStart);
    };
    this.items.push(item);
  }

  fit(item, aspect) {
    const { camera, eye, model } = item;
    model.updateWorldMatrix(true,true);
    const box = new THREE.Box3().setFromObject(model);
    const center = item.radius ? new THREE.Vector3() : box.getCenter(new THREE.Vector3());
    camera.position.copy(center).add(eye);
    camera.lookAt(center);
    camera.updateMatrixWorld();
    const projected = new THREE.Box3();
    for (const x of [box.min.x,box.max.x]) for (const y of [box.min.y,box.max.y]) for (const z of [box.min.z,box.max.z]) {
      projected.expandByPoint(new THREE.Vector3(x,y,z).applyMatrix4(camera.matrixWorldInverse));
    }
    const size = projected.getSize(new THREE.Vector3());
    const padding = item.kind === 'ship' ? 1.06 : 1.12;
    // A rotational envelope prevents roots/rings from being cropped mid-orbit.
    const height = item.radius ? item.radius * 2.16 / Math.min(1,aspect) : Math.max(size.y, size.x / aspect) * padding;
    camera.left = -height * aspect / 2;
    camera.right = height * aspect / 2;
    camera.top = height / 2;
    camera.bottom = -height / 2;
    camera.updateProjectionMatrix();
  }

  setPaused(value) {
    this.paused = value;
    this.lastTime = 0;
    this.dirty = true;
    this.requestFrame();
  }

  /** Read the atlas layout even when a project's view currently occupies it. */
  atlasItems(world) {
    const galaxy = document.querySelector('#galaxia');
    const oldWorld = document.body.dataset.world;
    const hidden = galaxy.hidden;
    const visibility = galaxy.style.visibility;
    galaxy.style.visibility = 'hidden';
    galaxy.hidden = false;
    document.body.dataset.world = 'galaxy';
    const shipItem = this.items.find(item => item.kind === 'ship');
    const planetItem = this.items.find(item => item.kind === world && !item.mini);
    const originRect = shipItem.element.getBoundingClientRect();
    const destinationRect = planetItem.element.getBoundingClientRect();
    this.fit(shipItem,originRect.width / originRect.height);
    this.fit(planetItem,destinationRect.width / destinationRect.height);
    galaxy.hidden = hidden;
    galaxy.style.visibility = visibility;
    document.body.dataset.world = oldWorld;
    return { shipItem,planetItem,originRect,destinationRect };
  }

  startFlight({ world, fromWorld = 'galaxy', mode = 'enter', onUpdate, onReveal, onComplete }) {
    this.cancelFlight();
    if (!this.renderer || this.contextLost || this.paused) return false;
    const items = this.atlasItems(world === 'galaxy' ? fromWorld : world);
    const visual = new PlanetFlight(THREE,{ ...items,world:world === 'galaxy' ? fromWorld : world,fromWorld,mode,width:innerWidth,height:innerHeight,environment:this.environment.texture,elapsed:this.elapsed });
    this.journey = { visual,mode,progress:0,time:0,lastTime:0,onUpdate,onReveal,onComplete,planetItem:items.planetItem };
    this.requestFrame();
    return true;
  }

  cancelFlight() {
    this.journey?.visual.dispose();
    this.journey = null;
    this.items.forEach(item => item.pivot.scale.setScalar(1));
    this.dirty = true;
    this.requestFrame();
  }

  requestFrame() {
    if (!this.frame && this.renderer && !this.disposed && !document.hidden && !this.contextLost) {
      this.frame = requestAnimationFrame(time => this.draw(time));
    }
  }

  draw(time) {
    this.frame = 0;
    if (this.disposed || document.hidden || this.contextLost) return;
    if (!this.paused && this.lastTime && time - this.lastTime < 30 && !this.dirty) { this.requestFrame(); return; }
    const renderer = this.renderer;
    if (!this.paused && this.lastTime) this.elapsed += Math.min((time - this.lastTime) / 1000, .06);
    this.lastTime = time;
    if (this.dirty) {
      renderer.setSize(innerWidth,innerHeight,false);
      this.journey?.visual.resize(innerWidth,innerHeight);
      this.items.forEach(item => {
        item.rect = item.element.getBoundingClientRect();
        if (item.rect.width && item.rect.height) this.fit(item,item.rect.width / item.rect.height);
      });
      this.dirty = false;
    }
    renderer.setScissorTest(false);
    renderer.clear(true,true,true);
    const journey = this.journey;
    if (journey) {
      if (journey.lastTime) journey.time += Math.min(time - journey.lastTime,100);
      journey.lastTime = time;
      journey.progress = Math.min(1,journey.time / journey.visual.duration);
      const state = journey.visual.update(journey.progress,journey.time / 1000);
      journey.onUpdate?.(state,journey.progress);
      if (state.readyToReveal && !journey.revealed) {
        journey.revealed = true;
        journey.onReveal?.();
      }
    }
    this.look.x += (this.pointer.x - this.look.x) * .075;
    this.look.y += (this.pointer.y - this.look.y) * .075;
    renderer.setScissorTest(true);
    for (const item of this.items) {
      if (journey && !journey.revealed) {
        if (item.kind === 'ship') continue;
        if (journey.mode !== 'intro' && (item === journey.planetItem || journey.progress > .22)) continue;
      }
      const rect = item.rect;
      if (!rect || !rect.width || !rect.height || item.element.getClientRects().length === 0) continue;
      if (rect.bottom < 0 || rect.top > innerHeight) continue;
      if (item.kind === 'ship' && document.body.dataset.world !== 'galaxy') continue;
      const { pivot, model, kind } = item;
      const isCharacter = kind === 'ship';
      item.hover += (item.targetHover - item.hover) * .1;
      const t = this.elapsed;
      if (isCharacter) {
        pivot.rotation.y = kind === 'ship' ? -.13 + Math.sin(t * .3) * .11 : -.12 + Math.sin(t * .24) * .12;
        pivot.rotation.z = Math.sin(t * .44) * .025;
        pivot.position.y = Math.sin(t * .65) * .045;
        if (!this.paused && item.petAt !== undefined) {
          const petProgress = (t - item.petAt) / .85;
          if (petProgress < 1) pivot.rotation.z += Math.sin(petProgress * Math.PI * 4) * .09 * (1 - petProgress);
          else delete item.petAt;
        }
        if (!this.paused) {
          pivot.rotation.y += this.look.x * .18;
          pivot.rotation.x = this.look.y * .07;
          if (kind === 'ship' && this.destination?.rect) {
            pivot.rotation.z -= .09;
            pivot.rotation.y += .2;
          }
        }
      } else {
        const speed = kind === 'commissionmatch' ? .07 : .105;
        if (!item.drag && !this.paused) { item.rotation.y += item.velocity; item.velocity *= .93; }
        pivot.rotation.y = t * speed + item.rotation.y;
        pivot.rotation.x = item.rotation.x;
        pivot.rotation.z = kind === 'mangue' ? .06 : -.08;
        pivot.position.y = this.paused ? 0 : Math.sin(t * .65 + item.radius) * .025;
      }
      model.userData.animate?.(t, this.paused ? 0 : item.hover, { lookX:this.paused ? 0 : this.look.x,lookY:this.paused ? 0 : this.look.y,thrust:this.destination ? .48 : .08,wave:item.hover,pet:item.petAt !== undefined ? Math.max(0,1 - (t-item.petAt)/1.4) : 0,dragging:!!item.drag });
      const departureScale = journey && !journey.revealed && journey.mode !== 'intro' ? 1 - THREE.MathUtils.smoothstep(journey.progress,0,.22) : 1;
      pivot.scale.setScalar((this.paused ? 1 : 1 + item.hover * .055) * departureScale);
      renderer.setViewport(rect.left, innerHeight - rect.bottom, rect.width, rect.height);
      renderer.setScissor(rect.left, innerHeight - rect.bottom, rect.width, rect.height);
      renderer.render(item.scene, item.camera);
    }
    renderer.setScissorTest(false);
    if (journey && !journey.revealed) {
      renderer.setViewport(0,0,innerWidth,innerHeight);
      renderer.clearDepth();
      renderer.render(journey.visual.scene,journey.visual.camera);
    }
    document.body.dataset.renderMode = 'webgl';
    if (journey?.progress === 1) journey.onComplete?.();
    if (!this.paused) this.requestFrame();
  }

  dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.frame);
    this.journey?.visual.dispose();
    this.observer?.disconnect();
    this.resizeObserver?.disconnect();
    removeEventListener('resize', this.onResize);
    removeEventListener('pointermove', this.onPointer);
    document.removeEventListener('visibilitychange', this.onVisibility);
    const geometries = new Set(), materials = new Set(), textures = new Set();
    this.items.forEach(item => {
      item.cleanup();
      item.model.userData.disposeAnimation?.();
      item.scene.traverse(object => {
        if (object.isSkinnedMesh) object.skeleton.dispose();
        if (object.geometry) geometries.add(object.geometry);
        if (object.material) (Array.isArray(object.material) ? object.material : [object.material]).forEach(material => {
          materials.add(material);
          Object.values(material).forEach(value => { if (value?.isTexture) textures.add(value); });
        });
        object.shadow?.dispose();
      });
    });
    geometries.forEach(geometry => geometry.dispose());
    materials.forEach(material => material.dispose());
    textures.forEach(texture => texture.dispose());
    this.environment?.dispose();
    this.renderer?.dispose();
    this.canvas.remove();
  }
}
