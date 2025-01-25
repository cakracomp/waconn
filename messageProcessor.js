const { getConnection } = require('./db');
const { sendText } = require('./sendText');
const { sendImage } = require('./sendImage');
const { formatPhoneNumber } = require('./utils/formatPhoneNumber');

const processMessage = async (page) => {
    let conn;
    try {
        conn = await getConnection(); // Koneksi ke database
        console.log('Menarik data pesan dari database...');

        // Ambil pesan yang belum dikirim (sentdate NULL)
        const rows = await conn.query('SELECT idcrm, hp, isi, pic FROM crm_h2 WHERE sentdate IS NULL LIMIT 1');

        // Log hasil query untuk debugging
        console.log('Hasil query dari crm_h2:', rows);

        // Pastikan ada data untuk diproses
        if (!rows || rows.length === 0) {
            console.log('Tidak ada pesan yang perlu diproses.');
            return;
        }

        // Ambil data dari baris pertama
        const data = rows[0];
        const { idcrm, hp, isi, pic } = data;

        // Validasi data yang diambil
        if (!idcrm || !hp || !isi) {
            console.log('Data pesan tidak lengkap:', data);
            return;
        }

        console.log(`Pesan yang akan diproses: ID=${idcrm}, Nomor=${hp}, Isi=${isi}, Gambar=${pic}`);

        const formattedPhoneNumber = formatPhoneNumber(hp); // Format nomor
        console.log(`Nomor yang diformat: ${formattedPhoneNumber}`);

        // Proses isi pesan untuk menjaga baris baru
        const processedIsi = isi.replace(/\r\n|\r|\n/g, '\n'); // Pastikan semua newline menjadi \n
        console.log(`Isi pesan setelah diproses: ${processedIsi}`);

        let responseMessage = ''; // Variable untuk menyimpan respons pengiriman

        // Proses pengiriman pesan
        if (!pic || pic.trim() === '') {
            console.log('Mengirim pesan teks...');
            const result = await sendText(page, formattedPhoneNumber, processedIsi); // Langsung ke sendText
            responseMessage = result.success ? 'Terkirim' : `Gagal: ${result.message}`;
        } else {
            console.log('Mengirim pesan gambar...');
            const result = await sendImage(page, formattedPhoneNumber, pic, processedIsi); // Langsung ke sendImage
            responseMessage = result.success ? 'Terkirim' : `Gagal: ${result.message}`;
        }

        // Update database setelah pengiriman
        console.log('Mengupdate database setelah pengiriman...');
        const updateQuery = `
            UPDATE crm_h2
            SET sentdate = NOW(), resp = ?
            WHERE idcrm = ?
        `;
        await conn.query(updateQuery, [responseMessage, idcrm]);

        console.log('Pesan berhasil diproses dan database diperbarui.');

    } catch (error) {
        console.error('Gagal memproses pesan:', error.message);
    } finally {
        if (conn) conn.end(); // Tutup koneksi database
    }
};

module.exports = { processMessage };
