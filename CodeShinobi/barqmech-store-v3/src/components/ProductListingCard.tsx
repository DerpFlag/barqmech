import { useCatalog } from '../catalog/CatalogProvider.tsx'
import { Link } from 'react-router-dom'
import { RotatingImageStack } from '@store/catalog/RotatingImageStack.tsx'
import type { CatalogProduct } from '@store/catalog/types.ts'
import { categorySlugs } from '../data/catalog.ts'

type Props = {
  item: CatalogProduct
  /** Retained for callers; V2 keeps listing images stationary. */
  cardIndex?: number
}

export function ProductListingCard({ item, cardIndex: _cardIndex = 0 }: Props) {
  const {ensureProduct}=useCatalog()
  const prefetch=()=>{void ensureProduct(item.slug).catch(()=>{})}
  if (!item.images.length) return null

  return (
    <Link
      to={`/products/${categorySlugs[item.category]}/${item.slug}`}
      onFocus={prefetch}
      onPointerEnter={event=>{if(event.pointerType==='mouse')prefetch()}}
      className="shop-route-card shinobi-listing-card"
    >
      <RotatingImageStack
        urls={item.images}
        alt={item.title}
        catalogSize="card"
        stackClassName="shop-route-image-stack shinobi-listing-stack"
        imageClassName="shop-route-image"
        rotate={false}
      />
      <div className="shinobi-listing-body">
        <p className="shinobi-listing-cat">{item.category}</p>
        <h3>{item.title.replace(/^\[[^\]]+\]\s*/, '')}</h3>
        <p className="shinobi-listing-price">{item.price}</p>
      </div>
    </Link>
  )
}
