-- Normalized line items (add-ons + product URL + image URL). Run in Supabase SQL Editor or: npm run db:apply-sql -- supabase/migrations/004_order_lines.sql

create table if not exists public.order_lines (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  sort_index integer not null,
  product_id text not null default '',
  merge_key text,
  slug text not null,
  category_slug text not null,
  product_url text not null default '',
  title text not null,
  image_url text not null default '',
  size text not null,
  finish text not null,
  wooden_frame boolean not null default false,
  led_backlight boolean not null default false,
  installation boolean not null default false,
  quantity integer not null check (quantity > 0 and quantity <= 999),
  unit_price_pkr integer not null check (unit_price_pkr >= 0),
  line_subtotal_pkr integer not null check (line_subtotal_pkr >= 0),
  shipping_line_pkr integer not null default 0 check (shipping_line_pkr >= 0),
  created_at timestamptz not null default now(),
  constraint order_lines_sort_unique unique (order_id, sort_index)
);

create index if not exists order_lines_order_id_idx on public.order_lines (order_id);

alter table public.order_lines enable row level security;

drop policy if exists "order_lines_client_insert" on public.order_lines;
create policy "order_lines_client_insert"
  on public.order_lines
  for insert
  with check (true);

comment on table public.order_lines is 'Per-item rows: URLs and add-on flags for each order line';
