/** Rectangular size in inches; area is rounded only to remove floating-point noise. */
export function areaForSize(size) {
  const match = /^\s*(\d+(?:\.\d+)?)\s*[x×]\s*(\d+(?:\.\d+)?)\s*(?:inches|inch|in\.?)?\s*$/i.exec(String(size))
  if (!match || Number(match[1]) <= 0 || Number(match[2]) <= 0) throw new Error('Invalid shipping dimensions')
  const area = Number((Number(match[1]) * Number(match[2]) / 144).toFixed(8))
  if (!Number.isFinite(area) || area <= 0) throw new Error('Invalid shipping area')
  return area
}

export function shippingForArea(area) {
  if (!Number.isFinite(area) || area <= 0) throw new Error('Invalid shipping area')
  if (area <= 4) return 500
  if (area <= 7) return 1000
  return 1000 + 200 * (Math.ceil(area) - 7)
}

/** One shipping charge per order, independent of item count and quantity. */
export function shippingForLines(lines) {
  return lines.length ? shippingForArea(Math.max(...lines.map(line => areaForSize(line.size)))) : 0
}

/** Attribute the one order charge to the first largest-area line for reporting. */
export function shippingAllocation(lines) {
  if (!lines.length) return []
  const areas = lines.map(line => areaForSize(line.size))
  const largest = Math.max(...areas)
  const owner = areas.indexOf(largest)
  return lines.map((_, index) => index === owner ? shippingForArea(largest) : 0)
}
