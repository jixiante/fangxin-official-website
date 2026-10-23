import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {runInNewContext} from 'node:vm';
const html=await readFile(new URL('../dist/zh/explore/wellness/index.html',import.meta.url),'utf8');
assert(!html.includes('class="breadcrumb"')&&!html.includes('class="page-nav"'));
for(let i=0;i<3;i++){
  assert(html.includes(`data-open="wellness-route-${i}"`));
  const modal=html.split(`id="wellness-route-${i}"`)[1].split('</dialog>')[0];
  assert.equal((modal.match(/<dt>/g)||[]).length,4);
  assert(modal.includes('data-close')&&modal.includes('aria-labelledby'));
}
assert(html.includes('data-src="/assets/films/N03.mp4"'));
const code=await readFile(new URL('../wellness.js',import.meta.url),'utf8');
for(const reduced of [true,false]){
  const events={},message={},retry={hidden:true,addEventListener:(name,fn)=>events.retry=fn};
  const video={error:null,addEventListener:(name,fn)=>events[name]=fn,play:()=>Promise.reject(Error('blocked')),load(){this.loaded=true}};
  const dialog={querySelector:s=>s==='video'?video:s==='[role="status"]'?message:retry};
  const classes=new Set(['reveal']);
  const card={classList:{add:s=>classes.add(s),remove:s=>classes.delete(s)},addEventListener:(name,fn)=>events.transition=fn};
  const root={classList:{add(){}},querySelector:s=>s==='#wellness-video'?dialog:{addEventListener:(name,fn)=>events.open=fn},querySelectorAll:()=>[card]};
  let observerCreated=false,notify;
  class Observer{constructor(callback){observerCreated=true;notify=callback}observe(){}unobserve(){}}
  runInNewContext(code,{document:{querySelector:()=>root},window:{matchMedia:()=>({matches:reduced})},IntersectionObserver:Observer});
  assert.equal(observerCreated,!reduced);
  if(!reduced){notify([{target:card,isIntersecting:true}]);assert(classes.has('is-visible'));events.transition({target:card});assert(!classes.has('reveal'))}
  events.open();await Promise.resolve();assert(message.textContent.includes('播放按钮'));
  video.error={code:4};events.error();assert(!retry.hidden&&message.textContent.includes('原始发布页'));
  events.retry();await Promise.resolve();assert(video.loaded&&retry.hidden);
  events.loadeddata();assert(retry.hidden&&message.textContent.includes('文化影像'));
}
runInNewContext(code,{document:{querySelector:()=>null}});
console.log('PASS: wellness route dialogs, removed navigation, lazy video, blocked playback, error/retry and reduced motion.');
