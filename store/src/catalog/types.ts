import type { FeaturedCategory } from '../data/catalog.ts'

export type CatalogSizeTier = {
  label: string
  Silver: number
  Gold: number
  Black: number
  wooden: number
  led: number
  install: number
}

export type CatalogPricing = {
  sizes: CatalogSizeTier[]
}

export type CatalogVariantRow = {
  id: string
  product_id: string
  design_code: number
  sort_order: number
  pricing: CatalogPricing
}

/** Storefront product shape (from Supabase + helpers). */
export type CatalogProduct = {
  id: string
  slug: string
  category: FeaturedCategory
  title: string
  images: string[]
  price: string
  variants: CatalogVariantRow[]
}
