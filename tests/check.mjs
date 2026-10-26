import assert from 'node:assert/strict';
import {readFile,stat} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../dist');
const routes=JSON.parse(await readFile(path.join(root,'routes.json'),'utf8'));
let references=0;
const coverage=JSON.parse(await readFile(path.join(root,'assets/fonts/coverage.json'),'utf8'));
for(const family of ['sans','international','serif'])assert.equal(createHash('sha256').update(await readFile(path.join(root,`assets/fonts/hainan-${family}.woff2`))).digest('hex'),coverage[family].woff2_sha256,'Font coverage must match the actual font');
for(const route of routes){
  const html=await readFile(path.join(root,route,'index.html'),'utf8');
  assert(html.includes('<main id="main">'),route);
  assert.equal((html.match(/<h1>/g)||[]).length,1,route);
  assert(html.includes('name="description"'),route);
  assert.equal((html.match(/rel="alternate"/g)||[]).length,4,route);
  assert(!/href="(?:#|javascript:|)"/.test(html),`Empty link: ${route}`);
  assert(!/<form\b/.test(html),`Unexpected form: ${route}`);
  assert(!/dev\.fs-signature|test\.fs-signature/.test(html),`Development host dependency: ${route}`);
  assert(!/<video[^>]*\sautoplay/.test(html),route);
  for(const [,ref] of html.matchAll(/(?:href|src)="([/#][^"]*)"/g)){
    const target=new URL(ref,'http://local'+route),pathname=target.pathname;
    const file=path.join(root,pathname,pathname.endsWith('/')?'index.html':'');
    assert((await stat(file)).isFile(),`${route}: missing ${ref}`);references++;
    if(target.hash){const destination=pathname===route?html:await readFile(file,'utf8');assert(destination.includes(`id="${decodeURIComponent(target.hash.slice(1))}"`),`${route}: missing anchor ${ref}`);}
  }
  const attributes=[...html.matchAll(/(?:alt|aria-label)="([^"]*)"/g)].map(m=>m[1]).join(' ');
  const visible=(html.replace(/<[^>]*>/g,' ')+attributes).replace(/&(?:amp|quot|lt|gt|#39);/g,'');
  const used=new Set([...visible].filter(c=>/[\p{L}\p{N}]/u.test(c)).map(c=>c.codePointAt(0)));
  const available=new Set(coverage.sans.codepoints);
  for(const cp of used)assert(available.has(cp),`Font missing ${String.fromCodePoint(cp)} in ${route}; regenerate subset`);
  for(const [,tag] of html.matchAll(/(<img\s[^>]+>)/g)) assert(/\salt="[^"]*"/.test(tag),`${route}: missing alt`);
}
const base=process.env.PREVIEW_URL||'http://localhost:4173';
for(const [url,expected] of [['/zh/',200],['/en/explore/diet/',200],['/ru/news/li-herbal-documentary/',200],['/ru/missing/',404],['/work/preview.log',404]]) assert.equal((await fetch(base+url)).status,expected,url);
const range=await fetch(base+'/assets/welcome.mp4',{headers:{Range:'bytes=0-63'}});
assert.equal(range.status,206);assert.equal((await range.arrayBuffer()).byteLength,64);
assert.equal((await fetch(base+'/assets/welcome.mp4',{headers:{Range:'bytes=99999999-'}})).status,416);
assert.equal((await fetch(base+'/zh/',{method:'POST'})).status,405);
console.log(`PASS: ${routes.length} pages; ${references} local references; metadata, boundaries, direct routes and video range checks.`);
