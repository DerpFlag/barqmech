/**
 * Audit Supabase Storage bucket sizes (service role). Does not print secrets.
 * Usage: node store/scripts/audit-storage.mjs
 */
import { createClient } from '@supabase/supabase-js'
import { loadSupabaseServiceEnvFromKeysFile } from './load-keys-env.mjs'

const env = loadSupabaseServiceEnvFromKeysFile()
const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
})

async function listAllObjects(bucket, prefix = '') {
  const out = []
  let offset = 0
  const limit = 1000
  while (true) {
    const { data, error } = await supabase.storage.from(bucket).list(prefix, {
      limit,
      offset,
      sortBy: { column: 'name', order: 'asc' },
    })
    if (error) throw new Error(`${bucket}/${prefix}: ${error.message}`)
    if (!data?.length) break
    for (const item of data) {
      const path = prefix ? `${prefix}/${item.name}` : item.name
      if (item.id == null) {
        const nested = await listAllObjects(bucket, path)
        out.push(...nested)
      } else {
        out.push({
          path,
          size: item.metadata?.size ?? 0,
          mimetype: item.metadata?.mimetype ?? '',
        })
      }
    }
    if (data.length < limit) break
    offset += limit
  }
  return out
}

function fmtBytes(n) {
  if (n >= 1e9) return `${(n / 1e9).toFixed(2)} GB`
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)} MB`
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)} KB`
  return `${n} B`
}

function summarize(objects) {
  const total = objects.reduce((s, o) => s + o.size, 0)
  const byExt = new Map()
  for (const o of objects) {
    const ext = o.path.includes('.') ? o.path.split('.').pop().toLowerCase() : '(none)'
    const cur = byExt.get(ext) ?? { count: 0, bytes: 0 }
    cur.count++
    cur.bytes += o.size
    byExt.set(ext, cur)
  }
  const largest = [...objects].sort((a, b) => b.size - a.size).slice(0, 10)
  return { total, count: objects.length, byExt, largest }
}

async function main() {
  const buckets = ['product-images', 'product-dxf']
  const report = {}

  for (const bucket of buckets) {
    console.log(`Scanning ${bucket}…`)
    const objects = await listAllObjects(bucket)
    report[bucket] = summarize(objects)
  }

  const grandTotal = Object.values(report).reduce((s, r) => s + r.total, 0)
  console.log('\n=== Storage audit ===\n')
  for (const [bucket, r] of Object.entries(report)) {
    console.log(`${bucket}:`)
    console.log(`  Objects: ${r.count}`)
    console.log(`  Total:   ${fmtBytes(r.total)} (${(r.total / 1e9).toFixed(3)} GB)`)
    console.log('  By extension:')
    for (const [ext, v] of [...r.byExt.entries()].sort((a, b) => b[1].bytes - a[1].bytes)) {
      console.log(`    .${ext}: ${v.count} files, ${fmtBytes(v.bytes)}`)
    }
    console.log('  Largest 5:')
    for (const o of r.largest.slice(0, 5)) {
      console.log(`    ${fmtBytes(o.size)}  ${o.path}`)
    }
    console.log('')
  }
  console.log(`Combined Storage: ${fmtBytes(grandTotal)} (${(grandTotal / 1e9).toFixed(3)} GB)`)
  console.log(`Free tier limit: 1 GB`)
  console.log(`After removing product-dxf: ~${fmtBytes(report['product-images']?.total ?? 0)}`)
}

main().catch((e) => {
  console.error(e.message || e)
  process.exit(1)
})
