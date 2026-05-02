# BarqMech

Repository: [github.com/DerpFlag/barqmech](https://github.com/DerpFlag/barqmech).

Vite + React storefront in [`store/`](./store/), shared assets in [`Media/`](./Media/), serverless routes in [`api/`](./api/).

## Local development

1. `cd store && npm install`
2. From repo root: `npm install` (API dependencies for `/api/*`)
3. Create `store/.env.local` (see `store/.env.example`); never commit secrets.
4. Terminal A: `cd store && npm run dev:api` — serves `POST http://127.0.0.1:3000/api/place-order`
5. Terminal B: `cd store && npm run dev` — Vite proxies `/api` to port 3000

## Deploy (Vercel)

Connect this repo to [Vercel](https://vercel.com). **Leave “Root Directory” empty** (repository root) so `Media/` is available to the Vite build and `api/` is deployed.

| Setting | Value |
|--------|--------|
| Framework Preset | Other (or Vite — overridden below) |
| Install Command | `npm install && cd store && npm install` |
| Build Command | `cd store && npm run build` |
| Output Directory | `store/dist` |

Set environment variables under **Project → Settings → Environment Variables** (see `store/.env.example`). Include **`ZEROBOUNCE_API_KEY`** if you want the same email verification on checkout, contact, and demo flows (HF used only ZeroBounce; no extra spam hooks there).

**Resend:** `ORDER_FROM_EMAIL` is usually plain `onboarding@resend.dev`. `RESEND_FROM_EMAIL` can be `BarqMech <onboarding@resend.dev>` (display name + space + angle brackets + address). Until you [verify a domain](https://resend.com/docs/dashboard/domains/introduction) in Resend, stay on `onboarding@resend.dev` and only send tests to allowed recipients.

## Database

Apply SQL in Supabase (SQL Editor) from `store/supabase/migrations/` in order (`001`, `002` if needed, `004` for `order_lines`), or run `cd store && npm run db:apply-orders` and `npm run db:apply-sql -- supabase/migrations/004_order_lines.sql` if `Media/Keys.txt` exists locally (not in git).

## Note on `HF/`

The [`HF/`](./HF/) folder is ignored by git by default (large local assets). Remove the `/HF/` line in `.gitignore` if you want it tracked.
