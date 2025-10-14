export default async function handler(request, response) {
    if (request.method !== 'POST') {
        return response.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        // Ambil path webhook dan data form dari body request
        const { webhookPath, formData } = request.body;

        if (!webhookPath || !formData) {
            return response.status(400).json({ error: 'webhookPath and formData are required.' });
        }

        const baseURL = process.env.N8N_BASE_URL;
        const username = process.env.N8N_USERNAME;
        const password = process.env.N8N_PASSWORD;

        if (!baseURL || !username || !password) {
            return response.status(500).json({ error: 'Server configuration error.' });
        }

        // Gabungkan base URL dengan path spesifik
        const fullWebhookUrl = `${baseURL.replace(/\/$/, '')}${webhookPath}`;

        const credentials = Buffer.from(`${username}:${password}`).toString('base64');

        const n8nResponse = await fetch(fullWebhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${credentials}`,
            },
            body: JSON.stringify(formData), // Kirim hanya data form
        });

        const responseText = await n8nResponse.text();
        if (!responseText) {
            return response.status(200).json({ message: 'Request sent to n8n, but no content was returned.' });
        }

        const n8nData = JSON.parse(responseText);

        if (!n8nResponse.ok) {
            return response.status(n8nResponse.status).json({ error: 'Failed to trigger n8n webhook', details: n8nData });
        }

        return response.status(200).json({
            message: 'Workflow executed successfully!',
            n8nResponse: n8nData
        });

    } catch (error) {
        return response.status(500).json({ error: 'An internal server error occurred', details: error.message });
    }
}