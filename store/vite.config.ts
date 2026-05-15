import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { visualizer } from 'rollup-plugin-visualizer'

const rootDir = fileURLToPath(new URL('.', import.meta.url))

const analyze = process.env.ANALYZE === '1' || process.env.ANALYZE === 'true'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const fileEnv = loadEnv(mode, rootDir, '')
  // Local .env.local often uses SUPABASE_* for API scripts — backfill VITE_* for the browser build.
  // Never override Vercel/GitHub env: those already set VITE_SUPABASE_* on process.env.
  if (!process.env.VITE_SUPABASE_URL?.trim()) {
    process.env.VITE_SUPABASE_URL = (fileEnv.VITE_SUPABASE_URL || fileEnv.SUPABASE_URL || '').trim()
  }
  if (!process.env.VITE_SUPABASE_ANON_KEY?.trim()) {
    process.env.VITE_SUPABASE_ANON_KEY = (
      fileEnv.VITE_SUPABASE_ANON_KEY ||
      fileEnv.SUPABASE_ANON_KEY ||
      ''
    ).trim()
  }

  const buildId =
    process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ||
    process.env.VERCEL_GIT_COMMIT_REF ||
    mode

  return {
    define: {
      __BM_BUILD_ID__: JSON.stringify(buildId),
    },
    plugins: [
      react(),
      ...(analyze
        ? [
            visualizer({
              filename: 'dist/stats.html',
              gzipSize: true,
              brotliSize: true,
              open: false,
              template: 'treemap',
            }),
          ]
        : []),
    ],
    server: {
      fs: {
        allow: [path.resolve(rootDir, '..')],
      },
      /** Forward `/api/*` to `vercel dev` (default port 3000) while using `npm run dev`. */
      proxy: {
        '/api': { target: 'http://127.0.0.1:3000', changeOrigin: true },
      },
    },
  }
})
