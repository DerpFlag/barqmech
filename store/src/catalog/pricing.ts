import type { CatalogProduct, CatalogVariantRow } from './types.ts'

export const PDP_FINISHES = ['Silver', 'Gold', 'Black'] as const
export type PdpFinish = (typeof PDP_FINISHES)[number]

export function minListPricePkr(product: Pick<CatalogProduct, 'variants'>): number {
  let min = Number.POSITIVE_INFINITY
  for (const v of product.variants) {
    for (const s of v.pricing.sizes) {
      min = Math.min(min, s.Silver, s.Gold, s.Black)
    }
  }
  return Number.isFinite(min) ? Math.round(min) : 0
}

export function finishKey(finish: string): 'Silver' | 'Gold' | 'Black' {
  if (finish === 'Gold') return 'Gold'
  if (finish === 'Black') return 'Black'
  return 'Silver'
}

export function unitPricePkr(
  variant: CatalogVariantRow,
  sizeLabel: string,
  finish: string,
  woodenFrame: boolean,
  ledBacklight: boolean,
  installation: boolean
): number {
  const tier = variant.pricing.sizes.find((s) => s.label === sizeLabel)
  if (!tier) return 0
  const fk = finishKey(finish)
  let total = tier[fk]
  if (woodenFrame) total += tier.wooden
  if (ledBacklight) total += tier.led
  if (installation) total += tier.install
  return Math.round(total)
}

export function variantByDesignCode(variants: CatalogVariantRow[], code: number): CatalogVariantRow | undefined {
  return variants.find((v) => v.design_code === code)
}

/** Smallest design code for default selection (prefers positive codes when present). */
export function defaultDesignCode(variants: CatalogVariantRow[]): number {
  if (variants.length === 0) return 0
  const codes = variants.map((v) => v.design_code).sort((a, b) => a - b)
  const positive = codes.filter((c) => c > 0)
  if (positive.length) return positive[0]
  return codes[0]
}

export function designCodeRange(variants: CatalogVariantRow[]): { min: number; max: number } | null {
  if (variants.length < 2) return null
  const codes = variants.map((v) => v.design_code)
  const min = Math.min(...codes)
  const max = Math.max(...codes)
  if (min === max) return null
  return { min, max }
}
