-- Stripe subscription and one-time portfolio entitlements.
-- Apply in the Supabase SQL editor after the existing membership migration.

alter table public.memberships drop constraint if exists memberships_provider_check;
alter table public.memberships add constraint memberships_provider_check
  check (provider in ('verotel', 'stripe'));
alter table public.memberships add column if not exists stripe_customer_id text;
alter table public.memberships add column if not exists billing_interval text
  check (billing_interval is null or billing_interval in ('monthly', 'yearly'));
create index if not exists memberships_stripe_customer_idx
  on public.memberships (stripe_customer_id) where stripe_customer_id is not null;

alter table public.member_media add column if not exists stripe_price_id text;
alter table public.member_media add column if not exists model_slug text;
create index if not exists member_media_model_slug_idx on public.member_media (model_slug);

create table if not exists public.portfolio_purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  media_id uuid not null references public.member_media(id) on delete cascade,
  stripe_checkout_session_id text not null unique,
  stripe_payment_intent_id text,
  status text not null check (status in ('paid', 'refunded', 'disputed')),
  created_at timestamptz not null default now(),
  unique (user_id, media_id)
);
alter table public.portfolio_purchases enable row level security;
drop policy if exists "Users can view their portfolio purchases" on public.portfolio_purchases;
create policy "Users can view their portfolio purchases"
  on public.portfolio_purchases for select to authenticated
  using ((select auth.uid()) = user_id);
revoke insert, update, delete on public.portfolio_purchases from anon, authenticated;
grant select on public.portfolio_purchases to authenticated;

create table if not exists public.stripe_events (
  event_id text primary key,
  event_type text not null,
  received_at timestamptz not null default now()
);
alter table public.stripe_events enable row level security;
revoke all on public.stripe_events from anon, authenticated;

create or replace function public.apply_stripe_event(p_event_id text, p_event_type text, p_object jsonb)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid;
  v_tier text;
  v_interval text;
  v_subscription_id text;
  v_customer_id text;
  v_status text;
  v_period_end timestamptz;
  v_media_id uuid;
  v_session_id text;
  v_payment_intent text;
begin
  insert into public.stripe_events (event_id, event_type)
  values (p_event_id, p_event_type)
  on conflict (event_id) do nothing;
  if not found then return; end if;

  if p_event_type in ('customer.subscription.created', 'customer.subscription.updated', 'customer.subscription.deleted') then
    v_subscription_id := p_object ->> 'id';
    v_customer_id := p_object ->> 'customer';
    v_user_id := nullif(p_object #>> '{metadata,user_id}', '')::uuid;
    v_tier := p_object #>> '{metadata,tier}';
    v_interval := p_object #>> '{metadata,interval}';
    v_status := case p_object ->> 'status'
      when 'active' then 'active'
      when 'trialing' then 'active'
      when 'canceled' then 'canceled'
      when 'unpaid' then 'expired'
      when 'incomplete_expired' then 'expired'
      when 'past_due' then 'expired'
      else 'expired'
    end;
    v_period_end := to_timestamp(coalesce(
      p_object #>> '{items,data,0,current_period_end}', p_object ->> 'current_period_end', '0'
    )::double precision);
    if v_subscription_id is null or v_tier not in ('standard', 'impura') or v_interval not in ('monthly', 'yearly') then
      raise exception 'Invalid Stripe subscription event';
    end if;
    if v_user_id is null then
      select m.user_id into v_user_id from public.memberships m
      where m.provider = 'stripe' and m.provider_subscription_id = v_subscription_id;
    end if;
    if v_user_id is null then raise exception 'Stripe subscription has no linked user'; end if;
    insert into public.memberships (
      user_id, provider, tier, status, provider_subscription_id, stripe_customer_id,
      billing_interval, current_period_end, updated_at
    ) values (
      v_user_id, 'stripe', v_tier, v_status, v_subscription_id, v_customer_id,
      v_interval, v_period_end, now()
    )
    on conflict (provider_subscription_id) do update set
      user_id = excluded.user_id, tier = excluded.tier, status = excluded.status,
      stripe_customer_id = excluded.stripe_customer_id,
      billing_interval = excluded.billing_interval,
      current_period_end = excluded.current_period_end, updated_at = now();
  elsif p_event_type in ('checkout.session.completed', 'checkout.session.async_payment_succeeded')
    and p_object ->> 'mode' = 'payment' and p_object ->> 'payment_status' = 'paid' then
    v_user_id := nullif(p_object #>> '{metadata,user_id}', '')::uuid;
    v_media_id := nullif(p_object #>> '{metadata,media_id}', '')::uuid;
    v_session_id := p_object ->> 'id';
    v_payment_intent := p_object ->> 'payment_intent';
    if v_user_id is null or v_media_id is null or v_session_id is null then
      raise exception 'Invalid Stripe portfolio checkout';
    end if;
    insert into public.portfolio_purchases (
      user_id, media_id, stripe_checkout_session_id, stripe_payment_intent_id, status
    ) values (v_user_id, v_media_id, v_session_id, v_payment_intent, 'paid')
    on conflict (user_id, media_id) do update set status = 'paid',
      stripe_payment_intent_id = excluded.stripe_payment_intent_id,
      stripe_checkout_session_id = excluded.stripe_checkout_session_id;
  end if;
end;
$$;

revoke all on function public.apply_stripe_event(text, text, jsonb) from public, anon, authenticated;
grant execute on function public.apply_stripe_event(text, text, jsonb) to service_role;
