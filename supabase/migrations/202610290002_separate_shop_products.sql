-- Separate publicly displayed physical shop products from subscriber-only releases.

create table if not exists public.shop_products (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  stripe_price_id text not null unique,
  status text not null default 'draft' check (status in ('draft', 'published')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.shop_products enable row level security;
drop policy if exists "Published shop products are public" on public.shop_products;
create policy "Published shop products are public"
  on public.shop_products for select to anon, authenticated using (status = 'published');
revoke insert, update, delete on public.shop_products from anon, authenticated;
grant select on public.shop_products to anon, authenticated;

create table if not exists public.shop_product_images (
  id uuid primary key default gen_random_uuid(),
  shop_product_id uuid not null references public.shop_products(id) on delete cascade,
  storage_path text not null unique,
  alt_text text not null,
  position integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists shop_product_images_product_idx
  on public.shop_product_images (shop_product_id, position, created_at);
alter table public.shop_product_images enable row level security;
drop policy if exists "Published shop product photos are public" on public.shop_product_images;
create policy "Published shop product photos are public"
  on public.shop_product_images for select to anon, authenticated
  using (exists (
    select 1 from public.shop_products p
    where p.id = shop_product_images.shop_product_id and p.status = 'published'
  ));
revoke insert, update, delete on public.shop_product_images from anon, authenticated;
grant select on public.shop_product_images to anon, authenticated;

-- This bucket contains only product-display photos. Its assets are intentionally public;
-- member originals remain in the separate private member-media bucket.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'shop-product-images',
  'shop-product-images',
  true,
  20971520,
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
)
on conflict (id) do update set
  public = true,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Carry the existing Edition 1 Stripe price into the physical shop product record.
insert into public.shop_products (title, description, stripe_price_id, status)
select 'Edition 01 — Costa Rica', description, stripe_price_id, status
from public.catalogues
where product_type = 'magazine_edition' and stripe_price_id is not null
on conflict (stripe_price_id) do update set
  title = excluded.title,
  description = excluded.description,
  status = excluded.status,
  updated_at = now();

-- Keep the existing magazine_edition catalogue as the digital issue for subscribers.
-- The physical shop purchase must not create a private-content entitlement.
alter table public.catalogues alter column stripe_price_id drop not null;
update public.catalogues
set stripe_price_id = null, updated_at = now()
where product_type = 'magazine_edition';

-- All paid magazine issue content is included with either active subscription tier.
update public.member_media
set min_tier = 'standard'
where catalogue_id in (
  select id from public.catalogues where product_type = 'magazine_edition'
);

-- Keep a fulfilment record for physical orders without granting digital library access.
create table if not exists public.shop_orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  shop_product_id uuid not null references public.shop_products(id) on delete restrict,
  stripe_checkout_session_id text not null unique,
  stripe_payment_intent_id text,
  customer_email text,
  shipping_details jsonb,
  status text not null check (status in ('paid', 'refunded', 'disputed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists shop_orders_user_idx on public.shop_orders (user_id, created_at desc);
alter table public.shop_orders enable row level security;
drop policy if exists "Users can view their shop orders" on public.shop_orders;
create policy "Users can view their shop orders"
  on public.shop_orders for select to authenticated using ((select auth.uid()) = user_id);
revoke insert, update, delete on public.shop_orders from anon, authenticated;
grant select on public.shop_orders to authenticated;

-- Record physical purchases for fulfilment without adding them to portfolio entitlements.
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
  v_shop_product_id uuid;
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
    v_shop_product_id := nullif(p_object #>> '{metadata,shop_product_id}', '')::uuid;
    v_session_id := p_object ->> 'id';
    v_payment_intent := p_object ->> 'payment_intent';

    if v_shop_product_id is not null then
      if v_user_id is null or v_session_id is null then raise exception 'Invalid physical shop checkout'; end if;
      if not exists (
        select 1 from public.shop_products p where p.id = v_shop_product_id and p.status = 'published'
      ) then raise exception 'Shop product is not published'; end if;
      insert into public.shop_orders (
        user_id, shop_product_id, stripe_checkout_session_id, stripe_payment_intent_id,
        customer_email, shipping_details, status
      ) values (
        v_user_id, v_shop_product_id, v_session_id, v_payment_intent,
        p_object #>> '{customer_details,email}', p_object -> 'shipping_details', 'paid'
      )
      on conflict (stripe_checkout_session_id) do update set
        status = 'paid', stripe_payment_intent_id = excluded.stripe_payment_intent_id,
        customer_email = excluded.customer_email, shipping_details = excluded.shipping_details,
        updated_at = now();
    else
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
    end if;
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
      update public.shop_orders
      set status = case
        when p_event_type = 'charge.refunded' then 'refunded'
        when p_event_type = 'charge.dispute.created' then 'disputed'
        when p_object ->> 'status' = 'won' then 'paid'
        else 'disputed'
      end,
      updated_at = now()
      where stripe_payment_intent_id = v_payment_intent;
    end if;
  end if;
end;
$$;

revoke all on function public.apply_stripe_event(text, text, jsonb) from public, anon, authenticated;
grant execute on function public.apply_stripe_event(text, text, jsonb) to service_role;
