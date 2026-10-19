import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { CatalogPricingAlert } from '@store/catalog/CatalogPricingAlert.tsx'
import { useCatalog } from '@store/catalog/CatalogProvider.tsx'
import { ProductsPagination } from '@store/components/ProductsPagination.tsx'
import { searchProductsByName } from '@store/lib/searchProducts.ts'
import { scrollProductsListingIntoView } from '@store/lib/scrollProductsListingIntoView.ts'
import { ProductListingCard } from '../components/ProductListingCard.tsx'
import { ProductGridPlaceholder } from '../components/CommercePlaceholder.tsx'

export default function ShinobiProductsSearchPage() {
  const { products, loading: catalogLoading, error: catalogError, diagnostics, buildId, refetch } = useCatalog()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const q = searchParams.get('q') ?? ''
  const [currentPage, setCurrentPage] = useState(1)

  const results = useMemo(() => searchProductsByName(products.filter(item => item.images.length > 0), q), [products, q])
  const pageSize = 24
  const totalPages = Math.max(1, Math.ceil(results.length / pageSize))
  const page = Math.min(currentPage, totalPages)
  const pagedProducts = results.slice((page - 1) * pageSize, page * pageSize)
  const trimmedQ = q.trim()

  useEffect(() => {
    setCurrentPage(1)
  }, [q])

  const goToPage = useCallback((nextPage: number) => {
    setCurrentPage(nextPage)
    requestAnimationFrame(() => scrollProductsListingIntoView())
  }, [])

  return (
    <main className="shop-route-page products-page products-search-page shinobi-products-page">
      <div className="shinobi-page-hero">
        <div className="shinobi-page-hero__title-row">
          <h1>
            {trimmedQ ? (
              <>
                Results for <span className="shinobi-search-query">&ldquo;{trimmedQ}&rdquo;</span>
              </>
            ) : (
              'Search products'
            )}
          </h1>

        </div>
        <p className="shinobi-page-hero__sub">
          {trimmedQ
            ? `${results.length} ${results.length === 1 ? 'product' : 'products'} match your search.`
            : 'Type a product name in the search bar above.'}
        </p>
      </div>

      <div className="products-crumb-row">
        <p className="products-crumb">
          <Link to="/">Home</Link>
          {' / '}
          <Link to="/products">Products</Link>
          {' / '}
          <span>Search</span>
        </p>
        <button type="button" className="products-prev-btn shinobi-back-btn" onClick={() => navigate(-1)}>
          ← Back
        </button>
      </div>

      <CatalogPricingAlert
        catalogError={catalogError}
        catalogLoading={catalogLoading}
        diagnostics={diagnostics}
        buildId={buildId}
        onRetry={refetch}
      />

      {catalogLoading ? (
        <div aria-busy="true" aria-label="Search results"><ProductGridPlaceholder /></div>
      ) : !trimmedQ ? (
        <p className="checkout-lead">Type a product name in the search bar above.</p>
      ) : catalogError && results.length === 0 ? (
        <p className="checkout-lead" role="alert">
          {catalogError}
        </p>
      ) : results.length === 0 ? (
        <p className="checkout-lead">No products match &ldquo;{trimmedQ}&rdquo;. Try another name.</p>
      ) : (
        <>
          <div className="shop-route-grid products-grid shinobi-listing-grid">
            {pagedProducts.map((item, cardIndex) => (
              <ProductListingCard key={item.id} item={item} cardIndex={cardIndex} />
            ))}
          </div>
          <ProductsPagination
            page={page}
            totalPages={totalPages}
            onPageChange={goToPage}
            aria-label="Search result pages"
          />
        </>
      )}
    </main>
  )
}
