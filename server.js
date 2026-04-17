const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Konfigurasi Database PostgreSQL (Cloud)
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false // Wajib untuk sebagian besar cloud DB gratis
    }
});

// Inisialisasi & Migrasi Tabel (Otomatis saat server jalan)
const initDB = async () => {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS absensi (
                id SERIAL PRIMARY KEY,
                nis VARCHAR(50) NOT NULL,
                nama VARCHAR(255) NOT NULL,
                waktu TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                status VARCHAR(50) NOT NULL
            )
        `);
        console.log('[DATABASE] Tabel terverifikasi di Cloud PostgreSQL.');
    } catch (err) {
        console.error('[DATABASE ERROR]', err);
    }
};
initDB();

// RESTful API Endpoints
// GET: Mengambil data
app.get('/api/absensi', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM absensi ORDER BY waktu DESC');
        res.json({ data: result.rows });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST: Mencatat data
app.post('/api/absensi', async (req, res) => {
    const { nis, nama, status } = req.body;
    if (!nis || !nama || !status) {
        return res.status(400).json({ error: 'Validasi gagal: Data tidak lengkap' });
    }

    try {
        const result = await pool.query(
            'INSERT INTO absensi (nis, nama, status) VALUES ($1, $2, $3) RETURNING id',
            [nis, nama, status]
        );
        res.status(201).json({ 
            success: true, 
            id: result.rows[0].id, 
            message: 'Kehadiran berhasil dicatat di cloud.' 
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(PORT, () => {
    console.log(`[SERVICE] Server aktif di port ${PORT}`);
});
