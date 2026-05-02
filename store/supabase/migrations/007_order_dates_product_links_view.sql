-- Order dates, completion timestamp, denormalized product URLs, and a line-items view for SQL/reporting.
-- Run in Supabase SQL Editor after 001 + 005 (and 006 if you dropped order_lines).

-- When the order was marked complete (cleared when toggled back to open).
alter table public.orders
  add column if not exists order_completed_at timestamptz;

comment on column public.orders.created_at is 'When the order was placed (canonical order timestamp).';
comment on column public.orders.order_completed_at is 'When order_completed was set to true; NULL when false or never completed.';

-- Explicit order date for exports/reports (mirrors created_at).
alter table public.orders
  add column if not exists order_date timestamptz generated always as (created_at) stored;

comment on column public.orders.order_date is 'Same as created_at; stored for clarity in joins and spreadsheets.';

-- Note: Postgres disallows subqueries in GENERATED columns, so we do not store product_links on orders.
-- The order_products view below exposes order_product_urls aggregated from orders.lines.

-- One row per cart line: separate columns + order_code for joining to orders.
create or replace view public.order_products as
select
  o.id as order_id,
  o.order_code,
  o.created_at as order_placed_at,
  o.order_date,
  o.order_completed,
  o.order_completed_at,
  (
    select coalesce(
      jsonb_agg(
        coalesce(
          nullif(e->>'product_url', ''),
          nullif(e->>'product_link', ''),
          nullif(e->>'productUrl', ''),
          ''
        )
      ),
      '[]'::jsonb
    )
    from jsonb_array_elements(
      case
        when jsonb_typeof(coalesce(o.lines, 'null'::jsonb)) = 'array' then coalesce(o.lines, '[]'::jsonb)
        else '[]'::jsonb
      end
    ) as e
  ) as order_product_urls,
  elem->>'id' as line_id,
  coalesce(nullif(elem->>'sort_index', '')::integer, 0) as sort_index,
  elem->>'product_id' as product_id,
  elem->>'merge_key' as merge_key,
  elem->>'title' as title,
  coalesce(
    nullif(elem->>'product_url', ''),
    nullif(elem->>'product_link', ''),
    nullif(elem->>'productUrl', ''),
    ''
  ) as product_url,
  coalesce(nullif(elem->>'image_url', ''), nullif(elem->>'imageUrl', '')) as image_url,
  coalesce(nullif(elem->>'slug', ''), '') as slug,
  coalesce(nullif(elem->>'category_slug', ''), nullif(elem->>'categorySlug', '')) as category_slug,
  coalesce(nullif(elem->>'size', ''), '') as size,
  coalesce(nullif(elem->>'finish', ''), '') as finish,
  (lower(coalesce(elem->>'wooden_frame', elem->>'woodenFrame', 'false')) in ('true', '1', 't')) as wooden_frame,
  (lower(coalesce(elem->>'led_backlight', elem->>'ledBacklight', 'false')) in ('true', '1', 't')) as led_backlight,
  (lower(coalesce(elem->>'installation', 'false')) in ('true', '1', 't')) as installation,
  coalesce(nullif(elem->>'quantity', '')::integer, 1) as quantity,
  coalesce(
    (nullif(elem->>'unit_price_pkr', ''))::integer,
    (nullif(elem->>'unitPrice', ''))::integer
  ) as unit_price_pkr,
  (nullif(elem->>'line_subtotal_pkr', ''))::integer as line_subtotal_pkr,
  (nullif(elem->>'shipping_line_pkr', ''))::integer as shipping_line_pkr
from public.orders o
cross join lateral jsonb_array_elements(
  case
    when jsonb_typeof(coalesce(o.lines, 'null'::jsonb)) = 'array' then coalesce(o.lines, '[]'::jsonb)
    else '[]'::jsonb
  end
) as elem;

comment on view public.order_products is
  'Line items expanded from orders.lines. Join to public.orders on order_code or order_id.';

revoke all on public.order_products from anon;
revoke all on public.order_products from authenticated;
grant select on public.order_products to service_role;
