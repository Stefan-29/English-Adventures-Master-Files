import { getSupabaseClient } from './supabaseClient.js';

function isPlainObject(value) {
    return !!value && typeof value === 'object' && !Array.isArray(value);
}

function readLocalProgressState() {
    try {
        const raw = localStorage.getItem('englishAdventuresState');
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        return isPlainObject(parsed) ? parsed : null;
    } catch (error) {
        console.warn('Unable to read local progress for sync:', error?.message || error);
        return null;
    }
}

function mergeProgressValues(existingValue, incomingValue) {
    if (Array.isArray(existingValue) && Array.isArray(incomingValue)) {
        return [...new Set([...existingValue, ...incomingValue])];
    }

    if (isPlainObject(existingValue) && isPlainObject(incomingValue)) {
        const merged = { ...existingValue };
        for (const [key, value] of Object.entries(incomingValue)) {
            if (!Object.prototype.hasOwnProperty.call(merged, key)) {
                merged[key] = value;
                continue;
            }
            merged[key] = mergeProgressValues(merged[key], value);
        }
        return merged;
    }

    return incomingValue ?? existingValue;
}

export async function syncLocalProgressToSupabase() {
    try {
        const client = await getSupabaseClient();
        const { data: { session }, error: sessionError } = await client.auth.getSession();

        if (sessionError) {
            throw new Error(sessionError.message || 'SESSION_CHECK_FAILED');
        }

        if (!session?.user) {
            return { skipped: true, reason: 'guest_user' };
        }

        const localState = readLocalProgressState();
        if (!localState || !isPlainObject(localState.completedActivities) || Object.keys(localState.completedActivities).length === 0) {
            return { skipped: true, reason: 'no_local_progress' };
        }

        const moduleProgressRows = Object.entries(localState.completedActivities)
            .filter(([moduleId, value]) => typeof moduleId === 'string' && isPlainObject(value))
            .map(([moduleId, completedActivities]) => {
                const stars = Number(localState.moduleStars?.[moduleId] ?? 0);
                const state = {
                    completedActivities,
                    moduleStars: { [moduleId]: stars },
                    overallProgress: Number(localState.overallProgress || 0),
                    rewards: isPlainObject(localState.rewards) ? localState.rewards : { stars: 0, points: 0, badges: [] },
                    syncedFromLocalStorage: true,
                    lastLocalSyncAt: new Date().toISOString()
                };

                return {
                    user_id: session.user.id,
                    topic_id: moduleId,
                    stars,
                    state
                };
            });

        if (moduleProgressRows.length === 0) {
            return { skipped: true, reason: 'no_module_entries' };
        }

        const { data: existingRows, error: selectError } = await client
            .from('progress')
            .select('topic_id, state, stars')
            .in('topic_id', moduleProgressRows.map(row => row.topic_id));

        if (selectError) {
            throw new Error(selectError.message || 'PROGRESS_SELECT_FAILED');
        }

        const existingByTopic = new Map((existingRows || []).map(row => [row.topic_id, row]));
        const upserts = moduleProgressRows.map(row => {
            const existingRow = existingByTopic.get(row.topic_id) || {};
            const mergedState = mergeProgressValues(existingRow.state || {}, row.state);
            const mergedStars = Math.max(Number(existingRow.stars || 0), Number(row.stars || 0));

            return {
                user_id: session.user.id,
                topic_id: row.topic_id,
                stars: mergedStars,
                state: mergedState
            };
        });

        const { error: upsertError } = await client
            .from('progress')
            .upsert(upserts, { onConflict: 'user_id,topic_id' });

        if (upsertError) {
            throw new Error(upsertError.message || 'PROGRESS_UPSERT_FAILED');
        }

        return { synced: upserts.length };
    } catch (error) {
        console.warn('Progress sync failed:', error?.message || error);
        return { synced: 0, error: error?.message || 'UNKNOWN_PROGRESS_SYNC_ERROR' };
    }
}

// Default secure behavior: only merge local progress after a verified authenticated session exists,
// and never replace an existing server row with stale or empty local progress.
export async function syncLocalProgressWhenAuthenticated() {
    return syncLocalProgressToSupabase();
}
