(function () {
  'use strict';
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  document.querySelectorAll('h1, h2, h3').forEach(heading => {
    if (heading.id === 'heroTitle' || !getComputedStyle(heading).fontFamily.includes('Oswald')) return;
    const uppercase = getComputedStyle(heading).textTransform === 'uppercase';
    const letter = uppercase ? /[Уу]/g : /У/g;
    const walker = document.createTreeWalker(heading, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);

    nodes.forEach(node => {
      const text = node.textContent;
      if (!text.match(letter)) return;
      if (node.parentElement.classList.contains('char')) {
        node.parentElement.classList.add('type-u');
        return;
      }

      const fragment = document.createDocumentFragment();
      text.split(/(\s+)/).forEach(word => {
        if (!word.match(letter)) {
          fragment.append(word);
          return;
        }
        const wrapper = document.createElement('span');
        wrapper.className = 'type-word';
        let last = 0;
        for (const match of word.matchAll(letter)) {
          wrapper.append(word.slice(last, match.index));
          const span = document.createElement('span');
          span.className = 'type-u';
          span.textContent = match[0];
          wrapper.append(span);
          last = match.index + 1;
        }
        wrapper.append(word.slice(last));
        fragment.append(wrapper);
      });
      node.replaceWith(fragment);
    });
  });

  const animations = new Set();
  const entrance = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entrance.unobserve(entry.target);
      if (preference.matches || document.body.classList.contains('motion-paused')) return;
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
  const panels = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      panels.unobserve(entry.target);
      if (preference.matches || document.body.classList.contains('motion-paused')) return;
      const panel = entry.target;
      const delay = panel.classList.contains('vehicle') ? [...panel.parentElement.children].indexOf(panel) % 3 * 55 : 0;
      const animation = panel.animate(
        [{ opacity:.4, translate:'0 18px' }, { opacity:1, translate:'0 0' }],
        { duration:700, delay, easing:'cubic-bezier(.22,1,.36,1)' }
      );
      animations.add(animation);
      animation.finished.then(() => animations.delete(animation)).catch(() => {});
    });
  }, { threshold:.15 });
  document.querySelectorAll('.vehicle,.customs-result,.customs-form,.filter-bar,.catalog-section-title').forEach(panel => panels.observe(panel));

  const total = document.getElementById('total');
  if(total) {
    let previous = total.textContent;
    let animation;
    new MutationObserver(() => {
      const value = total.textContent;
      if (value === previous) return;
      previous = value;
      if (preference.matches) return;
      animation?.cancel();
      animation = total.animate(
        [{ opacity:.55, translate:'0 6px' }, { opacity:1, translate:'0 0' }],
        { duration:350, easing:'cubic-bezier(.22,1,.36,1)' }
      );
    }).observe(total, { childList:true, characterData:true, subtree:true });
  }

  function revealHero() {
    if (preference.matches) return;
    document.querySelectorAll('.hero__subtitle,.hero__desc,.hero-quick-links,.hero__visual').forEach((element,index) => {
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
  preference.addEventListener('change',() => { if(preference.matches) animations.forEach(animation=>animation.finish()); });
  const toggle = document.querySelector('.motion-toggle');
  if(toggle) toggle.addEventListener('click',() => {
    const paused=document.body.classList.contains('motion-paused');
    animations.forEach(animation=>paused?animation.pause():animation.play());
  });
})();
