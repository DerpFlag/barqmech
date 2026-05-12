import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  startTransition,
  type ReactNode,
} from 'react'
import { getSupabaseBrowserClient, isSupabaseCatalogConfigured } from '../lib/supabaseClient.ts'
import type { CatalogProduct, CatalogVariantRow } from './types.ts'
import { minListPricePkr } from './pricing.ts'
import { formatPriceNoDecimals, type FeaturedCategory } from '../data/catalog.ts'

type RawVariant = {
  id: string
  product_id: string
  design_code: number
  sort_order: number
  pricing: unknown
}

type RawProduct = {
  id: string
  slug: string
  category: string
  title: string
  image_urls: string[] | null
  catalog_variants: RawVariant[] | null
}

function normalizePricing(raw: unknown): CatalogVariantRow['pricing'] {
  const p = raw as { sizes?: CatalogVariantRow['pricing']['sizes'] }
  const sizes = Array.isArray(p?.sizes) ? p.sizes : []
  return { sizes }
}

function mapProduct(row: RawProduct): CatalogProduct | null {
  const cat = row.category as FeaturedCategory
  if (!['Islamic', 'Artwork', 'Panels', 'Misc'].includes(cat)) return null
  const variants = (row.catalog_variants ?? [])
    .map((v) => ({
      id: v.id,
      product_id: v.product_id,
      design_code: v.design_code,
      sort_order: v.sort_order,
      pricing: normalizePricing(v.pricing),
    }))
    .sort((a, b) => a.design_code - b.design_code || a.sort_order - b.sort_order)

  const images = row.image_urls ?? []
  const base: CatalogProduct = {
    id: row.id,
    slug: row.slug,
    category: cat,
    title: row.title,
    images,
    variants,
    price: formatPriceNoDecimals(minListPricePkr({ variants })),
  }
  return base
}

type CatalogContextValue = {
  products: CatalogProduct[]
  loading: boolean
  error: string | null
  refetch: () => void
}

const CatalogContext = createContext<CatalogContextValue | null>(null)

/** Products only — avoids re-rendering home when `loading` flips (same catalog data). */
const CatalogProductsContext = createContext<CatalogProduct[] | null>(null)

export function useCatalog() {
  const ctx = useContext(CatalogContext)
  if (!ctx) throw new Error('useCatalog must be used within CatalogProvider')
  return ctx
}

export function useCatalogProducts(): CatalogProduct[] {
  const products = useContext(CatalogProductsContext)
  if (products === null) throw new Error('useCatalogProducts must be used within CatalogProvider')
  return products
}

export function CatalogProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<CatalogProduct[]>([])
  const [loading, setLoading] = useState(isSupabaseCatalogConfigured)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!isSupabaseCatalogConfigured) {
      startTransition(() => {
        setProducts([])
        setLoading(false)
        setError('Catalog not configured (set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY).')
      })
      return
    }
    startTransition(() => {
      setLoading(true)
      setError(null)
    })
    try {
      const supabase = getSupabaseBrowserClient()
      const { data: prodRows, error: pErr } = await supabase
        .from('catalog_products')
        .select('id, slug, category, title, image_urls')
        .order('title', { ascending: true })
      if (pErr) throw pErr
      const productsRaw = (prodRows ?? []) as Omit<RawProduct, 'catalog_variants'>[]
      const ids = productsRaw.map((p) => p.id)
      const variantsByProduct = new Map<string, RawVariant[]>()
      if (ids.length) {
        const { data: varRows, error: vErr } = await supabase
          .from('catalog_variants')
          .select('id, product_id, design_code, sort_order, pricing')
          .in('product_id', ids)
        if (vErr) throw vErr
        for (const v of (varRows ?? []) as RawVariant[]) {
          const list = variantsByProduct.get(v.product_id) ?? []
          list.push(v)
          variantsByProduct.set(v.product_id, list)
        }
      }
      const rows: RawProduct[] = productsRaw.map((p) => ({
        ...p,
        catalog_variants: variantsByProduct.get(p.id) ?? [],
      }))
      const mapped = rows.map(mapProduct).filter((p): p is CatalogProduct => p != null)
      startTransition(() => {
        setProducts(mapped)
      })
    } catch (e) {
      startTransition(() => {
        setError(e instanceof Error ? e.message : 'Failed to load catalog')
        setProducts([])
      })
    } finally {
      startTransition(() => {
        setLoading(false)
      })
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const value = useMemo<CatalogContextValue>(
    () => ({
      products,
      loading,
      error,
      refetch: () => {
        void load()
      },
    }),
    [products, loading, error, load]
  )

  return (
    <CatalogContext.Provider value={value}>
      <CatalogProductsContext.Provider value={products}>{children}</CatalogProductsContext.Provider>
    </CatalogContext.Provider>
  )
}
