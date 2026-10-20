/** One passive listener for decorative work that can wait until scrolling settles. */
const listeners = new Set<(idle: boolean) => void>()
let idle = true
let timer: ReturnType<typeof setTimeout> | undefined
const notify = (next: boolean) => {
  if (idle === next) return
  idle = next
  listeners.forEach(listener => listener(idle))
}
const onScroll = () => {
  notify(false)
  clearTimeout(timer)
  timer = setTimeout(() => { timer = undefined; notify(true) }, 160)
}

export function watchScrollIdle(listener: (idle: boolean) => void) {
  if (!listeners.size) window.addEventListener('scroll', onScroll, { passive: true })
  listeners.add(listener)
  listener(idle)
  return () => {
    listeners.delete(listener)
    if (!listeners.size) {
      window.removeEventListener('scroll', onScroll)
      clearTimeout(timer)
      timer = undefined
      idle = true
    }
  }
}
