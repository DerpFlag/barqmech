import { useEffect, useRef, type ReactNode } from 'react'

type IntroHeroProps = {
  videoSrc: string
  introDone: boolean
  onIntroEnded: () => void
  /** Fires once when this many seconds remain (overlay can fade in while video keeps playing). */
  onLeadReveal?: () => void
  playbackRate?: number
  revealLeadSeconds?: number
  /** End intro this many seconds before the physical file ends (tail trim). Lead reveal counts down to this point. */
  endTrimSeconds?: number
  children?: ReactNode
}

/** True when buffered ranges cover the full timeline (within a small epsilon). */
function isVideoFullyBuffered(video: HTMLVideoElement): boolean {
  const d = video.duration
  if (!Number.isFinite(d) || d <= 0) return false
  const { buffered } = video
  if (buffered.length === 0) return false
  try {
    return buffered.start(0) <= 0.3 && buffered.end(buffered.length - 1) >= d - 0.3
  } catch {
    return false
  }
}

export function IntroHero({
  videoSrc,
  introDone,
  onIntroEnded,
  onLeadReveal,
  playbackRate = 1,
  revealLeadSeconds = 0,
  endTrimSeconds = 0,
  children,
}: IntroHeroProps) {
  const heroRef = useRef<HTMLElement>(null)
  const heroCanvasRef = useRef<HTMLCanvasElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const introDoneRef = useRef(false)
  const leadRevealSentRef = useRef(false)
  const finalizeIntroRef = useRef<() => void>(() => {})

  useEffect(() => {
    introDoneRef.current = introDone
  }, [introDone])

  useEffect(() => {
    leadRevealSentRef.current = false
  }, [videoSrc])

  useEffect(() => {
    const video = videoRef.current
    if (!video || introDone) return

    let cancelled = false
    let started = false

    const startPlayback = () => {
      if (cancelled || started || introDoneRef.current) return
      started = true
      void video.play().catch(() => {
        /* autoplay policies / abort — ignore */
      })
    }

    const tryPlay = () => {
      if (cancelled || started || introDoneRef.current) return
      const enough = video.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA
      if (isVideoFullyBuffered(video) || enough) startPlayback()
    }

    const primeFirstFrame = () => {
      video.pause()
      if (video.currentTime > 0.001) video.currentTime = 0
    }

    const onMaybeStart = () => tryPlay()

    video.pause()
    video.addEventListener('progress', onMaybeStart)
    video.addEventListener('suspend', onMaybeStart)
    video.addEventListener('canplaythrough', onMaybeStart)

    const onLoadedMetadata = () => {
      primeFirstFrame()
      tryPlay()
    }
    video.addEventListener('loadedmetadata', onLoadedMetadata)

    const onLoadedData = () => onMaybeStart()
    video.addEventListener('loadeddata', onLoadedData)

    if (!cancelled && video.readyState >= HTMLMediaElement.HAVE_METADATA) {
      primeFirstFrame()
      onMaybeStart()
    }

    queueMicrotask(() => {
      if (!cancelled) {
        primeFirstFrame()
        onMaybeStart()
      }
    })

    const fallbackMs = 10_000
    const fallbackId = window.setTimeout(() => {
      if (!cancelled && !started && !introDoneRef.current) startPlayback()
    }, fallbackMs)

    return () => {
      cancelled = true
      window.clearTimeout(fallbackId)
      video.removeEventListener('progress', onMaybeStart)
      video.removeEventListener('suspend', onMaybeStart)
      video.removeEventListener('canplaythrough', onMaybeStart)
      video.removeEventListener('loadedmetadata', onLoadedMetadata)
      video.removeEventListener('loadeddata', onLoadedData)
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

  /**
   * HF (`HF/app/src/App.tsx`) keeps one continuous `requestAnimationFrame` loop: each frame either
   * paints the video (when decoded) or a static hold. No switching anim pipelines on play/pause —
   * that avoids blink/jank. We keep BarqMech layout (no blur gutters) and separate buffer-then-play logic above.
   */
  useEffect(() => {
    if (introDone) return

    const video = videoRef.current
    const canvas = heroCanvasRef.current
    const hero = heroRef.current
    if (!video || !canvas || !hero) return

    const ctx = canvas.getContext('2d', { alpha: false })
    if (!ctx) return

    let cancelled = false
    let rafId = 0
    let canvasWidth = 0
    let canvasHeight = 0
    let dpr = 1

    const resizeCanvas = () => {
      const rect = hero.getBoundingClientRect()
      const narrow = window.innerWidth <= 920
      const maxDpr = narrow ? 1.35 : 2
      dpr = Math.min(Math.max(window.devicePixelRatio || 1, 1), maxDpr)
      canvasWidth = Math.max(1, Math.floor(rect.width * dpr))
      canvasHeight = Math.max(1, Math.floor(rect.height * dpr))
      canvas.width = canvasWidth
      canvas.height = canvasHeight
      canvas.style.width = `${rect.width}px`
      canvas.style.height = `${rect.height}px`
    }

    const layoutFrame = (sourceW: number, sourceH: number) => {
      const isMobile = window.innerWidth <= 920
      const containScale = Math.min(canvasWidth / sourceW, canvasHeight / sourceH)
      const coverScale = Math.max(canvasWidth / sourceW, canvasHeight / sourceH)
      const minVisibleFraction = 0.6
      const maxAllowedScale = Math.min(
        canvasWidth / (sourceW * minVisibleFraction),
        canvasHeight / (sourceH * minVisibleFraction),
      )
      const scale = isMobile ? Math.min(coverScale, maxAllowedScale) : containScale
      const drawW = Math.round(sourceW * scale)
      const drawH = Math.round(sourceH * scale)
      const x = Math.round((canvasWidth - drawW) / 2)
      const y = Math.round((canvasHeight - drawH) / 2)
      return { x, y, drawW, drawH }
    }

    /** Avoid writing CSS vars every frame when layout is unchanged (style recalc competes with video paint). */
    let panelLayoutKey = ''
    const setPanelCenters = (x: number) => {
      const key = `${x}|${canvasWidth}`
      if (key === panelLayoutKey) return
      panelLayoutKey = key
      const leftCenterPct = (x / 2 / canvasWidth) * 100
      const rightCenterPct = 100 - leftCenterPct
      hero.style.setProperty('--panel-left-center', `${leftCenterPct}%`)
      hero.style.setProperty('--panel-right-center', `${rightCenterPct}%`)
    }

    const drawFrame = () => {
      if (cancelled || introDoneRef.current) return

      const videoReady = video.readyState >= 2 && video.videoWidth > 0 && video.videoHeight > 0
      if (videoReady) {
        ctx.clearRect(0, 0, canvasWidth, canvasHeight)
        ctx.fillStyle = '#000000'
        ctx.fillRect(0, 0, canvasWidth, canvasHeight)
        ctx.imageSmoothingEnabled = true
        const sw = video.videoWidth
        const sh = video.videoHeight
        const { x, y, drawW, drawH } = layoutFrame(sw, sh)
        setPanelCenters(x)
        ctx.drawImage(video, 0, 0, sw, sh, x, y, drawW, drawH)
      } else {
        ctx.fillStyle = '#0a0a0e'
        ctx.fillRect(0, 0, canvasWidth, canvasHeight)
      }

      rafId = window.requestAnimationFrame(drawFrame)
    }

    resizeCanvas()
    rafId = window.requestAnimationFrame(drawFrame)

    const resizeObserver = new ResizeObserver(() => {
      if (introDoneRef.current) return
      resizeCanvas()
    })
    resizeObserver.observe(hero)

    return () => {
      cancelled = true
      window.cancelAnimationFrame(rafId)
      resizeObserver.disconnect()
    }
  }, [introDone])

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

  const finalizeIntro = () => {
    if (introDoneRef.current) return
    if (onLeadReveal && !leadRevealSentRef.current && revealLeadSeconds > 0) {
      leadRevealSentRef.current = true
      onLeadReveal()
    }
    handleIntroReveal()
    handleIntroFinish()
  }

  finalizeIntroRef.current = finalizeIntro

  useEffect(() => {
    if (introDone) return
    const id = window.setTimeout(() => {
      if (!introDoneRef.current) finalizeIntroRef.current()
    }, 22_000)
    return () => window.clearTimeout(id)
  }, [introDone])

  const handleTimeUpdate = () => {
    const video = videoRef.current
    if (!video || !Number.isFinite(video.duration)) return
    const duration = video.duration
    const trim = Math.max(0, endTrimSeconds)
    const effectiveEnd = Math.max(0.08, duration - trim)

    if (trim > 0 && video.currentTime >= effectiveEnd - 0.05) {
      video.pause()
      finalizeIntro()
      return
    }

    const remainingToTrimmedEnd = effectiveEnd - video.currentTime
    if (
      onLeadReveal &&
      !leadRevealSentRef.current &&
      revealLeadSeconds > 0 &&
      remainingToTrimmedEnd <= revealLeadSeconds + 0.4 &&
      remainingToTrimmedEnd > 0.02
    ) {
      leadRevealSentRef.current = true
      onLeadReveal()
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
        onEnded={() => finalizeIntro()}
        onError={() => finalizeIntro()}
        onTimeUpdate={handleTimeUpdate}
      />
      {children}
    </section>
  )
}
