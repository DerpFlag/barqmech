import { useEffect, useId, useRef, useState } from 'react'
import { watchScrollIdle } from './scrollActivity.ts'

const RIBBON_PHRASE = 'LASER CUT  ·  MADE TO ORDER  ·  FINISHED YOUR WAY  ·  '

export function ScrollInk({ children }: { children: string }) {
  return <p className="studio-scroll-ink" data-scroll-ink aria-label={children}>
    <span aria-hidden="true">{children.split(' ').map((word, index) => <span className="studio-ink-word" key={index}>{Array.from(word).map((letter, character) => <span className="studio-ink-character" key={character}>{letter}</span>)}</span>)}</span>
  </p>
}

/** The letters remain one accessible brand name; only decorative spans move. */
export function SpringWordmark() {
  return <div className="metal-footer__wordmark" aria-label="BarqMech">
    {'BARQMECH'.split('').map((letter, index) => <span className="studio-brand-letter" aria-hidden="true" key={index}>{letter}</span>)}
  </div>
}

export function CurvedRibbon() {
  const [copies,setCopies] = useState(4)
  const id = useId().replace(/:/g, '')
  const root = useRef<SVGSVGElement>(null)
  const text = useRef<SVGTextPathElement>(null)
  const curve = useRef<SVGPathElement>(null)
  const band = useRef<SVGPathElement>(null)
  const mask = useRef<SVGPathElement>(null)
  const group = useRef<SVGGElement>(null)
  const travel = useRef(0)
  useEffect(() => {
    const element = root.current
    if (!element || !text.current) return
    const motion = matchMedia('(prefers-reduced-motion: reduce)')
    let frame = 0, inView = false, previous = 0, distance = travel.current
    let revealed = false
    let scrollIdle = true, disposed = false
    let reveal: Animation | undefined
    let repeatWidth = 1600
    const shell = element.closest<HTMLElement>('.shinobi-shell')
    const measure = () => {
      const width = shell?.getBoundingClientRect().width ?? element.getBoundingClientRect().width
      const height = element.getBoundingClientRect().height
      if (disposed || !width || !height) return
      shell?.style.setProperty('--studio-page-width', `${width}px`)
      element.setAttribute('viewBox', `0 0 ${width} ${height}`)
      const edge = height * .68, crest = height * .29
      const y = (x: number) => crest + (edge - crest) * ((x - width / 2) / (width / 2)) ** 2
      // Both paths are sections of the very same parabola, including its text baseline.
      const segment = (left: number, right: number) => {
        const middle = (left + right) / 2
        return `M${left} ${y(left)}Q${middle} ${2 * y(middle) - (y(left) + y(right)) / 2} ${right} ${y(right)}`
      }
      const visibleCurve = segment(-width * .12, width * 1.12)
      // Only lay out glyphs along the visible arc; repetitions cover the loop offset.
      curve.current?.setAttribute('d', visibleCurve)
      band.current?.setAttribute('d', visibleCurve)
      mask.current?.setAttribute('d', visibleCurve)
      const revealMask = mask.current?.parentElement
      revealMask?.setAttribute('x', String(-width))
      revealMask?.setAttribute('y', String(-height))
      revealMask?.setAttribute('width', String(width * 3))
      revealMask?.setAttribute('height', String(height * 3))
      element.style.setProperty('--ribbon-stroke', `${height * .54}px`)
      element.style.setProperty('--ribbon-font-size', `${Math.min(46, height * .29)}px`)
      repeatWidth = (text.current?.parentElement as unknown as SVGTextElement)?.getSubStringLength(0,RIBBON_PHRASE.length) || 1600
      setCopies(Math.max(3,Math.ceil(width*1.3/repeatWidth)+2))
    }
    measure()
    void document.fonts.ready.then(measure)
    const stop = () => { cancelAnimationFrame(frame); frame = 0; previous = 0 }
    const tick = (now: number) => {
      distance += previous ? Math.min(now - previous, 50) * .028 : 0
      previous = now
      text.current?.setAttribute('startOffset', String(-((distance + scrollY * .16) % repeatWidth)))
      frame = requestAnimationFrame(tick)
    }
    const sync = () => {
      stop()
      if (motion.matches) {
        revealed = true
        reveal?.cancel()
        group.current?.removeAttribute('mask')
      }
      if (inView && scrollIdle && !document.hidden && !motion.matches) frame = requestAnimationFrame(tick)
    }
    if (mask.current && !motion.matches) mask.current.style.strokeDashoffset = '-1'
    const observer = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting
      if (inView && !revealed && mask.current && !motion.matches) {
        revealed = true
        reveal = mask.current.animate([{ strokeDashoffset: '-1' }, { strokeDashoffset: '0' }], {
          duration: 1300, easing: 'cubic-bezier(.22,.61,.36,1)', fill: 'forwards',
        })
        reveal.onfinish = () => group.current?.removeAttribute('mask')
      }
      sync()
    }, { rootMargin: '0px 0px -12% 0px' })
    observer.observe(element)
    const stopScrollWatch = watchScrollIdle(idle => { scrollIdle = idle; sync() })
    motion.addEventListener('change', sync)
    document.addEventListener('visibilitychange', sync)
    const sizing = new ResizeObserver(measure)
    sizing.observe(element)
    if (shell) sizing.observe(shell)
    window.addEventListener('resize', measure)
    return () => { disposed = true; stopScrollWatch(); travel.current = distance; stop(); reveal?.cancel(); observer.disconnect(); sizing.disconnect(); shell?.style.removeProperty('--studio-page-width'); motion.removeEventListener('change', sync); document.removeEventListener('visibilitychange', sync); window.removeEventListener('resize', measure) }
  }, [])
  return <svg ref={root} className="studio-ribbon" viewBox="0 0 1400 160" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
    <defs>
      <path ref={curve} id={id} d="M-1700 260 Q700 -140 3100 260" />
      <mask id={`${id}-reveal`} maskUnits="userSpaceOnUse" x="-2000" y="-500" width="6000" height="1200">
        <path ref={mask} className="studio-ribbon__reveal" d="M-100 85Q700 35 1500 85" pathLength="1" />
      </mask>
    </defs>
    <g ref={group} mask={`url(#${id}-reveal)`}>
      <path ref={band} d="M-100 85Q700 35 1500 85" className="studio-ribbon__band" />
      <text dominantBaseline="central" alignmentBaseline="central"><textPath ref={text} dominantBaseline="central" alignmentBaseline="central" href={`#${id}`}>{RIBBON_PHRASE.repeat(copies)}</textPath></text>
    </g>
  </svg>
}
