/**
 * Compare old vs new prices_summary CSV (row count, columns, pricing diffs).
 * Usage: node store/scripts/compare-prices-csv.mjs
 */
import { parse } from 'csv-parse/sync'
import { readFileSync, existsSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const REPO_ROOT = resolve(__dirname, '../..')
const oldPath = join(REPO_ROOT, 'Media', 'Finalized', 'prices_summary_old.csv')
const newPath = join(REPO_ROOT, 'Media', 'Finalized', 'prices_summary.csv')

function readCsv(path) {
  let buf = readFileSync(path, 'utf8')
  if (buf.charCodeAt(0) === 0xfeff) buf = buf.slice(1)
  return parse(buf, { columns: true, skip_empty_lines: true, trim: true })
}

const priceCols = [
  'size1_total_price_silver_usd',
  'size1_total_price_golden_usd',
  'size1_total_price_black_usd',
  'size2_total_price_silver_usd',
  'size2_total_price_golden_usd',
  'size2_total_price_black_usd',
  'size3_total_price_silver_usd',
  'size3_total_price_golden_usd',
  'size3_total_price_black_usd',
]
const feasibleCols = ['size1_feasible', 'size2_feasible', 'size3_feasible']

function normFile(row) {
  return String(row.file || '').trim().toLowerCase()
}

function rowSig(row) {
  return priceCols.map((c) => String(row[c] ?? '').trim()).join('|')
}

if (!existsSync(oldPath) || !existsSync(newPath)) {
  console.error('Missing CSV:', { oldPath, newPath })
  process.exit(1)
}

const oldRows = readCsv(oldPath)
const newRows = readCsv(newPath)
const oldCols = Object.keys(oldRows[0] || {})
const newCols = Object.keys(newRows[0] || {})

console.log('Old rows:', oldRows.length)
console.log('New rows:', newRows.length)
console.log('New columns vs old:', newCols.filter((c) => !oldCols.includes(c)).join(', ') || '(none)')
console.log('Removed columns:', oldCols.filter((c) => !newCols.includes(c)).join(', ') || '(none)')

const oldByFile = new Map(oldRows.map((r) => [normFile(r), r]))
const newByFile = new Map(newRows.map((r) => [normFile(r), r]))

let priceDiffs = 0
let feasibleNonZero = 0
const sampleDiffs = []

for (const [file, newRow] of newByFile) {
  if (!file) continue
  for (const c of feasibleCols) {
    if (Number(String(newRow[c] ?? '1').replace(/,/g, '')) === 0) feasibleNonZero++
  }
  const oldRow = oldByFile.get(file)
  if (!oldRow) continue
  if (rowSig(oldRow) !== rowSig(newRow)) {
    priceDiffs++
    if (sampleDiffs.length < 5) {
      sampleDiffs.push({ file: newRow.file, old: rowSig(oldRow), new: rowSig(newRow) })
    }
  }
}

const onlyOld = [...oldByFile.keys()].filter((f) => f && !newByFile.has(f)).length
const onlyNew = [...newByFile.keys()].filter((f) => f && !oldByFile.has(f)).length

console.log('Rows with pricing changes:', priceDiffs)
console.log('Rows only in old:', onlyOld)
console.log('Rows only in new:', onlyNew)
console.log('Infeasible size flags (0) in new CSV:', feasibleNonZero)
if (sampleDiffs.length) {
  console.log('Sample pricing diffs:')
  for (const s of sampleDiffs) console.log(' ', s.file)
}
