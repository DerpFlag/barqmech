import { memo, useEffect, useRef, useState } from 'react'
import { localImageSet } from '../data/responsiveMedia.ts'
import { LiquidImageReveal } from './LiquidImageReveal.tsx'

/** Stationary labels; the next photograph must decode before fading in. */
export const MosaicSlideshow = memo(function MosaicSlideshow({ urls, title, rotate, sizes }: { urls: string[]; title: string; rotate: boolean; sizes: string }) {
  const stack = useRef<HTMLDivElement>(null)
  const loaded = useRef(new Set<string>())
  const [inView, setInView] = useState(false)
  const [index, setIndex] = useState(0)
  const [interacting, setInteracting] = useState(false)
  const sequence = urls.join('|')

  useEffect(() => { setIndex(0) }, [sequence])
  useEffect(() => {
    const element = stack.current
    if (!element) return
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: .01 })
    observer.observe(element)
    return () => observer.disconnect()
  }, [])
  useEffect(() => {
    const host = stack.current?.closest('a')
    if (!host) return
    const enter = () => setInteracting(true)
    const leave = () => setInteracting(false)
    host.addEventListener('focus', enter); host.addEventListener('blur', leave)
    return () => { host.removeEventListener('focus', enter); host.removeEventListener('blur', leave) }
  }, [])
  useEffect(() => {
    if (!rotate || !inView || interacting || urls.length < 2) return
    const timer = window.setInterval(() => setIndex(current => {
      const next = (current + 1) % urls.length
      return loaded.current.has(urls[next]) ? next : current
    }), 2000)
    return () => window.clearInterval(timer)
  }, [rotate, inView, interacting, sequence, urls])

  const previous = (index + urls.length - 1) % urls.length
  const next = (index + 1) % urls.length
  return <div ref={stack} className="space-tile__image" onPointerEnter={() => setInteracting(true)} onPointerLeave={() => setInteracting(false)}>
    {urls.map((url, slide) => (slide === index || slide === previous || (inView && slide === next)) &&
      <div key={url} className={`space-photo-slide${slide === index ? ' active' : ''}`} aria-hidden="true">
        <img className="space-photo-main" src={url} srcSet={localImageSet(url)} sizes={sizes} alt="" loading={inView ? 'eager' : 'lazy'} decoding="async"
          onLoad={event => {
            const image = event.currentTarget
            void image.decode().then(() => loaded.current.add(url)).catch(() => loaded.current.add(url))
          }} />
      </div>)}
    {inView && urls[next] ? <LiquidImageReveal image={urls[next]} /> : null}
    <div className="space-tile__caption"><h3>{title}</h3></div>
  </div>
})
