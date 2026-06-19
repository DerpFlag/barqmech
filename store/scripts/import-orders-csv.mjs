/**
 * Import historical orders from Media/orders.csv into Supabase (new project).
 * Rewrites old Storage image URLs in lines JSON to the current SUPABASE_URL host.
 *
 * Usage:
 *   KEYS_FILE=../../Media/keys_new.txt node scripts/import-orders-csv.mjs
 */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parse } from 'csv-parse/sync'
import { createClient } from '@supabase/supabase-js'
import { loadSupabaseServiceEnvFromKeysFile, resolveKeysFilePath } from './load-keys-env.mjs'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const csvPath = resolve(__dirname, '../../Media/orders.csv')
const OLD_HOST = process.env.OLD_SUPABASE_HOST || 'ajaugjszvbsdxicswfwx.supabase.co'

const env = loadSupabaseServiceEnvFromKeysFile()
const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
})
const newHost = new URL(env.SUPABASE_URL).host

function rewriteLines(raw) {
  const text = String(raw || '').trim()
  if (!text) return []
  const parsed = JSON.parse(text.replaceAll(OLD_HOST, newHost))
  return parsed
}

async function main() {
  let buf = readFileSync(csvPath, 'utf8')
  if (buf.charCodeAt(0) === 0xfeff) buf = buf.slice(1)
  const rows = parse(buf, { columns: true, skip_empty_lines: true, trim: true })
  console.log(`Importing ${rows.length} orders from ${csvPath}`)
  console.log(`Keys: ${resolveKeysFilePath()}`)
  console.log(`URL rewrite: ${OLD_HOST} -> ${newHost}`)

  let ok = 0
  for (const row of rows) {
    const payload = {
      id: row.id,
      order_code: row.order_code,
      customer_name: row.customer_name,
      customer_email: row.customer_email,
      customer_phone: row.customer_phone,
      address_line1: row.address_line1,
      city: row.city || null,
      notes: row.notes || null,
      lines: rewriteLines(row.lines),
      subtotal_pkr: Number(row.subtotal_pkr),
      shipping_pkr: Number(row.shipping_pkr),
      grand_total_pkr: Number(row.grand_total_pkr),
      payment_method: row.payment_method || 'cod',
      created_at: row.created_at,
      order_completed: row.order_completed === 'true' || row.order_completed === 't',
      order_completed_at: row.order_completed_at || null,
    }

    const { error } = await supabase.from('orders').upsert(payload, { onConflict: 'id' })
    if (error) {
      console.error(`Order ${row.order_code}:`, error.message)
      continue
    }
    ok++
  }
  console.log(`Done. Upserted ${ok}/${rows.length} orders.`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
