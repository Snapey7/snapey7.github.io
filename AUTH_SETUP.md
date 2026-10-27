# Account setup

The site uses Supabase Auth for email registration, sign-in, sign-out, email confirmation, and password reset. Paid membership state and a private media library are implemented in the `supabase/migrations/202610270001_memberships_and_private_media.sql` migration. Complete the payment/storage setup in `BACKEND_SETUP.md` before selling memberships.

## Connect Supabase

1. Create a Supabase project and copy its project URL and publishable key.
2. Set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, and `NEXT_PUBLIC_SITE_URL` in the local environment and in the Vercel project environment settings. The values are shown in `.env.example`; never commit a real key.
3. In Supabase Auth URL Configuration, add `https://www.impuravidamagazine.com/auth/callback` as a production redirect URL and add the local callback URL for development.
4. Configure custom SMTP in Supabase before inviting the public. Hosted projects require SMTP for reliable confirmation and password reset emails; the default mailer is only suitable for limited testing.
5. Enable email confirmation and confirm the signup, login, password reset, and sign-out flows in a test account before launch.

The account page is at `/account`. It checks the authenticated user server-side. Until environment variables are present, signup will explain that account services are not configured and the rest of the site remains available.

## Payments and members-only media

See `BACKEND_SETUP.md` for the processor, migration, credentials, callback, and private media setup. The editorial cover images currently in `public/` remain public previews; put full subscriber releases in the private `member-media` bucket instead.
