import { getSupabaseClient } from './supabaseClient.js';

const translations = {
    id: {
        title: 'Memeriksa pembayaran',
        checking: 'Mohon tunggu sebentar. Pembayaran akan dikonfirmasi oleh layanan pembayaran.',
        paid: 'Pembayaran berhasil dikonfirmasi. Akses belajar Anda telah diperbarui.',
        pending: 'Pembayaran masih menunggu konfirmasi. Jika Anda sudah membayar, tunggu sebentar lalu periksa lagi.',
        failed: 'Pembayaran tidak berhasil. Anda dapat mencoba lagi atau menghubungi guru.',
        cancelled: 'Pembayaran dibatalkan atau kedaluwarsa. Anda dapat memilih paket lagi.',
        refunded: 'Pembayaran ini telah dikembalikan. Akses dari transaksi tersebut sudah dicabut.',
        signIn: 'Masuk untuk memeriksa status transaksi ini.',
        unavailable: 'Status pembayaran belum dapat diperiksa. Periksa koneksi lalu coba lagi.',
        invalid: 'Nomor pesanan tidak valid.',
        home: 'Kembali ke topik',
        refresh: 'Periksa lagi',
        english: 'English'
    },
    en: {
        title: 'Checking payment',
        checking: 'Please wait. The payment provider will confirm your payment.',
        paid: 'Payment confirmed. Your learning access has been updated.',
        pending: 'Payment is awaiting confirmation. If you have paid, wait briefly and check again.',
        failed: 'Payment did not succeed. You can try again or contact the teacher.',
        cancelled: 'Payment was cancelled or expired. You can choose a plan again.',
        refunded: 'This payment was refunded. Access granted by this transaction has been revoked.',
        signIn: 'Sign in to check this transaction status.',
        unavailable: 'Payment status could not be checked. Check your connection and try again.',
        invalid: 'The order reference is invalid.',
        home: 'Return to topics',
        refresh: 'Check again',
        english: 'Bahasa Indonesia'
    }
};

const statusElement = document.getElementById('payment-status');
const titleElement = document.getElementById('payment-title');
const homeLink = document.getElementById('payment-home');
const refreshButton = document.getElementById('payment-refresh');
const languageButton = document.getElementById('language-toggle');
const orderId = new URLSearchParams(window.location.search).get('order_id');
let language = 'id';
let latestStatus = 'checking';

function render() {
    document.documentElement.lang = language;
    document.title = `${translations[language].title} | English Adventures`;
    titleElement.textContent = translations[language].title;
    statusElement.textContent = translations[language][latestStatus] || translations[language].unavailable;
    homeLink.textContent = translations[language].home;
    refreshButton.textContent = translations[language].refresh;
    languageButton.textContent = translations[language].english;
}

async function checkStatus() {
    if (!orderId || orderId.length > 255) {
        latestStatus = 'invalid';
        render();
        return;
    }

    latestStatus = 'checking';
    render();
    try {
        const client = await getSupabaseClient();
        const { data: { session }, error: sessionError } = await client.auth.getSession();
        if (sessionError) throw sessionError;
        if (!session?.user?.email_confirmed_at) {
            latestStatus = 'signIn';
            render();
            homeLink.href = `auth.html?returnTo=payment&orderId=${encodeURIComponent(orderId)}`;
            return;
        }

        const { data: order, error } = await client
            .from('orders')
            .select('status')
            .eq('midtrans_order_id', orderId)
            .maybeSingle();
        if (error) throw error;
        if (!order || !['pending', 'paid', 'failed', 'cancelled', 'refunded'].includes(order.status)) {
            throw new Error('ORDER_STATUS_UNAVAILABLE');
        }
        latestStatus = order.status;
        render();
    } catch (error) {
        console.error('Payment status lookup failed:', error?.code || error?.name || 'unknown');
        latestStatus = 'unavailable';
        render();
    }
}

refreshButton.addEventListener('click', checkStatus);
languageButton.addEventListener('click', () => {
    language = language === 'id' ? 'en' : 'id';
    render();
});

render();
void checkStatus();
