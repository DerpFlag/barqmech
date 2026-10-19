import snapshot from '../../catalog/generated.json'
import {validateListing,publicProduct} from '../../scripts/listing-schema.mjs'
import type {ListingDraft,ListingSource,ListingSummary} from '../admin/listing-types.ts'
export function demoListingSource():ListingSource{
 let rows:ListingDraft[]=snapshot.products.map(p=>({...p,description:'',status:'active',revision:1})) as ListingDraft[]
 return {
  list:async()=>rows.map(p=>({...publicProduct(p) as ListingSummary,status:p.status,designCount:p.variants.length})),
  get:async id=>structuredClone(rows.find(p=>p.id===id)!),
  save:async(listing,revision)=>{
   const previous=rows.find(p=>p.id===listing.id),valid=validateListing(listing)
   if(revision!==(previous?.revision??0))throw Error('Listing changed. Refresh before saving.')
   if(rows.some(p=>p.slug===valid.slug&&p.id!==previous?.id))throw Error('That URL already exists.')
   const next={...valid,id:previous?.id??crypto.randomUUID(),revision:revision+1}
   rows=previous?rows.map(p=>p.id===previous.id?next:p):[next,...rows]
   return structuredClone(next)
  }
 }
}
