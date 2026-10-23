const $=(s,root=document)=>root.querySelector(s);
const $$=(s,root=document)=>[...root.querySelectorAll(s)];
const reducedMotion=window.matchMedia('(prefers-reduced-motion: reduce)');

// Hero dots and swipes restart the interval; the journey arrows pause autoplay.
function createCarousel(root){
  const slides=$$('.slide',root),dots=$$('[data-carousel-dot]',root),pause=$('[data-carousel-pause]',root),count=$('.carousel-count',root);
  const stage=$('.hero-slides',root);
  let index=0,paused=!pause||reducedMotion.matches,hovered=false,focused=false,inView=false,timer,drag;
  let transitions=[];
  const wrap=i=>(i+slides.length)%slides.length;
  function clearDragStyles(){
    if(stage)slides.forEach(slide=>{
      for(const property of ['transform','opacity','visibility'])slide.style.removeProperty(property);
    });
  }
  function clearMotion(){
    transitions.forEach(animation=>animation.cancel());
    transitions=[];
    clearDragStyles();
  }
  function animatePair(from,to,direction,start,end){
    if(reducedMotion.matches)return;
    const options={duration:500,easing:'cubic-bezier(.25,.8,.25,1)'};
    const frame=x=>({transform:`translateX(${x}%)`,opacity:1,visibility:'visible'});
    transitions=[
      slides[from].animate([frame(start),frame(end)],options),
      slides[to].animate([frame(start+100*direction),frame(end+100*direction)],options)
    ];
  }
  function schedule(){
    clearTimeout(timer);
    if(!paused&&!drag&&!reducedMotion.matches&&!hovered&&!focused&&inView&&!document.hidden&&!document.querySelector('dialog[open]')){
      timer=setTimeout(()=>show(index+1),Number(root.dataset.delay));
    }
  }
  function updatePause(){
    if(!pause)return;
    pause.setAttribute('aria-pressed',String(paused));
    pause.setAttribute('aria-label',paused?pause.dataset.labelPlay:pause.dataset.labelPause);
    pause.firstElementChild.textContent=paused?'▷':'‖';
  }
  function show(next,offset=0){
    const previous=index,direction=next>index?1:-1;
    index=wrap(next);
    clearMotion();
    slides.forEach((slide,i)=>{
      slide.classList.toggle('is-active',i===index);
      slide.setAttribute('aria-hidden',String(i!==index));
      slide.inert=i!==index;
    });
    if(stage&&previous!==index)animatePair(previous,index,direction,offset,-100*direction);
    if(count)count.textContent=`0${index+1} / 0${slides.length}`;
    dots.forEach((dot,i)=>dot.setAttribute('aria-pressed',String(i===index)));
    schedule();
  }
  for(const [selector,step] of [['[data-carousel-prev]',-1],['[data-carousel-next]',1]]){
    $(selector,root)?.addEventListener('click',()=>{paused=true;updatePause();show(index+step);});
  }
  dots.forEach((dot,i)=>dot.addEventListener('click',()=>{syncFocus();show(i)}));
  if(stage){
    function moveDrag(event){
      if(!drag||drag.id!==event.pointerId)return;
      const dx=event.clientX-drag.x,dy=event.clientY-drag.y;
      if(!drag.axis&&Math.max(Math.abs(dx),Math.abs(dy))>=8){
        drag.axis=Math.abs(dx)>Math.abs(dy)*1.25?'x':'y';
        if(drag.axis==='x')clearMotion();
      }
      if(drag.axis!=='x')return;
      drag.offset=Math.max(-100,Math.min(100,dx/drag.width*100));
      drag.direction=dx<0?1:-1;
      clearDragStyles();
      if(!reducedMotion.matches){
        for(const [i,offset] of [[index,drag.offset],[wrap(index+drag.direction),drag.offset+100*drag.direction]]){
          Object.assign(slides[i].style,{transform:`translateX(${offset}%)`,opacity:'1',visibility:'visible'});
        }
      }
    }
    function finishDrag(commit){
      if(!drag)return;
      const {axis,offset,direction}=drag;
      drag=undefined;
      clearMotion();
      if(commit)show(index+direction,offset);
      else{
        if(axis==='x')animatePair(index,wrap(index+direction),direction,offset,0);
        schedule();
      }
    }
    stage.addEventListener('dragstart',event=>event.preventDefault());
    stage.addEventListener('pointerdown',event=>{
      if(!event.isPrimary||event.button!==0||drag)return;
      drag={id:event.pointerId,x:event.clientX,y:event.clientY,width:stage.getBoundingClientRect().width,offset:0};
      stage.setPointerCapture(event.pointerId);schedule();
    });
    stage.addEventListener('pointermove',moveDrag);
    stage.addEventListener('pointerup',event=>{
      if(!drag||drag.id!==event.pointerId)return;
      moveDrag(event);
      finishDrag(drag.axis==='x'&&Math.abs(event.clientX-drag.x)>=48);
    });
    const cancelDrag=()=>finishDrag(false);
    stage.addEventListener('pointercancel',cancelDrag);
    stage.addEventListener('lostpointercapture',cancelDrag);
  }
  pause?.addEventListener('click',()=>{paused=!paused;updatePause();schedule();});
  root.addEventListener('mouseenter',()=>{hovered=!stage;schedule();});
  root.addEventListener('mouseleave',()=>{hovered=false;schedule();});
  function syncFocus(){
    focused=root.contains(document.activeElement)&&(!stage||document.activeElement.matches(':focus-visible'));
    schedule();
  }
  root.addEventListener('focusin',syncFocus);
  root.addEventListener('focusout',()=>requestAnimationFrame(syncFocus));
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
// The placeholder is not localized by the build step, so sync it from the translated label.
$$('.xiaoli-input').forEach(input=>{input.placeholder=input.getAttribute('aria-label')||''});
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

const homeHeader=$('.site-header');
function updateHomeHeader(){homeHeader.classList.toggle('is-scrolled',window.scrollY>24)}
window.addEventListener('scroll',updateHomeHeader,{passive:true});
window.addEventListener('pageshow',updateHomeHeader);
updateHomeHeader();
