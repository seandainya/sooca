const axios = require('axios');
const cors = require('cors');

// Inisialisasi middleware CORS
const corsHandler = cors();

// Handler utama untuk serverless function
module.exports = (req, res) => {
    // Menjalankan CORS middleware
    corsHandler(req, res, async () => {
        // Hanya izinkan metode POST
        if (req.method !== 'POST') {
            return res.status(405).json({ message: 'Method Not Allowed' });
        }

        // Mengambil environment variables yang akan kita set di Vercel
        const webhookUrl = process.env.N8N_WEBHOOK_URL;
        const username = process.env.WEBHOOK_USERNAME;
        const password = process.env.WEBHOOK_PASSWORD;

        if (!webhookUrl || !username || !password) {
            return res.status(500).json({ error: 'Konfigurasi Environment Variable di Vercel belum lengkap.' });
        }

        try {
            // Meneruskan data dari frontend ke webhook n8n dengan header otentikasi
            const response = await axios.post(webhookUrl, req.body, {
                headers: {
                    'Content-Type': 'application/json',
                    [username]: password // Header dinamis dari environment variable
                }
            });

            res.status(200).json({ success: true, message: 'Data berhasil dikirim ke n8n!', n8n_response: response.data });
        } catch (error) {
            console.error('Error saat mengirim ke n8n:', error.message);
            res.status(500).json({ success: false, message: 'Gagal mengirim data ke n8n.' });
        }
    });
};
