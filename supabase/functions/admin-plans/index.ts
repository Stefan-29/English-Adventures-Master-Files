import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

const requestSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('list') }).strict(),
  z.object({
    action: z.literal('save'),
    id: z.string().regex(/^[a-z0-9]+(?:[-_][a-z0-9]+)*$/).max(64),
    name: z.string().trim().min(1).max(120),
    description: z.string().trim().max(500).default(''),
    priceIdr: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
    durationMonths: z.union([z.literal(1), z.literal(3), z.literal(12), z.null()]),
    active: z.boolean()
  }).strict(),
  z.object({
    action: z.literal('deactivate'),
    id: z.string().regex(/^[a-z0-9]+(?:[-_][a-z0-9]+)*$/).max(64)
  }).strict()
]);

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
  if (Number.isFinite(declaredLength) && declaredLength > 8192) {
    throw new Error('REQUEST_BODY_TOO_LARGE');
  }

  const reader = request.body?.getReader();
  if (!reader) throw new Error('REQUEST_BODY_MISSING');
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > 8192) {
      await reader.cancel();
      throw new Error('REQUEST_BODY_TOO_LARGE');
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return JSON.parse(new TextDecoder().decode(bytes));
}

async function handleRequest(request: Request): Promise<Response> {
  const appOrigin = Deno.env.get('APP_ORIGIN');
  const origin = request.headers.get('origin');
  if (!appOrigin) return jsonResponse(503, { code: 'SERVICE_UNAVAILABLE' }, null);
  if (origin && origin !== appOrigin) return jsonResponse(403, { code: 'ORIGIN_NOT_ALLOWED' }, null);
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': origin || appOrigin,
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
    return jsonResponse(error instanceof Error && error.message === 'REQUEST_BODY_TOO_LARGE' ? 413 : 400,
      { code: error instanceof Error && error.message === 'REQUEST_BODY_TOO_LARGE' ? 'REQUEST_TOO_LARGE' : 'INVALID_REQUEST' },
      origin);
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const token = request.headers.get('authorization')?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    return jsonResponse(503, { code: 'SERVICE_UNAVAILABLE' }, origin);
  }
  if (!token) return jsonResponse(401, { code: 'AUTH_REQUIRED' }, origin);

  const authClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { autoRefreshToken: false, persistSession: false }
  });
  const { data: userResult, error: userError } = await authClient.auth.getUser(token);
  if (userError || !userResult.user?.email_confirmed_at) {
    return jsonResponse(401, { code: 'VERIFIED_ACCOUNT_REQUIRED' }, origin);
  }

  const { data: owner, error: ownerError } = await authClient.rpc('is_owner');
  if (ownerError || owner !== true) {
    return jsonResponse(404, { code: 'NOT_FOUND' }, origin);
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  if (input.action === 'list') {
    const { data, error } = await admin
      .from('plans')
      .select('id,name,description,price_idr,duration_months,active')
      .order('price_idr');
    if (error) {
      console.error('Admin plan list failed:', error.code || 'database_error');
      return jsonResponse(500, { code: 'PLAN_LIST_FAILED' }, origin);
    }
    return jsonResponse(200, { plans: data }, origin);
  }

  if (input.action === 'save') {
    const { data, error } = await admin.rpc('admin_save_plan', {
      p_actor: userResult.user.id,
      p_id: input.id,
      p_name: input.name,
      p_description: input.description,
      p_price_idr: input.priceIdr,
      p_duration_months: input.durationMonths,
      p_active: input.active
    });
    if (error) {
      console.error('Admin plan save failed:', error.code || 'database_error');
      return jsonResponse(400, { code: 'PLAN_SAVE_FAILED' }, origin);
    }
    return jsonResponse(200, { plan: data }, origin);
  }

  const { error } = await admin.rpc('admin_deactivate_plan', {
    p_actor: userResult.user.id,
    p_id: input.id
  });
  if (error) {
    const status = error.message.includes('PLAN_NOT_FOUND') ? 404 : 400;
    return jsonResponse(status, { code: status === 404 ? 'PLAN_NOT_FOUND' : 'PLAN_DEACTIVATION_FAILED' }, origin);
  }
  return jsonResponse(200, { deactivated: true, id: input.id }, origin);
}

Deno.serve(async (request: Request): Promise<Response> => {
  try {
    return await handleRequest(request);
  } catch (error) {
    console.error('admin-plans request failed:', error instanceof Error ? error.name : 'unknown');
    const appOrigin = Deno.env.get('APP_ORIGIN');
    const origin = request.headers.get('origin');
    return jsonResponse(503, { code: 'SERVICE_UNAVAILABLE' }, origin === appOrigin ? origin : null);
  }
});
