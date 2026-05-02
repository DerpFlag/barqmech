-- Order fulfillment flag for admin control centre. Run in Supabase SQL Editor.

alter table public.orders
  add column if not exists order_completed boolean not null default false;

comment on column public.orders.order_completed is 'True when the order is fully fulfilled (admin marks complete).';
