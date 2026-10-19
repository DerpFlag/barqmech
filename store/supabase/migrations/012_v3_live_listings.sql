-- Prepared only: isolated V3 catalog, no changes to legacy catalog or orders.
create table if not exists public.v3_storefront_listings (
 id uuid primary key, slug text not null unique check(slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'), title text not null,
 description text not null default '', category text not null check(category in ('Islamic','Artwork','Panels','Misc')),
 status text not null default 'disabled' check(status in ('active','disabled','archived')),
 images jsonb not null check(jsonb_typeof(images)='array'), variants jsonb not null check(jsonb_typeof(variants)='array'),
 starting_price integer not null check(starting_price>0), design_count integer not null check(design_count>0),
 revision bigint not null default 1, updated_at timestamptz not null default now()
);
alter table public.v3_storefront_listings enable row level security;
revoke all on public.v3_storefront_listings from anon,authenticated;
grant all on public.v3_storefront_listings to service_role;
create or replace function public.save_v3_storefront_listing(p_id uuid,p_revision bigint,p_document jsonb)
returns public.v3_storefront_listings language plpgsql security invoker set search_path=public as $$
declare saved public.v3_storefront_listings;
begin
 if p_revision=0 then
  insert into public.v3_storefront_listings(id,slug,title,description,category,status,images,variants,starting_price,design_count)
  values(p_id,p_document->>'slug',p_document->>'title',p_document->>'description',p_document->>'category',p_document->>'status',p_document->'images',p_document->'variants',(p_document->>'starting_price')::integer,(p_document->>'design_count')::integer) returning * into saved;
 else
  update public.v3_storefront_listings set title=p_document->>'title',description=p_document->>'description',category=p_document->>'category',status=p_document->>'status',images=p_document->'images',variants=p_document->'variants',starting_price=(p_document->>'starting_price')::integer,design_count=(p_document->>'design_count')::integer,revision=revision+1,updated_at=now()
  where id=p_id and revision=p_revision and slug=p_document->>'slug' returning * into saved;
  if not found then raise exception 'Listing revision conflict' using errcode='40001'; end if;
 end if;
 return saved;
end $$;
revoke all on function public.save_v3_storefront_listing(uuid,bigint,jsonb) from public,anon,authenticated;
grant execute on function public.save_v3_storefront_listing(uuid,bigint,jsonb) to service_role;
