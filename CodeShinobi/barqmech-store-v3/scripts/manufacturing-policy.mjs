// Panels remain orderable; their manufacturing DXF is supplied manually.
export const isManualDxfCategory = category => String(category ?? '').trim().toLowerCase() === 'panels'

export function seedDxfPath(product, variant) {
  return isManualDxfCategory(product.category) ? undefined : `${product.slug}/dc${variant.design_code}.dxf`
}
