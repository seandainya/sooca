export default async function handler(request, response) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', ['POST']);
    return response.status(405).json({ error: `Method ${request.method} Not Allowed` });
  }

  try {
    const { url, keyword, country } = request.body;

    if (!url || !keyword || !country) {
      return response.status(400).json({ error: 'URL, Keyword, and Country are required.' });
    }

    const webhookUrl = process.env.N8N_WEBHOOK_URL;
    const username = process.env.N8N_USERNAME;
    const password = process.env.N8N_PASSWORD;

    if (!webhookUrl || !username || !password) {
      console.error('FATAL: Missing n8n environment variables on the server.');
      return response.status(500).json({ error: 'Server configuration error.' });
    }

    const credentials = Buffer.from(`${username}:${password}`).toString('base64');
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Basic ${credentials}`,
    };

    const n8nResponse = await fetch(webhookUrl, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({ url, keyword, country }),
    });

    // Cek jika body respons kosong
    const responseText = await n8nResponse.text();
    if (!responseText) {
      // Jika n8n tidak mengirim balik body, anggap sukses tapi beri pesan
      return response.status(200).json({
        message: 'Request sent to n8n, but no content was returned.',
        n8nResponse: { aiResponse: "Workflow processed. No specific data returned." }
      });
    }

    const n8nData = JSON.parse(responseText);

    if (!n8nResponse.ok) {
      console.error(`Error from n8n (Status: ${n8nResponse.status}):`, n8nData);
      return response.status(n8nResponse.status).json({
        error: 'Failed to trigger n8n webhook',
        details: n8nData
      });
    }

    return response.status(200).json({
      message: 'Workflow executed successfully!',
      n8nResponse: n8nData
    });

  } catch (error) {
    console.error('Unexpected error in function:', error);
    // Cek apakah error karena parsing JSON
    if (error instanceof SyntaxError) {
      return response.status(500).json({ error: "Received an invalid response from the workflow server." });
    }
    return response.status(500).json({ error: 'An internal server error occurred' });
  }
}