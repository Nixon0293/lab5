/* One time-based animation loop for both driving scenes. No external libraries. */
(function () {
  'use strict';
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  const scenes = [...document.querySelectorAll('.drive-scene')];
  const section = document.querySelector('#roadshow');
  const button = document.querySelector('.motion-toggle');
  let paused = false, frame = 0, last = 0, clock = 0, distance = 0, progress = 0;
  const visible = new Set();
  const cars = scenes.map(scene => scene.querySelector('.drive-car'));
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => entry.isIntersecting ? visible.add(entry.target) : visible.delete(entry.target));
    start();
  }, {rootMargin:'100px'});
  scenes.forEach(scene => observer.observe(scene));
  const clamp = (x,a,b) => Math.max(a, Math.min(b,x));
  function journeyX(scene, width, position) {
    const margin = scene.clientWidth * .04;
    const travel = Math.max(0, scene.clientWidth - width - margin * 2);
    return margin + travel * clamp(position, 0, 1);
  }
  function render(dt) {
    clock += dt;
    const bounds = section.getBoundingClientRect();
    const target = clamp(-bounds.top / Math.max(1,bounds.height-innerHeight),0,1);
    const previous = progress;
    progress += (target-progress)*(1-Math.exp(-dt*7));
    distance += dt*175;
    section.style.setProperty('--journey',progress.toFixed(4));
    scenes.forEach((scene,index) => {
      if (!visible.has(scene)) return;
      const car = cars[index];
      const width = car.offsetWidth;
      let x = Math.sin(clock*.38)*12;
      if (index) x = journeyX(scene, width, progress);
      else x -= (scene.clientWidth*.4 + width + 24)*(1-Math.min(clock/2.8,1))**3;
      scene.style.setProperty('--car-x',x.toFixed(2)+'px');
      scene.style.setProperty('--road',(-distance*(index?1.3:1)).toFixed(2)+'px');
      scene.style.setProperty('--wheel',(distance/Math.max(width*.051,1)*180/Math.PI).toFixed(2)+'deg');
      scene.style.setProperty('--bounce',(Math.sin(clock*10)*.45+Math.sin(clock*17)*.2).toFixed(2)+'px');
      scene.style.setProperty('--pitch',clamp((progress-previous)*-65+Math.sin(clock*6)*.055,-.7,.7).toFixed(3)+'deg');
    });
  }
  function tick(now) {
    frame=0;
    const dt=Math.min((now-last)/1000,.04); last=now;
    if (paused || preference.matches || document.hidden || !visible.size) return;
    if(document.body.classList.contains('is-ready')) render(dt);
    frame=requestAnimationFrame(tick);
  }
  function start() {
    if(!frame && !paused && !preference.matches && !document.hidden && visible.size) { last=performance.now(); frame=requestAnimationFrame(tick); }
  }
  function staticPose() {
    scenes.forEach((scene,index)=> {
      const width=cars[index].offsetWidth;
      scene.style.setProperty('--car-x',index?journeyX(scene,width,preference.matches?.5:progress)+'px':(preference.matches?'0px':-(scene.clientWidth*.4+width+24)*(1-Math.min(clock/2.8,1))**3+'px'));
    });
  }
  button.addEventListener('click',()=> {
    paused=!paused;
    document.body.classList.toggle('motion-paused',paused);
    button.setAttribute('aria-pressed',String(paused));
    button.textContent=paused?'▷ Продолжить движение':'Ⅱ Пауза движения';
    start();
  });
  preference.addEventListener('change',()=> { staticPose(); start(); });
  document.addEventListener('visibilitychange',start);
  addEventListener('resize',()=> { staticPose(); });
  staticPose(); start();
})();
