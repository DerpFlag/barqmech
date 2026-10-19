import {createHash,randomBytes,timingSafeEqual} from 'node:crypto'

/** Vite-only, loopback-only local sign-in. Never reads production order data. */
export function createLocalAdminMiddleware(password,{now=Date.now,catalog}={}) {
  const sessions=new Map(),attempts=new Map(),cookieName='bm_v3_local_admin'
  const digest=value=>createHash('sha256').update(String(value)).digest()
  return async function localAdmin(req,res,next) {
    const route=String(req.url??'').split('?')[0]
    if(!['/api/admin-session','/api/admin-login','/api/admin-logout','/api/admin-orders','/api/v3/admin-catalog','/api/v3/catalog'].includes(route))return next()
    const json=(status,body)=>{res.statusCode=status;res.setHeader('Content-Type','application/json');res.setHeader('Cache-Control','private, no-store');res.end(JSON.stringify(body))}
    const host=String(req.headers.host??''),address=req.socket?.remoteAddress??''
    let hostname
    try{hostname=new URL('http://'+host).hostname}catch{return json(403,{error:'Local access only.'})}
    if(!['localhost','127.0.0.1','[::1]'].includes(hostname)||!['127.0.0.1','::1','::ffff:127.0.0.1'].includes(address))return json(403,{error:'Local access only.'})
    if(req.headers.origin && req.headers.origin!==`http://${host}`)return json(403,{error:'Invalid request origin.'})
    const time=now()
    for(const [key,expiry] of sessions)if(expiry<=time)sessions.delete(key)
    const token=String(req.headers.cookie??'').split(';').map(s=>s.trim()).find(s=>s.startsWith(cookieName+'='))?.slice(cookieName.length+1)
    const authenticated=token&&sessions.has(token)
    if(route==='/api/v3/catalog'||route==='/api/v3/admin-catalog'){
      const admin=route.endsWith('admin-catalog')
      if(admin&&!authenticated)return json(401,{error:'Unauthorized'})
      if(!catalog)return json(503,{error:'Local listings are not configured.'})
      try{
        if(req.method==='GET'){
          const params=new URL(req.url,'http://localhost').searchParams,id=params.get('id'),slug=params.get('slug')
          const result=catalog.read({all:admin,id,slug,details:!!id||!!slug})
          if((id||slug)&&!result.listings.length)return json(404,{error:'Listing unavailable.'})
          return json(200,admin?{listings:result.listings,localPreview:true}:{products:result.listings,version:result.version})
        }
        if(admin&&['POST','PATCH'].includes(req.method)){
          if(!String(req.headers['content-type']??'').startsWith('application/json'))return json(415,{error:'Use JSON.'})
          let text='';for await(const chunk of req){text+=chunk;if(Buffer.byteLength(text)>1000000)return json(413,{error:'Listing too large.'})}
          return json(200,{listing:catalog.save(JSON.parse(text))})
        }
        return json(405,{error:'Method not allowed'})
      }catch(error){return json(error.status??400,{error:error.message})}
    }
    if(route==='/api/admin-session'&&req.method==='GET')return json(200,{ok:!!authenticated})
    if(route==='/api/admin-login'&&req.method==='POST'){
      if(!String(req.headers['content-type']??'').startsWith('application/json'))return json(400,{error:'Invalid request.'})
      const previous=attempts.get(address)
      const attempt=previous&&previous.until>time?previous:{count:0,until:time+600000}
      attempts.set(address,attempt)
      if(attempt.count>=5)return json(429,{error:'Too many attempts. Please try again in 10 minutes.'})
      attempt.count++
      let body
      try{let text='';for await(const chunk of req){text+=chunk;if(Buffer.byteLength(text)>4096)return json(413,{error:'Request too large.'})}body=JSON.parse(text)}catch{return json(400,{error:'Invalid request.'})}
      if(!password || typeof body?.password!=='string'||!timingSafeEqual(digest(password),digest(body.password)))return json(401,{error:'Incorrect password. Please try again.'})
      attempts.delete(address)
      if(token)sessions.delete(token)
      const session=randomBytes(32).toString('hex');sessions.set(session,time+3600000)
      res.setHeader('Set-Cookie',`${cookieName}=${session}; Path=/; HttpOnly; SameSite=Strict; Max-Age=3600`)
      return json(200,{ok:true})
    }
    if(route==='/api/admin-logout'&&req.method==='POST'){
      if(token)sessions.delete(token)
      res.setHeader('Set-Cookie',`${cookieName}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0`)
      return json(200,{ok:true})
    }
    if(route==='/api/admin-orders'){
      if(!authenticated)return json(401,{error:'Unauthorized'})
      if(req.method==='GET')return json(200,{orders:[],localPreview:true})
      if(req.method==='PATCH')return json(503,{error:'Live orders are not connected to this local workspace.'})
    }
    return json(405,{error:'Method not allowed'})
  }
}
