import {readFileSync} from 'node:fs'
import {createClient} from '@supabase/supabase-js'
import {validateListing,listingStats} from './listing-schema.mjs'
import {seedDxfPath} from './manufacturing-policy.mjs'
const snapshot=JSON.parse(readFileSync(new URL('../catalog/generated.json',import.meta.url),'utf8'))
const rows=snapshot.products.map(p=>({id:p.id,...validateListing({...p,variants:p.variants.map(v=>({...v,dxf_storage_path:seedDxfPath(p,v)})),status:'active',description:p.description??''}),...listingStats(p),revision:1}))
console.log(`Validated ${rows.length} listings for an isolated live-catalog seed.`)
if(!process.argv.includes('--apply')){console.log('Dry run only. No database connection or writes.');process.exit(0)}
if(!process.env.SUPABASE_URL||!process.env.SUPABASE_SERVICE_ROLE_KEY)throw Error('Configure server-side Supabase settings before seeding.')
const db=createClient(process.env.SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false}})
const {count,error}=await db.from('v3_storefront_listings').select('id',{count:'exact',head:true})
if(error)throw Error('Apply the isolated live-listings migration first.')
if(count!==0)throw Error('Seed refuses to overwrite a non-empty live catalog. Export/reconcile it instead.')
const result=await db.from('v3_storefront_listings').insert(rows)
if(result.error)throw Error('Seed failed; inspect the database response privately.')
console.log('Catalog seeded. Legacy catalog and orders were not modified.')
