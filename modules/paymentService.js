import { getSupabaseClient } from './supabaseClient.js';

export class PaymentService {
    static async getPurchaseOptions() {
        const client = await getSupabaseClient();
        const [{ data: plans, error: plansError }, { data: { session }, error: sessionError }] = await Promise.all([
            client
                .from('plans')
                .select('id,name,description,price_idr,duration_months')
                .eq('active', true)
                .order('price_idr'),
            client.auth.getSession()
        ]);

        if (plansError) throw new Error('PURCHASE_PLANS_UNAVAILABLE');
        if (sessionError) throw new Error('ACCOUNT_SESSION_UNAVAILABLE');

        return {
            plans: (plans || []).filter(plan =>
                typeof plan.id === 'string'
                && typeof plan.name === 'string'
                && Number.isSafeInteger(Number(plan.price_idr))
                && Number(plan.price_idr) > 0
            ),
            canPurchase: Boolean(session?.user?.email_confirmed_at)
        };
    }

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

        if (!data || typeof data !== 'object' || typeof data.token !== 'string' || typeof data.redirectUrl !== 'string') {
            throw new Error('INVALID_PAYMENT_RESPONSE');
        }

        let redirectUrl;
        try {
            redirectUrl = new URL(data.redirectUrl);
        } catch {
            throw new Error('INVALID_PAYMENT_REDIRECT');
        }
        if (
            redirectUrl.protocol !== 'https:'
            || !['app.midtrans.com', 'app.sandbox.midtrans.com'].includes(redirectUrl.hostname)
        ) {
            throw new Error('INVALID_PAYMENT_REDIRECT');
        }

        return data;
    }
}

// Secure default: the browser receives only a server-created payment token and redirect URL;
// pricing and payment verification stay on the trusted server side.
