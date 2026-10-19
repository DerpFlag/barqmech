import { useEffect, useState } from 'react'
import { heroBgVideoUrl } from '../data/catalog.ts'

type Props = {
  onComplete: () => void
}

const COUNT_MS = 420
const EXIT_MS = 300
const MAX_WAIT_MS = 1200
/** Hard cap so a backgrounded tab (throttled rAF) cannot leave the loader stuck. */
const FORCE_DONE_MS = 5200

/** CodeShinobi-style 00→100 loader; waits for hero video + minimum animation. */
export function ShinobiLoader({ onComplete }: Props) {
  const [count, setCount] = useState(0)
  const [barScale, setBarScale] = useState(0)
  const [exiting, setExiting] = useState(false)
  const [videoReady, setVideoReady] = useState(false)
  const [countDone, setCountDone] = useState(false)

  useEffect(() => {
    document.body.classList.add('shinobi-loading-active')
    return () => document.body.classList.remove('shinobi-loading-active')
  }, [])

  useEffect(() => {
    const video = document.createElement('video')
    video.preload = 'auto'
    video.muted = true
    video.playsInline = true
    video.src = heroBgVideoUrl

    const markReady = () => setVideoReady(true)
    video.addEventListener('canplaythrough', markReady, { once: true })
    video.addEventListener('loadeddata', markReady, { once: true })
    video.load()

    const fallback = window.setTimeout(markReady, MAX_WAIT_MS)
    return () => {
      window.clearTimeout(fallback)
      video.removeEventListener('canplaythrough', markReady)
      video.removeEventListener('loadeddata', markReady)
    }
  }, [])

  useEffect(() => {
    const start = performance.now()
    let raf = 0
    let finished = false

    const finish = () => {
      if (finished) return
      finished = true
      setCount(100)
      setBarScale(1)
      setCountDone(true)
    }

    const applyProgress = (now: number) => {
      const p = Math.min(1, (now - start) / COUNT_MS)
      const eased = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2
      setCount(Math.round(eased * 100))
      setBarScale(eased)
      if (p >= 1) finish()
      return p
    }

    const tick = (now: number) => {
      const p = applyProgress(now)
      if (p < 1) raf = requestAnimationFrame(tick)
    }

    raf = requestAnimationFrame(tick)
    // setInterval keeps progressing when rAF is paused (background tabs).
    const interval = window.setInterval(() => applyProgress(performance.now()), 50)
    const force = window.setTimeout(finish, FORCE_DONE_MS)

    return () => {
      cancelAnimationFrame(raf)
      window.clearInterval(interval)
      window.clearTimeout(force)
    }
  }, [])

  useEffect(() => {
    if (!countDone || !videoReady) return
    setExiting(true)
    const t = window.setTimeout(() => {
      document.body.classList.add('shinobi-is-ready')
      onComplete()
    }, EXIT_MS)
    return () => window.clearTimeout(t)
  }, [countDone, videoReady, onComplete])

  return (
    <div className={`shinobi-loader${exiting ? ' shinobi-loader--exit' : ''}`} aria-hidden={exiting}>
      <div className="shinobi-loader__count">{String(count).padStart(2, '0')}</div>
      <div className="shinobi-loader__bar" style={{ transform: `scaleX(${barScale})` }} />
    </div>
  )
}
