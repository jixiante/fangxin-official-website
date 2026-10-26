import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const read=name=>readFile(new URL('../'+name,import.meta.url),'utf8');
const sources=JSON.parse(await read('content/editorial-reference/sources.json'));
for(const [page,reference] of Object.entries(sources)){
 for(const asset of reference.assets){
  const bytes=await readFile(new URL('../'+asset.path.slice(1),import.meta.url));
  assert.equal(createHash('sha256').update(bytes).digest('hex'),asset.sha256,'Reference image must remain unchanged');
 }
 const template=await read(`content/editorial-reference/${page}.html`);
 for(const lang of ['zh','en','ru']){
  const html=await read(`dist/${lang}/${page}/index.html`);
  const main=html.split('<main id="main">')[1].split('</main>')[0];
  assert(!main.includes('data:image')&&!main.includes('47.92.248.31'),'Local, cacheable assets and routes');
  assert(html.includes('/editorial-reference.css')&&html.includes('/business-detail.js'));
  assert.equal((main.match(/<article /g)||[]).length,page==='xiaoli'?3:12);
  assert.equal((main.match(/data-open="mini"/g)||[]).length,1);
  assert(!main.includes('class="en"')&&!main.includes('cta-eyebrow'));
  for(const [,src] of template.matchAll(/\bsrc="([^"]+)"/g))assert(main.includes(`src="${src}"`),'Translations must retain reference assets');
  if(lang!=='zh')assert(!/\p{Script=Han}/u.test(main.replace(/<!--.*?-->/gs,'')),'No untranslated Chinese text or labels');
  if(page==='xiaoli'){
   for(const route of ['wellness/#example-journey','diet/#food-drink','limiao/#aromatic-craft'])assert(main.includes(`/${lang}/explore/${route}`));
   assert(main.includes('data-greeting')&&main.includes('xiaoli-greeting-poster.webp'));
  }else{
   assert.equal((main.match(/class="ext"/g)||[]).length,5,'Keep original publisher links');
   assert(!main.includes('<video'),'Players load only after a click');
  }
 }
}
console.log('PASS: reference image hashes, three-language editorial layouts, 12 lazy players, source links and legacy Xiaoli destinations.');
