import { SUPABASE_ANON_KEY, SUPABASE_URL } from '../supabase-config.js';
import { getSupabaseClient } from './supabaseClient.js';

const OWNER_EMAIL = 'stefanustankaemingk2@gmail.com';
const SESSION_STORAGE_KEY = 'grammar101.mock-auth-session';
const listeners = new Set();
let mockSession = null;

function randomId() {
    if (globalThis.crypto && typeof globalThis.crypto.randomUUID === 'function') {
        return globalThis.crypto.randomUUID();
    }
    return `mock-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function normalizeEmail(email) {
    return String(email || '').trim().toLowerCase();
}

function getRoleFromEmail(email) {
    return normalizeEmail(email) === OWNER_EMAIL ? 'owner' : 'learner';
}

function ensureStoredSession() {
    const session = readStoredSession();
    if (session && session.user) return session;
    return null;
}

function readStoredSession() {
    if (globalThis.localStorage) {
        try {
            const raw = globalThis.localStorage.getItem(SESSION_STORAGE_KEY);
            return raw ? JSON.parse(raw) : null;
        } catch {
            // Fall back to the in-memory session when storage is unavailable or invalid.
        }
    }
    return mockSession;
}

function setStoredSession(session) {
    mockSession = session;
    if (!session) {
        try {
            globalThis.localStorage?.removeItem(SESSION_STORAGE_KEY);
        } catch {
            // Ignore storage failures in offline environments.
        }
        return;
    }
    try {
        globalThis.localStorage?.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
    } catch {
        // Ignore storage failures in offline environments.
    }
}

function notifyListeners() {
    const snapshot = {
        session: readStoredSession(),
        role: getRole(),
        isOwner: isOwner()
    };
    for (const listener of listeners) {
        try {
            listener(snapshot);
        } catch {
            // Ignore listener failures; they should not crash auth state updates.
        }
    }
}

function buildMockUser(email) {
    const normalized = normalizeEmail(email);
    const displayName = normalized.split('@')[0]?.replace(/[._-]+/g, ' ').trim() || 'Learner';
    return {
        id: randomId(),
        email: normalized,
        role: getRoleFromEmail(normalized),
        app_metadata: {
            provider: 'mock',
            role: getRoleFromEmail(normalized)
        },
        user_metadata: {
            display_name: displayName,
            full_name: displayName,
            preferred_language: 'id'
        },
        email_confirmed_at: new Date().toISOString(),
        created_at: new Date().toISOString()
    };
}

function buildMockSession(email) {
    const user = buildMockUser(email);
    return {
        access_token: `mock.${randomId()}`,
        refresh_token: `mock.${randomId()}`,
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        token_type: 'bearer',
        user,
        provider_token: null,
        provider_refresh_token: null
    };
}

function setSession(session) {
    setStoredSession(session);
    notifyListeners();
}

export function isOwner() {
    return getRole() === 'owner';
}

export function getRole() {
    const session = ensureStoredSession();
    if (session?.user?.role) return session.user.role;
    return 'guest';
}

export const AuthService = {
    isMockMode() {
        return !SUPABASE_URL || !SUPABASE_ANON_KEY || SUPABASE_URL.trim() === '' || SUPABASE_ANON_KEY.trim() === '';
    },

    getRole() {
        return getRole();
    },

    isOwner() {
        return isOwner();
    },

    onChange(callback) {
        if (typeof callback !== 'function') {
            return () => {};
        }
        listeners.add(callback);
        return () => {
            listeners.delete(callback);
        };
    },

    async getSession() {
        if (this.isMockMode()) {
            return { data: { session: ensureStoredSession() }, error: null };
        }
        const client = await getSupabaseClient();
        return client.auth.getSession();
    },

    async signInWithPassword({ email, password }) {
        if (this.isMockMode()) {
            const normalizedEmail = normalizeEmail(email);
            if (!normalizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
                return { data: null, error: { code: 'INVALID_EMAIL', message: 'Invalid email address.', status: 400 } };
            }
            if (typeof password !== 'string' || password.length < 10) {
                return { data: null, error: { code: 'INVALID_PASSWORD', message: 'Password must be at least 10 characters.', status: 400 } };
            }
            const session = buildMockSession(normalizedEmail);
            setSession(session);
            return { data: { session, user: session.user }, error: null };
        }
        const client = await getSupabaseClient();
        return client.auth.signInWithPassword({ email, password });
    },

    async signUp({ email, password, options = {} }) {
        if (this.isMockMode()) {
            const normalizedEmail = normalizeEmail(email);
            if (!normalizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
                return { data: null, error: { code: 'INVALID_EMAIL', message: 'Invalid email address.', status: 400 } };
            }
            if (typeof password !== 'string' || password.length < 10) {
                return { data: null, error: { code: 'INVALID_PASSWORD', message: 'Password must be at least 10 characters.', status: 400 } };
            }
            const session = buildMockSession(normalizedEmail);
            setSession(session);
            if (options?.data?.display_name) {
                session.user.user_metadata.display_name = options.data.display_name;
            }
            return { data: { session, user: session.user }, error: null };
        }
        const client = await getSupabaseClient();
        return client.auth.signUp({ email, password, options });
    },

    async signInWithOAuth({ provider, options = {} }) {
        if (this.isMockMode()) {
            const email = normalizeEmail(options?.email || (provider === 'google' ? OWNER_EMAIL : 'learner@example.com'));
            const session = buildMockSession(email);
            setSession(session);
            return { data: { session, user: session.user }, error: null };
        }
        const client = await getSupabaseClient();
        return client.auth.signInWithOAuth({ provider, options });
    },

    async resetPasswordForEmail(email) {
        if (this.isMockMode()) {
            return { data: null, error: null };
        }
        const client = await getSupabaseClient();
        return client.auth.resetPasswordForEmail(email);
    },

    async updateUser({ password }) {
        if (this.isMockMode()) {
            const session = readStoredSession();
            if (!session) {
                return { data: null, error: { code: 'NO_SESSION', message: 'No active session to update.', status: 401 } };
            }
            session.user = { ...session.user, password: password || session.user.password };
            setSession(session);
            return { data: { user: session.user }, error: null };
        }
        const client = await getSupabaseClient();
        return client.auth.updateUser({ password });
    },

    async signOut() {
        if (this.isMockMode()) {
            setSession(null);
            return { error: null };
        }
        const client = await getSupabaseClient();
        return client.auth.signOut();
    }
};

AuthService.auth = {
    signInWithPassword: (...args) => AuthService.signInWithPassword(...args),
    signUp: (...args) => AuthService.signUp(...args),
    signInWithOAuth: (...args) => AuthService.signInWithOAuth(...args),
    resetPasswordForEmail: (...args) => AuthService.resetPasswordForEmail(...args),
    updateUser: (...args) => AuthService.updateUser(...args),
    getSession: () => AuthService.getSession(),
    signOut: (...args) => AuthService.signOut(...args)
};

export default AuthService;
