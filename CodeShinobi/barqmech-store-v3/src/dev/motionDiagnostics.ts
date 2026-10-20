/** Opt-in development measurement. RAF cadence is not a display/GPU FPS measurement. */
export function startMotionDiagnostics() {
  const host=document.createElement('aside'),result=document.createElement('output'),reset=document.createElement('button')
  host.dataset.motionDiagnostics='true'
  host.style.cssText='position:fixed;left:8px;bottom:8px;z-index:20000;background:#fff5e6;color:#171b20;padding:8px;font:12px monospace;max-width:330px;white-space:pre-wrap;border:1px solid #171b20'
  result.setAttribute('aria-label','Scroll frame sample');reset.textContent='Reset motion sample'
  host.append(result,reset);document.body.append(host)
  let intervals:number[]=[],last=0,scrolledAt=0,frame=0,longTasks=0
  const catalogRequests={summaries:0,details:0}
  const report=()=>{
    const sorted=[...intervals].sort((a,b)=>a-b),mean=intervals.reduce((a,b)=>a+b,0)/(intervals.length||1)
    result.textContent=JSON.stringify({samples:intervals.length,rafHz:mean?+(1000/mean).toFixed(1):0,p95ms:+(sorted[Math.floor(sorted.length*.95)]??0).toFixed(1),over25ms:intervals.filter(n=>n>25).length,over50ms:intervals.filter(n=>n>50).length,longTasks,catalogRequests},null,1)+'\n'
  }
  const tick=(now:number)=>{
    frame=0
    if(document.hidden||now-scrolledAt>180){last=0;report();return}
    if(last&&intervals.length<5000)intervals.push(now-last)
    last=now;frame=requestAnimationFrame(tick)
  }
  const scroll=()=>{scrolledAt=performance.now();if(!frame)frame=requestAnimationFrame(tick)}
  const observer=new PerformanceObserver(entries=>{for(const entry of entries.getEntries())if(entry.startTime<scrolledAt+180&&entry.startTime+entry.duration>scrolledAt-180)longTasks++})
  if(PerformanceObserver.supportedEntryTypes.includes('longtask'))observer.observe({entryTypes:['longtask']})
  // Counts only: no URLs, customer data or telemetry. Helps verify intent prefetch reuse.
  const resources=new PerformanceObserver(entries=>{
    let changed=false
    for(const entry of entries.getEntries()){
      const url=new URL(entry.name,location.href)
      if(url.origin!==location.origin||url.pathname!=='/api/v3/catalog')continue
      catalogRequests[url.searchParams.has('slug')?'details':'summaries']++;changed=true
    }
    if(changed)report()
  })
  if(PerformanceObserver.supportedEntryTypes.includes('resource'))resources.observe({type:'resource',buffered:true})
  reset.onclick=()=>{intervals=[];longTasks=0;last=0;report()}
  window.addEventListener('scroll',scroll,{passive:true});report()
  window.addEventListener('pagehide',()=>{observer.disconnect();resources.disconnect();cancelAnimationFrame(frame);window.removeEventListener('scroll',scroll);host.remove()},{once:true})
}
