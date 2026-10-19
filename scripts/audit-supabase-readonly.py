"""Read-only provider inventory. Outputs aggregates/schema only, never keys or order rows."""
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, as_completed
import json, urllib.request, urllib.error, urllib.parse

ROOT = Path(__file__).resolve().parents[1]
config = {}
for relative in ('store/.env.local', 'store/.env.import.local'):
    for line in (ROOT / relative).read_text(encoding='utf-8-sig').splitlines():
        if '=' in line and not line.lstrip().startswith('#'):
            key, value = line.split('=', 1)
            config[key.strip()] = value.strip().strip('\"').strip("'")
base = config['SUPABASE_URL'].rstrip('/')

def request(path, role='service', method='GET', body=None, extra=None):
    key = config['SUPABASE_SERVICE_ROLE_KEY' if role == 'service' else 'SUPABASE_ANON_KEY']
    headers = {'apikey': key, 'Authorization': 'Bearer ' + key}
    headers.update(extra or {})
    data = None
    if body is not None:
        headers['Content-Type'] = 'application/json'
        data = json.dumps(body).encode()
    req = urllib.request.Request(base + path, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=30) as response:
            raw = response.read()
            return response.status, dict(response.headers), json.loads(raw) if raw else None
    except urllib.error.HTTPError as error:
        # Provider errors may contain configuration values; retain only machine codes.
        try: code = json.loads(error.read()).get('code', 'http_error')
        except Exception: code = 'http_error'
        return error.code, dict(error.headers), {'error_code': code}

def rows(table, columns):
    result = []
    for offset in range(0, 100000, 500):
        status, _, data = request('/rest/v1/' + table + '?select=' + columns + '&order=id&offset=' + str(offset) + '&limit=500')
        if status != 200: raise RuntimeError('Catalog read failed: ' + table)
        result.extend(data)
        if len(data) < 500: return result
    raise RuntimeError('Catalog pagination cap exceeded')

def list_prefix(bucket, prefix):
    objects, folders = [], []
    for offset in range(0, 100000, 1000):
        status, _, data = request('/storage/v1/object/list/' + bucket, method='POST', body={'prefix': prefix, 'limit': 1000, 'offset': offset, 'sortBy': {'column': 'name', 'order': 'asc'}})
        if status != 200: raise RuntimeError('Storage list failed: ' + bucket)
        for item in data:
            path = prefix + '/' + item['name'] if prefix else item['name']
            if item.get('id') is None: folders.append(path)
            else: objects.append({'path': path, 'bytes': (item.get('metadata') or {}).get('size', 0)})
        if len(data) < 1000: return objects, folders
    raise RuntimeError('Storage pagination cap exceeded')

def inventory(bucket):
    objects, pending = list_prefix(bucket, '')
    visited = {''}
    while pending:
        current = [p for p in pending if p not in visited]
        if not current: break
        visited.update(current)
        pending = []
        with ThreadPoolExecutor(max_workers=6) as pool:
            futures = [pool.submit(list_prefix, bucket, prefix) for prefix in current]
            for future in as_completed(futures):
                files, folders = future.result()
                objects.extend(files)
                pending.extend(folders)
    return objects

def main():
    status, _, schema = request('/rest/v1/')
    if status != 200: raise RuntimeError('Service credential cannot read schema')
    report = {'date': '2026-10-19', 'project': urllib.parse.urlparse(base).hostname, 'mode': 'read-only inventory; no order records downloaded', 'tables': {}, 'rpc_names': sorted(p[5:] for p in schema.get('paths', {}) if p.startswith('/rpc/'))}
    for table, definition in schema.get('definitions', {}).items():
        info = {'columns': sorted(definition.get('properties', {}))}
        for role in ('service', 'anon'):
            code, headers, _ = request('/rest/v1/' + table + '?select=*&limit=0', role, 'HEAD', extra={'Prefer': 'count=exact'})
            info[role] = {'status': code, 'count_range': headers.get('Content-Range') or headers.get('content-range')}
        report['tables'][table] = info
    print(json.dumps({'stage': 'schema/counts', 'tables': report['tables'], 'rpc_names': report['rpc_names']}), flush=True)
    status, _, buckets = request('/storage/v1/bucket')
    if status != 200: raise RuntimeError('Cannot read storage buckets')
    report['buckets'] = {}
    inventories = {}
    for bucket in buckets:
        if bucket['id'] not in ('product-images', 'product-dxf'): continue
        files = inventory(bucket['id'])
        inventories[bucket['id']] = files
        report['buckets'][bucket['id']] = {'public': bucket.get('public'), 'objects': len(files), 'bytes': sum(int(f['bytes'] or 0) for f in files), 'largest_bytes': max((int(f['bytes'] or 0) for f in files), default=0)}
        print(json.dumps({'stage': 'bucket', 'name': bucket['id'], **report['buckets'][bucket['id']]}), flush=True)
    products = rows('catalog_products', 'id,slug')
    variants = rows('catalog_variants', 'id,product_id,design_code,dxf_storage_path')
    local = json.loads((ROOT / 'CodeShinobi/barqmech-store-v3/catalog/generated.json').read_text())['products']
    by_id = {p['id']: p for p in products}
    by_variant = {(v['product_id'], int(v['design_code'])): v for v in variants}
    dxf_objects = {f['path'] for f in inventories.get('product-dxf', [])}
    expected = [(p['id'], int(v['design_code'])) for p in local for v in p['variants']]
    missing_map = [pair for pair in expected if not by_variant.get(pair, {}).get('dxf_storage_path')]
    missing_file = [pair for pair in expected if by_variant.get(pair, {}).get('dxf_storage_path') and by_variant[pair]['dxf_storage_path'] not in dxf_objects]
    report['coverage'] = {'legacy_products': len(products), 'legacy_variants': len(variants), 'v3_products': len(local), 'v3_designs': len(expected), 'v3_product_ids_missing_from_legacy': sum(p['id'] not in by_id for p in local), 'v3_designs_without_dxf_mapping': len(missing_map), 'v3_mapped_designs_without_storage_object': len(missing_file), 'legacy_nonempty_dxf_mappings': sum(bool(v.get('dxf_storage_path')) for v in variants)}
    # Keep product-only remediation details in ignored local cache, not public docs.
    cache = ROOT / '.cache'
    cache.mkdir(exist_ok=True)
    (cache / 'supabase-dxf-audit-details.json').write_text(json.dumps({'missing_mapping': missing_map, 'missing_object': missing_file, 'dxf_objects': sorted(dxf_objects)}, indent=2))
    if dxf_objects:
        sample = sorted(dxf_objects)[0]
        code, _, _ = request('/storage/v1/object/public/product-dxf/' + urllib.parse.quote(sample, safe='/'), 'anon', 'HEAD')
        report['private_dxf_public_route_status'] = code
    report['limitations'] = ['No SQL execution/pg catalog policy inspection', 'No real order/customer records read', 'No email sent', 'No writes, migrations, imports or uploads', 'Metadata coverage does not verify DXF geometry/ordered dimensions']
    dest = ROOT / 'docs/previews/supabase-readonly-audit-2026-10-19.json'
    dest.parent.mkdir(exist_ok=True)
    dest.write_text(json.dumps(report, indent=2) + '\n')
    print(json.dumps({'stage': 'completed', 'coverage': report['coverage'], 'report': str(dest.relative_to(ROOT))}), flush=True)

if __name__ == '__main__':
    try: main()
    except Exception as error:
        print(json.dumps({'failed': True, 'error_type': type(error).__name__}), flush=True)
        raise SystemExit(1)
