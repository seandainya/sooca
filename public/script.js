document.getElementById('webhook-form').addEventListener('submit', async function(event) {
  event.preventDefault();

  // Gunakan ID yang konsisten dengan HTML
  const contentInput = document.getElementById('content-input');
  const content = contentInput.value;
  const responseContainer = document.getElementById('response-container');
  const submitButton = document.getElementById('submit-button'); // Asumsi tombol submit punya ID ini

  // UI Feedback
  responseContainer.textContent = 'Mengirim...';
  if (submitButton) submitButton.disabled = true;

  try {
    const response = await fetch('/send-to-n8n', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      // KIRIM DENGAN KEY 'content'
      body: JSON.stringify({ content: content })
    });

    const result = await response.json();

    if (response.ok) {
      responseContainer.textContent = 'Sukses: ' + (result.message || 'Data berhasil dikirim!');
      contentInput.value = ''; // Kosongkan input setelah berhasil
    } else {
      // Tampilkan pesan error dari server
      responseContainer.textContent = 'Error: ' + (result.error || 'Terjadi kesalahan.');
    }
  } catch (error) {
    responseContainer.textContent = 'Gagal terhubung ke server.';
    console.error('Error:', error);
  } finally {
    if (submitButton) submitButton.disabled = false;
  }
});
