import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import { randomInt } from 'node:crypto'
import { validateWithZeroBounce } from './lib/zero-bounce.mjs'

const SIZE_SHIPPING = {
  '12 × 12 in': 800,
  '18 × 18 in': 1200,
  '24 × 24 in': 1800,
}

function shippingForLine(line) {
  const u = SIZE_SHIPPING[line.size]
  if (typeof u === 'number') return u * line.quantity
  if (String(line.size).startsWith('12')) return 800 * line.quantity
  if (String(line.size).startsWith('18')) return 1200 * line.quantity
  if (String(line.size).startsWith('24')) return 1800 * line.quantity
  return 1000 * line.quantity
}

function recomputeTotals(lines) {
  const subtotal = lines.reduce((s, l) => s + Number(l.unitPrice) * Number(l.quantity), 0)
  const shipping = lines.reduce((s, l) => s + shippingForLine(l), 0)
  return { subtotal: Math.round(subtotal), shipping: Math.round(shipping), grand: Math.round(subtotal + shipping) }
}

function formatPkr(n) {
  return `Rs. ${Math.round(n).toLocaleString()}`
}

/** Six-digit string, uniform in [100000, 999999]. */
function randomSixDigit() {
  return String(randomInt(100000, 1000000))
}

function emailRegexOk(email) {
  const e = String(email).trim()
  return /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]{2,})+$/.test(e) && !e.includes('..')
}

function sendJson(res, statusCode, obj) {
  res.statusCode = statusCode
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.end(JSON.stringify(obj))
}

async function readJsonBody(req) {
  if (req.body != null && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) {
    return req.body
  }
  if (typeof req.body === 'string' && req.body.length) {
    return JSON.parse(req.body)
  }
  const chunks = []
  for await (const chunk of req) chunks.push(chunk)
  const raw = Buffer.concat(chunks).toString('utf8')
  if (!raw) return {}
  return JSON.parse(raw)
}

export default async function handler(req, res) {
  const origin = process.env.ALLOWED_ORIGIN || '*'
  res.setHeader('Access-Control-Allow-Origin', origin)
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    res.statusCode = 204
    return res.end()
  }

  if (req.method !== 'POST') {
    return sendJson(res, 405, { error: 'Method not allowed' })
  }

  const supabaseUrl = process.env.SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_ANON_KEY
  const resendKey = process.env.RESEND_API_KEY
  const fromEmail = process.env.ORDER_FROM_EMAIL || 'onboarding@resend.dev'
  const notifyEmail = process.env.ORDER_NOTIFY_EMAIL || 'derpflag@gmail.com'

  if (!supabaseUrl || !supabaseKey || !resendKey) {
    return sendJson(res, 500, { error: 'Server missing SUPABASE_URL, SUPABASE_ANON_KEY, or RESEND_API_KEY' })
  }

  let body
  try {
    body = await readJsonBody(req)
  } catch {
    return sendJson(res, 400, { error: 'Invalid JSON' })
  }

  const { customer, lines } = body
  if (!customer || !Array.isArray(lines) || lines.length === 0) {
    return sendJson(res, 400, { error: 'Missing customer or lines' })
  }

  const name = String(customer.name || '').trim()
  const email = String(customer.email || '').trim()
  const phone = String(customer.phone || '').trim()
  const addressLine1 = String(customer.addressLine1 || '').trim()
  const city = String(customer.city || '').trim()
  const notes = String(customer.notes || '').trim()

  if (!name || !phone || !addressLine1 || !emailRegexOk(email)) {
    return sendJson(res, 400, { error: 'Invalid customer details' })
  }

  try {
    const zb = await validateWithZeroBounce(email)
    if (!zb.ok) {
      const st = zb.code === 429 ? 429 : 400
      return sendJson(res, st, { error: zb.reason })
    }
  } catch (e) {
    console.error('[place-order] ZeroBounce', e)
    return sendJson(res, 500, { error: 'Email validation service is unavailable. Please try again.' })
  }

  const { subtotal, shipping, grand } = recomputeTotals(lines)
  const clientSubtotal = Number(body.subtotal)
  const clientShip = Number(body.shippingTotal)
  const clientGrand = Number(body.grandTotal)
  if (
    Math.abs(clientSubtotal - subtotal) > 2 ||
    Math.abs(clientShip - shipping) > 2 ||
    Math.abs(clientGrand - grand) > 2
  ) {
    return sendJson(res, 400, { error: 'Totals mismatch — refresh and try again' })
  }

  const supabase = createClient(supabaseUrl, supabaseKey)
  const resend = new Resend(resendKey)

  let orderCode = null
  let inserted = null

  for (let attempt = 0; attempt < 12; attempt++) {
    orderCode = randomSixDigit()
    const row = {
      order_code: orderCode,
      customer_name: name,
      customer_email: email,
      customer_phone: phone,
      address_line1: addressLine1,
      city: city || null,
      notes: notes || null,
      lines,
      subtotal_pkr: subtotal,
      shipping_pkr: shipping,
      grand_total_pkr: grand,
      payment_method: 'cod',
    }

    // Do not chain `.select()` — RLS has no SELECT policy; PostgREST would reject the read-back.
    const { error } = await supabase.from('orders').insert(row)

    if (!error) {
      inserted = { order_code: orderCode }
      break
    }
    if (error?.code === '23505') continue
    console.error('Supabase insert error', error)
    return sendJson(res, 500, { error: error?.message || 'Database error' })
  }

  if (!inserted) {
    return sendJson(res, 500, { error: 'Could not allocate order code' })
  }

  const linesHtml = lines
    .map(
      (l, i) => `
      <tr>
        <td style="padding:8px;border:1px solid #ddd;">${i + 1}</td>
        <td style="padding:8px;border:1px solid #ddd;">${escapeHtml(l.title)}</td>
        <td style="padding:8px;border:1px solid #ddd;">${escapeHtml(l.size)} / ${escapeHtml(l.finish)}</td>
        <td style="padding:8px;border:1px solid #ddd;">${l.quantity}</td>
        <td style="padding:8px;border:1px solid #ddd;">${formatPkr(Number(l.unitPrice) * Number(l.quantity))}</td>
      </tr>`
    )
    .join('')

  const htmlCustomer = `
    <p>Hi ${escapeHtml(name)},</p>
    <p>Thank you for your order. Your order code is:</p>
    <p style="font-size:28px;font-weight:bold;letter-spacing:4px;">${orderCode}</p>
    <p><strong>Total (COD):</strong> ${formatPkr(grand)} (includes shipping ${formatPkr(shipping)})</p>
    <p>We will contact you to confirm delivery details.</p>
    <table style="border-collapse:collapse;width:100%;max-width:560px;margin-top:16px;">
      <thead><tr><th style="padding:8px;border:1px solid #ddd;">#</th><th style="padding:8px;border:1px solid #ddd;">Product</th><th style="padding:8px;border:1px solid #ddd;">Size / Finish</th><th style="padding:8px;border:1px solid #ddd;">Qty</th><th style="padding:8px;border:1px solid #ddd;">Line</th></tr></thead>
      <tbody>${linesHtml}</tbody>
    </table>
    <p style="margin-top:16px;font-size:13px;color:#555;">BarqMech</p>
  `

  const htmlMerchant = `
    <p><strong>New order ${orderCode}</strong></p>
    <p>${escapeHtml(name)} · ${escapeHtml(email)} · ${escapeHtml(phone)}</p>
    <p>${escapeHtml(addressLine1)}${city ? `, ${escapeHtml(city)}` : ''}</p>
    ${notes ? `<p>Notes: ${escapeHtml(notes)}</p>` : ''}
    <p>Subtotal ${formatPkr(subtotal)} · Shipping ${formatPkr(shipping)} · <strong>Total ${formatPkr(grand)}</strong></p>
    <table style="border-collapse:collapse;width:100%;max-width:640px;">
      <thead><tr><th style="padding:8px;border:1px solid #ddd;">#</th><th style="padding:8px;border:1px solid #ddd;">Product</th><th style="padding:8px;border:1px solid #ddd;">Options</th><th style="padding:8px;border:1px solid #ddd;">Qty</th><th style="padding:8px;border:1px solid #ddd;">Line</th></tr></thead>
      <tbody>${lines
        .map(
          (l, i) => `
        <tr>
          <td style="padding:8px;border:1px solid #ddd;">${i + 1}</td>
          <td style="padding:8px;border:1px solid #ddd;">${escapeHtml(l.title)}</td>
          <td style="padding:8px;border:1px solid #ddd;">${escapeHtml(l.size)}, ${escapeHtml(l.finish)}, W:${l.woodenFrame ? 'Y' : 'N'} L:${l.ledBacklight ? 'Y' : 'N'} I:${l.installation ? 'Y' : 'N'}</td>
          <td style="padding:8px;border:1px solid #ddd;">${l.quantity}</td>
          <td style="padding:8px;border:1px solid #ddd;">${formatPkr(Number(l.unitPrice) * Number(l.quantity))}</td>
        </tr>`
        )
        .join('')}</tbody>
    </table>
  `

  try {
    const [toCustomer, toMerchant] = await Promise.all([
      resend.emails.send({
        from: fromEmail,
        to: email,
        subject: `BarqMech order ${orderCode} — thank you`,
        html: htmlCustomer,
      }),
      resend.emails.send({
        from: fromEmail,
        to: notifyEmail,
        subject: `New BarqMech order ${orderCode}`,
        html: htmlMerchant,
      }),
    ])

    if (toCustomer.error) console.error('Resend customer', toCustomer.error)
    if (toMerchant.error) console.error('Resend merchant', toMerchant.error)
    if (toCustomer.error || toMerchant.error) {
      return sendJson(res, 502, {
        error: 'Order saved but email failed',
        orderCode,
        emailErrors: { customer: toCustomer.error?.message, merchant: toMerchant.error?.message },
      })
    }
  } catch (e) {
    console.error(e)
    return sendJson(res, 502, { error: 'Order saved but email failed', orderCode })
  }

  return sendJson(res, 200, { orderCode })
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
