/**
 * One-off: apply `supabase/migrations/001_orders.sql` using the Postgres URL
 * from repo root `Media/Keys.txt` (local dev only; do not commit secrets).
 * Usage: node scripts/apply-orders-migration.mjs
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import pg from 'pg'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const storeRoot = path.resolve(__dirname, '..')
const keysPath = path.resolve(storeRoot, '..', 'Media', 'Keys.txt')
const sqlPath = path.resolve(storeRoot, 'supabase', 'migrations', '001_orders.sql')

const raw = fs.readFileSync(keysPath, 'utf8')
const m = raw.match(/postgresql:\/\/[^\s]+/)
if (!m) {
  console.error('No postgresql:// URL found in Media/Keys.txt')
  process.exit(1)
}
const connectionString = m[0]

const sql = fs.readFileSync(sqlPath, 'utf8')
const client = new pg.Client({
  connectionString,
  ssl: { rejectUnauthorized: false },
})
await client.connect()
try {
  await client.query(sql)
  console.log('Migration applied.')
} finally {
  await client.end()
}
