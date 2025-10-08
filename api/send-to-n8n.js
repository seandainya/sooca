// File: api/send-to-n8n.js
export default async function handler(request, response) {
  // Hanya izinkan metode POST
  if (request.method !== 'POST') {
    response.setHeader('Allow', ['POST']);
    return response.status(405).json({ error: `Method ${request.method} Not Allowed` });
  }

  // --- START DEBUGGING LOGS ---
  console.log("--- New Request Received ---");
  console.log("Request Method:", request.method);
  console.log("Request Headers:", request.headers);
  console.log("Raw Request Body:", request.body);
  // --- END DEBUGGING LOGS ---

  try {
    const body = request.body;

    // Cek apakah body ada dan merupakan objek
    if (!body || typeof body !== 'object') {
        console.error("Validation failed: Request body is missing or not an object.");
        return response.status(400).json({ error: 'Invalid request body: expected a JSON object.' });
    }

    const { content } = body;

    // Cek apakah 'content' ada di dalam body
    if (content === undefined) {
        console.error("Validation failed: 'content' key is missing from request body.");
        return response.status(400).json({ error: "'content' key is required in the request body" });
    }

    // Ambil kredensial (seperti sebelumnya)
    const webhookUrl = process.env.N8N_WEBHOOK_URL;
    const username = process.env.N8N_USERNAME;
    const password = process.env.N8N_PASSWORD;

    if (!webhookUrl || !username || !password) {
      console.error('FATAL: Missing n8n environment variables on the server.');
      return response.status(500).json({ error: 'Server configuration error.' });
    }

    // Kirim ke n8n (seperti sebelumnya)
    const credentials = Buffer.from(`${username}:${password}`).toString('base64');
    const n8nResponse = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${credentials}`,
      },
      body: JSON.stringify({ textContent: content }),
    });
    
    const n8nData = await n8nResponse.json();

    if (!n8nResponse.ok) {
      console.error(`Error from n8n (Status: ${n8nResponse.status}):`, n8nData);
      return response.status(n8nResponse.status).json({ 
        error: 'Failed to trigger n8n webhook', 
        details: n8nData 
      });
    }
    
    return response.status(200).json({ 
      message: 'Webhook triggered successfully!', 
      n8nResponse: n8nData 
    });

  } catch (error) {
    console.error('Unexpected error in function:', error);
    return response.status(500).json({ error: 'An internal server error occurred' });
  }
}
