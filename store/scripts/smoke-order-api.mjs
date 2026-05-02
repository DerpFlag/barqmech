/**
 * Smoke test: insert one order row + send one Resend email (uses Media/Keys.txt).
 * Usage: node scripts/smoke-order-api.mjs
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const keysPath = path.resolve(__dirname, '..', '..', 'Media', 'Keys.txt')
const raw = fs.readFileSync(keysPath, 'utf8')

const urlMatch = raw.match(/https:\/\/[a-z0-9-]+\.supabase\.co/)
const keyMatch = raw.match(/sb_publishable_[^\s]+/) || raw.match(/eyJ[a-zA-Z0-9._-]+/)
const resendMatch = raw.match(/re_[A-Za-z0-9_]+/)

if (!urlMatch || !keyMatch || !resendMatch) {
  console.error('Could not parse Supabase URL, key, or Resend key from Keys.txt')
  process.exit(1)
}

const supabaseUrl = urlMatch[0]
const supabaseKey = keyMatch[0]
const resendKey = resendMatch[0]

const supabase = createClient(supabaseUrl, supabaseKey)
const resend = new Resend(resendKey)

const orderCode = String(Math.floor(100000 + Math.random() * 900000))
const row = {
  order_code: orderCode,
  customer_name: 'Smoke Test',
  customer_email: 'derpflag@gmail.com',
  customer_phone: '+000',
  address_line1: '1 Test Lane',
  city: null,
  notes: 'smoke-order-api.mjs',
  lines: [{ title: 'Test panel', size: '12 × 12 in', finish: 'Matte', quantity: 1, unitPrice: 1000, woodenFrame: false, ledBacklight: false, installation: false }],
  subtotal_pkr: 1000,
  shipping_pkr: 800,
  grand_total_pkr: 1800,
  payment_method: 'cod',
}

const { error } = await supabase.from('orders').insert(row)
if (error) {
  console.error('Supabase insert failed:', error.message, error)
  process.exit(1)
}
console.log('Supabase OK: inserted order_code', orderCode)

const send = await resend.emails.send({
  from: 'onboarding@resend.dev',
  to: 'derpflag@gmail.com',
  subject: `BarqMech smoke test ${orderCode}`,
  html: `<p>Smoke test order ${orderCode} inserted.</p>`,
})
if (send.error) {
  console.error('Resend failed:', send.error)
  process.exit(1)
}
console.log('Resend OK:', send.data)
