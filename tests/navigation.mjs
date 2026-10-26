import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {runInNewContext} from 'node:vm';
const source=await readFile(new URL('../client.js',import.meta.url),'utf8');
const code=source.slice(source.indexOf('const menu='),source.indexOf("document.querySelector('[data-language]')"));
const element=()=>({events:{},attributes:{},classes:new Set(),addEventListener(name,fn){this.events[name]=fn},setAttribute(name,value){this.attributes[name]=value},getAttribute(name){return this.attributes[name]},checkVisibility(){return true},focus(){document.activeElement=this}});
const menu=element(),nav=element(),brand=element(),last=element(),header=element();
const background=[{inert:false},{inert:false}],body=element(),html=element();
for(const el of [menu,nav,body,html])el.classList={toggle(name,on){on?el.classes.add(name):el.classes.delete(name)}};
const media={matches:true,addEventListener(name,fn){this.change=fn}};
const document={body,documentElement:html,activeElement:menu,events:{},querySelector:s=>({'.menu-toggle':menu,'#navigation':nav,'#site-header':header}[s]),querySelectorAll:()=>background,addEventListener(name,fn){this.events[name]=fn}};
header.querySelector=()=>brand;header.querySelectorAll=()=>[menu,brand,last];
runInNewContext(code,{document,window:{matchMedia:()=>media}});
menu.events.click();
assert.equal(menu.attributes['aria-expanded'],'true');assert(nav.classes.has('open'));assert(body.classes.has('menu-open')&&html.classes.has('menu-open'));assert(background.every(el=>el.inert));
let prevented=false;
document.events.keydown({key:'Tab',shiftKey:true,preventDefault(){prevented=true}});assert(prevented&&document.activeElement===last);
document.events.keydown({key:'Tab',shiftKey:false,preventDefault(){}});assert.equal(document.activeElement,menu);
document.events.keydown({key:'Escape'});assert.equal(menu.attributes['aria-expanded'],'false');assert(background.every(el=>!el.inert));assert(!body.classes.size&&!html.classes.size);
menu.events.click();nav.events.click({target:{closest:()=>({})}});assert.equal(menu.attributes['aria-expanded'],'false');
menu.events.click();document.events.click({target:{closest:()=>null}});assert(!nav.classes.size);
menu.events.click();media.matches=false;media.change();assert(!nav.classes.size);assert.equal(document.activeElement,brand);
menu.events.click();assert.equal(menu.attributes['aria-expanded'],'false','Desktop must not open the compact panel');
for(const language of ['zh','en','ru']){
 const html=await readFile(new URL(`../dist/${language}/index.html`,import.meta.url),'utf8');
 assert(html.indexOf('class="menu-toggle"')<html.indexOf('class="brand"'),'Menu precedes brand for matching keyboard and visual order');
 assert(html.includes('class="trial-icon"'));assert(/class="header-trial"[^>]*aria-label=/.test(html));
}
console.log('PASS: compact navigation scroll lock, background focus isolation, keyboard loop, Escape, links and desktop resize cleanup.');
