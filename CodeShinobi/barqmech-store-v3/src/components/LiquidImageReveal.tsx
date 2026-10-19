import { useEffect, useId, useRef } from 'react'

// Original brush geometry. A solid stroke leads; an image mask follows it.
const BRUSH = 'M540 -90C760 210 20 30 75 240S700 200 510 460 30 420 100 650 700 640 450 900'

export function LiquidImageReveal({ image }: { image: string }) {
  const id = `liquid-${useId().replace(/:/g, '')}`
  const root = useRef<SVGSVGElement>(null)
  const loaded = useRef(false)
  useEffect(() => {
    const svg = root.current
    const host = svg?.closest('a')
    if (!svg || !host) return
    loaded.current = false
    const paths = svg.querySelectorAll<SVGPathElement>('path')
    const preference = matchMedia('(prefers-reduced-motion: reduce)')
    const strokes = [...paths].map((path, index) => {
      const animation = path.animate([
        { strokeDashoffset: '-1', strokeWidth: '0px' },
        { strokeDashoffset: '0', strokeWidth: '1100px' },
      ], { duration: index === 0 ? 950 : 1050, delay: index === 0 ? 0 : 350, easing: 'cubic-bezier(.45,0,.55,1)', fill: 'both' })
      animation.pause(); animation.currentTime = 0
      return animation
    })
    let entered = false
    const play = () => {
      if (!loaded.current) return
      strokes.forEach(animation => {
        if (preference.matches) animation.finish()
        else { animation.playbackRate = 1; animation.play() }
      })
    }
    const enter = (event: Event) => {
      if (event instanceof PointerEvent && (event.pointerType !== 'mouse' || !matchMedia('(hover:hover)').matches)) return
      entered = true
      if (!loaded.current) svg.querySelector('image')?.setAttribute('href', image)
      play()
    }
    const leave = () => {
      entered = false
      strokes.forEach(animation => {
        if (preference.matches) { animation.pause(); animation.currentTime = 0 }
        else { animation.playbackRate = -1.3; animation.play() }
      })
    }
    const imageReady = () => { loaded.current = true; svg.style.visibility = ''; if (entered) play() }
    const imageFailed = () => {
      loaded.current = false
      svg.style.visibility = 'hidden'
      strokes.forEach(animation => { animation.pause(); animation.currentTime = 0 })
    }
    const imageNode = svg.querySelector('image')
    imageNode?.removeAttribute('href')
    imageNode?.addEventListener('load', imageReady)
    imageNode?.addEventListener('error', imageFailed)
    host.addEventListener('pointerenter', enter)
    host.addEventListener('pointerleave', leave)
    host.addEventListener('focus', enter)
    host.addEventListener('blur', leave)
    const motionChange = () => { if (entered) play(); else leave() }
    preference.addEventListener('change', motionChange)
    return () => {
      strokes.forEach(animation => animation.cancel())
      imageNode?.removeEventListener('load', imageReady)
      imageNode?.removeEventListener('error', imageFailed)
      host.removeEventListener('pointerenter', enter); host.removeEventListener('pointerleave', leave)
      host.removeEventListener('focus', enter); host.removeEventListener('blur', leave)
      preference.removeEventListener('change', motionChange)
    }
  }, [image])
  return <svg ref={root} className="liquid-image-reveal" viewBox="0 0 600 800" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
    <path className="liquid-image-reveal__color" d={BRUSH} pathLength="1" />
    <defs><mask id={id} maskUnits="userSpaceOnUse" x="-800" y="-800" width="2200" height="2400">
      <path className="liquid-image-reveal__mask" d={BRUSH} pathLength="1" />
    </mask></defs>
    <image width="600" height="800" preserveAspectRatio="xMidYMid slice" mask={`url(#${id})`} onLoad={() => { loaded.current = true }} />
  </svg>
}
