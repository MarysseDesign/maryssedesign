import { useEffect } from 'react';
export default function Cursor() {
  useEffect(() => {
    const c = document.createElement('div');
    Object.assign(c.style,{position:'fixed',zIndex:9999,width:'18px',height:'18px',
      borderRadius:'999px',border:'1px solid #111',pointerEvents:'none',
      transform:'translate(-50%,-50%)',transition:'transform .12s ease-out'});
    document.body.appendChild(c);
    const move=(e)=>{c.style.left=e.clientX+'px';c.style.top=e.clientY+'px';};
    const grow=()=>c.style.transform='translate(-50%,-50%) scale(1.6)';
    const shrink=()=>c.style.transform='translate(-50%,-50%) scale(1)';
    window.addEventListener('mousemove',move);
    document.querySelectorAll('a,button,.cursor-grow').forEach(el=>{
      el.addEventListener('mouseenter',grow);el.addEventListener('mouseleave',shrink);
    });
    return ()=>{window.removeEventListener('mousemove',move);c.remove();};
  },[]);
  return null;
}
