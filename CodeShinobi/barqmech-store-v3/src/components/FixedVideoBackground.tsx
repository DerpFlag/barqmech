import { useEffect, useRef } from 'react'
import { heroBgVideoUrl, heroMobileVideoUrl, heroPosterUrl } from '../data/catalog.ts'
import { compactVideo, saveMediaData, watchMediaConnection } from './mediaPreferences.ts'
import { watchScrollIdle } from './scrollActivity.ts'
export function FixedVideoBackground() {
  const videoRef = useRef<HTMLVideoElement>(null)
  useEffect(()=>{
    const video=videoRef.current
    if(!video)return
    const motion=matchMedia('(prefers-reduced-motion: reduce)')
    let inView=false, disposed=false, scrollIdle=true
    const sync=()=>{
      if(disposed||!inView||!scrollIdle||document.hidden||motion.matches||saveMediaData()) { video.pause(); return }
      video.muted=true
      if(!video.getAttribute('src')) video.src=compactVideo()?heroMobileVideoUrl:heroBgVideoUrl
      void video.play().then(()=>{if(disposed||!inView||!scrollIdle||document.hidden||motion.matches||saveMediaData())video.pause()}).catch(()=>{})
    }
    const header=document.querySelector('.shinobi-header')?.getBoundingClientRect().height??0
    const observer=new IntersectionObserver(([entry])=>{inView=entry.isIntersecting;sync()},{rootMargin:`-${header}px 0px 0px 0px`,threshold:.01})
    const hero=document.getElementById('home');if(hero)observer.observe(hero)
    const stopConnectionWatch=watchMediaConnection(sync)
    const stopScrollWatch=watchScrollIdle(idle=>{scrollIdle=idle;sync()})
    video.addEventListener('canplay',sync);document.addEventListener('visibilitychange',sync);motion.addEventListener('change',sync)
    return()=>{disposed=true;stopScrollWatch();observer.disconnect();stopConnectionWatch();video.pause();video.removeEventListener('canplay',sync);document.removeEventListener('visibilitychange',sync);motion.removeEventListener('change',sync);video.removeAttribute('src');video.load()}
  },[])
  return <div className="shinobi-fixed-video" aria-hidden>
    <img className="shinobi-fixed-video__el" src={heroPosterUrl} alt="" fetchPriority="high" />
    <video ref={videoRef} className="shinobi-fixed-video__el" poster={heroPosterUrl} muted loop playsInline preload="none" />
    <div className="shinobi-fixed-video__scrim" /><div className="shinobi-fixed-video__grain" />
  </div>
}
