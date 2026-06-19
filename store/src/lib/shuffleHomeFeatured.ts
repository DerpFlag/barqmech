import type { CatalogProduct } from '../catalog/types.ts'
import { featuredCategories, type FeaturedCategory } from '../data/catalog.ts'

/** Fisher–Yates shuffle (mutates copy). */
export function shuffleArray<T>(items: readonly T[]): T[] {
  const copy = [...items]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const tmp = copy[i]!
    copy[i] = copy[j]!
    copy[j] = tmp
  }
  return copy
}

/** One shuffled list per category for home page carousels (images required). */
export function shuffleHomeFeaturedByCategory(
  products: CatalogProduct[],
  perCategory = 10,
): Record<FeaturedCategory, CatalogProduct[]> {
  const limit = Math.max(1, perCategory)
  return Object.fromEntries(
    featuredCategories.map((category) => [
      category,
      shuffleArray(products.filter((p) => p.category === category && p.images.length > 0)).slice(0, limit),
    ]),
  ) as Record<FeaturedCategory, CatalogProduct[]>
}
