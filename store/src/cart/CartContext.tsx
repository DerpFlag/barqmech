import {
  createContext,
  memo,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { Link } from 'react-router-dom'

const STORAGE_KEY = 'barqmech-cart-v2'

export type CartLine = {
  mergeKey: string
  productId: string
  slug: string
  categorySlug: string
  title: string
  imageUrl: string
  priceLabel: string
  unitPrice: number
  quantity: number
  size: string
  finish: string
  /** Matches CSV / DXF design code when product has multiple numbered designs. */
  designCode?: number
  woodenFrame?: boolean
  ledBacklight?: boolean
  installation?: boolean
}

function readStoredLines(): CartLine[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (row): row is CartLine =>
        row &&
        typeof row === 'object' &&
        typeof (row as CartLine).mergeKey === 'string' &&
        typeof (row as CartLine).productId === 'string' &&
        typeof (row as CartLine).quantity === 'number'
    )
  } catch {
    return []
  }
}

function persistLines(lines: CartLine[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lines))
  } catch {
    /* ignore quota */
  }
}

type CartContextValue = {
  lines: CartLine[]
  drawerOpen: boolean
  openDrawer: () => void
  closeDrawer: () => void
  totalQuantity: number
  subtotal: number
  addToCart: (input: Omit<CartLine, 'mergeKey'> & { mergeKey?: string }) => void
  removeLine: (mergeKey: string) => void
  setLineQuantity: (mergeKey: string, quantity: number) => void
  clearCart: () => void
  buildWhatsAppCheckoutUrl: (baseWhatsAppUrl: string) => string
}

const CartContext = createContext<CartContextValue | null>(null)

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}

function mergeKeyFor(
  productId: string,
  designCode: number,
  size: string,
  finish: string,
  woodenFrame = false,
  ledBacklight = false,
  installation = false
) {
  return `${productId}::dc${designCode}::${size}::${finish}::${woodenFrame ? 'wf' : 'nw'}::${ledBacklight ? 'led' : 'nled'}::${installation ? 'inst' : 'noinst'}`
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>(readStoredLines)
  const [drawerOpen, setDrawerOpen] = useState(false)

  useEffect(() => {
    persistLines(lines)
  }, [lines])

  const openDrawer = useCallback(() => setDrawerOpen(true), [])
  const closeDrawer = useCallback(() => setDrawerOpen(false), [])

  const totalQuantity = useMemo(() => lines.reduce((s, l) => s + l.quantity, 0), [lines])
  const subtotal = useMemo(() => lines.reduce((s, l) => s + l.unitPrice * l.quantity, 0), [lines])

  const addToCart = useCallback((input: Omit<CartLine, 'mergeKey'> & { mergeKey?: string }) => {
    const dc = typeof input.designCode === 'number' && Number.isFinite(input.designCode) ? Math.floor(input.designCode) : 0
    const mergeKey =
      input.mergeKey ??
      mergeKeyFor(
        input.productId,
        dc,
        input.size,
        input.finish,
        Boolean(input.woodenFrame),
        Boolean(input.ledBacklight),
        Boolean(input.installation)
      )
    const quantity = Math.min(99, Math.max(1, input.quantity))
    setLines((prev) => {
      const idx = prev.findIndex((l) => l.mergeKey === mergeKey)
      if (idx >= 0) {
        const next = [...prev]
        const q = Math.min(99, next[idx].quantity + quantity)
        next[idx] = { ...next[idx], quantity: q }
        return next
      }
      return [...prev, { ...input, mergeKey, quantity }]
    })
  }, [])

  const removeLine = useCallback((mergeKey: string) => {
    setLines((prev) => prev.filter((l) => l.mergeKey !== mergeKey))
  }, [])

  const setLineQuantity = useCallback((mergeKey: string, quantity: number) => {
    const q = Math.min(99, Math.max(1, Math.floor(quantity)))
    setLines((prev) => prev.map((l) => (l.mergeKey === mergeKey ? { ...l, quantity: q } : l)))
  }, [])

  const clearCart = useCallback(() => setLines([]), [])

  const buildWhatsAppCheckoutUrl = useCallback(
    (baseWhatsAppUrl: string) => {
      const base = baseWhatsAppUrl.split('?')[0]
      const linesText = lines
        .map(
          (l, i) =>
            `${i + 1}. ${l.title}\n   ${l.priceLabel} × ${l.quantity} = Rs. ${Math.round(l.unitPrice * l.quantity).toLocaleString()}\n   Design: ${l.designCode != null && l.designCode > 0 ? l.designCode : '—'}\n   Size: ${l.size} · Finish: ${l.finish} · Wooden Frame: ${l.woodenFrame ? 'Yes' : 'No'} · LED Backlight: ${l.ledBacklight ? 'Yes' : 'No'} · Installation: ${l.installation ? 'Yes' : 'No'}\n   ${typeof window !== 'undefined' ? `${window.location.origin}/products/${l.categorySlug}/${l.slug}` : ''}`
        )
        .join('\n\n')
      const body = [
        'Hi BarqMech — I would like to place an order for:',
        '',
        linesText,
        '',
        `Estimated subtotal: Rs. ${Math.round(subtotal).toLocaleString()}`,
        '',
        'Please confirm availability and next steps.',
      ].join('\n')
      return `${base}?text=${encodeURIComponent(body)}`
    },
    [lines, subtotal]
  )

  const value = useMemo<CartContextValue>(
    () => ({
      lines,
      drawerOpen,
      openDrawer,
      closeDrawer,
      totalQuantity,
      subtotal,
      addToCart,
      removeLine,
      setLineQuantity,
      clearCart,
      buildWhatsAppCheckoutUrl,
    }),
    [
      lines,
      drawerOpen,
      openDrawer,
      closeDrawer,
      totalQuantity,
      subtotal,
      addToCart,
      removeLine,
      setLineQuantity,
      clearCart,
      buildWhatsAppCheckoutUrl,
    ]
  )

  return (
    <CartContext.Provider value={value}>
      {children}
      <CartDrawer />
    </CartContext.Provider>
  )
}

export const TopbarCartButton = memo(function TopbarCartButton() {
  const { totalQuantity, openDrawer } = useCart()
  return (
    <button
      type="button"
      className="topbar-nav-link topbar-cart-btn"
      onClick={openDrawer}
      aria-label={totalQuantity > 0 ? `Cart, ${totalQuantity} items` : 'Cart'}
    >
      <span className="topbar-cart-inner">
        <span className="nav-icon" aria-hidden>
          <svg viewBox="0 0 24 24" className="nav-icon-svg">
            <path
              fill="currentColor"
              d="M7 4h-3v2h2l1.2 7.1A3 3 0 0 0 10.16 16H18v-2h-7.84a1 1 0 0 1-.98-.83L9.03 12H18a2 2 0 0 0 1.94-1.5l1.03-4H8.27L8 4.9A1 1 0 0 0 7 4zm3 13a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm7 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4z"
            />
          </svg>
        </span>
        {totalQuantity > 0 ? (
          <span className="topbar-cart-badge">{totalQuantity > 99 ? '99+' : totalQuantity}</span>
        ) : null}
      </span>
      <span className="nav-label">Cart</span>
    </button>
  )
})

function CartDrawer() {
  const {
    lines,
    drawerOpen,
    closeDrawer,
    subtotal,
    removeLine,
    setLineQuantity,
  } = useCart()

  useEffect(() => {
    if (!drawerOpen) return
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeDrawer()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKey)
    }
  }, [drawerOpen, closeDrawer])

  if (!drawerOpen) return null

  return (
    <div className="cart-drawer-backdrop" role="presentation" onClick={closeDrawer}>
      <aside
        className="cart-drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-drawer-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="cart-drawer-header">
          <h2 id="cart-drawer-title" className="cart-drawer-title">
            Your cart
          </h2>
          <button type="button" className="cart-drawer-close" onClick={closeDrawer} aria-label="Close cart">
            <svg viewBox="0 0 24 24" className="cart-drawer-close-icon" aria-hidden>
              <path
                fill="currentColor"
                d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"
              />
            </svg>
          </button>
        </header>

        {lines.length === 0 ? (
          <div className="cart-drawer-empty">
            <p>Your cart is empty.</p>
            <p className="cart-drawer-empty-hint">Add items from a product page or the shop grid.</p>
          </div>
        ) : (
          <ul className="cart-drawer-list">
            {lines.map((line) => (
              <li key={line.mergeKey} className="cart-drawer-line">
                <Link to={`/products/${line.categorySlug}/${line.slug}`} className="cart-drawer-line-img-wrap" onClick={closeDrawer}>
                  <img src={line.imageUrl} alt="" className="cart-drawer-line-img" loading="lazy" decoding="async" />
                </Link>
                <div className="cart-drawer-line-body">
                  <Link to={`/products/${line.categorySlug}/${line.slug}`} className="cart-drawer-line-title" onClick={closeDrawer}>
                    {line.title}
                  </Link>
                  <p className="cart-drawer-line-meta">
                    <span>{line.priceLabel}</span>
                    <span className="cart-drawer-line-dot" aria-hidden>
                      ·
                    </span>
                    <span>Size {line.size}</span>
                    <span className="cart-drawer-line-dot" aria-hidden>
                      ·
                    </span>
                    {line.designCode != null && line.designCode > 0 ? (
                      <>
                        <span>Design {line.designCode}</span>
                        <span className="cart-drawer-line-dot" aria-hidden>
                          ·
                        </span>
                      </>
                    ) : null}
                    <span>{line.finish}</span>
                    <span className="cart-drawer-line-dot" aria-hidden>
                      ·
                    </span>
                    <span>Wooden Frame: {line.woodenFrame ? 'Yes' : 'No'}</span>
                    <span className="cart-drawer-line-dot" aria-hidden>
                      ·
                    </span>
                    <span>LED Backlight: {line.ledBacklight ? 'Yes' : 'No'}</span>
                    <span className="cart-drawer-line-dot" aria-hidden>
                      ·
                    </span>
                    <span>Installation: {line.installation ? 'Yes' : 'No'}</span>
                  </p>
                  <div className="cart-drawer-line-controls">
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
                    <span className="cart-drawer-line-sub">
                      Rs. {Math.round(line.unitPrice * line.quantity).toLocaleString()}
                    </span>
                  </div>
                  <button type="button" className="cart-drawer-remove" onClick={() => removeLine(line.mergeKey)}>
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}

        {lines.length > 0 ? (
          <footer className="cart-drawer-footer">
            <div className="cart-drawer-subtotal-row">
              <span>Subtotal</span>
              <strong>Rs. {Math.round(subtotal).toLocaleString()}</strong>
            </div>
            <p className="cart-drawer-footnote">Shipping is calculated on the checkout page. You can pay by cash on delivery.</p>
            <div className="cart-drawer-footer-actions">
              <Link to="/checkout" className="cart-drawer-checkout-primary" onClick={closeDrawer}>
                Proceed to checkout
              </Link>
            </div>
            <button type="button" className="cart-drawer-continue" onClick={closeDrawer}>
              Continue shopping
            </button>
          </footer>
        ) : null}
      </aside>
    </div>
  )
}
