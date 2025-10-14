export default async function handler(request, response) {
    // Langsung kirim balik nilai environment variables yang dibaca oleh server
    const envData = {
        N8N_BASE_URL_IS_PRESENT: !!process.env.N8N_BASE_URL,
        N8N_USERNAME_IS_PRESENT: !!process.env.N8N_USERNAME,
        N8N_PASSWORD_IS_PRESENT: !!process.env.N8N_PASSWORD,
        // Untuk melihat beberapa karakter pertama dari nilainya (aman)
        N8N_BASE_URL_VALUE_START: process.env.N8N_BASE_URL ? process.env.N8N_BASE_URL.substring(0, 15) : null,
    };

    return response.status(200).json({
        message: "Debugging Environment Variables",
        readValues: envData
    });
}