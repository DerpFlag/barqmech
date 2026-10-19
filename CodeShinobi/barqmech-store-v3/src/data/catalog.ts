import categoryImageDimensions from './category-image-dimensions.json'
import islamicVideoUrl from '../assets/optimized/collection/islamic.mp4?url'
import artworkVideoUrl from '../assets/optimized/collection/artwork.mp4?url'
import panelsVideoUrl from '../assets/optimized/collection/panels.mp4?url'
import customUtilityVideoUrl from '../assets/optimized/collection/custom-utility.mp4?url'

import finalLogoUrl from '../assets/optimized/logo.webp?url'
import heroBgVideoUrl from '../assets/optimized/hero-desktop.mp4?url'

const categoryPics = import.meta.glob('../assets/optimized/categories/**/*.webp', {
  eager: true,
  as: 'url',
}) as Record<string, unknown>

function toResolvedUrl(value: unknown): string | null {
  if (typeof value === 'string' && value.length > 0) return value
  if (value && typeof value === 'object' && 'default' in value) {
    const d = (value as { default: unknown }).default
    if (typeof d === 'string' && d.length > 0) return d
  }
  return null
}

function imagesForFolder(folderName: string): string[] {
  const prefix = `../assets/optimized/categories/${folderName}/`
  const urls: string[] = []
  for (const [path, raw] of Object.entries(categoryPics)) {
    if (!path.startsWith(prefix)) continue
    const filename = path.split('/').pop() ?? ''
    const dimensions = categoryImageDimensions[filename.replace(/\.webp$/, '') as keyof typeof categoryImageDimensions]
    // Reject thumbnail-sized sources; do not upscale them into architectural tiles.
    const minimum = folderName === 'Metal Arts & Custom Fabrication' ? 550 : 360
    if (dimensions && (Math.min(...dimensions) < minimum || Math.max(...dimensions) < 500)) continue
    const u = toResolvedUrl(raw)
    if (u) urls.push(u)
  }
  return urls.sort((a, b) => a.localeCompare(b, 'en', { sensitivity: 'base', numeric: true }))
}

export { finalLogoUrl, heroBgVideoUrl }
export { default as heroMobileVideoUrl } from '../assets/optimized/hero-mobile.mp4?url'
export { default as heroPosterUrl } from '../assets/optimized/hero-poster.webp?url'

export const featuredCategories = ['Islamic', 'Artwork', 'Panels', 'Misc'] as const
export type FeaturedCategory = (typeof featuredCategories)[number]

export const collectionVideos: Record<FeaturedCategory, string> = {
  Islamic: islamicVideoUrl,
  Artwork: artworkVideoUrl,
  Panels: panelsVideoUrl,
  Misc: customUtilityVideoUrl,
}

export type { CatalogProduct as FeaturedItem } from '@store/catalog/types.ts'

export const categorySlugs: Record<FeaturedCategory, string> = {
  Islamic: 'islamic',
  Artwork: 'artwork',
  Panels: 'panels',
  Misc: 'misc',
}

export const slugToCategory = Object.fromEntries(
  Object.entries(categorySlugs).map(([category, slug]) => [slug, category as FeaturedCategory]),
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
  const digits = value.replace(/\D/g, '')
  if (!digits) return 0
  const numeric = Number(digits)
  return Number.isFinite(numeric) ? numeric : 0
}

export function formatPriceNoDecimals(value: number) {
  return `Rs. ${Math.round(value).toLocaleString()}`
}

export function placeOrderApiUrl() {
  const raw =
    typeof import.meta.env.VITE_API_ORIGIN === 'string' ? import.meta.env.VITE_API_ORIGIN.trim() : ''
  const base = raw.replace(/\/$/, '')
  return `${base}/api/place-order`
}

export const storefrontEmail = 'orders@barqmech.com'
export const storefrontPhoneTel = '+923480550654'
export const storefrontPhoneDisplay = '+92 348 0550654'
export const storefrontWhatsApp = 'https://wa.me/923480550654'
export const storefrontFacebookUrl = 'https://www.facebook.com/BarqMechOfficial/'
export const storefrontLinkedInUrl = 'https://www.linkedin.com/company/barqmech'

export function formatEstimatedDeliveryRange() {
  return '3–5 business days (nationwide)'
}
