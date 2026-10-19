import { readFileSync,writeFileSync,mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import catalog from '../catalog/generated.json' with {type:'json'}
const app=fileURLToPath(new URL('../',import.meta.url)),dist=path.join(app,'dist')
const base=readFileSync(path.join(dist,'index.html'),'utf8')
const origin=(process.env.PUBLIC_SITE_URL||'http://localhost:5177').replace(/\/$/,'')
const escape=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;')
function page(url,title,description,product,noindex=false){
  let html=base.replace(/<title>.*?<\/title>/,`<title>${escape(title)}</title>`)
  const structured=product?JSON.stringify({'@context':'https://schema.org','@type':'Product',name:product.title.replace(/^\[[^\]]+\]\s*/,''),image:product.images.map(p=>origin+p),description,sku:product.slug,offers:{'@type':'AggregateOffer',priceCurrency:'PKR',lowPrice:Number(product.price.replace(/\D/g,'')),offerCount:product.variants.length,url:origin+url}}).replace(/</g,'\\u003c'):''
  html=html.replace('</head>',`<meta name="description" content="${escape(description)}"><meta name="referrer" content="no-referrer"><link rel="canonical" href="${origin}${url}"><meta property="og:title" content="${escape(title)}"><meta property="og:description" content="${escape(description)}"><meta property="og:url" content="${origin}${url}"><meta property="og:type" content="${product?'product':'website'}">${product?`<meta property="og:image" content="${origin}${product.images[0]}">`:''}${noindex?'<meta name="robots" content="noindex,follow">':''}${structured?`<script type="application/ld+json">${structured}</script>`:''}</head>`)
  const target=url==='/'?path.join(dist,'index.html'):path.join(dist,url,'index.html');mkdirSync(path.dirname(target),{recursive:true});writeFileSync(target,html)
}
page('/','BarqMech — Precision Metal Shop','Made-to-order laser-cut metal art, calligraphy, panels and utility pieces in Pakistan.')
page('/products','The collection — BarqMech','Explore Islamic calligraphy, artwork, architectural panels and custom utility metalwork.')
for(const p of catalog.products)page(`/products/${p.category.toLowerCase()}/${p.slug}`,`${p.title.replace(/^\[[^\]]+\]\s*/,'')} — BarqMech`,'Made-to-order metalwork. Choose your size and finish, with nationwide delivery in Pakistan.',p)
for(const [url,title] of [['/admin','Studio desk'],['/products/search','Search products'],['/checkout','Checkout'],['/checkout/success','Your private order receipt']])page(url,`${title} — BarqMech`,'BarqMech precision metalwork.',null,true)
writeFileSync(path.join(dist,'404.html'),base.replace('<title>','<meta name="robots" content="noindex"><title>Page not found — '))
console.log(`Generated ${catalog.products.length} product landing pages plus storefront routes`)

writeFileSync(path.join(dist,'robots.txt'),`User-agent: *\nAllow: /\nDisallow: /checkout\nDisallow: /admin\nDisallow: /api/\nSitemap: ${origin}/sitemap.xml\n`)
