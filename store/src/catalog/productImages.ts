/**
 * Optional Supabase Storage transforms (`/storage/v1/render/image/...`).
 * Off by default — this project returns 403 until transforms are enabled on the plan.
 * Set `VITE_CATALOG_IMAGE_TRANSFORMS=true` after enabling in Supabase dashboard.
 */
export type CatalogImageSize = 'thumb' | 'card' | 'hero' | 'zoom'

const WIDTH: Record<CatalogImageSize, number> = {
  thumb: 160,
  card: 560,
  hero: 1100,
  zoom: 2400,
}

const OBJECT_PUBLIC = '/storage/v1/object/public/product-images/'
const RENDER_PUBLIC = '/storage/v1/render/image/public/product-images/'

const transformsEnabled = import.meta.env.VITE_CATALOG_IMAGE_TRANSFORMS === 'true'

function projectOrigin(publicUrl: string): string | null {
  try {
    return new URL(publicUrl).origin
  } catch {
    return null
  }
}

function storagePathFromPublicUrl(publicUrl: string): string | null {
  const idx = publicUrl.indexOf(OBJECT_PUBLIC)
  if (idx === -1) return null
  return publicUrl.slice(idx + OBJECT_PUBLIC.length).split('?')[0] ?? null
}

export function catalogImageUrl(publicUrl: string, size: CatalogImageSize): string {
  if (!publicUrl?.trim() || !transformsEnabled) return publicUrl

  const path = storagePathFromPublicUrl(publicUrl)
  const origin = projectOrigin(publicUrl)
  if (!path || !origin) return publicUrl

  const w = WIDTH[size]
  const q = size === 'zoom' ? 88 : 78
  return `${origin}${RENDER_PUBLIC}${path}?width=${w}&quality=${q}&resize=contain`
}

export function catalogImageSrcSet(publicUrl: string, size: CatalogImageSize): { src: string; fallback: string } {
  const fallback = publicUrl
  return { src: catalogImageUrl(publicUrl, size), fallback }
}
