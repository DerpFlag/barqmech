/** Read-only build preview for a public tunnel. Never proxies API or serves repository files. */
import {createServer} from 'node:http'
import {createReadStream} from 'node:fs'
import {realpath,stat} from 'node:fs/promises'
import {fileURLToPath} from 'node:url'
import path from 'node:path'

const root=await realpath(fileURLToPath(new URL('../dist',import.meta.url)))
const port=Number(process.env.PREVIEW_SHARE_PORT||5178)
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.mp4':'video/mp4','.woff2':'font/woff2','.ico':'image/x-icon','.txt':'text/plain; charset=utf-8','.xml':'application/xml; charset=utf-8'}
const inside=file=>file.startsWith(root+path.sep)
const server=createServer(async(req,res)=>{
 res.setHeader('X-Content-Type-Options','nosniff')
 res.setHeader('X-Frame-Options','DENY')
 res.setHeader('Referrer-Policy','no-referrer')
 res.setHeader('X-Robots-Tag','noindex, nofollow, noarchive')
 res.setHeader('Cache-Control','no-store')
 const reject=(status,message)=>{res.writeHead(status,{'Content-Type':'text/plain; charset=utf-8'});res.end(req.method==='HEAD'?undefined:message)}
 if(!['GET','HEAD'].includes(req.method))return reject(405,'This is a view-only preview. Forms and ordering are not connected.')
 let pathname
 try{pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname)}catch{return reject(400,'Invalid path')}
 if(pathname.includes('\\')||pathname.includes('\0')||pathname.split('/').some(part=>part.startsWith('.'))||/^\/(api|admin|@fs|src)(\/|$)/i.test(pathname))return reject(404,'Not available in this preview')
 let file=path.resolve(root,'.'+pathname),status=200
 if(file!==root&&!inside(file))return reject(404,'Not found')
 try{
  if((await stat(file)).isDirectory())file=path.join(file,'index.html')
  file=await realpath(file)
  if(!inside(file))return reject(404,'Not found')
 }catch{file=path.join(root,'404.html');status=404}
 const type=mime[path.extname(file)]
 if(!type)return reject(404,'Not found')
 try{
  const info=await stat(file)
  if(!info.isFile())return reject(404,'Not found')
  let start=0,end=info.size-1
  // Byte ranges allow MP4s to start and seek without downloading the complete file.
  if(status===200&&req.headers.range){
   const match=/^bytes=(\d*)-(\d*)$/.exec(req.headers.range)
   if(!match||(!match[1]&&!match[2])){res.setHeader('Content-Range',`bytes */${info.size}`);return reject(416,'Invalid range')}
   start=match[1]?Number(match[1]):Math.max(0,info.size-Number(match[2]))
   end=match[1]&&match[2]?Math.min(Number(match[2]),info.size-1):info.size-1
   if(!Number.isSafeInteger(start)||!Number.isSafeInteger(end)||start>end||start>=info.size){res.setHeader('Content-Range',`bytes */${info.size}`);return reject(416,'Invalid range')}
   status=206;res.setHeader('Content-Range',`bytes ${start}-${end}/${info.size}`)
  }
  res.writeHead(status,{'Content-Type':type,'Content-Length':end-start+1,'Accept-Ranges':'bytes'})
  if(req.method==='HEAD')return res.end()
  const stream=createReadStream(file,{start,end});stream.on('error',()=>res.destroy());stream.pipe(res)
 }catch{if(!res.headersSent)reject(404,'Not found');else res.destroy()}
})
server.listen(port,'127.0.0.1',()=>console.log(`V3 view-only build preview: http://127.0.0.1:${port}`))
server.on('error',error=>{console.error(error.message);process.exitCode=1})
