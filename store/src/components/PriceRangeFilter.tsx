export const PRICE_FILTER_MIN = 100
export const PRICE_FILTER_MAX = 100000
export const PRICE_FILTER_STEP = 100

type PriceRangeFilterProps = {
  draftMin: number
  draftMax: number
  onDraftMinChange: (value: number) => void
  onDraftMaxChange: (value: number) => void
  onApply: () => void
}

export function PriceRangeFilter({
  draftMin,
  draftMax,
  onDraftMinChange,
  onDraftMaxChange,
  onApply,
}: PriceRangeFilterProps) {
  const fillLeft = ((draftMin - PRICE_FILTER_MIN) / (PRICE_FILTER_MAX - PRICE_FILTER_MIN)) * 100
  const fillRight = 100 - ((draftMax - PRICE_FILTER_MIN) / (PRICE_FILTER_MAX - PRICE_FILTER_MIN)) * 100

  const setMin = (next: number) => {
    const min = Math.max(PRICE_FILTER_MIN, Math.min(next, draftMax - PRICE_FILTER_STEP))
    onDraftMinChange(min)
  }

  const setMax = (next: number) => {
    const max = Math.min(PRICE_FILTER_MAX, Math.max(next, draftMin + PRICE_FILTER_STEP))
    onDraftMaxChange(max)
  }

  return (
    <div className="price-filter">
      <h4>Price Filter</h4>
      <p>
        {draftMin.toLocaleString()} – {draftMax.toLocaleString()}
      </p>
      <div className="price-range-dual">
        <div
          className="price-range-fill"
          style={{ left: `${fillLeft}%`, right: `${fillRight}%` }}
          aria-hidden
        />
        <input
          type="range"
          className="price-range-input price-range-input--min"
          min={PRICE_FILTER_MIN}
          max={PRICE_FILTER_MAX}
          step={PRICE_FILTER_STEP}
          value={draftMin}
          onChange={(e) => setMin(Number(e.target.value))}
          aria-label="Minimum price"
        />
        <input
          type="range"
          className="price-range-input price-range-input--max"
          min={PRICE_FILTER_MIN}
          max={PRICE_FILTER_MAX}
          step={PRICE_FILTER_STEP}
          value={draftMax}
          onChange={(e) => setMax(Number(e.target.value))}
          aria-label="Maximum price"
        />
      </div>
      <button type="button" className="mosaic-discover-btn products-apply-filter-btn" onClick={onApply}>
        Apply Filter
      </button>
    </div>
  )
}
