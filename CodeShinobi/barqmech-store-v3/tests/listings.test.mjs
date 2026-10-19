import test from 'node:test'
import assert from 'node:assert/strict'
import {mkdtempSync,writeFileSync,rmSync} from 'node:fs'
import {tmpdir} from 'node:os'
import path from 'node:path'
import {validateListing,publicProduct,listingStats} from '../scripts/listing-schema.mjs'
import {createLocalListings} from '../scripts/local-listings.mjs'
import {readListings,saveListing} from '../../../server/v3/live-catalog.mjs'
import adminCatalog from '../../../api/v3/admin-catalog.mjs'
import {validateOrder} from '../../../server/v3/order-handler.mjs'
import snapshot from '../catalog/generated.json' with {type:'json'}
import {seedDxfPath} from '../scripts/manufacturing-policy.mjs'

const original=snapshot.products.find(p=>p.slug==='artwork-abstract-ball')
const draft={...original,status:'active',description:'Test listing'}

test('Panels keep all price options but omit private DXF paths from seeds and admin saves',()=>{
 const panel=snapshot.products.find(p=>p.category==='Panels')
 const input={...panel,status:'active',description:'',variants:panel.variants.map(v=>({...v,dxf_storage_path:`${panel.slug}/dc${v.design_code}.dxf`}))}
 const saved=validateListing(input)
 assert.equal(saved.variants.length,panel.variants.length)
 assert.ok(saved.variants.every(v=>!v.dxf_storage_path))
 assert.deepEqual(saved.variants.map(v=>v.design_code),panel.variants.map(v=>v.design_code))
 assert.equal(seedDxfPath(panel,panel.variants[0]),undefined)
 assert.equal(seedDxfPath(original,original.variants[0]),`${original.slug}/dc${original.variants[0].design_code}.dxf`)
})
test('listing validation preserves all seed designs and derives area/prices',()=>{
 for(const p of snapshot.products)validateListing({...p,status:'active',description:''})
 const valid=validateListing(draft)
 assert.equal(valid.variants[0].pricing.sizes[0].areaSqFt,2.25)
 assert.equal(listingStats(valid).starting_price,5500)
 assert.equal(publicProduct({...valid,id:original.id,revision:1}).price,'Rs. 5,500')
 for(const changes of [{status:'deleted'},{slug:'../private'},{images:['javascript:alert(1)']},{images:['https://example.test/a?secret=1']},{variants:[]}])assert.throws(()=>validateListing({...draft,...changes}))
 const forged=structuredClone(draft);forged.variants[0].pricing.sizes[0].Black=-1;assert.throws(()=>validateListing(forged))
})

test('private DXF mappings survive admin validation but never enter public product details',()=>{
 const input=structuredClone(draft);input.variants[0].dxf_storage_path=`${input.slug}/dc1.dxf`
 const validated=validateListing(input)
 assert.equal(validated.variants[0].dxf_storage_path,`${input.slug}/dc1.dxf`)
 const publicDetail=publicProduct({...validated,id:original.id,revision:1},true)
 assert.ok(!JSON.stringify(publicDetail).includes('dxf_storage_path'))
 for(const path of ['../private.dxf','/absolute.dxf','https://example.test/file.dxf','secret.dxf?token=1']){
  input.variants[0].dxf_storage_path=path;assert.throws(()=>validateListing(input),/DXF paths/)
 }
})
test('local CRUD persists, archives/restores, protects slugs and detects stale edits',()=>{
 const directory=mkdtempSync(path.join(tmpdir(),'barq-listings-'))
 try{
  const seed=path.join(directory,'seed.json');writeFileSync(seed,JSON.stringify({products:[original]}))
  const store=createLocalListings(path.join(directory,'local.json'),seed)
  const current=store.read({all:true,id:original.id,details:true}).listings[0]
  const disabled=store.save({listing:{...current,status:'disabled'},expectedRevision:1})
  assert.equal(store.read().listings.length,0);assert.equal(disabled.revision,2)
  assert.throws(()=>store.save({listing:current,expectedRevision:1}),/changed/)
  const archived=store.save({listing:{...disabled,status:'archived'},expectedRevision:2})
  assert.equal(store.read({all:true}).listings[0].status,'archived')
  store.save({listing:{...archived,status:'active'},expectedRevision:3});assert.equal(store.read().listings.length,1)
  const added=store.save({listing:{...draft,id:undefined,slug:'local-new-piece'},expectedRevision:0})
  assert.notEqual(added.id,original.id);assert.equal(store.read().listings.length,2)
  assert.throws(()=>store.save({listing:{...added,slug:'changed'},expectedRevision:1}),/cannot be changed/)
  assert.equal(createLocalListings(path.join(directory,'local.json'),seed).read().listings.length,2)
 }finally{rmSync(directory,{recursive:true,force:true})}
})
test('live reads filter active listings and omit heavy variants in browse query',async()=>{
 const calls=[]
 const row={id:original.id,slug:original.slug,title:original.title,category:original.category,description:'',images:original.images,revision:2,status:'active',...listingStats(original)}
 const db={from:()=>{const query={select(value){calls.push(['select',value]);return query},order(){return query},range(){return query},eq(key,value){calls.push([key,value]);return query},then(resolve){return Promise.resolve(resolve({data:[row]}))}};return query}}
 const products=await readListings(db)
 assert.equal(products.length,1);assert.deepEqual(products[0].variants,[])
 assert.ok(calls.some(([key,value])=>key==='status'&&value==='active'));assert.ok(!calls[0][1].includes('variants'))
})
test('admin endpoint rejects anonymous requests before any database access',async()=>{
 let body;const res={setHeader(){},end(value){body=JSON.parse(value)}}
 await adminCatalog({method:'GET',url:'/api/v3/admin-catalog',headers:{}},res)
 assert.equal(res.statusCode,401);assert.equal(body.error,'Unauthorized')
})
test('catalog writes derive price summary and translate revision conflicts',async()=>{
 let args
 const saved=await saveListing({rpc:async(_,value)=>{args=value;return {data:{...value.p_document,id:value.p_id,revision:2}}}},{listing:draft,expectedRevision:1})
 assert.equal(saved.starting_price,5500);assert.equal(args.p_document.variants[0].pricing.sizes[0].areaSqFt,2.25)
 await assert.rejects(saveListing({rpc:async()=>({error:{code:'40001'}})},{listing:draft,expectedRevision:1}),error=>error.status===409)
})
test('checkout uses live canonical prices and rejects disabled or changed items',()=>{
 const line={productId:original.id,slug:original.slug,designCode:1,size:'18 x 18',finish:'Black',quantity:1,unitPrice:5500}
 const body={idempotencyKey:'00000000-0000-4000-8000-000000000001',customer:{name:'Local Test',email:'test@gmail.com',phone:'03001234567',addressLine1:'Test address'},lines:[line],subtotal:5500,shippingTotal:500,grandTotal:6000}
 assert.equal(validateOrder(body,[original]).basket.grand,6000)
 assert.throws(()=>validateOrder(body,[]),/no longer available/)
 const changed=structuredClone(original);changed.variants[0].pricing.sizes[0].Black=5600
 assert.throws(()=>validateOrder(body,[changed]),/Prices have changed/)
})
