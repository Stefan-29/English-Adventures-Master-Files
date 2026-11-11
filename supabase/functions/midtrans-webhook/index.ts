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

const statusMap: Record<string, 'pending' | 'paid' | 'failed' | 'cancelled' | 'refunded'> = {
  settlement: 'paid',
  pending: 'pending',
  deny: 'failed',
  cancel: 'cancelled',
  expire: 'cancelled',
  failure: 'failed',
  refund: 'refunded'
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

  const { order_id, status_code, gross_amount, signature_key, transaction_status, fraud_status } = payload;
  const expectedSignature = await sha512Hex(`${order_id}${status_code}${gross_amount}${serverKey}`);
  if (!secureCompare(expectedSignature, signature_key)) {
    return jsonResponse(400, { code: 'INVALID_SIGNATURE' });
  }

  if (!/^\d+(?:\.00)?$/.test(gross_amount)) {
    return jsonResponse(400, { code: 'INVALID_AMOUNT' });
  }
  const grossAmountIdr = Number(gross_amount);
  if (!Number.isSafeInteger(grossAmountIdr) || grossAmountIdr <= 0) {
    return jsonResponse(400, { code: 'INVALID_AMOUNT' });
  }

  const normalizedTransactionStatus = transaction_status?.toLowerCase() || 'pending';
  if (normalizedTransactionStatus === 'partial_refund') {
    return jsonResponse(200, { received: true, status: 'partial_refund_noted' });
  }
  const paymentStatus = normalizedTransactionStatus === 'capture'
    ? (fraud_status?.toLowerCase() === 'accept' ? 'paid' : 'pending')
    : statusMap[normalizedTransactionStatus];
  if (!paymentStatus) {
    return jsonResponse(400, { code: 'UNSUPPORTED_TRANSACTION_STATUS' });
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  const { data: savedStatus, error: persistError } = await admin.rpc('process_midtrans_notification', {
    p_midtrans_order_id: order_id,
    p_gross_amount_idr: grossAmountIdr,
    p_status: paymentStatus
  });

  if (persistError) {
    if (persistError.message.includes('ORDER_NOT_FOUND')) {
      return jsonResponse(404, { code: 'ORDER_NOT_FOUND' });
    }
    if (persistError.message.includes('AMOUNT_MISMATCH')) {
      return jsonResponse(400, { code: 'AMOUNT_MISMATCH' });
    }
    if (persistError.message.includes('REFUND_BEFORE_SETTLEMENT')) {
      return jsonResponse(409, { code: 'REFUND_BEFORE_SETTLEMENT' });
    }
    console.error('Webhook transaction failed:', persistError.code || 'database_error');
    return jsonResponse(500, { code: 'PAYMENT_PROCESSING_FAILED' });
  }

  return jsonResponse(200, {
    received: true,
    status: savedStatus,
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
