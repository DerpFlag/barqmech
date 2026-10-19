"""Explicit migration into the verified fresh V3 project. Never deletes source data.
catalog-history copies catalog compatibility tables and order history without sending mail.
dxf copies only non-Panel objects, backs them up locally, verifies every SHA256 after upload.
"""
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, as_completed
import hashlib, json, sys, urllib.request, urllib.error, urllib.parse, uuid

ROOT=Path(__file__).resolve().parents[1]
def env_file(path):
    data={}
    for line in path.read_text(encoding='utf-8-sig').splitlines():
        if '=' in line and not line.lstrip().startswith('#'):
            key,value=line.split('=',1);data[key.strip()]=value.strip().strip('\"').strip("'")
    return data
SOURCE=env_file(ROOT/'store/.env.import.local')
TARGET=env_file(ROOT/'.cache/supabase-target.env')
assert SOURCE['SUPABASE_URL'].rstrip('/')=='https://ajaugjszvbsdxicswfwx.supabase.co'
assert TARGET['SUPABASE_URL'].rstrip('/')=='https://bymhkgakvotcqdgcllat.supabase.co'
CATALOG=json.loads((ROOT/'CodeShinobi/barqmech-store-v3/catalog/generated.json').read_text(encoding='utf-8'))['products']

def request(config,path,body=None,method=None,headers=None,raw=False):
    key=config['SUPABASE_SERVICE_ROLE_KEY']
    h={'apikey':key,'Authorization':'Bearer '+key,**(headers or {})}
    data=body
    if body is not None and not isinstance(body,bytes):
        h['Content-Type']='application/json';data=json.dumps(body).encode()
    req=urllib.request.Request(config['SUPABASE_URL'].rstrip('/')+path,data=data,headers=h,method=method)
    with urllib.request.urlopen(req,timeout=90) as response:
        result=response.read()
        return result if raw else json.loads(result) if result else None

def read_rows(config,table):
    rows=[]
    for offset in range(0,100000,500):
        part=request(config,'/rest/v1/'+table+'?select=*&order=id&offset='+str(offset)+'&limit=500')
        rows.extend(part)
        if len(part)<500:return rows
    raise RuntimeError('Pagination cap exceeded')

def upsert(table,rows):
    for offset in range(0,len(rows),200):
        request(TARGET,'/rest/v1/'+table+'?on_conflict=id',rows[offset:offset+200],headers={'Prefer':'resolution=merge-duplicates,return=minimal'})

def catalog_history():
    if len(read_rows(TARGET,'v3_storefront_listings'))!=len(CATALOG):raise RuntimeError('V3 live seed must be complete first')
    existing_variants=read_rows(SOURCE,'catalog_variants')
    variant_ids={(v['product_id'],v['design_code']):v['id'] for v in existing_variants}
    products=[];variants=[]
    for product in CATALOG:
        products.append({key:product[key] for key in ('id','slug','title','category')})
        products[-1]['image_urls']=['https://barqmech.vercel.app'+path for path in product['images']]
        for index,variant in enumerate(product['variants']):
            code=variant['design_code']
            variants.append({'id':variant_ids.get((product['id'],code)) or str(uuid.uuid5(uuid.NAMESPACE_URL,'barqmech-v3:'+product['id']+':'+str(code))),'product_id':product['id'],'design_code':code,'sort_order':index,'pricing':variant['pricing'],'dxf_storage_path':None if product['category']=='Panels' else product['slug']+'/dc'+str(code)+'.dxf'})
    upsert('catalog_products',products);upsert('catalog_variants',variants)
    # Preserve historical totals/timestamps/IDs. Never replay historical emails.
    orders=read_rows(SOURCE,'orders')
    target_orders={row['id']:row for row in read_rows(TARGET,'orders')}
    prepared=[]
    for row in orders:
        if target_orders.get(row['id'],{}).get('request_hash'):raise RuntimeError('Historical order conflicts with a live V3 request')
        prepared.append({key:value for key,value in row.items() if key!='order_date'})
    upsert('orders',prepared)
    actual={row['id']:row for row in read_rows(TARGET,'orders')}
    fields=['order_code','customer_name','customer_email','customer_phone','address_line1','city','notes','lines','subtotal_pkr','shipping_pkr','grand_total_pkr','payment_method','created_at','order_completed','order_completed_at']
    for row in orders:
        for field in fields:
            if actual[row['id']].get(field)!=row.get(field):raise RuntimeError('History verification failed')
        if actual[row['id']].get('notifications') is not None:raise RuntimeError('Historical notifications must stay absent')
    report={'source_project':'ajaugjszvbsdxicswfwx','target_project':'bymhkgakvotcqdgcllat','catalog_products':len(products),'catalog_variants':len(variants),'historical_orders_verified':len(orders),'emails_sent':0,'source_changed':False}
    (ROOT/'.cache/v3-history-migration-result.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
    print(json.dumps(report),flush=True)

def copy_dxf(path):
    safe=urllib.parse.quote(path,safe='/')
    local=ROOT/'.cache/backups/non-panel-dxf'/path
    if local.exists():data=local.read_bytes()
    else:
        data=request(SOURCE,'/storage/v1/object/authenticated/product-dxf/'+safe,raw=True)
        local.parent.mkdir(parents=True,exist_ok=True);local.write_bytes(data)
    digest=hashlib.sha256(data).hexdigest()
    try:request(TARGET,'/storage/v1/object/product-dxf/'+safe,data,method='POST',headers={'Content-Type':'application/dxf','x-upsert':'false'})
    except urllib.error.HTTPError as error:
        # Resume only when an identical object already exists; never overwrite an unrelated file.
        if error.code not in (400,409):raise
    result=request(TARGET,'/storage/v1/object/authenticated/product-dxf/'+safe,raw=True)
    if hashlib.sha256(result).hexdigest()!=digest:raise RuntimeError('DXF copy checksum mismatch')
    return {'path':path,'bytes':len(data),'sha256':digest}

def dxf():
    paths=[p['slug']+'/dc'+str(v['design_code'])+'.dxf' for p in CATALOG if p['category']!='Panels' for v in p['variants']]
    result=[]
    with ThreadPoolExecutor(max_workers=6) as pool:
        futures=[pool.submit(copy_dxf,path) for path in paths]
        for future in as_completed(futures):
            result.append(future.result())
            if len(result)%25==0:print(json.dumps({'verified_dxf_objects':len(result),'total':len(paths)}),flush=True)
    manifest={'source_project':'ajaugjszvbsdxicswfwx','target_project':'bymhkgakvotcqdgcllat','objects':sorted(result,key=lambda x:x['path']),'source_deleted':False}
    (ROOT/'.cache/v3-dxf-migration-manifest.json').write_text(json.dumps(manifest,indent=2),encoding='utf-8')
    print(json.dumps({'verified_dxf_objects':len(result),'bytes':sum(x['bytes'] for x in result),'source_deleted':False}),flush=True)

if __name__=='__main__':
    try:
        action=sys.argv[1] if len(sys.argv)>1 else ''
        if action=='catalog-history':catalog_history()
        elif action=='dxf':dxf()
        else:raise RuntimeError('Choose catalog-history or dxf')
    except Exception as error:
        print(json.dumps({'failed':True,'error_type':type(error).__name__}),flush=True)
        raise SystemExit(1)
