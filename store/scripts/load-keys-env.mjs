/**
 * Load Supabase URL + service role (+ optional Postgres URL) from gitignored Media keys file.
 *
 * Default: Media/Keys.txt
 * Override: KEYS_FILE=../Media/keys_new.txt
 */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

export function resolveKeysFilePath() {
  const rel = process.env.KEYS_FILE || '../../Media/Keys.txt'
  return resolve(__dirname, rel)
}

export function loadKeysFileRaw(keysPath = resolveKeysFilePath()) {
  return readFileSync(keysPath, 'utf8')
}

export function loadSupabaseServiceEnvFromKeysFile(keysPath = resolveKeysFilePath()) {
  const raw = loadKeysFileRaw(keysPath)
  const url = raw.match(/https:\/\/[a-z0-9-]+\.supabase\.co/)?.[0]
  const serviceRole =
    raw.match(/service role key\s*-\s*(eyJ[^\s]+)/i)?.[1] ??
    raw.match(/SUPABASE_SERVICE_ROLE_KEY=(\S+)/)?.[1]
  if (!url || !serviceRole) {
    throw new Error(`Could not parse Supabase URL or service role key from ${keysPath}`)
  }
  return { SUPABASE_URL: url, SUPABASE_SERVICE_ROLE_KEY: serviceRole }
}

export function loadPostgresUrlFromKeysFile(keysPath = resolveKeysFilePath()) {
  const raw = loadKeysFileRaw(keysPath)
  const m = raw.match(/postgresql:\/\/[^\s]+/)
  if (!m) throw new Error(`Could not parse Postgres URL from ${keysPath}`)
  return m[0]
}

export function loadSupabaseAnonFromKeysFile(keysPath = resolveKeysFilePath()) {
  const raw = loadKeysFileRaw(keysPath)
  const anon =
    raw.match(/anon key\s*-\s*(eyJ[^\s]+)/i)?.[1] ??
    raw.match(/SUPABASE_ANON_KEY=(\S+)/)?.[1]
  if (!anon) throw new Error(`Could not parse anon key from ${keysPath}`)
  return anon
}
