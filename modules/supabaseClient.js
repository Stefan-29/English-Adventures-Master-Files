import { SUPABASE_ANON_KEY, SUPABASE_URL } from '../supabase-config.js';

let clientPromise;

export function getSupabaseClient() {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
        throw new Error('SUPABASE_NOT_CONFIGURED');
    }

    if (!clientPromise) {
        clientPromise = import('https://esm.sh/@supabase/supabase-js@2')
            .then(({ createClient }) => createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
                auth: {
                    flowType: 'pkce',
                    persistSession: true,
                    autoRefreshToken: true,
                    detectSessionInUrl: true
                }
            }))
            .catch(error => {
                clientPromise = undefined;
                throw error;
            });
    }

    return clientPromise;
}
