import {useEffect,useRef,useState,type FormEvent} from 'react'
import {adminRequest,AdminApiError} from './client.ts'
import {categories,statuses,validateListing} from '../../scripts/listing-schema.mjs'
import {areaForSize} from '../../scripts/shipping.mjs'
import {isManualDxfCategory} from '../../scripts/manufacturing-policy.mjs'
import type {ListingDraft,ListingSource,ListingSummary,ListingSize} from './listing-types.ts'

const endpoint='/api/v3/admin-catalog'
const source:ListingSource={
 list:async()=>(await adminRequest<{listings:ListingSummary[]}>(endpoint)).listings,
 get:async id=>(await adminRequest<{listings:ListingDraft[]}>(endpoint+'?id='+encodeURIComponent(id))).listings[0],
 save:async(listing,expectedRevision)=>(await adminRequest<{listing:ListingDraft}>(endpoint,{method:expectedRevision?'PATCH':'POST',body:JSON.stringify({listing,expectedRevision})})).listing
}
const blankSize=():ListingSize=>({label:'24 x 24',feasible:true,Silver:0,Gold:0,Black:0,wooden:0,led:0,install:0})
const blank=():ListingDraft=>({title:'',slug:'',description:'',category:'Artwork',status:'disabled',images:[],variants:[{design_code:0,pricing:{sizes:[blankSize()]}}]})
const slugify=(value:string)=>value.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')

export default function ListingsPanel({adapter=source,demo=false,onUnauthorized}:{adapter?:ListingSource;demo?:boolean;onUnauthorized?:()=>void}){
 const [listings,setListings]=useState<ListingSummary[]>([]),[query,setQuery]=useState(''),[status,setStatus]=useState('all')
 const [draft,setDraft]=useState<ListingDraft|null>(null),[baseline,setBaseline]=useState(''),[design,setDesign]=useState(0)
 const [busy,setBusy]=useState(false),[loading,setLoading]=useState(true),[error,setError]=useState<string|null>(null),[notice,setNotice]=useState('')
 const [confirm,setConfirm]=useState<'archive'|'discard'|null>(null),[nextDraft,setNextDraft]=useState<ListingDraft|null>(null)
 const mounted=useRef(true),editor=useRef<HTMLDivElement>(null)
 function report(error:unknown){if(error instanceof AdminApiError&&error.status===401){onUnauthorized?.();return}if(mounted.current)setError(error instanceof Error?error.message:'The request could not be completed.')}
 const dirty=!!draft&&JSON.stringify(draft)!==baseline
 useEffect(()=>{mounted.current=true;return()=>{mounted.current=false}},[])
 async function refresh(){setLoading(true);try{const rows=await adapter.list();if(mounted.current)setListings(rows)}catch(error){report(error)}finally{if(mounted.current)setLoading(false)}}
 useEffect(()=>{void refresh()},[adapter])
 useEffect(()=>{if(!dirty)return;const guard=(event:BeforeUnloadEvent)=>{event.preventDefault();event.returnValue=''};window.addEventListener('beforeunload',guard);return()=>window.removeEventListener('beforeunload',guard)},[dirty])
 function select(next:ListingDraft){setDraft(structuredClone(next));setBaseline(JSON.stringify(next));setDesign(0);setError(null);setNotice('');requestAnimationFrame(()=>editor.current?.scrollIntoView({behavior:'instant',block:'start'}))}
 function requestSelect(next:ListingDraft){if(dirty){setNextDraft(next);setConfirm('discard')}else select(next)}
 async function open(id:string){if(busy)return;setBusy(true);try{const next=await adapter.get(id);if(mounted.current)requestSelect(next)}catch(error){report(error)}finally{setBusy(false)}}
 function field<K extends keyof ListingDraft>(key:K,value:ListingDraft[K]){if(draft)setDraft({...draft,[key]:value})}
 function sizeField(index:number,key:keyof ListingSize,value:string|number|boolean){if(!draft)return;const next=structuredClone(draft);Object.assign(next.variants[design].pricing.sizes[index],{[key]:value});setDraft(next)}
 async function save(event?:FormEvent,override?:string){
  event?.preventDefault();if(!draft||busy)return
  setError(null);setNotice('')
  try{
   const valid={...validateListing({...draft,status:override??draft.status}),id:draft.id,revision:draft.revision}
   setBusy(true)
   const saved=await adapter.save(valid,draft.revision??0)
   if(!mounted.current)return
   select(saved);setNotice(demo?'Saved in this demo session only.':'Listing saved. The storefront will pick up the change without a redeploy.')
   if(!demo&&typeof BroadcastChannel!=='undefined'){const channel=new BroadcastChannel('barqmech-catalog');channel.postMessage('refresh');channel.close()}
   await refresh()
  }catch(error){report(error)}
  finally{if(mounted.current){setBusy(false);setConfirm(null)}}
 }
 const visible=listings.filter(p=>(status==='all'||p.status===status)&&`${p.title} ${p.slug} ${p.category}`.toLowerCase().includes(query.toLowerCase()))
 const activeDesign=draft?.variants[design]
 return <section className="l-root" aria-label="Manage listings">
  <div className="l-heading"><div><h1>Your listings.</h1><p>Shape the collection. Keep every design, size and finish in order.</p></div><button className="a-button" disabled={busy} onClick={()=>requestSelect(blank())}>Add listing +</button></div>
  <div className="l-tools"><label className="a-search"><span className="a-sr">Search listings</span><input type="search" placeholder="Search title, category or URL" value={query} onChange={event=>setQuery(event.target.value)}/></label><label>Status<select value={status} onChange={event=>setStatus(event.target.value)}><option value="all">All statuses</option>{statuses.map(s=><option key={s} value={s}>{s}</option>)}</select></label><button disabled={loading||busy} onClick={()=>void refresh()}>Refresh</button><span>{visible.length} listings</span></div>
  {error&&<p className="a-alert" role="alert">{error}</p>}{notice&&<p className="l-notice" role="status">{notice}</p>}
  <div className="l-grid"><div className="l-list" aria-busy={loading}>
   {visible.map(p=><button className={`l-card${draft?.id===p.id?' is-selected':''}`} key={p.id} disabled={busy} onClick={()=>void open(p.id)}><img src={p.images[0]} alt="" loading="lazy"/><div><strong>{p.title.replace(/^\[[^\]]+\]\s*/,'')}</strong><span>{p.category} · {p.designCount??p.variants.length} designs</span><small className={`l-status l-status--${p.status}`}>{p.status}</small></div><span>{p.price}</span></button>)}
   {!loading&&!visible.length&&<p className="a-empty">No listings match. Clear the filters or add a listing.</p>}
  </div><div className="l-editor" ref={editor}>
   {!draft?<div className="l-editor-empty"><span>↗</span><h3>Select a listing.</h3><p>Edit a piece from the collection, or start with Add listing.</p></div>:<form onSubmit={event=>void save(event)}>
    <div className="l-editor-head"><div><span className="a-eyebrow">{draft.id?'EDIT LISTING':'NEW LISTING'}</span><h3>{draft.title||'Untitled piece'}</h3><p>{dirty?'Unsaved changes':draft.id?`Revision ${draft.revision}`:'New listings start disabled until you enable them.'}</p></div><button className="a-button" disabled={busy}>{busy?'Saving…':'Save listing'}</button></div>
    <fieldset disabled={busy} className="l-fields">
     <label>Title<input required maxLength={180} value={draft.title} onChange={event=>{const title=event.target.value;setDraft({...draft,title,slug:!draft.id&&draft.slug===slugify(draft.title)?slugify(title):draft.slug})}}/></label>
     <div className="l-pair"><label>Category<select value={draft.category} onChange={event=>field('category',event.target.value)}>{categories.map(c=><option key={c}>{c}</option>)}</select></label><label>Visibility<select value={draft.status} onChange={event=>field('status',event.target.value)}>{statuses.map(s=><option key={s}>{s}</option>)}</select></label></div>
     <label>URL slug<input required value={draft.slug} disabled={!!draft.id} onChange={event=>field('slug',event.target.value)}/><small>Existing URLs stay fixed to preserve links from past orders.</small></label>
     <label>Description<textarea rows={3} maxLength={5000} value={draft.description} onChange={event=>field('description',event.target.value)}/></label>
     <label>Image URLs <small>One public HTTPS image or existing /catalog-images/ path per line. First image is the cover.</small><textarea rows={3} value={draft.images.join('\n')} onChange={event=>field('images',event.target.value.split('\n'))}/></label>
     <div className="l-design-head"><label>Design<select value={design} onChange={event=>setDesign(Number(event.target.value))}>{draft.variants.map((v,index)=><option key={index} value={index}>Design {v.design_code}</option>)}</select></label><button type="button" onClick={()=>{const next=structuredClone(draft);next.variants.push({design_code:Math.max(...draft.variants.map(v=>v.design_code))+1,pricing:{sizes:[blankSize()]}});setDraft(next);setDesign(next.variants.length-1)}}>Add design +</button></div>
     {activeDesign&&<><label>Design code<input type="number" min="0" step="1" value={activeDesign.design_code} onChange={event=>{const next=structuredClone(draft);next.variants[design].design_code=Number(event.target.value);setDraft(next)}}/></label>
      {isManualDxfCategory(draft.category)?<p role="status">Panels use manual DXF supply. Orders stay enabled; your merchant email will remind you to send the selected design to production.</p>:<>
      <label>Private DXF storage path<input value={activeDesign.dxf_storage_path??''} placeholder={`${draft.slug||'product-slug'}/dc${activeDesign.design_code}.dxf`} onChange={event=>{const next=structuredClone(draft);next.variants[design].dxf_storage_path=event.target.value;setDraft(next)}}/></label>
      <p className="l-hint">Object path inside Supabase’s private product-dxf bucket. Upload the file there first. Only your merchant email receives its download link.</p>
      {!activeDesign.dxf_storage_path&&<p role="status">This design has no DXF linked yet. Its merchant email will require manual file lookup.</p>}
      </>}
      {activeDesign.pricing.sizes.map((size,index)=><section className="l-size" key={index}><div className="l-size-top"><label>Size in inches<input required value={size.label} onChange={event=>sizeField(index,'label',event.target.value)}/></label><span>{(()=>{try{return `${areaForSize(size.label)} sq ft`}catch{return 'Enter width x height'}})()}</span><label className="l-check"><input type="checkbox" checked={size.feasible} onChange={event=>sizeField(index,'feasible',event.target.checked)}/>Available</label><button type="button" disabled={activeDesign.pricing.sizes.length===1} onClick={()=>{const next=structuredClone(draft);next.variants[design].pricing.sizes.splice(index,1);setDraft(next)}}>Remove size</button></div><div className="l-prices">{(['Black','Silver','Gold','led','install'] as const).map(key=><label key={key}>{key==='led'?'LED add-on':key==='install'?'Installation':key} · PKR<input type="number" required min={size.feasible&&['Black','Silver','Gold'].includes(key)?1:0} step="1" value={size[key]} onChange={event=>sizeField(index,key,Number(event.target.value))}/></label>)}</div></section>)}
      <div className="l-row-actions"><button type="button" onClick={()=>{const next=structuredClone(draft);next.variants[design].pricing.sizes.push({...blankSize(),label:''});setDraft(next)}}>Add size +</button><button type="button" disabled={draft.variants.length===1} onClick={()=>{const next=structuredClone(draft);next.variants.splice(design,1);setDraft(next);setDesign(0)}}>Remove design</button></div></>}
    </fieldset>
    <div className="l-editor-foot"><p>Disabled and archived listings cannot be ordered. Past orders keep their saved details and prices.</p>{draft.id&&draft.status!=='archived'&&<button type="button" disabled={busy} onClick={()=>setConfirm('archive')}>Archive listing</button>}{draft.status==='archived'&&<button type="button" disabled={busy} onClick={()=>void save(undefined,'disabled')}>Restore as disabled</button>}</div>
   </form>}
  </div></div>
  {confirm&&<div className="l-dialog-backdrop"><section className="l-dialog" role="dialog" aria-modal="true" aria-labelledby="listing-confirm-title" onKeyDown={event=>{if(event.key==='Escape'&&!busy)setConfirm(null);if(event.key==='Tab'){const buttons=Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>('button:not(:disabled)'));const first=buttons[0],last=buttons[buttons.length-1];if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus()}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus()}}}}><h3 id="listing-confirm-title">{confirm==='archive'?'Archive this listing?':'Discard unsaved changes?'}</h3><p>{confirm==='archive'?'It will disappear from the shop. You can restore it later; past orders will stay intact.':'Your unsaved edits will be lost.'}</p><div><button autoFocus onClick={()=>setConfirm(null)}>Cancel</button><button className="a-button" disabled={busy} onClick={()=>{if(confirm==='archive')void save(undefined,'archived');else{setConfirm(null);if(nextDraft)select(nextDraft);setNextDraft(null)}}}>{confirm==='archive'?'Archive listing':'Discard changes'}</button></div></section></div>}
 </section>
}
