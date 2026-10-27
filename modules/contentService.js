import { getSupabaseClient } from './supabaseClient.js';

export class ContentAccessError extends Error {
    constructor(status, code) {
        super(code || 'CONTENT_REQUEST_FAILED');
        this.name = 'ContentAccessError';
        this.status = status;
        this.code = code || 'CONTENT_REQUEST_FAILED';
    }
}

export const ContentService = {
    async listTopics() {
        const client = await getSupabaseClient();
        const { data, error } = await client
            .from('topics')
            .select('id,title,description,tense_group,is_free')
            .order('tense_group')
            .order('title');
        if (error) throw new Error('TOPIC_INDEX_UNAVAILABLE');
        return data;
    },

    async getLesson(topicId) {
        if (typeof topicId !== 'string' || !/^[a-z0-9]+(?:[-_][a-z0-9]+)*$/.test(topicId)) {
            throw new ContentAccessError(400, 'INVALID_TOPIC');
        }

        const client = await getSupabaseClient();
        const { data, error } = await client.functions.invoke('get-lesson', {
            body: { topicId }
        });

        if (error) {
            let status = Number(error.context?.status) || 500;
            let code = status === 401 ? 'AUTH_REQUIRED' : 'CONTENT_REQUEST_FAILED';
            try {
                const response = error.context;
                if (response && typeof response.json === 'function') {
                    const body = await response.json();
                    if (typeof body?.code === 'string') code = body.code;
                    if (Number.isInteger(body?.status)) status = body.status;
                }
            } catch {
                // Preserve the HTTP status when the platform response is not JSON.
            }
            throw new ContentAccessError(status, code);
        }

        if (!data || typeof data !== 'object' || !data.config || !data.data) {
            throw new ContentAccessError(502, 'INVALID_CONTENT_RESPONSE');
        }
        return data;
    }
};
