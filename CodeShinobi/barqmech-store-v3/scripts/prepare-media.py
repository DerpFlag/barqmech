"""Create V3 delivery assets from masters. Requires FFmpeg; never edits masters."""
from pathlib import Path
import subprocess,json
ROOT=Path(__file__).resolve().parents[3]
APP=ROOT/'CodeShinobi/barqmech-store-v3'
OUT=APP/'src/assets/optimized'
OUT.mkdir(parents=True,exist_ok=True)
def run(src,dst,args):
 dst.parent.mkdir(parents=True,exist_ok=True)
 if dst.exists():return
 subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-nostdin','-i',str(src),*args,'-threads','2',str(dst)],check=True)
video=ROOT/'video/stitched-4x-fixed.mp4'
for name,width,crf in [('hero-desktop',1280,25),('hero-mobile',720,26)]:
 run(video,OUT/(name+'.mp4'),['-an','-vf',f'scale={width}:-2,fps=30','-c:v','libx264','-preset','medium','-crf',str(crf),'-pix_fmt','yuv420p','-movflags','+faststart'])
# Match the first decoded delivery frame; seeking to 1s flashed a later logo shot.
run(OUT/'hero-desktop.mp4',OUT/'hero-poster.webp',['-frames:v','1','-c:v','libwebp','-quality','86'])
for src in (APP/'src/assets/collection').glob('*.mp4'):
 run(src,OUT/'collection'/src.name,['-an','-c:v','libx264','-preset','medium','-crf','23','-pix_fmt','yuv420p','-movflags','+faststart'])
for src in (ROOT/'Media/category pics').rglob('*'):
 if src.suffix.lower() not in ('.jpg','.jpeg','.png','.webp'):continue
 for folder,width in [('categories',1200),('categories-small',640)]:
  rel=src.relative_to(ROOT/'Media/category pics')
  run(src,OUT/folder/rel.parent/(src.name+'.webp'),['-frames:v','1','-vf',f"scale='min({width},iw)':-2",'-c:v','libwebp','-quality','82'])
logo=ROOT/'Media/Final Logo - Copy.png'
run(logo,OUT/'logo.webp',['-frames:v','1','-vf',"scale='min(640,iw)':-2",'-c:v','libwebp','-quality','90'])
public=APP/'public';public.mkdir(exist_ok=True)
run(logo,public/'favicon.png',['-frames:v','1','-vf','scale=32:32:force_original_aspect_ratio=decrease,pad=32:32:(ow-iw)/2:(oh-ih)/2:color=0x00000000'])
print(json.dumps({str(p.relative_to(APP)):p.stat().st_size for p in OUT.rglob('*') if p.is_file()},indent=2))
