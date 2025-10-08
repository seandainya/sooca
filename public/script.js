// File: public/script.js
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('webhook-form');
    if (!form) {
        console.error("Form with id 'webhook-form' not found!");
        return;
    }

    const contentInput = document.getElementById('content-input');
    const submitButton = document.getElementById('submit-button');
    const responseContainer = document.getElementById('response-container');

    form.addEventListener('submit', async (event) => {
        event.preventDefault();

        const contentValue = contentInput.value;
        
        // UI Feedback
        submitButton.disabled = true;
        submitButton.textContent = 'Sending...';
        responseContainer.innerHTML = '';

        try {
            // URL MENGGUNAKAN "source" DARI vercel.json
            const response = await fetch('/send-to-n8n', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                // BODY DI-STRINGIFY DAN MENGGUNAKAN KEY "content"
                body: JSON.stringify({ content: contentValue }),
            });

            const result = await response.json();

            if (!response.ok) {
                // Tampilkan error dari server
                throw new Error(result.error || `Request failed with status ${response.status}`);
            }

            responseContainer.innerHTML = `<div class="bg-green-100 text-green-800 p-4 rounded-md">${result.message}</div>`;
            contentInput.value = ''; // Kosongkan input
            
        } catch (error) {
            responseContainer.innerHTML = `<div class="bg-red-100 text-red-800 p-4 rounded-md">Error: ${error.message}</div>`;
            console.error('Fetch error:', error);
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = 'Trigger Webhook';
        }
    });
});
