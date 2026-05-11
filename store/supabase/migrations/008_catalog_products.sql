-- Product catalog sourced from Media/Finalized + prices_summary.csv (PKR in JSON).
-- Public read for storefront; import script uses service role for writes + Storage uploads.

create table if not exists public.catalog_products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  category text not null check (category in ('Islamic', 'Artwork', 'Panels', 'Misc')),
  title text not null,
  image_urls text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.catalog_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.catalog_products (id) on delete cascade,
  design_code int not null,
  sort_order int not null default 0,
  pricing jsonb not null,
  created_at timestamptz not null default now(),
  unique (product_id, design_code)
);

create index if not exists catalog_variants_product_id_idx on public.catalog_variants (product_id);

create or replace function public.set_catalog_products_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists catalog_products_set_updated_at on public.catalog_products;
create trigger catalog_products_set_updated_at
before update on public.catalog_products
for each row execute function public.set_catalog_products_updated_at();

alter table public.catalog_products enable row level security;
alter table public.catalog_variants enable row level security;

drop policy if exists "catalog_products_select_public" on public.catalog_products;
create policy "catalog_products_select_public"
on public.catalog_products for select to anon, authenticated using (true);

drop policy if exists "catalog_variants_select_public" on public.catalog_variants;
create policy "catalog_variants_select_public"
on public.catalog_variants for select to anon, authenticated using (true);

insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "product_images_public_read" on storage.objects;
create policy "product_images_public_read"
on storage.objects for select
using (bucket_id = 'product-images');
