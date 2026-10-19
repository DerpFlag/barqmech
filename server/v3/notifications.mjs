import { enrichLinesWithDxfDownloads } from './manufacturing.mjs'
import { Resend } from 'resend'
import { canonicalOrigin } from './http.mjs'
import { signReceipt } from './checkout.mjs'
import { buildCustomerEmailHtml,buildMerchantEmailHtml,greetingFirstName } from './order-email.mjs'

export async function prepareNotificationPayloads(db,row) {
  const status=structuredClone(row.notifications),siteBase=canonicalOrigin()
  const receipt=`${siteBase}/checkout/success?receipt=${encodeURIComponent(signReceipt(row.id,Math.floor(new Date(row.created_at).getTime()/1000)+30*86400))}`
  const ctx={greetingName:greetingFirstName(row.customer_name),orderCode:row.order_code,grand:row.grand_total_pkr,shipping:row.shipping_pkr,subtotal:row.subtotal_pkr,siteBase,lines:status.lines,customer:{name:row.customer_name,email:row.customer_email,phone:row.customer_phone,addressLine1:row.address_line1,city:row.city,notes:row.notes}}
  for(const role of ['merchant','customer']){
    let context=ctx
    if(role==='merchant')try{context={...ctx,lines:await enrichLinesWithDxfDownloads(db,status.lines)}}catch{}
    const html=(role==='merchant'?buildMerchantEmailHtml(context):buildCustomerEmailHtml(context)).replace('</body>',`<p><a href="${receipt}">View your private order receipt</a></p></body>`)
    status[role].payload={from:process.env.ORDER_FROM_EMAIL,to:role==='merchant'?process.env.ORDER_NOTIFY_EMAIL:row.customer_email,replyTo:process.env.ORDER_NOTIFY_EMAIL,subject:`${role==='merchant'?'New order':'Order received'} ${row.order_code} · BarqMech`,html}
  }
  return status
}
export async function deliverNotifications(db,row,send) {
  const status=structuredClone(row.notifications)
  if(!status)return null
  // Provider deduplication lasts24h. Ambiguous older sends require reconciliation, not blind retries.
  const age=Date.now()-new Date(row.created_at).getTime()
  if(age>23*3600000){for(const role of ['merchant','customer'])if(status[role]?.state!=='sent')status[role]={...status[role],state:'review'};await db.from('orders').update({notifications:status}).eq('id',row.id);return status}
  const siteBase=canonicalOrigin(),receipt=`${siteBase}/checkout/success?receipt=${encodeURIComponent(signReceipt(row.id,Math.floor(new Date(row.created_at).getTime()/1000)+30*86400))}`
  const ctx={greetingName:greetingFirstName(row.customer_name),orderCode:row.order_code,grand:row.grand_total_pkr,shipping:row.shipping_pkr,subtotal:row.subtotal_pkr,siteBase,lines:status.lines,customer:{name:row.customer_name,email:row.customer_email,phone:row.customer_phone,addressLine1:row.address_line1,city:row.city,notes:row.notes}}
  const sender=send??((body,key)=>new Resend(process.env.RESEND_API_KEY).emails.send(body,{idempotencyKey:key}))
  for(const role of ['merchant','customer']) {
    if(status[role]?.state==='sent')continue
    if((status[role]?.attempts??0)>=8)continue
    if(status[role]?.retryAt && new Date(status[role].retryAt).getTime()>Date.now())continue
    const attempts=(status[role]?.attempts??0)+1
    try {
      if(!status[role].payload){
        let context=ctx
        if(role==='merchant')try{context={...ctx,lines:await enrichLinesWithDxfDownloads(db,status.lines)}}catch{/* Preserve product/design references if private CAD storage is unavailable. */}
        const html=(role==='merchant'?buildMerchantEmailHtml(context):buildCustomerEmailHtml(context)).replace('</body>',`<p><a href="${receipt}">View your private order receipt</a></p></body>`)
        status[role].payload={from:process.env.ORDER_FROM_EMAIL,to:role==='merchant'?process.env.ORDER_NOTIFY_EMAIL:row.customer_email,replyTo:process.env.ORDER_NOTIFY_EMAIL,subject:`${role==='merchant'?'New order':'Order received'} ${row.order_code} · BarqMech`,html}
        const saved=await db.from('orders').update({notifications:status}).eq('id',row.id)
        if(saved.error)throw Error('Notification payload could not be saved')
      }
      const result=await sender(status[role].payload,`order-${row.id}-${role}`)
      if(result.error)throw Error('Delivery pending')
      status[role]={...status[role],state:'sent',attempts}
    }catch{status[role]={...status[role],state:attempts>=8?'review':'pending',attempts,retryAt:new Date(Date.now()+Math.min(60,2**attempts)*60000).toISOString()}}
    const {error}=await db.from('orders').update({notifications:status}).eq('id',row.id)
    if(error)throw Error('Notification status update failed')
  }
  return status
}
