import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = typeof import.meta.env.VITE_SUPABASE_URL === 'string' ? import.meta.env.VITE_SUPABASE_URL.trim() : ''
const anonKey =
  typeof import.meta.env.VITE_SUPABASE_ANON_KEY === 'string' ? import.meta.env.VITE_SUPABASE_ANON_KEY.trim() : ''

export const isSupabaseCatalogConfigured = Boolean(url && anonKey)

let client: SupabaseClient | null = null

export function getSupabaseBrowserClient(): SupabaseClient {
  if (!url || !anonKey) {
    throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY')
  }
  if (!client) {
    client = createClient(url, anonKey)
  }
  return client
}
