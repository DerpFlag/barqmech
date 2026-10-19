import {
  createContext,
  memo,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { Link } from 'react-router-dom'
import { formatSizeDisplay } from '@store/catalog/pricing.ts'

import { createCartStorage, type CartOperation } from './cartStorage.ts'
import type { CartLine } from './types.ts'
export type { CartLine } from './types.ts'

const storage = createCartStorage({
  get length() { return window.localStorage.length },
  key: index => window.localStorage.key(index),
  getItem: key => window.localStorage.getItem(key),
  setItem: (key, value) => window.localStorage.setItem(key, value),
  removeItem: key => window.localStorage.removeItem(key),
})

type CartContextValue = {
  lines: CartLine[]
  storageError: string | null
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
  const [lines, setLines] = useState<CartLine[]>(storage.read)
  const [drawerOpen, setDrawerOpen] = useState(false)

  const [storageError, setStorageError] = useState<string | null>(null)
  useEffect(() => {
    const sync = () => setLines(storage.read())
    const onStorage = (event: StorageEvent) => {
      if (event.storageArea === localStorage && storage.isCartKey(event.key)) sync()
    }
    window.addEventListener('storage', onStorage)
    window.addEventListener('focus', sync)
    document.addEventListener('visibilitychange', sync)
    sync()
    return () => {
      window.removeEventListener('storage', onStorage)
      window.removeEventListener('focus', sync)
      document.removeEventListener('visibilitychange', sync)
    }
  }, [])
  const commit = useCallback(async (operation: CartOperation) => {
    try {
      const write=()=>{
        const next=storage.dispatch(operation)
        setLines(next)
        if(navigator.locks)try{storage.compactUnderLock()}catch{/* The operation is saved; compaction can wait. */}
      }
      if(navigator.locks)await navigator.locks.request('barqmech-cart-v3-writer',write)
      else write() // Keep the non-compacting journal where cross-tab locks are unavailable.
      setStorageError(null)
    } catch {
      setStorageError('Your browser could not save this change. Please allow site storage and try again.')
    }
  }, [])

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
    commit({ type: 'add', line: { ...input, mergeKey, quantity } })
  }, [commit])

  const removeLine = useCallback((mergeKey: string) => {
    commit({ type: 'remove', mergeKey })
  }, [commit])

  const setLineQuantity = useCallback((mergeKey: string, quantity: number) => {
    commit({ type: 'quantity', mergeKey, quantity })
  }, [commit])

  const clearCart = useCallback(() => commit({ type: 'clear' }), [commit])

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
      storageError,
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
      storageError,
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
    storageError,
    drawerOpen,
    closeDrawer,
    subtotal,
    totalQuantity,
    removeLine,
    setLineQuantity,
  } = useCart()

  const dialogRef = useRef<HTMLElement>(null)
  useEffect(() => {
    if (!drawerOpen) return
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    dialogRef.current?.querySelector<HTMLButtonElement>('.cart-drawer-close')?.focus()
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeDrawer()
      if (event.key !== 'Tab') return
      const focusable = Array.from(dialogRef.current?.querySelectorAll<HTMLElement>('a[href],button:not(:disabled),[tabindex="0"]') ?? [])
      const first = focusable[0], last = focusable[focusable.length - 1]
      if (!dialogRef.current?.contains(document.activeElement)) { event.preventDefault(); first?.focus(); return }
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus() }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus() }
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKey)
      previousFocus?.focus({ preventScroll: true })
    }
  }, [drawerOpen, closeDrawer])

  if (!drawerOpen) return null

  return (
    <div className="cart-drawer-backdrop" role="presentation" onClick={closeDrawer}>
      <aside
        ref={dialogRef}
        className="cart-drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-drawer-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="cart-drawer-header">
          <h2 id="cart-drawer-title" className="cart-drawer-title">
            Your cart <span className="cart-drawer-count">{totalQuantity} {totalQuantity === 1 ? 'piece' : 'pieces'}</span>
          </h2>
          <button type="button" className="cart-drawer-close" onClick={closeDrawer} aria-label="Close cart">
            <svg viewBox="0 0 24 24" className="cart-drawer-close-icon" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
              <path d="m6 6 12 12M18 6 6 18" />
            </svg>
          </button>
        </header>

        {storageError ? <p className="cart-storage-error" role="alert">{storageError}</p> : null}
        {lines.length === 0 ? (
          <div className="cart-drawer-empty">
            <svg className="cart-empty-icon" viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M16 20h32l4 34H12l4-34ZM23 22V16a9 9 0 0 1 18 0v6" /></svg>
            <h3>A little room for metal.</h3>
            <p>Your cart is empty.</p>
            <p className="cart-drawer-empty-hint">Find a piece for your space. Your selections will appear here.</p>
            <Link to="/products" className="cart-drawer-checkout-primary" onClick={closeDrawer}>Explore the collection <span aria-hidden="true">↗</span></Link>
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
                    {line.title.replace(/^\[[^\]]+\]\s*/, '')}
                  </Link>
                  <p className="cart-drawer-line-meta">
                    <span>Size {formatSizeDisplay(line.size)}</span>
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
                    {line.woodenFrame ? <span>Wooden frame</span> : null}
                    {line.ledBacklight ? <span>LED backlight</span> : null}
                    {line.installation ? <span>Installation</span> : null}
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
