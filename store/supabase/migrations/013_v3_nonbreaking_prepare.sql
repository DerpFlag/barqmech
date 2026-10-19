-- Nonbreaking V3 preparation for the shared database.
-- Does not revoke legacy checkout writes or change existing order policies.
-- Permission cutover remains a separate coordinated deployment step.
alter table public.orders add column if not exists request_hash text;
alter table public.orders add column if not exists notifications jsonb;

create table if not exists public.storefront_request_limits (
  key text primary key,
  requests integer not null,
  expires_at timestamptz not null
);
alter table public.storefront_request_limits enable row level security;
grant all on public.storefront_request_limits to service_role;
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
