import type { CatalogProduct } from '../catalog/types.ts'

const PREVIEW_LIMIT = 5

export { PREVIEW_LIMIT }

/** Match products by title (case-insensitive substring). */
export function searchProductsByName(products: CatalogProduct[], rawQuery: string): CatalogProduct[] {
  const q = rawQuery.trim().toLowerCase()
  if (!q) return []

  const scored = products
    .map((product) => {
      const title = product.title.toLowerCase()
      let rank = 2
      if (title.startsWith(q)) rank = 0
      else if (title.includes(q)) rank = 1
      else return null
      return { product, rank }
    })
    .filter((row): row is { product: CatalogProduct; rank: number } => row != null)

  scored.sort((a, b) => {
    if (a.rank !== b.rank) return a.rank - b.rank
    return a.product.title.localeCompare(b.product.title, undefined, { sensitivity: 'base' })
  })

  return scored.map((row) => row.product)
}

export function buildProductSearchPath(query: string): string {
  const q = query.trim()
  if (!q) return '/products/search'
  return `/products/search?q=${encodeURIComponent(q)}`
}
