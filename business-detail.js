function filterCatalog(root,category){
  root.querySelectorAll('[data-detail-category]').forEach(card=>{card.hidden=category!=='all'&&card.dataset.detailCategory!==category});
  root.querySelectorAll('[data-detail-filter]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.detailFilter===category)));
}
const catalog=document.querySelector('#business-content');
const filters=catalog?.querySelector('.detail-filters');
if(filters){
  filters.hidden=false;
  filters.querySelectorAll('button').forEach(button=>button.addEventListener('click',()=>filterCatalog(catalog,button.dataset.detailFilter)));
  // Existing links from Xiaoli and recommendations must still reveal their exact item.
  window.addEventListener('hashchange',()=>{
    let id;try{id=decodeURIComponent(location.hash.slice(1))}catch{return}
    const target=document.getElementById(id);
    if(target?.matches('[data-detail-category]')&&target.hidden){filterCatalog(catalog,'all');target.scrollIntoView({block:'start'})}
  });
}
const reference=document.querySelector('.detail-reference');
const images=document.querySelectorAll('.detail-image-trigger,[data-zoom]');
if(images.length){
  const lang=document.documentElement.lang.slice(0,2);
  const dialog=document.createElement('dialog');dialog.className=reference?'lightbox':'detail-lightbox';
  const close=document.createElement('button');close.type='button';close.textContent='×';
  close.setAttribute('aria-label',({zh:'关闭图片',en:'Close image',ru:'Закрыть изображение'})[lang]||'Close image');
  const image=document.createElement('img'),caption=document.createElement('p');caption.id='detail-image-caption';caption.className='lb-cap';close.className='x';
  dialog.setAttribute('aria-labelledby',caption.id);dialog.append(close,image,caption);(reference||document.body).append(dialog);
  let opener;
  images.forEach(button=>{
    button.addEventListener('click',()=>{
      opener=button;const source=button.querySelector('img');image.src=button.dataset.fullImage;image.alt=button.dataset.cap||source.alt;caption.textContent=image.alt;
      dialog.showModal();document.body.classList.add('dialog-open');
    });
    if(button.tagName!=='BUTTON')button.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();button.click()}});
  });
  close.addEventListener('click',()=>dialog.close());
  dialog.addEventListener('click',event=>{if(event.target===dialog)dialog.close()});
  dialog.addEventListener('close',()=>{document.body.classList.remove('dialog-open');opener?.focus({preventScroll:true})});
}

// Only hide offscreen cards after the observer is available; links and reduced-motion users see content immediately.
if(typeof IntersectionObserver!=='undefined'&&!window.matchMedia('(prefers-reduced-motion: reduce)').matches){
  const observer=new IntersectionObserver(entries=>entries.forEach((entry,index)=>{
    if(entry.isIntersecting){
      if(reference){
        entry.target.style.animationDelay=index*70+'ms';entry.target.classList.add('in');entry.target.classList.remove('reference-pending');
        entry.target.addEventListener('animationend',()=>entry.target.classList.remove('in'),{once:true});
      }else entry.target.classList.remove('detail-reveal');
      observer.unobserve(entry.target);
    }
  }),{threshold:.12,rootMargin:'0px 0px -40px 0px'});
  document.querySelectorAll(reference?'.detail-reference .reveal':'.catalog-grid article,.selection-grid article,.inline-film,.detail-group-heading').forEach(element=>{
    if((reference||element.getBoundingClientRect().top>window.innerHeight)&&!element.matches(':target')){element.classList.add(reference?'reference-pending':'detail-reveal');observer.observe(element)}
  });
}

// Keep the reference's independent poster; load a native player only after an explicit click.
document.querySelectorAll('.film-frame[data-src]').forEach(frame=>{
  frame.querySelector('.film-play').addEventListener('click',event=>{
    event.preventDefault();
    const video=document.createElement('video');video.src=frame.dataset.src;video.controls=true;video.playsInline=true;video.preload='auto';video.tabIndex=0;
    video.setAttribute('aria-label',frame.dataset.title);
    video.addEventListener('error',()=>{
      if(frame.querySelector('.film-error'))return;
      const labels=({zh:['视频暂时无法播放。','直接打开','重试'],en:['The video could not be played.','Open video','Retry'],ru:['Не удалось воспроизвести видео.','Открыть видео','Повторить']})[document.documentElement?.lang.slice(0,2)||'zh'];
      const error=document.createElement('div');error.className='film-error';error.setAttribute('role','status');error.append(labels[0]);
      const direct=document.createElement('a');direct.href=frame.dataset.src;direct.textContent=labels[1];
      const retry=document.createElement('button');retry.type='button';retry.textContent=labels[2];retry.addEventListener('click',()=>{error.remove();video.load();video.play().catch(()=>{})});
      error.append(direct,retry);frame.append(error);
    });
    frame.replaceChildren(video);video.focus({preventScroll:true});video.play().catch(()=>{video.controls=true});
  });
});
