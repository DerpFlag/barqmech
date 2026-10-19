import {areaForSize} from './shipping.mjs'
import {isManualDxfCategory} from './manufacturing-policy.mjs'
export const categories=['Islamic','Artwork','Panels','Misc']
export const statuses=['active','disabled','archived']
export function validateListing(input){
  if(!input||typeof input!=='object'||Array.isArray(input))throw Error('Invalid listing.')
  const title=String(input.title??'').trim(),slug=String(input.slug??'').trim(),description=String(input.description??'').trim()
  if(!title||title.length>180)throw Error('Enter a title of up to180 characters.')
  if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)||slug.length>150)throw Error('Use a URL slug with lowercase letters, numbers and hyphens.')
  if(!categories.includes(input.category)||!statuses.includes(input.status))throw Error('Choose a valid category and status.')
  if(description.length>5000)throw Error('Description must be under5000 characters.')
  if(!Array.isArray(input.images))throw Error('Add image URLs.')
  const rawImages=input.images.map(value=>String(value).trim()).filter(Boolean)
  if(rawImages.length<1||rawImages.length>100)throw Error('Add between1 and100 image URLs.')
  const images=rawImages.map(value=>{
    const url=String(value).trim()
    if(/^\/catalog-images\/[a-z0-9-]+\/[a-zA-Z0-9._-]+\.webp$/.test(url)&&!url.includes('..'))return url
    try{const parsed=new URL(url);if(parsed.protocol==='https:'&&!parsed.username&&!parsed.password&&!parsed.search&&!parsed.hash&&url.length<2000)return parsed.href}catch{}
    throw Error('Images must use local catalog paths or public HTTPS URLs without credentials or query strings.')
  })
  if(!Array.isArray(input.variants)||!input.variants.length||input.variants.length>2000)throw Error('Add at least one design, up to2000 per listing.')
  const codes=new Set()
  const variants=input.variants.map(variant=>{
    const code=variant.design_code
    if(!Number.isSafeInteger(code)||code<0||codes.has(code))throw Error('Design codes must be unique nonnegative integers.')
    codes.add(code)
    if(!Array.isArray(variant.pricing?.sizes)||!variant.pricing.sizes.length||variant.pricing.sizes.length>30)throw Error('Each design needs1–30 sizes.')
    const seen=new Set()
    const sizes=variant.pricing.sizes.map(size=>{
      const raw=String(size.label??'').trim(),area=areaForSize(raw)
      const label=raw.replace(/\s*(?:inches|inch|in\.?)$/i,'').replace(/×/g,'x').replace(/\s*x\s*/i,' x ')
      if(seen.has(label))throw Error('Size labels must be unique in each design.')
      seen.add(label)
      if(typeof size.feasible!=='boolean')throw Error('Choose availability for every size.')
      const row={label,areaSqFt:area,feasible:size.feasible}
      for(const field of ['Silver','Gold','Black','wooden','led','install']){
        const amount=size[field]
        if(!Number.isSafeInteger(amount)||amount<0||amount>10000000||size.feasible&&['Silver','Gold','Black'].includes(field)&&amount===0)throw Error('Prices must be whole PKR amounts; available sizes need positive finish prices.')
        row[field]=amount
      }
      return row
    })
    const dxfPath=isManualDxfCategory(input.category)?'':String(variant.dxf_storage_path??'').trim()
    if(dxfPath && (dxfPath.length>500 || !/^[a-zA-Z0-9_/-]+\.dxf$/i.test(dxfPath) || dxfPath.includes('..') || dxfPath.startsWith('/')))throw Error('DXF paths must be relative .dxf object paths in the private product-dxf bucket.')
    return {design_code:code,pricing:{sizes},...(dxfPath?{dxf_storage_path:dxfPath}:{})}
  })
  if(!variants.some(v=>v.pricing.sizes.some(s=>s.feasible)))throw Error('Keep at least one size available. Disable the listing to stop sales.')
  return {title,slug,description,category:input.category,status:input.status,images:[...new Set(images)],variants}
}
export function listingStats(row){
  const prices=row.variants.flatMap(v=>v.pricing.sizes.filter(s=>s.feasible!==false).flatMap(s=>[s.Silver,s.Gold,s.Black]))
  return {starting_price:Math.min(...prices),design_count:row.variants.length}
}
export function publicProduct(row,details=false){
  const price=row.starting_price??listingStats(row).starting_price
  return {id:row.id,slug:row.slug,title:row.title,description:details?row.description??'':'',category:row.category,images:details?row.images:row.images.slice(0,1),
    revision:row.revision,price:`Rs. ${price.toLocaleString('en-PK')}`,variants:details?row.variants.map((v,index)=>({design_code:v.design_code,pricing:v.pricing,id:`${row.id}-${v.design_code}`,product_id:row.id,sort_order:index})):[]}
}
