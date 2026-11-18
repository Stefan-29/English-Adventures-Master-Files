import { getSupabaseClient } from './supabaseClient.js';

async function invokeTrial(action, details = {}) {
    const client = await getSupabaseClient();
    const { data, error } = await client.functions.invoke('start-trial', {
        body: { action, ...details }
    });
    if (error) {
        let status = Number(error.context?.status) || 500;
        let code = error.message || 'TRIAL_REQUEST_FAILED';
        try {
            if (typeof error.context?.json === 'function') {
                const body = await error.context.json();
                if (typeof body?.code === 'string') code = body.code;
                if (Number.isInteger(body?.status)) status = body.status;
            }
        } catch {
            // Keep the platform response when its body is not JSON.
        }
        const trialError = new Error(code);
        trialError.status = status;
        trialError.code = code;
        throw trialError;
    }
    if (!data || typeof data !== 'object') throw new Error('INVALID_TRIAL_RESPONSE');
    return data;
}

export const TrialService = {
    async getEligibility() {
        const data = await invokeTrial('eligibility');
        if (data.eligible !== true || !Array.isArray(data.plans)) {
            return { eligible: false, plans: [] };
        }
        const plans = data.plans.filter(plan =>
            typeof plan?.id === 'string'
            && typeof plan?.name === 'string'
            && Number.isInteger(plan?.trialDays)
            && plan.trialDays >= 1
            && plan.trialDays <= 30
        );
        return { eligible: plans.length > 0, plans };
    },

    async startTrial(planId) {
        if (typeof planId !== 'string' || !/^[a-z0-9]+(?:[-_][a-z0-9]+)*$/.test(planId)) {
            throw new Error('INVALID_TRIAL_PLAN');
        }
        const data = await invokeTrial('start', { planId });
        if (
            typeof data.enrollmentId !== 'string'
            || typeof data.expiresAt !== 'string'
            || !Number.isInteger(data.trialDays)
            || data.trialDays < 1
            || data.trialDays > 30
        ) {
            throw new Error('INVALID_TRIAL_RESPONSE');
        }
        return data;
    }
};
