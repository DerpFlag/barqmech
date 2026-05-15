import type { SupabaseClient } from '@supabase/supabase-js'
import type { CatalogProduct, CatalogVariantRow } from './types.ts'
import {
  fetchAllCatalogVariants,
  fetchVariantsForProduct,
  normalizeVariantPricing,
  type CatalogVariantSelect,
} from './fetchCatalogVariants.ts'
import { minListPricePkr } from './pricing.ts'
import { formatPriceNoDecimals, type FeaturedCategory } from '../data/catalog.ts'

export type CatalogLoadMethod = 'split' | 'none'

export type CatalogDiagnostics = {
  configured: boolean
  loadedAt: string | null
  productCount: number
  variantCount: number
  productsWithoutVariants: number
  productsWithoutPricing: number
  loadMethod: CatalogLoadMethod
  productsError: string | null
  variantsError: string | null
  warning: string | null
  buildId: string
}

type RawProductRow = {
  id: string
  slug: string
  category: string
  title: string
  image_urls: string[] | null
}

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

function mapVariants(rows: CatalogVariantSelect[]): CatalogVariantRow[] {
  return rows
    .map((v) => ({
      id: v.id,
      product_id: v.product_id,
      design_code: v.design_code,
      sort_order: v.sort_order,
      pricing: normalizeVariantPricing(v.pricing),
    }))
    .sort((a, b) => a.design_code - b.design_code || a.sort_order - b.sort_order)
}

function mapProduct(row: RawProductRow, variantRows: CatalogVariantSelect[]): CatalogProduct | null {
  const cat = row.category as FeaturedCategory
  if (!['Islamic', 'Artwork', 'Panels', 'Misc'].includes(cat)) return null
  const variants = mapVariants(variantRows)
  return {
    id: row.id,
    slug: row.slug,
    category: cat,
    title: row.title,
    images: normalizeImageUrls(row.image_urls),
    variants,
    price: formatPriceNoDecimals(minListPricePkr({ variants })),
  }
}

export function mergeVariantsIntoProduct(product: CatalogProduct, variantRows: CatalogVariantRow[]): CatalogProduct {
  return {
    ...product,
    variants: variantRows,
    price: formatPriceNoDecimals(minListPricePkr({ variants: variantRows })),
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

function summarizeProducts(products: CatalogProduct[]) {
  return {
    productCount: products.length,
    variantCount: products.reduce((n, p) => n + p.variants.length, 0),
    productsWithoutVariants: products.filter((p) => p.variants.length === 0).length,
    productsWithoutPricing: products.filter((p) => parseFloat(p.price.replace(/[^0-9.]/g, '')) <= 0).length,
  }
}

export type CatalogLoadResult = {
  products: CatalogProduct[]
  diagnostics: CatalogDiagnostics
}

/**
 * Reliable catalog load: small product query + paginated variant query (no 1.4MB embed).
 */
export async function loadCatalogFromSupabase(
  supabase: SupabaseClient,
  buildId: string
): Promise<CatalogLoadResult> {
  let productsError: string | null = null
  let variantsError: string | null = null

  const { data: prodRows, error: pErr } = await supabase
    .from('catalog_products')
    .select('id, slug, category, title, image_urls')
    .order('title', { ascending: true })

  if (pErr) {
    productsError = formatSupabaseError(pErr)
    throw new Error(`catalog_products: ${productsError}`)
  }

  const productRows = (prodRows ?? []) as RawProductRow[]
  let allVariants: CatalogVariantSelect[] = []

  try {
    allVariants = await fetchAllCatalogVariants(supabase)
  } catch (e) {
    variantsError = formatSupabaseError(e)
    throw new Error(`catalog_variants: ${variantsError}`)
  }

  const variantsByProduct = new Map<string, CatalogVariantSelect[]>()
  for (const v of allVariants) {
    const list = variantsByProduct.get(v.product_id) ?? []
    list.push(v)
    variantsByProduct.set(v.product_id, list)
  }

  const products = productRows
    .map((row) => mapProduct(row, variantsByProduct.get(row.id) ?? []))
    .filter((p): p is CatalogProduct => p != null)

  const summary = summarizeProducts(products)
  let warning: string | null = null

  if (summary.variantCount === 0 && summary.productCount > 0) {
    warning = 'Products loaded but no variant pricing rows were returned from Supabase.'
  } else if (summary.productsWithoutVariants > 0) {
    warning = `${summary.productsWithoutVariants} product(s) have no variant rows in the database.`
  }

  const diagnostics: CatalogDiagnostics = {
    configured: true,
    loadedAt: new Date().toISOString(),
    ...summary,
    loadMethod: summary.variantCount > 0 ? 'split' : 'none',
    productsError,
    variantsError,
    warning,
    buildId,
  }

  console.info('[catalog]', diagnostics)

  return { products, diagnostics }
}

/** PDP safety net when global catalog row has no variants. */
export async function loadVariantsForProductId(
  supabase: SupabaseClient,
  productId: string
): Promise<{ variants: CatalogVariantRow[]; error: string | null }> {
  try {
    const rows = await fetchVariantsForProduct(supabase, productId)
    return { variants: mapVariants(rows), error: null }
  } catch (e) {
    return { variants: [], error: formatSupabaseError(e) }
  }
}
