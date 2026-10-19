import { useEffect, useRef, useState } from 'react'
import { CatalogImage } from './CatalogImage.tsx'
import { catalogImageUrl, type CatalogImageSize } from '@store/catalog/productImages.ts'
import { preloadImageUrls } from '@store/catalog/preloadImages.ts'

type Props = {
  urls: string[]
  alt: string
  stackClassName: string
  imageClassName: string
  activeClassName?: string
  /** When set, uses Supabase transform sizes (card/thumb). Omit for static Vite URLs (mosaic). */
  catalogSize?: CatalogImageSize
  /** Auto-advance slides after all resolved URLs are preloaded. */
  rotate?: boolean
  intervalMs?: number
  /** Controlled slide index (PDP hero). Disables internal timer. */
  activeIndex?: number
  loading?: 'lazy' | 'eager'
  fetchPriority?: 'high' | 'low' | 'auto'
}

function resolveSrc(url: string, catalogSize?: CatalogImageSize): string {
  return catalogSize ? catalogImageUrl(url, catalogSize) : url
}

export function RotatingImageStack({
  urls,
  alt,
  stackClassName,
  imageClassName,
  activeClassName = 'active',
  catalogSize,
  rotate = false,
  intervalMs = 2800,
  activeIndex: controlledIndex,
  loading = 'lazy',
  fetchPriority,
}: Props) {
  const stackRef = useRef<HTMLDivElement>(null)
  const [inView, setInView] = useState(false)
  const [ready, setReady] = useState(urls.length <= 1)
  const [internalIndex, setInternalIndex] = useState(0)

  const activeIndex = controlledIndex ?? internalIndex
  const slides = !rotate && controlledIndex === undefined ? [urls[0] ?? ''] : urls.length ? urls : ['']

  useEffect(() => {
    setInternalIndex(0)
    setReady(slides.length <= 1)
  }, [slides.join('|'), catalogSize])

  useEffect(() => {
    const el = stackRef.current
    if (!el) return
    const io = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { rootMargin: '80px 0px', threshold: 0.01 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  useEffect(() => {
    if (!inView || slides.length <= 1) {
      if (slides.length <= 1) setReady(true)
      return
    }

    let cancelled = false
    const targets = [resolveSrc(slides[activeIndex]!, catalogSize)]
    if (slides.length > 1) {
      const next = (activeIndex + 1) % slides.length
      targets.push(resolveSrc(slides[next]!, catalogSize))
    }
    void preloadImageUrls(targets, 2).then(() => {
      if (!cancelled) setReady(true)
    })
    return () => {
      cancelled = true
    }
  }, [inView, slides, catalogSize, activeIndex])

  useEffect(() => {
    if (controlledIndex !== undefined) return
    if (!rotate || !ready || !inView || slides.length <= 1) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const timer = window.setInterval(() => {
      setInternalIndex((i) => (i + 1) % slides.length)
    }, intervalMs)

    return () => window.clearInterval(timer)
  }, [rotate, ready, inView, slides.length, intervalMs, controlledIndex])

  return (
    <div ref={stackRef} className={stackClassName}>
      {slides.map((url, index) => {
        if (index !== activeIndex && (!inView || index !== (activeIndex + 1) % slides.length)) return null
        const className = `${imageClassName}${index === activeIndex ? ` ${activeClassName}` : ''}`
        const shared = {
          alt,
          className,
          loading: (index === 0 ? loading : 'lazy') as 'lazy' | 'eager',
          decoding: 'async' as const,
          fetchPriority: index === activeIndex ? fetchPriority : undefined,
          'aria-hidden': index !== activeIndex,
        }
        return catalogSize ? (
          <CatalogImage key={`${url}-${index}`} publicUrl={url} size={catalogSize} {...shared} />
        ) : (
          <img key={`${url}-${index}`} src={url} {...shared} />
        )
      })}
    </div>
  )
}
