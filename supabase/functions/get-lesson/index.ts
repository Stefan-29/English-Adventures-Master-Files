import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

const requestSchema = z.object({
    topicId: z.string().regex(/^[a-z0-9]+(?:[-_][a-z0-9]+)*$/).max(120)
}).strict();

const rateLimitScript = `
local count = redis.call("INCR", KEYS[1])
if count == 1 then
  redis.call("EXPIRE", KEYS[1], ARGV[1])
end
return count
`;

const rateLimitPerMinute = 30;
const rateLimitWindowSeconds = 60;
const maxRequestBodyBytes = 2048;

function jsonResponse(
    status: number,
    body: Record<string, unknown>,
    origin: string | null
): Response {
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

function getVerifiedTokenAssurance(token: string): string | null {
    const payload = token.split('.')[1];
    if (!payload) return null;
    try {
        const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
        const decoded: unknown = JSON.parse(atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, '=')));
        if (
            typeof decoded !== 'object'
            || decoded === null
            || !('aal' in decoded)
            || typeof decoded.aal !== 'string'
        ) {
            return null;
        }
        return decoded.aal;
    } catch {
        return null;
    }
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

    const key = `get-lesson:${userId}`;
    const endpoint = new URL(redisUrl);
    if (endpoint.protocol !== 'https:') throw new Error('RATE_LIMIT_URL_INVALID');
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
            key,
            String(rateLimitWindowSeconds)
        ]),
        signal: AbortSignal.timeout(2500)
    });
    if (!response.ok) throw new Error('RATE_LIMIT_UNAVAILABLE');
    const result: unknown = await response.json();
    if (
        typeof result !== 'object'
        || result === null
        || !('result' in result)
        || typeof result.result !== 'number'
    ) {
        throw new Error('RATE_LIMIT_INVALID_RESPONSE');
    }
    return result.result <= rateLimitPerMinute;
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
        }

        Deno.serve(async (request: Request): Promise<Response> => {
            try {
                return await handleRequest(request);
            } catch (error) {
                console.error('get-lesson request failed:', error instanceof Error ? error.name : 'unknown');
                const configuredOrigin = Deno.env.get('APP_ORIGIN');
                const requestOrigin = request.headers.get('origin');
                const allowedOrigin = requestOrigin === configuredOrigin ? requestOrigin : null;
                return jsonResponse(503, { code: 'SERVICE_UNAVAILABLE' }, allowedOrigin);
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
    const authorization = request.headers.get('authorization');
    const token = authorization?.match(/^Bearer\s+(.+)$/i)?.[1];
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
    const user = userResult.user;
    if (userError || !user || !user.email_confirmed_at) {
        return jsonResponse(401, { code: 'VERIFIED_ACCOUNT_REQUIRED' }, origin);
    }

    const { data: profile, error: profileError } = await admin
        .from('profiles')
        .select('role,status')
        .eq('id', user.id)
        .maybeSingle();
    if (profileError || !profile || profile.status !== 'active') {
        return jsonResponse(403, { code: 'ACCOUNT_NOT_ACTIVE' }, origin);
    }

    try {
        if (!(await checkRateLimit(user.id))) {
            return jsonResponse(429, { code: 'RATE_LIMITED' }, origin);
        }
    } catch (error) {
        console.error('get-lesson rate limiter unavailable:', error instanceof Error ? error.message : 'unknown');
        return jsonResponse(503, { code: 'SERVICE_UNAVAILABLE' }, origin);
    }

    const { data: topic, error: topicError } = await admin
        .from('topics')
        .select('id,is_free')
        .eq('id', input.topicId)
        .maybeSingle();
    if (topicError || !topic) {
        return jsonResponse(404, { code: 'TOPIC_NOT_FOUND' }, origin);
    }

    let hasFullAccess = false;
    if (profile.role === 'owner') {
        // The identical token was validated with getUser above before its signed assurance claim is read.
        if (getVerifiedTokenAssurance(token) !== 'aal2') {
            return jsonResponse(403, { code: 'OWNER_MFA_REQUIRED' }, origin);
        }
        hasFullAccess = true;
    }
    if (!hasFullAccess && !topic.is_free) {
        const now = new Date().toISOString();
        const { data: enrollment, error: enrollmentError } = await admin
            .from('enrollments')
            .select('id')
            .eq('user_id', user.id)
            .eq('status', 'active')
            .or(`expires_at.is.null,expires_at.gt.${now}`)
            .limit(1)
            .maybeSingle();
        if (enrollmentError) {
            console.error('get-lesson entitlement check failed');
            return jsonResponse(503, { code: 'SERVICE_UNAVAILABLE' }, origin);
        }
        hasFullAccess = Boolean(enrollment);
    }
    if (!topic.is_free && !hasFullAccess) {
        return jsonResponse(403, { code: 'TOPIC_LOCKED' }, origin);
    }

    const { data: bucket, error: bucketError } = await admin.storage.getBucket('lesson-content');
    if (bucketError || !bucket || bucket.public !== false) {
        console.error('get-lesson private bucket configuration is invalid');
        return jsonResponse(503, { code: 'CONTENT_UNAVAILABLE' }, origin);
    }

    const { data: storedContent, error: storageError } = await admin.storage
        .from('lesson-content')
        .download(`${input.topicId}.json`);
    if (storageError || !storedContent) {
        console.error('get-lesson private content unavailable');
        return jsonResponse(503, { code: 'CONTENT_UNAVAILABLE' }, origin);
    }

    try {
        const content: unknown = JSON.parse(await storedContent.text());
        if (
            typeof content !== 'object'
            || content === null
            || !('config' in content)
            || !('data' in content)
        ) {
            return jsonResponse(503, { code: 'CONTENT_UNAVAILABLE' }, origin);
        }
        return jsonResponse(200, content as Record<string, unknown>, origin);
    } catch {
        console.error('get-lesson private content is invalid JSON');
        return jsonResponse(503, { code: 'CONTENT_UNAVAILABLE' }, origin);
    }
});
