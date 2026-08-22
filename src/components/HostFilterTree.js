/******************************************************************************
 * VetPara Atlas
 * HostFilterTree — zdieľaná logika viacúrovňového rozbaľovacieho filtra
 * hostiteľov (podľa dictionary/host_hierarchy.json).
 *
 * Extrahované z AtlasPage.js (session 2026-08-22, viacúrovňové
 * rozbaľovanie + hromadný výber celej kategórie) do samostatného modulu,
 * aby ROVNAKÚ logiku (aj markup, aj CSS triedy) mohla použiť aj
 * GalleryPage.js bez toho, aby sa kód duplikoval na dvoch miestach.
 *
 * Čisto funkčný modul bez vlastného stavu — volajúca stránka (AtlasPage /
 * GalleryPage) si drží vlastný `state.host` (zoznam vybraných hostiteľov)
 * a `hostHierarchy` (obsah host_hierarchy.json), tento modul iba:
 *  1) vygeneruje HTML markup stromu (rovnaké CSS triedy ako doteraz:
 *     .host-accordion, .checkbox-group, .checkbox-label, .standalone-group,
 *     .host-group-select, ...) — štýly ostávajú v atlas.css a platia
 *     globálne pre obe stránky (žiadne nové CSS triedy).
 *  2) naviaže event listenery a cez callback `onChange(selectedHosts)`
 *     oznámi volajúcej stránke novú množinu vybraných hostiteľov.
 *
 * Markup aj DOM-logika sú zámerne 1:1 zhodné s pôvodnou implementáciou v
 * AtlasPage.js, aby sa vizuálne ani funkčne nič nezmenilo tam, kde sa už
 * používali (Atlas), a aby fungovali identicky aj v Galérii.
 ******************************************************************************/

function escapeHtml(value) {

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");

}

/**
 * Postaví mapu parent -> [deti] invertovaním host_hierarchy.json
 * (súbor je vo formáte {dieťa: rodič}).
 */
function buildChildrenMap(hostHierarchy) {

    const childrenMap = {};

    Object.entries(hostHierarchy || {}).forEach(([child, parent]) => {

        if (!parent) {
            return;
        }

        if (!childrenMap[parent]) {
            childrenMap[parent] = [];
        }

        childrenMap[parent].push(child);

    });

    return childrenMap;

}

/**
 * Korene stromu = uzly (kľúče aj hodnoty v hostHierarchy), ktoré samy
 * nemajú predka.
 */
function getRoots(hostHierarchy) {

    const allNodes = new Set([
        ...Object.keys(hostHierarchy || {}),
        ...Object.values(hostHierarchy || {}).filter(Boolean)
    ]);

    return [...allNodes].filter(node => !(hostHierarchy || {})[node]);

}

/**
 * Rekurzívne postaví jednu úroveň stromu (skupinu alebo podskupinu) ako
 * samostatný rozbaľovací <details> blok. Vracia { html, count, anyChecked,
 * matched } — pozri pôvodný popis v AtlasPage.js (renderHostNode).
 */
function renderNode(node, childrenMap, hostsInUse, selectedHosts, fieldName) {

    const children = childrenMap[node] || [];
    const leaves = [];
    const subGroups = [];
    let anyChecked = false;
    const matched = [];

    if (hostsInUse.has(node)) {

        const checked = selectedHosts.includes(node);

        if (checked) {
            anyChecked = true;
        }

        leaves.push({
            name: node,
            html: `
                <label class="checkbox-label">
                    <input type="checkbox" value="${escapeHtml(node)}" data-field="${fieldName}"
                        ${checked ? "checked" : ""}>
                    ${escapeHtml(node)} (všeobecne)
                </label>
            `
        });

        matched.push(node);

    }

    children.forEach(child => {

        if (childrenMap[child] && childrenMap[child].length > 0) {

            const sub = renderNode(child, childrenMap, hostsInUse, selectedHosts, fieldName);

            if (sub.html) {
                subGroups.push({ name: child, html: sub.html, count: sub.count });
                matched.push(...sub.matched);
                if (sub.anyChecked) {
                    anyChecked = true;
                }
            }

        }
        else if (hostsInUse.has(child)) {

            const checked = selectedHosts.includes(child);

            if (checked) {
                anyChecked = true;
            }

            leaves.push({
                name: child,
                html: `
                    <label class="checkbox-label">
                        <input type="checkbox" value="${escapeHtml(child)}" data-field="${fieldName}"
                            ${checked ? "checked" : ""}>
                        ${escapeHtml(child)}
                    </label>
                `
            });

            matched.push(child);

        }

    });

    const count = leaves.length +
        subGroups.reduce((sum, group) => sum + group.count, 0);

    if (count === 0) {
        return { html: "", count: 0, anyChecked: false, matched: [] };
    }

    leaves.sort((a, b) => a.name.localeCompare(b.name, "sk"));
    subGroups.sort((a, b) => a.name.localeCompare(b.name, "sk"));

    const groupHostsAttr = matched
        .map(host => escapeHtml(host))
        .join("|");

    const html = `
        <details class="host-accordion" ${anyChecked ? "open" : ""}>
            <summary class="host-accordion-summary">
                <label class="host-group-select-label" onclick="event.stopPropagation()">
                    <input
                        type="checkbox"
                        class="host-group-select"
                        data-hosts="${groupHostsAttr}"
                        aria-label="Vybrať všetkých hostiteľov v skupine ${escapeHtml(node)}"
                    >
                </label>
                <span class="accordion-title-wrap">
                    <span class="accordion-title">${escapeHtml(node)}</span>
                    <span class="accordion-badge">(${count})</span>
                </span>
            </summary>
            ${leaves.length > 0 ? `
                <div class="checkbox-group accordion-content">
                    ${leaves.map(leaf => leaf.html).join("")}
                </div>
            ` : ""}
            ${subGroups.length > 0 ? `
                <div class="accordion-content host-subgroups">
                    ${subGroups.map(group => group.html).join("")}
                </div>
            ` : ""}
        </details>
    `;

    return { html, count, anyChecked, matched };

}

/**
 * Vygeneruje kompletnú HTML sekciu filtra ("<div class="filter-section">
 * <fieldset>...</fieldset></div>") — rovnaký markup ako doteraz
 * AtlasPage.renderHostFilterSection().
 *
 * @param {Object} options
 * @param {string} options.fieldsetId - id <fieldset> (napr. "atlas-filter-host" / "gallery-filter-host")
 * @param {string} options.legend - text <legend> (napr. "Hostiteľ")
 * @param {string[]} options.hosts - zoznam všetkých použitých hostiteľov (napr. z Repository.resolveHosts)
 * @param {Object} options.hostHierarchy - obsah dictionary/host_hierarchy.json ({dieťa: rodič})
 * @param {string[]} options.selectedHosts - aktuálne vybraní hostitelia (state.host)
 * @param {string} options.fieldName - hodnota data-field na checkboxoch (zvyčajne "host")
 */
function renderFilterSection({ fieldsetId, legend, hosts, hostHierarchy, selectedHosts, fieldName }) {

    if (!hosts || hosts.length === 0) {
        return "";
    }

    const hostsInUse = new Set(hosts);
    const childrenMap = buildChildrenMap(hostHierarchy);
    const roots = getRoots(hostHierarchy);

    const matchedOverall = new Set();
    const rootBlocks = [];

    roots.forEach(root => {

        const result = renderNode(root, childrenMap, hostsInUse, selectedHosts, fieldName);

        if (result.html) {
            rootBlocks.push({ name: root, html: result.html });
            result.matched.forEach(host => matchedOverall.add(host));
        }

    });

    rootBlocks.sort((a, b) => a.name.localeCompare(b.name, "sk"));

    // Hostitelia, ktorí sa vôbec nenachádzajú v host_hierarchy.json
    // (nemajú predka ani potomkov) → samostatné položky mimo accordionov.
    const standaloneHosts = hosts.filter(host => !matchedOverall.has(host));

    return `
        <div class="filter-section">
            <fieldset id="${fieldsetId}">
                <legend class="filter-title">${escapeHtml(legend)}</legend>

                ${rootBlocks.map(block => block.html).join("")}

                ${standaloneHosts.length > 0 ? `
                    <div class="checkbox-group standalone-group">
                        ${standaloneHosts.map(host => `
                            <label class="checkbox-label">
                                <input type="checkbox" value="${escapeHtml(host)}" data-field="${fieldName}"
                                    ${selectedHosts.includes(host) ? "checked" : ""}>
                                ${escapeHtml(host)}
                            </label>
                        `).join("")}
                    </div>
                ` : ""}
            </fieldset>
        </div>
    `;

}

/**
 * Naviaže "change" listenery na jednotlivé checkboxy hostiteľov
 * (input[data-field="fieldName"]) vo vnútri daného fieldsetu. Pri zmene
 * prepočíta stav "vybrať skupinu" checkboxov a zavolá onChange(selectedHosts).
 */
function bindCheckboxes(fieldsetEl, fieldName, onChange) {

    if (!fieldsetEl) {
        return;
    }

    const selector = `input[type="checkbox"][data-field="${fieldName}"]`;

    fieldsetEl.querySelectorAll(selector).forEach(checkbox => {

        checkbox.addEventListener("change", () => {

            const selected = Array.from(fieldsetEl.querySelectorAll(`${selector}:checked`))
                .map(input => input.value);

            updateGroupSelectStates(fieldsetEl, fieldName);

            onChange(selected);

        });

    });

}

/**
 * Naviaže "vybrať celú skupinu" checkboxy (.host-group-select) — kliknutím
 * sa naraz zaškrtnú/odškrtnú všetci hostitelia v danej vetve stromu.
 * Zavolá tiež updateGroupSelectStates() na počiatočné nastavenie
 * zaškrtnutý/indeterminate stavu.
 */
function bindGroupSelectors(fieldsetEl, fieldName, onChange) {

    if (!fieldsetEl) {
        return;
    }

    fieldsetEl.querySelectorAll(".host-group-select").forEach(groupCheckbox => {

        groupCheckbox.addEventListener("change", () => {

            const hosts = (groupCheckbox.dataset.hosts || "")
                .split("|")
                .filter(Boolean);

            const shouldCheck = groupCheckbox.checked;

            hosts.forEach(host => {

                const target = fieldsetEl.querySelector(
                    `input[type="checkbox"][data-field="${fieldName}"][value="${CSS.escape(host)}"]`
                );

                if (target) {
                    target.checked = shouldCheck;
                }

            });

            const selected = Array.from(
                fieldsetEl.querySelectorAll(`input[type="checkbox"][data-field="${fieldName}"]:checked`)
            ).map(input => input.value);

            updateGroupSelectStates(fieldsetEl, fieldName);

            onChange(selected);

        });

    });

    // Počiatočný stav (napr. po prekreslení sekcie) — nech je vždy
    // konzistentný so skutočne zaškrtnutými checkboxami.
    updateGroupSelectStates(fieldsetEl, fieldName);

}

/**
 * Prepočíta zaškrtnutie/indeterminate stav všetkých ".host-group-select"
 * checkboxov podľa toho, koľko z ich `data-hosts` potomkov je práve
 * zaškrtnutých v skutočnom filtri.
 */
function updateGroupSelectStates(fieldsetEl, fieldName) {

    if (!fieldsetEl) {
        return;
    }

    fieldsetEl.querySelectorAll(".host-group-select").forEach(groupCheckbox => {

        const hosts = (groupCheckbox.dataset.hosts || "")
            .split("|")
            .filter(Boolean);

        if (hosts.length === 0) {
            groupCheckbox.checked = false;
            groupCheckbox.indeterminate = false;
            return;
        }

        const checkedCount = hosts.filter(host => {

            const target = fieldsetEl.querySelector(
                `input[type="checkbox"][data-field="${fieldName}"][value="${CSS.escape(host)}"]`
            );

            return target && target.checked;

        }).length;

        groupCheckbox.checked = checkedCount === hosts.length;
        groupCheckbox.indeterminate =
            checkedCount > 0 && checkedCount < hosts.length;

    });

}

const HostFilterTree = {
    renderFilterSection,
    bindCheckboxes,
    bindGroupSelectors,
    updateGroupSelectStates,
    escapeHtml
};

export default HostFilterTree;
