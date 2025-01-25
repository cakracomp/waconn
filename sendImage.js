const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { formatPhoneNumber } = require('./utils/formatPhoneNumber'); // Import fungsi formatPhoneNumber

// Fungsi untuk mendapatkan path file sementara berdasarkan ekstensi
const getTempFilePath = (ext) => path.join(__dirname, `tempimg${ext}`);

// Fungsi untuk menghapus file sementara jika ada
const deleteTempFileIfExists = (filePath) => {
    if (fs.existsSync(filePath)) {
        console.log(`Menghapus file sementara yang ada: ${filePath}`);
        fs.unlinkSync(filePath);
    }
};

// Fungsi untuk mengunduh gambar dari URL
const downloadImage = async (url) => {
    const fileExt = path.extname(url).toLowerCase();
    const tempFilePath = getTempFilePath(fileExt);

    deleteTempFileIfExists(tempFilePath); // Pastikan file sementara dihapus sebelum download

    const response = await axios({
        url,
        method: 'GET',
        responseType: 'stream',
    });

    console.log(`Mengunduh gambar dari URL: ${url}`);
    const writer = fs.createWriteStream(tempFilePath);

    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
        writer.on('finish', () => resolve(tempFilePath));
        writer.on('error', reject);
    });
};

// Fungsi utama untuk mengirim gambar
const sendImage = async (page, phoneNumber, imagePath, caption) => {
    const formattedPhoneNumber = formatPhoneNumber(phoneNumber); // Format nomor telepon dengan fungsi dari modul lain

    // Tentukan path file sementara berdasarkan ekstensi file
    const tempFilePath = getTempFilePath(path.extname(imagePath).toLowerCase());

    try {
        console.log(`Mengunduh gambar dari URL: ${imagePath}`);
        await downloadImage(imagePath);
        console.log(`Gambar berhasil diunduh: ${tempFilePath}`);

        console.log(`Membuka chat dengan ${formattedPhoneNumber}...`);
        await page.goto(`https://web.whatsapp.com/send?phone=${formattedPhoneNumber}`, {
            waitUntil: 'networkidle0',
            timeout: 90000,
        });

        console.log('Memeriksa apakah nomor valid di WhatsApp...');
        const isInvalidNumber = await page
            .waitForSelector(
                'div[aria-label="Phone number shared via url is invalid."], div[aria-label="Nomor telepon yang dibagikan melalui URL tidak valid."]',
                { timeout: 5000 }
            )
            .catch(() => null);

        if (isInvalidNumber) {
            const errorMsg = `Nomor tidak terdaftar di WhatsApp: ${formattedPhoneNumber}`;
            console.error(errorMsg);
            return { success: false, message: errorMsg };
        }

        console.log('Nomor valid di WhatsApp.');

        console.log('Menunggu halaman terload...');
        await page.waitForSelector('div[aria-placeholder*="message"], div[aria-placeholder*="pesan"]', {
            timeout: 90000,
        });
        console.log('Halaman siap untuk interaksi.');

        if (caption) {
            console.log('Menyalin caption ke clipboard...');
            await page.evaluate((text) => {
                navigator.clipboard.writeText(text); // Salin teks ke clipboard
            }, caption);

            console.log('Memastikan kolom input teks fokus...');
            const inputField = await page.$('div[aria-placeholder*="message"], div[aria-placeholder*="pesan"]');
            if (!inputField) {
                throw new Error('Kolom input teks tidak ditemukan!');
            }
            await page.evaluate(() => {
                const inputField = document.querySelector('div[aria-placeholder*="message"], div[aria-placeholder*="pesan"]');
                inputField.focus(); // Fokuskan kolom input
            });

            console.log('Mem-paste caption ke kolom input...');
            await page.keyboard.down('Control'); // Tekan tombol Ctrl (Command di Mac)
            await page.keyboard.press('KeyV'); // Tekan V untuk paste
            await page.keyboard.up('Control'); // Lepaskan tombol Ctrl
            console.log('Caption berhasil dimasukkan dengan metode paste.');
        }

        console.log('Mencoba klik tombol "+"...');
        const plusButton = await page.$('span[data-icon="plus"]');
        if (!plusButton) throw new Error('Tombol "+" tidak ditemukan.');
        await plusButton.click();

        console.log('Menunggu dropdown pilihan upload muncul...');
        await page.waitForTimeout(2000); // Tunggu dropdown muncul

        console.log('Memilih elemen file untuk "Photos & Videos"...');
        await page.waitForSelector('input[accept="image/*,video/mp4,video/3gpp,video/quicktime"]', { timeout: 15000 });
        const fileInput = await page.$('input[accept="image/*,video/mp4,video/3gpp,video/quicktime"]');
        if (!fileInput) {
            throw new Error('Input file untuk "Photos & Videos" tidak ditemukan.');
        }

        console.log('Mengunggah file...');
        await fileInput.uploadFile(tempFilePath);
        console.log('File berhasil diunggah.');

        console.log('Menunggu tombol "Send" muncul...');
        await page.waitForSelector('span[data-icon="send"]', { timeout: 10000 });
        const sendButton = await page.$('span[data-icon="send"]');
        if (!sendButton) {
            throw new Error('Tombol "Send" tidak ditemukan.');
        }

        console.log('Mengklik tombol "Send"...');
        await sendButton.click();
        console.log('Tombol "Send" berhasil diklik.');

        console.log(`Gambar berhasil dikirim ke ${formattedPhoneNumber}.`);

        return { success: true, message: `Gambar berhasil dikirim ke ${formattedPhoneNumber}.` };
    } catch (err) {
        console.error(`Gagal mengirim gambar ke ${formattedPhoneNumber}:`, err);
        return { success: false, message: `Gagal mengirim gambar: ${err.message}` };
    } finally {
        deleteTempFileIfExists(tempFilePath); // Hapus file sementara setelah selesai
        console.log('File sementara berhasil dihapus.');
    }
};

module.exports = { sendImage };
