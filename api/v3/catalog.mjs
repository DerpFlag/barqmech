import {database,json} from '../../server/v3/http.mjs'
import {readListings,catalogVersion} from '../../server/v3/live-catalog.mjs'
export default async function handler(req,res){
  if(req.method!=='GET')return json(res,405,{error:'Method not allowed'})
  try{
    const slug=new URL(req.url,'http://localhost').searchParams.get('slug')
    const products=await readListings(database(),{slug:slug||undefined,details:!!slug})
    if(slug&&!products.length)return json(res,404,{error:'This listing is unavailable.'})
    return json(res,200,{products,version:catalogVersion(products)})
  }catch(error){return json(res,error.status??503,{error:error.status?error.message:'The catalog is temporarily unavailable.'})}
}
