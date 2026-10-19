# BarqMech development log

Chronological notes for agents and humans. Append new entries at the **top**.

## 2026-10-19 — Isolated V3 GitHub release prepared; SQL permission pending

Prepared separate release checkout from current DerpFlag/barqmech main5a14dbb, avoiding nested Git and unrelated local changes. Patched dependency advisories in clean root/store/V3 installs (zero reported after fixes),38tests and223module/346product build pass. Verified encrypted local original-project catalog/order backup; private Vercel handoff file prepared for user settings. Newly supplied keys initially belonged to a different project; user reaffirmed original ajaugjszvbsdxicswfwx. Scoped token currently returns403 missing database_read; SQL/seed/cleanup/live email and production deployment not performed. Credential file explicitly Git/Vercel ignored. See docs/V3-RELEASE-2026-10-19.md.

## 2026-10-19 — Supabase retained; Panel DXFs supplied manually

User chose GitHub/Vercel public media and Supabase tables/non-Panel DXFs, superseding Cloudflare migration. Read-only metadata confirms Panels2.22GB/2128DXFs versus other categories~300MB/342DXFs; all115 missing legacy mappings belong to Panels. Implemented shared category policy, merchant manual-file notice, no Panel signing even in mixed carts, private-path omission in seed/admin and editor guidance.38tests and346-product seed dry run pass. Current actual remote storage remains~3.60GB: no objects deleted or migrations/imports applied. Public-image cutover/backup must precede old-bucket cleanup; removing Panels alone is insufficient to fit1GB while old1.08GB images remain. Real production/email/storage acceptance still pending.

## 2026-10-19 — Live Supabase inventory and complete V3 DXF mappings

Read-only service audit confirms existing four tables, public images1.08GB/private DXFs2.52GB, all2470 DXF objects, but115 missing legacy design mappings. V3 schema/RPCs absent. Added private per-design DXF paths to V3 seed/admin with public-response omission and live manufacturing lookup; merchant missing-file warning and malformed-cart guard.35 regression tests and production222module/346product build pass. Prepared nonbreaking migration013; no SQL/seed/upload/delete/order/email/deployment performed. User now evaluating full Supabase replacement; Cloudflare D1/R2/Workers researched as proposal only. Full production integration remains pending destination/setup/email acceptance. See living architecture and sanitized audit report.

## 2026-10-19 — Supabase-only merchant DXF links

Confirmed old email source supports Google Drive Finalized folder/path hints instead of specific DXF signing when its Drive setting is configured; both recipient templates already include product pictures. User excludes Google Drive/cPanel, choosing GitHub+Supabase+Vercel. Removed Drive handling/rendering from V3 server; merchant-only selected-design DXF signing remains private/14days.32 regression tests pass including obsolete Drive env ignored and no customer CAD links. No live inbox/provider/storage inventory inspected, deployment performed or saved order notification HTML rewritten.

## 2026-10-19 — Compact admin, Listings editor and live Supabase catalog

Replaced tall/locked order overview with compact Orders/Listings navigation and natural page scrolling. Added create/edit/status/price/size/design/image-URL management and reversible archive. User selected Supabase live prices/listings; prepared isolated RLS schema/RPC, seed dry run, protected admin/public catalog APIs, server-authoritative checkout, revision refresh and live sitemap/new-product routing. Local authenticated CRUD persists in ignored JSON; demo isolated in memory.31 tests, build/artifacts and V2 hashes51/51 pass. Browser/API integration proved new product/price/disable flows; QA fixture restored. No real database migration/import/deployment/order. Current editor mobile runtime unverified because viewport override did not apply; direct uploads/dynamic SEO and actual Supabase/Vercel acceptance pending. See docs/V3-LIVE-CATALOG.md and living architecture.

## 2026-10-19 — Local admin sign-in without setup message

Configured the requested local password in ignored server-only config, added Vite-only loopback session/login/logout endpoints with expiry/rate limits and an explicitly empty local workspace. Removed the technical setup error from the login screen; credentials remain outside frontend/GitHub/production.25 tests pass; browser local sign-in, reload and logout verified. No real customer/order access, backend configuration, migration or deployment. Vercel still needs its own environment password/secrets.

## 2026-10-19 — Fit admin overview to desktop viewport

Compact desktop chrome/stats and a bounded order desk remove outer-page scrolling; longer lists/details scroll inside their own panels. Login frame also bounded; mobile/small-window document flow retained. Browser confirmed1280×720 and1100×600 dashboard fit and independent detail scrolling. Production build/artifacts pass. No backend changes.

## 2026-10-19 — Correct admin logo and label

Admin login/workspace now use the existing storefront logo symbol and metallic wordmark. Replaced spaced slash/uppercase label with readable Studio desk text and a divider; mobile keeps the logo without crowding navigation. Build/artifacts and desktop/mobile visual checks pass. No backend changes.

## 2026-10-19 — V3 studio desk admin portal

Added V3-owned lazy /admin with blue/cream login, loaded-order overview, searchable/filterable order list, customer/item/saved shipping details and fulfil/reopen controls. Existing authenticated root APIs retained; private/no-store headers added. Handles expired sessions, failed requests/HTML fallback and stale-response privacy; admin noindex and excluded from sitemap.23 tests/build220 modules/product artifacts pass, dev-only fictional sample workspace checked desktop/mobile, V2 hashes51/51. No live admin/customer data accessed or orders mutated. Actual server-backed auth/DB checks remain; public static tunnel continues blocking admin/API. Architecture/DESIGN and admin ownership docs updated.

## 2026-10-19 — Default product finish to Black

V3 product pages now start with Black and reset to Black on product change; existing cart choices retained. Production build/artifact checks pass; fresh built-preview selection, price and configuration verified. No backend or preserved-version changes.

## 2026-10-19 — Area-based order shipping

Added validated area_sqft to7419 CSV size rows. Checkout and V3 API now share one largest-item shipping calculation: ≤4 sq ft500, >4–7 sq ft1000, then200 per extra sq ft rounded up; no quantity/line multiplication. Persisted line allocation reconciles with the single charge; existing order totals unchanged. Updated customer copy and catalog/architecture notes.20 tests and216-module production build/346-product artifacts pass; desktop/mobile mixed-size checkout checked, quantity unchanged shipping, removal recalculates, test cart empty, V2 hashes51/51. No live orders/migration/deployment; local built preview refreshed, earlier public tunnel failed DNS during verification.

## 2026-10-18 — Temporary V3 public preview

User-approved Cloudflare tunnel now shares a built-only loopback5178 preview. Added static server with GET/HEAD, video ranges, noindex and repository/API path restrictions; portable official client is ignored and hash verified, no service/global install. Public browser verification caught duplicate React useContext failure; V3 dedupes React/ReactDOM/router, rebuilt215 modules plus346-product checks. Public homepage/video and representative PDP options/images now render. No real orders/messages, shared backend changes or deployment. Temporary URL, commands and limitations recorded in docs/V3-TEMPORARY-SHARING.md and living architecture; checkout/contact APIs disconnected.

---

## 2026-10-18 — Resume scroll/render smoothness improvements

Replaced per-frame JS section scrolling with browser-native smooth scrolling; cached section geometry and changed-only section/header state; progress bar uses a transform ref instead of React updates. Cached character/palette state limits scroll-ink writes; ribbon lays out viewport-sized repetitions on the visible arc. Hero darkening now uses a static overlay; footer physics sizes update only on reset/resize. Added opt-in dev-only motionDebug callback/long-task sampler, excluded from production JS. Exploratory cadence samples variable (~41Hz baseline, ~44–46Hz intermediate; one throttled sample); no sustained60fps/display claim. Final build228 modules and346-product checks pass; desktop wheel category sequence/next section, footer endpoint and mobile unchanged category/no overflow checked. V2 hashes51/51 unchanged. No backend, dependency, database or deployment changes. Architecture/DESIGN updated; actual foreground device/GPU trace remains needed.

---

## 2026-10-17 — Fix invisible hero video and consolidate V3 CSS

Hero video was playing below the poster outside the viewport; both layers now share absolute inset0 and visible playback was checked on desktop/mobile.3G estimates select compact video instead of suppressing playback; explicit Save-Data/reduced-motion/2G poster paths retained, connection changes observed. CSS now has one ordered entry, merged home stylesheet and V3-owned trimmed commerce baseline. Removed110 unused rules/298 overridden declarations; built CSS~228→196KB, gzip~41.1→35.3KB.44 sampled home elements ×19 computed properties match before/after at both sizes; mosaic/PDP/cart reviewed, build228 modules/artifact checks pass, V2 hashes51/51 unchanged. No backend/schema/deployment changes. Architecture, DESIGN and CSS ownership/report updated; external launch gates remain open.

---

## 2026-10-17 — V3 GitHub catalog, compressed delivery and reliable orders

Implemented the user-selected GitHub CSV catalog (346 products/2470 designs) while keeping private orders in Supabase. Generated responsive WebP copies and silent fast-start desktop/mobile videos (hero33.40MB→6.27/2.25MB), deferred offscreen media and removed duplicate boot loading. Added authoritative server prices/shipping, durable idempotent orders/email retry, signed receipts, request limits and fail-closed configuration. V3 metadata/404/sitemap/build/CI/deployment preparation and launch runbook added. Root API/helper/config changes are local pending cutover; migration prepared but not run. Build/artifact checks and18/18 regression tests pass; sampled desktop/mobile commerce and video behavior checked, temporary cart cleared, V2 hashes51/51 unchanged. No deployment, real order/email/contact, staging or commit. Actual Preview/provider/RLS/network/device acceptance and historical CSS consolidation remain open. See docs/V3-GITHUB-VERCEL-LAUNCH.md and living architecture section0.

---

## 2026-10-17 — Complete V3 production and media audit

Saved prioritized route/section/loading/media/deployment audit and machine-readable FFprobe/size inventory. Identified33.4MB non-fast-start hero, optional image optimization/responsive gaps, catalog startup wait, checkout loading fallback and order/configuration launch blockers. Browser checked categories/search/PDP/cart/checkout/confirmation/mobile contact/footer without external submissions; test cart restored empty. Build195 modules, cart5/5, V3 production npm audit0 advisories, V2 hashes51/51. Architecture updated with evidence and limitations; application/shared production unchanged and no deployment performed.

---

## 2026-10-17 — Remove homepage edit loading text

V3 Shop the Edit now uses four quiet static card placeholders while catalog data/featured selection arrives, matching commerce loading treatment. Busy accessibility semantics and real failure retry remain. Cold reload verified placeholder-to-four-products transition without loading copy; mobile reviewed and production build passed. Architecture updated; other versions/shared backend unchanged.

---

## 2026-10-17 — Clear V3 hero brand overlap

Moved BARQMECH and supporting copy16px lower on desktop, keeping desktop buttons in place. Mobile brand/copy/buttons move10px lower. Added a dedicated brand class and scoped CSS; verified both responsive positions in browser and saved screenshots. Architecture updated; section scroll sizing and other versions unchanged.

---

## 2026-10-17 — Refine V3 curve, typography and scroll color

Removed the rejected right-side line. Rebuilt ribbon band/text on one measured curve with central alignment and full-width motion. Added locally bundled OFL Archivo Black and DM Sans as user-approved free alternatives to the reference fonts; retained licenses and removed external font requests. Scroll copy is larger/bolder with continuous per-character intermediate colors. Build passed; desktop/mobile layout reviewed and screenshots saved. V2 remains51/51 hash-identical. Architecture/design updated; shared production/backend unchanged.

---

## 2026-10-17 — Correct V3 liquid reveal, ribbon edges and page line

Inspected Two26's actual inline animation code. Replaced persistent tint with solid blue/cream SVG brush followed by masked alternate-photo reveal, reversing on leave. Applied to collection and mosaic cards. Removed pause button; ribbon now reaches both edges and draws its band/text mask on scroll entry. Removed workshop/hero line experiments in favor of a thicker, scroll-drawn page-margin line changing blue/cream. Desktop/mobile geometry and keyboard transitions checked; final V3 build passed. V2 remains51/51 hash-identical; architecture/design notes updated. No new package or backend/deployment change.

---

## 2026-10-17 — Create isolated V3 motion study

Copied V2 into CodeShinobi/barqmech-store-v3 on5177;51 V2 source files remain hash-verified unchanged. Adapted Two26-inspired spring entrances, curved scroll-linked ribbon, word-color reveals, traced laser line, photo color wash and bouncy footer lettering using CSS/SVG/native Web Animations. Existing blue/cream palette, home navigation and commerce contracts retained. Desktop1280x720 and mobile374x668 reviewed; ribbon pause, reverse-scroll text color, keyboard wash and footer endpoint checked. Final build and five cart tests pass. Architecture/version/design references updated; no package installation, shared-production/backend edit or deployment.

---

## 2026-10-17 — Remove shop/product loading-copy flashes

V2 eagerly includes product-page code and uses a local catalog-ready wrapper with responsive layout placeholders instead of Loading text. Listing/search loading copy replaced by quiet grid placeholders; existing provider reuses loaded catalog on internal navigation. Build passed, desktop/mobile cold entries and warm shop→product transitions checked. Fresh visits still fetch live catalog; no persistent stale-price cache or shared-production edits. Architecture and V2 design notes updated.

---

## 2026-10-17 — Match footer wordmark to hero blue

V2 home and commerce footer BARQMECH text now uses #5aa7ff at every breakpoint. Checked home at1280px/374px and commerce at374px; saved previews and updated architecture. Restarted local V2 preview. V1/shared production unchanged; no build rerun for color-only CSS.

---

## 2026-10-17 — Remove duplicate size/finish summaries

V2 product pages hide redundant right-aligned size and finish values while retaining the option buttons and design-code guidance. Live product check confirms both summaries hidden and finish selection working. Architecture and screenshot updated; V1/shared source unchanged. No build rerun for this CSS-only edit.

---

## 2026-10-17 — Fit mobile categories on one line

Corrected the prior wrap: V2 mobile categories now use smaller responsive text, padding and gaps in one row. Verified all five labels share the same top at374px, with no row/document horizontal overflow. Saved preview and updated architecture; CSS-only, no build rerun. V1 unchanged.

---

## 2026-10-17 — Wrap listing categories without a scrollbar

V2 category buttons now wrap instead of scrolling sideways; removed negative mobile margins. Verified at374px with no category/document horizontal overflow. Architecture and screenshot updated; V1 unchanged.

---

## 2026-10-17 — Open Contact directly from other pages

V2 header Contact links now navigate within the app to /#contact. Hash-aware pre-paint scrolling replaces unconditional top resets, direct section loads bypass the hero counter, and temporary layout observation preserves alignment until user input. Desktop/mobile route clicks, repeated hash clicks and fresh hash reloads checked; final build passed. Contact form/backend, V1 and production unchanged. Architecture updated.

---

## 2026-10-17 — Remove product-edit instruction line

Removed V2's complete category-progress/scroll-instruction paragraph, including the size/finish note. Category controls and desktop scrolling retained. Live DOM reviewed; V1 preserved. Architecture updated.

---

## 2026-10-17 — Repair cross-tab cart and refine V2 commerce

V2 now owns its cart provider/drawer through a scoped import alias. Unique persisted operations and storage-event refresh prevent stale tabs from replacing the whole cart; migration preserves existing valid selections. Five cart regression tests and live two-product/two-tab tests pass, including quantities, removals, reload/closed-tab persistence and checkout totals. Drawer has a centered44px SVG close control, keyboard focus containment, cleaner selections/totals and empty state. Product listings use compact gallery headings/category/filter tools,24 items per full page and4/3/2 columns. Removed floating Catalog label, excessive header spacing and blue UI image mats; refined PDP option/action/detail hierarchy. Final V2 build passed; screenshots saved and temporary cart removed. V1, shared production code and backend unchanged. Architecture, versions and V2 design notes updated. Local-origin scope, journal compaction/current-price refresh and source-media limits remain documented.

---

## 2026-10-16 — Preserve V1 and refine isolated V2

Saved a hash-verified42-file V1 snapshot plus public/shared dependency recovery archive; original5175 app unchanged. Active V2 is CodeShinobi/barqmech-store-v2 at5176, with separate source/config/cache/dist and reused installed dependencies. Refined typography/native borders/CTA edges, stable hover labels, curated29 of42 mosaic photos by source dimensions, decoded crossfades with fixed captions, quieter listing/strip motion, single-clock desktop chapter scrolling, native mobile scrolling and offscreen hero pause. Four desktop edit categories still switch within one section. Shared production/backend/schema/deployment untouched. Final build and desktop/mobile browser checks passed; temporary cart removed without an order. Architecture, version map, AGENTS and V2 DESIGN updated. Native-device/FPS/universal pixelation removal unverified; low-resolution source videos remain.

---

## 2026-10-16 — Unify the full commerce design with home

Added new-app shared theme tokens and scoped commerce styles covering shop/category/search, product galleries/options/details/zoom, empty/populated cart, checkout forms/COD totals and confirmation/incomplete states. Commerce now uses cream/blue/black surfaces and exact hero-blue clipped buttons; video stays home-only, blue footer/metal overlay shared across routes. Original production components, pricing and submission contracts untouched. Desktop/mobile interaction and layout review, blank-field validation and final build passed. Temporary cart cleaned; no order/email/payment submitted. Architecture/DESIGN.md updated with scope and test limits.

---

## 2026-10-16 — Overlay artifacts without changing footer layout

Removed playground text/reset and reserved height. Restored original footer spacing/wordmark size. Metallic shapes now occupy an absolute pointer-transparent overlay, settling at the existing footer floor in front of text. Build passed; narrow footer dimensions restored and clean preview checked. Continuity docs updated.

---

## 2026-10-16 — Draggable metallic footer playground

Added original gold/silver/black SVG washers, hexagons, stars and frames to new-app footer variants, inspired by the supplied Evermark reference. Local bounded physics provides drag/throw/collisions, keyboard movement/toss and reset without dependencies. Nine desktop/six phone pieces; visibility/reduced-motion guards and cleanup. Desktop footer remains viewport-sized; mobile naturally includes the play area. Build passed; actual drag/keyboard/reset and desktop/narrow footer bounds checked. Architecture/DESIGN.md updated; shared production/backend unchanged.

---

## 2026-10-16 — Restrict edit scrolling to desktop

Gated internal category advance to >=768px; removed custom touch handling and mobile scroll hint. Mobile category buttons remain manual and page scrolling leaves category unchanged. Build passed; desktop cycling and mobile exit-to-workshop verified. Continuity docs corrected.

---

## 2026-10-16 — Cycle edit categories within the same section

Kept Shop the edit as one section and added internal category progression to wheel/key navigation, plus boundary touch handling for tall mobile content. Scroll cycles Islamic/Artwork/Panels/Custom & utility, then continues to workshop; reverse and category buttons remain available. Added progress hint. Build passed; desktop wheel stayed at the same page position across category changes, mobile boundary cycling checked. Architecture/design notes updated; no shared production/backend changes.

---

## 2026-10-16 — Match all home CTA blue to hero text

Action blue now references hero wordmark token #5aa7ff. Hero/lower CTA colors verified equal in browser; near-black labels preserve readability. Architecture/design notes updated.

---

## 2026-10-16 — Alternate cream/blue and match header/hero controls

Replaced pink/red palette with alternating cream/light-blue lower-home sections, black text and blue actions on desktop/mobile. Footer now shares light blue. Home All no longer highlights; hero CTA links reuse lower-home clipped-corner blue buttons and arrows. Original hero heading/video remain. Build passed; computed palette and desktop/mobile visual checks recorded in architecture/DESIGN.md.

---

## 2026-10-16 — Swap doors and stairs mosaic slots

Exchanged Stairs & Railings with Doors, Dividers & Gates using home-only render ordering. Fixed desktop/mobile mosaic structure and category media/links retained. Browser slot mapping verified; continuity notes updated.

---

## 2026-10-16 — Loop supplied collection videos and match red arrows

Moved four user MP4 files into new-app src/assets/collection with normalized names and verified unchanged hashes. Replaced second-section images with correctly mapped muted inline loops, visible-only playback and poster fallback; full-frame responsive fit preserved. Collection arrows now match the red Shop CTA. Build passed; desktop/mobile playback and offscreen pause checked. Architecture/design notes updated; hero, mosaic and shared production/backend unchanged.

---

## 2026-10-16 — Blue collection CTA

Matched product-edit collection button to the selected-category blue #245b87, with navy hover, across viewport sizes. Browser computed colors match; continuity notes updated.

---

## 2026-10-16 — Coordinate home palette across desktop and mobile

Added shared color tokens and a color-only stylesheet for cream, soft-red and light-blue home sections, denim footer, navy type, deep-red primary buttons and blue selected controls. Section-matched header, forms/booking, finish controls and focus states follow the palette. Original hero blue and layouts preserved. Build passed; desktop/mobile visual checks and palette contrast calculations recorded in architecture/DESIGN.md. No shared production/backend edits or deployment.

---

## 2026-10-16 — Remove third-section pause control

Removed gallery pause/resume button and unused manual state. Two-second slideshow and automatic visibility/reduced-motion handling retained. Build passed; browser confirms seven tiles and no gallery control. Continuity docs updated.

---

## 2026-10-16 — Slow mosaic rotation and fill photos edge to edge

Third-section category images now rotate every two seconds. Removed decorative duplicated backdrops and switched foreground photos to cover the unchanged mosaic cells, with intentional edge cropping. Build passed; desktop/mobile cover fit and removed backdrops checked in browser. Architecture and design notes updated. No shared production/backend changes.

---

## 2026-10-16 — Restore fixed mosaic and rebuild mobile lower sections

**Change:** Compared supplied barqmech_old mosaic source; restored fixed slideshow cells with complete foreground photos and subdued matching backdrops. Preserved desktop outside the gallery and mobile hero. Added home-responsive.css for upright collection grid, larger product edit, stacked workshop/finish controls, one-column contact/demo and natural-height footer. Compact mobile navigation no longer covers the footer. Mobile booking reveals its panel; short-footer end detection prevents residual scrolling.
**Checks:** Production build passed; visual review at 390px, narrow 319px and wide-phone 430px bounds checks, desktop 1440px mosaic geometry. Checked product-category routes, finish/backlight, booking validation/focus/draft preservation and footer extra-scroll movement 0px. Architecture and DESIGN.md updated with current ownership, artifacts and limitations. No external submissions, shared production/backend edits, dependencies or deployment.

---

## 2026-10-16 — Rotating category images with whole-photo fitting

**Change:** Seven category-specific slideshows cycle all 42 photos at a configured one-second interval with short fades. Preserve mosaic positions; scale complete images proportionally to fit both tile dimensions, remove hover zoom, and attach labels/gradients to the fitted photo frames. Added gallery pause/play and visibility/reduced-motion handling. Local MosaicSlideshow adapts older gallery behavior; shared production files untouched.
**Checks:** Production build passed. Browser observed every category changing across samples, pause stability/resume, all source images loaded, proportional fitted frames and phone layout without horizontal overflow. Precise mutation timing and reduced-motion/hidden-tab runtime emulation not verified. Architecture/DESIGN updated.

---

## 2026-10-16 — Remove mosaic Discover visuals

Removed Discover buttons from all seven In your space tiles and deleted unused button CSS. Titles, image layout and full-tile category navigation retained. Architecture/design notes updated.

---

## 2026-10-16 — Reference-matched mosaic and footer scroll endpoint

**Change:** Rebuilt third section around the user's screenshot: packed seven-tile mosaic, full-image crops, overlaid titles and blue Discover/category links. Selected matching existing photos; added phone/compact layouts. Retained orange surface and approved sections. Fixed narrow footer's 13px excess via spacing and clamped fitting-final-section navigation to document end.
**Checks:** Production build passed. Desktop reference comparison, phone/compact geometry and no horizontal overflow; actual contact→footer/reverse wheel checks. Extra downward gesture moves 0px at the footer on phone and original narrow preview. Architecture/DESIGN updated with evidence and source-resolution/untested limits.
**Scope:** New app and continuity docs only; no shared backend/production edits, dependencies, deployment or external submissions.

---

## 2026-10-16 — Hero fit, composition audit and direct demo booking

**Change:** Hero now uses measured header height with corrected mobile offsets and short-screen sizing; restored angled collection with grouped title/copy; rebalanced application collage and quieter over-image labels; replaced numbered workshop steps with shop/finish/contact actions. Demo form opens in one click, keeps message drafts, validates email and restores focus on close. Product edit and blue footer preserved.
**Checks:** Production build passed; desktop/laptop/phone/compact screenshot review; actual first-wheel hero→collection at 1280×720 and 319×668, with hint/content visible. Checked demo validation/focus/draft preservation and Silver action. External scheduling, emails/orders and deployment not exercised.
**Docs:** Architecture and DESIGN.md updated, with composition screenshot references and remaining limitations. No shared-production/backend changes or added dependencies.

---

## 2026-10-16 — Frameless imagery, blue collection/footer and clearer body text

**Change:** Light-blue collection and denim-blue footer/header themes; remove image/pattern mats and enlarge visuals; reorganize source-ratio collage with readable navy/white labels over photos. Home supporting text now Segoe UI/Arial at weight 600 with larger labels; display headings retained. Enlarged transparent finish study keeps finish/backlight controls.
**Checks:** New storefront production build passed. Browser checks at desktop/phone/compact sizes found no horizontal document overflow and all lower chapters fitting available height; verified category routes, transparent backing styles, body weight, finish controls and footer end geometry. Narrow/short screens retain native scrolling for taller content.
**Continuity:** Architecture and DESIGN.md updated. No shared production/backend edits, new dependencies, deployment or form submissions.

---

## 2026-10-15 — Home palette and browsing refinements

**Change:** Restored hero blue; added section-themed header/navigation colors; restored asymmetric orange application collage; replaced product pills with a picture-led collection index and staggered product reveal; coordinated berry/plum controls, lightened workshop to lilac, strengthened custom-work typography and made footer wordmark blue. Tightened footer bottom padding, distributed content and moved its chapter controls above content.
**Validation:** TypeScript/Vite build passed. Browser checks across desktop, phone and compact/short preview panels found no horizontal overflow and all lower chapters fitting available height. Checked category destinations/keyboard activation, finish controls, header colors, wheel/strip controls and footer reaching document end. Architecture and DESIGN.md updated with evidence, research links and remaining limits.
**Scope:** New storefront and continuity docs only; no backend/shared-production changes, new dependencies, deployment or form submissions.

---

## 2026-10-15 — Bright lower-home revision; strip and footer repairs

**Feedback:** User rejected the first lower-home design and blue/navy palette, reported looping/scroll/footer issues, and requested better fitted images and purposeful motion. Hero layout/video retained; accent change allowed.
**Change:** Replaced lower-home styling/structure with citron/orange/peach/workshop-green surfaces, uncropped image samples, interactive room selector, product second-view hover, an original SVG finish/backlight study, plain inquiry area and full-screen brand footer. Hero text/CTA accents now bright citron. Footer joins all scroll targets/previous-next/dropdown controls; removed fine-pointer wheel restriction and hover pause; retained explicit pause/reduced motion and added aligned-section resize handling. Large wall-panel image now uses a 1188×1118 source instead of a tiny thumbnail.
**Validation:** TypeScript/Vite production build passes. Browser-reviewed four viewport sizes; measured loop motion and pause/resume; verified contact→footer single wheel gesture, reverse, back-to-top, room/finish interactions, actual image dimensions, category routing and home cleanup. Clean reload recorded no new console errors. Native touch, reduced-motion emulation, cross-browser/axe/Lighthouse and external form/order submissions not run.
**Docs:** Updated architecture/current evidence/session and `DESIGN.md`; preserved prior rejected revision as history. New screenshots in `docs/previews/home-bright-*.png`.
**Scope:** New storefront only; no old-store/backend/schema/deployment edits, cloud writes, new packages or paid calls. Visual approval remains with the user.

---

## 2026-10-15 — New home chapters, category design and section scrolling

**Request:** Preserve the opening hero/video; improve the loop strip/categories and fit lower sections into a one-scroll-per-section flow.
**Change:** New category index/preview/counts, pausable capability strip, editorial collections grid, category-switched four-product selection, process/finish study and compact contact. Added home-only viewport/header-aware navigation with gesture guard, keyboard/direct controls and native overflow behavior. New files: `useHomeSections.ts`, `home-sections.css`, scoped `DESIGN.md`. Added missing TypeScript `@store/*` path mapping.
**Validation:** `npm run build` passes (TypeScript + Vite). Browser-reviewed at desktop/laptop/phone sizes; checked wheel forward/reverse, PageDown, chapter/category/product controls, strip pause, mobile contact disclosure, cart scroll lock and route cleanup. Native touch, reduced-motion emulation and automated accessibility/performance audits not run.
**Docs:** Architecture sections/backlog/evidence/session updated; screenshot at `docs/previews/home-categories-desktop.png`.
**Scope:** New app only; no production deployment, shared backend/old-store edits, external writes, new packages or email/order submissions.

---

## 2026-10-15 — Adopt V4 development reference

**Request:** Use `AUTONOMOUS_VIBE_RECONCILED_V4_PACK/` throughout future project work and consider useful supporting tools.
**Change:** Added standing adoption and correct nested resource paths to root `AGENTS.md`; recorded the reference, decision, and session in `docs/NEW-DESIGN-ARCHITECTURE.md`. Preserve existing project continuity and shared-production boundaries.
**Validation:** Documentation only; no tools installed or application changes made. Prior pack validation/lookup/status checks are documented separately.

---

## 2026-10-13 — Move updated hero video into source

**Problem:** Updated video was placed in generated `CodeShinobi/barqmech-store/dist/assets`, while development imports the older root `video/stitched-4x-fixed.mp4`.
**Fix:** Copied the updated video into the imported source path; preserved the previous version as `video/stitched-4x-fixed.before-2026-10-13.mp4`.
**Validation:** SHA-256 source and edited asset hashes match. Playback not checked; build blocker remains.
**Docs:** Updated `docs/NEW-DESIGN-ARCHITECTURE.md` session log.

---

## 2026-10-13 — New-design architecture and continuity baseline

**Problem:** Frontend/backend improvement work needs a persistent, source-based map of the new storefront and its production dependencies.
**Fix:** Added `docs/NEW-DESIGN-ARCHITECTURE.md` with routes, providers, shared modules, catalog/pricing/imports, cart/checkout, order/email/CAD, contact/admin, SQL/RLS, configuration, deployment, risks, validation, and a session/decision log. Added root `AGENTS.md` to maintain it in each project response and linked it from the new-app README.
**Validation:** New frontend responds HTTP 200 on port 5175. `npm run build` fails at TypeScript because the new app has Vite `@store` aliases without TypeScript path mapping. No cloud writes or email/order submissions performed.
**Follow-up:** Repair the new build; align environment targeting/local API coverage; address server-authoritative pricing and durable order/email handling. Current handler attempts unchecked anon deletion on customer email failure, contrary to older README claims.

---

## 2026-09-04 — Restore listing rotation/hover + PDP readability (Shinobi copy)

**Problem:** CodeShinobi storefront category cards used a single static thumb (no auto-rotate / hover zoom). PDP copy/actions sat on transparent panels over the video and were hard to read.
**Fix:** `ProductListingCard` + home `ProductCard` use original `RotatingImageStack` with store-style opacity/zoom CSS; PDP copy/gallery/buttons get opaque panels and explicit colors in `shinobi.css`.
**Files:** `CodeShinobi/barqmech-store/src/components/ProductListingCard.tsx`, `pages/ShinobiHomePage.tsx`, `shinobi.css`, products/search routes (`cardIndex`).

---

## 2026-09-04 — Products page text invisible until hover

**Problem:** On CodeShinobi storefront `/products`, sort select values and listing title/price often missing until hover.
**Root cause:** Chromium compositing — full-page SVG-filter grain overlay (`z-index: 9998`) above UI, plus `backdrop-filter` on listing cards/sidebar.
**Fix:** Removed global `.shinobi-grain`; disabled backdrop-filter on products sidebar/cards; opaque card body; explicit select/input colors; replaced video SVG grain with a simple CSS stripe.
**Files:** `CodeShinobi/barqmech-store/src/shinobi.css`, `ShinobiLayout.tsx`

---

## 2026-05-22 — Size (inches) labels on PDP, cart, checkout

**Fix:** `formatSizeDisplay()` appends ` in` when missing; field label **Size (inches)** on product page.

---

## 2026-05-22 — Product search typeahead + full results page

**Fix:** Topbar search matches site styling; live filter by product title; dropdown shows 5 hits + “Show more”; `/products/search?q=…` with breadcrumb Home / Products / Search.

**Files:** `ProductSearch.tsx`, `ShopTopbar.tsx`, `searchProducts.ts`, `ProductsSearchRoute.tsx`; shared topbar on shop routes.

---

## 2026-05-22 — Living domain / email launch plan

**Problem:** Rollout steps (Vercel domain, cPanel DNS, Zoho Mail, Resend verify, env vars) lived only in chat.

**Fix:** Added [`docs/BARQMECH-COM-SETUP.md`](docs/BARQMECH-COM-SETUP.md) with phased checklists, DNS/env tables, test matrix, and session log. Linked from README.

**Follow-up:** Execute phases 0–4; check boxes and append session log + DNS table rows as each step completes.

---

## 2026-05-15 — Catalog pricing diagnostics + embed/fallback loader

**From `Media/html.txt`:** PDP `[Islamic] 3 Quls Square` showed empty size pills, `Rs. 0`, old `product-detail-hero-track` (stale JS). DB has 1 variant / 3 sizes for `islamic-3-quls-square`.

**Fix:** `loadCatalog.ts` — embed `catalog_variants`, paginated fallback if &lt;500 variants, normalize single-object embed. `CatalogPricingAlert` on PDP/shop with counts + Retry. `CatalogProvider` exposes `diagnostics` + `error`.

---

## 2026-05-15 — Embedded catalog_variants + remove vite define override

**Problem:** Vercel env correct but prices/sizes still missing after pagination fix.

**Root cause:** `vite.config.ts` `define: { 'import.meta.env.VITE_*': … }` can bake empty strings at build time and override real Vercel env. Separate paginated `catalog_variants` fetch was also fragile in browsers.

**Fix:** Removed `define` block; backfill `process.env.VITE_*` from `SUPABASE_*` only when unset. Load products with nested `catalog_variants (...)` in one PostgREST query (~346 products, ~2350 variants). PDP shows list price fallback when tier price is 0.

---

## 2026-05-15 — Local catalog env + variant fetch (prices still missing)

**Problem:** Prices/sizes still empty locally after pagination fix.

**Root cause:** `store/.env.local` had `SUPABASE_URL` / `SUPABASE_ANON_KEY` only. Vite does not expose those to the browser — only `VITE_*` (unless mapped). Catalog never talked to Supabase in `npm run dev`.

**Fix:** `vite.config.ts` maps `SUPABASE_*` → `import.meta.env.VITE_SUPABASE_*` at build/dev time; `.env.local` also lists `VITE_` duplicates. `fetchAllCatalogVariants` no longer uses a 346-id `.in()` filter (short URLs). `normalizeVariantPricing` handles JSON string + legacy key names.

**Vercel:** Ensure Production has `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (or `SUPABASE_*` — now picked up at build). Hard refresh after deploy.

---

## 2026-05-15 — Catalog prices/sizes missing + slow images

**Problem:** PDP showed no size pills and Rs. 0 prices for most products; gallery felt slow.

**Root cause:** `CatalogProvider` loaded `catalog_variants` in one query. PostgREST returns at most **1000 rows**, but the DB has **~2355 variants** across 346 products — only ~6 products received variant data; ~340 had empty `variants[]`.

**Fix:** `store/src/catalog/fetchCatalogVariants.ts` paginates variant fetches in 1000-row pages.

**Images:** Supabase `/render/image/` transforms return 403 (not enabled on this plan). PDP now uses a **single hero `<img>`** (swap `src` on slide change) instead of mounting every slide at once; lightbox still uses full URL. Optional transform helper: `store/src/catalog/productImages.ts` (falls back via `onError`).

**Docs:** `docs/CATALOG-SUPABASE.md` — CSV/folder layout, buckets, tables, import commands.

**Skill:** `.cursor/skills/barqmech-updates/SKILL.md` — append to this file after catalog/Supabase/import work.

**Data check:** Pricing in DB is valid (sample: sizes `12 x 24`, `18 x 36`, `24 x 48`, Silver ~9800–12800 PKR). `Media/Finalized/` was not in this workspace clone — re-import needs that tree + `prices_summary.csv` on disk.


## 2026-10-20 — V3 backend and release preparation

- Bootstrapped the user-selected new Supabase project with private live catalog/orders, imported346 listings and20 historical orders, and copied342 non-Panel DXFs with per-file SHA256 verification. Panels remain manual file supply; original project retained.
- Configured existing Vercel project and verified order/contact sender. Published release branch/PR and recovery tag;42 tests and actual Preview route/admin/catalog/media/rejection checks pass.
- Fixed deployed admin module startup through explicit ESM, malformed cookies, foreign-origin admin mutations and slow stale-edit RPC responses. Added migration015 for PT409 conflicts.
- Configured encrypted GitHub notification retry secrets and verified encrypted backup including live listings. Production/email acceptance still pending at this entry.


## 2026-10-20 — V3 production release

- Merged PR1 and deployed V3.42 tests/CI pass. Real production owner-only mixed order/email/receipt/private-DXF/idempotency test passed; both emails delivered. QA order marked completed and DO NOT FULFILL;20 historical orders preserved.
- Reviewed desktop/mobile cart/checkout, default Black finish, media delivery and hero/offscreen playback state; saved screenshots and aggregate evidence. Temporary browser cart item removed.
- Revoked temporary Preview bypass; configured verified www/bare/Vercel domains and canonical www origin for the follow-up build. Previous deployment, source database and recovery tag retained. No broad device/performance or inbox visual certification claimed.


Final2026-10-20 verification: production canonical/sitemap use www.barqmech.com; www/bare/Vercel origins accepted and foreign origins rejected. Main CI green. Both approved test messages show delivered; no further emails sent. Final domain evidence and architecture status updated.
