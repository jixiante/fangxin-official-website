import {isMiniCodeExpired} from './mini-code.js';
import './xiaoli-greeting.js';
const menu=document.querySelector('.menu-toggle');
const nav=document.querySelector('#navigation');
function closeMenu(){menu.setAttribute('aria-expanded','false');nav.classList.remove('open')}
menu.addEventListener('click',()=>{const open=menu.getAttribute('aria-expanded')!=='true';menu.setAttribute('aria-expanded',String(open));nav.classList.toggle('open',open)});
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&menu.getAttribute('aria-expanded')==='true'){closeMenu();menu.focus()}});
document.addEventListener('click',event=>{if(!event.target.closest('.site-header'))closeMenu()});
document.querySelector('[data-language]').addEventListener('change',event=>{location.assign(event.target.value+location.hash)});
let opener;
const mini=document.querySelector('#mini');
function updateMiniCode(){
  if(!mini.dataset.expiresAt)return;
  const expired=isMiniCodeExpired(mini.dataset.expiresAt);
  mini.querySelector('[data-mini-active]').hidden=expired;
  mini.querySelector('[data-mini-expired]').hidden=!expired;
}
updateMiniCode();
document.addEventListener('visibilitychange',updateMiniCode);
document.querySelectorAll('[data-open]').forEach(button=>button.addEventListener('click',()=>{
  updateMiniCode();
  opener=button;closeMenu();const dialog=document.getElementById(button.dataset.open);dialog.showModal();document.body.classList.add('dialog-open');
  const video=dialog.querySelector('video');if(video&&!video.getAttribute('src')){video.src=video.dataset.src;video.load()}
}));
document.querySelectorAll('dialog').forEach(dialog=>{
  dialog.querySelector('[data-close]').addEventListener('click',()=>dialog.close());
  dialog.addEventListener('keydown',event=>{
    if(event.key!=='Tab')return;
    const focusable=[...dialog.querySelectorAll('button,a[href],video[controls],[tabindex="0"]')].filter(el=>el.checkVisibility()&&!el.disabled);
    const first=focusable[0],last=focusable.at(-1);
    if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus()}
    else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus()}
  });
  dialog.addEventListener('click',event=>{if(event.target!==dialog)return;const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close()});
  dialog.addEventListener('close',()=>{dialog.querySelector('video')?.pause();document.body.classList.remove('dialog-open');opener?.focus()});
});
const video=document.querySelector('#film video');
const error=document.querySelector('.video-error');
video.addEventListener('error',()=>{error.hidden=false});
video.addEventListener('loadeddata',()=>{error.hidden=true});
document.querySelector('[data-retry]').addEventListener('click',()=>{error.hidden=true;video.load()});

const backToTop=document.querySelector('.back-to-top');
function updateBackToTop(){backToTop.hidden=window.scrollY<Math.max(400,window.innerHeight*.7)}
window.addEventListener('scroll',updateBackToTop,{passive:true});
window.addEventListener('resize',updateBackToTop);
window.addEventListener('pageshow',updateBackToTop);
updateBackToTop();
backToTop.addEventListener('click',()=>{
  document.querySelector('.brand').focus({preventScroll:true});
  window.scrollTo({top:0,behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
});

// Native controls remain the fallback when playback is blocked or scripting is unavailable.
document.querySelectorAll('.film-player').forEach(player=>{
  const video=player.querySelector('video'),cover=player.querySelector('.film-cover');
  video.controls=false;cover.hidden=false;
  cover.addEventListener('click',()=>{
    cover.hidden=true;video.controls=true;video.focus();
    video.play().catch(()=>{video.controls=true});
  });
  video.addEventListener('error',()=>{cover.hidden=true;video.controls=true});
});

const examples=[...document.querySelectorAll('[data-example]')];
const exampleTabs=examples[0]?.parentElement;
function positionExampleIndicator(){
  const selected=examples.find(tab=>tab.getAttribute('aria-selected')==='true');
  if(!selected)return;
  for(const [property,value] of Object.entries({x:selected.offsetLeft,y:selected.offsetTop,width:selected.offsetWidth,height:selected.offsetHeight})){
    exampleTabs.style.setProperty('--indicator-'+property,value+'px');
  }
}
function selectExample(button){
  examples.forEach(tab=>{const selected=tab===button;tab.setAttribute('aria-selected',String(selected));tab.tabIndex=selected?0:-1;document.getElementById(tab.getAttribute('aria-controls')).hidden=!selected});
  positionExampleIndicator();
  history.replaceState(null,'','#'+button.getAttribute('aria-controls'));
}
const initialExample=examples.find(button=>'#'+button.getAttribute('aria-controls')===location.hash);
if(initialExample)selectExample(initialExample);
if(exampleTabs){
  positionExampleIndicator();
  exampleTabs.classList.add('has-indicator');
  const observer=new ResizeObserver(positionExampleIndicator);
  observer.observe(exampleTabs);
  examples.forEach(tab=>observer.observe(tab));
}
examples.forEach((button,index)=>{
  button.addEventListener('click',()=>selectExample(button));
  button.addEventListener('keydown',event=>{
    const next=event.key==='Home'?0:event.key==='End'?examples.length-1:['ArrowDown','ArrowRight'].includes(event.key)?(index+1)%examples.length:['ArrowUp','ArrowLeft'].includes(event.key)?(index+examples.length-1)%examples.length:null;
    if(next===null)return;
    event.preventDefault();selectExample(examples[next]);examples[next].focus();
  });
});
