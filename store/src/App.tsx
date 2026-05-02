import { useEffect, useMemo, useState, type FormEvent, type KeyboardEvent as ReactKeyboardEvent } from 'react'
import { Link, Navigate, Outlet, Route, Routes, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import introVideoUrl from '../../Media/Final Video.mp4?url'
import finalLogoUrl from '../../Media/Final Logo - Copy.png?url'
import sampleImage1 from '../../Media/sample pics/1 (1).jpg?url'
import sampleImage2 from '../../Media/sample pics/1 (2).jpg?url'
import sampleImage3 from '../../Media/sample pics/1 (3).jpg?url'
import sampleImage4 from '../../Media/sample pics/1 (4).jpg?url'
import sampleImage6 from '../../Media/sample pics/1 (6).jpg?url'
import sampleImage7 from '../../Media/sample pics/1 (7).jpg?url'
import catDoors1 from '../../Media/category pics/Doors, Dividers & Gates/doors-dividers-and-gates-01.jpg?url'
import catDoors2 from '../../Media/category pics/Doors, Dividers & Gates/doors-dividers-and-gates-04.jpg?url'
import catDoors3 from '../../Media/category pics/Doors, Dividers & Gates/doors-dividers-and-gates-06.jpg?url'
import catIslamic1 from '../../Media/category pics/Islamic & Decorative Screens/islamic-and-decorative-screens-01.jpg?url'
import catIslamic2 from '../../Media/category pics/Islamic & Decorative Screens/islamic-and-decorative-screens-03.jpg?url'
import catIslamic3 from '../../Media/category pics/Islamic & Decorative Screens/islamic-and-decorative-screens-04.jpg?url'
import catLamps1 from '../../Media/category pics/Lamps & Lighting/lamps-and-lighting-01.jpg?url'
import catLamps2 from '../../Media/category pics/Lamps & Lighting/lamps-and-lighting-02.jpg?url'
import catLamps3 from '../../Media/category pics/Lamps & Lighting/lamps-and-lighting-04.jpg?url'
import catMetal1 from '../../Media/category pics/Metal Arts & Custom Fabrication/metal-arts-and-custom-fabrication-01.jpg?url'
import catMetal2 from '../../Media/category pics/Metal Arts & Custom Fabrication/metal-arts-and-custom-fabrication-03.jpg?url'
import catMetal3 from '../../Media/category pics/Metal Arts & Custom Fabrication/metal-arts-and-custom-fabrication-05.jpg?url'
import catRacks1 from '../../Media/category pics/Racks & Storage/racks-and-storage-01.jpg?url'
import catRacks2 from '../../Media/category pics/Racks & Storage/racks-and-storage-02.jpg?url'
import catRacks3 from '../../Media/category pics/Racks & Storage/racks-and-storage-04.jpg?url'
import catStairs1 from '../../Media/category pics/Stairs & Railings/stairs-and-railings-01.jpg?url'
import catStairs2 from '../../Media/category pics/Stairs & Railings/stairs-and-railings-03.jpg?url'
import catStairs3 from '../../Media/category pics/Stairs & Railings/stairs-and-railings-06.jpg?url'
import catWalls1 from '../../Media/category pics/Walls, Windows & Ceiling Panels/walls-windows-and-ceiling-panels-01.jpg?url'
import catWalls2 from '../../Media/category pics/Walls, Windows & Ceiling Panels/walls-windows-and-ceiling-panels-08.jpg?url'
import catWalls3 from '../../Media/category pics/Walls, Windows & Ceiling Panels/walls-windows-and-ceiling-panels-10.jpg?url'
import { AdminPage } from './AdminPage.tsx'
import { IntroHero } from './IntroHero.tsx'
import { HexagonBackground } from './HexagonBackground.tsx'
import { CartProvider, TopbarCartButton, useCart } from './cart/CartContext.tsx'
import { getEmailFieldError, getPakistanPhoneFieldError } from './lib/contactFormValidation.ts'

const featuredCategories = ['Islamic', 'Artwork', 'Panels', 'Misc'] as const
type FeaturedCategory = (typeof featuredCategories)[number]

type FeaturedItem = {
  id: string
  slug: string
  category: FeaturedCategory
  title: string
  price: string
  images: string[]
}

const categorySlugs: Record<FeaturedCategory, string> = {
  Islamic: 'islamic',
  Artwork: 'artwork',
  Panels: 'panels',
  Misc: 'misc',
}

const slugToCategory = Object.fromEntries(
  Object.entries(categorySlugs).map(([category, slug]) => [slug, category as FeaturedCategory])
) as Record<string, FeaturedCategory>

const featuredItems: FeaturedItem[] = [
  { id: 'islamic-screen-1', slug: 'islamic-geometric-wall-panel', category: 'Islamic', title: 'Islamic Geometric Wall Panel', price: 'Rs. 22,000.00', images: [sampleImage6, sampleImage7] },
  { id: 'islamic-screen-2', slug: 'decorative-islamic-divider', category: 'Islamic', title: 'Decorative Islamic Divider', price: 'Rs. 19,500.00', images: [sampleImage7, sampleImage6] },
  { id: 'artwork-metal-1', slug: 'custom-metal-artwork-circle', category: 'Artwork', title: 'Custom Metal Artwork Circle', price: 'Rs. 16,000.00', images: [sampleImage7, sampleImage1] },
  { id: 'artwork-metal-2', slug: 'abstract-wall-artwork-frame', category: 'Artwork', title: 'Abstract Wall Artwork Frame', price: 'Rs. 18,000.00', images: [sampleImage6, sampleImage2] },
  { id: 'panel-light-1', slug: 'hexagon-ceiling-panel-light', category: 'Panels', title: 'Hexagon Ceiling Panel Light', price: 'Rs. 16,000.00', images: [sampleImage1, sampleImage4] },
  { id: 'panel-light-2', slug: 'square-ring-ceiling-light', category: 'Panels', title: 'Square Ring Ceiling Light', price: 'Rs. 18,000.00', images: [sampleImage4, sampleImage1] },
  { id: 'misc-light-1', slug: 'rectangle-4x1-hanging-light', category: 'Misc', title: 'Rectangle 4x1 Hanging Light', price: 'Rs. 18,000.00', images: [sampleImage2, sampleImage3] },
  { id: 'misc-light-2', slug: 'triangle-hanging-profile-light', category: 'Misc', title: 'Triangle Hanging Profile Light', price: 'Rs. 16,000.00', images: [sampleImage3, sampleImage2] },
]

const featuredDescriptions: Record<FeaturedCategory, string> = {
  Islamic: 'Precision-crafted Islamic patterns and calligraphy-inspired metalwork for modern and traditional spaces.',
  Artwork: 'Statement metal art pieces designed to elevate interiors with custom forms, textures, and finishes.',
  Panels: 'Functional and decorative panel solutions for doors, railings, windows, and architectural facades.',
  Misc: 'Versatile utility builds including racks, shelves, storage systems, and specialized lighting fixtures.',
}

const productDetailSizes = ['12 × 12 in', '18 × 18 in', '24 × 24 in'] as const
const productDetailFinishes = ['Gold', 'Black', 'Silver'] as const
const addonPrice = 1000

const storefrontPhoneTel = '+923082779843'
const storefrontWhatsApp = `https://wa.me/${storefrontPhoneTel.replace(/\D/g, '')}`

function formatEstimatedDeliveryRange() {
  const start = new Date()
  start.setDate(start.getDate() + 3)
  const end = new Date(start)
  end.setDate(end.getDate() + 3)
  const fmt = (d: Date) =>
    d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  return `${fmt(start)} – ${fmt(end)}`
}

const galleryTiles = [
  { id: 'metal-arts-custom-fabrication', title: 'Metal Arts & Custom Fabrication', images: [catMetal1, catMetal2, catMetal3], intervalMs: 3600, className: 'tile-a' },
  { id: 'doors-dividers-gates', title: 'Doors, Dividers & Gates', images: [catDoors1, catDoors2, catDoors3], intervalMs: 2900, className: 'tile-b' },
  { id: 'racks-storage', title: 'Racks & Storage', images: [catRacks1, catRacks2, catRacks3], intervalMs: 4200, className: 'tile-c' },
  { id: 'lamps-lighting', title: 'Lamps & Lighting', images: [catLamps1, catLamps2, catLamps3], intervalMs: 3300, className: 'tile-d' },
  { id: 'stairs-railings', title: 'Stairs & Railings', images: [catStairs1, catStairs2, catStairs3], intervalMs: 2600, className: 'tile-e' },
  { id: 'islamic-decorative-screens', title: 'Islamic & Decorative Screens', images: [catIslamic1, catIslamic2, catIslamic3], intervalMs: 3900, className: 'tile-f' },
  { id: 'walls-windows-ceiling-panels', title: 'Walls, Windows & Ceiling Panels', images: [catWalls1, catWalls2, catWalls3], intervalMs: 3500, className: 'tile-g' },
]

const galleryTileRouteCategory: Record<string, FeaturedCategory> = {
  'metal-arts-custom-fabrication': 'Artwork',
  'doors-dividers-gates': 'Panels',
  'racks-storage': 'Misc',
  'lamps-lighting': 'Misc',
  'stairs-railings': 'Panels',
  'islamic-decorative-screens': 'Islamic',
  'walls-windows-ceiling-panels': 'Panels',
}

function parsePrice(value: string) {
  const numeric = Number(value.replace(/[^0-9.]/g, ''))
  return Number.isFinite(numeric) ? numeric : 0
}

function formatPriceNoDecimals(value: number) {
  return `Rs. ${Math.round(value).toLocaleString()}`
}

/** Shipping per unit by panel size (shown at checkout; COD includes this total). */
function shippingPerUnitForSize(size: string) {
  if (size.startsWith('12')) return 800
  if (size.startsWith('18')) return 1200
  if (size.startsWith('24')) return 1800
  return 1000
}

/** Same-origin on Vercel; optional absolute origin for unusual hosts. */
function placeOrderApiUrl() {
  const raw = typeof import.meta.env.VITE_API_ORIGIN === 'string' ? import.meta.env.VITE_API_ORIGIN.trim() : ''
  const base = raw.replace(/\/$/, '')
  return `${base}/api/place-order`
}

function HomePage() {
  const navigate = useNavigate()
  const [introDone, setIntroDone] = useState(false)
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
  const [featuredImageIndexes, setFeaturedImageIndexes] = useState<Record<string, number>>(Object.fromEntries(featuredItems.map((item) => [item.id, 0])))
  const [featuredStep, setFeaturedStep] = useState(25)

  useEffect(() => {
    if (!introDone) {
      setUiVisible(false)
      setHeroCopyVisible(false)
      return
    }
    const firstTick = window.setTimeout(() => setHeroCopyVisible(true), 70)
    const secondTick = window.setTimeout(() => setUiVisible(true), 180)
    return () => {
      window.clearTimeout(firstTick)
      window.clearTimeout(secondTick)
    }
  }, [introDone])

  useEffect(() => {
    const timers = galleryTiles.map((tile) =>
      window.setInterval(() => {
        setGalleryIndexes((prev) => ({ ...prev, [tile.id]: ((prev[tile.id] ?? 0) + 1) % tile.images.length }))
      }, tile.intervalMs)
    )
    return () => timers.forEach((timer) => window.clearInterval(timer))
  }, [])

  useEffect(() => {
    const timers = featuredCategories.map((category, categoryIndex) =>
      window.setInterval(() => {
        const categoryItems = featuredItems.filter((item) => item.category === category)
        if (categoryItems.length <= 1) return
        setFeaturedIndexes((prev) => ({ ...prev, [category]: (prev[category] + 1) % categoryItems.length }))
      }, 3000 + categoryIndex * 280)
    )
    return () => timers.forEach((timer) => window.clearInterval(timer))
  }, [])

  useEffect(() => {
    const timer = window.setInterval(() => {
      setFeaturedImageIndexes((prev) =>
        Object.fromEntries(featuredItems.map((item) => [item.id, ((prev[item.id] ?? 0) + 1) % item.images.length]))
      )
    }, 2600)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    const updateFeaturedStep = () => {
      if (window.innerWidth <= 680) return setFeaturedStep(100)
      if (window.innerWidth <= 980) return setFeaturedStep(50)
      setFeaturedStep(25)
    }
    updateFeaturedStep()
    window.addEventListener('resize', updateFeaturedStep)
    return () => window.removeEventListener('resize', updateFeaturedStep)
  }, [])

  const scrollToSection = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  const goToProducts = () => navigate('/products')
  const showPreviousFeatured = (category: FeaturedCategory) => {
    const categoryItems = featuredItems.filter((item) => item.category === category)
    setFeaturedIndexes((prev) => ({ ...prev, [category]: (prev[category] - 1 + categoryItems.length) % Math.max(categoryItems.length, 1) }))
  }
  const showNextFeatured = (category: FeaturedCategory) => {
    const categoryItems = featuredItems.filter((item) => item.category === category)
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
      {introDone && (
        <header className={`topbar ${uiVisible ? 'visible' : ''}`}>
          <div className="topbar-inner">
            <button type="button" className="brand-logo-btn" onClick={() => scrollToSection('home')}>
              <img src={finalLogoUrl} alt="BarqMech" className="brand-logo-img" width={240} height={72} />
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

      <IntroHero videoSrc={introVideoUrl} introDone={introDone} onIntroEnded={() => setIntroDone(true)} playbackRate={1.5} endTrimSeconds={1} revealLeadSeconds={2}>
        <div className={`video-overlay ${heroCopyVisible ? 'visible' : ''}`}>
          <p className="overlay-copy overlay-left">Waves of change with<br /><span className="overlay-brand-chrome">BARQMECH</span></p>
          <div className="overlay-right">
            <p className="overlay-copy overlay-right-message">Explore our range of<br />crafted metal and<br />architectural products<br /></p>
            <button type="button" className="hero-view-btn" onClick={goToProducts}>View shop</button>
          </div>
        </div>
      </IntroHero>

      <div className="hero-below-fade" aria-hidden />

      {introDone && <section className={`mobile-copy ${uiVisible ? 'visible' : ''}`}><p className="mobile-line mobile-line-headline">Waves of change with<br /><span className="overlay-brand-chrome">BARQMECH</span></p><p className="mobile-line">Explore our range of crafted metal and<br />architectural products.</p><button type="button" className="hero-view-btn" onClick={goToProducts}>View shop</button></section>}

      {introDone && (
        <main className={`site-content ${uiVisible ? 'visible' : ''}`}>
          <section className="categories-section" id="collections"><div className="section-head"><h2>Product Categories</h2><p>Browse our core metal cutting capabilities below.</p></div></section>
          <section className="mosaic-section" aria-label="Category image gallery"><div className="mosaic-grid">{galleryTiles.map((tile) => {const activeIndex = galleryIndexes[tile.id] ?? 0; const targetCategory = galleryTileRouteCategory[tile.id]; return <article key={tile.id} className={`mosaic-tile ${tile.className}`}><div className="mosaic-image-stack">{tile.images.map((image, index) => <img key={`${tile.id}-${image}`} src={image} alt={tile.title} className={`mosaic-image ${index === activeIndex ? 'active' : ''}`} loading="lazy" />)}</div><div className="mosaic-overlay"><h3>{tile.title}</h3><Link to={`/products?category=${categorySlugs[targetCategory]}`} className="mosaic-discover-btn">Discover</Link></div></article>})}</div></section>

          <section className="product-grid-section" id="shop">
            {featuredCategories.map((category) => {
              const categoryItems = featuredItems.filter((item) => item.category === category)
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
                                {item.images.map((image, imageIndex) => <img key={`${item.id}-${image}`} src={image} alt={item.title} className={`featured-image ${imageIndex === (featuredImageIndexes[item.id] ?? 0) ? 'active' : ''}`} loading="lazy" />)}
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

          <section className="confidence-section" aria-label="Customer confidence highlights">
            <div className="confidence-title-row"><span className="confidence-line" aria-hidden /><h3>Buy with Confidence</h3><span className="confidence-line" aria-hidden /></div>
            <div className="confidence-grid">
              <article className="confidence-item"><span className="confidence-icon" aria-hidden><svg viewBox="0 0 24 24" className="confidence-icon-svg"><path d="M1 5h11v8h2.2l2.8-3.5H23V17h-2.2a2.8 2.8 0 0 1-5.6 0H8.8a2.8 2.8 0 0 1-5.6 0H1V5zm2 2v8h.2a2.8 2.8 0 0 1 5.6 0H10V7H3zm14.1 4L15.5 13H14v2h1.2a2.8 2.8 0 0 1 5.6 0H21v-4h-3.9zM6 15.6a1.4 1.4 0 1 0 0 2.8 1.4 1.4 0 0 0 0-2.8zm12 0a1.4 1.4 0 1 0 0 2.8 1.4 1.4 0 0 0 0-2.8z" /></svg></span><h4>Fast Shipping</h4><p>Order by 2pm PST and we&apos;ll ship your order the very next day!</p></article>
              <article className="confidence-item"><span className="confidence-icon" aria-hidden><svg viewBox="0 0 24 24" className="confidence-icon-svg"><path d="M12 3a8 8 0 0 0-8 8v5a3 3 0 0 0 3 3h2v-7H6v-1a6 6 0 1 1 12 0v1h-3v7h2a3 3 0 0 0 3-3v-5a8 8 0 0 0-8-8z" /></svg></span><h4>Support 24/7</h4><p>Our team is available 24 hours a day, 7 days a week to help you quickly.</p></article>
              <article className="confidence-item confidence-about"><img src={finalLogoUrl} alt="BarqMech logo" className="confidence-about-logo" /><h4>About Us</h4><p>Elevating spaces through metal mastery. Barqmech delivers high-precision laser cutting and custom fabrication where innovation meets craftsmanship.</p></article>
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

function useShopContactDemo() {
  const [demoPromptOpen, setDemoPromptOpen] = useState(false)
  const [demoEmail, setDemoEmail] = useState('')
  const [demoSubmitting, setDemoSubmitting] = useState(false)
  const [demoStatus, setDemoStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [contactSubmitting, setContactSubmitting] = useState(false)
  const [contactStatus, setContactStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [contactFieldErrors, setContactFieldErrors] = useState<{ email?: string; phone?: string }>({})

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

  return {
    demoPromptOpen,
    setDemoPromptOpen,
    demoEmail,
    setDemoEmail,
    demoSubmitting,
    demoStatus,
    contactSubmitting,
    contactStatus,
    contactFieldErrors,
    handleContactSubmit,
    openCalendly,
  }
}

type ShopContactDemo = ReturnType<typeof useShopContactDemo>

function OrderDesignContactFooter({
  shopContact,
  demoEmailFieldId,
}: {
  shopContact: ShopContactDemo
  demoEmailFieldId: string
}) {
  const {
    demoPromptOpen,
    setDemoPromptOpen,
    demoEmail,
    setDemoEmail,
    demoSubmitting,
    demoStatus,
    contactSubmitting,
    contactStatus,
    contactFieldErrors,
    handleContactSubmit,
    openCalendly,
  } = shopContact

  return (
    <>
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
            <h3>Send Us a Message</h3>
            <p>Fill out the form below and we&apos;ll get back to you as soon as possible.</p>
            <form className="contact-form" onSubmit={handleContactSubmit}>
              <label>
                Name *
                <input type="text" name="name" placeholder="Your name" required />
              </label>
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
              <label>
                Message *
                <textarea name="message" placeholder="Tell us about your project or inquiry..." rows={6} required />
              </label>
              <button type="submit" className="contact-send-btn" disabled={contactSubmitting}>
                {contactSubmitting ? 'Sending...' : 'Send Message'}
              </button>
              {contactStatus && <p className={`contact-status ${contactStatus.type}`}>{contactStatus.message}</p>}
            </form>
          </div>
          <div className="contact-info-col contact-info-card">
            <div className="contact-info-header">
              <h3>Contact Information</h3>
              <p>Prefer to reach out directly? Here&apos;s how you can contact us.</p>
            </div>
            <div className="contact-info-links-grid">
              <div className="contact-info-item">
                <span className="contact-info-icon" aria-hidden>
                  <svg viewBox="0 0 24 24" className="contact-info-icon-svg">
                    <path d="M3 6h18v12H3V6zm2 2v.35L12 12.8l7-4.45V8H5zm14 8v-5.3l-7 4.45-7-4.45V16h14z" />
                  </svg>
                </span>
                <div>
                  <p>Email</p>
                  <a href="mailto:derpflag@gmail.com">derpflag@gmail.com</a>
                </div>
              </div>
              <div className="contact-info-item">
                <span className="contact-info-icon" aria-hidden>
                  <svg viewBox="0 0 24 24" className="contact-info-icon-svg">
                    <path d="M6.62 10.79a15.05 15.05 0 0 0 6.59 6.59l2.2-2.2a1 1 0 0 1 1-.24c1.12.37 2.33.57 3.59.57a1 1 0 0 1 1 1V20a1 1 0 0 1-1 1C10.3 21 3 13.7 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.26.2 2.47.57 3.59a1 1 0 0 1-.24 1l-2.21 2.2z" />
                  </svg>
                </span>
                <div>
                  <p>Phone</p>
                  <a href="tel:+923082779843">+92 308 2779843</a>
                </div>
              </div>
              <div className="contact-info-item">
                <span className="contact-info-icon" aria-hidden>
                  <svg viewBox="0 0 24 24" className="contact-info-icon-svg">
                    <path d="M7.5 2h9A5.5 5.5 0 0 1 22 7.5v9a5.5 5.5 0 0 1-5.5 5.5h-9A5.5 5.5 0 0 1 2 16.5v-9A5.5 5.5 0 0 1 7.5 2zm0 2A3.5 3.5 0 0 0 4 7.5v9A3.5 3.5 0 0 0 7.5 20h9a3.5 3.5 0 0 0 3.5-3.5v-9A3.5 3.5 0 0 0 16.5 4h-9zm10.75 1.5a1.25 1.25 0 1 1 0 2.5 1.25 1.25 0 0 1 0-2.5zM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10zm0 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6z" />
                  </svg>
                </span>
                <div>
                  <p>Instagram</p>
                  <a href="https://instagram.com/" target="_blank" rel="noopener noreferrer">
                    Follow on Instagram
                  </a>
                </div>
              </div>
              <div className="contact-info-item">
                <span className="contact-info-icon" aria-hidden>
                  <svg viewBox="0 0 24 24" className="contact-info-icon-svg">
                    <path d="M13 22v-8h3l.5-4H13V7.5c0-1.15.33-1.9 1.98-1.9H16.7V2.1c-.3-.04-1.34-.1-2.55-.1-2.53 0-4.26 1.55-4.26 4.4V10H7v4h2.9v8H13z" />
                  </svg>
                </span>
                <div>
                  <p>Facebook</p>
                  <a href="https://facebook.com/" target="_blank" rel="noopener noreferrer">
                    Visit Facebook Page
                  </a>
                </div>
              </div>
              <div className="contact-info-item">
                <span className="contact-info-icon" aria-hidden>
                  <svg viewBox="0 0 24 24" className="contact-info-icon-svg">
                    <path d="M23 12.02c0-.78-.08-1.57-.26-2.33a3.06 3.06 0 0 0-2.16-2.17C18.72 7 12 7 12 7s-6.72 0-8.58.52A3.06 3.06 0 0 0 1.26 9.7C1.08 10.45 1 11.24 1 12.02c0 .78.08 1.57.26 2.33a3.06 3.06 0 0 0 2.16 2.17C5.28 17 12 17 12 17s6.72 0 8.58-.52a3.06 3.06 0 0 0 2.16-2.17c.18-.76.26-1.55.26-2.33zM10 14.5v-5l4.5 2.5-4.5 2.5z" />
                  </svg>
                </span>
                <div>
                  <p>YouTube</p>
                  <a href="https://youtube.com/" target="_blank" rel="noopener noreferrer">
                    Watch on YouTube
                  </a>
                </div>
              </div>
              <div className="contact-info-item">
                <span className="contact-info-icon" aria-hidden>
                  <svg viewBox="0 0 24 24" className="contact-info-icon-svg">
                    <path d="M20.52 3.48A11.9 11.9 0 0 0 12.03 0C5.41 0 .03 5.38.03 12c0 2.11.55 4.17 1.6 5.99L0 24l6.17-1.62A11.94 11.94 0 0 0 12.03 24c6.62 0 12-5.38 12-12 0-3.2-1.25-6.2-3.51-8.52zM12.03 21.96a9.94 9.94 0 0 1-5.08-1.39l-.36-.21-3.66.96.98-3.57-.24-.37A9.93 9.93 0 0 1 2.03 12c0-5.51 4.49-10 10-10 2.67 0 5.18 1.04 7.07 2.93A9.93 9.93 0 0 1 22.03 12c0 5.51-4.49 9.96-10 9.96zm5.46-7.46c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.66.15-.2.3-.77.97-.95 1.16-.17.2-.35.22-.65.07-.3-.15-1.28-.47-2.43-1.5-.9-.8-1.5-1.79-1.67-2.09-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.66-.5h-.57c-.2 0-.52.08-.8.37-.27.3-1.04 1.02-1.04 2.5 0 1.47 1.07 2.9 1.22 3.1.15.2 2.1 3.2 5.08 4.49.71.3 1.26.48 1.69.61.71.22 1.35.19 1.86.11.57-.08 1.76-.72 2-1.41.25-.7.25-1.29.17-1.41-.07-.12-.27-.2-.57-.35z" />
                  </svg>
                </span>
                <div>
                  <p>WhatsApp</p>
                  <a href="https://wa.me/923082779843" target="_blank" rel="noopener noreferrer">
                    Chat on WhatsApp
                  </a>
                </div>
              </div>
            </div>
            <div className="contact-info-box">
              <h4>Ready to Get Started?</h4>
              <p>
                At BarqMech, we design and fabricate premium metal solutions that elevate commercial and residential
                spaces. From custom gates and railings to decorative panels and lighting structures, we deliver quality
                craftsmanship built to last.
              </p>
            </div>
            <div className="contact-info-box">
              <h4>Response Time</h4>
              <p>
                We typically respond to inquiries within 2-5 hours during business days. For urgent matters, please
                call us directly.
              </p>
            </div>
            <button type="button" className="book-demo-btn" onClick={() => setDemoPromptOpen((v) => !v)}>
              Book a Demo
            </button>
            {demoPromptOpen && (
              <div className="demo-prompt">
                <label htmlFor={demoEmailFieldId}>Work Email</label>
                <input
                  id={demoEmailFieldId}
                  type="email"
                  value={demoEmail}
                  onChange={(e) => setDemoEmail(e.target.value)}
                  placeholder="you@company.com"
                />
                <button type="button" onClick={openCalendly} disabled={demoSubmitting}>
                  {demoSubmitting ? 'Verifying Email...' : 'Continue to Calendly'}
                </button>
                {demoStatus && <p className={`contact-status ${demoStatus.type}`}>{demoStatus.message}</p>}
              </div>
            )}
          </div>
        </div>
      </section>

      <footer className="site-footer">
        <p>© {new Date().getFullYear()} BarqMech. All rights reserved.</p>
        <p>Built with innovation in mind.</p>
      </footer>
    </>
  )
}

function ProductsPage() {
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
  const [productImageIndexes, setProductImageIndexes] = useState<Record<string, number>>(
    Object.fromEntries(featuredItems.map((item) => [item.id, 0]))
  )

  const filteredProducts = featuredItems.filter((item) => {
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
    const timer = window.setInterval(() => {
      setProductImageIndexes((prev) =>
        Object.fromEntries(
          featuredItems.map((item) => [item.id, ((prev[item.id] ?? 0) + 1) % item.images.length])
        )
      )
    }, 2600)
    return () => window.clearInterval(timer)
  }, [])

  const scrollToSection = (id: string) =>
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })

  return (
    <>
      <header className="topbar visible">
        <div className="topbar-inner">
          <Link to="/" className="brand-logo-btn">
            <img src={finalLogoUrl} alt="BarqMech" className="brand-logo-img" width={240} height={72} />
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
                      />
                    ))}
                  </div>
                  <h3>{item.title}</h3>
                  <p>{formatPriceNoDecimals(parsePrice(item.price))}</p>
                </Link>
              ))}
            </div>
            <div className="products-pagination">
              <button type="button" className="featured-arrow" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>‹</button>
              <span>Page {page} / {totalPages}</span>
              <button type="button" className="featured-arrow" onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>›</button>
            </div>
          </div>
        </section>

        <section className="confidence-section" aria-label="Customer confidence highlights">
          <div className="confidence-title-row"><span className="confidence-line" aria-hidden /><h3>Buy with Confidence</h3><span className="confidence-line" aria-hidden /></div>
          <div className="confidence-grid">
            <article className="confidence-item"><span className="confidence-icon" aria-hidden><svg viewBox="0 0 24 24" className="confidence-icon-svg"><path d="M1 5h11v8h2.2l2.8-3.5H23V17h-2.2a2.8 2.8 0 0 1-5.6 0H8.8a2.8 2.8 0 0 1-5.6 0H1V5zm2 2v8h.2a2.8 2.8 0 0 1 5.6 0H10V7H3zm14.1 4L15.5 13H14v2h1.2a2.8 2.8 0 0 1 5.6 0H21v-4h-3.9zM6 15.6a1.4 1.4 0 1 0 0 2.8 1.4 1.4 0 0 0 0-2.8zm12 0a1.4 1.4 0 1 0 0 2.8 1.4 1.4 0 0 0 0-2.8z" /></svg></span><h4>Fast Shipping</h4><p>Order by 2pm PST and we&apos;ll ship your order the very next day!</p></article>
            <article className="confidence-item"><span className="confidence-icon" aria-hidden><svg viewBox="0 0 24 24" className="confidence-icon-svg"><path d="M12 3a8 8 0 0 0-8 8v5a3 3 0 0 0 3 3h2v-7H6v-1a6 6 0 1 1 12 0v1h-3v7h2a3 3 0 0 0 3-3v-5a8 8 0 0 0-8-8z" /></svg></span><h4>Support 24/7</h4><p>Our team is available 24 hours a day, 7 days a week to help you quickly.</p></article>
            <article className="confidence-item confidence-about"><img src={finalLogoUrl} alt="BarqMech logo" className="confidence-about-logo" /><h4>About Us</h4><p>Elevating spaces through metal mastery. Barqmech delivers high-precision laser cutting and custom fabrication where innovation meets craftsmanship.</p></article>
          </div>
        </section>

        <OrderDesignContactFooter shopContact={shopContact} demoEmailFieldId="demo-email-products" />
      </main>
    </>
  )
}

function ProductPage() {
  const { addToCart, openDrawer } = useCart()
  const navigate = useNavigate()
  const { categorySlug, productSlug } = useParams()
  const [searchQuery, setSearchQuery] = useState('')
  const [activeImageIndex, setActiveImageIndex] = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [productDetailTab, setProductDetailTab] = useState<'description' | 'disclaimer'>('description')
  const [selectedSize, setSelectedSize] = useState<string>(productDetailSizes[0])
  const [selectedFinish, setSelectedFinish] = useState<string>(productDetailFinishes[0])
  const [woodenFrame, setWoodenFrame] = useState(false)
  const [ledBacklight, setLedBacklight] = useState(false)
  const [installation, setInstallation] = useState(false)
  const [quantity, setQuantity] = useState(1)
  const shopContact = useShopContactDemo()

  const category = categorySlug ? slugToCategory[categorySlug] : undefined
  const product =
    category && productSlug
      ? featuredItems.find((item) => item.category === category && item.slug === productSlug)
      : undefined

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

  if (!category || !productSlug) return <Navigate to="/" replace />
  if (!product) return <Navigate to={`/products?category=${categorySlug}`} replace />

  const productsCategoryHref = `/products?category=${categorySlug}`
  const basePrice = parsePrice(product.price)
  const selectedAddonCount = Number(woodenFrame) + Number(ledBacklight) + Number(installation)
  const unitPriceWithAddons = basePrice + selectedAddonCount * addonPrice
  const lineTotal = unitPriceWithAddons * quantity
  const lineTotalLabel = lineTotal > 0 ? formatPriceNoDecimals(lineTotal) : formatPriceNoDecimals(basePrice)

  const deliveryRange = formatEstimatedDeliveryRange()

  const orderLines = [
    `Product: ${product.title}`,
    `Category: ${category}`,
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

  const clampQty = (n: number) => Math.min(99, Math.max(1, n))

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

  return (
    <>
      <header className="topbar visible">
        <div className="topbar-inner">
          <Link to="/" className="brand-logo-btn">
            <img src={finalLogoUrl} alt="BarqMech" className="brand-logo-img" width={240} height={72} />
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
              <Link to="/">Home</Link><span className="products-crumb-sep" aria-hidden>/</span><Link to="/products">Products</Link><span className="products-crumb-sep" aria-hidden>/</span><Link to={productsCategoryHref}>{category}</Link><span className="products-crumb-sep" aria-hidden>/</span><span className="products-crumb-current">{product.title}</span>
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
                        <img src={src} alt="" />
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
                        <img src={src} alt={index === 0 ? product.title : ''} />
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

              <p className="product-detail-lead">{featuredDescriptions[category]}</p>

              <div className="product-detail-field">
                <span className="product-detail-label">Size</span>
                <span className="product-detail-label-meta">{selectedSize}</span>
                <div className="product-detail-pills" role="group" aria-label="Size">
                  {productDetailSizes.map((s) => (
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
                  {productDetailFinishes.map((f) => (
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
                    <span className="product-detail-check-price">+ Rs. 1,000</span>
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
                    <span className="product-detail-check-price">+ Rs. 1,000</span>
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
                    <span className="product-detail-check-price">+ Rs. 1,000</span>
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
                <button
                  type="button"
                  className="product-detail-btn product-detail-btn--outline"
                  onClick={() => {
                    addToCart({
                      productId: product.id,
                      slug: product.slug,
                      categorySlug: categorySlug!,
                      title: product.title,
                      imageUrl: heroSrc,
                      priceLabel: formatPriceNoDecimals(unitPriceWithAddons),
                      unitPrice: unitPriceWithAddons,
                      quantity,
                      size: selectedSize,
                      finish: selectedFinish,
                      woodenFrame,
                      ledBacklight,
                      installation,
                    })
                    openDrawer()
                  }}
                >
                  Add to cart
                </button>
                <button
                  type="button"
                  className="product-detail-btn product-detail-btn--primary"
                  onClick={() => {
                    addToCart({
                      productId: product.id,
                      slug: product.slug,
                      categorySlug: categorySlug!,
                      title: product.title,
                      imageUrl: heroSrc,
                      priceLabel: formatPriceNoDecimals(unitPriceWithAddons),
                      unitPrice: unitPriceWithAddons,
                      quantity,
                      size: selectedSize,
                      finish: selectedFinish,
                      woodenFrame,
                      ledBacklight,
                      installation,
                    })
                    navigate('/checkout')
                  }}
                >
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
              <p className="product-detail-tab-intro">{featuredDescriptions[category]}</p>
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
                <img src={finalLogoUrl} alt="BarqMech logo" className="confidence-about-logo" />
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
            <img src={heroSrc} alt={product.title} />
          </div>
        </div>
      ) : null}
    </>
  )
}

function CheckoutPage() {
  const navigate = useNavigate()
  const { lines, subtotal, setLineQuantity, removeLine, clearCart } = useCart()
  const shopContact = useShopContactDemo()
  const [searchQuery, setSearchQuery] = useState('')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [addressLine1, setAddressLine1] = useState('')
  const [city, setCity] = useState('')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [emailFieldError, setEmailFieldError] = useState<string | null>(null)
  const [phoneFieldError, setPhoneFieldError] = useState<string | null>(null)

  const shippingByLine = useMemo(
    () => lines.map((l) => ({ line: l, shipUnit: shippingPerUnitForSize(l.size), lineShip: shippingPerUnitForSize(l.size) * l.quantity })),
    [lines]
  )

  const shippingTotal = useMemo(() => shippingByLine.reduce((s, row) => s + row.lineShip, 0), [shippingByLine])
  const grandTotal = subtotal + shippingTotal

  const scrollToSection = (id: string) =>
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (lines.length === 0) return
    const name = fullName.trim()
    const mail = email.trim()
    const tel = phone.trim()
    const addr = addressLine1.trim()
    const c = city.trim()
    setSubmitError(null)
    const mailErr = getEmailFieldError(mail)
    const telErr = getPakistanPhoneFieldError(tel)
    setEmailFieldError(mailErr ?? null)
    setPhoneFieldError(telErr ?? null)
    if (mailErr || telErr) return
    if (!name) {
      setSubmitError('Please enter your full name.')
      return
    }
    if (!addr) {
      setSubmitError('Please enter your street address.')
      return
    }
    setEmailFieldError(null)
    setPhoneFieldError(null)
    setSubmitting(true)
    const payloadLines = lines.map((l) => ({
      mergeKey: l.mergeKey,
      productId: l.productId,
      slug: l.slug,
      categorySlug: l.categorySlug,
      title: l.title,
      imageUrl: l.imageUrl,
      unitPrice: l.unitPrice,
      quantity: l.quantity,
      size: l.size,
      finish: l.finish,
      woodenFrame: Boolean(l.woodenFrame),
      ledBacklight: Boolean(l.ledBacklight),
      installation: Boolean(l.installation),
    }))
    try {
      const res = await fetch(placeOrderApiUrl(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          origin: typeof window !== 'undefined' ? window.location.origin : '',
          customer: {
            name,
            email: mail,
            phone: tel,
            addressLine1: addr,
            city: c,
            notes: notes.trim(),
          },
          lines: payloadLines,
          subtotal,
          shippingTotal,
          grandTotal,
        }),
      })
      const data = (await res.json().catch(() => ({}))) as { orderCode?: string; error?: string }
      if (!res.ok) {
        setSubmitting(false)
        setSubmitError(typeof data.error === 'string' ? data.error : 'Could not place order')
        return
      }
      if (!data.orderCode) {
        setSubmitting(false)
        setSubmitError('Invalid response from server')
        return
      }
      clearCart()
      navigate(`/checkout/success?code=${encodeURIComponent(data.orderCode)}`, {
        replace: true,
        state: {
          customerEmail: mail,
          grandTotal,
          subtotal,
          shippingTotal,
        },
      })
    } catch {
      setSubmitting(false)
      setSubmitError('Network error — check your connection or try again.')
    }
  }

  const checkoutMain = (
    <>
      <div className="products-crumb-row">
        <p className="products-crumb">
          <Link to="/">Home</Link>
          {' / '}
          <Link to="/products">Products</Link>
          {' / '}
          <span>Checkout</span>
        </p>
        <button type="button" className="products-prev-btn" onClick={() => navigate(-1)}>
          ← Back
        </button>
      </div>

      {lines.length === 0 ? (
        <div className="checkout-empty checkout-panel">
          <h1 className="checkout-heading">Your cart is empty</h1>
          <p>Add products before checking out.</p>
          <Link to="/products" className="mosaic-discover-btn">
            Browse products
          </Link>
        </div>
      ) : null}

      {lines.length > 0 ? (
        <>
          <h1 className="checkout-heading">Checkout</h1>
          <p className="checkout-lead">Review your items, shipping by size, and your details. Pay by cash on delivery when your order arrives.</p>
          <div className="checkout-layout">
            <section className="checkout-panel" aria-labelledby="checkout-summary-title">
              <h2 id="checkout-summary-title" className="checkout-panel-title">
                Order summary
              </h2>
              {lines.map((line) => (
                <div key={line.mergeKey} className="checkout-line">
                  <Link to={`/products/${line.categorySlug}/${line.slug}`} className="checkout-line-img-wrap">
                    <img src={line.imageUrl} alt="" className="checkout-line-img" />
                  </Link>
                  <div className="checkout-line-body">
                    <Link to={`/products/${line.categorySlug}/${line.slug}`} className="checkout-line-title">
                      {line.title}
                    </Link>
                    <p className="checkout-line-meta">
                      Size {line.size} · {line.finish} · Frame {line.woodenFrame ? 'Yes' : 'No'} · LED{' '}
                      {line.ledBacklight ? 'Yes' : 'No'} · Install {line.installation ? 'Yes' : 'No'}
                    </p>
                    <div className="checkout-line-row">
                      <div className="cart-drawer-qty">
                        <button
                          type="button"
                          className="cart-drawer-qty-btn"
                          aria-label="Decrease quantity"
                          onClick={() => setLineQuantity(line.mergeKey, line.quantity - 1)}
                          disabled={line.quantity <= 1}
                        >
                          −
                        </button>
                        <span className="cart-drawer-qty-val">{line.quantity}</span>
                        <button
                          type="button"
                          className="cart-drawer-qty-btn"
                          aria-label="Increase quantity"
                          onClick={() => setLineQuantity(line.mergeKey, line.quantity + 1)}
                          disabled={line.quantity >= 99}
                        >
                          +
                        </button>
                      </div>
                      <span className="checkout-line-price">{formatPriceNoDecimals(line.unitPrice * line.quantity)}</span>
                    </div>
                    <button type="button" className="cart-drawer-remove" onClick={() => removeLine(line.mergeKey)}>
                      Remove
                    </button>
                  </div>
                </div>
              ))}
              <div className="checkout-totals">
                <div className="checkout-total-row">
                  <span>Subtotal</span>
                  <strong>{formatPriceNoDecimals(subtotal)}</strong>
                </div>
                <div className="checkout-total-row">
                  <span>Shipping (by size)</span>
                  <strong>{formatPriceNoDecimals(shippingTotal)}</strong>
                </div>
                <p className="checkout-shipping-note">
                  Shipping is estimated per unit by panel size (12 in: {formatPriceNoDecimals(shippingPerUnitForSize('12 × 12 in'))}, 18
                  in: {formatPriceNoDecimals(shippingPerUnitForSize('18 × 18 in'))}, 24 in:{' '}
                  {formatPriceNoDecimals(shippingPerUnitForSize('24 × 24 in'))} each). Included in your COD total.
                </p>
                <div className="checkout-total-row checkout-total-row--grand">
                  <span>Total (COD)</span>
                  <strong>{formatPriceNoDecimals(grandTotal)}</strong>
                </div>
              </div>
            </section>

            <section className="checkout-panel" aria-labelledby="checkout-details-title">
              <h2 id="checkout-details-title" className="checkout-panel-title">
                Details &amp; payment
              </h2>
              <form className="checkout-form-grid" onSubmit={handleSubmit}>
                <label>
                  Full name *
                  <input type="text" name="fullName" autoComplete="name" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
                </label>
                <label>
                  Email *
                  <input type="email" name="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                  {emailFieldError ? (
                    <span className="form-field-error" role="alert">
                      {emailFieldError}
                    </span>
                  ) : null}
                </label>
                <label>
                  Phone *
                  <input
                    type="tel"
                    name="phone"
                    autoComplete="tel"
                    placeholder="03XX XXXXXXX or +92…"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                  />
                  {phoneFieldError ? (
                    <span className="form-field-error" role="alert">
                      {phoneFieldError}
                    </span>
                  ) : null}
                </label>
                <label>
                  Street address *
                  <input type="text" name="address" autoComplete="street-address" value={addressLine1} onChange={(e) => setAddressLine1(e.target.value)} required />
                </label>
                <label>
                  City
                  <input type="text" name="city" autoComplete="address-level2" value={city} onChange={(e) => setCity(e.target.value)} />
                </label>
                <label>
                  Order notes (optional)
                  <textarea name="notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Delivery instructions, gate code, etc." />
                </label>
                <div className="checkout-cod-card">
                  <p className="checkout-cod-title">Cash on delivery</p>
                  <p className="checkout-cod-text">
                    Pay <strong>{formatPriceNoDecimals(grandTotal)}</strong> when your order arrives (products + shipping).
                  </p>
                </div>
                {submitError ? (
                  <p className="checkout-submit-error" role="alert">
                    {submitError}
                  </p>
                ) : null}
                <button type="submit" className="checkout-submit-btn" disabled={submitting}>
                  {submitting ? 'Placing order…' : 'Place order'}
                </button>
              </form>
            </section>
          </div>
        </>
      ) : null}

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
            <img src={finalLogoUrl} alt="BarqMech logo" className="confidence-about-logo" />
            <h4>About Us</h4>
            <p>
              Elevating spaces through metal mastery. Barqmech delivers high-precision laser cutting and custom fabrication where
              innovation meets craftsmanship.
            </p>
          </article>
        </div>
      </section>

      <OrderDesignContactFooter shopContact={shopContact} demoEmailFieldId="demo-email-checkout" />
    </>
  )

  return (
    <>
      <header className="topbar visible">
        <div className="topbar-inner">
          <Link to="/" className="brand-logo-btn">
            <img src={finalLogoUrl} alt="BarqMech" className="brand-logo-img" width={240} height={72} />
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
            <button type="button" className="topbar-nav-link" onClick={() => scrollToSection('order-design')}>
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
          </nav>
        </div>
      </header>

      <main className="shop-route-page products-page checkout-page">{checkoutMain}</main>
    </>
  )
}

type CheckoutSuccessState = {
  customerEmail?: string
  grandTotal?: number
  subtotal?: number
  shippingTotal?: number
}

function CheckoutSuccessPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const location = useLocation()
  const code = params.get('code')?.trim() ?? ''
  const successState = (location.state as CheckoutSuccessState | null) ?? {}
  const customerEmail =
    typeof successState.customerEmail === 'string' ? successState.customerEmail.trim() : ''
  const grandTotal =
    typeof successState.grandTotal === 'number' && Number.isFinite(successState.grandTotal) ? successState.grandTotal : null
  const subtotalOk =
    typeof successState.subtotal === 'number' && Number.isFinite(successState.subtotal) ? successState.subtotal : null
  const shippingOk =
    typeof successState.shippingTotal === 'number' && Number.isFinite(successState.shippingTotal)
      ? successState.shippingTotal
      : null
  const [searchQuery, setSearchQuery] = useState('')
  const validCode = /^\d{6}$/.test(code)

  return (
    <>
      <header className="topbar visible">
        <div className="topbar-inner">
          <Link to="/" className="brand-logo-btn">
            <img src={finalLogoUrl} alt="BarqMech" className="brand-logo-img" width={240} height={72} />
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
          </nav>
        </div>
      </header>
      <main className="shop-route-page products-page checkout-page">
        <div className="products-crumb-row">
          <p className="products-crumb">
            <Link to="/">Home</Link>
            {' / '}
            <Link to="/checkout">Checkout</Link>
            {' / '}
            <span>Confirmed</span>
          </p>
        </div>
        {validCode ? (
          <div className="checkout-success checkout-panel">
            <h1 className="checkout-heading">Thank you for your order</h1>
            <p className="checkout-success-lead">
              We&apos;re grateful you chose BarqMech. Your order is confirmed and our team will begin preparing it for you.
            </p>
            <p>
              Your order code is <strong className="checkout-order-code">{code}</strong>. Keep it handy for any follow-up.
              {customerEmail ? (
                <>
                  {' '}
                  We&apos;ve sent a detailed confirmation to <strong>{customerEmail}</strong>.
                </>
              ) : (
                <> A confirmation email is on its way.</>
              )}
            </p>
            {grandTotal != null ? (
              <div className="checkout-success-cod-card" role="region" aria-label="Payment summary">
                <p className="checkout-success-cod-label">Amount due when your order arrives</p>
                <p className="checkout-success-cod-amount">{formatPriceNoDecimals(grandTotal)}</p>
                {subtotalOk != null && shippingOk != null ? (
                  <p className="checkout-success-cod-breakdown">
                    Products {formatPriceNoDecimals(subtotalOk)} + shipping {formatPriceNoDecimals(shippingOk)} (cash on
                    delivery — nothing charged online).
                  </p>
                ) : (
                  <p className="checkout-success-cod-breakdown">
                    Cash on delivery: please have this total ready for the courier. No payment is taken on the website.
                  </p>
                )}
              </div>
            ) : (
              <p className="checkout-shipping-note">
                Cash on delivery: you&apos;ll pay when your order arrives. Check your email for the full total and line
                items.
              </p>
            )}
            <p className="checkout-success-outro">
              We&apos;d love to welcome you back soon — browse new pieces anytime, and tell friends if you enjoyed the
              experience.
            </p>
            <div className="checkout-success-actions">
              <Link to="/products" className="mosaic-discover-btn">
                Continue shopping
              </Link>
              <Link to="/" className="product-detail-btn product-detail-btn--outline">
                Home
              </Link>
            </div>
          </div>
        ) : (
          <div className="checkout-empty checkout-panel">
            <h1 className="checkout-heading">Order link incomplete</h1>
            <p>Use the link from your confirmation email, or return to checkout.</p>
            <Link to="/checkout" className="mosaic-discover-btn">
              Checkout
            </Link>
          </div>
        )}
      </main>
    </>
  )
}

function ShopLayout() {
  return (
    <HexagonBackground hexagonSize={74} hexagonMargin={3}>
      <CartProvider>
        <Outlet />
      </CartProvider>
    </HexagonBackground>
  )
}

export default function App() {
  const location = useLocation()
  useEffect(() => {
    if (location.pathname.startsWith('/admin')) return
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [location.pathname])
  return (
    <Routes>
      <Route path="/admin" element={<AdminPage />} />
      <Route element={<ShopLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/products/:categorySlug/:productSlug" element={<ProductPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/checkout/success" element={<CheckoutSuccessPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
