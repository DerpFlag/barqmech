/**
 * One-shot catalog import: Media/Finalized/prices_summary.csv + product folder images (all jpg/png/…) + row DXF files → Supabase.
 *
 * Requires (environment variables — use store/.env.import.local, never commit secrets):
 *   SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *
 * Optional:
 *   PRICES_CSV      — default: <repo>/Media/Finalized/prices_summary.csv
 *   FINALIZED_ROOT  — default: <repo>/Media/Finalized
 *   DRY_RUN=1       — parse + plan only; no Storage/DB writes
 *
 * Run from repo (barqmech), with env file in store/:
 *   cd store
 *   node --env-file=.env.import.local scripts/import-finalized-catalog.mjs
 *
 * After import, if `image_urls` ever drifts from Storage, you can resync from bucket objects:
 *   node --env-file=.env.import.local scripts/rebuild-image-urls-from-storage.mjs
 *
 * PKR: CSV numeric columns are treated as PKR integers (column names may say _usd).
 */
import { createClient } from '@supabase/supabase-js'
import { parse } from 'csv-parse/sync'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { basename, dirname, extname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const STORE_ROOT = resolve(__dirname, '..')
const REPO_ROOT = resolve(STORE_ROOT, '..')

const IMAGE_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.jfif', '.bmp', '.tif', '.tiff'])

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

function designCodeFromDxfPath(filePath) {
  const base = basename(filePath, '.dxf')
  const m = base.match(/_(\d+)$/i)
  if (m) return parseInt(m[1], 10)
  const m2 = base.match(/^(\d+)$/)
  if (m2) return parseInt(m2[1], 10)
  return 0
}

/**
 * CSV rows often store absolute paths. If `Finalized\[Panel]\` was renamed on disk to
 * `Finalized\[Panels]\`, the CSV path no longer exists — readdir would fail and we wrongly
 * reported "no image" even with `[Panel] Divider 9_1.png` in the real folder.
 */
function resolveCsvFilesystemPath(rawPath) {
  const abs = resolve(String(rawPath || '').trim())
  if (existsSync(abs)) return abs
  const toPanels = abs
    .replace(/(\\Finalized\\)\[Panel\](\\)/i, '$1[Panels]$2')
    .replace(/(\/Finalized\/)\[Panel\](\/)/i, '$1[Panels]$2')
  if (toPanels !== abs && existsSync(toPanels)) return toPanels
  const toPanel = abs
    .replace(/(\\Finalized\\)\[Panels\](\\)/i, '$1[Panel]$2')
    .replace(/(\/Finalized\/)\[Panels\](\/)/i, '$1[Panel]$2')
  if (toPanel !== abs && existsSync(toPanel)) return toPanel
  return abs
}

function titleFromFolder(folderPath) {
  return basename(folderPath)
}

function slugForProduct(category, folderTitle) {
  const withoutTag = folderTitle.replace(/^\[[^\]]+\]\s*/i, '').trim()
  const tail = slugifyPart(withoutTag) || slugifyPart(folderTitle)
  const prefix = category.toLowerCase()
  return `${prefix}-${tail}`.slice(0, 200)
}

/**
 * All raster images under the product folder (and shallow subfolders), sorted alphabetically by basename
 * (same order as the former "first image" pick, so the primary hero stays first).
 */
function allImagePaths(productDir, maxDepth = 4) {
  const found = []
  function walk(dir, depth) {
    if (depth > maxDepth) return
    let entries
    try {
      entries = readdirSync(dir, { withFileTypes: true })
    } catch {
      return
    }
    for (const e of entries) {
      const full = join(dir, e.name)
      if (e.isFile() && IMAGE_EXT.has(extname(e.name).toLowerCase())) {
        found.push(full)
      } else if (e.isDirectory()) {
        walk(full, depth + 1)
      }
    }
  }
  walk(productDir, 0)
  if (!found.length) return []
  found.sort((a, b) =>
    basename(a).localeCompare(basename(b), 'en', { sensitivity: 'base', numeric: true })
  )
  return found
}

function intOrZero(v) {
  const n = Math.round(Number(String(v).replace(/,/g, '')))
  return Number.isFinite(n) ? n : 0
}

function readCsvSync(csvPath) {
  let buf = readFileSync(csvPath, 'utf8')
  if (buf.charCodeAt(0) === 0xfeff) buf = buf.slice(1)
  return parse(buf, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  })
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
      },
      {
        label: s2,
        Silver: intOrZero(row.size2_total_price_silver_usd),
        Gold: intOrZero(row.size2_total_price_golden_usd),
        Black: intOrZero(row.size2_total_price_black_usd),
        wooden: intOrZero(row.size2_wooden_frame_usd),
        led: intOrZero(row.size2_led_usd),
        install: intOrZero(row.size2_installation_usd),
      },
      {
        label: s3,
        Silver: intOrZero(row.size3_total_price_silver_usd),
        Gold: intOrZero(row.size3_total_price_golden_usd),
        Black: intOrZero(row.size3_total_price_black_usd),
        wooden: intOrZero(row.size3_wooden_frame_usd),
        led: intOrZero(row.size3_led_usd),
        install: intOrZero(row.size3_installation_usd),
      },
    ].filter((t) => t.label.length > 0),
  }
}

async function main() {
  const dryRun = process.env.DRY_RUN === '1' || process.env.DRY_RUN === 'true'
  const url = String(process.env.SUPABASE_URL || '').trim()
  const serviceKey = String(process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim()
  const csvPath = resolve(process.env.PRICES_CSV || join(REPO_ROOT, 'Media', 'Finalized', 'prices_summary.csv'))
  const finalizedRoot = resolve(process.env.FINALIZED_ROOT || join(REPO_ROOT, 'Media', 'Finalized'))

  if (!existsSync(csvPath)) {
    console.error(`CSV not found: ${csvPath}`)
    process.exit(1)
  }

  if (!dryRun && (!url || !serviceKey)) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY (or set DRY_RUN=1 to validate CSV only).')
    console.error('Create store/.env.import.local (see store/.env.example) and run:')
    console.error('  cd store && node --env-file=.env.import.local scripts/import-finalized-catalog.mjs')
    process.exit(1)
  }

  const rows = readCsvSync(csvPath)
  const supabase =
    !dryRun && url && serviceKey ? createClient(url, serviceKey, { auth: { persistSession: false } }) : null

  /** @type {Map<string, { folder: string, title: string, category: string, slug: string, variants: Map<number, { pricing: object, sort: number, dxfAbsPath: string }> }>} */
  const products = new Map()

  let rowIndex = 0
  for (const row of rows) {
    rowIndex += 1
    const file = String(row.file || '').trim()
    if (!file) continue
    if (!file.toLowerCase().endsWith('.dxf')) {
      console.warn(`Row ${rowIndex}: skip non-dxf file: ${file}`)
      continue
    }
    const fileAbs = resolveCsvFilesystemPath(file)
    if (!existsSync(fileAbs)) {
      console.warn(`Row ${rowIndex}: file not found (check Panel vs Panels path): ${file}`)
      continue
    }
    const folder = dirname(fileAbs)
    const title = titleFromFolder(folder)
    const category = parseCategoryFromFolderName(title)
    if (!category) {
      console.warn(`Row ${rowIndex}: could not parse category from folder title: ${title}`)
      continue
    }
    const slug = slugForProduct(category, title)
    const designCode = designCodeFromDxfPath(fileAbs)
    const pricing = rowToPricing(row)
    if (!pricing.sizes.length) {
      console.warn(`Row ${rowIndex}: no size labels for ${file}`)
      continue
    }

    const key = folder.toLowerCase()
    if (!products.has(key)) {
      products.set(key, { folder, title, category, slug, variants: new Map() })
    }
    const p = products.get(key)
    const sort = p.variants.size
    const dxfAbsPath = fileAbs
    p.variants.set(designCode, { pricing, sort, dxfAbsPath })
  }

  console.log(`Products: ${products.size} (dry-run=${dryRun})`)

  for (const p of products.values()) {
    const imagePaths = allImagePaths(p.folder)
    if (!imagePaths.length) {
      console.warn(`No image in ${p.folder} — skipping product ${p.slug}`)
      continue
    }

    const rel = relative(finalizedRoot, p.folder).replace(/\\/g, '/')

    if (dryRun) {
      const names = imagePaths.map((fp) => basename(fp)).join(', ')
      console.log(
        `[dry-run] ${p.slug} | ${p.title} | variants=${[...p.variants.keys()].sort((a, b) => a - b).join(',')} | images(${imagePaths.length})=${names} | ${rel}`
      )
      continue
    }

    if (!supabase) continue

    const mimeByExt = {
      '.png': 'image/png',
      '.webp': 'image/webp',
      '.gif': 'image/gif',
      '.bmp': 'image/bmp',
      '.tif': 'image/tiff',
      '.tiff': 'image/tiff',
      '.jfif': 'image/jpeg',
    }

    const publicUrls = []
    for (let i = 0; i < imagePaths.length; i++) {
      const imgPath = imagePaths[i]
      const ext = extname(imgPath).toLowerCase() || '.jpg'
      const storagePath = `${p.slug}/preview-${i}${ext}`
      const mime = mimeByExt[ext] ?? 'image/jpeg'
      const fileBuf = readFileSync(imgPath)

      const { error: upErr } = await supabase.storage.from('product-images').upload(storagePath, fileBuf, {
        contentType: mime,
        upsert: true,
      })
      if (upErr) {
        console.error(`Storage upload failed ${p.slug} ${storagePath}:`, upErr.message)
        publicUrls.length = 0
        break
      }
      const { data: pub } = supabase.storage.from('product-images').getPublicUrl(storagePath)
      if (pub?.publicUrl) publicUrls.push(pub.publicUrl)
    }

    if (!publicUrls.length) {
      console.error(`No images uploaded for ${p.slug} — skipping DB upsert`)
      continue
    }

    const { data: upsertedRows, error: prodErr } = await supabase
      .from('catalog_products')
      .upsert(
        {
          slug: p.slug,
          category: p.category,
          title: p.title,
          image_urls: publicUrls,
        },
        { onConflict: 'slug' }
      )
      .select('id')

    if (prodErr || !upsertedRows?.[0]?.id) {
      console.error(`catalog_products upsert failed ${p.slug}:`, prodErr?.message)
      continue
    }

    const productId = upsertedRows[0].id

    const { error: delErr } = await supabase.from('catalog_variants').delete().eq('product_id', productId)
    if (delErr) {
      console.error(`catalog_variants delete failed ${p.slug}:`, delErr.message)
      continue
    }

    const sortedVariants = [...p.variants.entries()].sort((a, b) => a[0] - b[0] || a[1].sort - b[1].sort)

    /** @type {{ product_id: string, design_code: number, sort_order: number, pricing: object, dxf_storage_path: string | null }[]} */
    const variantRows = []
    for (let i = 0; i < sortedVariants.length; i++) {
      const [design_code, v] = sortedVariants[i]
      const dxfStoragePath = `${p.slug}/dc${design_code}.dxf`
      let dxfPathForRow = null
      if (existsSync(v.dxfAbsPath)) {
        const dxfBuf = readFileSync(v.dxfAbsPath)
        const { error: dxfErr } = await supabase.storage.from('product-dxf').upload(dxfStoragePath, dxfBuf, {
          contentType: 'application/dxf',
          upsert: true,
        })
        if (dxfErr) {
          console.error(`DXF upload failed ${p.slug} dc${design_code}:`, dxfErr.message)
        } else {
          dxfPathForRow = dxfStoragePath
        }
      } else {
        console.warn(`DXF missing on disk, skip upload: ${v.dxfAbsPath}`)
      }
      variantRows.push({
        product_id: productId,
        design_code,
        sort_order: i,
        pricing: v.pricing,
        dxf_storage_path: dxfPathForRow,
      })
    }

    const { error: insErr } = await supabase.from('catalog_variants').insert(variantRows)
    if (insErr) {
      console.error(`catalog_variants insert failed ${p.slug}:`, insErr.message)
      continue
    }

    console.log(`OK ${p.slug} (${variantRows.length} variants)`)
  }

  if (dryRun) console.log('Dry run complete. Unset DRY_RUN to write to Supabase.')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
