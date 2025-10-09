document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('webhook-form');
    if (!form) {
        console.error("Form with id 'webhook-form' not found!");
        return;
    }

    const urlInput = document.getElementById('url-input');
    const keywordInput = document.getElementById('keyword-input');
    const countrySelect = document.getElementById('country-select');
    const submitButton = document.getElementById('submit-button');
    const responseContainer = document.getElementById('response-container');
    const aiResultContainer = document.getElementById('ai-result-container');

    form.addEventListener('submit', async (event) => {
        event.preventDefault();

        const url = urlInput.value;
        const keyword = keywordInput.value;
        const gl = countrySelect.value;

        submitButton.disabled = true;
        submitButton.innerHTML = `
            <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0.0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Processing...`;
        responseContainer.innerHTML = '';
        aiResultContainer.innerHTML = ''; // Gunakan innerHTML agar bisa di-reset
        aiResultContainer.classList.add('hidden');

        try {
            const response = await fetch('/send-to-n8n', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ url, keyword, gl }),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || `Request failed with status ${response.status}`);
            }

            if (result.n8nResponse && result.n8nResponse.aiResponse) {
                responseContainer.innerHTML = `<div class="bg-green-100 text-green-800 p-4 rounded-md">${result.message}</div>`;

                // --- PERUBAHAN DI SINI ---
                // 1. Ambil teks Markdown dari respons AI
                const markdownText = result.n8nResponse.aiResponse;

                // 2. Ubah Markdown menjadi HTML menggunakan library marked.js
                const htmlOutput = marked.parse(markdownText);

                // 3. Tampilkan hasilnya sebagai HTML, bukan teks biasa
                aiResultContainer.innerHTML = htmlOutput;
                aiResultContainer.classList.remove('hidden');

            } else {
                throw new Error("AI response not found in the server's reply.");
            }

        } catch (error) {
            responseContainer.innerHTML = `<div class="bg-red-100 text-red-800 p-4 rounded-md">Error: ${error.message}</div>`;
            console.error('Fetch error:', error);
        } finally {
            submitButton.disabled = false;
            submitButton.innerHTML = 'Optimize Content';
        }
    });
});