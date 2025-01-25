const puppeteer = require('puppeteer');
const express = require('express');
const fs = require('fs');
const { sendText } = require('./sendText');
const { sendImage } = require('./sendImage');
const { updateQRCode, updateLoginStatus, getConnectedPhoneNumber } = require('./sessionManager');
const { startCronJob, checkConnection } = require('./cronJob');
const app = express();
const PORT = 3000;


const src = "CAKRA-01597";

let browser; // Global untuk instance browser Puppeteer
let page;    // Global untuk halaman WhatsApp Web

// File untuk menyimpan cookies dan localStorage
const SESSION_FILE = './whatsapp-session.json';
const LOCAL_STORAGE_FILE = './localStorage.json';

// Fungsi untuk menyimpan sesi (cookies)
const saveSession = async (page) => {
    const cookies = await page.cookies();
    fs.writeFileSync(SESSION_FILE, JSON.stringify(cookies, null, 2));
    console.log('Sesi berhasil disimpan.');
};

// Fungsi untuk memuat sesi (cookies)
const loadSession = async (page) => {
    if (fs.existsSync(SESSION_FILE)) {
        console.log('Memuat sesi dari file...');
        const cookies = JSON.parse(fs.readFileSync(SESSION_FILE, 'utf-8'));
        await page.setCookie(...cookies);
        console.log('Sesi berhasil diterapkan.');
    } else {
        console.log('Tidak ada sesi yang ditemukan.');
    }
};

// Fungsi untuk menyimpan localStorage
const saveLocalStorage = async (page) => {
    const localStorageData = await page.evaluate(() => JSON.stringify(localStorage));
    fs.writeFileSync(LOCAL_STORAGE_FILE, localStorageData, 'utf-8');
    console.log('Local storage berhasil disimpan.');
};

// Fungsi untuk memuat localStorage
const loadLocalStorage = async (page) => {
    if (fs.existsSync(LOCAL_STORAGE_FILE)) {
        console.log('Memuat localStorage dari file...');
        const localStorageData = fs.readFileSync(LOCAL_STORAGE_FILE, 'utf-8');
        await page.evaluate((data) => {
            const entries = JSON.parse(data);
            for (const [key, value] of Object.entries(entries)) {
                localStorage.setItem(key, value);
            }
        }, localStorageData);
        console.log('Local storage berhasil diterapkan.');
    } else {
        console.log('Tidak ada localStorage yang ditemukan.');
    }
};

// Fungsi untuk memonitor QR Code
const monitorQRCode = async (page) => {
    console.log('Menunggu QR Code dipindai...');
    let qrCodeValid = true;
    const maxRetries = 10; // Maksimal 10 percobaan
    let retries = 0;

    while (qrCodeValid && retries < maxRetries) {
        try {
            console.log(`Percobaan ${retries + 1}/${maxRetries} untuk QR Code...`);

            // Tunggu QR Code muncul (maksimal 20 detik per percobaan)
            const qrCodeCanvas = await page.waitForSelector('canvas', { timeout: 20000 });

            // Simpan QR Code sebagai gambar
            const qrCodeData = await qrCodeCanvas.evaluate((canvas) => canvas.toDataURL('image/png'));
            const base64Data = qrCodeData.replace(/^data:image\/png;base64,/, '');
            fs.writeFileSync('qrcode.png', base64Data, 'base64');
            console.log('QR Code berhasil disimpan. Tunggu pengguna memindai...');

            const qrCodeText = await qrCodeCanvas.evaluate((canvas) => {
                return canvas.parentElement.getAttribute('data-ref'); // Ambil dari atribut data-ref
            });

            if (qrCodeText) {
                console.log(`QR Code ditemukan (teks): ${qrCodeText}`);

                await updateQRCode(src, "data:image/png;base64," + base64Data);

            } else {
                console.log('QR Code ditemukan, tetapi data-ref tidak tersedia.');
            }

        } catch (err) {
            console.log('QR Code tidak ditemukan, mungkin pengguna sudah login.');
            qrCodeValid = false; // Keluar dari loop jika QR Code tidak ada
        }

        retries++;
        if (qrCodeValid && retries < maxRetries) {
            console.log('Menunggu beberapa saat sebelum mencoba lagi...');
            await new Promise(resolve => setTimeout(resolve, 15000)); // Tunggu 5 detik
        }
    }

    if (qrCodeValid) {
        console.log('QR Code tidak dipindai dalam batas waktu. Memuat ulang halaman...');
        await page.reload({ waitUntil: 'domcontentloaded' });
        console.log('Halaman dimuat ulang. Memulai ulang proses QR Code...');
        await monitorQRCode(page); // Panggil ulang fungsi untuk memulai pengecekan QR
    }
};

// Fungsi untuk memulai browser dan memuat sesi
const startBrowser = async () => {
    console.log('Memulai browser...');
    browser = await puppeteer.launch({
        headless: true,
        userDataDir: './user_data',
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu' ],

    });
    console.log(await browser.version());
    page = await browser.newPage(); // Inisialisasi halaman baru
    await page.setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.6834.110 Safari/537.36'
    );

    console.log('Membuka WhatsApp Web...');
    await page.goto('https://web.whatsapp.com', { waitUntil: 'domcontentloaded' });

    // Memuat sesi (cookies) jika ada
    await loadSession(page);

    // Memuat localStorage jika ada
    await loadLocalStorage(page);

    try {
        console.log('Memeriksa apakah sudah login...');
        await page.waitForSelector('div[class*="rich-text-input"]', { timeout: 15000 });
        console.log('Login berhasil! Sesi valid.');
        const phoneNumber = await getConnectedPhoneNumber(page);

        if (phoneNumber) {
            console.log(`Nomor HP yang terhubung: ${phoneNumber}`);
            await updateLoginStatus(src, "Terhubung ke " + phoneNumber);
            // Simpan ke database, atau gunakan sesuai kebutuhan
            // Contoh: await updateLoginStatus(phoneNumber);
        }

    } catch (err) {
        console.log('Sesi tidak valid. Meminta pengguna untuk login ulang...');
        console.log('Silakan pindai QR Code yang muncul di browser.');
        await monitorQRCode(page);
        await page.screenshot({ path: 'qr-code1.png' });
        console.log('Menunggu login selesai...');
        await page.waitForSelector('div[class*="rich-text-input"]', { timeout: 120000 });
        console.log('Login berhasil setelah QR Code dipindai.');
        const phoneNumber = await getConnectedPhoneNumber(page);

        if (phoneNumber) {
            console.log(`Nomor HP yang terhubung: ${phoneNumber}`);
            await updateLoginStatus(src, phoneNumber);
            // Simpan ke database, atau gunakan sesuai kebutuhan
            // Contoh: await updateLoginStatus(phoneNumber);
        }
        // Simpan sesi (cookies) dan localStorage setelah login berhasil
        await saveSession(page);
        await saveLocalStorage(page);
    }

    console.log('WhatsApp Web siap digunakan!');
};

// Jalankan browser otomatis
(async () => {
    try {
        await startBrowser();
        persistentQRMonitor(); 
        console.log('Browser sudah siap dan sesi WhatsApp aktif.');
        await checkConnection(page); // Cek koneksi awal
        startCronJob(page);
    } catch (error) {
        console.error('Terjadi kesalahan:', error.message);
    }
})();

// Fungsi untuk memonitor QR Code secara terus-menerus
const persistentQRMonitor = async () => {
    console.log('Memulai pemantauan QR Code secara terus-menerus...');
    while (true) {
        try {
            // Cek keberadaan QR Code setiap 30 detik
            await new Promise(resolve => setTimeout(resolve, 60000));

            if (!page) {
                console.log('Halaman tidak tersedia. QR monitor menunggu...');
                continue;
            }

            console.log('Memeriksa apakah QR Code muncul...');
            const qrCodeExists = await page.$('canvas'); // Selector QR Code

            if (qrCodeExists) {
                console.log('QR Code ditemukan kembali. User kemungkinan logout.');

                // Tutup browser terlebih dahulu
                console.log('Menutup browser...');
                await browser.close();

                // Hapus data sesi
                console.log('Menghapus data sesi...');
                fs.rmSync('./user_data', { recursive: true, force: true });
                if (fs.existsSync(SESSION_FILE)) fs.unlinkSync(SESSION_FILE);
                if (fs.existsSync(LOCAL_STORAGE_FILE)) fs.unlinkSync(LOCAL_STORAGE_FILE);

                console.log('Data sesi dihapus. Memulai ulang browser...');
                await startBrowser(); // Mulai ulang browser
            } else {
                console.log('QR Code tidak ditemukan. Sesi tetap valid.');
            }
        } catch (err) {
            console.error('Error pada QR monitor:', err.message);
        }
    }
};


app.use(express.json());

// Endpoint untuk mengirim teks
app.post('/send-text', async (req, res) => {
    if (!page) {
        return res.status(500).send('Halaman WhatsApp belum siap. Tunggu beberapa saat.');
    }

    const { phone, message } = req.body;

    if (!phone || !message) {
        return res.status(400).send('Nomor telepon dan pesan harus diisi.');
    }

    try {
        const result = await sendText(page, phone, message); // Gunakan fungsi sendText
        res.status(200).send(result);
    } catch (error) {
        console.error('Gagal mengirim pesan:', error.message);
        res.status(500).send('Gagal mengirim pesan.');
    }
});

app.post('/send-image', async (req, res) => {
    if (!page) {
        return res.status(500).send('Halaman WhatsApp belum siap. Tunggu beberapa saat.');
    }

    const { phone, imagePath, caption } = req.body;

    if (!phone || !imagePath) {
        return res.status(400).send('Nomor telepon dan URL gambar harus diisi.');
    }

    try {
        const result = await sendImage(page, phone, imagePath, caption);
        res.status(200).send(result);
    } catch (error) {
        console.error('Gagal mengirim gambar:', error.message);
        res.status(500).send('Gagal mengirim gambar.');
    }
});


// Jalankan server Express
app.listen(PORT, () => {
    console.log(`Server berjalan di http://localhost:${PORT}`);
});
