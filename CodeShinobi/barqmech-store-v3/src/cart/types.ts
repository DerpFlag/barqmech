export type CartLine = {
  mergeKey: string
  productId: string
  slug: string
  categorySlug: string
  title: string
  imageUrl: string
  priceLabel: string
  unitPrice: number
  quantity: number
  size: string
  finish: string
  /** Matches CSV / DXF design code when product has multiple numbered designs. */
  designCode?: number
  woodenFrame?: boolean
  ledBacklight?: boolean
  installation?: boolean
}
