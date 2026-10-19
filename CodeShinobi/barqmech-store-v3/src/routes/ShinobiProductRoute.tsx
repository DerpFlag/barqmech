import ProductPage from './ProductPage.tsx'
import { useCatalog } from '@store/catalog/CatalogProvider.tsx'
import { ProductPagePlaceholder } from '../components/CommercePlaceholder.tsx'
import { useEffect } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { useCatalog as useLocalCatalog } from '../catalog/CatalogProvider.tsx'

export default function ShinobiProductRoute() {
  const { productSlug, categorySlug } = useParams()
  const { products, ensureProduct, errorFor, refetch,initializing } = useLocalCatalog()
  const { loading } = useCatalog()
  const error=errorFor(productSlug??'')
  const product = products.find(p=>p.slug===productSlug)
  const revision=(product as typeof product & {revision?:number})?.revision
  useEffect(()=>{ if(productSlug)void ensureProduct(productSlug).catch(()=>{}) },[productSlug,ensureProduct,revision])
  if (!product && initializing) return <ProductPagePlaceholder />
  if (!product) return <main className="shop-route-page"><h1>Product unavailable</h1><p>This listing may be disabled or archived.</p><Link to="/products">Browse the collection</Link></main>
  if(product.category.toLowerCase()!==categorySlug)return <Navigate to={`/products/${product.category.toLowerCase()}/${product.slug}`} replace/>
  if (error && !product.variants.length) return <main className="shop-route-page"><h1>Product options unavailable</h1><p role="alert">{error}</p><button className="cut-button" onClick={refetch}>Try again</button></main>
  return loading || !product.variants.length ? <ProductPagePlaceholder /> : <ProductPage />
}
