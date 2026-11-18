# Owner account and dashboard setup

The owner dashboard at `/admin/` provides summary metrics, checkout plan
management, and activity editing for private topic content. Owner data and
mutations require a verified owner account with MFA assurance level `aal2`.

## 1. Apply the owner migration

Apply the migrations in order to the Supabase project:

```bash
supabase db push
```

The migration `20261028000000_owner_identity.sql` assigns the owner role only
to `stefanustankaemingk2@gmail.com`. Signup metadata cannot grant a role. It
also promotes an existing matching profile so a returning owner can use the
dashboard.

There is one configured `owner` role; the application does not currently have
a separate staff `admin` role. Do not edit `profiles.role` from the browser or
use signup metadata to promote another account. The owner role is assigned
only by the checked-in migration to the configured email.

The owner must control and verify this email address. A matching unverified
account is not authorized by the existing `public.is_owner()` policy.
After email confirmation, sign in with the owner's password. The dashboard
then requires a TOTP authenticator code as the second factor; this is the
intended MFA check, not a second email verification. Use
`/auth.html?mode=login` to keep the sign-in form open when a session already
exists.

## 2. Configure authentication

In Supabase Authentication:

1. Enable the sign-in providers you intend to use.
2. Require email confirmation for email/password signup.
3. Configure the site URL and redirect allowlist for the deployed `auth.html`
   page. For Google OAuth, also configure the provider's callback URL in Google
   Cloud.
4. Ensure the owner account has a verified TOTP authenticator factor. The
   dashboard will offer setup if no verified factor exists, and will request a
   code when a verified factor is present but the current session is only `aal1`.

Use the owner's verified email address when registering. Do not assign owner
roles from browser code or user-editable metadata. Keep authenticator recovery
codes offline and private.

## 3. Configure and build the static site

Set the public browser values `SUPABASE_URL` and `SUPABASE_ANON_KEY` in the
build environment. These are public client values. Never set the service-role
key or Midtrans server key as browser build variables.

```bash
npm run build
npm start
```

Deploy the contents of `dist/`. The build copies `admin/` as static UI, but
does not put privileged credentials or protected lesson content there. The
dashboard's visibility is not the security boundary: database RLS and the
`aal2` owner check protect the queried data.

The static page can return HTTP 200 before JavaScript checks the session. A
non-owner sees a not-found screen, but this is not an HTTP 404 response.
Configure a host-specific route rule if an actual HTTP 404 for non-owners is
required; never rely on that rule instead of database authorization.

## 4. Manage learner access

The owner can open every locked topic after signing in with the configured,
verified owner account and completing TOTP MFA (`aal2`). Owner access does not
depend on a learner trial or enrollment.

If the owner opens a topic before completing MFA, the topic page directs them
to `/admin/` for the required authenticator check and returns them to that topic
after verification.

After applying `20261118000000_manual_access_management.sql` and publishing the
updated `dist/` site:

1. Open **Learner access** in `/admin/` and search for the learner's exact
   email address. Only registered accounts with verified emails are returned.
2. Check the account status and access history. Do not grant access to a
   suspended account or use this control to change an account's role.
3. After independently verifying an offline payment, choose 1, 3, or 12 months
   (or lifetime), enter a payment reference in the required note, then grant
   access. This records a full-access manual enrollment and an audit entry.
4. A fixed-duration manual grant starts after any currently active trial or
   other expiring enrollment, so paid time is not consumed during the trial.
   The grant unlocks all paid topics for that period; topic-by-topic purchases
   are not implemented.
5. The dashboard can revoke an active manual grant only. It cannot change
   verified payment or trial records; use the payment provider/refund process
   for payment-related reversals.

The lookup and mutation RPCs independently require the active owner's verified
email and `aal2` MFA session. A learner cannot grant access to their own
account, and the browser never receives a service-role key.

## 5. Current dashboard scope

The current dashboard displays counts for user accounts, active enrollments,
topics, and payment records. It supports exact-email account lookup and manual
full-access enrollment grants/revocation. It does not provide general account
or role editing, topic-index editing, payment editing, or topic-by-topic
entitlements.

The dashboard can manage checkout plans after migration
`20261028020000_admin_plan_management.sql` and the `admin-plans` Edge Function
are deployed. Plan creation requires an ID, name, server-stored IDR price,
duration, and active status. Plan changes are written to the audit log.

Activity management requires deploying the `admin-content` Edge Function with
JWT verification enabled and a private `lesson-content` Storage bucket. It
lists, creates, edits, and deletes individual activities in the existing
`{ config, data }` topic JSON shape without changing the lesson schema. Activity
IDs must remain unique across a topic's five activity collections. A failed
audit insert triggers a best-effort restore of the previous Storage object;
Storage and Postgres do not provide a shared transaction, so inspect the
function logs and content if an audit/restore error is reported.

## 6. Configure learner checkout

The learner page can display active rows from `public.plans` and call the
`create-order` Edge Function. It cannot complete checkout until you configure
plans and the Midtrans webhook:

1. Add active plan rows with prices you have chosen. Do not copy placeholder
   prices into production. `duration_months` supports `1`, `3`, `12`, or
   `null` for lifetime access.
   The optional `trial_days` field (1–30) is configured directly in Supabase;
   leave it `NULL` when no trial should be offered. The existing checkout plan
   form does not edit this field.
2. Set `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `MIDTRANS_SERVER_KEY`,
   `MIDTRANS_CLIENT_KEY`, `MIDTRANS_IS_PRODUCTION`, `APP_ORIGIN`,
   `UPSTASH_REDIS_REST_URL`, and `UPSTASH_REDIS_REST_TOKEN` as Edge Function
   secrets. Never expose the service-role, Midtrans server, or Redis token in
   the static build.
3. Deploy `admin-plans`, `admin-content`, `create-order`, `start-trial`, and `midtrans-webhook`. The checked-in
   `supabase/config.toml` disables gateway JWT verification only for the
   webhook; the function verifies Midtrans's signature before processing.
4. Configure the Midtrans payment notification URL as
   `https://<project-ref>.supabase.co/functions/v1/midtrans-webhook`.
5. Test using Midtrans sandbox credentials and a verified learner account.
   Confirm the webhook updates the payment, order, and enrollment together
   before switching to production.

The checkout return page reports order state from the learner's own order row.
The return redirect is not proof of payment; only a verified webhook grants or
revokes enrollment.

## 7. Verify the setup

- Sign in with the configured, email-verified owner account.
- Open `/admin/` and enroll/verify TOTP when prompted.
- Confirm the summary counts load after MFA verification.
- Confirm each activity type can be listed and saved, and verify an audit row
  is created for each mutation.
- Look up a verified test learner, grant a short manual entitlement with a
  test payment note, confirm a manual audit entry, then revoke that manual
  entitlement. Do not use a real learner account for a test grant.
- Sign in with a non-owner account and confirm it sees the not-found screen.
- Run `npm test` and `npm run lint`.
- Verify in Supabase that `profiles.role` cannot be updated by `anon` or
  `authenticated` users and that the relevant tables retain RLS policies.
