import { createClient } from '@supabase/supabase-js'
import { getAdminTokenFromReq, verifyAdminToken } from './lib/admin-auth.mjs'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

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

type OrderLineRow = Record<string, unknown>

function mergeLinesIntoOrders(
  orders: Record<string, unknown>[],
  lines: OrderLineRow[] | null
): Record<string, unknown>[] {
  const byOrder = new Map<string, OrderLineRow[]>()
  for (const row of lines || []) {
    const oid = String(row.order_id)
    if (!byOrder.has(oid)) byOrder.set(oid, [])
    byOrder.get(oid)!.push(row)
  }
  for (const arr of byOrder.values()) {
    arr.sort((a, b) => Number(a.sort_index) - Number(b.sort_index))
  }
  return orders.map((o) => ({
    ...o,
    order_lines: byOrder.get(String(o.id)) || [],
  }))
}

export default async function handler(req: any, res: any) {
  if (!requireAdmin(req, res)) return

  let supabase
  try {
    supabase = serviceSupabase()
  } catch (e) {
    console.error('[admin-orders]', e)
    return res.status(500).json({ error: 'Admin is not configured (missing service role key).' })
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
      return res.status(500).json({ error: e1.message || 'Failed to load orders' })
    }

    const list = orders || []
    const ids = list.map((o) => o.id as string).filter(Boolean)
    if (ids.length === 0) {
      return res.status(200).json({ orders: [] })
    }

    const { data: lineRows, error: e2 } = await supabase.from('order_lines').select('*').in('order_id', ids)

    if (e2) {
      console.error('[admin-orders] lines', e2)
      return res.status(500).json({ error: e2.message || 'Failed to load order line items' })
    }

    const merged = mergeLinesIntoOrders(list as Record<string, unknown>[], (lineRows || []) as OrderLineRow[])
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
      return res.status(500).json({ error: error.message || 'Update failed' })
    }
    if (!data) {
      return res.status(404).json({ error: 'Order not found' })
    }
    return res.status(200).json({ ok: true, order: data })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
