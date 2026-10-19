import { randomInt } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { compileCatalog,parseCsv } from '../../CodeShinobi/barqmech-store-v3/scripts/build-catalog.mjs'
const catalog={products:compileCatalog(parseCsv(readFileSync(new URL('../../CodeShinobi/barqmech-store-v3/catalog/products.csv',import.meta.url),'utf8')),parseCsv(readFileSync(new URL('../../CodeShinobi/barqmech-store-v3/catalog/prices.csv',import.meta.url),'utf8')))}
import { isPakistanMobile } from '../shared/pakistan-phone.mjs'
import { validateGmailEmail } from '../shared/gmail-email.mjs'
import { CheckoutError,validateBasket,requestHash,signReceipt } from './checkout.mjs'
import { database,json,readBody,enforceOrigin,canonicalOrigin,rateLimit } from './http.mjs'
import { buildPersistedLines } from './order-email.mjs'
import { deliverNotifications,prepareNotificationPayloads } from './notifications.mjs'
import {readListings} from './live-catalog.mjs'

const text=(value,max)=>{const str=String(value??'').trim();if(str.length>max)throw new CheckoutError('A form field is too long.');return str}
export function checkoutRequestHash(body) {
  const customer=Object.fromEntries(['name','email','phone','addressLine1','city','notes'].map(key=>[key,String(body.customer?.[key]??'').trim()]))
  const lines=Array.isArray(body.lines)?body.lines.map(line=>Object.fromEntries(['productId','slug','designCode','size','finish','unitPrice','quantity','woodenFrame','ledBacklight','installation'].map(key=>[key,line[key]??(['woodenFrame','ledBacklight','installation'].includes(key)?false:null)]))):[]
  return requestHash({customer,lines})
}
export function validateOrder(body,products=catalog.products) {
  if(!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(body.idempotencyKey??''))throw new CheckoutError('Please refresh checkout before ordering.')
  const c=body.customer??{},email=validateGmailEmail(text(c.email,254))
  const customer={name:text(c.name,150),email:email.normalized,phone:text(c.phone,40),addressLine1:text(c.addressLine1,500),city:text(c.city,100),notes:text(c.notes,2000)}
  if(!customer.name||!customer.addressLine1)throw new CheckoutError('Please provide your name and street address.')
  if(!email.ok)throw new CheckoutError(email.reason)
  if(!isPakistanMobile(customer.phone))throw new CheckoutError('Please enter a valid Pakistan mobile number.')
  const basket=validateBasket(body.lines,products)
  for(const [name,value] of [['subtotal',basket.subtotal],['shippingTotal',basket.shipping],['grandTotal',basket.grand]])if(!Number.isFinite(body[name])||body[name]!==value)throw new CheckoutError('Your order total changed. Please review your cart.',409)
  return {customer,basket,hash:checkoutRequestHash(body)}
}
export function createOrderHandler(dependencies={}) {
 const getDatabase=dependencies.database??database, limit=dependencies.rateLimit??rateLimit, deliver=dependencies.deliver??deliverNotifications, validate=dependencies.validateOrder??validateOrder
 return async function handler(req,res) {
  if(req.method!=='POST')return json(res,405,{error:'Method not allowed'})
  try {
    enforceOrigin(req);const body=await readBody(req)
    if(!body || typeof body!=='object' || Array.isArray(body))throw new CheckoutError('Invalid checkout data.')
    if(!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(body.idempotencyKey??''))throw new CheckoutError('Please refresh checkout before ordering.')
    if(!Array.isArray(body.lines)||!body.lines.length||body.lines.length>50||body.lines.some(line=>!line||typeof line!=='object'||Array.isArray(line)))throw new CheckoutError('Choose between 1 and 50 valid products.')
    const hash=checkoutRequestHash(body)
    signReceipt(body.idempotencyKey);canonicalOrigin()
    if(!process.env.RESEND_API_KEY||!process.env.ORDER_FROM_EMAIL||!process.env.ORDER_NOTIFY_EMAIL)throw new CheckoutError('Order notifications are not configured.',503)
    const db=getDatabase();await limit(req,db,'checkout',10)
    const select='id,order_code,request_hash,notifications,created_at,customer_name,customer_email,customer_phone,address_line1,city,notes,subtotal_pkr,shipping_pkr,grand_total_pkr'
    let {data:row,error}=await db.from('orders').select(select).eq('id',body.idempotencyKey).maybeSingle()
    if(error)throw new CheckoutError('Order service setup is incomplete. Please contact us.',503)
    if(row && row.request_hash!==hash)throw new CheckoutError('A previous order may already be saved for this checkout. Retry with the original details or contact us before ordering again.',409)
    if(!row){
      const products=dependencies.products?await dependencies.products(db,body.lines):process.env.CATALOG_SOURCE==='supabase'?await readListings(db,{ids:[...new Set((body.lines??[]).map(line=>line.productId))],details:true}):catalog.products
      const {customer,basket}=validate(body,products)
      for(let attempt=0;attempt<12;attempt++){
        const candidate={id:body.idempotencyKey,created_at:new Date().toISOString(),request_hash:hash,order_code:String(randomInt(100000,1000000)),customer_name:customer.name,customer_email:customer.email,customer_phone:customer.phone,address_line1:customer.addressLine1,city:customer.city||null,notes:customer.notes||null,lines:buildPersistedLines(basket.lines,body.idempotencyKey,canonicalOrigin()),subtotal_pkr:basket.subtotal,shipping_pkr:basket.shipping,grand_total_pkr:basket.grand,payment_method:'cod',notifications:{lines:basket.lines,merchant:{state:'pending',attempts:0},customer:{state:'pending',attempts:0}}}
        candidate.notifications=await prepareNotificationPayloads(db,candidate)
        const inserted=await db.from('orders').insert(candidate).select(select).single()
        if(!inserted.error){row=inserted.data;break}
        if(inserted.error.code!=='23505')throw new CheckoutError('Your order could not be saved. Please try again.',503)
        const existing=await db.from('orders').select(select).eq('id',body.idempotencyKey).maybeSingle()
        if(existing.data){if(existing.data.request_hash!==hash)throw new CheckoutError('A previous order may already be saved for this checkout. Retry with the original details or contact us before ordering again.',409);row=existing.data;break}
      }
      if(!row)throw new CheckoutError('Please try again.',503)
    }
    // Durable accepted order exists before email. Never delete it for a notification failure.
    let notifications=row.notifications
    try{notifications=await deliver(db,row)}catch{ /* Persisted pending state is retried by the protected worker. */ }
    return json(res,200,{orderCode:row.order_code,receiptToken:signReceipt(row.id),customerEmailSent:notifications?.customer?.state==='sent',merchantEmailSent:notifications?.merchant?.state==='sent'})
  }catch(error){return json(res,error instanceof CheckoutError?error.status:503,{error:error instanceof CheckoutError?error.message:'Order service is temporarily unavailable. Please try again.'})}
}

}
export default createOrderHandler()
