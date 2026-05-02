-- Deletes every row in public.orders (e.g. test checkouts). Safe while you have no production orders to keep.
-- Run manually in Supabase → SQL Editor. The order_products view updates automatically.
delete from public.orders;
