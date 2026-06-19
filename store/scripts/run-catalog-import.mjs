/**
 * Run catalog import against keys file (default Media/keys_new.txt for new project).
 *
 * Usage:
 *   node scripts/run-catalog-import.mjs
 *   KEYS_FILE=../../Media/keys_new.txt SKIP_DXF=1 node scripts/run-catalog-import.mjs
 */
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { loadSupabaseServiceEnvFromKeysFile, resolveKeysFilePath } from './load-keys-env.mjs'

if (!process.env.KEYS_FILE) process.env.KEYS_FILE = '../../Media/keys_new.txt'

const __dirname = dirname(fileURLToPath(import.meta.url))
const env = loadSupabaseServiceEnvFromKeysFile()
const childEnv = {
  ...process.env,
  SUPABASE_URL: env.SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY: env.SUPABASE_SERVICE_ROLE_KEY,
  SKIP_DXF: process.env.SKIP_DXF ?? '1',
  DRY_RUN: process.env.DRY_RUN ?? '0',
}
if (process.env.MAX_IMAGES_PER_PRODUCT) {
  childEnv.MAX_IMAGES_PER_PRODUCT = process.env.MAX_IMAGES_PER_PRODUCT
}

console.log(`Import using ${resolveKeysFilePath()}`)
console.log(`Target: ${env.SUPABASE_URL}`)
console.log(`SKIP_DXF=${childEnv.SKIP_DXF} max-images=${childEnv.MAX_IMAGES_PER_PRODUCT ?? 'all'}`)

const script = join(__dirname, 'import-finalized-catalog.mjs')
const result = spawnSync(process.execPath, [script], {
  cwd: join(__dirname, '..'),
  env: childEnv,
  stdio: 'inherit',
})

process.exit(result.status ?? 1)
