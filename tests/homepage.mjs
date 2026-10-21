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
    root,$:s=>controls[s],$$:()=>slides,reducedMotion:media,document:doc,
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
for(const lang of ['zh','en','ru']){
const html=await readFile(new URL(`../dist/${lang}/index.html`,import.meta.url),'utf8');
assert.equal((html.match(/data-carousel="/g)||[]).length,2);
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
