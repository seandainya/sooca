document.getElementById('webhook-form').addEventListener('submit', async function(event) {
  event.preventDefault();

  const message = document.getElementById('message').value;
  const responseContainer = document.getElementById('response-container');
  responseContainer.textContent = 'Mengirim...';

  try {
    // Mengirim data ke backend proxy kita, BUKAN langsung ke n8n
    const response = await fetch('/send-to-n8n', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ message: message }) // Data yang ingin dikirim
    });

    const result = await response.json();

    if (response.ok) {
      responseContainer.textContent = 'Sukses: ' + result.message;
    } else {
      responseContainer.textContent = 'Error: ' + result.message;
    }
  } catch (error) {
    responseContainer.textContent = 'Gagal terhubung ke server.';
    console.error('Error:', error);
  }
});
