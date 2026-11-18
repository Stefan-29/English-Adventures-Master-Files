import { getSupabaseClient } from '../modules/supabaseClient.js';

const translations = {
    id: {
        eyebrow: 'Area pemilik',
        checking: 'Memeriksa akses…',
        wait: 'Mohon tunggu sebentar.',
        accessError: 'Akses belum dapat diperiksa. Coba muat ulang halaman.',
        signInTitle: 'Silakan masuk',
        signInMessage: 'Masuk menggunakan akun pemilik untuk melanjutkan.',
        signIn: 'Masuk sebagai pemilik',
        notFoundTitle: 'Halaman tidak ditemukan',
        notFoundMessage: 'Halaman yang diminta tidak tersedia.',
        suspendedTitle: 'Akun tidak aktif',
        suspendedMessage: 'Akun ini tidak dapat membuka dashboard.',
        mfaTitle: 'Verifikasi dua langkah diperlukan',
        mfaMessage: 'Masukkan kode autentikasi dari aplikasi Anda untuk membuka dashboard pemilik.',
        setupMfaTitle: 'Siapkan autentikasi dua langkah',
        setupMfaMessage: 'Pindai kode QR dengan aplikasi autentikator, lalu masukkan kode enam digit untuk menyelesaikan penyiapan.',
        otpLabel: 'Kode autentikasi enam digit',
        verify: 'Verifikasi kode',
        setupMfa: 'Siapkan aplikasi autentikator',
        setupKey: 'Kunci manual:',
        mfaError: 'Verifikasi gagal. Periksa kode dan coba lagi.',
        dashboardTitle: 'Dashboard pemilik',
        dashboardDescription: 'Ringkasan data akun, akses siswa, topik, dan pembayaran.',
        refresh: 'Muat ulang',
        signOut: 'Keluar',
        totalUsers: 'Akun pengguna',
        activeEnrollments: 'Pendaftaran aktif',
        topics: 'Topik',
        payments: 'Catatan pembayaran',
        dashboardNote: 'Cari akun pelajar untuk meninjau akses atau mencatat akses penuh setelah pembayaran terverifikasi di luar aplikasi.',
        metricsError: 'Ringkasan tidak dapat dimuat. Pastikan migrasi database sudah diterapkan dan sesi pemilik masih aktif.',
        accessHeading: 'Akses pelajar',
        accessEyebrow: 'Akun pelajar',
        accessDescription: 'Cari email akun terverifikasi untuk meninjau akses atau mencatat pembayaran di luar aplikasi.',
        accessEmail: 'Email pelajar',
        findAccount: 'Cari akun',
        searchingAccount: 'Mencari akun…',
        accountNotFound: 'Akun terverifikasi dengan email tersebut tidak ditemukan.',
        accountLookupError: 'Akun tidak dapat dicari. Pastikan migrasi akses manual sudah diterapkan.',
        accountFound: 'Akun ditemukan',
        accountSummary: 'Peran: {role} · Status: {status} · Email terverifikasi: {verified}',
        verified: 'ya',
        unverified: 'tidak',
        suspended: 'Ditangguhkan',
        accessRecords: 'Riwayat akses',
        noAccessRecords: 'Belum ada catatan akses.',
        accessSource: { manual: 'Manual', payment: 'Pembayaran', trial: 'Uji coba' },
        accessStatus: { active: 'Aktif', revoked: 'Dicabut', expired: 'Kedaluwarsa' },
        accessUntil: 'Berlaku sampai {date}',
        accessLifetime: 'Tanpa batas waktu',
        accessGranted: 'Diberikan {date}',
        revokeManual: 'Cabut akses manual',
        revokeManualConfirm: 'Cabut catatan akses manual ini? Pembayaran dan uji coba tidak akan diubah.',
        accessRevokeSuccess: 'Akses manual dicabut.',
        accessRevokeError: 'Akses manual tidak dapat dicabut.',
        accessDuration: 'Durasi akses',
        accessNote: 'Catatan pembayaran',
        accessNoteHelp: 'Catat referensi pembayaran yang sudah diverifikasi secara manual.',
        grantAccess: 'Berikan akses penuh',
        grantSuccess: 'Akses penuh diberikan. Masa berbayar dimulai setelah akses aktif yang memiliki batas waktu.',
        grantError: 'Akses tidak dapat diberikan. Pastikan akun aktif dan terverifikasi, lalu periksa catatan pembayaran.',
        grantOwnerBlocked: 'Akun pemilik tidak dapat menerima hibah akses manual.',
        grantAccountBlocked: 'Hanya akun pelajar aktif dengan email terverifikasi yang dapat diberi akses.',
        plansHeading: 'Paket akses',
        plansEyebrow: 'Pembelian',
        plansDescription: 'Atur paket dan harga yang akan ditampilkan kepada pelajar.',
        planId: 'ID paket',
        planName: 'Nama paket',
        planDescription: 'Deskripsi',
        planPrice: 'Harga (IDR)',
        planDuration: 'Masa akses',
        planLifetime: 'Selamanya',
        planMonth: 'bulan',
        planActive: 'Aktif dan tersedia untuk dibeli',
        savePlan: 'Simpan paket',
        newPlan: 'Paket baru',
        planTableName: 'Paket',
        planTablePrice: 'Harga',
        planTableDuration: 'Masa',
        planTableStatus: 'Status',
        planTableActions: 'Tindakan',
        active: 'Aktif',
        inactive: 'Nonaktif',
        edit: 'Ubah',
        deactivate: 'Nonaktifkan',
        noPlans: 'Belum ada paket. Tambahkan paket dengan harga yang sudah ditetapkan.',
        plansLoadError: 'Daftar paket tidak dapat dimuat.',
        planSaveError: 'Paket tidak dapat disimpan. Periksa isian dan coba lagi.',
        planDeactivateError: 'Paket tidak dapat dinonaktifkan. Coba lagi.',
        deactivateConfirm: 'Nonaktifkan paket ini? Pelajar tidak dapat membelinya lagi.',
        contentHeading: 'Aktivitas topik',
        contentEyebrow: 'Materi privat',
        contentDescription: 'Kelola aktivitas dalam berkas topik privat. Pertahankan format data aktivitas saat mengubah JSON.',
        contentTopic: 'Topik',
        contentType: 'Jenis aktivitas',
        contentActivity: 'Aktivitas',
        activityJson: 'Data aktivitas (JSON)',
        loadActivities: 'Muat aktivitas',
        newActivity: 'Aktivitas baru',
        saveActivity: 'Simpan aktivitas',
        deleteActivity: 'Hapus aktivitas',
        activityTypes: { lesson: 'Lesson', writing: 'Writing', game: 'Games', quiz: 'Quiz', spelling: 'Spelling' },
        chooseTopic: 'Pilih topik',
        chooseActivity: 'Pilih aktivitas',
        noActivities: 'Belum ada aktivitas pada jenis ini.',
        topicsLoadError: 'Daftar topik tidak dapat dimuat.',
        activitiesLoadError: 'Aktivitas tidak dapat dimuat.',
        invalidActivityJson: 'JSON tidak valid. Periksa format dan coba lagi.',
        saveActivityError: 'Aktivitas tidak dapat disimpan. Periksa ID dan data yang wajib.',
        deleteActivityError: 'Aktivitas tidak dapat dihapus. Coba lagi.',
        activitySaved: 'Aktivitas berhasil disimpan.',
        activityDeleted: 'Aktivitas berhasil dihapus.',
        deleteActivityConfirm: 'Hapus aktivitas ini secara permanen?',
        selectActivityFirst: 'Pilih aktivitas yang ingin dihapus.',
        activityEditorHelp: 'Edit satu objek aktivitas. Gunakan aktivitas yang sudah ada sebagai contoh agar format topik tetap konsisten.',
        activityReloadError: 'Aktivitas tersimpan, tetapi daftar tidak dapat dimuat ulang. Muat ulang daftar sebelum mengedit lagi.',
        activityChangedReloadError: 'Perubahan tersimpan, tetapi daftar tidak dapat dimuat ulang. Muat ulang daftar sebelum mengedit lagi.',
        configurationError: 'Layanan akun belum dikonfigurasi.',
        unknownError: 'Terjadi kesalahan. Silakan coba lagi.',
        english: 'English',
        returnHome: 'Kembali ke halaman utama'
    },
    en: {
        eyebrow: 'Owner area',
        checking: 'Checking access…',
        wait: 'Please wait a moment.',
        accessError: 'Access could not be checked. Try reloading this page.',
        signInTitle: 'Please sign in',
        signInMessage: 'Sign in with the owner account to continue.',
        signIn: 'Sign in as owner',
        notFoundTitle: 'Page not found',
        notFoundMessage: 'The requested page is not available.',
        suspendedTitle: 'Account inactive',
        suspendedMessage: 'This account cannot open the dashboard.',
        mfaTitle: 'Two-step verification required',
        mfaMessage: 'Enter the authentication code from your app to open the owner dashboard.',
        setupMfaTitle: 'Set up two-step verification',
        setupMfaMessage: 'Scan the QR code with an authenticator app, then enter its six-digit code to finish setup.',
        otpLabel: 'Six-digit authentication code',
        verify: 'Verify code',
        setupMfa: 'Set up authenticator app',
        setupKey: 'Manual key:',
        mfaError: 'Verification failed. Check the code and try again.',
        dashboardTitle: 'Owner dashboard',
        dashboardDescription: 'A summary of accounts, student access, topics, and payments.',
        refresh: 'Refresh',
        signOut: 'Sign out',
        totalUsers: 'User accounts',
        activeEnrollments: 'Active enrollments',
        topics: 'Topics',
        payments: 'Payment records',
        dashboardNote: 'Look up a learner account to review access or record full access after verified payment outside the app.',
        metricsError: 'The summary could not be loaded. Confirm the database migration is applied and the owner session is active.',
        accessHeading: 'Learner access',
        accessEyebrow: 'Learner accounts',
        accessDescription: 'Look up a verified account email to review access or record an offline payment.',
        accessEmail: 'Learner email',
        findAccount: 'Find account',
        searchingAccount: 'Finding account…',
        accountNotFound: 'No verified account was found for that email.',
        accountLookupError: 'The account could not be looked up. Confirm the manual-access migration is applied.',
        accountFound: 'Account found',
        accountSummary: 'Role: {role} · Status: {status} · Email verified: {verified}',
        verified: 'yes',
        unverified: 'no',
        suspended: 'Suspended',
        accessRecords: 'Access history',
        noAccessRecords: 'No access records yet.',
        accessSource: { manual: 'Manual', payment: 'Payment', trial: 'Trial' },
        accessStatus: { active: 'Active', revoked: 'Revoked', expired: 'Expired' },
        accessUntil: 'Expires {date}',
        accessLifetime: 'No expiry',
        accessGranted: 'Granted {date}',
        revokeManual: 'Revoke manual access',
        revokeManualConfirm: 'Revoke this manual access record? Payment and trial records will not be changed.',
        accessRevokeSuccess: 'Manual access revoked.',
        accessRevokeError: 'Manual access could not be revoked.',
        accessDuration: 'Access duration',
        accessNote: 'Payment note',
        accessNoteHelp: 'Record a reference for the payment that was verified outside the app.',
        grantAccess: 'Grant full access',
        grantSuccess: 'Full access granted. Paid time starts after any active access with an expiry.',
        grantError: 'Access could not be granted. Confirm the account is active and verified, and check the payment note.',
        grantOwnerBlocked: 'Manual access cannot be granted to the owner account.',
        grantAccountBlocked: 'Only an active learner account with a verified email can receive access.',
        plansHeading: 'Access plans',
        plansEyebrow: 'Checkout',
        plansDescription: 'Set the plans and prices learners can see.',
        planId: 'Plan ID',
        planName: 'Plan name',
        planDescription: 'Description',
        planPrice: 'Price (IDR)',
        planDuration: 'Access duration',
        planLifetime: 'Lifetime',
        planMonth: 'months',
        planActive: 'Active and available for purchase',
        savePlan: 'Save plan',
        newPlan: 'New plan',
        planTableName: 'Plan',
        planTablePrice: 'Price',
        planTableDuration: 'Duration',
        planTableStatus: 'Status',
        planTableActions: 'Actions',
        active: 'Active',
        inactive: 'Inactive',
        edit: 'Edit',
        deactivate: 'Deactivate',
        noPlans: 'No plans yet. Add a plan using a price you have decided.',
        plansLoadError: 'Plans could not be loaded.',
        planSaveError: 'The plan could not be saved. Check the fields and try again.',
        planDeactivateError: 'The plan could not be deactivated. Try again.',
        deactivateConfirm: 'Deactivate this plan? Learners will no longer be able to buy it.',
        contentHeading: 'Topic activities',
        contentEyebrow: 'Private content',
        contentDescription: 'Manage activities in the private topic file. Preserve the existing activity data format when editing JSON.',
        contentTopic: 'Topic',
        contentType: 'Activity type',
        contentActivity: 'Activity',
        activityJson: 'Activity data (JSON)',
        loadActivities: 'Load activities',
        newActivity: 'New activity',
        saveActivity: 'Save activity',
        deleteActivity: 'Delete activity',
        activityTypes: { lesson: 'Lesson', writing: 'Writing', game: 'Games', quiz: 'Quiz', spelling: 'Spelling' },
        chooseTopic: 'Choose a topic',
        chooseActivity: 'Choose an activity',
        noActivities: 'There are no activities of this type yet.',
        topicsLoadError: 'Topics could not be loaded.',
        activitiesLoadError: 'Activities could not be loaded.',
        invalidActivityJson: 'Invalid JSON. Check the formatting and try again.',
        saveActivityError: 'The activity could not be saved. Check its ID and required data.',
        deleteActivityError: 'The activity could not be deleted. Try again.',
        activitySaved: 'Activity saved.',
        activityDeleted: 'Activity deleted.',
        deleteActivityConfirm: 'Permanently delete this activity?',
        selectActivityFirst: 'Choose an activity to delete.',
        activityEditorHelp: 'Edit one activity object. Use an existing activity as a sample to preserve the topic data format.',
        activityReloadError: 'The activity was saved, but the list could not be refreshed. Reload the list before editing again.',
        activityChangedReloadError: 'The change was saved, but the list could not be refreshed. Reload the list before editing again.',
        configurationError: 'Account services are not configured.',
        unknownError: 'Something went wrong. Please try again.',
        english: 'Bahasa Indonesia',
        returnHome: 'Return to the main page'
    }
};

const statusSection = document.getElementById('admin-status');
const titleElement = document.getElementById('status-title');
const messageElement = document.getElementById('status-message');
const actionsElement = document.getElementById('status-actions');
const dashboardElement = document.getElementById('admin-dashboard');
const metricsElement = document.getElementById('dashboard-metrics');
const dashboardError = document.getElementById('dashboard-error');
const languageToggle = document.getElementById('language-toggle');
const signOutButton = document.getElementById('sign-out');
let language = 'id';
let client;
let pendingFactorId = null;
let isSettingUpFactor = false;
let needsMfaSetup = false;
let editingPlanId = null;
let currentActivities = [];
let selectedAccessAccount = null;

function text(key) {
    return translations[language][key];
}

function setLanguage(nextLanguage) {
    const previousLanguage = language;
    language = nextLanguage;
    document.documentElement.lang = language;
    languageToggle.textContent = text('english');
    signOutButton.textContent = text('signOut');
    if (!dashboardElement.hidden) {
        renderDashboardShell();
        void loadPlans();
        void loadContentTopics();
        if (selectedAccessAccount) renderAccessAccount(selectedAccessAccount);
        for (const label of metricsElement.querySelectorAll('[data-copy-key]')) {
            label.textContent = text(label.dataset.copyKey);
        }
        for (const value of metricsElement.querySelectorAll('[data-number-value]')) {
            value.textContent = Number(value.dataset.numberValue).toLocaleString(language === 'id' ? 'id-ID' : 'en-US');
        }
    } else if (pendingFactorId) {
        renderMfaForm();
    } else if (needsMfaSetup) {
        setStatus(text('setupMfaTitle'), text('setupMfaMessage'), {
            actions: [createButton(text('setupMfa'), enrollMfa)]
        });
    } else {
        const titleKey = Object.keys(translations[previousLanguage])
            .find(key => translations[previousLanguage][key] === titleElement.textContent);
        const messageKey = Object.keys(translations[previousLanguage])
            .find(key => translations[previousLanguage][key] === messageElement.textContent);
        if (titleKey) titleElement.textContent = text(titleKey);
        if (messageKey) messageElement.textContent = text(messageKey);
        const signInLink = actionsElement.querySelector('a[href*="auth.html"]');
        const homeLink = actionsElement.querySelector('a[href*="index.html"]');
        if (signInLink) signInLink.textContent = text('signIn');
        if (homeLink) homeLink.textContent = text('returnHome');
    }
}

function setStatus(title, message, { busy = false, actions = [] } = {}) {
    statusSection.hidden = false;
    statusSection.setAttribute('aria-busy', String(busy));
    document.querySelector('.eyebrow').textContent = text('eyebrow');
    titleElement.textContent = title;
    messageElement.textContent = message;
    actionsElement.replaceChildren();
    for (const action of actions) actionsElement.appendChild(action);
    dashboardElement.hidden = true;
}

function createLink(label, href, className = 'button button--primary') {
    const link = document.createElement('a');
    link.className = className;
    link.href = href;
    link.textContent = label;
    return link;
}

function renderSignInRequired() {
    setStatus(text('signInTitle'), text('signInMessage'), {
        actions: [createLink(text('signIn'), '../auth.html?returnTo=admin')]
    });
}

function renderNotFound() {
    setStatus(text('notFoundTitle'), text('notFoundMessage'), {
        actions: [createLink(text('returnHome'), '../index.html', 'button button--quiet')]
    });
    document.title = `${text('notFoundTitle')} | English Adventures`;
}

function renderMfaForm() {
    const title = isSettingUpFactor ? text('setupMfaTitle') : text('mfaTitle');
    const message = isSettingUpFactor ? text('setupMfaMessage') : text('mfaMessage');
    setStatus(title, message);

    if (isSettingUpFactor && window.adminMfaEnrollment?.qrCode) {
        const image = document.createElement('img');
        image.className = 'mfa-qr';
        image.alt = 'Authenticator setup QR code';
        image.src = window.adminMfaEnrollment.qrCode;
        actionsElement.appendChild(image);

        const secretLabel = document.createElement('p');
        secretLabel.textContent = text('setupKey');
        actionsElement.appendChild(secretLabel);

        const secret = document.createElement('code');
        secret.className = 'mfa-secret';
        secret.textContent = window.adminMfaEnrollment.secret;
        actionsElement.appendChild(secret);
    }

    const form = document.createElement('form');
    form.className = 'mfa-form';
    const label = document.createElement('label');
    label.htmlFor = 'mfa-code';
    label.textContent = text('otpLabel');
    const input = document.createElement('input');
    input.id = 'mfa-code';
    input.name = 'code';
    input.type = 'text';
    input.inputMode = 'numeric';
    input.autocomplete = 'one-time-code';
    input.pattern = '[0-9]{6}';
    input.maxLength = 6;
    input.required = true;
    const button = document.createElement('button');
    button.className = 'button button--primary';
    button.type = 'submit';
    button.textContent = text('verify');
    form.append(label, input, button);
    form.addEventListener('submit', verifyMfa);
    actionsElement.appendChild(form);

    if (!isSettingUpFactor) {
        const setup = document.createElement('button');
        setup.className = 'button button--quiet';
        setup.type = 'button';
        setup.textContent = text('setupMfa');
        setup.addEventListener('click', enrollMfa);
        actionsElement.appendChild(setup);
    }
}

async function enrollMfa() {
    try {
        const { data, error } = await client.auth.mfa.enroll({
            factorType: 'totp',
            friendlyName: 'English Adventures owner dashboard'
        });
        if (error) throw error;
        if (
            typeof data?.id !== 'string'
            || typeof data?.totp?.qr_code !== 'string'
            || !data.totp.qr_code.startsWith('data:image/svg+xml')
            || typeof data.totp.secret !== 'string'
        ) {
            throw new Error('INVALID_MFA_ENROLLMENT_RESPONSE');
        }
        pendingFactorId = data.id;
        isSettingUpFactor = true;
        needsMfaSetup = false;
        window.adminMfaEnrollment = {
            qrCode: data.totp.qr_code,
            secret: data.totp.secret
        };
        renderMfaForm();
    } catch (error) {
        console.error('MFA enrollment failed:', error?.code || error?.name || 'unknown');
        setStatus(text('mfaTitle'), text('mfaError'));
    }
}

async function verifyMfa(event) {
    event.preventDefault();
    const code = String(new FormData(event.currentTarget).get('code') || '').trim();
    if (!/^\d{6}$/.test(code) || !pendingFactorId) {
        setStatus(
            isSettingUpFactor ? text('setupMfaTitle') : text('mfaTitle'),
            text('mfaError')
        );
        pendingFactorId = pendingFactorId || null;
        if (pendingFactorId) renderMfaForm();
        return;
    }

    try {
        const { data: challenge, error: challengeError } = await client.auth.mfa.challenge({
            factorId: pendingFactorId
        });
        if (challengeError) throw challengeError;

        const { error: verifyError } = await client.auth.mfa.verify({
            factorId: pendingFactorId,
            challengeId: challenge.id,
            code
        });
        if (verifyError) throw verifyError;

        pendingFactorId = null;
        isSettingUpFactor = false;
        needsMfaSetup = false;
        delete window.adminMfaEnrollment;
        await loadDashboard();
    } catch (error) {
        console.error('MFA verification failed:', error?.code || error?.name || 'unknown');
        pendingFactorId = pendingFactorId || null;
        renderMfaForm();
        const errorMessage = document.createElement('p');
        errorMessage.className = 'dashboard-error';
        errorMessage.setAttribute('role', 'alert');
        errorMessage.textContent = text('mfaError');
        actionsElement.appendChild(errorMessage);
    }
}

function renderDashboardShell() {
    document.getElementById('dashboard-eyebrow').textContent = text('eyebrow');
    document.getElementById('dashboard-title').textContent = text('dashboardTitle');
    document.getElementById('dashboard-description').textContent = text('dashboardDescription');
    document.getElementById('refresh-dashboard').textContent = text('refresh');
    document.getElementById('dashboard-note').textContent = text('dashboardNote');
    document.getElementById('access-eyebrow').textContent = text('accessEyebrow');
    document.getElementById('access-heading').textContent = text('accessHeading');
    document.getElementById('access-description').textContent = text('accessDescription');
    document.getElementById('access-email-label').textContent = text('accessEmail');
    document.getElementById('lookup-account').textContent = text('findAccount');
    document.getElementById('access-records-heading').textContent = text('accessRecords');
    document.getElementById('access-duration-label').textContent = text('accessDuration');
    document.getElementById('access-note-label').textContent = text('accessNote');
    document.getElementById('access-note-help').textContent = text('accessNoteHelp');
    document.getElementById('grant-access').textContent = text('grantAccess');
    for (const option of document.querySelectorAll('#access-duration option')) {
        option.textContent = option.value
            ? `${option.value} ${text('planMonth')}`
            : text('planLifetime');
    }
    document.getElementById('plans-eyebrow').textContent = text('plansEyebrow');
    document.getElementById('plans-heading').textContent = text('plansHeading');
    document.getElementById('plans-description').textContent = text('plansDescription');
    document.getElementById('plan-id-label').textContent = text('planId');
    document.getElementById('plan-name-label').textContent = text('planName');
    document.getElementById('plan-description-label').textContent = text('planDescription');
    document.getElementById('plan-price-label').textContent = text('planPrice');
    document.getElementById('plan-duration-label').textContent = text('planDuration');
    document.getElementById('plan-active-label').textContent = text('planActive');
    document.getElementById('save-plan').textContent = text('savePlan');
    document.getElementById('new-plan').textContent = text('newPlan');
    document.getElementById('plan-table-name').textContent = text('planTableName');
    document.getElementById('plan-table-price').textContent = text('planTablePrice');
    document.getElementById('plan-table-duration').textContent = text('planTableDuration');
    document.getElementById('plan-table-status').textContent = text('planTableStatus');
    document.getElementById('plan-table-actions').textContent = text('planTableActions');
    document.getElementById('content-eyebrow').textContent = text('contentEyebrow');
    document.getElementById('content-heading').textContent = text('contentHeading');
    document.getElementById('content-description').textContent = text('contentDescription');
    document.getElementById('content-topic-label').textContent = text('contentTopic');
    document.getElementById('content-type-label').textContent = text('contentType');
    document.getElementById('content-activity-label').textContent = text('contentActivity');
    document.getElementById('activity-json-label').textContent = text('activityJson');
    document.getElementById('load-activities').textContent = text('loadActivities');
    document.getElementById('new-activity').textContent = text('newActivity');
    document.getElementById('save-activity').textContent = text('saveActivity');
    document.getElementById('delete-activity').textContent = text('deleteActivity');
    document.getElementById('content-editor-help').textContent = text('activityEditorHelp');
    for (const option of document.querySelectorAll('#content-type option')) {
        option.textContent = translations[language].activityTypes[option.value];
    }
    for (const option of document.querySelectorAll('#plan-duration option')) {
        option.textContent = option.value
            ? `${option.value} ${text('planMonth')}`
            : text('planLifetime');
    }
    signOutButton.textContent = text('signOut');
}

function redirectToRequestedTopic() {
    const params = new URLSearchParams(window.location.search);
    const topicId = params.get('topicId');
    if (
        params.get('returnTo') !== 'topic'
        || !topicId
        || topicId.length > 255
        || !/^[a-z0-9]+(?:[-_][a-z0-9]+)*$/.test(topicId)
    ) {
        return false;
    }

    window.location.assign(`../index.html?topicId=${encodeURIComponent(topicId)}`);
    return true;
}

function showAccessMessage(message, isError = false) {
    const errorElement = document.getElementById('access-error');
    const statusElement = document.getElementById('access-status');
    errorElement.hidden = !isError;
    statusElement.hidden = isError || !message;
    errorElement.textContent = isError ? message : '';
    statusElement.textContent = isError ? '' : message;
}

function renderAccessAccount(account) {
    const result = document.getElementById('access-result');
    const recordList = document.getElementById('access-records');
    const grantForm = document.getElementById('manual-access-form');
    const grantButton = document.getElementById('grant-access');
    const emailVerified = account.account_email_verified === true;
    const canGrant = account.account_role !== 'owner'
        && account.account_status === 'active'
        && emailVerified;
    const verifiedText = text(emailVerified ? 'verified' : 'unverified');
    const accountStatus = text(account.account_status === 'active' ? 'active' : 'suspended');

    document.getElementById('access-account-heading').textContent = text('accountFound');
    document.getElementById('access-account-summary').textContent = text('accountSummary')
        .replace('{role}', account.account_role)
        .replace('{status}', accountStatus)
        .replace('{verified}', verifiedText);

    recordList.replaceChildren();
    const records = Array.isArray(account.access_records) ? account.access_records : [];
    if (records.length === 0) {
        const empty = document.createElement('li');
        empty.textContent = text('noAccessRecords');
        recordList.appendChild(empty);
    }

    for (const record of records) {
        const item = document.createElement('li');
        const details = document.createElement('span');
        const source = text('accessSource')[record.source] || record.source;
        const currentStatus = record.status === 'active'
            && record.expires_at
            && new Date(record.expires_at).getTime() <= Date.now()
            ? 'expired'
            : record.status;
        const status = text('accessStatus')[currentStatus] || currentStatus;
        const expires = record.expires_at
            ? text('accessUntil').replace('{date}', new Date(record.expires_at).toLocaleDateString(language === 'id' ? 'id-ID' : 'en-US'))
            : text('accessLifetime');
        const granted = text('accessGranted').replace(
            '{date}',
            new Date(record.granted_at).toLocaleDateString(language === 'id' ? 'id-ID' : 'en-US')
        );
        details.textContent = `${source} · ${status} · ${expires} · ${granted}${record.note ? ` · ${record.note}` : ''}`;
        item.appendChild(details);

        if (record.source === 'manual' && record.status === 'active') {
            const revoke = document.createElement('button');
            revoke.className = 'plan-action plan-action--danger';
            revoke.type = 'button';
            revoke.textContent = text('revokeManual');
            revoke.addEventListener('click', () => void revokeManualAccess(record.id));
            item.appendChild(revoke);
        }
        recordList.appendChild(item);
    }

    grantForm.hidden = !canGrant;
    grantButton.disabled = !canGrant;
    result.hidden = false;
    if (!canGrant) {
        showAccessMessage(
            account.account_role === 'owner' ? text('grantOwnerBlocked') : text('grantAccountBlocked'),
            true
        );
    } else {
        showAccessMessage('');
    }
}

async function lookupAccessAccount(email, successMessageKey = 'accountFound') {
    const lookupButton = document.getElementById('lookup-account');
    const errorElement = document.getElementById('access-error');
    const result = document.getElementById('access-result');
    errorElement.hidden = true;
    result.hidden = true;
    selectedAccessAccount = null;
    lookupButton.disabled = true;
    showAccessMessage(text('searchingAccount'));
    try {
        const { data, error } = await client.rpc('admin_lookup_account', { p_email: email });
        if (error) throw error;
        const account = Array.isArray(data) ? data[0] : null;
        if (!account) {
            showAccessMessage(text('accountNotFound'), true);
            return;
        }
        selectedAccessAccount = account;
        renderAccessAccount(account);
        showAccessMessage(text(successMessageKey));
    } catch (error) {
        console.error('Learner access lookup failed:', error?.code || error?.name || 'unknown');
        showAccessMessage(text('accountLookupError'), true);
    } finally {
        lookupButton.disabled = false;
    }
}

async function grantManualAccess(event) {
    event.preventDefault();
    const form = event.currentTarget;
    if (!selectedAccessAccount || !form.reportValidity()) return;
    const button = document.getElementById('grant-access');
    const durationValue = document.getElementById('access-duration').value;
    const note = String(new FormData(form).get('note') || '').trim();
    button.disabled = true;
    document.getElementById('access-error').hidden = true;
    try {
        const { error } = await client.rpc('admin_grant_manual_access', {
            p_user_id: selectedAccessAccount.account_id,
            p_duration_months: durationValue ? Number(durationValue) : null,
            p_note: note
        });
        if (error) throw error;
        const email = selectedAccessAccount.account_email;
        form.reset();
        await lookupAccessAccount(email, 'grantSuccess');
    } catch (error) {
        console.error('Manual access grant failed:', error?.code || error?.name || 'unknown');
        showAccessMessage(text('grantError'), true);
    } finally {
        button.disabled = !selectedAccessAccount
            || selectedAccessAccount.account_role === 'owner'
            || selectedAccessAccount.account_status !== 'active'
            || selectedAccessAccount.account_email_verified !== true;
    }
}

async function revokeManualAccess(enrollmentId) {
    if (!window.confirm(text('revokeManualConfirm'))) return;
    try {
        const { error } = await client.rpc('admin_revoke_manual_access', {
            p_enrollment_id: enrollmentId
        });
        if (error) throw error;
        const email = selectedAccessAccount?.account_email;
        if (email) await lookupAccessAccount(email, 'accessRevokeSuccess');
    } catch (error) {
        console.error('Manual access revoke failed:', error?.code || error?.name || 'unknown');
        showAccessMessage(text('accessRevokeError'), true);
    }
}

async function requireOwner() {
    const { data: { session }, error: sessionError } = await client.auth.getSession();
    if (sessionError) throw sessionError;
    if (!session) {
        renderSignInRequired();
        return false;
    }

    signOutButton.hidden = false;
    const { data: profile, error: profileError } = await client
        .from('profiles')
        .select('role,status')
        .eq('id', session.user.id)
        .maybeSingle();

    if (profileError) throw profileError;
    if (!profile || profile.role !== 'owner') {
        renderNotFound();
        return false;
    }
    if (profile.status !== 'active') {
        setStatus(text('suspendedTitle'), text('suspendedMessage'));
        return false;
    }

    const { data: assurance, error: assuranceError } = await client.auth.mfa.getAuthenticatorAssuranceLevel();
    if (assuranceError) throw assuranceError;
    if (assurance.currentLevel === 'aal2') return true;

    const { data: factors, error: factorError } = await client.auth.mfa.listFactors();
    if (factorError) throw factorError;
    const verifiedFactor = factors.totp.find(factor => factor.status === 'verified');
    if (verifiedFactor) {
        pendingFactorId = verifiedFactor.id;
        isSettingUpFactor = false;
        needsMfaSetup = false;
        renderMfaForm();
        return false;
    }

    pendingFactorId = null;
    isSettingUpFactor = false;
    needsMfaSetup = true;
    setStatus(text('setupMfaTitle'), text('setupMfaMessage'), {
        actions: [createButton(text('setupMfa'), enrollMfa)]
    });
    return false;
}

function createButton(label, callback) {
    const button = document.createElement('button');
    button.className = 'button button--primary';
    button.type = 'button';
    button.textContent = label;
    button.addEventListener('click', callback);
    return button;
}

async function loadDashboard() {
    dashboardError.hidden = true;
    metricsElement.replaceChildren();
    const now = new Date().toISOString();
    const [users, enrollments, topics, payments] = await Promise.all([
        client.from('profiles').select('id', { count: 'exact', head: true }),
        client.from('enrollments').select('id', { count: 'exact', head: true })
            .eq('status', 'active')
            .or(`expires_at.is.null,expires_at.gt.${now}`),
        client.from('topics').select('id', { count: 'exact', head: true }),
        client.from('payments').select('id', { count: 'exact', head: true })
    ]);

    const failedResult = [users, enrollments, topics, payments].find(result => result.error);
    if (failedResult) {
        throw failedResult.error;
    }

    renderDashboardShell();
    const metrics = [
        ['totalUsers', users.count ?? 0],
        ['activeEnrollments', enrollments.count ?? 0],
        ['topics', topics.count ?? 0],
        ['payments', payments.count ?? 0]
    ];

    for (const [labelKey, value] of metrics) {
        const card = document.createElement('article');
        card.className = 'metric-card';
        const labelElement = document.createElement('p');
        labelElement.className = 'metric-label';
        labelElement.dataset.copyKey = labelKey;
        labelElement.textContent = text(labelKey);
        const valueElement = document.createElement('p');
        valueElement.className = 'metric-value';
        valueElement.dataset.numberValue = String(Number(value));
        valueElement.textContent = Number(value).toLocaleString(language === 'id' ? 'id-ID' : 'en-US');
        card.append(labelElement, valueElement);
        metricsElement.appendChild(card);
    }

    statusSection.hidden = true;
    dashboardElement.hidden = false;
    document.title = `${text('dashboardTitle')} | English Adventures`;
    await loadPlans();
    await loadContentTopics();
    redirectToRequestedTopic();
}

async function loadPlans() {
    const list = document.getElementById('plans-list');
    const errorElement = document.getElementById('plans-error');
    errorElement.hidden = true;
    list.replaceChildren();

    try {
        const { data, error } = await client.functions.invoke('admin-plans', {
            body: { action: 'list' }
        });
        if (error) throw error;
        if (!Array.isArray(data?.plans)) throw new Error('INVALID_PLAN_LIST');
        if (data.plans.length === 0) {
            const row = document.createElement('tr');
            const cell = document.createElement('td');
            cell.className = 'empty-plans';
            cell.colSpan = 5;
            cell.textContent = text('noPlans');
            row.appendChild(cell);
            list.appendChild(row);
            return;
        }

        for (const plan of data.plans) {
            const row = document.createElement('tr');
            const nameCell = document.createElement('td');
            const planName = document.createElement('strong');
            planName.textContent = plan.name;
            const planId = document.createElement('small');
            planId.textContent = plan.id;
            planId.style.display = 'block';
            nameCell.append(planName, planId);

            const priceCell = document.createElement('td');
            priceCell.textContent = Number(plan.price_idr).toLocaleString('id-ID', {
                style: 'currency',
                currency: 'IDR',
                maximumFractionDigits: 0
            });
            const durationCell = document.createElement('td');
            durationCell.textContent = plan.duration_months
                ? `${plan.duration_months} ${text('planMonth')}`
                : text('planLifetime');
            const statusCell = document.createElement('td');
            statusCell.textContent = plan.active ? text('active') : text('inactive');
            const actionsCell = document.createElement('td');
            const editButton = document.createElement('button');
            editButton.type = 'button';
            editButton.className = 'plan-action';
            editButton.textContent = text('edit');
            editButton.addEventListener('click', () => editPlan(plan));
            actionsCell.appendChild(editButton);
            if (plan.active) {
                const deactivateButton = document.createElement('button');
                deactivateButton.type = 'button';
                deactivateButton.className = 'plan-action plan-action--danger';
                deactivateButton.textContent = text('deactivate');
                deactivateButton.addEventListener('click', () => deactivatePlan(plan.id, deactivateButton));
                actionsCell.appendChild(deactivateButton);
            }
            row.append(nameCell, priceCell, durationCell, statusCell, actionsCell);
            list.appendChild(row);
        }
    } catch (error) {
        console.error('Admin plans could not load:', error?.code || error?.name || 'unknown');
        errorElement.textContent = text('plansLoadError');
        errorElement.hidden = false;
    }
}

function editPlan(plan) {
    editingPlanId = plan.id;
    const form = document.getElementById('plan-form');
    form.elements.id.value = plan.id;
    form.elements.id.disabled = true;
    form.elements.name.value = plan.name;
    form.elements.description.value = plan.description || '';
    form.elements.price.value = Number(plan.price_idr);
    form.elements.duration.value = plan.duration_months ? String(plan.duration_months) : '';
    form.elements.active.checked = plan.active === true;
    document.getElementById('plan-name').focus();
}

async function deactivatePlan(planId, button) {
    if (!window.confirm(text('deactivateConfirm'))) return;
    button.disabled = true;
    try {
        const { error } = await client.functions.invoke('admin-plans', {
            body: { action: 'deactivate', id: planId }
        });
        if (error) throw error;
        await loadPlans();
    } catch (error) {
        console.error('Admin plan deactivation failed:', error?.code || error?.name || 'unknown');
        const errorElement = document.getElementById('plans-error');
        errorElement.textContent = text('planDeactivateError');
        errorElement.hidden = false;
        button.disabled = false;
    }
}

async function loadContentTopics() {
    const topicSelect = document.getElementById('content-topic');
    const errorElement = document.getElementById('content-error');
    errorElement.hidden = true;
    topicSelect.replaceChildren();

    try {
        const { data, error } = await client
            .from('topics')
            .select('id,title')
            .order('title');
        if (error) throw error;
        if (!Array.isArray(data)) throw new Error('INVALID_TOPIC_LIST');
        const placeholder = document.createElement('option');
        placeholder.value = '';
        placeholder.textContent = text('chooseTopic');
        topicSelect.appendChild(placeholder);
        for (const topic of data) {
            const option = document.createElement('option');
            option.value = topic.id;
            option.textContent = topic.title;
            topicSelect.appendChild(option);
        }
        if (data.length) {
            topicSelect.value = data[0].id;
            await loadActivities();
        }
    } catch (error) {
        console.error('Admin topic list failed:', error?.code || error?.name || 'unknown');
        errorElement.textContent = text('topicsLoadError');
        errorElement.hidden = false;
    }
}

async function loadActivities(selectedId = '') {
    const topicId = document.getElementById('content-topic').value;
    const type = document.getElementById('content-type').value;
    const activitySelect = document.getElementById('content-activity');
    const errorElement = document.getElementById('content-error');
    const statusElement = document.getElementById('content-status');
    errorElement.hidden = true;
    statusElement.hidden = true;
    activitySelect.replaceChildren();
    document.getElementById('activity-json').value = '';
    currentActivities = [];
    if (!topicId) return false;

    try {
        const { data, error } = await client.functions.invoke('admin-content', {
            body: { action: 'list', topicId, type }
        });
        if (error) throw error;
        if (!Array.isArray(data?.activities)) throw new Error('INVALID_ACTIVITY_LIST');
        currentActivities = data.activities;

        const placeholder = document.createElement('option');
        placeholder.value = '';
        placeholder.textContent = currentActivities.length ? text('chooseActivity') : text('noActivities');
        activitySelect.appendChild(placeholder);
        for (const activity of currentActivities) {
            const option = document.createElement('option');
            option.value = activity.id;
            const summary = typeof activity.title === 'string'
                ? activity.title
                : typeof activity.question === 'string'
                    ? activity.question
                    : activity.id;
            option.textContent = `${activity.id} — ${summary}`.slice(0, 180);
            activitySelect.appendChild(option);
        }
        if (selectedId && currentActivities.some(activity => activity.id === selectedId)) {
            activitySelect.value = selectedId;
            showActivity(selectedId);
        }
        return true;
    } catch (error) {
        console.error('Admin activity list failed:', error?.code || error?.name || 'unknown');
        errorElement.textContent = text('activitiesLoadError');
        errorElement.hidden = false;
        return false;
    }
}

function showActivity(activityId) {
    const activity = currentActivities.find(item => item.id === activityId);
    if (!activity) return;
    document.getElementById('activity-json').value = JSON.stringify(activity, null, 2);
}

async function saveActivity() {
    const editor = document.getElementById('activity-json');
    const errorElement = document.getElementById('content-error');
    const statusElement = document.getElementById('content-status');
    errorElement.hidden = true;
    statusElement.hidden = true;

    let activity;
    try {
        activity = JSON.parse(editor.value);
        if (!activity || typeof activity !== 'object' || Array.isArray(activity)) {
            throw new Error('ACTIVITY_MUST_BE_OBJECT');
        }
    } catch {
        errorElement.textContent = text('invalidActivityJson');
        errorElement.hidden = false;
        return;
    }

    const button = document.getElementById('save-activity');
    button.disabled = true;
    try {
        const { error } = await client.functions.invoke('admin-content', {
            body: {
                action: 'upsert',
                topicId: document.getElementById('content-topic').value,
                type: document.getElementById('content-type').value,
                activity
            }
        });
        if (error) throw error;
        const refreshed = await loadActivities(activity.id);
        statusElement.textContent = refreshed ? text('activitySaved') : text('activityReloadError');
        statusElement.hidden = false;
    } catch (error) {
        console.error('Admin activity save failed:', error?.code || error?.name || 'unknown');
        errorElement.textContent = text('saveActivityError');
        errorElement.hidden = false;
    } finally {
        button.disabled = false;
    }
}

async function deleteActivity() {
    const activityId = document.getElementById('content-activity').value;
    const errorElement = document.getElementById('content-error');
    const statusElement = document.getElementById('content-status');
    errorElement.hidden = true;
    statusElement.hidden = true;
    if (!activityId) {
        errorElement.textContent = text('selectActivityFirst');
        errorElement.hidden = false;
        return;
    }
    if (!window.confirm(text('deleteActivityConfirm'))) return;

    const button = document.getElementById('delete-activity');
    button.disabled = true;
    try {
        const { error } = await client.functions.invoke('admin-content', {
            body: {
                action: 'delete',
                topicId: document.getElementById('content-topic').value,
                type: document.getElementById('content-type').value,
                activityId
            }
        });
        if (error) throw error;
        const refreshed = await loadActivities();
        statusElement.textContent = refreshed ? text('activityDeleted') : text('activityChangedReloadError');
        statusElement.hidden = false;
    } catch (error) {
        console.error('Admin activity delete failed:', error?.code || error?.name || 'unknown');
        errorElement.textContent = text('deleteActivityError');
        errorElement.hidden = false;
    } finally {
        button.disabled = false;
    }
}

document.getElementById('plan-form').addEventListener('reset', () => {
    editingPlanId = null;
    document.getElementById('plan-id').disabled = false;
});

document.getElementById('content-topic').addEventListener('change', () => loadActivities());
document.getElementById('content-type').addEventListener('change', () => loadActivities());
document.getElementById('content-activity').addEventListener('change', event => showActivity(event.currentTarget.value));
document.getElementById('load-activities').addEventListener('click', () => loadActivities());
document.getElementById('access-lookup-form').addEventListener('submit', event => {
    event.preventDefault();
    if (!event.currentTarget.reportValidity()) return;
    const email = String(new FormData(event.currentTarget).get('email') || '').trim();
    void lookupAccessAccount(email);
});
document.getElementById('manual-access-form').addEventListener('submit', grantManualAccess);
document.getElementById('new-activity').addEventListener('click', () => {
    const type = document.getElementById('content-type').value;
    const prefix = type === 'lesson' ? 'lesson' : type;
    const nextNumber = currentActivities.length + 1;
    const starter = { id: `${prefix}-${nextNumber}` };
    document.getElementById('content-activity').value = '';
    document.getElementById('activity-json').value = JSON.stringify(starter, null, 2);
    document.getElementById('content-status').textContent = text('activityEditorHelp');
    document.getElementById('content-status').hidden = false;
});
document.getElementById('save-activity').addEventListener('click', saveActivity);
document.getElementById('delete-activity').addEventListener('click', deleteActivity);

document.getElementById('plan-form').addEventListener('submit', async event => {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.reportValidity()) return;
    const values = new FormData(form);
    const rawDuration = String(values.get('duration') || '');
    const input = {
        action: 'save',
        id: editingPlanId || String(values.get('id') || '').trim(),
        name: String(values.get('name') || '').trim(),
        description: String(values.get('description') || '').trim(),
        priceIdr: Number(values.get('price')),
        durationMonths: rawDuration ? Number(rawDuration) : null,
        active: document.getElementById('plan-active').checked
    };

    const button = document.getElementById('save-plan');
    button.disabled = true;
    const errorElement = document.getElementById('plans-error');
    errorElement.hidden = true;
    try {
        const { error } = await client.functions.invoke('admin-plans', { body: input });
        if (error) throw error;
        form.reset();
        await loadPlans();
    } catch (error) {
        console.error('Admin plan save failed:', error?.code || error?.name || 'unknown');
        errorElement.textContent = text('planSaveError');
        errorElement.hidden = false;
    } finally {
        button.disabled = false;
    }
});

async function initialize() {
    try {
        client = await getSupabaseClient();
        const isOwner = await requireOwner();
        if (isOwner) await loadDashboard();
    } catch (error) {
        console.error('Owner dashboard failed:', error?.code || error?.name || 'unknown');
        if (error?.message === 'SUPABASE_NOT_CONFIGURED') {
            setStatus(text('accessError'), text('configurationError'));
        } else {
            setStatus(text('accessError'), text('unknownError'));
        }
    }
}

languageToggle.addEventListener('click', () => setLanguage(language === 'id' ? 'en' : 'id'));
document.getElementById('refresh-dashboard').addEventListener('click', async () => {
    try {
        const isOwner = await requireOwner();
        if (isOwner) await loadDashboard();
    } catch (error) {
        console.error('Dashboard refresh failed:', error?.code || error?.name || 'unknown');
        dashboardError.textContent = text('metricsError');
        dashboardError.hidden = false;
    }
});
signOutButton.addEventListener('click', async () => {
    try {
        const { error } = await client.auth.signOut();
        if (error) throw error;
        window.location.assign('../index.html');
    } catch (error) {
        console.error('Admin sign-out failed:', error?.code || error?.name || 'unknown');
        setStatus(text('accessError'), text('unknownError'));
    }
});

setLanguage(language);
renderDashboardShell();
initialize();
