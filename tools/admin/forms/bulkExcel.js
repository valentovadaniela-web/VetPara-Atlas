// Knižnica XLSX je načítaná cez CDN (window.XLSX)
const XLSX = window.XLSX;

import { state, addPendingChange, showToast, getAllHostKeys, getAllHostGroups, generateId } from '../admin.js';

// FIX: rovnaká logika ako v imageForm.js (getImagesForParasite) — fotky
// môžu žiť buď v state.images (database/images.json), alebo embednuté
// priamo v p.images. Pri exporte "Aktuálny stav" treba oba zdroje zlúčiť,
// inak by prehľad ukazoval nesprávny (nižší) počet fotiek k parazitovi.
function getImagesForParasiteExport(parasiteId) {
    const urls = new Set();
    for (const img of state.images || []) {
        if (img.parasiteId === parasiteId && img.url) urls.add(img.url);
    }
    const parasite = (state.workingCopy || state.parasites).find(p => p.id === parasiteId);
    if (parasite?.images) {
        for (const url of parasite.images) urls.add(url);
    }
    return Array.from(urls);
}

// --- Kompletný zoznam stĺpcov (šablóna aj export "Aktuálny stav" používajú rovnaké poradie) ---
// Posledné dva stĺpce (imagesCount, imageUrls) sú LEN informatívne — import ich nikdy nečíta.
// Fotky sa menia výhradne cez kartu "Fotografie".
const COLUMNS = [
    'id', 'latinName', 'synonyms', 'slovakName',
    'kingdom', 'phylum', 'class', 'order', 'family', 'genus', 'species',
    'stage', 'sample', 'group', 'hosts', 'hostGroups', 'hostNotes',
    'lengthMin', 'lengthMax', 'widthMin', 'widthMax', 'unit',
    'shape', 'colour', 'shell',
    'diagnosticSigns', 'differentialDiagnosis',
    'lifeCycle', 'pathology', 'zoonosis', 'notes',
    'imagesCount', 'imageUrls',
];

// --- Pomocné (de)serializačné funkcie pre plochý formát Excelu ---

// Zoznam oddelený čiarkou -> pole reťazcov (bez prázdnych položiek)
function parseListField(value) {
    if (value === undefined || value === null || value === '') return [];
    return String(value).split(',').map(s => s.trim()).filter(Boolean);
}

function serializeListField(arr) {
    return (arr || []).join(', ');
}

// hostNotes je objekt { hostiteľ: poznámka }. V Exceli ako text:
// "Pes: poznámka pre psy | Mačka: iná poznámka"
function parseHostNotes(value) {
    if (!value) return {};
    const result = {};
    String(value).split('|').forEach(part => {
        const idx = part.indexOf(':');
        if (idx === -1) return;
        const key = part.slice(0, idx).trim();
        const note = part.slice(idx + 1).trim();
        if (key) result[key] = note;
    });
    return result;
}

function serializeHostNotes(obj) {
    if (!obj || typeof obj !== 'object') return '';
    return Object.entries(obj)
        .filter(([k]) => k)
        .map(([k, v]) => `${k}: ${v}`)
        .join(' | ');
}

// zoonosis: "áno"/"nie" (aj tolerantne "ano"/"true"/"1"/"yes") <-> boolean
function parseBoolField(value) {
    if (typeof value === 'boolean') return value;
    const v = String(value ?? '').trim().toLowerCase();
    return ['áno', 'ano', 'true', '1', 'yes', 'x'].includes(v);
}

function serializeBoolField(bool) {
    return bool ? 'áno' : 'nie';
}

// Hlboké porovnanie dvoch hodnôt (nezávislé od poradia kľúčov v objekte)
function deepEqual(a, b) {
    if (a === b) return true;
    if (typeof a !== typeof b) return false;
    if (a === null || b === null) return a === b;
    if (Array.isArray(a) || Array.isArray(b)) {
        if (!Array.isArray(a) || !Array.isArray(b)) return false;
        if (a.length !== b.length) return false;
        return a.every((v, i) => deepEqual(v, b[i]));
    }
    if (typeof a === 'object') {
        const keysA = Object.keys(a);
        const keysB = Object.keys(b);
        if (keysA.length !== keysB.length) return false;
        return keysA.every(k => deepEqual(a[k], b[k]));
    }
    return false;
}

// Zostaví polia záznamu (BEZ id/images — tie sa dopĺňajú podľa create/update)
// zo surového riadku Excelu.
function buildFieldsFromRow(row) {
    return {
        latinName: (row.latinName || '').toString().trim(),
        synonyms: parseListField(row.synonyms),
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
        hostGroups: parseListField(row.hostGroups),
        hosts: parseListField(row.hosts),
        hostNotes: parseHostNotes(row.hostNotes),
        sample: row.sample || 'Trus',
        stage: row.stage,
        group: row.group || '',
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
        diagnosticSigns: parseListField(row.diagnosticSigns),
        differentialDiagnosis: parseListField(row.differentialDiagnosis),
        lifeCycle: row.lifeCycle || '',
        pathology: row.pathology || '',
        zoonosis: parseBoolField(row.zoonosis),
        notes: row.notes || '',
    };
}

export function renderBulkTab() {
    const container = document.getElementById('tab-bulk');
    if (!container) return;

    container.innerHTML = `
        <div class="bulk-import">
            <div class="bulk-header">
                <h3>📊 Hromadný import parazitov z Excelu</h3>
                <p>Nahrajte súbor <strong>.xlsx</strong> alebo <strong>.xls</strong>. Načítané riadky sa automaticky pridajú medzi čakajúce zmeny.</p>
                <p style="font-size:0.9rem;color:#7f8c8d;">
                    <strong>Stĺpec "id":</strong> prázdny → vytvorí sa nový záznam (ID sa vygeneruje automaticky).
                    Vyplnený existujúcim ID → aktualizuje daný záznam (riadok prepíše všetky jeho polia okrem fotiek).
                    Vyplnený neexistujúcim ID → riadok sa preskočí a nahlási ako chyba.
                </p>
                <p style="font-size:0.9rem;color:#7f8c8d;">
                    <strong>Štruktúra stĺpcov:</strong> ${COLUMNS.join(', ')}
                </p>
                <p style="font-size:0.85rem;color:#7f8c8d;">
                    <strong>hostNotes formát:</strong> "Pes: poznámka pre psy | Mačka: iná poznámka".
                    <strong>imagesCount / imageUrls</strong> sú len informatívne — import ich ignoruje, fotky sa menia cez kartu "Fotografie".
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
                <button id="export-current-btn" class="btn btn-secondary" style="background:#8e44ad; color:white; border:none; padding:0.6rem 1.5rem; border-radius:4px; cursor:pointer; margin-left: 0.5rem;">
                    📥 Stiahnuť aktuálny stav (prehľad + round-trip)
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
            ['id (prázdne = nový, vyplnené = update existujúceho)', ''],
            ['hostNotes formát', 'Pes: poznámka | Mačka: poznámka'],
            ['zoonosis', 'áno / nie'],
        ];

        // 3. Vytvoriť šablónu s referenciami
        const sheetData = [
            COLUMNS.filter(c => c !== 'imagesCount' && c !== 'imageUrls'),
            [
                '', 'Babesia canis', '', '',
                'Protozoa', 'Apicomplexa', 'Aconoidasida', 'Piroplasmida', 'Babesiidae', 'Babesia', 'Babesia canis',
                'Trofozoit', 'Krv', 'Protozoa', 'Pes', '', '',
                5, 5, 2, 3, 'µm',
                'Okrúhly', 'Bezfarebný', 'Tenká',
                '', '',
                '', '', 'nie', 'Vnútri 4 rohlíkovité sporozoity',
            ],
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

    // Export aktuálneho stavu — teraz z state.workingCopy (zahŕňa aj čakajúce
    // zmeny z tejto session), so VŠETKÝMI poľami. Tento súbor je zámerne
    // navrhnutý tak, aby sa dal bez úprav použiť aj ako round-trip import
    // (stĺpec "id" je vyplnený → import ho spracuje ako update).
    document.getElementById('export-current-btn').addEventListener('click', () => {
        const parasites = state.workingCopy || state.parasites || [];

        if (parasites.length === 0) {
            showToast('❌ Databáza je prázdna, nie je čo exportovať.', 'error');
            return;
        }

        const rows = parasites.map(p => {
            const imageUrls = getImagesForParasiteExport(p.id);

            return [
                p.id || '',
                p.latinName || '',
                serializeListField(p.synonyms),
                p.slovakName || '',
                p.taxonomy?.kingdom || '',
                p.taxonomy?.phylum || '',
                p.taxonomy?.class || '',
                p.taxonomy?.order || '',
                p.taxonomy?.family || '',
                p.taxonomy?.genus || '',
                p.taxonomy?.species || '',
                p.stage || '',
                p.sample || '',
                p.group || '',
                serializeListField(p.hosts),
                serializeListField(p.hostGroups),
                serializeHostNotes(p.hostNotes),
                p.micrometry?.lengthMin ?? '',
                p.micrometry?.lengthMax ?? '',
                p.micrometry?.widthMin ?? '',
                p.micrometry?.widthMax ?? '',
                p.micrometry?.unit || '',
                p.morphology?.shape || '',
                p.morphology?.colour || '',
                p.morphology?.shell || '',
                serializeListField(p.diagnosticSigns),
                serializeListField(p.differentialDiagnosis),
                p.lifeCycle || '',
                p.pathology || '',
                serializeBoolField(!!p.zoonosis),
                p.notes || '',
                imageUrls.length,
                imageUrls.join('; '),
            ];
        });

        const sheetData = [COLUMNS, ...rows];

        const ws = XLSX.utils.aoa_to_sheet(sheetData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Aktuálny stav');

        const today = new Date().toISOString().split('T')[0];
        XLSX.writeFile(wb, `vetpara_aktualny_stav_${today}.xlsx`);

        showToast(`✅ Export hotový: ${parasites.length} parazitov.`, 'success');
    });

    // Spracovanie Excelu (create aj update podľa stĺpca "id")
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

                let createdCount = 0;
                let updatedCount = 0;
                let unchangedCount = 0;
                let unknownIdCount = 0;
                let invalidCount = 0;

                for (const row of jsonData) {
                    // Kontrola povinných polí
                    if (!row.latinName || !row.stage) {
                        invalidCount++;
                        continue;
                    }

                    const rowId = (row.id ?? '').toString().trim();
                    const fields = buildFieldsFromRow(row);

                    if (rowId) {
                        // --- UPDATE: id vyplnené, musí existovať vo workingCopy ---
                        const existing = (state.workingCopy || []).find(p => p.id === rowId);
                        if (!existing) {
                            unknownIdCount++;
                            continue;
                        }

                        const newRecord = {
                            ...fields,
                            id: existing.id,
                            images: existing.images || [],       // import fotky nemení
                        };

                        if (deepEqual(existing, newRecord)) {
                            unchangedCount++;
                            continue;
                        }

                        addPendingChange({
                            type: 'parasite',
                            action: 'update',
                            id: newRecord.id,
                            data: newRecord,
                        });
                        updatedCount++;

                    } else {
                        // --- CREATE: id prázdne, vygenerovať nové ---
                        // generateId() si sám overuje duplicitu voči state.parasites
                        // aj state.workingCopy (vrátane už spracovaných riadkov tohto importu).
                        const newId = generateId(fields.latinName, fields.stage, []);

                        const newRecord = {
                            ...fields,
                            id: newId,
                            images: [],
                        };

                        addPendingChange({
                            type: 'parasite',
                            action: 'create',
                            id: newRecord.id,
                            data: newRecord,
                        });
                        createdCount++;
                    }
                }

                const parts = [];
                if (createdCount > 0) parts.push(`${createdCount} nových`);
                if (updatedCount > 0) parts.push(`${updatedCount} aktualizovaných`);
                if (unchangedCount > 0) parts.push(`${unchangedCount} bez zmeny`);
                if (unknownIdCount > 0) parts.push(`⚠️ ${unknownIdCount} s neznámym ID (preskočené)`);
                if (invalidCount > 0) parts.push(`⚠️ ${invalidCount} neplatných (chýba latinName/stage)`);

                if (createdCount > 0 || updatedCount > 0) {
                    resultBox.textContent = '✅ Spracované: ' + parts.join(', ');
                    resultBox.style.color = '#27ae60';
                    showToast(`✅ Import hotový: ${parts.join(', ')}`, 'success');
                } else {
                    resultBox.textContent = '❌ Žiadne záznamy neboli pridané/aktualizované. ' + parts.join(', ');
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
