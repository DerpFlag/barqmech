import { memo } from 'react'
import { useCart } from '../cart/CartContext.tsx'

export const ShinobiCartButton = memo(function ShinobiCartButton() {
  const { totalQuantity, openDrawer } = useCart()

  return (
    <button
      type="button"
      className="shinobi-cart-btn"
      onClick={openDrawer}
      aria-label={totalQuantity > 0 ? `Cart, ${totalQuantity} items` : 'Open cart'}
    >
      <svg viewBox="0 0 24 24" className="shinobi-cart-icon" aria-hidden>
        <path
          fill="currentColor"
          d="M7 4h-3v2h2l1.2 7.1A3 3 0 0 0 10.16 16H18v-2h-7.84a1 1 0 0 1-.98-.83L9.03 12H18a2 2 0 0 0 1.94-1.5l1.03-4H8.27L8 4.9A1 1 0 0 0 7 4zm3 13a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm7 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4z"
        />
      </svg>
      <span>Cart</span>
      {totalQuantity > 0 ? (
        <span className="shinobi-cart-badge">{totalQuantity > 99 ? '99+' : totalQuantity}</span>
      ) : null}
    </button>
  )
})
