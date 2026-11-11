import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

const webhookSchema = z.object({
  order_id: z.string().min(1).max(255),
  status_code: z.string().min(1).max(32),
  gross_amount: z.string().min(1).max(32),
  signature_key: z.string().min(1).max(255),
  transaction_status: z.string().min(1).max(32).optional(),
  payment_type: z.string().max(64).optional(),
  fraud_status: z.string().max(32).optional()
}).passthrough();

const statusMap: Record<string, 'pending' | 'paid' | 'failed' | 'cancelled'> = {
  capture: 'paid',
  settlement: 'paid',
  pending: 'pending',
  deny: 'failed',
  cancel: 'cancelled',
  expire: 'cancelled',
  failure: 'failed'
};

function jsonResponse(status: number, body: Record<string, unknown>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'private, no-store, max-age=0',
      'Pragma': 'no-cache'
    }
  });
}

async function sha512Hex(input: string): Promise<string> {
  const bytes = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest('SHA-512', bytes);
  return Array.from(new Uint8Array(digest)).map(byte => byte.toString(16).padStart(2, '0')).join('');
}

function secureCompare(a: string, b: string): boolean {
  const normalizedA = a ?? '';
  const normalizedB = b ?? '';
  if (normalizedA.length !== normalizedB.length) return false;
  let mismatch = 0;
  for (let index = 0; index < normalizedA.length; index += 1) {
    mismatch |= normalizedA.charCodeAt(index) ^ normalizedB.charCodeAt(index);
  }
  return mismatch === 0;
}

async function readRequestBody(request: Request): Promise<unknown> {
  const reader = request.body?.getReader();
  if (!reader) throw new Error('REQUEST_BODY_MISSING');
  const chunks: Uint8Array[] = [];
  let size = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) {
      size += value.byteLength;
      if (size > 4096) {
        await reader.cancel();
        throw new Error('REQUEST_BODY_TOO_LARGE');
      }
      chunks.push(value);
    }
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
  if (request.method !== 'POST') {
    return jsonResponse(405, { code: 'METHOD_NOT_ALLOWED' });
  }

  const serverKey = Deno.env.get('MIDTRANS_SERVER_KEY');
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!serverKey || !supabaseUrl || !serviceRoleKey) {
    return jsonResponse(503, { code: 'SERVICE_UNAVAILABLE' });
  }

  let payload: z.infer<typeof webhookSchema>;
  try {
    payload = webhookSchema.parse(await readRequestBody(request));
  } catch {
    return jsonResponse(400, { code: 'INVALID_WEBHOOK' });
  }

  const { order_id, status_code, gross_amount, signature_key, transaction_status } = payload;
  const expectedSignature = await sha512Hex(`${order_id}${status_code}${gross_amount}${serverKey}`);
  if (!secureCompare(expectedSignature, signature_key)) {
    return jsonResponse(400, { code: 'INVALID_SIGNATURE' });
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  const { data: order, error: orderError } = await admin
    .from('orders')
    .select('id,user_id,plan_id,gross_amount_idr,status,midtrans_order_id')
    .eq('midtrans_order_id', order_id)
    .maybeSingle();

  if (orderError) {
    console.error('Webhook order lookup failed:', orderError.message);
    return jsonResponse(500, { code: 'ORDER_LOOKUP_FAILED' });
  }

  if (!order) {
    return jsonResponse(404, { code: 'ORDER_NOT_FOUND' });
  }

  if (Number(order.gross_amount_idr) !== Number(gross_amount)) {
    return jsonResponse(400, { code: 'AMOUNT_MISMATCH' });
  }

  const normalizedStatus = statusMap[(transaction_status || '').toLowerCase() || 'pending'] || 'pending';
  const isAlreadySettled = order.status === 'paid';
  if (isAlreadySettled) {
    return jsonResponse(200, { received: true, status: 'paid', orderId: order.id });
  }

  const paymentStatus = normalizedStatus === 'paid' ? 'paid' : normalizedStatus === 'pending' ? 'pending' : normalizedStatus === 'failed' ? 'failed' : 'cancelled';
  const { error: paymentError } = await admin.from('payments').upsert({
    order_id: order.id,
    midtrans_order_id: order_id,
    gross_amount_idr: Number(order.gross_amount_idr),
    status: paymentStatus,
    raw_signature_ok: true,
    paid_at: paymentStatus === 'paid' ? new Date().toISOString() : null
  }, { onConflict: 'midtrans_order_id' });

  if (paymentError) {
    console.error('Webhook persisted payment failed:', paymentError.message);
    return jsonResponse(500, { code: 'PAYMENT_RECORD_FAILED' });
  }

  const { error: orderUpdateError } = await admin
    .from('orders')
    .update({ status: paymentStatus === 'paid' ? 'paid' : paymentStatus === 'pending' ? 'pending' : 'failed' })
    .eq('id', order.id);

  if (orderUpdateError) {
    console.error('Webhook order update failed:', orderUpdateError.message);
    return jsonResponse(500, { code: 'ORDER_UPDATE_FAILED' });
  }

  if (paymentStatus === 'paid') {
    const { data: plan, error: planError } = await admin
      .from('plans')
      .select('duration_months')
      .eq('id', order.plan_id)
      .maybeSingle();

    if (planError || !plan) {
      return jsonResponse(500, { code: 'PLAN_LOOKUP_FAILED' });
    }

    const expiresAt = Number(plan.duration_months) > 0
      ? new Date(Date.now() + (Number(plan.duration_months) * 30 * 24 * 60 * 60 * 1000)).toISOString()
      : null;

    const { error: enrollmentError } = await admin.rpc('upsert_payment_enrollment', {
      p_user_id: order.user_id,
      p_plan_id: order.plan_id,
      p_order_id: order.id,
      p_note: `Midtrans payment for order ${order_id}`,
      p_expires_at: expiresAt
    });

    if (enrollmentError) {
      console.error('Webhook enrollment update failed:', enrollmentError.message);
      return jsonResponse(500, { code: 'ENROLLMENT_UPDATE_FAILED' });
    }
  }

  return jsonResponse(200, {
    received: true,
    status: paymentStatus,
    orderId: order.id,
    midtransOrderId: order_id
  });
}

Deno.serve(async (request: Request): Promise<Response> => {
  try {
    return await handleRequest(request);
  } catch (error) {
    console.error('midtrans-webhook failed:', error instanceof Error ? error.message : 'unknown');
    return jsonResponse(503, { code: 'SERVICE_UNAVAILABLE' });
  }
});
