# Copilot Instructions — Grammar101 / English Adventures

## Authority and change discipline

- The checked-out source, migrations, tests, and runtime configuration describe what is implemented. Read them before making claims or planning changes; this guidance does not override them.
- Treat this file as the sole full Copilot instruction source. [`docs/COPILOT_INSTRUCTIONS.md`](../docs/COPILOT_INSTRUCTIONS.md) is a short human-facing pointer, not a second copy.
- Preserve unrelated and pre-existing work. Check `git status` first, inspect relevant files before editing, and keep changes scoped to the request.
- Do not describe a proposed or partial feature as shipped. Treat roadmap requests as future work until the code and its verification path exist.
- Do not commit, push, deploy, or open a pull request unless explicitly asked.

## Project map

- Vanilla JavaScript ES modules; no frontend framework. Main entry points are `index.html`, `auth.html`, and `app.js`.
- Feature modules are in `modules/`; visual styles in `css/`; topic authoring data in `config/` and `reproducibility/`; browser-safe assets in `assets/`.
- Supabase SQL migrations are in `supabase/migrations/`; Edge Functions are in `supabase/functions/`; the function configuration is `supabase/config.toml`.
- Owner UI is in `admin/`; account and content setup guidance is in `docs/setup/`.
- Read [`DESIGN_GUIDE.md`](../DESIGN_GUIDE.md) before UI work.

## Current implementation boundaries

Use the checked-out code and migrations to re-confirm this inventory before relying on it; update this section when implementation changes.

| Area | Present in the repository | Boundary to preserve |
|---|---|---|
| Learning app | Topic activities in the existing configuration/data shape | Do not change the lesson/activity JSON schema without approval. |
| Protected content | `get-lesson` reads private `lesson-content` objects after server-side account/access checks | Never make the bucket public or rely on client-side access checks. |
| Free trial | `start-trial`, `modules/trialService.js`, learner CTA, and `20261111000000_free_trial_access.sql` | Trial eligibility and grant are server-side; `trial_days` is configured in Supabase, not in the current plan form. |
| Owner access | Owner identity migration and dashboard MFA (`aal2`) checks | Browser role state is UX only; server authorization remains authoritative. |
| Owner dashboard | Summary metrics, checkout plan management, and activity editing through `admin-plans` and `admin-content` | This is not full account, topic-index, enrollment, payment, group, or audit administration. |
| Checkout | `create-order`, `midtrans-webhook`, payment return flow, and payment migrations | A return-page redirect is not proof of payment; only a verified webhook can change paid access. |
| Learner account overview | The app has account/access flows and a payment-return page | Do not claim a complete learner dashboard with enrollment, progress, and order-history overview unless implemented. |

These features being present in source does not establish that Supabase or Midtrans is configured or that live integration has been tested. State the actual verification environment and limitations.

## Data, auth, and deployment

- Read the baseline migration and all later migrations relevant to a change. The schema evolves through timestamped migrations; do not infer the current schema from the baseline alone.
- Current profile role values are defined by the database schema (`owner`, `student`, `free`); do not introduce a different role name based on old notes. Owner identity and MFA requirements are enforced by database/server checks.
- Learner enrollment changes are server-side. Do not grant access, trust prices, or accept payment state from browser input.
- Browser configuration comes from `supabase-config.js`: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `WHATSAPP_NUMBER` are public values. Preserve the existing export names and never put service-role, Midtrans server, or other privileged secrets in browser code or static build variables.
- Browser-invoked Edge Functions use the JWT settings in `supabase/config.toml`. The Midtrans webhook is the intentional JWT-verification exception and must verify the provider signature server-side. Follow the established per-function auth, validation, CORS, error, and logging patterns; do not assume a shared helper exists.
- `npm run build` creates `dist/` and excludes topic/activity JSON. Deploy `dist/`, not the repository root. The source repository itself contains authoring content; excluding it from `dist/` does not protect it if the source repository or its history is public.
- `npm run export:content` reads local topic and activity files and writes them, plus metadata SQL, to an external directory; it does not query Supabase. Keep private content out of the web root and never weaken the export path checks.
- Follow [`docs/setup/CONTENT_ACCESS_SETUP.md`](../docs/setup/CONTENT_ACCESS_SETUP.md) and [`docs/setup/OWNER_ADMIN_SETUP.md`](../docs/setup/OWNER_ADMIN_SETUP.md) for deployment details. Update the owning setup guide when a change alters those procedures; do not copy the full guides here.

## UI, accessibility, and content

- New or changed learner-facing strings must be available in English and Bahasa Indonesia, using the existing language/state patterns. Keep error messages useful and non-sensitive; do not show raw internal errors as learner-facing copy.
- Follow the design tokens, typography, interaction, and accessibility requirements in [`DESIGN_GUIDE.md`](../DESIGN_GUIDE.md). Use semantic controls, visible keyboard focus, keyboard-operable interactions, and accessible names/status announcements.
- Do not inject user-, database-, or Storage-sourced content with `innerHTML`. Prefer `textContent` and DOM construction. Keep educational emoji in lesson content where already part of the content; do not use emoji as interface icons.
- Preserve existing account rules and confirmation/guardian safeguards. Never allow client-controlled signup metadata to set a privileged role.

## Engineering and verification

- Make the smallest complete change; follow nearby naming, formatting, validation, and error-handling conventions. Surface failures instead of silently returning success-shaped fallbacks.
- Do not add dependencies, a frontend framework, Playwright, or another test runner without approval. Extend the existing project verifier when a code change needs durable QA coverage.
- For code changes, run the narrowest relevant checks, then the project checks when applicable: `npm test`, `npm run lint`, and `npm run build`. `npm test` runs `scripts/qa/verify-project.js`; report exactly what ran and what it does not verify.
- If Deno is available, use it to check changed Edge Functions. Do not claim local Supabase, production Supabase, or Midtrans verification unless those environments were actually exercised.
- For SQL or authorization changes, verify migration ordering, RLS/grants, and negative access cases where the available local environment permits. Call out unavailable integration tests.
- Update relevant user/setup documentation for behavior changes. Do not create a second architecture, schema, design, or sprint specification inside this file.
