# BarqMech catalog — local files and Supabase layout

Last verified: 2026-05-15 (project `ajaugjszvbsdxicswfwx`).

## Source of truth on disk (import input)

| What | Path | Notes |
|------|------|--------|
| Price + size matrix | `Media/Finalized/prices_summary.csv` | One row per **DXF** file; columns `size1_w_x_h_inches`, `size1_total_price_silver_usd`, etc. Values are **PKR integers** (column names still say `_usd`). |
| Product folders | `Media/Finalized/[Category]/…` | Folder name must start with `[Artwork]`, `[Islamic]`, `[Panels]` / `[Panel]`, or `[Misc]`. |
| Raster photos | Inside each product folder | All `.jpg`/`.png`/… under the folder (recursive, depth 4). |
| DXF files | Paths in CSV column `file` | Matched to design code from filename (e.g. `…_3.dxf` → design code `3`). |

Import script: `store/scripts/import-finalized-catalog.mjs`  
Run (from repo, with `store/.env.import.local` or keys from `Media/Keys.txt`):

```bash
cd store
node --env-file=.env.import.local scripts/import-finalized-catalog.mjs
```

Optional env: `PRICES_CSV`, `FINALIZED_ROOT`, `DRY_RUN=1`.

## Supabase — Postgres

| Table | Purpose |
|-------|---------|
| `catalog_products` | `slug`, `category`, `title`, `image_urls` (text array of public Storage URLs) |
| `catalog_variants` | Per design code: `design_code`, `sort_order`, `pricing` (jsonb), `dxf_storage_path` |

`pricing` JSON shape (per variant):

```json
{
  "sizes": [
    {
      "label": "12 x 24",
      "Silver": 11600,
      "Gold": 12000,
      "Black": 12500,
      "wooden": 500,
      "led": 800,
      "install": 1500
    }
  ]
}
```

RLS: public `SELECT` on both tables (see `store/supabase/migrations/008_catalog_products.sql`).

**Counts (2026-05-15):** ~346 products, ~2355 variants. PostgREST returns **max 1000 rows per request** — the storefront must paginate variant fetches (`fetchAllCatalogVariants`).

## Supabase — Storage

| Bucket | Public | Object path pattern | Content |
|--------|--------|---------------------|---------|
| `product-images` | yes | `{slug}/preview-0.jpg`, `preview-1.png`, … | All gallery images for a product (upload order = folder sort). |
| `product-dxf` | no (private) | `{slug}/dc{design_code}.dxf` | CNC DXF per variant; path stored in `catalog_variants.dxf_storage_path`. |

Public image URL pattern:

`https://<project>.supabase.co/storage/v1/object/public/product-images/<slug>/preview-0.jpg`

Resync `image_urls` from bucket only (no CSV):

```bash
cd store
node --env-file=.env.import.local scripts/rebuild-image-urls-from-storage.mjs
```

## Storefront env

`store/.env` (or Vite env): `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` — browser catalog reads only; no service role in the client.

## Image performance notes

- Full-size files are served from `product-images` (often ~150–500 KB+ per file).
- Supabase **image transforms** (`/storage/v1/render/image/...`) returned 403 on this project — enable on Pro or add smaller `preview-*` assets at import time.
- PDP loads **one hero URL at a time**; lightbox uses the original URL on zoom.

## Secrets

`Media/Keys.txt` — gitignored; service role for scripts only. Never commit or paste keys into chat/docs.
