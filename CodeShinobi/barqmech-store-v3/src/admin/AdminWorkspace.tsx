import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import logoUrl from '../assets/optimized/logo.webp?url'
import ListingsPanel from './ListingsPanel.tsx'
import type {ListingSource} from './listing-types.ts'
import { matchingOrders, money, orderStats, safeWebUrl, when, type AdminOrder, type Filter } from './model.ts'

type Props = {orders:AdminOrder[]; loading:boolean; error:string|null; synced:string|null; updating:string|null
  onRefresh:()=>void; onLogout:()=>void; onComplete:(id:string,completed:boolean)=>void; demo?:boolean;localPreview?:boolean;listingsSource?:ListingSource}

export function AdminBrand() { return <div className="a-brand-group"><Link to="/" className="a-brand" aria-label="BarqMech storefront"><img className="a-brand-mark" src={logoUrl} alt=""/><img className="a-brand-wordmark" src="/brand/barqmech-wordmark.png?v=2" alt="BarqMech"/></Link><span className="a-brand-label">Studio desk</span></div> }
function pieceLabel(order:AdminOrder) {
  if(!order.order_lines?.length)return 'Items unavailable'
  const count=order.order_lines.reduce((sum,line)=>sum+line.quantity,0)
  return `${count} ${count===1?'piece':'pieces'}`
}

export function AdminWorkspace({orders,loading,error,synced,updating,onRefresh,onLogout,onComplete,demo=false,localPreview=false,listingsSource}:Props) {
  const [section,setSection]=useState<'orders'|'listings'>('orders'),[visitedListings,setVisitedListings]=useState(false)
  const [filter,setFilter] = useState<Filter>('all'), [query,setQuery] = useState(''), [selected,setSelected] = useState<string|null>(null)
  const filtered = useMemo(()=>matchingOrders(orders,filter,query),[orders,filter,query])
  const stats = useMemo(()=>orderStats(orders),[orders])
  const active = filtered.find(order=>order.id===selected) ?? filtered[0]
  return <div className="a-root a-workspace">
    <a className="a-skip" href="#admin-orders">Skip to orders</a>
    <header className="a-top"><AdminBrand/><nav aria-label="Admin navigation"><Link to="/">View shop ↗</Link><button onClick={onLogout}>Sign out</button></nav></header>
    <main className="a-main">
      {demo && <p className="a-demo" role="status">Design preview · fictional orders · listing edits stay in this session</p>}
      {import.meta.env.DEV && localPreview && <p className="a-demo" role="status">Local workspace · live orders aren’t connected yet. <a href="/admin?adminDemo=1">View sample orders ↗</a></p>}
      <nav className="a-sections" aria-label="Admin sections"><button aria-pressed={section==='orders'} onClick={()=>setSection('orders')}>Orders</button><button aria-pressed={section==='listings'} onClick={()=>{setVisitedListings(true);setSection('listings')}}>Listings</button></nav>
      <div className="a-order-view" hidden={section!=='orders'}>
      <div className="a-title-row"><div><p className="a-eyebrow">ORDER MANAGEMENT</p><h1>Orders.</h1><p className="a-intro">Review, prepare and fulfil your latest orders.</p></div>
        <div className="a-sync"><span>{loading ? 'Refreshing orders…' : synced ? `Updated ${synced}` : 'Not synced yet'}</span><button className="a-button" disabled={loading||updating!==null} onClick={onRefresh}>{loading?'Refreshing…':'Refresh orders ↻'}</button></div>
      </div>
      <section className="a-stats" aria-label="Order overview">
        <div><span>Orders loaded</span><strong>{stats.total}</strong></div><div><span>To make & send</span><strong>{stats.open}<i aria-hidden="true">↗</i></strong></div><div><span>Fulfilled</span><strong>{stats.done}</strong></div><div><span>Loaded order value</span><strong className="a-money">{money(stats.value)}</strong></div>
      </section>
      {error && <div className="a-alert" role="alert">{error}<button onClick={onRefresh} disabled={loading||updating!==null}>Try again</button></div>}
      <section id="admin-orders" className="a-desk" aria-label="Orders">
        <div className="a-toolbar"><div className="a-filters" role="group" aria-label="Filter orders">{([['all','All orders'],['open','Open'],['done','Fulfilled']] as const).map(([value,label])=><button key={value} aria-pressed={filter===value} onClick={()=>setFilter(value)}>{label}<span>{value==='all'?stats.total:value==='open'?stats.open:stats.done}</span></button>)}</div>
          <label className="a-search"><span className="a-sr">Search orders by code, customer, phone, city or product</span><svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><circle cx="10" cy="10" r="6" fill="none" stroke="currentColor" strokeWidth="1.8"/><path d="m15 15 5 5" stroke="currentColor" strokeWidth="1.8"/></svg><input type="search" value={query} onChange={event=>setQuery(event.target.value)} placeholder="Code, customer, city or product"/></label>
        </div>
        <p className="a-result" role="status">{loading&&!orders.length?'Fetching orders securely…':`${filtered.length} ${filtered.length===1?'order':'orders'}${query?' matching your search':''}`}</p>
        <div className="a-columns"><div className="a-order-list" aria-label="Order list" aria-busy={loading}>
          {filtered.map(order=><button className={`a-order${active?.id===order.id?' is-active':''}`} key={order.id} onClick={()=>setSelected(order.id)} aria-pressed={active?.id===order.id}>
            <div className="a-order-head"><strong>#{order.order_code}</strong><span className={`a-badge${order.order_completed?' is-done':''}`}>{order.order_completed?'Fulfilled':'Open'}</span></div>
            <span className="a-customer-name">{order.customer_name}</span><span className="a-order-sub">{order.city || 'City not provided'} · {when(order.order_date || order.created_at)}</span>
            <div className="a-order-foot"><span>{pieceLabel(order)}</span><strong>{money(order.grand_total_pkr)}</strong></div>
          </button>)}
          {!filtered.length && !loading && <div className="a-empty"><span aria-hidden="true">↗</span><h2>{query?'No matching orders.':filter==='done'?'Nothing fulfilled yet.':filter==='open'?'All caught up.':'A clean cutting table.'}</h2><p>{query?'Try another code, name, phone or city.':error?'Restore the connection to see your orders.':'Orders will appear here as they come in.'}</p>{(query||filter!=='all')&&<button onClick={()=>{setQuery('');setFilter('all')}}>Show all orders</button>}</div>}
        </div>
        {active ? <article className="a-detail" aria-label={`Order ${active.order_code} details`} key={active.id}>
          <div className="a-detail-head"><div><p className="a-eyebrow">ORDER DETAILS</p><h2>#{active.order_code}<span className={`a-badge${active.order_completed?' is-done':''}`}>{active.order_completed?'Fulfilled':'Open'}</span></h2><p>{when(active.order_date || active.created_at)}</p></div><button className={`a-button ${active.order_completed?'a-secondary':''}`} disabled={updating!==null} onClick={()=>onComplete(active.id,!active.order_completed)}>{updating===active.id?'Saving…':active.order_completed?'Reopen order':'Mark fulfilled ✓'}</button></div>
          {active.order_completed_at && active.order_completed && <p className="a-completed">Fulfilled {when(active.order_completed_at)}</p>}
          <div className="a-customer"><section><h3>Customer</h3><strong>{active.customer_name}</strong><a href={`mailto:${encodeURIComponent(active.customer_email)}`}>{active.customer_email}</a><a href={`tel:${active.customer_phone.replace(/[^+\d]/g,'')}`}>{active.customer_phone}</a></section><section><h3>Deliver to</h3><p>{active.address_line1}</p><strong>{active.city || 'City not provided'}</strong><span>{active.payment_method==='cod'?'Cash on delivery':active.payment_method || 'Payment method unavailable'}</span></section></div>
          {active.notes && <section className="a-notes"><h3>Customer note</h3><p>{active.notes}</p></section>}
          <section className="a-pieces"><h3>The pieces <span>{active.order_lines?.length??0} {active.order_lines?.length===1?'line item':'line items'}</span></h3>
            {(active.order_lines??[]).map(line=><div className="a-line" key={line.id}>{safeWebUrl(line.image_url)?<img src={safeWebUrl(line.image_url)} alt="" loading="lazy"/>:<div className="a-image-empty" aria-hidden="true">↗</div>}<div><strong>{safeWebUrl(line.product_url)?<a href={safeWebUrl(line.product_url)} target="_blank" rel="noopener noreferrer">{line.title} ↗</a>:line.title}</strong><p>{line.size} in · {line.finish} · Qty {line.quantity}</p><span>{[line.led_backlight?'LED backlight':null,line.installation?'Installation':null,line.wooden_frame?'Wooden frame':null].filter(Boolean).join(' / ') || 'No add-ons'}</span><p className="a-unit">{money(line.unit_price_pkr)} each</p></div><strong className="a-line-price">{money(line.line_subtotal_pkr)}</strong></div>)}
            {!active.order_lines?.length && <p>Item details are unavailable for this order.</p>}
          </section>
          <dl className="a-totals"><div><dt>Products</dt><dd>{money(active.subtotal_pkr)}</dd></div><div><dt>Shipping</dt><dd>{money(active.shipping_pkr)}</dd></div><div className="a-grand"><dt>{active.payment_method==='cod'?'Due on delivery':'Order total'}</dt><dd>{money(active.grand_total_pkr)}</dd></div></dl>
          <p className="a-stored-note">Totals are shown exactly as saved with this order.</p>
        </article> : <div className="a-detail a-detail-empty"><span aria-hidden="true">↗</span><p>{loading?'Your order desk is getting ready.':'Select an order to see the details.'}</p></div>}
        </div>
      </section>
      </div>
      {visitedListings&&<div hidden={section!=='listings'}><ListingsPanel adapter={listingsSource} demo={demo} onUnauthorized={onLogout}/></div>}
      <footer className="a-foot"><span>BARQMECH</span><p>Cut with precision. Managed with care.</p></footer>
    </main>
  </div>
}
