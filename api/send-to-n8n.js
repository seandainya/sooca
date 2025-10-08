// api/send-to-n8n.js

// Ekspor handler function yang akan dieksekusi oleh Vercel
export default async function handler(request, response) {
  // Hanya izinkan metode POST
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // 1. Ambil data dari body request yang dikirim frontend
    const { content } = request.body;

    if (!content) {
      return response.status(400).json({ error: 'Content is required' });
    }

    // 2. Ambil kredensial dari Environment Variables (konfigurasi di Vercel UI)
    const webhookUrl = process.env.N8N_WEBHOOK_URL;
    const username = process.env.N8N_USERNAME;
    const password = process.env.N8N_PASSWORD;

    if (!webhookUrl || !username || !password) {
      console.error('Missing n8n environment variables');
      return response.status(500).json({ error: 'Server configuration error' });
    }

    // 3. Buat header Basic Authentication
    const credentials = Buffer.from(`${username}:${password}`).toString('base64');
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Basic ${credentials}`,
    };

    // 4. Kirim request ke webhook n8n menggunakan fetch
    const n8nResponse = await fetch(webhookUrl, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({ textContent: content }), // Sesuaikan key jika perlu
    });
    
    // Ambil respons dari n8n untuk diteruskan kembali
    const n8nData = await n8nResponse.json();

    // 5. Periksa apakah request ke n8n berhasil
    if (!n8nResponse.ok) {
      console.error('Error from n8n webhook:', n8nData);
      // Teruskan status error dari n8n ke client
      return response.status(n8nResponse.status).json({ 
        error: 'Failed to trigger n8n webhook', 
        details: n8nData 
      });
    }
    
    // 6. Kirim respons sukses kembali ke frontend
    return response.status(200).json({ 
      message: 'Webhook triggered successfully!', 
      n8nResponse: n8nData 
    });

  } catch (error) {
    console.error('Error in serverless function:', error);
    return response.status(500).json({ error: 'An internal server error occurred' });
  }
}
