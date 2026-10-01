// Mangue: O Manguezal das Histórias. An open manuscript: the left page tells the story, the right page is a
// mangrove whose roots are the story's branches. Turning the leaf shows the same story the way its author sees it.

// Positions are in the art's own pixels (assets/art/mangue-manuscript.webp, 1170x695).
export const ART = { width:1170, height:695 };
export const TRUNK = [825, 340];

export const story = Object.freeze({
  start:{ numeral:'I', name:'À margem', at:TRUNK,
    text:['A maré baixou de madrugada e deixou uma carta presa entre as raízes, lacrada com cera verde. No envelope, um nome só: o do faroleiro que ninguém vê há dez anos.','Morfeu cheirou o papel e miou para o canal, onde uma lanterna velha boiava, apagada.'],
    cat:'Isso aí tem cheiro de segredo.',
    choices:[{ id:'ler', label:'Abrir a carta ali mesmo', to:'carta' },{ id:'pescar', label:'Pescar a lanterna no canal', to:'lanterna' }] },
  carta:{ numeral:'II', name:'A carta', at:[712, 402], sets:'carta',
    text:['A letra é torta, de quem escreveu no escuro: “Se a luz do farol voltar, eu volto. — Iara.”','Um caranguejo atravessa a lama bem devagar, como quem não quer se meter.'],
    cat:'Iara… esse nome eu conheço da feira.',
    choices:[{ id:'responder', label:'Responder no verso e devolver à maré', to:'mare' },{ id:'levar', label:'Pescar a lanterna e ir até o farol', to:'lanterna' },{ id:'guardar', label:'Deixar a carta onde estava', to:'embora' }] },
  lanterna:{ numeral:'III', name:'A lanterna', at:[905, 392], sets:'lanterna',
    text:['A lanterna está seca por dentro, com um resto de óleo. Acesa, pinta o mangue de cobre. Longe, alguém toca tambor na lama.','Do outro lado do canal, o farol continua escuro.'],
    cat:'Eu seguro a lanterna. Você rema.',
    choices:[{ id:'tambores', label:'Seguir os tambores', to:'baile' },{ id:'remar', label:'Remar até o farol', to:'farol' }] },
  farol:{ numeral:'IV', name:'O farol apagado', at:[985, 440],
    text:['O faroleiro abre a porta antes da primeira batida. Tem os olhos de quem esperou muito tempo.','Lá em cima, a lente está limpa. Só falta o fogo.'],
    cat:'Cento e doze degraus. Contei.',
    choices:[{ id:'entregar', label:'Entregar a carta', to:'amizade' },{ id:'acender', label:'Acender o farol com a lanterna', to:'luz', requires:'carta', lock:'requer ter lido a carta' }] },
  embora:{ numeral:'Fim', name:'Nem toda carta é pra gente', ending:true, at:[645, 478],
    text:['Você deixa a carta onde estava. Morfeu olha para trás duas vezes.','Algumas histórias seguem muito bem sem a gente.'], cat:'Tá bom. Mas eu fiquei curioso.' },
  mare:{ numeral:'Fim', name:'Correio da maré', ending:true, at:[720, 478],
    text:['No verso você escreve “ele ainda espera” e solta a carta na água. A maré leva.','Dizem que ela sempre entrega.'], cat:'A maré é mais rápida que o correio.' },
  baile:{ numeral:'Fim', name:'O baile na lama', ending:true, at:[866, 478],
    text:['Os tambores levam você a uma roda de pescadores, caranguejos e antenas fincadas na lama. Você dança até o sol nascer.','A carta fica pra amanhã.'], cat:'Eu não danço. Mas balancei o rabo.' },
  amizade:{ numeral:'Fim', name:'Uma velha amizade', ending:true, at:[940, 478],
    text:['Ele lê a carta três vezes. Depois põe duas xícaras na mesa e fica olhando a porta.','Por enquanto, basta saber que ela lembra.'], cat:'Duas xícaras. Nenhuma pra mim.' },
  luz:{ numeral:'Fim', name:'Uma nova luz', ending:true, secret:true, at:[1013, 478],
    text:['Você acende o farol. A luz varre o mangue inteiro e, lá longe, um barco muda de rumo.','De manhã, alguém bate na porta. É Iara.'], cat:'O fim escondido! Eu sabia que existia.' }
});

// A visitor may plant one branch of their own, from whichever scene they are writing in.
export const CUSTOM = { id:'seu', at:[793, 478] };

export const endings = Object.keys(story).filter(id => story[id].ending);

export function graph(custom) {
  if (!custom) return story;
  const from = story[custom.from];
  return {
    ...story,
    [custom.from]:{ ...from, choices:[...from.choices, { id:'seu', label:custom.label, to:'seu', custom:true }] },
    seu:{ numeral:'Fim', name:'Seu final', ending:true, custom:true, at:CUSTOM.at, text:[custom.text], cat:'Essa raiz foi você que plantou.' }
  };
}

export function createState() {
  return { node:'start', path:['start'], grown:[], found:[], routes:{ start:['start'] } };
}

const flagsOf = (path, nodes) => new Set(path.map(id => nodes[id]?.sets).filter(Boolean));

export function isOpen(state, choice, nodes = story) {
  return !choice.requires || flagsOf(state.path, nodes).has(choice.requires);
}

export function choose(state, choiceId, nodes = story) {
  const choice = nodes[state.node]?.choices?.find(item => item.id === choiceId);
  if (!choice || !isOpen(state, choice, nodes)) return state;
  const path = [...state.path, choice.to];
  const edge = `${state.node}>${choice.to}`;
  return {
    node:choice.to, path,
    grown:state.grown.includes(edge) ? state.grown : [...state.grown, edge],
    found:nodes[choice.to].ending && !state.found.includes(choice.to) ? [...state.found, choice.to] : state.found,
    routes:{ ...state.routes, [choice.to]:path }
  };
}

// Clicking a root you have already grown takes you back there, along the way you last came.
export function rewind(state, nodeId) {
  const route = state.routes[nodeId];
  return route ? { ...state, node:nodeId, path:route } : state;
}

export function forget(state, nodeId) {
  const drop = edge => edge.endsWith('>' + nodeId);
  const { [nodeId]:_, ...routes } = state.routes;
  const onIt = state.node === nodeId;
  return { ...state, grown:state.grown.filter(edge => !drop(edge)), found:state.found.filter(id => id !== nodeId), routes, ...(onIt ? { node:state.path.at(-2), path:state.path.slice(0, -1) } : {}) };
}

export function endingsLabel(found) {
  const count = found.filter(id => endings.includes(id)).length;
  if (!count) return found.includes('seu') ? `Só o seu final, por enquanto. Faltam ${endings.length}.` : `Nenhum dos ${endings.length} finais, ainda.`;
  return `${count} de ${endings.length} finais${found.includes('seu') ? ', mais o seu' : ''}.`;
}

// A root arches out of its parent and falls toward the child, like a mangrove prop root.
export function rootPath([px, py], [cx, cy]) {
  const r = n => Math.round(n);
  return `M${px} ${py}C${r(px + (cx - px) * .65)} ${r(py + 6)} ${cx} ${r(cy - (cy - py) * .7)} ${cx} ${cy}`;
}

export function edgesOf(nodes) {
  return Object.entries(nodes).flatMap(([from, node]) => (node.choices || []).map(choice => ({ from, to:choice.to, key:`${from}>${choice.to}`, choice })));
}

const esc = text => text.replace(/[&<>"]/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' })[char]);
const pct = ([x, y]) => `--x:${(x / ART.width * 100).toFixed(2)}%;--y:${(y / ART.height * 100).toFixed(2)}%`;
const hand = '<span class="folio-hand" aria-hidden="true">☞</span>';
const lock = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="1"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>';

export function setupMangue() {
  const $ = selector => document.querySelector(selector);
  const view = $('#mangue');
  if (!view) return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const saved = (() => { try { return JSON.parse(localStorage.getItem('mangue-branch')); } catch { return null; } })();
  let custom = saved?.from && story[saved.from] && !story[saved.from].ending ? saved : null;
  let nodes = graph(custom), state = createState(), mode = 'read', page = 'story', turning = false, lastGrown = null, drafting = false;

  const roots = $('#folio-roots'), knots = $('#folio-knots');

  function drawTree() {
    const edges = edgesOf(nodes);
    const visible = edge => mode === 'write' || state.routes[edge.from];
    roots.querySelector('.roots-story').innerHTML = edges.filter(visible).map(edge => {
      const grown = state.grown.includes(edge.key), onPath = state.path.some((id, i) => state.path[i + 1] === edge.to && id === edge.from);
      const cls = grown ? `root is-grown${onPath ? ' is-path' : ''}${edge.key === lastGrown ? ' is-new' : ''}${edge.choice.custom ? ' is-custom' : ''}` : 'root is-pencil';
      return `<path class="${cls}" pathLength="1" d="${rootPath(nodes[edge.from].at, nodes[edge.to].at)}"/>`;
    }).join('');
    lastGrown = null;
    knots.innerHTML = Object.entries(nodes).filter(([id]) => mode === 'write' || state.routes[id] || edges.some(edge => edge.to === id && state.routes[edge.from])).map(([id, node]) => {
      const known = !!state.routes[id], here = state.node === id;
      const label = known || mode === 'write' ? (node.ending ? (known ? node.name : 'Fim ainda não lido') : `${node.numeral} · ${node.name}`) : '?';
      const kind = node.ending ? 'propagule' : 'knot';
      const aria = known ? `${label}${here ? ', você está aqui' : ', voltar para cá'}` : `${node.ending ? 'Um fim' : 'Uma cena'} que você ainda não leu`;
      return `<button type="button" class="${kind}${known ? ' is-known' : ''}${here ? ' is-here' : ''}${node.secret ? ' is-secret' : ''}${node.custom ? ' is-custom' : ''}" data-node="${id}" style="${pct(node.at)}" ${known ? '' : 'aria-disabled="true"'} aria-label="${esc(aria)}"><i aria-hidden="true"></i><span aria-hidden="true">${esc(label)}</span></button>`;
    }).join('');
    $('#folio-count').textContent = endingsLabel(state.found);
  }

  function renderRead() {
    const node = nodes[state.node];
    const [first, ...rest] = node.text;
    const choices = (node.choices || []).map(choice => {
      const open = isOpen(state, choice, nodes);
      const seen = state.grown.includes(`${state.node}>${choice.to}`);
      return `<button type="button" class="folio-choice${open ? '' : ' is-locked'}${seen ? ' is-seen' : ''}${choice.custom ? ' is-custom' : ''}" data-choice="${choice.id}" ${open ? '' : 'aria-disabled="true"'}>${hand}<span>${esc(choice.label)}</span>${open ? '' : `<em class="folio-seal">${lock}${esc(choice.lock)}</em>`}</button>`;
    }).join('');
    const lead = node.secret ? 'Você achou o fim escondido.' : node.custom ? 'Este fim foi você que escreveu.' : 'Fim deste caminho.';
    const more = state.found.length >= endings.length && !state.found.includes('seu') ? ' Agora vire a página e escreva o seu.' : '';
    const ending = node.ending ? `<p class="folio-end">${lead} Clique numa raiz para voltar, ou <button type="button" data-action="restart">recomece</button>.${more}</p>` : '';
    $('#folio-scene').innerHTML = `<p class="folio-chapter">${node.ending ? (node.secret ? 'Fim secreto' : 'Fim') : `Capítulo ${node.numeral}`} · <em>${esc(node.name)}</em></p>`
      + `<p class="folio-lead"><span class="folio-initial" aria-hidden="true">${esc(first[0])}</span>${esc(first.slice(1))}</p>`
      + rest.map(text => `<p>${esc(text)}</p>`).join('')
      + (choices ? `<p class="folio-ask">O que você faz?</p><div class="folio-choices">${choices}</div>` : ending);
    $('#folio-scene .folio-lead').setAttribute('aria-label', first);
    $('#folio-cat-line').textContent = node.cat;
  }

  function renderWrite() {
    const from = nodes[state.node].ending ? state.path.at(-2) : state.node;
    const rows = Object.entries(nodes).filter(([, node]) => !node.ending).map(([id, node]) => {
      const out = node.choices.map(choice => {
        const target = nodes[choice.to];
        const name = target.ending ? (state.routes[choice.to] ? target.name : 'um fim') : `${target.numeral}`;
        return `<li class="${choice.custom ? 'is-custom' : ''}"><span>${esc(choice.label)}</span><b>→ ${target.ending ? `<i>${esc(name)}</i>` : esc(name)}</b>${choice.requires ? `<em class="folio-seal">${lock}${esc(choice.lock.replace('requer ', 'se '))}</em>` : ''}</li>`;
      }).join('');
      return `<li class="draft-scene${state.node === id ? ' is-here' : ''}"><p><b>${node.numeral}</b> ${esc(node.name)}${node.sets ? `<small>marca: ${esc(node.sets)}</small>` : ''}</p><ul>${out}</ul></li>`;
    }).join('');
    const where = `<b>${nodes[from].numeral} · ${esc(nodes[from].name)}</b>`;
    $('#folio-scene').innerHTML = `<p class="folio-chapter">Folha de rascunho · <em>como o autor vê</em></p>` + (drafting
      ? `<form class="draft-form" id="draft-form"><p class="draft-from">Uma raiz nova a partir de ${where}${custom ? ' <small>(substitui a sua anterior)</small>' : ''}</p>`
      + `<label><span>A escolha</span><input name="label" maxlength="48" required placeholder="Seguir o caranguejo" autocomplete="off"></label>`
      + `<label><span>E então…</span><textarea name="text" maxlength="180" rows="2" required placeholder="O caranguejo leva você até um barco virado, cheio de cartas."></textarea></label>`
      + `<div class="draft-actions"><button type="submit">Plantar esta raiz</button>${custom ? '<button type="button" data-action="uproot">Arrancar a minha</button>' : ''}</div><input type="hidden" name="from" value="${from}"></form><p class="draft-back"><button type="button" data-action="list">← voltar ao rascunho</button></p>`
      : `<p class="draft-intro">Cenas, escolhas e marcas: a chave <i>se</i> abre um caminho só para quem passou por outro.</p><ol class="draft-list">${rows}</ol>`
        + `<p class="draft-cta"><button type="button" data-action="draft">✎ Escrever um caminho novo a partir de ${where}</button></p>`);
    $('#folio-cat-line').textContent = 'Os autores veem os fios todos. Eu só vejo peixe.';
  }

  function render({ focus = false } = {}) {
    view.dataset.mode = mode;
    view.dataset.page = page;
    if (mode === 'read') renderRead(); else renderWrite();
    drawTree();
    const depth = Math.min(state.path.length - 1, 4);
    $('#folio-cat').style.setProperty('--walk', depth);
    $('#folio-cat').dataset.pose = nodes[state.node].ending ? 'sit' : 'walk';
    $('#folio-cat').classList.remove('is-stepping'); void $('#folio-cat').offsetWidth; $('#folio-cat').classList.add('is-stepping');
    $('#folio-turn').setAttribute('aria-pressed', String(mode === 'write'));
    $('#folio-turn-label').textContent = mode === 'write' ? 'Voltar a ler' : 'Virar a página';
    $('#folio-turn-hint').textContent = mode === 'write' ? 'e ler a história' : 'e ver como se escreve';
    view.querySelector('[data-turn]').textContent = mode === 'write' ? 'Ler' : 'Escrever';
    $('#folio-status').textContent = mode === 'write' ? 'Folha de rascunho: a estrutura da história, como o autor vê.' : `${nodes[state.node].name}. ${endingsLabel(state.found)}`;
    if (focus) $('#mangue-scene-anchor').focus({ preventScroll:true });
  }

  function turn() {
    if (turning) return;
    drafting = false;
    const next = mode === 'read' ? 'write' : 'read';
    if (reduced.matches || document.body.classList.contains('motion-paused')) { mode = next; render({ focus:true }); return; }
    turning = true;
    const leaf = $('#folio-leaf');
    leaf.dataset.dir = next === 'write' ? 'forward' : 'back';
    leaf.hidden = false;
    leaf.classList.remove('is-turning'); void leaf.offsetWidth; leaf.classList.add('is-turning');
    setTimeout(() => { mode = next; render({ focus:true }); }, 420);
    leaf.addEventListener('animationend', () => { leaf.hidden = true; leaf.classList.remove('is-turning'); turning = false; }, { once:true });
  }

  function go(next, { focus = true } = {}) {
    const before = state.grown.length;
    state = next;
    if (state.grown.length > before) lastGrown = state.grown.at(-1);
    render({ focus });
  }

  view.addEventListener('click', event => {
    const choice = event.target.closest('[data-choice]');
    if (choice) {
      const target = nodes[state.node].choices.find(item => item.id === choice.dataset.choice);
      if (!isOpen(state, target, nodes)) {
        $('#folio-cat-line').textContent = 'Essa porta está lacrada. Volte por uma raiz e leia a carta primeiro.';
        choice.classList.remove('is-shaking'); void choice.offsetWidth; choice.classList.add('is-shaking');
        return;
      }
      go(choose(state, choice.dataset.choice, nodes));
      return;
    }
    const knot = event.target.closest('[data-node]');
    if (knot && state.routes[knot.dataset.node]) { mode = 'read'; page = 'story'; go(rewind(state, knot.dataset.node)); return; }
    const action = event.target.closest('[data-action]')?.dataset.action;
    if (action === 'draft' || action === 'list') {
      drafting = action === 'draft';
      render();
      if (drafting) $('#draft-form input[name=label]').focus();
      else $('[data-action=draft]')?.focus();
      return;
    }
    if (action === 'restart') go({ ...createState(), grown:state.grown, found:state.found, routes:state.routes });
    if (action === 'uproot') {
      state = forget(state, 'seu');
      custom = null; nodes = graph(null);
      try { localStorage.removeItem('mangue-branch'); } catch {}
      render();
    }
  });
  view.addEventListener('submit', event => {
    event.preventDefault();
    const data = new FormData(event.target);
    const label = String(data.get('label')).trim(), text = String(data.get('text')).trim();
    if (!label || !text) return;
    if (custom) state = forget(state, 'seu');
    custom = { from:String(data.get('from')), label, text };
    nodes = graph(custom);
    try { localStorage.setItem('mangue-branch', JSON.stringify(custom)); } catch {}
    state = rewind(state, custom.from);
    drafting = false;
    turn();
    $('#folio-cat-line').textContent = 'Sua raiz está na página. Escolha ela.';
  });
  $('#folio-turn').addEventListener('click', turn);
  view.querySelector('[data-turn]').addEventListener('click', () => { page = 'story'; turn(); });
  view.querySelectorAll('[data-page]').forEach(button => button.addEventListener('click', () => { page = button.dataset.page; render(); }));

  render();
}
