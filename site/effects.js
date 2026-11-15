/* Subtle depth and scroll-driven entrances. Motion preference is respected. */
(function(){
 'use strict';
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const elements=[...document.querySelectorAll('.vehicle,.method-grid article,.page-cta,.journey-heading,.catalog-feature')];
 if(!reduced.matches){
  const observer=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('entered');observer.unobserve(e.target);}}),{threshold:.08});
  elements.forEach((element,index)=>{element.classList.add('entrance');element.style.setProperty('--delay',Math.min(index%3,2)*70+'ms');observer.observe(element);});
 }
 if(matchMedia('(hover:hover) and (pointer:fine)').matches&&!reduced.matches){
  document.querySelectorAll('.vehicle,.tcard,.customs-result').forEach(card=>{
   card.classList.add('surface-light');let requested=0,px=50,py=50;
   card.addEventListener('pointermove',e=>{const r=card.getBoundingClientRect();px=(e.clientX-r.left)/r.width*100;py=(e.clientY-r.top)/r.height*100;if(!requested)requested=requestAnimationFrame(()=>{card.style.setProperty('--light-x',px+'%');card.style.setProperty('--light-y',py+'%');requested=0;});});
  });
 }
 const model=new URLSearchParams(location.search).get('model');
 const names={'geely-monjaro':'Geely Monjaro','geely-atlas':'Geely Atlas','geely-cityray':'Geely Cityray','geely-ex5':'Geely EX5','geely-ex2':'Geely EX2','belgee-s50':'BELGEE S50','belgee-x50plus':'BELGEE X50+','belgee-x70':'BELGEE X70'};
 if(names[model]&&document.querySelector('#cCar')){document.querySelector('#cCar').value=names[model];document.querySelector('#cCar').dispatchEvent(new Event('input',{bubbles:true}));}
})();
