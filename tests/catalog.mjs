import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {catalog,routeIdeas,featuredFacts,selectionReasons} from '../content/catalog.mjs';

const films=JSON.parse(await readFile(new URL('../content/films.json',import.meta.url)));
const routes=JSON.parse(await readFile(new URL('../dist/routes.json',import.meta.url)));
for(const route of routes){
 const html=await readFile(new URL(`../dist${route}index.html`,import.meta.url),'utf8');
 assert(!/AI 场景|AI 主题|AI-generated|сцена создана ИИ|созданные ИИ/i.test(html),`Unexpected foreground image label: ${route}`);
 const ids=[...html.matchAll(/\sid="([^"]+)"/g)].map(x=>x[1]);
 assert.equal(new Set(ids).size,ids.length,`Duplicate anchor: ${route}`);
 for(const [,video] of html.matchAll(/(<video\b[^>]*>)/g)){
  assert(video.includes('preload="none"')&&video.includes('playsinline'),route);
  assert(video.includes('controls'),route);
  assert(!/\sautoplay\b/.test(video),route);
 }
}
for(const lang of ['zh','en','ru']){
 for(const [page,items] of Object.entries(catalog)){
  const html=await readFile(new URL(`../dist/${lang}/explore/${page}/index.html`,import.meta.url),'utf8');
  for(const item of items){
   assert(item.source&&item[lang]?.every(Boolean),`Missing source or translation: ${item.id}`);
   assert(html.includes(`id="${item.id}"`),`Lost content destination: ${lang}/${item.id}`);
   assert(item.facts[lang]?.length===item.facts.zh.length,`Missing translated details: ${lang}/${item.id}`);
   const article=html.split(`id="${item.id}"`)[1].split('</article>')[0];
   // Chinese detail copy now follows the supplied HTML; source records and translations remain intact.
   if(lang==='zh'){assert(article.includes('class="specs"'),`No reference specifications: ${item.id}`);continue;}
   assert(article.includes('<dl class="catalog-facts">'),`No visible facts: ${lang}/${item.id}`);
   const articleText=article.replace(/<[^>]+>/g,'');
   for(const [label,value] of item.facts[lang])assert(articleText.includes(value.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;')),`Detail dropped by shared renderer: ${lang}/${item.id}/${label}`);
  }
 }
 const wellness=await readFile(new URL(`../dist/${lang}/explore/wellness/index.html`,import.meta.url),'utf8');
 for(const route of routeIdeas){
  const article=wellness.split(`id="${route.id}"`)[1].split('</article>')[0];
  assert.equal((article.match(/<dt>/g)||[]).length,4,`Missing own itinerary: ${lang}/${route.id}`);
  assert(!article.includes('<a '),`Route still leads to unrelated content: ${route.id}`);
 }
 const diet=await readFile(new URL(`../dist/${lang}/explore/diet/index.html`,import.meta.url),'utf8');
 for(const id of Object.keys(featuredFacts))assert(diet.split(`id="${id}"`)[1].split('</article>')[0].includes(lang==='zh'?'class="specs"':'<dl class="catalog-facts">'),`Lost exact-food details: ${id}`);
 const selection=await readFile(new URL(`../dist/${lang}/explore/selection/index.html`,import.meta.url),'utf8');
 assert.equal(Object.keys(selectionReasons[lang]).length,8);
 if(lang!=='zh')assert(selection.includes(selectionReasons[lang]['rainforest-route']),`Selection lost reason: ${lang}`);
 assert.equal((selection.match(lang==='zh'?/data-zoom=""/g:/class="catalog-media detail-image-trigger"/g)||[]).length,8,'Every recommendation image opens separately');
 assert.equal((selection.match(/class="pick-go"/g)||[]).length,8,'Every recommendation has its own detail link');
 const hainan=await readFile(new URL(`../dist/${lang}/hainan/index.html`,import.meta.url),'utf8');
 const referenceFilms=['C01','Z03','N01','N02','N03','M01','M03','M04','M05','M07','M12','M15'];
 assert.equal((hainan.match(/class="frame film-frame"/g)||[]).length,referenceFilms.length);
 for(const id of referenceFilms)assert(hainan.includes(`data-src="/assets/films/${id}.mp4"`),`Missing reference film: ${lang}/${id}`);
}
// These source-backed facts distinguish the new content from the former generic summaries.
for(const [page,id,zh,en,ru] of [['incense','incense-sticks','楠木粉','nanmu','наньму'],['beauty','herbal-mask','珍珠粉','pearl','жемчуг'],['nursing','ear-care','王不留行籽','Vaccaria','ваккарии'],['limiao','five-element-cups','贝壳粉','shell powder','ракушечным'],['diet','yizhi-drink','葛根','kudzu','кудзу'],['training','gua-sha-training','个案报告','report','отчёт']]){
 const item=catalog[page].find(x=>x.id===id);
 for(const [i,lang] of ['zh','en','ru'].entries())assert(JSON.stringify([item[lang],item.facts[lang]]).includes([zh,en,ru][i]),`Lost distinguishing fact: ${lang}/${id}`);
}
const provenance=JSON.parse(await readFile(new URL('../content/material-sources.json',import.meta.url))).substance_revision;
for(const item of [...Object.values(catalog).flat(),...routeIdeas,...Object.values(featuredFacts)])for(const ref of item.source.split(';'))assert(provenance.rows.some(row=>row.ref===ref&&row.line>0&&row.sha256),`Unresolved source row: ${ref}`);
const base=process.env.PREVIEW_URL||'http://localhost:4173';
for(const asset of ['film-badge.svg','clock.svg']){
 const response=await fetch(base+'/assets/detail/'+asset);
 assert.equal(response.status,200);assert.equal(response.headers.get('content-type'),'image/svg+xml');
}
for(const f of films){
 assert(f.seconds>0&&f.poster&&f.zh.title&&f.en.title&&f.ru.title,f.id);
 const range=await fetch(base+f.video,{headers:{Range:'bytes=0-63'}});
 assert.equal(range.status,206,f.id);assert.equal(range.headers.get('content-type'),'video/mp4');
 assert.deepEqual(Buffer.from(await range.arrayBuffer()),(await readFile(new URL('../dist'+f.video,import.meta.url))).subarray(0,64),f.id);
}
console.log(`PASS: source-resolved ingredients, tools and curricula in zh/en/ru; Chinese reference specifications and complete English/Russian source fields; route cards contain their own four-part itinerary; exact-food and selection destinations retained; ${films.length} native films return correct ranges.`);
