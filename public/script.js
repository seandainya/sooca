document.addEventListener('DOMContentLoaded', () => {
    // --- KONFIGURASI WORKFLOW ---
    const workflows = {
        'optimizer': {
            name: 'AI Content Optimizer',
            webhookPath: '/webhook/content-analyst',
            formHTML: `
                <div class="space-y-6">
                    <div><label for="url" class="block text-sm font-medium text-gray-700 mb-1">URL</label><input type="url" id="url" name="url" class="w-full p-3 border border-gray-300 rounded-md" placeholder="https://example.com/article" required></div>
                    <div><label for="keyword" class="block text-sm font-medium text-gray-700 mb-1">Keyword</label><input type="text" id="keyword" name="keyword" class="w-full p-3 border border-gray-300 rounded-md" placeholder="e.g., Digital Marketing" required></div>
                    <div><label for="gl" class="block text-sm font-medium text-gray-700 mb-1">Negara</label><select id="gl" name="gl" class="w-full p-3 border border-gray-300 rounded-md" required><option value="" disabled selected>Pilih Negara</option><option value="AU">Australia</option><option value="ID">Indonesia</option><option value="US">United States</option><option value="SG">Singapore</option></select></div>
                    <div><label for="hl" class="block text-sm font-medium text-gray-700 mb-1">Bahasa</label><select id="hl" name="hl" class="w-full p-3 border border-gray-300 rounded-md" required><option value="en">English (en)</option><option value="id">Bahasa Indonesia (id)</option></select></div>
                    <button type="submit" class="w-full bg-blue-600 text-white font-semibold py-3 px-4 rounded-md">Optimize Content</button>
                </div>
            `
        },
        'executor': {
            name: 'Action Executor',
            webhookPath: '/webhook/execute-action',
            formHTML: `
                <div class="space-y-6">
                    <div><label for="toDoKey" class="block text-sm font-medium text-gray-700 mb-1">ToDoKey</label><input type="text" id="toDoKey" name="toDoKey" class="w-full p-3 border border-gray-300 rounded-md" placeholder="IssueType|Keyword|Page..." required></div>
                    <button type="submit" class="w-full bg-green-600 text-white font-semibold py-3 px-4 rounded-md">Execute Action</button>
                </div>
            `
        }
    };

    const formContainer = document.getElementById('form-container');
    const navButtons = document.querySelectorAll('.nav-button');
    let currentWorkflowId = 'optimizer';

    function renderForm(workflowId) {
        // ... (Fungsi renderForm tetap sama seperti sebelumnya)
        currentWorkflowId = workflowId;
        const wf = workflows[workflowId];
        if (!wf) return;
        formContainer.innerHTML = `<h2 class="text-2xl font-semibold text-center mb-6">${wf.name}</h2><form id="workflow-form">${wf.formHTML}</form>`;
        const newForm = document.getElementById('workflow-form');
        if (newForm) newForm.addEventListener('submit', handleFormSubmit);
        navButtons.forEach(btn => {
            const isSelected = btn.dataset.workflow === workflowId;
            btn.classList.toggle('bg-blue-500', isSelected);
            btn.classList.toggle('text-white', isSelected);
            btn.classList.toggle('text-gray-600', !isSelected);
        });
    }

    async function handleFormSubmit(e) {
        e.preventDefault();
        const form = e.target;
        const submitButton = form.querySelector('button[type="submit"]');
        const originalButtonText = submitButton.textContent;
        submitButton.disabled = true;
        submitButton.innerHTML = `Processing...`;

        const responseContainer = document.getElementById('response-container');
        const aiResultContainer = document.getElementById('ai-result-container');
        responseContainer.innerHTML = '';
        aiResultContainer.innerHTML = '';
        aiResultContainer.classList.add('hidden');

        const formData = Object.fromEntries(new FormData(form).entries());
        const webhookPath = workflows[currentWorkflowId].webhookPath;

        try {
            const response = await fetch('/api/ai-studio', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ webhookPath, formData })
            });

            const result = await response.json();

            if (!response.ok) {
                const errorMessage = result.error || (result.details ? JSON.stringify(result.details) : 'Request failed');
                throw new Error(errorMessage);
            }

            responseContainer.innerHTML = `<div class="bg-green-100 text-green-800 p-4 rounded-md">${result.message || 'Success!'}</div>`;

            const n8nData = result.n8nResponse;

            if (n8nData) {
                // Prioritaskan render output terstruktur jika ada
                if (n8nData.titleRecommendations && n8nData.revisedContent) {
                    renderStructuredOutput(n8nData);
                }
                // Fallback untuk output lama (Markdown tunggal)
                else {
                    const markdownContent = n8nData.aiResponse || n8nData.revisedArticle || n8nData.output || JSON.stringify(n8nData, null, 2);
                    if (typeof markdownContent === 'string') {
                        aiResultContainer.innerHTML = marked.parse(markdownContent);
                    } else {
                        aiResultContainer.innerHTML = `<pre><code>${JSON.stringify(markdownContent, null, 2)}</code></pre>`;
                    }
                    aiResultContainer.classList.remove('hidden');
                }
            }

        } catch (error) {
            responseContainer.innerHTML = `<div class="bg-red-100 text-red-800 p-4 rounded-md"><b>Error:</b> ${error.message}</div>`;
            console.error('Fetch error details:', error);
        } finally {
            submitButton.disabled = false;
            submitButton.innerHTML = originalButtonText;
        }
    }

    // --- FUNGSI BARU UNTUK MERENDER OUTPUT TERSTRUKTUR ---
    function renderStructuredOutput(data) {
        const container = document.getElementById('ai-result-container');
        let html = '';

        // 1. Rekomendasi Judul
        if (data.titleRecommendations && data.titleRecommendations.length > 0) {
            html += `<h3 class="text-xl font-semibold mb-2 border-b pb-2">1. Rekomendasi Judul</h3><ul class="list-decimal list-inside pl-2 mb-6 space-y-2">`;
            data.titleRecommendations.forEach(item => {
                html += `<li class="p-2 bg-white border rounded">${item.title}</li>`;
            });
            html += `</ul>`;
        }

        // 2. Meta Deskripsi
        if (data.revisedMetaDescription) {
            html += `<h3 class="text-xl font-semibold mb-2 border-b pb-2">2. Revisi Meta Deskripsi</h3><p class="bg-white p-4 border rounded-md mb-6">${data.revisedMetaDescription}</p>`;
        }

        // 3. Konten yang Direvisi
        if (data.revisedContent) {
            html += `<h3 class="text-xl font-semibold mb-2 border-b pb-2">3. Konten yang Direvisi (Preview)</h3><div class="prose max-w-none mb-6 p-4 border rounded-md bg-white">${marked.parse(data.revisedContent)}</div>`;
        }

        // 4. FAQ
        if (data.faqSection && data.faqSection.questions.length > 0) {
            html += `<h3 class="text-xl font-semibold mb-2 border-b pb-2">4. ${data.faqSection.title || 'FAQ'}</h3><div class="space-y-4 mb-6">`;
            data.faqSection.questions.forEach(q => {
                html += `<details class="bg-white p-4 border rounded-md"><summary class="font-semibold cursor-pointer">${q.question}</summary><p class="mt-2 pl-4 text-gray-600">${q.answer}</p></details>`;
            });
            html += `</div>`;
        }

        // 5. Tautan Internal
        if (data.internalLinkSuggestions && data.internalLinkSuggestions.length > 0) {
            html += `<h3 class="text-xl font-semibold mb-2 border-b pb-2">5. Saran Tautan Internal</h3><ul class="list-disc pl-5 mb-6">`;
            data.internalLinkSuggestions.forEach(link => {
                html += `<li class="mb-1">Tautkan frasa "<b>${link.anchorText}</b>" ke: <a href="${link.targetUrl}" target="_blank" class="text-blue-600 hover:underline">${link.targetUrl}</a></li>`;
            });
            html += `</ul>`;
        }

        container.innerHTML = html;
        container.classList.remove('hidden');
    }

    navButtons.forEach(button => {
        button.addEventListener('click', () => renderForm(button.dataset.workflow));
    });

    renderForm('optimizer');
});