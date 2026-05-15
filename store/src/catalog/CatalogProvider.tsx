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
import type { CatalogProduct } from './types.ts'
import { STORE_BUILD_ID } from './buildInfo.ts'
import { loadCatalogFromSupabase, type CatalogDiagnostics } from './loadCatalog.ts'

type CatalogContextValue = {
  products: CatalogProduct[]
  loading: boolean
  error: string | null
  diagnostics: CatalogDiagnostics | null
  buildId: string
  refetch: () => void
}

const CatalogContext = createContext<CatalogContextValue | null>(null)

const CatalogProductsContext = createContext<CatalogProduct[] | null>(null)

const emptyDiagnostics = (): CatalogDiagnostics => ({
  configured: false,
  loadedAt: null,
  productCount: 0,
  variantCount: 0,
  productsWithoutVariants: 0,
  productsWithoutPricing: 0,
  loadMethod: 'none',
  productsError: null,
  variantsError: null,
  warning: null,
  buildId: STORE_BUILD_ID,
})

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
  const [diagnostics, setDiagnostics] = useState<CatalogDiagnostics | null>(null)

  const load = useCallback(async () => {
    if (!isSupabaseCatalogConfigured) {
      startTransition(() => {
        setProducts([])
        setLoading(false)
        setError('Catalog not configured (set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY).')
        setDiagnostics({
          ...emptyDiagnostics(),
          warning: 'Supabase URL or anon key missing in this build.',
        })
      })
      return
    }
    startTransition(() => {
      setLoading(true)
      setError(null)
    })
    try {
      const supabase = getSupabaseBrowserClient()
      const result = await loadCatalogFromSupabase(supabase, STORE_BUILD_ID)
      startTransition(() => {
        setProducts(result.products)
        setDiagnostics(result.diagnostics)
        setError(
          result.diagnostics.variantCount === 0 && result.products.length > 0
            ? result.diagnostics.warning ?? 'Catalog loaded without variant pricing.'
            : null
        )
      })
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to load catalog'
      console.error('[catalog] load failed:', e)
      startTransition(() => {
        setError(message)
        setProducts([])
        setDiagnostics({
          ...emptyDiagnostics(),
          configured: true,
          loadedAt: new Date().toISOString(),
          warning: message,
        })
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
      diagnostics,
      buildId: STORE_BUILD_ID,
      refetch: () => {
        void load()
      },
    }),
    [products, loading, error, diagnostics, load]
  )

  return (
    <CatalogContext.Provider value={value}>
      <CatalogProductsContext.Provider value={products}>{children}</CatalogProductsContext.Provider>
    </CatalogContext.Provider>
  )
}
