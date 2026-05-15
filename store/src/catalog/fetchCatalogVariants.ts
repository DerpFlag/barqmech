import type { SupabaseClient } from '@supabase/supabase-js'
import type { CatalogSizeTier } from './types.ts'

export type CatalogVariantSelect = {
  id: string
  product_id: string
  design_code: number
  sort_order: number
  pricing: unknown
}

const PAGE_SIZE = 1000

function intPrice(v: unknown): number {
  const n = Math.round(Number(String(v ?? '').replace(/,/g, '')))
  return Number.isFinite(n) ? n : 0
}

/** Normalize variant pricing from DB (handles string JSON and legacy key casing). */
export function normalizeVariantPricing(raw: unknown): { sizes: CatalogSizeTier[] } {
  let p: unknown = raw
  if (typeof p === 'string') {
    try {
      p = JSON.parse(p) as unknown
    } catch {
      return { sizes: [] }
    }
  }
  const obj = p as { sizes?: unknown[] }
  if (!Array.isArray(obj?.sizes)) return { sizes: [] }

  const sizes: CatalogSizeTier[] = []
  for (const row of obj.sizes) {
    if (!row || typeof row !== 'object') continue
    const o = row as Record<string, unknown>
    const label = String(o.label ?? o.size ?? '').trim()
    if (!label) continue
    sizes.push({
      label,
      Silver: intPrice(o.Silver ?? o.silver),
      Gold: intPrice(o.Gold ?? o.gold ?? o.golden),
      Black: intPrice(o.Black ?? o.black),
      wooden: intPrice(o.wooden ?? o.wooden_frame),
      led: intPrice(o.led),
      install: intPrice(o.install ?? o.installation),
    })
  }
  return { sizes }
}

/**
 * Load all catalog_variants with pagination (PostgREST max 1000 rows/request).
 * Avoids `.in(product_id, …)` with 300+ UUIDs — that URL can fail in browsers/CDNs.
 */
export async function fetchAllCatalogVariants(
  supabase: SupabaseClient,
  productIds?: string[]
): Promise<CatalogVariantSelect[]> {
  const filter = productIds?.length ? new Set(productIds) : null
  const all: CatalogVariantSelect[] = []
  let from = 0

  while (true) {
    const { data, error } = await supabase
      .from('catalog_variants')
      .select('id, product_id, design_code, sort_order, pricing')
      .order('product_id', { ascending: true })
      .order('design_code', { ascending: true })
      .range(from, from + PAGE_SIZE - 1)

    if (error) throw error
    const batch = (data ?? []) as CatalogVariantSelect[]
    if (filter) {
      for (const row of batch) {
        if (filter.has(row.product_id)) all.push(row)
      }
    } else {
      all.push(...batch)
    }
    if (batch.length < PAGE_SIZE) break
    from += PAGE_SIZE
  }

  return all
}
