import { useCallback, useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'

function apiBase(): string {
  const raw = typeof import.meta.env.VITE_API_ORIGIN === 'string' ? import.meta.env.VITE_API_ORIGIN.trim() : ''
  return raw.replace(/\/$/, '')
}

function api(path: string) {
  return `${apiBase()}${path}`
}

type OrderLine = {
  id: string
  order_id: string
  sort_index: number
  title: string
  image_url: string
  product_url: string
  slug: string
  category_slug: string
  quantity: number
  unit_price_pkr: number
  line_subtotal_pkr: number
  shipping_line_pkr: number
  size: string
  finish: string
  wooden_frame: boolean
  led_backlight: boolean
  installation: boolean
}

type AdminOrder = {
  id: string
  order_code: string
  customer_name: string
  customer_email: string
  customer_phone: string
  address_line1: string
  city: string | null
  notes: string | null
  lines: unknown
  subtotal_pkr: number
  shipping_pkr: number
  grand_total_pkr: number
  payment_method: string
  created_at: string
  order_completed?: boolean
  order_lines?: OrderLine[]
}

const fetchOpts: RequestInit = { credentials: 'include' }

export function AdminPage() {
  const [checking, setChecking] = useState(true)
  const [sessionOk, setSessionOk] = useState(false)
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState<string | null>(null)
  const [loginBusy, setLoginBusy] = useState(false)
  const [orders, setOrders] = useState<AdminOrder[]>([])
  const [ordersError, setOrdersError] = useState<string | null>(null)
  const [ordersLoading, setOrdersLoading] = useState(false)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const loadSession = useCallback(async () => {
    setChecking(true)
    try {
      const res = await fetch(api('/api/admin-session'), fetchOpts)
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean }
      setSessionOk(Boolean(data.ok && res.ok))
    } catch {
      setSessionOk(false)
    } finally {
      setChecking(false)
    }
  }, [])

  useEffect(() => {
    void loadSession()
  }, [loadSession])

  const loadOrders = useCallback(async () => {
    setOrdersLoading(true)
    setOrdersError(null)
    try {
      const res = await fetch(api('/api/admin-orders'), fetchOpts)
      const data = (await res.json().catch(() => ({}))) as { orders?: AdminOrder[]; error?: string }
      if (!res.ok) {
        setOrdersError(typeof data.error === 'string' ? data.error : 'Could not load orders')
        setOrders([])
        return
      }
      setOrders(Array.isArray(data.orders) ? data.orders : [])
    } catch {
      setOrdersError('Network error loading orders.')
      setOrders([])
    } finally {
      setOrdersLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!sessionOk) return
    void loadOrders()
    const t = window.setInterval(() => {
      void loadOrders()
    }, 8000)
    return () => window.clearInterval(t)
  }, [sessionOk, loadOrders])

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault()
    setLoginBusy(true)
    setLoginError(null)
    try {
      const res = await fetch(api('/api/admin-login'), {
        ...fetchOpts,
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      const data = (await res.json().catch(() => ({}))) as { error?: string }
      if (!res.ok) {
        setLoginError(typeof data.error === 'string' ? data.error : 'Login failed')
        return
      }
      setPassword('')
      setSessionOk(true)
      void loadOrders()
    } catch {
      setLoginError('Network error — try again.')
    } finally {
      setLoginBusy(false)
    }
  }

  const handleLogout = async () => {
    try {
      await fetch(api('/api/admin-logout'), { ...fetchOpts, method: 'POST' })
    } catch {
      /* ignore */
    }
    setSessionOk(false)
    setOrders([])
  }

  const setOrderCompleted = async (orderId: string, completed: boolean) => {
    setUpdatingId(orderId)
    try {
      const res = await fetch(api('/api/admin-orders'), {
        ...fetchOpts,
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, order_completed: completed }),
      })
      const data = (await res.json().catch(() => ({}))) as { error?: string; order?: { order_completed: boolean } }
      if (!res.ok) {
        setOrdersError(typeof data.error === 'string' ? data.error : 'Update failed')
        void loadOrders()
        return
      }
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId ? { ...o, order_completed: data.order?.order_completed ?? completed } : o
        )
      )
      setOrdersError(null)
    } catch {
      setOrdersError('Network error saving completion state.')
      void loadOrders()
    } finally {
      setUpdatingId(null)
    }
  }

  const formatMoney = (n: number) => `Rs. ${Math.round(n).toLocaleString()}`

  if (checking) {
    return (
      <main className="admin-page">
        <p className="admin-muted">Checking session…</p>
      </main>
    )
  }

  if (!sessionOk) {
    return (
      <main className="admin-page admin-auth">
        <div className="admin-auth-card">
          <h1 className="admin-title">BarqMech Admin</h1>
          <p className="admin-lead">Enter the admin password to manage orders.</p>
          <form className="admin-auth-form" onSubmit={handleLogin}>
            <label className="admin-label">
              Password
              <input
                className="admin-input"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </label>
            {loginError ? (
              <p className="admin-error" role="alert">
                {loginError}
              </p>
            ) : null}
            <button className="admin-btn admin-btn--primary" type="submit" disabled={loginBusy}>
              {loginBusy ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
          <Link to="/" className="admin-back-link">
            ← Back to site
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="admin-page admin-dash">
      <header className="admin-dash-header">
        <div>
          <h1 className="admin-title">Orders</h1>
          <p className="admin-lead">Mark orders complete when fulfilled. The list refreshes automatically.</p>
        </div>
        <div className="admin-dash-actions">
          <button type="button" className="admin-btn" onClick={() => void loadOrders()} disabled={ordersLoading}>
            Refresh
          </button>
          <button type="button" className="admin-btn" onClick={handleLogout}>
            Log out
          </button>
          <Link to="/" className="admin-btn admin-btn--ghost">
            Storefront
          </Link>
        </div>
      </header>

      {ordersError ? (
        <p className="admin-banner" role="status">
          {ordersError}
        </p>
      ) : null}
      {ordersLoading && orders.length === 0 ? <p className="admin-muted">Loading orders…</p> : null}

      <div className="admin-order-list">
        {orders.map((order) => (
          <article key={order.id} className="admin-order-card">
            <div className="admin-order-head">
              <div>
                <p className="admin-order-code">#{order.order_code}</p>
                <p className="admin-order-meta">
                  {new Date(order.created_at).toLocaleString()} · {order.payment_method?.toUpperCase() || 'COD'}
                </p>
              </div>
              <label className="admin-complete-toggle">
                <input
                  type="checkbox"
                  checked={Boolean(order.order_completed)}
                  disabled={updatingId === order.id}
                  onChange={(e) => void setOrderCompleted(order.id, e.target.checked)}
                />
                <span>Completed</span>
              </label>
            </div>

            <div className="admin-customer-block">
              <p>
                <strong>{order.customer_name}</strong>
              </p>
              <p>
                <a href={`mailto:${order.customer_email}`}>{order.customer_email}</a> ·{' '}
                <a href={`tel:${order.customer_phone.replace(/\s/g, '')}`}>{order.customer_phone}</a>
              </p>
              <p>
                {order.address_line1}
                {order.city ? `, ${order.city}` : ''}
              </p>
              {order.notes ? <p className="admin-notes">Notes: {order.notes}</p> : null}
            </div>

            <div className="admin-totals-row">
              <span>Subtotal {formatMoney(order.subtotal_pkr)}</span>
              <span>Shipping {formatMoney(order.shipping_pkr)}</span>
              <span className="admin-total-grand">Total {formatMoney(order.grand_total_pkr)}</span>
            </div>

            <ul className="admin-line-list">
              {(order.order_lines || []).map((line) => (
                <li key={line.id} className="admin-line-item">
                  <div className="admin-line-img-wrap">
                    {line.image_url ? (
                      <img src={line.image_url} alt="" className="admin-line-img" loading="lazy" />
                    ) : (
                      <div className="admin-line-img admin-line-img--placeholder" />
                    )}
                  </div>
                  <div className="admin-line-body">
                    <p className="admin-line-title">
                      {line.product_url ? (
                        <a href={line.product_url} target="_blank" rel="noopener noreferrer">
                          {line.title}
                        </a>
                      ) : (
                        line.title
                      )}
                    </p>
                    <p className="admin-line-meta">
                      {line.size} · {line.finish} · Qty {line.quantity} · {formatMoney(line.unit_price_pkr)} each · Line{' '}
                      {formatMoney(line.line_subtotal_pkr)}
                      {line.shipping_line_pkr ? ` · Ship ${formatMoney(line.shipping_line_pkr)}` : ''}
                    </p>
                    <p className="admin-line-meta">
                      Frame {line.wooden_frame ? 'Yes' : 'No'} · LED {line.led_backlight ? 'Yes' : 'No'} · Install{' '}
                      {line.installation ? 'Yes' : 'No'}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>

      {!ordersLoading && orders.length === 0 ? <p className="admin-muted">No orders yet.</p> : null}
    </main>
  )
}
