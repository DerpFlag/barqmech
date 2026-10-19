export type OrderLine = {
  id: string; title: string; image_url: string; product_url: string; size: string; finish: string
  quantity: number; unit_price_pkr: number; line_subtotal_pkr: number; shipping_line_pkr: number
  wooden_frame: boolean; led_backlight: boolean; installation: boolean
}
export type AdminOrder = {
  id: string; order_code: string; customer_name: string; customer_email: string; customer_phone: string
  address_line1: string; city: string | null; notes: string | null; subtotal_pkr: number; shipping_pkr: number
  grand_total_pkr: number; payment_method: string; created_at: string; order_date?: string
  order_completed?: boolean; order_completed_at?: string | null; order_lines?: OrderLine[]
}
export type Filter = 'all' | 'open' | 'done'
export function matchingOrders(orders: AdminOrder[], filter: Filter, query: string) {
  const q = query.trim().toLowerCase(), digits = q.replace(/\D/g, '')
  return orders.filter(order => {
    if (filter === 'open' && order.order_completed || filter === 'done' && !order.order_completed) return false
    if (!q) return true
    const fields = [order.order_code, order.customer_name, order.customer_email, order.customer_phone, order.city,
      ...(order.order_lines ?? []).map(line => line.title)].join(' ').toLowerCase()
    return fields.includes(q) || digits.length >= 3 && String(order.customer_phone).replace(/\D/g, '').includes(digits)
  })
}
export function orderStats(orders: AdminOrder[]) {
  const done = orders.filter(order => order.order_completed).length
  return {total: orders.length, open: orders.length - done, done, value: orders.reduce((sum, order) => sum + order.grand_total_pkr, 0)}
}
export const money = (amount: number) => `Rs. ${Math.round(amount).toLocaleString('en-PK')}`
export function when(value: string | undefined) {
  const date = new Date(value ?? '')
  return Number.isNaN(date.getTime()) ? 'Date unavailable' : date.toLocaleString('en-GB', {day:'numeric', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit'})
}
// Stored links are data, never executable URL schemes.
export function safeWebUrl(value: string | undefined) {
  if (!value) return undefined
  if (value.startsWith('/') && !value.startsWith('//') && !value.includes('\\')) return value
  try { const url = new URL(value); return ['https:', 'http:'].includes(url.protocol) ? url.href : undefined } catch { return undefined }
}
