/**
 * Load Supabase URL + service role from gitignored Media/Keys.txt (for scripts only).
 */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const keysPath = resolve(__dirname, '../../Media/Keys.txt')

export function loadSupabaseServiceEnvFromKeysFile() {
  const raw = readFileSync(keysPath, 'utf8')
  const url = raw.match(/https:\/\/[a-z0-9-]+\.supabase\.co/)?.[0]
  const serviceRole =
    raw.match(/service role key\s*-\s*(eyJ[^\s]+)/i)?.[1] ??
    raw.match(/SUPABASE_SERVICE_ROLE_KEY=(\S+)/)?.[1]
  if (!url || !serviceRole) {
    throw new Error('Could not parse Supabase URL or service role key from Media/Keys.txt')
  }
  return { SUPABASE_URL: url, SUPABASE_SERVICE_ROLE_KEY: serviceRole }
}
