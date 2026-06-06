# Catalog & home page tasks (2026-05-23)

Track progress for the five-item batch. Update checkboxes as work lands.

| # | Task | Status | Notes |
|---|------|--------|-------|
| 1 | Hide **Wooden Frame** add-on on product detail page (PDP) only; stays `false` elsewhere | ☑ | `SHOW_WOODEN_FRAME_ON_PDP` |
| 2 | **Size feasibility** — CSV `sizeN_feasible` → Supabase variant `pricing` JSON → grey out infeasible sizes on PDP | ☑ | `feasible` on each size tier |
| 3 | **Reimport pricing** from `Media/Finalized/prices_summary.csv` (compare vs `_old` first) | ☑ | **2355** variants updated; **115** CSV rows had no matching variant in DB (run full import if needed) |
| 4 | **Randomize** home page category carousels per visit (not `/products`) | ☑ | `shuffleHomeFeaturedByCategory` |
| 5 | **Local dev server** for review | ☑ | http://localhost:5173 |

## Task 1 — Wooden frame hidden on PDP

- Checkbox removed from PDP add-ons; `woodenFrame` state stays `false`.
- Cart, checkout, admin, and email copy unchanged.

## Task 2 — Size feasibility

- CSV columns: `size1_feasible`, `size2_feasible`, `size3_feasible` (`0` = not feasible).
- Stored per size tier in variant `pricing.sizes[].feasible` (boolean).
- PDP: infeasible sizes greyed out, not selectable; note: *Design too complex for this size.*

## Task 3 — Pricing refresh

- Compare: `Media/Finalized/prices_summary_old.csv` vs `prices_summary.csv` (2474 DXF rows each).
- Update variant pricing in Supabase without re-uploading images when using pricing-only script.

## Task 4 — Home randomization

- On first catalog load per session, shuffle products within each category for home carousels only.

## Verification

- [x] PDP: no wooden frame checkbox; LED + installation still work
- [x] PDP: infeasible sizes greyed + note visible (after Supabase refresh)
- [x] Supabase variant pricing updated (2470 rows; 345 price diffs vs old CSV sample)
- [x] Home: category rows shuffled per visit; `/products` order unchanged
- [x] http://localhost:5173 loads
