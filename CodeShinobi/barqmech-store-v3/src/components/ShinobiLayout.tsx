import { Outlet, useLocation } from 'react-router-dom'
import { CartProvider } from '../cart/CartContext.tsx'
import { CatalogProvider } from '@store/catalog/CatalogProvider.tsx'
import { FixedVideoBackground } from './FixedVideoBackground.tsx'
import { ScrollProgress } from './ScrollProgress.tsx'
import { ShinobiFooter } from './ShinobiFooter.tsx'
import { ShinobiHeader } from './ShinobiHeader.tsx'
import { useStudioMotion } from './useStudioMotion.ts'
import { RouteMetadata } from './RouteMetadata.tsx'

export function ShinobiLayout() {
  const location = useLocation()
  const path = location.pathname
  const showVideo = path === '/'
  useStudioMotion(true, path)

  return (
    <div className={`shinobi-shell${path === '/' ? ' shinobi-shell--home' : ' shinobi-shell--commerce'}`}>
      <ScrollProgress />
      <CatalogProvider>
        <RouteMetadata />
        <CartProvider>
          {showVideo ? <FixedVideoBackground /> : null}
          <ShinobiHeader overVideo={showVideo} />
          <Outlet />
          <ShinobiFooter home />
        </CartProvider>
      </CatalogProvider>
    </div>
  )
}
