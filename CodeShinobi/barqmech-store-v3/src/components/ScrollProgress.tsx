import { useEffect, useRef } from 'react'

/** Top scroll progress bar (CodeShinobi-style). */
export function ScrollProgress() {
  const bar = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let frame = 0, max = 0
    const update = () => { frame = 0; if(bar.current)bar.current.style.transform = `scaleX(${max > 0 ? window.scrollY / max : 0})` }
    const schedule = () => { if(!frame)frame=requestAnimationFrame(update) }
    const measure = () => { max=Math.max(0,document.documentElement.scrollHeight-window.innerHeight);schedule() }
    const observer = new ResizeObserver(measure)
    observer.observe(document.body)
    measure()
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', measure)
    return () => {
      observer.disconnect();cancelAnimationFrame(frame)
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', measure)
    }
  }, [])

  return <div ref={bar} className="shinobi-progress" style={{ transform: 'scaleX(0)' }} aria-hidden />
}
