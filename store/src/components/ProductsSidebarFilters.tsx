import { PriceRangeFilter } from './PriceRangeFilter.tsx'
import { ProductsSortSelect, type ProductSortKey } from './ProductsSortSelect.tsx'

type ProductsSidebarFiltersProps = {
  sort: ProductSortKey
  onSortChange: (value: ProductSortKey) => void
  sortSelectId?: string
  draftMin: number
  draftMax: number
  onDraftMinChange: (value: number) => void
  onDraftMaxChange: (value: number) => void
  onApplyPriceFilter: () => void
}

export function ProductsSidebarFilters({
  sort,
  onSortChange,
  sortSelectId,
  draftMin,
  draftMax,
  onDraftMinChange,
  onDraftMaxChange,
  onApplyPriceFilter,
}: ProductsSidebarFiltersProps) {
  return (
    <div className="products-sidebar-filters">
      <ProductsSortSelect value={sort} onChange={onSortChange} id={sortSelectId} />
      <PriceRangeFilter
        draftMin={draftMin}
        draftMax={draftMax}
        onDraftMinChange={onDraftMinChange}
        onDraftMaxChange={onDraftMaxChange}
        onApply={onApplyPriceFilter}
      />
    </div>
  )
}
