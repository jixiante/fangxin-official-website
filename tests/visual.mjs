import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {runInNewContext} from 'node:vm';

const client=await readFile(new URL('../client.js',import.meta.url),'utf8');
const playerCode=client.slice(client.indexOf("document.querySelectorAll('.film-player')"),client.indexOf('const examples='));
// Exercise the real controller, including browser playback refusal and media errors.
for(const rejected of [false,true]){
  const events={},cover={hidden:true,addEventListener:(name,fn)=>{events['cover-'+name]=fn}};
  const video={controls:true,focused:false,play:()=>rejected?Promise.reject(Error('Blocked')):Promise.resolve(),focus(){this.focused=true},addEventListener:(name,fn)=>{events[name]=fn}};
  const player={querySelector:selector=>selector==='video'?video:cover};
  runInNewContext(playerCode,{document:{querySelectorAll:()=>[player]}});
  assert.equal(cover.hidden,false);
  assert.equal(video.controls,false);
  events['cover-click']();
  await Promise.resolve();
  assert(cover.hidden&&video.controls&&video.focused,'Playback and refusal must retain accessible native controls');
  cover.hidden=false;video.controls=false;
  events.error();
  assert(cover.hidden&&video.controls,'Media errors must not leave an unusable overlay');
}
console.log('PASS: film covers support playback, rejected playback, focus and native error fallback.');

// A restored scroll position must show the control; returning must retain keyboard focus and motion preferences.
const topCode=client.slice(client.indexOf('const backToTop='),client.indexOf('// Native controls remain'));
for(const reduced of [false,true]){
  const events={},button={hidden:true,addEventListener:(name,fn)=>{events[name]=fn}};
  let focusOptions,scrollOptions;
  const browser={scrollY:0,innerHeight:900,addEventListener:(name,fn)=>{events[name]=fn},matchMedia:()=>({matches:reduced}),scrollTo:options=>{scrollOptions=options}};
  runInNewContext(topCode,{window:browser,document:{querySelector:selector=>selector==='.back-to-top'?button:{focus:options=>{focusOptions=options}}}});
  assert(button.hidden);
  browser.scrollY=900;events.pageshow();assert(!button.hidden);
  events.click();assert.equal(scrollOptions.top,0);assert.equal(scrollOptions.behavior,reduced?'instant':'smooth');assert(focusOptions.preventScroll);
  browser.scrollY=0;events.scroll();assert(button.hidden);
}
for(const [language,label] of Object.entries({zh:'返回顶部',en:'Back to top',ru:'Наверх'})){
  const html=await readFile(new URL(`../dist/${language}/index.html`,import.meta.url),'utf8');
  assert(html.includes(`class="back-to-top" type="button" aria-label="${label}"`));
}
console.log('PASS: back-to-top visibility, restored scroll, keyboard focus, reduced motion and localized labels.');

const detailCode=await readFile(new URL('../business-detail.js',import.meta.url),'utf8');
const detailEvents={},detailLocation={hash:''};
const detailCards=['masks','tools'].map((category,i)=>({id:'item-'+i,hidden:false,dataset:{detailCategory:category},matches:()=>true,scrollIntoView(){this.scrolled=true}}));
const detailButtons=['all','masks','tools'].map(category=>({dataset:{detailFilter:category},setAttribute(name,value){this[name]=value},addEventListener(name,fn){this[name]=fn}}));
const detailFilters={hidden:true,querySelectorAll:()=>detailButtons};
const detailRoot={querySelector:()=>detailFilters,querySelectorAll:selector=>selector==='[data-detail-category]'?detailCards:detailButtons};
runInNewContext(detailCode,{document:{querySelector:selector=>selector==='#business-content'?detailRoot:null,querySelectorAll:()=>[],getElementById:id=>detailCards.find(card=>card.id===id)},window:{addEventListener:(name,fn)=>{detailEvents[name]=fn}},location:detailLocation});
assert.equal(detailFilters.hidden,false);
detailButtons[2].click();
assert.deepEqual(detailCards.map(card=>card.hidden),[true,false]);
assert.equal(detailButtons[2]['aria-pressed'],'true');
detailLocation.hash='#item-0';detailEvents.hashchange();
assert(detailCards.every(card=>!card.hidden),'Linked items must remain reachable after filtering');
assert(detailCards[0].scrolled);
assert.equal(detailButtons[0]['aria-pressed'],'true');
detailLocation.hash='#%invalid';assert.doesNotThrow(()=>detailEvents.hashchange());
runInNewContext(detailCode,{document:{querySelector:()=>null,querySelectorAll:()=>[]}});
console.log('PASS: detail filters, hidden-item anchor recovery, malformed anchors and pages without catalogs.');

for(const reduced of [false,true]){
 let notify;const observed=[];
 const cards=[{top:100,target:false},{top:1200,target:false},{top:1200,target:true}].map(({top,target})=>({classes:new Set(),getBoundingClientRect:()=>({top}),matches:()=>target}));
 cards.forEach(card=>{card.classList={add:name=>card.classes.add(name),remove:name=>card.classes.delete(name)}});
 class Observer{constructor(callback){notify=callback}observe(card){observed.push(card)}unobserve(card){observed.splice(observed.indexOf(card),1)}}
 runInNewContext(detailCode,{document:{querySelector:()=>null,querySelectorAll:selector=>selector.includes('detail-image-trigger')||selector.includes('film-frame')?[]:cards},window:{innerHeight:900,matchMedia:()=>({matches:reduced})},IntersectionObserver:Observer});
 assert(!cards[0].classes.size&&!cards[2].classes.size,'Visible cards and direct anchors must never be hidden');
 if(reduced){assert(!observed.length);assert(!cards[1].classes.size)}else{
  assert.equal(observed.length,1);assert(cards[1].classes.has('detail-reveal'));
  notify([{target:cards[1],isIntersecting:true}]);assert(!cards[1].classes.size);assert(!observed.length);
 }
}
console.log('PASS: offscreen reveals preserve visible content, direct anchors and reduced-motion access.');

// A reference film must not instantiate a player before activation, and must recover from media failure.
const referencePlayerCode=detailCode.slice(detailCode.indexOf("document.querySelectorAll('.film-frame[data-src]')"));
for(const rejected of [false,true]){
 const created=[],events={};
 const frame={dataset:{src:'/assets/films/M01.mp4',title:'护理影像'},children:[],querySelector:selector=>selector==='.film-play'?{addEventListener:(name,fn)=>events[name]=fn}:frame.children.find(el=>el.className==='film-error'),replaceChildren(...children){this.children=children},append(el){this.children.push(el)}};
 const make=tag=>{
  const el={tag,events:{},children:[],setAttribute(k,v){this[k]=v},addEventListener(k,v){this.events[k]=v},append(...items){this.children.push(...items)},focus(){this.focused=true},play(){return rejected?Promise.reject(Error('blocked')):Promise.resolve()},load(){this.loaded=true},remove(){frame.children=frame.children.filter(x=>x!==this)}};
  created.push(el);return el;
 };
 runInNewContext(referencePlayerCode,{document:{querySelectorAll:()=>[frame],createElement:make}});
 assert.equal(created.length,0,'Posters must not load videos eagerly');
 let prevented=false;events.click({preventDefault(){prevented=true}});await Promise.resolve();
 const video=created[0];assert(prevented&&video.tag==='video'&&video.controls&&video.playsInline&&video.focused);
 assert.equal(video.preload,'auto');assert.equal(video.src,frame.dataset.src);
 video.events.error();video.events.error();assert.equal(frame.children.filter(el=>el.className==='film-error').length,1);
 const error=frame.children[1],direct=error.children[1],retry=error.children[2];
 assert.equal(direct.href,frame.dataset.src);assert.equal(error.role,'status');
 retry.events.click();await Promise.resolve();assert(video.loaded&&frame.children.length===1&&video.controls);
}
console.log('PASS: reference poster activation, native playback refusal, media error, direct-open fallback and retry.');

let revealCallback,observerOptions;
const referenceCards=[0,1].map(()=>({style:{},classes:new Set(),events:{},matches:()=>false,addEventListener(name,fn){this.events[name]=fn}}));
referenceCards.forEach(card=>{card.classList={add:name=>card.classes.add(name),remove:name=>card.classes.delete(name)}});
class ReferenceObserver{constructor(callback,options){revealCallback=callback;observerOptions=options}observe(){}unobserve(){}}
runInNewContext(detailCode,{document:{querySelector:selector=>selector==='.detail-reference'?{}:null,querySelectorAll:selector=>selector==='.detail-reference .reveal'?referenceCards:[]},window:{matchMedia:()=>({matches:false})},IntersectionObserver:ReferenceObserver});
assert.equal(observerOptions.threshold,.12);assert.equal(observerOptions.rootMargin,'0px 0px -40px 0px');
assert(referenceCards.every(card=>card.classes.has('reference-pending')));
revealCallback(referenceCards.map(target=>({target,isIntersecting:true})));
assert.deepEqual(referenceCards.map(card=>card.style.animationDelay),['0ms','70ms']);
referenceCards.forEach(card=>{assert(card.classes.has('in'));card.events.animationend();assert(!card.classes.size,'Finished reveals must not override hover transforms')});
console.log('PASS: reference reveal threshold, stagger and handoff to hover animation.');
