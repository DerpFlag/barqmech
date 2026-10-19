import { verifyReceipt } from '../../server/v3/checkout.mjs'
import { database,json } from '../../server/v3/http.mjs'
export default async function handler(req,res){
  if(req.method!=='GET')return json(res,405,{error:'Method not allowed'})
  const id=verifyReceipt(req.query?.token)
  if(!id)return json(res,404,{error:'Order link unavailable or expired.'})
  try{
    const {data,error}=await database().from('orders').select('order_code,subtotal_pkr,shipping_pkr,grand_total_pkr,payment_method,notifications').eq('id',id).single()
    if(error||!data)return json(res,404,{error:'Order link unavailable or expired.'})
    // Never return address, email, phone, private CAD paths or raw notification payload.
    return json(res,200,{code:data.order_code,subtotal:data.subtotal_pkr,shipping:data.shipping_pkr,total:data.grand_total_pkr,payment:data.payment_method,emailSent:data.notifications?.customer?.state==='sent'})
  }catch{return json(res,503,{error:'Order service temporarily unavailable.'})}
}
