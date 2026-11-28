(function () {
  'use strict';
  const filters = document.querySelector('#filters');
  if (!filters) return;

  const grid = document.querySelector('.vehicle-grid');
  const cards = [...grid.querySelectorAll('.vehicle')];
  const search = document.querySelector('#modelSearch');
  const brand = document.querySelector('#brand');
  const body = document.querySelector('#body');
  const fuel = document.querySelector('#fuel');
  const budget = document.querySelector('#budget');
  const favorite = document.querySelector('#onlySaved');
  const sort = document.querySelector('#sort');
  const results = document.querySelector('#results');
  const empty = document.querySelector('.empty-results');
  const picker = document.querySelector('.brand-picker');
  const brands = [...picker.querySelectorAll('button')];
  const dialog = document.querySelector('.model-dialog');
  const modelMedia = dialog.querySelector('.model-media');
  const photo = modelMedia.querySelector('.model-photo');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const aliases = { BMW:'бмв', Audi:'ауди', HAVAL:'хавал', BELGEE:'белджи', Geely:'джили' };
  const normalize = value => value.toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');

  let saved = new Set();
  try {
    const stored = JSON.parse(localStorage.getItem('dn-favorites') || '[]');
    if (Array.isArray(stored)) saved = new Set(stored);
  } catch {}

  function update(animate = true) {
    const query = normalize(search.value);
    const ordered = [...cards];
    if (sort.value === 'asc') ordered.sort((a, b) => a.dataset.price - b.dataset.price);
    if (sort.value === 'desc') ordered.sort((a, b) => b.dataset.price - a.dataset.price);
    if (sort.value === 'name') ordered.sort((a, b) => a.dataset.name.localeCompare(b.dataset.name, 'ru'));
    let count = 0;

    ordered.forEach(card => {
      const { id, name, price } = card.dataset;
      const make = card.dataset.brand;
      const matchesSearch = normalize(name).includes(query) ||
        normalize(name.replace(make, aliases[make])).includes(query);
      const visible = matchesSearch && (!brand.value || brand.value === make) &&
        (!body.value || body.value === card.dataset.body) &&
        (!fuel.value || card.dataset.fuel.toLowerCase().split(' / ').includes(fuel.value.toLowerCase())) &&
        (!budget.value || Number(price) <= Number(budget.value)) && (!favorite.checked || saved.has(id));
      card.hidden = !visible;
      if (visible) count++;
    });

    if (ordered.some((card, index) => grid.children[index] !== card)) {
      ordered.forEach(card => grid.append(card));
    }
    if (animate && !reduced.matches) {
      ordered.filter(card => !card.hidden).slice(0, 9).forEach((card, index) => {
        card.getAnimations().forEach(animation => {
          if (animation.id === 'catalog-results') animation.cancel();
        });
        const animation = card.animate(
          [{ opacity:.45, translate:'0 12px' }, { opacity:1, translate:'0 0' }],
          { duration:410, delay:index * 28, easing:'cubic-bezier(.22,1,.36,1)' }
        );
        animation.id = 'catalog-results';
      });
    }

    results.textContent = 'Найдено: ' + count + ' из ' + cards.length;
    empty.hidden = count > 0;
    brands.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.brandFilter === brand.value)));
  }

  function paintFavorite(button, card) {
    const active = saved.has(card.dataset.id);
    button.setAttribute('aria-pressed', String(active));
    button.textContent = active ? '♥' : '♡';
    button.setAttribute('aria-label', active ? 'Убрать из избранного: ' + card.dataset.name :
      'Добавить в избранное: ' + card.dataset.name);
  }

  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const animatePhoto = window.Motion?.animate;
  cards.forEach(card => {
    const save = card.querySelector('[data-save]');
    const details = card.querySelector('.vehicle-details');
    paintFavorite(save, card);
    save.addEventListener('click', () => {
      const { id } = card.dataset;
      if (saved.has(id)) saved.delete(id);
      else saved.add(id);
      try { localStorage.setItem('dn-favorites', JSON.stringify([...saved])); } catch {}
      paintFavorite(save, card);
      if (favorite.checked) {
        update();
        if (card.hidden) favorite.focus({ preventScroll:true });
      }
    });
    details.hidden = false;
    details.addEventListener('click', () => {
      const source = card.querySelector('.vehicle-media');
      modelMedia.className = source.className + ' model-media';
      modelMedia.dataset.model = card.dataset.id;
      photo.src = source.querySelector('img').src;
      photo.alt = card.dataset.name;
      dialog.querySelector('#modelTitle').textContent = card.dataset.name;
      dialog.querySelector('.vehicle-kicker').textContent = card.querySelector('.vehicle-kicker').textContent;
      dialog.querySelector('.model-description').textContent = card.dataset.description;
      dialog.querySelector('.vehicle-budget strong').textContent = card.querySelector('.vehicle-budget strong').textContent;
      const imported = ['BMW', 'Audi'].includes(card.dataset.brand);
      dialog.querySelector('.model-note').textContent = imported
        ? 'Медиана оценок привоза до Минска по выборке за октябрь 2026 года. Цена относится к диапазону годов выше. Доставку и таможенные платежи уточню для выбранной машины.'
        : 'Ориентир для нового автомобиля по расчёту на ноябрь 2026 года. Комплектацию, стоимость доставки и таможенные платежи уточню при подборе.';
      dialog.querySelector('.action-button').href = card.querySelector('.action-button').href;
      const origin = source.querySelector('img').getBoundingClientRect();
      dialog.showModal();
      if (!reduceMotion.matches &&
          origin.bottom > 0 && origin.top < innerHeight && origin.width > 0) {
        const target = photo.getBoundingClientRect();
        if (target.width && target.height) {
          const start = `translate(${origin.left-target.left}px,${origin.top-target.top}px) scale(${origin.width/target.width},${origin.height/target.height})`;
          const end = 'translate(0,0) scale(1)';
          if (animatePhoto) {
            animatePhoto(photo, { transform:[start,end], transformOrigin:'top left' },
              { duration:.38, ease:[.22,1,.36,1] });
          } else {
            photo.animate([{ transform:start, transformOrigin:'top left' }, { transform:end, transformOrigin:'top left' }],
              { duration:380, easing:'cubic-bezier(.22,1,.36,1)' });
          }
        }
      }
      dialog.addEventListener('close', () => details.focus({ preventScroll:true }), { once:true });
    });
    card.querySelector('.vehicle-media img').addEventListener('click', () => details.click());
  });

  const compare = document.querySelector('#compareDialog');
  const compareOpen = document.querySelector('.compare-open');
  const selectors = [...compare.querySelectorAll('select')];
  const models = new Map(cards.map(card => [card.dataset.id, card]));
  const formatUSD = new Intl.NumberFormat('ru-BY', { maximumFractionDigits:0 });
  let previousChoices = [];
  let previousFavorites = '';

  function renderComparison(changedIndex) {
    const pair = selectors.map(select => models.get(select.value));
    previousChoices = pair.map(card => card.dataset.id);
    const headers = compare.querySelectorAll('thead th[scope="col"]');
    const pictures = compare.querySelectorAll('.compare-pictures img');
    const rows = compare.querySelectorAll('tbody tr');

    pair.forEach((card, index) => {
      const opposite = selectors[1 - index].value;
      for (const option of selectors[index].options) option.disabled = option.value === opposite;
      const { name, body, fuel } = card.dataset;
      headers[index].textContent = name;
      const img = pictures[index];
      const source = card.querySelector('.vehicle-media img');
      img.src = source.currentSrc || source.src;
      img.parentElement.classList.toggle('is-cutout', !!card.querySelector('.vehicle-media--cutout'));
      img.parentElement.classList.toggle('is-photo', !!card.querySelector('.vehicle-media--photo'));
      if (index === changedIndex && !reduced.matches) {
        img.getAnimations().forEach(animation => animation.cancel());
        img.animate([{ opacity:.35, translate:'8px 0' }, { opacity:1, translate:'0 0' }],
          { duration:320, easing:'cubic-bezier(.2,.75,.23,1)' });
      }
      const condition = card.querySelector('.vehicle-kicker').textContent.split('·').slice(1).join('·').trim();
      const values = [card.querySelector('.vehicle-budget strong').textContent, body, fuel, condition];
      rows.forEach((row, i) => { row.cells[index + 1].textContent = values[i]; });
    });
    const difference = Number(pair[0].dataset.price) - Number(pair[1].dataset.price);
    compare.querySelector('.compare-difference').textContent = difference
      ? 'Ориентир для ' + pair[difference < 0 ? 0 : 1].dataset.name + ' ниже примерно на ' + formatUSD.format(Math.abs(difference)) + ' USD.'
      : 'У обеих моделей одинаковый ориентир привоза.';
    const message = 'Здравствуйте, Дмитрий! Помогите выбрать между ' + pair[0].dataset.name + ' и ' + pair[1].dataset.name + '.';
    compare.querySelector('.compare-contact').href = 'https://t.me/dmittrixx?text=' + encodeURIComponent(message);
  }

  compareOpen.hidden = false;
  compareOpen.addEventListener('click', () => {
    const favorites = cards.filter(card => saved.has(card.dataset.id));
    const signature = JSON.stringify(favorites.map(card => card.dataset.id));
    const defaults = [...new Set([...favorites, ...cards.filter(card => !card.hidden), ...cards])];
    const chosen = previousChoices.length && signature === previousFavorites ? previousChoices :
      defaults.slice(0, 2).map(card => card.dataset.id);
    previousFavorites = signature;
    selectors.forEach((select, index) => {
      select.replaceChildren();
      for (const [label, group] of [['Избранное', favorites], ['Каталог', cards.filter(card => !saved.has(card.dataset.id))]]) {
        if (!group.length) continue;
        const options = document.createElement('optgroup');
        options.label = label;
        group.forEach(card => options.append(new Option(card.dataset.name, card.dataset.id)));
        select.append(options);
      }
      select.value = chosen[index];
    });
    renderComparison();
    compare.showModal();
  });
  selectors.forEach((select,index) => select.addEventListener('change', () => renderComparison(index)));

  [dialog, compare].forEach(modal => modal.addEventListener('click', event => {
    if (event.target !== modal) return;
    const bounds = modal.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right ||
        event.clientY < bounds.top || event.clientY > bounds.bottom) modal.close();
  }));

  picker.hidden = false;
  brands.forEach(button => button.addEventListener('click', () => {
    brand.value = button.dataset.brandFilter;
    update();
  }));
  filters.addEventListener('submit', event => event.preventDefault());
  filters.addEventListener('input', () => update());
  favorite.addEventListener('change', () => update());
  sort.addEventListener('change', () => update());
  filters.addEventListener('reset', () => {
    favorite.checked = false;
    sort.value = 'default';
    requestAnimationFrame(() => update());
  });
  document.querySelector('#resetEmpty').addEventListener('click', () => {
    filters.reset();
    search.focus();
  });
  update(false);
})();
