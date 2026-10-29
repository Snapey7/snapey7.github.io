-- Treat Edition 1 as a physical shop item, not a subscriber vault release.
alter table public.catalogues drop constraint if exists catalogues_product_type_check;
alter table public.catalogues add constraint catalogues_product_type_check
  check (product_type in ('model_catalogue', 'magazine_edition', 'physical_shop'));
alter table public.catalogues drop constraint if exists catalogues_check;
alter table public.catalogues drop constraint if exists catalogues_product_type_model_slug_check;
alter table public.catalogues add constraint catalogues_product_type_model_slug_check
  check (
    (product_type = 'model_catalogue' and model_slug is not null)
    or (product_type in ('magazine_edition', 'physical_shop') and model_slug is null)
  );

update public.catalogues
set product_type = 'physical_shop', status = 'draft', stripe_price_id = null, updated_at = now()
where title = 'Impura Vida Magazine — Edition 1';

-- Keep the physical product visible in the Shop without offering checkout yet.
alter table public.shop_products drop constraint if exists shop_products_status_check;
alter table public.shop_products add constraint shop_products_status_check
  check (status in ('draft', 'published', 'coming_soon'));

update public.shop_products
set title = 'Impura Vida Magazine — Edition 1', status = 'coming_soon', updated_at = now()
where stripe_price_id = 'price_1UVwDtEYY8tfl15wB7ZwLXRv';

drop policy if exists "Published shop products are public" on public.shop_products;
create policy "Published shop products are public"
  on public.shop_products for select to anon, authenticated using (status in ('published', 'coming_soon'));

drop policy if exists "Published shop product photos are public" on public.shop_product_images;
create policy "Published shop product photos are public"
  on public.shop_product_images for select to anon, authenticated
  using (exists (
    select 1 from public.shop_products p
    where p.id = shop_product_images.shop_product_id and p.status in ('published', 'coming_soon')
  ));
