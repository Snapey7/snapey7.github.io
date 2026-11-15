# Cloudflare backend migration

This branch prepares a replacement for Supabase behind `BACKEND_PROVIDER=cloudflare`.
The frontend remains on its existing Vercel deployment. Public pages, styles, URLs,
Stripe products and checkout metadata remain in the existing application.

**Do not enable the provider on production until every cutover check below passes.**
No source storage, source accounts or source database records should be deleted.

## Services

- D1 stores the existing application tables and Better Auth's account/session tables.
- A Worker accepts parameterized queries only with the server's shared bearer secret.
  Its unauthenticated health endpoint exposes no records. Browser clients never receive
  the Worker secret, auth secret or database credentials.
- Better Auth replaces Supabase sign-in, verification and password reset. Existing
  confirmed accounts keep their UUIDs, bcrypt passwords, display names and entitlements.
  Existing Supabase cookies do not migrate; customers must sign in again.
- R2 remains private. Existing `member-media-r2` keys remain unchanged. Legacy storage
  keys are copied under `<source-bucket>/<source-path>`; their database references remain
  unchanged and the storage adapter adds the bucket prefix. New private releases,
  editorials and shop photos upload directly with short-lived signed URLs.
- The current Resend SMTP service can send account mail. Email verification stays
  required; do not enable signup without confirmed delivery and password recovery.

## Preserved source export

Keep the database export, generated import SQL, image inventory and verification
reports outside the repository in a private directory. They include customer data
and password hashes. Never upload these files to a PR or attach them to build logs.

Prepare a fresh import using the read-only source export format:

```sh
node scripts/prepare-cloudflare-import.mjs /private/source-backup.json /private/records.sql
```

The schema is tracked in `migrations/0001_backend.sql`; the insert statements are
written separately with restricted permissions. The import preserves the existing
payment event ledger so provider retries cannot grant duplicate access.

At the initial audit there were 5 accounts, 8 catalogues, 62 private media rows,
2 memberships, 12 editorial image rows and 19 Supabase storage objects. Another
51 private originals were already in R2. These are audit counts, not a claim that
the final storage migration is complete. Two of the 19 source files were recovered
locally; the remaining 17 were blocked by Supabase's egress restriction.

## Image export and verification

The standard and documented direct storage hosts both returned HTTP 402 with
`exceed_egress_quota`. An authenticated export cannot be claimed complete while
the service refuses file downloads. Obtain download/export access through Supabase
support or wait for the quota restriction to lift; do not silently omit originals.

The migration utility uses environment variables, never credential arguments. With
source read credentials available, preserve every original before copying:

```sh
node scripts/migrate-cloudflare-media.mjs export /private/source-backup.json /private/files.json /private/media
node scripts/migrate-cloudflare-media.mjs audit-existing /private/source-backup.json /private/files.json /private/media
node scripts/migrate-cloudflare-media.mjs copy /private/source-backup.json /private/files.json /private/media
node scripts/migrate-cloudflare-media.mjs audit-existing /private/source-backup.json /private/files.json /private/media
```

`export` uses `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`. R2 operations
use the existing four `R2_*` settings. The source inventory must match storage
metadata in the export, including size and MD5. Copying requires every source file
to have passed that check. Each destination is downloaded and compared by SHA-256
and size. A different existing destination is never overwritten. The two R2 audits
must confirm the original 51 objects are unchanged.

No records need to be rewritten to point at the prefixed legacy object keys.

## Staging setup

1. Connect Wrangler to the authorized Cloudflare account. Create a new D1 database,
   then replace the placeholder `database_id` in `wrangler.jsonc` with its ID.
2. Apply migrations and import the protected SQL into that new database:

   ```sh
   npx wrangler d1 migrations apply impura-vida-backend --remote --config cloudflare/wrangler.jsonc
   npx wrangler d1 execute impura-vida-backend --remote --config cloudflare/wrangler.jsonc --file /private/records.sql
   ```

3. Generate a random Worker secret of at least 32 bytes and set it with
   `wrangler secret put BACKEND_API_SECRET`. Put the same value in Vercel as
   `CLOUDFLARE_BACKEND_SECRET`. Keep it server-only and out of command histories.
4. Deploy the Worker and set `CLOUDFLARE_BACKEND_URL` to its HTTPS URL in a preview.
   Generate an independent random `AUTH_SECRET`. Set `AUTH_BASE_URL` to the preview
   origin if necessary; the app otherwise uses Vercel's preview hostname.
5. Configure `AUTH_SMTP_HOST`, `AUTH_SMTP_PORT`, `AUTH_SMTP_USER`,
   `AUTH_SMTP_PASSWORD` and `AUTH_EMAIL_FROM` using the existing verified Resend
   sender. Enter sending credentials directly into the environment, not a chat.
6. Set preview `CONTENT_ADMIN_EMAILS`, the existing R2 configuration and Stripe
   test configuration. Ensure R2 CORS allows the exact preview origin for uploads.
   Avoid using live payment keys for synthetic payment tests.

## Validation and cutover

Local checks:

```sh
npm run test:migration
npm run build
```

The offline integration suite runs the actual Worker against SQLite and exercises
the application adapters, account routes, imported-password compatibility, email
verification, reset tokens, sessions, privacy filters, payment idempotency/refunds,
membership updates, physical orders, and image ordering. These checks do not replace
remote D1, email delivery, Stripe webhook or browser checks.

Before switching production:

- Confirm all source table counts, password hash values and foreign keys after import.
- Require successful verification reports for all 19 copied objects and all 51
  pre-existing R2 objects. Check public editorial images and every private gallery.
- Verify a new signup email reaches an authorized test recipient, then complete
  verification, sign-in, sign-out and password reset. Check an existing account login.
- Confirm account navigation and admin allowlisting; unauthenticated visitors must
  not access originals, drafts, another user's purchases or the Studio.
- Verify desktop/mobile Muse purchase buttons, test checkout and signed webhook
  entitlement delivery, membership access, refunds and duplicate event retries.
- Upload a test photo, save a draft, reload it, publish it and view it through the
  appropriate public/member route. Check editorial and shop uploads as well.
- Reconcile Stripe events that failed while Supabase was restricted. Do not assume
  the initial database snapshot includes payments received after its export time.
- Present the working preview and PR for review. Merge only through the user's
  normal release process, then enable the production provider after the checks pass.

Keep source backups and Supabase resources until production verification is complete.
Before rollback, reconcile new users, orders and edits created on Cloudflare: changing
the provider flag alone after new writes would make those records disappear from the
active backend. No migration utility deletes source data.
