-- Fresh V3 project only. Do not run against the legacy production database.
-- Follow with 012_v3_live_listings.sql and 013_v3_nonbreaking_prepare.sql.
create table public.orders (
 id uuid primary key default gen_random_uuid(), order_code text not null unique,
 customer_name text not null, customer_email text not null, customer_phone text not null,
 address_line1 text not null, city text, notes text, lines jsonb not null,
 subtotal_pkr integer not null check(subtotal_pkr>=0), shipping_pkr integer not null check(shipping_pkr>=0),
 grand_total_pkr integer not null check(grand_total_pkr>=0), payment_method text not null default 'cod',
 created_at timestamptz not null default now(), order_completed boolean not null default false,
 order_completed_at timestamptz, order_date timestamptz generated always as(created_at) stored,
 constraint order_code_six_digits check(order_code ~ '^[0-9]{6}$')
);
create index orders_created_at_idx on public.orders(created_at desc);
alter table public.orders enable row level security;
revoke all on public.orders from anon,authenticated;
grant all on public.orders to service_role;

create table public.catalog_products (
 id uuid primary key, slug text not null unique, title text not null,
 category text not null check(category in ('Islamic','Artwork','Panels','Misc')),
 image_urls text[] not null default '{}', created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create table public.catalog_variants (
 id uuid primary key default gen_random_uuid(), product_id uuid not null references public.catalog_products(id),
 design_code integer not null, sort_order integer not null default 0, pricing jsonb not null,
 dxf_storage_path text, created_at timestamptz not null default now(), unique(product_id,design_code)
);
create index catalog_variants_product_id_idx on public.catalog_variants(product_id);
alter table public.catalog_products enable row level security;
alter table public.catalog_variants enable row level security;
revoke all on public.catalog_products,public.catalog_variants from anon,authenticated;
grant all on public.catalog_products,public.catalog_variants to service_role;

insert into storage.buckets(id,name,public,file_size_limit)
 values('product-dxf','product-dxf',false,50000000),('product-images','product-images',true,10000000);
-- No storage SELECT/write policy is created for private DXFs. Server service role only.
-- product-images remains empty: public delivery images are deployed from GitHub to Vercel.
