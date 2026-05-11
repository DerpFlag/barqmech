import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { visualizer } from 'rollup-plugin-visualizer'

const rootDir = fileURLToPath(new URL('.', import.meta.url))

const analyze = process.env.ANALYZE === '1' || process.env.ANALYZE === 'true'

// https://vite.dev/config/
export default defineConfig({
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
})
