// File: public/script.js
document.addEventListener('DOMContentLoaded', () => {
    // ... (ambil elemen form, button, dll. seperti sebelumnya)
    const contentInput = document.getElementById('content-input');
    const responseContainer = document.getElementById('response-container');
    const aiResultContainer = document.getElementById('ai-result-container'); // Ambil container baru
    const form = document.getElementById('webhook-form');
    const submitButton = document.getElementById('submit-button');


    form.addEventListener('submit', async (event) => {
        event.preventDefault();

        const contentValue = contentInput.value;

        // UI Feedback - Reset tampilan sebelum mengirim
        submitButton.disabled = true;
        submitButton.innerHTML = `
            <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Processing...`;
        responseContainer.innerHTML = '';
        aiResultContainer.textContent = ''; // Kosongkan hasil AI sebelumnya
        aiResultContainer.classList.add('hidden'); // Sembunyikan container

        try {
            const response = await fetch('/send-to-n8n', { /* ... (method, headers) ... */
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ content: contentValue })
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || `Request failed with status ${response.status}`);
            }

            // --- INI BAGIAN BARUNYA ---
            // Cek apakah ada respons dari n8n dan ada properti aiResponse di dalamnya
            if (result.n8nResponse && result.n8nResponse.aiResponse) {
                responseContainer.innerHTML = `<div class="bg-green-100 text-green-800 p-4 rounded-md">${result.message}</div>`;

                // Tampilkan hasil AI di container yang baru
                aiResultContainer.textContent = result.n8nResponse.aiResponse;
                aiResultContainer.classList.remove('hidden'); // Tampilkan kembali container
            } else {
                // Jika tidak ada respons AI, tampilkan pesan error
                throw new Error("AI response not found in the server's reply.");
            }

        } catch (error) {
            responseContainer.innerHTML = `<div class="bg-red-100 text-red-800 p-4 rounded-md">Error: ${error.message}</div>`;
            console.error('Fetch error:', error);
        } finally {
            submitButton.disabled = false;
            submitButton.innerHTML = 'Trigger Webhook';
        }
    });
});