# V3: GitHub catalog and Vercel launch

**2026-10-19 supersession:** user now selected Supabase live listings/prices with the V3 Listings editor. Follow [V3-LIVE-CATALOG.md](V3-LIVE-CATALOG.md) for catalog ownership/migration/seed and CATALOG_SOURCE=supabase. The GitHub catalog sections below describe the earlier snapshot baseline. Order/privacy/email cutover gates below still apply. No migration/deployment has been executed.

Updated 2026-10-17. Local implementation and tests are complete for the changes described here; no deployment, database migration, real order or email test has been performed. This is a release procedure, not confirmation of a live release.

## Data ownership

- GitHub versions `CodeShinobi/barqmech-store-v3/catalog/products.csv`, `catalog/prices.csv`, compressed `public/catalog-images/`, and `src/assets/optimized/`. Vercel builds and serves these files. The browser does not fetch raw files from github.com or read the Supabase product catalog.
- Supabase retains private orders, admin order operations and distributed request limits. Existing private CAD metadata/storage remains an optional merchant-email integration. It is not the price authority. Preserve existing product UUIDs to retain these manufacturing references.
- Never publish `.env` files, `Media/keys_new.txt`, customer/order exports, private DXF masters, operational test exports, signed CAD URLs or service-role keys. Review the Git diff and repository history before publication; `.gitignore` cannot remove previously committed secrets.
- Original V1/V2 and media masters remain local. `.vercelignore` omits them from the deployment upload. Shared `store/src/` and its package files are still required to build V3; V3 is not a standalone folder to upload in isolation.

## Catalog edits

`products.csv` contains UUID, unique slug, category, title and a JSON array of local image paths. `prices.csv` contains product slug, numeric design code, size, feasibility and integer PKR finish/add-on prices. Design codes follow the existing numeric domain contract; leading zeros do not create a separate design. Zero/infeasible base prices cannot become purchasable variants.

From the V3 directory, run `npm test` then `npm run build`. The build validates references/prices/images, produces synchronous browse data and versioned product-detail JSON, and generates metadata pages/sitemap. Both the order API and browser derive prices from the same committed CSV. Commit the CSV and compressed image sources together. Generated output is rebuilt; do not edit `dist`.

Price changes require a fresh deployment. Existing carts are revalidated by the server and stale totals are rejected. An already accepted checkout retry returns its existing order even if prices subsequently change. This is a made-to-order catalog; no stock reservation or online payment gateway has been added.

For new media, generate delivery copies locally with `scripts/prepare-media.py` / `scripts/prepare-github-catalog.py` only when importing masters deliberately. These need FFmpeg (and the one-time catalog converter's Python dependencies). Ordinary Vercel builds need Node 22 and the committed compressed assets, not FFmpeg or the private Media directory. The converters skip already-created outputs; remove only a deliberately replaced delivery file or use a new filename before regenerating a changed master.

## Vercel project

1. Use the repository root as Root Directory, Node 22, and the checked-in `vercel.json`. Its install command installs root backend, shared store and V3 dependencies; build/output target V3. Do not override it with the legacy `store/dist` settings. `docs/VERCEL-LEGACY-CONFIG.json` preserves the earlier config.
2. Create a Preview using an **isolated test Supabase database** and test recipients. Do not apply the migration to the active production order database while the legacy API still uses anonymous inserts.
3. Review and apply `store/supabase/migrations/011_v3_checkout_reliability.sql` in the test database. It adds durable notification/idempotency fields and a private rate-limit RPC, then revokes direct anonymous/authenticated order writes. The new API uses service role. This migration has not been run by the agent.
4. Configure server environment variables below. Build validation deliberately fails a Vercel build missing required settings. Never prefix server secrets with `VITE_`.
5. Confirm Preview deep links, API packaging, filesystem routing and actual headers. The local Vite dev server does not emulate Vercel routing or prove function packaging.
6. Only after Preview checks and an explicit production cutover decision, coordinate the production migration and new API release. Keep a database backup and review rollback: restoring the old frontend/API alone does not undo revoked anonymous insert privileges.

| Setting | Purpose |
| --- | --- |
| `PUBLIC_SITE_URL` | Exact HTTPS origin of this environment; no path/query. Used in canonical URLs, receipts and transactional links. Set Preview to its own stable preview origin. |
| `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | Private order database; service role stays server-only. |
| `ORDER_RECEIPT_SECRET` | Random secret of at least 32 characters for signed private receipt links and hashed request-limit keys. Rotation invalidates existing receipts. |
| `ADMIN_SESSION_SECRET` | Separate random secret of at least 32 characters; required for production admin session signing. |
| `ADMIN_PASSWORD` | Existing admin authentication password; configure if admin operations are used. |
| `RESEND_API_KEY`, `ORDER_FROM_EMAIL`, `ORDER_NOTIFY_EMAIL` | Verified sender and merchant inbox for order/contact email. Production builds reject the Resend test sender. |
| `RESEND_FROM_EMAIL` | Optional separate verified contact sender; defaults to the order sender. |
| `ALLOWED_ORIGINS` | Optional comma-separated additional trusted origins; canonical origin is already allowed. Do not use wildcard origins. |
| `CRON_SECRET` | Random bearer secret protecting `/api/v3/retry-notifications`; match GitHub retry token. |

Use the existing contact/admin-specific settings only where their shared handlers require them; do not copy secrets into this document. `.env.example` has empty placeholders.

## Durable email retries

The accepted order is saved before email delivery. A mail failure leaves the order intact and queues notification state. Retry payloads/provider keys remain stable; partial delivery is recorded. Automatic attempts stop for manual review after eight attempts or after 23 hours, avoiding blind resends outside the provider deduplication window.

Configure GitHub Actions secrets `ORDER_RETRY_SITE_URL` (production HTTPS origin) and `ORDER_RETRY_TOKEN` (same value as Vercel `CRON_SECRET`). The checked-in workflow runs hourly and supports a manual run. It does nothing until secrets are configured. GitHub scheduling is best-effort: monitor failed runs and reconcile pending/review notifications in operations. The worker returns an error if it finds a notification needing manual review. Do not blindly resend these; reconcile provider delivery records first. No scheduler/service was connected during implementation.

## Required Preview acceptance checks

- Fresh clean-clone install/build succeeds without local `Media`, key files, dependency junctions or uncommitted generated source requirements. CI runs tests/build; verify the actual Vercel function bundle includes both catalog CSVs.
- Homepage, all category filters, search, representative single/multiple-design PDPs, empty/populated cart and checkout work at desktop/mobile widths. Test keyboard focus, image viewer, footer, reduced motion, Save-Data and actual slow-network behavior.
- Deep product URL returns correct metadata and 200; unknown product/path returns 404; checkout/receipt are noindex. Confirm canonical host, sitemap, immutable versioned catalog/assets and non-cached private API responses.
- In an isolated environment, place one controlled order to owned test inboxes, verify authoritative prices/shipping/add-ons and private receipt, retry the same key, simulate partial email failure and run the protected worker. Confirm one durable order, no customer CAD exposure and no anonymous database writes. Test contact/admin authorization and request limits.
- Check two tabs adding different products, quantity/remove/clear propagation, reload persistence and checkout timeout recovery. Local tests exercise these contracts but do not replace deployed browser/provider checks.
- Check real mobile devices and throttled Lighthouse/accessibility results. These were not executed locally and no performance score is claimed.

## Delivery approach and measured local results

Hero: 33.40 MB original → 6.27 MB desktop / 2.25 MB mobile, 30 fps, H.264, no audio, fast-start. A 69 KB poster renders before playback. Collection clips are 0.84–0.97 MB each, loaded only when visible; hero and collection video pause offscreen. Reduced-motion/Save-Data/2G paths use static imagery;3G selects the compact hero source. Poster/video are absolutely layered in the same visible rectangle. Product media has 320/640/1200 WebP candidates with actual width descriptors, lazy loading and a failure fallback.

These are file sizes, not total first-page transfer measurements. This React/Vite build serves precompressed static images directly; the presence of `images` configuration does not automatically optimize normal `<img>` or video requests. Vercel documents its [image pipeline](https://vercel.com/docs/image-optimization), [Vite deployment](https://vercel.com/docs/frameworks/frontend/vite) and [video delivery considerations](https://vercel.com/kb/guide/best-practices-for-hosting-videos-on-vercel-nextjs-mp4-gif). Higher traffic may justify a dedicated video/media service later; no paid service is needed for the local implementation.

## Remaining limitations

V3 CSS now has one ordered entry, a consolidated home stylesheet and a trimmed V3-owned commerce baseline; obsolete rules/superseded declarations were removed and built CSS is~14% smaller. Further cleanup can be incremental. Page HTML contains product-specific head metadata with a client-rendered body, not full React SSR. Local tests do not establish live RLS, provider delivery, actual Vercel routing, usage costs, real network performance or production reliability. All launch gates above remain open until executed.
