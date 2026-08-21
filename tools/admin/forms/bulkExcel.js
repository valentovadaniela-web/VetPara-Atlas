// Knižnica XLSX je načítaná cez CDN (window.XLSX)
const XLSX = window.XLSX;

import { state, addPendingChange, showToast, getAllHostKeys, getAllHostGroups } from '../admin.js';

export function renderBulkTab() {
    const container = document.getElementById('tab-bulk');
    if (!container) return;

    container.innerHTML = `
        <div class="bulk-import">
            <div class="bulk-header">
                <h3>📊 Hromadný import parazitov z Excelu</h3>
                <p>Nahrajte súbor <strong>.xlsx</strong> alebo <strong>.xls</strong>. Načítané riadky sa automaticky pridajú medzi čakajúce zmeny.</p>
                <p style="font-size:0.9rem;color:#7f8c8d;">
                    <strong>Štruktúra stĺpcov:</strong> latinName, slovakName, kingdom, phylum, class, order, family, genus, species, stage, sample, group, hosts, hostGroups, lengthMin, lengthMax, widthMin, widthMax, unit, shape, colour, shell, notes
                </p>
            </div>

            <div class="bulk-controls">
                <input type="file" id="excel-file-input" accept=".xlsx, .xls" class="form-control" style="margin-bottom: 1rem;">
                <button id="process-excel-btn" class="btn btn-success" style="background:#27ae60; color:white; border:none; padding:0.6rem 2rem; border-radius:4px; cursor:pointer;">
                    Spracovať súbor
                </button>
                <button id="show-template-btn" class="btn btn-secondary" style="background:#3498db; color:white; border:none; padding:0.6rem 1.5rem; border-radius:4px; cursor:pointer; margin-left: 0.5rem;">
                    Stiahnuť šablónu
                </button>
            </div>

            <div id="bulk-result" style="margin-top: 1rem; font-weight: bold;"></div>
        </div>
    `;

    // Stiahnutie šablóny
    document.getElementById('show-template-btn').addEventListener('click', () => {
        // 1. Získať existujúce hodnoty
        const existingHosts = getAllHostKeys();
        const existingHostGroups = getAllHostGroups();
        const existingStages = [...new Set(state.parasites.map(p => p.stage))];
        const existingSamples = [...new Set(state.parasites.map(p => p.sample))];
        const existingGroups = [...new Set(state.parasites.map(p => p.group))];
        
        const existingKingdoms = [...new Set(state.parasites.map(p => p.taxonomy?.kingdom))];
        const existingPhylums = [...new Set(state.parasites.map(p => p.taxonomy?.phylum))];
        const existingClasses = [...new Set(state.parasites.map(p => p.taxonomy?.class))];
        const existingOrders = [...new Set(state.parasites.map(p => p.taxonomy?.order))];
        const existingFamilies = [...new Set(state.parasites.map(p => p.taxonomy?.family))];
        const existingGenera = [...new Set(state.parasites.map(p => p.taxonomy?.genus))];
        const existingSpecies = [...new Set(state.parasites.map(p => p.taxonomy?.species))];
        
        const existingUnits = [...new Set(state.parasites.map(p => p.micrometry?.unit))];
        const existingShapes = [...new Set(state.parasites.map(p => p.morphology?.shape))];
        const existingColours = [...new Set(state.parasites.map(p => p.morphology?.colour))];
        const existingShells = [...new Set(state.parasites.map(p => p.morphology?.shell))];

        // 2. Vytvoriť zoznam referencií
        const referenceData = [
            ['Stĺpec', 'Existujúce hodnoty (kopírujte odtiaľto)'],
            ['hosts', existingHosts.join(', ')],
            ['hostGroups', existingHostGroups.join(', ')],
            ['stage', existingStages.join(', ')],
            ['sample', existingSamples.join(', ')],
            ['group', existingGroups.join(', ')],
            ['kingdom', existingKingdoms.filter(Boolean).join(', ')],
            ['phylum', existingPhylums.filter(Boolean).join(', ')],
            ['class', existingClasses.filter(Boolean).join(', ')],
            ['order', existingOrders.filter(Boolean).join(', ')],
            ['family', existingFamilies.filter(Boolean).join(', ')],
            ['genus', existingGenera.filter(Boolean).join(', ')],
            ['species', existingSpecies.filter(Boolean).join(', ')],
            ['unit', existingUnits.filter(Boolean).join(', ')],
            ['shape', existingShapes.filter(Boolean).join(', ')],
            ['colour', existingColours.filter(Boolean).join(', ')],
            ['shell', existingShells.filter(Boolean).join(', ')],
        ];

        // 3. Vytvoriť šablónu s referenciami
        const sheetData = [
            ['latinName', 'slovakName', 'kingdom', 'phylum', 'class', 'order', 'family', 'genus', 'species', 'stage', 'sample', 'group', 'hosts', 'hostGroups', 'lengthMin', 'lengthMax', 'widthMin', 'widthMax', 'unit', 'shape', 'colour', 'shell', 'notes'],
            ['Babesia canis', '', 'Protozoa', 'Apicomplexa', 'Aconoidasida', 'Piroplasmida', 'Babesiidae', 'Babesia', 'Babesia canis', 'Trofozoit', 'Krv', 'Protozoa', 'Pes', '', 5, 5, 2, 3, 'µm', 'Okrúhly', 'Bezfarebný', 'Tenká', 'Vnútri 4 rohlíkovité sporozoity'],
        ];

        const ws = XLSX.utils.aoa_to_sheet(sheetData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Šablóna');

        // 4. Pridať referenčný hárok
        const wsRef = XLSX.utils.aoa_to_sheet(referenceData);
        XLSX.utils.book_append_sheet(wb, wsRef, 'Referencie');

        // 5. Stiahnuť súbor
        XLSX.writeFile(wb, 'vetpara_template.xlsx');
    });

    // Spracovanie Excelu
    document.getElementById('process-excel-btn').addEventListener('click', async (e) => {
        e.preventDefault();
        const fileInput = document.getElementById('excel-file-input');
        const resultBox = document.getElementById('bulk-result');
        
        if (!fileInput.files || fileInput.files.length === 0) {
            resultBox.textContent = '❌ Vyberte prosím súbor.';
            resultBox.style.color = '#e74c3c';
            return;
        }

        const file = fileInput.files[0];
        const reader = new FileReader();

        reader.onload = async (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const sheet = workbook.Sheets[sheetName];
                const jsonData = XLSX.utils.sheet_to_json(sheet);

                if (jsonData.length === 0) {
                    resultBox.textContent = '❌ Súbor je prázdny.';
                    resultBox.style.color = '#e74c3c';
                    return;
                }

                resultBox.textContent = `⏳ Spracovávam ${jsonData.length} riadkov...`;
                resultBox.style.color = '#f39c12';

                // Generovanie ID cez funkciu z admin.js
                const { generateId } = await import('../admin.js');

                let processedCount = 0;
                let conflictCount = 0;

                for (const row of jsonData) {
                    // Kontrola povinných polí
                    if (!row.latinName || !row.stage) {
                        conflictCount++;
                        continue;
                    }

                    // 1. Vytvorenie nového záznamu
                    const newRecord = {
                        id: '',
                        latinName: row.latinName.trim(),
                        synonyms: [],
                        slovakName: row.slovakName || '',
                        taxonomy: {
                            kingdom: row.kingdom || '',
                            phylum: row.phylum || '',
                            class: row.class || '',
                            order: row.order || '',
                            family: row.family || '',
                            genus: row.genus || '',
                            species: row.species || '',
                        },
                        hostGroups: row.hostGroups ? row.hostGroups.split(',').map(s => s.trim()) : [],
                        hosts: row.hosts ? row.hosts.split(',').map(s => s.trim()) : [],
                        hostNotes: {},
                        sample: row.sample || 'Trus',
                        stage: row.stage,
                        group: row.group || '',
                        methods: [],
                        micrometry: {
                            lengthMin: parseFloat(row.lengthMin) || 0,
                            lengthMax: parseFloat(row.lengthMax) || 0,
                            widthMin: parseFloat(row.widthMin) || 0,
                            widthMax: parseFloat(row.widthMax) || 0,
                            unit: row.unit || 'µm',
                        },
                        morphology: {
                            shape: row.shape || '',
                            colour: row.colour || '',
                            shell: row.shell || '',
                        },
                        diagnosticSigns: [],
                        differentialDiagnosis: [],
                        lifeCycle: '',
                        pathology: '',
                        zoonosis: false,
                        images: [],
                        references: [],
                        notes: row.notes || '',
                    };

                    // 2. Generovanie ID
                    newRecord.id = generateId(newRecord.latinName, newRecord.stage, []);

                    // 3. Kontrola duplicity
                    const existingIds = new Set(state.parasites.map(p => p.id));
                    if (existingIds.has(newRecord.id)) {
                        newRecord.id = generateId(newRecord.latinName, newRecord.stage, Array.from(existingIds));
                        conflictCount++;
                    }

                    // 4. Pridanie do zoznamu čakajúcich zmien
                    addPendingChange({
                        type: 'parasite',
                        action: 'create',
                        id: newRecord.id,
                        data: newRecord
                    });

                    processedCount++;
                }

                if (processedCount > 0) {
                    resultBox.textContent = `✅ Spracovaných: ${processedCount} parazitov. ` + (conflictCount > 0 ? `Duplicitných/chybných: ${conflictCount}` : '');
                    resultBox.style.color = '#27ae60';
                    showToast(`✅ ${processedCount} nových parazitov bolo pridaných do Čakajúcich zmien!`, 'success');
                } else {
                    resultBox.textContent = `❌ Žiadne platné záznamy. Duplicitných: ${conflictCount}`;
                    resultBox.style.color = '#e74c3c';
                }

            } catch (err) {
                console.error('Import zlyhal:', err);
                resultBox.textContent = '❌ Import zlyhal: ' + err.message;
                resultBox.style.color = '#e74c3c';
                showToast('❌ Import zlyhal: ' + err.message, 'error');
            }
        };

        reader.readAsArrayBuffer(file);
    });
}