(function () {
  'use strict';
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  const animations = new Set();
  const entrance = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entrance.unobserve(entry.target);
      if (preference.matches) return;
      const frame = entry.target;
      const animation = frame.animate([
        { clipPath:'inset(14% 0 14% 0 round 12px)', opacity:.35, transform:'scale(.96)' },
        { clipPath:'inset(0% 0 0% 0 round 12px)', opacity:1, transform:'scale(1)' }
      ], { duration:1100, easing:'cubic-bezier(.22,1,.36,1)' });
      animations.add(animation);
      animation.finished.then(() => animations.delete(animation)).catch(() => {});
    });
  }, { threshold:.15 });
  document.querySelectorAll('.shot__frame,.catalog-feature').forEach(frame => entrance.observe(frame));
  function revealHero() {
    if (preference.matches) return;
    document.querySelectorAll('.hero__subtitle,.hero__desc,.hero__actions,.hero__visual').forEach((element,index) => {
      const animation=element.animate([{opacity:0,transform:'translateY(24px)'},{opacity:1,transform:'translateY(0)'}],{duration:1000,delay:150+index*100,easing:'cubic-bezier(.22,1,.36,1)',fill:'backwards'});
      animations.add(animation);
      animation.finished.then(()=>animations.delete(animation)).catch(()=>{});
    });
  }
  if(document.querySelector('.hero')) {
    if(document.body.classList.contains('is-ready')) revealHero();
    else {
      const ready=new MutationObserver(()=>{
        if(document.body.classList.contains('is-ready')) {ready.disconnect();revealHero();}
      });
      ready.observe(document.body,{attributes:true,attributeFilter:['class']});
    }
  }
  const stages = [...document.querySelectorAll('.journey-stage')];
  const section = document.querySelector('#roadshow');
  const distance = document.querySelector('.journey-distance b');
  let scheduled = false;
  function updateJourney() {
    scheduled = false;
    if (!section) return;
    const bounds = section.getBoundingClientRect();
    const progress = Math.max(0,Math.min(1,-bounds.top/Math.max(1,bounds.height-innerHeight)));
    const current = Math.min(3,Math.floor(progress*4));
    stages.forEach((stage,index) => {
      stage.classList.toggle('is-current',index===current);
      stage.classList.toggle('is-complete',index<current);
      if(index===current) stage.setAttribute('aria-current','step');
      else stage.removeAttribute('aria-current');
    });
    if(distance) distance.textContent=String(Math.round(progress*100)).padStart(2,'0')+'%';
  }
  function schedule() { if(!scheduled) { scheduled=true; requestAnimationFrame(updateJourney); } }
  addEventListener('scroll',schedule,{passive:true});
  addEventListener('resize',schedule);
  updateJourney();
  preference.addEventListener('change',() => { if(preference.matches) animations.forEach(animation=>animation.finish()); });
  const toggle = document.querySelector('.motion-toggle');
  if(toggle) toggle.addEventListener('click',() => {
    const paused=document.body.classList.contains('motion-paused');
    animations.forEach(animation=>paused?animation.pause():animation.play());
  });
})();
