import { useEffect, useRef, type ReactNode } from 'react'

type IntroHeroProps = {
  videoSrc: string
  posterSrc?: string
  introDone: boolean
  onIntroEnded: () => void
  playbackRate?: number
  endTrimSeconds?: number
  revealLeadSeconds?: number
  children?: ReactNode
}

export function IntroHero({
  videoSrc,
  posterSrc,
  introDone,
  onIntroEnded,
  playbackRate = 1,
  endTrimSeconds = 0,
  revealLeadSeconds = 0,
  children,
}: IntroHeroProps) {
  const heroRef = useRef<HTMLElement>(null)
  const heroCanvasRef = useRef<HTMLCanvasElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const introDoneRef = useRef(false)

  useEffect(() => {
    introDoneRef.current = introDone
  }, [introDone])

  /**
   * Start playback only after `canplaythrough` (browser thinks it can play without rebuffering),
   * not on `readyState` alone — that often fires too early on mobile and causes stutter.
   * Long fallback only if `canplaythrough` never fires (unusual).
   */
  useEffect(() => {
    const video = videoRef.current
    if (!video || introDone) return

    let cancelled = false
    let started = false

    const tryPlay = () => {
      if (cancelled || started || introDoneRef.current) return
      started = true
      void video.play().catch(() => {
        /* autoplay policies / abort — ignore */
      })
    }

    const onCanPlayThrough = () => tryPlay()
    video.addEventListener('canplaythrough', onCanPlayThrough, { once: true })

    const fallbackMs = 20000
    const fallbackId = window.setTimeout(() => {
      if (!cancelled && !started) tryPlay()
    }, fallbackMs)

    return () => {
      cancelled = true
      window.clearTimeout(fallbackId)
      video.removeEventListener('canplaythrough', onCanPlayThrough)
    }
  }, [videoSrc, introDone])

  useEffect(() => {
    const video = videoRef.current
    if (video) {
      video.playbackRate = playbackRate
      video.loop = false
    }

    document.body.classList.toggle('intro-playing', !introDone)
    return () => document.body.classList.remove('intro-playing')
  }, [introDone, playbackRate])

  useEffect(() => {
    if (introDone) return

    const video = videoRef.current
    const canvas = heroCanvasRef.current
    const hero = heroRef.current
    if (!video || !canvas || !hero) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let cancelled = false
    let rafId = 0
    let rvfcId = 0
    let resizeDebounce = 0
    let canvasWidth = 0
    let canvasHeight = 0
    let dpr = 1
    const poster = new Image()
    if (posterSrc) {
      poster.src = posterSrc
    }
    let posterLoaded = false
    poster.onload = () => {
      posterLoaded = true
    }

    const resizeCanvas = () => {
      const rect = hero.getBoundingClientRect()
      dpr = Math.min(Math.max(window.devicePixelRatio || 1, 1), 2)
      canvasWidth = Math.max(1, Math.floor(rect.width * dpr))
      canvasHeight = Math.max(1, Math.floor(rect.height * dpr))
      canvas.width = canvasWidth
      canvas.height = canvasHeight
      canvas.style.width = `${rect.width}px`
      canvas.style.height = `${rect.height}px`
    }

    const drawSourceFrame = (source: CanvasImageSource, sourceW: number, sourceH: number) => {
      const isMobile = window.innerWidth <= 920
      const containScale = Math.min(canvasWidth / sourceW, canvasHeight / sourceH)
      const coverScale = Math.max(canvasWidth / sourceW, canvasHeight / sourceH)
      // Keep the "filled" mobile look, but ensure at least ~60% of source stays visible.
      const minVisibleFraction = 0.6
      const maxAllowedScale = Math.min(
        canvasWidth / (sourceW * minVisibleFraction),
        canvasHeight / (sourceH * minVisibleFraction)
      )
      const scale = isMobile ? Math.min(coverScale, maxAllowedScale) : containScale
      const drawW = Math.round(sourceW * scale)
      const drawH = Math.round(sourceH * scale)
      const x = Math.round((canvasWidth - drawW) / 2)
      const y = Math.round((canvasHeight - drawH) / 2)

      const leftCenterPct = (x / 2 / canvasWidth) * 100
      const rightCenterPct = 100 - leftCenterPct
      hero.style.setProperty('--panel-left-center', `${leftCenterPct}%`)
      hero.style.setProperty('--panel-right-center', `${rightCenterPct}%`)

      ctx.clearRect(0, 0, canvasWidth, canvasHeight)
      ctx.imageSmoothingEnabled = true

      const blur = Math.max(Math.floor(18 * dpr), 1)
      const pad = Math.max(Math.floor(48 * dpr), 1)
      const strip = 24

      ctx.save()
      ctx.filter = `blur(${Math.max(blur + 8, 24)}px)`
      if (x > 0) {
        ctx.drawImage(source, 0, 0, strip, sourceH, -pad, 0, x + pad * 2, canvasHeight)
        ctx.drawImage(
          source,
          sourceW - strip,
          0,
          strip,
          sourceH,
          canvasWidth - x - pad,
          0,
          x + pad * 2,
          canvasHeight
        )
      }
      if (y > 0) {
        ctx.drawImage(source, 0, 0, sourceW, strip, 0, -pad, canvasWidth, y + pad * 2)
        ctx.drawImage(
          source,
          0,
          sourceH - strip,
          sourceW,
          strip,
          0,
          canvasHeight - y - pad,
          canvasWidth,
          y + pad * 2
        )
      }
      ctx.restore()

      ctx.drawImage(source, 0, 0, sourceW, sourceH, x, y, drawW, drawH)

      if (x > 0) {
        const seamW = Math.max(Math.floor(150 * dpr), 1)
        ctx.save()
        ctx.globalAlpha = 0.82
        ctx.filter = `blur(${Math.max(Math.floor(20 * dpr), 10)}px)`
        ctx.drawImage(
          source,
          0,
          0,
          strip,
          sourceH,
          x - seamW,
          y,
          seamW * 2,
          drawH
        )
        ctx.drawImage(
          source,
          sourceW - strip,
          0,
          strip,
          sourceH,
          canvasWidth - x - seamW,
          y,
          seamW * 2,
          drawH
        )
        ctx.restore()
      }
    }

    const vWithRvfc = video as HTMLVideoElement & {
      requestVideoFrameCallback?: (cb: VideoFrameRequestCallback) => number
      cancelVideoFrameCallback?: (handle: number) => void
    }

    let idleFrames = 0

    const scheduleNextDraw = () => {
      if (cancelled || introDoneRef.current) return

      const videoReady = video.readyState >= 2 && video.videoWidth > 0 && video.videoHeight > 0
      const playing = !video.paused && !video.ended
      const useRvfc =
        typeof vWithRvfc.requestVideoFrameCallback === 'function' && videoReady && playing

      if (useRvfc) {
        const id = vWithRvfc.requestVideoFrameCallback!(() => {
          drawFrame()
        })
        rvfcId = typeof id === 'number' ? id : 0
      } else {
        rafId = window.requestAnimationFrame(() => {
          rafId = 0
          drawFrame()
        })
      }
    }

    const drawFrame = () => {
      if (cancelled || introDoneRef.current) return

      const videoReady = video.readyState >= 2 && video.videoWidth > 0 && video.videoHeight > 0
      const playing = !video.paused && !video.ended

      if (videoReady) {
        if (playing || idleFrames++ % 4 === 0) {
          drawSourceFrame(video, video.videoWidth, video.videoHeight)
        }
      } else if (posterSrc && posterLoaded && poster.naturalWidth > 0 && poster.naturalHeight > 0) {
        drawSourceFrame(poster, poster.naturalWidth, poster.naturalHeight)
      }

      scheduleNextDraw()
    }

    resizeCanvas()
    drawFrame()

    const resizeObserver = new ResizeObserver(() => {
      if (introDoneRef.current || cancelled) return
      window.clearTimeout(resizeDebounce)
      resizeDebounce = window.setTimeout(() => {
        resizeCanvas()
      }, 100)
    })
    resizeObserver.observe(hero)

    return () => {
      cancelled = true
      window.clearTimeout(resizeDebounce)
      if (rafId) window.cancelAnimationFrame(rafId)
      if (rvfcId && typeof vWithRvfc.cancelVideoFrameCallback === 'function') {
        vWithRvfc.cancelVideoFrameCallback(rvfcId)
      }
      resizeObserver.disconnect()
      poster.onload = null
    }
  }, [posterSrc, introDone])

  const handleIntroReveal = () => {
    if (introDoneRef.current) return
    introDoneRef.current = true
    const v = videoRef.current
    if (v) v.pause()
    onIntroEnded()
  }

  const handleIntroFinish = () => {
    const video = videoRef.current
    if (video) {
      video.loop = false
      video.pause()
    }
  }

  const handleTimeUpdate = () => {
    const video = videoRef.current
    if (!video || !Number.isFinite(video.duration)) return
    const remaining = video.duration - video.currentTime
    const revealThreshold = Math.max(endTrimSeconds + revealLeadSeconds, 0)
    if (remaining <= revealThreshold) {
      handleIntroReveal()
    }
    if (endTrimSeconds > 0 && remaining <= endTrimSeconds) {
      handleIntroFinish()
    }
  }

  return (
    <section className="hero-wrap" ref={heroRef} id="home">
      <canvas ref={heroCanvasRef} className="hero-canvas" aria-hidden />
      <video
        ref={videoRef}
        className="hero-video"
        src={videoSrc}
        muted
        playsInline
        preload="auto"
        loop={false}
        onEnded={() => {
          handleIntroReveal()
          handleIntroFinish()
        }}
        onTimeUpdate={handleTimeUpdate}
      />
      {children}
    </section>
  )
}
