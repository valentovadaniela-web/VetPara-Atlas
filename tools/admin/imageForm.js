import { state, addPendingChange, showToast } from '../admin.js';

export function renderImageTab() {
    const container = document.getElementById('tab-image');
    if (!container) return;

    // Získať všetkých parazitov
    const parasites = state.parasites || [];

    container.innerHTML = `
        <div class="image-admin">
            <div class="image-header">
                <h3>📷 Správa fotografií</h3>
                <p>Existujúce obrázky: <strong>${parasites.reduce((acc, p) => acc + (p.images?.length || 0), 0)}</strong></p>
                <p style="font-size:0.9rem;color:#7f8c8d;">
                    <strong>Poznámka:</strong> Nahrávanie obrázkov cez Admina je už jednoduché. Vyberte fotku zo svojho počítača, alebo zadajte URL adresu. V oboch prípadoch sa cestu uloží priamo do záznamu.
                </p>
            </div>

            <div class="image-list" style="max-height: 600px; overflow-y: auto; margin-top: 1rem;">
                <table class="table" style="width: 100%; border-collapse: collapse;">
                    <thead style="background: #ecf0f1;">
                        <tr>
                            <th style="padding: 0.5rem; text-align: left;">ID parazita</th>
                            <th style="padding: 0.5rem; text-align: left;">Latinský názov</th>
                            <th style="padding: 0.5rem; text-align: left;">Zoznam obrázkov</th>
                            <th style="padding: 0.5rem; text-align: left;">Pridanie obrázka</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${parasites.map(p => {
                            const imageUrls = p.images || [];
                            return `
                                <tr style="border-bottom: 1px solid #ecf0f1;">
                                    <td style="padding: 0.5rem; font-family: monospace; font-size: 0.8rem;">${p.id}</td>
                                    <td style="padding: 0.5rem; font-size: 0.9rem;">${p.latinName || ''}</td>
                                    <td style="padding: 0.5rem; font-size: 0.9rem;">
                                        <div class="image-urls" style="max-width: 300px; overflow-wrap: break-word;">
                                            ${imageUrls.length > 0 ? 
                                                imageUrls.map(url => `<div style="margin-bottom:0.2rem;">${url}</div>`).join('') 
                                                : '<span style="color:#95a5a6;">Nie sú priradené žiadne obrázky</span>'
                                            }
                                        </div>
                                    </td>
                                    <td style="padding: 0.5rem;">
                                        <div class="image-actions" style="display: flex; gap: 0.5rem; flex-direction: column;">
                                            <!-- Nahrávanie cez súbor -->
                                            <input type="file" class="image-file-input" data-id="${p.id}" accept="image/*" style="width: 100%; max-width: 250px; border: 1px solid #bdc3c7; border-radius: 4px; padding: 0.2rem;">
                                            <!-- Pridanie cez URL -->
                                            <input type="text" class="image-url-input" data-id="${p.id}" placeholder="URL adresa obrázka" style="width: 100%; max-width: 250px; padding: 0.2rem 0.5rem; border: 1px solid #bdc3c7; border-radius: 4px;">
                                            <button class="add-image-btn" data-id="${p.id}" style="background:#27ae60; color:white; border:none; padding: 0.2rem 0.8rem; border-radius: 4px; cursor:pointer;">Pridať</button>
                                            <button class="delete-image-btn" data-id="${p.id}" style="background:#e74c3c; color:white; border:none; padding: 0.2rem 0.8rem; border-radius: 4px; cursor:pointer;">Vymazať všetky</button>
                                        </div>
                                    </td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;

    // Udalosť pre pridanie obrázka
    document.querySelectorAll('.add-image-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.dataset.id;
            
            // 1. Skontrolovať, či je súbor v inpute
            const fileInput = document.querySelector(`.image-file-input[data-id="${id}"]`);
            const file = fileInput?.files?.[0];

            // 2. Skontrolovať, či je URL v inputu
            const urlInput = document.querySelector(`.image-url-input[data-id="${id}"]`);
            const url = urlInput?.value?.trim();

            if (file) {
                // Čítame súbor a vytvoríme URL (Object URL)
                const objectUrl = URL.createObjectURL(file);
                // Vytvoríme náhodné ID pre súbor
                const fileName = file.name;
                
                // Zapíšeme URL do záznamu (alebo presnejšie: vložíme miesto, kam sa súbor uloží)
                // POZNÁMKA: Ukladanie reálnych súborov na disk vyžaduje backend. Preto to počas behu aplikácie
                // budeme evidovať len ako jednoduché URL, ktoré sa automaticky zobrazí v Atlasu.
                // To, že súbor budete musieť nakoniec nakopírovať na disk, je nevyhnutné kvôli
                // nedostatku backendu (Server-side). Toto je čisto "frontend" nástroj.
                const baseUrl = '/public/images/parasites/' + id + '/' + fileName;
                
                // Vytvorenie pravidla pre nový obrázok
                const newImageUrl = objectUrl; // Toto je dočasná URL
                
                // Spracovanie
                addPendingChange({
                    type: 'image',
                    action: 'create',
                    id: 'image-' + id + '-' + fileName,
                    data: {
                        parasiteId: id,
                        url: baseUrl, // Vložíme do JSON cestu, kde by mal súbor byť
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

                // --- Uloženie do workingCopy ---
                state.workingCopy = JSON.parse(JSON.stringify(state.parasites));
                }

                showToast(`✅ Záznam pre obrázok bol pridaný. (Súbor si nezabudnite nakopírovať na disk)`, 'success');
                
                // Obnovenie
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
            }

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