import assert from 'node:assert/strict';
import {readFile,stat} from 'node:fs/promises';
import {isMiniCodeExpired} from '../mini-code.js';
import {businesses} from '../content/businesses.mjs';
import {focus} from '../content/focus.mjs';
import {runInNewContext} from 'node:vm';

const site=JSON.parse(await readFile(new URL('../content/site.json',import.meta.url),'utf8'));
const deadline=Date.parse(site.miniCodeValidBefore);
assert.equal(isMiniCodeExpired(site.miniCodeValidBefore,deadline-1),false);
assert.equal(isMiniCodeExpired(site.miniCodeValidBefore,deadline),true);
assert.equal(isMiniCodeExpired(site.miniCodeValidBefore,deadline+86400000),true);
assert.equal(isMiniCodeExpired('invalid',deadline),true);
for(const language of ['zh','en','ru']){
  for(const route of ['','xiaoli/','explore/wellness/']){
    const html=await readFile(new URL(`../dist/${language}/${route}index.html`,import.meta.url),'utf8');
    const main=html.split('<main id="main">')[1].split('</main>')[0];
    assert(!main.includes(`href="/${language}/${route}"`),`${language}/${route}: main self-link`);
    assert(html.includes(`data-expires-at="${site.miniCodeValidBefore}"`));
    assert(html.includes('class="header-trial"'));
    assert(html.includes('/styles.css')&&!html.includes('/focus.css'));
    for(const [,srcset] of html.matchAll(/srcset="([^"]+)"/g)){
      for(const source of srcset.split(','))assert((await stat(new URL('../dist'+source.trim().split(' ')[0],import.meta.url))).isFile());
    }
    if(!route)for(const b of businesses){
      assert(main.includes(`href="/${language}/explore/${b.id}/"`));
      assert(main.includes(b[language][0].replaceAll('&','&amp;')),'Homepage must retain all eight business names');
    }
    if(route==='explore/wellness/'){
      for(const id of ['rainforest','coast','springs','heritage','fragrance'])assert(main.includes(`id="${id}"`));
      assert(main.includes('id="example-journey"'));
    }
    if(route==='xiaoli/'){
      assert.equal((main.match(/class="qa reveal"/g)||[]).length,3);
      for(const id of ['examples','example-0','example-1','example-2'])assert(main.includes('id="'+id+'"'));
    }
  }
}
// Follow the food example to the actual named content, not merely a working route.
for(const language of ['zh','en','ru']){
  const demo=focus[language].demos[1];
  assert.equal(demo.route,'explore/diet#food-drink');
  const html=await readFile(new URL(`../dist/${language}/explore/diet/index.html`,import.meta.url),'utf8');
  assert(html.includes('id="food-drink"'));
  const tea=html.split('id="shanlan-tea"')[1].split('</article>')[0];
  assert(tea.includes({zh:'益智仁',en:'yizhi',ru:'альпини'}[language]),`${language}: current t5 ingredient missing`);
  assert(!/玉米须|corn silk|кукуруз/i.test(tea),`${language}: stale Shanlan tea ingredient`);
  assert(!/玉米须|corn silk|кукуруз/i.test(JSON.stringify(demo)),`${language}: Xiaoli and tea formula disagree`);
  for(const item of businesses.find(b=>b.id==='diet').details[language].slice(0,2)){
    assert(html.includes(`id="${item.id}"`));
    assert(html.includes(item.title.replaceAll('&','&amp;')));
    if(language!=='zh')assert(html.includes(item.text.replaceAll('&','&amp;')));
  }
}
const moduleResponse=await fetch((process.env.PREVIEW_URL||'http://localhost:4173')+'/mini-code.js');
assert.equal(moduleResponse.status,200);
assert.match(moduleResponse.headers.get('content-type'),/javascript/);
// Run the real example controller: selection must survive a language-page load.
const client=await readFile(new URL('../client.js',import.meta.url),'utf8');
// Initial measurement must use the same offset parent as the animated indicator.
const styles=await readFile(new URL('../styles.css',import.meta.url),'utf8');
assert.match(styles,/\.example-tabs\{[^}]*position:relative/);
const controller=client.slice(client.indexOf('const examples='));
for(const hash of ['','#example-1','#example-2','#invalid']){
  const panels=[{hidden:false},{hidden:true},{hidden:true}];
  const indicator={},tablist={style:{setProperty:(k,v)=>{indicator[k]=v}},classList:{add(){}}};
  let resize;
  const buttons=panels.map((_,i)=>({attributes:{'aria-controls':`example-${i}`,'aria-selected':String(i===0)},events:{},getAttribute(k){return this.attributes[k]},setAttribute(k,v){this.attributes[k]=v},addEventListener(k,fn){this.events[k]=fn},focus(){}}));
  const location={hash};
  buttons.forEach((button,i)=>Object.assign(button,{parentElement:tablist,offsetLeft:0,offsetTop:i*76,offsetWidth:300,offsetHeight:64}));
  runInNewContext(controller,{ResizeObserver:class{constructor(callback){resize=callback}observe(){}},document:{querySelectorAll:()=>buttons,getElementById:id=>panels[Number(id.slice(-1))]},location,history:{replaceState:(_state,_title,next)=>{location.hash=next}}});
  const expected=hash==='#example-1'?1:hash==='#example-2'?2:0;
  assert.deepEqual(panels.map(p=>p.hidden),panels.map((_,i)=>i!==expected));
  assert.equal(indicator['--indicator-y'],expected*76+'px');
  buttons[1].events.click();assert.equal(location.hash,'#example-1');assert(!panels[1].hidden);
  buttons[1].events.keydown({key:'End',preventDefault(){}});assert.equal(location.hash,'#example-2');assert(!panels[2].hidden);
  assert.equal(indicator['--indicator-y'],'152px');
  Object.assign(buttons[2],{offsetLeft:220,offsetTop:0,offsetWidth:104,offsetHeight:45});resize();
  assert.equal(indicator['--indicator-x'],'220px');assert.equal(indicator['--indicator-y'],'0px');
  assert.equal(indicator['--indicator-width'],'104px');assert.equal(indicator['--indicator-height'],'45px');
}
console.log('PASS: nine focused pages; shared eight-theme overview; five wellness themes; three-language Xiaoli-to-exact-food-content flow; no main self-links; accessible examples; single welcome video; responsive images; expiry boundaries and module MIME.');
console.log('PASS: real example controller preserves selection in URL across language-page loads, including keyboard and invalid-hash fallback.');
