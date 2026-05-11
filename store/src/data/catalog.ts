import introVideoUrl from '../../../Media/Final Video.mp4?url'
import finalLogoUrl from '../../../Media/Final Logo - Copy.png?url'
import catDoors1 from '../../../Media/category pics/Doors, Dividers & Gates/doors-dividers-and-gates-01.jpg?url'
import catDoors2 from '../../../Media/category pics/Doors, Dividers & Gates/doors-dividers-and-gates-04.jpg?url'
import catDoors3 from '../../../Media/category pics/Doors, Dividers & Gates/doors-dividers-and-gates-06.jpg?url'
import catIslamic1 from '../../../Media/category pics/Islamic & Decorative Screens/islamic-and-decorative-screens-01.jpg?url'
import catIslamic2 from '../../../Media/category pics/Islamic & Decorative Screens/islamic-and-decorative-screens-03.jpg?url'
import catIslamic3 from '../../../Media/category pics/Islamic & Decorative Screens/islamic-and-decorative-screens-04.jpg?url'
import catLamps1 from '../../../Media/category pics/Lamps & Lighting/lamps-and-lighting-01.jpg?url'
import catLamps2 from '../../../Media/category pics/Lamps & Lighting/lamps-and-lighting-02.jpg?url'
import catLamps3 from '../../../Media/category pics/Lamps & Lighting/lamps-and-lighting-04.jpg?url'
import catMetal1 from '../../../Media/category pics/Metal Arts & Custom Fabrication/metal-arts-and-custom-fabrication-01.jpg?url'
import catMetal2 from '../../../Media/category pics/Metal Arts & Custom Fabrication/metal-arts-and-custom-fabrication-03.jpg?url'
import catMetal3 from '../../../Media/category pics/Metal Arts & Custom Fabrication/metal-arts-and-custom-fabrication-05.jpg?url'
import catRacks1 from '../../../Media/category pics/Racks & Storage/racks-and-storage-01.jpg?url'
import catRacks2 from '../../../Media/category pics/Racks & Storage/racks-and-storage-02.jpg?url'
import catRacks3 from '../../../Media/category pics/Racks & Storage/racks-and-storage-04.jpg?url'
import catStairs1 from '../../../Media/category pics/Stairs & Railings/stairs-and-railings-01.jpg?url'
import catStairs2 from '../../../Media/category pics/Stairs & Railings/stairs-and-railings-03.jpg?url'
import catStairs3 from '../../../Media/category pics/Stairs & Railings/stairs-and-railings-06.jpg?url'
import catWalls1 from '../../../Media/category pics/Walls, Windows & Ceiling Panels/walls-windows-and-ceiling-panels-01.jpg?url'
import catWalls2 from '../../../Media/category pics/Walls, Windows & Ceiling Panels/walls-windows-and-ceiling-panels-08.jpg?url'
import catWalls3 from '../../../Media/category pics/Walls, Windows & Ceiling Panels/walls-windows-and-ceiling-panels-10.jpg?url'

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
    images: [catMetal1, catMetal2, catMetal3],
    intervalMs: 3600,
    className: 'tile-a',
  },
  {
    id: 'doors-dividers-gates',
    title: 'Doors, Dividers & Gates',
    images: [catDoors1, catDoors2, catDoors3],
    intervalMs: 2900,
    className: 'tile-b',
  },
  {
    id: 'racks-storage',
    title: 'Racks & Storage',
    images: [catRacks1, catRacks2, catRacks3],
    intervalMs: 4200,
    className: 'tile-c',
  },
  {
    id: 'lamps-lighting',
    title: 'Lamps & Lighting',
    images: [catLamps1, catLamps2, catLamps3],
    intervalMs: 3300,
    className: 'tile-d',
  },
  {
    id: 'stairs-railings',
    title: 'Stairs & Railings',
    images: [catStairs1, catStairs2, catStairs3],
    intervalMs: 2600,
    className: 'tile-e',
  },
  {
    id: 'islamic-decorative-screens',
    title: 'Islamic & Decorative Screens',
    images: [catIslamic1, catIslamic2, catIslamic3],
    intervalMs: 3900,
    className: 'tile-f',
  },
  {
    id: 'walls-windows-ceiling-panels',
    title: 'Walls, Windows & Ceiling Panels',
    images: [catWalls1, catWalls2, catWalls3],
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
