import { useEffect } from 'react';
import Lenis from '@studio-freight/lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
gsap.registerPlugin(ScrollTrigger);
export default function SmoothScroll() {
  useEffect(() => {
    const lenis = new Lenis({ lerp: 0.12, smoothWheel: true });
    function raf(time){ lenis.raf(time); requestAnimationFrame(raf); }
    requestAnimationFrame(raf);
    const els = document.querySelectorAll('[data-reveal]');
    els.forEach((el,i)=>{
      gsap.fromTo(el,{y:20,opacity:0},{y:0,opacity:1,duration:0.8,delay:i*0.05,ease:'power2.out',
        scrollTrigger:{trigger:el,start:'top 85%'}});
    });
    return ()=> lenis.destroy();
  }, []);
  return null;
}
