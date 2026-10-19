import {database,canonicalOrigin} from '../../server/v3/http.mjs'
import {readListings} from '../../server/v3/live-catalog.mjs'
export default async function handler(req,res){
 if(req.method!=='GET'){res.statusCode=405;return res.end()}
 try{
  const products=await readListings(database()),origin=canonicalOrigin()
  const urls=['/','/products',...products.map(p=>`/products/${p.category.toLowerCase()}/${p.slug}`)]
  res.setHeader('Content-Type','application/xml; charset=utf-8');res.setHeader('Cache-Control','public, max-age=60')
  res.statusCode=200;res.end(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map(url=>`<url><loc>${origin}${url}</loc></url>`).join('')}</urlset>`)
 }catch{res.statusCode=503;res.setHeader('Cache-Control','no-store');res.end('Sitemap temporarily unavailable')}
}
