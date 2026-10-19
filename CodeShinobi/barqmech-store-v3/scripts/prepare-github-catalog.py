"""One-time, local migration from existing masters; no database calls or mutations."""
from pathlib import Path
import csv,json,re,uuid,subprocess,concurrent.futures,sys
ROOT=Path(__file__).resolve().parents[3];APP=ROOT/'CodeShinobi/barqmech-store-v3';CAT=APP/'catalog';CAT.mkdir(exist_ok=True)
source=ROOT/'Media/Finalized/prices_summary.csv'
ids={r['slug']:r['id'] for r in csv.DictReader((ROOT/'Media/catalog_products.csv').open(encoding='utf-8-sig'))}
products={};prices=[];jobs=[];skipped=[]
for row in csv.DictReader(source.open(encoding='utf-8-sig')):
 path=row['file'].replace('\\','/');relative=path.split('/Finalized/',1)[-1];folder=ROOT/'Media/Finalized'/Path(relative).parent
 if not folder.exists():folder=Path(str(folder).replace('[Panel]','[Panels]'))
 title=folder.name;m=re.match(r'^\[(Artwork|Islamic|Panels?|Misc)\]',title,re.I)
 if not m:raise ValueError('Invalid category in pricing source')
 category={'artwork':'Artwork','islamic':'Islamic','panel':'Panels','panels':'Panels','misc':'Misc'}[m[1].lower()]
 slug=category.lower()+'-'+re.sub('[^a-z0-9]+','-',re.sub(r'^\[[^]]+\]\s*','',title).lower()).strip('-')
 code=re.search(r'_(\d+)$|^(\d+)$',Path(path).stem);code=int(next(g for g in code.groups() if g)) if code else 0
 if slug not in products:
  images=sorted([f for f in folder.rglob('*') if f.suffix.lower() in ('.jpg','.jpeg','.png','.webp','.gif','.jfif','.bmp','.tif','.tiff')],key=lambda f:[int(t) if t.isdigit() else t.casefold() for t in re.split(r'(\d+)',f.name)])
  if not images:skipped.append(slug);continue
  pid=ids.get(slug,str(uuid.uuid5(uuid.NAMESPACE_URL,'https://barqmech.com/products/'+slug)))
  urls=[]
  for index,img in enumerate(images):
   urls.append(f'/catalog-images/{slug}/{index}-1200.webp')
   for width in (320,640,1200):jobs.append((img,APP/f'public/catalog-images/{slug}/{index}-{width}.webp',width))
  products[slug]={'id':pid,'slug':slug,'category':category,'title':title,'images':json.dumps(urls,separators=(',',':'))}
 for i in (1,2,3):
  size=row[f'size{i}_w_x_h_inches'].strip()
  if not size:continue
  values={key:int(round(float(row.get(f'size{i}_{field}_usd','0').replace(',','') or 0))) for key,field in [('silver_pkr','total_price_silver'),('gold_pkr','total_price_golden'),('black_pkr','total_price_black'),('wooden_pkr','wooden_frame'),('led_pkr','led'),('install_pkr','installation')]}
  prices.append({'product_slug':slug,'design_code':code,'size':size,'feasible':row.get(f'size{i}_feasible','1'),**values})
with (CAT/'products.csv').open('w',newline='',encoding='utf-8') as f:
 w=csv.DictWriter(f,fieldnames=['id','slug','category','title','images']);w.writeheader();w.writerows(sorted(products.values(),key=lambda r:r['slug']))
with (CAT/'prices.csv').open('w',newline='',encoding='utf-8') as f:
 w=csv.DictWriter(f,fieldnames=['product_slug','design_code','size','feasible','silver_pkr','gold_pkr','black_pkr','wooden_pkr','led_pkr','install_pkr']);w.writeheader();w.writerows(prices)
def encode(job):
 src,dst,width=job;dst.parent.mkdir(parents=True,exist_ok=True)
 if dst.exists():return
 subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-nostdin','-i',str(src),'-frames:v','1','-vf',f"scale='min({width},iw)':-2",'-c:v','libwebp','-quality','84','-threads','1',str(dst)],check=True)
if '--catalog-only' not in sys.argv:
 with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:list(pool.map(encode,jobs))
print(json.dumps({'products':len(products),'priceRows':len(prices),'imageVariants':len(jobs),'skippedNoImages':sorted(set(skipped))}))
