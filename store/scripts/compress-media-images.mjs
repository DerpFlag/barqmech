/**
 * Compress catalog images in place (max 150 KB) and remove byte-identical-size duplicates per folder.
 *
 * Duplicate rule (per directory): group by exact file size in bytes; keep the lowest numeric
 * suffix (_1 over _2, or (1) over (2)); delete the rest.
 *
 * Usage (from store/):
 *   node scripts/compress-media-images.mjs
 *   DRY_RUN=1 node scripts/compress-media-images.mjs
 */
import { readdirSync, renameSync, statSync, unlinkSync, writeFileSync } from 'node:fs'
import { basename, extname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const REPO_ROOT = resolve(__dirname, '../..')
const TARGETS = [
  resolve(REPO_ROOT, 'Media/Finalized'),
  resolve(REPO_ROOT, 'Media/sample pics'),
]
const MAX_BYTES = 150 * 1024
const IMAGE_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp', '.tif', '.tiff', '.jfif'])
const DRY_RUN = process.env.DRY_RUN === '1'

function suffixSortKey(filename) {
  const stem = basename(filename, extname(filename))
  const underscore = stem.match(/_(\d+)$/)
  if (underscore) return [0, Number(underscore[1]), stem]
  const paren = stem.match(/\((\d+)\)$/)
  if (paren) return [1, Number(paren[1]), stem]
  return [2, 0, stem]
}

function listImagesInDir(dir) {
  const out = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isFile()) continue
    const ext = extname(entry.name).toLowerCase()
    if (!IMAGE_EXT.has(ext)) continue
    const full = join(dir, entry.name)
    out.push({ path: full, name: entry.name, size: statSync(full).size })
  }
  return out
}

function removeDuplicatesInDir(dir, stats) {
  const images = listImagesInDir(dir)
  const bySize = new Map()
  for (const img of images) {
    if (!bySize.has(img.size)) bySize.set(img.size, [])
    bySize.get(img.size).push(img)
  }

  for (const [, group] of bySize) {
    if (group.length < 2) continue
    group.sort((a, b) => {
      const ka = suffixSortKey(a.name)
      const kb = suffixSortKey(b.name)
      for (let i = 0; i < 3; i++) {
        if (ka[i] !== kb[i]) return ka[i] < kb[i] ? -1 : 1
      }
      return a.name.localeCompare(b.name)
    })
    const keep = group[0]
    for (let i = 1; i < group.length; i++) {
      const drop = group[i]
      stats.dupesRemoved++
      stats.bytesFreedDupes += drop.size
      if (DRY_RUN) {
        console.log(`[dry-run] dupe delete ${drop.name} (same ${drop.size} B as ${keep.name})`)
      } else {
        unlinkSync(drop.path)
      }
    }
  }
}

function walkDirs(root, visit) {
  visit(root)
  for (const entry of readdirSync(root, { withFileTypes: true })) {
    if (entry.isDirectory()) walkDirs(join(root, entry.name), visit)
  }
}

function collectAllImages(root, out) {
  for (const entry of readdirSync(root, { withFileTypes: true })) {
    const full = join(root, entry.name)
    if (entry.isDirectory()) collectAllImages(full, out)
    else if (IMAGE_EXT.has(extname(entry.name).toLowerCase())) out.push(full)
  }
}

async function encodeAt(filePath, ext, maxW, quality) {
  let pipeline = sharp(filePath, { animated: ext === '.gif' }).rotate()
  const meta = await sharp(filePath).metadata()
  const w = meta.width ?? maxW
  if (w > maxW) pipeline = pipeline.resize({ width: maxW, withoutEnlargement: true })

  if (ext === '.png') {
    return pipeline.png({ compressionLevel: 9, palette: true, quality, effort: 8 }).toBuffer()
  }
  if (ext === '.webp') return pipeline.webp({ quality, effort: 4 }).toBuffer()
  if (ext === '.gif') return pipeline.gif().toBuffer()
  if (ext === '.tif' || ext === '.tiff') return pipeline.tiff({ quality, compression: 'lzw' }).toBuffer()
  if (ext === '.bmp') {
    return pipeline.png({ compressionLevel: 9, palette: true, quality, effort: 8 }).toBuffer()
  }
  return pipeline.jpeg({ quality, mozjpeg: true }).toBuffer()
}

async function writeInPlace(filePath, buf) {
  const tmp = `${filePath}.compressing`
  writeFileSync(tmp, buf)
  try {
    try {
      unlinkSync(filePath)
    } catch {
      /* original missing */
    }
    renameSync(tmp, filePath)
  } catch (err) {
    try {
      unlinkSync(tmp)
    } catch {
      /* ignore */
    }
    throw err
  }
}

async function compressFile(filePath, stats) {
  const ext = extname(filePath).toLowerCase()
  const before = statSync(filePath).size
  if (before <= MAX_BYTES) {
    stats.alreadySmall++
    return
  }

  const meta = await sharp(filePath).metadata()
  const widthSteps = [meta.width ?? 2400, 1600, 1200, 960, 720, 540, 420].filter(
    (w, i, arr) => w && (i === 0 || w < arr[i - 1]),
  )

  let smallest = null

  for (const maxW of widthSteps) {
    let lo = 30
    let hi = 85
    let under = null

    while (lo <= hi) {
      const q = Math.floor((lo + hi) / 2)
      let buf
      try {
        buf = await encodeAt(filePath, ext, maxW, q)
      } catch (err) {
        stats.errors.push(`${filePath}: ${err.message}`)
        return
      }
      if (!smallest || buf.length < smallest.length) smallest = buf
      if (buf.length <= MAX_BYTES) {
        under = buf
        lo = q + 1
      } else {
        hi = q - 1
      }
    }

    if (under) {
      stats.compressed++
      stats.bytesBefore += before
      stats.bytesAfter += under.length
      if (!DRY_RUN) await writeInPlace(filePath, under)
      return
    }
  }

  if (!smallest) {
    stats.errors.push(`${filePath}: encode failed`)
    return
  }

  stats.compressed++
  stats.bytesBefore += before
  stats.bytesAfter += smallest.length
  if (smallest.length > MAX_BYTES) {
    stats.stillOver++
    console.warn(`still over 150 KB (${smallest.length} B): ${filePath}`)
  }
  if (!DRY_RUN) await writeInPlace(filePath, smallest)
}

async function main() {
  const stats = {
    dupesRemoved: 0,
    bytesFreedDupes: 0,
    alreadySmall: 0,
    compressed: 0,
    stillOver: 0,
    bytesBefore: 0,
    bytesAfter: 0,
    errors: [],
  }

  console.log(DRY_RUN ? 'DRY RUN\n' : 'Processing images…\n')

  for (const root of TARGETS) {
    console.log(`Duplicates scan: ${root}`)
    walkDirs(root, (dir) => removeDuplicatesInDir(dir, stats))
  }

  const files = []
  for (const root of TARGETS) collectAllImages(root, files)
  console.log(`\nCompressing ${files.length} images…`)

  let done = 0
  for (const filePath of files) {
    await compressFile(filePath, stats)
    done++
    if (done % 100 === 0) console.log(`  ${done}/${files.length}`)
  }

  console.log('\n=== Summary ===')
  console.log(`Duplicate files removed: ${stats.dupesRemoved} (${(stats.bytesFreedDupes / 1e6).toFixed(2)} MB freed)`)
  console.log(`Already ≤150 KB: ${stats.alreadySmall}`)
  console.log(`Compressed: ${stats.compressed}`)
  console.log(`Still over 150 KB: ${stats.stillOver}`)
  if (stats.compressed) {
    console.log(`Saved: ${(stats.bytesBefore / 1e6).toFixed(2)} MB -> ${(stats.bytesAfter / 1e6).toFixed(2)} MB`)
  }
  if (stats.errors.length) {
    console.log(`Errors (${stats.errors.length}):`)
    for (const e of stats.errors.slice(0, 15)) console.log(`  ${e}`)
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
