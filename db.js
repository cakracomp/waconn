const mariadb = require('mariadb');

// Konfigurasi koneksi database
const pool = mariadb.createPool({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'yourdb',
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
