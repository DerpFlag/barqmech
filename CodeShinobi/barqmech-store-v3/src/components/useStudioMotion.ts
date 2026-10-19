import { useEffect } from 'react'

const clamp = (value: number) => Math.max(0, Math.min(1, value))
const inkPalette = Array.from({length:256}, (_,step)=>{
  const value=step/255,from=value<.45?[100,133,164]:[59,145,233],to=value<.45?[59,145,233]:[23,27,32]
  const amount=value<.45?value/.45:(value-.45)/.55
  return `rgb(${from.map((channel,index)=>Math.round(channel+(to[index]-channel)*amount)).join(',')})`
})

/** One event-driven scroll pass; no permanent RAF loop or scroll interception. */
export function useStudioMotion(ready: boolean, route: string) {
  useEffect(() => {
    const shell = document.querySelector<HTMLElement>('.shinobi-shell')
    if (!shell || !ready) return
    const preference = matchMedia('(prefers-reduced-motion: reduce)')
    const animations = new Set<Animation>()
    const seen = new WeakSet<Element>()
    const active = new Set<HTMLElement>()
    const ink = new WeakMap<HTMLElement,{characters:HTMLElement[];steps:number[];progress:number}>()
    const lifts = new WeakMap<HTMLElement,string>()
    const selector = '.shinobi-hero__line, .shinobi-hero__eyebrow, .shinobi-hero__ctas, .home-chapter h2, .category-sample, .space-tile, .metal-contact__form, .studio-brand-letter'
    let frame = 0
    const animate = (element: HTMLElement) => {
      if (preference.matches || document.hidden) return
      const siblings = element.parentElement ? [...element.parentElement.children] : []
      const index = Math.max(0, siblings.indexOf(element))
      const letter = element.classList.contains('studio-brand-letter')
      const animation = element.animate([
        { opacity: 0, transform: `translateY(${letter ? 90 : 38}px) rotate(${letter ? -5 : 1}deg)` },
        { opacity: 1, transform: `translateY(${letter ? -12 : -5}px) rotate(0deg)`, offset: .65 },
        { opacity: 1, transform: 'translateY(3px)', offset: .82 },
        { opacity: 1, transform: 'none' },
      ], { duration: letter ? 1000 : 850, delay: Math.min(index, 7) * (letter ? 45 : 65), easing: 'cubic-bezier(.22,1,.36,1)', fill: 'backwards' })
      animations.add(animation)
      animation.onfinish = () => animations.delete(animation)
      animation.oncancel = () => animations.delete(animation)
    }
    const update = () => {
      frame = 0
      if (document.hidden) return
      const height = innerHeight
      // Batch geometry reads before style writes.
      const measured = [...active].map(element => ({ element, rect: element.getBoundingClientRect() }))
      measured.forEach(({ element, rect }) => {
        const progress = preference.matches ? 1 : clamp((height * .92 - rect.top) / (height * .66))
        if (element.matches('[data-scroll-ink]')) {
          let state=ink.get(element)
          if(!state){state={characters:[...element.querySelectorAll<HTMLElement>('.studio-ink-character')],steps:[],progress:-1};ink.set(element,state)}
          if(state.progress!==progress){
            state.progress=progress
            const {characters,steps}=state
            characters.forEach((character,index)=>{
              const step=Math.round(clamp((progress*(characters.length+12)-index)/12)*255)
              if(steps[index]!==step){steps[index]=step;character.style.color=inkPalette[step]}
            })
          }
        }
        if (element.matches('.metal-footer__wordmark')) {
          const lift=`${preference.matches ? 0 : ((1-progress)*32).toFixed(2)}px`
          if(lifts.get(element)!==lift){lifts.set(element,lift);element.style.setProperty('--footer-lift',lift)}
        }
      })
    }
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update) }
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        const element = entry.target as HTMLElement
        if (entry.isIntersecting) {
          if (element.matches('[data-scroll-ink],.metal-footer__wordmark')) active.add(element)
          if (!seen.has(element) && element.matches(selector)) { seen.add(element); animate(element) }
        } else {
          active.delete(element)
          if (element.matches('.studio-brand-letter')) seen.delete(element)
        }
      })
      schedule()
    }, { threshold: .06 })
    const observed = new WeakSet<Element>()
    const register = (root: Element) => {
      const all = `${selector}, [data-scroll-ink], .metal-footer__wordmark`
      const elements = [...root.querySelectorAll(all), ...(root.matches(all) ? [root] : [])]
      elements.forEach(element => { if (!observed.has(element)) { observer.observe(element); observed.add(element) } })
    }
    register(shell)
    const mutations = new MutationObserver(entries => entries.forEach(entry => entry.addedNodes.forEach(node => { if (node instanceof Element) register(node) })))
    mutations.observe(shell, { childList: true, subtree: true })
    const motionChange = () => { animations.forEach(animation => animation.cancel()); schedule() }
    preference.addEventListener('change', motionChange)
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule, { passive: true })
    document.addEventListener('visibilitychange', schedule)
    return () => {
      observer.disconnect(); mutations.disconnect(); cancelAnimationFrame(frame)
      animations.forEach(animation => animation.cancel())
      preference.removeEventListener('change', motionChange)
      window.removeEventListener('scroll', schedule); window.removeEventListener('resize', schedule)
      document.removeEventListener('visibilitychange', schedule)
    }
  }, [ready, route])
}
