import { createClient, type SupabaseClient } from '@supabase/supabase-js'

/** Trim, strip BOM, strip wrapping quotes (common when pasting from dashboards). */
function readViteString(key: 'VITE_SUPABASE_URL' | 'VITE_SUPABASE_ANON_KEY'): string {
  const raw = import.meta.env[key]
  if (typeof raw !== 'string') return ''
  let s = raw.trim().replace(/^\uFEFF/, '')
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    s = s.slice(1, -1).trim()
  }
  return s
}

const url = readViteString('VITE_SUPABASE_URL')
const anonKey = readViteString('VITE_SUPABASE_ANON_KEY')

function isValidHttpUrl(s: string): boolean {
  try {
    const u = new URL(s)
    return u.protocol === 'https:' || u.protocol === 'http:'
  } catch {
    return false
  }
}

/** True only when both values look usable (avoids half-configured clients). */
export const isSupabaseCatalogConfigured = Boolean(url && anonKey && isValidHttpUrl(url))

let client: SupabaseClient | null = null

export function getSupabaseBrowserClient(): SupabaseClient {
  if (!isSupabaseCatalogConfigured) {
    throw new Error('Missing or invalid VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY')
  }
  if (!client) {
    try {
      client = createClient(url, anonKey)
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Supabase client init failed'
      throw new Error(msg)
    }
  }
  return client
}
