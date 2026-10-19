import { createClient } from '@supabase/supabase-js'
import { createHmac } from 'node:crypto'
import { CheckoutError } from './checkout.mjs'
export function json(res,status,value){res.setHeader('Cache-Control','no-store');res.setHeader('Referrer-Policy','no-referrer');res.statusCode=status;res.setHeader('Content-Type','application/json');res.end(JSON.stringify(value))}
export function database(){const url=process.env.SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;if(!url||!key)throw new CheckoutError('Order service configuration incomplete.',503);return createClient(url,key,{auth:{persistSession:false}})}
export function canonicalOrigin(){
  const configured=process.env.PUBLIC_SITE_URL || (process.env.VERCEL_ENV!=='production' && process.env.VERCEL_URL?`https://${process.env.VERCEL_URL}`:'')
  if(!configured && !process.env.VERCEL)return 'http://localhost:5177'
  try {const url=new URL(configured);if(url.protocol!=='https:' && !(url.hostname==='localhost'&&!process.env.VERCEL))throw Error();return url.origin}catch{throw new CheckoutError('Website origin is not configured.',503)}
}
export function enforceOrigin(req){const origin=req.headers.origin;if(!origin)return;const allowed=new Set([canonicalOrigin(),...(process.env.ALLOWED_ORIGINS??'').split(',').map(s=>s.trim()).filter(Boolean)]);if(!allowed.has(origin))throw new CheckoutError('Request origin not allowed.',403)}
export async function readBody(req,limit=32768){
  if(Number(req.headers['content-length'])>limit)throw new CheckoutError('Request is too large.',413)
  if(!String(req.headers['content-type']??'').includes('application/json'))throw new CheckoutError('Use JSON request data.',415)
  if(req.body && typeof req.body==='object'&&!Buffer.isBuffer(req.body)){if(Buffer.byteLength(JSON.stringify(req.body))>limit)throw new CheckoutError('Request is too large.',413);return req.body}
  if(typeof req.body==='string'){if(Buffer.byteLength(req.body)>limit)throw new CheckoutError('Request is too large.',413);try{return JSON.parse(req.body)}catch{throw new CheckoutError('Invalid JSON')}}
  let size=0;const chunks=[];for await(const chunk of req){size+=Buffer.byteLength(chunk);if(size>limit)throw new CheckoutError('Request is too large.',413);chunks.push(Buffer.from(chunk))}try{return JSON.parse(Buffer.concat(chunks).toString())}catch{throw new CheckoutError('Invalid JSON')}
}
export async function rateLimit(req,db,bucket,maximum){
  const ip=String(req.headers['x-vercel-forwarded-for']??req.socket?.remoteAddress??'unknown').split(',')[0].trim()
  const key=String(process.env.ORDER_RECEIPT_SECRET??'');if(key.length<32)throw new CheckoutError('Order service configuration incomplete.',503)
  const hashed=createHmac('sha256',key).update(ip).digest('hex')
  const {data,error}=await db.rpc('claim_storefront_request',{p_key:`${bucket}:${hashed}`,p_limit:maximum,p_seconds:600})
  if(error)throw new CheckoutError('Order service setup is incomplete. Please contact us.',503)
  if(data!==true)throw new CheckoutError('Too many requests. Please try again in a few minutes.',429)
}
