import { createHash, createHmac, timingSafeEqual } from 'node:crypto'
import { shippingForLines } from '../../CodeShinobi/barqmech-store-v3/scripts/shipping.mjs'

export class CheckoutError extends Error { constructor(message,status=400){super(message);this.status=status} }
const sizeKey = s => String(s).trim().replace(/\s*(inches?|in\.?)$/i,'').replace(/×/g,'x').replace(/\s+/g,'').toLowerCase()
export function validateBasket(input,products) {
  if(!Array.isArray(input)||!input.length||input.length>50)throw new CheckoutError('Choose between 1 and 50 products.')
  const lines=input.map(line=>{
    if(!line || typeof line!=='object' || Array.isArray(line))throw new CheckoutError('Invalid cart item.')
    const p=products.find(p=>p.id===line.productId && p.slug===line.slug)
    if(!p)throw new CheckoutError('A product is no longer available. Please review your cart.',409)
    if(!Number.isSafeInteger(line.quantity)||line.quantity<1||line.quantity>99)throw new CheckoutError('Quantity must be a whole number between 1 and 99.')
    const code=line.designCode ?? (p.variants.length===1?p.variants[0].design_code:null)
    const variant=p.variants.find(v=>v.design_code===code)
    const tier=variant?.pricing.sizes.find(s=>sizeKey(s.label)===sizeKey(line.size))
    if(!tier || tier.feasible===false || !['Silver','Gold','Black'].includes(line.finish))throw new CheckoutError('This design, size or finish is unavailable.',409)
    for(const field of ['woodenFrame','ledBacklight','installation'])if(line[field]!==undefined && typeof line[field]!=='boolean')throw new CheckoutError('Invalid product add-on.')
    if(line.woodenFrame)throw new CheckoutError('Wooden frame is not currently available.')
    const unit=tier[line.finish]+(line.ledBacklight?tier.led:0)+(line.installation?tier.install:0)
    if(!Number.isSafeInteger(unit)||unit<=0)throw new CheckoutError('Pricing unavailable for this configuration.',409)
    if(!Number.isFinite(line.unitPrice)||line.unitPrice!==unit)throw new CheckoutError('Prices have changed. Please refresh the product and review your cart.',409)
    return {productId:p.id,slug:p.slug,categorySlug:p.category.toLowerCase(),title:p.title,imageUrl:p.images[0],designCode:code,size:tier.label,finish:line.finish,quantity:line.quantity,unitPrice:unit,woodenFrame:false,ledBacklight:!!line.ledBacklight,installation:!!line.installation}
  })
  const subtotal=lines.reduce((n,l)=>n+l.unitPrice*l.quantity,0),shipping=shippingForLines(lines)
  if(!Number.isSafeInteger(subtotal)||subtotal>100000000)throw new CheckoutError('Please contact us for this order size.')
  return {lines,subtotal,shipping,grand:subtotal+shipping}
}
export const requestHash = input => createHash('sha256').update(JSON.stringify(input)).digest('hex')
function secret() { const key=String(process.env.ORDER_RECEIPT_SECRET??'');if(key.length<32)throw new CheckoutError('Order service configuration incomplete.',503);return key }
export function signReceipt(id,expires=Math.floor(Date.now()/1000)+30*86400) {
  const body=Buffer.from(JSON.stringify({id,expires})).toString('base64url')
  return body+'.'+createHmac('sha256',secret()).update(body).digest('base64url')
}
export function verifyReceipt(token) {
  try { const [body,sig,...extra]=String(token).split('.');if(extra.length||!body||!sig)return null
    const expected=createHmac('sha256',secret()).update(body).digest();const actual=Buffer.from(sig,'base64url')
    if(actual.length!==expected.length||!timingSafeEqual(actual,expected))return null
    const value=JSON.parse(Buffer.from(body,'base64url').toString());return /^[0-9a-f-]{36}$/i.test(value.id)&&Number.isSafeInteger(value.expires)&&value.expires> Date.now()/1000?value.id:null
  } catch{return null}
}
