import {readFileSync,existsSync,readdirSync,statSync} from 'node:fs'
import path from 'node:path'
import {fileURLToPath} from 'node:url'
import assert from 'node:assert/strict'
const app=fileURLToPath(new URL('../',import.meta.url)),root=path.resolve(app,'../..'),dist=path.join(app,'dist')
const catalog=JSON.parse(readFileSync(path.join(app,'catalog/generated.json'),'utf8'))
for(const p of catalog.products){
 const page=path.join(dist,'products',p.category.toLowerCase(),p.slug,'index.html')
 assert(existsSync(page),`Missing product landing page: ${p.slug}`)
 const html=readFileSync(page,'utf8')
 assert(html.includes('application/ld+json')&&html.includes('rel="canonical"'),`Missing metadata: ${p.slug}`)
 const details=JSON.parse(readFileSync(path.join(dist,'catalog',catalog.version,p.slug+'.json'),'utf8'))
 assert.equal(details.slug,p.slug)
 assert(details.variants.length>0)
 for(const image of p.images)for(const width of [320,640,1200])assert(existsSync(path.join(dist,image.replace('-1200.webp',`-${width}.webp`))),`Missing image variant: ${image}`)
}
for(const asset of ['favicon.png','brand/barqmech-wordmark.png','barqmech-email-logo.png','404.html','sitemap.xml','robots.txt'])assert(existsSync(path.join(dist,asset)),`Missing public asset: ${asset}`)
assert(readFileSync(path.join(dist,'admin/index.html'),'utf8').includes('noindex'),'Admin landing page must be noindex')
for(const name of readdirSync(path.join(dist,'assets'))){
 const file=path.join(dist,'assets',name)
 assert(statSync(file).size<10_000_000,`Oversized delivery asset: ${name}`)
 if(name.endsWith('.js'))assert(!/supabase\.co|stitched-4x-fixed|keys_new\.txt/.test(readFileSync(file,'utf8')),`Legacy asset or database dependency in browser bundle: ${name}`)
 if(name.endsWith('.js'))assert(!/Sample Customer A|customer-a@example.test|adminDemo/.test(readFileSync(file,'utf8')),`Development admin fixture in production: ${name}`)
}
const config=JSON.parse(readFileSync(path.join(root,'vercel.json'),'utf8'))
assert.equal(config.outputDirectory,'CodeShinobi/barqmech-store-v3/dist')
assert(config.functions['api/place-order.mjs'].includeFiles.endsWith('/catalog/*.csv'))
assert(config.routes.some(r=>r.status===404))
assert(!existsSync(path.join(root,'api/lib'))||readdirSync(path.join(root,'api/lib')).length===0,'API helpers should not become public function entries')
console.log(`Delivery artifacts verified: ${catalog.products.length} product pages, versioned options, responsive images, public branding and V3 deployment config`)
