const { processMessage } = require('./messageProcessor');
const { getConnectedPhoneNumber } = require('./sessionManager');

let isProcessing = false; // Flag untuk mencegah proses tumpang tindih
let isConnected = false;  // Flag untuk memastikan WhatsApp terhubung

// Fungsi untuk memeriksa koneksi WhatsApp
const checkConnection = async (page) => {
    try {
        console.log('Memeriksa status koneksi...');
        const phoneNumber = await getConnectedPhoneNumber(page);
        if (phoneNumber) {
            console.log(`WhatsApp terhubung dengan nomor: ${phoneNumber}`);
            isConnected = true; // Tandai bahwa WhatsApp sudah terhubung
        } else {
            console.log('WhatsApp tidak terhubung.');
            isConnected = false;
        }
    } catch (error) {
        console.error('Gagal memeriksa status koneksi:', error.message);
        isConnected = false;
    }
};

// Fungsi untuk menjalankan cron job
const startCronJob = (page) => {
    console.log('Memulai cron job...');

    setInterval(async () => {
        if (isConnected && !isProcessing) {
            console.log('Memulai proses pengiriman pesan...');
            isProcessing = true; // Tandai bahwa proses sedang berjalan

            try {
                await processMessage(page); // Proses pesan di messageProcessor
            } catch (error) {
                console.error('Gagal memproses pesan:', error.message);
            } finally {
                isProcessing = false; // Tandai bahwa proses telah selesai
            }
        } else if (!isConnected) {
            console.log('WhatsApp belum terhubung. Menunggu koneksi...');
        } else {
            console.log('Proses sebelumnya belum selesai. Menunggu...');
        }
    }, 30000); // Jalankan setiap 30 detik
};

// Ekspor fungsi untuk digunakan di tempat lain
module.exports = { startCronJob, checkConnection };
