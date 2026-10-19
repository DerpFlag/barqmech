import { randomInt } from 'node:crypto'
import { escapeHtml, emailShell } from '../shared/email-brand.mjs'
import { shippingAllocation } from '../../CodeShinobi/barqmech-store-v3/scripts/shipping.mjs'
function formatPkr(n) {
  return `Rs. ${Math.round(n).toLocaleString()}`
}

/** Six-digit string, uniform in [100000, 999999]. */
function randomSixDigit() {
  return String(randomInt(100000, 1000000))
}

function absoluteAssetUrl(href, siteBase) {
  if (!href) return ''
  const s = emailSafeImageUrl(href)
  if (s.startsWith('http://') || s.startsWith('https://')) return s
  if (!siteBase) return s
  return siteBase + (s.startsWith('/') ? s : `/${s}`)
}

/** Emails must not use Vercel `/_vercel/image` URLs — use the underlying Supabase public URL. */
function emailSafeImageUrl(href) {
  const s = String(href || '').trim()
  if (!s.includes('/_vercel/image')) return s
  const m = s.match(/[?&]url=([^&]+)/i)
  if (!m) return s
  try {
    return decodeURIComponent(m[1])
  } catch {
    return s
  }
}

function normalizeEmail(s) {
  return String(s || '').trim().toLowerCase()
}

/** Resend test sender: only ORDER_NOTIFY_EMAIL (account inbox) is allowed as recipient. */
function isResendTestSender(fromEmail) {
  return normalizeEmail(fromEmail).includes('@resend.dev')
}

function canResendReachCustomer(customerEmail, fromEmail, notifyEmail) {
  if (!isResendTestSender(fromEmail)) return true
  return normalizeEmail(customerEmail) === normalizeEmail(notifyEmail)
}

function productPageUrl(line, siteBase) {
  if (!siteBase || !line.slug || !line.categorySlug) return ''
  return `${siteBase}/products/${encodeURIComponent(line.categorySlug)}/${encodeURIComponent(line.slug)}`
}

/**
 * Compact line snapshot for `orders.lines` (JSON array): stable keys, one product URL,
 * no nulls / duplicate link fields — easier for DB, admin, and reporting.
 */
function buildPersistedLines(lines, orderId, siteBase) {
  const shipping = shippingAllocation(Array.isArray(lines) ? lines : [])
  return (Array.isArray(lines) ? lines : []).map((l, idx) => {
    const qty = Math.min(999, Math.max(1, Math.round(Number(l.quantity))))
    const unit = Math.round(Number(l.unitPrice))
    const pid = l.productId != null ? String(l.productId).trim() : ''
    const designCodeResolved =
      pid && (l.designCode != null && Number.isFinite(Number(l.designCode)))
        ? Math.round(Number(l.designCode))
        : pid
          ? 0
          : null
    const productUrl =
      productPageUrl(l, siteBase) || String(l.productUrl || l.product_url || '').trim() || ''
    const line = {
      id: `${orderId}-${idx}`,
      sort_index: idx,
      slug: String(l.slug || ''),
      category_slug: String(l.categorySlug || ''),
      product_url: productUrl,
      title: String(l.title || ''),
      image_url: absoluteAssetUrl(l.imageUrl, siteBase) || String(l.imageUrl || '').trim() || '',
      size: String(l.size || ''),
      finish: String(l.finish || ''),
      design_code: designCodeResolved,
      wooden_frame: Boolean(l.woodenFrame),
      led_backlight: Boolean(l.ledBacklight),
      installation: Boolean(l.installation),
      quantity: qty,
      unit_price_pkr: unit,
      line_subtotal_pkr: unit * qty,
      shipping_line_pkr: shipping[idx],
    }
    if (pid) line.product_id = pid
    const mk = l.mergeKey != null ? String(l.mergeKey).trim() : ''
    if (mk) line.merge_key = mk
    const dxfPath = String(l.dxf_storage_path || '').trim()
    if (dxfPath) line.dxf_storage_path = dxfPath
    if (line.design_code == null) delete line.design_code
    return line
  })
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
function renderLineItemBlock(l, siteBase, { includeDxf = true } = {}) {
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
              ${
                l.designCode != null && Number(l.designCode) > 0
                  ? `<strong style="color:#334155;">Design code:</strong> ${escapeHtml(String(l.designCode))}<br/>`
                  : ''
              }
              <strong style="color:#334155;">Finish:</strong> ${escapeHtml(l.finish)}<br/>
              ${
                includeDxf && l.dxfManual
                  ? '<strong style="color:#334155;">DXF: Supply manually for this Panel order.</strong><br/>'
                  : includeDxf && l.dxfSignedUrl
                  ? `<strong style="color:#334155;">DXF file:</strong> <a href="${escapeHtml(l.dxfSignedUrl)}" style="color:#1d4ed8;font-size:13px;font-family:Arial,Helvetica,sans-serif;text-decoration:underline;">Download (CAD)</a> <span style="color:#94a3b8;font-size:12px;">· link expires in 14 days</span><br/>`
                  : includeDxf ? '<strong style="color:#9a3412;">DXF download unavailable — review this design in the admin before manufacturing.</strong><br/>' : ''
              }
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
  const itemsHtml = lines.map((l) => renderLineItemBlock(l, siteBase, { includeDxf: false })).join('')

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


export { buildCustomerEmailHtml,buildMerchantEmailHtml,buildPersistedLines,greetingFirstName }
