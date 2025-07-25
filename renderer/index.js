(function applyInitialSettings() {
    if (localStorage.getItem('darkMode') === '1') {
        document.body.classList.add('dark-mode');
    }
    if (localStorage.getItem('compactMode') === '1') {
        document.body.classList.add('small-app');
    }

    const compact = localStorage.getItem('compactMode') === '1';
    const alwaysOnTop = localStorage.getItem('alwaysOnTop') === '1';

    window.electronAPI.restorePreferences({
        compactMode: compact,
        alwaysOnTop: alwaysOnTop
    });
})();


let people = [];
const state = {};
let isAllCollapsed = false;
let currentNotePersonId = null;
let editablePeople = null;

const renderLists = () => {
    const allList = document.getElementById('allList');
    const presentList = document.getElementById('presentList');
    const spokenList = document.getElementById('spokenList');
    allList.innerHTML = '';
    presentList.innerHTML = '';
    spokenList.innerHTML = '';

    const sortedPeople = [...people].sort((a, b) => a.name.localeCompare(b.name));

    sortedPeople.forEach(person => {
        const s = state[person.id] || {};
        const div = document.createElement('div');
        div.className = 'list-group-item d-flex justify-content-between align-items-center text-start';

        const name = document.createElement('span');
        name.textContent = person.name;
        name.classList.add('flex-grow-1', 'ms-2');

        if (!s.present) {
            div.onclick = () => {
                state[person.id] = { present: true };
                renderLists();
            };
            div.append(name);
            if (!isAllCollapsed) allList.appendChild(div);

        } else if (!s.interventionOrder) {
            const btn = document.createElement('span');
            btn.textContent = '💬';
            btn.style.cursor = 'pointer';
            btn.onclick = (e) => {
                e.stopPropagation();

                const usedOrders = Object.values(state)
                    .filter(x => x.interventionOrder)
                    .map(x => x.interventionOrder);
                let nextOrder = 1;
                while (usedOrders.includes(nextOrder)) nextOrder++;

                state[person.id].interventionOrder = nextOrder;
                state[person.id].interventionTime = new Date().toISOString();
                renderLists();
            };

            div.onclick = () => {
                if (!isAllCollapsed) {
                    delete state[person.id].present;
                    renderLists();
                }
            };

            div.append(name, btn);
            presentList.appendChild(div);
        }
    });


    const spoken = people
        .filter(p => state[p.id]?.interventionOrder)
        .sort((a, b) => state[a.id].interventionOrder - state[b.id].interventionOrder);

    spoken.forEach(person => {
        const s = state[person.id];
        const div = document.createElement('div');
        div.className = 'list-group-item d-flex justify-content-between align-items-center text-start';

        const name = document.createElement('span');
        name.textContent = person.name;
        name.classList.add('flex-grow-1', 'ms-2');

        const btn = document.createElement('span');
        btn.textContent = '🚫';
        btn.style.cursor = 'pointer';
        btn.onclick = (e) => {
            e.stopPropagation();

            delete state[person.id].interventionOrder;
            delete state[person.id].interventionTime;

            const ancoraIntervenuti = people
                .filter(p => state[p.id]?.interventionOrder)
                .sort((a, b) => state[a.id].interventionOrder - state[b.id].interventionOrder);

            ancoraIntervenuti.forEach((p, index) => {
                state[p.id].interventionOrder = index + 1;
            });

            renderLists();
        };

        const label = document.createElement('span');
        label.textContent = `#${s.interventionOrder}`;
        label.classList.add('fw-bold');
        label.style.cursor = 'pointer';
        label.title = s.note || 'Add note';
        label.onclick = () => {
            currentNotePersonId = person.id;
            document.getElementById('noteText').value = s.note || '';
            const modal = new bootstrap.Modal(document.getElementById('noteModal'));
            modal.show();
        };


        div.append(label, name, btn);
        spokenList.appendChild(div);
    });
};

window.electronAPI.loadPeople().then(data => {
    const seenIds = new Set();
    let hasDuplicates = false;

    data.forEach(person => {
        if (!person.id || seenIds.has(person.id)) {
            person.id = generateUniqueId();
            hasDuplicates = true;
        }
        seenIds.add(person.id);
    });

    people = data;

    if (hasDuplicates) {
        window.electronAPI.savePeople(people);
    }

    renderLists();
});


document.getElementById('saveBtn').addEventListener('click', async () => {
    const peopleWithData = people.map(person => {
        const entry = state[person.id] || {};
        const result = {
            id: person.id,
            name: person.name,
            present: entry.present || false
        };
        if (entry.interventionOrder) {
            result.interventionOrder = entry.interventionOrder;
            result.interventionTime = entry.interventionTime;
            if (entry.note) {
                result.note = entry.note;
            }
        }
        return result;
    });

    const someonePresent = peopleWithData.some(p => p.present);
    if (!someonePresent) {
        console.log('No one present: skipping log save.');
        window.close();
        return;
    }

    const now = Date.now();

    const intervenedPeople = peopleWithData
        .filter(p => p.interventionOrder && p.interventionTime)
        .sort((a, b) => a.interventionOrder - b.interventionOrder);

    let totalDuration = 0;

    for (let i = 0; i < intervenedPeople.length; i++) {
        const start = new Date(intervenedPeople[i].interventionTime).getTime();
        const end = (i + 1 < intervenedPeople.length)
            ? new Date(intervenedPeople[i + 1].interventionTime).getTime()
            : now;

        const duration = Math.max(0, Math.floor((end - start) / 1000));
        intervenedPeople[i].duration = duration;
        totalDuration += duration;
    }

    for (const person of peopleWithData) {
        const match = intervenedPeople.find(p => p.id === person.id);
        if (match && match.duration != null) {
            person.duration = match.duration;
        }
    }

    const log = {
        timestamp: new Date().toISOString(),
        duration: totalDuration,
        people: peopleWithData
    };

    await window.electronAPI.saveLog(log);
    window.close();
});


document.getElementById('toggleAllBtn').addEventListener('click', () => {
    isAllCollapsed = !isAllCollapsed;
    document.getElementById('allSection').style.display = isAllCollapsed ? 'none' : 'block';
    document.getElementById('toggleAllBtn').textContent = isAllCollapsed ? '➕ Show All' : '➖ Hide All';
    renderLists();
});

function refreshEditor() {
    const form = document.getElementById('editForm');

    const existingInputs = form.querySelectorAll('input[data-person-id]');
    existingInputs.forEach(input => {
        const person = editablePeople.find(p => p.id === input.dataset.personId);
        if (person) {
            person.name = input.value.trim();
        }
    });

    form.innerHTML = '';

    editablePeople.forEach((person, index) => {
        if (!person.id) {
            person.id = generateUniqueId();
        }

        const row = document.createElement('div');
        row.className = 'input-group mb-1';

        const input = document.createElement('input');
        input.type = 'text';
        input.value = person.name;
        input.className = 'form-control';
        input.dataset.personId = person.id;

        const del = document.createElement('button');
        del.className = 'btn btn-outline-danger';
        del.textContent = '🗑️';
        del.onclick = () => {
            editablePeople.splice(index, 1);
            refreshEditor();
        };

        row.append(input, del);
        form.appendChild(row);
    });
}

document.getElementById('addPerson').addEventListener('click', () => {
    editablePeople.push({ id: generateUniqueId(), name: 'Nuovo Nome' });
    refreshEditor();
});

document.getElementById('savePeopleBtn').addEventListener('click', async () => {
    const inputs = document.querySelectorAll('#editForm input');
    const newPeople = Array.from(inputs).map(el => ({
        id: el.dataset.personId,
        name: el.value.trim()
    }));

    await window.electronAPI.savePeople(newPeople);
    people = newPeople;
    editablePeople = null;
    Object.keys(state).forEach(k => delete state[k]);
    renderLists();
    bootstrap.Modal.getInstance(document.getElementById('editModal')).hide();
});


document.getElementById('saveNoteBtn').addEventListener('click', () => {
    const note = document.getElementById('noteText').value.trim();
    if (currentNotePersonId && state[currentNotePersonId]) {
        state[currentNotePersonId].note = note;
        renderLists();
    }
    bootstrap.Modal.getInstance(document.getElementById('noteModal')).hide();
});

document.getElementById('darkModeToggle').addEventListener('change', (e) => {
    const enabled = e.target.checked;
    document.body.classList.toggle('dark-mode', enabled);
    localStorage.setItem('darkMode', enabled ? '1' : '0');
});

document.getElementById('smallModeToggle').addEventListener('change', (e) => {
    const enabled = e.target.checked;
    document.body.classList.toggle('small-app', enabled);
    localStorage.setItem('compactMode', enabled ? '1' : '0');
    if (enabled) {
        window.electronAPI.setSmallMode();
    } else {
        window.electronAPI.setNormalMode();
    }
});

document.getElementById('alwaysOnTopToggle').addEventListener('change', (e) => {
    const enabled = e.target.checked;
    localStorage.setItem('alwaysOnTop', enabled ? '1' : '0');
    window.electronAPI.setAlwaysOnTop(enabled);
});

document.getElementById('editModal').addEventListener('hidden.bs.modal', () => {
    editablePeople = null;
});

document.getElementById('settingsDropdown').addEventListener('click', () => {
    const darkEnabled = localStorage.getItem('darkMode') === '1';
    const smallEnabled = localStorage.getItem('compactMode') === '1';
    const topEnabled = localStorage.getItem('alwaysOnTop') === '1';

    document.getElementById('darkModeToggle').checked = darkEnabled;
    document.getElementById('smallModeToggle').checked = smallEnabled;
    document.getElementById('alwaysOnTopToggle').checked = topEnabled;

    const modal = new bootstrap.Modal(document.getElementById('settingsModal'));
    modal.show();
});

document.getElementById('analyzeDropdown').addEventListener('click', () => {
    window.electronAPI.openLogAnalyzer();
});

document.getElementById('editDropdown').addEventListener('click', () => {
    if (!editablePeople) {
        editablePeople = JSON.parse(JSON.stringify(people));
    }
    refreshEditor();
    const modal = new bootstrap.Modal(document.getElementById('editModal'));
    modal.show();
});

function generateUniqueId() {
    return `p_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
}
