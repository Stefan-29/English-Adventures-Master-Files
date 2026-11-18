# Supabase authentication setup

The authentication page is `auth.html`; it uses the Supabase JavaScript client
as an ES module and supports email/password, Google OAuth, email verification,
password recovery, and Indonesian/English interface text.

## Configure the browser client

1. Create a Supabase project.
2. Copy the project's **Project URL** and **anon/public key** into
   `supabase-config.js`.
3. In **Authentication → URL Configuration**, set **Site URL** to the
   production site origin, without a trailing slash:
   `https://englishadventuresforlife.netlify.app`.
4. Add the production callback to **Redirect URLs**:
   `https://englishadventuresforlife.netlify.app/**`. If you use the local
   development server, also allow `http://localhost:8001/**`. For Codespaces,
   allow the exact forwarded app origin instead of `localhost`.
5. Enable email confirmation and keep the confirmation email template's link
   set to `{{ .ConfirmationURL }}`. The app asks Supabase to return to the
   `/auth.html?verified=1` page on the same origin where signup began.
6. After changing redirect settings, request a fresh confirmation email. A
   link sent before the settings were corrected can still point at the old
   destination. The page after confirmation must be reachable in the same
   browser; if it points to `localhost`, either the signup was made from a
   local app whose server is no longer running, or Supabase fell back to its
   Site URL because the requested callback was not allowed.
7. Enable Google in Supabase Auth, configure the Google OAuth client and
   authorized redirect URI, and allow `/auth.html` as the application callback.
8. Configure Supabase Auth's server-side email and sign-in rate limits. The UI
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

For local signup testing, keep the development server running on port 8001
until you click the email link, and open the link on the same machine. A
Codespaces `localhost` address in an email is not the Codespaces forwarded
origin and usually cannot be opened from the user's browser.

If an account was already created but is still unverified, inspect it under
**Authentication → Users** and resend its signup confirmation after correcting
the URL settings; do not create another owner account. The database assigns
the owner role to the configured owner email during signup, but owner access
also requires email verification and TOTP MFA.

Email verification, password reset, and OAuth redirect handling depend on the
Supabase project settings and email delivery being configured correctly.
Authentication errors are shown in a generic form to avoid revealing whether
an email address has an account.

## Scope

This deliverable adds the auth UI only. It does not yet gate lesson content,
sync progress, enforce admin MFA, provision an owner, or implement the
server-side login limiter. Until the private-content Edge Function is deployed,
the existing static lesson JSON remains public regardless of sign-in state.
