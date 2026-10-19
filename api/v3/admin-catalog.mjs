import {getAdminTokenFromReq,verifyAdminToken} from '../../server/shared/admin-auth.mjs'
import {database,json,enforceOrigin,readBody,rateLimit} from '../../server/v3/http.mjs'
import {readListings,saveListing} from '../../server/v3/live-catalog.mjs'
export default async function handler(req,res){
  try{
    let authenticated=false
    try{authenticated=verifyAdminToken(getAdminTokenFromReq(req))}catch{}
    if(!authenticated)return json(res,401,{error:'Unauthorized'})
    const db=database()
    if(req.method==='GET'){
      const id=new URL(req.url,'http://localhost').searchParams.get('id')
      const listings=await readListings(db,{all:true,ids:id?[id]:undefined,details:!!id})
      if(id&&!listings.length)return json(res,404,{error:'Listing not found.'})
      return json(res,200,{listings})
    }
    if(req.method==='POST'||req.method==='PATCH'){
      enforceOrigin(req);await rateLimit(req,db,'admin-listing-save',60)
      const listing=await saveListing(db,await readBody(req,1000000))
      return json(res,200,{listing})
    }
    return json(res,405,{error:'Method not allowed'})
  }catch(error){return json(res,error.status??503,{error:error.status?error.message:'Listing management is temporarily unavailable.'})}
}
