from pathlib import Path
import re,json,urllib.request,urllib.error,sys
ROOT=Path(__file__).resolve().parents[1]
def token():
 s=(ROOT/'supabase_keys.txt').read_text(encoding='utf-8-sig')
 m=re.search(r'^\s*vercel_token\s*[:=]\s*[\"\x27]?([^\s\"\x27]+)',s,re.I|re.M)
 if not m:raise RuntimeError('Missing local Vercel token')
 return m.group(1)
def api(path,body=None,method=None):
 headers={'Authorization':'Bearer '+token()}
 if body is not None:headers['Content-Type']='application/json'
 req=urllib.request.Request('https://api.vercel.com'+path,data=json.dumps(body).encode() if body is not None else None,headers=headers,method=method)
 with urllib.request.urlopen(req,timeout=45) as response:return json.load(response)
PROJECT='prj_oGANYuW3PYesrKzk4uSHmeT4yO8t'
TEAM='team_rsiWJN4vLyKfxHOWmmBX2AXH'
def bypass():
 import secrets
 path=ROOT/'.cache/vercel-release-bypass.env'
 if path.exists():raise RuntimeError('A release bypass file already exists; inspect/revoke before creating another')
 secret=secrets.token_hex(16)
 api('/v1/projects/'+PROJECT+'/protection-bypass?teamId='+TEAM,{'generate':{'secret':secret,'note':'Temporary owner-authorized V3 acceptance; revoke after checks'}},method='PATCH')
 path.write_text('VERCEL_AUTOMATION_BYPASS_SECRET='+secret+'\n',encoding='utf-8')
 print(json.dumps({'temporary_bypass_created':True,'protection_retained':True,'revocation_required':True}))
def revoke():
 path=ROOT/'.cache/vercel-release-bypass.env'
 secret=path.read_text(encoding='utf-8').split('=',1)[1].strip()
 api('/v1/projects/'+PROJECT+'/protection-bypass?teamId='+TEAM,{'revoke':{'secret':secret}},method='PATCH')
 path.unlink()
 print(json.dumps({'temporary_bypass_revoked':True}))
def status():
 x=api('/v6/deployments?projectId='+PROJECT+'&teamId='+TEAM+'&limit=3')
 for d in x.get('deployments',[]):print(json.dumps({'id':d['uid'],'url':d['url'],'state':d.get('state'),'sha':d.get('meta',{}).get('githubCommitSha')}))
def diagnose():
 latest=api('/v6/deployments?projectId='+PROJECT+'&teamId='+TEAM+'&limit=1')['deployments'][0]['uid']
 events=api('/v3/deployments/'+latest+'/events?teamId='+TEAM+'&limit=1000')
 (ROOT/'.cache/vercel-preview-build-events.json').write_text(json.dumps(events),encoding='utf-8')
 for event in events if isinstance(events,list) else events.get('events',[]):
  line=event.get('text') or event.get('payload',{}).get('text','')
  if any(word in line.lower() for word in ['error','failed','missing','unsupported']):print(line[:700])
def configure():
 envs=api('/v10/projects/'+PROJECT+'/env?teamId='+TEAM)['envs']
 existing={e['key'] for e in envs}
 values={}
 for line in (ROOT/'.cache/vercel-v3-settings.env').read_text(encoding='utf-8-sig').splitlines():
  if '=' in line and not line.startswith('#'):
   k,v=line.split('=',1);values[k.strip()]=v.strip().strip('"').strip("'")
 if values.get('SUPABASE_URL')!='https://bymhkgakvotcqdgcllat.supabase.co':raise RuntimeError('Unexpected Supabase target')
 if 'ADMIN_PASSWORD' in existing:values.pop('ADMIN_PASSWORD',None)
 elif values.get('ADMIN_PASSWORD','').startswith('REPLACE_'):
  import secrets
  values['ADMIN_PASSWORD']=secrets.token_urlsafe(24)
  (ROOT/'.cache/v3-admin-access.env').write_text('ADMIN_PASSWORD='+values['ADMIN_PASSWORD']+'\n',encoding='utf-8')
 for k,v in values.items():
  if not v or v.startswith('REPLACE_'):raise RuntimeError('Unconfigured required setting: '+k)
 payload=[{'key':k,'value':v,'type':'sensitive','target':['preview','production']} for k,v in values.items()]
 api('/v10/projects/'+PROJECT+'/env?teamId='+TEAM+'&upsert=true',payload,method='POST')
 api('/v9/projects/'+PROJECT+'?teamId='+TEAM,{'rootDirectory':None,'outputDirectory':'CodeShinobi/barqmech-store-v3/dist','nodeVersion':'22.x'},method='PATCH')
 print(json.dumps({'configured_keys':sorted(values),'admin_password_preserved':'ADMIN_PASSWORD' in existing,'rootDirectory':None,'nodeVersion':'22.x','production_deployment_unchanged':True}))
def inspect():
 project=api('/v9/projects/'+PROJECT+'?teamId='+TEAM)
 envs=api('/v10/projects/'+PROJECT+'/env?teamId='+TEAM)
 deployments=api('/v6/deployments?projectId='+PROJECT+'&teamId='+TEAM+'&limit=8')
 for name,data in [('project',project),('envs',envs),('deployments',deployments)]:
  (ROOT/('.cache/vercel-'+name+'-before.json')).write_text(json.dumps(data),encoding='utf-8')
 print(json.dumps({'project':{k:project.get(k) for k in ['name','rootDirectory','installCommand','buildCommand','outputDirectory','nodeVersion','ssoProtection']},'git':project.get('link'),'envs':[{'key':e['key'],'target':e.get('target'),'type':e.get('type')} for e in envs.get('envs',[])],'deployments':[{'uid':d['uid'],'url':d['url'],'state':d.get('state'),'target':d.get('target'),'ref':d.get('meta',{}).get('githubCommitRef'),'sha':d.get('meta',{}).get('githubCommitSha')} for d in deployments.get('deployments',[])]}))
if __name__=='__main__':
 try:
  if len(sys.argv)>1 and sys.argv[1] in ['configure','diagnose','status','bypass','revoke']:
   globals()[sys.argv[1]]();sys.exit(0)
  if len(sys.argv)>1 and sys.argv[1]=='inspect':
   inspect();sys.exit(0)
  x=api('/v10/projects?limit=100')
  (ROOT/'.cache/vercel-project-discovery.json').write_text(json.dumps(x),encoding='utf-8')
  print(json.dumps({'projects':[{'id':p['id'],'name':p['name'],'accountId':p.get('accountId'),'rootDirectory':p.get('rootDirectory'),'framework':p.get('framework')} for p in x.get('projects',[])]}))
  if not x.get('projects'):
   y=api('/v2/teams?limit=100');print(json.dumps({'teams':[{'id':t['id'],'slug':t['slug']} for t in y.get('teams',[])]}))
 except urllib.error.HTTPError as e:
  details=json.loads(e.read()).get('error',{})
  print(json.dumps({'failed':True,'status':e.code,'code':details.get('code'),'message':re.sub(r'[A-Za-z0-9_-]{32,}','[redacted]',str(details.get('message','')))[:500]}));sys.exit(1)
 except Exception as e:print(json.dumps({'failed':True,'type':type(e).__name__}));sys.exit(1)

