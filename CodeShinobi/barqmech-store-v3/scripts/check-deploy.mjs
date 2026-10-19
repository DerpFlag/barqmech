// Only deploy builds require server secrets. Local builds/tests remain offline and side-effect free.
if(process.env.VERCEL){
  if(process.env.CATALOG_SOURCE!=='supabase')throw Error('Set CATALOG_SOURCE=supabase after applying/seeding the live-listings migration.')
  const required=['SUPABASE_URL','SUPABASE_SERVICE_ROLE_KEY','ORDER_RECEIPT_SECRET','PUBLIC_SITE_URL','RESEND_API_KEY','ORDER_FROM_EMAIL','ORDER_NOTIFY_EMAIL','ADMIN_SESSION_SECRET','ADMIN_PASSWORD']
  const missing=required.filter(key=>!process.env[key]?.trim())
  if(missing.length)throw Error(`Missing deployment settings: ${missing.join(', ')}`)
  for(const key of ['ORDER_RECEIPT_SECRET','ADMIN_SESSION_SECRET'])if(process.env[key].length<32)throw Error(`${key} must be at least32 characters`)
  const origin=new URL(process.env.PUBLIC_SITE_URL)
  if(origin.protocol!=='https:' || origin.pathname!=='/' || origin.search || origin.hash)throw Error('PUBLIC_SITE_URL must be an HTTPS origin without a path or query')
  if(process.env.VERCEL_ENV==='production' && process.env.ORDER_FROM_EMAIL.includes('@resend.dev'))throw Error('Use a verified sender domain for production order emails')
}
