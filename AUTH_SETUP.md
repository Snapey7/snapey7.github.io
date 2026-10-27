# Account setup

The site now uses Supabase Auth for email registration, sign-in, sign-out, email confirmation, and password reset. It does not yet grant paid membership access or protect the existing editorial image files.

## Connect Supabase

1. Create a Supabase project and copy its project URL and publishable key.
2. Set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, and `NEXT_PUBLIC_SITE_URL` in the local environment and in the Vercel project environment settings. The values are shown in `.env.example`; never commit a real key.
3. In Supabase Auth URL Configuration, add `https://www.impuravidamagazine.com/auth/callback` as a production redirect URL and add the local callback URL for development.
4. Configure custom SMTP in Supabase before inviting the public. Hosted projects require SMTP for reliable confirmation and password reset emails; the default mailer is only suitable for limited testing.
5. Enable email confirmation and confirm the signup, login, password reset, and sign-out flows in a test account before launch.

The account page is at `/account`. It checks the authenticated user server-side. Until environment variables are present, signup will explain that account services are not configured and the rest of the site remains available.

## Payments and members-only media

Stripe was requested for Billing, Tax, Payments, Radar, and Connect, but creating a Stripe account is not the same as receiving approval for a particular business or content category. Confirm eligibility for the real site and subscriber-only content with Stripe before enabling live charges. Keep any secret API keys in Vercel/server environment variables; never put them in browser code or chat.

The current gallery images live in `public/`, which makes them publicly retrievable by URL. Before selling access, move paid media into private storage and issue short-lived, authorized URLs only after checking a verified active subscription. A client-side blur or hidden button is not a security barrier. Billing webhooks must update server-side membership entitlements, and access checks must validate them on every protected request.
