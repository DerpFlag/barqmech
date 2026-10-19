import type {ListingDraft} from '../src/admin/listing-types.ts'
export const categories:string[]
export const statuses:string[]
export function validateListing(input:unknown):ListingDraft
export function publicProduct(row:ListingDraft,details?:boolean):unknown
