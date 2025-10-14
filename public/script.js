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
        currentWorkflowId = workflowId;
        const wf = workflows[workflowId];
        if (!wf) return;

        formContainer.innerHTML = `<h2 class="text-2xl font-semibold text-center mb-6">${wf.name}</h2><form id="workflow-form">${wf.formHTML}</form>`;

        const newForm = document.getElementById('workflow-form');
        if (newForm) {
            newForm.addEventListener('submit', handleFormSubmit);
        }

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

            // --- LOGIKA BARU YANG LEBIH PINTAR ---
            let markdownContent = null;

            if (result.n8nResponse) {
                // Cek properti dari workflow Optimizer
                if (result.n8nResponse.aiResponse) {
                    markdownContent = result.n8nResponse.aiResponse;
                }
                // Cek properti dari workflow Executor (setelah direvisi)
                else if (result.n8nResponse.revisedArticle) {
                    markdownContent = result.n8nResponse.revisedArticle;
                }
                // Cek properti output AI Agent standar
                else if (result.n8nResponse.output) {
                    markdownContent = result.n8nResponse.output;
                }
            }

            if (markdownContent && typeof markdownContent === 'string') {
                aiResultContainer.innerHTML = marked.parse(markdownContent);
                aiResultContainer.classList.remove('hidden');
            } else if (result.n8nResponse) {
                // Fallback: Tampilkan JSON mentah jika tidak ada konten Markdown
                aiResultContainer.innerHTML = `<pre class="bg-gray-800 text-white p-4 rounded-md text-sm"><code>${JSON.stringify(result.n8nResponse, null, 2)}</code></pre>`;
                aiResultContainer.classList.remove('hidden');
            }

        } catch (error) {
            responseContainer.innerHTML = `<div class="bg-red-100 text-red-800 p-4 rounded-md"><b>Error:</b> ${error.message}</div>`;
            console.error('Fetch error details:', error);
        } finally {
            submitButton.disabled = false;
            submitButton.innerHTML = originalButtonText;
        }
    }

    navButtons.forEach(button => {
        button.addEventListener('click', () => renderForm(button.dataset.workflow));
    });

    renderForm('optimizer');

});