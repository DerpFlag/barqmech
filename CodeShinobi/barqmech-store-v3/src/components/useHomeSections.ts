import { useCallback, useLayoutEffect, useRef, type RefObject } from 'react'

/** A fitting final chapter must land at the document end, including fractional layout rounding. */
function sectionScrollTop(target: HTMLElement, header: number, final: boolean) {
  const limit = Math.max(0, document.documentElement.scrollHeight - window.innerHeight)
  if (final && target.getBoundingClientRect().height <= window.innerHeight - header + 1) return limit
  return Math.min(limit, Math.max(0, window.scrollY + target.getBoundingClientRect().top - header))
}

/** One deliberate wheel gesture advances one chapter; long content keeps native scrolling. */
export function useHomeSections(root: RefObject<HTMLElement | null>, advanceWithinSection?: (direction: number, section: HTMLElement) => boolean) {
  const withinSection = useRef(advanceWithinSection)
  withinSection.current = advanceWithinSection
  const headerHeight = useRef(0)
  const busyUntil = useRef(0)
  const reducedMotion = useRef(false)
  const sectionNodes = useRef<HTMLElement[]>([])
  const sectionTops = useRef<number[]>([])
  const scrollLimit = useRef(0)

  const sections = useCallback(() => {
    if (sectionNodes.current.length) return sectionNodes.current
    const content = Array.from(root.current?.querySelectorAll<HTMLElement>('[data-home-section]') ?? [])
    const footer = root.current?.closest('.shinobi-shell')?.querySelector<HTMLElement>('[data-home-footer]')
    sectionNodes.current = footer ? [...content, footer] : content
    return sectionNodes.current
  }, [root])

  const goToSection = useCallback((index: number) => {
    const list = sections()
    const target = list[index]
    if (!target || document.body.style.overflow === 'hidden') return
    const destination = sectionScrollTop(target, headerHeight.current, index === list.length - 1)
    const origin = window.scrollY
    if (reducedMotion.current || Math.abs(destination - origin) < 1) {
      window.scrollTo({ top: destination, behavior: 'instant' })
      busyUntil.current = 0
      return
    }
    // Let the browser own scrolling instead of requiring a JS write every frame.
    // scrollend releases the guard; the deadline also supports older browsers.
    busyUntil.current = performance.now() + 1000
    window.scrollTo({ top: destination, behavior: 'smooth' })
  }, [sections])

  useLayoutEffect(() => {
    const header = document.querySelector<HTMLElement>('.shinobi-header')
    const shell = root.current?.closest<HTMLElement>('.shinobi-shell')
    const html = document.documentElement
    const previousHeight = html.style.getPropertyValue('--home-header-height')
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)')
    const desktop = window.matchMedia('(min-width: 768px)')
    const syncMotion = () => { reducedMotion.current = motion.matches }
    syncMotion()
    motion.addEventListener('change', syncMotion)

    let scheduleActive = () => {}
    const measure = () => {
      headerHeight.current = header?.getBoundingClientRect().height ?? 0
      const height = `${headerHeight.current}px`
      if (html.style.getPropertyValue('--home-header-height') !== height) html.style.setProperty('--home-header-height', height)
      const y = window.scrollY
      sectionTops.current = sections().map(section => section.getBoundingClientRect().top + y)
      scrollLimit.current = Math.max(0, html.scrollHeight - window.innerHeight)
      scheduleActive()
    }
    measure()
    const observer = new ResizeObserver(measure)
    if (header) observer.observe(header)
    if (root.current) observer.observe(root.current)
    sections().forEach(section => observer.observe(section))
    html.classList.add('shinobi-section-scroll')

    const atDocumentEnd = () => scrollLimit.current - window.scrollY <= 1
    const currentIndex = () => {
      const list = sections()
      if (list.length && atDocumentEnd()) return list.length - 1
      const y = window.scrollY + headerHeight.current + 3
      let index = 0
      sectionTops.current.forEach((top, i) => {
        if (top <= y) index = i
      })
      return index
    }
    let frame = 0
    let resizeFrame = 0
    let anchoredIndex: number | null = 0
    let lastIndex = -1
    const updateActive = () => {
      if (frame) return
      frame = requestAnimationFrame(() => {
        frame = 0
        const index = currentIndex()
        const list = sections()
        if (index !== lastIndex) {
          lastIndex = index
          if (shell) {
            shell.dataset.homeTone = list[index]?.dataset.sectionTheme ?? 'blue'
            shell.dataset.homeSection = list[index]?.id ?? 'home'
            shell.dataset.atFooter = String(index === list.length - 1)
          }
        }
        const top = (sectionTops.current[index] ?? 0) - window.scrollY
        anchoredIndex = Math.abs(top - headerHeight.current) < 24 || (index === list.length - 1 && atDocumentEnd()) ? index : null
      })
    }
    scheduleActive = updateActive
    const onScrollEnd = () => { busyUntil.current = 0; updateActive() }
    const onResize = () => {
      const index = anchoredIndex
      measure()
      cancelAnimationFrame(resizeFrame)
      // Keep an aligned slide aligned after resizing, without moving someone reading tall content.
      if (index === null || document.body.style.overflow === 'hidden') return
      resizeFrame = requestAnimationFrame(() => {
        const list = sections()
        const target = list[index]
        if (target) window.scrollTo({ top: sectionScrollTop(target, headerHeight.current, index === list.length - 1), behavior: 'instant' })
      })
    }
    window.addEventListener('scroll', updateActive, { passive: true })
    window.addEventListener('scrollend', onScrollEnd)
    window.addEventListener('resize', onResize)
    updateActive()

    let lastWheel = 0
    let consumed = false
    let accumulated = 0

    const canAdvance = (direction: number) => {
      const index = currentIndex()
      const list = sections()
      const current = list[index]
      if (!current) return null
      const rect = current.getBoundingClientRect()
      // Never strand content that grows beyond a viewport (zoom, validation, mobile).
      if (direction > 0 && rect.bottom > window.innerHeight + 24) return null
      if (direction < 0 && rect.top < headerHeight.current - 4) return null
      const next = index + direction
      return next >= 0 && next < list.length ? next : null
    }

    const isInteractive = (target: EventTarget | null) => target instanceof Element &&
      Boolean(target.closest('input, textarea, select, [contenteditable="true"], [role="dialog"], [data-native-scroll]'))
    const blocked = () => document.body.classList.contains('shinobi-loading-active') ||
      document.body.style.overflow === 'hidden'

    const advance = (direction: number, next: number) => {
      const index = currentIndex()
      const section = sections()[index]
      const changed = desktop.matches && section && withinSection.current?.(direction, section)
      // Stay in this chapter when it has another internal category to show.
      if (changed) {
        // A category changes in place; do not restart a redundant page scroll.
        busyUntil.current = performance.now() + 240
      } else goToSection(next)
    }

    const onWheel = (event: WheelEvent) => {
      if (!desktop.matches || blocked() || event.ctrlKey ||
        event.metaKey || event.altKey || isInteractive(event.target) ||
        Math.abs(event.deltaX) > Math.abs(event.deltaY) || event.deltaY === 0) return
      const now = performance.now()
      if (now - lastWheel > 180) { consumed = false; accumulated = 0 }
      lastWheel = now
      if (now < busyUntil.current || consumed) { event.preventDefault(); return }
      const direction = Math.sign(event.deltaY)
      const next = canAdvance(direction)
      if (next === null) return
      event.preventDefault()
      const delta = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? window.innerHeight : 1)
      if (Math.sign(accumulated) !== direction) accumulated = 0
      accumulated += delta
      if (Math.abs(accumulated) < 24) return
      consumed = true
      advance(direction, next)
    }

    const onKey = (event: KeyboardEvent) => {
      if (!desktop.matches || blocked() || event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey ||
        isInteractive(event.target) || (event.target instanceof Element && event.target.closest('a, button'))) return
      const direction = ['ArrowDown', 'PageDown'].includes(event.key) || (event.key === ' ' && !event.shiftKey)
        ? 1 : ['ArrowUp', 'PageUp'].includes(event.key) || (event.key === ' ' && event.shiftKey) ? -1 : 0
      if (!direction) return
      const next = canAdvance(direction)
      if (next === null) return
      event.preventDefault()
      if (performance.now() >= busyUntil.current) advance(direction, next)
    }
    window.addEventListener('wheel', onWheel, { passive: false })
    window.addEventListener('keydown', onKey)
    return () => {
      if (shell) { delete shell.dataset.homeTone; delete shell.dataset.homeSection; delete shell.dataset.atFooter }
      observer.disconnect()
      cancelAnimationFrame(frame)
      cancelAnimationFrame(resizeFrame)
      sectionNodes.current = []
      sectionTops.current = []
      motion.removeEventListener('change', syncMotion)
      window.removeEventListener('scroll', updateActive)
      window.removeEventListener('scrollend', onScrollEnd)
      window.removeEventListener('resize', onResize)
      window.removeEventListener('wheel', onWheel)
      window.removeEventListener('keydown', onKey)
      html.classList.remove('shinobi-section-scroll')
      if (previousHeight) html.style.setProperty('--home-header-height', previousHeight)
      else html.style.removeProperty('--home-header-height')
    }
  }, [goToSection, sections])

  return { goToSection }
}
