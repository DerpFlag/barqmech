/**
 * Apply store/supabase/migrations/*.sql in order via direct Postgres (service keys file).
 *
 * Usage:
 *   KEYS_FILE=../Media/keys_new.txt node scripts/apply-all-migrations.mjs
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import pg from 'pg'
import { loadPostgresUrlFromKeysFile, resolveKeysFilePath } from './load-keys-env.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const storeRoot = path.resolve(__dirname, '..')
const migrationsDir = path.join(storeRoot, 'supabase', 'migrations')

const ORDER = [
  '001_orders.sql',
  '002_orders_rls_public_insert.sql',
  '004_order_lines.sql',
  '005_order_completed.sql',
  '006_drop_order_lines.sql',
  '007_order_dates_product_links_view.sql',
  '008_catalog_products.sql',
  '009_catalog_variant_dxf_bucket.sql',
]

const client = new pg.Client({
  connectionString: loadPostgresUrlFromKeysFile(),
  ssl: { rejectUnauthorized: false },
})

await client.connect()
try {
  console.log(`Keys: ${resolveKeysFilePath()}`)
  for (const name of ORDER) {
    const sqlPath = path.join(migrationsDir, name)
    if (!fs.existsSync(sqlPath)) {
      console.warn(`Skip missing ${name}`)
      continue
    }
    const sql = fs.readFileSync(sqlPath, 'utf8')
    await client.query(sql)
    console.log(`Applied ${name}`)
  }
  console.log('All migrations applied.')
} finally {
  await client.end()
}
