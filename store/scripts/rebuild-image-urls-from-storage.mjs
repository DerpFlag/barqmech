/**
 * Rebuild `catalog_products.image_urls` from files already in the `product-images` bucket.
 *
 * Use after `import-finalized-catalog.mjs` has uploaded `preview-0.*`, `preview-1.*`, …
 * (or if you manually added images under `{slug}/`).
 *
 * Does NOT create new files — if a folder only has `hero.jpg`, you still get one URL.
 * To upload multiple rasters from disk, run import-finalized-catalog.mjs with FINALIZED_ROOT + CSV.
 *
 * Env (same as import; use store/.env.import.local):
 *   SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *
 * Run: cd store && node --env-file=.env.import.local scripts/rebuild-image-urls-from-storage.mjs
 */
import { createClient } from '@supabase/supabase-js'

const url = String(process.env.SUPABASE_URL || '').trim()
const serviceKey = String(process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim()

if (!url || !serviceKey) {
  console.error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (e.g. node --env-file=.env.import.local …)')
  process.exit(1)
}

const supabase = createClient(url, serviceKey, { auth: { persistSession: false } })

function sortImageObjectNames(names) {
  const preview = names
    .filter((n) => /^preview-\d+\.[\w]+$/i.test(n))
    .sort((a, b) => {
      const ia = parseInt(a.match(/^preview-(\d+)/i)[1], 10)
      const ib = parseInt(b.match(/^preview-(\d+)/i)[1], 10)
      return ia - ib
    })
  const hero = names.filter((n) => /^hero\.[\w]+$/i.test(n)).sort((a, b) => a.localeCompare(b, 'en'))
  if (preview.length) return [...preview, ...hero]
  return hero
}

async function main() {
  const { data: rows, error: qErr } = await supabase.from('catalog_products').select('id, slug')
  if (qErr || !rows?.length) {
    console.error('Failed to list products:', qErr?.message)
    process.exit(1)
  }

  let updated = 0
  let skipped = 0
  for (const row of rows) {
    const prefix = `${row.slug}/`
    const { data: files, error: lErr } = await supabase.storage.from('product-images').list(prefix, { limit: 100 })
    if (lErr) {
      console.warn(`${row.slug}: list error`, lErr.message)
      skipped += 1
      continue
    }
    const names = (files ?? []).filter((f) => f.name && !f.name.endsWith('/')).map((f) => f.name)
    const imageNames = sortImageObjectNames(names)
    if (!imageNames.length) {
      skipped += 1
      continue
    }
    const publicUrls = imageNames.map((name) => {
      const path = `${row.slug}/${name}`
      const { data } = supabase.storage.from('product-images').getPublicUrl(path)
      return data.publicUrl
    })

    const { error: uErr } = await supabase.from('catalog_products').update({ image_urls: publicUrls }).eq('id', row.id)
    if (uErr) {
      console.warn(`${row.slug}: update failed`, uErr.message)
      skipped += 1
    } else {
      if (publicUrls.length > 1) console.log(`${row.slug}: ${publicUrls.length} images`)
      updated += 1
    }
  }

  console.log(`Done. Updated ${updated} rows, skipped/failed ${skipped}.`)
}

await main()
