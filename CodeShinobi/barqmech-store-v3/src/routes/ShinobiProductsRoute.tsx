import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ProductGridPlaceholder } from '../components/CommercePlaceholder.tsx'
import { CatalogPricingAlert } from '@store/catalog/CatalogPricingAlert.tsx'
import { useCatalog } from '@store/catalog/CatalogProvider.tsx'
import { PRICE_FILTER_MAX, PRICE_FILTER_MIN } from '@store/components/PriceRangeFilter.tsx'
import { ProductsPagination } from '@store/components/ProductsPagination.tsx'
import { ProductsSidebarFilters } from '@store/components/ProductsSidebarFilters.tsx'
import { sortCatalogProducts, type ProductSortKey } from '@store/components/ProductsSortSelect.tsx'
import {
  categorySlugs,
  featuredCategories,
  type FeaturedCategory,
  parsePrice,
  slugToCategory,
} from '../data/catalog.ts'
import { scrollProductsListingIntoView } from '@store/lib/scrollProductsListingIntoView.ts'
import { ProductListingCard } from '../components/ProductListingCard.tsx'

export default function ShinobiProductsPage() {
  const { products, loading: catalogLoading, error: catalogError, diagnostics, buildId, refetch } = useCatalog()
  const [searchParams, setSearchParams] = useSearchParams()
  const [selectedCategory, setSelectedCategory] = useState<'All' | FeaturedCategory>(() => {
    const slug = searchParams.get('category')
    return (slug && slugToCategory[slug]) || 'All'
  })
  const [sort, setSort] = useState<ProductSortKey>('name-asc')
  const [minPrice, setMinPrice] = useState(PRICE_FILTER_MIN)
  const [maxPrice, setMaxPrice] = useState(PRICE_FILTER_MAX)
  const [draftMinPrice, setDraftMinPrice] = useState(PRICE_FILTER_MIN)
  const [draftMaxPrice, setDraftMaxPrice] = useState(PRICE_FILTER_MAX)
  const [currentPage, setCurrentPage] = useState(1)
  const refineRef = useRef<HTMLDetailsElement>(null)

  const filteredProducts = useMemo(() => {
    return products.filter((item) => {
      const categoryMatch = selectedCategory === 'All' || item.category === selectedCategory
      const price = parsePrice(item.price)
      return item.images.length > 0 && categoryMatch && price >= minPrice && price <= maxPrice
    })
  }, [products, selectedCategory, minPrice, maxPrice])

  const sortedProducts = useMemo(
    () => sortCatalogProducts(filteredProducts, sort, parsePrice),
    [filteredProducts, sort],
  )

  const activeProductsHeading = selectedCategory === 'All' ? 'All Products' : selectedCategory
  const pageSize = 24
  const totalPages = Math.max(1, Math.ceil(sortedProducts.length / pageSize))
  const page = Math.min(currentPage, totalPages)
  const pagedProducts = sortedProducts.slice((page - 1) * pageSize, page * pageSize)

  useEffect(() => {
    setCurrentPage(1)
  }, [selectedCategory, minPrice, maxPrice, sort])

  const goToPage = useCallback((nextPage: number) => {
    setCurrentPage(nextPage)
    requestAnimationFrame(() => scrollProductsListingIntoView())
  }, [])

  useEffect(() => {
    const slug = searchParams.get('category')
    setSelectedCategory((slug && slugToCategory[slug]) || 'All')
  }, [searchParams])

  const chooseCategory = (category: 'All' | FeaturedCategory) => {
    setSelectedCategory(category)
    if (category === 'All') {
      setSearchParams({})
      return
    }
    setSearchParams({ category: categorySlugs[category] })
  }

  const applyPriceFilter = () => {
    setMinPrice(draftMinPrice)
    setMaxPrice(draftMaxPrice)
    if (refineRef.current) refineRef.current.open = false
  }

  const sidebarFilters = (
    <ProductsSidebarFilters
      sort={sort}
      onSortChange={setSort}
      draftMin={draftMinPrice}
      draftMax={draftMaxPrice}
      onDraftMinChange={setDraftMinPrice}
      onDraftMaxChange={setDraftMaxPrice}
      onApplyPriceFilter={applyPriceFilter}
    />
  )

  const categoryName = selectedCategory === 'Misc' ? 'Custom & utility' : activeProductsHeading
  return (
    <main className="shop-route-page products-page shinobi-products-page shop-gallery-page">
      <nav className="shop-breadcrumb" aria-label="Breadcrumb"><Link to="/">Home</Link><span>/</span><span>{selectedCategory === 'All' ? 'The collection' : categoryName}</span></nav>
      <header className="shop-gallery-heading">
        <div><h1>{selectedCategory === 'All' ? 'Made for your space.' : categoryName + '.'}</h1>
          <p>Metalwork with character. Find your piece, then make it yours.</p></div>
        <Link to="/#contact" className="shop-custom-link">Have something in mind? <span>Let's make it ↗</span></Link>
      </header>
      <div className="shop-browse-bar">
        <nav className="shop-category-index" aria-label="Product categories">
          {(['All', ...featuredCategories] as const).map(category => <button key={category} type="button" aria-pressed={selectedCategory === category}
            onClick={() => chooseCategory(category)}>{category === 'Misc' ? 'Custom & utility' : category}</button>)}
        </nav>
        <details ref={refineRef} className="shop-refine"><summary>Filter & sort <span aria-hidden="true">＋</span></summary>{sidebarFilters}</details>
      </div>
      <section className="products-main" aria-label={categoryName}>
        <div className="shop-results-count" role="status">{catalogLoading ? null : `${sortedProducts.length} designs${sortedProducts.length ? ` · Showing ${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, sortedProducts.length)}` : ''}`}</div>
        <CatalogPricingAlert catalogError={catalogError} catalogLoading={catalogLoading} diagnostics={diagnostics} buildId={buildId} onRetry={refetch} />
        {catalogLoading ? <ProductGridPlaceholder />
          : catalogError && sortedProducts.length === 0 ? <p className="checkout-lead" role="alert">{catalogError}</p>
          : sortedProducts.length === 0 ? <div className="shop-empty"><h2>No pieces in this range.</h2><p>Try a different category or widen the price range.</p></div>
          : <><div className="shop-route-grid products-grid shinobi-listing-grid">{pagedProducts.map(item => <ProductListingCard key={item.id} item={item} />)}</div>
            <ProductsPagination page={page} totalPages={totalPages} onPageChange={goToPage} aria-label="Product pages" /></>}
      </section>
    </main>
  )
}
