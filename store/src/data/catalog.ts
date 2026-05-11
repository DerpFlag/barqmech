import introVideoUrl from '../../../Media/Final Video.mp4?url'
import finalLogoUrl from '../../../Media/Final Logo - Copy.png?url'

// Eagerly import all JPG/PNG/WebP category pics so homepage tiles can rotate through every asset
// inside each category folder (not just three hard-coded ones).
const categoryPics = import.meta.glob('../../../Media/category pics/**/*.{jpg,jpeg,png,webp}', {
  eager: true,
  as: 'url',
}) as Record<string, string>

function imagesForFolder(folderName: string): string[] {
  const prefix = `../../../Media/category pics/${folderName}/`
  return Object.entries(categoryPics)
    .filter(([path]) => path.startsWith(prefix))
    .map(([, url]) => url)
    .sort((a, b) => a.localeCompare(b, 'en', { sensitivity: 'base', numeric: true }))
}

export { introVideoUrl, finalLogoUrl }

export const featuredCategories = ['Islamic', 'Artwork', 'Panels', 'Misc'] as const
export type FeaturedCategory = (typeof featuredCategories)[number]

export type { CatalogProduct as FeaturedItem } from '../catalog/types.ts'

export const categorySlugs: Record<FeaturedCategory, string> = {
  Islamic: 'islamic',
  Artwork: 'artwork',
  Panels: 'panels',
  Misc: 'misc',
}

export const slugToCategory = Object.fromEntries(
  Object.entries(categorySlugs).map(([category, slug]) => [slug, category as FeaturedCategory])
) as Record<string, FeaturedCategory>

export const featuredDescriptions: Record<FeaturedCategory, string> = {
  Islamic:
    'Precision-crafted Islamic patterns and calligraphy-inspired metalwork for modern and traditional spaces.',
  Artwork: 'Statement metal art pieces designed to elevate interiors with custom forms, textures, and finishes.',
  Panels:
    'Functional and decorative panel solutions for doors, railings, windows, and architectural facades.',
  Misc: 'Versatile utility builds including racks, shelves, storage systems, and specialized lighting fixtures.',
}

export const galleryTiles = [
  {
    id: 'metal-arts-custom-fabrication',
    title: 'Metal Arts & Custom Fabrication',
    images: imagesForFolder('Metal Arts & Custom Fabrication'),
    intervalMs: 3600,
    className: 'tile-a',
  },
  {
    id: 'doors-dividers-gates',
    title: 'Doors, Dividers & Gates',
    images: imagesForFolder('Doors, Dividers & Gates'),
    intervalMs: 2900,
    className: 'tile-b',
  },
  {
    id: 'racks-storage',
    title: 'Racks & Storage',
    images: imagesForFolder('Racks & Storage'),
    intervalMs: 4200,
    className: 'tile-c',
  },
  {
    id: 'lamps-lighting',
    title: 'Lamps & Lighting',
    images: imagesForFolder('Lamps & Lighting'),
    intervalMs: 3300,
    className: 'tile-d',
  },
  {
    id: 'stairs-railings',
    title: 'Stairs & Railings',
    images: imagesForFolder('Stairs & Railings'),
    intervalMs: 2600,
    className: 'tile-e',
  },
  {
    id: 'islamic-decorative-screens',
    title: 'Islamic & Decorative Screens',
    images: imagesForFolder('Islamic & Decorative Screens'),
    intervalMs: 3900,
    className: 'tile-f',
  },
  {
    id: 'walls-windows-ceiling-panels',
    title: 'Walls, Windows & Ceiling Panels',
    images: imagesForFolder('Walls, Windows & Ceiling Panels'),
    intervalMs: 3500,
    className: 'tile-g',
  },
]

export const galleryTileRouteCategory: Record<string, FeaturedCategory> = {
  'metal-arts-custom-fabrication': 'Artwork',
  'doors-dividers-gates': 'Panels',
  'racks-storage': 'Misc',
  'lamps-lighting': 'Misc',
  'stairs-railings': 'Panels',
  'islamic-decorative-screens': 'Islamic',
  'walls-windows-ceiling-panels': 'Panels',
}

export function parsePrice(value: string) {
  const numeric = Number(value.replace(/[^0-9.]/g, ''))
  return Number.isFinite(numeric) ? numeric : 0
}

export function formatPriceNoDecimals(value: number) {
  return `Rs. ${Math.round(value).toLocaleString()}`
}

/** Shipping per unit by panel size (shown at checkout; COD includes this total). */
export function shippingPerUnitForSize(size: string) {
  if (size.startsWith('12')) return 800
  if (size.startsWith('18')) return 1200
  if (size.startsWith('24')) return 1800
  return 1000
}

/** Same-origin on Vercel; optional absolute origin for unusual hosts. */
export function placeOrderApiUrl() {
  const raw =
    typeof import.meta.env.VITE_API_ORIGIN === 'string' ? import.meta.env.VITE_API_ORIGIN.trim() : ''
  const base = raw.replace(/\/$/, '')
  return `${base}/api/place-order`
}

/** E.164 without `tel:` prefix — used in PDP support links. */
export const storefrontPhoneTel = '+923082779843'

/** WhatsApp click-to-chat base URL (no `?text=`). */
export const storefrontWhatsApp = 'https://wa.me/923082779843'

/** Human-readable delivery estimate shown on product pages. */
export function formatEstimatedDeliveryRange() {
  return '3–5 business days (nationwide)'
}
