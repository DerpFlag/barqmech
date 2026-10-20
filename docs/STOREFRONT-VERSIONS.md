# Storefront versions — 2026-10-16

> Current state (2026-10-20): V3 is deployed at https://www.barqmech.com/ through the repository-root Vercel configuration. V1/V2 and their snapshots remain preserved locally. Statements below about unchanged production/root build configuration describe the earlier copy/refinement sessions, not today's deployment target. See NEW-DESIGN-ARCHITECTURE.md for the current deployed state.

| Version | Location | Local preview | Policy |
| --- | --- | --- | --- |
| V1 original | `CodeShinobi/barqmech-store/` | http://localhost:5175/ | Leave source unchanged for comparison |
| V1 snapshot | `CodeShinobi/barqmech-store-v1/` | Not running separately | Frozen copy of 42 source/config/media/doc files, SHA-256 verified |
| V2 preserved | `CodeShinobi/barqmech-store-v2/` | http://localhost:5176/ | Preserved before the V3 motion study; 51 source/config/media/doc files hash-recorded |
| V3 active | `CodeShinobi/barqmech-store-v3/` | http://localhost:5177/ | Isolated scroll/motion study copied from V2 on 2026-10-17 |
| Existing production | `store/` | Existing deployment | Shared code supplier; unchanged by this pass |

`STOREFRONT-V1-MANIFEST.json` records the original 42 files and their SHA-256 digests. Both original and snapshot matched after V2 implementation. Dependencies, generated dist, caches and environment files are excluded from source copies.

The V1 snapshot also contains `DEPENDENCIES-V1.zip`: recovery copies of shared `store/src` source, `store/public`, category photographs, public logos and both imported root videos, preserving repository-relative paths. It contains 101 files. It excludes environment/key files, operational exports, backend/database state and customer records. This is a recovery artifact, not an import or runtime folder; do not extract over current work casually.

V2 retains relative aliases to shared store code, root public assets and the same catalog/backend configuration. A presentation copy does **not** create a separate database or order service. No shared production files, schema or API were edited. Local browser cart storage is separate by port/origin. Existing root deployment config still builds `store/`; V2 has not been deployed.

**2026-10-17 exception to shared UI ownership:** V2 now owns `src/cart/CartContext.tsx`, `cartStorage.ts` and `types.ts`. A V2-only Vite alias redirects both bare and relative CartContext imports in shared product/checkout modules to that local provider. Order/pricing interfaces remain compatible. Same-origin V2 tabs synchronize via migrated base plus unique operation entries; production/V1's original context is unchanged. Run `npm run test:cart` for the regression suite. Safe journal compaction and current-price refresh remain backlog work.

## Running V2

**V3:** run the same commands from `CodeShinobi/barqmech-store-v3/`. Vite and browser Supabase proxy both use5177; shared `/api` still targets3000. Its own dist/.cache and dependency junction mirror V2. Copies exclude node_modules, generated dist/cache, environment files and Git metadata. V2's51 source files remain unchanged against `STOREFRONT-V2-MANIFEST.json`; this is a source preservation manifest, not a backup of live database/customer/order state. V3's local cart is independent by port; no orders or account data were cloned. Root deployment unchanged.

From `CodeShinobi/barqmech-store-v2/`, use `npm run dev` (5176), `npm run build`, or `npm run preview -- --port 4176`. Vite's browser Supabase proxy uses the matching 5176 origin. `/api` still proxies to the existing local backend port3000 when available.

V2 currently reuses the already installed dependency tree through a Windows `node_modules` junction to the original app; this saves disk space and installs no packages. Its TypeScript cache lives under V2 `.cache`, and dist stays in V2. The package versions/lock remain the same. If moving the app, replace the local junction with an ordinary `npm ci` installation. Do not recursively delete through junction targets.

## V2 refinement scope

General Sans supporting text / retained Clash Display headings, readable small navigation, native rounded borders instead of clipped CTA diagonals, stable text-bearing hover surfaces, differentiated type weight, quieter listing cards, and slower strip motion. Desktop one-gesture section navigation remains, using a single 520ms animation clock; category changes stay within the edit section with no redundant page scroll. Mobile scroll input remains native.

Mosaic geometry/links and 2000ms cycling remain. Stationary captions sit above fading photographs, next images must decode before switching, and only neighboring slides mount. Dimension metadata filters the 42 original photographs to29 adequate sources without deleting assets (minimum short edge360 / long500; lead artwork short edge550). Existing low-resolution collection videos remain unchanged; CSS does not manufacture missing detail.

Hero playback sleeps behind the header/below the first section and in background/reduced-motion states; collection visibility handling stays intact. Commerce bypasses the decorative hero loader. Footer overlay is preserved; simulation damping now accounts for elapsed time. This remains approximate circle-hull physics.

See the living architecture for actual checks and remaining limitations. No measured FPS/Core Web Vitals or universal text-pixelation fix is claimed.
