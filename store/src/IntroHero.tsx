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

  useEffect(() => {
    if (introDone) return

    const video = videoRef.current
    const canvas = heroCanvasRef.current
    const hero = heroRef.current
    if (!video || !canvas || !hero) return

    const ctx =
      canvas.getContext('2d', { alpha: false, desynchronized: true }) ?? canvas.getContext('2d', { alpha: false })
    if (!ctx) return

    let cancelled = false
    let rafId = 0
    let rvfcId = 0
    let resizeDebounce = 0
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

    const setPanelCenters = (x: number) => {
      const leftCenterPct = (x / 2 / canvasWidth) * 100
      const rightCenterPct = 100 - leftCenterPct
      hero.style.setProperty('--panel-left-center', `${leftCenterPct}%`)
      hero.style.setProperty('--panel-right-center', `${rightCenterPct}%`)
    }

    /** Cheap: first frame / paused hold — no blur passes, no rAF loop. */
    const paintFrozen = () => {
      if (cancelled || introDoneRef.current) return
      ctx.clearRect(0, 0, canvasWidth, canvasHeight)
      const videoReady = video.readyState >= 2 && video.videoWidth > 0 && video.videoHeight > 0
      if (!videoReady) {
        ctx.fillStyle = '#0a0a0e'
        ctx.fillRect(0, 0, canvasWidth, canvasHeight)
        return
      }
      ctx.fillStyle = '#000000'
      ctx.fillRect(0, 0, canvasWidth, canvasHeight)
      ctx.imageSmoothingEnabled = true
      const sw = video.videoWidth
      const sh = video.videoHeight
      const { x, y, drawW, drawH } = layoutFrame(sw, sh)
      setPanelCenters(x)
      ctx.drawImage(video, 0, 0, sw, sh, x, y, drawW, drawH)
    }

    /** Heavy: only while video is playing (blur gutters + seams). */
    const paintPlayingDecorated = () => {
      if (cancelled || introDoneRef.current) return
      const sw = video.videoWidth
      const sh = video.videoHeight
      if (sw <= 0 || sh <= 0) return

      const { x, y, drawW, drawH } = layoutFrame(sw, sh)
      setPanelCenters(x)

      ctx.clearRect(0, 0, canvasWidth, canvasHeight)
      ctx.imageSmoothingEnabled = true

      const blur = Math.max(Math.floor(18 * dpr), 1)
      const pad = Math.max(Math.floor(48 * dpr), 1)
      const strip = 24

      ctx.save()
      ctx.filter = `blur(${Math.max(blur + 8, 24)}px)`
      if (x > 0) {
        ctx.drawImage(video, 0, 0, strip, sh, -pad, 0, x + pad * 2, canvasHeight)
        ctx.drawImage(video, sw - strip, 0, strip, sh, canvasWidth - x - pad, 0, x + pad * 2, canvasHeight)
      }
      if (y > 0) {
        ctx.drawImage(video, 0, 0, sw, strip, 0, -pad, canvasWidth, y + pad * 2)
        ctx.drawImage(video, 0, sh - strip, sw, strip, 0, canvasHeight - y - pad, canvasWidth, y + pad * 2)
      }
      ctx.restore()

      ctx.drawImage(video, 0, 0, sw, sh, x, y, drawW, drawH)

      if (x > 0) {
        const seamW = Math.max(Math.floor(150 * dpr), 1)
        ctx.save()
        ctx.globalAlpha = 0.82
        ctx.filter = `blur(${Math.max(Math.floor(20 * dpr), 10)}px)`
        ctx.drawImage(video, 0, 0, strip, sh, x - seamW, y, seamW * 2, drawH)
        ctx.drawImage(video, sw - strip, 0, strip, sh, canvasWidth - x - seamW, y, seamW * 2, drawH)
        ctx.restore()
      }
    }

    const vWithRvfc = video as HTMLVideoElement & {
      requestVideoFrameCallback?: (cb: VideoFrameRequestCallback) => number
      cancelVideoFrameCallback?: (handle: number) => void
    }

    const stopAnim = () => {
      if (rafId) {
        window.cancelAnimationFrame(rafId)
        rafId = 0
      }
      if (rvfcId && typeof vWithRvfc.cancelVideoFrameCallback === 'function') {
        vWithRvfc.cancelVideoFrameCallback(rvfcId)
        rvfcId = 0
      }
    }

    const schedulePlaying = () => {
      if (cancelled || introDoneRef.current) return
      if (video.paused || video.ended) return

      const videoReady = video.readyState >= 2 && video.videoWidth > 0 && video.videoHeight > 0
      if (!videoReady) return

      paintPlayingDecorated()

      const playing = !video.paused && !video.ended
      if (!playing) return

      const useRvfc =
        typeof vWithRvfc.requestVideoFrameCallback === 'function' &&
        video.readyState >= 2 &&
        video.videoWidth > 0 &&
        video.videoHeight > 0

      if (useRvfc) {
        const id = vWithRvfc.requestVideoFrameCallback!(() => {
          rvfcId = 0
          schedulePlaying()
        })
        rvfcId = typeof id === 'number' ? id : 0
      } else {
        rafId = window.requestAnimationFrame(() => {
          rafId = 0
          schedulePlaying()
        })
      }
    }

    const onLoadedOrSeeked = () => {
      if (video.paused && !introDoneRef.current) paintFrozen()
    }

    const onPlaying = () => {
      stopAnim()
      schedulePlaying()
    }

    const onPause = () => {
      stopAnim()
      if (!introDoneRef.current) paintFrozen()
    }

    video.addEventListener('loadeddata', onLoadedOrSeeked)
    video.addEventListener('seeked', onLoadedOrSeeked)
    video.addEventListener('playing', onPlaying)
    video.addEventListener('pause', onPause)

    resizeCanvas()
    paintFrozen()

    const resizeObserver = new ResizeObserver(() => {
      if (introDoneRef.current || cancelled) return
      window.clearTimeout(resizeDebounce)
      resizeDebounce = window.setTimeout(() => {
        resizeCanvas()
        if (video.paused || video.ended) paintFrozen()
        else {
          stopAnim()
          schedulePlaying()
        }
      }, 100)
    })
    resizeObserver.observe(hero)

    return () => {
      cancelled = true
      stopAnim()
      window.clearTimeout(resizeDebounce)
      resizeObserver.disconnect()
      video.removeEventListener('loadeddata', onLoadedOrSeeked)
      video.removeEventListener('seeked', onLoadedOrSeeked)
      video.removeEventListener('playing', onPlaying)
      video.removeEventListener('pause', onPause)
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
