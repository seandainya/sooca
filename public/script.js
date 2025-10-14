document.addEventListener('DOMContentLoaded', () => {
    // --- KONFIGURASI WORKFLOW ---
    const workflows = {
        'optimizer': {
            name: 'AI Content Optimizer',
            webhookPath: '/webhook/content-analyst',
            formHTML: `
                <div class="space-y-6">
                    <div><label for="url" class="block text-sm font-medium text-gray-700">URL</label><input type="url" id="url" name="url" class="w-full p-3 border rounded-md" required></div>
                    <div><label for="keyword" class="block text-sm font-medium text-gray-700">Keyword</label><input type="text" id="keyword" name="keyword" class="w-full p-3 border rounded-md" required></div>
                    <div><label for="gl" class="block text-sm font-medium text-gray-700">Negara</label><select id="gl" name="gl" class="w-full p-3 border rounded-md" required><option value="AU">Australia</option><option value="ID">Indonesia</option></select></div>
                    <div><label for="hl" class="block text-sm font-medium text-gray-700">Bahasa</label><select id="hl" name="hl" class="w-full p-3 border rounded-md" required><option value="en">English (en)</option><option value="id">Bahasa Indonesia (id)</option></select></div>
                    <button type="submit" class="w-full bg-blue-600 text-white font-semibold py-3 px-4 rounded-md">Optimize Content</button>
                </div>
            `
        },
        'executor': {
            name: 'Action Executor',
            webhookPath: '/webhook/execute-action',
            formHTML: `
                <div class="space-y-6">
                    <div><label for="toDoKey" class="block text-sm font-medium text-gray-700">ToDoKey</label><input type="text" id="toDoKey" name="toDoKey" class="w-full p-3 border rounded-md" placeholder="IssueType|Keyword|Page..." required></div>
                    <button type="submit" class="w-full bg-green-600 text-white font-semibold py-3 px-4 rounded-md">Execute Action</button>
                </div>
            `
        }
        // Tambahkan konfigurasi workflow lain di sini
    };

    const formContainer = document.getElementById('form-container');
    const navButtons = document.querySelectorAll('.nav-button');
    let currentWorkflow = 'optimizer';

    function renderForm(workflowId) {
        currentWorkflow = workflowId;
        const wf = workflows[workflowId];
        formContainer.innerHTML = `<h2 class="text-2xl font-semibold text-center mb-6">${wf.name}</h2><form id="workflow-form">${wf.formHTML}</form>`;

        // Attach submit listener to the new form
        document.getElementById('workflow-form').addEventListener('submit', handleFormSubmit);

        // Update nav button styles
        navButtons.forEach(btn => {
            if (btn.dataset.workflow === workflowId) {
                btn.classList.add('bg-blue-500', 'text-white');
                btn.classList.remove('text-gray-600');
            } else {
                btn.classList.remove('bg-blue-500', 'text-white');
                btn.classList.add('text-gray-600');
            }
        });
    }

    async function handleFormSubmit(e) {
        e.preventDefault();
        const form = e.target;
        const submitButton = form.querySelector('button[type="submit"]');
        submitButton.disabled = true;
        submitButton.textContent = 'Processing...';

        const formData = Object.fromEntries(new FormData(form).entries());
        const webhookPath = workflows[currentWorkflow].webhookPath;

        try {
            const response = await fetch('/api/ai-studio', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ webhookPath, formData })
            });

            const result = await response.json();

            // ... (Kode untuk menampilkan hasil/error seperti sebelumnya)
            const responseContainer = document.getElementById('response-container');
            const aiResultContainer = document.getElementById('ai-result-container');
            if (!response.ok) throw new Error(result.error || 'Request failed');

            responseContainer.innerHTML = `<div class="bg-green-100 text-green-800 p-4 rounded-md">${result.message}</div>`;
            if (result.n8nResponse && result.n8nResponse.aiResponse) {
                aiResultContainer.innerHTML = marked.parse(result.n8nResponse.aiResponse);
                aiResultContainer.classList.remove('hidden');
            }

        } catch (error) {
            document.getElementById('response-container').innerHTML = `<div class="bg-red-100 text-red-800 p-4 rounded-md">Error: ${error.message}</div>`;
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = form.querySelector('button[type="submit"]').textContent; // Restore original text
        }
    }

    // Nav button click listeners
    navButtons.forEach(button => {
        button.addEventListener('click', () => renderForm(button.dataset.workflow));
    });

    // Initial render
    renderForm('optimizer');
});