import { useEffect, useRef, useState, type ReactNode } from 'react'

type IntroHeroProps = {
  videoSrc: string
  posterSrc?: string
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
  posterSrc,
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
  /** Blob URL from full-file prefetch so `buffered` spans the whole timeline (Range/CDN fragments break `isVideoFullyBuffered`). */
  const blobUrlRef = useRef<string | null>(null)
  const [resolvedVideoSrc, setResolvedVideoSrc] = useState<string | null>(null)

  useEffect(() => {
    introDoneRef.current = introDone
  }, [introDone])

  useEffect(() => {
    leadRevealSentRef.current = false
  }, [videoSrc])

  /**
   * HF (`HF/app/src/App.tsx`) showed a static poster on the canvas (`/initial.png`) until the video
   * could paint, then relied on `<video autoPlay>`. Here we keep your stricter rule: play only once
   * the file is fully buffered for smooth playback — prefetch via `fetch` + blob URL makes that
   * reliable on static hosts (Vercel) where progressive Range requests never satisfy `buffered.end >= duration`.
   */
  useEffect(() => {
    const ac = new AbortController()
    let cancelled = false

    const revokeBlob = () => {
      const u = blobUrlRef.current
      if (u) {
        URL.revokeObjectURL(u)
        blobUrlRef.current = null
      }
    }

    revokeBlob()
    setResolvedVideoSrc(null)

    ;(async () => {
      try {
        const res = await fetch(videoSrc, { signal: ac.signal, credentials: 'same-origin' })
        if (!res.ok) throw new Error(String(res.status))
        const blob = await res.blob()
        if (cancelled) return
        revokeBlob()
        const url = URL.createObjectURL(blob)
        blobUrlRef.current = url
        setResolvedVideoSrc(url)
      } catch {
        if (ac.signal.aborted || cancelled) return
        revokeBlob()
        setResolvedVideoSrc(videoSrc)
      }
    })()

    return () => {
      cancelled = true
      ac.abort()
      revokeBlob()
    }
  }, [videoSrc])

  /**
   * Stay on poster / first decoded frame until the asset is buffered end-to-end, then play.
   * Avoids mid-play rebuffer jank at the cost of a longer intro wait on slow networks.
   */
  useEffect(() => {
    const video = videoRef.current
    if (!video || introDone || !resolvedVideoSrc) return

    let cancelled = false
    let started = false

    const tryPlay = () => {
      if (cancelled || started || introDoneRef.current) return
      if (!isVideoFullyBuffered(video)) return
      started = true
      void video.play().catch(() => {
        /* autoplay policies / abort — ignore */
      })
    }

    const primeFirstFrame = () => {
      video.pause()
      if (video.currentTime > 0.001) video.currentTime = 0
    }

    const onMaybeStart = () => tryPlay()

    video.pause()
    video.addEventListener('progress', onMaybeStart)
    video.addEventListener('suspend', onMaybeStart)

    const onLoadedMetadata = () => {
      primeFirstFrame()
      tryPlay()
    }
    video.addEventListener('loadedmetadata', onLoadedMetadata)

    // First frame decoded for current time (typically 0) — redraw canvas ASAP.
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

    const fallbackMs = 120_000
    const fallbackId = window.setTimeout(() => {
      if (!cancelled && !started && !introDoneRef.current) {
        started = true
        void video.play().catch(() => {})
      }
    }, fallbackMs)

    return () => {
      cancelled = true
      window.clearTimeout(fallbackId)
      video.removeEventListener('progress', onMaybeStart)
      video.removeEventListener('suspend', onMaybeStart)
      video.removeEventListener('loadedmetadata', onLoadedMetadata)
      video.removeEventListener('loadeddata', onLoadedData)
    }
  }, [resolvedVideoSrc, introDone])

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

    const ctx = canvas.getContext('2d', { alpha: false })
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

    const scheduleNextDraw = () => {
      if (cancelled || introDoneRef.current) return

      const videoReady = video.readyState >= 2 && video.videoWidth > 0 && video.videoHeight > 0
      const playing = !video.paused && !video.ended
      const useRvfc =
        typeof vWithRvfc.requestVideoFrameCallback === 'function' && videoReady && playing

      if (useRvfc) {
        if (rafId) {
          window.cancelAnimationFrame(rafId)
          rafId = 0
        }
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

      if (videoReady) {
        drawSourceFrame(video, video.videoWidth, video.videoHeight)
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
        // Setting canvas width/height clears pixels; repaint immediately to avoid a bright/empty flash.
        drawFrame()
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

  const finalizeIntro = () => {
    if (introDoneRef.current) return
    if (onLeadReveal && !leadRevealSentRef.current && revealLeadSeconds > 0) {
      leadRevealSentRef.current = true
      onLeadReveal()
    }
    handleIntroReveal()
    handleIntroFinish()
  }

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
        src={resolvedVideoSrc ?? undefined}
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
