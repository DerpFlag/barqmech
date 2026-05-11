import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import {
  categorySlugs,
  featuredCategories,
  type FeaturedCategory,
  finalLogoUrl,
  parsePrice,
  slugToCategory,
} from '../data/catalog.ts'
import { useCatalog } from '../catalog/CatalogProvider.tsx'
import { TopbarCartButton } from '../cart/CartContext.tsx'
import { OrderDesignContactFooter, useShopContactDemo } from '../components/shopContact.tsx'


export default function ProductsPage() {
  const { products, loading: catalogLoading, error: catalogError } = useCatalog()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<'All' | FeaturedCategory>(() => {
    const slug = searchParams.get('category')
    return (slug && slugToCategory[slug]) || 'All'
  })
  const [maxPrice, setMaxPrice] = useState(100000)
  const [draftMaxPrice, setDraftMaxPrice] = useState(100000)
  const [showMobileCategoryFilter, setShowMobileCategoryFilter] = useState(false)
  const [showMobilePriceFilter, setShowMobilePriceFilter] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const shopContact = useShopContactDemo()
  const [productImageIndexes, setProductImageIndexes] = useState<Record<string, number>>({})

  const filteredProducts = products.filter((item) => {
    const categoryMatch = selectedCategory === 'All' || item.category === selectedCategory
    return categoryMatch && parsePrice(item.price) <= maxPrice
  })
  const activeProductsHeading = selectedCategory === 'All' ? 'All Products' : selectedCategory
  const pageSize = 20
  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / pageSize))
  const page = Math.min(currentPage, totalPages)
  const pagedProducts = filteredProducts.slice((page - 1) * pageSize, page * pageSize)

  useEffect(() => {
    setCurrentPage(1)
  }, [selectedCategory, maxPrice])

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
    setMaxPrice(draftMaxPrice)
    setShowMobilePriceFilter(false)
  }

  useEffect(() => {
    setProductImageIndexes((prev) => {
      const next = { ...prev }
      for (const p of products) {
        if (next[p.id] === undefined) next[p.id] = 0
      }
      return next
    })
  }, [products])

  useEffect(() => {
    if (products.length === 0) return
    const timer = window.setInterval(() => {
      setProductImageIndexes((prev) =>
        Object.fromEntries(
          products.map((item) => [item.id, ((prev[item.id] ?? 0) + 1) % Math.max(item.images.length, 1)])
        )
      )
    }, 2600)
    return () => window.clearInterval(timer)
  }, [products])

  const scrollToSection = (id: string) =>
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })

  return (
    <>
      <header className="topbar visible">
        <div className="topbar-inner">
          <Link to="/" className="brand-logo-btn">
            <img src={finalLogoUrl} alt="BarqMech" className="brand-logo-img" width={240} height={72} decoding="async" fetchPriority="high" />
            <span className="brand-title">BARQMECH</span>
          </Link>
          <form className="topbar-search" role="search" onSubmit={(e) => e.preventDefault()}>
            <input type="search" name="q" className="topbar-search-input" placeholder="Search products..." autoComplete="off" aria-label="Search products" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            <span className="topbar-search-icon" aria-hidden><svg viewBox="0 0 24 24" className="nav-icon-svg"><path d="M10.5 3a7.5 7.5 0 0 1 5.95 12.08l4.24 4.24-1.42 1.42-4.24-4.24A7.5 7.5 0 1 1 10.5 3zm0 2a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11z" /></svg></span>
          </form>
          <nav className="topbar-actions" aria-label="Primary">
            <button type="button" className="topbar-nav-link" onClick={() => navigate('/products')}><span className="nav-icon" aria-hidden><svg viewBox="0 0 24 24" className="nav-icon-svg"><path d="M7 8V7a5 5 0 0 1 10 0v1h3v13H4V8h3zm2 0h6V7a3 3 0 0 0-6 0v1zm-3 2v9h12v-9H6z" /></svg></span><span className="nav-label">Shop</span></button>
            <button type="button" className="topbar-nav-link" onClick={() => scrollToSection('order-design')}><span className="nav-icon" aria-hidden><svg viewBox="0 0 24 24" className="nav-icon-svg"><path d="M3 6h18v12H3V6zm2 2v.35L12 12.8l7-4.45V8H5zm14 8v-5.3l-7 4.45-7-4.45V16h14z" /></svg></span><span className="nav-label">Contact</span></button>
            <button type="button" className="topbar-nav-link" aria-label="Account"><span className="nav-icon" aria-hidden><svg viewBox="0 0 24 24" className="nav-icon-svg"><path d="M12 3a5 5 0 1 1 0 10 5 5 0 0 1 0-10zm0 12c4.42 0 8 2.01 8 4.5V21H4v-1.5C4 17.01 7.58 15 12 15z" /></svg></span><span className="nav-label">Account</span></button>
            <TopbarCartButton />
          </nav>
        </div>
      </header>

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
              <div className="price-filter">
                <h4>Price Filter</h4>
                <p>100 - {draftMaxPrice.toLocaleString()}</p>
                <input type="range" min={100} max={100000} step={100} value={draftMaxPrice} onChange={(e) => setDraftMaxPrice(Number(e.target.value))} />
                <button type="button" className="mosaic-discover-btn products-apply-filter-btn" onClick={applyPriceFilter}>
                  Apply Filter
                </button>
              </div>
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
            <div className="price-filter">
              <h4>Price Filter</h4>
              <p>100 - {draftMaxPrice.toLocaleString()}</p>
              <input type="range" min={100} max={100000} step={100} value={draftMaxPrice} onChange={(e) => setDraftMaxPrice(Number(e.target.value))} />
              <button type="button" className="mosaic-discover-btn products-apply-filter-btn" onClick={applyPriceFilter}>
                Apply Filter
              </button>
            </div>
          </aside>

          <div className="products-main">
            <div className="products-listing-heading-row">
              <h2 className="products-listing-heading">{activeProductsHeading}</h2>
            </div>
            {catalogLoading ? (
              <p className="checkout-lead">Loading catalog…</p>
            ) : catalogError ? (
              <p className="checkout-lead" role="alert">
                {catalogError}
              </p>
            ) : filteredProducts.length === 0 ? (
              <p className="checkout-lead">No products match these filters yet.</p>
            ) : (
              <>
                <div className="shop-route-grid products-grid">
                  {pagedProducts.map((item) => (
                    <Link key={item.id} to={`/products/${categorySlugs[item.category]}/${item.slug}`} className="shop-route-card">
                      <div className="shop-route-image-stack">
                        {item.images.map((image, imageIndex) => (
                          <img
                            key={`${item.id}-${image}`}
                            src={image}
                            alt={item.title}
                            className={`shop-route-image ${imageIndex === (productImageIndexes[item.id] ?? 0) ? 'active' : ''}`}
                            loading="lazy"
                            decoding="async"
                          />
                        ))}
                      </div>
                      <h3>{item.title}</h3>
                      <p>{item.price}</p>
                    </Link>
                  ))}
                </div>
                <div className="products-pagination">
                  <button type="button" className="featured-arrow" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>
                    ‹
                  </button>
                  <span>
                    Page {page} / {totalPages}
                  </span>
                  <button type="button" className="featured-arrow" onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>
                    ›
                  </button>
                </div>
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
