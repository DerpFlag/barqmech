import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { formatPriceNoDecimals } from '../data/catalog.ts'
type Receipt={code:string;subtotal:number;shipping:number;total:number;emailSent:boolean}
export default function CheckoutSuccessRoute(){
  const [params]=useSearchParams(),token=params.get('receipt')??''
  const [receipt,setReceipt]=useState<Receipt|null>(null),[error,setError]=useState(''),[retry,setRetry]=useState(0)
  useEffect(()=>{
    setReceipt(null);setError('')
    if(!token){setError('Use the private receipt link from checkout or your confirmation email.');return}
    const controller=new AbortController()
    const timeout=window.setTimeout(()=>{controller.abort();setError('The connection took too long. Your order remains saved; please retry this receipt link.')},15000)
    void fetch(`/api/v3/receipt?token=${encodeURIComponent(token)}`,{signal:controller.signal,cache:'no-store'}).then(async response=>{if(!response.ok)throw Error('Your receipt could not be verified. Please retry or contact us.');return response.json()}).then(value=>{window.clearTimeout(timeout);setReceipt(value)}).catch(error=>{window.clearTimeout(timeout);if(error.name!=='AbortError')setError(error.message)})
    return()=>{window.clearTimeout(timeout);controller.abort()}
  },[token,retry])
  if(!receipt&&!error)return <main className="shop-route-page checkout-page" aria-busy="true" aria-label="Order receipt"><div className="checkout-panel product-placeholder__copy" aria-hidden="true"><div className="product-placeholder__title" /><div className="product-placeholder__options" /></div></main>
  return <main className="shop-route-page checkout-page"><div className="checkout-panel checkout-success">
    <h1 className="checkout-heading">{receipt?'Thank you for your order':'Order receipt unavailable'}</h1>
    {receipt?<><p>We’ve received your order. Your order code is <strong>{receipt.code}</strong>.</p><div className="checkout-success-cod-card"><p>Amount due on delivery</p><p className="checkout-success-cod-amount">{formatPriceNoDecimals(receipt.total)}</p><p>Products {formatPriceNoDecimals(receipt.subtotal)} + shipping {formatPriceNoDecimals(receipt.shipping)}</p></div><p>{receipt.emailSent?'Your confirmation email has been sent.':'Your order is saved. The confirmation email is pending; keep this private receipt link for your records.'}</p></>:<><p role="alert">{error}</p>{token?<button className="cut-button" onClick={()=>setRetry(v=>v+1)}>Try again</button>:null}</>}
    <div className="checkout-success-actions"><Link className="cut-button" to="/products">Continue shopping</Link><Link className="cut-button" to="/#contact">Contact us</Link></div>
  </div></main>
}
