import { lazy, Suspense, useLayoutEffect } from 'react'
import { Link, Route, Routes, useLocation } from 'react-router-dom'
import { ShinobiLayout } from './components/ShinobiLayout.tsx'
import ShinobiHomePage from './pages/ShinobiHomePage.tsx'
import ShinobiProductsPage from './routes/ShinobiProductsRoute.tsx'
import ProductPage from './routes/ShinobiProductRoute.tsx'
import { ProductGridPlaceholder } from './components/CommercePlaceholder.tsx'

const ProductsSearchPage = lazy(() => import('./routes/ShinobiProductsSearchRoute.tsx'))
const CheckoutPage = lazy(() => import('./routes/CheckoutRoute.tsx'))
const CheckoutSuccessPage = lazy(() => import('./routes/CheckoutSuccessRoute.tsx'))
const AdminPage = lazy(() => import('./admin/AdminPage.tsx'))

function RouteFallback() {
  return <main className="shop-route-page products-page" aria-busy="true" aria-label="Preparing checkout"><ProductGridPlaceholder /></main>
}

export default function App() {
  const location = useLocation()
  useLayoutEffect(() => {
    // Respect section links before paint, including direct loads and repeated
    // clicks on the same hash. Ordinary route changes still start at the top.
    let id = location.hash.slice(1)
    try { id = decodeURIComponent(id) } catch { /* use literal malformed hash */ }
    const target = id ? document.getElementById(id) : null
    if (!target) {
      window.scrollTo({ top: 0, behavior: 'instant' })
      return
    }
    const headerHeight = document.querySelector('.shinobi-header')?.getBoundingClientRect().height ?? 0
    const section = target.closest<HTMLElement>('[data-home-section],[data-home-footer]')
    const shell = target.closest<HTMLElement>('.shinobi-shell--home')
    if (shell && section) shell.dataset.homeTone = section.dataset.sectionTheme ?? 'blue'
    const align = () => {
      const offset = document.querySelector('.shinobi-header')?.getBoundingClientRect().height ?? headerHeight
      window.scrollTo({ top: Math.max(0, window.scrollY + target.getBoundingClientRect().top - offset), behavior: 'instant' })
    }
    align()
    // Keep the destination aligned while fonts/catalog content settle. The
    // first deliberate input releases the anchor so normal scrolling is free.
    const observer = new ResizeObserver(align)
    const main = document.querySelector('main')
    const header = document.querySelector('.shinobi-header')
    if (main) observer.observe(main)
    if (header) observer.observe(header)
    const inputs = ['wheel', 'touchstart', 'pointerdown', 'keydown'] as const
    const release = () => {
      observer.disconnect()
      inputs.forEach(type => window.removeEventListener(type, release, true))
    }
    inputs.forEach(type => window.addEventListener(type, release, { capture: true, passive: true, once: true }))
    return release
  }, [location.pathname, location.hash, location.key])

  return (
    <Routes>
      <Route path="/admin" element={<Suspense fallback={<main className="a-root a-wait" aria-busy="true">Preparing your studio desk…</main>}><AdminPage/></Suspense>} />
      <Route element={<ShinobiLayout />}>
        <Route path="/" element={<ShinobiHomePage />} />
        <Route path="/products" element={<ShinobiProductsPage />} />
        <Route
          path="/products/search"
          element={
            <Suspense fallback={<main className="shop-route-page products-page" aria-busy="true" aria-label="Search results"><ProductGridPlaceholder /></main>}>
              <ProductsSearchPage />
            </Suspense>
          }
        />
        <Route
          path="/products/:categorySlug/:productSlug"
          element={<ProductPage />}
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
        <Route path="*" element={<main className="shop-route-page"><h1>Page not found</h1><p>This page may have moved.</p><Link className="cut-button" to="/products">Browse the collection</Link></main>} />
      </Route>
    </Routes>
  )
}
