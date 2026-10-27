import { getSupabaseClient } from './supabaseClient.js';
import { syncLocalProgressToSupabase } from './progressSync.js';

const copy = {
    id: {
        eyebrow: 'Belajar bahasa Inggris, selangkah demi selangkah',
        title: 'Selamat datang',
        intro: 'Masuk atau buat akun untuk melanjutkan belajar.',
        loginTab: 'Masuk',
        signupTab: 'Buat akun',
        email: 'Email',
        password: 'Kata sandi',
        loginButton: 'Masuk',
        forgot: 'Lupa kata sandi?',
        or: 'atau',
        adultConfirm: 'Saya berusia 18 tahun atau lebih untuk menggunakan Google.',
        google: 'Lanjutkan dengan Google',
        displayName: 'Nama tampilan',
        passwordHelp: 'Gunakan minimal 10 karakter.',
        minor: 'Saya berusia di bawah 18 tahun.',
        guardianEmail: 'Email wali',
        guardianConsent: 'Wali saya mengetahui dan menyetujui pembuatan akun ini.',
        privacyNotice: 'Kami hanya meminta informasi yang diperlukan. Lihat kebijakan privasi sebelum mendaftar.',
        signupButton: 'Buat akun',
        googleAdultOnly: 'Google hanya tersedia untuk pengguna berusia 18 tahun atau lebih. Pengguna di bawah 18 tahun harus mendaftar melalui formulir dengan persetujuan wali.',
        resetTitle: 'Atur ulang kata sandi',
        resetButton: 'Kirim tautan pemulihan',
        backLogin: 'Kembali ke masuk',
        newPasswordTitle: 'Buat kata sandi baru',
        newPassword: 'Kata sandi baru',
        savePassword: 'Simpan kata sandi',
        privacy: 'Kebijakan privasi',
        terms: 'Ketentuan layanan',
        verifySent: 'Akun dibuat. Periksa email Anda untuk memverifikasi alamat sebelum masuk.',
        loginSuccess: 'Berhasil masuk. Akses materi akan mengikuti status akun Anda.',
        resetSent: 'Jika akun dengan email tersebut tersedia, tautan pemulihan akan dikirim.',
        passwordUpdated: 'Kata sandi berhasil diperbarui. Silakan masuk.',
        verified: 'Email terverifikasi. Silakan masuk.',
        oauthSuccess: 'Berhasil masuk. Anda dapat kembali ke halaman utama.',
        configError: 'Layanan akun belum dikonfigurasi. Hubungi pengelola.',
        generalError: 'Permintaan gagal. Periksa koneksi dan data Anda, lalu coba lagi.',
        rateError: 'Terlalu banyak percobaan. Tunggu sebentar sebelum mencoba lagi.',
        minorError: 'Untuk akun di bawah 18 tahun, email wali dan persetujuan wajib diisi.',
        adultError: 'Konfirmasi bahwa Anda berusia 18 tahun atau lebih sebelum menggunakan Google.',
        loginError: 'Email atau kata sandi tidak cocok, atau email belum diverifikasi.',
        oauthError: 'Masuk dengan Google gagal. Coba lagi atau gunakan email.',
        invalidEmail: 'Masukkan alamat email yang valid.',
        shortPassword: 'Kata sandi harus memiliki minimal 10 karakter.',
        consentError: 'Centang persetujuan wali sebelum membuat akun.',
        loading: 'Memproses…'
    },
    en: {
        eyebrow: 'Learn English, one step at a time',
        title: 'Welcome',
        intro: 'Sign in or create an account to continue learning.',
        loginTab: 'Sign in',
        signupTab: 'Create account',
        email: 'Email',
        password: 'Password',
        loginButton: 'Sign in',
        forgot: 'Forgot password?',
        or: 'or',
        adultConfirm: 'I am 18 or older and may use Google sign-in.',
        google: 'Continue with Google',
        displayName: 'Display name',
        passwordHelp: 'Use at least 10 characters.',
        minor: 'I am under 18 years old.',
        guardianEmail: 'Guardian email',
        guardianConsent: 'My guardian is aware of and consents to creating this account.',
        privacyNotice: 'We only request information needed for the account. Review the privacy policy before signing up.',
        signupButton: 'Create account',
        googleAdultOnly: 'Google sign-in is for users aged 18 or older. Users under 18 must register with the form and guardian consent.',
        resetTitle: 'Reset your password',
        resetButton: 'Send recovery link',
        backLogin: 'Back to sign in',
        newPasswordTitle: 'Choose a new password',
        newPassword: 'New password',
        savePassword: 'Save password',
        privacy: 'Privacy policy',
        terms: 'Terms of service',
        verifySent: 'Account created. Check your email to verify your address before signing in.',
        loginSuccess: 'Signed in. Learning access will reflect your account status.',
        resetSent: 'If an account with that email exists, a recovery link will be sent.',
        passwordUpdated: 'Password updated. Please sign in.',
        verified: 'Email verified. Please sign in.',
        oauthSuccess: 'Signed in. You can return to the home page.',
        configError: 'Account services are not configured yet. Contact the site owner.',
        generalError: 'The request failed. Check your connection and details, then try again.',
        rateError: 'Too many attempts. Wait a little before trying again.',
        minorError: 'For accounts under 18, a guardian email and consent are required.',
        adultError: 'Confirm that you are 18 or older before using Google sign-in.',
        loginError: 'Email or password did not match, or the email has not been verified.',
        oauthError: 'Google sign-in failed. Try again or use email.',
        invalidEmail: 'Enter a valid email address.',
        shortPassword: 'Password must be at least 10 characters.',
        consentError: 'Confirm guardian consent before creating the account.',
        loading: 'Please wait…'
    }
};

const elements = {
    message: document.getElementById('auth-message'),
    loginTab: document.getElementById('tab-login'),
    signupTab: document.getElementById('tab-signup'),
    loginPanel: document.getElementById('panel-login'),
    signupPanel: document.getElementById('panel-signup'),
    resetPanel: document.getElementById('panel-reset'),
    updatePasswordPanel: document.getElementById('panel-update-password'),
    minor: document.getElementById('is-minor'),
    guardianFields: document.getElementById('guardian-fields'),
    guardianEmail: document.getElementById('guardian-email'),
    guardianConsent: document.getElementById('guardian-consent')
};

let language = 'id';

function text(key) {
    return copy[language][key];
}

function showMessage(message, kind = 'info') {
    elements.message.textContent = message;
    elements.message.dataset.kind = kind;
    elements.message.hidden = false;
}

function clearMessage() {
    elements.message.textContent = '';
    elements.message.hidden = true;
    delete elements.message.dataset.kind;
}

function setPanel(panel) {
    const isLogin = panel === 'login';
    const isSignup = panel === 'signup';
    elements.loginPanel.hidden = !isLogin;
    elements.signupPanel.hidden = !isSignup;
    elements.resetPanel.hidden = panel !== 'reset';
    elements.updatePasswordPanel.hidden = panel !== 'update-password';
    elements.loginTab.hidden = panel === 'reset' || panel === 'update-password';
    elements.signupTab.hidden = panel === 'reset' || panel === 'update-password';
    elements.loginTab.classList.toggle('is-active', isLogin);
    elements.signupTab.classList.toggle('is-active', isSignup);
    elements.loginTab.setAttribute('aria-selected', String(isLogin));
    elements.signupTab.setAttribute('aria-selected', String(isSignup));
    clearMessage();
}

function setLanguage(nextLanguage) {
    language = nextLanguage;
    document.documentElement.lang = language;
    for (const element of document.querySelectorAll('[data-i18n]')) {
        const key = element.dataset.i18n;
        if (copy[language][key]) element.textContent = copy[language][key];
    }
    document.getElementById('language-toggle').textContent = language === 'id' ? 'English' : 'Bahasa Indonesia';
}

function isValidEmail(value) {
    const input = document.createElement('input');
    input.type = 'email';
    input.value = value.trim();
    return input.validity.valid && input.value.length <= 254;
}

function errorMessage(error, fallbackKey = 'generalError') {
    const status = Number(error?.status);
    if (status === 429 || error?.code === 'over_email_send_rate_limit') return text('rateError');
    if (fallbackKey === 'loginError') return text('loginError');
    if (fallbackKey === 'oauthError') return text('oauthError');
    return text(fallbackKey);
}

function setBusy(form, busy) {
    const button = form.querySelector('[type="submit"]');
    if (!button) return () => {};
    const originalText = button.textContent;
    button.disabled = busy;
    if (busy) button.textContent = text('loading');
    return () => {
        button.disabled = false;
        button.textContent = originalText;
    };
}

async function withClient(task, fallbackKey) {
    try {
        const client = await getSupabaseClient();
        await task(client);
    } catch (error) {
        if (error?.message === 'SUPABASE_NOT_CONFIGURED') {
            showMessage(text('configError'), 'error');
            return;
        }
        console.error('Authentication request failed:', error?.code || error?.status || 'unknown');
        showMessage(errorMessage(error, fallbackKey), 'error');
    }
}

function handleForm(form, action, fallbackKey) {
    form.addEventListener('submit', async event => {
        event.preventDefault();
        clearMessage();
        if (!form.reportValidity()) return;
        const restore = setBusy(form, true);
        try {
            await withClient(action, fallbackKey);
        } finally {
            restore();
        }
    });
}

document.getElementById('language-toggle').addEventListener('click', () => {
    setLanguage(language === 'id' ? 'en' : 'id');
});

elements.loginTab.addEventListener('click', () => setPanel('login'));
elements.signupTab.addEventListener('click', () => setPanel('signup'));
document.getElementById('show-reset').addEventListener('click', () => setPanel('reset'));
document.getElementById('back-to-login').addEventListener('click', () => setPanel('login'));

elements.minor.addEventListener('change', () => {
    const isMinor = elements.minor.checked;
    elements.guardianFields.hidden = !isMinor;
    elements.guardianEmail.required = isMinor;
    elements.guardianConsent.required = isMinor;
});

handleForm(document.getElementById('login-form'), async client => {
    const form = new FormData(document.getElementById('login-form'));
    const email = String(form.get('email') || '').trim();
    const password = String(form.get('password') || '');
    if (!isValidEmail(email)) return showMessage(text('invalidEmail'), 'error');
    const { error } = await client.auth.signInWithPassword({ email, password });
    if (error) throw error;
    await syncLocalProgressToSupabase();
    showMessage(text('loginSuccess'), 'success');
}, 'loginError');

handleForm(document.getElementById('signup-form'), async client => {
    const form = new FormData(document.getElementById('signup-form'));
    const email = String(form.get('email') || '').trim();
    const password = String(form.get('password') || '');
    const displayName = String(form.get('display_name') || '').trim();
    const isMinor = elements.minor.checked;
    const guardianEmail = elements.guardianEmail.value.trim();
    if (!isValidEmail(email) || !displayName) return showMessage(text('invalidEmail'), 'error');
    if (password.length < 10) return showMessage(text('shortPassword'), 'error');
    if (isMinor && (!isValidEmail(guardianEmail) || !elements.guardianConsent.checked)) {
        return showMessage(elements.guardianConsent.checked ? text('minorError') : text('consentError'), 'error');
    }

    const { error } = await client.auth.signUp({
        email,
        password,
        options: {
            emailRedirectTo: `${window.location.origin}${window.location.pathname}?verified=1`,
            data: {
                display_name: displayName,
                is_minor: isMinor,
                guardian_email: isMinor ? guardianEmail : null,
                guardian_consent: isMinor && elements.guardianConsent.checked
            }
        }
    });
    if (error) throw error;
    showMessage(text('verifySent'), 'success');
}, 'generalError');

handleForm(document.getElementById('reset-form'), async client => {
    const email = String(new FormData(document.getElementById('reset-form')).get('email') || '').trim();
    if (!isValidEmail(email)) return showMessage(text('invalidEmail'), 'error');
    const redirectTo = `${window.location.origin}${window.location.pathname}?mode=reset`;
    const { error } = await client.auth.resetPasswordForEmail(email, { redirectTo });
    if (error) throw error;
    showMessage(text('resetSent'), 'success');
}, 'generalError');

handleForm(document.getElementById('update-password-form'), async client => {
    const password = String(new FormData(document.getElementById('update-password-form')).get('password') || '');
    if (password.length < 10) return showMessage(text('shortPassword'), 'error');
    const { error } = await client.auth.updateUser({ password });
    if (error) throw error;
    window.history.replaceState({}, '', window.location.pathname);
    setPanel('login');
    showMessage(text('passwordUpdated'), 'success');
}, 'generalError');

async function startGoogleSignIn() {
    const eligible = document.getElementById('google-adult').checked
        || document.getElementById('google-signup-adult').checked;
    if (!eligible) {
        showMessage(text('adultError'), 'error');
        return;
    }
    clearMessage();
    const button = document.activeElement;
    if (button instanceof HTMLButtonElement) {
        button.disabled = true;
        button.textContent = text('loading');
    }
    try {
        const client = await getSupabaseClient();
        const { error } = await client.auth.signInWithOAuth({
            provider: 'google',
            options: { redirectTo: `${window.location.origin}${window.location.pathname}` }
        });
        if (error) throw error;
        await syncLocalProgressToSupabase();
    } catch (error) {
        if (error?.message === 'SUPABASE_NOT_CONFIGURED') {
            showMessage(text('configError'), 'error');
        } else {
            console.error('Google sign-in failed:', error?.code || error?.status || 'unknown');
            showMessage(errorMessage(error, 'oauthError'), 'error');
        }
        for (const id of ['google-login', 'google-signup']) {
            const googleButton = document.getElementById(id);
            googleButton.disabled = false;
            googleButton.textContent = text('google');
        }
    }
}

document.getElementById('google-login').addEventListener('click', startGoogleSignIn);
document.getElementById('google-signup').addEventListener('click', startGoogleSignIn);

setLanguage('id');

const params = new URLSearchParams(window.location.search);
const hashParams = new URLSearchParams(window.location.hash.slice(1));
if (params.get('mode') === 'reset' || hashParams.get('type') === 'recovery') {
    setPanel('update-password');
} else if (params.get('verified') === '1') {
    setPanel('login');
    showMessage(text('verified'), 'success');
}

withClient(async client => {
    const { data, error } = await client.auth.getSession();
    if (error) throw error;
    if (data.session && !params.has('mode')) {
        await syncLocalProgressToSupabase();
        showMessage(text('oauthSuccess'), 'success');
    }
}, 'generalError');
