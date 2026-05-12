import React from 'react'

type HexagonBackgroundProps = React.ComponentProps<'div'> & {
  hexagonProps?: React.ComponentProps<'div'>
  hexagonSize?: number
  hexagonMargin?: number
}

export function HexagonBackground({
  className,
  children,
  hexagonProps,
  hexagonSize = 75,
  hexagonMargin = 3,
  ...props
}: HexagonBackgroundProps) {
  const hexagonWidth = hexagonSize
  const hexagonHeight = hexagonSize * 1.1
  const rowSpacing = hexagonSize * 0.8
  const baseMarginTop = -36 - 0.275 * (hexagonSize - 100)
  const computedMarginTop = baseMarginTop + hexagonMargin
  const oddRowMarginLeft = -(hexagonSize / 2)
  const evenRowMarginLeft = hexagonMargin / 2

  const [gridDimensions, setGridDimensions] = React.useState({ rows: 0, columns: 0 })
  const cellRefs = React.useRef<Map<string, HTMLElement>>(new Map())
  const activeCellRef = React.useRef<HTMLElement | null>(null)
  const frameRef = React.useRef<number | null>(null)

  const updateGridDimensions = React.useCallback(() => {
    const rows = Math.ceil(window.innerHeight / rowSpacing) + 2
    const columns = Math.ceil(window.innerWidth / hexagonWidth) + 2
    setGridDimensions({ rows, columns })
  }, [rowSpacing, hexagonWidth])

  React.useEffect(() => {
    updateGridDimensions()
    window.addEventListener('resize', updateGridDimensions)
    return () => {
      window.removeEventListener('resize', updateGridDimensions)
    }
  }, [updateGridDimensions])

  React.useEffect(() => {
    const resolveCell = (clientX: number, clientY: number) => {
      if (
        clientX < 0 ||
        clientY < 0 ||
        clientX > window.innerWidth ||
        clientY > window.innerHeight
      ) {
        return null
      }
      const row = Math.floor((clientY - computedMarginTop) / rowSpacing)
      if (row < 0 || row >= gridDimensions.rows) return null
      const rowOffset = ((row + 1) % 2 === 0 ? evenRowMarginLeft : oddRowMarginLeft) - 10
      const cellPitch = hexagonWidth + hexagonMargin
      const col = Math.floor((clientX - rowOffset) / cellPitch)
      if (col < 0 || col >= gridDimensions.columns) return null
      return cellRefs.current.get(`${row}-${col}`) ?? null
    }

    const setActive = (el: HTMLElement | null) => {
      if (activeCellRef.current === el) return
      if (activeCellRef.current) activeCellRef.current.classList.remove('is-pointer-active')
      if (el) el.classList.add('is-pointer-active')
      activeCellRef.current = el
    }

    const onPointerMove = (e: PointerEvent) => {
      if (frameRef.current != null) cancelAnimationFrame(frameRef.current)
      frameRef.current = requestAnimationFrame(() => {
        frameRef.current = null
        if (document.body.classList.contains('intro-playing')) return
        setActive(resolveCell(e.clientX, e.clientY))
      })
    }

    const clear = () => setActive(null)

    window.addEventListener('pointermove', onPointerMove, { passive: true })
    window.addEventListener('blur', clear)
    document.addEventListener('pointerleave', clear)
    return () => {
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('blur', clear)
      document.removeEventListener('pointerleave', clear)
      clear()
      if (frameRef.current != null) cancelAnimationFrame(frameRef.current)
    }
  }, [
    computedMarginTop,
    evenRowMarginLeft,
    gridDimensions.columns,
    gridDimensions.rows,
    hexagonMargin,
    hexagonWidth,
    oddRowMarginLeft,
    rowSpacing,
  ])

  return (
    <div className={`hexagon-bg-root ${className ?? ''}`.trim()} {...props}>
      <div className="hexagon-bg-layer" aria-hidden style={{ ['--hexagon-margin' as string]: `${hexagonMargin}px` }}>
        {Array.from({ length: gridDimensions.rows }).map((_, rowIndex) => (
          <div
            key={`row-${rowIndex}`}
            className="hexagon-bg-row"
            style={{
              marginTop: computedMarginTop,
              marginLeft: ((rowIndex + 1) % 2 === 0 ? evenRowMarginLeft : oddRowMarginLeft) - 10,
            }}
          >
            {Array.from({ length: gridDimensions.columns }).map((__, colIndex) => (
              <div
                key={`hex-${rowIndex}-${colIndex}`}
                {...hexagonProps}
                style={{
                  width: hexagonWidth,
                  height: hexagonHeight,
                  marginLeft: hexagonMargin,
                  ...hexagonProps?.style,
                }}
                ref={(node) => {
                  const key = `${rowIndex}-${colIndex}`
                  if (node) cellRefs.current.set(key, node)
                  else cellRefs.current.delete(key)
                }}
                className={`hexagon-cell ${hexagonProps?.className ?? ''}`.trim()}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="hexagon-bg-content">{children}</div>
    </div>
  )
}
