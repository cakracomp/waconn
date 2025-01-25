const { formatPhoneNumber } = require('./utils/formatPhoneNumber');

const sendText = async (page, phoneNumber, message) => {
    const formattedPhoneNumber = formatPhoneNumber(phoneNumber);

    try {
        console.log(`Membuka chat dengan ${formattedPhoneNumber}...`);
        await page.goto(`https://web.whatsapp.com/send?phone=${formattedPhoneNumber}`, {
            waitUntil: 'networkidle0',
            timeout: 90000,
        });

        // Validasi nomor WhatsApp
        console.log('Memeriksa validitas nomor WhatsApp...');
        const isInvalidNumber = await page.waitForSelector(
            'div[aria-label="Phone number shared via url is invalid."], div[aria-label="Nomor telepon yang dibagikan melalui URL tidak valid."]',
            { timeout: 5000 } // Tunggu maksimal 5 detik untuk elemen "nomor tidak valid"
        ).catch(() => null);

        if (isInvalidNumber) {
            console.log(`Nomor tidak valid di WhatsApp: ${formattedPhoneNumber}`);
            return { success: false, message: 'Nomor tidak valid di WhatsApp' };
        }

        console.log('Nomor valid di WhatsApp.');

        // Fokuskan pada kolom input pesan
        console.log('Menunggu kolom input teks...');
        const inputField = await page.waitForSelector('div[aria-placeholder*="message"], div[aria-placeholder*="pesan"]', { timeout: 90000 });

        console.log('Menyalin pesan ke clipboard...');
        await page.evaluate((text) => {
            navigator.clipboard.writeText(text); // Salin teks ke clipboard
        }, message);

        console.log('Memastikan kolom input teks fokus...');
        await page.evaluate(() => {
            const inputField = document.querySelector('div[aria-placeholder*="message"], div[aria-placeholder*="pesan"]');
            if (!inputField) {
                throw new Error('Kolom input teks tidak ditemukan!');
            }
            inputField.focus(); // Fokuskan kolom input
        });

        console.log('Mem-paste pesan ke kolom input...');
        await page.keyboard.down('Control'); // Tekan tombol Ctrl (Command di Mac)
        await page.keyboard.press('KeyV'); // Tekan V untuk paste
        await page.keyboard.up('Control'); // Lepaskan tombol Ctrl
        console.log('Pesan berhasil dimasukkan dengan metode paste.');

        console.log('Mengirim pesan...');
        await page.keyboard.press('Enter'); // Tekan Enter untuk mengirim pesan
        console.log(`Pesan berhasil dikirim ke ${formattedPhoneNumber}.`);

        return { success: true, message: `Pesan berhasil dikirim ke ${formattedPhoneNumber}` };
    } catch (err) {
        console.error(`Gagal mengirim pesan ke ${formattedPhoneNumber}:`, err);
        return { success: false, message: err.message };
    }
};

module.exports = { sendText };
