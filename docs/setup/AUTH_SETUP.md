# Supabase authentication setup

The authentication page is `auth.html`; it uses the Supabase JavaScript client
as an ES module and supports email/password, Google OAuth, email verification,
password recovery, and Indonesian/English interface text.

## Configure the browser client

1. Create a Supabase project.
2. Copy the project's **Project URL** and **anon/public key** into
   `supabase-config.js`.
3. Add the local and production origins to Supabase Auth's allowed redirect
   URLs. Add the exact `/auth.html` callback URL used by this site.
4. Enable email confirmation and configure the confirmation email template to
   redirect back to `/auth.html?verified=1`.
5. Enable Google in Supabase Auth, configure the Google OAuth client and
   authorized redirect URI, and allow `/auth.html` as the application callback.
6. Configure Supabase Auth's server-side email and sign-in rate limits. The UI
   reports rate-limit responses but is not itself a rate limiter.

The URL and anon/public key are necessarily visible in the browser. They are
not secrets; database access must be protected with RLS. Never put the
service-role key or any payment secret in `supabase-config.js`, HTML, or
another static asset. Do not put secrets in `.env` expecting this static app
to read them at runtime.

## Account and minor-user behavior

Minor sign-up asks for a guardian email and a consent attestation. The database
signup trigger also requires those fields in the Auth user metadata. This
attestation is a record of the user's declaration, not independent proof of
guardian identity or legal consent; obtain any verification and retention
process required by applicable law before production launch.

Google sign-in is restricted in the UI to a user who confirms they are at
least 18. This checkbox is a self-attestation, not age verification. Do not
represent it as verified age. Use email sign-up for minor accounts so the
guardian fields can be captured.

Email verification, password reset, and OAuth redirect handling depend on the
Supabase project settings and email delivery being configured correctly.
Authentication errors are shown in a generic form to avoid revealing whether
an email address has an account.

## Scope

This deliverable adds the auth UI only. It does not yet gate lesson content,
sync progress, enforce admin MFA, provision an owner, or implement the
server-side login limiter. Until the private-content Edge Function is deployed,
the existing static lesson JSON remains public regardless of sign-in state.
