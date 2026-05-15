---
name: barqmech-updates
description: >-
  Append dated development notes to the repo root updates.md after BarqMech
  catalog, Supabase, import, pricing, or storefront work. Use when finishing
  coherent changes, fixing catalog bugs, or when the user asks to document
  history for the next session.
---

# BarqMech updates log

## When to use

After any meaningful change to catalog import, Supabase schema/storage, pricing, product images, or storefront catalog loading — **before ending the task**.

## What to do

1. Read the top of repo-root **`updates.md`** for recent context (avoid duplicate entries).
2. **Prepend** a new section at the top (below the title block), using this template:

```markdown
## YYYY-MM-DD — Short title

**Problem:** …
**Root cause:** … (if known)
**Fix:** files/behavior changed
**Docs:** paths updated (e.g. docs/CATALOG-SUPABASE.md)
**Follow-up:** optional next steps
```

3. Keep entries factual and brief (bullet lines OK). Do not paste secrets from `Media/Keys.txt`.
4. If catalog layout changed, also update **`docs/CATALOG-SUPABASE.md`** in the same task.

## Related references

- Catalog layout: `docs/CATALOG-SUPABASE.md`
- Import: `store/scripts/import-finalized-catalog.mjs`
- Image URL resync: `store/scripts/rebuild-image-urls-from-storage.mjs`
