import { getSupabaseClient } from './supabaseClient.js';

export class PaymentService {
    static async createOrder(planId) {
        if (typeof planId !== 'string' || !planId.trim()) {
            throw new Error('INVALID_PLAN_ID');
        }

        const client = await getSupabaseClient();
        const { data, error } = await client.functions.invoke('create-order', {
            body: { planId: planId.trim() }
        });

        if (error) {
            const status = Number(error?.context?.status) || 500;
            const code = error?.message || 'PAYMENT_ORDER_FAILED';
            const accessError = new Error(code);
            accessError.status = status;
            throw accessError;
        }

        if (!data || typeof data !== 'object' || !data.token || !data.redirectUrl) {
            throw new Error('INVALID_PAYMENT_RESPONSE');
        }

        return data;
    }
}

// Secure default: the browser receives only a server-created payment token and redirect URL;
// pricing and payment verification stay on the trusted server side.
