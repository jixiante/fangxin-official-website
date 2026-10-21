import {readFile,writeFile,mkdir,cp,rm,lstat,realpath} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import assert from 'node:assert/strict';
import {locales} from './content/locales.mjs';
import {businesses} from './content/businesses.mjs';
import {focus} from './content/focus.mjs';
import {focusedPage} from './focused-pages.mjs';
import {businessPage,filmCard} from './business-pages.mjs';
import {pageCopy} from './content/catalog.mjs';

const root=path.dirname(fileURLToPath(import.meta.url));
const read=async name=>JSON.parse(await readFile(path.join(root,'content',name),'utf8'));
const [site,news,films]=await Promise.all(['site.json','news.json','films.json'].map(read));
if(site.siteUrl){const parsed=new URL(site.siteUrl);assert(parsed.protocol==='https:'&&parsed.pathname==='/'&&!parsed.search&&!parsed.hash,'siteUrl must be an HTTPS origin');}
const out=path.join(root,'dist');
const esc=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const lines=value=>esc(value).replaceAll('\n','<br>');
const safeUrl=value=>{assert(/^https:\/\//.test(value),'External URLs must use HTTPS');return esc(new URL(value).href)};
const languages=Object.keys(locales);
const keys=value=>Object.entries(value).flatMap(([k,v])=>typeof v==='object'&&!Array.isArray(v)?keys(v).map(x=>`${k}.${x}`):[k]).sort();
assert(!site.miniCode || Number.isFinite(Date.parse(site.miniCodeValidBefore)),'A trial code requires a valid expiry date');
for(const language of languages){
  assert.deepEqual(keys(focus[language]),keys(focus.zh),`Focused locale keys: ${language}`);
  assert.deepEqual(keys(locales[language]),keys(locales.zh),`Locale keys: ${language}`);
  for(const b of businesses) assert(b[language]?.length===5 && b[language][3].length===3,`Business translation: ${b.id}/${language}`);
  for(const n of news){assert(n[language]?.title&&n[language]?.paragraphs.length,`News translation: ${n.id}/${language}`);assert(/^\d{4}-\d{2}-\d{2}$/.test(n.date));safeUrl(n.sourceUrl)}
}
const baseRoutes=['','explore','xiaoli','hainan','news','about','partners','privacy'];
export const routes=[...baseRoutes,...businesses.map(b=>`explore/${b.id}`),...news.map(n=>`news/${n.id}`),'404'];
// Only this verified, generated directory may be cleaned; source and evidence stay outside it.
assert.equal(path.dirname(out),root);assert.equal(path.basename(out),'dist');
try{const info=await lstat(out);assert(info.isDirectory()&&!info.isSymbolicLink(),'dist must be a real directory');assert.equal(await realpath(out),path.join(await realpath(root),'dist'));await rm(out,{recursive:true});}catch(error){if(error.code!=='ENOENT')throw error;}
await mkdir(out,{recursive:true});
await cp(path.join(root,'assets'),path.join(out,'assets'),{recursive:true});
for(const file of ['styles.css','client.js','mini-code.js','xiaoli-greeting.js']) await cp(path.join(root,file),path.join(out,file));

for(const l of languages){
  const t=locales[l],f=focus[l];
  const url=route=>{const [page,anchor]=route.split('#');return `/${l}/${page?page+'/':''}${anchor?'#'+anchor:''}`};
  const link=(route,label,cls='text-link')=>`<a class="${cls}" href="${url(route)}">${esc(label)} <span aria-hidden="true">↗</span></a>`;
  const trial=(cls='button')=>`<button class="${cls}" type="button" data-open="mini">${esc(t.experience)} <small>${esc(t.trial)}</small></button>`;
  const photo=(key,cls='',eager=false)=>{const content=key.startsWith('content-'),consultation=key==='content-consultation';return `<figure class="photo ${cls}"><img src="/assets/${key}.webp" alt="${esc(consultation?['咨询与需求记录','A consultation and notes','Обсуждение и записи'][languages.indexOf(l)]:content?businesses.flatMap(b=>b.details[l]).find(d=>d.image===key)?.title:t.imageAlt[key])}" width="${consultation?1254:content?640:key==='coast'?1916:1200}" height="${consultation?1254:content?640:key==='coast'?821:800}" ${eager?'fetchpriority="high"':'loading="lazy"'} decoding="async"></figure>`};
  const heading=(kicker,title,text='')=>`<div class="section-heading"><div><p class="eyebrow">${esc(kicker)}</p><h2>${lines(title)}</h2></div>${text?`<p class="lede">${esc(text)}</p>`:''}</div>`;
  const intro=(kicker,title,text='')=>`<header class="page-intro wrap"><p class="eyebrow">${esc(kicker)}</p><h1>${lines(title)}</h1>${text?`<p class="lede">${esc(text)}</p>`:''}</header>`;
  const list=items=>`<ol class="numbered">${items.map((x,i)=>`<li><span aria-hidden="true">0${i+1}</span><p>${esc(x)}</p></li>`).join('')}</ol>`;
  const newsRows=()=>news.map(n=>`<article class="news-row"><time datetime="${n.date}">${n.date.replaceAll('-',' / ')}</time><div><p class="eyebrow">${esc(n.kind==='platform'?t.platformNews:t.publicReport)}</p><h3><a href="${url('news/'+n.id)}">${esc(n[l].title)}</a></h3><p>${esc(n[l].summary)}</p><small>${esc(t.source)} · ${esc(n[l].source)}</small></div>${link('news/'+n.id,t.more)}</article>`).join('');
  const inlineFilm=f=>filmCard(f,l,{esc,safeUrl});
  const filmCards=medical=>films.filter(f=>Boolean(f.medical)===medical).map(inlineFilm).join('');
  const partners=()=>`<section class="partner-band"><div class="wrap"><p class="eyebrow">${esc(t.partnerKicker)}</p><h2>${lines(t.partnerTitle)}</h2><div class="partner-bottom"><p>${esc(t.partnerText)}</p>${link('partners',t.partnerLink,'button light')}</div></div></section>`;
  const video=()=>`<div class="video-block"><button class="video-cover" data-open="film" aria-label="${esc(t.play)}"><img src="/assets/welcome-poster.webp" alt="${esc(t.xiaoliAlt)}" loading="lazy" width="720" height="720"><span class="play-label"><span aria-hidden="true">▷</span>${esc(t.play)}</span></button><div><p class="eyebrow">${esc(t.videoNote)}</p><h2>${esc(t.videoTitle)}</h2><p>${esc(t.videoDescription)}</p></div></div>`;
  const expiryDate=site.miniCode?new Intl.DateTimeFormat(t.lang,{dateStyle:'long',timeZone:'Asia/Shanghai'}).format(new Date(site.miniCodeValidBefore)):'';
  const expiryText=l==='zh'?expiryDate+'前':l==='en'?'Before '+expiryDate:'До '+expiryDate;
  const miniBody=site.miniCode?`<p class="mini-name">${esc(t.miniName)}</p><p class="mini-validity">${esc(f.expiryLabel)}${esc(expiryText)}</p><div data-mini-active><img class="mini-code" src="${esc(site.miniCode)}" alt="${esc(t.miniName)}" width="258" height="309"><a class="text-link" href="${esc(site.miniCode)}" target="_blank" rel="noopener">${esc(t.miniEnlarge)}</a><a class="text-link" href="${esc(site.miniCode)}" download="mini-program-trial.png">${esc(f.saveCode)}</a><p>${esc(f.scanNote)}</p><p class="fineprint">${esc(f.mobileNote)}</p></div><p data-mini-expired role="status" hidden>${esc(f.expired)}</p>${link('partners#contact',f.codeHelp)}`:`<div class="mini-pending"><h3>${esc(t.miniMissing)}</h3><p>${esc(t.miniMissingText)}</p></div>${link('partners',t.contactTitle)}`;
  const dialogs=`<dialog id="mini" aria-labelledby="mini-title" ${site.miniCode?`data-expires-at="${esc(site.miniCodeValidBefore)}"`:''}><button class="dialog-close" data-close aria-label="${esc(t.close)}">×</button><p class="eyebrow">WeChat · ${esc(t.trial)}</p><h2 id="mini-title">${esc(t.miniTitle)}</h2>${miniBody}</dialog><dialog id="film" class="film-dialog" aria-labelledby="film-title"><button class="dialog-close" data-close aria-label="${esc(t.close)}">×</button><h2 id="film-title">${esc(t.videoTitle)}</h2><video controls playsinline preload="none" poster="/assets/welcome-poster.webp" data-src="/assets/welcome.mp4" aria-label="${esc(t.videoNote)}"></video><div class="video-error" hidden role="status"><p>${esc(t.videoError)}</p><button class="button" data-retry>${esc(t.retry)}</button></div><p class="fineprint">${esc(t.videoNote)}</p><p>${esc(t.videoDescription)}</p></dialog>`;

  for(const route of routes){
    let title=t.nav[0],description=t.introText,body='';
    const business=businesses.find(b=>route==='explore/'+b.id);
    const article=news.find(n=>route==='news/'+n.id);
    if(!route){
      description=f.heroText;body=focusedPage(route,l,{t,businesses,news,films,esc,lines,url,link,trial,safeUrl,photo,inlineFilm});
    }else if(route==='explore'){
      title=t.nav[1];body=`${intro('01 / '+title,t.businessTitle,t.businessText)}<section class="wrap section business-directory">${businesses.map((b,i)=>`<article class="directory-item"><a class="directory-card" href="${url('explore/'+b.id)}">${photo(b.image)}<div><p class="eyebrow">0${i+1}</p><h2>${esc(b[l][0])}</h2><p>${esc(b[l][1])}</p><span class="text-link">${esc(t.more)} <span aria-hidden="true">↗</span></span></div></a></article>`).join('')}</section>${partners()}`;
    }else if(route==='explore/wellness'){
      title=f.wellTitle;description=f.wellIntro;body=businessPage(business,l,{t,businesses,films,esc,url,link,trial,photo,safeUrl},focusedPage(route,l,{t,businesses,news,films,esc,lines,url,link,trial,safeUrl,photo,inlineFilm}));
    }else if(business){
      title=business[l][0];description=business[l][1];body=businessPage(business,l,{t,businesses,films,esc,url,link,trial,photo,safeUrl});
    }else if(route==='xiaoli'){
      title=t.nav[2];description=f.xPageText;body=focusedPage(route,l,{t,businesses,news,films,esc,lines,url,link,trial,safeUrl,photo,inlineFilm});
    }else if(route==='hainan'){
      title=t.nav[3];body=`${intro(t.islandKicker,pageCopy[l].filmTitle,pageCopy[l].filmIntro)}<section class="wrap catalog-section"><p class="catalog-intro">${esc(pageCopy[l].mediaNote)}</p><div class="inline-films">${filmCards(false)}</div></section><section class="film-band"><div class="wrap"><div class="focus-heading"><h2>${esc(t.nav[1])} · ${esc(pageCopy[l].videos)}</h2><p>${esc(pageCopy[l].medicalNote)}</p></div><div class="inline-films">${filmCards(true)}</div></div></section><section class="wrap section">${video()}</section>`;
    }else if(route==='news'){
      title=t.nav[4];body=`${intro(t.nav[4],t.newsTitle,t.newsText)}<section class="wrap section news-list">${newsRows()}<div class="note"><h2>${esc(t.platformNews)}</h2><p>${esc(t.newsEmpty)}</p></div></section>`;
    }else if(article){
      const n=article[l];title=n.title;description=n.summary;body=`<article class="wrap article"><div class="breadcrumb">${link('news',t.nav[4])}</div><p class="eyebrow">${esc(article.kind==='platform'?t.platformNews:t.publicReport)} · <time datetime="${article.date}">${article.date}</time></p><h1>${esc(n.title)}</h1><p class="lede">${esc(n.summary)}</p>${photo(article.image)}<p class="fineprint">${esc(t.source)}：${esc(n.source)}</p>${n.paragraphs.map(p=>`<p>${esc(p)}</p>`).join('')}<a class="button" href="${safeUrl(article.sourceUrl)}" target="_blank" rel="noopener noreferrer">${esc(t.sourceLink)} ↗</a><p class="fineprint">${esc(t.summaryNote)}</p></article>`;
    }else if(route==='about'){
      title=t.nav[5];description=f.about[1];body=`${intro(t.nav[5],f.about[0],f.about[1])}<section class="wrap island-photo">${photo('coast','',true)}</section><section class="wrap section about-content"><div><h2>${esc(f.about[2])}</h2><p>${esc(f.about[3])}</p><div class="business-links">${businesses.map(b=>link('explore/'+b.id,b[l][0])).join('')}</div></div><aside class="note"><h2>${esc(f.about[4])}</h2><p>${esc(f.about[5])}</p>${link('xiaoli',f.xAction)}</aside></section><section class="wrap operator"><h2>${esc(f.about[6])}</h2><p>${esc(f.about[7])}</p>${link('partners#contact',t.contactTitle)}</section><section class="wrap section participation"><article><h2>${esc(f.about[8])}</h2><p>${esc(f.about[9])}</p>${trial()}</article><article><h2>${esc(f.about[10])}</h2><p>${esc(f.about[11])}</p>${link('partners#contact',t.partnerLink)}</article></section>`;
    }else if(route==='partners'){
      title=t.nav[6];body=`${intro(t.nav[6],f.cooperationTitle,t.partnerText)}<div class="wrap">${link('partners#contact',f.cooperationAction,'button')}</div><section class="wrap section partnership-grid">${t.partnerGroups.map((h,i)=>`<article><p class="eyebrow">0${i+1}</p><h2>${esc(h)}</h2><p>${esc(t.partnerDescriptions[i])}</p></article>`).join('')}</section><section class="wrap section demo-grid"><h2>${esc(t.partnerLink)}</h2>${list(t.cooperationSteps)}</section><section class="contact-band" id="contact"><div class="wrap contact-grid"><div><p class="eyebrow">${esc(t.contactLabel)}</p><h2>${esc(t.contactTitle)}</h2><p>${esc(t.contactNote)}</p></div><address><a href="tel:+8689865351690"><small>${esc(t.telephone)}</small>${esc(site.phone)}</a><a href="mailto:${esc(site.email)}"><small>${esc(t.email)}</small>${esc(site.email)}</a><a class="text-link" href="${safeUrl(site.companyUrl)}" target="_blank" rel="noopener noreferrer">${esc(t.companyWebsite)} ↗</a></address></div></section>`;
    }else if(route==='privacy'){
      title=t.privacy;body=`${intro(t.privacy,t.privacyTitle)}<section class="wrap article"><p class="lede">${esc(t.privacyText)}</p>${link('partners',t.contactTitle)}</section>`;
    }else{
      title=t.unavailable;body=`${intro('404',t.unavailable,t.unavailableText)}<div class="wrap section">${link('',t.home,'button')}</div>`;
    }
    description=({explore:t.businessText,xiaoli:f.xPageText,hainan:t.islandText,news:t.newsText,about:f.about[1],partners:t.partnerText,privacy:t.privacyText})[route]||description;
    const navRoutes=['','explore','xiaoli','hainan','news','about','partners'];
    const nav=navRoutes.map((r,i)=>`<a href="${url(r)}" ${route===r||(r&&route.startsWith(r+'/'))?'aria-current="page"':''}>${esc(t.nav[i])}</a>`).join('');
    const header=`<a class="skip" href="#main">${esc(t.skip)}</a><header class="site-header"><div class="header-inner"><a class="brand" href="${url('')}" aria-label="${esc(site.brand)}"><img src="/assets/logo-small.webp" alt="" width="64" height="64"><span><b lang="zh-CN">${esc(site.brand)}</b></span></a><nav id="navigation" aria-label="${esc(t.menu)}">${nav}</nav><div class="header-tools"><label class="language"><span class="sr-only">Language / 语言 / Язык</span><select aria-label="Language / 语言 / Язык" data-language>${languages.map(code=>`<option value="/${code}/${route?route+'/':''}" ${code===l?'selected':''}>${locales[code].name}</option>`).join('')}</select></label><button class="header-trial" type="button" data-open="mini"><span class="trial-full">${esc(t.experience)}</span><span class="trial-short">${esc(f.trialShort)}</span></button><button class="menu-toggle" aria-expanded="false" aria-controls="navigation">${esc(t.menu)} <span class="menu-lines" aria-hidden="true"></span></button></div></div></header>${t.brandTranslation?`<div class="brand-translation wrap">${esc(t.brandTranslation)}</div>`:''}`;
    const footer=`<footer><div class="wrap footer-grid"><div class="footer-brand"><img src="/assets/logo-small.webp" alt="${esc(site.brand)}" width="100" height="100"><div><h2 lang="zh-CN">${esc(site.brand)}</h2>${t.brandTranslation?`<p>${esc(t.brandTranslation)}</p>`:''}<p>${esc(t.footerText)}</p></div></div><nav aria-label="${esc(t.menu)}">${nav}</nav><div><p class="eyebrow">WeChat</p>${trial('button light')}<p class="fineprint">${esc(t.trial)}</p></div></div><div class="wrap footer-base"><p>${esc(t.footerNote)}</p><div><span>© 2026 ${esc(site.company)}${site.preview?` · ${esc(t.preview)}`:''}</span>${link('privacy',t.privacy)}</div></div></footer>`;
    const topLabel={zh:'返回顶部',en:'Back to top',ru:'Наверх'}[l];
    const backToTop=`<button class="back-to-top" type="button" aria-label="${topLabel}" title="${topLabel}" hidden><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 19V5m-6 6 6-6 6 6"/></svg></button>`;
    const html=`<!doctype html><html lang="${t.lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)} | ${esc(site.brand)}</title><meta name="description" content="${esc(description)}">${site.preview?'<meta name="robots" content="noindex,nofollow">':''}${site.siteUrl?`<link rel="canonical" href="${safeUrl(new URL(url(route),site.siteUrl).href)}">`:''}<meta name="theme-color" content="#164e43"><meta property="og:title" content="${esc(title)} | ${esc(site.brand)}"><meta property="og:description" content="${esc(description)}"><meta property="og:type" content="website">${site.siteUrl?`<meta property="og:url" content="${safeUrl(new URL(url(route),site.siteUrl).href)}"><meta property="og:image" content="${safeUrl(new URL('/assets/coast.webp',site.siteUrl).href)}">`:''}${languages.map(code=>`<link rel="alternate" hreflang="${locales[code].lang}" href="${site.siteUrl?esc(new URL(`/${code}/${route?route+'/':''}`,site.siteUrl).href):`/${code}/${route?route+'/':''}`}">`).join('')}<link rel="alternate" hreflang="x-default" href="/zh/${route?route+'/':''}"><link rel="icon" href="/assets/logo-small.webp" type="image/webp">${l!=='zh'?'<link rel="preload" href="/assets/fonts/hainan-international.woff2" as="font" type="font/woff2" crossorigin>':''}<link rel="preload" href="/assets/fonts/hainan-sans.woff2" as="font" type="font/woff2" crossorigin><link rel="stylesheet" href="/styles.css"><script src="/client.js" type="module"></script></head><body class="${route ? 'inner-page' : 'home-page'}">${header}<main id="main">${body}</main>${footer}${backToTop}${dialogs}<noscript><div class="noscript-languages">${languages.map(code=>`<a href="/${code}/${route?route+'/':''}">${locales[code].name}</a>`).join(' · ')}</div></noscript></body></html>`;
    const target=path.join(out,l,route);await mkdir(target,{recursive:true});await writeFile(path.join(target,'index.html'),html);
  }
}
await writeFile(path.join(out,'index.html'),'<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta http-equiv="refresh" content="0;url=/zh/"><title>放心中医药在海南</title></head><body><a href="/zh/">进入官网 · 简体中文</a> <a href="/en/">English</a> <a href="/ru/">Русский</a></body></html>');
await writeFile(path.join(out,'robots.txt'),site.preview?'User-agent: *\nDisallow: /\n':'User-agent: *\nAllow: /\n'+(site.siteUrl?'Sitemap: '+site.siteUrl.replace(/\/$/,'')+'/sitemap.xml\n':''));
await writeFile(path.join(out,'routes.json'),JSON.stringify(languages.flatMap(l=>routes.map(r=>`/${l}/${r?r+'/':''}`)),null,2));
console.log(`Built ${languages.length*routes.length} localized pages. No runtime dependencies.`);

if(site.siteUrl&&!site.preview)await writeFile(path.join(out,'sitemap.xml'),'<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+languages.flatMap(l=>routes.filter(r=>r!=='404').map(r=>'<url><loc>'+esc(new URL('/'+l+'/'+(r?r+'/':''),site.siteUrl).href)+'</loc></url>')).join('')+'</urlset>');
