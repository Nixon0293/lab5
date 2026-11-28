/* Both cars share the same photographed body and wheel geometry. */
(function () {
  'use strict';
  const hero = document.querySelector('.drive-scene--hero');
  const route = document.querySelector('#roadshow');
  const journey = route.querySelector('.drive-scene--journey');
  const sticky = route.querySelector('.roadshow__sticky');
  const stages = [...route.querySelectorAll('.journey-stage')];
  const meter = route.querySelector('.journey-distance b');
  const heroCar = hero?.querySelector('.drive-car');
  const routeCar = journey.querySelector('.drive-car');
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  const duration = 1.45;
  const clamp = value => Math.max(0, Math.min(1, value));
  let arrival = 0;
  let frame = 0;
  let lastTime = 0;
  let lastPercent = -1;
  let heroVisible = false;

  function setPosition(scene, x, distance, wheelRadius) {
    scene.style.setProperty('--car-x', x.toFixed(2) + 'px');
    scene.style.setProperty('--road', (-distance).toFixed(2) + 'px');
    const degrees = distance / Math.max(wheelRadius, 1) * 180 / Math.PI;
    scene.style.setProperty('--wheel', (degrees % 360).toFixed(2) + 'deg');
  }

  function drawHero() {
    if (!heroCar) return;
    const t = preference.matches ? 1 : clamp(arrival / duration);
    const distance = heroCar.offsetLeft + heroCar.offsetWidth + 24;
    const remaining = (1 - t) ** 2.65;
    setPosition(hero, -distance * remaining, distance * (1 - remaining), heroCar.offsetWidth * .07);
    const brake = Math.sin(Math.PI * clamp((t - .44) / .56)) ** 2;
    hero.style.setProperty('--pitch', (.85 * brake).toFixed(2) + 'deg');
    hero.style.setProperty('--speed-light', (.65 * remaining).toFixed(3));
    hero.style.setProperty('--glint', (.45 * brake).toFixed(3));
    hero.style.setProperty('--glint-position', ((1 - t) * 100).toFixed(2) + '%');
    hero.style.setProperty('--rim-light', (.1 * remaining).toFixed(3));
  }

  function drawRoute() {
    const travel = Math.max(1, route.offsetHeight - sticky.offsetHeight);
    const progress = preference.matches ? 1 : clamp(-route.getBoundingClientRect().top / (travel * .7));
    const width = routeCar.offsetWidth;
    const margin = journey.clientWidth * .04;
    const start = -width;
    const end = Math.max(0, journey.clientWidth - width - margin);
    const distance = (end - start) * progress;
    setPosition(journey, start + distance, distance, width * .07);
    route.style.setProperty('--journey', progress.toFixed(4));
    const percent = Math.floor(progress * 100);
    if (lastPercent === percent) return;
    lastPercent = percent;
    const current = Math.min(stages.length - 1, Math.floor(progress * stages.length));
    stages.forEach((stage, index) => {
      stage.classList.toggle('is-current', current === index);
      stage.classList.toggle('is-complete', current > index || progress === 1);
      stage.style.setProperty('--stage-progress', clamp(progress * stages.length - index).toFixed(3));
      if (current === index) stage.setAttribute('aria-current', 'step');
      else stage.removeAttribute('aria-current');
    });
    meter.textContent = String(percent).padStart(2, '0') + '%';
  }

  function update(now) {
    frame = 0;
    drawRoute();
    const running = heroVisible && !document.hidden && !preference.matches && arrival < duration;
    if (running && document.body.classList.contains('is-ready')) {
      arrival = Math.min(duration, arrival + Math.min(.08, (now - lastTime) / 1000));
    }
    drawHero();
    lastTime = now;
    if (running && arrival < duration) frame = requestAnimationFrame(update);
  }

  function schedule() {
    if (frame || document.hidden) return;
    lastTime = performance.now();
    frame = requestAnimationFrame(update);
  }

  if (hero) new IntersectionObserver(entries => {
    heroVisible = entries[0].isIntersecting;
    schedule();
  }).observe(hero);
  new ResizeObserver(schedule).observe(sticky);
  addEventListener('scroll', schedule, {passive:true});
  addEventListener('resize', schedule);
  document.addEventListener('visibilitychange', schedule);
  preference.addEventListener('change', () => {
    if (preference.matches) arrival = duration;
    schedule();
  });
  if (preference.matches || performance.getEntriesByType('navigation')[0]?.type === 'back_forward') arrival = duration;
  drawHero();
  drawRoute();
})();
