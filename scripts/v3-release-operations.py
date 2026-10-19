"""Explicit V3 release operations; secrets and private backups stay in ignored local files.

backup: read-only database export, encrypted for this Windows user using DPAPI.
prepare-schema: apply only additive migrations012+013 using a scoped Management token.
verify-schema: inspect schema/RLS/grants without selecting private order records.
"""
from pathlib import Path
from datetime import datetime, timezone, timedelta
import ctypes, hashlib, json, os, re, sys, urllib.request, urllib.error

ROOT = Path(__file__).resolve().parents[1]
CONFIG = {}
for rel in ('store/.env.local', 'store/.env.import.local'):
    for line in (ROOT / rel).read_text(encoding='utf-8-sig').splitlines():
        if '=' in line and not line.lstrip().startswith('#'):
            key, value = line.split('=', 1)
            CONFIG[key.strip()] = value.strip().strip('\"').strip("'")
CONFIG.update({k: os.environ[k] for k in ('SUPABASE_ACCESS_TOKEN',) if os.environ.get(k)})
credential_file=ROOT/'supabase_keys.txt'
if not CONFIG.get('SUPABASE_ACCESS_TOKEN') and credential_file.exists():
    candidates=list(dict.fromkeys(re.findall(r'\bsbp_[A-Za-z0-9_-]+',credential_file.read_text(encoding='utf-8-sig'))))
    if len(candidates)==1: CONFIG['SUPABASE_ACCESS_TOKEN']=candidates[0]
BASE = CONFIG['SUPABASE_URL'].rstrip('/')
PROJECT = BASE.split('//')[1].split('.')[0]
if PROJECT != 'ajaugjszvbsdxicswfwx':
    raise SystemExit('Unexpected project: stop and review release target.')

def request(url, body=None, management=False):
    token = CONFIG.get('SUPABASE_ACCESS_TOKEN') if management else CONFIG['SUPABASE_SERVICE_ROLE_KEY']
    if not token:
        raise RuntimeError('Management token not configured')
    headers = {'Authorization': 'Bearer ' + token}
    if not management: headers['apikey'] = token
    if body is not None: headers['Content-Type'] = 'application/json'
    req = urllib.request.Request(url, data=None if body is None else json.dumps(body).encode(), headers=headers)
    with urllib.request.urlopen(req, timeout=120) as response:
        return json.load(response)

class Blob(ctypes.Structure):
    _fields_ = [('length', ctypes.c_ulong), ('data', ctypes.POINTER(ctypes.c_ubyte))]

def crypt(data, decrypt=False):
    if os.name != 'nt': raise RuntimeError('Private backup encryption requires Windows DPAPI')
    buffer = ctypes.create_string_buffer(data)
    source = Blob(len(data), ctypes.cast(buffer, ctypes.POINTER(ctypes.c_ubyte)))
    target = Blob()
    fn = ctypes.windll.crypt32.CryptUnprotectData if decrypt else ctypes.windll.crypt32.CryptProtectData
    ok = fn(ctypes.byref(source), None, None, None, None, 1, ctypes.byref(target))
    if not ok: raise RuntimeError('DPAPI encryption/verification failed')
    try: return ctypes.string_at(target.data, target.length)
    finally: ctypes.windll.kernel32.LocalFree(target.data)

def backup():
    snapshot = {'project': PROJECT, 'schema': request(BASE + '/rest/v1/'), 'tables': {}}
    for table in ('catalog_products', 'catalog_variants', 'orders'):
        rows = []
        for offset in range(0, 100000, 500):
            data = request(BASE + '/rest/v1/' + table + '?select=*&order=id&offset=' + str(offset) + '&limit=500')
            rows.extend(data)
            if len(data) < 500: break
        else: raise RuntimeError('Backup exceeded pagination cap')
        snapshot['tables'][table] = rows
    raw = json.dumps(snapshot, separators=(',', ':')).encode()
    encrypted = crypt(raw)
    if crypt(encrypted, True) != raw: raise RuntimeError('Backup verification failed')
    stamp = datetime.now(timezone(timedelta(hours=5))).strftime('%Y%m%d-%H%M%S')
    folder = ROOT / '.cache/backups' / stamp
    folder.mkdir(parents=True, exist_ok=False)
    (folder / 'supabase-private.dpapi').write_bytes(encrypted)
    manifest = {'project': PROJECT, 'created': stamp, 'counts': {k: len(v) for k, v in snapshot['tables'].items()}, 'plaintext_sha256': hashlib.sha256(raw).hexdigest(), 'encrypted_bytes': len(encrypted), 'restore_requires': 'Same Windows user profile; decrypt with DPAPI. This is a data/schema-API export, not a full PostgreSQL roles/policies dump or media backup.'}
    (folder / 'manifest.json').write_text(json.dumps(manifest, indent=2))
    print(json.dumps({'backup_verified': True, 'folder': str(folder.relative_to(ROOT)), 'counts': manifest['counts']}))

def query(sql, read_only=False):
    return request('https://api.supabase.com/v1/projects/' + PROJECT + '/database/query', {'query': sql, 'read_only': read_only}, True)

def prepare():
    if not CONFIG.get('SUPABASE_ACCESS_TOKEN'): raise RuntimeError('Management token not configured')
    backups = list((ROOT / '.cache/backups').glob('*/supabase-private.dpapi'))
    if not backups: raise RuntimeError('Create and verify a private backup before preparing schema')
    sql = 'begin;\n' + '\n'.join((ROOT / 'store/supabase/migrations' / name).read_text() for name in ('012_v3_live_listings.sql', '013_v3_nonbreaking_prepare.sql')) + "\nnotify pgrst, 'reload schema';\ncommit;"
    query(sql)
    print(json.dumps({'additive_schema_applied': True, 'project': PROJECT, 'legacy_order_permissions_changed': False, 'media_deleted': False}))

def verify():
    sql = """select c.relname as name,c.relkind,c.relrowsecurity as rls,
      has_table_privilege('anon',c.oid,'SELECT') as anon_select_grant,
      has_table_privilege('anon',c.oid,'INSERT') as anon_insert_grant,
      has_table_privilege('service_role',c.oid,'SELECT') as service_select_grant
      from pg_class c join pg_namespace n on n.oid=c.relnamespace
      where n.nspname='public' and c.relname in ('orders','order_products','catalog_products','catalog_variants','v3_storefront_listings','storefront_request_limits') order by c.relname;"""
    result = query(sql, True)
    print(json.dumps({'schema_access': result}))

if __name__ == '__main__':
    try:
        action = sys.argv[1] if len(sys.argv) > 1 else ''
        if action == 'backup': backup()
        elif action == 'prepare-schema': prepare()
        elif action == 'verify-schema': verify()
        else: raise RuntimeError('Choose backup, prepare-schema or verify-schema')
    except urllib.error.HTTPError as error:
        print(json.dumps({'failed': True, 'http_status': error.code}))
        raise SystemExit(1)
    except Exception as error:
        print(json.dumps({'failed': True, 'error_type': type(error).__name__}))
        raise SystemExit(1)
