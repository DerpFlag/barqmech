import type { CatalogDiagnostics } from './loadCatalog.ts'
import type { CatalogProduct } from './types.ts'

type Props = {
  product?: CatalogProduct
  catalogError: string | null
  catalogLoading: boolean
  diagnostics: CatalogDiagnostics | null
  buildId?: string
  variantRescueError?: string | null
  variantRescueLoading?: boolean
  onRetry?: () => void
}

export function CatalogPricingAlert({
  product,
  catalogError,
  catalogLoading,
  diagnostics,
  buildId,
  variantRescueError,
  variantRescueLoading,
  onRetry,
}: Props) {
  if (catalogLoading && !product) return null

  const noVariants = product != null && product.variants.length === 0
  const noPricing =
    product != null &&
    product.variants.length > 0 &&
    product.variants.every((v) => v.pricing.sizes.length === 0)

  const globalMissing =
    (diagnostics?.variantCount === 0 && (diagnostics?.productCount ?? 0) > 0) ||
    Boolean(catalogError)

  const show =
    Boolean(catalogError) ||
    noVariants ||
    noPricing ||
    globalMissing ||
    Boolean(variantRescueError)

  if (!show && !variantRescueLoading) return null

  const title = catalogError
    ? 'Catalog could not load'
    : variantRescueLoading
      ? 'Loading prices…'
      : noVariants
        ? 'Sizes and prices not available'
        : 'Pricing data incomplete'

  const detail =
    catalogError ??
    variantRescueError ??
    diagnostics?.warning ??
    (noVariants
      ? 'Variant pricing did not load. Try Retry below, or hard refresh (Ctrl+Shift+R). If Build ID looks old, wait for deploy.'
      : 'Variant rows exist but contain no size labels or PKR amounts.')

  const displayBuild = buildId ?? diagnostics?.buildId ?? 'unknown'

  return (
    <div className="catalog-pricing-alert" role="alert">
      <p className="catalog-pricing-alert-title">{title}</p>
      <p className="catalog-pricing-alert-detail">{detail}</p>
      <ul className="catalog-pricing-alert-meta">
        <li>Store build: {displayBuild}</li>
        {diagnostics ? (
          <>
            <li>Products: {diagnostics.productCount}</li>
            <li>Variants loaded: {diagnostics.variantCount}</li>
            <li>Load method: {diagnostics.loadMethod}</li>
          </>
        ) : null}
        {product ? <li>This product: {product.slug}</li> : null}
        {product ? <li>Variants on this page: {product.variants.length}</li> : null}
      </ul>
      {onRetry ? (
        <button type="button" className="catalog-pricing-alert-retry" onClick={onRetry}>
          Retry loading catalog
        </button>
      ) : null}
    </div>
  )
}
