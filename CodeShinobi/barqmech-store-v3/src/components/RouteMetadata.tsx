import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useCatalog } from '../catalog/CatalogProvider.tsx'
declare const __SITE_ORIGIN__:string
export function RouteMetadata(){
 const location=useLocation(),{products}=useCatalog()
 useEffect(()=>{
   const product=products.find(p=>location.pathname===`/products/${p.category.toLowerCase()}/${p.slug}`)
   const known=['/','/products','/products/search','/checkout','/checkout/success'].includes(location.pathname)||Boolean(product)
   const label=product?product.title.replace(/^\[[^\]]+\]\s*/,''):location.pathname==='/products'?'The collection':location.pathname==='/checkout'?'Checkout':location.pathname==='/checkout/success'?'Your private order receipt':location.pathname==='/products/search'?'Search products':known?'Precision Metal Shop':'Page not found'
   document.title=`${label} — BarqMech`
   const description=product?'Made-to-order metalwork. Choose your size and finish, with nationwide delivery in Pakistan.':'Laser-cut metal art, Islamic calligraphy, architectural panels and utility pieces, made to order in Pakistan.'
   const meta=(name:string,value:string,property=false)=>{let node=document.head.querySelector<HTMLMetaElement>(`meta[${property?'property':'name'}="${name}"]`);if(!node){node=document.createElement('meta');node.setAttribute(property?'property':'name',name);document.head.append(node)}node.content=value}
   meta('description',description);meta('referrer','no-referrer');meta('robots',!known||location.pathname.startsWith('/checkout')||location.pathname==='/products/search'?'noindex,follow':'index,follow')
   meta('og:title',document.title,true);meta('og:description',description,true);meta('og:url',__SITE_ORIGIN__+location.pathname,true);meta('og:type',product?'product':'website',true)
   if(product)meta('og:image',__SITE_ORIGIN__+product.images[0],true);else document.head.querySelector('meta[property="og:image"]')?.remove()
   let canonical=document.head.querySelector<HTMLLinkElement>('link[rel=canonical]');if(!canonical){canonical=document.createElement('link');canonical.rel='canonical';document.head.append(canonical)}canonical.href=__SITE_ORIGIN__+location.pathname
   document.head.querySelectorAll('script[type="application/ld+json"]').forEach(node=>node.remove())
   if(product){const script=document.createElement('script');script.type='application/ld+json';script.textContent=JSON.stringify({'@context':'https://schema.org','@type':'Product',name:label,image:product.images.map(src=>__SITE_ORIGIN__+src),description,sku:product.slug,offers:{'@type':'AggregateOffer',priceCurrency:'PKR',lowPrice:Number(product.price.replace(/\D/g,'')),url:canonical.href}});document.head.append(script)}
 },[location.pathname,products])
 return null
}
