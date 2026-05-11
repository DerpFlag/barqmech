import { useState } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { finalLogoUrl, formatPriceNoDecimals } from '../data/catalog.ts'


export type CheckoutSuccessState = {
  customerEmail?: string
  grandTotal?: number
  subtotal?: number
  shippingTotal?: number
}

export default function CheckoutSuccessPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const location = useLocation()
  const code = params.get('code')?.trim() ?? ''
  const successState = (location.state as CheckoutSuccessState | null) ?? {}
  const customerEmail =
    typeof successState.customerEmail === 'string' ? successState.customerEmail.trim() : ''
  const grandTotal =
    typeof successState.grandTotal === 'number' && Number.isFinite(successState.grandTotal) ? successState.grandTotal : null
  const subtotalOk =
    typeof successState.subtotal === 'number' && Number.isFinite(successState.subtotal) ? successState.subtotal : null
  const shippingOk =
    typeof successState.shippingTotal === 'number' && Number.isFinite(successState.shippingTotal)
      ? successState.shippingTotal
      : null
  const [searchQuery, setSearchQuery] = useState('')
  const validCode = /^\d{6}$/.test(code)

  return (
    <>
      <header className="topbar visible">
        <div className="topbar-inner">
          <Link to="/" className="brand-logo-btn">
            <img src={finalLogoUrl} alt="BarqMech" className="brand-logo-img" width={240} height={72} decoding="async" fetchPriority="high" />
            <span className="brand-title">BARQMECH</span>
          </Link>
          <form className="topbar-search" role="search" onSubmit={(e) => e.preventDefault()}>
            <input
              type="search"
              name="q"
              className="topbar-search-input"
              placeholder="Search products..."
              autoComplete="off"
              aria-label="Search products"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <span className="topbar-search-icon" aria-hidden>
              <svg viewBox="0 0 24 24" className="nav-icon-svg">
                <path d="M10.5 3a7.5 7.5 0 0 1 5.95 12.08l4.24 4.24-1.42 1.42-4.24-4.24A7.5 7.5 0 1 1 10.5 3zm0 2a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11z" />
              </svg>
            </span>
          </form>
          <nav className="topbar-actions" aria-label="Primary">
            <button type="button" className="topbar-nav-link" onClick={() => navigate('/products')}>
              <span className="nav-icon" aria-hidden>
                <svg viewBox="0 0 24 24" className="nav-icon-svg">
                  <path d="M7 8V7a5 5 0 0 1 10 0v1h3v13H4V8h3zm2 0h6V7a3 3 0 0 0-6 0v1zm-3 2v9h12v-9H6z" />
                </svg>
              </span>
              <span className="nav-label">Shop</span>
            </button>
          </nav>
        </div>
      </header>
      <main className="shop-route-page products-page checkout-page">
        <div className="products-crumb-row">
          <p className="products-crumb">
            <Link to="/">Home</Link>
            {' / '}
            <Link to="/checkout">Checkout</Link>
            {' / '}
            <span>Confirmed</span>
          </p>
        </div>
        {validCode ? (
          <div className="checkout-success checkout-panel">
            <h1 className="checkout-heading">Thank you for your order</h1>
            <p className="checkout-success-lead">
              We&apos;re grateful you chose BarqMech. Your order is confirmed and our team will begin preparing it for you.
            </p>
            <p>
              Your order code is <strong className="checkout-order-code">{code}</strong>. Keep it handy for any follow-up.
              {customerEmail ? (
                <>
                  {' '}
                  We&apos;ve sent a detailed confirmation to <strong>{customerEmail}</strong>.
                </>
              ) : (
                <> A confirmation email is on its way.</>
              )}
            </p>
            {grandTotal != null ? (
              <div className="checkout-success-cod-card" role="region" aria-label="Payment summary">
                <p className="checkout-success-cod-label">Amount due when your order arrives</p>
                <p className="checkout-success-cod-amount">{formatPriceNoDecimals(grandTotal)}</p>
                {subtotalOk != null && shippingOk != null ? (
                  <p className="checkout-success-cod-breakdown">
                    Products {formatPriceNoDecimals(subtotalOk)} + shipping {formatPriceNoDecimals(shippingOk)} (cash on
                    delivery — nothing charged online).
                  </p>
                ) : (
                  <p className="checkout-success-cod-breakdown">
                    Cash on delivery: please have this total ready for the courier. No payment is taken on the website.
                  </p>
                )}
              </div>
            ) : (
              <p className="checkout-shipping-note">
                Cash on delivery: you&apos;ll pay when your order arrives. Check your email for the full total and line
                items.
              </p>
            )}
            <p className="checkout-success-outro">
              We&apos;d love to welcome you back soon — browse new pieces anytime, and tell friends if you enjoyed the
              experience.
            </p>
            <div className="checkout-success-actions">
              <Link to="/products" className="mosaic-discover-btn">
                Continue shopping
              </Link>
              <Link to="/" className="product-detail-btn product-detail-btn--outline">
                Home
              </Link>
            </div>
          </div>
        ) : (
          <div className="checkout-empty checkout-panel">
            <h1 className="checkout-heading">Order link incomplete</h1>
            <p>Use the link from your confirmation email, or return to checkout.</p>
            <Link to="/checkout" className="mosaic-discover-btn">
              Checkout
            </Link>
          </div>
        )}
      </main>
    </>
  )
}
