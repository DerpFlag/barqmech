-- Allow inserts from the Supabase client (anon / authenticated / publishable JWT roles).
drop policy if exists "orders_anon_insert" on public.orders;
drop policy if exists "orders_client_insert" on public.orders;

create policy "orders_client_insert"
  on public.orders
  for insert
  with check (true);
