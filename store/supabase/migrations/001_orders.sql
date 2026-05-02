-- BarqMech orders (run once in Supabase SQL Editor: https://supabase.com/dashboard/project/_/sql)

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_code text not null unique,
  customer_name text not null,
  customer_email text not null,
  customer_phone text not null,
  address_line1 text not null,
  city text,
  notes text,
  lines jsonb not null,
  subtotal_pkr integer not null check (subtotal_pkr >= 0),
  shipping_pkr integer not null check (shipping_pkr >= 0),
  grand_total_pkr integer not null check (grand_total_pkr >= 0),
  payment_method text not null default 'cod',
  created_at timestamptz not null default now(),
  constraint order_code_six_digits check (order_code ~ '^[0-9]{6}$')
);

create index if not exists orders_created_at_idx on public.orders (created_at desc);

alter table public.orders enable row level security;

-- Server uses publishable or anon key: allow inserts only (no SELECT policies → no public reads)
drop policy if exists "orders_anon_insert" on public.orders;
drop policy if exists "orders_client_insert" on public.orders;
create policy "orders_client_insert"
  on public.orders
  for insert
  with check (true);

-- Optional: allow service_role full access (default when using service key)

comment on table public.orders is 'COD checkout orders from barqmech store';

-- Line items are stored on orders.lines (JSONB, enriched at checkout: product_url, product_link, image_url, etc.). Optional: 006_drop_order_lines.sql removes legacy order_lines table. See 007 for order_date, product_links, order_completed_at, and order_products view.
