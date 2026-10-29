-- Stripe-priced model catalogues and magazine editions with private media.

create table if not exists public.catalogues (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  product_type text not null check (product_type in ('model_catalogue', 'magazine_edition')),
  model_slug text,
  stripe_price_id text not null unique,
  status text not null default 'draft' check (status in ('draft', 'published')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((product_type = 'model_catalogue' and model_slug is not null) or product_type = 'magazine_edition')
);

alter table public.catalogues enable row level security;
drop policy if exists "Published catalogues are public" on public.catalogues;
create policy "Published catalogues are public"
  on public.catalogues for select to anon, authenticated using (status = 'published');
revoke insert, update, delete on public.catalogues from anon, authenticated;
grant select on public.catalogues to anon, authenticated;

alter table public.member_media add column if not exists catalogue_id uuid
  references public.catalogues(id) on delete cascade;
create index if not exists member_media_catalogue_idx on public.member_media (catalogue_id);

alter table public.portfolio_purchases alter column media_id drop not null;
alter table public.portfolio_purchases add column if not exists catalogue_id uuid
  references public.catalogues(id) on delete cascade;
alter table public.portfolio_purchases drop constraint if exists portfolio_purchases_one_entitlement;
alter table public.portfolio_purchases add constraint portfolio_purchases_one_entitlement
  check (num_nonnulls(media_id, catalogue_id) = 1);
create unique index if not exists portfolio_purchases_user_catalogue_idx
  on public.portfolio_purchases (user_id, catalogue_id) where catalogue_id is not null;

-- Seed the Stripe products supplied by the site owner. All begin as drafts until
-- private files have been uploaded and the owner explicitly publishes them.
insert into public.catalogues (title, description, product_type, model_slug, stripe_price_id)
values
  ('Ana — Digital Catalogue', '', 'model_catalogue', 'ana', 'price_1UVw55EYY8tfl15wKXPMDCfw'),
  ('Cynthia — Digital Catalogue', '', 'model_catalogue', 'cynthia', 'price_1UVw72EYY8tfl15w9zJLkr5t'),
  ('Lucy — Digital Catalogue', '', 'model_catalogue', 'lucy', 'price_1UVw7yEYY8tfl15wpFOzp8z1'),
  ('Alexis — Digital Catalogue', '', 'model_catalogue', 'alexis-noir', 'price_1UVw9AEYY8tfl15wCsMsazfb'),
  ('Angie — Digital Catalogue', '', 'model_catalogue', 'angie', 'price_1UVwAXEYY8tfl15wil6jA3iX'),
  ('Daya — Digital Catalogue', '', 'model_catalogue', 'daya', 'price_1UVwAmEYY8tfl15w0Rg3hQ5u'),
  ('Impura Vida Magazine — Edition 1', '', 'magazine_edition', null, 'price_1UVwDtEYY8tfl15wB7ZwLXRv')
on conflict (stripe_price_id) do update set
  title = excluded.title,
  product_type = excluded.product_type,
  model_slug = excluded.model_slug,
  updated_at = now();

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
  v_catalogue_id uuid;
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
    v_catalogue_id := nullif(p_object #>> '{metadata,catalogue_id}', '')::uuid;
    v_session_id := p_object ->> 'id';
    v_payment_intent := p_object ->> 'payment_intent';
    if v_user_id is null or (v_media_id is null and v_catalogue_id is null) or v_session_id is null then
      raise exception 'Invalid Stripe portfolio checkout';
    end if;
    if v_catalogue_id is not null and not exists (
      select 1 from public.catalogues c where c.id = v_catalogue_id and c.status = 'published'
    ) then raise exception 'Catalogue is not published'; end if;
    insert into public.portfolio_purchases (
      user_id, media_id, catalogue_id, stripe_checkout_session_id, stripe_payment_intent_id, status
    ) values (v_user_id, v_media_id, v_catalogue_id, v_session_id, v_payment_intent, 'paid')
    on conflict do update set
      status = 'paid', stripe_payment_intent_id = excluded.stripe_payment_intent_id,
      stripe_checkout_session_id = excluded.stripe_checkout_session_id,
      catalogue_id = excluded.catalogue_id;
  elsif p_event_type in ('charge.refunded', 'charge.dispute.created', 'charge.dispute.closed') then
    v_payment_intent := p_object ->> 'payment_intent';
    if v_payment_intent is not null then
      update public.portfolio_purchases
      set status = case
        when p_event_type = 'charge.refunded' then 'refunded'
        when p_event_type = 'charge.dispute.created' then 'disputed'
        when p_object ->> 'status' = 'won' then 'paid'
        else 'disputed'
      end
      where stripe_payment_intent_id = v_payment_intent;
    end if;
  end if;
end;
$$;

revoke all on function public.apply_stripe_event(text, text, jsonb) from public, anon, authenticated;
grant execute on function public.apply_stripe_event(text, text, jsonb) to service_role;
