import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

const requestSchema = z.object({
  planId: z.string().regex(/^[a-z0-9]+(?:[-_][a-z0-9]+)*$/).max(64)
}).strict();

const rateLimitScript = `
local count = redis.call("INCR", KEYS[1])
if count == 1 then
  redis.call("EXPIRE", KEYS[1], ARGV[1])
end
return count
`;

const rateLimitPerMinute = 20;
const rateLimitWindowSeconds = 60;
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

async function checkRateLimit(userId: string): Promise<boolean> {
  const redisUrl = Deno.env.get('UPSTASH_REDIS_REST_URL');
  const redisToken = Deno.env.get('UPSTASH_REDIS_REST_TOKEN');
  if (!redisUrl || !redisToken) {
    throw new Error('RATE_LIMIT_NOT_CONFIGURED');
  }

  const endpoint = new URL(redisUrl);
  endpoint.pathname = `${endpoint.pathname.replace(/\/$/, '')}/`;
  const response = await fetch(endpoint, {
    method: 'POST',
    redirect: 'error',
    headers: {
      Authorization: `Bearer ${redisToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify([
      'EVAL',
      rateLimitScript,
      '1',
      `create-order:${userId}`,
      String(rateLimitWindowSeconds)
    ]),
    signal: AbortSignal.timeout(2500)
  });

  if (!response.ok) throw new Error('RATE_LIMIT_UNAVAILABLE');
  const payload: unknown = await response.json();
  if (
    typeof payload !== 'object'
    || payload === null
    || !('result' in payload)
    || typeof (payload as { result?: unknown }).result !== 'number'
  ) {
    throw new Error('RATE_LIMIT_INVALID_RESPONSE');
  }
  return (payload as { result: number }).result <= rateLimitPerMinute;
}

async function handleRequest(request: Request): Promise<Response> {
  const configuredOrigin = Deno.env.get('APP_ORIGIN');
  const origin = request.headers.get('origin');
  if (!configuredOrigin) {
    return jsonResponse(503, { code: 'SERVICE_UNAVAILABLE' }, null);
  }
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

  if (request.method !== 'POST') {
    return jsonResponse(405, { code: 'METHOD_NOT_ALLOWED' }, origin);
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !serviceRoleKey) {
    return jsonResponse(503, { code: 'SERVICE_UNAVAILABLE' }, origin);
  }

  const authHeader = request.headers.get('authorization');
  const token = authHeader?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) return jsonResponse(401, { code: 'AUTH_REQUIRED' }, origin);

  let input: z.infer<typeof requestSchema>;
  try {
    input = requestSchema.parse(await readRequestBody(request));
  } catch (error) {
    if (error instanceof Error && error.message === 'REQUEST_BODY_TOO_LARGE') {
      return jsonResponse(413, { code: 'REQUEST_TOO_LARGE' }, origin);
    }
    return jsonResponse(400, { code: 'INVALID_REQUEST' }, origin);
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  const { data: userResult, error: userError } = await admin.auth.getUser(token);
  if (userError || !userResult.user) {
    return jsonResponse(401, { code: 'VERIFIED_ACCOUNT_REQUIRED' }, origin);
  }

  const user = userResult.user;
  if (!user.email_confirmed_at) {
    return jsonResponse(401, { code: 'VERIFIED_ACCOUNT_REQUIRED' }, origin);
  }

  try {
    if (!(await checkRateLimit(user.id))) {
      return jsonResponse(429, { code: 'RATE_LIMITED' }, origin);
    }
  } catch (error) {
    console.error('create-order rate limit failed:', error instanceof Error ? error.message : 'unknown');
    return jsonResponse(503, { code: 'SERVICE_UNAVAILABLE' }, origin);
  }

  const { data: profile, error: profileError } = await admin
    .from('profiles')
    .select('id,status')
    .eq('id', user.id)
    .maybeSingle();

  if (profileError || !profile || profile.status !== 'active') {
    return jsonResponse(403, { code: 'ACCOUNT_NOT_ACTIVE' }, origin);
  }

  const { data: plan, error: planError } = await admin
    .from('plans')
    .select('id,name,price_idr,duration_months,active')
    .eq('id', input.planId)
    .eq('active', true)
    .maybeSingle();

  if (planError || !plan) {
    return jsonResponse(404, { code: 'PLAN_NOT_FOUND' }, origin);
  }

  const midtransClientKey = Deno.env.get('MIDTRANS_CLIENT_KEY');
  const midtransServerKey = Deno.env.get('MIDTRANS_SERVER_KEY');
  if (!midtransClientKey || !midtransServerKey) {
    return jsonResponse(503, { code: 'MIDTRANS_NOT_CONFIGURED' }, origin);
  }

  const midtransOrderId = `EA-${crypto.randomUUID()}`;
  const orderId = crypto.randomUUID();
  const grossAmount = Number(plan.price_idr);
  if (!Number.isSafeInteger(grossAmount) || grossAmount <= 0) {
    console.error('create-order rejected an invalid plan price');
    return jsonResponse(503, { code: 'PLAN_PRICE_INVALID' }, origin);
  }

  const { error: orderInsertError } = await admin.from('orders').insert({
    id: orderId,
    user_id: user.id,
    plan_id: plan.id,
    midtrans_order_id: midtransOrderId,
    gross_amount_idr: grossAmount,
    status: 'pending'
  });

  if (orderInsertError) {
    console.error('create-order insert failed:', orderInsertError.message);
    return jsonResponse(500, { code: 'ORDER_CREATION_FAILED' }, origin);
  }

  const isProduction = Deno.env.get('MIDTRANS_IS_PRODUCTION') === 'true';
  const snapEndpoint = isProduction
    ? 'https://app.midtrans.com/snap/v1/transactions'
    : 'https://app.sandbox.midtrans.com/snap/v1/transactions';
  const paymentReturnUrl = new URL('/payment-return.html', configuredOrigin);
  paymentReturnUrl.searchParams.set('order_id', midtransOrderId);

  let tokenResponse: Response;
  try {
    tokenResponse = await fetch(snapEndpoint, {
      method: 'POST',
      redirect: 'error',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Basic ${btoa(`${midtransServerKey}:`)}`
      },
      body: JSON.stringify({
        transaction_details: {
          order_id: midtransOrderId,
          gross_amount: grossAmount
        },
        item_details: [{
          id: plan.id,
          name: plan.name,
          price: grossAmount,
          quantity: 1
        }],
        customer_details: {
          first_name: user.email?.split('@')[0] || 'Learner',
          email: user.email || `${user.id}@placeholder.local`
        },
        callbacks: { finish: paymentReturnUrl.toString() },
        enabled_payments: ['gopay', 'shopeepay', 'bank_transfer', 'qris'],
        expiry: { unit: 'minutes', duration: 30 }
      }),
      signal: AbortSignal.timeout(15000)
    });
  } catch (error) {
    console.error('Midtrans request failed:', error instanceof Error ? error.name : 'unknown');
    await admin.from('orders').update({ status: 'failed' }).eq('id', orderId);
    return jsonResponse(502, { code: 'PAYMENT_PROVIDER_UNAVAILABLE' }, origin);
  }

  if (!tokenResponse.ok) {
    console.error('Midtrans rejected order creation:', tokenResponse.status);
    await admin.from('orders').update({ status: 'failed' }).eq('id', orderId);
    return jsonResponse(502, { code: 'PAYMENT_PROVIDER_ERROR' }, origin);
  }

  let snapBody: { token?: string; redirect_url?: string };
  try {
    snapBody = await tokenResponse.json() as { token?: string; redirect_url?: string };
  } catch {
    await admin.from('orders').update({ status: 'failed' }).eq('id', orderId);
    return jsonResponse(502, { code: 'PAYMENT_PROVIDER_ERROR' }, origin);
  }
  if (!snapBody.token || !snapBody.redirect_url) {
    await admin.from('orders').update({ status: 'failed' }).eq('id', orderId);
    return jsonResponse(502, { code: 'PAYMENT_PROVIDER_ERROR' }, origin);
  }

  return jsonResponse(200, {
    orderId: midtransOrderId,
    gatewayOrderId: orderId,
    grossAmountIdr: grossAmount,
    token: snapBody.token,
    redirectUrl: snapBody.redirect_url,
    clientKey: midtransClientKey
  }, origin);
}

Deno.serve(async (request: Request): Promise<Response> => {
  try {
    return await handleRequest(request);
  } catch (error) {
    console.error('create-order request failed:', error instanceof Error ? error.message : 'unknown');
    const configuredOrigin = Deno.env.get('APP_ORIGIN');
    const requestOrigin = request.headers.get('origin');
    const allowedOrigin = requestOrigin === configuredOrigin ? requestOrigin : null;
    return jsonResponse(503, { code: 'SERVICE_UNAVAILABLE' }, allowedOrigin);
  }
});
