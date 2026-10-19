import test from 'node:test'
import assert from 'node:assert/strict'
import {matchingOrders,orderStats,safeWebUrl} from '../src/admin/model.ts'
import {adminRequest,AdminApiError} from '../src/admin/client.ts'

const orders=[{id:'1',order_code:'204816',customer_name:'Sample A',customer_phone:'+92 300 0000000',customer_email:'a@example.test',city:'Lahore',grand_total_pkr:6000,order_completed:false,order_lines:[{title:'Metal artwork'}]},
 {id:'2',order_code:'204815',customer_name:'Sample B',customer_phone:'00000000001',customer_email:'b@example.test',city:'Karachi',grand_total_pkr:17000,order_completed:true,order_lines:[]}]

test('admin search and status filters compose without changing stored totals',()=>{
 assert.deepEqual(orderStats(orders),{total:2,open:1,done:1,value:23000})
 for(const query of ['204816','sample a','LAHORE','metal artwork','923000000000'])assert.equal(matchingOrders(orders,'all',query)[0]?.id,'1')
 assert.equal(matchingOrders(orders,'done','Lahore').length,0)
 assert.equal(matchingOrders(orders,'open','').length,1)
 assert.equal(matchingOrders(orders,'all','unknown').length,0)
 assert.equal(orders[0].grand_total_pkr,6000)
})
test('stored admin links exclude executable and protocol-relative URLs',()=>{
 for(const url of ['javascript:alert(1)','data:text/html,abc','//untrusted.test','/\\untrusted.test'])assert.equal(safeWebUrl(url),undefined)
 assert.equal(safeWebUrl('/products/artwork/test'),'/products/artwork/test')
 assert.equal(safeWebUrl('https://example.test/product'),'https://example.test/product')
})
test('admin client requires JSON success and preserves cookie authentication without caching',async()=>{
 let called
 const fake=async(url,options)=>{called={url,options};return new Response(JSON.stringify({ok:true}),{headers:{'Content-Type':'application/json'}})}
 assert.deepEqual(await adminRequest('/api/admin-session',{},fake),{ok:true})
 assert.equal(called.options.credentials,'include');assert.equal(called.options.cache,'no-store')
 await assert.rejects(adminRequest('/api/admin-login',{},async()=>new Response('<html>SPA fallback</html>',{headers:{'Content-Type':'text/html'}})),/Sign-in service is unavailable/)
 await assert.rejects(adminRequest('/api/admin-orders',{},async()=>new Response(JSON.stringify({error:'Unauthorized'}),{status:401,headers:{'Content-Type':'application/json'}})),error=>error instanceof AdminApiError&&error.status===401)
 await assert.rejects(adminRequest('/api/admin-orders',{},async()=>{throw Error('Offline')}),/Could not connect/)
})
