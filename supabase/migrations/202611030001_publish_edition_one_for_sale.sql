-- Make the physical Edition 1 magazine purchasable in the Shop.
-- Keep its existing Stripe price ID and product images intact.
update public.shop_products
set title = 'Impura Vida Magazine — Edition 1', status = 'published', updated_at = now()
where stripe_price_id = 'price_1UVwDtEYY8tfl15wB7ZwLXRv';
