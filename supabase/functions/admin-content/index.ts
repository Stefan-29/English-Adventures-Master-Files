import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

const topicIdSchema = z.string().regex(/^[a-z0-9]+(?:[-_][a-z0-9]+)*$/).max(120);
const activityTypeSchema = z.enum(['lesson', 'writing', 'game', 'quiz', 'spelling']);
const activityCollections = {
  lesson: 'lessonActivities',
  writing: 'writingActivities',
  game: 'gameActivities',
  quiz: 'quizActivities',
  spelling: 'spellingActivities'
} as const;

const activitySchema = z.record(z.unknown()).superRefine((item, context) => {
  if (typeof item.id !== 'string' || !/^[a-z0-9]+(?:[-_][a-z0-9]+)*$/.test(item.id) || item.id.length > 120) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ['id'], message: 'INVALID_ACTIVITY_ID' });
  }
});

const requestSchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('list'),
    topicId: topicIdSchema,
    type: activityTypeSchema
  }).strict(),
  z.object({
    action: z.literal('upsert'),
    topicId: topicIdSchema,
    type: activityTypeSchema,
    activity: activitySchema
  }).strict(),
  z.object({
    action: z.literal('delete'),
    topicId: topicIdSchema,
    type: activityTypeSchema,
    activityId: topicIdSchema
  }).strict()
]);

const maxBodyBytes = 128 * 1024;
const maxContentBytes = 8 * 1024 * 1024;

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
  if (Number.isFinite(declaredLength) && declaredLength > maxBodyBytes) {
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
    if (total > maxBodyBytes) {
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

function isContentDocument(value: unknown): value is { config: Record<string, unknown>; data: Record<string, unknown> } {
  if (typeof value !== 'object' || value === null || !('config' in value) || !('data' in value)) return false;
  const content = value as { config?: unknown; data?: unknown };
  if (
    typeof content.config !== 'object' || content.config === null || Array.isArray(content.config)
    || typeof content.data !== 'object' || content.data === null || Array.isArray(content.data)
  ) return false;

  const config = content.config as Record<string, unknown>;
  const siteSettings = config.siteSettings;
  const lesson = config.lesson;
  const data = content.data as Record<string, unknown>;
  return typeof siteSettings === 'object'
    && siteSettings !== null
    && typeof (siteSettings as Record<string, unknown>).title === 'string'
    && typeof lesson === 'object'
    && lesson !== null
    && Object.values(activityCollections).every(key =>
      Array.isArray(data[key]) && (data[key] as unknown[]).every(isActivity)
    );
}

function isActivity(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object'
    && value !== null
    && !Array.isArray(value)
    && 'id' in value
    && typeof value.id === 'string'
    && /^[a-z0-9]+(?:[-_][a-z0-9]+)*$/.test(value.id);
}

async function getPrivateContent(admin: ReturnType<typeof createClient>, topicId: string): Promise<Record<string, unknown>> {
  const { data: bucket, error: bucketError } = await admin.storage.getBucket('lesson-content');
  if (bucketError || !bucket || bucket.public !== false) {
    throw new Error('PRIVATE_BUCKET_UNAVAILABLE');
  }

  const { data: file, error } = await admin.storage.from('lesson-content').download(`${topicId}.json`);
  if (error || !file) throw new Error('TOPIC_CONTENT_NOT_FOUND');
  if (file.size > maxContentBytes) throw new Error('TOPIC_CONTENT_TOO_LARGE');

  const parsed: unknown = JSON.parse(await file.text());
  if (!isContentDocument(parsed)) throw new Error('INVALID_TOPIC_CONTENT');
  return parsed;
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
    const oversized = error instanceof Error && error.message === 'REQUEST_BODY_TOO_LARGE';
    return jsonResponse(oversized ? 413 : 400, { code: oversized ? 'REQUEST_TOO_LARGE' : 'INVALID_REQUEST' }, origin);
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
  const { data: isOwner, error: ownerError } = await authClient.rpc('is_owner');
  if (ownerError || isOwner !== true) return jsonResponse(404, { code: 'NOT_FOUND' }, origin);

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
  const { data: topic, error: topicError } = await admin
    .from('topics')
    .select('id')
    .eq('id', input.topicId)
    .maybeSingle();
  if (topicError) return jsonResponse(500, { code: 'TOPIC_LOOKUP_FAILED' }, origin);
  if (!topic) return jsonResponse(404, { code: 'TOPIC_NOT_FOUND' }, origin);

  let content: Record<string, unknown>;
  try {
    content = await getPrivateContent(admin, input.topicId);
  } catch (error) {
    const code = error instanceof Error ? error.message : 'CONTENT_UNAVAILABLE';
    console.error('Admin content read failed:', code);
    return jsonResponse(code === 'TOPIC_CONTENT_NOT_FOUND' ? 404 : 503, {
      code: code === 'TOPIC_CONTENT_NOT_FOUND' ? code : 'CONTENT_UNAVAILABLE'
    }, origin);
  }

  const data = content.data as Record<string, unknown>;
  const collectionName = activityCollections[input.type];
  const activities = data[collectionName] as Record<string, unknown>[];
  const previousContent = JSON.stringify(content, null, 2);

  if (input.action === 'list') {
    return jsonResponse(200, {
      topicId: input.topicId,
      type: input.type,
      activities
    }, origin);
  }

  if (input.action === 'upsert') {
    const activityId = input.activity.id as string;
    const duplicateInAnotherCollection = Object.entries(activityCollections).some(([type, key]) =>
      type !== input.type
      && (data[key] as Record<string, unknown>[]).some(activity => activity.id === activityId)
    );
    if (duplicateInAnotherCollection) {
      return jsonResponse(409, { code: 'ACTIVITY_ID_ALREADY_USED' }, origin);
    }
    const existingIndex = activities.findIndex(activity => activity.id === activityId);
    if (existingIndex < 0) activities.push(input.activity);
    else activities[existingIndex] = input.activity;
  } else {
    const existingIndex = activities.findIndex(activity => activity.id === input.activityId);
    if (existingIndex < 0) return jsonResponse(404, { code: 'ACTIVITY_NOT_FOUND' }, origin);
    activities.splice(existingIndex, 1);
  }

  const encoded = new TextEncoder().encode(JSON.stringify(content, null, 2));
  if (encoded.byteLength > maxContentBytes) {
    return jsonResponse(413, { code: 'TOPIC_CONTENT_TOO_LARGE' }, origin);
  }

  const { error: uploadError } = await admin.storage
    .from('lesson-content')
    .upload(`${input.topicId}.json`, new Blob([encoded], { type: 'application/json' }), {
      upsert: true,
      contentType: 'application/json',
      cacheControl: '0'
    });
  if (uploadError) {
    console.error('Admin content write failed:', uploadError.statusCode || 'storage_error');
    return jsonResponse(500, { code: 'CONTENT_SAVE_FAILED' }, origin);
  }

  const action = input.action === 'upsert' ? 'activity.upsert' : 'activity.delete';
  const activityId = input.action === 'upsert' ? input.activity.id as string : input.activityId;
  const { error: auditError } = await admin.from('audit_log').insert({
    actor: userResult.user.id,
    action,
    target: `${input.topicId}/${input.type}/${activityId}`,
    metadata: { topic_id: input.topicId, activity_type: input.type, activity_id: activityId }
  });
  if (auditError) {
    console.error('Admin content audit write failed:', auditError.code || 'database_error');
    const { error: restoreError } = await admin.storage
      .from('lesson-content')
      .upload(`${input.topicId}.json`, new Blob([previousContent], { type: 'application/json' }), {
        upsert: true,
        contentType: 'application/json',
        cacheControl: '0'
      });
    if (restoreError) {
      console.error('Admin content restore failed:', restoreError.statusCode || 'storage_error');
      return jsonResponse(500, { code: 'CONTENT_AUDIT_AND_RESTORE_FAILED' }, origin);
    }
    return jsonResponse(500, { code: 'CONTENT_AUDIT_FAILED' }, origin);
  }

  return jsonResponse(200, {
    saved: true,
    topicId: input.topicId,
    type: input.type,
    activityId
  }, origin);
}

Deno.serve(async (request: Request): Promise<Response> => {
  try {
    return await handleRequest(request);
  } catch (error) {
    console.error('admin-content request failed:', error instanceof Error ? error.name : 'unknown');
    const appOrigin = Deno.env.get('APP_ORIGIN');
    const origin = request.headers.get('origin');
    return jsonResponse(503, { code: 'SERVICE_UNAVAILABLE' }, origin === appOrigin ? origin : null);
  }
});
