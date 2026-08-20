// Hlavný stav a logika
import { renderParasiteTab } from './forms/parasiteForm.js';
import { renderHostTab } from './forms/hostForm.js';
import { renderImageTab } from './forms/imageForm.js';
import { renderBulkTab } from './forms/bulkExcel.js';
import { exportZip } from './zipExport.js';
import { showDiff } from './diff.js';

// --- ŠTÁT ---
export const state = {
    parasites: [],
    images: [],
    hostHierarchy: {},
    pendingChanges: [],
    sessionNewHostEntries: [],
    // Pre formulár
    editingId: null,
    currentRecord: null,
    // In-memory kópia na aplikovanie zmien pre export a kontrolu duplicity
    workingCopy: null,
};

let diffResolve = null; // Pre diff callback

// --- NAČÍTANIE DÁT ---
export async function loadData() {
    const statusEl = document.getElementById('data-status');
    try {
        statusEl.textContent = 'Načítavam...';
        statusEl.style.background = '#f39c12';

        const [parasites, images, hostHierarchy] = await Promise.all([
            fetch('../../database/parasites.json').then(r => {
                if (!r.ok) throw new Error('HTTP ' + r.status);
                return r.json();
            }),
            fetch('../../database/images.json').then(r => {
                if (!r.ok) throw new Error('HTTP ' + r.status);
                return r.json();
            }),
            fetch('../../dictionary/host_hierarchy.json').then(r => {
                if (!r.ok) throw new Error('HTTP ' + r.status);
                return r.json();
            }),
        ]);

        state.parasites = parasites;
        state.images = images;
        state.hostHierarchy = hostHierarchy;
        state.workingCopy = JSON.parse(JSON.stringify(parasites));

        statusEl.textContent = `✅ Načítané: ${parasites.length} parazitov, ${Object.keys(hostHierarchy).length} hostiteľov`;
        statusEl.style.background = '#27ae60';

        // Inicializovať taby
        initTabs();
        updatePendingUI();

        return true;
    } catch (err) {
        statusEl.textContent = `❌ Chyba: ${err.message}. Spusti cez Live Server (CORS).`;
        statusEl.style.background = '#e74c3c';
        console.error('Načítanie zlyhalo:', err);
        return false;
    }
}

// --- INICIALIZÁCIA ---
function initTabs() {
    // Tab prepínanie
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const tab = btn.dataset.tab;
            document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
            document.getElementById(`tab-${tab}`).classList.add('active');
            // Pri prepnutí na parazit tab refresh formulára
            if (tab === 'parasite') {
                renderParasiteTab();
            }
        });
    });

    // Render všetkých tabov
    renderParasiteTab();
    renderHostTab();
    renderImageTab();
    renderBulkTab();

    // Export tlačidlo
    document.getElementById('export-btn').addEventListener('click', async () => {
        await exportZip();
    });

    // Sidebar toggle
    const toggleBtn = document.createElement('button');
    toggleBtn.id = 'sidebar-toggle';
    toggleBtn.textContent = '📦';
    toggleBtn.title = 'Zobraziť čakajúce zmeny';
    document.body.appendChild(toggleBtn);
    toggleBtn.addEventListener('click', () => {
        document.getElementById('pending-sidebar').classList.toggle('open');
    });

    // Zatvorenie sidebaru
    document.querySelector('.close-sidebar')?.addEventListener('click', () => {
        document.getElementById('pending-sidebar').classList.remove('open');
    });

    // Globálne funkcie pre diff
    window.__diffConfirm = () => {
        if (diffResolve) {
            diffResolve(true);
            diffResolve = null;
        }
        document.getElementById('diff-overlay').style.display = 'none';
    };
    window.__diffCancel = () => {
        if (diffResolve) {
            diffResolve(false);
            diffResolve = null;
        }
        document.getElementById('diff-overlay').style.display = 'none';
    };

    document.getElementById('diff-confirm').addEventListener('click', window.__diffConfirm);
    document.getElementById('diff-cancel').addEventListener('click', window.__diffCancel);
}

// --- PENDING CHANGES ---
export function addPendingChange(change) {
    state.pendingChanges.push(change);
    updatePendingUI();
    // Aktualizovať working copy
    applyChangeToWorkingCopy(change);
}

export function removePendingChange(index) {
    state.pendingChanges.splice(index, 1);
    // Rebuild working copy
    rebuildWorkingCopy();
    updatePendingUI();
}

function applyChangeToWorkingCopy(change) {
    if (change.type === 'parasite') {
        if (change.action === 'create') {
            state.workingCopy.push(change.data);
        } else if (change.action === 'update') {
            const idx = state.workingCopy.findIndex(p => p.id === change.id);
            if (idx !== -1) {
                state.workingCopy[idx] = change.data;
            }
        } else if (change.action === 'delete') {
            // FIX #3: Spracovanie delete v workingCopy
            const idx = state.workingCopy.findIndex(p => p.id === change.id);
            if (idx !== -1) {
                state.workingCopy.splice(idx, 1);
            }
        }
    }
}

function rebuildWorkingCopy() {
    state.workingCopy = JSON.parse(JSON.stringify(state.parasites));
    for (const ch of state.pendingChanges) {
        if (ch.type === 'parasite') {
            if (ch.action === 'create') {
                state.workingCopy.push(ch.data);
            } else if (ch.action === 'update') {
                const idx = state.workingCopy.findIndex(p => p.id === ch.id);
                if (idx !== -1) {
                    state.workingCopy[idx] = ch.data;
                }
            } else if (ch.action === 'delete') {
                // FIX #3: Spracovanie delete v rebuild
                const idx = state.workingCopy.findIndex(p => p.id === ch.id);
                if (idx !== -1) {
                    state.workingCopy.splice(idx, 1);
                }
            }
        }
    }
}

// FIX #1: Kontrola duplicity zohľadňuje pendingChanges
export function isIdDuplicate(id, excludeId = null) {
    // Skontrolovať v pôvodných dátach
    if (state.parasites.some(p => p.id === id && p.id !== excludeId)) {
        return true;
    }
    // Skontrolovať v workingCopy (vrátane pendingChanges)
    if (state.workingCopy.some(p => p.id === id && p.id !== excludeId)) {
        return true;
    }
    // Skontrolovať priamo v pendingChanges (pre prípad, že workingCopy nie je aktuálny)
    for (const ch of state.pendingChanges) {
        if (ch.type === 'parasite' && (ch.action === 'create' || ch.action === 'update')) {
            if (ch.data && ch.data.id === id && ch.id !== excludeId) {
                return true;
            }
        }
    }
    return false;
}

// FIX #2: workingCopy sa používa na kontrolu duplicity
export function getAllIds() {
    const ids = new Set();
    // Pôvodné dáta
    for (const p of state.parasites) {
        ids.add(p.id);
    }
    // Pending changes (cez workingCopy)
    for (const p of state.workingCopy) {
        ids.add(p.id);
    }
    return ids;
}

export function updatePendingUI() {
    const count = state.pendingChanges.length;
    document.getElementById('pending-count').textContent = `Čakajúce zmeny: ${count}`;
    document.getElementById('pending-sidebar-count').textContent = count;
    document.getElementById('export-btn').disabled = count === 0;

    const list = document.getElementById('pending-list');
    list.innerHTML = '';
    state.pendingChanges.forEach((ch, idx) => {
        const li = document.createElement('li');
        // FIX #4: Správny badge pre delete
        let badge = '✏️';
        let label = 'Úprava';
        if (ch.action === 'create') {
            badge = '🆕';
            label = 'Nový';
        } else if (ch.action === 'delete') {
            badge = '🗑️';
            label = 'Zmazanie';
        }
        li.innerHTML = `
            <span><span class="badge-${ch.action}">${badge} ${label}</span> ${ch.id || '?'}</span>
            <button class="remove-pending" data-index="${idx}">✕</button>
        `;
        li.querySelector('.remove-pending').addEventListener('click', () => {
            removePendingChange(idx);
        });
        list.appendChild(li);
    });
}

// --- DIFF WRAPPER ---
export function showDiffPanel(oldRecord, newRecord) {
    return new Promise((resolve) => {
        diffResolve = resolve;
        const overlay = document.getElementById('diff-overlay');
        const content = document.getElementById('diff-content');
        content.innerHTML = showDiff(oldRecord, newRecord);
        overlay.style.display = 'flex';
    });
}

// --- ŠTART ---
document.addEventListener('DOMContentLoaded', async () => {
    await loadData();
});

// --- GENEROVANIE ID ---
export function generateId(latinName, stage, existingIds) {
    if (!latinName || !stage) return '';

    // Mapovanie stage → anglický fragment
    const stageMap = {
        'Cysta': 'cyst',
        'Dospelý jedinec': '',  // ← prázdny reťazec = žiadna prípona
        'Kvasinka': 'yeast',
        'Larva': 'larva',
        'Mesocerkária': 'mesocercaria',
        'Oocysta': 'oocyst',
        'Plerocerkoid': 'plerocercoid',
        'Trofozoit': 'trophozoite',
        'Vajíčko': 'egg',
    };

    let base = latinName.toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9_]/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_|_$/g, '');

    const stagePart = stageMap[stage];
    let candidate = base;
    if (stagePart && stagePart !== '') {
        candidate = `${base}_${stagePart}`;
    }
    // Pre "Dospelý jedinec" ostáva len base (žiadna prípona)

    let counter = 1;
    let final = candidate;
    const allIds = new Set(existingIds || []);
    // Pridať aj ID z workingCopy (pendingChanges)
    if (state.workingCopy) {
        for (const p of state.workingCopy) {
            allIds.add(p.id);
        }
    }
    while (allIds.has(final)) {
        final = `${candidate}_${counter}`;
        counter++;
    }

    return final;
}

// FIX #5: extractUniqueValues zohľadňuje pendingChanges (datalisty)
export function extractUniqueValues(fieldPath) {
    const values = new Set();
    // Prejsť pôvodné dáta
    for (const p of state.parasites) {
        addValueFromPath(p, fieldPath, values);
    }
    // Prejsť workingCopy (vrátane pendingChanges)
    if (state.workingCopy) {
        for (const p of state.workingCopy) {
            addValueFromPath(p, fieldPath, values);
        }
    }
    // Pridať aj hodnoty z aktuálnej session (nové host entries)
    if (fieldPath === 'hostGroups' || fieldPath === 'hosts') {
        for (const entry of state.sessionNewHostEntries) {
            if (typeof entry === 'string') values.add(entry);
            else if (entry.value) values.add(entry.value);
            else if (entry.key) values.add(entry.key);
        }
    }
    return Array.from(values).sort((a, b) => a.localeCompare(b));
}

// Pomocná funkcia pre extractUniqueValues
function addValueFromPath(obj, path, values) {
    let val = obj;
    for (const key of path.split('.')) {
        if (val && typeof val === 'object' && key in val) {
            val = val[key];
        } else {
            val = undefined;
            break;
        }
    }
    if (val !== undefined && val !== null && val !== '') {
        if (Array.isArray(val)) {
            for (const item of val) {
                if (item && item !== '') values.add(item);
            }
        } else {
            values.add(String(val));
        }
    }
}

// --- HOST HIERARCHY HELPERS ---
export function getAllHostKeys() {
    const keys = Object.keys(state.hostHierarchy);
    // Pridať session nové
    for (const entry of state.sessionNewHostEntries) {
        if (typeof entry === 'string') {
            if (!keys.includes(entry)) keys.push(entry);
        } else if (entry.key && !keys.includes(entry.key)) {
            keys.push(entry.key);
        }
    }
    // Pridať aj z workingCopy (nové záznamy môžu mať nových hostiteľov)
    if (state.workingCopy) {
        for (const p of state.workingCopy) {
            if (p.hosts) {
                for (const h of p.hosts) {
                    if (!keys.includes(h)) keys.push(h);
                }
            }
        }
    }
    return keys.sort((a, b) => a.localeCompare(b));
}

export function getAllHostGroups() {
    const groups = new Set();
    for (const val of Object.values(state.hostHierarchy)) {
        if (Array.isArray(val)) {
            for (const v of val) {
                if (v && typeof v === 'string') groups.add(v);
            }
        } else if (typeof val === 'string') {
            groups.add(val);
        }
    }
    // Aj kľúče, ktoré sú zároveň hodnotami (vnorené skupiny)
    for (const key of Object.keys(state.hostHierarchy)) {
        if (groups.has(key)) continue;
        for (const val of Object.values(state.hostHierarchy)) {
            if (Array.isArray(val) && val.includes(key)) {
                groups.add(key);
                break;
            } else if (val === key) {
                groups.add(key);
                break;
            }
        }
    }
    // Pridať session nové
    for (const entry of state.sessionNewHostEntries) {
        if (typeof entry === 'string') groups.add(entry);
        else if (entry.value) groups.add(entry.value);
    }
    // Pridať aj z workingCopy
    if (state.workingCopy) {
        for (const p of state.workingCopy) {
            if (p.hostGroups) {
                for (const g of p.hostGroups) {
                    if (g && typeof g === 'string') groups.add(g);
                }
            }
        }
    }
    return Array.from(groups).sort((a, b) => a.localeCompare(b));
}