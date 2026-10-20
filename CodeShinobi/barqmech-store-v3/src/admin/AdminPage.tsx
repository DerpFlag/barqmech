import { lazy, Suspense, useCallback, useEffect, useRef, useState, type FormEvent } from 'react'
import { AdminBrand, AdminWorkspace } from './AdminWorkspace.tsx'
import { adminRequest, AdminApiError } from './client.ts'
import type { AdminOrder } from './model.ts'
import './styles.css'

const Demo = import.meta.env.DEV ? lazy(()=>import('../dev/AdminDemo.tsx')) : null

export default function AdminPage() {
  useEffect(()=>{
    document.title='Studio desk — BarqMech'
    let meta=document.head.querySelector<HTMLMetaElement>('meta[name="robots"]')
    if(!meta){meta=document.createElement('meta');meta.name='robots';document.head.append(meta)}
    meta.content='noindex, nofollow'
  },[])
  if(Demo && new URLSearchParams(location.search).has('adminDemo'))return <Suspense fallback={<AdminWaiting/>}><Demo/></Suspense>
  return <AuthenticatedAdmin/>
}
function AdminWaiting(){return <main className="a-root a-wait" aria-busy="true"><AdminBrand/><p>Checking your secure session…</p></main>}

function AuthenticatedAdmin() {
  const [checking,setChecking]=useState(true),[authenticated,setAuthenticated]=useState(false),[error,setError]=useState<string|null>(null)
  const [password,setPassword]=useState(''),[busy,setBusy]=useState(false),[orders,setOrders]=useState<AdminOrder[]>([])
  const [loading,setLoading]=useState(false),[synced,setSynced]=useState<string|null>(null),[updating,setUpdating]=useState<string|null>(null)
  const [localPreview,setLocalPreview]=useState(false)
  const generation=useRef(0)
  const clearSession=useCallback(()=>{generation.current++;setOrders([]);setSynced(null);setAuthenticated(false)},[])
  useEffect(()=>{
    let current=true
    adminRequest<{ok:boolean}>('/api/admin-session').then(data=>{if(current)setAuthenticated(data.ok===true)}).catch(()=>{if(current)setAuthenticated(false)}).finally(()=>{if(current)setChecking(false)})
    return ()=>{current=false;generation.current++}
  },[])
  const loadOrders=useCallback(async()=>{
    const requestGeneration=generation.current
    setLoading(true);setError(null)
    try {
      const data=await adminRequest<{orders:AdminOrder[];localPreview?:boolean}>('/api/admin-orders')
      if(requestGeneration!==generation.current)return
      if(!Array.isArray(data.orders))throw new Error('The server returned an invalid order list.')
      setOrders(data.orders);setLocalPreview(data.localPreview===true);setSynced(new Date().toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'}))
    }catch(error){if(requestGeneration===generation.current){if(error instanceof AdminApiError&&error.status===401)clearSession();setError(error instanceof Error?error.message:'Could not load orders.')}}
    finally{if(requestGeneration===generation.current)setLoading(false)}
  },[clearSession])
  useEffect(()=>{if(authenticated)void loadOrders()},[authenticated,loadOrders])
  async function login(event:FormEvent){
    event.preventDefault();setBusy(true);setError(null)
    try{const data=await adminRequest<{ok:boolean}>('/api/admin-login',{method:'POST',body:JSON.stringify({password})});if(data.ok!==true)throw new Error('Sign-in was not confirmed. Please try again.');setPassword('');generation.current++;setAuthenticated(true)}
    catch(error){setError(error instanceof Error?error.message:'Sign-in failed.')}
    finally{setBusy(false)}
  }
  async function logout(){
    if(busy)return
    setBusy(true)
    // Clear customer records immediately; pending responses cannot restore them.
    clearSession();setError(null)
    try{await adminRequest('/api/admin-logout',{method:'POST'})}
    catch{setError('The screen is locked, but the server could not confirm sign-out. Retry sign-out before leaving this device.')}
    finally{setBusy(false)}
  }
  async function complete(id:string,completed:boolean){
    if(updating)return
    // Ignore an older list response that could otherwise undo this confirmed update.
    generation.current++
    const requestGeneration=generation.current
    setUpdating(id);setError(null);setLoading(false)
    try{
      const data=await adminRequest<{order:{id:string;order_completed:boolean;order_completed_at:string|null}}>('/api/admin-orders',{method:'PATCH',body:JSON.stringify({orderId:id,order_completed:completed})})
      if(requestGeneration!==generation.current)return
      if(!data.order||data.order.id!==id||typeof data.order.order_completed!=='boolean')throw new Error('The update was not confirmed. Refresh to check this order.')
      setOrders(previous=>previous.map(order=>order.id===id?{...order,...data.order}:order))
    }catch(error){if(requestGeneration===generation.current){if(error instanceof AdminApiError&&error.status===401)clearSession();setError(error instanceof Error?error.message:'Could not update this order.')}}
    finally{setUpdating(null)}
  }
  if(checking)return <AdminWaiting/>
  if(authenticated)return <AdminWorkspace localPreview={localPreview} orders={orders} loading={loading} error={error} synced={synced} updating={updating} onRefresh={()=>void loadOrders()} onLogout={()=>void logout()} onComplete={(id,value)=>void complete(id,value)}/>
  return <div className="a-root a-login"><header className="a-top"><AdminBrand/></header><main className="a-login-grid"><section className="a-login-story"><p className="a-eyebrow">BEHIND THE METALWORK</p><h1>Your workshop.<br/><span>In good order.</span></h1><p>A clear view of every piece, every customer, and what comes next.</p><div className="a-login-art" aria-hidden="true"><span/><span/><span/></div><p className="a-story-foot">BARQMECH / STUDIO DESK</p></section><section className="a-login-form"><p className="a-eyebrow">PRIVATE ACCESS</p><h2>Welcome back.</h2><p>Sign in to manage your orders.</p><form onSubmit={login}><label htmlFor="admin-password">Admin password</label><input id="admin-password" type="password" value={password} onChange={event=>setPassword(event.target.value)} autoComplete="current-password" required disabled={busy}/>{error&&<p className="a-alert" role="alert">{error}</p>}<button className="a-button" disabled={busy}>{busy?'Please wait…':'Enter the studio ↗'}</button></form>{error?.includes('sign-out')&&<button className="a-link-button" disabled={busy} onClick={()=>void logout()}>Retry sign-out</button>}<p className="a-private-note">Protected access. Customer information stays behind your admin session.</p></section></main></div>
}
