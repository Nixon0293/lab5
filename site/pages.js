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
      const photo = dialog.querySelector('.model-photo');
      photo.src = card.querySelector('img').src;
      photo.alt = card.dataset.name;
      dialog.querySelector('#modelTitle').textContent = card.dataset.name;
      dialog.querySelector('.vehicle-kicker').textContent = card.querySelector('.vehicle-kicker').textContent;
      dialog.querySelector('.model-description').textContent = card.dataset.description;
      dialog.querySelector('.vehicle-budget strong').textContent = card.querySelector('.vehicle-budget strong').textContent;
      dialog.querySelector('.action-button').href = card.querySelector('.action-button').href;
      dialog.showModal();
      dialog.addEventListener('close', () => details.focus({ preventScroll:true }), { once:true });
    });
  });

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
