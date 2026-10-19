-- Additive setup for V3. Review and apply to the order database before cutover.
alter table public.orders add column if not exists request_hash text;
alter table public.orders add column if not exists notifications jsonb;

create table if not exists public.storefront_request_limits (
  key text primary key,
  requests integer not null,
  expires_at timestamptz not null
);
alter table public.storefront_request_limits enable row level security;
revoke all on public.storefront_request_limits from anon, authenticated;

create or replace function public.claim_storefront_request(p_key text,p_limit integer,p_seconds integer)
returns boolean language plpgsql security definer set search_path=public as $$
declare current_count integer;
begin
  if p_limit < 1 or p_limit > 100 or p_seconds < 60 or p_seconds > 3600 or length(p_key)>150 then return false; end if;
  insert into public.storefront_request_limits as limits(key,requests,expires_at)
  values(p_key,1,now()+make_interval(secs=>p_seconds))
  on conflict(key) do update set
    requests=case when limits.expires_at<=now() then 1 else limits.requests+1 end,
    expires_at=case when limits.expires_at<=now() then now()+make_interval(secs=>p_seconds) else limits.expires_at end
  returning requests into current_count;
  return current_count<=p_limit;
end;$$;
revoke all on function public.claim_storefront_request(text,integer,integer) from public,anon,authenticated;
grant execute on function public.claim_storefront_request(text,integer,integer) to service_role;

-- At cutover the server uses service_role; direct browser inserts must stop.
-- This intentionally changes the legacy anon-key order API contract.
-- Apply only with the new API release, keeping the old production deployment intact until cutover.
drop policy if exists orders_client_insert on public.orders;
drop policy if exists orders_anon_insert on public.orders;
revoke insert,update,delete on public.orders from anon,authenticated;
