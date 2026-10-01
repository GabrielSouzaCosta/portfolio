// CommissionMatch: a woodcut map where every art style is a land and every toll is shown in the traveller's currency.
export const regions = [
  { id:'oleo', name:'Montes da Pintura a Óleo', style:'pintura a óleo', price:180 },
  { id:'personagem', name:'Floresta dos Personagens', style:'design de personagens', price:290 },
  { id:'retrato', name:'Burgo dos Retratos', style:'retratos', price:220 },
  { id:'pixel', name:'Vale do Pixel', style:'pixel art', price:90 },
  { id:'livros', name:'Porto dos Livros Ilustrados', style:'livros ilustrados', price:640 },
  { id:'tatuagem', name:'Ilha das Tatuagens', style:'tatuagem', price:320 }
];

// Example rates, from BRL. Prices on the map are illustrative.
export const currencies = { BRL:1, USD:.18, EUR:.16 };

export function convert(brl, currency) {
  const value = brl * currencies[currency];
  return currency === 'BRL' ? Math.round(value / 10) * 10 : Math.round(value);
}

export function formatPrice(brl, currency) {
  return new Intl.NumberFormat('pt-BR', { style:'currency', currency, maximumFractionDigits:0 }).format(convert(brl, currency));
}

export function affordable(budget) {
  return regions.filter(region => region.price <= budget);
}

export function countLabel(count) {
  const words = ['Nenhuma terra cabe', 'Uma terra cabe', 'Duas terras cabem', 'Três terras cabem', 'Quatro terras cabem', 'Cinco terras cabem', 'Todas as terras cabem'];
  return `${words[count]} na tua bolsa.`;
}

export function regionLine(region, budget, currency) {
  const toll = formatPrice(region.price, currency);
  const diff = formatPrice(Math.abs(budget - region.price), currency);
  if (region.price <= budget) return `${region.name}: ${region.style} a partir de ${toll}. Cabe na tua bolsa, e ainda sobram ${diff}.`;
  return `${region.name}: ${region.style} a partir de ${toll}. Aqui há dragões: faltam ${diff} na tua bolsa.`;
}

export function setupCommissionMap() {
  const $ = selector => document.querySelector(selector);
  const view = $('#commissionmatch');
  const viewport = $('#map-viewport');
  const slider = $('#purse-range');
  const line = $('#herald-line');
  const piece = $('#map-piece');
  let currency = 'BRL', selected = -1, userPanned = false;

  function renderPurse() {
    const budget = Number(slider.value);
    $('#purse-amount').textContent = formatPrice(budget, currency);
    slider.setAttribute('aria-valuetext', formatPrice(budget, currency));
    slider.style.setProperty('--fill', `${(budget - slider.min) / (slider.max - slider.min) * 100}%`);
    $('#purse-count').textContent = countLabel(affordable(budget).length);
    view.querySelectorAll('[data-region]').forEach(button => {
      const region = regions.find(item => item.id === button.dataset.region);
      const open = region.price <= budget;
      button.dataset.open = String(open);
      button.querySelector('.region-toll').textContent = open ? formatPrice(region.price, currency) : `${formatPrice(region.price, currency)} · acima`;
    });
  }

  function selectRegion(index) {
    selected = (index + regions.length) % regions.length;
    const region = regions[selected];
    const button = view.querySelector(`[data-region="${region.id}"]`);
    view.querySelectorAll('[data-region]').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
    line.textContent = regionLine(region, Number(slider.value), currency);
    // The knight rides to the land's standing spot. The ribbon drops below him near the top edge of the map.
    const [x, y] = button.dataset.stand.split(',').map(Number);
    piece.style.setProperty('--x', `${x}%`);
    piece.style.setProperty('--y', `${y}%`);
    piece.dataset.below = String(y < 30);
    piece.dataset.side = x > 70 ? 'left' : x < 25 ? 'right' : 'center';
    piece.classList.remove('is-riding'); void piece.offsetWidth; piece.classList.add('is-riding');
    if (viewport.scrollWidth > viewport.clientWidth) {
      const target = button.offsetLeft - viewport.clientWidth / 2;
      viewport.scrollTo({ left:target, behavior:matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    }
  }

  view.querySelectorAll('[data-region]').forEach(button => button.addEventListener('click', () => {
    selectRegion(regions.findIndex(region => region.id === button.dataset.region));
  }));
  slider.addEventListener('input', () => {
    renderPurse();
    if (selected >= 0) line.textContent = regionLine(regions[selected], Number(slider.value), currency);
  });
  slider.addEventListener('change', () => {
    if (selected < 0) line.textContent = `Com ${formatPrice(Number(slider.value), currency)}, ${affordable(Number(slider.value)).length} de ${regions.length} terras te recebem.`;
  });
  view.querySelectorAll('[data-currency]').forEach(button => button.addEventListener('click', () => {
    currency = button.dataset.currency;
    view.querySelectorAll('[data-currency]').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
    renderPurse();
    if (selected >= 0) line.textContent = regionLine(regions[selected], Number(slider.value), currency);
  }));
  // Wide maps on narrow screens: centre once, then let the traveller pan by dragging.
  const centre = () => { if (!userPanned) viewport.scrollLeft = (viewport.scrollWidth - viewport.clientWidth) / 2; };
  new ResizeObserver(centre).observe(viewport);
  let drag = null;
  viewport.addEventListener('pointerdown', event => {
    if (event.pointerType !== 'mouse' || event.target.closest('button')) return;
    drag = { x:event.clientX, left:viewport.scrollLeft };
    viewport.setPointerCapture(event.pointerId);
  });
  viewport.addEventListener('pointermove', event => {
    if (!drag) return;
    userPanned = true;
    viewport.scrollLeft = drag.left - (event.clientX - drag.x);
  });
  viewport.addEventListener('pointerup', () => { drag = null; });
  viewport.addEventListener('scroll', () => { if (drag) userPanned = true; }, { passive:true });

  renderPurse();
}
