# Private lesson content deployment

The production app must be built and deployed from `dist/`. Do not point
Cloudflare Pages, Vercel, or another static host at the repository root: it
contains source copies of topic/activity JSON for maintenance and local
development. `npm run build` copies the public app allowlist and only
`config/imageMapping.json`; the lesson configuration and activity files are
not part of `dist/`. Topic-specific future-tense activity images and their
mapping entries are also excluded. General-purpose images and sounds remain
public.

The source JSON remains in this repository for maintenance. If the repository
is publicly accessible, those source files (including their Git history) are
not protected by the static build; keep the source repository private or
separately remove public source/history exposure before claiming the content is
confidential.

## Required setup

1. Apply the Supabase migrations in `supabase/migrations/`.
2. Export the existing content and public topic metadata outside the repository:

   ```bash
   npm run export:content
   ```

   The export directory defaults to a temporary directory outside the
   repository. Set `CONTENT_EXPORT_DIR` only to another path outside the web
   root. Use the generated `topics.sql` in the Supabase SQL Editor; it preserves
   existing `is_free` values and defaults new topics to locked. Create a private
   Storage bucket named `lesson-content` in Supabase, then upload the exported
   topic JSON files there. Each object preserves the existing config and
   activity JSON as `{ "config": ..., "data": ... }`; the lesson JSON schema is
   unchanged. Do not make the bucket public.
3. Configure the browser's public `SUPABASE_URL`, public anon key, and
   `WHATSAPP_NUMBER` either in `supabase-config.js` or as build environment
   variables. These values are shipped to browsers; the WhatsApp number is
   public contact information. Never set `SUPABASE_SERVICE_ROLE_KEY` in the
   static build environment.
4. Configure function secrets in Supabase:

   ```text
   APP_ORIGIN=https://your-production-domain.example
   UPSTASH_REDIS_REST_URL=...
   UPSTASH_REDIS_REST_TOKEN=...
   ```

   Supabase supplies `SUPABASE_URL` and
   `SUPABASE_SERVICE_ROLE_KEY` to Edge Functions. Do not copy secret values
   into this guide or browser files.
5. Deploy `get-lesson` with Supabase CLI and deploy only the generated `dist/`
   directory to the static host. Set the host build command to `npm run build`
   and output directory to `dist`. Set only the public `SUPABASE_URL`,
   `SUPABASE_ANON_KEY`, and `WHATSAPP_NUMBER` variables for this static build.
6. Verify an anonymous request and a free account without email verification
   receive no lesson JSON, a verified free account receives only an
   `is_free` topic, and an active enrollment receives full-access topics.

The service-role key is used only inside Edge Functions; local content export
does not require Supabase credentials. The function fails closed with `503` if the private bucket content or Upstash
rate limiter is unavailable. Requests are limited to 30 per user per minute.
The response uses `Cache-Control: no-store`; the app has no service worker and
does not store lesson JSON in local storage.

## Access behavior

- The public topic index contains only identifiers, titles, short descriptions,
  group labels, and the free/locked flag.
- The browser calls `get-lesson` with the selected topic id. The function
  validates the Supabase JWT, verified email and active profile, then checks
  free-topic status or active enrollment and expiry before reading Storage.
- Owner access requires an active `owner` profile and `aal2` MFA assurance.
- Denied requests return a status and error code without lesson data.
- Locked topics show an Upgrade link and, when configured, a WhatsApp contact
  link labelled “Hubungi guru untuk daftar”.

This deliverable does not implement checkout or create enrollments from a
payment. The Upgrade link is a placeholder for the payment flow in a later
deliverable. Public topic metadata is intentionally readable by anonymous
visitors.
