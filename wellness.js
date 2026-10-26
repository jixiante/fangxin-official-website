const root=document.querySelector('.wellness-reference');
if(root){
  // Shared client.js owns native dialog opening, closing, focus and scroll locking.
  const dialog=root.querySelector('#wellness-video'),video=dialog.querySelector('video');
  const message=dialog.querySelector('[role="status"]'),retry=dialog.querySelector('[data-wellness-retry]');
  root.querySelector('[data-open="wellness-video"]').addEventListener('click',()=>{
    retry.hidden=true;message.textContent='文化影像，仅供了解与参考。';
    video.play().catch(()=>{if(!video.error)message.textContent='请点击播放器中的播放按钮。'});
  });
  video.addEventListener('error',()=>{message.textContent='视频暂时无法播放，可重试或查看原始发布页。';retry.hidden=false});
  video.addEventListener('loadeddata',()=>{retry.hidden=true;message.textContent='文化影像，仅供了解与参考。'});
  retry.addEventListener('click',()=>{retry.hidden=true;video.load();video.play().catch(()=>{})});
  if(typeof IntersectionObserver!=='undefined'&&!window.matchMedia('(prefers-reduced-motion: reduce)').matches){
    const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{
      if(entry.isIntersecting){
        entry.target.classList.add('is-visible');observer.unobserve(entry.target);
        // Release the reveal transform so the card can lift on hover afterwards.
        entry.target.addEventListener('transitionend',event=>{if(event.target===entry.target)entry.target.classList.remove('reveal')});
      }
    }),{threshold:.08,rootMargin:'0px 0px 15px 0px'});
    root.classList.add('motion-ready');
    root.querySelectorAll('.reveal').forEach(el=>observer.observe(el));
  }
}
