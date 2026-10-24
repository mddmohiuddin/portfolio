(function(){
  const y=document.getElementById('year'); if(y) y.textContent=new Date().getFullYear();
  const btn=document.getElementById('menu-btn'), menu=document.getElementById('mobile-menu'), icon=document.getElementById('menu-icon');
  if(btn&&menu){
    btn.addEventListener('click',()=>{menu.classList.toggle('open');if(window.lucide){icon.setAttribute('data-lucide',menu.classList.contains('open')?'x':'menu');lucide.createIcons();}});
    document.querySelectorAll('.mobile-nav').forEach(a=>a.addEventListener('click',()=>{menu.classList.remove('open');if(window.lucide){icon.setAttribute('data-lucide','menu');lucide.createIcons();}}));
  }
  const progress=document.getElementById('scroll-progress'), backTop=document.getElementById('back-to-top');
  const sections=document.querySelectorAll('section[id]'), navLinks=document.querySelectorAll('nav a.nav-link');
  function onScroll(){
    const st=window.scrollY||document.documentElement.scrollTop, docH=document.documentElement.scrollHeight-window.innerHeight;
    if(progress) progress.style.width=(docH>0?(st/docH)*100:0)+'%';
    if(backTop){ st>400 ? backTop.classList.add('show') : backTop.classList.remove('show'); }
    let current=''; sections.forEach(s=>{if(st>=s.offsetTop-120) current=s.id;});
    navLinks.forEach(l=>{l.classList.toggle('active', l.getAttribute('href')==='#'+current);});
  }
  window.addEventListener('scroll',onScroll,{passive:true}); onScroll();
  if(backTop) backTop.addEventListener('click',()=>window.scrollTo({top:0,behavior:'smooth'}));
  const reveals=document.querySelectorAll('.reveal');
  if('IntersectionObserver' in window){
    const io=new IntersectionObserver(es=>{es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('visible');io.unobserve(e.target);}});},{threshold:0.12,rootMargin:'0px 0px -40px 0px'});
    reveals.forEach(el=>io.observe(el));
  } else reveals.forEach(el=>el.classList.add('visible'));

  let images=[], lbIndex=0;
  const lb=document.getElementById('lightbox'), lbImg=document.getElementById('lb-img'), lbCounter=document.getElementById('lb-counter');
  function openLB(i){ if(!images.length) return; lbIndex=i; lbImg.src=images[i].replace(/=w\d+$/,'=w1600'); lbCounter.textContent=(i+1)+' / '+images.length; lb.classList.add('open'); document.body.style.overflow='hidden'; if(window.lucide) lucide.createIcons(); }
  function closeLB(){ lb.classList.remove('open'); document.body.style.overflow=''; }
  function navLB(d){ if(!images.length) return; lbIndex=(lbIndex+d+images.length)%images.length; lbImg.src=images[lbIndex].replace(/=w\d+$/,'=w1600'); lbCounter.textContent=(lbIndex+1)+' / '+images.length; }
  document.getElementById('lb-close')?.addEventListener('click',closeLB);
  document.getElementById('lb-prev')?.addEventListener('click',()=>navLB(-1));
  document.getElementById('lb-next')?.addEventListener('click',()=>navLB(1));
  lb?.addEventListener('click',e=>{ if(e.target===lb) closeLB(); });
  document.addEventListener('keydown',e=>{ if(!lb?.classList.contains('open')) return; if(e.key==='Escape') closeLB(); if(e.key==='ArrowLeft') navLB(-1); if(e.key==='ArrowRight') navLB(1); });

  const obs=new MutationObserver(()=>{
    const track=document.getElementById('gallery-track');
    if(!track) return;
    const anchors=track.querySelectorAll('a[href*="googleusercontent"]');
    if(!anchors.length) return;
    images=Array.from(anchors).slice(0, anchors.length/2).map(a=>a.getAttribute('href'));
    anchors.forEach((a,i)=>{
      a.addEventListener('click',e=>{ e.preventDefault(); openLB(i % images.length); });
    });
    obs.disconnect();
  });
  const track=document.getElementById('gallery-track');
  if(track) obs.observe(track,{childList:true,subtree:true});
  setTimeout(()=>obs.disconnect(),8000);
})();
