(() => {
  const section = document.querySelector('#porsche-reveal');
  const frame = section.querySelector('.porsche-reveal__frame');
  const photo = frame.querySelector('img');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let pendingFrame = 0;

  function renderReveal() {
    const bounds = section.getBoundingClientRect();
    if (bounds.bottom <= 0 || bounds.top >= innerHeight) return;
    const travel = Math.max(1, section.offsetHeight - frame.offsetHeight);
    const progress = Math.min(1, Math.max(0, (frame.getBoundingClientRect().top - bounds.top) / travel));
    const push = Math.min(1, progress / .55);
    const reveal = Math.max(0, (progress - .24) / .76);
    const easedPush = push * push * (3 - 2 * push);
    const easedReveal = reveal * reveal * (3 - 2 * reveal);
    if (photo.naturalWidth && photo.naturalHeight) {
      const width = frame.clientWidth;
      const height = frame.clientHeight;
      const cover = Math.max(width / photo.naturalWidth, height / photo.naturalHeight);
      const imageWidth = photo.naturalWidth * cover;
      const imageHeight = photo.naturalHeight * cover;
      const x = (width - imageWidth) / 2 + imageWidth * .385;
      const y = (height - imageHeight) / 2 + imageHeight * .42;
      const shiftX = (width / 2 - x) * easedPush;
      const shiftY = (height / 2 - y) * easedPush;
      section.style.setProperty('--headlight-origin', x + 'px ' + y + 'px');
      section.style.setProperty('--headlight-shift', shiftX + 'px ' + shiftY + 'px');
      section.style.setProperty('--reveal-spot', (x + shiftX) + 'px ' + (y + shiftY) + 'px');
      section.style.setProperty('--portal-radius', Math.hypot(width, height) * .56 * easedReveal + 'px');
    }
    section.style.setProperty('--headlight-zoom', String(1 + 4 * easedPush));
  }

  function render() {
    pendingFrame = 0;
    renderReveal();
  }

  function schedule() {
    if (!reducedMotion.matches && !pendingFrame) pendingFrame = requestAnimationFrame(render);
  }

  function applyPreference() {
    section.classList.toggle('is-scroll-reveal', !reducedMotion.matches);
    schedule();
  }

  addEventListener('scroll', schedule, { passive: true });
  addEventListener('resize', schedule);
  photo.addEventListener('load', schedule);
  reducedMotion.addEventListener('change', applyPreference);
  const rail = document.querySelector('#model-rail');
  const controls = document.querySelector('.gallery-controls');
  const [previous, next] = controls.querySelectorAll('button');

  function updateControls() {
    previous.disabled = rail.scrollLeft <= 2;
    next.disabled = rail.scrollLeft >= rail.scrollWidth - rail.clientWidth - 2;
  }

  controls.hidden = false;
  controls.addEventListener('click', event => {
    const button = event.target.closest('[data-gallery-step]');
    if (!button) return;
    const [first, second] = rail.querySelectorAll('.model-preview');
    const step = second.offsetLeft - first.offsetLeft;
    rail.scrollBy({
      left: Number(button.dataset.galleryStep) * step,
      behavior: reducedMotion.matches ? 'instant' : 'smooth'
    });
  });
  rail.addEventListener('scroll', updateControls, { passive: true });
  new ResizeObserver(updateControls).observe(rail);
  updateControls();

  applyPreference();
})();
