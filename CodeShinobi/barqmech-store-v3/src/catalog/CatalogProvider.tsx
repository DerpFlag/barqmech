import {createContext,useCallback,useContext,useEffect,useMemo,useRef,useState,type ReactNode} from 'react'
import type {CatalogProduct} from '@store/catalog/types.ts'
import type {CatalogDiagnostics} from '@store/catalog/loadCatalog.ts'
import browse from '../data/catalog-browse.json'
declare const __LIVE_CATALOG__:boolean
const live=import.meta.env.DEV||__LIVE_CATALOG__
type Product=CatalogProduct&{revision?:number}
const initial=browse.products as Product[]
type Value={products:CatalogProduct[];loading:boolean;initializing:boolean;error:string|null;diagnostics:CatalogDiagnostics|null;buildId:string;refetch:()=>void;errorFor:(slug:string)=>string|null;ensureProduct:(slug:string)=>Promise<void>}
const Context=createContext<Value|null>(null)
export function useCatalog(){const value=useContext(Context);if(!value)throw Error('CatalogProvider missing');return value}
export function useCatalogProducts(){return useCatalog().products}
export function CatalogProvider({children}:{children:ReactNode}){
 const [products,setProducts]=useState<Product[]>(initial),[initializing,setInitializing]=useState(live),[error,setError]=useState<string|null>(null),[errors,setErrors]=useState<Record<string,string>>({})
 const details=useRef(new Map<string,Product>()),pending=useRef(new Map<string,Promise<void>>()),summary=useRef(initial),version=useRef<string>(browse.version),refreshPending=useRef<Promise<void>|null>(null)
 const refreshedAt=useRef(-Infinity)
 const applyDetails=useCallback(()=>setProducts(current=>{
  let changed=false
  const next=current.map(product=>{const detail=details.current.get(product.slug);if(detail&&detail!==product){changed=true;return detail}return product})
  return changed?next:current
 }),[])
 const refresh=useCallback((force=false)=>{
  if(!live)return Promise.resolve()
  if(refreshPending.current)return refreshPending.current
  // Hover/focus can fire repeatedly across cards. Explicit refresh, focus,
  // broadcast invalidation and the 30s poll bypass this short reuse window.
  if(!force&&performance.now()-refreshedAt.current<15000)return Promise.resolve()
  refreshPending.current=(async()=>{
   const response=await fetch('/api/v3/catalog',{cache:'no-store',signal:AbortSignal.timeout(15000)})
   if(!response.ok)throw Error('Catalog updates are temporarily unavailable. Please retry before ordering.')
   const data=await response.json() as {products:Product[];version:string}
   if(!Array.isArray(data.products)||typeof data.version!=='string')throw Error('Catalog response unavailable.')
   summary.current=data.products
   refreshedAt.current=performance.now()
   if(version.current!==data.version){
    version.current=data.version
    const revisions=new Map(data.products.map(product=>[product.slug,product.revision]))
    for(const [slug,p] of details.current)if(!revisions.has(slug)||revisions.get(slug)!==p.revision)details.current.delete(slug)
    setProducts(data.products.map(p=>details.current.get(p.slug)??p))
   }
   setError(null)
  })().catch(error=>{setError(error.message);throw error}).finally(()=>{setInitializing(false);refreshPending.current=null})
  return refreshPending.current
 },[])
 useEffect(()=>{
  if(!live)return
  const update=()=>{if(document.visibilityState==='visible')void refresh(true).catch(()=>{})}
  update();const timer=setInterval(update,30000)
  window.addEventListener('focus',update);document.addEventListener('visibilitychange',update)
  const channel=typeof BroadcastChannel!=='undefined'?new BroadcastChannel('barqmech-catalog'):null
  if(channel)channel.onmessage=update
  return()=>{clearInterval(timer);window.removeEventListener('focus',update);document.removeEventListener('visibilitychange',update);channel?.close()}
 },[refresh])
 const ensureProduct=useCallback(async(slug:string)=>{
  setErrors(current=>{if(!current[slug])return current;const next={...current};delete next[slug];return next})
  try{
   if(live)await refresh()
   if(!summary.current.some(p=>p.slug===slug))return
   if(details.current.has(slug)){applyDetails();return}
   if(!pending.current.has(slug))pending.current.set(slug,(async()=>{
    const response=await fetch(live?`/api/v3/catalog?slug=${encodeURIComponent(slug)}`:`/catalog/${browse.version}/${encodeURIComponent(slug)}.json`,{cache:live?'no-store':'default',signal:AbortSignal.timeout(15000)})
    if(!response.ok)throw Error('Product options could not be retrieved. Please retry.')
    const payload=await response.json(),product=(live?payload.products?.[0]:payload) as Product
    if(!product||product.slug!==slug||!product.variants?.length)throw Error('This listing is unavailable.')
    if(live&&!summary.current.some(p=>p.slug===slug&&p.revision===product.revision))return
    details.current.set(slug,product)
   })().finally(()=>pending.current.delete(slug)))
   await pending.current.get(slug);applyDetails()
  }catch(error){setErrors(current=>({...current,[slug]:error instanceof Error?error.message:'Product options unavailable.'}));throw error}
 },[refresh,applyDetails])
 const value=useMemo(()=>({products,loading:false,initializing,error,errorFor:(slug:string)=>errors[slug]??null,diagnostics:null,buildId:version.current,ensureProduct,refetch:()=>{void refresh(true).then(()=>{const slug=location.pathname.split('/').pop();if(slug)void ensureProduct(slug).catch(()=>{})}).catch(()=>{})}}),[products,errors,ensureProduct,refresh,initializing,error])
 return <Context.Provider value={value}>{error&&<div className="catalog-live-notice" role="alert">{error} <button onClick={value.refetch}>Retry</button></div>}{children}</Context.Provider>
}
