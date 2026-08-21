import { state, updatePendingUI } from './admin.js';

export async function exportZip() {
    if (state.pendingChanges.length === 0) {
        alert('Nie sú žiadne čakajúce zmeny na export.');
        return;
    }

    try {
        // FIX #2: Použiť workingCopy namiesto skladania odznova
        // workingCopy už obsahuje všetky aplikované zmeny pre parazitov
        const finalParasites = JSON.parse(JSON.stringify(state.workingCopy));

        // --- NOVÉ: Spracovanie hostiteľov ---
        // Vytvoríme kópiu aktuálnej hostHierarchy
        const finalHostHierarchy = JSON.parse(JSON.stringify(state.hostHierarchy));

        // --- NOVÉ: Spracovanie obrázkov ---
        // 1. Zoberieme všetky existujúce obrázky z state.images
        let finalImages = state.images ? JSON.parse(JSON.stringify(state.images)) : [];

        // 2. Vytiahneme aj obrázky, ktoré sú priamo v záznamoch parazitov (v poli "images")
        for (const parasite of finalParasites) {
            if (parasite.images && Array.isArray(parasite.images) && parasite.images.length > 0) {
                for (const url of parasite.images) {
                    // Ak tento obrázok ešte nie je v finalImages, pridáme ho
                    const existing = finalImages.find(img => img.url === url && img.parasiteId === parasite.id);
                    if (!existing) {
                        finalImages.push({
                            parasiteId: parasite.id,
                            url: url,
                            alt: '',
                            caption: '',
                            credit: '',
                            dateAdded: new Date().toISOString(),
                        });
                    }
                }
            }
        }

        // --- Vytvorenie ZIP ---
        const zip = new JSZip();

        // 1. Pridanie parasites.json
        zip.file('database/parasites.json', JSON.stringify(finalParasites, null, 2));

        // 2. Pridanie host_hierarchy.json (NOVÉ)
        zip.file('database/dictionary/host_hierarchy.json', JSON.stringify(finalHostHierarchy, null, 2));

        // 3. Pridanie images.json (NOVÉ - automaticky obsahuje aj obrázky z parasites.json)
        if (finalImages.length > 0) {
            zip.file('database/images.json', JSON.stringify(finalImages, null, 2));
        }

        // 4. README s podrobným logom zmien
        const changeLog = state.pendingChanges.map(ch => {
            if (ch.type === 'parasite') {
                if (ch.action === 'create') return `🆕 PARASITE CREATE: ${ch.id}`;
                if (ch.action === 'update') return `✏️ PARASITE UPDATE: ${ch.id}`;
                if (ch.action === 'delete') return `🗑️ PARASITE DELETE: ${ch.id}`;
            }
            if (ch.type === 'host') {
                if (ch.action === 'create') return `🆕 HOST CREATE: ${ch.key} (parent: ${ch.parent || 'žiadny'})`;
                if (ch.action === 'delete') return `🗑️ HOST DELETE: ${ch.key}`;
            }
            if (ch.type === 'image') {
                if (ch.action === 'create') return `🆕 IMAGE CREATE: ${ch.id}`;
                if (ch.action === 'delete') return `🗑️ IMAGE DELETE: ${ch.id}`;
            }
            return `❓ ${ch.type}: ${ch.action} ${ch.id || ch.key}`;
        }).join('\n');

        const readme = `# VetPara Atlas — Export zmien\n
Dátum exportu: ${new Date().toISOString()}
Počet zmien: ${state.pendingChanges.length}

Zoznam zmien:
${changeLog}

Inštrukcie:
1. Nahraď súbor database/parasites.json v repozitári týmto súborom.
2. Nahraď súbor database/dictionary/host_hierarchy.json v repozitári týmto súborom (ak obsahuje zmeny hostiteľov).
3. Nahraď súbor database/images.json v repozitári týmto súborom (ak obsahuje zmeny obrázkov).
4. Skontroluj, či všetky zmeny vyzerajú správne.
5. Commitni a pushni do repozitára.
`;

        zip.file('README.txt', readme);

        // Generovanie ZIP
        const blob = await zip.generateAsync({ type: 'blob' });

        // Stiahnutie
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 16);
        a.download = `vetpara-admin-export-${timestamp}.zip`;
        a.href = url;
        a.click();
        URL.revokeObjectURL(url);

    } catch (err) {
        console.error('Export zlyhal:', err);
        alert('Export zlyhal: ' + err.message);
    }
}