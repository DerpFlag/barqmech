import test from 'node:test'
import assert from 'node:assert/strict'
import { createAdminToken,verifyAdminToken } from '../../../server/shared/admin-auth.ts'
import { resolveSiteBaseUrl } from '../../../server/shared/email-brand.mjs'
import { rateLimit,enforceOrigin } from '../../../server/v3/http.mjs'

test('only exact provider preview origins are allowed and only in Preview',()=>{
 const names=['VERCEL_ENV','VERCEL_URL','VERCEL_BRANCH_URL','PUBLIC_SITE_URL','ALLOWED_ORIGINS']
 const saved=Object.fromEntries(names.map(key=>[key,process.env[key]]))
 try{
  process.env.PUBLIC_SITE_URL='https://example.test';delete process.env.ALLOWED_ORIGINS
  process.env.VERCEL_ENV='preview';process.env.VERCEL_URL='release-123.vercel.app';process.env.VERCEL_BRANCH_URL='release-branch.vercel.app'
  enforceOrigin({headers:{origin:'https://release-123.vercel.app'}})
  enforceOrigin({headers:{origin:'https://release-branch.vercel.app'}})
  assert.throws(()=>enforceOrigin({headers:{origin:'https://attacker.vercel.app'}}),error=>error.status===403)
  process.env.VERCEL_ENV='production'
  assert.throws(()=>enforceOrigin({headers:{origin:'https://release-123.vercel.app'}}),error=>error.status===403)
 }finally{for(const key of names){if(saved[key]===undefined)delete process.env[key];else process.env[key]=saved[key]}}
})
import { enrichLinesWithDxfDownloads } from '../../../server/v3/manufacturing.mjs'
import { buildCustomerEmailHtml,buildMerchantEmailHtml } from '../../../server/v3/order-email.mjs'

test('Panel orders bypass storage and show manual supply only in merchant email',async()=>{
 const line={productId:'panel-id',categorySlug:'panels',designCode:3,title:'Test panel',imageUrl:'/catalog-images/panel.webp',quantity:1,unitPrice:500,size:'12 x 24',finish:'Black',dxfSignedUrl:'https://files.example.test/stale',dxf_storage_path:'panel/dc3.dxf'}
 const db={from(){throw Error('Panel-only orders must not query DXF storage')}}
 const lines=await enrichLinesWithDxfDownloads(db,[line])
 assert.equal(lines[0].dxfManual,true)
 assert.equal(lines[0].dxfSignedUrl,undefined)
 assert.equal(lines[0].dxf_storage_path,undefined)
 const ctx={lines,siteBase:'https://shop.example.test',greetingName:'Test',orderCode:'123456',grand:1000,subtotal:500,shipping:500,customer:{name:'Test',email:'test@example.test',phone:'',addressLine1:'Test street'}}
 assert.ok(buildMerchantEmailHtml(ctx).includes('Supply manually for this Panel order'))
 const customer=buildCustomerEmailHtml(ctx)
 assert.ok(!customer.includes('Supply manually'))
 assert.ok(customer.includes('https://shop.example.test/catalog-images/panel.webp'))
 const withoutDatabase=await enrichLinesWithDxfDownloads(null,[line])
 assert.equal(withoutDatabase[0].dxfManual,true)
})

test('mixed Panel and Artwork carts sign only the Artwork DXF',async()=>{
 const previous=process.env.CATALOG_SOURCE;process.env.CATALOG_SOURCE='supabase'
 const calls=[]
 const db={from:()=>({select:()=>({in:async(_column,ids)=>{calls.push(ids);return {data:[{id:'art-id',variants:[{design_code:1,dxf_storage_path:'art/dc1.dxf'}]}]}}})}),storage:{from:()=>({createSignedUrl:async path=>{calls.push(path);return {data:{signedUrl:'https://files.example.test/art'}}}})}}
 try{
  const result=await enrichLinesWithDxfDownloads(db,[{productId:'panel-id',categorySlug:'panels',designCode:1},{productId:'art-id',categorySlug:'artwork',designCode:1}])
  assert.deepEqual(calls,[['art-id'],'art/dc1.dxf'])
  assert.equal(result[0].dxfManual,true);assert.equal(result[1].dxfSignedUrl,'https://files.example.test/art')
 }finally{if(previous===undefined)delete process.env.CATALOG_SOURCE;else process.env.CATALOG_SOURCE=previous}
})

test('live manufacturing reads V3 private mappings including designs absent from legacy rows',async()=>{
 const previous=process.env.CATALOG_SOURCE;process.env.CATALOG_SOURCE='supabase'
 const calls=[]
 const db={from:table=>{calls.push(table);return {select:()=>({in:async()=>({data:[{id:'p1',variants:[{design_code:1007,dxf_storage_path:'panel/dc1007.dxf'}]}]})})}},storage:{from:()=>({createSignedUrl:async path=>{calls.push(path);return {data:{signedUrl:'https://files.example.test/private'}}}})}}
 try{
  const lines=await enrichLinesWithDxfDownloads(db,[{productId:'p1',designCode:1007}])
  assert.deepEqual(calls,['v3_storefront_listings','panel/dc1007.dxf'])
  assert.equal(lines[0].dxfSignedUrl,'https://files.example.test/private')
  assert.deepEqual(await enrichLinesWithDxfDownloads(db,null),[])
 }finally{if(previous===undefined)delete process.env.CATALOG_SOURCE;else process.env.CATALOG_SOURCE=previous}
})

test('merchant gets only the selected private DXF, while both emails retain pictures',async()=>{
 const previous=process.env.GOOGLE_DRIVE_FINALIZED_URL
 process.env.GOOGLE_DRIVE_FINALIZED_URL='https://drive.google.com/legacy-folder'
 const calls=[]
 const db={from:()=>({select:()=>({in:async()=>({data:[{product_id:'p1',design_code:2,dxf_storage_path:'piece/dc2.dxf'},{product_id:'p1',design_code:3,dxf_storage_path:'piece/dc3.dxf'}]})})}),storage:{from:bucket=>({createSignedUrl:async(path,ttl)=>{calls.push({bucket,path,ttl});return {data:{signedUrl:'https://files.example.test/selected-dxf'}}}})}}
 try{
  const lines=await enrichLinesWithDxfDownloads(db,[{productId:'p1',designCode:2,title:'Test piece',imageUrl:'/catalog-images/piece.webp',quantity:1,unitPrice:500,size:'12 x 24',finish:'Black'}])
  assert.deepEqual(calls,[{bucket:'product-dxf',path:'piece/dc2.dxf',ttl:14*86400}])
  const ctx={lines,siteBase:'https://shop.example.test',greetingName:'Test',orderCode:'123456',grand:1000,subtotal:500,shipping:500,customer:{name:'Test',email:'test@example.test',phone:'',addressLine1:'Test street'}}
  const merchant=buildMerchantEmailHtml(ctx),customer=buildCustomerEmailHtml(ctx)
  for(const html of [merchant,customer]){assert.ok(html.includes('https://shop.example.test/catalog-images/piece.webp'));assert.ok(!html.includes('drive.google.com'));assert.ok(!html.includes('Google Drive'))}
  assert.ok(merchant.includes('https://files.example.test/selected-dxf'))
  assert.ok(!customer.includes('https://files.example.test/selected-dxf'))
  const missing=await enrichLinesWithDxfDownloads(null,ctx.lines)
  assert.equal(missing[0].dxfDriveFolder,undefined)
 }finally{if(previous===undefined)delete process.env.GOOGLE_DRIVE_FINALIZED_URL;else process.env.GOOGLE_DRIVE_FINALIZED_URL=previous}
})
test('production admin cannot sign or verify with the development fallback',()=>{
 const saved={...process.env};process.env.VERCEL='1';delete process.env.SUPABASE_SERVICE_ROLE_KEY;delete process.env.ADMIN_SESSION_SECRET
 try{assert.throws(()=>createAdminToken(),/strong/);assert.equal(verifyAdminToken(`${Math.floor(Date.now()/1000)+100}.bad`),false)}finally{delete process.env.VERCEL;Object.assign(process.env,saved)}
})
test('transactional links prefer the configured origin over browser input',()=>{
 process.env.PUBLIC_SITE_URL='https://example.test';assert.equal(resolveSiteBaseUrl({origin:'https://untrusted.test'}),'https://example.test')
})
test('distributed rate limit hashes IP, rejects exhausted quota and fails closed',async()=>{
 process.env.ORDER_RECEIPT_SECRET='local-test-secret-at-least-32-characters'
 const req={headers:{'x-vercel-forwarded-for':'192.0.2.1'}},calls=[]
 await rateLimit(req,{rpc:async(name,args)=>{calls.push(args);return {data:true}}},'checkout',10)
 assert.equal(calls[0].p_key.includes('192.0.2.1'),false)
 await assert.rejects(rateLimit(req,{rpc:async()=>({data:false})},'checkout',10),error=>error.status===429)
 await assert.rejects(rateLimit(req,{rpc:async()=>({error:{message:'missing function'}})},'checkout',10),error=>error.status===503)
})
