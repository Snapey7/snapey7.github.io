# Backend and Stripe setup

The site supports Supabase accounts and private media, Stripe-hosted membership checkout, and one-time purchases for complete model catalogues and magazine editions. Stripe only grants purchase access after a signed webhook is received. Stripe Checkout keeps card details off the website and can present supported payment methods such as Apple Pay and Link.

Photographic art is not automatically the same as sexually explicit material. Stripe reviews each merchant and its actual content; approval is up to Stripe. Describe the business and the content accurately in your Stripe application and ask Stripe to confirm eligibility before relying on live payments.

## 1. Apply the database update

In Supabase, open **SQL Editor** and run these files in order:

1. `supabase/migrations/202610270001_memberships_and_private_media.sql`
2. `supabase/migrations/202610280001_stripe_checkout.sql`
3. `supabase/migrations/202610290001_catalogue_publishing.sql`

The last migration creates the catalogue records from the seven Stripe Price IDs already supplied, attaches image records to catalogues, and adds catalogue-level purchase entitlements. All seven releases start as drafts.

## 2. Create Stripe products and prices

In Stripe Dashboard, create two products: **STANDARD Membership** and **IMPURA Membership**. Add recurring prices for each:

| Product | Monthly | Annual |
| --- | ---: | ---: |
| STANDARD | £14.99/month | £149.30/year |
| IMPURA | £29.99/month | £298.70/year |

The annual amounts are 17% below twelve monthly payments. Copy each Stripe `price_...` ID into the matching Vercel Production environment variable below. These are GBP prices for your UK audience.

The seven catalogue products are Ana, Cynthia, Lucy, Alexis, Angie, Daya, and Impura Vida Magazine Edition 1. Their Stripe Price IDs are seeded by the publishing migration. Add or change prices in Stripe, then update the matching `catalogues.stripe_price_id` if needed. Checkout reads the price from the server-side catalogue record; it never trusts a price ID from the browser. The Stripe amount and currency are fetched from Stripe and shown on the site.

## 3. Set up payment methods and domain

In Stripe Dashboard, enable **Link** and **Apple Pay** under payment method settings. Add `www.impuravidamagazine.com` (and the apex domain if used) as a payment-method domain when Stripe prompts. Availability depends on the customer's browser/device, wallet setup, and Stripe account eligibility; Checkout only displays compatible methods.

## 4. Add the Stripe webhook

In Stripe Dashboard, add a webhook endpoint:

`https://www.impuravidamagazine.com/api/billing/stripe/webhook`

Subscribe to these events:

- `checkout.session.completed`
- `checkout.session.async_payment_succeeded`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `charge.refunded`
- `charge.dispute.created`
- `charge.dispute.closed`

Copy the endpoint's signing secret (`whsec_...`) into `STRIPE_WEBHOOK_SECRET`. The handler checks Stripe's signature and timestamp and ignores duplicate event IDs. Do not use the webhook's browser return URL as proof of payment.

## 5. Vercel environment variables

Add these in **Project Settings → Environment Variables** for Production. Use the matching test keys and test price IDs only in Preview/Development.

- `STRIPE_SECRET_KEY` — live secret or restricted key (`sk_live_...` or `rk_live_...`)
- `STRIPE_WEBHOOK_SECRET` — endpoint signing secret (`whsec_...`)
- `STRIPE_PRICE_STANDARD_MONTHLY` — STANDARD monthly recurring price ID
- `STRIPE_PRICE_STANDARD_YEARLY` — STANDARD annual recurring price ID
- `STRIPE_PRICE_IMPURA_MONTHLY` — IMPURA monthly recurring price ID
- `STRIPE_PRICE_IMPURA_YEARLY` — IMPURA annual recurring price ID
- `CONTENT_ADMIN_EMAILS` — comma-separated email(s) of Supabase accounts allowed to upload and publish releases
- Existing Supabase variables: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, and `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_SITE_URL=https://www.impuravidamagazine.com`

Redeploy after setting variables. Checkout buttons stay disabled until all required Stripe and Supabase settings exist. Configure the Stripe Billing Portal in Dashboard so subscribers can manage or cancel; the account page opens the portal for Stripe subscriptions.

## 6. Upload and publish releases

After the migrations and environment variables are deployed, sign in with the Supabase account whose email is in `CONTENT_ADMIN_EMAILS` and open `/studio`. Select a catalogue, add a customer description, upload its full-resolution images, then choose **Publish**. Uploads go directly to the private `member-media` Storage bucket using short-lived upload tokens. The site displays only published catalogues; unpublished files are not delivered even to members. Model catalogues appear on their Muse model page and Edition 1 appears in Shop.

Create one sample release first: upload one approved test image to a catalogue, publish it, check its page as a visitor, buy it using Stripe test mode, and confirm the paid image appears in the buyer's library. Use Stripe test mode keys and test price IDs in Vercel Preview; use live keys only after the live webhook and account eligibility are confirmed.

## 7. Private content

Keep full paid files in the private `member-media` Supabase Storage bucket. Do not put paid originals in `public/`. The app issues short-lived signed URLs only after checking membership or a recorded one-time purchase. For monthly and annual membership checkout, use the matching configured Stripe Price ID. Account entitlements update through webhooks, not a client-side success redirect.

The project retains the prior Verotel endpoint and membership records for continuity, but new checkout buttons use Stripe. Remove old Verotel credentials only after confirming no existing Verotel memberships depend on them.

## Official references

- [Stripe Checkout](https://docs.stripe.com/payments/checkout)
- [Stripe webhooks](https://docs.stripe.com/webhooks)
- [Stripe Customer Portal](https://docs.stripe.com/customer-management)
- [Apple Pay domain verification](https://docs.stripe.com/apple-pay)
- [Stripe restricted businesses](https://support.stripe.com/questions/restricted-business-list-and-considerations?locale=en-GB)
