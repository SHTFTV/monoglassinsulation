(() => {
 const init = root => root.querySelectorAll('[data-journal-carousel]').forEach(section => {
  if(section.dataset.ready) return; section.dataset.ready='true';
  const track=section.querySelector('.journal-track'), cards=[...track.children], prev=section.querySelector('[data-prev]'), next=section.querySelector('[data-next]'), status=section.querySelector('.journal-status');
  const update=()=>{const width=cards[0]?.getBoundingClientRect().width||1, step=width+18, start=Math.round(track.scrollLeft/step), visible=Math.max(1,Math.round((track.clientWidth+18)/step));prev.disabled=track.scrollLeft<2;next.disabled=track.scrollLeft+track.clientWidth>=track.scrollWidth-2;status.textContent=`Articles ${start+1}–${Math.min(cards.length,start+visible)} of ${cards.length}`;};
  const move=dir=>{const step=(cards[0]?.getBoundingClientRect().width||1)+18, count=Math.max(1,Math.round((track.clientWidth+18)/step));track.scrollBy({left:dir*step*count,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});};
  prev.addEventListener('click',()=>move(-1)); next.addEventListener('click',()=>move(1));
  track.addEventListener('keydown',event=>{if(event.target!==track)return;if(event.key==='ArrowRight'||event.key==='ArrowLeft'){event.preventDefault();move(event.key==='ArrowRight'?1:-1);}if(event.key==='Home'||event.key==='End'){event.preventDefault();track.scrollTo({left:event.key==='Home'?0:track.scrollWidth,behavior:'instant'});}});
  track.addEventListener('scroll',update,{passive:true});new ResizeObserver(update).observe(track);update();
 });
 init(document);new MutationObserver(()=>init(document)).observe(document.body,{childList:true,subtree:true});
})();