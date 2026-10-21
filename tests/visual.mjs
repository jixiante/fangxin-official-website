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
