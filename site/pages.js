(function(){
 'use strict';
 const menu=document.querySelector('.page-menu'), nav=document.querySelector('#pageNav');
 function closeMenu(){menu.setAttribute('aria-expanded','false');menu.setAttribute('aria-label','Открыть меню');nav.classList.remove('is-open');}
 menu.addEventListener('click',()=>{const open=menu.getAttribute('aria-expanded')!=='true';menu.setAttribute('aria-expanded',String(open));menu.setAttribute('aria-label',open?'Закрыть меню':'Открыть меню');nav.classList.toggle('is-open',open);});
 document.addEventListener('keydown',event=>{if(event.key==='Escape')closeMenu();});
 nav.addEventListener('click',event=>{if(event.target.closest('a'))closeMenu();});
 const filters=document.querySelector('#filters'); if(!filters)return;
 const cards=[...document.querySelectorAll('.vehicle')],grid=document.querySelector('.vehicle-grid');
 let saved=new Set();try{const list=JSON.parse(localStorage.getItem('dn-favorites')||'[]');if(Array.isArray(list))saved=new Set(list.filter(id=>cards.some(c=>c.dataset.id===id)));}catch{}
 const favorite=document.querySelector('#onlySaved'),sort=document.querySelector('#sort');
 const fields=['brand','body','fuel','budget'].map(id=>document.getElementById(id));
 function update(){
  let count=0;
  cards.forEach(card=>{const d=card.dataset;const show=(!fields[0].value||d.brand===fields[0].value)&&(!fields[1].value||d.body===fields[1].value)&&(!fields[2].value||d.fuel===fields[2].value)&&(!fields[3].value||+d.price<=+fields[3].value)&&(!favorite.checked||saved.has(d.id));card.hidden=!show;if(show)count++;});
  const sorted=[...cards];if(sort.value==='asc')sorted.sort((a,b)=>+a.dataset.price-+b.dataset.price);if(sort.value==='desc')sorted.sort((a,b)=>+b.dataset.price-+a.dataset.price);if(sort.value==='name')sorted.sort((a,b)=>a.dataset.name.localeCompare(b.dataset.name,'ru'));sorted.forEach(c=>grid.append(c));
  document.querySelector('#results').textContent='Найдено: '+count+' из '+cards.length;
  document.querySelector('.empty-results').hidden=count>0;
 }
 document.querySelectorAll('[data-save]').forEach(button=>{
  function paint(){const active=saved.has(button.dataset.save);button.setAttribute('aria-pressed',String(active));button.textContent=active?'♥':'♡';const name=button.closest('.vehicle').dataset.name;button.setAttribute('aria-label',(active?'Убрать ':'Добавить ')+name+(active?' из избранного':' в избранное'));}
  button.addEventListener('click',()=>{const id=button.dataset.save;saved.has(id)?saved.delete(id):saved.add(id);try{localStorage.setItem('dn-favorites',JSON.stringify([...saved]));}catch{}paint();update();});paint();
 });
 filters.addEventListener('submit',e=>e.preventDefault());filters.addEventListener('input',update);filters.addEventListener('change',update);favorite.addEventListener('change',update);sort.addEventListener('change',update);
 function reset(){favorite.checked=false;sort.value='default';requestAnimationFrame(update);}
 filters.addEventListener('reset',reset);document.querySelector('#resetEmpty').addEventListener('click',()=>filters.reset());update();
})();
