/**
 * Catalog image sizing (listing vs PDP):
 *
 * 1. **Vercel Image Optimization** (recommended without Supabase Pro)
 *    Set `VITE_CATALOG_IMAGE_OPTIMIZER=vercel` on Vercel. Uses `/_vercel/image?url=…&w=…&q=…`
 *    against your public Supabase URLs — no duplicate files in Storage.
 *
 * 2. **Supabase Storage transforms** (Pro)
 *    Set `VITE_CATALOG_IMAGE_TRANSFORMS=true` after enabling transforms in the dashboard.
 *
 * 3. **Fallback** — original full-size public URL (slow on grids).
 */
export type CatalogImageSize = 'thumb' | 'card' | 'hero' | 'zoom'

const WIDTH: Record<CatalogImageSize, number> = {
  thumb: 120,
  card: 480,
  hero: 1100,
  zoom: 2400,
}

const QUALITY: Record<CatalogImageSize, number> = {
  thumb: 72,
  card: 78,
  hero: 82,
  zoom: 88,
}

const OBJECT_PUBLIC = '/storage/v1/object/public/product-images/'
const RENDER_PUBLIC = '/storage/v1/render/image/public/product-images/'

const supabaseTransformsEnabled = import.meta.env.VITE_CATALOG_IMAGE_TRANSFORMS === 'true'
const vercelOptimizerEnabled = import.meta.env.VITE_CATALOG_IMAGE_OPTIMIZER === 'vercel'

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

function isSupabaseProductImageUrl(publicUrl: string): boolean {
  return publicUrl.includes(OBJECT_PUBLIC)
}

function supabaseTransformUrl(publicUrl: string, size: CatalogImageSize): string | null {
  const path = storagePathFromPublicUrl(publicUrl)
  const origin = projectOrigin(publicUrl)
  if (!path || !origin) return null

  const w = WIDTH[size]
  const q = QUALITY[size]
  return `${origin}${RENDER_PUBLIC}${path}?width=${w}&quality=${q}&resize=contain`
}

/** Vercel resizes remote Supabase URLs at the edge (works on Hobby; configure `images` in vercel.json). */
function vercelOptimizeUrl(publicUrl: string, size: CatalogImageSize): string {
  const w = WIDTH[size]
  const q = QUALITY[size]
  return `/_vercel/image?url=${encodeURIComponent(publicUrl)}&w=${w}&q=${q}`
}

export function catalogImageUrl(publicUrl: string, size: CatalogImageSize): string {
  if (!publicUrl?.trim()) return publicUrl

  if (supabaseTransformsEnabled && isSupabaseProductImageUrl(publicUrl)) {
    return supabaseTransformUrl(publicUrl, size) ?? publicUrl
  }

  if (vercelOptimizerEnabled && import.meta.env.PROD && isSupabaseProductImageUrl(publicUrl)) {
    return vercelOptimizeUrl(publicUrl, size)
  }

  return publicUrl
}

export function catalogImageSrcSet(publicUrl: string, size: CatalogImageSize): { src: string; fallback: string } {
  const fallback = publicUrl
  return { src: catalogImageUrl(publicUrl, size), fallback }
}
