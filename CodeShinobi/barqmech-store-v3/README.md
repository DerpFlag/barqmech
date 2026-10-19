# BarqMech V3

**2026-10-19:** Supabase is now the selected live listing/price authority. GitHub CSV/JSON remains the seed and offline snapshot. Admin has compact Orders and Listings sections, CRUD/status/price editing and reversible archive. Local authenticated edits persist to an ignored local catalog; the demo uses isolated memory. Production APIs, isolated schema migration and seed are prepared, not applied/deployed. Follow [live catalog setup](../../docs/V3-LIVE-CATALOG.md); set CATALOG_SOURCE=supabase on Vercel after seeding. Earlier GitHub-only catalog wording below is historical.

Admin is now available at `/admin`, with a V3-owned blue/cream order workspace using the existing authenticated root APIs. Vite alone does not run those serverless endpoints. Local design preview `/admin?adminDemo=1` uses clearly labelled fictional orders, makes no API calls and is excluded from production. See [admin ownership and verification](src/admin/README.md). The temporary static public share still blocks admin/API access.

Temporary view-only sharing: build, run `node scripts/share-preview.mjs`, then tunnel loopback5178 with the approved portable Cloudflare client. See [sharing runbook](../../docs/V3-TEMPORARY-SHARING.md) for commands, stopping and boundaries. This preview does not connect checkout/contact APIs. Vite dedupes React/ReactDOM/router across local and shared sources to preserve a single runtime/context instance in production bundles.

Active storefront at http://localhost:5177/. V2 remains preserved at5176. Run `npm run dev`, `npm test` or `npm run build` here with Node22. The local dependency junction reuses an installed tree; clean environments install root, shared store and V3 packages as configured in root vercel.json. Do not recursively delete through junctions.

V3 owns its GitHub CSV catalog, generated browsing/details data, responsive image copies, compressed videos and public assets. It still uses shared `store/src/` domain/UI code. Private orders, request limits and optional merchant CAD references stay in Supabase through root server APIs. The browser no longer reads the Supabase product catalog. A normal build needs the committed delivery assets, not private masters or a local keys file.

Motion uses CSS, IntersectionObserver, Web Animations and SVG. The rejected page-edge line is removed. Approved blue/cream palette, curved ribbon, liquid image reveal, scroll-color text, metallic footer shapes and desktop-only category scroll remain. Reduced-motion/data-saving video paths retain imagery.

Root Vercel configuration targets V3 for the next deployment. No deployment or database migration was executed. Follow [the launch runbook](../../docs/V3-GITHUB-VERCEL-LAUNCH.md) before accepting orders; the migration intentionally changes legacy order-write permissions. Never commit customer exports, private keys or CAD masters.

Continuity: [living architecture](../../docs/NEW-DESIGN-ARCHITECTURE.md), [versions](../../docs/STOREFRONT-VERSIONS.md), and local DESIGN.md. Build validates all catalog prices, product-detail files, image variants and product metadata pages. Local tests do not establish live provider/RLS/hosting reliability.

For local motion investigation only, `/?motionDebug=1` displays scroll-time RAF callback cadence and nearby long tasks. It is opt-in, development-only and excluded from production. These readings are not displayed/GPU FPS. Use a foreground browser Performance trace for a sustained60fps assessment; root `docs/previews/v3-scroll-timing-2026-10-18.json` retains the exploratory samples and their limitations.
