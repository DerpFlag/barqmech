import {existsSync,readFileSync,writeFileSync,renameSync} from 'node:fs'
import {randomUUID,createHash} from 'node:crypto'
import {validateListing,publicProduct} from './listing-schema.mjs'
export function createLocalListings(file,snapshotFile){
 const load=()=>existsSync(file)?JSON.parse(readFileSync(file,'utf8')):JSON.parse(readFileSync(snapshotFile,'utf8')).products.map(p=>({id:p.id,...validateListing({...p,status:'active',description:''}),revision:1,updated_at:new Date().toISOString()}))
 return {
  read({all=false,id,slug,details=false}={}){
   const rows=load().filter(p=>(all||p.status==='active')&&(!id||p.id===id)&&(!slug||p.slug===slug))
   return {listings:rows.map(p=>all&&details?p:all?{...publicProduct(p),status:p.status,designCount:p.variants.length}:publicProduct(p,details)),version:createHash('sha256').update(JSON.stringify(rows.map(p=>[p.id,p.revision]))).digest('hex').slice(0,16)}
  },
  save(body){
   const validated=validateListing(body?.listing),rows=load(),previous=rows.find(p=>p.id===body.listing.id)
   if(!Number.isSafeInteger(body.expectedRevision)||body.expectedRevision!==(previous?.revision??0))throw Object.assign(Error('This listing changed. Refresh before saving.'),{status:409})
   if(previous&&previous.slug!==validated.slug||rows.some(p=>p.slug===validated.slug&&p.id!==previous?.id))throw Object.assign(Error('That URL is already in use or cannot be changed.'),{status:409})
   const listing={...validated,id:previous?.id??randomUUID(),revision:(previous?.revision??0)+1,updated_at:new Date().toISOString()}
   writeFileSync(file+'.tmp',JSON.stringify(previous?rows.map(p=>p.id===previous.id?listing:p):[listing,...rows]));renameSync(file+'.tmp',file)
   return listing
  }
 }
}
