import { story, createStoryState, chooseStory } from './story.js';

const arrow = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14m-5-5 5 5-5 5"/></svg>';
const thoughts = {
  day:{ text:'Amanhã tenho uma reunião às 10h. Gastei R$ 32 no almoço e quero estudar espanhol esta semana.', areas:['Agenda','Finanças','Aprendizado'], items:['Reunião amanhã, às 10h','Almoço · R$ 32','Estudar espanhol esta semana'] },
  project:{ text:'Quero tirar meu projeto do papel: reservar uma tarde na sexta, separar R$ 150 e aprender o básico de fotografia.', areas:['Agenda','Finanças','Aprendizado'], items:['Uma tarde para o projeto · sexta','Reservar R$ 150 para o projeto','Aprender o básico de fotografia'] }
};

export function setupDemos() {
  const $ = selector => document.querySelector(selector);
  let thought = 'day';
  function resetCindra() {
    $('#cindra-demo').dataset.phase = 'idle';
    $('#thought-copy').textContent = thoughts[thought].text;
    $('#thought-review').hidden = true;
    $('#organize-thought').hidden = false;
    $('#reset-cindra').hidden = true;
    $('#cindra-status').textContent = 'Uma pequena experiência de organização, com dados de exemplo.';
    $('.ember-welcome p').textContent = 'O que está passando pela sua cabeça?';
    $('.ember-welcome span').textContent = 'Escolha um pensamento. A gente encontra um lugar.';
    [...$('#life-areas').children].forEach((area, index) => {
      area.classList.remove('has-item');
      area.querySelector('p').textContent = ['Um espaço no seu dia.','Cada detalhe no lugar.','Um pouco, todos os dias.'][index];
    });
  }
  document.querySelectorAll('[data-thought]').forEach(button => button.addEventListener('click', () => {
    thought = button.dataset.thought;
    document.querySelectorAll('[data-thought]').forEach(item => { item.classList.toggle('active', item === button); item.setAttribute('aria-pressed', String(item === button)); });
    resetCindra();
  }));
  $('#organize-thought').addEventListener('click', () => {
    $('#review-items').replaceChildren();
    thoughts[thought].items.forEach((text, index) => {
      const label = document.createElement('label');
      label.className = 'review-item';
      const input = document.createElement('input');
      input.type = 'checkbox'; input.checked = true; input.dataset.item = String(index);
      const span = document.createElement('span');
      const strong = document.createElement('strong');
      strong.textContent = thoughts[thought].areas[index];
      span.append(strong, document.createTextNode(text));
      label.append(input, span);
      $('#review-items').append(label);
    });
    $('#cindra-demo').dataset.phase = 'review';
    $('#thought-review').hidden = false;
    $('#save-thought').disabled = false;
    $('#cindra-status').textContent = 'Sugestões preparadas para este exemplo. Revise antes de guardar.';
    $('.ember-welcome p').textContent = 'Cada ideia tem suas possibilidades.';
    $('.ember-welcome span').textContent = 'Marque o que faz sentido para você.';
    $('#review-items input').focus({ preventScroll:true });
  });
  $('#review-items').addEventListener('change', () => { $('#save-thought').disabled = !$('#review-items input:checked'); });
  $('#save-thought').addEventListener('click', () => {
    const selected = [...document.querySelectorAll('#review-items input:checked')];
    if (!selected.length) return;
    selected.forEach(input => {
      const index = Number(input.dataset.item);
      const area = $(`[data-area="${index}"]`);
      area.classList.add('has-item');
      area.querySelector('p').textContent = thoughts[thought].items[index];
    });
    $('#cindra-demo').dataset.phase = 'saved';
    $('#thought-review').hidden = true;
    $('#reset-cindra').hidden = false;
    $('#cindra-status').textContent = `${selected.length} ${selected.length === 1 ? 'item guardado' : 'itens guardados'} neste exemplo.`;
    $('.ember-welcome p').textContent = 'Cada coisa encontrou um lugar.';
    $('.ember-welcome span').textContent = 'Quem escolhe o que fica é você.';
    $('#reset-cindra').focus({ preventScroll:true });
  });
  $('#reset-cindra').addEventListener('click', () => {
    resetCindra();
    $('#organize-thought').focus({ preventScroll:true });
  });

  const gallery = [
    { title:'Mundos imaginados', description:'Fantasia em cada detalhe.' },
    { title:'Figuras com história', description:'Um personagem, muitas possibilidades.' },
    { title:'A natureza em linhas', description:'O mundo visto por outro olhar.' }
  ];
  let artwork = 0;
  function selectArtwork(index) {
    artwork = (index + gallery.length) % gallery.length;
    $('#gallery-title').textContent = gallery[artwork].title;
    $('#gallery-description').textContent = gallery[artwork].description;
    $('#gallery-index').textContent = `${artwork + 1} / ${gallery.length}`;
    document.querySelectorAll('[data-artwork]').forEach(button => {
      const offset = (Number(button.dataset.artwork) - artwork + gallery.length) % gallery.length;
      button.dataset.position = ['center','right','left'][offset];
      button.setAttribute('aria-pressed', String(offset === 0));
    });
  }
  document.querySelectorAll('[data-artwork]').forEach(button => button.addEventListener('click', () => selectArtwork(Number(button.dataset.artwork))));
  $('#previous-artwork').addEventListener('click', () => selectArtwork(artwork - 1));
  $('#next-artwork').addEventListener('click', () => selectArtwork(artwork + 1));

  let state = createStoryState(), mapOpen = false;
  const compactMap = matchMedia('(max-width: 760px) and (min-height: 481px)');
  function syncStoryPanels() {
    const focused = document.activeElement;
    const shouldRestore = $('#mangue').contains(focused);
    $('#mangue').dataset.mapOpen = String(mapOpen);
    $('#story-map').hidden = compactMap.matches && !mapOpen;
    $('#story-reader').hidden = compactMap.matches && mapOpen;
    $('#story-map-toggle').hidden = !compactMap.matches;
    $('#story-map-toggle').setAttribute('aria-pressed', String(mapOpen));
    $('#story-map-toggle span').textContent = mapOpen ? 'Voltar à história' : 'Ver caminhos';
    if (shouldRestore && !focused.getClientRects().length) {
      (compactMap.matches ? $('#story-map-toggle') : $('#mangue-title')).focus({ preventScroll:true });
    }
  }
  function renderStory({ focus = false } = {}) {
    const node = story[state.node];
    $('#story-chapter').textContent = node.chapter;
    $('#story-title').textContent = node.title;
    $('#story-text').replaceChildren(...node.paragraphs.map(text => { const paragraph = document.createElement('p'); paragraph.textContent = text; return paragraph; }));
    $('#story-choices').replaceChildren(...node.choices.map(choice => { const button = document.createElement('button'); button.type = 'button'; button.dataset.choice = choice.id; button.innerHTML = choice.label + arrow; return button; }));
    if (!node.choices.length) {
      const end = document.createElement('p');
      end.className = 'story-ending'; end.textContent = 'Fim deste caminho. Há outro esperando por você.';
      $('#story-choices').append(end);
    }
    document.querySelectorAll('[data-node]').forEach(node => { node.classList.toggle('visited', state.visited.includes(node.dataset.node)); node.classList.toggle('current', state.node === node.dataset.node); });
    document.querySelectorAll('[data-edge]').forEach(edge => edge.classList.toggle('taken', state.visited.includes(edge.dataset.edge)));
    $('#story-status').textContent = node.chapter + '. ' + node.title;
    if (focus) $('#story-title').focus({ preventScroll:true });
  }
  $('#story-choices').addEventListener('click', event => {
    const button = event.target.closest('[data-choice]');
    if (!button) return;
    state = chooseStory(state, button.dataset.choice);
    renderStory({ focus:true });
  });
  $('#restart-story').addEventListener('click', () => {
    state = createStoryState();
    mapOpen = false;
    syncStoryPanels();
    renderStory({ focus:true });
  });
  $('#story-map-toggle').addEventListener('click', () => {
    mapOpen = !mapOpen;
    syncStoryPanels();
  });
  compactMap.addEventListener('change', syncStoryPanels);
  syncStoryPanels();
  renderStory();
}
