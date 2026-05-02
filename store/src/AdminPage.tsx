import { useCallback, useEffect, useMemo, useState } from 'react'
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

function formatMoney(n: number) {
  return `Rs. ${Math.round(n).toLocaleString()}`
}

function formatWhen(iso: string) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function IconExternal() {
  return (
    <svg className="admin-icon-external" viewBox="0 0 24 24" width={14} height={14} aria-hidden>
      <path
        fill="currentColor"
        d="M14 3h7v7h-2V6.41l-9.29 9.3-1.42-1.42 9.3-9.29H14V3zm-9 4h2v11h11v2H5V7z"
      />
    </svg>
  )
}

function IconOrders() {
  return (
    <svg className="admin-nav-icon" viewBox="0 0 24 24" width={20} height={20} aria-hidden>
      <path
        fill="currentColor"
        d="M7 4h14v14H7V4zm2 2v10h10V6H9zM3 8H1v12h12v-2H3V8zm4-4v2h2V4H7z"
      />
    </svg>
  )
}

function IconShield() {
  return (
    <svg className="admin-login-shield" viewBox="0 0 24 24" width={40} height={40} aria-hidden>
      <path
        fill="currentColor"
        d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 2.18l7 3.12v5.7c0 4.54-3.07 8.83-7 9.94-3.93-1.11-7-5.4-7-9.94V6.3l7-3.12zM11 7h2v6h-2V7zm0 8h2v2h-2v-2z"
      />
    </svg>
  )
}

type OrderFilter = 'all' | 'open' | 'done'

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
  const [filter, setFilter] = useState<OrderFilter>('all')
  const [lastSynced, setLastSynced] = useState<string | null>(null)

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
      setLastSynced(new Date().toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' }))
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

  const stats = useMemo(() => {
    const total = orders.length
    const done = orders.filter((o) => Boolean(o.order_completed)).length
    const open = total - done
    return { total, open, done }
  }, [orders])

  const filteredOrders = useMemo(() => {
    if (filter === 'open') return orders.filter((o) => !o.order_completed)
    if (filter === 'done') return orders.filter((o) => Boolean(o.order_completed))
    return orders
  }, [orders, filter])

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
    setFilter('all')
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
      setLastSynced(new Date().toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' }))
    } catch {
      setOrdersError('Network error saving completion state.')
      void loadOrders()
    } finally {
      setUpdatingId(null)
    }
  }

  if (checking) {
    return (
      <div className="admin-app">
        <div className="admin-boot">
          <div className="admin-boot-spinner" aria-hidden />
          <p>Loading control centre…</p>
        </div>
      </div>
    )
  }

  if (!sessionOk) {
    return (
      <div className="admin-app admin-app--auth">
        <div className="admin-auth-layout">
          <div className="admin-auth-hero" aria-hidden>
            <p className="admin-auth-brand">BARQMECH</p>
            <h2 className="admin-auth-tagline">Operations</h2>
            <p className="admin-auth-sub">Order fulfilment &amp; customer logistics</p>
          </div>
          <div className="admin-auth-panel">
            <div className="admin-auth-card">
              <div className="admin-auth-card-head">
                <IconShield />
                <div>
                  <h1 className="admin-auth-title">Sign in</h1>
                  <p className="admin-auth-desc">Use your admin password. Sessions are secured with an HTTP-only cookie.</p>
                </div>
              </div>
              <form className="admin-auth-form" onSubmit={handleLogin}>
                <label className="admin-field-label" htmlFor="admin-password">
                  Password
                </label>
                <input
                  id="admin-password"
                  className="admin-field-input"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••••••"
                />
                {loginError ? (
                  <p className="admin-field-error" role="alert">
                    {loginError}
                  </p>
                ) : null}
                <button className="admin-btn admin-btn--primary admin-btn--block" type="submit" disabled={loginBusy}>
                  {loginBusy ? 'Signing in…' : 'Continue'}
                </button>
              </form>
              <Link to="/" className="admin-auth-footer-link">
                ← Return to storefront
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="admin-app">
      <aside className="admin-sidebar">
        <div className="admin-sidebar-brand">
          <span className="admin-sidebar-logo">BARQMECH</span>
          <span className="admin-sidebar-badge">Control centre</span>
        </div>
        <nav className="admin-sidebar-nav" aria-label="Admin">
          <span className="admin-sidebar-link admin-sidebar-link--active">
            <IconOrders />
            Orders
          </span>
        </nav>
        <div className="admin-sidebar-footer">
          <Link to="/" className="admin-sidebar-ghost">
            View storefront
          </Link>
          <button type="button" className="admin-sidebar-ghost" onClick={handleLogout}>
            Log out
          </button>
        </div>
      </aside>

      <div className="admin-workspace">
        <header className="admin-workspace-header">
          <div>
            <h1 className="admin-workspace-title">Orders</h1>
            <p className="admin-workspace-sub">Review COD orders, line items, and mark fulfilment when complete.</p>
          </div>
          <div className="admin-workspace-actions">
            {lastSynced ? <span className="admin-sync-pill">Synced {lastSynced}</span> : null}
            <button type="button" className="admin-btn admin-btn--secondary" onClick={() => void loadOrders()} disabled={ordersLoading}>
              {ordersLoading ? 'Refreshing…' : 'Refresh'}
            </button>
          </div>
        </header>

        <section className="admin-kpi-row" aria-label="Summary">
          <article className="admin-kpi">
            <p className="admin-kpi-label">Total</p>
            <p className="admin-kpi-value">{stats.total}</p>
          </article>
          <article className="admin-kpi admin-kpi--accent">
            <p className="admin-kpi-label">Open</p>
            <p className="admin-kpi-value">{stats.open}</p>
          </article>
          <article className="admin-kpi admin-kpi--muted">
            <p className="admin-kpi-label">Completed</p>
            <p className="admin-kpi-value">{stats.done}</p>
          </article>
        </section>

        <div className="admin-toolbar">
          <div className="admin-filter" role="group" aria-label="Filter orders">
            {(['all', 'open', 'done'] as const).map((key) => (
              <button
                key={key}
                type="button"
                className={`admin-filter-btn${filter === key ? ' admin-filter-btn--on' : ''}`}
                onClick={() => setFilter(key)}
              >
                {key === 'all' ? 'All' : key === 'open' ? 'Open' : 'Completed'}
              </button>
            ))}
          </div>
          <p className="admin-toolbar-hint">Auto-refresh every 8s while this tab is open.</p>
        </div>

        {ordersError ? (
          <div className="admin-alert" role="alert">
            <strong>Action needed</strong>
            <p>{ordersError}</p>
          </div>
        ) : null}

        {ordersLoading && orders.length === 0 ? (
          <div className="admin-skeleton-stack" aria-busy>
            {[0, 1, 2].map((i) => (
              <div key={i} className="admin-skeleton-card" />
            ))}
          </div>
        ) : null}

        <div className="admin-order-feed">
          {filteredOrders.map((order) => (
            <article key={order.id} className="admin-order">
              <div className="admin-order-top">
                <div className="admin-order-ids">
                  <span className="admin-order-code">#{order.order_code}</span>
                  <span className={`admin-status${order.order_completed ? ' admin-status--done' : ' admin-status--open'}`}>
                    {order.order_completed ? 'Completed' : 'Open'}
                  </span>
                </div>
                <div className="admin-order-when">{formatWhen(order.created_at)}</div>
                <label className="admin-switch">
                  <input
                    type="checkbox"
                    checked={Boolean(order.order_completed)}
                    disabled={updatingId === order.id}
                    onChange={(e) => void setOrderCompleted(order.id, e.target.checked)}
                  />
                  <span className="admin-switch-ui" aria-hidden />
                  <span className="admin-switch-label">Fulfilled</span>
                </label>
              </div>

              <div className="admin-order-customer">
                <div className="admin-order-customer-main">
                  <p className="admin-order-name">{order.customer_name}</p>
                  <p className="admin-order-contact">
                    <a href={`mailto:${order.customer_email}`}>{order.customer_email}</a>
                    <span className="admin-dot">·</span>
                    <a href={`tel:${order.customer_phone.replace(/\s/g, '')}`}>{order.customer_phone}</a>
                  </p>
                  <p className="admin-order-address">
                    {order.address_line1}
                    {order.city ? `, ${order.city}` : ''}
                  </p>
                  {order.notes ? <p className="admin-order-notes">{order.notes}</p> : null}
                </div>
                <div className="admin-order-money">
                  <div>
                    <span className="admin-money-label">Subtotal</span>
                    <span className="admin-money-val">{formatMoney(order.subtotal_pkr)}</span>
                  </div>
                  <div>
                    <span className="admin-money-label">Shipping</span>
                    <span className="admin-money-val">{formatMoney(order.shipping_pkr)}</span>
                  </div>
                  <div className="admin-order-total">
                    <span className="admin-money-label">COD total</span>
                    <span className="admin-money-grand">{formatMoney(order.grand_total_pkr)}</span>
                  </div>
                </div>
              </div>

              <ul className="admin-lines">
                {(order.order_lines || []).map((line) => (
                  <li key={line.id} className="admin-line">
                    <div className="admin-line-thumb">
                      {line.image_url ? (
                        <img src={line.image_url} alt="" loading="lazy" />
                      ) : (
                        <div className="admin-line-thumb--empty" />
                      )}
                    </div>
                    <div className="admin-line-detail">
                      <p className="admin-line-name">
                        {line.product_url ? (
                          <a href={line.product_url} target="_blank" rel="noopener noreferrer" className="admin-line-link">
                            {line.title}
                            <IconExternal />
                          </a>
                        ) : (
                          line.title
                        )}
                      </p>
                      <p className="admin-line-spec">
                        {line.size} · {line.finish} · Qty {line.quantity} · {formatMoney(line.unit_price_pkr)} each
                      </p>
                      <p className="admin-line-spec">
                        Line {formatMoney(line.line_subtotal_pkr)}
                        {line.shipping_line_pkr ? ` · Ship ${formatMoney(line.shipping_line_pkr)}` : ''} · Frame{' '}
                        {line.wooden_frame ? 'Yes' : 'No'} · LED {line.led_backlight ? 'Yes' : 'No'} · Install{' '}
                        {line.installation ? 'Yes' : 'No'}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>

        {!ordersLoading && filteredOrders.length === 0 ? (
          <div className="admin-empty">
            <p className="admin-empty-title">{filter === 'all' ? 'No orders yet' : filter === 'open' ? 'No open orders' : 'No completed orders'}</p>
            <p className="admin-empty-text">
              {filter === 'all'
                ? 'New checkout orders will appear here automatically.'
                : 'Try another filter or refresh.'}
            </p>
          </div>
        ) : null}
      </div>
    </div>
  )
}
