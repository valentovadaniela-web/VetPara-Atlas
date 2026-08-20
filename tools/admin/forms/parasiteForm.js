import { state, generateId, extractUniqueValues, getAllHostKeys, getAllHostGroups, addPendingChange, updatePendingUI, showDiffPanel, isIdDuplicate, getAllIds } from '../admin.js';

let currentEditingId = null;
let currentRecord = null;
let pendingHostGroupsConfirm = false;

export function renderParasiteTab() {
    const container = document.getElementById('tab-parasite');
    container.innerHTML = `
        <div class="search-box">
            <input type="text" id="search-input" placeholder="Hľadať podľa ID alebo latinského mena..." />
            <button id="search-btn">🔍 Hľadať</button>
            <button id="new-btn" class="btn-success">➕ Vytvoriť nový</button>
        </div>
        <div id="search-results" class="search-results" style="display:none;"></div>
        <div id="parasite-form"></div>
    `;

    document.getElementById('search-btn').addEventListener('click', doSearch);
    document.getElementById('search-input').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') doSearch();
    });
    document.getElementById('new-btn').addEventListener('click', () => {
        currentEditingId = null;
        currentRecord = null;
        renderForm(null);
    });

    if (currentEditingId !== null && currentRecord) {
        renderForm(currentRecord);
    } else {
        renderForm(null);
    }
}

function doSearch() {
    const query = document.getElementById('search-input').value.trim().toLowerCase();
    const resultsContainer = document.getElementById('search-results');
    if (!query) {
        resultsContainer.style.display = 'none';
        return;
    }

    const results = state.parasites.filter(p =>
        p.id.toLowerCase().includes(query) ||
        p.latinName.toLowerCase().includes(query)
    );

    if (results.length === 0) {
        resultsContainer.innerHTML = '<div class="result-item" style="color:#7f8c8d;">Žiadne výsledky</div>';
        resultsContainer.style.display = 'block';
        return;
    }

    resultsContainer.innerHTML = results.map(p => `
        <div class="result-item" data-id="${p.id}">
            <span class="id-badge">${p.id}</span>
            ${p.latinName} ${p.slovakName ? '– ' + p.slovakName : ''}
        </div>
    `).join('');

    resultsContainer.style.display = 'block';
    resultsContainer.querySelectorAll('.result-item').forEach(el => {
        el.addEventListener('click', () => {
            const id = el.dataset.id;
            const record = state.parasites.find(p => p.id === id);
            if (record) {
                currentEditingId = id;
                currentRecord = JSON.parse(JSON.stringify(record));
                renderForm(currentRecord);
                resultsContainer.style.display = 'none';
                document.getElementById('search-input').value = '';
            }
        });
    });
}

function renderForm(record) {
    const container = document.getElementById('parasite-form');
    const isNew = !record;

    const samples = extractUniqueValues('sample');
    const stages = extractUniqueValues('stage');
    const groups = extractUniqueValues('group');
    const shapes = extractUniqueValues('morphology.shape');
    const colours = extractUniqueValues('morphology.colour');
    const shells = extractUniqueValues('morphology.shell');
    const hostKeys = getAllHostKeys();
    const hostGroups = getAllHostGroups();

    const defaultRecord = {
        id: '',
        latinName: '',
        synonyms: [],
        slovakName: '',
        taxonomy: { kingdom: '', phylum: '', class: '', order: '', family: '', genus: '', species: '' },
        hostGroups: [],
        hosts: [],
        hostNotes: {},
        sample: '',
        stage: '',
        group: '',
        methods: [],
        micrometry: { lengthMin: null, lengthMax: null, widthMin: null, widthMax: null, unit: 'µm' },
        morphology: { shape: '', colour: '', shell: '' },
        diagnosticSigns: [],
        differentialDiagnosis: [],
        lifeCycle: '',
        pathology: '',
        zoonosis: false,
        images: [],
        references: [],
        notes: ''
    };

    const data = record ? { ...defaultRecord, ...record } : { ...defaultRecord };
    if (!data.hostNotes || typeof data.hostNotes !== 'object') data.hostNotes = {};

    // FIX #1: Použiť getAllIds() pre kontrolu duplicity
    const allIds = getAllIds();
    const idPreview = data.id || (data.latinName && data.stage ?
        generateId(data.latinName, data.stage, Array.from(allIds)) :
        '');

    // FIX #1: Použiť isIdDuplicate() namiesto priamej kontroly state.parasites
    const idExists = data.id && isIdDuplicate(data.id, currentEditingId);

    let html = `
        <div class="form-row">
            <div class="form-group" style="flex: 0 1 300px;">
                <label>ID <span class="required">*</span></label>
                <input type="text" id="f-id" value="${escHtml(data.id)}" ${!isNew ? 'readonly' : ''}
                    class="${idExists ? 'error' : ''}" />
                ${isNew ? `<div style="font-size:0.8rem;color:#7f8c8d;">Návrh: <span class="id-preview ${idExists ? 'error' : ''}">${idPreview}</span></div>` : ''}
                ${idExists ? '<div class="error-msg">⚠️ Toto ID už existuje (vrátane čakajúcich zmien)!</div>' : ''}
            </div>
            <div class="form-group" style="flex: 1 1 300px;">
                <label>Latinský názov <span class="required">*</span></label>
                <input type="text" id="f-latinName" value="${escHtml(data.latinName)}" />
            </div>
        </div>

        <div class="form-row">
            <div class="form-group" style="flex: 1 1 300px;">
                <label>Slovenský názov</label>
                <input type="text" id="f-slovakName" value="${escHtml(data.slovakName)}" />
            </div>
        </div>

        <div class="form-row">
            <div class="form-group" style="flex: 1 1 100%;">
                <label>Synonymá</label>
                <div class="array-inputs" id="synonyms-container">
                    ${data.synonyms.map((s, i) => `
                        <div class="array-item">
                            <input type="text" value="${escHtml(s)}" data-index="${i}" />
                            <button class="remove-array-item" data-type="synonyms" data-index="${i}">✕</button>
                        </div>
                    `).join('')}
                    <button class="array-add-btn" data-type="synonyms">+ Pridať synonymum</button>
                </div>
            </div>
        </div>

        <div class="form-row" style="border-top:1px solid #ecf0f1;padding-top:1rem;margin-top:0.5rem;">
            <div class="form-group"><label>Ríša (Kingdom)</label><input type="text" id="f-kingdom" value="${escHtml(data.taxonomy.kingdom)}" /></div>
            <div class="form-group"><label>Kmeň (Phylum)</label><input type="text" id="f-phylum" value="${escHtml(data.taxonomy.phylum)}" /></div>
            <div class="form-group"><label>Trieda (Class)</label><input type="text" id="f-class" value="${escHtml(data.taxonomy.class)}" /></div>
            <div class="form-group"><label>Rad (Order)</label><input type="text" id="f-order" value="${escHtml(data.taxonomy.order)}" /></div>
            <div class="form-group"><label>Čeľaď (Family)</label><input type="text" id="f-family" value="${escHtml(data.taxonomy.family)}" /></div>
            <div class="form-group"><label>Rod (Genus)</label><input type="text" id="f-genus" value="${escHtml(data.taxonomy.genus)}" /></div>
            <div class="form-group"><label>Druh (Species)</label><input type="text" id="f-species" value="${escHtml(data.taxonomy.species)}" /></div>
        </div>

        <div class="form-row">
            <div class="form-group" style="flex: 1 1 250px;">
                <label>Hostitelia</label>
                <select id="f-hosts" multiple>
                    ${hostKeys.map(h => `
                        <option value="${escHtml(h)}" ${data.hosts.includes(h) ? 'selected' : ''}>${escHtml(h)}</option>
                    `).join('')}
                </select>
                <div style="font-size:0.8rem;color:#7f8c8d;">Ctrl+klik pre viacnásobný výber</div>
            </div>
            <div class="form-group" style="flex: 1 1 250px;">
                <label>Skupiny hostiteľov <span style="color:#e74c3c;">⚠️</span></label>
                <select id="f-hostGroups" multiple>
                    ${hostGroups.map(h => `
                        <option value="${escHtml(h)}" ${data.hostGroups.includes(h) ? 'selected' : ''}>${escHtml(h)}</option>
                    `).join('')}
                </select>
                <div style="font-size:0.8rem;color:#7f8c8d;">Používaj výnimočne!</div>
            </div>
        </div>

        <div id="hostgroups-warning" class="warning-box" style="display:${data.hostGroups.length > 0 ? 'block' : 'none'};">
            <div class="warning-title">⚠️ Varovanie: pole hostGroups</div>
            <div class="warning-text">
                Pole <strong>hostGroups</strong> sa smie použiť iba vtedy, keď je diagnostický nález
                identický u <strong>všetkých členov skupiny</strong>. Toto pole sa nikdy nesmie automaticky
                odvodiť — použi ho len po vlastnom overení.
                <br />V aktuálnej databáze ho má vyplnené len 4 zo 474 záznamov — je to výnimka, nie norma.
            </div>
            <div class="confirm-check">
                <input type="checkbox" id="f-hostGroupsConfirm" ${pendingHostGroupsConfirm ? 'checked' : ''} />
                <label for="f-hostGroupsConfirm">Potvrdzujem, že som toto overila</label>
            </div>
        </div>

        <div class="form-row">
            <div class="form-group" style="flex: 1 1 100%;">
                <label>Poznámky k hostiteľom</label>
                <div id="hostnotes-container">
                    ${data.hosts.map(h => `
                        <div class="form-group" style="flex:1 1 100%;margin-bottom:0.3rem;">
                            <label style="font-weight:400;font-size:0.85rem;">${escHtml(h)}</label>
                            <input type="text" placeholder="Poznámka k ${escHtml(h)}" value="${escHtml(data.hostNotes[h] || '')}" data-host="${escHtml(h)}" class="hostnote-input" />
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>

        <div class="form-row">
            <div class="form-group"><label>Vzorka <span class="required">*</span></label>
                <select id="f-sample">
                    <option value="">— vyber —</option>
                    ${samples.map(s => `<option value="${escHtml(s)}" ${data.sample === s ? 'selected' : ''}>${escHtml(s)}</option>`).join('')}
                </select>
            </div>
            <div class="form-group"><label>Štádium <span class="required">*</span></label>
                <select id="f-stage">
                    <option value="">— vyber —</option>
                    ${stages.map(s => `<option value="${escHtml(s)}" ${data.stage === s ? 'selected' : ''}>${escHtml(s)}</option>`).join('')}
                </select>
            </div>
            <div class="form-group"><label>Skupina</label>
                <select id="f-group">
                    <option value="">— vyber —</option>
                    ${groups.map(g => `<option value="${escHtml(g)}" ${data.group === g ? 'selected' : ''}>${escHtml(g)}</option>`).join('')}
                </select>
            </div>
        </div>

        <!-- METHODS BOLO VYNEHANÉ -->

        <div class="form-row" style="border-top:1px solid #ecf0f1;padding-top:1rem;">
            <div class="form-group" style="flex: 1 1 100%;">
                <label>Mikrometria (v µm)</label>
                <div class="micrometry-row">
                    <div class="form-group"><label>Dĺžka min</label><input type="number" step="0.01" id="f-lengthMin" value="${data.micrometry.lengthMin ?? ''}" /></div>
                    <div class="form-group"><label>Dĺžka max</label><input type="number" step="0.01" id="f-lengthMax" value="${data.micrometry.lengthMax ?? ''}" /></div>
                    <div class="form-group"><label>Šírka min</label><input type="number" step="0.01" id="f-widthMin" value="${data.micrometry.widthMin ?? ''}" /></div>
                    <div class="form-group"><label>Šírka max</label><input type="number" step="0.01" id="f-widthMax" value="${data.micrometry.widthMax ?? ''}" /></div>
                    <div class="form-group unit"><label>Jednotka</label><input type="text" id="f-unit" value="µm" readonly disabled /></div>
                </div>
            </div>
        </div>

        <div class="form-row">
            <div class="form-group"><label>Tvar</label>
                <input type="text" id="f-shape" list="shape-list" value="${escHtml(data.morphology.shape)}" />
                <datalist id="shape-list">${shapes.map(s => `<option value="${escHtml(s)}">`).join('')}</datalist>
            </div>
            <div class="form-group"><label>Farba</label>
                <input type="text" id="f-colour" list="colour-list" value="${escHtml(data.morphology.colour)}" />
                <datalist id="colour-list">${colours.map(c => `<option value="${escHtml(c)}">`).join('')}</datalist>
            </div>
            <div class="form-group"><label>Schránka</label>
                <input type="text" id="f-shell" list="shell-list" value="${escHtml(data.morphology.shell)}" />
                <datalist id="shell-list">${shells.map(s => `<option value="${escHtml(s)}">`).join('')}</datalist>
            </div>
        </div>

        <div class="form-row">
            <div class="form-group" style="flex: 1 1 100%;">
                <label>Diagnostické znaky</label>
                <div class="array-inputs" id="diagnostic-container">
                    ${data.diagnosticSigns.map((s, i) => `
                        <div class="array-item">
                            <input type="text" value="${escHtml(s)}" data-index="${i}" />
                            <button class="remove-array-item" data-type="diagnostic" data-index="${i}">✕</button>
                        </div>
                    `).join('')}
                    <button class="array-add-btn" data-type="diagnostic">+ Pridať</button>
                </div>
            </div>
        </div>

        <div class="form-row">
            <div class="form-group" style="flex: 1 1 100%;">
                <label>Diferenciálna diagnostika</label>
                <div class="array-inputs" id="differential-container">
                    ${data.differentialDiagnosis.map((s, i) => `
                        <div class="array-item">
                            <input type="text" value="${escHtml(s)}" data-index="${i}" />
                            <button class="remove-array-item" data-type="differential" data-index="${i}">✕</button>
                        </div>
                    `).join('')}
                    <button class="array-add-btn" data-type="differential">+ Pridať</button>
                </div>
            </div>
        </div>

        <div class="form-row">
            <div class="form-group" style="flex: 1 1 100%;"><label>Životný cyklus</label>
                <textarea id="f-lifeCycle">${escHtml(data.lifeCycle)}</textarea>
            </div>
        </div>

        <div class="form-row">
            <div class="form-group" style="flex: 1 1 100%;"><label>Patológia</label>
                <textarea id="f-pathology">${escHtml(data.pathology)}</textarea>
            </div>
        </div>

        <div class="form-row">
            <div class="form-group"><label>Zoonóza</label>
                <input type="checkbox" id="f-zoonosis" ${data.zoonosis ? 'checked' : ''} />
            </div>
        </div>

        <div class="form-row">
            <div class="form-group" style="flex: 1 1 100%;">
                <label>Referencie</label>
                <div class="array-inputs" id="references-container">
                    ${data.references.map((s, i) => `
                        <div class="array-item">
                            <input type="text" value="${escHtml(s)}" data-index="${i}" />
                            <button class="remove-array-item" data-type="references" data-index="${i}">✕</button>
                        </div>
                    `).join('')}
                    <button class="array-add-btn" data-type="references">+ Pridať</button>
                </div>
            </div>
        </div>

        <div class="form-row">
            <div class="form-group" style="flex: 1 1 100%;"><label>Poznámky</label>
                <textarea id="f-notes">${escHtml(data.notes)}</textarea>
            </div>
        </div>

        <div class="form-actions">
            <button id="save-btn" class="btn-primary">💾 Pridať do frontu zmien</button>
            <button id="clear-btn" class="btn-secondary">🗑 Vyčistiť formulár</button>
            ${!isNew ? `<button id="delete-btn" class="btn-danger">🗑 Odstrániť záznam</button>` : ''}
        </div>
    `;

    container.innerHTML = html;

    // --- EVENTY ---

    if (isNew) {
        const latinInput = document.getElementById('f-latinName');
        const stageInput = document.getElementById('f-stage');
        const idInput = document.getElementById('f-id');
        const previewEl = document.querySelector('.id-preview');

        function updateIdPreview() {
            const latin = latinInput.value.trim();
            const stage = stageInput.value;
            if (latin && stage) {
                const allIds = getAllIds();
                const generated = generateId(latin, stage, Array.from(allIds));
                if (previewEl) {
                    previewEl.textContent = generated;
                    const exists = isIdDuplicate(generated);
                    previewEl.className = `id-preview ${exists ? 'error' : ''}`;
                    if (!idInput.value || idInput.value === '') {
                        idInput.value = generated;
                    }
                }
            } else {
                if (previewEl) {
                    previewEl.textContent = '— vyplň latinské meno a štádium —';
                    previewEl.className = 'id-preview';
                }
            }
        }

        latinInput.addEventListener('input', updateIdPreview);
        stageInput.addEventListener('change', updateIdPreview);
        updateIdPreview();
    }

    setupArrayControls('synonyms-container', 'synonyms', data);
    setupArrayControls('diagnostic-container', 'diagnostic', data);
    setupArrayControls('differential-container', 'differential', data);
    setupArrayControls('references-container', 'references', data);

    const hostsSelect = document.getElementById('f-hosts');
    const hostNotesContainer = document.getElementById('hostnotes-container');

    hostsSelect.addEventListener('change', () => {
        const selected = Array.from(hostsSelect.selectedOptions).map(o => o.value);
        const currentNotes = getHostNotesFromUI();
        hostNotesContainer.innerHTML = selected.map(h => `
            <div class="form-group" style="flex:1 1 100%;margin-bottom:0.3rem;">
                <label style="font-weight:400;font-size:0.85rem;">${escHtml(h)}</label>
                <input type="text" placeholder="Poznámka k ${escHtml(h)}" value="${escHtml(currentNotes[h] || '')}" data-host="${escHtml(h)}" class="hostnote-input" />
            </div>
        `).join('');
    });

    const hostGroupsSelect = document.getElementById('f-hostGroups');
    const warningEl = document.getElementById('hostgroups-warning');
    const confirmCheck = document.getElementById('f-hostGroupsConfirm');

    hostGroupsSelect.addEventListener('change', () => {
        const selected = Array.from(hostGroupsSelect.selectedOptions).map(o => o.value);
        if (selected.length > 0) {
            warningEl.style.display = 'block';
            pendingHostGroupsConfirm = false;
            confirmCheck.checked = false;
        } else {
            warningEl.style.display = 'none';
            pendingHostGroupsConfirm = false;
            confirmCheck.checked = false;
        }
    });

    confirmCheck.addEventListener('change', () => {
        pendingHostGroupsConfirm = confirmCheck.checked;
    });

    document.getElementById('save-btn').addEventListener('click', async () => {
        const formData = collectFormData(isNew);
        if (!formData) return;

        if (formData.hostGroups.length > 0 && !pendingHostGroupsConfirm) {
            alert('⚠️ Pre použitie hostGroups musíš potvrdiť varovanie zaškrtnutím checkboxu.');
            return;
        }

        const errors = validateForm(formData, isNew);
        if (errors.length > 0) {
            alert('Chyby vo formulári:\n' + errors.join('\n'));
            return;
        }

        // FIX #1: Použiť isIdDuplicate() namiesto priamej kontroly
        if (isNew && isIdDuplicate(formData.id)) {
            alert('❌ Toto ID už existuje (vrátane čakajúcich zmien)! Uprav ID prosím.');
            return;
        }

        const oldRecord = isNew ? null : currentRecord;
        const confirmed = await showDiffPanel(oldRecord, formData);

        if (confirmed) {
            const change = {
                type: 'parasite',
                action: isNew ? 'create' : 'update',
                id: formData.id,
                data: formData
            };
            addPendingChange(change);
            if (isNew) {
                renderForm(null);
                currentEditingId = null;
                currentRecord = null;
            } else {
                currentRecord = JSON.parse(JSON.stringify(formData));
            }
            document.getElementById('search-results').style.display = 'none';
        }
    });

    document.getElementById('clear-btn').addEventListener('click', () => {
        if (confirm('Naozaj chceš vyčistiť formulár? Neuložené zmeny sa stratia.')) {
            currentEditingId = null;
            currentRecord = null;
            pendingHostGroupsConfirm = false;
            renderForm(null);
        }
    });

    const deleteBtn = document.getElementById('delete-btn');
    if (deleteBtn) {
        deleteBtn.addEventListener('click', () => {
            if (!currentRecord) return;
            if (!confirm(`Naozaj chceš odstrániť záznam ${currentRecord.id}? Táto akcia pôjde do frontu zmien.`)) return;

            const change = {
                type: 'parasite',
                action: 'delete',
                id: currentRecord.id,
                data: null
            };
            addPendingChange(change);
            currentEditingId = null;
            currentRecord = null;
            renderForm(null);
            document.getElementById('search-results').style.display = 'none';
        });
    }
}

function setupArrayControls(containerId, type, data) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.querySelectorAll('.remove-array-item').forEach(btn => {
        btn.addEventListener('click', () => {
            const idx = parseInt(btn.dataset.index);
            const input = container.querySelector(`input[data-index="${idx}"]`);
            if (input) {
                input.closest('.array-item').remove();
            }
            container.querySelectorAll('.array-item input').forEach((inp, i) => {
                inp.dataset.index = i;
                const rmBtn = inp.closest('.array-item').querySelector('.remove-array-item');
                if (rmBtn) rmBtn.dataset.index = i;
            });
        });
    });

    const addBtn = container.querySelector('.array-add-btn');
    if (addBtn) {
        addBtn.addEventListener('click', () => {
            const item = document.createElement('div');
            item.className = 'array-item';
            const idx = container.querySelectorAll('.array-item').length;
            item.innerHTML = `
                <input type="text" value="" data-index="${idx}" />
                <button class="remove-array-item" data-type="${type}" data-index="${idx}">✕</button>
            `;
            container.appendChild(item);
            item.querySelector('.remove-array-item').addEventListener('click', () => {
                item.remove();
                container.querySelectorAll('.array-item input').forEach((inp, i) => {
                    inp.dataset.index = i;
                    const rmBtn = inp.closest('.array-item').querySelector('.remove-array-item');
                    if (rmBtn) rmBtn.dataset.index = i;
                });
            });
        });
    }
}

function getHostNotesFromUI() {
    const notes = {};
    document.querySelectorAll('.hostnote-input').forEach(inp => {
        const host = inp.dataset.host;
        if (host) notes[host] = inp.value;
    });
    return notes;
}

function collectFormData(isNew) {
    const getVal = (id) => document.getElementById(id)?.value || '';
    const getChecked = (id) => document.getElementById(id)?.checked || false;
    const getSelectMulti = (id) => {
        const sel = document.getElementById(id);
        return sel ? Array.from(sel.selectedOptions).map(o => o.value) : [];
    };
    const getArray = (containerId) => {
        const container = document.getElementById(containerId);
        if (!container) return [];
        return Array.from(container.querySelectorAll('.array-item input'))
            .map(inp => inp.value.trim())
            .filter(v => v !== '');
    };

    const id = document.getElementById('f-id')?.value.trim() || '';
    const latinName = getVal('f-latinName').trim();
    const slovakName = getVal('f-slovakName').trim();
    const sample = getVal('f-sample');
    const stage = getVal('f-stage');
    const group = getVal('f-group');

    const taxonomy = {
        kingdom: getVal('f-kingdom').trim(),
        phylum: getVal('f-phylum').trim(),
        class: getVal('f-class').trim(),
        order: getVal('f-order').trim(),
        family: getVal('f-family').trim(),
        genus: getVal('f-genus').trim(),
        species: getVal('f-species').trim(),
    };

    const hosts = getSelectMulti('f-hosts');
    const hostGroups = getSelectMulti('f-hostGroups');
    const hostNotes = getHostNotesFromUI();

    // methods — VYNEHANÉ

    const micrometry = {
        lengthMin: parseFloatOrNull(getVal('f-lengthMin')),
        lengthMax: parseFloatOrNull(getVal('f-lengthMax')),
        widthMin: parseFloatOrNull(getVal('f-widthMin')),
        widthMax: parseFloatOrNull(getVal('f-widthMax')),
        unit: 'µm',
    };

    const morphology = {
        shape: getVal('f-shape').trim(),
        colour: getVal('f-colour').trim(),
        shell: getVal('f-shell').trim(),
    };

    const synonyms = getArray('synonyms-container');
    const diagnosticSigns = getArray('diagnostic-container');
    const differentialDiagnosis = getArray('differential-container');
    const references = getArray('references-container');

    const lifeCycle = getVal('f-lifeCycle').trim();
    const pathology = getVal('f-pathology').trim();
    const zoonosis = getChecked('f-zoonosis');
    const notes = getVal('f-notes').trim();

    const images = currentRecord?.images || [];

    return {
        id,
        latinName,
        synonyms,
        slovakName,
        taxonomy,
        hostGroups,
        hosts,
        hostNotes,
        sample,
        stage,
        group,
        methods: [],
        micrometry,
        morphology,
        diagnosticSigns,
        differentialDiagnosis,
        lifeCycle,
        pathology,
        zoonosis,
        images,
        references,
        notes,
    };
}

function parseFloatOrNull(val) {
    if (val === '' || val === null || val === undefined) return null;
    const num = parseFloat(val);
    return isNaN(num) ? null : num;
}

function validateForm(data, isNew) {
    const errors = [];
    const forbidden = ['?', '-', '~', 'N/A', 'Neznáme', 'Asi', 'Pravdepodobne', 'cca', 'Bez údajov', '???'];

    const checkForbidden = (val, field) => {
        if (val && forbidden.includes(val.trim())) {
            errors.push(`Pole "${field}" obsahuje zakázaný placeholder: "${val}"`);
        }
    };

    if (!data.id || data.id.trim() === '') errors.push('ID je povinné');
    if (!data.latinName || data.latinName.trim() === '') errors.push('Latinské meno je povinné');
    if (!data.sample || data.sample === '') errors.push('Vzorka je povinná');
    if (!data.stage || data.stage === '') errors.push('Štádium je povinné');

    checkForbidden(data.latinName, 'Latinské meno');
    checkForbidden(data.slovakName, 'Slovenské meno');
    checkForbidden(data.sample, 'Vzorka');
    checkForbidden(data.stage, 'Štádium');
    checkForbidden(data.group, 'Skupina');

    for (const [key, val] of Object.entries(data.micrometry)) {
        if (key !== 'unit' && val !== null && isNaN(val)) {
            errors.push(`Mikrometria.${key} musí byť číslo`);
        }
        if (key !== 'unit' && val !== null && val < 0) {
            errors.push(`Mikrometria.${key} nemôže byť záporné`);
        }
    }

    return errors;
}

function escHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}