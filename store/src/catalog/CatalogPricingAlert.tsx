import type { CatalogDiagnostics } from './loadCatalog.ts'
import type { CatalogProduct } from './types.ts'

type Props = {
  product?: CatalogProduct
  catalogError: string | null
  catalogLoading: boolean
  diagnostics: CatalogDiagnostics | null
  onRetry?: () => void
}

export function CatalogPricingAlert({ product, catalogError, catalogLoading, diagnostics, onRetry }: Props) {
  if (catalogLoading) return null

  const noVariants = product != null && product.variants.length === 0
  const noPricing =
    product != null &&
    product.variants.length > 0 &&
    product.variants.every((v) => v.pricing.sizes.length === 0)

  const show = Boolean(catalogError) || noVariants || noPricing || (diagnostics?.variantCount === 0 && (diagnostics?.productCount ?? 0) > 0)

  if (!show) return null

  const title = catalogError
    ? 'Catalog could not load'
    : noVariants
      ? 'Sizes and prices not available'
      : 'Pricing data incomplete'

  const detail =
    catalogError ??
    diagnostics?.warning ??
    (noVariants
      ? 'This product has no variant rows in the database, or the storefront failed to load them.'
      : 'Variant rows exist but contain no size labels or PKR amounts.')

  return (
    <div className="catalog-pricing-alert" role="alert">
      <p className="catalog-pricing-alert-title">{title}</p>
      <p className="catalog-pricing-alert-detail">{detail}</p>
      {diagnostics ? (
        <ul className="catalog-pricing-alert-meta">
          <li>Products: {diagnostics.productCount}</li>
          <li>Variants loaded: {diagnostics.variantCount}</li>
          <li>Load method: {diagnostics.loadMethod}</li>
          {diagnostics.productsWithoutVariants > 0 ? (
            <li>Products missing variants: {diagnostics.productsWithoutVariants}</li>
          ) : null}
          {product ? <li>This product slug: {product.slug}</li> : null}
        </ul>
      ) : null}
      {onRetry ? (
        <button type="button" className="catalog-pricing-alert-retry" onClick={onRetry}>
          Retry loading catalog
        </button>
      ) : null}
    </div>
  )
}
