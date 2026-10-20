(() => {
 'use strict';
 const $ = selector => document.querySelector(selector);
 const $$ = selector => [...document.querySelectorAll(selector)];
 const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
 const rootPath = 'C:\\Users\\raoan\\Downloads\\barqmech\\';
 const github = 'https://github.com/DerpFlag/barqmech/';
 const sources = [
  {path:'CodeShinobi/barqmech-store-v3/src/main.tsx',category:'frontend',text:'V3 application entry, providers, routes and stylesheet entry.'},
  {path:'CodeShinobi/barqmech-store-v3/src/pages/ShinobiHomePage.tsx',category:'frontend',text:'Homepage sections and composition.'},
  {path:'CodeShinobi/barqmech-store-v3/src/pages/home.css',category:'frontend',text:'Consolidated homepage layout, palette and responsive styling.'},
  {path:'CodeShinobi/barqmech-store-v3/src/styles/storefront.css',category:'frontend',text:'Ordered CSS entry preserving the storefront cascade.'},
  {path:'CodeShinobi/barqmech-store-v3/src/catalog/CatalogProvider.tsx',category:'frontend',text:'Snapshot-assisted first paint, live refresh, product detail caching and catalog invalidation.'},
  {path:'CodeShinobi/barqmech-store-v3/src/cart/CartContext.tsx',category:'frontend',text:'Cart provider and purchase configuration state.'},
  {path:'CodeShinobi/barqmech-store-v3/src/cart/cartStorage.ts',category:'frontend',text:'Browser persistence and same-origin cross-tab cart merging.'},
  {path:'CodeShinobi/barqmech-store-v3/src/admin/AdminWorkspace.tsx',category:'frontend',text:'Admin workspace for Orders and Listings.'},
  {path:'CodeShinobi/barqmech-store-v3/src/admin/ListingsPanel.tsx',category:'frontend',text:'Listing editor, design/size/price editing and listing state controls.'},
  {path:'CodeShinobi/barqmech-store-v3/src/routes/ProductPage.tsx',category:'frontend',text:'Individual product configuration, gallery, finish/size options and cart actions.'},
  {path:'CodeShinobi/barqmech-store-v3/src/routes/CheckoutRoute.tsx',category:'frontend',text:'Checkout details, displayed shipping/totals and stable submission identifier.'},
  {path:'CodeShinobi/barqmech-store-v3/src/routes/CheckoutSuccessRoute.tsx',category:'frontend',text:'Signed order-receipt page and customer-facing confirmation.'},
  {path:'store/src',category:'frontend',folder:true,text:'Shared older storefront source still used by the V3 build. Preserve shared dependencies.'},
  {path:'api/place-order.mjs',category:'backend',text:'Public order endpoint delegating to the V3 checkout handler.'},
  {path:'server/v3/order-handler.mjs',category:'backend',text:'Live product validation, stable request identifiers, durable order save and notifications.'},
  {path:'server/v3/checkout.mjs',category:'backend',text:'Canonical basket totals, configuration validation and signed private receipts.'},
  {path:'server/v3/http.mjs',category:'backend',text:'Server database access, JSON/body boundaries, canonical origins and distributed request limits.'},
  {path:'server/v3/live-catalog.mjs',category:'backend',text:'Active catalog queries, public projection and revision-checked admin writes.'},
  {path:'server/v3/notifications.mjs',category:'backend',text:'Durable customer/merchant payloads, provider deduplication, backoff and review states.'},
  {path:'server/v3/manufacturing.mjs',category:'backend',text:'Selected private DXF lookup, 14-day signing and manual Panel handling.'},
  {path:'server/v3/order-email.mjs',category:'backend',text:'Customer and merchant email HTML, item pictures and manufacturing-link disclosure.'},
  {path:'server/shared/admin-auth.mjs',category:'backend',text:'Signed cookie sessions and admin password verification. Never put production secret values in source.'},
  {path:'server/shared/gmail-email.mjs',category:'backend',text:'Current Gmail/Googlemail-only format restriction shared by checkout and contact.'},
  {path:'api/v3/admin-catalog.mjs',category:'backend',text:'Authenticated catalog reads and revision-protected listing mutations.'},
  {path:'api/admin-login.mjs',category:'backend',text:'Rate-limited password login, origin checks and signed session cookie.'},
  {path:'api/admin-session.mjs',category:'backend',text:'Cookie-session validity response used by the admin interface.'},
  {path:'api/admin-logout.mjs',category:'backend',text:'Origin-checked session cookie clearing.'},
  {path:'api/admin-orders.mjs',category:'backend',text:'Authenticated saved-order reads and completion changes.'},
  {path:'api/v3/sitemap.mjs',category:'backend',text:'Active product URLs and configured canonical origin for the live sitemap.'},
  {path:'server/shared/email-brand.mjs',category:'backend',text:'Shared transactional email frame, escaped content and canonical asset links.'},
  {path:'api/v3/receipt.mjs',category:'backend',text:'Minimal signed receipt response; no customer records or private CAD details.'},
  {path:'api/v3/retry-notifications.mjs',category:'backend',text:'Secret-authorized pending-email retry worker.'},
  {path:'api/contact.mjs',category:'backend',text:'Validated, origin-checked contact messages sent through Resend.'},
  {path:'CodeShinobi/barqmech-store-v3/catalog/products.csv',category:'data',text:'Versioned catalog seed snapshot. Not the live admin database.'},
  {path:'CodeShinobi/barqmech-store-v3/catalog/prices.csv',category:'data',text:'Versioned size/finish pricing seed, including area_sqft. Admin edits are not mirrored automatically.'},
  {path:'CodeShinobi/barqmech-store-v3/scripts/shipping.mjs',category:'data',text:'Rectangular area, tier boundaries, rounding and one largest-item charge.'},
  {path:'CodeShinobi/barqmech-store-v3/scripts/listing-schema.mjs',category:'data',text:'Listing validation, public field projection, sizes, finish prices and private path rules.'},
  {path:'CodeShinobi/barqmech-store-v3/scripts/seed-live-catalog.mjs',category:'data',text:'Explicit one-time live seed with a nonempty-table overwrite guard.'},
  {path:'store/supabase/migrations/012_v3_live_listings.sql',category:'data',text:'V3 live listing table, grants/RLS and revision-controlled save RPC.'},
  {path:'store/supabase/migrations/013_v3_nonbreaking_prepare.sql',category:'data',text:'Order reliability and rate-limit preparation.'},
  {path:'store/supabase/migrations/014_v3_empty_project_bootstrap.sql',category:'data',text:'Fresh-project compatibility/orders/storage bootstrap. Review migration order in the release runbook.'},
  {path:'store/supabase/migrations/015_v3_listing_conflict_status.sql',category:'data',text:'Fast PT409 stale-edit responses rather than retryable serialization failures.'},
  {path:'docs/NEW-DESIGN-ARCHITECTURE.md',category:'docs',text:'Living architecture. Start at Current deployed state; older entries are historical evidence.'},
  {path:'docs/V3-LIVE-CATALOG.md',category:'docs',text:'Catalog ownership and media decisions. Read current notices before historical proposals.'},
  {path:'docs/V3-RELEASE-2026-10-19.md',category:'docs',text:'Release/recovery notes and current production acceptance update.'},
  {path:'docs/STOREFRONT-VERSIONS.md',category:'docs',text:'Folder/version preservation history. Current production target is V3, as clarified in the living architecture.'},
  {path:'docs/previews/v3-production-order-acceptance-2026-10-20.json',category:'docs',text:'Aggregate live-order, email, receipt and private-download verification without customer records.'},
  {path:'.github/workflows/validate-v3.yml',category:'docs',text:'Clean dependency installs, regression tests and V3 production artifact checks.'},
  {path:'.github/workflows/retry-order-notifications.yml',category:'docs',text:'Scheduled hourly/manual request to the protected notification retry worker.'},
  {path:'vercel.json',category:'docs',text:'Repository-root install/build/output configuration, routes, headers and function packaging.'},
  {path:'updates.md',category:'docs',text:'Meaningful completed changes and release history.'},
 ];
 const services = {
  github:{name:'GitHub',tag:'VERSIONED SOURCE',description:'The source archive and change history. Code and optimized public media are committed here, then built by Vercel.',owns:['Website and API source','Compressed public pictures and videos','Seed CSVs, migrations and release history'],connections:'Build source → Vercel. Workflows → validation and retry requests.',url:github,label:'Open repository'},
  vercel:{name:'Vercel',tag:'PUBLIC DELIVERY + SERVER',description:'The deployed website and its API functions. Browsers ask these APIs for live data; privileged database access stays server-side.',owns:['Storefront, checkout and admin pages','Public asset delivery','Catalog, order, receipt and admin APIs'],connections:'Receives browsers and builds. Calls Supabase and Resend.',url:'https://vercel.com/derpflags-projects/barqmech',label:'Open project dashboard'},
  supabase:{name:'Supabase',tag:'LIVE DATA + PRIVATE STORAGE',description:'The live source for catalog prices/status, saved orders and non-Panel manufacturing files. Public browsing uses selected API responses, not direct table access.',owns:['Live listing documents and prices','Orders, completion and email state','Private product-dxf storage'],connections:'Vercel service access ↔ database/storage. Signed downloads → merchant.',url:'https://supabase.com/dashboard/project/bymhkgakvotcqdgcllat',label:'Open active project'},
  customer:{name:'Customer browser',tag:'PUBLIC INTERFACE',description:'Shows the storefront, remembers a local cart and submits checkout to the website. It never holds the database service key.',owns:['Rendered pages and selected options','Cart storage for this origin','Checkout identifier for safe retries'],connections:'Requests → Vercel APIs. Public images/videos ← Vercel.',url:'https://www.barqmech.com/',label:'Open storefront'},
  resend:{name:'Resend',tag:'TRANSACTIONAL DELIVERY',description:'Delivers customer confirmations and merchant notifications using the verified barqmech.com sender domain.',owns:['Provider acceptance and delivery events','Customer and merchant email delivery','Provider idempotency keys'],connections:'Receives saved notification payloads from Vercel. Delivery state is recorded in orders.',url:'https://resend.com/emails',label:'Open email dashboard'},
  actions:{name:'GitHub Actions',tag:'CHECKS + SCHEDULED RETRIES',description:'Runs clean release validation and an hourly/manual call to the secret-protected notification retry endpoint.',owns:['Dependency/test/build verification','Hourly retry workflow','Encrypted workflow secrets'],connections:'CI checks source. Retry requests → Vercel worker → pending messages.',url:github+'actions',label:'Open workflows'},
 };
 function serviceSelect(key){
  const s=services[key];
  $$('[data-service]').forEach(button=>{const active=button.dataset.service===key;button.classList.toggle('selected',active);button.setAttribute('aria-pressed',active)});
  $$('.map-wires>path').forEach(path=>path.classList.toggle('edge-active',path.dataset.services.split(' ').includes(key)));
  $('#service-detail').innerHTML=`<span class="tag">${s.tag}</span><h3>${s.name}</h3><p>${s.description}</p><ul>${s.owns.map(item=>`<li>${item}</li>`).join('')}</ul><div class="service-connections"><b>CONNECTED TO</b>${s.connections}</div><a href="${s.url}" target="_blank" rel="noopener noreferrer">${s.label} ↗</a>`;
 }
 $$('[data-service]').forEach(button=>button.addEventListener('click',()=>serviceSelect(button.dataset.service)));
 serviceSelect('vercel');

 const steps=[
  {name:'Browse',title:'A quick first view. Then live data.',description:'Vercel serves the built React storefront and optimized media. A bundled catalog snapshot supports the initial render; live API summaries and selected product details then reconcile availability and prices.',sees:'Product cards, categories and current product options.',system:'CatalogProvider refreshes on mount, focus/visibility and periodically. Server returns public active fields only.',where:'GitHub build snapshot + live Supabase listing API.'},
  {name:'Configure',title:'Choose the exact piece.',description:'The customer selects a design, size, finish, quantity and supported add-ons. Black is the default finish. Price and feasible size choices come from that design’s pricing rows.',sees:'Selected options and an indicative unit price.',system:'Configuration is prepared in the browser; final acceptance will be validated on the server.',where:'Browser product state; current detail API.'},
  {name:'Cart',title:'Remember the selection.',description:'Cart operations persist in browser storage. Same-origin tabs merge updates so opening several products does not replace the cart with only the last tab’s item.',sees:'Chosen size, finish, quantity and item totals.',system:'Cross-tab storage synchronization. Different domains or ports keep separate browser carts.',where:'Browser storage, not a Supabase customer cart.'},
  {name:'Validate',title:'Check the current truth.',description:'Checkout sends item choices, customer details and a stable request identifier. The server verifies the listing is active, the configuration is feasible, and prices and totals match canonical data. Shipping is recomputed once from the largest item’s area.',sees:'Either an accepted submission or a request to review changed/unavailable items.',system:'Origin/body limits, rate limiting, canonical live price/configuration and shipping checks.',where:'Vercel order handler → Supabase live listings.'},
  {name:'Save',title:'Commit the order before email.',description:'A successful new checkout is stored with a uniform six-digit order code, stable request identity, saved line configurations/prices, totals and pending notification state. Accepted orders keep their saved totals.',sees:'A confirmation can be returned even if notification delivery is temporarily pending.',system:'Unique request IDs prevent a second insert on a repeated checkout. Different data under the same ID is rejected.',where:'Private orders table in Supabase.'},
  {name:'Email',title:'Two recipients. Different information.',description:'Resend receives a customer confirmation and a merchant notification. Both contain public product pictures. Only the merchant gets the selected non-Panel DXF link; Panels carry a manual-supply notice.',sees:'Confirmation email and delivery details. Your team receives fulfillment information.',system:'Payloads and per-role delivery status are durable. Stable provider keys, bounded retries and backoff protect against duplicate messages.',where:'Saved notification state + Resend delivery service.'},
  {name:'Receipt',title:'A private, minimal confirmation.',description:'The browser navigates to a signed receipt link. The server verifies the signature and expiry, then returns minimal order totals/status rather than exposing the saved customer record.',sees:'Order code, subtotal, shipping, COD total and email status.',system:'A valid signed token is required. A six-digit order code alone does not unlock the order.',where:'Receipt API → selected fields from the orders table.'},
  {name:'Fulfill',title:'From notification to production.',description:'Your team reviews the merchant email/admin record, downloads the selected DXF for non-Panels, supplies Panel files manually, and handles manufacturing, delivery and cash collection.',sees:'Your normal customer-service and delivery process.',system:'Authenticated admin tracks order completion. There is no automated courier, manufacturing queue or online payment integration.',where:'Human production/fulfillment workflow + admin completion record.'},
 ];
 const scenarios={
  normal:{title:'NORMAL ORDER',description:'Current prices match, the order is saved, and both notifications can be sent.'},
  price:{title:'PRICE CHANGED',description:'At validation, a stale/tampered price or total is rejected with 409. The customer reviews the cart before a new order is saved.'},
  retry:{title:'REPEATED CHECKOUT',description:'If the first response was uncertain, retry with the same identifier and original details. An accepted order is returned; changed details under that ID are rejected.'},
  email:{title:'EMAIL PENDING',description:'The purchase remains saved. Only unfinished recipient notifications are eligible for bounded retries; old ambiguous sends require review rather than blind resending.'},
  panel:{title:'PANEL ORDER',description:'Normal catalog, pricing and checkout apply. Panel DXFs are not signed or stored in the new bucket. The merchant is told to supply the file manually.'},
 };
 let stepIndex=0,journeyTimer=null;
 const stepContainer=$('#journey-steps');
 steps.forEach((step,index)=>{const button=document.createElement('button');button.type='button';button.innerHTML=`<b>${String(index+1).padStart(2,'0')}</b>${step.name}`;button.addEventListener('click',()=>{stopJourney();showStep(index)});stepContainer.append(button)});
 function showStep(index){
  stepIndex=index;const step=steps[index],scenario=scenarios[$('#scenario').value];
  [...stepContainer.children].forEach((button,i)=>{button.classList.toggle('selected',i===index);button.setAttribute('aria-pressed',i===index)});
  $('#journey-pane').innerHTML=`<div class="step-index">${String(index+1).padStart(2,'0')}</div><div><span class="tag">${step.name.toUpperCase()}</span><h3>${step.title}</h3><p>${step.description}</p><div class="journey-facts"><div><b>WHAT THE CUSTOMER SEES</b><span>${step.sees}</span></div><div><b>WHAT THE SYSTEM DOES</b><span>${step.system}</span></div><div><b>DATA LOCATION</b><span>${step.where}</span></div></div></div><div class="journey-scenario"><strong>${scenario.title} / </strong>${scenario.description}</div>`;
 }
 function stopJourney(){clearInterval(journeyTimer);journeyTimer=null;$('#play-journey').innerHTML='Play steps <span>▶</span>';$('#play-journey').setAttribute('aria-pressed','false')}
 $('#play-journey').addEventListener('click',()=>{
  if(journeyTimer){stopJourney();return}
  showStep(stepIndex===steps.length-1?0:stepIndex);
  $('#play-journey').innerHTML='Pause steps <span>Ⅱ</span>';$('#play-journey').setAttribute('aria-pressed','true');
  journeyTimer=setInterval(()=>{if(stepIndex===steps.length-1)stopJourney();else showStep(stepIndex+1)},2200);
 });
 $('#scenario').addEventListener('change',()=>{stopJourney();const key=$('#scenario').value;showStep(key==='price'?3:key==='retry'?4:key==='email'||key==='panel'?5:0)});
 document.addEventListener('visibilitychange',()=>{if(document.hidden)stopJourney()});
 showStep(0);

 const states={active:{title:'Ready to shop.',body:'<strong>Visible and orderable.</strong> Active products are returned by the public catalog API. Available configurations can be accepted at checkout after live validation.'},disabled:{title:'Sales paused.',body:'<strong>Hidden and blocked from new checkout.</strong> The record remains in admin for editing. This is useful while preparing a new listing or temporarily stopping sales.'},archived:{title:'Kept for recovery.',body:'<strong>Hidden and blocked, but retained.</strong> Archiving is reversible. It does not erase historical order snapshots or mean a public hard-delete operation exists.'}};
 function listingState(key){$$('[data-listing-state]').forEach(button=>{const selected=button.dataset.listingState===key;button.classList.toggle('selected',selected);button.setAttribute('aria-pressed',selected)});$('#listing-state-detail').innerHTML=`<h3>${states[key].title}</h3><p>${states[key].body}</p>`}
 $$('[data-listing-state]').forEach(button=>button.addEventListener('click',()=>listingState(button.dataset.listingState)));listingState('active');
 let databaseRevision=12,revisionA=12,revisionB=12;
 function renderRevisions(message){$('#revision-a').textContent='Revision '+revisionA;$('#revision-b').textContent='Revision '+revisionB;$('#revision-message').textContent=message}
 function saveEditor(editor){const current=editor==='A'?revisionA:revisionB;if(current!==databaseRevision){renderRevisions(`409 conflict. Editor ${editor} has revision ${current}; the database is at ${databaseRevision}. Refresh before saving.`);return}databaseRevision++;if(editor==='A')revisionA=databaseRevision;else revisionB=databaseRevision;renderRevisions(`Saved Editor ${editor}. Database revision: ${databaseRevision}. Other tabs must refresh their older copy.`)}
 $('#save-a').addEventListener('click',()=>saveEditor('A'));$('#save-b').addEventListener('click',()=>saveEditor('B'));$('#refresh-b').addEventListener('click',()=>{revisionB=databaseRevision;renderRevisions(`Editor B refreshed to revision ${databaseRevision}. It can now save safely.`)});$('#reset-revision').addEventListener('click',()=>{databaseRevision=revisionA=revisionB=12;renderRevisions('Database revision: 12. Try saving Editor A first.')});

 const money=value=>'Rs. '+new Intl.NumberFormat('en-PK',{maximumFractionDigits:0}).format(value);
 function updateShipping(){
  const includeB=$('#include-b').checked;
  $$('#product-b-controls input').forEach(input=>input.disabled=!includeB);
  const a={w:Number($('#width-a').value),h:Number($('#height-a').value),q:Number($('#quantity-a').value)},b={w:Number($('#width-b').value),h:Number($('#height-b').value),q:Number($('#quantity-b').value)};
  const items=includeB?[a,b]:[a];
  const valid=items.every(item=>[item.w,item.h].every(n=>Number.isFinite(n)&&n>=.1&&n<=1000)&&Number.isSafeInteger(item.q)&&item.q>=1&&item.q<=99);
  if(!valid){$('#shipping-error').textContent='Enter dimensions from 0.1 to 1,000 inches and a whole quantity from 1 to 99.';$('#shipping-output').textContent='Check sizes';$('#shipping-explanation').textContent='The calculator needs valid dimensions.';$('#largest-area').textContent='—';$('#total-quantity').textContent='—';$('#shipping-formula').textContent='';$('#area-fill').style.width='0%';return}
  $('#shipping-error').textContent='';
  const areas=items.map(item=>Number((item.w*item.h/144).toFixed(8))),largest=Math.max(...areas),owner=areas.indexOf(largest)===0?'A':'B';
  const shipping=largest<=4?500:largest<=7?1000:1000+200*(Math.ceil(largest)-7);
  $('#shipping-output').textContent=money(shipping);$('#largest-area').textContent=largest.toLocaleString('en-PK',{maximumFractionDigits:2});$('#total-quantity').textContent=items.reduce((sum,item)=>sum+item.q,0);
  $('#shipping-explanation').textContent=`Product ${owner} sets the rate. This charge applies once to the entire cart.`;
  $('#area-fill').style.width=Math.min(100,largest/16*100)+'%';
  $('#shipping-formula').textContent=largest<=4?'Area ≤ 4 → Rs. 500':largest<=7?'4 < area ≤ 7 → Rs. 1,000':`1,000 + 200 × (${Math.ceil(largest)} − 7) = ${money(shipping)}`;
 }
 $$('.shipping-lab input').forEach(input=>input.addEventListener('input',updateShipping));updateShipping();

 let sourceFilter='all',toastTimer;
 function toast(message){clearTimeout(toastTimer);$('#toast').textContent=message;$('#toast').classList.add('visible');toastTimer=setTimeout(()=>$('#toast').classList.remove('visible'),2600)}
 function sourceUrl(source){return github+(source.folder?'tree':'blob')+'/main/'+source.path}
 function renderSources(){
  const query=$('#source-search').value.trim().toLowerCase();
  const selected=sources.filter(source=>(sourceFilter==='all'||source.category===sourceFilter)&&(!query||(source.path+' '+source.text).toLowerCase().includes(query)));
  $('#source-list').replaceChildren();
  selected.forEach(source=>{
   const row=document.createElement('article');row.className='source-row';
   const description=document.createElement('div'),heading=document.createElement('h3'),paragraph=document.createElement('p');heading.textContent=source.path;paragraph.textContent=source.text;description.append(heading,paragraph);
   const actions=document.createElement('div');actions.className='source-actions';const link=document.createElement('a');link.href=sourceUrl(source);link.target='_blank';link.rel='noopener noreferrer';link.textContent='GitHub ↗';link.setAttribute('aria-label','View '+source.path+' on GitHub');
   const copy=document.createElement('button');copy.textContent='Copy local path';copy.type='button';copy.setAttribute('aria-label','Copy local path for '+source.path);
   copy.addEventListener('click',async()=>{const path=rootPath+source.path.replaceAll('/','\\');try{await navigator.clipboard.writeText(path);toast('Local path copied')}catch{const field=$('#local-path-value');field.value=path;$('#path-dialog').showModal();field.focus();field.select()}});
   actions.append(link,copy);row.append(description,actions);$('#source-list').append(row);
  });
  if(!selected.length){const empty=document.createElement('p');empty.className='source-empty';empty.textContent='No matching files. Try another word or choose All.';$('#source-list').append(empty)}
  $('#source-count').textContent=`${selected.length} of ${sources.length} references · GitHub links open versioned source; local paths refer to this workspace.`;
 }
 $$('[data-source-filter]').forEach(button=>button.addEventListener('click',()=>{sourceFilter=button.dataset.sourceFilter;$$('[data-source-filter]').forEach(b=>{const selected=b===button;b.classList.toggle('selected',selected);b.setAttribute('aria-pressed',selected)});renderSources()}));$('#source-search').addEventListener('input',renderSources);renderSources();

 const searchDialog=$('#search-dialog'),guideSearch=$('#guide-search');
 const sections=$$('main>section');
 function renderSearch(){
  const query=guideSearch.value.trim().toLowerCase();
  const sectionResults=sections.map(section=>({title:section.dataset.title,description:section.dataset.keywords,url:'#'+section.id,type:'SECTION'}));
  const fileResults=sources.map(source=>({title:source.path,description:source.text,url:sourceUrl(source),type:'SOURCE FILE'}));
  const tokens=query.split(/\s+/).filter(Boolean);
  const results=(query?[...sectionResults,...fileResults].filter(result=>tokens.every(token=>(result.title+' '+result.description).toLowerCase().includes(token))):sectionResults).slice(0,12);
  $('#search-results').replaceChildren();
  results.forEach(result=>{const link=document.createElement('a');link.href=result.url;if(result.type==='SOURCE FILE'){link.target='_blank';link.rel='noopener noreferrer'}const type=document.createElement('span'),title=document.createElement('strong'),description=document.createElement('span');type.className='result-type';type.textContent=result.type;title.textContent=result.title;description.textContent=result.description;link.append(type,title,description);link.addEventListener('click',()=>searchDialog.close());$('#search-results').append(link)});
  if(!results.length){const empty=document.createElement('p');empty.className='source-empty';empty.textContent='No matches. Try “DXF”, “prices”, “rollback” or “email”.';$('#search-results').append(empty)}
 }
 function openSearch(){searchDialog.showModal();guideSearch.value='';renderSearch();guideSearch.focus()}
 $('#search-open').addEventListener('click',openSearch);$('#search-close').addEventListener('click',()=>searchDialog.close());guideSearch.addEventListener('input',renderSearch);
 document.addEventListener('keydown',event=>{const editing=/^(INPUT|TEXTAREA|SELECT)$/.test(event.target.tagName);if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='k'||event.key==='/'&&!editing&&!event.ctrlKey&&!event.metaKey){event.preventDefault();if(!searchDialog.open)openSearch()}});
 searchDialog.addEventListener('click',event=>{if(event.target===searchDialog){const rect=searchDialog.getBoundingClientRect();if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)searchDialog.close()}});

 const imageDialog=$('#image-dialog');
 $$('.evidence').forEach(button=>button.addEventListener('click',()=>{const img=button.querySelector('img');$('#expanded-image').src=img.src;$('#expanded-image').alt=img.alt;$('#image-title').textContent=button.querySelector('span').textContent.replace('↗','').trim();imageDialog.showModal()}));$('#image-close').addEventListener('click',()=>imageDialog.close());
 $('#path-close').addEventListener('click',()=>$('#path-dialog').close());
 $('#print-button').addEventListener('click',()=>window.print());
 const menuButton=$('#menu-button');
 function closeMenu(){menuButton.setAttribute('aria-expanded','false');menuButton.setAttribute('aria-label','Open navigation');$('#sidebar').classList.remove('open');$('#sidebar').inert=innerWidth<=900;$('#sidebar').setAttribute('aria-hidden',String(innerWidth<=900));$('#nav-shade').hidden=true}
 menuButton.addEventListener('click',()=>{const open=menuButton.getAttribute('aria-expanded')!=='true';menuButton.setAttribute('aria-expanded',open);menuButton.setAttribute('aria-label',open?'Close navigation':'Open navigation');$('#sidebar').classList.toggle('open',open);$('#sidebar').inert=!open;$('#sidebar').setAttribute('aria-hidden',String(!open));$('#nav-shade').hidden=!open});$('#nav-shade').addEventListener('click',closeMenu);$$('#section-nav a').forEach(link=>link.addEventListener('click',closeMenu));document.addEventListener('keydown',event=>{if(event.key==='Escape')closeMenu()});
 closeMenu();
 const visible=new Map();
 function currentSection(){let selected=null;for(const section of sections){const rect=section.getBoundingClientRect();if(rect.top<=145&&rect.bottom>145){selected=section;break}}if(!selected){selected=sections.find(section=>visible.get(section.id))||sections[0]}$$('#section-nav a').forEach(link=>{const active=link.hash==='#'+selected.id;link.classList.toggle('active',active);if(active)link.setAttribute('aria-current','location');else link.removeAttribute('aria-current')});$('#current-section').textContent=selected.dataset.title}
 const observer=new IntersectionObserver(entries=>{entries.forEach(entry=>visible.set(entry.target.id,entry.isIntersecting));currentSection()},{rootMargin:'-76px 0px -35% 0px',threshold:[0,.05,.2]});sections.forEach(section=>observer.observe(section));
 let progressFrame=0;
 function scrollProgress(){if(progressFrame)return;progressFrame=requestAnimationFrame(()=>{const range=document.documentElement.scrollHeight-innerHeight;$('#reading-progress').style.transform=`scaleX(${range>0?Math.min(1,Math.max(0,scrollY/range)):0})`;currentSection();progressFrame=0})}
 addEventListener('scroll',scrollProgress,{passive:true});addEventListener('resize',()=>{if(innerWidth>900||menuButton.getAttribute('aria-expanded')!=='true')closeMenu();scrollProgress()});scrollProgress();
 reduceMotion.addEventListener('change',()=>{if(reduceMotion.matches)stopJourney()});
})();
