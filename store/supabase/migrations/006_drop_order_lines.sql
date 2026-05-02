-- Line items live only on orders.lines (enriched JSON at checkout). Safe after API no longer inserts order_lines.

drop table if exists public.order_lines cascade;
