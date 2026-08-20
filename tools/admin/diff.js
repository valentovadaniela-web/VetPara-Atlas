export function showDiff(oldRecord, newRecord) {
    if (!oldRecord) {
        // Nový záznam
        return `<div style="color:#27ae60;font-weight:600;">🆕 NOVÝ ZÁZNAM</div>\n${formatRecord(newRecord)}`;
    }

    const diffLines = [];
    diffLines.push(`📝 Zmeny pre: ${oldRecord.id || '?'}\n`);

    // Porovnanie dvoch objektov (rekurzívne)
    function compareObjects(oldObj, newObj, path) {
        const allKeys = new Set([...Object.keys(oldObj || {}), ...Object.keys(newObj || {})]);

        for (const key of allKeys) {
            const oldVal = oldObj?.[key];
            const newVal = newObj?.[key];
            const currentPath = path ? `${path}.${key}` : key;

            // Preskočiť images (needitovateľné)
            if (currentPath === 'images') continue;

            // Rekurzívne pre objekty
            if (isPlainObject(oldVal) && isPlainObject(newVal)) {
                compareObjects(oldVal, newVal, currentPath);
                continue;
            }

            // Pre polia
            if (Array.isArray(oldVal) && Array.isArray(newVal)) {
                const oldStr = JSON.stringify(oldVal);
                const newStr = JSON.stringify(newVal);
                if (oldStr !== newStr) {
                    diffLines.push(`  ${currentPath}:`);
                    diffLines.push(`    - ${JSON.stringify(oldVal)}`);
                    diffLines.push(`    + ${JSON.stringify(newVal)}`);
                }
                continue;
            }

            // Primitívne hodnoty
            if (oldVal !== newVal) {
                const oldDisplay = oldVal === null || oldVal === undefined ? '—' : String(oldVal);
                const newDisplay = newVal === null || newVal === undefined ? '—' : String(newVal);
                diffLines.push(`  ${currentPath}:`);
                diffLines.push(`    - ${oldDisplay}`);
                diffLines.push(`    + ${newDisplay}`);
            }
        }

        // Zistenie odstránených kľúčov
        if (oldObj && newObj) {
            for (const key of Object.keys(oldObj)) {
                if (!(key in newObj)) {
                    diffLines.push(`  ${path ? path + '.' + key : key}:`);
                    diffLines.push(`    - ${JSON.stringify(oldObj[key])}`);
                    diffLines.push(`    + (odstránené)`);
                }
            }
            for (const key of Object.keys(newObj)) {
                if (!(key in oldObj)) {
                    diffLines.push(`  ${path ? path + '.' + key : key}:`);
                    diffLines.push(`    - (nové)`);
                    diffLines.push(`    + ${JSON.stringify(newObj[key])}`);
                }
            }
        }
    }

    compareObjects(oldRecord, newRecord, '');
    return diffLines.length > 1 ? diffLines.join('\n') : '✨ Žiadne zmeny';
}

function isPlainObject(obj) {
    return obj && typeof obj === 'object' && !Array.isArray(obj) && obj !== null;
}

function formatRecord(record) {
    return JSON.stringify(record, null, 2);
}