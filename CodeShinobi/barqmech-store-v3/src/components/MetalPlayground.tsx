import { useEffect, useId, useRef } from 'react'

const PIECES = [
  ['gold', 'hexagon'], ['silver', 'washer'], ['black', 'star'],
  ['gold', 'frame'], ['black', 'hexagon'], ['silver', 'star'],
  ['gold', 'washer'], ['silver', 'frame'], ['black', 'washer'],
] as const
type Body = { x: number; y: number; r: number; vx: number; vy: number; angle: number; spin: number }
type Controls = {
  grab: (index: number, x: number, y: number) => void
  move: (x: number, y: number) => void
  release: (throwPiece: boolean) => void
  nudge: (index: number, key: string) => void
}

function MetalShape({ shape, finish, id }: { shape: string; finish: string; id: string }) {
  const tones = finish === 'gold' ? ['#715022', '#dfbb69', '#fff0b5', '#a77a32', '#f3d68d']
    : finish === 'silver' ? ['#626b74', '#d2dce2', '#ffffff', '#8c979f', '#e5edf2']
      : ['#080b10', '#4c5561', '#7c8793', '#171d25', '#343e4a']
  const path = shape === 'hexagon' ? 'M50 4 90 27 90 73 50 96 10 73 10 27ZM50 32A18 18 0 1 0 50 68A18 18 0 1 0 50 32Z'
    : shape === 'washer' ? 'M50 3A47 47 0 1 0 50 97A47 47 0 1 0 50 3ZM50 25A25 25 0 1 0 50 75A25 25 0 1 0 50 25Z'
      : shape === 'frame' ? 'M26 11H74L89 26V74L74 89H26L11 74V26ZM31 30V70H69V30Z'
        : 'M50 2 61 25 85 15 75 39 98 50 75 61 85 85 61 75 50 98 39 75 15 85 25 61 2 50 25 39 15 15 39 25ZM50 35A15 15 0 1 0 50 65A15 15 0 1 0 50 35Z'
  return <svg viewBox="0 0 100 100" aria-hidden="true" focusable="false">
    <defs><linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
      {tones.map((tone, i) => <stop key={i} offset={`${i * 25}%`} stopColor={tone} />)}
    </linearGradient></defs>
    <path d={path} fill={`url(#${id})`} fillRule="evenodd" stroke={tones[0]} strokeWidth="1.5" strokeLinejoin="round" />
    <path d={path} fill="none" stroke={tones[2]} strokeOpacity=".5" strokeWidth=".65" transform="translate(1 1) scale(.98)" />
  </svg>
}

/** Small, local circle-hull simulation: gravity, collisions and pointer throws; no runtime dependency. */
export function MetalPlayground() {
  const worldRef = useRef<HTMLDivElement>(null)
  const buttons = useRef<(HTMLButtonElement | null)[]>([])
  const controls = useRef<Controls | null>(null)
  const gradientId = useId().replace(/:/g, '')

  useEffect(() => {
    const world = worldRef.current
    if (!world) return
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)')
    let bodies: Body[] = []
    let width = 0, height = 0, frame = 0, last = 0, ticks = 0
    let visible = false, destroyed = false
    let held: { index: number; dx: number; dy: number; lastX: number; lastY: number; at: number } | null = null

    const paint = () => bodies.forEach((body, index) => {
      const element = buttons.current[index]
      if (!element) return
      element.style.transform = `translate3d(${body.x - body.r}px,${body.y - body.r}px,0) rotate(${body.angle}rad)`
    })
    const clamp = (body: Body) => {
      body.x = Math.max(body.r, Math.min(width - body.r, body.x))
      body.y = Math.max(body.r, Math.min(height - body.r, body.y))
    }
    const step = (dt: number) => {
      bodies.forEach((body, index) => {
        if (held?.index === index) return
        body.vy += 850 * dt
        body.x += body.vx * dt
        body.y += body.vy * dt
        body.angle += body.spin * dt
        body.vx *= Math.pow(.995, dt * 120)
        body.spin *= Math.pow(.995, dt * 120)
        if (body.x < body.r || body.x > width - body.r) body.vx *= -.48
        if (body.y < body.r) body.vy = Math.abs(body.vy) * .4
        if (body.y > height - body.r) {
          body.vy = Math.abs(body.vy) < 28 ? 0 : -Math.abs(body.vy) * .36
          body.vx *= .9
          body.spin *= .88
        }
        clamp(body)
      })
      // Several small separation passes keep stacks stable without expensive polygon geometry.
      for (let pass = 0; pass < 4; pass++) {
        for (let i = 0; i < bodies.length; i++) for (let j = i + 1; j < bodies.length; j++) {
          const a = bodies[i], b = bodies[j]
          const dx = b.x - a.x, dy = b.y - a.y
          const distance = Math.hypot(dx, dy) || .01
          const overlap = a.r + b.r - distance - 1
          if (overlap <= 0) continue
          const nx = dx / distance, ny = dy / distance
          const aFree = held?.index !== i, bFree = held?.index !== j
          const share = aFree && bFree ? .5 : 1
          if (aFree) { a.x -= nx * overlap * share; a.y -= ny * overlap * share; clamp(a) }
          if (bFree) { b.x += nx * overlap * share; b.y += ny * overlap * share; clamp(b) }
          const speed = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny
          if (speed >= 0) continue
          const impulse = -speed * .65
          if (aFree) { a.vx -= impulse * nx; a.vy -= impulse * ny; a.spin -= nx * impulse * .006 }
          if (bFree) { b.vx += impulse * nx; b.vy += impulse * ny; b.spin += nx * impulse * .006 }
        }
      }
    }
    const tick = (now: number) => {
      frame = 0
      if (destroyed || !visible || document.hidden || motion.matches) return
      const dt = Math.min((now - (last || now - 16)) / 1000, .032)
      last = now
      step(dt / 2); step(dt / 2)
      paint()
      ticks++
      const moving = bodies.some(body => Math.abs(body.vx) + Math.abs(body.vy) + Math.abs(body.spin) > 3)
      if (held || (ticks < 600 && (ticks < 100 || moving))) frame = requestAnimationFrame(tick)
    }
    const wake = () => {
      ticks = 0
      if (!frame && visible && !document.hidden && !motion.matches) {
        last = 0
        frame = requestAnimationFrame(tick)
      }
    }
    const reset = () => {
      held = null
      bodies = PIECES.slice(0, width < 600 ? 6 : 9).map((_, index, list) => {
        const r = width < 600 ? 27 + (index % 3) * 3 : 39 + (index % 3) * 7
        const columns = width < 600 ? 3 : list.length
        return {
          x: width * ((index % columns) + .5) / columns,
          y: motion.matches ? height - r - Math.floor(index / columns) * 65 : r + (index % 3) * 14,
          r, vx: motion.matches ? 0 : (index % 2 ? -1 : 1) * (18 + index * 3), vy: 0,
          angle: (index % 2 ? 1 : -1) * (index + 1) * .14, spin: motion.matches ? 0 : (index % 2 ? -.7 : .65),
        }
      })
      bodies.forEach((body,index)=>{const element=buttons.current[index];if(element){element.style.width=`${body.r*2}px`;element.style.height=`${body.r*2}px`}})
      paint(); wake()
    }
    const resize = new ResizeObserver(([entry]) => {
      width = entry.contentRect.width
      height = entry.contentRect.height
      if (width && height) reset()
    })
    resize.observe(world)
    const visibility = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting
      if (visible) wake()
      else { cancelAnimationFrame(frame); frame = 0; held = null }
    }, { threshold: .05 })
    visibility.observe(world)
    const sync = () => {
      cancelAnimationFrame(frame); frame = 0
      if (motion.matches) reset()
      else wake()
    }
    motion.addEventListener('change', sync)
    document.addEventListener('visibilitychange', sync)
    controls.current = {
      grab(index, clientX, clientY) {
        const body = bodies[index]
        if (!body) return
        const rect = world.getBoundingClientRect()
        const x = clientX - rect.left, y = clientY - rect.top
        held = { index, dx: body.x - x, dy: body.y - y, lastX: x, lastY: y, at: performance.now() }
        body.vx = 0; body.vy = 0
        wake()
      },
      move(clientX, clientY) {
        if (!held) return
        const rect = world.getBoundingClientRect()
        const x = clientX - rect.left, y = clientY - rect.top
        const dt = Math.max((performance.now() - held.at) / 1000, .016)
        const body = bodies[held.index]
        body.vx = Math.max(-650, Math.min(650, (x - held.lastX) / dt))
        body.vy = Math.max(-650, Math.min(650, (y - held.lastY) / dt))
        body.x = x + held.dx; body.y = y + held.dy
        clamp(body)
        held.lastX = x; held.lastY = y; held.at = performance.now()
        paint(); wake()
      },
      release(throwPiece) {
        if (!held) return
        const body = bodies[held.index]
        if (!throwPiece || motion.matches || performance.now() - held.at > 100) { body.vx = 0; body.vy = 0 }
        body.spin = body.vx * .008
        held = null
        wake()
      },
      nudge(index, key) {
        const body = bodies[index]
        if (!body) return
        if (key === 'ArrowLeft') body.x -= 20
        if (key === 'ArrowRight') body.x += 20
        if (key === 'ArrowUp') body.y -= 20
        if (key === 'ArrowDown') body.y += 20
        if (key === ' ' || key === 'Enter') { body.y -= 30; body.vy = -260; body.spin += 1.5 }
        clamp(body); paint(); wake()
      },
    }
    return () => {
      destroyed = true
      controls.current = null
      cancelAnimationFrame(frame)
      resize.disconnect(); visibility.disconnect()
      motion.removeEventListener('change', sync)
      document.removeEventListener('visibilitychange', sync)
    }
  }, [])

  return <div className="metal-playground" data-native-scroll>
    <div className="metal-playground__world" ref={worldRef} role="group" aria-label="Metal shape playground. Drag shapes, use arrow keys to move, or press Space to toss.">
      {PIECES.map(([finish, shape], index) => <button type="button" key={index} ref={element => { buttons.current[index] = element }} className={`metal-piece metal-piece--${finish}`} aria-label={`${finish} ${shape}`}
        onPointerDown={event => { if (event.button !== 0) return; event.currentTarget.setPointerCapture(event.pointerId); controls.current?.grab(index, event.clientX, event.clientY) }}
        onPointerMove={event => { if (event.currentTarget.hasPointerCapture(event.pointerId)) controls.current?.move(event.clientX, event.clientY) }}
        onPointerUp={event => { controls.current?.release(true); if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId) }}
        onPointerCancel={() => controls.current?.release(false)} onLostPointerCapture={() => controls.current?.release(false)}
        onKeyDown={event => { if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' ', 'Enter'].includes(event.key)) { event.preventDefault(); event.stopPropagation(); controls.current?.nudge(index, event.key) } }}>
        <MetalShape shape={shape} finish={finish} id={`${gradientId}-${index}`} />
      </button>)}
    </div>
  </div>
}
