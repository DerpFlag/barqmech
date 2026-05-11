-- Per-variant CAD file in Storage (private bucket). Path stored on row; signed URLs generated at order time.

alter table public.catalog_variants
  add column if not exists dxf_storage_path text;

comment on column public.catalog_variants.dxf_storage_path is
  'Path inside product-dxf bucket, e.g. artwork-foo/dc1.dxf. Signed download URL built server-side for emails.';

insert into storage.buckets (id, name, public)
values ('product-dxf', 'product-dxf', false)
on conflict (id) do update set public = excluded.public;

-- Private bucket: no public SELECT policy. Service role bypasses RLS for uploads and createSignedUrl.
