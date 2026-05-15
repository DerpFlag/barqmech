import type { SupabaseClient } from '@supabase/supabase-js'

export type CatalogVariantSelect = {
  id: string
  product_id: string
  design_code: number
  sort_order: number
  pricing: unknown
}

const PAGE_SIZE = 1000

/** PostgREST caps at 1000 rows per request — paginate so every product gets variants. */
export async function fetchAllCatalogVariants(
  supabase: SupabaseClient,
  productIds: string[]
): Promise<CatalogVariantSelect[]> {
  if (!productIds.length) return []

  const all: CatalogVariantSelect[] = []
  let from = 0

  while (true) {
    const { data, error } = await supabase
      .from('catalog_variants')
      .select('id, product_id, design_code, sort_order, pricing')
      .in('product_id', productIds)
      .order('product_id', { ascending: true })
      .order('design_code', { ascending: true })
      .range(from, from + PAGE_SIZE - 1)

    if (error) throw error
    const batch = (data ?? []) as CatalogVariantSelect[]
    all.push(...batch)
    if (batch.length < PAGE_SIZE) break
    from += PAGE_SIZE
  }

  return all
}
