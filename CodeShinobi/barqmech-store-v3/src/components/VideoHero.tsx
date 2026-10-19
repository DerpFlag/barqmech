import type { ReactNode } from 'react'
import { heroBgVideoUrl } from '../data/catalog.ts'

type Props = {
  children: ReactNode
}

/** Full-viewport looping background video (CodeShinobi-style hero). */
export function VideoHero({ children }: Props) {
  return (
    <section className="shinobi-hero" id="home">
      <video
        className="shinobi-hero__video"
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        src={heroBgVideoUrl}
      />
      <div className="shinobi-hero__scrim" aria-hidden />
      <div className="shinobi-hero__grain" aria-hidden />
      <div className="shinobi-hero__content">{children}</div>
      <div className="shinobi-hero__scroll-hint">Scroll to explore</div>
    </section>
  )
}
