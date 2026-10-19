import { useEffect, useRef } from 'react'
import { saveMediaData, watchMediaConnection } from './mediaPreferences.ts'

/** Decorative category previews; their surrounding link supplies the accessible name. */
export function CollectionVideo({ src, poster }: { src: string; poster?: string }) {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)')
    let inView = false
    let disposed = false
    const syncPlayback = () => {
      if (!inView || document.hidden || motion.matches || saveMediaData() || disposed) {
        video.pause()
      } else {
        video.muted = true
        if (!video.getAttribute('src')) video.src = src
        void video.play().then(() => {
          if (disposed || !inView || document.hidden || motion.matches) video.pause()
        }).catch(() => { /* Keep the category poster if autoplay is unavailable. */ })
      }
    }
    const observer = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting
      syncPlayback()
    }, { threshold: .1 })
    observer.observe(video)
    const stopConnectionWatch = watchMediaConnection(syncPlayback)
    video.addEventListener('canplay', syncPlayback)
    document.addEventListener('visibilitychange', syncPlayback)
    motion.addEventListener('change', syncPlayback)
    return () => {
      disposed = true
      observer.disconnect()
      stopConnectionWatch()
      video.removeEventListener('canplay', syncPlayback)
      document.removeEventListener('visibilitychange', syncPlayback)
      motion.removeEventListener('change', syncPlayback)
      video.pause()
      video.removeAttribute('src')
      video.load()
    }
  }, [src])

  return <video ref={videoRef} poster={poster} muted loop playsInline preload="none" aria-hidden="true" />
}
