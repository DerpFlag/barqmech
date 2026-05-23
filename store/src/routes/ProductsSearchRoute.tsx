import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { categorySlugs, finalLogoUrl } from '../data/catalog.ts'
import { RotatingImageStack } from '../catalog/RotatingImageStack.tsx'
import { CatalogPricingAlert } from '../catalog/CatalogPricingAlert.tsx'
import { useCatalog } from '../catalog/CatalogProvider.tsx'
import { searchProductsByName } from '../lib/searchProducts.ts'
import { ShopTopbar } from '../components/ShopTopbar.tsx'
import { ProductsPagination } from '../components/ProductsPagination.tsx'
import { OrderDesignContactFooter, useShopContactDemo } from '../components/shopContact.tsx'
import { scrollProductsListingIntoView } from '../lib/scrollProductsListingIntoView.ts'

export default function ProductsSearchPage() {
  const { products, loading: catalogLoading, error: catalogError, diagnostics, buildId, refetch } = useCatalog()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const q = searchParams.get('q') ?? ''
  const [currentPage, setCurrentPage] = useState(1)
  const shopContact = useShopContactDemo()

  const results = useMemo(() => searchProductsByName(products, q), [products, q])
  const pageSize = 20
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

  const onSearchChange = (next: string) => {
    const trimmed = next.trim()
    if (!trimmed) {
      setSearchParams({}, { replace: true })
      return
    }
    setSearchParams({ q: trimmed }, { replace: true })
  }

  return (
    <>
      <ShopTopbar searchValue={q} onSearchChange={onSearchChange} showContact />

      <main className="shop-route-page products-page products-search-page">
        <div className="products-crumb-row">
          <p className="products-crumb">
            <Link to="/">Home</Link>
            {' / '}
            <Link to="/products">Products</Link>
            {' / '}
            <span>Search</span>
          </p>
          <button type="button" className="products-prev-btn" onClick={() => navigate(-1)}>
            ← Previous page
          </button>
        </div>

        <div className="products-search-header">
          <h1 className="products-listing-heading">
            {trimmedQ ? (
              <>
                Search results for <span className="products-search-query">&ldquo;{trimmedQ}&rdquo;</span>
              </>
            ) : (
              'Search products'
            )}
          </h1>
          {trimmedQ && !catalogLoading && (
            <p className="products-search-count" role="status">
              {results.length} {results.length === 1 ? 'product' : 'products'}
            </p>
          )}
        </div>

        <CatalogPricingAlert
          catalogError={catalogError}
          catalogLoading={catalogLoading}
          diagnostics={diagnostics}
          buildId={buildId}
          onRetry={refetch}
        />

        {catalogLoading ? (
          <p className="checkout-lead">Loading catalog…</p>
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
            <div className="shop-route-grid products-grid">
              {pagedProducts.map((item, cardIndex) => {
                if (!item.images.length) return null
                return (
                  <Link
                    key={item.id}
                    to={`/products/${categorySlugs[item.category]}/${item.slug}`}
                    className="shop-route-card"
                  >
                    <RotatingImageStack
                      urls={item.images}
                      alt={item.title}
                      catalogSize="card"
                      stackClassName="shop-route-image-stack"
                      imageClassName="shop-route-image"
                      rotate
                      intervalMs={2800 + (cardIndex % 4) * 220}
                    />
                    <h3>{item.title}</h3>
                    <p>{item.price}</p>
                  </Link>
                )
              })}
            </div>
            <ProductsPagination page={page} totalPages={totalPages} onPageChange={goToPage} aria-label="Search result pages" />
          </>
        )}

        <section className="confidence-section" aria-label="Customer confidence highlights">
          <div className="confidence-title-row">
            <span className="confidence-line" aria-hidden />
            <h3>Buy with Confidence</h3>
            <span className="confidence-line" aria-hidden />
          </div>
          <div className="confidence-grid">
            <article className="confidence-item">
              <span className="confidence-icon" aria-hidden>
                <svg viewBox="0 0 24 24" className="confidence-icon-svg">
                  <path d="M1 5h11v8h2.2l2.8-3.5H23V17h-2.2a2.8 2.8 0 0 1-5.6 0H8.8a2.8 2.8 0 0 1-5.6 0H1V5zm2 2v8h.2a2.8 2.8 0 0 1 5.6 0H10V7H3zm14.1 4L15.5 13H14v2h1.2a2.8 2.8 0 0 1 5.6 0H21v-4h-3.9zM6 15.6a1.4 1.4 0 1 0 0 2.8 1.4 1.4 0 0 0 0-2.8zm12 0a1.4 1.4 0 1 0 0 2.8 1.4 1.4 0 0 0 0-2.8z" />
                </svg>
              </span>
              <h4>Fast Shipping</h4>
              <p>Order by 2pm PST and we&apos;ll ship your order the very next day!</p>
            </article>
            <article className="confidence-item">
              <span className="confidence-icon" aria-hidden>
                <svg viewBox="0 0 24 24" className="confidence-icon-svg">
                  <path d="M12 3a8 8 0 0 0-8 8v5a3 3 0 0 0 3 3h2v-7H6v-1a6 6 0 1 1 12 0v1h-3v7h2a3 3 0 0 0 3-3v-5a8 8 0 0 0-8-8z" />
                </svg>
              </span>
              <h4>Support 24/7</h4>
              <p>Our team is available 24 hours a day, 7 days a week to help you quickly.</p>
            </article>
            <article className="confidence-item confidence-about">
              <img src={finalLogoUrl} alt="BarqMech logo" className="confidence-about-logo" loading="lazy" decoding="async" />
              <h4>About Us</h4>
              <p>
                Elevating spaces through metal mastery. Barqmech delivers high-precision laser cutting and custom
                fabrication where innovation meets craftsmanship.
              </p>
            </article>
          </div>
        </section>

        <OrderDesignContactFooter shopContact={shopContact} demoEmailFieldId="demo-email-search" />
      </main>
    </>
  )
}
