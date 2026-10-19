import {createHash,randomUUID} from 'node:crypto'
import {validateListing,publicProduct,listingStats} from '../../CodeShinobi/barqmech-store-v3/scripts/listing-schema.mjs'
import {CheckoutError} from './checkout.mjs'
export const listingTable='v3_storefront_listings'
export async function readListings(db,{all=false,slug,ids,details=false}={}){
  if(slug&&!/^[a-z0-9-]{1,150}$/.test(slug))throw new CheckoutError('Invalid listing.',400)
  const rows=[]
  for(let offset=0;;offset+=500){
    let query=db.from(listingTable).select(details?'*':'id,slug,title,category,status,images,revision,updated_at,starting_price,design_count').order('id').range(offset,offset+499)
    if(!all)query=query.eq('status','active')
    if(slug)query=query.eq('slug',slug)
    if(ids)query=query.in('id',ids)
    const {data,error}=await query
    if(error)throw new CheckoutError('The live catalog is temporarily unavailable.',503)
    rows.push(...data)
    if(data.length<500)break
  }
  if(all)return rows.map(row=>details?row:{...publicProduct(row),status:row.status,updated_at:row.updated_at,designCount:row.design_count})
  return rows.map(row=>publicProduct(row,details))
}
export function catalogVersion(products){return createHash('sha256').update(JSON.stringify(products.map(p=>[p.id,p.revision]))).digest('hex').slice(0,16)}
export async function saveListing(db,body){
  const {listing,expectedRevision}=body??{}
  if(!Number.isSafeInteger(expectedRevision)||expectedRevision<0)throw new CheckoutError('Refresh this listing before saving.',409)
  let validated
  try{validated=validateListing(listing)}catch(error){throw new CheckoutError(error.message,400)}
  const id=listing.id??randomUUID()
  if(!/^[0-9a-f-]{36}$/i.test(id))throw new CheckoutError('Invalid listing ID.',400)
  const {data,error}=await db.rpc('save_v3_storefront_listing',{p_id:id,p_revision:expectedRevision,p_document:{...validated,...listingStats(validated)}})
  if(error){if(['23505','40001'].includes(error.code))throw new CheckoutError('This listing changed, or that URL already exists. Refresh before saving.',409);throw new CheckoutError('The listing could not be saved.',503)}
  const saved=Array.isArray(data)?data[0]:data
  if(!saved?.id||!Number.isSafeInteger(saved.revision))throw new CheckoutError('The save was not confirmed. Refresh this listing before retrying.',503)
  return saved
}
