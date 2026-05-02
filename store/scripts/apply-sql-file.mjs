import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import pg from 'pg'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const storeRoot = path.resolve(__dirname, '..')
const keysPath = path.resolve(storeRoot, '..', 'Media', 'Keys.txt')
const sqlRel = process.argv[2] || 'supabase/migrations/002_orders_rls_public_insert.sql'
const sqlPath = path.resolve(storeRoot, sqlRel)

const raw = fs.readFileSync(keysPath, 'utf8')
const m = raw.match(/postgresql:\/\/[^\s]+/)
if (!m) process.exit(1)

const client = new pg.Client({ connectionString: m[0], ssl: { rejectUnauthorized: false } })
await client.connect()
try {
  await client.query(fs.readFileSync(sqlPath, 'utf8'))
  console.log('Applied:', sqlPath)
} finally {
  await client.end()
}
