import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { readFileSync, existsSync } from 'node:fs'
import { createLocalAdminMiddleware } from './scripts/local-admin.mjs'
import { createLocalListings } from './scripts/local-listings.mjs'

const rootDir = fileURLToPath(new URL('.', import.meta.url))
const storeSrc = path.resolve(rootDir, '../../store/src')
const localCatalog = path.resolve(rootDir, 'src/data/catalog.ts')

export default defineConfig(() => {
  const supabaseUrl = ''
  const supabaseAnon = ''
  const isDev = false
  const devPort = 5177
  // Browser → localhost proxy → Supabase (avoids local "Failed to fetch" / DNS blockers)
  const browserSupabaseUrl =
    isDev && supabaseUrl ? `http://localhost:${devPort}/__supabase` : supabaseUrl

  const buildId =
    process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ||
    process.env.VERCEL_GIT_COMMIT_REF ||
    'github-catalog'

  return {
    define: {
      __BM_BUILD_ID__: JSON.stringify(buildId),
      __LIVE_CATALOG__: JSON.stringify(process.env.CATALOG_SOURCE==='supabase'),
      __SITE_ORIGIN__: JSON.stringify(process.env.PUBLIC_SITE_URL || 'http://localhost:5177'),
      'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(browserSupabaseUrl),
      'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(supabaseAnon),
    },
    publicDir: path.resolve(rootDir, 'public'),
    resolve: {
      // Shared store sources have their own node_modules. Hooks and router
      // contexts must use the app's single React instance in production too.
      dedupe: ['react', 'react-dom', 'react-router', 'react-router-dom'],
      alias: [
        { find: /^(?:.*[/\\])?catalog[/\\]RotatingImageStack\.tsx$/, replacement: path.resolve(rootDir, 'src/catalog/RotatingImageStack.tsx') },
        { find: '@store/data/catalog.ts', replacement: localCatalog },
        { find: /^(?:.*[/\\])?catalog[/\\]CatalogImage\.tsx$/, replacement: path.resolve(rootDir, 'src/catalog/CatalogImage.tsx') },
        { find: /^(?:.*[/\\])?catalog[/\\]CatalogProvider\.tsx$/, replacement: path.resolve(rootDir, 'src/catalog/CatalogProvider.tsx') },
        { find: /^(?:.*[/\\])?cart[/\\]CartContext\.tsx$/, replacement: path.resolve(rootDir, 'src/cart/CartContext.tsx') },
        { find: '@store', replacement: storeSrc },
        { find: path.join(storeSrc, 'data/catalog.ts'), replacement: localCatalog },
        { find: path.join(storeSrc, 'data/catalog.ts').replace(/\\/g, '/'), replacement: localCatalog },
      ],
    },
    plugins: [{name:'v3-shared-catalog',enforce:'pre',resolveId(source,importer){if(importer?.replaceAll('\\','/').startsWith(storeSrc.replaceAll('\\','/')) && /^\.\.?\/.*data\/catalog\.tsx?$/.test(source))return localCatalog}},
      {name:'v3-local-admin',apply:'serve',configureServer(server){
        // Ignored machine-local credentials; not loaded into browser or production builds.
        const file=path.join(rootDir,'.cache/local-admin.json')
        if(existsSync(file)){
          const local=JSON.parse(readFileSync(file,'utf8'))
          if(typeof local.password==='string'&&local.password)server.middlewares.use(createLocalAdminMiddleware(local.password,{catalog:createLocalListings(path.join(rootDir,'.cache/local-listings.json'),path.join(rootDir,'catalog/generated.json'))}))
        }
      }},react()],
    server: {
      host: 'localhost',
      port: devPort,
      strictPort: true,
      fs: {
        allow: [path.resolve(rootDir, '../..')],
      },
      proxy: {
        '/api': { target: 'http://127.0.0.1:3000', changeOrigin: true },
        ...(supabaseUrl
          ? {
              '/__supabase': {
                target: supabaseUrl,
                changeOrigin: true,
                secure: true,
                rewrite: (p: string) => p.replace(/^\/__supabase/, ''),
              },
            }
          : {}),
      },
    },
  }
})
