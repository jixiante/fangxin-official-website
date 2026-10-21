const $=(s,root=document)=>root.querySelector(s);
const $$=(s,root=document)=>[...root.querySelectorAll(s)];
const reducedMotion=window.matchMedia('(prefers-reduced-motion: reduce)');

// Manual navigation pauses autoplay; only the play button starts it again.
function createCarousel(root){
  const slides=$$('.slide',root),pause=$('[data-carousel-pause]',root),count=$('.carousel-count',root);
  let index=0,paused=reducedMotion.matches,hovered=false,focused=false,inView=false,timer;
  function schedule(){
    clearTimeout(timer);
    if(!paused&&!reducedMotion.matches&&!hovered&&!focused&&inView&&!document.hidden&&!document.querySelector('dialog[open]')){
      timer=setTimeout(()=>show(index+1),Number(root.dataset.delay));
    }
  }
  function updatePause(){
    pause.setAttribute('aria-pressed',String(paused));
    pause.setAttribute('aria-label',paused?pause.dataset.labelPlay:pause.dataset.labelPause);
    pause.firstElementChild.textContent=paused?'▷':'‖';
  }
  function show(next){
    index=(next+slides.length)%slides.length;
    slides.forEach((slide,i)=>{
      slide.classList.toggle('is-active',i===index);
      slide.setAttribute('aria-hidden',String(i!==index));
      slide.inert=i!==index;
    });
    count.textContent=`0${index+1} / 0${slides.length}`;
    schedule();
  }
  for(const [selector,step] of [['[data-carousel-prev]',-1],['[data-carousel-next]',1]]){
    $(selector,root).addEventListener('click',()=>{paused=true;updatePause();show(index+step);});
  }
  pause.addEventListener('click',()=>{paused=!paused;updatePause();schedule();});
  root.addEventListener('mouseenter',()=>{hovered=true;schedule();});
  root.addEventListener('mouseleave',()=>{hovered=false;schedule();});
  root.addEventListener('focusin',()=>{focused=true;schedule();});
  root.addEventListener('focusout',()=>requestAnimationFrame(()=>{focused=root.contains(document.activeElement);schedule();}));
  document.addEventListener('visibilitychange',schedule);
  new MutationObserver(schedule).observe(document.body,{attributes:true,attributeFilter:['class']});
  reducedMotion.addEventListener('change',()=>{if(reducedMotion.matches)paused=true;updatePause();schedule();});
  if('IntersectionObserver' in window){
    new IntersectionObserver(entries=>{inView=entries[0].isIntersecting;schedule();},{threshold:.1}).observe(root);
  }else inView=true;
  updatePause();show(0);
}
$$('[data-carousel]').forEach(createCarousel);

const homeButtons=$$('[data-home-example]'),answers=$$('.home-answer');
homeButtons.forEach((button,index)=>button.addEventListener('click',()=>{
  homeButtons.forEach((tab,i)=>{tab.setAttribute('aria-pressed',String(i===index));tab.classList.toggle('is-active',i===index);});
  answers.forEach((answer,i)=>{answer.setAttribute('aria-hidden',String(i!==index));answer.inert=i!==index;});
}));

if('IntersectionObserver' in window&&!reducedMotion.matches){
  document.body.classList.add('motion-ready');
  const observer=new IntersectionObserver(entries=>{
    for(const entry of entries)if(entry.isIntersecting){entry.target.classList.add('is-visible');observer.unobserve(entry.target);}
  },{threshold:.08,rootMargin:'0px 0px 15px 0px'});
  $$('.reveal').forEach(element=>observer.observe(element));
}
