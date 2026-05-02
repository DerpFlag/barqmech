import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import pg from 'pg'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const raw = fs.readFileSync(path.resolve(__dirname, '..', '..', 'Media', 'Keys.txt'), 'utf8')
const m = raw.match(/postgresql:\/\/[^\s]+/)
const c = new pg.Client({ connectionString: m[0], ssl: { rejectUnauthorized: false } })
await c.connect()
const r = await c.query(`
  select polname, polcmd::text, polroles, polpermissive, pg_get_expr(polqual, polrelid) as using_expr,
         pg_get_expr(polwithcheck, polrelid) as with_check
  from pg_policy
  join pg_class on pg_policy.polrelid = pg_class.oid
  where relname = 'orders'
`)
console.log('policies', r.rows)
const rel = await c.query(`select relname, relrowsecurity from pg_class where relname = 'orders'`)
console.log('table', rel.rows)
await c.end()
