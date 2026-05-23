import { useMemo, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '../cart/CartContext.tsx'
import {
  finalLogoUrl,
  formatPriceNoDecimals,
  placeOrderApiUrl,
  shippingPerUnitForSize,
} from '../data/catalog.ts'
import { formatSizeDisplay } from '../catalog/pricing.ts'
import { OrderDesignContactFooter, useShopContactDemo } from '../components/shopContact.tsx'
import { ShopTopbar } from '../components/ShopTopbar.tsx'
import { getEmailFieldError, getPakistanPhoneFieldError } from '../lib/contactFormValidation.ts'
import { isGmailValidationError } from '../lib/gmailEmail.ts'
import { isResendDeliveryError, RESEND_EMAIL_FAILED_MESSAGE } from '../lib/resendEmailLimit.ts'


export default function CheckoutPage() {
  const navigate = useNavigate()
  const { lines, subtotal, setLineQuantity, removeLine, clearCart } = useCart()
  const shopContact = useShopContactDemo()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [addressLine1, setAddressLine1] = useState('')
  const [city, setCity] = useState('')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [emailFieldError, setEmailFieldError] = useState<string | null>(null)
  const [phoneFieldError, setPhoneFieldError] = useState<string | null>(null)

  const shippingByLine = useMemo(
    () => lines.map((l) => ({ line: l, shipUnit: shippingPerUnitForSize(l.size), lineShip: shippingPerUnitForSize(l.size) * l.quantity })),
    [lines]
  )

  const shippingTotal = useMemo(() => shippingByLine.reduce((s, row) => s + row.lineShip, 0), [shippingByLine])
  const grandTotal = subtotal + shippingTotal

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (lines.length === 0) return
    const name = fullName.trim()
    const mail = email.trim()
    const tel = phone.trim()
    const addr = addressLine1.trim()
    const c = city.trim()
    setSubmitError(null)
    const mailErr = getEmailFieldError(mail)
    const telErr = getPakistanPhoneFieldError(tel)
    setEmailFieldError(mailErr ?? null)
    setPhoneFieldError(telErr ?? null)
    if (mailErr || telErr) return
    if (!name) {
      setSubmitError('Please enter your full name.')
      return
    }
    if (!addr) {
      setSubmitError('Please enter your street address.')
      return
    }
    setEmailFieldError(null)
    setPhoneFieldError(null)
    setSubmitting(true)
    const payloadLines = lines.map((l) => ({
      mergeKey: l.mergeKey,
      productId: l.productId,
      slug: l.slug,
      categorySlug: l.categorySlug,
      title: l.title,
      imageUrl: l.imageUrl,
      unitPrice: l.unitPrice,
      quantity: l.quantity,
      size: l.size,
      finish: l.finish,
      designCode: typeof l.designCode === 'number' && l.designCode > 0 ? l.designCode : undefined,
      woodenFrame: Boolean(l.woodenFrame),
      ledBacklight: Boolean(l.ledBacklight),
      installation: Boolean(l.installation),
    }))
    try {
      const res = await fetch(placeOrderApiUrl(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          origin: typeof window !== 'undefined' ? window.location.origin : '',
          customer: {
            name,
            email: mail,
            phone: tel,
            addressLine1: addr,
            city: c,
            notes: notes.trim(),
          },
          lines: payloadLines,
          subtotal,
          shippingTotal,
          grandTotal,
        }),
      })
      const data = (await res.json().catch(() => ({}))) as {
        orderCode?: string
        error?: string
      }
      if (!res.ok) {
        setSubmitting(false)
        const errMsg = typeof data.error === 'string' ? data.error : 'Could not place order'
        if (isGmailValidationError(errMsg)) {
          setEmailFieldError(errMsg)
          setSubmitError(null)
        } else if (isResendDeliveryError(errMsg)) {
          setEmailFieldError(null)
          setSubmitError(RESEND_EMAIL_FAILED_MESSAGE)
        } else {
          setEmailFieldError(null)
          setSubmitError(errMsg)
        }
        return
      }
      if (!data.orderCode) {
        setSubmitting(false)
        setSubmitError('Invalid response from server')
        return
      }
      clearCart()
      navigate(`/checkout/success?code=${encodeURIComponent(data.orderCode)}`, {
        replace: true,
        state: {
          customerEmail: mail,
          grandTotal,
          subtotal,
          shippingTotal,
        },
      })
    } catch {
      setSubmitting(false)
      setSubmitError('Network error — check your connection or try again.')
    }
  }

  const checkoutMain = (
    <>
      <div className="products-crumb-row">
        <p className="products-crumb">
          <Link to="/">Home</Link>
          {' / '}
          <Link to="/products">Products</Link>
          {' / '}
          <span>Checkout</span>
        </p>
        <button type="button" className="products-prev-btn" onClick={() => navigate(-1)}>
          ← Back
        </button>
      </div>

      {lines.length === 0 ? (
        <div className="checkout-empty checkout-panel">
          <h1 className="checkout-heading">Your cart is empty</h1>
          <p>Add products before checking out.</p>
          <Link to="/products" className="mosaic-discover-btn">
            Browse products
          </Link>
        </div>
      ) : null}

      {lines.length > 0 ? (
        <>
          <h1 className="checkout-heading">Checkout</h1>
          <p className="checkout-lead">Review your items, shipping by size, and your details. Pay by cash on delivery when your order arrives.</p>
          <div className="checkout-layout">
            <section className="checkout-panel" aria-labelledby="checkout-summary-title">
              <h2 id="checkout-summary-title" className="checkout-panel-title">
                Order summary
              </h2>
              {lines.map((line) => (
                <div key={line.mergeKey} className="checkout-line">
                  <Link to={`/products/${line.categorySlug}/${line.slug}`} className="checkout-line-img-wrap">
                    <img src={line.imageUrl} alt="" className="checkout-line-img" loading="lazy" decoding="async" />
                  </Link>
                  <div className="checkout-line-body">
                    <Link to={`/products/${line.categorySlug}/${line.slug}`} className="checkout-line-title">
                      {line.title}
                    </Link>
                    <p className="checkout-line-meta">
                      Size {formatSizeDisplay(line.size)}
                      {line.designCode != null && line.designCode > 0 ? ` · Design ${line.designCode}` : ''} · {line.finish} · Frame{' '}
                      {line.woodenFrame ? 'Yes' : 'No'} · LED {line.ledBacklight ? 'Yes' : 'No'} · Install {line.installation ? 'Yes' : 'No'}
                    </p>
                    <div className="checkout-line-row">
                      <div className="cart-drawer-qty">
                        <button
                          type="button"
                          className="cart-drawer-qty-btn"
                          aria-label="Decrease quantity"
                          onClick={() => setLineQuantity(line.mergeKey, line.quantity - 1)}
                          disabled={line.quantity <= 1}
                        >
                          −
                        </button>
                        <span className="cart-drawer-qty-val">{line.quantity}</span>
                        <button
                          type="button"
                          className="cart-drawer-qty-btn"
                          aria-label="Increase quantity"
                          onClick={() => setLineQuantity(line.mergeKey, line.quantity + 1)}
                          disabled={line.quantity >= 99}
                        >
                          +
                        </button>
                      </div>
                      <span className="checkout-line-price">{formatPriceNoDecimals(line.unitPrice * line.quantity)}</span>
                    </div>
                    <button type="button" className="cart-drawer-remove" onClick={() => removeLine(line.mergeKey)}>
                      Remove
                    </button>
                  </div>
                </div>
              ))}
              <div className="checkout-totals">
                <div className="checkout-total-row">
                  <span>Subtotal</span>
                  <strong>{formatPriceNoDecimals(subtotal)}</strong>
                </div>
                <div className="checkout-total-row">
                  <span>Shipping (by size)</span>
                  <strong>{formatPriceNoDecimals(shippingTotal)}</strong>
                </div>
                <p className="checkout-shipping-note">
                  Shipping is estimated per unit by panel size (12 in: {formatPriceNoDecimals(shippingPerUnitForSize('12 × 12 in'))}, 18
                  in: {formatPriceNoDecimals(shippingPerUnitForSize('18 × 18 in'))}, 24 in:{' '}
                  {formatPriceNoDecimals(shippingPerUnitForSize('24 × 24 in'))} each). Included in your COD total.
                </p>
                <div className="checkout-total-row checkout-total-row--grand">
                  <span>Total (COD)</span>
                  <strong>{formatPriceNoDecimals(grandTotal)}</strong>
                </div>
              </div>
            </section>

            <section className="checkout-panel" aria-labelledby="checkout-details-title">
              <h2 id="checkout-details-title" className="checkout-panel-title">
                Details &amp; payment
              </h2>
              <form className="checkout-form-grid" onSubmit={handleSubmit}>
                <label>
                  Full name *
                  <input type="text" name="fullName" autoComplete="name" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
                </label>
                <label>
                  Email *
                  <input type="email" name="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                  {emailFieldError ? (
                    <span className="form-field-error" role="alert">
                      {emailFieldError}
                    </span>
                  ) : null}
                </label>
                <label>
                  Phone *
                  <input
                    type="tel"
                    name="phone"
                    autoComplete="tel"
                    placeholder="03XX XXXXXXX or +92…"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                  />
                  {phoneFieldError ? (
                    <span className="form-field-error" role="alert">
                      {phoneFieldError}
                    </span>
                  ) : null}
                </label>
                <label>
                  Street address *
                  <input type="text" name="address" autoComplete="street-address" value={addressLine1} onChange={(e) => setAddressLine1(e.target.value)} required />
                </label>
                <label>
                  City
                  <input type="text" name="city" autoComplete="address-level2" value={city} onChange={(e) => setCity(e.target.value)} />
                </label>
                <label>
                  Order notes (optional)
                  <textarea name="notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Delivery instructions, gate code, etc." />
                </label>
                <div className="checkout-cod-card">
                  <p className="checkout-cod-title">Cash on delivery</p>
                  <p className="checkout-cod-text">
                    Pay <strong>{formatPriceNoDecimals(grandTotal)}</strong> when your order arrives (products + shipping).
                  </p>
                </div>
                {submitError ? (
                  <p className="checkout-submit-error" role="alert">
                    {submitError}
                  </p>
                ) : null}
                <button type="submit" className="checkout-submit-btn" disabled={submitting}>
                  {submitting ? 'Placing order…' : 'Place order'}
                </button>
              </form>
            </section>
          </div>
        </>
      ) : null}

      <section className="confidence-section" aria-label="Customer confidence highlights">
        <div className="confidence-title-row">
          <span className="confidence-line" aria-hidden />
          <h3>Buy with Confidence</h3>
          <span className="confidence-line" aria-hidden />
        </div>
        <div className="confidence-grid">
          <article className="confidence-item">
            <span className="confidence-icon" aria-hidden>
              <svg viewBox="0 0 24 24" className="confidence-icon-svg">
                <path d="M1 5h11v8h2.2l2.8-3.5H23V17h-2.2a2.8 2.8 0 0 1-5.6 0H8.8a2.8 2.8 0 0 1-5.6 0H1V5zm2 2v8h.2a2.8 2.8 0 0 1 5.6 0H10V7H3zm14.1 4L15.5 13H14v2h1.2a2.8 2.8 0 0 1 5.6 0H21v-4h-3.9zM6 15.6a1.4 1.4 0 1 0 0 2.8 1.4 1.4 0 0 0 0-2.8zm12 0a1.4 1.4 0 1 0 0 2.8 1.4 1.4 0 0 0 0-2.8z" />
              </svg>
            </span>
            <h4>Fast Shipping</h4>
            <p>Order by 2pm PST and we&apos;ll ship your order the very next day!</p>
          </article>
          <article className="confidence-item">
            <span className="confidence-icon" aria-hidden>
              <svg viewBox="0 0 24 24" className="confidence-icon-svg">
                <path d="M12 3a8 8 0 0 0-8 8v5a3 3 0 0 0 3 3h2v-7H6v-1a6 6 0 1 1 12 0v1h-3v7h2a3 3 0 0 0 3-3v-5a8 8 0 0 0-8-8z" />
              </svg>
            </span>
            <h4>Support 24/7</h4>
            <p>Our team is available 24 hours a day, 7 days a week to help you quickly.</p>
          </article>
          <article className="confidence-item confidence-about">
            <img src={finalLogoUrl} alt="BarqMech logo" className="confidence-about-logo" loading="lazy" decoding="async" />
            <h4>About Us</h4>
            <p>
              Elevating spaces through metal mastery. Barqmech delivers high-precision laser cutting and custom fabrication where
              innovation meets craftsmanship.
            </p>
          </article>
        </div>
      </section>

      <OrderDesignContactFooter shopContact={shopContact} demoEmailFieldId="demo-email-checkout" />
    </>
  )

  return (
    <>
      <ShopTopbar contactSectionId="order-design" showContact />

      <main className="shop-route-page products-page checkout-page">{checkoutMain}</main>
    </>
  )
}
