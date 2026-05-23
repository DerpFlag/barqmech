import { useId } from 'react'

export const PRICE_FILTER_MIN = 100
export const PRICE_FILTER_MAX = 150_000
export const PRICE_FILTER_STEP = 100

export function clampPriceFilterValue(value: number, boundMin = PRICE_FILTER_MIN, boundMax = PRICE_FILTER_MAX) {
  if (!Number.isFinite(value)) return boundMin
  return Math.max(boundMin, Math.min(boundMax, Math.round(value / PRICE_FILTER_STEP) * PRICE_FILTER_STEP))
}

export function clampPriceFilterPair(minVal: number, maxVal: number) {
  let min = clampPriceFilterValue(minVal)
  let max = clampPriceFilterValue(maxVal)
  if (min > max - PRICE_FILTER_STEP) {
    min = max - PRICE_FILTER_STEP
  }
  if (max < min + PRICE_FILTER_STEP) {
    max = min + PRICE_FILTER_STEP
  }
  return { min, max }
}

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
  const minInputId = useId()
  const maxInputId = useId()
  const span = PRICE_FILTER_MAX - PRICE_FILTER_MIN
  const fillLeft = ((draftMin - PRICE_FILTER_MIN) / span) * 100
  const fillRight = 100 - ((draftMax - PRICE_FILTER_MIN) / span) * 100

  const setMin = (next: number) => {
    const { min, max } = clampPriceFilterPair(next, draftMax)
    onDraftMinChange(min)
    if (max !== draftMax) onDraftMaxChange(max)
  }

  const setMax = (next: number) => {
    const { min, max } = clampPriceFilterPair(draftMin, next)
    if (min !== draftMin) onDraftMinChange(min)
    onDraftMaxChange(max)
  }

  return (
    <div className="price-filter-card">
      <div className="price-filter-card-header">
        <h4>Price filter</h4>
        <p className="price-filter-range-hint">
          Rs. {PRICE_FILTER_MIN.toLocaleString()} – {PRICE_FILTER_MAX.toLocaleString()}
        </p>
      </div>

      <p className="price-filter-selection">
        Selected: <strong>Rs. {draftMin.toLocaleString()}</strong> – <strong>Rs. {draftMax.toLocaleString()}</strong>
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

      <div className="price-filter-custom">
        <p className="price-filter-custom-title">Custom range (PKR)</p>
        <div className="price-filter-custom-fields">
          <label htmlFor={minInputId}>
            Min
            <input
              id={minInputId}
              type="number"
              inputMode="numeric"
              min={PRICE_FILTER_MIN}
              max={PRICE_FILTER_MAX}
              step={PRICE_FILTER_STEP}
              value={draftMin}
              placeholder={String(PRICE_FILTER_MIN)}
              className="price-filter-custom-input"
              onChange={(e) => setMin(Number(e.target.value))}
            />
          </label>
          <span className="price-filter-custom-sep" aria-hidden>
            to
          </span>
          <label htmlFor={maxInputId}>
            Max
            <input
              id={maxInputId}
              type="number"
              inputMode="numeric"
              min={PRICE_FILTER_MIN}
              max={PRICE_FILTER_MAX}
              step={PRICE_FILTER_STEP}
              value={draftMax}
              placeholder={String(PRICE_FILTER_MAX)}
              className="price-filter-custom-input"
              onChange={(e) => setMax(Number(e.target.value))}
            />
          </label>
        </div>
      </div>

      <button type="button" className="mosaic-discover-btn products-apply-filter-btn" onClick={onApply}>
        Apply filter
      </button>
    </div>
  )
}
