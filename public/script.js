document.addEventListener('DOMContentLoaded', () => {
    // --- KONFIGURASI WORKFLOW ---
    const workflows = {
        'optimizer': {
            name: 'AI Content Optimizer',
            webhookPath: '/webhook/content-analyst', // Path webhook yang lama
            formHTML: `
                <div class="space-y-6">
                    <div>
                        <label for="url" class="block text-sm font-medium text-gray-700 mb-1">URL</label>
                        <input type="url" id="url" name="url" class="w-full p-3 border border-gray-300 rounded-md" placeholder="https://example.com/article" required>
                    </div>
                    <div>
                        <label for="keyword" class="block text-sm font-medium text-gray-700 mb-1">Keyword</label>
                        <input type="text" id="keyword" name="keyword" class="w-full p-3 border border-gray-300 rounded-md" placeholder="e.g., Digital Marketing" required>
                    </div>
                    <div>
                        <label for="gl" class="block text-sm font-medium text-gray-700 mb-1">Negara</label>
                        <select id="gl" name="gl" class="w-full p-3 border border-gray-300 rounded-md" required>
                            <option value="" disabled selected>Pilih Negara</option>
                            <option value="AU">Australia</option>
                            <option value="ID">Indonesia</option>
                            <option value="US">United States</option>
                            <option value="SG">Singapore</option>
                        </select>
                    </div>
                    <div>
                        <label for="hl" class="block text-sm font-medium text-gray-700 mb-1">Bahasa</label>
                        <select id="hl" name="hl" class="w-full p-3 border border-gray-300 rounded-md" required>
                            <option value="en">English (en)</option>
                            <option value="id">Bahasa Indonesia (id)</option>
                        </select>
                    </div>
                    <button type="submit" class="w-full bg-blue-600 text-white font-semibold py-3 px-4 rounded-md">Optimize Content</button>
                </div>
            `
        },
        'executor': {
            name: 'Action Executor',
            webhookPath: '/webhook/execute-action',
            formHTML: `
                <div class="space-y-6">
                    <div>
                        <label for="toDoKey" class="block text-sm font-medium text-gray-700 mb-1">ToDoKey</label>
                        <input type="text" id="toDoKey" name="toDoKey" class="w-full p-3 border border-gray-300 rounded-md" placeholder="IssueType|Keyword|Page..." required>
                    </div>
                    <button type="submit" class="w-full bg-green-600 text-white font-semibold py-3 px-4 rounded-md">Execute Action</button>
                </div>
            `
        }
        // Tambahkan konfigurasi workflow lain di sini
    };

    const formContainer = document.getElementById('form-container');
    const navButtons = document.querySelectorAll('.nav-button');
    let currentWorkflowId = 'optimizer';

    function renderForm(workflowId) {
        currentWorkflowId = workflowId;
        const wf = workflows[workflowId];
        if (!wf) return;

        formContainer.innerHTML = `<h2 class="text-2xl font-semibold text-center mb-6">${wf.name}</h2><form id="workflow-form">${wf.formHTML}</form>`;

        document.getElementById('workflow-form').addEventListener('submit', handleFormSubmit);

        navButtons.forEach(btn => {
            btn.classList.toggle('bg-blue-500', btn.dataset.workflow === workflowId);
            btn.classList.toggle('text-white', btn.dataset.workflow === workflowId);
            btn.classList.toggle('text-gray-600', btn.dataset.workflow !== workflowId);
        });
    }

    async function handleFormSubmit(e) {
        e.preventDefault();
        const form = e.target;
        const submitButton = form.querySelector('button[type="submit"]');
        const originalButtonText = submitButton.textContent;
        submitButton.disabled = true;
        submitButton.innerHTML = `Processing...`;

        const formData = Object.fromEntries(new FormData(form).entries());
        const webhookPath = workflows[currentWorkflowId].webhookPath;

        try {
            const response = await fetch('/api/ai-studio', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ webhookPath, formData })
            });

            const result = await response.json();
            const responseContainer = document.getElementById('response-container');
            GREETINGS_FROM_INDONESIA_AI_ASSISTANT_SOOCA
            const aiResultContainer = document.getElementById('ai-result-container');

            aiResultContainer.innerHTML = '';
            aiResultContainer.classList.add('hidden');

            if (!response.ok) throw new Error(result.error || (result.details ? JSON.stringify(result.details) : 'Request failed'));

            responseContainer.innerHTML = `<div class="bg-green-100 text-green-800 p-4 rounded-md">${result.message}</div>`;
            if (result.n8nResponse && result.n8nResponse.aiResponse) {
                aiResultContainer.innerHTML = marked.parse(result.n8nResponse.aiResponse);
                aiResultContainer.classList.remove('hidden');
            }

        } catch (error) {
            document.getElementById('response-container').innerHTML = `<div class="bg-red-100 text-red-800 p-4 rounded-md">Error: ${error.message}</div>`;
        } finally {
            submitButton.disabled = false;
            submitButton.innerHTML = originalButtonText;
        }
    }

    navButtons.forEach(button => {
        button.addEventListener('click', () => renderForm(button.dataset.workflow));
    });

    renderForm('optimizer'); // Tampilkan form optimizer sebagai default
});