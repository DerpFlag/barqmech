import test from 'node:test'
import assert from 'node:assert/strict'
import {Readable} from 'node:stream'
import {createLocalAdminMiddleware} from '../scripts/local-admin.mjs'

async function call(handler,path,method='GET',body,headers={}){
 const req=Readable.from(body===undefined?[]:[JSON.stringify(body)])
 Object.assign(req,{url:path,method,headers:{host:'127.0.0.1:5177','content-type':'application/json',...headers},socket:{remoteAddress:'127.0.0.1'}})
 let text='';const res={headers:{},setHeader(key,value){this.headers[key]=value},end(value){text=value}}
 await handler(req,res,()=>{res.statusCode=404;res.end('{}')})
 return {status:res.statusCode,headers:res.headers,body:JSON.parse(text)}
}
test('local admin requires server password/cookie and expires/revokes sessions',async()=>{
 let time=1000
 const handler=createLocalAdminMiddleware('test-password-not-real',{now:()=>time})
 assert.equal((await call(handler,'/api/admin-orders')).status,401)
 assert.equal((await call(handler,'/api/admin-session')).body.ok,false)
 assert.equal((await call(handler,'/api/admin-login','POST',{password:'incorrect'})).status,401)
 const login=await call(handler,'/api/admin-login','POST',{password:'test-password-not-real'})
 assert.equal(login.status,200);assert.match(login.headers['Set-Cookie'],/HttpOnly; SameSite=Strict/)
 const cookie=login.headers['Set-Cookie'].split(';')[0]
 assert.equal((await call(handler,'/api/admin-session','GET',undefined,{cookie})).body.ok,true)
 const orders=await call(handler,'/api/admin-orders','GET',undefined,{cookie})
 assert.deepEqual(orders.body,{orders:[],localPreview:true});assert.equal(orders.headers['Cache-Control'],'private, no-store')
 assert.equal((await call(handler,'/api/admin-orders','PATCH',{}, {cookie})).status,503)
 await call(handler,'/api/admin-logout','POST',undefined,{cookie})
 assert.equal((await call(handler,'/api/admin-session','GET',undefined,{cookie})).body.ok,false)
 const again=await call(handler,'/api/admin-login','POST',{password:'test-password-not-real'})
 time+=3600001
 assert.equal((await call(handler,'/api/admin-session','GET',undefined,{cookie:again.headers['Set-Cookie'].split(';')[0]})).body.ok,false)
})
test('local auth rejects foreign hosts/origins and throttles guesses',async()=>{
 const handler=createLocalAdminMiddleware('test-password-not-real')
 assert.equal((await call(handler,'/api/admin-login','POST',{}, {origin:'https://foreign.test'})).status,403)
 assert.equal((await call(handler,'/api/admin-session','GET',undefined,{host:'public.test'})).status,403)
 for(let i=0;i<5;i++)assert.equal((await call(handler,'/api/admin-login','POST',{password:'wrong'})).status,401)
 assert.equal((await call(handler,'/api/admin-login','POST',{password:'wrong'})).status,429)
})
