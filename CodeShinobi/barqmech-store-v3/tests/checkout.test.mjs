import test from 'node:test'
import assert from 'node:assert/strict'
import { validateBasket,signReceipt,verifyReceipt } from '../../../server/v3/checkout.mjs'
import { createOrderHandler,validateOrder } from '../../../server/v3/order-handler.mjs'
import { deliverNotifications } from '../../../server/v3/notifications.mjs'
import { readBody } from '../../../server/v3/http.mjs'
import { areaForSize, shippingForArea, shippingForLines, shippingAllocation } from '../scripts/shipping.mjs'
import { buildPersistedLines } from '../../../server/v3/order-email.mjs'
import catalog from '../catalog/generated.json' with {type:'json'}

process.env.ORDER_RECEIPT_SECRET='local-test-secret-with-at-least-32-characters'
process.env.ORDER_FROM_EMAIL='Store <orders@example.test>'
process.env.ORDER_NOTIFY_EMAIL='merchant@example.test'
process.env.RESEND_API_KEY='local-test-no-network'
process.env.PUBLIC_SITE_URL='https://example.test'

test('area shipping boundaries, fractional square feet and invalid sizes',()=>{
 assert.equal(areaForSize('24 × 24 in'),4)
 assert.equal(areaForSize('18 x 42'),5.25)
 assert.equal(areaForSize('12.5 x 24 inches'),2.08333333)
 for(const [area,rate] of [[2.25,500],[4,500],[4.0001,1000],[7,1000],[7.01,1200],[8,1200],[8.01,1400],[9,1400],[10,1600]])assert.equal(shippingForArea(area),rate)
 for(const area of [0,-1,NaN,Infinity])assert.throws(()=>shippingForArea(area))
 for(const size of ['unknown','0 x 20','-2 x 20','24','24 x 24 rubbish'])assert.throws(()=>areaForSize(size))
 assert.equal(shippingForLines([]),0)
})

test('mixed carts charge only the largest-area item once and persist that allocation',()=>{
 const lines=[{size:'24 x 24',quantity:99},{size:'36 x 36',quantity:5},{size:'18 x 42',quantity:3},{size:'36 x 36',quantity:2}]
 assert.equal(shippingForLines(lines),1400)
 assert.deepEqual(shippingAllocation(lines),[0,1400,0,0])
 const persisted=buildPersistedLines(lines.map(l=>({...l,unitPrice:100})), 'local-test', 'https://example.test')
 assert.deepEqual(persisted.map(l=>l.shipping_line_pkr),[0,1400,0,0])
 assert.equal(shippingForLines(lines.slice(2,3)),1000)
})
const product=catalog.products.find(p=>p.slug==='artwork-abstract-ball')
const line={productId:product.id,slug:product.slug,designCode:1,size:'18 x 18',finish:'Black',unitPrice:5500,quantity:2,woodenFrame:false,ledBacklight:false,installation:false}
const body={idempotencyKey:'00000000-0000-4000-8000-000000000001',customer:{name:'Local Test',email:'localtest@gmail.com',phone:'03001234567',addressLine1:'Test street'},lines:[line],subtotal:11000,shippingTotal:500,grandTotal:11500}
test('canonical prices and shipping come from the committed catalog',()=>{
 const result=validateBasket([line],catalog.products);assert.equal(result.subtotal,11000);assert.equal(result.shipping,500);assert.equal(result.grand,11500)
 for(const changes of [{unitPrice:1},{unitPrice:NaN},{quantity:-1},{quantity:1.5},{quantity:100},{size:'1 x 1'},{finish:'Copper'},{ledBacklight:'yes'},{woodenFrame:true},{productId:'unknown'}])assert.throws(()=>validateBasket([{...line,...changes}],catalog.products))
 assert.throws(()=>validateBasket([{...line,ledBacklight:true}],catalog.products),/Prices have changed/)
 assert.equal(validateBasket([{...line,ledBacklight:true,unitPrice:7300}],catalog.products).subtotal,14600)
 const mixed=[line,{...line,size:'30 x 30',unitPrice:10700,quantity:3,areaSqFt:0}]
 assert.equal(validateBasket(mixed,catalog.products).shipping,1000)
 assert.equal(validateBasket(mixed.slice(0,1),catalog.products).shipping,500)
 assert.throws(()=>validateOrder({...body,shippingTotal:2400,grandTotal:13400}),/total changed/)
})
test('invalid customer, totals, request key and infeasible configurations are rejected',()=>{
 assert.equal(validateOrder(body).basket.grand,11500)
 for(const changes of [{idempotencyKey:'123'},{grandTotal:null},{subtotal:1},{customer:{...body.customer,phone:'1'}}])assert.throws(()=>validateOrder({...body,...changes}))
 const fixture=[{...product,variants:[{design_code:1,pricing:{sizes:[{label:'18 x 18',feasible:false,Silver:10,Black:10,Gold:10}]}}]}]
 assert.throws(()=>validateBasket([{...line,unitPrice:10}],fixture),/unavailable/)
})
test('private receipts reject tampering, arbitrary codes and expiry',()=>{
 const token=signReceipt(body.idempotencyKey);assert.equal(verifyReceipt(token),body.idempotencyKey)
 assert.equal(verifyReceipt(token+'x'),null);assert.equal(verifyReceipt('000000'),null)
 assert.equal(verifyReceipt(signReceipt(body.idempotencyKey,1)),null)
})
function mockDb(){const rows=new Map();let inserts=0;return {rows,get inserts(){return inserts},from(){let id,row;const query={select(){return query},eq(_,value){id=value;return query},maybeSingle:async()=>({data:rows.get(id)??null,error:null}),insert(value){row=value;return query},single:async()=>{if(rows.has(row.id))return {error:{code:'23505'}};inserts++;rows.set(row.id,{...row,created_at:new Date().toISOString()});return {data:rows.get(row.id),error:null}}};return query}}}
async function call(handler,payload){let text;const res={headers:{},setHeader(k,v){this.headers[k]=v},end(value){text=value}};await handler({method:'POST',headers:{'content-type':'application/json'},body:payload},res);return {status:res.statusCode,body:JSON.parse(text),headers:res.headers}}

test('malformed cart structures fail before database access or notification work',async()=>{
 const handler=createOrderHandler({database:()=>{throw Error('must not access database')}})
 for(const lines of [null,{},[],[null],[[]],Array.from({length:51},()=>line)]){
  const response=await call(handler,{...body,lines})
  assert.equal(response.status,400)
 }
})
test('retry after email failure returns the same durable order, not a second insert',async()=>{
 const db=mockDb(),handler=createOrderHandler({database:()=>db,rateLimit:async()=>{},deliver:async()=>{throw Error('Simulated provider timeout')}})
 const first=await call(handler,body),second=await call(handler,body)
 assert.equal(first.status,200);assert.equal(second.status,200);assert.equal(db.inserts,1)
 assert.equal(first.body.orderCode,second.body.orderCode);assert.equal(first.body.customerEmailSent,false)
 assert.ok(first.body.receiptToken);assert.equal(first.headers['Cache-Control'],'no-store')
 assert.equal(db.rows.values().next().value.notifications.customer.state,'pending')
 const changed={...body,customer:{...body.customer,name:'Different'}}
 assert.equal((await call(handler,changed)).status,409);assert.equal(db.inserts,1)
})
test('notification retry uses stable provider keys and records partial delivery',async()=>{
 const db=mockDb(),handler=createOrderHandler({database:()=>db,rateLimit:async()=>{},deliver:async()=>{throw Error()}})
 await call(handler,body);const row=db.rows.values().next().value,updates=[],keys=[]
 const fake={from:()=>({update(value){updates.push(value);return {eq:async()=>({error:null})}}})}
 const state=await deliverNotifications(fake,row,async(_,key)=>{keys.push(key);if(key.endsWith('merchant'))throw Error();return {data:{id:'local-only'}}})
 assert.equal(state.merchant.state,'pending');assert.equal(state.customer.state,'sent');assert.equal(updates.length,2)
 assert.deepEqual(keys,[`order-${row.id}-merchant`,`order-${row.id}-customer`])
})
test('body parsing enforces size and content type before work',async()=>{
 await assert.rejects(readBody({headers:{'content-type':'application/json'},body:'x'.repeat(40000)}),/too large/)
 await assert.rejects(readBody({headers:{'content-type':'text/plain'},body:'{}'}),/JSON/)
 await assert.rejects(readBody({headers:{'content-type':'application/json'},body:'{'}),/Invalid JSON/)
})

test('an already accepted checkout survives a later catalog price change',async()=>{
 const db=mockDb(),base={database:()=>db,rateLimit:async()=>{},deliver:async()=>{throw Error()}}
 assert.equal((await call(createOrderHandler(base),body)).status,200)
 const afterPriceChange=createOrderHandler({...base,validateOrder:()=>{throw Error('Simulated new catalog prices')}})
 assert.equal((await call(afterPriceChange,body)).status,200)
 assert.equal(db.inserts,1)
})
