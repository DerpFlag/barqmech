import { createClient } from '@supabase/supabase-js'
import { getAdminTokenFromReq, verifyAdminToken } from './lib/admin-auth.mjs'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function friendlyDbError(err: { message?: string; code?: string } | null) {
  const msg = String(err?.message || '')
  const code = String(err?.code || '')
  if (/order_completed|column.*does not exist|PGRST204/i.test(msg) || code === '42703') {
    return 'Supabase is missing column orders.order_completed. Open SQL Editor and run store/supabase/migrations/005_order_completed.sql from this repo.'
  }
  return msg || 'Database error'
}

function serviceSupabase() {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required for admin.')
  }
  return createClient(url, key)
}

function requireAdmin(req: any, res: any): boolean {
  const token = getAdminTokenFromReq(req)
  if (!verifyAdminToken(token)) {
    res.status(401).json({ error: 'Unauthorized' })
    return false
  }
  return true
}

function siteBaseUrl() {
  const explicit = (process.env.PUBLIC_SITE_URL || '').trim().replace(/\/$/, '')
  if (explicit) return explicit
  const v = process.env.VERCEL_URL
  if (v) return `https://${String(v).replace(/^https?:\/\//, '')}`
  return ''
}

function absolutizeImage(href: string, base: string) {
  if (!href) return ''
  const s = String(href)
  if (s.startsWith('http://') || s.startsWith('https://')) return s
  if (!base) return s
  return base + (s.startsWith('/') ? s : `/${s}`)
}

function productUrlFromLine(line: Record<string, unknown>, base: string) {
  const slug = String(line.slug || '')
  const cat = String(line.category_slug ?? line.categorySlug ?? '')
  if (!base || !slug || !cat) return String(line.product_url || '')
  return `${base}/products/${encodeURIComponent(cat)}/${encodeURIComponent(slug)}`
}

/** Build admin `order_lines` shape from `orders.lines` JSONB (new enriched rows or legacy client payload). */
function normalizeAdminLines(raw: unknown, orderId: string) {
  const base = siteBaseUrl()
  const arr = Array.isArray(raw) ? raw : []
  return arr.map((item, idx) => {
    const l = item as Record<string, unknown>
    const qty = Math.min(999, Math.max(1, Math.round(Number(l.quantity ?? 1))))
    const unitFromSnake = Math.round(Number(l.unit_price_pkr))
    const unitFromCamel = Math.round(Number(l.unitPrice))
    const unit = Number.isFinite(unitFromSnake) && unitFromSnake > 0 ? unitFromSnake : unitFromCamel
    const slug = String(l.slug || '')
    const categorySlug = String(l.category_slug ?? l.categorySlug ?? '')
    const imageRaw = String(l.image_url ?? l.imageUrl ?? '')
    const existingProductUrl = String(l.product_url || '')
    const productUrl = existingProductUrl || productUrlFromLine(l, base)
    const imageUrl = absolutizeImage(imageRaw, base) || imageRaw
    const lineSub = Number(l.line_subtotal_pkr)
    const lineSubOk = Number.isFinite(lineSub) && lineSub > 0 ? lineSub : unit * qty
    const shipLine = Math.round(Number(l.shipping_line_pkr ?? 0))
    return {
      id: String(l.id || `${orderId}-${idx}`),
      order_id: orderId,
      sort_index: Number(l.sort_index ?? idx),
      title: String(l.title || ''),
      image_url: imageUrl,
      product_url: productUrl,
      slug,
      category_slug: categorySlug,
      quantity: qty,
      unit_price_pkr: unit,
      line_subtotal_pkr: lineSubOk,
      shipping_line_pkr: shipLine,
      size: String(l.size || ''),
      finish: String(l.finish || ''),
      wooden_frame: Boolean(l.wooden_frame ?? l.woodenFrame),
      led_backlight: Boolean(l.led_backlight ?? l.ledBacklight),
      installation: Boolean(l.installation),
    }
  })
}

export default async function handler(req: any, res: any) {
  if (!requireAdmin(req, res)) return

  let supabase
  try {
    supabase = serviceSupabase()
  } catch (e) {
    console.error('[admin-orders]', e)
    return res.status(500).json({
      error:
        'Admin API needs SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in Vercel → Settings → Environment Variables (same values as in .env.example).',
    })
  }

  if (req.method === 'GET') {
    const { data: orders, error: e1 } = await supabase
      .from('orders')
      .select(
        'id, order_code, customer_name, customer_email, customer_phone, address_line1, city, notes, lines, subtotal_pkr, shipping_pkr, grand_total_pkr, payment_method, created_at, order_completed'
      )
      .order('created_at', { ascending: false })

    if (e1) {
      console.error('[admin-orders] list', e1)
      return res.status(500).json({ error: friendlyDbError(e1) })
    }

    const list = orders || []
    const merged = list.map((o) => {
      const id = String((o as { id: string }).id)
      return {
        ...(o as Record<string, unknown>),
        order_lines: normalizeAdminLines((o as { lines: unknown }).lines, id),
      }
    })
    return res.status(200).json({ orders: merged })
  }

  if (req.method === 'PATCH') {
    const orderId = String(req.body?.orderId ?? '').trim()
    const completed = Boolean(req.body?.order_completed ?? req.body?.completed)
    if (!UUID_RE.test(orderId)) {
      return res.status(400).json({ error: 'Invalid order id' })
    }

    const { data, error } = await supabase
      .from('orders')
      .update({ order_completed: completed })
      .eq('id', orderId)
      .select('id, order_completed')
      .maybeSingle()

    if (error) {
      console.error('[admin-orders] patch', error)
      return res.status(500).json({ error: friendlyDbError(error) })
    }
    if (!data) {
      return res.status(404).json({ error: 'Order not found' })
    }
    return res.status(200).json({ ok: true, order: data })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
