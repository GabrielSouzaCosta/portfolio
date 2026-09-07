import { StudioObjects } from './three/scene.js';
import { Starfield } from './stars.js';
import { setupDemos } from './demos.js';
import { routeFromHash } from './story.js';
import { loadShipAsset } from './three/ship-asset.js';

function startStudio() {
const $ = selector => document.querySelector(selector);
const stars = new Starfield($('#space-canvas'));
const objects = new StudioObjects();
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const names = { galaxy:'Galáxia', cindra:'Cindra', commissionmatch:'CommissionMatch', mangue:'Mangue' };
const order = ['galaxy', 'cindra', 'commissionmatch', 'mangue'];
const visited = new Set();
const readPreference = key => { try { return localStorage.getItem(key); } catch { return null; } };
const savePreference = (key, value) => { try { localStorage.setItem(key, value); } catch {} };
let paused = reduced.matches || readPreference('goiaba-motion') === 'paused';
let current = 'galaxy', lastPlanet = 'cindra', flight = null, arriving = false, petTimer;
const arrivalColors = { galaxy:'#091016',cindra:'#f0ede5',commissionmatch:'#1b211a',mangue:'#0b2c24' };

function setMotion(value, { save = false } = {}) {
  paused = value;
  document.body.classList.toggle('motion-paused', paused);
  stars.setPaused(paused);
  objects.setPaused(paused);
  $('#motion-toggle').setAttribute('aria-pressed', String(paused));
  const label = paused ? 'Retomar movimento' : 'Pausar movimento';
  $('#motion-toggle').setAttribute('aria-label', label);
  $('#motion-toggle').title = label;
  $('#replay-arrival').disabled = paused;
  if (paused) { completeFlight(); endArrival(); }
  if (save) savePreference('goiaba-motion', paused ? 'paused' : 'running');
}

$('#motion-toggle').addEventListener('click', () => setMotion(!paused, { save:true }));
reduced.addEventListener('change', event => { if (event.matches) setMotion(true); });

function syncRoute() {
  document.querySelectorAll('[data-route]').forEach(link => {
    const active = link.dataset.route === current;
    if (active) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
    link.toggleAttribute('data-visited', visited.has(link.dataset.route));
    link.toggleAttribute('data-pending', flight?.world === link.dataset.route);
  });
  if (current === 'galaxy') $('.route-home').setAttribute('aria-current', 'page');
  else $('.route-home').removeAttribute('aria-current');
  const next = order[(order.indexOf(current) + 1) % order.length];
  const label = next === 'galaxy' ? 'Voltar à galáxia' : (current === 'galaxy' ? 'Começar por ' : 'Seguir para ') + names[next];
  $('#route-next').href = '#' + (next === 'galaxy' ? 'galaxia' : next);
  $('#route-next-label').textContent = label;
  $('#route-next').setAttribute('aria-label', label);
}

function showWorld(world, { focus = false } = {}) {
  const old = current;
  current = world;
  document.body.dataset.world = world;
  $('#galaxia').hidden = world !== 'galaxy';
  document.querySelectorAll('[data-view]').forEach(view => { view.hidden = view.dataset.view !== world; });
  if (world !== 'galaxy') { lastPlanet = world; visited.add(world); }
  document.title = world === 'galaxy' ? 'Goiaba Lunar — ideias fora de órbita' : `${names[world]} · Goiaba Lunar`;
  syncRoute();
  $('#navigation-status').textContent = world === 'galaxy' ? 'Você está na galáxia. Escolha um destino.' : `Você chegou a ${names[world]}. A rota para continuar está na base da tela.`;
  if (focus) {
    const target = world === 'galaxy' ? $(`[data-planet="${old === 'galaxy' ? lastPlanet : old}"]`) : $(`[data-view="${world}"] h2`);
    target?.focus({ preventScroll:true });
  }
}

function clearFlight() {
  objects.cancelFlight();
  flight = null;
  document.body.classList.remove('is-traveling','flight-revealed');
  delete document.body.dataset.flightPhase;
  document.body.style.removeProperty('--flight-wash');
  document.body.style.removeProperty('--flight-copy');
  $('#main-content').removeAttribute('aria-busy');
  $('#main-content').inert = false;
  $('#skip-flight').hidden = true;
  $('#flight-caption').hidden = true;
  stars.endWarp();
}

function completeFlight() {
  if (!flight) return;
  const { world, focus } = flight;
  clearFlight();
  showWorld(world, { focus });
}

function navigate({ instant = false, focus = true } = {}) {
  const world = routeFromHash(location.hash);
  if (location.hash && !['#galaxia', '#cindra', '#commissionmatch', '#mangue'].includes(location.hash)) history.replaceState(null, '', '#galaxia');
  endArrival();
  clearFlight();
  if (paused || instant || world === current) { showWorld(world, { focus }); return; }

  flight = { world, focus };
  const activeFlight = flight;
  const started = objects.startFlight({
    world,fromWorld:current,mode:world === 'galaxy' ? 'return' : 'enter',
    onUpdate(state,progress) {
      if (flight !== activeFlight) return;
      document.body.dataset.flightPhase = state.phase;
      document.body.style.setProperty('--flight-wash',state.wash);
      document.body.style.setProperty('--flight-copy',activeFlight.revealed ? Math.max(0,1-state.wash) : Math.max(0,1-progress/.18));
      const copy = { launch:'Morfeu, preparar os motores.',cruise:`Rota traçada para ${names[world]}.`,approach:`Estamos chegando a ${names[world]}.`,entry:'Atravessando a atmosfera.',reveal:`Bem-vindo a ${names[world]}.` };
      $('#flight-caption').textContent = copy[state.phase];
    },
    onReveal() {
      if (flight !== activeFlight) return;
      activeFlight.revealed = true;
      showWorld(world);
      document.body.classList.add('flight-revealed');
    },
    onComplete() { if (flight === activeFlight) completeFlight(); }
  });
  if (!started) { completeFlight(); return; }
  document.body.style.setProperty('--arrival-color',arrivalColors[world]);
  document.body.style.setProperty('--flight-copy','1');
  document.body.style.setProperty('--flight-wash','0');
  document.body.classList.add('is-traveling');
  $('#main-content').setAttribute('aria-busy', 'true');
  $('#navigation-status').textContent = `A caminho de ${names[world]}.`;
  $('#skip-flight').hidden = false;
  $('#flight-caption').hidden = false;
  $('#skip-flight').focus({ preventScroll:true });
  $('#main-content').inert = true;
  syncRoute();
}

function endArrival() {
  if (arriving) objects.cancelFlight();
  arriving = false;
  $('#arrival').hidden = true;
  document.body.classList.remove('is-arriving');
}

function startArrival() {
  if (paused) return;
  completeFlight();
  if (current !== 'galaxy') return;
  endArrival();
  arriving = objects.startFlight({ world:lastPlanet,mode:'intro',onComplete:endArrival });
  document.body.classList.toggle('is-arriving',arriving);
  try { sessionStorage.setItem('goiaba-arrived', 'yes'); } catch {}
}

addEventListener('hashchange', () => navigate());
$('#skip-flight').addEventListener('click', completeFlight);
$('#replay-arrival').addEventListener('click', startArrival);
$('#skip-arrival').addEventListener('click', () => { endArrival(); $('#route-next').focus({ preventScroll:true }); });
$('.skip-link').addEventListener('click', event => { event.preventDefault(); $('#main-content').focus({ preventScroll:true }); });
addEventListener('keydown', event => {
  if (event.key !== 'Escape') return;
  if (arriving) endArrival();
  else if (flight) completeFlight();
});
const petMessages = ['Boa rota. Ótima companhia.', 'O capitão aprova esse carinho.', 'Próxima missão: descobrir algo novo.'];
let pet = 0;
$('#morfeu-button').addEventListener('click', () => {
  clearTimeout(petTimer);
  $('#morfeu').classList.remove('is-petted');
  void $('#morfeu').offsetWidth;
  $('#morfeu').classList.add('is-petted');
  $('#morfeu-message').textContent = petMessages[pet++ % petMessages.length];
  petTimer = setTimeout(() => { $('#morfeu').classList.remove('is-petted'); $('#morfeu-message').innerHTML = 'Escolha um mundo.<br>Eu vou com você.'; }, 3600);
});
document.addEventListener('visibilitychange', () => {
  document.body.classList.toggle('tab-inactive', document.hidden);
  stars.visibility();
});
let arrived = false;
try { arrived = sessionStorage.getItem('goiaba-arrived') === 'yes'; } catch {}
setupDemos();
setMotion(paused);
navigate({ instant:true, focus:!!location.hash });
if (!location.hash && !arrived && !paused) startArrival();
}

loadShipAsset().catch(error => console.warn('Morfeu: usando o modelo de reserva.', error)).finally(startStudio);
