import { Link, useLocation, useSearchParams } from 'react-router-dom'
import { formatPriceNoDecimals } from '../data/catalog.ts'
import { ShopTopbar } from '../components/ShopTopbar.tsx'


export type CheckoutSuccessState = {
  customerEmail?: string
  grandTotal?: number
  subtotal?: number
  shippingTotal?: number
}

export default function CheckoutSuccessPage() {
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
  const validCode = /^\d{6}$/.test(code)

  return (
    <>
      <ShopTopbar showContact={false} showAccount={false} />
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
                  We&apos;ve sent a confirmation to <strong>{customerEmail}</strong>.
                </>
              ) : null}
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
                Cash on delivery: you&apos;ll pay when your order arrives.
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
