export type ProductSortKey = 'name-asc' | 'name-desc' | 'price-asc' | 'price-desc'

const SORT_OPTIONS: { value: ProductSortKey; label: string }[] = [
  { value: 'name-asc', label: 'Name (A–Z)' },
  { value: 'name-desc', label: 'Name (Z–A)' },
  { value: 'price-asc', label: 'Price (low to high)' },
  { value: 'price-desc', label: 'Price (high to low)' },
]

type ProductsSortSelectProps = {
  value: ProductSortKey
  onChange: (value: ProductSortKey) => void
  id?: string
}

export function ProductsSortSelect({ value, onChange, id = 'products-sort' }: ProductsSortSelectProps) {
  return (
    <div className="products-sort-panel">
      <label className="products-sort-label" htmlFor={id}>
        Sort by
      </label>
      <select
        id={id}
        className="products-sort-select"
        value={value}
        onChange={(e) => onChange(e.target.value as ProductSortKey)}
      >
        {SORT_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  )
}

export function sortCatalogProducts<T extends { title: string; price: string }>(
  items: T[],
  sort: ProductSortKey,
  parsePriceFn: (price: string) => number
): T[] {
  const list = [...items]
  switch (sort) {
    case 'name-desc':
      return list.sort((a, b) => b.title.localeCompare(a.title, undefined, { sensitivity: 'base' }))
    case 'price-asc':
      return list.sort((a, b) => parsePriceFn(a.price) - parsePriceFn(b.price))
    case 'price-desc':
      return list.sort((a, b) => parsePriceFn(b.price) - parsePriceFn(a.price))
    case 'name-asc':
    default:
      return list.sort((a, b) => a.title.localeCompare(b.title, undefined, { sensitivity: 'base' }))
  }
}
