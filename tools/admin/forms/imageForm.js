import { state, addPendingChange, showToast } from '../admin.js';

// FIX: doteraz sa fotky brali len z p.images (embednuté priamo v parasites.json).
// Skutočný zdroj fotiek je ale database/images.json (state.images) — pri loadData()
// sa síce p.images kopírujú DO state.images, ale nie naopak, takže fotky, ktoré žijú
// len v images.json, sa v tomto tabe vôbec nezobrazili. Táto funkcia zlúči oba zdroje.
function getImagesForParasite(parasiteId) {
    const urls = new Set();
    for (const img of state.images || []) {
        if (img.parasiteId === parasiteId && img.url) urls.add(img.url);
    }
    const parasite = state.parasites.find(p => p.id === parasiteId);
    if (parasite?.images) {
        for (const url of parasite.images) urls.add(url);
    }
    return Array.from(urls);
}

// FIX: súbory typu "xxx_full.webp" sú sprievodný "zväčšovací" variant k
// "xxx.webp" — podľa existujúcej konvencie v projekte (fotky pridané pred
// zavedením hromadného uploadu) sa nikdy nezapisovali ako vlastný záznam
// v images.json, frontend si "_full" verziu dopočítaval sám podľa názvu.
// Bez tejto kontroly hromadný výber oboch súborov (thumb + full) vytvoril
// dva duplicitné záznamy pre tú istú fotku.
function isFullVariantFileName(fileName) {
    return /_full\.[a-z0-9]+$/i.test(fileName);
}

// FIX: perzistentný stav filtra naprieč prekresleniami tabu (kým sa
// nenačíta stránka znova) — bez tohto by sa filter pri každom renderImageTab()
// (napr. po pridaní/zmazaní fotky) tíško vypol.
let showOnlyMissing = false;

export function renderImageTab() {
    const container = document.getElementById('tab-image');
    if (!container) return;

    // FIX: pri prekreslení tabu (napr. po kliknutí na "Pridať") sa doteraz
    // celý obsah #tab-image nahradil odznova, takže vnútorný scrollovateľný
    // zoznam `.image-list` aj okno stránky skočili naspäť na začiatok —
    // autorka sa musela znova rolovať na pôvodné miesto. Pozíciu si tu
    // zapamätáme pred prekreslením a na konci funkcie ju obnovíme.
    const previousListEl = container.querySelector('.image-list');
    const previousListScrollTop = previousListEl ? previousListEl.scrollTop : 0;
    const previousWindowScrollY = window.scrollY;

    // Získať všetkých parazitov
    const parasites = state.parasites || [];
    // FIX: zoznam obrázkov na parazita počítame raz (zlúčené state.images + p.images)
    // a znovu použijeme pri vykreslení riadkov aj pri súčte v hlavičke.
    const imagesByParasite = new Map(parasites.map(p => [p.id, getImagesForParasite(p.id)]));
    const totalImages = Array.from(imagesByParasite.values()).reduce((acc, arr) => acc + arr.length, 0);

    // FIX: počet parazitov bez fotografie sa počíta vždy z KOMPLETNÉHO
    // zoznamu (nie z už vyfiltrovaného), aby číslo v popise checkboxu
    // zostalo správne aj keď je filter práve zapnutý.
    const missingCount = parasites.filter(p => (imagesByParasite.get(p.id) || []).length === 0).length;
    const visibleParasites = showOnlyMissing
        ? parasites.filter(p => (imagesByParasite.get(p.id) || []).length === 0)
        : parasites;

    container.innerHTML = `
        <div class="image-admin">
            <div class="image-header">
                <h3>📷 Správa fotografií</h3>
                <p>Existujúce obrázky: <strong>${totalImages}</strong></p>
                <p style="font-size:0.9rem;color:#7f8c8d;">
                    <strong>Poznámka:</strong> Nájdite v projekte priečinok <code>public/images/parasites/{id}</code> a nakopírujte do neho fotky. Tieto fotky budú automaticky používané.
                </p>
                <label style="display:inline-flex; align-items:center; gap:0.4rem; margin-top:0.4rem; font-size:0.9rem; cursor:pointer;">
                    <input type="checkbox" id="filter-missing-images" ${showOnlyMissing ? 'checked' : ''}>
                    Zobraziť len parazitov bez fotografie (${missingCount})
                </label>
            </div>

            <div class="image-list" style="max-height: 700px; overflow-y: auto; margin-top: 1rem;">
                ${visibleParasites.length === 0 ? `
                    <p style="padding: 1rem; text-align: center; color: #7f8c8d;">
                        Žiadny parazit nevyhovuje filtru — všetci majú aspoň jednu fotografiu. 🎉
                    </p>
                ` : visibleParasites.map(p => {
                    const imageUrls = imagesByParasite.get(p.id) || [];
                    const isMissing = imageUrls.length === 0;
                    return `
                        <section class="parasite-image-card${isMissing ? ' is-missing' : ''}">
                            <header class="parasite-image-card-header">
                                <div class="pic-title">
                                    <span class="pic-id">${p.id}</span>
                                    <span class="pic-latin">${p.latinName || ''}</span>
                                </div>
                                <span class="pic-count">${imageUrls.length} ${imageUrls.length === 1 ? 'obrázok' : 'obrázkov'}</span>
                            </header>

                            <div class="parasite-image-card-body">
                                <div class="image-urls">
                                    ${imageUrls.length > 0 ?
                                        imageUrls.map(url => `<div class="image-url-item">${url}</div>`).join('')
                                        : '<span class="image-urls-empty">Nie sú priradené žiadne obrázky</span>'
                                    }
                                </div>
                            </div>

                            <div class="parasite-image-card-actions">
                                <div class="action-field">
                                    <label>Vybrať súbory</label>
                                    <input type="file" class="image-file-input" data-id="${p.id}" accept="image/*" multiple>
                                </div>
                                <div class="action-field">
                                    <label>URL adresa</label>
                                    <input type="text" class="image-url-input" data-id="${p.id}" placeholder="https://...">
                                </div>
                                <div class="action-field action-field-buttons">
                                    <button class="add-image-btn" data-id="${p.id}">➕ Pridať</button>
                                    <button class="delete-image-btn" data-id="${p.id}">🗑️ Vymazať všetky</button>
                                </div>
                            </div>
                        </section>
                    `;
                }).join('')}
            </div>
        </div>
    `;

    // Udalosť pre filter "len bez fotografie"
    const filterCheckbox = document.getElementById('filter-missing-images');
    if (filterCheckbox) {
        filterCheckbox.addEventListener('change', () => {
            showOnlyMissing = filterCheckbox.checked;
            renderImageTab();
        });
    }

    // FIX: obnovenie scroll pozície (pozri poznámku na začiatku funkcie) —
    // až po vložení nového obsahu do DOM, aby scrollTop mal na čom platiť.
    const newListEl = container.querySelector('.image-list');
    if (newListEl) newListEl.scrollTop = previousListScrollTop;
    window.scrollTo({ top: previousWindowScrollY, behavior: 'auto' });

    // Udalosť pre pridanie obrázka
    document.querySelectorAll('.add-image-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.dataset.id;
            
            // 1. Skontrolovať, či sú súbory v inpute
            const fileInput = document.querySelector(`.image-file-input[data-id="${id}"]`);
            const files = fileInput?.files;

            // 2. Skontrolovať, či je URL v inputu
            const urlInput = document.querySelector(`.image-url-input[data-id="${id}"]`);
            const url = urlInput?.value?.trim();

            if (files && files.length > 0) {
                // HROMADNÉ PRIDANIE SÚBOROV
                // FIX: súbory s "_full" v názve sú sprievodný variant k base
                // fotke (na zväčšenie), nie samostatná fotka — preskočíme ich,
                // aby nevznikol duplicitný záznam. Fyzicky ich aj tak treba
                // nakopírovať na disk vedľa base súboru (frontend si ich
                // dopočíta podľa názvu), len nedostanú vlastný riadok v JSON.
                let addedCount = 0;
                let skippedFullCount = 0;

                for (const file of files) {
                    const fileName = file.name;

                    if (isFullVariantFileName(fileName)) {
                        skippedFullCount++;
                        continue;
                    }
                    
                    // Vytvoríme správnu cestu (kde by súbor mal byť v projekte)
                    const baseUrl = '/public/images/parasites/' + id + '/' + fileName;
                    
                    // Vytvorenie pravidla pre nový obrázok
                    addPendingChange({
                        type: 'image',
                        action: 'create',
                        id: 'image-' + id + '-' + fileName,
                        data: {
                            parasiteId: id,
                            url: baseUrl,
                            alt: '',
                            caption: '',
                            credit: '',
                            dateAdded: new Date().toISOString(),
                        }
                    });

                    // Uložíme do state.parasites
                    const parasite = state.parasites.find(p => p.id === id);
                    if (parasite) {
                        if (!parasite.images) parasite.images = [];
                        parasite.images.push(baseUrl);

                        // --- KRITICKÝ RIADOK ---
                        state.workingCopy = JSON.parse(JSON.stringify(state.parasites));
                    }

                    // FIX: aj state.images musí vedieť o novej fotke, inak sa po
                    // opätovnom vykreslení tabu (alebo pri exporte) nezobrazí/nezapíše.
                    if (!state.images.find(img => img.url === baseUrl && img.parasiteId === id)) {
                        state.images.push({
                            parasiteId: id,
                            url: baseUrl,
                            alt: '',
                            caption: '',
                            credit: '',
                            dateAdded: new Date().toISOString(),
                        });
                    }

                    addedCount++;
                }

                if (addedCount > 0) {
                    const skippedNote = skippedFullCount > 0
                        ? ` (${skippedFullCount}× "_full" variant preskočený — nepotrebuje vlastný záznam, len ho nezabudni nakopírovať na disk vedľa base súboru)`
                        : '';
                    showToast(`✅ ${addedCount} obrázkov bolo pridaných k parazitu "${id}".${skippedNote}`, 'success');
                } else {
                    showToast(`❌ Vybrané súbory boli len "_full" varianty — tie sa nezapisujú ako samostatný záznam. Vyber aj base súbor (bez "_full").`, 'error');
                }
                renderImageTab();
            } else if (url) {
                // Pridanie cez URL
                const newImageUrl = url;
                
                addPendingChange({
                    type: 'image',
                    action: 'create',
                    id: 'image-' + id + '-' + url,
                    data: {
                        parasiteId: id,
                        url: newImageUrl,
                        alt: '',
                        caption: '',
                        credit: '',
                        dateAdded: new Date().toISOString(),
                    }
                });

                // Uložíme do state.parasites
                const parasite = state.parasites.find(p => p.id === id);
                if (parasite) {
                    if (!parasite.images) parasite.images = [];
                    parasite.images.push(newImageUrl);

                    // FIX: chýbal rebuild workingCopy pre vetvu "pridanie cez URL"
                    // (multi-file vetva to robila, táto nie — nekonzistentné so zvyškom appky)
                    state.workingCopy = JSON.parse(JSON.stringify(state.parasites));
                }

                // FIX: aj state.images musí vedieť o novej fotke
                if (!state.images.find(img => img.url === newImageUrl && img.parasiteId === id)) {
                    state.images.push({
                        parasiteId: id,
                        url: newImageUrl,
                        alt: '',
                        caption: '',
                        credit: '',
                        dateAdded: new Date().toISOString(),
                    });
                }

                showToast(`✅ Obrázok cez URL bol pridaný.`, 'success');
                renderImageTab();
            } else {
                showToast('❌ Zadajte URL adresu alebo vyberte súbor.', 'error');
                return;
            }
        });
    });

    // Udalosť pre vymazanie všetkých obrázkov
    document.querySelectorAll('.delete-image-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.dataset.id;

            // Potvrdenie
            if (!confirm(`Naozaj chcete vymazať všetky obrázky priradené k parazitu "${id}"?`)) {
                return;
            }

            // Vymazať z parazita
            const parasite = state.parasites.find(p => p.id === id);
            if (parasite) {
                parasite.images = [];
                // FIX: bez tohto sa zmazanie neprejavilo v exporte, lebo zipExport.js
                // sťahuje dáta zo state.workingCopy, nie zo state.parasites priamo.
                state.workingCopy = JSON.parse(JSON.stringify(state.parasites));
            }

            // FIX: state.images (zdroj pre database/images.json pri exporte) doteraz
            // nebol pri mazaní vôbec upravený — fotka by sa "zmazala" len vizuálne
            // v tomto tabe, ale reálne by prežila v exportovanom images.json.
            state.images = (state.images || []).filter(img => img.parasiteId !== id);

            // Pridanie záznamu k čakajúcim zmenám
            addPendingChange({
                type: 'image',
                action: 'delete',
                id: id,
                data: null
            });

            showToast(`🗑️ Všetky obrázky boli vymazané pre parazita "${id}".`, 'error');
            renderImageTab();
        });
    });
}