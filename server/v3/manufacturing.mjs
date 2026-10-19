import {isManualDxfCategory} from '../../CodeShinobi/barqmech-store-v3/scripts/manufacturing-policy.mjs'

async function enrichLinesWithDxfDownloads(supabaseSvc, lines) {
  if (!Array.isArray(lines) || lines.length === 0) {
    return Array.isArray(lines) ? lines.map((l) => ({ ...l })) : []
  }
  lines=lines.map(({dxfSignedUrl,dxf_storage_path,dxfManual,...line})=>({...line,...(isManualDxfCategory(line.categorySlug)?{dxfManual:true}:{})}))
  const pids = [...new Set(lines.filter(l=>!l.dxfManual).map((l) => String(l.productId || '').trim()).filter(Boolean))]
  if (!supabaseSvc || !pids.length) {
    return lines.map((l) => ({ ...l }))
  }

  let variants,error
  if(process.env.CATALOG_SOURCE==='supabase'){
    const result=await supabaseSvc.from('v3_storefront_listings').select('id, variants').in('id',pids)
    error=result.error
    variants=(result.data??[]).flatMap(p=>(p.variants??[]).map(v=>({product_id:p.id,design_code:v.design_code,dxf_storage_path:v.dxf_storage_path})))
  }else{
  // Legacy snapshot mode only. Live V3 owns a complete, private mapping in its listing variants.
  const result = await supabaseSvc
    .from('catalog_variants')
    .select('product_id, design_code, dxf_storage_path')
    .in('product_id', pids)
  variants=result.data;error=result.error
  }

  if (error) {
    console.error('[place-order] manufacturing lookup failed')
    return lines.map((l) => ({ ...l }))
  }

  const lookup = new Map()
  for (const v of variants || []) {
    if (v?.product_id && v.dxf_storage_path != null && String(v.dxf_storage_path).trim()) {
      lookup.set(`${v.product_id}::${Number(v.design_code)}`, String(v.dxf_storage_path).trim())
    }
  }

  const ttlSec = 60 * 60 * 24 * 14
  const out = []
  for (const l of lines) {
    if(l.dxfManual){out.push(l);continue}
    const pid = String(l.productId || '').trim()
    const dc = l.designCode != null && Number.isFinite(Number(l.designCode)) ? Math.round(Number(l.designCode)) : 0
    const storagePath = pid ? lookup.get(`${pid}::${dc}`) : null
    let dxfSignedUrl = null
    const dxf_storage_path = storagePath || undefined

    if (storagePath && supabaseSvc) {
      const { data, error: signErr } = await supabaseSvc.storage.from('product-dxf').createSignedUrl(storagePath, ttlSec)
      if (signErr) console.error('[place-order] DXF signing failed')
      else dxfSignedUrl = data?.signedUrl ?? null
    }

    out.push({ ...l, dxf_storage_path, dxfSignedUrl })
  }
  return out
}

export { enrichLinesWithDxfDownloads }
