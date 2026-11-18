import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const root = process.cwd();
function listFilesRecursively(directory) {
    return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
        const entryPath = path.join(directory, entry.name);
        return entry.isDirectory() ? listFilesRecursively(entryPath) : [entry.name];
    });
}

const configDirectory = path.join(root, 'config');
const configs = fs.readdirSync(configDirectory)
    .filter(file => file.endsWith('.json') && file !== 'imageMapping.json');
const checkedCheckers = new Set();
let activityCount = 0;

assert.ok(fs.existsSync(path.join(root, 'index.html')), 'The app entry point must exist.');
const appHtml = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
assert.match(appHtml, /<script\s+type="module"\s+src="app\.js"><\/script>/, 'The app entry point must load as an ES module.');
const packageManifest = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
assert.equal(packageManifest.main, 'app.js', 'The package entry point must match the root application file.');
assert.ok(fs.existsSync(path.join(root, packageManifest.main)), 'The package entry point must exist.');
assert.match(packageManifest.scripts.dev, /http-server\s+\./, 'The development server must serve the repository root.');
assert.match(packageManifest.scripts.start, /http-server\s+dist/, 'Production preview must serve the static build.');
assert.match(packageManifest.scripts.build, /scripts\/build-static-site\.js/, 'Production build must use the allowlisted static builder.');
assert.ok(fs.existsSync(path.join(root, 'config')), 'Topic configurations must remain at the served root.');
assert.ok(fs.existsSync(path.join(root, 'modules')), 'Application modules must remain at the served root.');
execFileSync(process.execPath, ['scripts/build-static-site.js'], { cwd: root, stdio: 'pipe' });
const staticOutput = path.join(root, 'dist');
assert.ok(fs.existsSync(path.join(staticOutput, 'index.html')), 'The production build must include the main app page.');
assert.ok(fs.existsSync(path.join(staticOutput, 'admin/index.html')), 'The production build must include the owner dashboard shell.');
assert.ok(fs.existsSync(path.join(staticOutput, 'admin/admin.js')), 'The production build must include the owner dashboard client.');
assert.ok(fs.existsSync(path.join(staticOutput, 'admin/admin.css')), 'The production build must include the owner dashboard styles.');
assert.ok(fs.existsSync(path.join(staticOutput, 'payment-return.html')), 'The production build must include the payment return page.');
assert.deepEqual(
    fs.readdirSync(path.join(staticOutput, 'config')),
    ['imageMapping.json'],
    'The production bundle must exclude all topic config JSON.'
);
assert.ok(!fs.existsSync(path.join(staticOutput, 'reproducibility')), 'Activity JSON must not be copied to the static bundle.');
assert.ok(!fs.existsSync(path.join(staticOutput, 'assets/images/future-tenses')), 'Topic-specific writing images must not be copied to the public bundle.');
const publicImageMapping = JSON.parse(fs.readFileSync(path.join(staticOutput, 'config/imageMapping.json'), 'utf8'));
assert.ok(
    Object.values(publicImageMapping).every(image => !image.path?.startsWith('assets/images/future-tenses/')),
    'Public image mapping must not reveal private topic image paths.'
);
for (const entry of fs.readdirSync(staticOutput, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const files = listFilesRecursively(path.join(staticOutput, entry.name));
    assert.ok(
        !files.some(file => file.endsWith('.json') && !file.endsWith('imageMapping.json')),
        `Static output directory ${entry.name} contains unexpected JSON content.`
    );
}
const authHtml = fs.readFileSync(path.join(root, 'auth.html'), 'utf8');
const authSource = fs.readFileSync(path.join(root, 'modules/authPage.js'), 'utf8');
assert.match(authHtml, /id="login-form"/, 'The auth page must provide email/password login.');
assert.match(authHtml, /id="login-password"[^>]*required(?![^>]*minlength)/, 'Login must accept existing passwords independent of the signup password policy.');
assert.match(authHtml, /id="signup-password"[^>]*minlength="10"/, 'New account passwords must retain the minimum length requirement.');
assert.match(authHtml, /id="signup-form"/, 'The auth page must provide email signup.');
assert.match(authHtml, /id="reset-form"/, 'The auth page must provide password recovery.');
assert.match(authHtml, /id="guardian-email"/, 'Minor signup must collect a guardian email.');
assert.match(authHtml, /id="guardian-consent"/, 'Minor signup must require guardian consent attestation.');
assert.match(authHtml, /id="language-toggle"/, 'The auth page must support a language toggle.');
for (const [controlId, handler] of [
    ['language-toggle', /getElementById\('language-toggle'\)\.addEventListener\('click'/],
    ['tab-login', /elements\.loginTab\.addEventListener\('click'/],
    ['tab-signup', /elements\.signupTab\.addEventListener\('click'/],
    ['show-reset', /getElementById\('show-reset'\)\.addEventListener\('click'/],
    ['back-to-login', /getElementById\('back-to-login'\)\.addEventListener\('click'/],
    ['google-login', /getElementById\('google-login'\)\.addEventListener\('click'/],
    ['google-signup', /getElementById\('google-signup'\)\.addEventListener\('click'/]
]) {
    assert.ok(authHtml.includes(`id="${controlId}"`), `The auth page must render the ${controlId} control.`);
    assert.match(authSource, handler, `The auth control ${controlId} must have a click handler.`);
}
for (const formId of ['login-form', 'signup-form', 'reset-form', 'update-password-form']) {
    assert.match(authSource, new RegExp(`handleForm\\(document\\.getElementById\\('${formId}'\\)`), `The auth form ${formId} must have a submit handler.`);
}
assert.match(
    authSource,
    /signInWithOAuth\(\{\s*provider:\s*'google'/,
    'The auth page must support Google OAuth.'
);
assert.match(
    fs.readFileSync(path.join(root, 'modules/supabaseClient.js'), 'utf8'),
    /flowType:\s*'pkce'/,
    'Supabase browser authentication must use PKCE.'
);
assert.doesNotMatch(
    fs.readFileSync(path.join(root, 'supabase-config.js'), 'utf8').replace(/\/\/.*$/gm, ''),
    /service[_-]?role|secret/i,
    'Browser Supabase configuration must not expose service-role credentials.'
);
for (const [, assetPath] of authHtml.matchAll(/(?:src|href)="(?![a-z][a-z\d+.-]*:|#)([^"]+)"/gi)) {
    assert.ok(
        fs.existsSync(path.join(root, assetPath)),
        `Auth page references missing local asset: ${assetPath}`
    );
}
const schemaMigration = fs.readFileSync(
    path.join(root, 'supabase/migrations/20261023000000_initial_schema.sql'),
    'utf8'
);
const schemaTables = [
    'profiles', 'topics', 'plans', 'enrollments', 'orders', 'payments',
    'progress', 'audit_log', 'student_groups', 'group_members'
];
for (const table of schemaTables) {
    assert.match(schemaMigration, new RegExp(`create table public\\.${table}\\s*\\(`), `${table} must be created by the migration.`);
    assert.match(schemaMigration, new RegExp(`alter table public\\.${table} enable row level security`), `${table} must enable RLS.`);
    assert.match(schemaMigration, new RegExp(`alter table public\\.${table} force row level security`), `${table} must force RLS.`);
}
assert.match(schemaMigration, /grant select \(id, display_name, role, status, is_minor, created_at\)\s+on public\.profiles to authenticated/i, 'Guardian contact details must not be directly selectable by clients.');
assert.doesNotMatch(schemaMigration, /grant\s+(?:all|update)\s+on\s+public\.profiles\s+to\s+authenticated/i, 'Clients must not be able to change profile roles or status.');
assert.match(schemaMigration, /auth\.jwt\(\)[\s\S]*?->>\s*'aal'\s*=\s*'aal2'/, 'Owner access must require MFA assurance level aal2.');
assert.match(schemaMigration, /foreign key \(order_id, midtrans_order_id, gross_amount_idr\)\s+references public\.orders \(id, midtrans_order_id, gross_amount_idr\)/i, 'Payments must match their order ID and amount at the database level.');
assert.match(schemaMigration, /progress_insert_own[\s\S]*?user_id = \(select auth\.uid\(\)\)/i, 'Progress writes must be scoped to the authenticated user.');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
assert.match(html, /id="feedback-modal"[^>]*role="dialog"[^>]*aria-modal="true"[^>]*aria-labelledby="feedback-title"[^>]*aria-describedby="feedback-message"/, 'The feedback dialog must expose its title and description.');
assert.match(html, /id="feedback-message" class="feedback-message"/, 'Feedback content must use a valid container for structured results.');
const appSource = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
assert.match(appSource, /auth\.html\?returnTo=home/, 'Learner sign-in links must return users to the app after authentication.');
assert.match(appSource, /ContentService\.listTopics\(\)/, 'The topic list must load from the public database index.');
assert.match(appSource, /this\.contentService\.getLesson\(moduleInfo\.id\)/, 'Topic content must load through the gated service.');
assert.doesNotMatch(appSource, /fetch\(\s*(?:moduleInfo\.configPath|this\.currentDataFile)/, 'The app must not fetch public lesson JSON paths.');
assert.doesNotMatch(appSource, /loadSampleData|sampleData|Introduction to Past Simple Tense/, 'Lesson examples must not be embedded in the app bundle.');
assert.match(appSource, /Hubungi guru untuk daftar/, 'The locked state must offer teacher enrollment contact.');
const contentServiceSource = fs.readFileSync(path.join(root, 'modules/contentService.js'), 'utf8');
assert.match(authSource, /function redirectAfterSignIn\(params\)/, 'Password and OAuth sign-in must share a single return flow.');
assert.match(authSource, /redirectAfterSignIn\(new URLSearchParams\(window\.location\.search\)\)/, 'Successful password sign-in must navigate to its safe destination.');
assert.match(authSource, /redirectAfterSignIn\(params\)/, 'Existing OAuth sessions must navigate to the same safe destination.');
assert.match(authSource, /returnTo === 'payment'[\s\S]*?payment-return\.html\?order_id=/, 'Payment sign-in must return to the associated order status page.');
assert.match(authSource, /emailRedirect\.searchParams\.set\('returnTo', returnTo\)/, 'Signup verification must preserve an allowed post-auth destination.');
assert.match(contentServiceSource, /functions\.invoke\('get-lesson'/, 'ContentService must call the gated Edge Function.');
assert.doesNotMatch(contentServiceSource, /localStorage|sessionStorage|CacheStorage/, 'Lesson JSON must not be cached in browser storage.');
assert.match(
    fs.readFileSync(path.join(root, '.env.example'), 'utf8'),
    /MIDTRANS_SERVER_KEY|MIDTRANS_CLIENT_KEY/,
    'The environment example must include Midtrans server-side keys.'
);
assert.match(
    fs.readFileSync(path.join(root, 'modules/paymentService.js'), 'utf8'),
    /client\.functions\.invoke\('create-order'/,
    'The browser must call the server-side order creation function.'
);
const ownerMigration = fs.readFileSync(
    path.join(root, 'supabase/migrations/20261028000000_owner_identity.sql'),
    'utf8'
);
assert.match(ownerMigration, /stefanustankaemingk2@gmail\.com/, 'The owner identity must be explicitly allowlisted in the migration.');
assert.match(ownerMigration, /case when is_configured_owner then 'owner' else 'free' end/, 'Only the configured owner identity may receive the owner role at signup.');
assert.match(ownerMigration, /u\.email_confirmed_at is not null[\s\S]*?lower\(trim\(coalesce\(u\.email, ''\)\)\) = 'stefanustankaemingk2@gmail\.com'/, 'Owner database access must require the verified allowlisted email.');
assert.doesNotMatch(ownerMigration, /raw_user_meta_data\s*->>\s*'role'/, 'Signup metadata must not assign account roles.');
const adminHtml = fs.readFileSync(path.join(root, 'admin/index.html'), 'utf8');
assert.match(adminHtml, /id="admin-dashboard"/, 'The owner page must have a dashboard view.');
assert.match(adminHtml, /id="language-toggle"/, 'The owner page must have a language toggle.');
for (const [, assetPath] of adminHtml.matchAll(/(?:src|href)="(?![a-z][a-z\d+.-]*:|#)([^"]+)"/gi)) {
    assert.ok(
        fs.existsSync(path.join(root, 'admin', assetPath)),
        `Admin page references missing local asset: ${assetPath}`
    );
}
const adminSource = fs.readFileSync(path.join(root, 'admin/admin.js'), 'utf8');
assert.match(adminSource, /profile\.role !== 'owner'/, 'The dashboard must hide itself from non-owner accounts.');
assert.match(adminSource, /getAuthenticatorAssuranceLevel/, 'The dashboard must require MFA assurance before reading owner data.');
assert.match(adminSource, /client\.from\('profiles'\)[\s\S]*?client\.from\('enrollments'\)[\s\S]*?client\.from\('topics'\)[\s\S]*?client\.from\('payments'\)/, 'Owner summary metrics must use the existing protected database tables.');
assert.doesNotMatch(adminSource, /SUPABASE_SERVICE_ROLE_KEY|MIDTRANS_SERVER_KEY/, 'The dashboard must not contain backend secrets.');
assert.match(adminHtml, /id="activity-json"[^>]*aria-describedby="content-editor-help"/, 'The activity editor must have accessible instructions.');
assert.match(adminSource, /functions\.invoke\('admin-content'/, 'The dashboard must use the protected content management function.');
for (const activityType of ['lesson', 'writing', 'game', 'quiz', 'spelling']) {
    assert.match(adminSource, new RegExp(`activityTypes: \\{[^}]*${activityType}:`), `The activity editor must label ${activityType} activities.`);
}
const adminContentSource = fs.readFileSync(path.join(root, 'supabase/functions/admin-content/index.ts'), 'utf8');
assert.match(adminContentSource, /requestSchema\s*=\s*z\.discriminatedUnion/, 'Activity management requests must be schema-validated.');
assert.match(adminContentSource, /authClient\.rpc\('is_owner'\)/, 'Activity management must enforce the database owner/MFA predicate.');
assert.match(adminContentSource, /bucket\.public !== false/, 'Activity management must reject public content buckets.');
assert.match(adminContentSource, /activity\.upsert[\s\S]*?activity\.delete/, 'Activity mutations must be audited.');
assert.match(adminContentSource, /ACTIVITY_ID_ALREADY_USED/, 'Activity IDs must remain unique across activity types.');
assert.match(
    fs.readFileSync(path.join(root, 'supabase/config.toml'), 'utf8'),
    /\[functions\.admin-content\]\s*verify_jwt = true/,
    'Activity management must require a Supabase JWT.'
);
assert.match(
    authSource,
    /returnTo === 'admin'[\s\S]*?location\.assign\('admin\/index\.html'\)/,
    'The auth page must support the fixed admin return destination.'
);
for (const [buttonId, handler] of [
    ['language-toggle', /languageToggle\.addEventListener\('click'/],
    ['refresh-dashboard', /getElementById\('refresh-dashboard'\)\.addEventListener\('click'/],
    ['sign-out', /signOutButton\.addEventListener\('click'/],
    ['load-activities', /getElementById\('load-activities'\)\.addEventListener\('click'/],
    ['new-activity', /getElementById\('new-activity'\)\.addEventListener\('click'/],
    ['save-activity', /getElementById\('save-activity'\)\.addEventListener\('click'/],
    ['delete-activity', /getElementById\('delete-activity'\)\.addEventListener\('click'/]
]) {
    assert.ok(adminHtml.includes(`id="${buttonId}"`), `The owner page must render the ${buttonId} button.`);
    assert.match(adminSource, handler, `The owner dashboard button ${buttonId} must have a click handler.`);
}
assert.match(adminSource, /getElementById\('plan-form'\)\.addEventListener\('submit'/, 'Plan saving must be connected to the plan form.');
assert.ok(fs.existsSync(path.join(root, 'docs/setup/OWNER_ADMIN_SETUP.md')), 'Owner dashboard deployment and MFA setup must be documented.');
const adminPlansSource = fs.readFileSync(path.join(root, 'supabase/functions/admin-plans/index.ts'), 'utf8');
assert.match(adminPlansSource, /requestSchema\s*=\s*z\.discriminatedUnion/, 'Owner plan management requests must be schema-validated.');
assert.match(adminPlansSource, /authClient\.rpc\('is_owner'\)/, 'Owner plan management must enforce the database owner/MFA predicate.');
assert.match(adminPlansSource, /admin_save_plan|admin_deactivate_plan/, 'Plan mutations must use transactional database helpers.');
assert.doesNotMatch(adminPlansSource, /SUPABASE_SERVICE_ROLE_KEY[\s\S]*?admin\.functions/, 'The plan API must not return privileged secrets.');
assert.match(
    fs.readFileSync(path.join(root, 'supabase/migrations/20261028020000_admin_plan_management.sql'), 'utf8'),
    /insert into public\.audit_log[\s\S]*?plan\.upsert[\s\S]*?plan\.deactivate/,
    'Plan changes must be recorded in the audit log.'
);
assert.match(
    fs.readFileSync(path.join(root, 'supabase/config.toml'), 'utf8'),
    /\[functions\.midtrans-webhook\]\s*#.*?verify_jwt = false/s,
    'The payment notification function must be reachable without a Supabase JWT and verify provider signatures itself.'
);
const paymentReturnSource = fs.readFileSync(path.join(root, 'modules/paymentReturnPage.js'), 'utf8');
const paymentReturnHtml = fs.readFileSync(path.join(root, 'payment-return.html'), 'utf8');
assert.match(paymentReturnHtml, /id="payment-refresh"/, 'The payment return page must render its refresh action.');
assert.match(paymentReturnHtml, /id="language-toggle"/, 'The payment return page must render its language action.');
assert.match(paymentReturnSource, /refreshButton\.addEventListener\('click', checkStatus\)/, 'The payment status refresh button must check the order again.');
assert.match(paymentReturnSource, /languageButton\.addEventListener\('click'/, 'The payment status language button must switch languages.');
assert.match(paymentReturnSource, /from\('orders'\)[\s\S]*?maybeSingle/, 'Payment return status must be read from the authenticated user order row.');
assert.doesNotMatch(paymentReturnSource, /localStorage|status_code|signature_key/, 'The payment return UI must not treat browser state as payment proof.');
assert.match(
    fs.readFileSync(path.join(root, 'supabase/functions/midtrans-webhook/index.ts'), 'utf8'),
    /signature_key|SHA-512|INVALID_SIGNATURE/,
    'The webhook must verify the Midtrans signature before accepting payment callbacks.'
);
const atomicPaymentMigration = fs.readFileSync(
    path.join(root, 'supabase/migrations/20261028010000_atomic_payment_processing.sql'),
    'utf8'
);
assert.match(atomicPaymentMigration, /process_midtrans_notification/, 'Payment and enrollment processing must run through a transaction function.');
assert.match(atomicPaymentMigration, /for update;/i, 'Payment notification processing must lock the order against duplicate webhook races.');
assert.match(atomicPaymentMigration, /payment_order_id[\s\S]*?unique index/i, 'A payment order must grant at most one enrollment.');
assert.match(atomicPaymentMigration, /current_status = 'paid' and p_status not in \('paid', 'refunded'\)/, 'Late non-paid notifications must not revoke a paid order.');
const webhookSource = fs.readFileSync(path.join(root, 'supabase/functions/midtrans-webhook/index.ts'), 'utf8');
assert.match(webhookSource, /admin\.rpc\('process_midtrans_notification'/, 'The webhook must use the atomic payment processor.');
assert.match(webhookSource, /fraud_status\?\.toLowerCase\(\) === 'accept'/, 'Midtrans capture must not grant access unless the fraud status is accepted.');
const paymentServiceSource = fs.readFileSync(path.join(root, 'modules/paymentService.js'), 'utf8');
assert.match(paymentServiceSource, /from\('plans'\)[\s\S]*?functions\.invoke\('create-order'/, 'The learner UI must load configured plans and request server-created orders.');
assert.match(paymentServiceSource, /app\.midtrans\.com[\s\S]*?app\.sandbox\.midtrans\.com/, 'Payment redirect URLs must be restricted to Midtrans hosts.');
assert.match(fs.readFileSync(path.join(root, 'app.js'), 'utf8'), /PaymentService\.createOrder\(plan\.id\)/, 'Locked topics must offer a checkout action for configured plans.');
const createOrderSource = fs.readFileSync(path.join(root, 'supabase/functions/create-order/index.ts'), 'utf8');
assert.match(createOrderSource, /admin\.auth\.getUser\(token\)/, 'Order creation must verify the account token server-side.');
assert.match(createOrderSource, /email_confirmed_at/, 'Order creation must require a verified account.');
assert.match(createOrderSource, /profile\.status !== 'active'/, 'Order creation must reject suspended accounts.');
assert.match(createOrderSource, /\.eq\('active', true\)/, 'Order creation must only accept active server-configured plans.');
assert.match(createOrderSource, /Number\.isSafeInteger\(grossAmount\)/, 'Order creation must reject prices outside the safe integer range.');
assert.match(createOrderSource, /gross_amount:\s*grossAmount/, 'The provider charge must use the server-stored plan amount.');
assert.match(
    fs.readFileSync(path.join(root, 'supabase/migrations/20261023000000_initial_schema.sql'), 'utf8'),
    /upsert_payment_enrollment/,
    'The schema must include an enrollment helper for a single atomic payment update.'
);
const trialMigrationPath = path.join(root, 'supabase/migrations/20261111000000_free_trial_access.sql');
assert.ok(fs.existsSync(trialMigrationPath), 'Free trial access must be added by a timestamped migration.');
const trialMigration = fs.readFileSync(trialMigrationPath, 'utf8');
assert.match(trialMigration, /add column if not exists trial_days smallint/i, 'Trial duration must be optional plan data.');
assert.match(trialMigration, /trial_days is null or trial_days between 1 and 30/i, 'Trial duration must be bounded.');
assert.match(trialMigration, /check\s*\(\s*\(source = 'trial' and trial_plan_id is not null\)\s+or source <> 'trial'\s*\)/i, 'A payment upgrade must be able to retain the original trial plan without violating the enrollment constraint.');
assert.match(trialMigration, /create unique index if not exists enrollments_one_trial_per_user[\s\S]*?where source = 'trial'/i, 'A user may receive at most one trial enrollment.');
assert.match(trialMigration, /for update of p/i, 'Trial grants must serialize concurrent starts on the account row.');
assert.match(trialMigration, /trial_expires_at := trial_granted_at \+ make_interval\(days => configured_trial_days\)/i, 'Trial expiry must be calculated by PostgreSQL.');
assert.match(trialMigration, /revoke all on function public\.start_user_trial\(uuid, text\)\s+from public, anon, authenticated/i, 'Trial mutation must not be callable by browser roles.');
assert.match(trialMigration, /grant execute on function public\.start_user_trial\(uuid, text\)\s+to service_role/i, 'Only the trusted server role may grant a trial.');
const trialFunctionSource = fs.readFileSync(path.join(root, 'supabase/functions/start-trial/index.ts'), 'utf8');
assert.match(trialFunctionSource, /admin\.auth\.getUser\(token\)/, 'Trial requests must validate the user token server-side.');
assert.match(trialFunctionSource, /email_confirmed_at/, 'Trial eligibility must require a verified account.');
assert.match(trialFunctionSource, /admin\.rpc\('start_user_trial'/, 'Trial grants must use the atomic database function.');
assert.match(trialFunctionSource, /Number\(plan\.trial_days\) <= 30/, 'Trial eligibility responses must stay within the configured maximum duration.');
assert.match(trialFunctionSource, /\.from\('enrollments'\)[\s\S]*?\.eq\('user_id', user\.id\)[\s\S]*?existingEnrollment/, 'Trial offers must hide for users with enrollment history.');
assert.match(fs.readFileSync(path.join(root, 'supabase/config.toml'), 'utf8'), /\[functions\.start-trial\]\s+verify_jwt = true/, 'The start-trial function must require gateway JWT verification.');
assert.match(fs.readFileSync(path.join(root, 'modules/trialService.js'), 'utf8'), /functions\.invoke\('start-trial'/, 'The learner must call the configured start-trial Edge Function.');
assert.match(appSource, /TrialService\.getEligibility\(\)[\s\S]*?Mulai uji coba gratis[\s\S]*?Start .*free trial/, 'Locked learner access must show a bilingual CTA only after server eligibility succeeds.');
assert.match(appSource, /TrialService\.startTrial\(plan\.id\)/, 'The learner CTA must request the one-time server grant.');
const lessonFunctionSource = fs.readFileSync(
    path.join(root, 'supabase/functions/get-lesson/index.ts'),
    'utf8'
);
assert.match(lessonFunctionSource, /requestSchema\s*=\s*z\.object/, 'The Edge Function must validate its request with a schema.');
assert.match(lessonFunctionSource, /maxRequestBodyBytes\s*=\s*2048/, 'The Edge Function must bound request body size.');
assert.match(lessonFunctionSource, /admin\.auth\.getUser\(token\)/, 'The Edge Function must verify the access token server-side.');
assert.match(lessonFunctionSource, /email_confirmed_at/, 'The Edge Function must require verified email.');
assert.match(lessonFunctionSource, /TextDecoder\(\)\.decode\(bytes\)/, 'Owner assurance parsing must support UTF-8 token claims.');
assert.match(lessonFunctionSource, /if \(profileError\)[\s\S]*?SERVICE_UNAVAILABLE[\s\S]*?if \(!profile \|\| profile\.status !== 'active'\)/, 'Profile query failures must not be reported as inactive accounts.');
assert.match(lessonFunctionSource, /if \(topicError\)[\s\S]*?SERVICE_UNAVAILABLE[\s\S]*?if \(!topic\)/, 'Topic query failures must not be reported as missing topics.');
assert.match(lessonFunctionSource, /expires_at\.is\.null,expires_at\.gt\.\$\{now\}/, 'Full-access entitlements must enforce expiry.');
assert.match(lessonFunctionSource, /getUser\(token\)[\s\S]*?getVerifiedTokenAssurance\(token\)[\s\S]*?aal2/, 'Owner lesson access must verify the token before requiring MFA assurance.');
assert.match(lessonFunctionSource, /UPSTASH_REDIS_REST_TOKEN[\s\S]*?rateLimitPerMinute/, 'The Edge Function must rate limit lesson requests.');
assert.match(lessonFunctionSource, /Cache-Control': 'private, no-store/, 'Lesson responses must not be cacheable.');
assert.match(lessonFunctionSource, /getBucket\('lesson-content'\)[\s\S]*?bucket\.public !== false/, 'The Edge Function must fail closed if the content bucket is public.');
assert.ok(
    lessonFunctionSource.indexOf('if (!topic.is_free && !hasFullAccess)')
        < lessonFunctionSource.indexOf('.storage'),
    'Entitlement must be checked before private content is read.'
);
assert.ok(appSource.includes("querySelector('.feedback-modal__backdrop')"), 'The feedback backdrop handler must target the rendered backdrop.');
assert.ok(appSource.includes("e.key === 'Escape'"), 'The feedback dialog must support Escape to close.');
assert.ok(appSource.includes("setAttribute('aria-hidden', 'false')"), 'Opening the dialog must expose it to assistive technology.');
for (const [, assetPath] of html.matchAll(/(?:src|href)="(?![a-z][a-z\d+.-]*:|#)([^"]+)"/gi)) {
    assert.ok(
        fs.existsSync(path.join(root, assetPath)),
        `HTML references missing local asset: ${assetPath}`
    );
}

const styles = fs.readFileSync(path.join(root, 'css/styles.css'), 'utf8');
for (const selector of ['.feedback-answer-item', '.drag-container', '.draggable', '.drop-zone']) {
    assert.ok(styles.includes(selector), `Missing separated activity or feedback styling: ${selector}`);
}
const lessonStyles = fs.readFileSync(path.join(root, 'css/lesson-module.css'), 'utf8');
for (const selector of ['.lesson-main-content', '.functions-section', '.tips-section', '.examples-section']) {
    assert.ok(lessonStyles.includes(selector), `Missing lesson reading styles for ${selector}.`);
}
const lessonModuleSource = fs.readFileSync(path.join(root, 'modules/lessonModule.js'), 'utf8');
assert.match(lessonModuleSource, /lesson-voice-select/, 'Lessons must offer a simple voice selector.');
assert.match(lessonModuleSource, /addEventListener\('change', this\._lessonChangeHandler\)/, 'Voice selection must respond to changes.');
assert.match(lessonModuleSource, /pauseLessonAudio|resumeLessonAudio/, 'Lesson playback must support pause and resume.');
assert.doesNotMatch(
    fs.readFileSync(path.join(root, 'modules/textToSpeechService.js'), 'utf8'),
    /ELEVENLABS|api\.elevenlabs\.io|API_KEY/,
    'Lesson speech must not depend on a paid API key or hosted TTS model.'
);

const imageServiceSource = fs.readFileSync(path.join(root, 'modules/imageService.js'), 'utf8');
assert.match(imageServiceSource, /commons\.wikimedia\.org\/w\/api\.php/, 'Writing images must use the free Wikimedia Commons API.');
assert.doesNotMatch(imageServiceSource, /UNSPLASH_API_KEY|client_id=/, 'Image lookup must not require a client API key.');
const futureData = JSON.parse(fs.readFileSync(path.join(root, 'reproducibility/future-tenses.json'), 'utf8'));
assert.ok(
    futureData.writingActivities.every(activity => activity.imageQuery && activity.imageAlt),
    'Future writing activities must specify a related image query and descriptive alt text.'
);

for (const file of configs) {
    const configPath = path.join(configDirectory, file);
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    assert.ok(config.siteSettings?.title, `${file} is missing its title.`);
    assert.ok(config.lesson?.title, `${file} is missing its lesson title.`);
    assert.ok(Array.isArray(config.wordBank?.categories), `${file} is missing its word bank.`);

    const dataPath = path.resolve(root, config.dataFile || '');
    assert.ok(config.dataFile && fs.existsSync(dataPath), `${file} has a missing data file.`);
    const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    const activityIds = new Set();

    for (const category of [
        'lessonActivities',
        'writingActivities',
        'gameActivities',
        'quizActivities',
        'spellingActivities'
    ]) {
        const activities = data[category] || [];
        assert.ok(Array.isArray(activities), `${dataPath}: ${category} must be an array.`);
        for (const activity of activities) {
            assert.ok(activity.id, `${dataPath}: ${category} contains an activity without an id.`);
            assert.ok(!activityIds.has(activity.id), `${dataPath}: duplicate activity id ${activity.id}.`);
            activityIds.add(activity.id);
            activityCount++;

            if (category === 'gameActivities') {
                assert.ok(
                    ['drag-drop', 'ordering', 'reorder', 'roleplay', 'simulator', 'writing'].includes(activity.type),
                    `${dataPath}: unsupported game type for ${activity.id}.`
                );
            }
            if (category === 'quizActivities') {
                assert.ok(Array.isArray(activity.options) && activity.options.length > 1, `${activity.id} needs quiz options.`);
                assert.ok(activity.correctAnswer !== undefined, `${activity.id} needs a correct answer.`);
            }
            if (category === 'spellingActivities') {
                assert.ok(activity.word && activity.clue, `${activity.id} needs a spelling word and clue.`);
            }
        }
    }

    if (config.grammarChecker && !checkedCheckers.has(config.grammarChecker)) {
        const checkerPath = path.join(root, 'modules/grammarCheckers', config.grammarChecker);
        assert.ok(fs.existsSync(checkerPath), `${file} references missing checker ${config.grammarChecker}.`);
        const checkerModule = await import(pathToFileURL(checkerPath));
        const checker = checkerModule.default || Object.values(checkerModule).find(value => value && typeof value === 'object');
        assert.ok(
            typeof checker?.check === 'function' || typeof checker?.validateActivity === 'function',
            `${config.grammarChecker} does not expose a writing validation function.`
        );
        checkedCheckers.add(config.grammarChecker);
    }
}

globalThis.window = {};
await import(pathToFileURL(path.join(root, 'modules/gameModule.js')));
const gameModule = window.GameModule;
assert.equal(gameModule.getDropZoneCount({ sentence: 'Choose the correct option:' }), 0);
assert.deepEqual(
    gameModule.getDropAnswerSets({ correctAnswer: ['much', 'a lot of'] }, 1),
    [['much'], ['a lot of']]
);
assert.deepEqual(
    gameModule.getDropAnswerSets({ correctAnswer: ['heat / boils'] }, 2),
    [['heat', 'boils']]
);
assert.equal(
    gameModule.isCombinedDropActivity({
        sentence: 'If you ____ water to 100°C, it ____.',
        options: ['heat / boils', 'heated / boils']
    }),
    true
);
gameModule.selectedAnswers = { choice: 'The correct answer' };
assert.equal(
    gameModule.checkChoiceAnswer({
        id: 'choice',
        correctAnswer: ['The correct answer', 'Another accepted answer']
    }).status,
    'correct'
);
const dropZones = ['got', 'to finish'].map(text => ({
    textContent: text,
    classList: { toggle() {} }
}));
assert.equal(
    gameModule.checkDragDropAnswer(
        { correctAnswer: ['got / to finish'] },
        { querySelectorAll: () => dropZones },
        true
    ).status,
    'correct'
);

const previousFetch = globalThis.fetch;
const cachedImages = new Map();
globalThis.localStorage = {
    getItem: key => cachedImages.get(key) || null,
    setItem: (key, value) => cachedImages.set(key, value),
    removeItem: key => cachedImages.delete(key)
};
await import(pathToFileURL(path.join(root, 'modules/imageService.js')));
const imageService = window.ImageService;
globalThis.ImageService = imageService;
let requestedImageUrl;
globalThis.fetch = async request => {
    requestedImageUrl = new URL(request);
    return {
        ok: true,
        json: async () => ({
            query: {
                pages: [{
                    imageinfo: [{
                        thumburl: 'https://upload.wikimedia.org/example.jpg',
                        descriptionurl: 'https://commons.wikimedia.org/wiki/File:Example.jpg',
                        extmetadata: {
                            Artist: { value: '<a href="/wiki/User:Example">Example artist</a>' },
                            LicenseShortName: { value: 'CC BY-SA 4.0' },
                            LicenseUrl: { value: 'https://creativecommons.org/licenses/by-sa/4.0/' },
                            ImageDescription: { value: 'A sample image' }
                        }
                    }]
                }]
            }
        })
    };
};
const commonsImage = await imageService.fetchFromWikimedia({
    id: 'writing-6',
    question: 'Write about moving to Bali.',
    imageQuery: 'Bali beach tropical island'
}, 'future-tenses');
assert.equal(requestedImageUrl.searchParams.get('origin'), '*');
assert.equal(requestedImageUrl.searchParams.get('gsrsearch'), 'filetype:bitmap Bali beach tropical island');
assert.equal(commonsImage.sourceName, 'Wikimedia Commons');
assert.equal(commonsImage.credit, 'Example artist');
assert.equal(commonsImage.licenseName, 'CC BY-SA 4.0');
assert.ok(cachedImages.has(
    `${imageService.CACHE_KEY_PREFIX}future-tenses%3Awriting-6%3Abali%20beach%20tropical%20island`
));
await import(pathToFileURL(path.join(root, 'modules/writingModule.js')));
const writingModule = window.WritingModule;
const bannerHtml = writingModule.createImageBanner({
    id: 'writing-6',
    imageQuery: 'Bali beach tropical island',
    imageAlt: 'A beach in Bali'
}, commonsImage);
assert.match(bannerHtml, /href="https:\/\/commons\.wikimedia\.org\/wiki\/File:Example\.jpg"/);
assert.match(bannerHtml, /alt="A beach in Bali"/);
assert.match(bannerHtml, /Wikimedia Commons/);

imageService.imageMapping = {
    'writing-2': { path: 'assets/images/future-tenses/writing-2.jpg', credit: 'Local photographer' }
};
globalThis.fetch = async () => ({ ok: true, json: async () => ({ query: { pages: [] } }) });
const moduleImage = await imageService.getImageData(
    { id: 'writing-2', question: 'Describe Jakarta city.' },
    'future-tenses'
);
const otherModuleImage = await imageService.getImageData(
    { id: 'writing-2', question: 'Describe Jakarta city.' },
    'past-tenses'
);
assert.equal(moduleImage.imageUrl, 'assets/images/future-tenses/writing-2.jpg');
assert.equal(otherModuleImage.imageUrl, 'assets/fallback.jpg');
globalThis.fetch = previousFetch;

const makeElement = () => ({
    children: [],
    attributes: {},
    style: {},
    textContent: '',
    setAttribute(name, value) {
        this.attributes[name] = value;
    },
    appendChild(child) {
        this.children.push(child);
        return child;
    },
    append(...children) {
        this.children.push(...children);
    },
    replaceChildren(...children) {
        this.children = children;
    }
});
const rewardElements = {
    'rewards-summary': makeElement(),
    'stars-container': makeElement()
};
globalThis.document = {
    getElementById: id => rewardElements[id] || null,
    createElement: () => makeElement()
};
globalThis.App = {
    currentGrammarModuleId: 'test-module',
    state: {
        moduleStars: {},
        completedActivities: { 'test-module': { first: 'completed' } },
        rewards: { stars: 0, points: 0, badges: [] }
    },
    updateUI() {},
    saveState() {},
    showFeedback() {},
    playSound() {}
};
globalThis.WritingModule = { activities: [{ id: 'writing-1' }] };
globalThis.GameModule = gameModule;
globalThis.GameModule.activities = [{ id: 'game-1' }];
globalThis.SpellingHelper = { activities: [{ id: 'spelling-1' }] };
globalThis.LessonModule = { data: [{ id: 'lesson-1' }] };
globalThis.QuizModule = { activities: [] };
await import(pathToFileURL(path.join(root, 'modules/rewardsSystem.js')));
const rewardSystem = window.RewardSystem;
assert.equal(rewardSystem.calculateModuleStars('test-module'), 1, 'Stars must count all activity categories proportionally.');
rewardSystem.awardStar();
assert.equal(App.state.rewards.points, 10, 'A completed activity must earn learning points.');
assert.equal(App.state.moduleStars['test-module'], 1);
rewardSystem.updateStarsDisplay();
assert.match(rewardElements['rewards-summary'].textContent, /10 learning points/);
assert.equal(rewardElements['stars-container'].children[0].children[0].textContent, '★');
assert.match(rewardElements['stars-container'].children[1].children[0].textContent, /Complete 1 more activity/);
rewardSystem.rewards = { badges: [{ id: 'test-badge', moduleId: 'test-module' }] };
rewardSystem.awardBadge({
    id: 'test-badge',
    name: 'Test badge',
    condition: 'Complete a test',
    points: 15
});
assert.equal(App.state.rewards.points, 25, 'Badge bonus points must be added to the learner total.');
assert.equal(App.state.modulePoints['test-module'], 25, 'Module reward points must be tracked for progress resets.');

const spokenUtterances = [];
const speechEvents = [];
const englishVoices = [
    { name: 'English US Basic', lang: 'en-US', voiceURI: 'basic', default: true },
    { name: 'Microsoft Aria Online (Natural)', lang: 'en-US', voiceURI: 'natural' },
    { name: 'English UK Voice', lang: 'en-GB', voiceURI: 'uk' }
];
globalThis.CustomEvent = class {
    constructor(type, options = {}) {
        this.type = type;
        this.detail = options.detail;
    }
};
globalThis.document.readyState = 'complete';
globalThis.document.dispatchEvent = event => speechEvents.push(event);
globalThis.SpeechSynthesisUtterance = class {
    constructor(text) {
        this.text = text;
    }
};
globalThis.window.SpeechSynthesisUtterance = globalThis.SpeechSynthesisUtterance;
globalThis.window.speechSynthesis = {
    addEventListener() {},
    getVoices: () => englishVoices,
    speak: utterance => spokenUtterances.push(utterance),
    cancel() {},
    pause() {},
    resume() {}
};
await import(pathToFileURL(path.join(root, 'modules/textToSpeechService.js')));
const speechService = window.TextToSpeechService;
speechService.init();
assert.equal(speechService.getAvailableVoices().length, 3, 'English voices should be listed.');
assert.equal(speechService.getPreferredVoice().voiceURI, 'natural', 'A natural voice should be preferred when available.');
assert.equal(speechService.setVoice('uk'), true);
assert.equal(speechService.getPreferredVoice().voiceURI, 'uk', 'Learners must be able to choose an English voice.');
assert.equal(speechService.setVoice(''), true);
const speechText = 'A short listening sentence. '.repeat(30);
assert.equal(speechService.speak(speechText), true);
assert.equal(spokenUtterances[0].rate, 0.9, 'The default lesson narration rate should be easy to follow.');
assert.equal(spokenUtterances[0].voice.voiceURI, 'natural');
speechService.pause();
assert.equal(speechService.isPaused, true);
speechService.resume();
assert.equal(speechService.isPaused, false);
let utteranceIndex = 0;
while (speechService.isPlaying) {
    const currentUtterance = spokenUtterances[utteranceIndex++];
    assert.ok(currentUtterance, 'Speech playback must queue all lesson sections.');
    currentUtterance.onend();
}
assert.ok(speechEvents.some(event => event.type === 'tts-ended'), 'Speech completion must notify lesson controls.');

console.log(`QA passed: ${configs.length} grammar topics, ${activityCount} activities, ${checkedCheckers.size} writing checkers, and game-answer behavior.`);
