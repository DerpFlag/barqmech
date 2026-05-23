export const PRICE_FILTER_MIN = 100
/** Upper slider bound when catalog has not loaded yet. */
export const PRICE_FILTER_MAX = 10_000_000
export const PRICE_FILTER_STEP = 100

type PriceRangeFilterProps = {
  draftMin: number
  draftMax: number
  sliderMin?: number
  sliderMax?: number
  onDraftMinChange: (value: number) => void
  onDraftMaxChange: (value: number) => void
  onApply: () => void
}

export function PriceRangeFilter({
  draftMin,
  draftMax,
  sliderMin = PRICE_FILTER_MIN,
  sliderMax = PRICE_FILTER_MAX,
  onDraftMinChange,
  onDraftMaxChange,
  onApply,
}: PriceRangeFilterProps) {
  const span = Math.max(sliderMax - sliderMin, PRICE_FILTER_STEP)
  const fillLeft = ((draftMin - sliderMin) / span) * 100
  const fillRight = 100 - ((draftMax - sliderMin) / span) * 100

  const setMin = (next: number) => {
    const min = Math.max(sliderMin, Math.min(next, draftMax - PRICE_FILTER_STEP))
    onDraftMinChange(min)
  }

  const setMax = (next: number) => {
    const max = Math.min(sliderMax, Math.max(next, draftMin + PRICE_FILTER_STEP))
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
          min={sliderMin}
          max={sliderMax}
          step={PRICE_FILTER_STEP}
          value={draftMin}
          onChange={(e) => setMin(Number(e.target.value))}
          aria-label="Minimum price"
        />
        <input
          type="range"
          className="price-range-input price-range-input--max"
          min={sliderMin}
          max={sliderMax}
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
