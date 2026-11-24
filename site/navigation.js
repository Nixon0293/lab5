(function () {
  const header = document.querySelector('#header');
  const menu = header.querySelector('#burger');
  const nav = header.querySelector('#nav');
  const mobile = matchMedia('(max-width: 1080px)');

  function setOpen(open) {
    nav.classList.toggle('is-open', open);
    menu.classList.toggle('is-open', open);
    menu.setAttribute('aria-expanded', String(open));
    menu.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
    document.body.classList.toggle('navigation-open', open);
    nav.inert = mobile.matches && !open;
    if (open) nav.querySelector('a').focus({ preventScroll: true });
  }

  menu.addEventListener('click', () => setOpen(!nav.classList.contains('is-open')));
  nav.addEventListener('click', event => {
    const link = event.target.closest('a');
    if (!link || !mobile.matches) return;
    setOpen(false);
    if (link.hash && link.pathname === location.pathname) {
      const target = document.getElementById(link.hash.slice(1));
      if (target) {
        target.setAttribute('tabindex', '-1');
        target.focus({ preventScroll: true });
      }
    }
  });
  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape' || !nav.classList.contains('is-open')) return;
    setOpen(false);
    menu.focus();
  });
  document.addEventListener('pointerdown', event => {
    if (nav.classList.contains('is-open') && !header.contains(event.target)) setOpen(false);
  });
  header.addEventListener('focusout', event => {
    if (event.relatedTarget && !header.contains(event.relatedTarget) && nav.classList.contains('is-open')) setOpen(false);
  });
  setOpen(false);
  mobile.addEventListener('change', () => setOpen(false));
  addEventListener('pageshow', () => setOpen(false));
})();
