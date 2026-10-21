import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {runInNewContext} from 'node:vm';

const source=await readFile(new URL('../homepage.js',import.meta.url),'utf8');
const controller=source.slice(source.indexOf('function createCarousel'),source.indexOf("$$('[data-carousel]')"));
for(const reduced of [false,true]){
  const element=()=>({events:{},attributes:{},classList:{toggle(){}},firstElementChild:{},setAttribute(k,v){this.attributes[k]=v},addEventListener(k,v){this.events[k]=v}});
  const root=element(),slides=Array.from({length:3},element),pause=element(),prev=element(),next=element(),count={};
  Object.assign(root,{dataset:{delay:'7000'},contains:()=>false});
  const controls={'[data-carousel-pause]':pause,'[data-carousel-prev]':prev,'[data-carousel-next]':next,'.carousel-count':count};
  pause.dataset={labelPlay:'开始自动轮播',labelPause:'暂停自动轮播'};
  const media={matches:reduced,addEventListener(){}},doc={hidden:false,body:{},events:{},querySelector:()=>null,addEventListener(k,v){this.events[k]=v}};
  let timer,intersection,modalChanged;
  runInNewContext(controller+'\ncreateCarousel(root);',{
    root,$:s=>controls[s],$$:s=>s==='.slide'?slides:[],reducedMotion:media,document:doc,
    window:{IntersectionObserver:true},IntersectionObserver:class{constructor(cb){intersection=cb}observe(){}},
    MutationObserver:class{constructor(cb){modalChanged=cb}observe(){}},
    setTimeout:cb=>{timer=cb;return 1},clearTimeout:()=>{timer=undefined},requestAnimationFrame:cb=>cb()
  });
  assert.equal(count.textContent,'01 / 03');assert(!timer,'Offscreen carousel must not run');
  intersection([{isIntersecting:true}]);assert.equal(Boolean(timer),!reduced);
  if(!reduced){
    timer();assert.equal(count.textContent,'02 / 03');assert(slides[0].inert&&!slides[1].inert);
    root.events.mouseenter();assert(!timer);root.events.mouseleave();assert(timer);
    doc.hidden=true;doc.events.visibilitychange();assert(!timer);doc.hidden=false;doc.events.visibilitychange();assert(timer);
    doc.querySelector=()=>({open:true});modalChanged();assert(!timer);doc.querySelector=()=>null;modalChanged();assert(timer);
  }
  next.events.click();assert(!timer);assert.equal(pause.attributes['aria-label'],'开始自动轮播');
  const chosen=count.textContent;intersection([{isIntersecting:false}]);intersection([{isIntersecting:true}]);
  assert(!timer);assert.equal(count.textContent,chosen,'Manual pause must survive scrolling');
  pause.events.click();assert.equal(Boolean(timer),!reduced);
  prev.events.click();assert(!timer);assert.equal(slides.filter(s=>!s.inert).length,1);
}
// Exercise the real hero controller: dots, swipe direction, cancellation and autoplay.
{
 const el=()=>({events:{},attributes:{},classList:{toggle(){}},firstElementChild:{},setAttribute(k,v){this.attributes[k]=v},addEventListener(k,v){this.events[k]=v}});
 const root=el(),stage=el(),pause=el(),slides=Array.from({length:3},el),dots=Array.from({length:3},el);
 const animations=[];
 slides.forEach(slide=>{
   slide.style={removeProperty(property){delete this[property]}};
   slide.animate=(frames,options)=>{const animation={frames,options,cancelled:false,cancel(){this.cancelled=true}};animations.push(animation);return animation};
 });
 root.dataset={delay:'3000'};root.contains=()=>false;stage.setPointerCapture=()=>{};
 stage.getBoundingClientRect=()=>({width:1000});
 pause.dataset={labelPlay:'Play',labelPause:'Pause'};
 let timer,delay,intersection,keyboardFocus=false;
 const doc={activeElement:{matches:()=>keyboardFocus},hidden:false,body:{},querySelector:()=>null,addEventListener(){}};
 runInNewContext(controller+'\ncreateCarousel(root);',{root,$:s=>({'[data-carousel-pause]':pause,'.hero-slides':stage}[s]),$$:s=>s==='.slide'?slides:dots,
 reducedMotion:{matches:false,addEventListener(){}},document:doc,
 window:{IntersectionObserver:true},IntersectionObserver:class{constructor(cb){intersection=cb}observe(){}},MutationObserver:class{observe(){}},
 setTimeout:(cb,ms)=>{timer=cb;delay=ms;return 1},clearTimeout:()=>{timer=undefined},requestAnimationFrame:cb=>cb()});
 const selected=()=>dots.findIndex(d=>d.attributes['aria-pressed']==='true');
 const down=(x=200,y=100)=>stage.events.pointerdown({isPrimary:true,button:0,pointerId:1,clientX:x,clientY:y});
 const up=(x,y=100)=>stage.events.pointerup({pointerId:1,clientX:x,clientY:y});
 const move=(x,y=100)=>stage.events.pointermove({pointerId:1,clientX:x,clientY:y});
 intersection([{isIntersecting:true}]);assert(timer);assert.equal(selected(),0);
 assert.equal(delay,3000,'Hero must automatically advance every three seconds');
 root.events.mouseenter();assert(timer,'Hero must keep rotating while hovered');
 root.contains=()=>true;root.events.focusin();assert(timer,'Pointer focus must not stop hero autoplay');
 keyboardFocus=true;root.events.focusin();assert(!timer,'Keyboard navigation must still pause autoplay');
 keyboardFocus=false;dots[0].events.click();assert(timer,'Clicking a dot restores autoplay after keyboard focus');
 root.contains=()=>false;root.events.focusout();assert(timer);
 dots[2].events.click();assert.equal(selected(),2);assert(timer,'Dot selection retains automatic playback');
 assert.equal(animations.at(-1).frames[0].transform,'translateX(100%)');
 assert.equal(animations.at(-2).frames[1].transform,'translateX(-100%)');
 down();assert(!timer);move(80);
 assert.equal(selected(),2,'Dragging must not commit the slide before release');
 assert.equal(slides[2].style.transform,'translateX(-12%)','Current image follows the pointer before release');
 assert.equal(slides[0].style.transform,'translateX(88%)','Adjacent image follows at exactly one slide width');
 up(80);assert.equal(selected(),0,'Swipe left wraps to first');assert(timer);
 assert(animations[0].cancelled,'Rapid switching must cancel old slide animations');
 assert.equal(animations.at(-1).frames[0].transform,'translateX(88%)','Release continues from the dragged position');
 assert.equal(slides[0].style.transform,undefined,'Release clears temporary drag styles');
 down();up(300);assert.equal(selected(),2,'Swipe right selects previous');
 assert.equal(animations.at(-1).frames[0].transform,'translateX(-90%)','Backwards swipe slides in from the left');
 down();up(210);assert.equal(selected(),2,'Small movements must not change slide');
 assert.equal(animations.at(-2).frames[0].transform,'translateX(1%)');
 assert.equal(animations.at(-2).frames[1].transform,'translateX(0%)','Short drags smoothly snap back');
 down();up(120,300);assert.equal(selected(),2,'Vertical page scrolling must not change slide');
 down();move(80);move(300);
 assert.equal(slides[0].style.transform,undefined,'Reversing direction clears the old neighbor');
 assert.equal(slides[1].style.transform,'translateX(-90%)');
 stage.events.pointercancel();up(60);assert.equal(selected(),2);assert(timer);
 assert.equal(slides[1].style.transform,undefined,'Cancelled drags clear temporary styles');
 pause.events.click();assert(!timer);dots[0].events.click();assert(!timer,'Explicit pause survives dot selection');
 pause.events.click();timer();assert.equal(selected(),1);assert.equal(slides.filter(s=>!s.inert).length,1);
}
for(const lang of ['zh','en','ru']){
const html=await readFile(new URL(`../dist/${lang}/index.html`,import.meta.url),'utf8');
assert.equal((html.match(/data-carousel="/g)||[]).length,2);
assert.equal((html.match(/data-carousel-dot=/g)||[]).length,3);
const hero=html.split('<section class="hero carousel"')[1].split('</section>')[0];
assert(hero.includes('data-delay="3000"'),`${lang}: hero autoplay must use three seconds`);
assert(!/hero-desc|hero-kicker|hero-en|hero-actions|hero-side-note|data-carousel-prev|data-carousel-next|carousel-count/.test(hero));
assert.equal((html.match(/class="business-card reveal"/g)||[]).length,8);
assert.equal((html.match(/data-home-example=/g)||[]).length,3);
assert(!html.includes('data:image/'));assert(!html.includes('https://47.92.248.31/official'));
assert(html.includes('/assets/films/C01.mp4')&&html.includes('/assets/films/Z03.mp4'));
assert.equal((html.match(/class="chat-response home-answer"/g)||[]).length,3);
const main=html.split('<main id="main">')[1].split('</main>')[0];
if(lang!=='zh')assert(!/[\p{Script=Han}]/u.test(main),`${lang}: untranslated homepage text`);
for(const [,link] of main.matchAll(/href="(\/[^"]+)"/g))assert(link.startsWith('/'+lang+'/'),`${lang}: wrong-language destination ${link}`);
assert(!html.includes('<!--HOME_EXAMPLES-->'));
}
const details=await readFile(new URL('../dist/zh/explore/beauty/index.html',import.meta.url),'utf8');
assert(!details.includes('/homepage.css'),'Homepage styles must not reach detail pages');
console.log('PASS: homepage routes, assets and carousel autoplay, manual pause, hidden slides, hover, offscreen, background, dialog and reduced-motion behavior.');

{
 const states=[],events={},window={scrollY:0,addEventListener:(name,cb)=>events[name]=cb};
 runInNewContext(source.slice(source.indexOf("const homeHeader=")),{window,$:()=>({classList:{toggle:(name,on)=>states.push(on)}})});
 assert.equal(states.at(-1),false);
 window.scrollY=80;events.scroll();assert.equal(states.at(-1),true);
 window.scrollY=0;events.pageshow();assert.equal(states.at(-1),false);
}
