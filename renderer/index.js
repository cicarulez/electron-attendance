let people = [];
const state = {}; // id -> { present: true, interventionOrder, interventionTime }
let isAllCollapsed = false;
let currentNotePersonId = null;

const renderLists = () => {
    const allList = document.getElementById('allList');
    const presentList = document.getElementById('presentList');
    const spokenList = document.getElementById('spokenList');
    allList.innerHTML = '';
    presentList.innerHTML = '';
    spokenList.innerHTML = '';

    // "Tutti" e "Presenti"
    people.forEach(person => {
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
    people = data;
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

    const log = {
        timestamp: new Date().toISOString(),
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

// Editor
document.getElementById('editBtn').addEventListener('click', () => {
    refreshEditor();
    const modal = new bootstrap.Modal(document.getElementById('editModal'));
    modal.show();
});

function refreshEditor() {
    const form = document.getElementById('editForm');
    form.innerHTML = '';

    people.forEach((person, index) => {
        const row = document.createElement('div');
        row.className = 'input-group mb-1';

        const input = document.createElement('input');
        input.type = 'text';
        input.value = person.name;
        input.className = 'form-control';

        const up = document.createElement('button');
        up.className = 'btn btn-outline-secondary';
        up.textContent = '↑';
        up.onclick = () => {
            if (index > 0) {
                [people[index - 1], people[index]] = [people[index], people[index - 1]];
                refreshEditor();
            }
        };

        const down = document.createElement('button');
        down.className = 'btn btn-outline-secondary';
        down.textContent = '↓';
        down.onclick = () => {
            if (index < people.length - 1) {
                [people[index + 1], people[index]] = [people[index], people[index + 1]];
                refreshEditor();
            }
        };

        const del = document.createElement('button');
        del.className = 'btn btn-outline-danger';
        del.textContent = '🗑️';
        del.onclick = () => {
            people.splice(index, 1);
            refreshEditor();
        };

        row.append(input, up, down, del);
        form.appendChild(row);
    });
}

document.getElementById('addPerson').addEventListener('click', () => {
    people.push({ id: '', name: 'Nuovo Nome' });
    refreshEditor();
});

document.getElementById('savePeopleBtn').addEventListener('click', async () => {
    const inputs = document.querySelectorAll('#editForm input');
    const newPeople = Array.from(inputs).map((el, i) => ({
        id: (i + 1).toString(),
        name: el.value.trim()
    }));

    await window.electronAPI.savePeople(newPeople);
    people = newPeople;
    Object.keys(state).forEach(k => delete state[k]);
    renderLists();
    bootstrap.Modal.getInstance(document.getElementById('editModal')).hide();
});

document.getElementById('saveNoteBtn').addEventListener('click', () => {
    const note = document.getElementById('noteText').value.trim();
    if (currentNotePersonId && state[currentNotePersonId]) {
        state[currentNotePersonId].note = note;
        renderLists(); // aggiorna il tooltip
    }
    bootstrap.Modal.getInstance(document.getElementById('noteModal')).hide();
});
