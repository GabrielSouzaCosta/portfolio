// Cindra: a cozy pixel valley. Ember and eight caretakers each look after one corner of life,
// and a few characters from the Series 1 deck live around them. Morfeu walks over to whoever you pick.
// Every position is in pixels of the 704x384 valley grid. Lines come from the Cindra app (pt-BR).
export const GRID = { width:704, height:384 };

const companion = (id, name, role, note, lines, x, y, stand) => ({ id, kind:'companion', name, role, note, lines, x, y, stand, size:[18, 18] });
const card = (id, name, number, line, x, y, stand, size, air = false) => ({ id, kind:'card', name, role:`Carta ${number}`, note:'Uma das cartas da coleção do Cindra.', lines:[line], x, y, stand, size, air });

export const residents = [
  companion('ember', 'Ember', 'Cuida de tudo', 'Escuta o que você conta e cuida de todo o espaço.', ['Oi! Que bom te ver.', 'Estou bem aqui se precisar.', 'No que a gente foca hoje?'], 343, 236, [325, 242]),
  companion('thistle', 'Thistle', 'Cuida da agenda', 'Guarda teus compromissos e o que vem pela frente.', ['Oi! Bora ver como está o dia?', 'Sua agenda está comigo. Pode deixar.', 'Tem algo chegando que a gente deva olhar?'], 262, 292, [284, 302]),
  companion('pip', 'Pip', 'Cuida das tarefas e hábitos', 'Tarefas do dia e hábitos, sem culpa.', ['Oi! Quer avançar em algumas tarefas?', 'Uma coisa de cada vez. Fico com você.', 'Sem pressa. Qual é a primeira da lista?'], 160, 328, [181, 336]),
  companion('mote', 'Mote', 'Cuida do aprendizado', 'Acompanha o que você estuda e cada sessão.', ['Oi! Tá a fim de aprender um pouco?', 'Eu fico por perto enquanto você estuda.', 'Mesmo uma sessão curta conta. Estou com você.'], 150, 246, [171, 254]),
  companion('bramble', 'Bramble', 'Cuida dos objetivos', 'A guardiã do longo caminho até cada meta.', ['Oi! Como estão os seus objetivos?', 'Caminho longo se faz devagar. Estou com você.', 'Quer dar um empurrãozinho num objetivo?'], 546, 120, [527, 127]),
  companion('loom', 'Loom', 'Cuida dos projetos', 'Tece projetos com fio e tempo.', ['Oi! Como vão os projetos?', 'Uma coisa de cada vez. Estou com você.', 'Quer avançar um projetinho agora?'], 586, 250, [566, 257]),
  companion('fern', 'Fern', 'Cuida das finanças', 'Registra o que entra e o que sai, com calma.', ['Oi! Quer dar uma olhada nas finanças?', 'Sem julgamento. Só um registro calmo.', 'Dá pra olhar o dinheiro com leveza.'], 586, 334, [566, 340]),
  companion('kernel', 'Kernel', 'Cuida das compras', 'Conta cada grão e lembra de tudo o que falta.', ['Oi! Precisa de algo da lista?', 'A lista de compras está pronta.', 'Quer adicionar algo pra não esquecer?'], 344, 352, [366, 358]),
  companion('wisp', 'Wisp', 'Cuida do meu espaço', 'Guarda notas, links e um cantinho só teu.', ['Oi! Precisa de um cantinho seu?', 'Esse espaço é seu. Pode acomodar.', 'Quer anotar algo ou abrir um link?'], 102, 56, [196, 236]),
  card('glimmercap', 'Guardião da Ponte Glimmercap', 'C1-RW-03', 'Uma moeda de prata? Por favor. Tenho um pote cheio delas. Dê-me um segredo que faça suas orelhas ficarem vermelhas, e você pode cruzar a ponte.', 421, 256, [442, 264], [15, 22]),
  card('snackdragon', 'Snackdragon', 'C1-IN-01', 'Eu PODERIA incinerar toda a sua casa ancestral com um único sopro. Mas este brioche? Este brioche merece uma tostada leve e dourada.', 287, 226, [306, 236], [17, 20]),
  card('nimb', 'Nimb, Pastor de Rajadas', 'C1-CH-01', 'Calma, calma, pequeno cumulonimbus! Se você parar de despejar granizo na vila por cinco minutos, eu lhe dou uma brisa de altitude muito agradável para cochilar.', 508, 50, [488, 150], [33, 26], true),
  card('oramis', 'Oramis, a Cidade Ambulante', 'C1-IN-11', 'Bem-vindo! Suas botas são terríveis, mas sua postura é excelente. Mudei uma ponte e uma padaria só para você. Entre, por favor!', 652, 112, [640, 190], [19, 30]),
  card('luthier', 'Luthier Líquen', 'C1-RW-04', 'Silêncio, agora. Esta tábua de cedro está sonhando com uma canção de ninar, e se interrompermos, o violino só tocará notas desafinadas por um século.', 56, 284, [78, 292], [19, 30]),
  card('drizzlemane', 'Drizzlemane', 'C1-CH-02', 'Está meio úmido por aqui? Peço desculpas. Ser um ecossistema ambulante é um trabalho em tempo integral, e estou no meu intervalo de almoço.', 246, 206, [266, 222], [37, 27])
];

// Morfeu starts beside his ship, landed in the meadow.
export const SHIP = { x:530, y:318, size:[77, 36] };
export const HOME = [490, 326];

export const pct = (value, axis) => `${+(value / GRID[axis] * 100).toFixed(3)}%`;

// Walk time grows with distance, within a calm range.
export function walkDuration(from, to) {
  const distance = Math.hypot(to[0] - from[0], to[1] - from[1]);
  return Math.round(Math.min(2400, Math.max(500, distance * 9)));
}

export function residentLine(resident, visit) {
  return resident.lines[visit % resident.lines.length];
}

export function visitedLabel(count) {
  if (count === 0) return `Ninguém visitado ainda. São ${residents.length} moradores.`;
  if (count === residents.length) return `Você conheceu todos os ${residents.length} moradores do vale.`;
  return `Você conheceu ${count} de ${residents.length} moradores.`;
}

// The bubble sits over the head, flips below near the sky and hugs the edges of the valley.
export function bubblePlacement(resident) {
  const below = resident.y - resident.size[1] < 90;
  // Up in the sky, right of centre, the title card sits to the left: open the bubble to the right.
  const right = resident.x < 130 || (below && resident.x > 380 && resident.x <= 580);
  return { below, side:right ? 'right' : resident.x > 580 ? 'left' : 'center' };
}

export function setupCindraValley() {
  const $ = selector => document.querySelector(selector);
  const view = $('#cindra');
  const viewport = $('#valley-viewport');
  const stage = $('#valley-stage');
  const layer = $('#valley-residents');
  const morfeu = $('#valley-morfeu');
  const bubble = $('#valley-bubble');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const visits = new Map();
  let position = HOME, selected = -1, walkTimer = 0, userPanned = false;

  const place = (element, x, y) => { element.style.left = pct(x, 'width'); element.style.top = pct(y, 'height'); element.style.zIndex = String(Math.round(y)); };
  const sized = (element, [w]) => { element.style.width = pct(w, 'width'); };

  const ship = document.createElement('img');
  ship.className = 'valley-ship'; ship.src = 'assets/drawn/cindra/ship.png'; ship.alt = ''; ship.width = SHIP.size[0]; ship.height = SHIP.size[1]; ship.draggable = false;
  place(ship, SHIP.x, SHIP.y); sized(ship, SHIP.size);
  stage.append(ship);

  // Buttons in reading order, left to right, so the tab order follows the valley.
  const order = residents.map((resident, index) => [resident, index]).sort((a, b) => a[0].x - b[0].x);
  for (const [resident, index] of order) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `valley-resident is-${resident.kind}${resident.air ? ' is-air' : ''}`;
    button.dataset.resident = resident.id;
    button.setAttribute('aria-label', `${resident.name}. ${resident.role}.`);
    button.setAttribute('aria-pressed', 'false');
    button.style.setProperty('--delay', `${(index * 0.37) % 2.4}s`);
    place(button, resident.x, resident.y); sized(button, resident.size);
    const img = document.createElement('img');
    img.src = `assets/drawn/cindra/${resident.id}.png`; img.alt = ''; img.width = resident.size[0]; img.height = resident.size[1]; img.draggable = false;
    const tag = document.createElement('span');
    tag.className = 'resident-tag'; tag.textContent = resident.name.split(',')[0];
    button.append(img, tag);
    button.addEventListener('click', () => visit(index));
    layer.append(button);
  }
  place(morfeu, ...HOME);

  function showBubble(resident) {
    const count = visits.get(resident.id) ?? 0;
    const { below, side } = bubblePlacement(resident);
    $('#bubble-who').textContent = `${resident.name} · ${resident.role}`;
    $('#bubble-line').textContent = resident.kind === 'card' ? `“${residentLine(resident, count)}”` : residentLine(resident, count);
    $('#bubble-note').textContent = resident.note;
    bubble.dataset.below = String(below);
    bubble.dataset.side = side;
    bubble.dataset.kind = resident.kind;
    place(bubble, resident.x, below ? resident.y : resident.y - resident.size[1]);
    bubble.style.zIndex = '1000';
    bubble.hidden = false;
    visits.set(resident.id, count + 1);
    $('#valley-count').textContent = visitedLabel(visits.size);
    layer.querySelector(`[data-resident="${resident.id}"]`)?.classList.add('is-greeting');
  }

  function visit(index) {
    selected = (index + residents.length) % residents.length;
    const resident = residents[selected];
    layer.querySelectorAll('.valley-resident').forEach(button => {
      const active = button.dataset.resident === resident.id;
      button.setAttribute('aria-pressed', String(active));
      button.classList.remove('is-greeting');
    });
    bubble.hidden = true;
    clearTimeout(walkTimer);
    const target = resident.stand;
    const duration = reduced.matches ? 0 : walkDuration(position, target);
    // Morfeu faces the way he walks, then turns toward whoever he came to meet.
    morfeu.dataset.facing = target[0] < position[0] ? 'left' : 'right';
    morfeu.style.transitionDuration = `${duration}ms`;
    morfeu.classList.toggle('is-walking', duration > 0);
    place(morfeu, ...target);
    position = target;
    walkTimer = setTimeout(() => {
      morfeu.classList.remove('is-walking');
      morfeu.dataset.facing = resident.x < target[0] ? 'left' : 'right';
      showBubble(resident);
    }, duration);
    follow(resident.x);
  }

  // On narrow screens the valley is wider than the view: keep the chosen resident in sight.
  function follow(x) {
    if (viewport.scrollWidth <= viewport.clientWidth) return;
    const left = x / GRID.width * stage.offsetWidth - viewport.clientWidth / 2;
    viewport.scrollTo({ left, behavior:reduced.matches ? 'auto' : 'smooth' });
  }

  $('#bubble-next').addEventListener('click', () => {
    visit(selected + 1);
    layer.querySelector(`[data-resident="${residents[selected].id}"]`).focus({ preventScroll:true });
  });
  view.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !bubble.hidden) { bubble.hidden = true; layer.querySelector('[aria-pressed="true"]')?.focus({ preventScroll:true }); }
  });

  const centre = () => { if (!userPanned) viewport.scrollLeft = (HOME[0] / GRID.width) * stage.offsetWidth - viewport.clientWidth / 2; };
  new ResizeObserver(centre).observe(viewport);
  let drag = null;
  viewport.addEventListener('pointerdown', event => {
    if (event.pointerType !== 'mouse' || event.target.closest('button, a')) return;
    drag = { x:event.clientX, left:viewport.scrollLeft };
    viewport.setPointerCapture(event.pointerId);
  });
  viewport.addEventListener('pointermove', event => {
    if (!drag) return;
    userPanned = true;
    viewport.scrollLeft = drag.left - (event.clientX - drag.x);
  });
  viewport.addEventListener('pointerup', () => { drag = null; });
  viewport.addEventListener('touchstart', () => { userPanned = true; }, { passive:true });
  $('#valley-count').textContent = visitedLabel(0);
}
