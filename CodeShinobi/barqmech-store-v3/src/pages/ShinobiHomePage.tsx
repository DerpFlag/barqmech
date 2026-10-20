import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { localImageSet } from '../data/responsiveMedia.ts'
import { CollectionVideo } from '../components/CollectionVideo.tsx'
import { MosaicSlideshow } from '../components/MosaicSlideshow.tsx'
import { CatalogPricingAlert } from '@store/catalog/CatalogPricingAlert.tsx'
import { useCatalog } from '../catalog/CatalogProvider.tsx'
import {
  categorySlugs,
  collectionVideos,
  featuredCategories,
  galleryTileRouteCategory,
  galleryTiles,
  storefrontEmail,
  storefrontPhoneTel,
  storefrontPhoneDisplay,
  storefrontWhatsApp,
  type FeaturedCategory,
} from '../data/catalog.ts'
import { getEmailFieldError, getPakistanPhoneFieldError } from '@store/lib/contactFormValidation.ts'
import { isGmailValidationError } from '@store/lib/gmailEmail.ts'
import { shuffleHomeFeaturedByCategory } from '@store/lib/shuffleHomeFeatured.ts'
import type { CatalogProduct } from '@store/catalog/types.ts'
import { ProductThumb } from '../components/ProductThumb.tsx'
import { FinishPreview } from '../components/FinishPreview.tsx'
import { CurvedRibbon, ScrollInk } from '../components/StudioMotion.tsx'
import { LiquidImageReveal } from '../components/LiquidImageReveal.tsx'
import { useHomeSections } from '../components/useHomeSections.ts'

const SPACE_PREVIEW_FILES = ['metal-arts-and-custom-fabrication-06', 'doors-dividers-and-gates-01', 'racks-and-storage-01', 'lamps-and-lighting-03', 'stairs-and-railings-02', 'islamic-and-decorative-screens-01', 'walls-windows-and-ceiling-panels-09']
// Mosaic slots: stairs and doors exchange positions; source galleries stay intact.
const SPACE_TILE_ORDER = [0, 4, 2, 3, 1, 5, 6]
const SPACE_TILE_WIDTHS = [55, 25, 20, 25, 35, 20, 20]
const spaceTileSizes = (slot: number) => `(max-width:767px) ${slot === 0 ? 'calc(100vw - 40px)' : 'calc((100vw - 50px) / 2)'}, ${SPACE_TILE_WIDTHS[slot]}vw`
// Keep gallery props stable when only the current chapter/category changes.
const SPACE_TILES = SPACE_TILE_ORDER.map((sourceIndex, slot) => {
  const tile = galleryTiles[sourceIndex]
  const start = Math.max(0, tile.images.findIndex(url => url.includes(SPACE_PREVIEW_FILES[sourceIndex])))
  return { tile, images: [...tile.images.slice(start), ...tile.images.slice(0, start)], sizes: spaceTileSizes(slot) }
})
const CATEGORY_PREVIEW_COUNT = 4
const CATEGORY_NOTES: Record<FeaturedCategory, { title: string; description: string; detail: string }> = {
  Islamic: { title: 'Islamic', description: 'Calligraphy & geometric screens', detail: 'Calligraphy, expressed in metal. Explore intricate pieces for prayer spaces and the places you call home.' },
  Artwork: { title: 'Artwork', description: 'Sculptural pieces & wall art', detail: 'A focal point with a different texture. Discover laser-cut art and decorative pieces for your walls.' },
  Panels: { title: 'Panels', description: 'Privacy, pattern & architectural detail', detail: 'Shape light and define a space with decorative screens, dividers, gates and architectural panels.' },
  Misc: { title: 'Custom & utility', description: 'Lighting, storage & everyday objects', detail: 'Metalwork with a practical purpose. Explore lighting, racks, storage and utility pieces.' },
}

function ProductCard({ item }: { item: CatalogProduct }) {
  const {ensureProduct}=useCatalog()
  const prefetch=()=>{void ensureProduct(item.slug).catch(()=>{})}
  const title = item.title.replace(/^\[[^\]]+\]\s*/, '')
  return <Link onFocus={prefetch} onPointerEnter={event=>{if(event.pointerType==='mouse')prefetch()}} className="edit-product" to={`/products/${categorySlugs[item.category]}/${item.slug}`}>
    <div className="edit-product__image">
      <ProductThumb publicUrl={item.images[0]} alt="" className="edit-product__front" />
      {item.images[1] ? <ProductThumb publicUrl={item.images[1]} alt="" className="edit-product__back" /> : null}
      <span className="edit-product__open" aria-hidden>↗</span>
    </div>
    <div className="edit-product__caption"><h3>{title}</h3><span>{item.price}</span></div>
  </Link>
}

export default function ShinobiHomePage() {
  const { products, loading: catalogLoading, error: catalogError, diagnostics, buildId, refetch } = useCatalog()
  const pageRef = useRef<HTMLElement>(null)
  const [featuredCategory, setFeaturedCategory] = useState<FeaturedCategory>('Islamic')
  const { goToSection } = useHomeSections(pageRef, (direction, section) => {
    if (section.id !== 'selected-pieces') return false
    const next = featuredCategories.indexOf(featuredCategory) + direction
    if (next < 0 || next >= featuredCategories.length) return false
    setFeaturedCategory(featuredCategories[next])
    return true
  })
  const [spaceMotionReduced, setSpaceMotionReduced] = useState(false)
  const [pageVisible, setPageVisible] = useState(() => !document.hidden)
  const [contactSubmitting, setContactSubmitting] = useState(false)
  const [contactStatus, setContactStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [contactFieldErrors, setContactFieldErrors] = useState<{ email?: string; phone?: string }>({})
  const [demoPromptOpen, setDemoPromptOpen] = useState(false)
  const [demoEmail, setDemoEmail] = useState('')
  const demoEmailRef = useRef<HTMLInputElement>(null)
  const demoToggleRef = useRef<HTMLButtonElement>(null)

  const [demoStatus, setDemoStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [featuredByCategory, setFeaturedByCategory] = useState<Record<string, CatalogProduct[]> | null>(()=>products.length?shuffleHomeFeaturedByCategory(products.filter(product=>product.images.length>0),CATEGORY_PREVIEW_COUNT):null)

  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)')
    const syncMotion = () => setSpaceMotionReduced(preference.matches)
    const syncVisibility = () => setPageVisible(!document.hidden)
    syncMotion()
    preference.addEventListener('change', syncMotion)
    document.addEventListener('visibilitychange', syncVisibility)
    return () => {
      preference.removeEventListener('change', syncMotion)
      document.removeEventListener('visibilitychange', syncVisibility)
    }
  }, [])

  useEffect(() => {
    if (!demoPromptOpen) return
    demoEmailRef.current?.focus({ preventScroll: true })
    if (window.matchMedia('(max-width: 767px)').matches) {
      document.getElementById('project-contact-panel')?.scrollIntoView({ block: 'start', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' })
    }
  }, [demoPromptOpen])

  useEffect(() => {
    const available=products.filter(product=>product.images.length>0)
    const fresh=shuffleHomeFeaturedByCategory(available,CATEGORY_PREVIEW_COUNT)
    setFeaturedByCategory(previous=>Object.fromEntries(featuredCategories.map(category=>{
      const kept=(previous?.[category]??[]).flatMap(old=>{const current=available.find(p=>p.id===old.id&&p.category===category);return current?[current]:[]})
      return [category,[...kept,...fresh[category].filter(p=>!kept.some(old=>old.id===p.id))].slice(0,CATEGORY_PREVIEW_COUNT)]
    })))
  }, [products])

  const categoryCounts = useMemo(() => Object.fromEntries(featuredCategories.map((category) =>
    [category, products.filter((product) => product.category === category).length])), [products])
  const selectedItems = featuredByCategory?.[featuredCategory] ?? []
  const categoryScenes: Record<FeaturedCategory, string | undefined> = {
    Islamic: galleryTiles[5].images[1] ?? galleryTiles[5].images[0],
    Artwork: galleryTiles[0].images[0],
    Panels: galleryTiles[1].images[0],
    Misc: galleryTiles[3].images[0],
  }

  const openCalendly = () => {
    const normalized = demoEmail.trim()
    const emailErr = getEmailFieldError(normalized)
    if (emailErr) {
      setDemoStatus({ type: 'error', message: emailErr })
      return
    }
    setDemoStatus({ type: 'success', message: 'Choose a time in Calendly to complete your booking.' })
    const calendlyUrl = `https://calendly.com/raoanasriaz/barqmech-demo?email=${encodeURIComponent(normalized)}`
    window.open(calendlyUrl, '_blank', 'noopener,noreferrer')
  }

  const handleContactSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setContactStatus(null)
    setContactFieldErrors({})
    const form = e.currentTarget
    const fd = new FormData(form)
    const name = String(fd.get('name') || '').trim()
    const email = String(fd.get('email') || '').trim()
    const phone = String(fd.get('subject') || '').trim()
    const message = String(fd.get('message') || '').trim()
    const emailErr = getEmailFieldError(email)
    const phoneErr = getPakistanPhoneFieldError(phone)
    if (emailErr || phoneErr) {
      setContactFieldErrors({ email: emailErr, phone: phoneErr })
      return
    }
    setContactSubmitting(true)
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          subject: phone,
          message,
          origin: typeof window !== 'undefined' ? window.location.origin : '',
        }),
      })
      const data = (await res.json().catch(() => ({}))) as { error?: string }
      if (!res.ok) {
        const errMsg = data.error ?? ''
        if (errMsg && isGmailValidationError(errMsg)) {
          setContactFieldErrors({ email: errMsg })
          return
        }
        throw new Error(errMsg || 'Could not send message')
      }
      setContactStatus({ type: 'success', message: 'Message sent — we will get back to you soon.' })
      form.reset()
    } catch (err) {
      setContactStatus({
        type: 'error',
        message: err instanceof Error ? err.message : 'Something went wrong. Please try again.',
      })
    } finally {
      setContactSubmitting(false)
    }
  }

  return (
    <main className="shinobi-home shinobi-home--chapters" ref={pageRef}>
      <section className="shinobi-hero-panel" id="home" data-home-section data-section-theme="blue" aria-label="Introduction">
        <div className="shinobi-container shinobi-hero-panel__inner">
          <div className="shinobi-hero__copy">
            <p className="shinobi-hero__eyebrow">Elevate Your Space · Through Metal Mastery</p>
            <h1 className="shinobi-hero__title">
              <span className="shinobi-hero__line">Waves of</span>
              <span className="shinobi-hero__line shinobi-hero__stroke">change with</span>
              <span className="shinobi-hero__line shinobi-hero__brand">
                <em>BARQMECH</em>
              </span>
            </h1>
            <p className="shinobi-hero__lede">
              Shop laser-cut Islamic calligraphy, decorative screens, gates, railings, lighting, and custom metal
              fabrication — precision-built to order and delivered across Pakistan.
            </p>
          </div>
          <div className="shinobi-hero__ctas">
            <Link to="/products" className="cut-button">
              View shop <span aria-hidden>↗</span>
            </Link>
            <a href="#contact" className="cut-button">
              Request a custom design <span aria-hidden>↗</span>
            </a>
          </div>
        </div>
        <button type="button" className="shinobi-hero__scroll-hint" onClick={() => goToSection(1)}>
          <span>Scroll to explore</span>
          <svg className="shinobi-hero__scroll-arrow" width="18" height="12" viewBox="0 0 18 12" fill="none" aria-hidden="true" focusable="false">
            <path d="m2 3 7 6 7-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </section>

      <div className="shinobi-home__scroll">
        <section className="home-chapter metal-categories" id="categories" data-home-section data-section-theme="cream" aria-labelledby="categories-title">
          <div className="metal-categories__intro">
            <div><h2 id="categories-title">The collection.</h2><p>Calligraphy, art & architectural metalwork.</p></div>
            <Link className="cut-button" to="/products">Explore the shop <span aria-hidden>↗</span></Link>
          </div>
          <div className="category-samples">
            {featuredCategories.map((category) => <Link key={category} className={`category-sample category-sample--${categorySlugs[category]}`}
              to={`/products?category=${categorySlugs[category]}`}>
              <div className="category-sample__photo">
                <CollectionVideo src={collectionVideos[category]} poster={categoryScenes[category]} />
                {categoryScenes[category] ? <LiquidImageReveal image={categoryScenes[category]!} /> : null}
                <span className="category-sample__arrow" aria-hidden>↗</span>
              </div>
              <h3>{CATEGORY_NOTES[category].title}</h3>
              <span className="category-sample__description">{CATEGORY_NOTES[category].description}</span>
              <span className="category-sample__count">{categoryCounts[category] > 0 ? `${categoryCounts[category]} designs to explore` : 'Explore designs'}</span>
            </Link>)}
          </div>
          {catalogError ? <details className="home-catalog-status"><summary>Catalog connection unavailable. Retry or browse our spaces.</summary>
            <CatalogPricingAlert catalogError={catalogError} catalogLoading={catalogLoading} diagnostics={diagnostics} buildId={buildId} onRetry={refetch} />
          </details> : null}
          <div className="metal-loop" aria-label="Laser cut, made to order, finished your way">
            <CurvedRibbon />
          </div>
        </section>

        <section className="home-chapter metal-rooms metal-rooms--mosaic" id="collections" data-home-section data-section-theme="sky" aria-labelledby="rooms-title">
          <div className="space-heading"><div><h2 id="rooms-title">Metal for every space.</h2><p>From a wall detail to a whole new entrance.</p></div>
          </div>
          <div className="space-collage">
            {SPACE_TILES.map(({tile,images,sizes}, index) => {
              return <Link key={tile.id} className={`space-tile space-tile--${index}`} aria-label={tile.title} to={`/products?category=${categorySlugs[galleryTileRouteCategory[tile.id]]}`}>
                <MosaicSlideshow urls={images} title={tile.title} rotate={!spaceMotionReduced && pageVisible} sizes={sizes} />
              </Link>
            })}
          </div>
        </section>

        <section className="home-chapter metal-edit" id="selected-pieces" data-home-section data-section-theme="cream" aria-labelledby="edit-title">
          <div className="metal-edit__heading"><h2 id="edit-title">Off the cutting table.</h2><Link className="cut-button" to={`/products?category=${categorySlugs[featuredCategory]}`}>Shop this collection <span aria-hidden>↗</span></Link></div>
          <div className="edit-browser">
            <div className="collection-index" role="group" aria-label="Choose a collection">
              {featuredCategories.map((category, index) => <button type="button" key={category} aria-pressed={featuredCategory === category} aria-controls="collection-products" onClick={() => setFeaturedCategory(category)}>
                <span className="collection-index__number">0{index + 1}</span>
                <img src={categoryScenes[category]} srcSet={localImageSet(categoryScenes[category])} sizes="120px" alt="" loading="lazy" />
                <span className="collection-index__name">{CATEGORY_NOTES[category].title}<small>{categoryCounts[category] ? `${categoryCounts[category]} designs` : 'Explore collection'}</small></span>
                <span className="collection-index__arrow" aria-hidden>↗</span>
              </button>)}
            </div>
            <div id="collection-products" className="collection-stage">
              <p className="collection-stage__intro" aria-live="polite">{CATEGORY_NOTES[featuredCategory].title} · {CATEGORY_NOTES[featuredCategory].description}</p>
              {selectedItems.length ? <div className="metal-edit__products" key={featuredCategory}>{selectedItems.map((item) => <ProductCard item={item} key={item.id} />)}</div>
                : catalogLoading || (products.length > 0 && !featuredByCategory)
                  ? <div className="metal-edit__products metal-edit__placeholder" aria-busy="true" aria-label="Collection products">
                    {Array.from({ length: CATEGORY_PREVIEW_COUNT }, (_, index) => <div className="edit-product" key={index} aria-hidden="true">
                      <div className="edit-product__image" />
                      <div className="edit-product__caption"><div className="edit-placeholder__title" /><div className="edit-placeholder__price" /></div>
                    </div>)}
                  </div>
                  : <div className="metal-edit__empty" role="status"><h3>The catalog is taking a little longer.</h3>
                    <p>Explore our room collections or tell us what you're looking for.</p><button type="button" className="cut-button" onClick={refetch}>Retry catalog</button></div>}
            </div>
          </div>
        </section>

        <section className="home-chapter metal-workshop" id="how-it-works" data-home-section data-section-theme="sky" aria-labelledby="workshop-title">
          <div className="metal-workshop__copy"><h2 id="workshop-title">Make it<br /> your metal.</h2>
            <ScrollInk>One cut. A different character. Choose a piece, find your finish, and make room for something that feels like you.</ScrollInk>
            <div className="workshop-path" aria-label="Create your metalwork">
              <Link to="/products"><span>Find your piece.</span><small>Explore the collection or bring a reference.</small><b aria-hidden>↗</b></Link>
              <button type="button" onClick={() => { const option = document.querySelector<HTMLButtonElement>('.finish-options button'); option?.click(); option?.focus({ preventScroll: true }) }}><span>Give it character.</span><small>Try silver, gold or black on the pattern.</small><b aria-hidden>→</b></button>
              <a href="#contact"><span>Make it yours.</span><small>Tell us the size, space and details you have in mind.</small><b aria-hidden>↗</b></a>
            </div>
          </div>
          <FinishPreview />
        </section>

        <section className="home-chapter metal-contact" id="contact" data-home-section data-section-theme="cream" aria-labelledby="contact-title">
          <div className="metal-contact__intro"><span className="studio-note">From your idea to metal.</span><h2 id="contact-title">Bring your<br />own design.</h2><ScrollInk>A sketch, a size, a reference. Tell us what you're making. We'll help you find its shape.</ScrollInk>
            <div className="metal-contact__direct"><a href={`mailto:${storefrontEmail}`}>{storefrontEmail}</a><a href={`tel:${storefrontPhoneTel}`}>{storefrontPhoneDisplay}</a>
              <a href={storefrontWhatsApp} target="_blank" rel="noreferrer">Chat on WhatsApp ↗</a></div>
            <button ref={demoToggleRef} type="button" className="demo-mode-toggle" aria-expanded={demoPromptOpen} aria-controls="project-contact-panel" onClick={() => { setDemoPromptOpen(!demoPromptOpen); setDemoStatus(null) }}>
              <span>{demoPromptOpen ? 'Prefer to send a message?' : 'Prefer to book a demo?'}</span><b aria-hidden>↗</b>
            </button>
          </div>
          <div className="metal-contact__form" id="project-contact-panel">
            <div className="demo-booking-panel" hidden={!demoPromptOpen}>
              <div className="demo-booking-panel__heading"><span>Let's talk metalwork.</span><button type="button" aria-label="Close demo booking" onClick={() => { setDemoPromptOpen(false); demoToggleRef.current?.focus({ preventScroll: true }) }}>×</button></div>
              <h3>See the possibilities.<br />Choose a time to talk.</h3>
              <p>Share a Gmail address, then choose an available time on our Calendly page.</p>
              <form onSubmit={(event) => { event.preventDefault(); openCalendly() }} noValidate>
                <label htmlFor="demo-email">Your Gmail address</label>
                <input ref={demoEmailRef} id="demo-email" type="email" autoComplete="email" value={demoEmail} onChange={(event) => { setDemoEmail(event.target.value); setDemoStatus(null) }} placeholder="you@gmail.com" aria-invalid={demoStatus?.type === 'error'} aria-describedby={demoStatus ? 'demo-status' : undefined} />
                <button className="cut-button" type="submit">Choose a time on Calendly <span aria-hidden>↗</span></button>
                {demoStatus ? <p id="demo-status" role={demoStatus.type === 'error' ? 'alert' : 'status'}>{demoStatus.message}</p> : null}
              </form>
              <small>Opens in a new tab. Your appointment is confirmed on Calendly.</small>
            </div><div hidden={demoPromptOpen}><h3>Tell us about your project</h3>
                <form className="contact-form" onSubmit={handleContactSubmit}>
                  <label>
                    Name *
                    <input type="text" name="name" placeholder="Your name" required autoComplete="name" />
                  </label>
                  <label>
                    Email *
                    <input type="email" name="email" placeholder="your@email.com" required autoComplete="email" />
                    {contactFieldErrors.email ? (
                      <span className="form-field-error" role="alert">
                        {contactFieldErrors.email}
                      </span>
                    ) : null}
                  </label>
                  <label>
                    Phone *
                    <input type="tel" name="subject" placeholder="03XX XXXXXXX" required autoComplete="tel" />
                    {contactFieldErrors.phone ? (
                      <span className="form-field-error" role="alert">
                        {contactFieldErrors.phone}
                      </span>
                    ) : null}
                  </label>
                  <label>
                    Message *
                    <textarea
                      name="message"
                      placeholder="Tell us about your project, size, or design…"
                      rows={3}
                      required
                    />
                  </label>
                  <button type="submit" className="contact-send-btn shinobi-btn shinobi-btn--primary" disabled={contactSubmitting}>
                    {contactSubmitting ? 'Sending…' : 'Send message'}
                  </button>
                  {contactStatus ? (
                    <p className={`contact-status ${contactStatus.type}`}>{contactStatus.message}</p>
                  ) : null}
                </form></div>
          </div>
        </section>
      </div>
    </main>
  )
}
