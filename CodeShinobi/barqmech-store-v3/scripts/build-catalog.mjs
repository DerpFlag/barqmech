import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { areaForSize } from './shipping.mjs'

export function parseCsv(text) {
  const rows = []; let row = [], value = '', quoted = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (c === '"') { if (quoted && text[i + 1] === '"') { value += '"'; i++ } else quoted = !quoted }
    else if (!quoted && (c === ',' || c === '\n')) { row.push(value); value = ''; if (c === '\n') { if (row.some(Boolean)) rows.push(row); row = [] } }
    else if (c !== '\r' || quoted) value += c
  }
  if (quoted) throw Error('Unclosed CSV quote')
  if (value || row.length) { row.push(value); rows.push(row) }
  const header = rows.shift()?.map(s => s.replace(/^\uFEFF/, '')) ?? []
  return rows.map((cells, i) => { if (cells.length !== header.length) throw Error(`CSV row ${i + 2}: wrong column count`); return Object.fromEntries(header.map((key, j) => [key, cells[j]])) })
}

export function compileCatalog(productRows, priceRows) {
  const map = new Map()
  for (const p of productRows) {
    if (!/^[0-9a-f-]{36}$/i.test(p.id)) throw Error(`Invalid product ID: ${p.slug}`)
    if (!/^[a-z0-9-]+$/.test(p.slug) || map.has(p.slug)) throw Error(`Invalid/duplicate product slug: ${p.slug}`)
    if (!['Artwork', 'Islamic', 'Panels', 'Misc'].includes(p.category)) throw Error(`Invalid category: ${p.slug}`)
    const images = JSON.parse(p.images)
    if (!Array.isArray(images) || !images.length || images.some(s => typeof s !== 'string' || !s.startsWith(`/catalog-images/${p.slug}/`) || s.includes('..'))) throw Error(`Invalid images: ${p.slug}`)
    map.set(p.slug, { id:p.id, slug:p.slug, category:p.category, title:p.title, images, variants:[] })
  }
  for (const row of priceRows) {
    const p = map.get(row.product_slug)
    if (!p) throw Error(`Price refers to missing product: ${row.product_slug}`)
    const code = Number(row.design_code)
    if (!Number.isSafeInteger(code) || code < 0 || !row.size.trim() || !['0','1'].includes(row.feasible)) throw Error(`Invalid design/size: ${p.slug}`)
    let v = p.variants.find(v => v.design_code === code)
    if (!v) { v = { id:`${p.id}-${code}`, product_id:p.id, design_code:code, sort_order:p.variants.length, pricing:{ sizes:[] } }; p.variants.push(v) }
    if (v.pricing.sizes.some(s => s.label === row.size)) throw Error(`Duplicate size: ${p.slug}/${code}/${row.size}`)
    const area = Number(row.area_sqft)
    if (!row.area_sqft?.trim() || !Number.isFinite(area) || area <= 0 || Math.abs(area - areaForSize(row.size)) > 0.00000001) throw Error(`Invalid area_sqft: ${p.slug}/${row.size}`)
    const tier = { label:row.size, areaSqFt:area, feasible:row.feasible === '1' }
    for (const [key, col] of Object.entries({Silver:'silver_pkr', Gold:'gold_pkr', Black:'black_pkr', wooden:'wooden_pkr', led:'led_pkr', install:'install_pkr'})) {
      const n = Number(row[col]); if (!Number.isSafeInteger(n) || n < 0 || n > 10000000) throw Error(`Invalid PKR price: ${p.slug}/${col}`); tier[key] = n
    }
    if (tier.feasible && ['Silver','Gold','Black'].some(k => tier[k] <= 0)) throw Error(`Feasible size must have positive finish prices: ${p.slug}`)
    v.pricing.sizes.push(tier)
  }
  return [...map.values()].map(p => {
    const prices = p.variants.flatMap(v => v.pricing.sizes.filter(s => s.feasible).flatMap(s => [s.Silver,s.Gold,s.Black]))
    if (!prices.length) throw Error(`No feasible prices: ${p.slug}`)
    return { ...p, price:`Rs. ${Math.min(...prices).toLocaleString('en-PK')}` }
  })
}

export function buildCatalog() {
  const app = fileURLToPath(new URL('../', import.meta.url))
  const productsCsv = readFileSync(path.join(app,'catalog/products.csv'),'utf8'), pricesCsv = readFileSync(path.join(app,'catalog/prices.csv'),'utf8')
  const products = compileCatalog(parseCsv(productsCsv),parseCsv(pricesCsv))
  const version = createHash('sha256').update(productsCsv + pricesCsv).digest('hex').slice(0,16)
  const dir = path.join(app,'public/catalog',version); mkdirSync(dir,{recursive:true})
  const widths={}
  for (const p of products) {
    widths[p.slug]=p.images.map(image=>[320,640,1200].map(size=>{
      const file=path.join(app,'public',image.replace('-1200.webp',`-${size}.webp`))
      if(!existsSync(file))throw Error(`Missing product image variant: ${image}`)
      return webpWidth(readFileSync(file))
    }))
    writeFileSync(path.join(dir,p.slug+'.json'),JSON.stringify(p))
  }
  writeFileSync(path.join(app,'catalog/generated.json'),JSON.stringify({version,products}))
  writeFileSync(path.join(app,'src/data/catalog-browse.json'),JSON.stringify({version,products:products.map(({variants,...p})=>({...p,variants:[]}))}))
  writeFileSync(path.join(app,'src/data/image-widths.json'),JSON.stringify(widths))
  writeFileSync(path.join(app,'public/sitemap.xml'),`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${['/','/products',...products.map(p=>`/products/${p.category.toLowerCase()}/${p.slug}`)].map(url=>`<url><loc>${(process.env.PUBLIC_SITE_URL || 'https://barqmech.com').replace(/\/$/,'')}${url}</loc></url>`).join('')}</urlset>`)
  console.log(`GitHub catalog ${version}: ${products.length} products, ${products.reduce((n,p)=>n+p.variants.length,0)} designs`)
}
export function webpWidth(buffer){
  if(buffer.toString('ascii',0,4)!=='RIFF'||buffer.toString('ascii',8,12)!=='WEBP')throw Error('Expected WebP image')
  for(let offset=12;offset+8<buffer.length;){
    const type=buffer.toString('ascii',offset,offset+4),start=offset+8,length=buffer.readUInt32LE(offset+4)
    if(type==='VP8X')return buffer.readUIntLE(start+4,3)+1
    if(type==='VP8L')return (buffer.readUInt32LE(start+1)&0x3fff)+1
    if(type==='VP8 ')return buffer.readUInt16LE(start+6)&0x3fff
    offset=start+length+(length%2)
  }
  throw Error('WebP dimensions unavailable')
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) buildCatalog()
