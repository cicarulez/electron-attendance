let selectedFileToDelete = null;

if (localStorage.getItem('darkMode') === '1') {
    document.body.classList.add('dark-mode');
}
if (localStorage.getItem('compactMode') === '1') {
    document.body.classList.add('small-app');
}

window.addEventListener('DOMContentLoaded', async () => {
    const logListEl = document.getElementById('logList');
    const files = await window.electronAPI.getLogFiles();

    if (files.length === 0) {
        logListEl.innerHTML = '<p class="text-muted text-center">No logs found.</p>';
        return;
    }

    const listGroup = document.createElement('div');
    listGroup.className = 'list-group';

    for (const file of files.sort().reverse()) {
        const data = await window.electronAPI.readLogFile(file);

        const date = new Date(data.timestamp);
        const formattedDate = date.toLocaleString(undefined, {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });

        const presentCount = data.people?.filter(p => p.present).length || 0;
        const duration = data.duration || 0;
        const label = `🕒 ${formattedDate} – 👥 ${presentCount} present – ⏱️ ${duration}s`;

        const container = document.createElement('div');
        container.className = 'list-group-item d-flex justify-content-between align-items-center';

        const viewBtn = document.createElement('button');
        viewBtn.className = 'btn btn-link text-start flex-grow-1 text-decoration-none';
        viewBtn.style.textAlign = 'left';
        viewBtn.textContent = label;
        viewBtn.onclick = () => {
            const formatted = JSON.stringify(data, null, 2);
            document.getElementById('logContent').textContent = formatted;
            const modal = new bootstrap.Modal(document.getElementById('logModal'));
            modal.show();
        };

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'btn btn-sm btn-outline-danger ms-2';
        deleteBtn.innerHTML = '🗑️';
        deleteBtn.onclick = () => {
            selectedFileToDelete = file;
            const confirmModal = new bootstrap.Modal(document.getElementById('confirmDeleteModal'));
            confirmModal.show();
        };

        container.appendChild(viewBtn);
        container.appendChild(deleteBtn);
        listGroup.appendChild(container);
    }

    logListEl.appendChild(listGroup);
});

document.getElementById('confirmDeleteBtn').addEventListener('click', async () => {
    if (selectedFileToDelete) {
        await window.electronAPI.deleteLogFile(selectedFileToDelete);
        location.reload();
    }
});
