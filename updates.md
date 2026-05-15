# BarqMech development log

Chronological notes for agents and humans. Append new entries at the **top**.

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
