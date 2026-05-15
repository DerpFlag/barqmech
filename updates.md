# BarqMech development log

Chronological notes for agents and humans. Append new entries at the **top**.

---

## 2026-05-15 — Catalog prices/sizes missing + slow images

**Problem:** PDP showed no size pills and Rs. 0 prices for most products; gallery felt slow.

**Root cause:** `CatalogProvider` loaded `catalog_variants` in one query. PostgREST returns at most **1000 rows**, but the DB has **~2355 variants** across 346 products — only ~6 products received variant data; ~340 had empty `variants[]`.

**Fix:** `store/src/catalog/fetchCatalogVariants.ts` paginates variant fetches in 1000-row pages.

**Images:** Supabase `/render/image/` transforms return 403 (not enabled on this plan). PDP now uses a **single hero `<img>`** (swap `src` on slide change) instead of mounting every slide at once; lightbox still uses full URL. Optional transform helper: `store/src/catalog/productImages.ts` (falls back via `onError`).

**Docs:** `docs/CATALOG-SUPABASE.md` — CSV/folder layout, buckets, tables, import commands.

**Skill:** `.cursor/skills/barqmech-updates/SKILL.md` — append to this file after catalog/Supabase/import work.

**Data check:** Pricing in DB is valid (sample: sizes `12 x 24`, `18 x 36`, `24 x 48`, Silver ~9800–12800 PKR). `Media/Finalized/` was not in this workspace clone — re-import needs that tree + `prices_summary.csv` on disk.
