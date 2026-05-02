import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import { randomInt, randomUUID } from 'node:crypto'
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

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/** Prefer browser origin from checkout so /assets/… image URLs work in email; else env / Vercel. */
function resolveSiteBaseUrl(body) {
  const raw = body && typeof body.origin === 'string' ? body.origin.trim().replace(/\/$/, '') : ''
  if (raw && /^https:\/\//i.test(raw)) return raw
  if (raw && /^http:\/\/localhost(:\d+)?$/i.test(raw)) return raw
  const explicit = (process.env.PUBLIC_SITE_URL || '').trim().replace(/\/$/, '')
  if (explicit) return explicit
  const v = process.env.VERCEL_URL
  if (v) return `https://${String(v).replace(/^https?:\/\//, '')}`
  return ''
}

function absoluteAssetUrl(href, siteBase) {
  if (!href) return ''
  const s = String(href)
  if (s.startsWith('http://') || s.startsWith('https://')) return s
  if (!siteBase) return s
  return siteBase + (s.startsWith('/') ? s : `/${s}`)
}

function productPageUrl(line, siteBase) {
  if (!siteBase || !line.slug || !line.categorySlug) return ''
  return `${siteBase}/products/${encodeURIComponent(line.categorySlug)}/${encodeURIComponent(line.slug)}`
}

function greetingFirstName(fullName) {
  const first = String(fullName || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)[0]
  if (!first) return 'there'
  return first.charAt(0).toUpperCase() + first.slice(1).toLowerCase()
}

function formatAddonsReadable(line) {
  const frame = line.woodenFrame ? 'Wooden frame' : 'Standard (no wooden frame)'
  const led = line.ledBacklight ? 'LED backlight included' : 'No LED backlight'
  const inst = line.installation ? 'Installation service included' : 'No installation service'
  return { frame, led, inst }
}

function telHref(phone) {
  const t = String(phone || '').replace(/[^\d+]/g, '')
  return t ? `tel:${t}` : '#'
}

function storeHostnameForCopy(siteBase) {
  try {
    if (!siteBase) return ''
    return new URL(siteBase).hostname.replace(/^www\./, '')
  } catch {
    return ''
  }
}

/** One line item row: thumbnail, copy, link, add-ons, qty & line total. */
function renderLineItemBlock(l, siteBase) {
  const img = absoluteAssetUrl(l.imageUrl, siteBase)
  const pUrl = productPageUrl(l, siteBase)
  const add = formatAddonsReadable(l)
  const lineTotal = formatPkr(Number(l.unitPrice) * Number(l.quantity))
  const host = storeHostnameForCopy(siteBase)
  const imgCell = img
    ? `<img src="${escapeHtml(img)}" alt="${escapeHtml(l.title)}" width="120" style="width:120px;max-width:120px;height:auto;border-radius:8px;border:1px solid #e2e8f0;display:block;background:#f8fafc;" />`
    : `<div style="width:120px;height:90px;background:#f1f5f9;border-radius:8px;border:1px solid #e2e8f0;"></div>`
  const linkHtml = pUrl
    ? `<a href="${escapeHtml(pUrl)}" style="color:#1d4ed8;font-size:13px;font-family:Arial,Helvetica,sans-serif;text-decoration:underline;">View product${host ? ` on ${escapeHtml(host)}` : ''} →</a>`
    : ''

  return `
  <tr>
    <td style="padding:22px 0;border-bottom:1px solid #e8eef3;">
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <td width="132" valign="top" style="padding-right:18px;">${imgCell}</td>
          <td valign="top" style="font-family:Arial,Helvetica,sans-serif;">
            <div style="font-size:16px;font-weight:700;color:#0f172a;line-height:1.35;">${escapeHtml(l.title)}</div>
            <div style="font-size:13px;color:#475569;margin-top:10px;line-height:1.65;">
              <strong style="color:#334155;">Size:</strong> ${escapeHtml(l.size)}<br/>
              <strong style="color:#334155;">Finish:</strong> ${escapeHtml(l.finish)}<br/>
              <strong style="color:#334155;">Add-ons:</strong> ${escapeHtml(add.frame)} · ${escapeHtml(add.led)} · ${escapeHtml(add.inst)}
            </div>
            ${linkHtml ? `<div style="margin-top:10px;">${linkHtml}</div>` : ''}
            <div style="margin-top:14px;font-size:13px;color:#1e293b;">
              <strong>Quantity:</strong> ${Number(l.quantity)} &nbsp;&nbsp;|&nbsp;&nbsp; <strong>Line total:</strong> ${lineTotal}
            </div>
          </td>
        </tr>
      </table>
    </td>
  </tr>`
}

function emailFooterBlock(siteBase) {
  const logoSrc = siteBase ? `${siteBase}/barqmech-email-logo.png` : ''
  const logoHtml = logoSrc
    ? `<img src="${escapeHtml(logoSrc)}" alt="BarqMech" width="240" style="max-width:240px;width:100%;height:auto;display:block;margin:16px auto 0;border:0;" />`
    : ''
  return `
  <tr>
    <td style="padding:30px 28px;background:#f0f4f9;border-top:1px solid #d5dee8;text-align:center;">
      <div style="font-size:11px;letter-spacing:0.34em;color:#1e3a5f;font-family:Arial,Helvetica,sans-serif;font-weight:700;">BARQMECH</div>
      ${logoHtml}
      <p style="margin:18px 0 0;font-size:12px;color:#64748b;font-family:Arial,Helvetica,sans-serif;line-height:1.7;max-width:420px;margin-left:auto;margin-right:auto;">
        Precision laser cutting &amp; custom metal fabrication for architecture, décor, and lighting.<br/>
        <span style="color:#94a3b8;font-size:11px;">© ${new Date().getFullYear()} BarqMech. All rights reserved.</span>
      </p>
    </td>
  </tr>`
}

function emailShell(heroSubtitle, innerTdHtml, siteBase) {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><meta http-equiv="X-UA-Compatible" content="IE=edge"/></head>
<body style="margin:0;padding:0;background:#dfe7f0;-webkit-text-size-adjust:100%;">
<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#dfe7f0;padding:32px 16px;">
<tr><td align="center">
<table role="presentation" cellpadding="0" cellspacing="0" width="600" style="width:100%;max-width:600px;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #c5d0dc;box-shadow:0 8px 32px rgba(15,23,42,0.06);">
<tr>
  <td style="background:#152b45;padding:28px 28px 26px;text-align:center;">
    <div style="font-size:11px;letter-spacing:0.38em;color:#ffffff;font-family:Arial,Helvetica,sans-serif;font-weight:700;">BARQMECH</div>
    <div style="font-size:14px;color:#a8c9e8;margin-top:12px;font-family:Arial,Helvetica,sans-serif;line-height:1.45;font-weight:400;">${escapeHtml(heroSubtitle)}</div>
  </td>
</tr>
${innerTdHtml}
${emailFooterBlock(siteBase)}
</table>
</td></tr>
</table>
</body>
</html>`
}

function totalsTable(subtotal, shipping, grand) {
  return `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:8px;border-collapse:collapse;font-family:Arial,Helvetica,sans-serif;">
  <tr>
    <td style="padding:12px 0;font-size:14px;color:#475569;border-top:2px solid #cbd5e1;">Subtotal (items)</td>
    <td align="right" style="padding:12px 0;font-size:14px;color:#0f172a;border-top:2px solid #cbd5e1;">${formatPkr(subtotal)}</td>
  </tr>
  <tr>
    <td style="padding:10px 0;font-size:14px;color:#475569;">Shipping (size-based)</td>
    <td align="right" style="padding:10px 0;font-size:14px;color:#0f172a;">${formatPkr(shipping)}</td>
  </tr>
  <tr>
    <td style="padding:14px 0 6px;font-size:17px;font-weight:800;color:#0f172a;">Total — cash on delivery</td>
    <td align="right" style="padding:14px 0 6px;font-size:17px;font-weight:800;color:#152b45;">${formatPkr(grand)}</td>
  </tr>
</table>`
}

function buildCustomerEmailHtml(ctx) {
  const { greetingName, orderCode, grand, shipping, subtotal, lines, customer, siteBase } = ctx
  const { name, email, phone, addressLine1, city, notes } = customer
  const addressBlock = [addressLine1, city].filter(Boolean).join(', ')
  const itemsHtml = lines.map((l) => renderLineItemBlock(l, siteBase)).join('')

  const inner = `
<tr>
  <td style="padding:32px 28px 36px;font-family:Arial,Helvetica,sans-serif;">
    <p style="margin:0 0 6px;font-size:20px;font-weight:700;color:#0f172a;letter-spacing:-0.02em;">Thank you for your order</p>
    <p style="margin:0 0 22px;font-size:15px;color:#475569;line-height:1.65;">
      Hi ${escapeHtml(greetingName)}, we’ve received your order and our team will begin processing it shortly.
      If we need to clarify anything, we’ll contact you at <a href="${escapeHtml(telHref(phone))}" style="color:#1d4ed8;text-decoration:none;font-weight:600;">${escapeHtml(phone)}</a>
      or reply to this message.
    </p>

    <table role="presentation" width="100%" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;margin-bottom:22px;">
      <tr>
        <td style="padding:22px 24px;text-align:center;">
          <div style="font-size:10px;letter-spacing:0.14em;color:#64748b;text-transform:uppercase;font-weight:700;font-family:Arial,Helvetica,sans-serif;">Your order code</div>
          <div style="font-size:32px;font-weight:800;letter-spacing:8px;color:#152b45;font-family:Georgia,'Times New Roman',serif;margin-top:8px;line-height:1.2;">${orderCode}</div>
          <div style="font-size:12px;color:#64748b;margin-top:10px;font-family:Arial,Helvetica,sans-serif;">Reference this code in any follow-up with BarqMech.</div>
        </td>
      </tr>
    </table>

    <table role="presentation" width="100%" style="background-color:#eff6ff;border:1px solid #93c5fd;border-radius:10px;margin-bottom:26px;">
      <tr>
        <td bgcolor="#eff6ff" style="padding:20px 22px;font-size:14px;color:#1e3a8a;line-height:1.65;font-family:Arial,Helvetica,sans-serif;">
          <strong style="display:block;margin-bottom:8px;font-size:12px;letter-spacing:0.1em;text-transform:uppercase;color:#1d4ed8;font-family:Arial,Helvetica,sans-serif;">Cash on delivery</strong>
          Please have <strong style="font-size:16px;color:#172554;">${formatPkr(grand)}</strong> ready when your order is delivered.
          That total covers your merchandise (<strong>${formatPkr(subtotal)}</strong>) and shipping (<strong>${formatPkr(shipping)}</strong>).
          Our logistics team will coordinate timing using the phone number on file.
        </td>
      </tr>
    </table>

    <p style="margin:0 0 10px;font-size:11px;letter-spacing:0.1em;color:#64748b;text-transform:uppercase;font-weight:700;font-family:Arial,Helvetica,sans-serif;">Delivery &amp; contact</p>
    <table role="presentation" style="margin-bottom:28px;font-size:14px;color:#334155;line-height:1.75;font-family:Arial,Helvetica,sans-serif;">
      <tr><td style="padding:4px 16px 4px 0;color:#64748b;vertical-align:top;width:88px;">Name</td><td style="padding:4px 0;">${escapeHtml(name)}</td></tr>
      <tr><td style="padding:4px 16px 4px 0;color:#64748b;vertical-align:top;">Email</td><td style="padding:4px 0;"><a href="mailto:${escapeHtml(email)}" style="color:#1d4ed8;text-decoration:none;">${escapeHtml(email)}</a></td></tr>
      <tr><td style="padding:4px 16px 4px 0;color:#64748b;vertical-align:top;">Phone</td><td style="padding:4px 0;"><a href="${escapeHtml(telHref(phone))}" style="color:#1d4ed8;text-decoration:none;font-weight:600;">${escapeHtml(phone)}</a></td></tr>
      <tr><td style="padding:4px 16px 4px 0;color:#64748b;vertical-align:top;">Address</td><td style="padding:4px 0;">${escapeHtml(addressBlock)}</td></tr>
      ${notes ? `<tr><td style="padding:4px 16px 4px 0;color:#64748b;vertical-align:top;">Notes</td><td style="padding:4px 0;">${escapeHtml(notes)}</td></tr>` : ''}
    </table>

    <p style="margin:0 0 14px;font-size:11px;letter-spacing:0.1em;color:#64748b;text-transform:uppercase;font-weight:700;font-family:Arial,Helvetica,sans-serif;">Order summary</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${itemsHtml}</table>
    ${totalsTable(subtotal, shipping, grand)}
  </td>
</tr>`

  return emailShell('Order confirmation', inner, siteBase)
}

function buildMerchantEmailHtml(ctx) {
  const { orderCode, grand, shipping, subtotal, lines, customer, siteBase } = ctx
  const { name, email, phone, addressLine1, city, notes } = customer
  const addressBlock = [addressLine1, city].filter(Boolean).join(', ')
  const itemsHtml = lines.map((l) => renderLineItemBlock(l, siteBase)).join('')

  const inner = `
<tr>
  <td style="padding:32px 28px 36px;font-family:Arial,Helvetica,sans-serif;">
    <p style="margin:0 0 6px;font-size:18px;font-weight:700;color:#0f172a;">New order — action required</p>
    <p style="margin:0 0 20px;font-size:14px;color:#475569;line-height:1.6;">
      Order <strong style="color:#152b45;">#${orderCode}</strong> · COD <strong>${formatPkr(grand)}</strong>
    </p>

    <table role="presentation" width="100%" style="background:#fffbeb;border:1px solid #fcd34d;border-radius:10px;margin-bottom:24px;">
      <tr>
        <td style="padding:18px 20px;font-size:14px;color:#78350f;line-height:1.65;">
          <strong>Customer</strong><br/>
          ${escapeHtml(name)}<br/>
          <a href="mailto:${escapeHtml(email)}" style="color:#b45309;">${escapeHtml(email)}</a><br/>
          <a href="${escapeHtml(telHref(phone))}" style="color:#b45309;font-weight:600;">${escapeHtml(phone)}</a><br/>
          ${escapeHtml(addressBlock)}
          ${notes ? `<br/><br/><strong>Notes:</strong> ${escapeHtml(notes)}` : ''}
        </td>
      </tr>
    </table>

    <p style="margin:0 0 14px;font-size:11px;letter-spacing:0.1em;color:#64748b;text-transform:uppercase;font-weight:700;">Line items</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${itemsHtml}</table>
    ${totalsTable(subtotal, shipping, grand)}
  </td>
</tr>`

  return emailShell('Internal · new store order', inner, siteBase)
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
  const siteBase = resolveSiteBaseUrl(body)
  const orderId = randomUUID()

  let orderCode = null
  let inserted = null

  for (let attempt = 0; attempt < 12; attempt++) {
    orderCode = randomSixDigit()
    const row = {
      id: orderId,
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

  const lineRows = lines.map((l, idx) => {
    const qty = Math.min(999, Math.max(1, Math.round(Number(l.quantity))))
    const unit = Math.round(Number(l.unitPrice))
    return {
      order_id: orderId,
      sort_index: idx,
      product_id: l.productId != null ? String(l.productId) : '',
      merge_key: l.mergeKey != null ? String(l.mergeKey) : null,
      slug: String(l.slug || ''),
      category_slug: String(l.categorySlug || ''),
      product_url: productPageUrl(l, siteBase) || '',
      title: String(l.title || ''),
      image_url: absoluteAssetUrl(l.imageUrl, siteBase) || String(l.imageUrl || ''),
      size: String(l.size || ''),
      finish: String(l.finish || ''),
      wooden_frame: Boolean(l.woodenFrame),
      led_backlight: Boolean(l.ledBacklight),
      installation: Boolean(l.installation),
      quantity: qty,
      unit_price_pkr: unit,
      line_subtotal_pkr: unit * qty,
      shipping_line_pkr: Math.round(shippingForLine({ ...l, quantity: qty })),
    }
  })

  const { error: linesError } = await supabase.from('order_lines').insert(lineRows)
  if (linesError) {
    console.error('Supabase order_lines insert error', linesError)
    return sendJson(res, 500, {
      error:
        'Order header saved but line items failed. Apply migration 004_order_lines.sql in Supabase, or check logs.',
      orderCode,
    })
  }
  const emailCtx = {
    greetingName: greetingFirstName(name),
    orderCode,
    grand,
    shipping,
    subtotal,
    lines,
    customer: { name, email, phone, addressLine1, city, notes },
    siteBase,
  }

  const htmlCustomer = buildCustomerEmailHtml(emailCtx)
  const htmlMerchant = buildMerchantEmailHtml(emailCtx)

  try {
    const [toCustomer, toMerchant] = await Promise.all([
      resend.emails.send({
        from: fromEmail,
        to: email,
        subject: `Order confirmed — ${orderCode} · BarqMech`,
        html: htmlCustomer,
      }),
      resend.emails.send({
        from: fromEmail,
        to: notifyEmail,
        subject: `New order ${orderCode} · ${formatPkr(grand)} COD · ${name}`,
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
