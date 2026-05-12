import { useCallback, useEffect, useLayoutEffect, useRef, useState, startTransition, type FormEvent } from 'react'
import { lazy, Suspense } from 'react'
import { Link, Navigate, Outlet, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import {
  categorySlugs,
  featuredCategories,
  featuredDescriptions,
  finalLogoUrl,
  galleryTileRouteCategory,
  galleryTiles,
  introVideoUrl,
  type FeaturedCategory,
} from './data/catalog.ts'
import { CatalogProvider, useCatalogProducts } from './catalog/CatalogProvider.tsx'
import { IntroHero } from './IntroHero.tsx'
import { HexagonBackground } from './HexagonBackground.tsx'
import { CartProvider, TopbarCartButton } from './cart/CartContext.tsx'
import { getEmailFieldError, getPakistanPhoneFieldError } from './lib/contactFormValidation.ts'

const ProductsPage = lazy(() => import('./routes/ProductsRoute.tsx'))
const ProductPage = lazy(() => import('./routes/ProductRoute.tsx'))
const CheckoutPage = lazy(() => import('./routes/CheckoutRoute.tsx'))
const CheckoutSuccessPage = lazy(() => import('./routes/CheckoutSuccessRoute.tsx'))
const AdminPageLazy = lazy(() => import('./AdminPage.tsx').then((m) => ({ default: m.AdminPage })))

function HomePage() {
  const products = useCatalogProducts()
  const navigate = useNavigate()
  const [introDone, setIntroDone] = useState(false)
  /** True ~2s before the intro video ends — mount chrome + start fades while video still plays. */
  const [introLeadReveal, setIntroLeadReveal] = useState(false)
  /** Mount heavy `<main>` after the first post-reveal paint so layout does not hitch the intro canvas. */
  const [deferredMainReady, setDeferredMainReady] = useState(false)
  /** Carousel / resize effects only when `<main>` is mounted (or intro fully ended). */
  const homeEffectsReady = introDone || (introLeadReveal && deferredMainReady)

  const [heroCopyVisible, setHeroCopyVisible] = useState(false)
  const [uiVisible, setUiVisible] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [demoPromptOpen, setDemoPromptOpen] = useState(false)
  const [demoEmail, setDemoEmail] = useState('')
  const [demoSubmitting, setDemoSubmitting] = useState(false)
  const [demoStatus, setDemoStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [contactSubmitting, setContactSubmitting] = useState(false)
  const [contactStatus, setContactStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [contactFieldErrors, setContactFieldErrors] = useState<{ email?: string; phone?: string }>({})
  const [galleryIndexes, setGalleryIndexes] = useState<Record<string, number>>(Object.fromEntries(galleryTiles.map((tile) => [tile.id, 0])))
  const [featuredIndexes, setFeaturedIndexes] = useState<Record<FeaturedCategory, number>>({ Islamic: 0, Artwork: 0, Panels: 0, Misc: 0 })
  const [featuredImageIndexes, setFeaturedImageIndexes] = useState<Record<string, number>>({})
  const [featuredStep, setFeaturedStep] = useState(25)

  /** Mosaic + featured blocks: pause carousel timers until near viewport (saves work while intro / hero fills screen). */
  const retailCarouselRootRef = useRef<HTMLDivElement>(null)
  const [retailCarouselInView, setRetailCarouselInView] = useState(false)
  const carouselEngaged = homeEffectsReady && retailCarouselInView

  const scheduleDeferredMainPaint = useCallback(() => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        startTransition(() => {
          setDeferredMainReady(true)
        })
      })
    })
  }, [])

  const handleIntroEnded = useCallback(() => setIntroDone(true), [])
  const handleLeadReveal = useCallback(() => {
    setIntroLeadReveal(true)
    setHeroCopyVisible(true)
    document.body.classList.remove('intro-playing')
    window.setTimeout(() => setUiVisible(true), 100)
    scheduleDeferredMainPaint()
  }, [scheduleDeferredMainPaint])

  useEffect(() => {
    if (introDone) setDeferredMainReady(true)
  }, [introDone])

  /** After the video ends: ensure overlay + page chrome are visible (lead reveal usually did this earlier). */
  useEffect(() => {
    if (!introDone) return
    const firstTick = window.setTimeout(() => setHeroCopyVisible((v) => v || true), 40)
    const secondTick = window.setTimeout(() => setUiVisible((v) => v || true), 120)
    return () => {
      window.clearTimeout(firstTick)
      window.clearTimeout(secondTick)
    }
  }, [introDone])

  useEffect(() => {
    if (!carouselEngaged) return
    const timers = galleryTiles.map((tile) =>
      window.setInterval(() => {
        const len = tile.images.length
        if (len <= 0) return
        setGalleryIndexes((prev) => ({ ...prev, [tile.id]: ((prev[tile.id] ?? 0) + 1) % len }))
      }, tile.intervalMs)
    )
    return () => timers.forEach((timer) => window.clearInterval(timer))
  }, [carouselEngaged])

  useEffect(() => {
    if (!homeEffectsReady) return
    setFeaturedImageIndexes((prev) => {
      const next = { ...prev }
      for (const p of products) {
        if (next[p.id] === undefined) next[p.id] = 0
      }
      return next
    })
  }, [homeEffectsReady, products])

  useEffect(() => {
    if (!carouselEngaged) return
    const timers = featuredCategories.map((category, categoryIndex) =>
      window.setInterval(() => {
        const categoryItems = products.filter((item) => item.category === category)
        if (categoryItems.length <= 1) return
        setFeaturedIndexes((prev) => ({ ...prev, [category]: (prev[category] + 1) % categoryItems.length }))
      }, 3000 + categoryIndex * 280)
    )
    return () => timers.forEach((timer) => window.clearInterval(timer))
  }, [carouselEngaged, products])

  useEffect(() => {
    if (!carouselEngaged || products.length === 0) return
    const timer = window.setInterval(() => {
      setFeaturedImageIndexes((prev) =>
        Object.fromEntries(
          products.map((item) => [item.id, ((prev[item.id] ?? 0) + 1) % Math.max(item.images.length, 1)])
        )
      )
    }, 2600)
    return () => window.clearInterval(timer)
  }, [carouselEngaged, products])

  useEffect(() => {
    if (!homeEffectsReady) return
    const updateFeaturedStep = () => {
      if (window.innerWidth <= 680) return setFeaturedStep(100)
      if (window.innerWidth <= 980) return setFeaturedStep(50)
      setFeaturedStep(25)
    }
    updateFeaturedStep()
    window.addEventListener('resize', updateFeaturedStep)
    return () => window.removeEventListener('resize', updateFeaturedStep)
  }, [homeEffectsReady])

  useLayoutEffect(() => {
    if (!homeEffectsReady) {
      setRetailCarouselInView(false)
      return
    }
    const el = retailCarouselRootRef.current
    if (!el) return
    const io = new IntersectionObserver(
      ([entry]) => {
        setRetailCarouselInView(entry.isIntersecting)
      },
      { threshold: 0, rootMargin: '12% 0px 45% 0px' },
    )
    io.observe(el)
    return () => {
      io.disconnect()
      setRetailCarouselInView(false)
    }
  }, [homeEffectsReady])

  const scrollToSection = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  const goToProducts = () => navigate('/products')
  const showPreviousFeatured = (category: FeaturedCategory) => {
    const categoryItems = products.filter((item) => item.category === category)
    setFeaturedIndexes((prev) => ({ ...prev, [category]: (prev[category] - 1 + categoryItems.length) % Math.max(categoryItems.length, 1) }))
  }
  const showNextFeatured = (category: FeaturedCategory) => {
    const categoryItems = products.filter((item) => item.category === category)
    setFeaturedIndexes((prev) => ({ ...prev, [category]: (prev[category] + 1) % Math.max(categoryItems.length, 1) }))
  }

  const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    scrollToSection('shop')
  }

  const openCalendly = () => {
    const run = async () => {
      if (demoSubmitting) return
      const normalized = demoEmail.trim()
      const emailErr = getEmailFieldError(normalized)
      if (emailErr) return setDemoStatus({ type: 'error', message: emailErr })
      setDemoSubmitting(true)
      setDemoStatus(null)
      try {
        const response = await fetch('/api/validate-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: normalized }),
        })
        const result = (await response.json().catch(() => ({}))) as { error?: string }
        if (!response.ok) throw new Error(result.error || 'Email verification failed.')
        const calendlyUrl = `https://calendly.com/derpflag/30min?email=${encodeURIComponent(normalized)}`
        window.open(calendlyUrl, '_blank', 'noopener,noreferrer')
        setDemoStatus({ type: 'success', message: 'Opening Calendly...' })
        setDemoPromptOpen(false)
      } catch (error) {
        setDemoStatus({ type: 'error', message: error instanceof Error ? error.message : 'Email verification failed.' })
      } finally {
        setDemoSubmitting(false)
      }
    }
    void run()
  }

  const handleContactSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (contactSubmitting) return
    const form = event.currentTarget
    const formData = new FormData(form)
    const name = String(formData.get('name') ?? '').trim()
    const email = String(formData.get('email') ?? '').trim()
    const subject = String(formData.get('subject') ?? '').trim()
    const message = String(formData.get('message') ?? '').trim()
    const emailErr = getEmailFieldError(email)
    const phoneErr = getPakistanPhoneFieldError(subject)
    setContactFieldErrors({
      ...(emailErr ? { email: emailErr } : {}),
      ...(phoneErr ? { phone: phoneErr } : {}),
    })
    if (emailErr || phoneErr) {
      setContactStatus(null)
      return
    }
    if (!name.trim() || !message.trim()) {
      setContactStatus({ type: 'error', message: 'Please fill in your name and message.' })
      return
    }
    setContactSubmitting(true)
    setContactStatus(null)
    setContactFieldErrors({})
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          subject,
          message,
          origin: typeof window !== 'undefined' ? window.location.origin : '',
        }),
      })
      const result = (await response.json().catch(() => ({}))) as { error?: string }
      if (!response.ok) throw new Error(result.error || 'Failed to send message.')
      form.reset()
      setContactFieldErrors({})
      setContactStatus({ type: 'success', message: 'Message sent successfully. We will get back to you soon.' })
    } catch (error) {
      setContactFieldErrors({})
      setContactStatus({ type: 'error', message: error instanceof Error ? error.message : 'Failed to send message.' })
    } finally {
      setContactSubmitting(false)
    }
  }

  return (
    <>
      {(introLeadReveal || introDone) && (
        <header className={`topbar ${uiVisible ? 'visible' : ''}`}>
          <div className="topbar-inner">
            <button type="button" className="brand-logo-btn" onClick={() => scrollToSection('home')}>
              <img
                src={finalLogoUrl}
                alt="BarqMech"
                className="brand-logo-img"
                width={240}
                height={72}
                decoding="async"
                loading="lazy"
                fetchPriority="low"
              />
              <span className="brand-title">BARQMECH</span>
            </button>
            <form className="topbar-search" role="search" onSubmit={handleSearchSubmit}>
              <input type="search" name="q" className="topbar-search-input" placeholder="Search products…" autoComplete="off" aria-label="Search products" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
              <span className="topbar-search-icon" aria-hidden><svg viewBox="0 0 24 24" className="nav-icon-svg"><path d="M10.5 3a7.5 7.5 0 0 1 5.95 12.08l4.24 4.24-1.42 1.42-4.24-4.24A7.5 7.5 0 1 1 10.5 3zm0 2a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11z" /></svg></span>
            </form>
            <nav className="topbar-actions" aria-label="Primary">
              <button type="button" className="topbar-nav-link" onClick={goToProducts}><span className="nav-icon" aria-hidden><svg viewBox="0 0 24 24" className="nav-icon-svg"><path d="M7 8V7a5 5 0 0 1 10 0v1h3v13H4V8h3zm2 0h6V7a3 3 0 0 0-6 0v1zm-3 2v9h12v-9H6z" /></svg></span><span className="nav-label">Shop</span></button>
              <button type="button" className="topbar-nav-link" onClick={() => scrollToSection('order-design')}><span className="nav-icon" aria-hidden><svg viewBox="0 0 24 24" className="nav-icon-svg"><path d="M3 6h18v12H3V6zm2 2v.35L12 12.8l7-4.45V8H5zm14 8v-5.3l-7 4.45-7-4.45V16h14z" /></svg></span><span className="nav-label">Contact</span></button>
              <button type="button" className="topbar-nav-link" aria-label="Account" title="Sign-in (coming soon)"><span className="nav-icon" aria-hidden><svg viewBox="0 0 24 24" className="nav-icon-svg"><path d="M12 3a5 5 0 1 1 0 10 5 5 0 0 1 0-10zm0 12c4.42 0 8 2.01 8 4.5V21H4v-1.5C4 17.01 7.58 15 12 15z" /></svg></span><span className="nav-label">Account</span></button>
              <TopbarCartButton />
            </nav>
          </div>
        </header>
      )}

      <IntroHero
        videoSrc={introVideoUrl}
        introDone={introDone}
        onIntroEnded={handleIntroEnded}
        onLeadReveal={handleLeadReveal}
        playbackRate={1.5}
        revealLeadSeconds={2}
        endTrimSeconds={1.5}
      >
        <div className={`video-overlay ${heroCopyVisible ? 'visible' : ''}`}>
          <p className="overlay-copy overlay-left">Waves of change with<br /><span className="overlay-brand-chrome">BARQMECH</span></p>
          <div className="overlay-right">
            <p className="overlay-copy overlay-right-message">Explore our range of<br />crafted metal and<br />architectural products<br /></p>
            <button type="button" className="hero-view-btn" onClick={goToProducts}>View shop</button>
          </div>
        </div>
      </IntroHero>

      <div className="hero-below-fade" aria-hidden />

      {(introDone || (introLeadReveal && deferredMainReady)) && (
        <section className={`mobile-copy ${uiVisible ? 'visible' : ''}`}>
          <p className="mobile-line mobile-line-headline">
            Waves of change with<br />
            <span className="overlay-brand-chrome">BARQMECH</span>
          </p>
          <p className="mobile-line">Explore our range of crafted metal and<br />architectural products.</p>
          <button type="button" className="hero-view-btn" onClick={goToProducts}>
            View shop
          </button>
        </section>
      )}

      {(introDone || (introLeadReveal && deferredMainReady)) && (
        <main className={`site-content ${uiVisible ? 'visible' : ''}`}>
          <section className="categories-section" id="collections"><div className="section-head"><h2>Product Categories</h2><p>Browse our core metal cutting capabilities below.</p></div></section>
          <div ref={retailCarouselRootRef} className="home-retail-carousel-root">
          <section className="mosaic-section" aria-label="Category image gallery"><div className="mosaic-grid">{galleryTiles.map((tile) => {const activeIndex = galleryIndexes[tile.id] ?? 0; const targetCategory = galleryTileRouteCategory[tile.id]; return <article key={tile.id} className={`mosaic-tile ${tile.className}`}><div className="mosaic-image-stack">{tile.images.map((image, index) => <img key={`${tile.id}-${image}`} src={image} alt={tile.title} className={`mosaic-image ${index === activeIndex ? 'active' : ''}`} loading="lazy" decoding="async" />)}</div><div className="mosaic-overlay"><h3>{tile.title}</h3><Link to={`/products?category=${categorySlugs[targetCategory]}`} className="mosaic-discover-btn">Discover</Link></div></article>})}</div></section>

          <section className="product-grid-section" id="shop">
            {featuredCategories.map((category) => {
              const categoryItems = products.filter((item) => item.category === category)
              const loopItems = [...categoryItems, ...categoryItems]
              const startIndex = featuredIndexes[category] ?? 0
              const categoryPath = `/products?category=${categorySlugs[category]}`
              return (
                <div key={category} className="featured-block">
                  <h3 className="featured-block-title"><Link to={categoryPath} className="featured-route-link">{category}</Link></h3>
                  <p className="featured-block-description">{featuredDescriptions[category]}</p>
                  <div className="featured-carousel">
                    <button type="button" className="featured-arrow left" aria-label={`Previous ${category} products`} onClick={() => showPreviousFeatured(category)}>&#8249;</button>
                    <div className="featured-viewport">
                      <div className="featured-track" style={{ transform: `translateX(-${startIndex * featuredStep}%)` }}>
                        {loopItems.map((item, index) => (
                          <article key={`${item.id}-${category}-${index}`} className="featured-card">
                            <Link to={`/products/${categorySlugs[category]}/${item.slug}`} className="featured-card-link">
                              <div className="featured-image-stack">
                                {item.images.map((image, imageIndex) => <img key={`${item.id}-${image}`} src={image} alt={item.title} className={`featured-image ${imageIndex === (featuredImageIndexes[item.id] ?? 0) ? 'active' : ''}`} loading="lazy" decoding="async" />)}
                              </div>
                              <h3>{item.title}</h3>
                              <p className="featured-price">{item.price}</p>
                            </Link>
                          </article>
                        ))}
                      </div>
                    </div>
                    <button type="button" className="featured-arrow right" aria-label={`Next ${category} products`} onClick={() => showNextFeatured(category)}>&#8250;</button>
                  </div>
                  <div className="featured-shop-more-wrap"><Link to={categoryPath} className="mosaic-discover-btn featured-shop-more-btn">Shop more</Link></div>
                </div>
              )
            })}
          </section>
          </div>

          <section className="confidence-section" aria-label="Customer confidence highlights">
            <div className="confidence-title-row"><span className="confidence-line" aria-hidden /><h3>Buy with Confidence</h3><span className="confidence-line" aria-hidden /></div>
            <div className="confidence-grid">
              <article className="confidence-item"><span className="confidence-icon" aria-hidden><svg viewBox="0 0 24 24" className="confidence-icon-svg"><path d="M1 5h11v8h2.2l2.8-3.5H23V17h-2.2a2.8 2.8 0 0 1-5.6 0H8.8a2.8 2.8 0 0 1-5.6 0H1V5zm2 2v8h.2a2.8 2.8 0 0 1 5.6 0H10V7H3zm14.1 4L15.5 13H14v2h1.2a2.8 2.8 0 0 1 5.6 0H21v-4h-3.9zM6 15.6a1.4 1.4 0 1 0 0 2.8 1.4 1.4 0 0 0 0-2.8zm12 0a1.4 1.4 0 1 0 0 2.8 1.4 1.4 0 0 0 0-2.8z" /></svg></span><h4>Fast Shipping</h4><p>Order by 2pm PST and we&apos;ll ship your order the very next day!</p></article>
              <article className="confidence-item"><span className="confidence-icon" aria-hidden><svg viewBox="0 0 24 24" className="confidence-icon-svg"><path d="M12 3a8 8 0 0 0-8 8v5a3 3 0 0 0 3 3h2v-7H6v-1a6 6 0 1 1 12 0v1h-3v7h2a3 3 0 0 0 3-3v-5a8 8 0 0 0-8-8z" /></svg></span><h4>Support 24/7</h4><p>Our team is available 24 hours a day, 7 days a week to help you quickly.</p></article>
              <article className="confidence-item confidence-about"><img src={finalLogoUrl} alt="BarqMech logo" className="confidence-about-logo" loading="lazy" decoding="async" /><h4>About Us</h4><p>Elevating spaces through metal mastery. Barqmech delivers high-precision laser cutting and custom fabrication where innovation meets craftsmanship.</p></article>
            </div>
      </section>

          <section className="confidence-section order-design-heading-section" id="order-design" aria-label="Order custom design heading">
            <div className="confidence-title-row">
              <span className="confidence-line" aria-hidden />
              <h3>Order Your Custom Design</h3>
              <span className="confidence-line" aria-hidden />
            </div>
          </section>

          <section className="contact-section" id="contact">
            <div className="contact-grid">
              <div className="contact-form-card">
                <h3>Send Us a Message</h3><p>Fill out the form below and we&apos;ll get back to you as soon as possible.</p>
                <form className="contact-form" onSubmit={handleContactSubmit}>
                  <label>Name *<input type="text" name="name" placeholder="Your name" required /></label>
                  <label>
                    Email *
                    <input type="email" name="email" placeholder="your@email.com" required />
                    {contactFieldErrors.email ? (
                      <span className="form-field-error" role="alert">
                        {contactFieldErrors.email}
                      </span>
                    ) : null}
                  </label>
                  <label>
                    Contact *
                    <input type="tel" name="subject" placeholder="03XX XXXXXXX or +92…" required />
                    {contactFieldErrors.phone ? (
                      <span className="form-field-error" role="alert">
                        {contactFieldErrors.phone}
                      </span>
                    ) : null}
                  </label>
                  <label>Message *<textarea name="message" placeholder="Tell us about your project or inquiry..." rows={6} required /></label>
                  <button type="submit" className="contact-send-btn" disabled={contactSubmitting}>{contactSubmitting ? 'Sending...' : 'Send Message'}</button>
                  {contactStatus && <p className={`contact-status ${contactStatus.type}`}>{contactStatus.message}</p>}
                </form>
              </div>
              <div className="contact-info-col contact-info-card">
                <div className="contact-info-header"><h3>Contact Information</h3><p>Prefer to reach out directly? Here&apos;s how you can contact us.</p></div>
                <div className="contact-info-links-grid">
                  <div className="contact-info-item"><span className="contact-info-icon" aria-hidden><svg viewBox="0 0 24 24" className="contact-info-icon-svg"><path d="M3 6h18v12H3V6zm2 2v.35L12 12.8l7-4.45V8H5zm14 8v-5.3l-7 4.45-7-4.45V16h14z" /></svg></span><div><p>Email</p><a href="mailto:derpflag@gmail.com">derpflag@gmail.com</a></div></div>
                  <div className="contact-info-item"><span className="contact-info-icon" aria-hidden><svg viewBox="0 0 24 24" className="contact-info-icon-svg"><path d="M6.62 10.79a15.05 15.05 0 0 0 6.59 6.59l2.2-2.2a1 1 0 0 1 1-.24c1.12.37 2.33.57 3.59.57a1 1 0 0 1 1 1V20a1 1 0 0 1-1 1C10.3 21 3 13.7 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.26.2 2.47.57 3.59a1 1 0 0 1-.24 1l-2.21 2.2z" /></svg></span><div><p>Phone</p><a href="tel:+923082779843">+92 308 2779843</a></div></div>
                  <div className="contact-info-item"><span className="contact-info-icon" aria-hidden><svg viewBox="0 0 24 24" className="contact-info-icon-svg"><path d="M7.5 2h9A5.5 5.5 0 0 1 22 7.5v9a5.5 5.5 0 0 1-5.5 5.5h-9A5.5 5.5 0 0 1 2 16.5v-9A5.5 5.5 0 0 1 7.5 2zm0 2A3.5 3.5 0 0 0 4 7.5v9A3.5 3.5 0 0 0 7.5 20h9a3.5 3.5 0 0 0 3.5-3.5v-9A3.5 3.5 0 0 0 16.5 4h-9zm10.75 1.5a1.25 1.25 0 1 1 0 2.5 1.25 1.25 0 0 1 0-2.5zM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10zm0 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6z" /></svg></span><div><p>Instagram</p><a href="https://instagram.com/" target="_blank" rel="noopener noreferrer">Follow on Instagram</a></div></div>
                  <div className="contact-info-item"><span className="contact-info-icon" aria-hidden><svg viewBox="0 0 24 24" className="contact-info-icon-svg"><path d="M13 22v-8h3l.5-4H13V7.5c0-1.15.33-1.9 1.98-1.9H16.7V2.1c-.3-.04-1.34-.1-2.55-.1-2.53 0-4.26 1.55-4.26 4.4V10H7v4h2.9v8H13z" /></svg></span><div><p>Facebook</p><a href="https://facebook.com/" target="_blank" rel="noopener noreferrer">Visit Facebook Page</a></div></div>
                  <div className="contact-info-item"><span className="contact-info-icon" aria-hidden><svg viewBox="0 0 24 24" className="contact-info-icon-svg"><path d="M23 12.02c0-.78-.08-1.57-.26-2.33a3.06 3.06 0 0 0-2.16-2.17C18.72 7 12 7 12 7s-6.72 0-8.58.52A3.06 3.06 0 0 0 1.26 9.7C1.08 10.45 1 11.24 1 12.02c0 .78.08 1.57.26 2.33a3.06 3.06 0 0 0 2.16 2.17C5.28 17 12 17 12 17s6.72 0 8.58-.52a3.06 3.06 0 0 0 2.16-2.17c.18-.76.26-1.55.26-2.33zM10 14.5v-5l4.5 2.5-4.5 2.5z" /></svg></span><div><p>YouTube</p><a href="https://youtube.com/" target="_blank" rel="noopener noreferrer">Watch on YouTube</a></div></div>
                  <div className="contact-info-item"><span className="contact-info-icon" aria-hidden><svg viewBox="0 0 24 24" className="contact-info-icon-svg"><path d="M20.52 3.48A11.9 11.9 0 0 0 12.03 0C5.41 0 .03 5.38.03 12c0 2.11.55 4.17 1.6 5.99L0 24l6.17-1.62A11.94 11.94 0 0 0 12.03 24c6.62 0 12-5.38 12-12 0-3.2-1.25-6.2-3.51-8.52zM12.03 21.96a9.94 9.94 0 0 1-5.08-1.39l-.36-.21-3.66.96.98-3.57-.24-.37A9.93 9.93 0 0 1 2.03 12c0-5.51 4.49-10 10-10 2.67 0 5.18 1.04 7.07 2.93A9.93 9.93 0 0 1 22.03 12c0 5.51-4.49 9.96-10 9.96zm5.46-7.46c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.66.15-.2.3-.77.97-.95 1.16-.17.2-.35.22-.65.07-.3-.15-1.28-.47-2.43-1.5-.9-.8-1.5-1.79-1.67-2.09-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.66-.5h-.57c-.2 0-.52.08-.8.37-.27.3-1.04 1.02-1.04 2.5 0 1.47 1.07 2.9 1.22 3.1.15.2 2.1 3.2 5.08 4.49.71.3 1.26.48 1.69.61.71.22 1.35.19 1.86.11.57-.08 1.76-.72 2-1.41.25-.7.25-1.29.17-1.41-.07-.12-.27-.2-.57-.35z" /></svg></span><div><p>WhatsApp</p><a href="https://wa.me/923082779843" target="_blank" rel="noopener noreferrer">Chat on WhatsApp</a></div></div>
                </div>
                <div className="contact-info-box"><h4>Ready to Get Started?</h4><p>At BarqMech, we design and fabricate premium metal solutions that elevate commercial and residential spaces. From custom gates and railings to decorative panels and lighting structures, we deliver quality craftsmanship built to last.</p></div>
                <div className="contact-info-box"><h4>Response Time</h4><p>We typically respond to inquiries within 2-5 hours during business days. For urgent matters, please call us directly.</p></div>
                <button type="button" className="book-demo-btn" onClick={() => setDemoPromptOpen((v) => !v)}>Book a Demo</button>
                {demoPromptOpen && <div className="demo-prompt"><label htmlFor="demo-email">Work Email</label><input id="demo-email" type="email" value={demoEmail} onChange={(e) => setDemoEmail(e.target.value)} placeholder="you@company.com" /><button type="button" onClick={openCalendly} disabled={demoSubmitting}>{demoSubmitting ? 'Verifying Email...' : 'Continue to Calendly'}</button>{demoStatus && <p className={`contact-status ${demoStatus.type}`}>{demoStatus.message}</p>}</div>}
        </div>
        </div>
      </section>

          <footer className="site-footer"><p>© {new Date().getFullYear()} BarqMech. All rights reserved.</p><p>Built with innovation in mind.</p></footer>
        </main>
      )}
    </>
  )
}

function ShopLayout() {
  return (
    <HexagonBackground hexagonSize={74} hexagonMargin={3}>
      <CatalogProvider>
        <CartProvider>
          <Outlet />
        </CartProvider>
      </CatalogProvider>
    </HexagonBackground>
  )
}

function RouteFallback() {
  return null
}

export default function App() {
  const location = useLocation()
  useEffect(() => {
    if (location.pathname.startsWith('/admin')) return
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [location.pathname])
  return (
    <Routes>
      <Route
        path="/admin"
        element={
          <Suspense fallback={<RouteFallback />}>
            <AdminPageLazy />
          </Suspense>
        }
      />
      <Route element={<ShopLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route
          path="/products"
          element={
            <Suspense fallback={<RouteFallback />}>
              <ProductsPage />
            </Suspense>
          }
        />
        <Route
          path="/products/:categorySlug/:productSlug"
          element={
            <Suspense fallback={<RouteFallback />}>
              <ProductPage />
            </Suspense>
          }
        />
        <Route
          path="/checkout"
          element={
            <Suspense fallback={<RouteFallback />}>
              <CheckoutPage />
            </Suspense>
          }
        />
        <Route
          path="/checkout/success"
          element={
            <Suspense fallback={<RouteFallback />}>
              <CheckoutSuccessPage />
            </Suspense>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
