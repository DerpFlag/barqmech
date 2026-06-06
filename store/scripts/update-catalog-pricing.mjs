/**
 * Update catalog_variants.pricing from prices_summary.csv (no Storage re-upload).
 *
 * Requires SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY (store/.env.import.local or Media/Keys.txt).
 *
 *   cd store
 *   node --env-file=.env.import.local scripts/update-catalog-pricing.mjs
 *
 * Optional: PRICES_CSV, DRY_RUN=1
 */
import { createClient } from '@supabase/supabase-js'
import { parse } from 'csv-parse/sync'
import { existsSync, readFileSync } from 'node:fs'
import { basename, dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const REPO_ROOT = resolve(__dirname, '../..')

function intOrZero(v) {
  const n = Math.round(Number(String(v).replace(/,/g, '')))
  return Number.isFinite(n) ? n : 0
}

function feasibleFromCsv(v) {
  return intOrZero(v) !== 0
}

function rowToPricing(row) {
  const s1 = String(row.size1_w_x_h_inches || '').trim()
  const s2 = String(row.size2_w_x_h_inches || '').trim()
  const s3 = String(row.size3_w_x_h_inches || '').trim()
  return {
    sizes: [
      {
        label: s1,
        Silver: intOrZero(row.size1_total_price_silver_usd),
        Gold: intOrZero(row.size1_total_price_golden_usd),
        Black: intOrZero(row.size1_total_price_black_usd),
        wooden: intOrZero(row.size1_wooden_frame_usd),
        led: intOrZero(row.size1_led_usd),
        install: intOrZero(row.size1_installation_usd),
        feasible: feasibleFromCsv(row.size1_feasible ?? 1),
      },
      {
        label: s2,
        Silver: intOrZero(row.size2_total_price_silver_usd),
        Gold: intOrZero(row.size2_total_price_golden_usd),
        Black: intOrZero(row.size2_total_price_black_usd),
        wooden: intOrZero(row.size2_wooden_frame_usd),
        led: intOrZero(row.size2_led_usd),
        install: intOrZero(row.size2_installation_usd),
        feasible: feasibleFromCsv(row.size2_feasible ?? 1),
      },
      {
        label: s3,
        Silver: intOrZero(row.size3_total_price_silver_usd),
        Gold: intOrZero(row.size3_total_price_golden_usd),
        Black: intOrZero(row.size3_total_price_black_usd),
        wooden: intOrZero(row.size3_wooden_frame_usd),
        led: intOrZero(row.size3_led_usd),
        install: intOrZero(row.size3_installation_usd),
        feasible: feasibleFromCsv(row.size3_feasible ?? 1),
      },
    ].filter((t) => t.label.length > 0),
  }
}

function slugifyPart(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function parseCategoryFromFolderName(name) {
  const m = String(name).match(/^\[(Artwork|Islamic|Panels|Misc|Panel)\]/i)
  if (!m) return null
  const k = m[1].toLowerCase()
  if (k === 'artwork') return 'Artwork'
  if (k === 'islamic') return 'Islamic'
  if (k === 'panels' || k === 'panel') return 'Panels'
  if (k === 'misc') return 'Misc'
  return null
}

function slugForProduct(category, folderTitle) {
  const withoutTag = folderTitle.replace(/^\[[^\]]+\]\s*/i, '').trim()
  const tail = slugifyPart(withoutTag) || slugifyPart(folderTitle)
  return `${category.toLowerCase()}-${tail}`.slice(0, 200)
}

function designCodeFromDxfPath(filePath) {
  const base = basename(filePath, '.dxf')
  const m = base.match(/_(\d+)$/i)
  if (m) return parseInt(m[1], 10)
  const m2 = base.match(/^(\d+)$/)
  if (m2) return parseInt(m2[1], 10)
  return 0
}

function resolveCsvFilesystemPath(rawPath) {
  const abs = resolve(String(rawPath || '').trim())
  if (existsSync(abs)) return abs
  const toPanels = abs
    .replace(/(\\Finalized\\)\[Panel\](\\)/i, '$1[Panels]$2')
    .replace(/(\/Finalized\/)\[Panel\](\/)/i, '$1[Panels]$2')
  if (toPanels !== abs && existsSync(toPanels)) return toPanels
  return abs
}

function readCsvSync(csvPath) {
  let buf = readFileSync(csvPath, 'utf8')
  if (buf.charCodeAt(0) === 0xfeff) buf = buf.slice(1)
  return parse(buf, { columns: true, skip_empty_lines: true, trim: true })
}

async function main() {
  const dryRun = process.env.DRY_RUN === '1' || process.env.DRY_RUN === 'true'
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const { loadSupabaseServiceEnvFromKeysFile } = await import('./load-keys-env.mjs')
      const keys = loadSupabaseServiceEnvFromKeysFile()
      process.env.SUPABASE_URL = keys.SUPABASE_URL
      process.env.SUPABASE_SERVICE_ROLE_KEY = keys.SUPABASE_SERVICE_ROLE_KEY
    } catch {
      /* env file may be set explicitly */
    }
  }
  const url = String(process.env.SUPABASE_URL || '').trim()
  const serviceKey = String(process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim()
  const csvPath = resolve(process.env.PRICES_CSV || join(REPO_ROOT, 'Media', 'Finalized', 'prices_summary.csv'))

  if (!existsSync(csvPath)) {
    console.error(`CSV not found: ${csvPath}`)
    process.exit(1)
  }

  const rows = readCsvSync(csvPath)
  /** @type {Map<string, { slug: string, design_code: number, pricing: object }>} */
  const updates = new Map()

  for (const row of rows) {
    const file = String(row.file || '').trim()
    if (!file.toLowerCase().endsWith('.dxf')) continue
    const fileAbs = resolveCsvFilesystemPath(file)
    const folder = dirname(fileAbs)
    const title = basename(folder)
    const category = parseCategoryFromFolderName(title)
    if (!category) continue
    const slug = slugForProduct(category, title)
    const design_code = designCodeFromDxfPath(fileAbs)
    const pricing = rowToPricing(row)
    if (!pricing.sizes.length) continue
    updates.set(`${slug}::dc${design_code}`, { slug, design_code, pricing })
  }

  console.log(`Parsed ${updates.size} variant pricing rows from CSV (dry-run=${dryRun})`)

  if (dryRun) {
    const sample = [...updates.values()].slice(0, 3)
    for (const s of sample) {
      console.log(JSON.stringify(s, null, 2))
    }
    return
  }

  if (!url || !serviceKey) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
    process.exit(1)
  }

  const supabase = createClient(url, serviceKey, { auth: { persistSession: false } })

  const { data: products, error: prodErr } = await supabase.from('catalog_products').select('id, slug')
  if (prodErr) {
    console.error('catalog_products fetch failed:', prodErr.message)
    process.exit(1)
  }

  const slugToId = new Map((products ?? []).map((p) => [p.slug, p.id]))
  let updated = 0
  let missingProduct = 0
  let missingVariant = 0
  let failed = 0

  for (const { slug, design_code, pricing } of updates.values()) {
    const product_id = slugToId.get(slug)
    if (!product_id) {
      missingProduct++
      continue
    }

    const { data: existing, error: selErr } = await supabase
      .from('catalog_variants')
      .select('id')
      .eq('product_id', product_id)
      .eq('design_code', design_code)
      .maybeSingle()

    if (selErr) {
      console.error(`select failed ${slug} dc${design_code}:`, selErr.message)
      failed++
      continue
    }

    if (!existing?.id) {
      missingVariant++
      continue
    }

    const { error: updErr } = await supabase.from('catalog_variants').update({ pricing }).eq('id', existing.id)
    if (updErr) {
      console.error(`update failed ${slug} dc${design_code}:`, updErr.message)
      failed++
      continue
    }
    updated++
    if (updated % 250 === 0) console.log(`Updated ${updated}…`)
  }

  console.log('Done.')
  console.log({ updated, missingProduct, missingVariant, failed })
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
