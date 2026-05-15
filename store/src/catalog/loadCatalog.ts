import type { SupabaseClient } from '@supabase/supabase-js'
import type { CatalogProduct } from './types.ts'
import { fetchAllCatalogVariants, normalizeVariantPricing, type CatalogVariantSelect } from './fetchCatalogVariants.ts'
import { minListPricePkr } from './pricing.ts'
import { formatPriceNoDecimals, type FeaturedCategory } from '../data/catalog.ts'

export type CatalogLoadMethod = 'embed' | 'embed+fallback' | 'fallback' | 'none'

export type CatalogDiagnostics = {
  configured: boolean
  loadedAt: string | null
  productCount: number
  variantCount: number
  productsWithoutVariants: number
  productsWithoutPricing: number
  loadMethod: CatalogLoadMethod
  embedError: string | null
  fallbackError: string | null
  warning: string | null
}

type RawVariant = CatalogVariantSelect

type RawProduct = {
  id: string
  slug: string
  category: string
  title: string
  image_urls: string[] | null
  catalog_variants: RawVariant[] | RawVariant | null
}

const PRODUCT_EMBED_SELECT = `
  id,
  slug,
  category,
  title,
  image_urls,
  catalog_variants (
    id,
    product_id,
    design_code,
    sort_order,
    pricing
  )
`

function normalizeImageUrls(raw: unknown): string[] {
  if (raw == null) return []
  if (Array.isArray(raw)) {
    return raw.filter((u): u is string => typeof u === 'string' && u.trim().length > 0).map((u) => u.trim())
  }
  if (typeof raw === 'string') {
    const t = raw.trim()
    if (!t) return []
    if (t.startsWith('[')) {
      try {
        const parsed = JSON.parse(t) as unknown
        if (Array.isArray(parsed)) {
          return parsed.filter((u): u is string => typeof u === 'string' && u.trim().length > 0).map((u) => u.trim())
        }
      } catch {
        /* fall through */
      }
    }
    return [t]
  }
  return []
}

/** PostgREST may return a single related row as an object instead of a one-element array. */
function normalizeEmbeddedVariants(raw: RawProduct['catalog_variants']): RawVariant[] {
  if (raw == null) return []
  if (Array.isArray(raw)) return raw
  if (typeof raw === 'object') return [raw as RawVariant]
  return []
}

function mapProduct(row: RawProduct, variants: RawVariant[]): CatalogProduct | null {
  const cat = row.category as FeaturedCategory
  if (!['Islamic', 'Artwork', 'Panels', 'Misc'].includes(cat)) return null

  const mappedVariants = variants
    .map((v) => ({
      id: v.id,
      product_id: v.product_id,
      design_code: v.design_code,
      sort_order: v.sort_order,
      pricing: normalizeVariantPricing(v.pricing),
    }))
    .sort((a, b) => a.design_code - b.design_code || a.sort_order - b.sort_order)

  return {
    id: row.id,
    slug: row.slug,
    category: cat,
    title: row.title,
    images: normalizeImageUrls(row.image_urls),
    variants: mappedVariants,
    price: formatPriceNoDecimals(minListPricePkr({ variants: mappedVariants })),
  }
}

function formatSupabaseError(err: unknown): string {
  if (err && typeof err === 'object') {
    const e = err as { message?: string; code?: string; details?: string; hint?: string }
    const parts = [e.message, e.code, e.details, e.hint].filter(Boolean)
    if (parts.length) return parts.join(' — ')
  }
  if (err instanceof Error) return err.message
  return String(err)
}

function buildDiagnostics(
  partial: Omit<CatalogDiagnostics, 'configured' | 'loadedAt'> & { configured?: boolean; loadedAt?: string | null }
): CatalogDiagnostics {
  return {
    configured: partial.configured ?? true,
    loadedAt: partial.loadedAt ?? new Date().toISOString(),
    productCount: partial.productCount,
    variantCount: partial.variantCount,
    productsWithoutVariants: partial.productsWithoutVariants,
    productsWithoutPricing: partial.productsWithoutPricing,
    loadMethod: partial.loadMethod,
    embedError: partial.embedError,
    fallbackError: partial.fallbackError,
    warning: partial.warning,
  }
}

function summarizeProducts(products: CatalogProduct[]): Pick<
  CatalogDiagnostics,
  'productCount' | 'variantCount' | 'productsWithoutVariants' | 'productsWithoutPricing'
> {
  const productCount = products.length
  const variantCount = products.reduce((n, p) => n + p.variants.length, 0)
  const productsWithoutVariants = products.filter((p) => p.variants.length === 0).length
  const productsWithoutPricing = products.filter((p) => parseFloat(p.price.replace(/[^0-9.]/g, '')) <= 0).length
  return { productCount, variantCount, productsWithoutVariants, productsWithoutPricing }
}

/** Merge fallback variant rows into embed rows (fallback wins when embed missed a product). */
function mergeVariantRows(embedRows: RawProduct[], fallback: CatalogVariantSelect[]): RawProduct[] {
  const fallbackByProduct = new Map<string, CatalogVariantSelect[]>()
  for (const v of fallback) {
    const list = fallbackByProduct.get(v.product_id) ?? []
    list.push(v)
    fallbackByProduct.set(v.product_id, list)
  }

  return embedRows.map((row) => {
    const embedded = normalizeEmbeddedVariants(row.catalog_variants)
    if (embedded.length > 0) return { ...row, catalog_variants: embedded }
    const fromFallback = fallbackByProduct.get(row.id) ?? []
    return { ...row, catalog_variants: fromFallback }
  })
}

export type CatalogLoadResult = {
  products: CatalogProduct[]
  diagnostics: CatalogDiagnostics
}

/**
 * Load catalog products + variant pricing.
 * 1) Embedded `catalog_variants` (one round trip).
 * 2) If too few variants loaded, paginate `catalog_variants` and merge.
 */
export async function loadCatalogFromSupabase(supabase: SupabaseClient): Promise<CatalogLoadResult> {
  let loadMethod: CatalogLoadMethod = 'embed'
  let embedError: string | null = null
  let fallbackError: string | null = null

  const { data: prodRows, error: pErr } = await supabase
    .from('catalog_products')
    .select(PRODUCT_EMBED_SELECT)
    .order('title', { ascending: true })

  if (pErr) {
    embedError = formatSupabaseError(pErr)
    throw new Error(`catalog_products: ${embedError}`)
  }

  let rows = (prodRows ?? []) as RawProduct[]
  let embedVariantCount = rows.reduce((n, r) => n + normalizeEmbeddedVariants(r.catalog_variants).length, 0)

  const needsFallback =
    rows.length > 0 &&
    (embedVariantCount === 0 || embedVariantCount < Math.min(500, rows.length * 0.5))

  if (needsFallback) {
    loadMethod = embedVariantCount > 0 ? 'embed+fallback' : 'fallback'
    try {
      const fallback = await fetchAllCatalogVariants(supabase)
      rows = mergeVariantRows(rows, fallback)
      embedVariantCount = rows.reduce((n, r) => n + normalizeEmbeddedVariants(r.catalog_variants).length, 0)
    } catch (e) {
      fallbackError = formatSupabaseError(e)
    }
  }

  const products = rows
    .map((row) => mapProduct(row, normalizeEmbeddedVariants(row.catalog_variants)))
    .filter((p): p is CatalogProduct => p != null)

  const summary = summarizeProducts(products)
  let warning: string | null = null

  if (summary.productsWithoutVariants > 0) {
    warning = `${summary.productsWithoutVariants} product(s) have no size/price data in Supabase.`
  } else if (summary.variantCount === 0 && rows.length > 0) {
    warning =
      'Products loaded but no variant pricing returned. Check Supabase RLS on catalog_variants and redeploy the latest store build.'
  }
  if (fallbackError) {
    warning = [warning, `Fallback variant fetch failed: ${fallbackError}`].filter(Boolean).join(' ')
  }
  if (embedError) {
    warning = [warning, `Embed query issue: ${embedError}`].filter(Boolean).join(' ')
  }

  const diagnostics = buildDiagnostics({
    ...summary,
    loadMethod: summary.variantCount > 0 ? loadMethod : 'none',
    embedError,
    fallbackError,
    warning,
  })

  console.info('[catalog]', {
    ...summary,
    loadMethod: diagnostics.loadMethod,
    warning: diagnostics.warning,
  })

  return { products, diagnostics }
}
