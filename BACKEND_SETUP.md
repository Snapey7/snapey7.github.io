# Membership backend setup

The application now has email accounts, server-side membership records, signed Verotel checkout links, verified Verotel postbacks, cancellation links, and a private member library. It is not live until the account, database migration, provider credentials, and private media are configured.

## Payment processor

This project has been set up for **Verotel FlexPay** hosted subscriptions. The site’s planned subscriber-only explicit imagery makes Stripe a poor fit: Stripe’s published policy says it cannot currently support sexually explicit content designed for sexual gratification, and Stripe accounts are independently reviewed. A Stripe signup does not mean this content category is approved. Verotel explicitly advertises payment processing for adult entertainment and high-risk sites, but it must still approve this specific business and content.

Verotel’s hosted order page handles card details; the website never receives or stores payment-card numbers. It sends signed purchase parameters to Verotel and grants membership only from a signed postback. The account page provides a signed provider cancellation link.

## Connect the database

1. Create/connect the Supabase project as described in `AUTH_SETUP.md`.
2. Run `supabase/migrations/202610270001_memberships_and_private_media.sql` once in the Supabase SQL Editor. It creates membership entitlements, private provider-event records, the media catalog, the private storage bucket, and a service-role-only event function.
3. Configure Supabase Auth email confirmation and production redirect URLs before opening signups publicly.

## Configure Verotel

1. Apply for a Verotel merchant account and have the business and the actual subscriber content approved.
2. Create live recurring subscription offers for **$14.99 every 30 days** (STANDARD) and **$29.99 every 30 days** (IMPURA), matching the existing membership cards.
3. Configure the FlexPay postback URL as `https://www.impuravidamagazine.com/api/billing/verotel`. Enable initial, rebill, extend, cancellation, uncancellation, expiry, upgrade, credit, and chargeback notifications. Verotel requires a `200 OK` response to a valid postback.
4. Add the approved shop ID and FlexPay signature key as server-side environment variables. The route verifies the signed callback before its database function changes an entitlement.

## Environment variables

Add the following to local `.env.local` and the Vercel Production environment. Keep service-role and provider keys private; do not use `NEXT_PUBLIC_` on them or commit real values.

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `NEXT_PUBLIC_SITE_URL=https://www.impuravidamagazine.com`
- `SUPABASE_SERVICE_ROLE_KEY`
- `VEROTEL_SHOP_ID`
- `VEROTEL_SIGNATURE_KEY`

Redeploy after setting variables. If provider keys are not present, the member page disables checkout and says it is not live.

## Add paid releases safely

The existing files under `public/` are public web assets and cannot be made private by hiding a button or checking membership in the browser. Keep only intended previews there. Upload full paid photos and videos into the **private** `member-media` Supabase Storage bucket, then add one `public.member_media` record for each item with its title, alt text, private storage path, and minimum tier (`standard` or `impura`). The app only issues a 60-second signed URL after checking both the signed-in user and a current membership entitlement. `IMPURA` includes `STANDARD` access.

Do not place a direct Supabase Storage URL or an unprotected copy of a paid file in page HTML, source data, or `public/`. Move and verify the real subscriber files before announcing paid access.

## Current scope and remaining account tasks

- Email sign-up, confirmation, login, password reset, and sign-out use Supabase Auth.
- Verotel handles recurring charges, refunds/chargebacks/cancellation notifications, and the hosted payment page. The database stores subscription status and provider references, not card data.
- Supabase Auth email delivery must be configured with production SMTP.
- Production tax calculation, business tax registration, legal terms, privacy/refund policies, age controls, content moderation, and processor-specific compliance review still need the owner’s configuration and review.
- Connect is not included: this is a single publisher selling its own membership. A payout platform would only be needed if the site later pays third-party creators through the product.
- The current membership catalog has two monthly options. Annual billing needs a separate approved provider offer and product configuration before it should be advertised.

## References

- [Verotel FlexPay subscription and signed postback documentation](https://controlcenter.verotel.com/flexpay-doc/subscription.html)
- [Verotel adult/high-risk merchant information](https://www.verotel.com/en/index.html)
- [Stripe restricted-business list and considerations](https://support.stripe.com/questions/restricted-business-list-and-considerations?locale=en-GB)
