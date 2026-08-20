import { state, updatePendingUI } from './admin.js';

export async function exportZip() {
    if (state.pendingChanges.length === 0) {
        alert('Nie sú žiadne čakajúce zmeny na export.');
        return;
    }

    try {
        // FIX #2: Použiť workingCopy namiesto skladania odznova
        // workingCopy už obsahuje všetky aplikované zmeny
        const finalParasites = JSON.parse(JSON.stringify(state.workingCopy));

        // Vytvorenie ZIP
        const zip = new JSZip();

        // parasites.json
        zip.file('database/parasites.json', JSON.stringify(finalParasites, null, 2));

        // README
        const changeLog = state.pendingChanges.map(ch => {
            if (ch.type === 'parasite') {
                if (ch.action === 'create') return `🆕 CREATE: ${ch.id}`;
                if (ch.action === 'update') return `✏️ UPDATE: ${ch.id}`;
                if (ch.action === 'delete') return `🗑 DELETE: ${ch.id}`;
            }
            return `❓ ${ch.type}: ${ch.action} ${ch.id}`;
        }).join('\n');

        const readme = `# VetPara Atlas — Export zmien\n
Dátum exportu: ${new Date().toISOString()}
Počet zmien: ${state.pendingChanges.length}

Zoznam zmien:
${changeLog}

Inštrukcie:
1. Nahraď súbor database/parasites.json v repozitári týmto súborom.
2. Skontroluj, či všetky zmeny vyzerajú správne.
3. Commitni a pushni do repozitára.
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