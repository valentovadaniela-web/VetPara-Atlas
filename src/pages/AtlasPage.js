/******************************************************************************
 * VetPara Atlas
 * Atlas UI
 *
 * POZNÁMKA (2026-08-11): Prepracované na novú databázovú schému podľa
 * 02_DATABASE_SPECIFICATION.md — polia latinName / host[] / micrometry{} /
 * morphology{shape,colour,shell} nahrádzajú staré ploché polia
 * taxon / host (text) / size (text) / shape / color / wall.
 *
 * POZNÁMKA (2026-08-13): Rozšírené podľa Úlohy.txt:
 *  - zobrazenie diagnosticSigns (karta + detail)
 *  - zobrazenie taxonomy v detaile + externé odkazy na Catalogue of Life / WoRMS
 *  - filter podľa veľkosti (rozsah dĺžka/šírka od-do, prekryv s nameraným rozsahom)
 *  - filter podľa sample ("materiál")
 *  - multi-select pre host/shape/colour/sample (OR logika v rámci poľa)
 *  - fulltext rozšírený na notes, diagnosticSigns, morphology.*
 *
 * POZNÁMKA (2026-08-15): Vizuálny reskin podľa externého mockupu/master-promptu
 * (plán zaznamenaný v AI_STATUS.md v7). Zmenil sa iba markup/CSS a widget typ
 * niektorých filtrov, FILTROVACIA LOGIKA OSTÁVA IDENTICKÁ:
 *  - host/sample: z <select multiple> na skupinu checkboxov (CHECKBOX_FIELDS),
 *    stále OR logika v rámci poľa, `state.host`/`state.sample` sa nemenili.
 *  - shape/colour: ZACHOVANÉ ako <select multiple> (MULTI_SELECT_FIELDS),
 *    na explicitné želanie autorky.
 *  - veľkostný filter: PÔVODNÝ (4× number input min/max pre dĺžku a šírku)
 *    ZACHOVANÝ bez zmeny logiky — autorka sa rozhodla proti dual-range
 *    sliderom, zmenil sa iba obal (fieldset teraz vnútri .filter-section
 *    namiesto samostatného .atlas-size-filter divu).
 *  - koreňový element `render()` má teraz `id="database-view"`,
 *    `showDetail()` `id="detail-view"` (kvôli CSS selektorom vo variables.css).
 *
 * POZNÁMKA (2026-08-17): Implementované hierarchické zoskupovanie hostiteľov.
 * Top-level položky tvoria mix rozbaľovacích skupín (vypočítaných prechodom hore
 * cez host_hierarchy.json) a samostatných hostiteľov stojacich mimo slovníka.
 ******************************************************************************/

import Repository from "../services/Repository.js";
import DatabaseService from "../services/DatabaseService.js";
import PrimaryImage from "../components/PrimaryImage.js";

// OPRAVA (2026-08-17, bug: pád celej appky): pôvodný statický
// `import hostHierarchy from ".../host_hierarchy.json" with { type: "json" }`
// je za behu krehký — ak prehliadač/server nepodporí import attributes
// alebo súbor 404-uje/zlú MIME hlavičku, ZLYHÁ CELÝ MODUL AtlasPage.js pri
// parsovaní a appka spadne (presne toto sa stalo). Nahradené bezpečným
// async fetchom cez DatabaseService.load() (rovnaká konvencia ako pre
// ostatných 14 databázových súborov) s try/catch fallbackom — pozri
// loadHostHierarchy() nižšie.
const HOST_HIERARCHY_FILE = "dictionary/host_hierarchy.json";

// Checkboxové filtre — OR logika v rámci poľa.
const CHECKBOX_FIELDS = ["host"];

// select-multiple, na explicitné želanie autorky (2026-08-17: "sample" sem
// preradený na jej výslovnú žiadosť — Materiál má vyzerať a fungovať ako
// Tvar/Farba).
const MULTI_SELECT_FIELDS = ["sample", "shape", "colour"];

const AtlasPage = {

    state: {
        search: "",
        host: [],
        shape: [],
        colour: [],
        sample: [],
        lengthMin: "",
        lengthMax: "",
        widthMin: "",
        widthMax: ""
    },

    // OPRAVA (2026-08-17): nahrádza pôvodný statický `import ... with { type: "json" }`.
    // hostHierarchy je {} kým sa async fetch nedokončí — dovtedy
    // getTopLevelGroup() vráti pre každého hostiteľa null, takže render()
    // ukáže bezpečný fallback (všetci hostitelia ako "standalone", bez
    // skupín) namiesto pádu appky. Po dokončení loadHostHierarchy() sa
    // filter hostiteľov prekreslí so skupinami.
    hostHierarchy: {},
    hostHierarchyLoaded: false,

    render() {

        return `
            <div id="database-view" class="view-page active-view">

                <div class="database-layout">

                    <aside class="filter-sidebar card">

                        <div class="atlas-header">

                            <h1>Atlas parazitov</h1>

                            <p>
                                Diagnostický atlas veterinárnej parazitológie
                            </p>

                        </div>

                        ${this.renderHostFilterSection(this.getHostValues())}

                        ${this.renderMultiFilter(
                            "sample",
                            "Materiál (vzorka)",
                            this.getValues("sample")
                        )}

                        ${this.renderMultiFilter(
                            "shape",
                            "Tvar",
                            this.getValues("morphology.shape")
                        )}             

                        ${this.renderMultiFilter(
                            "colour",
                            "Farba",
                            this.getValues("morphology.colour")
                        )}

                        ${this.renderSizeFilterSection()}

                        <div
                            id="atlas-active-filters"
                            class="atlas-active-filters"
                            aria-live="polite"
                        ></div>

                        <button
                            type="button"
                            id="atlas-clear-filters"
                            class="atlas-clear-filters"
                        >
                            Zrušiť všetky filtre
                        </button>

                    </aside>

                    <main>

                        <label for="atlas-search-input" class="sr-only">
                            Vyhľadávanie
                        </label>

                        <input
                            id="atlas-search-input"
                            class="search-input"
                            type="search"
                            placeholder="Hľadať v názve, znakoch, poznámkach..."
                            aria-label="Vyhľadávanie parazita"
                            autocomplete="off"
                        >

                        <div
                            id="atlas-results-count"
                            class="atlas-results-count"
                            aria-live="polite"
                        ></div>

                        <div
                            id="atlas-records"
                            class="grid-results"
                        ></div>

                    </main>

                </div>

            </div>
        `;

    },

    // ------------------------------------------------------------------
    // Sekcia veľkostného filtra — pôvodné number inputy (min/max)
    // ------------------------------------------------------------------

    renderSizeFilterSection() {

        return `
            <div class="filter-section">

                <fieldset>

                    <legend class="filter-title">Veľkosť (µm)</legend>

                    <div class="atlas-size-row">

                        <label for="atlas-filter-lengthMin">
                            Dĺžka od
                        </label>

                        <input
                            id="atlas-filter-lengthMin"
                            type="number"
                            min="0"
                            step="any"
                            inputmode="decimal"
                        >

                        <label for="atlas-filter-lengthMax">
                            do
                        </label>

                        <input
                            id="atlas-filter-lengthMax"
                            type="number"
                            min="0"
                            step="any"
                            inputmode="decimal"
                        >

                    </div>

                    <div class="atlas-size-row">

                        <label for="atlas-filter-widthMin">
                            Šírka od
                        </label>

                        <input
                            id="atlas-filter-widthMin"
                            type="number"
                            min="0"
                            step="any"
                            inputmode="decimal"
                        >

                        <label for="atlas-filter-widthMax">
                            do
                        </label>

                        <input
                            id="atlas-filter-widthMax"
                            type="number"
                            min="0"
                            step="any"
                            inputmode="decimal"
                        >

                    </div>

                    <p class="atlas-size-hint">
                        Zobrazia sa objekty, ktorých nameraný rozsah sa
                        prekrýva so zadaným rozsahom. Objekty bez nameraného
                        údaja sa pri aktívnom filtri nezobrazia.
                    </p>

                </fieldset>

            </div>
        `;

    },

    init() {

        const input =
            document.getElementById("atlas-search-input");

        if (input) {

            input.value = this.state.search;

            input.addEventListener("input", (event) => {

                this.state.search = event.target.value;

                this.renderRecords();

            });

        }

        CHECKBOX_FIELDS.forEach(field => {

            this.bindCheckboxFilter(field);

        });

        // OPRAVA (2026-08-22): naviaže hromadné "vybrať skupinu" checkboxy
        // (funguje aj pri prvotnom renderi bez hierarchie — jednoducho
        // nenájde žiadne ".host-group-select" a nič sa nestane; po
        // loadHostHierarchy()/refreshHostFilterSection() sa naviaže znova).
        this.bindHostGroupSelectors();

        // OPRAVA (2026-08-17): async načítanie slovníka skupín, nahrádza
        // pôvodný statický import, ktorý padal (pozri poznámku pri
        // HOST_HIERARCHY_FILE). Prekreslí a znovu nabindí len sekciu
        // filtra hostiteľov, keď fetch doletí.
        this.loadHostHierarchy();

        MULTI_SELECT_FIELDS.forEach(field => {

            this.bindMultiFilter(field);

        });

        ["lengthMin", "lengthMax", "widthMin", "widthMax"].forEach(field => {

            this.bindSizeFilter(field);

        });

        const clearButton =
            document.getElementById("atlas-clear-filters");

        if (clearButton) {

            clearButton.addEventListener("click", () => {

                this.clearFilters();

            });

        }

        this.renderRecords();

    },

    // ------------------------------------------------------------------
    // Pomocné funkcie na čítanie vnorených polí (napr. "morphology.shape")
    // ------------------------------------------------------------------

    getFieldValue(record, path) {

        return path
            .split(".")
            .reduce(
                (value, key) =>
                    (value === undefined || value === null)
                        ? undefined
                        : value[key],
                record
            );

    },

    getValues(path) {

        const values = Repository.getAll()
            .map(record => this.getFieldValue(record, path))
            .filter(value =>
                value !== undefined &&
                value !== null &&
                String(value).trim() !== ""
            )
            .map(value => String(value).trim());

        return [...new Set(values)].sort((a, b) =>
            a.localeCompare(b, "sk")
        );

    },

    getHostValues() {

        // OPRAVA (2026-08-18, deduplikácia databázy): `record.host` nahradené
        // `Repository.resolveHosts(record)`, ktoré zjednotí explicitné
        // `record.hosts` s rozbaleným `record.hostGroups` (cez
        // dictionary/host_hierarchy.json). Kým sa hierarchia nenačíta, správa
        // sa to ako predtým pre záznamy s `hosts` a vynechá tie, ktoré majú
        // len `hostGroups` — po doletení slovníka renderRecords()/
        // refreshHostFilterSection() prekreslí znova (pozri loadHostHierarchy()).
        const values = Repository.getAll()
            .flatMap(record => Repository.resolveHosts(record))
            .filter(value =>
                value !== undefined &&
                value !== null &&
                String(value).trim() !== ""
            )
            .map(value => String(value).trim());

        return [...new Set(values)].sort((a, b) =>
            a.localeCompare(b, "sk")
        );

    },

    getTopLevelGroup(hostName) {

        let current = hostName;
        let parent = this.hostHierarchy[current];

        while (parent) {
            current = parent;
            parent = this.hostHierarchy[current];
        }

        return current !== hostName ? current : null;

    },

    /**
     * Bezpečné async načítanie host_hierarchy.json cez DatabaseService.load()
     * (rovnaká konvencia ako pre 14 databázových súborov v database/). Ak
     * fetch zlyhá, appka nepadne — hostHierarchy ostane {} a filter
     * hostiteľov sa jednoducho zobrazí bez skupín (všetko "standalone").
     */
    async loadHostHierarchy() {

        try {

            this.hostHierarchy =
                await DatabaseService.load(HOST_HIERARCHY_FILE);

        }
        catch (error) {

            console.warn(
                "VetPara Atlas: host_hierarchy.json sa nepodarilo načítať, " +
                "hostiteľský filter zostáva bez skupín.",
                error
            );

            this.hostHierarchy = {};

        }

        // OPRAVA (2026-08-18, deduplikácia databázy): záznamy majú teraz
        // `hostGroups`/`hosts` namiesto plochého `host`. Repository.resolveHosts()
        // potrebuje ten istý slovník na rozbalenie hostGroups → konkrétnych
        // hostiteľov. DatabaseService.load() cachuje podľa súboru, takže toto
        // nespôsobí druhý sieťový fetch — len sa slovník sprístupní aj tam.
        await Repository.loadHostHierarchy();

        this.hostHierarchyLoaded = true;
        this.refreshHostFilterSection();

        // Kým sa slovník nenačítal, záznamy priradené len cez `hostGroups`
        // (bez explicitných `hosts`) sa vo filtri/zozname javili ako "bez
        // hostiteľa" — po doletení slovníka treba zoznam prekresliť.
        this.renderRecords();

    },

    /**
     * Prekreslí IBA sekciu filtra hostiteľov (po dokončení
     * loadHostHierarchy()) a znovu ju nabinduje. Zvyšok stránky sa nemení.
     */
    refreshHostFilterSection() {

        const fieldset =
            document.getElementById("atlas-filter-host");

        const wrapper =
            fieldset ? fieldset.closest(".filter-section") : null;

        if (!wrapper) {
            return;
        }

        wrapper.outerHTML = this.renderHostFilterSection(this.getHostValues());

        this.bindCheckboxFilter("host");
        this.bindHostGroupSelectors();

    },

    // ------------------------------------------------------------------
    // Formátovanie mikrometrie a hostiteľov na zobrazenie
    // ------------------------------------------------------------------

    formatSize(micrometry) {

        if (!micrometry) {
            return "";
        }

        const {
            lengthMin, lengthMax,
            widthMin, widthMax,
            unit
        } = micrometry;

        const hasLength =
            lengthMin !== null && lengthMin !== undefined &&
            lengthMax !== null && lengthMax !== undefined;

        const hasWidth =
            widthMin !== null && widthMin !== undefined &&
            widthMax !== null && widthMax !== undefined;

        if (!hasLength && !hasWidth) {
            return "";
        }

        const lengthPart = hasLength
            ? (lengthMin === lengthMax ? `${lengthMin}` : `${lengthMin}–${lengthMax}`)
            : "?";

        const widthPart = hasWidth
            ? (widthMin === widthMax ? `${widthMin}` : `${widthMin}–${widthMax}`)
            : null;

        const unitLabel = unit || "µm";

        return widthPart
            ? `${lengthPart} × ${widthPart} ${unitLabel}`
            : `${lengthPart} ${unitLabel}`;

    },

    formatHosts(hosts) {

        if (!Array.isArray(hosts) || hosts.length === 0) {
            return "";
        }

        // OPRAVA (2026-08-17): oddeľovač zmenený z ", " na " / " podľa
        // schváleného referenčného obrázka (autorka, 2026-08-17).
        return hosts.join(" / ");

    },

    // ------------------------------------------------------------------
    // Hierarchické zobrazenie filtra hostiteľov (2026-08-17)
    //
    // OPRAVA (2026-08-22, viacúrovňové rozbaľovanie): pôvodná verzia
    // vypočítala pre každého hostiteľa iba NAJVYŠŠIU úroveň predka
    // (getTopLevelGroup — ide až po koreň stromu) a všetky medziľahlé
    // úrovne (napr. "Jaštery", "Chameleóny", "Korytnačky",
    // "Suchozemské korytnačky") zbalila do jedného plochého zoznamu pod
    // jediným accordionom ("Plazy"). Preto bol filter aj tak veľmi dlhý.
    //
    // Nahradené rekurzívnym prechodom CELÉHO stromu z host_hierarchy.json:
    // každá úroveň (nielen koreň) je teraz samostatný <details>, ktorý sa
    // dá zvlášť rozbaliť/zbaliť. Filtrovacia logika (state.host,
    // data-field="host", OR v rámci poľa) sa nemenila — mení sa iba
    // vnorenie markupu.
    // ------------------------------------------------------------------

    /**
     * Postaví mapu parent -> [deti] invertovaním host_hierarchy.json
     * (súbor je vo formáte {dieťa: rodič}).
     */
    buildHostChildrenMap() {

        const childrenMap = {};

        Object.entries(this.hostHierarchy).forEach(([child, parent]) => {

            if (!parent) {
                return;
            }

            if (!childrenMap[parent]) {
                childrenMap[parent] = [];
            }

            childrenMap[parent].push(child);

        });

        return childrenMap;

    },

    /**
     * Korene stromu = uzly (kľúče aj hodnoty v hostHierarchy), ktoré samy
     * nemajú predka.
     */
    getHostHierarchyRoots() {

        const allNodes = new Set([
            ...Object.keys(this.hostHierarchy),
            ...Object.values(this.hostHierarchy).filter(Boolean)
        ]);

        return [...allNodes].filter(node => !this.hostHierarchy[node]);

    },

    /**
     * Rekurzívne postaví jednu úroveň stromu (skupinu alebo podskupinu)
     * ako samostatný rozbaľovací <details> blok. Vracia:
     *  - html: markup tejto úrovne (alebo "", ak pod ňou nie je nič na
     *    zobrazenie),
     *  - count: počet reálne použitých hostiteľov v tejto úrovni vrátane
     *    všetkých podskupín (číslo v zátvorke pri názve),
     *  - anyChecked: či je niektorý z potomkov aktuálne zaškrtnutý (aby sa
     *    <details> otvoril automaticky),
     *  - matched: zoznam mien hostiteľov, ktoré sa "spotrebovali" v tejto
     *    vetve (aby ich vyššia úroveň nezarátala druhýkrát a aby sa
     *    nedostali medzi "samostatné" položky mimo stromu).
     */
    renderHostNode(node, childrenMap, hostsInUse) {

        const children = childrenMap[node] || [];
        const leaves = [];
        const subGroups = [];
        let anyChecked = false;
        const matched = [];

        // Ak je samotný názov skupiny zároveň reálnou hodnotou `host`
        // priradenou priamo k nejakému záznamu (napr. objekt priradený
        // priamo ku "Chameleóny" bez konkrétneho druhu), zobrazí sa ako
        // vlastný checkbox na začiatku obsahu tejto skupiny.
        if (hostsInUse.has(node)) {

            const checked = this.state.host.includes(node);

            if (checked) {
                anyChecked = true;
            }

            leaves.push({
                name: node,
                html: `
                    <label class="checkbox-label">
                        <input type="checkbox" value="${this.escapeHtml(node)}" data-field="host"
                            ${checked ? "checked" : ""}>
                        ${this.escapeHtml(node)} (všeobecne)
                    </label>
                `
            });

            matched.push(node);

        }

        children.forEach(child => {

            if (childrenMap[child] && childrenMap[child].length > 0) {

                // Dieťa má vlastné potomstvo → vnorená podskupina, ktorá sa
                // dá rozbaľovať nezávisle od tejto úrovne.
                const sub = this.renderHostNode(child, childrenMap, hostsInUse);

                if (sub.html) {
                    subGroups.push({ name: child, html: sub.html, count: sub.count });
                    matched.push(...sub.matched);
                    if (sub.anyChecked) {
                        anyChecked = true;
                    }
                }

            }
            else if (hostsInUse.has(child)) {

                const checked = this.state.host.includes(child);

                if (checked) {
                    anyChecked = true;
                }

                leaves.push({
                    name: child,
                    html: `
                        <label class="checkbox-label">
                            <input type="checkbox" value="${this.escapeHtml(child)}" data-field="host"
                                ${checked ? "checked" : ""}>
                            ${this.escapeHtml(child)}
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

        // OPRAVA (2026-08-22, výber celej kategórie jedným klikom): checkbox
        // "vybrať všetko" v hlavičke skupiny. Klik naň NEMÁ prepínať
        // otvorenie/zatvorenie <details> (preto stopPropagation priamo v
        // markupe) — iba klik na text/šípku naďalej rozbaľuje/zbaľuje.
        // `data-hosts` nesie presný zoznam hostiteľov (vrátane vnorených
        // podskupín), ktoré sa majú zaškrtnúť/odškrtnúť — viaže sa naň
        // bindHostGroupSelectors()/updateHostGroupSelectStates().
        const groupHostsAttr = matched
            .map(host => this.escapeHtml(host))
            .join("|");

        const html = `
            <details class="host-accordion" ${anyChecked ? "open" : ""}>
                <summary class="host-accordion-summary">
                    <label class="host-group-select-label" onclick="event.stopPropagation()">
                        <input
                            type="checkbox"
                            class="host-group-select"
                            data-hosts="${groupHostsAttr}"
                            aria-label="Vybrať všetkých hostiteľov v skupine ${this.escapeHtml(node)}"
                        >
                    </label>
                    <span class="accordion-title-wrap">
                        <span class="accordion-title">${this.escapeHtml(node)}</span>
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

    },

    renderHostFilterSection(hosts) {

        if (hosts.length === 0) {
            return "";
        }

        const hostsInUse = new Set(hosts);
        const childrenMap = this.buildHostChildrenMap();
        const roots = this.getHostHierarchyRoots();

        const matchedOverall = new Set();
        const rootBlocks = [];

        roots.forEach(root => {

            const result = this.renderHostNode(root, childrenMap, hostsInUse);

            if (result.html) {
                rootBlocks.push({ name: root, html: result.html });
                result.matched.forEach(host => matchedOverall.add(host));
            }

        });

        rootBlocks.sort((a, b) => a.name.localeCompare(b.name, "sk"));

        // Hostitelia, ktorí sa vôbec nenachádzajú v host_hierarchy.json
        // (nemajú predka ani potomkov) → samostatné položky mimo
        // accordionov, rovnako ako doteraz.
        const standaloneHosts = hosts.filter(host => !matchedOverall.has(host));

        return `
            <div class="filter-section">
                <fieldset id="atlas-filter-host">
                    <legend class="filter-title">Hostiteľ</legend>

                    ${rootBlocks.map(block => block.html).join("")}

                    ${standaloneHosts.length > 0 ? `
                        <div class="checkbox-group standalone-group">
                            ${standaloneHosts.map(host => `
                                <label class="checkbox-label">
                                    <input type="checkbox" value="${this.escapeHtml(host)}" data-field="host"
                                        ${this.state.host.includes(host) ? "checked" : ""}>
                                    ${this.escapeHtml(host)}
                                </label>
                            `).join("")}
                        </div>
                    ` : ""}
                </fieldset>
            </div>
        `;

    },

    // ------------------------------------------------------------------
    // Všeobecný checkboxový filter (použitý pre sample / materiál)
    // ------------------------------------------------------------------

    renderCheckboxFilter(field, label, values) {

        if (values.length === 0) {
            return "";
        }

        return `
            <div class="filter-section">
                <fieldset id="atlas-filter-${field}">
                    <legend class="filter-title">${label}</legend>
                    <div class="checkbox-group">
                        ${values.map(value => `
                            <label class="checkbox-label">
                                <input type="checkbox" value="${this.escapeHtml(value)}" data-field="${field}"
                                    ${this.state[field].includes(value) ? "checked" : ""}>
                                ${this.escapeHtml(value)}
                            </label>
                        `).join("")}
                    </div>
                </fieldset>
            </div>
        `;

    },

    bindCheckboxFilter(field) {

        const group =
            document.getElementById(`atlas-filter-${field}`);

        if (!group) {
            return;
        }

        // OPRAVA (2026-08-22): selektor zúžený na `[data-field="${field}"]`,
        // aby sa do state.host nezarátali aj nové ".host-group-select"
        // checkboxy ("vybrať celú skupinu"), ktoré nemajú data-field a
        // slúžia len ako hromadný prepínač nad viacerými input[data-field].
        const selector = `input[type="checkbox"][data-field="${field}"]`;

        group.querySelectorAll(selector).forEach(checkbox => {

            checkbox.addEventListener("change", () => {

                this.state[field] =
                    Array.from(group.querySelectorAll(`${selector}:checked`))
                        .map(input => input.value);

                if (field === "host") {

                    // Ručné (od)zaškrtnutie jedného hostiteľa musí prekresliť
                    // aj stav nadradených "vybrať skupinu" checkboxov
                    // (zaškrtnuté / čiastočne / vôbec).
                    this.updateHostGroupSelectStates(group);

                }

                this.renderRecords();

            });

        });

    },

    // ------------------------------------------------------------------
    // "Vybrať celú kategóriu" — hromadný checkbox v hlavičke accordionu
    // (2026-08-22, na želanie autorky: jedno kliknutie namiesto ručného
    // vyklikávania všetkých potomkov danej skupiny/podskupiny).
    // ------------------------------------------------------------------

    bindHostGroupSelectors() {

        const fieldset =
            document.getElementById("atlas-filter-host");

        if (!fieldset) {
            return;
        }

        fieldset.querySelectorAll(".host-group-select").forEach(groupCheckbox => {

            groupCheckbox.addEventListener("change", () => {

                const hosts = (groupCheckbox.dataset.hosts || "")
                    .split("|")
                    .filter(Boolean);

                const shouldCheck = groupCheckbox.checked;

                hosts.forEach(host => {

                    const target = fieldset.querySelector(
                        `input[type="checkbox"][data-field="host"][value="${CSS.escape(host)}"]`
                    );

                    if (target) {
                        target.checked = shouldCheck;
                    }

                });

                this.state.host = Array.from(
                    fieldset.querySelectorAll('input[type="checkbox"][data-field="host"]:checked')
                ).map(input => input.value);

                // Zaškrtnutie/odškrtnutie tejto skupiny mohlo zmeniť aj stav
                // jej rodičovskej skupiny (napr. zaškrtnutím všetkých potomkov
                // "Jaštery" sa čiastočne "naplní" aj "Plazy") — prepočíta sa
                // úplne všetko, nielen táto jedna úroveň.
                this.updateHostGroupSelectStates(fieldset);

                this.renderRecords();

            });

        });

        // Počiatočný stav (napr. po znovunačítaní hierarchie) — zväčša
        // všetko nezaškrtnuté, ale nech je to vždy konzistentné so
        // state.host.
        this.updateHostGroupSelectStates(fieldset);

    },

    /**
     * Prepočíta zaškrtnutie/indeterminate stav všetkých ".host-group-select"
     * checkboxov podľa toho, koľko z ich `data-hosts` potomkov je práve
     * zaškrtnutých v skutočnom filtri. Volá sa po každej zmene v strome
     * hostiteľov (jednotlivý checkbox aj hromadný "vybrať skupinu"), aby
     * hlavičky accordionov vždy zodpovedali reálnemu stavu filtra.
     */
    updateHostGroupSelectStates(fieldset) {

        if (!fieldset) {
            return;
        }

        fieldset.querySelectorAll(".host-group-select").forEach(groupCheckbox => {

            const hosts = (groupCheckbox.dataset.hosts || "")
                .split("|")
                .filter(Boolean);

            if (hosts.length === 0) {
                groupCheckbox.checked = false;
                groupCheckbox.indeterminate = false;
                return;
            }

            const checkedCount = hosts.filter(host => {

                const target = fieldset.querySelector(
                    `input[type="checkbox"][data-field="host"][value="${CSS.escape(host)}"]`
                );

                return target && target.checked;

            }).length;

            groupCheckbox.checked = checkedCount === hosts.length;
            groupCheckbox.indeterminate =
                checkedCount > 0 && checkedCount < hosts.length;

        });

    },

    // ------------------------------------------------------------------
    // Multi-select filtre (shape / colour) — ZACHOVANÉ na želanie autorky
    // ------------------------------------------------------------------

  renderMultiFilter(field, label, values) {

        if (values.length === 0) {
            return "";
        }

        const size = Math.min(6, Math.max(3, values.length));

        return `
            <div class="filter-section atlas-filter-multi">
                <label for="atlas-filter-${field}" class="filter-title">${label}</label>
                <select id="atlas-filter-${field}" multiple size="${size}">
                    ${values.map(value => `
                        <option value="${this.escapeHtml(value)}"
                            ${this.state[field].includes(value) ? "selected" : ""}>
                            ${this.escapeHtml(value)}
                        </option>
                    `).join("")}
                </select>
            </div>
        `;

    },  

    bindMultiFilter(field) {

        const select =
            document.getElementById(`atlas-filter-${field}`);

        if (!select) {
            return;
        }

        Array.from(select.options).forEach(option => {

            option.selected =
                this.state[field].includes(option.value);

            // OPRAVA (2026-08-17): natívne <select multiple> vyžaduje na
            // výber VIACERÝCH položiek podržanie Ctrl/Cmd — bez toho
            // klik vždy vybral len jednu a ostatné odznačil (nahlásený
            // problém). Zachytávame mousedown (nie "click" — na <option>
            // sa v niektorých prehliadačoch nespúšťa spoľahlivo),
            // potlačíme predvolené správanie a položku prepneme (toggle)
            // manuálne. Jedno kliknutie tak vždy len pridá/odoberie TÚ
            // JEDNU položku, ostatné vybrané položky ostanú nedotknuté —
            // rovnaké správanie ako pri checkboxoch, vizuál <select>
            // sa nemení.
            option.addEventListener("mousedown", event => {

                event.preventDefault();

                option.selected = !option.selected;

                select.focus();

                select.dispatchEvent(new Event("change"));

            });

        });

        select.addEventListener("change", () => {

            this.state[field] =
                Array.from(select.selectedOptions)
                    .map(option => option.value);

            this.renderRecords();

        });

    },

    // ------------------------------------------------------------------
    // Filter podľa veľkosti (rozsah dĺžka/šírka) — pôvodná logika
    // ------------------------------------------------------------------

    bindSizeFilter(field) {

        const input =
            document.getElementById(`atlas-filter-${field}`);

        if (!input) {
            return;
        }

        input.value = this.state[field];

        input.addEventListener("input", (event) => {

            this.state[field] = event.target.value;
            this.renderRecords();

        });

    },

    matchesSizeRange(recordMin, recordMax, queryMin, queryMax) {

        const hasQuery =
            queryMin !== "" || queryMax !== "";

        if (!hasQuery) {
            return true;
        }

        if (recordMin === null || recordMin === undefined ||
            recordMax === null || recordMax === undefined) {
            return false;
        }

        if (queryMin !== "" && recordMax < Number(queryMin)) {
            return false;
        }

        if (queryMax !== "" && recordMin > Number(queryMax)) {
            return false;
        }

        return true;

    },

    // ------------------------------------------------------------------
    // Vykreslenie zoznamu záznamov
    // ------------------------------------------------------------------

    matchesFulltext(record, search) {

        if (!search) {
            return true;
        }

        const haystackParts = [
            record.latinName,
            record.slovakName,
            record.notes,
            record.morphology?.shape,
            record.morphology?.colour,
            record.morphology?.shell,
            ...(Array.isArray(record.diagnosticSigns)
                ? record.diagnosticSigns
                : []),
            // OPRAVA (2026-08-18, deduplikácia databázy): nové pole
            // `synonyms` (iné vedecké názvy, napr. "Giardia lamblia" pre
            // "Giardia intestinalis") — pozri AI_STATUS.md sekcia 0.2.
            ...(Array.isArray(record.synonyms)
                ? record.synonyms
                : []),
            // OPRAVA (2026-08-19, na žiadosť autorky): fulltext rozšírený
            // aj o hostiteľov. Použité Repository.resolveHosts(record) —
            // rovnaká funkcia ako pri filtri hostiteľov nižšie (matchesHost)
            // — takže sa hľadá v ZJEDNOTENÍ explicitných `hosts` a
            // rozbaleného `hostGroups`, nie len v plochom `record.hosts`.
            // Vďaka tomu sa objekt nájde aj vtedy, keď má hostiteľa
            // priradeného iba cez skupinu (napr. "Vtáky").
            ...Repository.resolveHosts(record)
        ];

        const haystack =
            haystackParts.filter(Boolean).join(" ").toLowerCase();

        return haystack.includes(search);

    },

    renderRecords() {

        const container =
            document.getElementById("atlas-records");

        const count =
            document.getElementById("atlas-results-count");

        const activeFilters =
            document.getElementById("atlas-active-filters");

        if (!container || !count) {
            return;
        }

        const records = Repository.getAll();

        const search =
            this.state.search.trim().toLowerCase();

        const filtered = records.filter(record => {

            const matchesSearch =
                this.matchesFulltext(record, search);

            // OPRAVA (2026-08-18, deduplikácia databázy): `record.host`
            // nahradené `Repository.resolveHosts(record)` (union explicitných
            // `hosts` a rozbaleného `hostGroups`). Filtrovacia OR logika v
            // rámci poľa ostáva identická.
            const matchesHost =
                this.state.host.length === 0 ||
                Repository.resolveHosts(record).some(h => this.state.host.includes(h));

            const matchesSample =
                this.state.sample.length === 0 ||
                this.state.sample.includes(record.sample);

            const matchesShape =
                this.state.shape.length === 0 ||
                this.state.shape.includes(record.morphology?.shape);

            const matchesColour =
                this.state.colour.length === 0 ||
                this.state.colour.includes(record.morphology?.colour);

            const matchesLength =
                this.matchesSizeRange(
                    record.micrometry?.lengthMin,
                    record.micrometry?.lengthMax,
                    this.state.lengthMin,
                    this.state.lengthMax
                );

            const matchesWidth =
                this.matchesSizeRange(
                    record.micrometry?.widthMin,
                    record.micrometry?.widthMax,
                    this.state.widthMin,
                    this.state.widthMax
                );

            return (
                matchesSearch &&
                matchesHost &&
                matchesSample &&
                matchesShape &&
                matchesColour &&
                matchesLength &&
                matchesWidth
            );

        });

        count.textContent =
            `Zobrazené záznamy: ${filtered.length} / ${records.length}`;

        if (activeFilters) {
            activeFilters.innerHTML =
                this.renderActiveFilters();
        }

        if (filtered.length === 0) {

            container.innerHTML = `
                <div class="no-results">
                    Žiadny záznam nevyhovuje zadaným kritériám.
                </div>
            `;

            return;

        }

        container.innerHTML = filtered.map(record => `
            <div class="specimen-row-card" data-id="${this.escapeHtml(record.id)}" role="button" tabindex="0">
                <h3>${this.escapeHtml(record.latinName ?? record.id)}</h3>
                <p>
                    <strong>Hostiteľ:</strong>
                    ${this.escapeHtml(this.formatHosts(Repository.resolveHosts(record)) || "—")}
                    |
                    <strong>Materiál:</strong>
                    ${this.escapeHtml(record.sample || "—")}
                    ${record.micrometry ? `| <strong>Veľkosť:</strong> ${this.escapeHtml(this.formatSize(record.micrometry) || "—")}` : ""}
                </p>
            </div>
        `).join("");

        this.bindCards();
        this.bindActiveFilterButtons();

    },

    renderActiveFilters() {

        const filters = [];

        if (this.state.search.trim()) {
            filters.push({
                key: "search",
                label: "Hľadanie",
                value: this.state.search.trim()
            });
        }

        [...CHECKBOX_FIELDS, ...MULTI_SELECT_FIELDS].forEach(field => {

            const labels = {
                host: "Hostiteľ",
                sample: "Materiál",
                shape: "Tvar",
                colour: "Farba"
            };

            this.state[field].forEach(value => {
                filters.push({
                    key: field,
                    label: labels[field],
                    value,
                    multiValue: value
                });
            });

        });

        if (this.state.lengthMin !== "" || this.state.lengthMax !== "") {
            filters.push({
                key: "length",
                label: "Dĺžka",
                value: `${this.state.lengthMin || "…"}–${this.state.lengthMax || "…"} µm`
            });
        }

        if (this.state.widthMin !== "" || this.state.widthMax !== "") {
            filters.push({
                key: "width",
                label: "Šírka",
                value: `${this.state.widthMin || "…"}–${this.state.widthMax || "…"} µm`
            });
        }

        if (filters.length === 0) {
            return "";
        }

        return `
            <span class="filter-tag-label">Aktívne filtre:</span>
            ${filters.map(filter => `
                <button
                    type="button"
                    class="atlas-filter-tag"
                    data-filter-key="${filter.key}"
                    data-filter-value="${filter.multiValue ? this.escapeHtml(filter.multiValue) : ""}"
                    aria-label="Odstrániť filter ${filter.label}: ${this.escapeHtml(filter.value)}"
                >
                    ${filter.label}: ${this.escapeHtml(filter.value)}
                    <span aria-hidden="true">×</span>
                </button>
            `).join("")}
        `;

    },

    bindActiveFilterButtons() {

        const buttons =
            document.querySelectorAll(".atlas-filter-tag");

        buttons.forEach(button => {

            button.addEventListener("click", () => {

                const key =
                    button.dataset.filterKey;

                if (!key) {
                    return;
                }

                if (CHECKBOX_FIELDS.includes(key) || MULTI_SELECT_FIELDS.includes(key)) {

                    const value =
                        button.dataset.filterValue;

                    this.state[key] =
                        this.state[key].filter(v => v !== value);

                } else if (key === "length") {

                    this.state.lengthMin = "";
                    this.state.lengthMax = "";

                } else if (key === "width") {

                    this.state.widthMin = "";
                    this.state.widthMax = "";

                } else {

                    this.state[key] = "";

                }

                this.syncControls();
                this.renderRecords();

            });

        });

    },

    syncControls() {

        const input =
            document.getElementById("atlas-search-input");

        if (input) {
            input.value = this.state.search;
        }

        CHECKBOX_FIELDS.forEach(field => {

            const group =
                document.getElementById(`atlas-filter-${field}`);

            // Doplnená poistka group.querySelectorAll, ak by element pre materiál už nebol typu fieldset/checkbox
            if (group && typeof group.querySelectorAll === "function") {

                group.querySelectorAll("input[type=checkbox]").forEach(checkbox => {
                    checkbox.checked =
                        this.state[field].includes(checkbox.value);
                });

            }

        });   

        MULTI_SELECT_FIELDS.forEach(field => {

            const select =
                document.getElementById(`atlas-filter-${field}`);

            if (select) {

                Array.from(select.options).forEach(option => {
                    option.selected =
                        this.state[field].includes(option.value);
                });

            }

        });

        ["lengthMin", "lengthMax", "widthMin", "widthMax"].forEach(field => {

            const input =
                document.getElementById(`atlas-filter-${field}`);

            if (input) {
                input.value = this.state[field];
            }

        });

    },

    clearFilters() {

        this.state.search = "";
        this.state.host = [];
        this.state.sample = [];
        this.state.shape = [];
        this.state.colour = [];
        this.state.lengthMin = "";
        this.state.lengthMax = "";
        this.state.widthMin = "";
        this.state.widthMax = "";

        this.syncControls();
        this.renderRecords();

    },

    bindCards() {

        const cards =
            document.querySelectorAll(".specimen-row-card");

        cards.forEach(card => {

            card.addEventListener("click", () => {
                this.showDetail(card.dataset.id);
            });

            card.addEventListener("keydown", (event) => {

                if (event.key === "Enter" ||
                    event.key === " ") {

                    event.preventDefault();
                    this.showDetail(card.dataset.id);

                }

            });

        });

    },

    showDetail(id) {

        const record = Repository.getById(id);

        if (!record) {
            return;
        }

        const app =
            document.getElementById("app");

        // OPRAVA (2026-08-17): vrátené na triedy zo skutočného atlas.css
        // (specimen-title / side-boxes / findings-card / img-placeholder-box /
        // quad-grid / morphology-card-main / taxonomy-table). Predchádzajúca
        // (medzi-session) verzia používala iné názvy tried (detail-title,
        // detail-grid, back-button, morphology-card...), ktoré v atlas.css
        // vôbec neexistujú → stránka sa zobrazovala prakticky bez štýlov.
        // Vizuál teraz zodpovedá schválenému referenčnému obrázku
        // (autorka potvrdila 2026-08-17).
        app.innerHTML = `

            <div id="detail-view" class="view-page active-view">

                <button
                    type="button"
                    id="atlas-back"
                    class="atlas-back"
                >
                    ← Späť na Atlas
                </button>

                <div class="detail-layout">

                    <main class="card">

                        <h2 class="specimen-title">
                            ${this.escapeHtml(record.latinName ?? record.id)}
                        </h2>

                        <div class="specimen-sub">
                            ${this.escapeHtml(
                                [record.group, record.taxonomy?.family]
                                    .filter(Boolean)
                                    .join(" • ")
                                || `ID: ${record.id}`
                            )}
                        </div>

                        <div class="detail-main-split">

                            <div class="side-boxes">

                                ${this.miniBox("Hostiteľ", this.formatHosts(Repository.resolveHosts(record)))}

                                ${this.miniBox("Materiál", record.sample)}

                                ${this.miniBox("Štádium", record.stage)}

                            </div>

                            <div class="findings-card card">

                                ${PrimaryImage.render(record, { showLabel: true, size: "large" })}

                            </div>

                        </div>

                        <div class="quad-grid">

                            ${this.quadBox("Veľkosť", this.formatSize(record.micrometry))}

                            ${this.quadBox("Tvar", record.morphology?.shape)}

                            ${this.quadBox("Farba", record.morphology?.colour)}

                            ${this.quadBox("Obal", record.morphology?.shell)}

                        </div>

                        ${this.morphologyCard(record.diagnosticSigns)}

                        ${this.detailField("Poznámka", record.notes)}

                        <div class="actions-container">

                            ${this.taxonomyExternalLinksButtons(record.latinName)}

                        </div>

                    </main>

                    <aside class="card">

                        <h3 class="taxonomy-title">Taxonomické zaradenie</h3>

                        ${this.taxonomyTable(record.taxonomy)}

                    </aside>

                </div>

            </div>

        `;

        document
            .getElementById("atlas-back")
            .addEventListener("click", () => {

                app.innerHTML = this.render();

                this.init();

            });

           // --- NOVÉ: Zobrazenie obrázkov z images.json ---
        const parasiteImages = Repository.getImagesForParasite(id);
        const mainImageContainer = document.querySelector(".findings-card");
        
        // Ak existujú obrázky, zobrazíme prvý a zvyšok pridáme ako galériu
        if (parasiteImages.length > 0) {
            const firstImageUrl = parasiteImages[0].url;
            mainImageContainer.innerHTML = `
                <img src="${firstImageUrl}" class="main-image" alt="${parasiteImages[0].alt || record.latinName}" style="width:100%; height:auto; border-radius:8px;">
                <div style="margin-top: 8px; display: flex; gap: 8px; flex-wrap: wrap;">
                    ${parasiteImages.slice(1).map(img => `
                        <img src="${img.url}" alt="${img.alt || ''}" style="width: 80px; height: 80px; object-fit: cover; border-radius: 4px; cursor: pointer;" 
                             onclick="this.parentElement.parentElement.querySelector('.main-image').src = this.src;">
                    `).join('')}
                </div>
            `;
        } else {
            // Ak nie sú žiadne obrázky, zavolá sa pôvodná funkcia
            PrimaryImage.populate("#detail-view");
        }
    },

    // ------------------------------------------------------------------
    // Pomocné bloky pre detail layout (triedy podľa atlas.css)
    // ------------------------------------------------------------------

    miniBox(label, value) {

        if (!value || String(value).trim() === "") {

            return "";

        }

        return `
            <div class="param-box-mini">
                <div class="mini-label">${this.escapeHtml(label)}</div>
                <div class="mini-value">${this.escapeHtml(value)}</div>
            </div>
        `;

    },

    quadBox(label, value) {

        return `
            <div class="quad-box">
                <div class="quad-label">${this.escapeHtml(label)}</div>
                <div class="quad-val">${value ? this.escapeHtml(value) : "—"}</div>
            </div>
        `;

    },

    /**
     * OPRAVA (2026-08-17): nadpis zmenený z "Diagnostické znaky" na
     * "Morfológia" (podľa schváleného referenčného obrázka, autorka
     * 2026-08-17). Dáta (record.diagnosticSigns) sa nemenili.
     */
    morphologyCard(signs) {

        if (!Array.isArray(signs) || signs.length === 0) {

            return "";

        }

        return `
            <div class="morphology-card-main">

                <div class="morph-main-header">Morfológia</div>

                <div class="morph-main-content">

                    ${signs.map(sign => `
                        <div class="morph-list-item">
                            <span class="morph-checkmark" aria-hidden="true">✓</span>
                            <span>${this.escapeHtml(sign)}</span>
                        </div>
                    `).join("")}

                </div>

            </div>
        `;

    },

    /**
     * Taxonómia v tabuľkovom formáte (mockup .taxonomy-table).
     *
     * OPRAVA (2026-08-17): riadok "Doména" DOPLNENÝ na explicitnú žiadosť
     * autorky (referenčný obrázok, 2026-08-17) — čaká sa pole
     * `taxonomy.domain`. POZOR: nepotvrdené, či toto pole reálne existuje
     * v `02_DATABASE_SPECIFICATION.md`/dátach (nemám k dispozícii ani
     * schému, ani zdrojové JSON súbory) — hodnota sa NEVYMÝŠĽA, riadok sa
     * (rovnako ako ostatné) zobrazí len ak `taxonomy.domain` v dátach
     * skutočne existuje. Ak je kľúč v schéme pomenovaný inak, treba mi to
     * povedať a upravím len tento jeden riadok v poli `ranks`.
     */
    taxonomyTable(taxonomy) {

        if (!taxonomy || Object.keys(taxonomy).length === 0) {

            return `
                <p class="atlas-size-hint">
                    Taxonomické zaradenie nie je pre tento objekt zatiaľ
                    vyplnené.
                </p>
            `;

        }

        const ranks = [
            ["domain", "Doména"],
            ["kingdom", "Ríša"],
            ["phylum", "Kmeň"],
            ["class", "Trieda"],
            ["order", "Rad"],
            ["family", "Čeľaď"],
            ["genus", "Rod"],
            ["species", "Druh"]
        ];

        const rows = ranks
            .filter(([key]) =>
                taxonomy[key] !== null &&
                taxonomy[key] !== undefined &&
                String(taxonomy[key]).trim() !== ""
            )
            .map(([key, label]) => `
                <tr>
                    <td class="tax-row-label">${label}</td>
                    <td>${this.escapeHtml(taxonomy[key])}</td>
                </tr>
            `)
            .join("");

        if (!rows) {

            return `
                <p class="atlas-size-hint">
                    Taxonomické zaradenie nie je pre tento objekt zatiaľ
                    vyplnené.
                </p>
            `;

        }

        return `
            <table class="taxonomy-table">
                <tbody>
                    ${rows}
                </tbody>
            </table>
        `;

    },

     taxonomyExternalLinksButtons(latinName) {

        if (!latinName) {
            return "";
        }

        // Vráti skrytý element, ktorý zachová HTML štruktúru, 
        // ale odkazy na obrazovke úplne zmiznú
        return `
            <div style="display: none;"></div>
        `;

    },

    detailField(label, value) {

        if (value === undefined ||
            value === null ||
            String(value).trim() === "") {
            return "";
        }

        return `
            <div class="detail-field">
                <h4>${label}</h4>
                <p>${this.escapeHtml(value)}</p>
            </div>
        `;

    },

    field(label, value) {

        if (value === undefined ||
            value === null ||
            String(value).trim() === "") {
            return "";
        }

        return `
            <div class="field-row">
                <strong>${label}:</strong>
                ${this.escapeHtml(value)}
            </div>
        `;

    },
    
    // --- NOVÉ: Načítanie a zobrazenie všetkých obrázkov pre daný záznam ---
    getImages(recordId) {
        return Repository.getImagesForParasite(recordId);
    },

    escapeHtml(value) {

        return String(value)
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#39;");

    }

};

export default AtlasPage;