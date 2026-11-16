export const tableColumns: Record<string, readonly string[]> = {
  "catalogues": [
    "id",
    "title",
    "description",
    "product_type",
    "model_slug",
    "stripe_price_id",
    "status",
    "created_at",
    "updated_at"
  ],
  "editorial_images": [
    "id",
    "editorial_slug",
    "storage_path",
    "public_url",
    "alt_text",
    "position",
    "published",
    "created_at"
  ],
  "editorial_stories": [
    "slug",
    "title",
    "location",
    "model",
    "deck",
    "body",
    "photographer",
    "release_date",
    "status",
    "created_at",
    "updated_at"
  ],
  "member_media": [
    "id",
    "title",
    "alt_text",
    "bucket",
    "storage_path",
    "min_tier",
    "created_at",
    "stripe_price_id",
    "model_slug",
    "catalogue_id",
    "position"
  ],
  "memberships": [
    "id",
    "user_id",
    "provider",
    "tier",
    "status",
    "provider_subscription_id",
    "provider_reference_id",
    "current_period_end",
    "created_at",
    "updated_at",
    "stripe_customer_id",
    "billing_interval"
  ],
  "portfolio_purchases": [
    "id",
    "user_id",
    "media_id",
    "stripe_checkout_session_id",
    "stripe_payment_intent_id",
    "status",
    "created_at",
    "catalogue_id"
  ],
  "shop_orders": [
    "id",
    "user_id",
    "shop_product_id",
    "stripe_checkout_session_id",
    "stripe_payment_intent_id",
    "customer_email",
    "shipping_details",
    "status",
    "created_at",
    "updated_at"
  ],
  "shop_product_images": [
    "id",
    "shop_product_id",
    "storage_path",
    "alt_text",
    "position",
    "created_at"
  ],
  "shop_products": [
    "id",
    "title",
    "description",
    "stripe_price_id",
    "status",
    "created_at",
    "updated_at"
  ],
  "stripe_events": [
    "event_id",
    "event_type",
    "received_at"
  ],
  "verotel_events": [
    "event_key",
    "event_type",
    "provider_subscription_id",
    "received_at",
    "payload"
  ]
};
