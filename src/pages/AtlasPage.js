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
 * Filtrovacia logika zostáva zámerne lokálne v tejto stránke (rovnaký prístup
 * ako doteraz) — Repository.js naďalej slúži iba ako prístup k dátam, bez
 * vlastnej filtračnej logiky. Prepojenie na ApplicationState.filters je
 * samostatná plánovaná úloha (AI_STATUS.md bod 6.7), touto zmenou sa nerieši.
 ******************************************************************************/

import Repository from "../services/Repository.js";

// Checkboxové filtre (2026-08-15 reskin) — OR logika v rámci poľa, rovnaká
// ako predtým pri <select multiple>.
const CHECKBOX_FIELDS = ["host", "sample"];

// Ostávajú ako <select multiple>, na želanie autorky (AI_STATUS.md v7, bod 0.3).
const MULTI_SELECT_FIELDS = ["shape", "colour"];

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

                        ${this.renderCheckboxFilter(
                            "host",
                            "Hostiteľ",
                            this.getHostValues()
                        )}

                        ${this.renderCheckboxFilter(
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
    // Sekcia veľkostného filtra — pôvodné number inputy (min/max), zachované
    // na želanie autorky. Iba obal zmenený na .filter-section kvôli
    // vizuálnej konzistencii s ostatnými filtrami v sidebar-i.
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

        const values = Repository.getAll()
            .flatMap(record => Array.isArray(record.host) ? record.host : [])
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
            ? (lengthMin === lengthMax
                ? `${lengthMin}`
                : `${lengthMin}–${lengthMax}`)
            : "?";

        const widthPart = hasWidth
            ? (widthMin === widthMax
                ? `${widthMin}`
                : `${widthMin}–${widthMax}`)
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

        return hosts.join(", ");

    },

    // ------------------------------------------------------------------
    // Checkboxové filtre (host / sample) — 2026-08-15 reskin
    // Rovnaká OR logika ako predtým pri <select multiple>, iný widget.
    // ------------------------------------------------------------------

    renderCheckboxFilter(field, label, values) {

        if (values.length === 0) {

            return "";

        }

        return `
            <div class="filter-section">

                <div class="filter-title">${label}</div>

                <div class="checkbox-group" id="atlas-filter-${field}">

                    ${values.map(value => `
                        <label class="checkbox-label">

                            <input
                                type="checkbox"
                                value="${this.escapeHtml(value)}"
                                data-field="${field}"
                                ${this.state[field].includes(value) ? "checked" : ""}
                            >

                            ${this.escapeHtml(value)}

                        </label>
                    `).join("")}

                </div>

            </div>
        `;

    },

    bindCheckboxFilter(field) {

        const group =
            document.getElementById(`atlas-filter-${field}`);

        if (!group) {

            return;

        }

        group.querySelectorAll("input[type=checkbox]").forEach(checkbox => {

            checkbox.addEventListener("change", () => {

                this.state[field] =
                    Array.from(
                        group.querySelectorAll("input[type=checkbox]:checked")
                    ).map(input => input.value);

                this.renderRecords();

            });

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

                <label for="atlas-filter-${field}" class="filter-title">
                    ${label}
                    <span class="atlas-filter-hint">
                        (viac možností naraz)
                    </span>
                    <span class="atlas-filter-hint atlas-filter-hint-desktop">
                        — na výber viacerých podrž Ctrl (Windows) / Cmd (Mac)
                    </span>
                </label>

                <select
                    id="atlas-filter-${field}"
                    multiple
                    size="${size}"
                >

                    ${values.map(value => `
                        <option value="${this.escapeHtml(value)}">
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

        });

        select.addEventListener("change", () => {

            this.state[field] =
                Array.from(select.selectedOptions)
                    .map(option => option.value);

            this.renderRecords();

        });

    },

    // ------------------------------------------------------------------
    // Filter podľa veľkosti (rozsah dĺžka/šírka) — pôvodná logika, zachovaná
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

    /**
     * Prekryvová zhoda rozsahu.
     *
     * Zobrazí objekt, ak sa jeho nameraný rozsah [recordMin, recordMax]
     * prekrýva so zadaným hľadaným rozsahom [queryMin, queryMax].
     *
     * Ak používateľ zadal iba jednu hranicu, kontroluje sa iba tá.
     * Ak objekt nemá pre daný rozmer namerané hodnoty vôbec, pri aktívnom
     * filtri tohto rozmeru sa nezobrazí (nevieme potvrdiť zhodu).
     */
    matchesSizeRange(recordMin, recordMax, queryMin, queryMax) {

        const hasQuery =
            queryMin !== "" || queryMax !== "";

        if (!hasQuery) {

            return true;

        }

        if (
            recordMin === null || recordMin === undefined ||
            recordMax === null || recordMax === undefined
        ) {

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
    //
    // POZNÁMKA (2026-08-15): pôvodné diagnosticSignsList()/taxonomyBlock()/
    // taxonomyExternalLinks() (⚡-zoznam, .parasite-taxonomy div-y) boli
    // nahradené novými metódami morphologyCard()/taxonomyTable()/
    // taxonomyExternalLinksButtons() vyššie (rovnaké dáta, nový vizuál podľa
    // mockupu). Staré metódy odstránené, aby nevznikalo mŕtve/duplicitné CSS.
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
                : [])

        ];

        const haystack =
            haystackParts
                .filter(Boolean)
                .join(" ")
                .toLowerCase();

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

            const matchesHost =
                this.state.host.length === 0 ||
                (Array.isArray(record.host) &&
                    record.host.some(h => this.state.host.includes(h)));

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
                <div class="atlas-empty">

                    <p>
                        Žiadny záznam nevyhovuje zadaným
                        kritériám.
                    </p>

                </div>
            `;

            return;

        }

        // Karta v zozname je zámerne stručná (rýchle skenovanie výsledkov) —
        // plný obsah (diagnostické znaky, morfológia, taxonómia, poznámky) je
        // v Detaile (showDetail). Mockup: .specimen-row-card (2026-08-15).
        container.innerHTML = filtered.map(record => `

            <article
                class="specimen-row-card card"
                data-id="${this.escapeHtml(record.id)}"
                tabindex="0"
                role="button"
                aria-label="Otvoriť detail: ${this.escapeHtml(record.latinName ?? record.id)}"
            >

                <h3>
                    ${this.escapeHtml(record.latinName ?? record.id)}
                </h3>

                <div class="specimen-meta-inline">
                    <strong>Hostiteľ:</strong>
                    ${this.escapeHtml(this.formatHosts(record.host) || "—")}
                    |
                    <strong>Materiál:</strong>
                    ${this.escapeHtml(record.sample || "—")}
                    ${record.micrometry ? `
                        |
                        <strong>Veľkosť:</strong>
                        ${this.escapeHtml(this.formatSize(record.micrometry) || "—")}
                    ` : ""}
                </div>

            </article>

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
                value:
                    `${this.state.lengthMin || "…"}–${this.state.lengthMax || "…"} µm`
            });

        }

        if (this.state.widthMin !== "" || this.state.widthMax !== "") {

            filters.push({
                key: "width",
                label: "Šírka",
                value:
                    `${this.state.widthMin || "…"}–${this.state.widthMax || "…"} µm`
            });

        }

        if (filters.length === 0) {

            return "";

        }

        return `

            <div class="atlas-active-filters-title">
                Aktívne filtre:
            </div>

            <div class="atlas-filter-tags">

                ${filters.map(filter => `

                    <button
                        type="button"
                        class="atlas-filter-tag"
                        data-filter-key="${filter.key}"
                        data-filter-value="${filter.multiValue ? this.escapeHtml(filter.multiValue) : ""}"
                        aria-label="Odstrániť filter ${filter.label}: ${this.escapeHtml(filter.value)}"
                    >

                        ${filter.label}:
                        ${this.escapeHtml(filter.value)}

                        <span aria-hidden="true">×</span>

                    </button>

                `).join("")}

            </div>

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

                }
                else if (key === "length") {

                    this.state.lengthMin = "";
                    this.state.lengthMax = "";

                }
                else if (key === "width") {

                    this.state.widthMin = "";
                    this.state.widthMax = "";

                }
                else {

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

            if (group) {

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

                if (
                    event.key === "Enter" ||
                    event.key === " "
                ) {

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

        // Layout podľa mockupu (2026-08-15): detail-layout > .card hlavný
        // panel (side-boxes + findings-card + quad-grid + morphology-card-main
        // + actions) a bočný .card panel s taxonomy-table. Wrapper id
        // "detail-view" kvôli CSS vo variables.css (natvrdo svetlý režim).
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

                                ${this.miniBox("Hostiteľ", this.formatHosts(record.host))}

                                ${this.miniBox("Materiál", record.sample)}

                                ${this.miniBox("Štádium", record.stage)}

                            </div>

                            <div class="findings-card card">

                                <div class="img-placeholder-box">
                                    ${record.images && record.images.length > 0
                                        ? "[ Fotografia zatiaľ nie je pripojená v databáze ]"
                                        : "[ Fotografia zatiaľ nie je k dispozícii ]"}
                                </div>

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

    },

    // ------------------------------------------------------------------
    // Pomocné bloky pre nový detail layout (2026-08-15)
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
     * Nahrádza pôvodný ⚡ zoznam diagnostických znakov (diagnosticSignsList)
     * novým vizuálom s ✓ (morphology-card-main z mockupu). Rovnaké dáta
     * (record.diagnosticSigns), iný vizuál.
     */
    morphologyCard(signs) {

        if (!Array.isArray(signs) || signs.length === 0) {

            return "";

        }

        return `
            <div class="morphology-card-main">

                <div class="morph-main-header">Diagnostické znaky</div>

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
     * Taxonómia v tabuľkovom formáte (mockup .taxonomy-table). Riadok
     * "Doména" z mockupu je ZÁMERNE VYNECHANÝ — pole neexistuje v
     * 02_DATABASE_SPECIFICATION.md schéme (taxonomy má len kingdom→species).
     * Pozri AI_STATUS.md v7 bod 0.2.6.
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

        const query =
            encodeURIComponent(latinName);

        const colUrl =
            `https://www.catalogueoflife.org/data/search?q=${query}`;

        const wormsUrl =
            `https://www.marinespecies.org/aphia.php?p=search&tName=${query}`;

        return `
            <a
                href="${colUrl}"
                target="_blank"
                rel="noopener noreferrer"
                class="btn btn-primary"
            >
                Catalogue of Life ↗
            </a>

            <a
                href="${wormsUrl}"
                target="_blank"
                rel="noopener noreferrer"
                class="btn btn-outline"
            >
                WoRMS ↗
            </a>
        `;

    },

    detailField(label, value) {

        if (
            value === undefined ||
            value === null ||
            String(value).trim() === ""
        ) {

            return "";

        }

        return `
            <div class="parasite-detail-field">

                <h2>${label}</h2>

                <p>
                    ${this.escapeHtml(value)}
                </p>

            </div>
        `;

    },

    field(label, value) {

        if (
            value === undefined ||
            value === null ||
            String(value).trim() === ""
        ) {

            return "";

        }

        return `
            <div class="parasite-field">

                <strong>${label}:</strong>

                <span>
                    ${this.escapeHtml(value)}
                </span>

            </div>
        `;

    },

    escapeHtml(value) {

        return String(value)
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");

    }

};

export default AtlasPage;
