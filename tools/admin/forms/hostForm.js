import { state, addPendingChange, getAllHostKeys, getAllHostGroups, showToast } from '../admin.js';

// Túto funkciu vystavíme globálne, aby ju admin.js mohol zavolať pri zmene
export function renderHostTab() {
    const container = document.getElementById('tab-host');
    if (!container) return;

    // 1. Získať aktuálne dáta
    const hostKeys = getAllHostKeys();
    const hostGroups = getAllHostGroups();

    // 2. Vykresliť HTML
    container.innerHTML = `
        <div style="display:flex; gap:20px; align-items:flex-start;">
            <!-- Ľavá časť: Zoznam hostiteľov -->
            <div style="flex:1; border-right:1px solid #ddd; padding-right:20px;">
                <h3>Existujúci hostitelia (${hostKeys.length})</h3>
                <ul id="host-list" style="list-style:none; padding:0; max-height:400px; overflow-y:auto;">
                    ${hostKeys.map(host => `
                        <li style="display:flex; justify-content:space-between; padding:5px 0; border-bottom:1px solid #eee;">
                            <span>${host}</span>
                            <button class="delete-host-btn" data-host="${host}" style="background:#e74c3c; color:white; border:none; padding:2px 8px; border-radius:4px; cursor:pointer;">Zmazať</button>
                        </li>
                    `).join('')}
                </ul>
            </div>

            <!-- Pravá časť: Formulár na pridanie -->
            <div style="flex:1;">
                <h3>Pridať nového hostiteľa</h3>
                <form id="add-host-form" style="display:flex; flex-direction:column; gap:10px;">
                    <div>
                        <label for="new-host-name">Názov hostiteľa (napr. *mačka*):</label>
                        <input type="text" id="new-host-name" required style="width:100%; padding:8px; border:1px solid #ccc; border-radius:4px;">
                    </div>
                    <div>
                        <label for="new-host-parent">Nadradená skupina (voliteľné):</label>
                        <select id="new-host-parent" style="width:100%; padding:8px; border:1px solid #ccc; border-radius:4px;">
                            <option value="">Žiadna (koreňová skupina)</option>
                            ${hostGroups.map(group => `<option value="${group}">${group}</option>`).join('')}
                        </select>
                    </div>
                    <button type="submit" id="add-host-submit" style="background:#2ecc71; color:white; border:none; padding:10px; border-radius:4px; cursor:pointer; font-weight:bold;">Pridať hostiteľa</button>
                </form>
                <div id="host-message" style="margin-top:10px; font-weight:bold;"></div>
            </div>
        </div>
    `;

    // 3. Udalosť pre mazanie (NAOZJAJ)
    document.querySelectorAll('.delete-host-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const hostToDelete = e.target.dataset.host;
            
            // 1. Potvrdenie od používateľa (stačí jednoduchý confirm)
            if (!confirm(`Naozaj chcete natrvalo vymazať hostiteľa "${hostToDelete}"?`)) {
                return;
            }

            // 2. Vymazanie z pamäte
            delete state.hostHierarchy[hostToDelete];

            // 3. Pridanie do pendingChanges
            addPendingChange({
                type: 'host',
                action: 'delete',
                key: hostToDelete
            });

            // 4. Notifikácia
            showToast(`🗑️ Hostiteľ "${hostToDelete}" bol označený na vymazanie.`, 'error');
        });
    });

    // 4. Udalosť pre odoslanie formulára (REÁLNE PRIDANIE)
    document.getElementById('add-host-submit').addEventListener('click', (e) => {
        // Zabraňujeme odoslaniu formulára (nemusíme riešiť submit)
        e.preventDefault();
        
        const name = document.getElementById('new-host-name').value.trim();
        const parent = document.getElementById('new-host-parent').value;
        const msgBox = document.getElementById('host-message');

        if (!name) {
            msgBox.textContent = '❌ Zadajte názov hostiteľa!';
            msgBox.style.color = '#e74c3c';
            return;
        }

        // Skontrolovať, či už neexistuje
        if (hostKeys.includes(name)) {
            msgBox.textContent = `❌ Hostiteľ "${name}" už existuje!`;
            msgBox.style.color = '#e74c3c';
            return;
        }

        // REÁLNE ZMENY
        state.hostHierarchy[name] = parent || null;

        addPendingChange({
            type: 'host',
            action: 'create',
            key: name,
            parent: parent || null
        });

        state.sessionNewHostEntries.push(name);

        // ... (vo vnútri submit event listenera, kde bola správa) ...

        showToast(`✅ Hostiteľ "${name}" bol pridaný do zoznamu a čaká na export!`, 'success');
        
        // Reset formulára
        document.getElementById('new-host-name').value = '';
        document.getElementById('new-host-parent').value = '';
    }); 
}

// Globálny odkaz na obnovenie tabu (pre admin.js)
window.__refreshHostTab = renderHostTab;