const mariadb = require('mariadb');

// Konfigurasi koneksi database
const pool = mariadb.createPool({
    host: '149.129.242.215',
    user: 'hondacsa_cakra',
    password: 'Ahmids123456',
    database: 'hondacsa_yos',
    connectionLimit: 5,
});

// Fungsi untuk mendapatkan koneksi
const getConnection = async () => {
    try {
        return await pool.getConnection();
    } catch (error) {
        console.error('Gagal mendapatkan koneksi ke database:', error.message);
        throw error;
    }
};

module.exports = { getConnection };
