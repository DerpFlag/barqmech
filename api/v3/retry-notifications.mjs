import { timingSafeEqual } from 'node:crypto'
import { database,json } from '../../server/v3/http.mjs'
import { deliverNotifications } from '../../server/v3/notifications.mjs'
export default async function handler(req,res){
  const expected=Buffer.from(`Bearer ${process.env.CRON_SECRET??''}`),provided=Buffer.from(String(req.headers.authorization??''))
  if(!process.env.CRON_SECRET||expected.length!==provided.length||!timingSafeEqual(expected,provided))return json(res,401,{error:'Unauthorized'})
  if(!['GET','POST'].includes(req.method))return json(res,405,{error:'Method not allowed'})
  try{
    const db=database();const {data,error}=await db.from('orders').select('*').not('notifications','is',null).or('notifications->merchant->>state.eq.pending,notifications->customer->>state.eq.pending').gte('created_at',new Date(Date.now()-30*86400000).toISOString()).order('created_at').limit(100)
    if(error)throw error
    let retried=0,needsReview=0
    for(const row of data){if(row.notifications?.customer?.state==='sent'&&row.notifications?.merchant?.state==='sent')continue;const status=await deliverNotifications(db,row);if(status?.customer?.state==='review'||status?.merchant?.state==='review')needsReview++;retried++}
    await db.from('storefront_request_limits').delete().lt('expires_at',new Date().toISOString())
    return json(res,needsReview?503:200,{retried,needsReview})
  }catch{return json(res,503,{error:'Notification retry unavailable'})}
}
