import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
const canvas = document.querySelector('canvas');
const status = document.querySelector('#status');
const play = document.querySelector('#play');
const time = document.querySelector('#time');
try {
  const renderer = new THREE.WebGLRenderer({canvas, antialias: true});
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setClearColor('#1c2830');
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.VSMShadowMap;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, 1, .01, 100);
  const controls = new OrbitControls(camera, canvas);
  controls.maxPolarAngle = Math.PI * .49;
  const pmrem = new THREE.PMREMGenerator(renderer);
  const environment = new RoomEnvironment();
  const environmentMap = pmrem.fromScene(environment, .04);
  scene.environment = environmentMap.texture;
  scene.environmentIntensity = .45;
  environment.dispose(); pmrem.dispose();
  scene.add(new THREE.HemisphereLight('#fff4dc', '#738693', .8));
  const key = new THREE.DirectionalLight('#fff4e8', 2.8);
  key.position.set(-3, 7, 5); key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  Object.assign(key.shadow.camera, {left:-4,right:4,top:4,bottom:-4,near:.1,far:20});
  key.shadow.radius = 4;
  key.shadow.blurSamples = 8;
  key.shadow.normalBias = .015;
  key.shadow.bias = -.0001;
  scene.add(key);
  const fill = new THREE.DirectionalLight('#c5eaff', 1.2);
  fill.position.set(4, 3, -3); scene.add(fill);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), new THREE.ShadowMaterial({color:'#060e16',opacity:.27}));
  floor.rotation.x = -Math.PI/2; floor.position.y = -.035; floor.receiveShadow = true; scene.add(floor);
  let current, mixer, duration = 6, span = 3, request = 0, frame = 0, last = 0;
  let playing = !matchMedia('(prefers-reduced-motion: reduce)').matches;
  const loader = new GLTFLoader();
  function draw() { renderer.render(scene,camera); }
  function setView(which = 'quarter') {
    const d = span * (which === 'front' ? 2.05 : 1.8) / Math.min(1,camera.aspect);
    const vector = which === 'front' ? [0,.06,1] : which === 'rear' ? [.58,.28,-1] : [.52,.22,1];
    camera.position.copy(controls.target).add(new THREE.Vector3(...vector).multiplyScalar(d));
    controls.update(); draw();
  }
  function resize() {
    renderer.setSize(canvas.clientWidth,canvas.clientHeight,false);
    camera.aspect=canvas.clientWidth/canvas.clientHeight; camera.updateProjectionMatrix(); setView();
  }
  function dispose(root) {
    const geometries=new Set(),materials=new Set(),textures=new Set();
    root.traverse(o=>{
      if(o.geometry) geometries.add(o.geometry);
      if(o.material) (Array.isArray(o.material)?o.material:[o.material]).forEach(m=>{
        materials.add(m); for(const v of Object.values(m)) if(v?.isTexture) textures.add(v);
      });
      if(o.skeleton) o.skeleton.dispose();
    });
    geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());
  }
  function tick(now) {
    frame=0;
    if(!playing || document.hidden) return;
    if(mixer) {mixer.update(Math.min((now-last)/1000,.05));time.value=mixer.time%duration;}
    last=now;draw();frame=requestAnimationFrame(tick);
  }
  function syncPlayback() {
    cancelAnimationFrame(frame);frame=0;
    play.textContent=playing?'Pausar movimento':'Animar Morfeu';play.setAttribute('aria-pressed',String(playing));
    if(playing&&!document.hidden){last=performance.now();frame=requestAnimationFrame(tick);}
    draw();
  }
  async function load(name) {
    const ticket=++request;status.textContent='Carregando modelo…';
    try {
      const gltf=await loader.loadAsync('../../assets/models/'+name);
      if(ticket!==request){dispose(gltf.scene);return;}
      if(current){mixer?.stopAllAction();mixer?.uncacheRoot(current);scene.remove(current);dispose(current);}
      current=gltf.scene;scene.add(current);
      current.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=false;}});
      const bounds=new THREE.Box3().setFromObject(current),size=bounds.getSize(new THREE.Vector3());
      bounds.getCenter(controls.target);span=Math.max(size.x,size.y,size.z);
      mixer=new THREE.AnimationMixer(current);
      for(const clip of gltf.animations)mixer.clipAction(clip).play();
      duration=gltf.animations[0]?.duration||6;time.max=duration;time.value=0;
      setView();syncPlayback();
      document.querySelectorAll('[data-model]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.model===name)));
      document.querySelector('#download').href='../../assets/models/'+name;
      window.modelCheck={loaded:name,meshes:0,triangles:0,bones:0,clips:gltf.animations.map(c=>({name:c.name,duration:c.duration,tracks:c.tracks.length}))};
      current.traverse(o=>{if(o.isBone)window.modelCheck.bones++;if(o.isMesh){window.modelCheck.meshes++;window.modelCheck.triangles+=(o.geometry.index?.count??o.geometry.attributes.position.count)/3;}});
      window.previewTest = {seek(value){playing=false;syncPlayback();mixer.setTime(value);time.value=value;draw();},pose(){return current.getObjectByName('head')?.quaternion.toArray();},morphs(){const values=[];current.traverse(o=>{if(o.morphTargetInfluences)values.push({name:o.name,values:[...o.morphTargetInfluences]});});return values;},info(){return renderer.info.render;}};
      status.textContent='Respiração, olhar, piscada e cauda disponíveis na prévia.';
    } catch(error) {status.textContent='O modelo não carregou. Recarregue a página para tentar novamente.';console.error(error);}
  }
  document.querySelectorAll('[data-model]').forEach(b=>b.onclick=()=>load(b.dataset.model));
  document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>setView(b.dataset.view));
  play.onclick=()=>{playing=!playing;syncPlayback();};
  time.oninput=()=>{playing=false;syncPlayback();mixer?.setTime(Number(time.value));draw();};
  controls.addEventListener('change',draw);window.addEventListener('resize',resize);
  document.addEventListener('visibilitychange',syncPlayback);
  resize();load('morfeu-rigged-v04.glb');
} catch(error) {status.textContent='A prévia precisa de WebGL disponível neste navegador.';console.error(error);}
