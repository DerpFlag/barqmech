import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import {
  categorySlugs,
  featuredCategories,
  type FeaturedCategory,
  finalLogoUrl,
  parsePrice,
  slugToCategory,
} from '../data/catalog.ts'
import { RotatingImageStack } from '../catalog/RotatingImageStack.tsx'
import { CatalogPricingAlert } from '../catalog/CatalogPricingAlert.tsx'
import { useCatalog } from '../catalog/CatalogProvider.tsx'
import { OrderDesignContactFooter, useShopContactDemo } from '../components/shopContact.tsx'
import {
  PRICE_FILTER_MAX,
  PRICE_FILTER_MIN,
  PRICE_FILTER_STEP,
  PriceRangeFilter,
} from '../components/PriceRangeFilter.tsx'
import { ProductsPagination } from '../components/ProductsPagination.tsx'
import { ShopTopbar } from '../components/ShopTopbar.tsx'
import { scrollProductsListingIntoView } from '../lib/scrollProductsListingIntoView.ts'


export default function ProductsPage() {
  const { products, loading: catalogLoading, error: catalogError, diagnostics, buildId, refetch } = useCatalog()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [selectedCategory, setSelectedCategory] = useState<'All' | FeaturedCategory>(() => {
    const slug = searchParams.get('category')
    return (slug && slugToCategory[slug]) || 'All'
  })
  const priceSliderBounds = useMemo(() => {
    const prices = products.map((p) => parsePrice(p.price)).filter((n) => n > 0)
    if (!prices.length) {
      return { sliderMin: PRICE_FILTER_MIN, sliderMax: PRICE_FILTER_MAX }
    }
    const catalogMin = Math.min(...prices)
    const catalogMax = Math.max(...prices)
    const sliderMin = Math.min(PRICE_FILTER_MIN, Math.floor(catalogMin / PRICE_FILTER_STEP) * PRICE_FILTER_STEP)
    const sliderMax = Math.max(
      PRICE_FILTER_MAX,
      Math.ceil(catalogMax / PRICE_FILTER_STEP) * PRICE_FILTER_STEP
    )
    return { sliderMin, sliderMax }
  }, [products])

  const [minPrice, setMinPrice] = useState(0)
  const [maxPrice, setMaxPrice] = useState(Number.POSITIVE_INFINITY)
  const [draftMinPrice, setDraftMinPrice] = useState(PRICE_FILTER_MIN)
  const [draftMaxPrice, setDraftMaxPrice] = useState(PRICE_FILTER_MAX)
  const [priceFilterTouched, setPriceFilterTouched] = useState(false)

  useEffect(() => {
    if (priceFilterTouched || products.length === 0) return
    const prices = products.map((p) => parsePrice(p.price)).filter((n) => n > 0)
    if (!prices.length) return
    const catalogMax = Math.max(...prices)
    const catalogMin = Math.min(...prices)
    setDraftMinPrice(Math.max(priceSliderBounds.sliderMin, catalogMin))
    setDraftMaxPrice(catalogMax)
    setMaxPrice(Number.POSITIVE_INFINITY)
    setMinPrice(0)
  }, [products, priceFilterTouched, priceSliderBounds.sliderMin])
  const [showMobileCategoryFilter, setShowMobileCategoryFilter] = useState(false)
  const [showMobilePriceFilter, setShowMobilePriceFilter] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const shopContact = useShopContactDemo()
  const filteredProducts = products.filter((item) => {
    const categoryMatch = selectedCategory === 'All' || item.category === selectedCategory
    const price = parsePrice(item.price)
    return categoryMatch && price >= minPrice && price <= maxPrice
  })
  const activeProductsHeading = selectedCategory === 'All' ? 'All Products' : selectedCategory
  const pageSize = 20
  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / pageSize))
  const page = Math.min(currentPage, totalPages)
  const pagedProducts = filteredProducts.slice((page - 1) * pageSize, page * pageSize)

  useEffect(() => {
    setCurrentPage(1)
  }, [selectedCategory, minPrice, maxPrice])

  const goToPage = useCallback((nextPage: number) => {
    setCurrentPage(nextPage)
    requestAnimationFrame(() => scrollProductsListingIntoView())
  }, [])

  useEffect(() => {
    const slug = searchParams.get('category')
    const nextCategory = (slug && slugToCategory[slug]) || 'All'
    setSelectedCategory(nextCategory)
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
    setPriceFilterTouched(true)
    setMinPrice(draftMinPrice)
    setMaxPrice(draftMaxPrice)
    setShowMobilePriceFilter(false)
  }

  const showPagination = filteredProducts.length > 0

  return (
    <>
      <ShopTopbar contactSectionId="order-design" showContact />

      <main className="shop-route-page products-page">
        <div className="products-crumb-row">
          <p className="products-crumb">
            <Link to="/">Home</Link>
            {' / '}
            {selectedCategory === 'All' ? (
              <span>Products</span>
            ) : (
              <>
                <Link to="/products">Products</Link>
                {' / '}
                <span>{selectedCategory}</span>
              </>
            )}
          </p>
          <button type="button" className="products-prev-btn" onClick={() => navigate(-1)}>← Previous page</button>
        </div>

        <section className="products-mobile-filters">
          <button
            type="button"
            className="products-mobile-filter-toggle"
            onClick={() => setShowMobileCategoryFilter((v) => !v)}
            aria-expanded={showMobileCategoryFilter}
          >
            Category <span aria-hidden>{showMobileCategoryFilter ? '▴' : '▾'}</span>
          </button>
          {showMobileCategoryFilter && (
            <div className="products-mobile-filter-panel">
              {(['All', ...featuredCategories] as const).map((category) => (
                <button
                  key={category}
                  type="button"
                  className={`products-filter-btn ${selectedCategory === category ? 'active' : ''}`}
                  onClick={() => {
                    chooseCategory(category)
                    setShowMobileCategoryFilter(false)
                  }}
                >
                  {category}
                </button>
              ))}
            </div>
          )}

          <button
            type="button"
            className="products-mobile-filter-toggle"
            onClick={() => setShowMobilePriceFilter((v) => !v)}
            aria-expanded={showMobilePriceFilter}
          >
            Filter by Price <span aria-hidden>{showMobilePriceFilter ? '▴' : '▾'}</span>
          </button>
          {showMobilePriceFilter && (
            <div className="products-mobile-filter-panel">
              <PriceRangeFilter
                draftMin={draftMinPrice}
                draftMax={draftMaxPrice}
                sliderMin={priceSliderBounds.sliderMin}
                sliderMax={priceSliderBounds.sliderMax}
                onDraftMinChange={setDraftMinPrice}
                onDraftMaxChange={setDraftMaxPrice}
                onApply={applyPriceFilter}
              />
            </div>
          )}
        </section>

        <section className="products-layout">
          <aside className="products-sidebar">
            <h3>Categories</h3>
            {(['All', ...featuredCategories] as const).map((category) => (
              <button key={category} type="button" className={`products-filter-btn ${selectedCategory === category ? 'active' : ''}`} onClick={() => chooseCategory(category)}>
                {category}
              </button>
            ))}
            <PriceRangeFilter
              draftMin={draftMinPrice}
              draftMax={draftMaxPrice}
              sliderMin={priceSliderBounds.sliderMin}
              sliderMax={priceSliderBounds.sliderMax}
              onDraftMinChange={setDraftMinPrice}
              onDraftMaxChange={setDraftMaxPrice}
              onApply={applyPriceFilter}
            />
          </aside>

          <div className="products-main">
            <div className="products-listing-heading-row">
              <h2 className="products-listing-heading">{activeProductsHeading}</h2>
              {showPagination && (
                <ProductsPagination
                  className="products-pagination--top"
                  page={page}
                  totalPages={totalPages}
                  onPageChange={goToPage}
                  aria-label="Product pages (top)"
                />
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
            ) : catalogError && filteredProducts.length === 0 ? (
              <p className="checkout-lead" role="alert">
                {catalogError}
              </p>
            ) : filteredProducts.length === 0 ? (
              <p className="checkout-lead">No products match these filters yet.</p>
            ) : (
              <>
                <div className="shop-route-grid products-grid">
                  {pagedProducts.map((item, cardIndex) => {
                    if (!item.images.length) return null
                    return (
                    <Link key={item.id} to={`/products/${categorySlugs[item.category]}/${item.slug}`} className="shop-route-card">
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
                <ProductsPagination page={page} totalPages={totalPages} onPageChange={goToPage} aria-label="Product pages" />
              </>
            )}
          </div>
        </section>

        <section className="confidence-section" aria-label="Customer confidence highlights">
          <div className="confidence-title-row"><span className="confidence-line" aria-hidden /><h3>Buy with Confidence</h3><span className="confidence-line" aria-hidden /></div>
          <div className="confidence-grid">
            <article className="confidence-item"><span className="confidence-icon" aria-hidden><svg viewBox="0 0 24 24" className="confidence-icon-svg"><path d="M1 5h11v8h2.2l2.8-3.5H23V17h-2.2a2.8 2.8 0 0 1-5.6 0H8.8a2.8 2.8 0 0 1-5.6 0H1V5zm2 2v8h.2a2.8 2.8 0 0 1 5.6 0H10V7H3zm14.1 4L15.5 13H14v2h1.2a2.8 2.8 0 0 1 5.6 0H21v-4h-3.9zM6 15.6a1.4 1.4 0 1 0 0 2.8 1.4 1.4 0 0 0 0-2.8zm12 0a1.4 1.4 0 1 0 0 2.8 1.4 1.4 0 0 0 0-2.8z" /></svg></span><h4>Fast Shipping</h4><p>Order by 2pm PST and we&apos;ll ship your order the very next day!</p></article>
            <article className="confidence-item"><span className="confidence-icon" aria-hidden><svg viewBox="0 0 24 24" className="confidence-icon-svg"><path d="M12 3a8 8 0 0 0-8 8v5a3 3 0 0 0 3 3h2v-7H6v-1a6 6 0 1 1 12 0v1h-3v7h2a3 3 0 0 0 3-3v-5a8 8 0 0 0-8-8z" /></svg></span><h4>Support 24/7</h4><p>Our team is available 24 hours a day, 7 days a week to help you quickly.</p></article>
            <article className="confidence-item confidence-about"><img src={finalLogoUrl} alt="BarqMech logo" className="confidence-about-logo" loading="lazy" decoding="async" /><h4>About Us</h4><p>Elevating spaces through metal mastery. Barqmech delivers high-precision laser cutting and custom fabrication where innovation meets craftsmanship.</p></article>
          </div>
        </section>

        <OrderDesignContactFooter shopContact={shopContact} demoEmailFieldId="demo-email-products" />
      </main>
    </>
  )
}
