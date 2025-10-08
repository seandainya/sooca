// File: api/send-to-n8n.js

/**
 * Vercel Serverless Function Handler
 * Endpoint ini menerima request POST dari frontend, menambahkan otentikasi,
 * dan meneruskannya ke webhook n8n.
 *
 * @param {import('@vercel/node').VercelRequest} request - Objek request masuk.
 * @param {import('@vercel/node').VercelResponse} response - Objek untuk mengirim respons.
 */
export default async function handler(request, response) {
  // Langkah 1: Validasi metode HTTP. Hanya izinkan POST.
  if (request.method !== 'POST') {
    response.setHeader('Allow', ['POST']);
    return response.status(405).json({ error: `Method ${request.method} Not Allowed` });
  }

  try {
    // Langkah 2: Ekstrak data 'content' dari body request.
    const { content } = request.body;

    // Validasi apakah 'content' ada.
    if (!content) {
      return response.status(400).json({ error: 'Content is required in the request body' });
    }

    // Langkah 3: Ambil kredensial n8n dari Environment Variables.
    // Ini adalah cara yang aman karena variabel ini tidak terekspos ke client-side.
    const webhookUrl = process.env.N8N_WEBHOOK_URL;
    const username = process.env.N8N_USERNAME;
    const password = process.env.N8N_PASSWORD;

    // Validasi konfigurasi server.
    if (!webhookUrl || !username || !password) {
      console.error('FATAL: Missing n8n environment variables on the server.');
      return response.status(500).json({ error: 'Server configuration error. Please contact the administrator.' });
    }

    // Langkah 4: Siapkan header untuk Basic Authentication.
    const credentials = Buffer.from(`${username}:${password}`).toString('base64');
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Basic ${credentials}`,
    };

    // Langkah 5: Kirim request ke n8n menggunakan `fetch` (bawaan Node.js >= 18).
    const n8nResponse = await fetch(webhookUrl, {
      method: 'POST',
      headers: headers,
      // Kirim data dalam format yang diharapkan oleh workflow n8n Anda.
      // Di sini kita mengirim objek dengan key 'textContent'.
      body: JSON.stringify({ textContent: content }),
    });
    
    // Ambil data respons dari n8n (bahkan jika gagal, mungkin ada pesan error).
    const n8nData = await n8nResponse.json();

    // Langkah 6: Periksa status respons dari n8n.
    if (!n8nResponse.ok) {
      console.error(`Error from n8n webhook (Status: ${n8nResponse.status}):`, n8nData);
      // Teruskan status error dan detail dari n8n ke frontend.
      return response.status(n8nResponse.status).json({ 
        error: 'Failed to trigger n8n webhook', 
        details: n8nData 
      });
    }
    
    // Langkah 7: Jika berhasil, kirim respons sukses 200 ke frontend.
    return response.status(200).json({ 
      message: 'Webhook triggered successfully!', 
      n8nResponse: n8nData 
    });

  } catch (error) {
    // Tangani error tak terduga (misalnya, JSON parsing error, network issue).
    console.error('Unexpected error in serverless function:', error);
    return response.status(500).json({ error: 'An internal server error occurred' });
  }
}
