const { getConnection } = require('./db')

// Fungsi untuk menyimpan atau memperbarui QR Code di database
const updateQRCode = async (id, qrCode) => {
    let conn;
    try {
        conn = await getConnection()
        console.log(`Memperbarui atau menyisipkan kode QR untuk ID: ${id}...`);

        const query = `
            INSERT INTO sess_wa (id, qr, credate)
            VALUES (?, ?, NOW())
            ON DUPLICATE KEY UPDATE
            qr = VALUES(qr), credate = NOW()
        `;

        await conn.query(query, [id, qrCode]);
        console.log(`Kode QR untuk ID ${id} berhasil disimpan atau diperbarui di database.`);
    } catch (error) {
        console.error(`Gagal menyimpan kode QR untuk ID ${id} ke database:`, error.message);
    } finally {
        if (conn) conn.end();
    }
};

// Fungsi untuk memperbarui status login dengan nomor HP
const updateLoginStatus = async (id, phoneNumber) => {
    let conn;
    try {
        conn = await getConnection();
        console.log('Memperbarui status login di database...');
        const msg = 'Terhubung ke: ' + phoneNumber; // Format untuk kolom msg
        const query = `
            UPDATE sess_wa
            SET number = ?, qr = NULL, credate = NOW(), msg = ?
            WHERE id = ?
        `;
        await conn.query(query, [phoneNumber, msg, id]); // Sesuaikan urutan nilai dengan placeholder

        console.log('Status login berhasil diperbarui di database.');
    } catch (error) {
        console.error('Gagal memperbarui status login di database:', error.message);
    } finally {
        if (conn) conn.end();
    }
};



// Fungsi untuk mendapatkan nomor HP dari sesi aktif
const getConnectedPhoneNumber = async (page) => {
    try {
        console.log('Mengklik ikon profil untuk membuka informasi akun...');
        const profileButtonSelector = 'button[aria-label="Profile"]';
        await page.waitForSelector(profileButtonSelector, { timeout: 10000 });
        await page.click(profileButtonSelector);

        console.log('Menunggu nomor telepon muncul di profil...');
        const phoneNumberSelector = 'div.selectable-text.copyable-text'; // Selector dari gambar 2
        await page.waitForSelector(phoneNumberSelector, { timeout: 10000 });

        // Ambil teks nomor HP
        const phoneNumber = await page.$eval(phoneNumberSelector, (element) => element.textContent.trim());
        console.log(`Nomor HP yang terhubung: ${phoneNumber}`);
        return phoneNumber;
    } catch (error) {
        console.error('Gagal mengambil nomor HP yang terhubung:', error.message);
        return null;
    }
};



module.exports = { updateQRCode, updateLoginStatus, getConnectedPhoneNumber };
