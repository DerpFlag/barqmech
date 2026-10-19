/** Keep catalog loading visual and preserve the eventual page geometry. */
export function ProductGridPlaceholder() {
  return <div className="shop-grid-loading" aria-busy="true" aria-label="Product results">{Array.from({ length: 8 }, (_, i) => <div key={i} aria-hidden="true" />)}</div>
}

export function ProductPagePlaceholder() {
  return (
    <main className="shop-route-page products-page product-detail-page" aria-busy="true" aria-label="Product details">
      <div className="product-placeholder" aria-hidden="true">
        <div className="product-placeholder__image" />
        <div className="product-placeholder__copy">
          <div className="product-placeholder__title" />
          <div className="product-placeholder__line" />
          <div className="product-placeholder__line" />
          <div className="product-placeholder__options" />
          <div className="product-placeholder__options" />
        </div>
      </div>
    </main>
  )
}
