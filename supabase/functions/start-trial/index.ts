import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

const requestSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('eligibility') }).strict(),
  z.object({
    action: z.literal('start'),
    planId: z.string().regex(/^[a-z0-9]+(?:[-_][a-z0-9]+)*$/).max(64)
  }).strict()
]);

const maxRequestBodyBytes = 2048;

function jsonResponse(status: number, body: Record<string, unknown>, origin: string | null): Response {
  const headers = new Headers({
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'private, no-store, max-age=0',
    'Pragma': 'no-cache',
    'Vary': 'Origin'
  });
  if (origin) {
    headers.set('Access-Control-Allow-Origin', origin);
    headers.set('Access-Control-Allow-Headers', 'authorization, x-client-info, apikey, content-type');
    headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  }
  return new Response(JSON.stringify(body), { status, headers });
}

async function readRequestBody(request: Request): Promise<unknown> {
  const declaredLength = Number(request.headers.get('content-length'));
  if (Number.isFinite(declaredLength) && declaredLength > maxRequestBodyBytes) {
    throw new Error('REQUEST_BODY_TOO_LARGE');
  }

  const reader = request.body?.getReader();
  if (!reader) throw new Error('REQUEST_BODY_MISSING');
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > maxRequestBodyBytes) {
      await reader.cancel();
      throw new Error('REQUEST_BODY_TOO_LARGE');
    }
    chunks.push(value);
  }

  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return JSON.parse(new TextDecoder().decode(bytes));
}

async function handleRequest(request: Request): Promise<Response> {
  const configuredOrigin = Deno.env.get('APP_ORIGIN');
  const origin = request.headers.get('origin');
  if (!configuredOrigin) return jsonResponse(503, { code: 'SERVICE_UNAVAILABLE' }, null);
  if (origin && origin !== configuredOrigin) {
    return jsonResponse(403, { code: 'ORIGIN_NOT_ALLOWED' }, null);
  }
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': origin || configuredOrigin,
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Max-Age': '600',
        'Vary': 'Origin'
      }
    });
  }
  if (request.method !== 'POST') return jsonResponse(405, { code: 'METHOD_NOT_ALLOWED' }, origin);

  let input: z.infer<typeof requestSchema>;
  try {
    input = requestSchema.parse(await readRequestBody(request));
  } catch (error) {
    const tooLarge = error instanceof Error && error.message === 'REQUEST_BODY_TOO_LARGE';
    return jsonResponse(tooLarge ? 413 : 400, {
      code: tooLarge ? 'REQUEST_TOO_LARGE' : 'INVALID_REQUEST'
    }, origin);
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const token = request.headers.get('authorization')?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!supabaseUrl || !serviceRoleKey) {
    return jsonResponse(503, { code: 'SERVICE_UNAVAILABLE' }, origin);
  }
  if (!token) return jsonResponse(401, { code: 'AUTH_REQUIRED' }, origin);

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
  const { data: userResult, error: userError } = await admin.auth.getUser(token);
  const user = userResult.user;
  if (userError || !user?.email_confirmed_at) {
    return jsonResponse(401, { code: 'VERIFIED_ACCOUNT_REQUIRED' }, origin);
  }

  const { data: profile, error: profileError } = await admin
    .from('profiles')
    .select('role,status')
    .eq('id', user.id)
    .maybeSingle();
  if (profileError) {
    console.error('start-trial profile lookup failed:', profileError.code || 'database_error');
    return jsonResponse(503, { code: 'SERVICE_UNAVAILABLE' }, origin);
  }
  if (!profile || profile.status !== 'active') {
    return jsonResponse(403, { code: 'ACCOUNT_NOT_ACTIVE' }, origin);
  }

  if (input.action === 'eligibility') {
    if (profile.role === 'owner') return jsonResponse(200, { eligible: false, plans: [] }, origin);

    const { data: existingEnrollment, error: enrollmentError } = await admin
      .from('enrollments')
      .select('id')
      .eq('user_id', user.id)
      .limit(1)
      .maybeSingle();
    if (enrollmentError) {
      console.error('start-trial enrollment lookup failed:', enrollmentError.code || 'database_error');
      return jsonResponse(503, { code: 'SERVICE_UNAVAILABLE' }, origin);
    }
    if (existingEnrollment) return jsonResponse(200, { eligible: false, plans: [] }, origin);

    const { data: plans, error: plansError } = await admin
      .from('plans')
      .select('id,name,trial_days')
      .eq('active', true)
      .not('trial_days', 'is', null)
      .order('id');
    if (plansError) {
      console.error('start-trial plan lookup failed:', plansError.code || 'database_error');
      return jsonResponse(503, { code: 'SERVICE_UNAVAILABLE' }, origin);
    }
    const configuredPlans = (plans || [])
      .filter(plan => Number.isInteger(Number(plan.trial_days))
        && Number(plan.trial_days) >= 1
        && Number(plan.trial_days) <= 30)
      .map(plan => ({ id: plan.id, name: plan.name, trialDays: Number(plan.trial_days) }));
    return jsonResponse(200, {
      eligible: profile.role !== 'owner' && configuredPlans.length > 0,
      plans: profile.role === 'owner' ? [] : configuredPlans
    }, origin);
  }

  const { data, error } = await admin.rpc('start_user_trial', {
    p_user_id: user.id,
    p_plan_id: input.planId
  });
  if (error) {
    const databaseMessage = error.message || '';
    if (databaseMessage.includes('TRIAL_ACCOUNT_NOT_ELIGIBLE')) {
      return jsonResponse(403, { code: 'TRIAL_NOT_ELIGIBLE' }, origin);
    }
    if (databaseMessage.includes('TRIAL_NOT_ELIGIBLE') || error.code === '23505') {
      return jsonResponse(409, { code: 'TRIAL_ALREADY_USED' }, origin);
    }
    if (databaseMessage.includes('TRIAL_PLAN_UNAVAILABLE')) {
      return jsonResponse(404, { code: 'TRIAL_UNAVAILABLE' }, origin);
    }
    console.error('start-trial grant failed:', error.code || 'database_error');
    return jsonResponse(500, { code: 'TRIAL_START_FAILED' }, origin);
  }

  const enrollment = Array.isArray(data) ? data[0] : data;
  if (
    !enrollment
    || typeof enrollment.enrollment_id !== 'string'
    || typeof enrollment.expires_at !== 'string'
    || !Number.isInteger(Number(enrollment.trial_days))
    || Number(enrollment.trial_days) < 1
    || Number(enrollment.trial_days) > 30
  ) {
    console.error('start-trial returned an invalid grant');
    return jsonResponse(500, { code: 'TRIAL_START_FAILED' }, origin);
  }
  return jsonResponse(200, {
    enrollmentId: enrollment.enrollment_id,
    expiresAt: enrollment.expires_at,
    trialDays: Number(enrollment.trial_days)
  }, origin);
}

Deno.serve(async (request: Request): Promise<Response> => {
  try {
    return await handleRequest(request);
  } catch (error) {
    console.error('start-trial request failed:', error instanceof Error ? error.name : 'unknown');
    const configuredOrigin = Deno.env.get('APP_ORIGIN');
    const origin = request.headers.get('origin');
    return jsonResponse(503, { code: 'SERVICE_UNAVAILABLE' }, origin === configuredOrigin ? origin : null);
  }
});
