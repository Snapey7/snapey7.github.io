-- Paid membership state and private media catalog.
-- Run once in Supabase SQL Editor after creating the project.

create table if not exists public.memberships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null check (provider = 'verotel'),
  tier text not null check (tier in ('standard', 'impura')),
  status text not null check (status in ('active', 'canceled', 'expired', 'refunded', 'chargeback')),
  provider_subscription_id text not null unique,
  provider_reference_id text unique,
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists memberships_user_period_idx
  on public.memberships (user_id, current_period_end desc);

alter table public.memberships enable row level security;
drop policy if exists "Members can view their own membership" on public.memberships;
create policy "Members can view their own membership"
  on public.memberships for select to authenticated
  using ((select auth.uid()) = user_id);
revoke insert, update, delete on public.memberships from anon, authenticated;
grant select on public.memberships to authenticated;

create table if not exists public.verotel_events (
  event_key text primary key,
  event_type text not null,
  provider_subscription_id text not null,
  received_at timestamptz not null default now(),
  payload jsonb not null default '{}'::jsonb
);
alter table public.verotel_events enable row level security;
revoke all on public.verotel_events from anon, authenticated;

create table if not exists public.member_media (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  alt_text text not null,
  bucket text not null default 'member-media' check (bucket = 'member-media'),
  storage_path text not null unique,
  min_tier text not null check (min_tier in ('standard', 'impura')),
  created_at timestamptz not null default now()
);
alter table public.member_media enable row level security;
revoke all on public.member_media from anon, authenticated;

insert into storage.buckets (id, name, public)
values ('member-media', 'member-media', false)
on conflict (id) do update set public = false;

create or replace function public.apply_verotel_event(p_event_key text, p_payload jsonb)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid;
  v_tier text;
  v_sale_id text;
  v_event text;
  v_period_end timestamptz;
  v_status text;
begin
  v_user_id := (p_payload ->> 'custom1')::uuid;
  v_tier := p_payload ->> 'custom2';
  v_sale_id := p_payload ->> 'saleID';
  v_event := p_payload ->> 'event';

  if v_user_id is null or v_tier not in ('standard', 'impura') or v_sale_id is null or v_event is null then
    raise exception 'Invalid provider event';
  end if;

  insert into public.verotel_events (event_key, event_type, provider_subscription_id, payload)
  values (p_event_key, v_event, v_sale_id, p_payload)
  on conflict (event_key) do nothing;
  if not found then return; end if;

  if v_event in ('initial', 'rebill', 'extend', 'uncancel', 'upgrade') then
    v_period_end := case
      when coalesce(p_payload ->> 'nextChargeOn', p_payload ->> 'expiresOn') ~ '^\d{4}-\d{2}-\d{2}$'
        then (coalesce(p_payload ->> 'nextChargeOn', p_payload ->> 'expiresOn')::date + interval '1 day') at time zone 'UTC'
      else now() + interval '30 days'
    end;
    v_status := 'active';
  elsif v_event = 'cancel' then
    v_period_end := case
      when (p_payload ->> 'expiresOn') ~ '^\d{4}-\d{2}-\d{2}$'
        then ((p_payload ->> 'expiresOn')::date + interval '1 day') at time zone 'UTC'
      else now()
    end;
    v_status := 'canceled';
  elsif v_event = 'expiry' then
    v_period_end := now();
    v_status := 'expired';
  elsif v_event = 'chargeback' then
    v_period_end := now();
    v_status := 'chargeback';
  elsif v_event = 'credit' and p_payload ->> 'subscriptionPhase' = 'terminated' then
    v_period_end := now();
    v_status := 'refunded';
  else
    return;
  end if;

  insert into public.memberships (
    user_id, provider, tier, status, provider_subscription_id,
    provider_reference_id, current_period_end, updated_at
  ) values (
    v_user_id, 'verotel', v_tier, v_status, v_sale_id,
    nullif(p_payload ->> 'referenceID', ''), v_period_end, now()
  )
  on conflict (provider_subscription_id) do update set
    user_id = excluded.user_id,
    tier = excluded.tier,
    status = excluded.status,
    provider_reference_id = coalesce(excluded.provider_reference_id, memberships.provider_reference_id),
    current_period_end = excluded.current_period_end,
    updated_at = now();
end;
$$;

revoke all on function public.apply_verotel_event(text, jsonb) from public, anon, authenticated;
grant execute on function public.apply_verotel_event(text, jsonb) to service_role;
