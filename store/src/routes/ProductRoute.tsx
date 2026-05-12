import { useEffect, useMemo, useState, type KeyboardEvent as ReactKeyboardEvent } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { TopbarCartButton, useCart } from '../cart/CartContext.tsx'
import { useCatalog } from '../catalog/CatalogProvider.tsx'
import {
  defaultDesignCode,
  designCodeRange,
  PDP_FINISHES,
  type PdpFinish,
  unitPricePkr,
  variantByDesignCode,
} from '../catalog/pricing.ts'
import {
  featuredDescriptions,
  finalLogoUrl,
  formatEstimatedDeliveryRange,
  formatPriceNoDecimals,
  slugToCategory,
  storefrontPhoneTel,
  storefrontWhatsApp,
} from '../data/catalog.ts'
import { OrderDesignContactFooter, useShopContactDemo } from '../components/shopContact.tsx'


export default function ProductPage() {
  const { addToCart, openDrawer } = useCart()
  const { products, loading: catalogLoading } = useCatalog()
  const navigate = useNavigate()
  const { categorySlug, productSlug } = useParams()
  const [searchQuery, setSearchQuery] = useState('')
  const [activeImageIndex, setActiveImageIndex] = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [productDetailTab, setProductDetailTab] = useState<'description' | 'disclaimer'>('description')
  const [selectedDesignCode, setSelectedDesignCode] = useState(0)
  const [designInput, setDesignInput] = useState('')
  const [designError, setDesignError] = useState<string | null>(null)
  const [selectedSize, setSelectedSize] = useState('')
  const [selectedFinish, setSelectedFinish] = useState<PdpFinish>('Silver')
  const [woodenFrame, setWoodenFrame] = useState(false)
  const [ledBacklight, setLedBacklight] = useState(false)
  const [installation, setInstallation] = useState(false)
  const [quantity, setQuantity] = useState(1)
  const shopContact = useShopContactDemo()

  const category = categorySlug ? slugToCategory[categorySlug] : undefined
  const product = useMemo(() => {
    if (!category || !productSlug) return undefined
    return products.find((p) => p.category === category && p.slug === productSlug)
  }, [products, category, productSlug])

  const dcRange = useMemo(() => (product ? designCodeRange(product.variants) : null), [product])

  const activeVariant = useMemo(() => {
    if (!product?.variants.length) return undefined
    return variantByDesignCode(product.variants, selectedDesignCode) ?? product.variants[0]
  }, [product, selectedDesignCode])

  const sizeLabels = useMemo(() => activeVariant?.pricing.sizes.map((s) => s.label) ?? [], [activeVariant])

  const selectedTier = useMemo(
    () => activeVariant?.pricing.sizes.find((s) => s.label === selectedSize),
    [activeVariant, selectedSize]
  )

  const unitPriceWithAddons = useMemo(() => {
    if (!activeVariant || !selectedSize) return 0
    return unitPricePkr(activeVariant, selectedSize, selectedFinish, woodenFrame, ledBacklight, installation)
  }, [activeVariant, selectedSize, selectedFinish, woodenFrame, ledBacklight, installation])

  useEffect(() => {
    setActiveImageIndex(0)
    setQuantity(1)
    setWoodenFrame(false)
    setLedBacklight(false)
    setInstallation(false)
    setLightboxOpen(false)
    setProductDetailTab('description')
  }, [product?.id])

  useEffect(() => {
    if (!product) return
    const def = defaultDesignCode(product.variants)
    setSelectedDesignCode(def)
    setDesignInput(String(def))
    setDesignError(null)
  }, [product?.id])

  useEffect(() => {
    if (!sizeLabels.length) return
    setSelectedSize((prev) => (sizeLabels.includes(prev) ? prev : sizeLabels[0]!))
  }, [sizeLabels, activeVariant?.id])

  useEffect(() => {
    if (!lightboxOpen) return
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [lightboxOpen])

  useEffect(() => {
    if (!lightboxOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setLightboxOpen(false)
        return
      }
      const n = product?.images.length ?? 0
      if (n <= 1) return
      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        setActiveImageIndex((i) => (i - 1 + n) % n)
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault()
        setActiveImageIndex((i) => (i + 1) % n)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [lightboxOpen, product?.images.length, product?.id])

  const clampQty = (n: number) => Math.min(99, Math.max(1, n))

  const tryApplyDesign = () => {
    if (!product) return true
    const rng = designCodeRange(product.variants)
    if (!rng) return true
    const n = parseInt(designInput.trim(), 10)
    if (!Number.isFinite(n) || !variantByDesignCode(product.variants, n)) {
      setDesignError(`Enter a valid design code (${rng.min}–${rng.max}).`)
      return false
    }
    setDesignError(null)
    setSelectedDesignCode(n)
    return true
  }

  if (!category || !productSlug) return <Navigate to="/" replace />

  if (catalogLoading) {
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
              <span className="topbar-search-icon" aria-hidden>
                <svg viewBox="0 0 24 24" className="nav-icon-svg">
                  <path d="M10.5 3a7.5 7.5 0 0 1 5.95 12.08l4.24 4.24-1.42 1.42-4.24-4.24A7.5 7.5 0 1 1 10.5 3zm0 2a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11z" />
                </svg>
              </span>
            </form>
            <nav className="topbar-actions" aria-label="Primary">
              <button type="button" className="topbar-nav-link" onClick={() => navigate('/products')}>
                <span className="nav-icon" aria-hidden>
                  <svg viewBox="0 0 24 24" className="nav-icon-svg">
                    <path d="M7 8V7a5 5 0 0 1 10 0v1h3v13H4V8h3zm2 0h6V7a3 3 0 0 0-6 0v1zm-3 2v9h12v-9H6z" />
                  </svg>
                </span>
                <span className="nav-label">Shop</span>
              </button>
              <TopbarCartButton />
            </nav>
          </div>
        </header>
        <main className="shop-route-page products-page product-detail-page">
          <p className="checkout-lead">Loading product…</p>
        </main>
      </>
    )
  }

  if (!product) return <Navigate to={categorySlug ? `/products?category=${categorySlug}` : '/products'} replace />

  const productsCategoryHref = `/products?category=${categorySlug}`
  const lineTotal = unitPriceWithAddons * quantity
  const lineTotalLabel = lineTotal > 0 ? formatPriceNoDecimals(lineTotal) : formatPriceNoDecimals(unitPriceWithAddons)

  const deliveryRange = formatEstimatedDeliveryRange()

  const orderLines = [
    `Product: ${product.title}`,
    `Category: ${product.category}`,
    ...(dcRange ? [`Design code: ${selectedDesignCode}`] : []),
    `Size: ${selectedSize}`,
    `Finish: ${selectedFinish}`,
    `Wooden Frame: ${woodenFrame ? 'Yes' : 'No'}`,
    `LED Backlight: ${ledBacklight ? 'Yes' : 'No'}`,
    `Installation: ${installation ? 'Yes' : 'No'}`,
    `Quantity: ${quantity}`,
    `Indicative total: ${lineTotalLabel}`,
  ]

  const waInquiry = `${storefrontWhatsApp}?text=${encodeURIComponent(
    ['Hi BarqMech — I have a question about:', product.title, '', ...orderLines].join('\n')
  )}`

  const images = product.images
  const heroSrc = images[activeImageIndex] ?? images[0]
  const showThumbs = images.length > 1
  const nImages = images.length

  const goPrevImage = () => setActiveImageIndex((i) => (i - 1 + nImages) % nImages)
  const goNextImage = () => setActiveImageIndex((i) => (i + 1) % nImages)

  const onHeroKeyDown = (e: ReactKeyboardEvent) => {
    if (nImages <= 1) return
    if (e.key === 'ArrowLeft') {
      e.preventDefault()
      goPrevImage()
    }
    if (e.key === 'ArrowRight') {
      e.preventDefault()
      goNextImage()
    }
  }

  const pushConfiguredLine = (goCheckout: boolean) => {
    if (dcRange && !tryApplyDesign()) return
    const tier = activeVariant?.pricing.sizes.find((s) => s.label === selectedSize)
    if (!activeVariant || !tier) return
    const unit = unitPricePkr(activeVariant, selectedSize, selectedFinish, woodenFrame, ledBacklight, installation)
    addToCart({
      productId: product.id,
      slug: product.slug,
      categorySlug: categorySlug!,
      title: product.title,
      imageUrl: heroSrc,
      priceLabel: formatPriceNoDecimals(unit),
      unitPrice: unit,
      quantity,
      size: selectedSize,
      finish: selectedFinish,
      designCode: dcRange != null ? selectedDesignCode : undefined,
      woodenFrame,
      ledBacklight,
      installation,
    })
    if (goCheckout) navigate('/checkout')
    else openDrawer()
  }

  return (
    <>
      <header className="topbar visible">
        <div className="topbar-inner">
          <Link to="/" className="brand-logo-btn">
            <img src={finalLogoUrl} alt="BarqMech" className="brand-logo-img" width={240} height={72} decoding="async" fetchPriority="high" />
            <span className="brand-title">BARQMECH</span>
          </Link>
          <form className="topbar-search" role="search" onSubmit={(e) => e.preventDefault()}>
            <input
              type="search"
              name="q"
              className="topbar-search-input"
              placeholder="Search products..."
              autoComplete="off"
              aria-label="Search products"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <span className="topbar-search-icon" aria-hidden>
              <svg viewBox="0 0 24 24" className="nav-icon-svg">
                <path d="M10.5 3a7.5 7.5 0 0 1 5.95 12.08l4.24 4.24-1.42 1.42-4.24-4.24A7.5 7.5 0 1 1 10.5 3zm0 2a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11z" />
              </svg>
            </span>
          </form>
          <nav className="topbar-actions" aria-label="Primary">
            <button type="button" className="topbar-nav-link" onClick={() => navigate('/products')}>
              <span className="nav-icon" aria-hidden>
                <svg viewBox="0 0 24 24" className="nav-icon-svg">
                  <path d="M7 8V7a5 5 0 0 1 10 0v1h3v13H4V8h3zm2 0h6V7a3 3 0 0 0-6 0v1zm-3 2v9h12v-9H6z" />
                </svg>
              </span>
              <span className="nav-label">Shop</span>
            </button>
            <button
              type="button"
              className="topbar-nav-link"
              onClick={() =>
                document.getElementById('order-design')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
              }
            >
              <span className="nav-icon" aria-hidden>
                <svg viewBox="0 0 24 24" className="nav-icon-svg">
                  <path d="M3 6h18v12H3V6zm2 2v.35L12 12.8l7-4.45V8H5zm14 8v-5.3l-7 4.45-7-4.45V16h14z" />
                </svg>
              </span>
              <span className="nav-label">Contact</span>
            </button>
            <button type="button" className="topbar-nav-link" aria-label="Account">
              <span className="nav-icon" aria-hidden>
                <svg viewBox="0 0 24 24" className="nav-icon-svg">
                  <path d="M12 3a5 5 0 1 1 0 10 5 5 0 0 1 0-10zm0 12c4.42 0 8 2.01 8 4.5V21H4v-1.5C4 17.01 7.58 15 12 15z" />
                </svg>
              </span>
              <span className="nav-label">Account</span>
            </button>
            <TopbarCartButton />
          </nav>
        </div>
      </header>

      <main className="shop-route-page products-page product-detail-page">
        <div className="products-crumb-row">
          <p className="products-crumb">
            <span className="products-crumb-segments">
              <Link to="/">Home</Link><span className="products-crumb-sep" aria-hidden>/</span><Link to="/products">Products</Link><span className="products-crumb-sep" aria-hidden>/</span><Link to={productsCategoryHref}>{product.category}</Link><span className="products-crumb-sep" aria-hidden>/</span><span className="products-crumb-current">{product.title}</span>
            </span>
          </p>
          <button type="button" className="products-prev-btn" onClick={() => navigate(-1)}>
            ← Previous page
          </button>
        </div>

        <div className={`product-detail-main${showThumbs ? '' : ' product-detail-main--single'}`}>
          <div className="product-detail-layout">
            <div className={`product-detail-gallery-wrap${showThumbs ? '' : ' product-detail-gallery-wrap--single'}`}>
              {showThumbs ? (
                <div className="product-detail-thumbs" role="tablist" aria-label="Product images">
                  {images.map((src, index) => (
                    <button
                      key={`${product.id}-t${index}`}
                      type="button"
                      role="tab"
                      aria-selected={index === activeImageIndex}
                      className={`product-detail-thumb${index === activeImageIndex ? ' is-active' : ''}`}
                      onClick={() => setActiveImageIndex(index)}
                    >
                      <span className="product-detail-thumb-frame">
                        <img src={src} alt="" loading="lazy" decoding="async" />
                      </span>
                    </button>
                  ))}
                </div>
              ) : null}
              <div
                className="product-detail-hero"
                onKeyDown={onHeroKeyDown}
                tabIndex={0}
                role="group"
                aria-label="Main product images. Use arrow keys to change image."
              >
                <div className="product-detail-hero-viewport">
                  <div
                    className="product-detail-hero-track"
                    style={{
                      width: `${nImages * 100}%`,
                      transform: `translateX(-${(activeImageIndex * 100) / nImages}%)`,
                    }}
                  >
                    {images.map((src, index) => (
                      <div
                        key={`${product.id}-hero-${index}`}
                        className="product-detail-hero-slide"
                        style={{ width: `${100 / nImages}%` }}
                        aria-hidden={index !== activeImageIndex}
                      >
                        <img
                          src={src}
                          alt={index === 0 ? product.title : ''}
                          loading={index === 0 ? 'eager' : 'lazy'}
                          decoding="async"
                        />
                      </div>
                    ))}
                  </div>
                </div>
                <div className="product-detail-hero-overlay">
                  {showThumbs ? (
                    <>
                      <button
                        type="button"
                        className="product-detail-hero-nav product-detail-hero-nav--prev"
                        aria-label="Previous image"
                        onClick={(e) => {
                          e.stopPropagation()
                          goPrevImage()
                        }}
                      >
                        <svg viewBox="0 0 24 24" className="product-detail-hero-nav-icon" aria-hidden>
                          <path
                            fill="currentColor"
                            d="M15.4 7.4 14 6l-6 6 6 6 1.4-1.4-4.6-4.6 4.6-4.6z"
                          />
                        </svg>
                      </button>
                      <button
                        type="button"
                        className="product-detail-hero-nav product-detail-hero-nav--next"
                        aria-label="Next image"
                        onClick={(e) => {
                          e.stopPropagation()
                          goNextImage()
                        }}
                      >
                        <svg viewBox="0 0 24 24" className="product-detail-hero-nav-icon" aria-hidden>
                          <path
                            fill="currentColor"
                            d="M8.6 7.4 10 6l6 6-6 6-1.4-1.4 4.6-4.6-4.6-4.6z"
                          />
                        </svg>
                      </button>
                    </>
                  ) : null}
                  <button
                    type="button"
                    className="product-detail-hero-zoom"
                    aria-label="View larger image"
                    onClick={(e) => {
                      e.stopPropagation()
                      setLightboxOpen(true)
                    }}
                  >
                    <svg viewBox="0 0 24 24" className="product-detail-hero-zoom-icon" aria-hidden>
                      <path
                        fill="currentColor"
                        d="M15.5 14h-.79l-.28-.27A6.47 6.47 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"
                      />
                      <path fill="currentColor" d="M10 7h-1v3H6v1h3v3h1v-3h3v-1h-3z" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            <div className="product-detail-copy">
              <h1 className="product-detail-title">{product.title}</h1>

              <p className="product-detail-lead">{featuredDescriptions[product.category]}</p>

              {dcRange ? (
                <div className="product-detail-field">
                  <span className="product-detail-label">Design code</span>
                  <span className="product-detail-label-meta">
                    Codes {dcRange.min}–{dcRange.max}
                  </span>
                  <div className="product-detail-design-row">
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      className="product-detail-design-input"
                      aria-invalid={Boolean(designError)}
                      aria-describedby={designError ? 'product-design-error' : undefined}
                      value={designInput}
                      onChange={(e) => {
                        setDesignInput(e.target.value)
                        setDesignError(null)
                      }}
                      onBlur={() => {
                        void tryApplyDesign()
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          void tryApplyDesign()
                        }
                      }}
                    />
                  </div>
                  {designError ? (
                    <p id="product-design-error" className="product-detail-design-error" role="alert">
                      {designError}
                    </p>
                  ) : null}
                </div>
              ) : null}

              <div className="product-detail-field">
                <span className="product-detail-label">Size</span>
                <span className="product-detail-label-meta">{selectedSize || '—'}</span>
                <div className="product-detail-pills" role="group" aria-label="Size">
                  {sizeLabels.map((s) => (
                    <button
                      key={s}
                      type="button"
                      className={`product-detail-pill${s === selectedSize ? ' is-selected' : ''}`}
                      onClick={() => setSelectedSize(s)}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div className="product-detail-field">
                <span className="product-detail-label">Finish</span>
                <span className="product-detail-label-meta">{selectedFinish}</span>
                <div className="product-detail-pills" role="group" aria-label="Finish">
                  {PDP_FINISHES.map((f) => (
                    <button
                      key={f}
                      type="button"
                      className={`product-detail-pill${f === selectedFinish ? ' is-selected' : ''}`}
                      onClick={() => setSelectedFinish(f)}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              <div className="product-detail-field">
                <span className="product-detail-label">Add-ons</span>
                <div className="product-detail-checks" role="group" aria-label="Optional add-ons">
                  <label className={`product-detail-check-option${woodenFrame ? ' is-selected' : ''}`}>
                    <input
                      type="checkbox"
                      className="product-detail-check-input"
                      checked={woodenFrame}
                      onChange={(e) => setWoodenFrame(e.target.checked)}
                    />
                    <span className="product-detail-check-indicator" aria-hidden>
                      <svg viewBox="0 0 24 24">
                        <path
                          fill="currentColor"
                          d="M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z"
                        />
                      </svg>
                    </span>
                    <span className="product-detail-check-copy">
                      <span className="product-detail-check-title">Wooden Frame</span>
                      <span className="product-detail-check-sub">Elegant border frame around the product</span>
                    </span>
                    <span className="product-detail-check-price">
                      + {selectedTier ? formatPriceNoDecimals(selectedTier.wooden) : '—'}
                    </span>
                  </label>
                  <label className={`product-detail-check-option${ledBacklight ? ' is-selected' : ''}`}>
                    <input
                      type="checkbox"
                      className="product-detail-check-input"
                      checked={ledBacklight}
                      onChange={(e) => setLedBacklight(e.target.checked)}
                    />
                    <span className="product-detail-check-indicator" aria-hidden>
                      <svg viewBox="0 0 24 24">
                        <path
                          fill="currentColor"
                          d="M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z"
                        />
                      </svg>
                    </span>
                    <span className="product-detail-check-copy">
                      <span className="product-detail-check-title">LED Backlight</span>
                      <span className="product-detail-check-sub">RGB strip attached behind the product</span>
                    </span>
                    <span className="product-detail-check-price">
                      + {selectedTier ? formatPriceNoDecimals(selectedTier.led) : '—'}
                    </span>
                  </label>
                  <label className={`product-detail-check-option${installation ? ' is-selected' : ''}`}>
                    <input
                      type="checkbox"
                      className="product-detail-check-input"
                      checked={installation}
                      onChange={(e) => setInstallation(e.target.checked)}
                    />
                    <span className="product-detail-check-indicator" aria-hidden>
                      <svg viewBox="0 0 24 24">
                        <path
                          fill="currentColor"
                          d="M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z"
                        />
                      </svg>
                    </span>
                    <span className="product-detail-check-copy">
                      <span className="product-detail-check-title">Installation</span>
                      <span className="product-detail-check-sub">Sit back while we set things up</span>
                    </span>
                    <span className="product-detail-check-price">
                      + {selectedTier ? formatPriceNoDecimals(selectedTier.install) : '—'}
                    </span>
                  </label>
                </div>
              </div>

              <div className="product-detail-field product-detail-field--qty">
                <span className="product-detail-label">Quantity</span>
                <div className="product-detail-qty">
                  <button
                    type="button"
                    className="product-detail-qty-btn"
                    aria-label="Decrease quantity"
                    onClick={() => setQuantity((q) => clampQty(q - 1))}
                  >
                    −
                  </button>
                  <span className="product-detail-qty-value" aria-live="polite">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    className="product-detail-qty-btn"
                    aria-label="Increase quantity"
                    onClick={() => setQuantity((q) => clampQty(q + 1))}
                  >
                    +
                  </button>
                </div>
              </div>

              <p className="product-detail-price">
                {formatPriceNoDecimals(unitPriceWithAddons)}
                {quantity > 1 && unitPriceWithAddons > 0 ? (
                  <span className="product-detail-price-sub"> · {quantity} × subtotal {lineTotalLabel}</span>
                ) : null}
              </p>

              <div className="product-detail-actions">
                <button type="button" className="product-detail-btn product-detail-btn--outline" onClick={() => pushConfiguredLine(false)}>
                  Add to cart
                </button>
                <button type="button" className="product-detail-btn product-detail-btn--primary" onClick={() => pushConfiguredLine(true)}>
                  Buy it now
                </button>
                <a className="product-detail-btn product-detail-btn--whatsapp" href={waInquiry} target="_blank" rel="noopener noreferrer">
                  <span className="product-detail-wa-icon" aria-hidden>
                    <svg viewBox="0 0 24 24" className="product-detail-icon-svg" fill="currentColor">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                    </svg>
                  </span>
                  Order on WhatsApp
                </a>
              </div>

              <p className="product-detail-delivery">
                <span className="product-detail-delivery-icon" aria-hidden>
                  <svg viewBox="0 0 24 24" className="product-detail-icon-svg" fill="currentColor">
                    <path d="M3 6h12v9H3V6zm2 2v5h8V8H5zm10-2h5l2 3v5h-2v2h-2v-2H15V6zm2 2v4h2l-1-1.5V8h-1zm-6 9a2 2 0 1 1 0 4 2 2 0 0 1 0-4zm-8 0a2 2 0 1 1 0 4 2 2 0 0 1 0-4z" />
                  </svg>
                </span>
                <span>
                  Estimated delivery: <strong>{deliveryRange}</strong>
                </span>
              </p>

              <div className="product-detail-support">
                <div className="product-detail-support-inner">
                  <span className="product-detail-support-icon" aria-hidden>
                    {/* Headset graphic from Media/headset-svgrepo-com.svg (SVG Repo) */}
                    <svg viewBox="0 0 24 24" className="product-detail-support-headset" aria-hidden focusable="false">
                      <path
                        fill="currentColor"
                        d="M6,19H4c-2.2,0-4-1.8-4-4v-1c0-2.2,1.8-4,4-4h2c0.6,0,1,0.4,1,1v7C7,18.6,6.6,19,6,19z M4,12c-1.1,0-2,0.9-2,2v1c0,1.1,0.9,2,2,2h1v-5H4z"
                      />
                      <path
                        fill="currentColor"
                        d="M20,19h-2c-0.6,0-1-0.4-1-1v-7c0-0.6,0.4-1,1-1h2c2.2,0,4,1.8,4,4v1C24,17.2,22.2,19,20,19z M19,17h1c1.1,0,2-0.9,2-2v-1c0-1.1-0.9-2-2-2h-1V17z"
                      />
                      <path
                        fill="currentColor"
                        d="M20.9,12.1c-0.1,0-0.1,0-0.2,0c-0.5-0.1-0.9-0.6-0.8-1.1c0-0.3,0.1-0.6,0.1-1c0-4.4-3.6-8-8-8s-8,3.6-8,8c0,0.4,0,0.7,0.1,1c0.1,0.5-0.3,1.1-0.8,1.1c-0.5,0.1-1.1-0.3-1.1-0.8C2,10.9,2,10.5,2,10C2,4.5,6.5,0,12,0s10,4.5,10,10c0,0.5,0,0.9-0.1,1.3C21.8,11.8,21.4,12.1,20.9,12.1z"
                      />
                      <path
                        fill="currentColor"
                        d="M12,24c-2.2,0-3-1.8-3-3s0.8-3,3-3s3,1.8,3,3c0,0.2,0,0.4-0.1,0.6c2.2-0.6,3.7-2,4.5-4c0.2-0.5,0.8-0.8,1.3-0.6c0.5,0.2,0.8,0.8,0.6,1.3C20.3,20.9,17.8,24,12,24z M12,20c-0.8,0-1,0.6-1,1c0,0.4,0.2,1,1,1s1-0.6,1-1C13,20.6,12.8,20,12,20z"
                      />
                    </svg>
                  </span>
                  <div className="product-detail-support-copy">
                    <p className="product-detail-support-title">Any doubt or any question about the products</p>
                    <p className="product-detail-support-text">We are here to help you out</p>
                    <div className="product-detail-support-actions">
                      <a className="mosaic-discover-btn product-detail-support-btn" href={`tel:${storefrontPhoneTel}`}>
                        Call Us
                      </a>
                      <a
                        className="mosaic-discover-btn product-detail-support-btn"
                        href={waInquiry}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        WhatsApp Us
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="product-detail-below-fold">
          <section
            className="product-detail-tabs-section"
            aria-labelledby="product-detail-tabs-label"
          >
            <h2 id="product-detail-tabs-label" className="product-detail-tabs-heading">
              Product details
            </h2>
            <div className="product-detail-tabs" role="tablist" aria-label="Product description and disclaimer">
              <button
                type="button"
                role="tab"
                id="product-tab-description"
                aria-selected={productDetailTab === 'description'}
                aria-controls="product-panel-description"
                className={`product-detail-tab${productDetailTab === 'description' ? ' is-active' : ''}`}
                onClick={() => setProductDetailTab('description')}
              >
                Product description
              </button>
              <button
                type="button"
                role="tab"
                id="product-tab-disclaimer"
                aria-selected={productDetailTab === 'disclaimer'}
                aria-controls="product-panel-disclaimer"
                className={`product-detail-tab${productDetailTab === 'disclaimer' ? ' is-active' : ''}`}
                onClick={() => setProductDetailTab('disclaimer')}
              >
                Disclaimer
              </button>
            </div>
            <div
              id="product-panel-description"
              role="tabpanel"
              aria-labelledby="product-tab-description"
              className="product-detail-tab-panel"
              hidden={productDetailTab !== 'description'}
            >
              <p className="product-detail-tab-intro">{featuredDescriptions[product.category]}</p>
              <ul className="product-detail-spec-list">
                <li>
                  <strong>Material:</strong> Metal
                </li>
                <li>
                  <strong>Thickness:</strong> 16 gauge (1.8 mm)
                </li>
                <li>
                  <strong>Color:</strong> Gold | Black | Silver
                </li>
                <li>
                  <strong>Size:</strong> 6&quot; × 12&quot; | 12&quot; × 18&quot; | 18&quot; × 24&quot;
                </li>
                <li>
                  <strong>Delivery:</strong> Nationwide delivery (typically 3–5 business days)
                </li>
              </ul>
            </div>
            <div
              id="product-panel-disclaimer"
              role="tabpanel"
              aria-labelledby="product-tab-disclaimer"
              className="product-detail-tab-panel"
              hidden={productDetailTab !== 'disclaimer'}
            >
              <ul className="product-detail-disclaimer-list">
                <li>
                  Certain products require a <strong>50% upfront payment</strong> before production begins. If yours
                  does, we will contact you to confirm the order and arrange payment.
                </li>
                <li>
                  We offer a <strong>7-day return policy</strong> on eligible, lower-priced items only. Custom or
                  high-value pieces may be excluded—we will confirm what applies to your order.
                </li>
                <li>
                  <strong>Shipping cost is based on weight.</strong> Add items to your cart and the shipping total
                  updates automatically for your selection.
                </li>
                <li>
                  All pieces are <strong>metal</strong> (laser-cut / fabricated)—not wood or other materials unless
                  explicitly stated.
                </li>
                <li>
                  Photos are a guide only; <strong>finished pieces may differ slightly</strong> from images in lighting,
                  finish, or minor detail.
                </li>
                <li>
                  <strong>Sheet dimensions and usable width</strong> vary by design; we will confirm details that fit
                  your chosen size.
                </li>
                <li>
                  <strong>Optional installation</strong> is available for an additional fee depending on the
                  product. <strong>Mounting screws are not included</strong> with the base product; they can be supplied
                  when installation is booked (extra charge).
                </li>
                <li>
                  For <strong>custom colors or sizes</strong>, reach out—we will confirm feasibility and quote
                  accordingly.
                </li>
                <li>
                  Some intricate designs <strong>cannot be reproduced at the smallest sizes</strong>. If that affects
                  your order, we will contact you to discuss options.
                </li>
                <li>Where LED lighting is included, fixtures use <strong>RGB</strong> LEDs unless noted otherwise.</li>
              </ul>
            </div>
          </section>

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
        </div>

        <OrderDesignContactFooter shopContact={shopContact} demoEmailFieldId="demo-email-pdp" />
      </main>

      {lightboxOpen ? (
        <div
          className="product-detail-lightbox"
          role="dialog"
          aria-modal="true"
          aria-label={`${product.title} — enlarged image`}
          onClick={() => setLightboxOpen(false)}
        >
          <button
            type="button"
            className="product-detail-lightbox-close"
            aria-label="Close"
            onClick={() => setLightboxOpen(false)}
          >
            <svg viewBox="0 0 24 24" className="product-detail-lightbox-close-svg" aria-hidden>
              <path
                fill="currentColor"
                d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"
              />
            </svg>
          </button>
          {showThumbs ? (
            <>
              <button
                type="button"
                className="product-detail-lightbox-nav product-detail-lightbox-nav--prev"
                aria-label="Previous image"
                onClick={(e) => {
                  e.stopPropagation()
                  goPrevImage()
                }}
              >
                <svg viewBox="0 0 24 24" className="product-detail-lightbox-nav-icon" aria-hidden>
                  <path fill="currentColor" d="M15.4 7.4 14 6l-6 6 6 6 1.4-1.4-4.6-4.6 4.6-4.6z" />
                </svg>
              </button>
              <button
                type="button"
                className="product-detail-lightbox-nav product-detail-lightbox-nav--next"
                aria-label="Next image"
                onClick={(e) => {
                  e.stopPropagation()
                  goNextImage()
                }}
              >
                <svg viewBox="0 0 24 24" className="product-detail-lightbox-nav-icon" aria-hidden>
                  <path fill="currentColor" d="M8.6 7.4 10 6l6 6-6 6-1.4-1.4 4.6-4.6-4.6-4.6z" />
                </svg>
              </button>
            </>
          ) : null}
          <div className="product-detail-lightbox-stage" onClick={(e) => e.stopPropagation()}>
            <img src={heroSrc} alt={product.title} decoding="async" fetchPriority="high" />
          </div>
        </div>
      ) : null}
    </>
  )
}
