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
import HostFilterTree from "../components/HostFilterTree.js";

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

    /**
     * OPRAVA (2026-08-22, na žiadosť autorky): zoznam hostiteľov pre
     * ZOBRAZENIE (detail parazita, karta v zozname) — NA ROZDIEL od
     * `Repository.resolveHosts()` (ktorá zámerne rozbaľuje `hostGroups`
     * na všetky konkrétne druhy kvôli filtrovaniu a fulltextu) tu sa
     * skupiny NEROZBAĽUJÚ. Ak je záznam priradený napr. k `hostGroups:
     * ["Plazy"]`, v zobrazení sa má ukázať len "Plazy" — nie všetkých 28
     * konkrétnych druhov plazov, ktoré pod ňu patria. Konkrétny druh sa
     * má zobraziť iba vtedy, keď sa parazit skutočne týka LEN jeho — teda
     * keď je uvedený v `record.hosts` (mimo skupinovej logiky).
     */
    getDisplayHosts(record) {

        const groups =
            Array.isArray(record?.hostGroups) ? record.hostGroups : [];

        const explicitHosts =
            Array.isArray(record?.hosts) ? record.hosts : [];

        return [...new Set([...groups, ...explicitHosts])];

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

    // OPRAVA (2026-08-22, zdieľanie logiky s Galériou): pôvodná rekurzívna
    // implementácia stromu (buildHostChildrenMap / getHostHierarchyRoots /
    // renderHostNode) bola presunutá do samostatného modulu
    // src/components/HostFilterTree.js, aby ju bez duplikovania kódu mohla
    // použiť aj GalleryPage.js. Markup aj správanie ostávajú 1:1 identické
    // — mení sa iba to, že logiku teraz vykoná zdieľaný modul namiesto
    // metód priamo na tomto objekte.
    renderHostFilterSection(hosts) {

        return HostFilterTree.renderFilterSection({
            fieldsetId: "atlas-filter-host",
            legend: "Hostiteľ",
            hosts,
            hostHierarchy: this.hostHierarchy,
            selectedHosts: this.state.host,
            fieldName: "host"
        });

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

    // OPRAVA (2026-08-22, zdieľanie logiky s Galériou): delegované na
    // HostFilterTree (rovnaké správanie ako predtým — pozri komentár pri
    // renderHostFilterSection() vyššie).
    bindHostGroupSelectors() {

        const fieldset =
            document.getElementById("atlas-filter-host");

        HostFilterTree.bindGroupSelectors(fieldset, "host", (selected) => {

            this.state.host = selected;
            this.renderRecords();

        });

    },

    /**
     * Prepočíta zaškrtnutie/indeterminate stav všetkých ".host-group-select"
     * checkboxov — delegované na HostFilterTree.updateGroupSelectStates().
     */
    updateHostGroupSelectStates(fieldset) {

        HostFilterTree.updateGroupSelectStates(fieldset, "host");

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

    // OPRAVA (náhľady fotiek v zozname Atlasu): vracia HTML pre malý
    // náhľad hlavnej fotky záznamu (rovnaká logika výberu ako v detaile
    // a PrimaryImage.js — pickPrimary() + resolveImageUrl()). Ak záznam
    // nemá žiadnu fotku, vráti prázdny placeholder rovnakej veľkosti,
    // aby si karty v mriežke zachovali rovnakú výšku.
    renderRowThumbnail(record) {

        const images =
            Repository.getImagesForParasite(record.id);

        const primary =
            PrimaryImage.pickPrimary(images);

        if (!primary) {
            return `<div class="specimen-row-thumb specimen-row-thumb-empty" aria-hidden="true"></div>`;
        }

        return `
            <img
                src="${PrimaryImage.resolveImageUrl(primary.url)}"
                alt="${this.escapeHtml(record.latinName ?? record.id)}"
                class="specimen-row-thumb"
                loading="lazy"
            >
        `;

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
                <div class="specimen-row-header">
                    <h3>${this.escapeHtml(record.latinName ?? record.id)}</h3>
                </div>
                <div class="specimen-row-body">
                    <p class="specimen-row-meta">
                        <strong>Hostiteľ:</strong>
                        ${this.escapeHtml(this.formatHosts(this.getDisplayHosts(record)) || "—")}
                        |
                        <strong>Materiál:</strong>
                        ${this.escapeHtml(record.sample || "—")}
                        ${record.micrometry ? `| <strong>Veľkosť:</strong> ${this.escapeHtml(this.formatSize(record.micrometry) || "—")}` : ""}
                    </p>
                    ${this.renderRowThumbnail(record)}
                </div>
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

                        ${this.synonymsLine(record.synonyms)}

                        <div class="specimen-sub">
                            ${this.escapeHtml(
                                [record.group, record.taxonomy?.family]
                                    .filter(Boolean)
                                    .join(" • ")
                                || `ID: ${record.id}`
                            )}
                        </div>

                        ${this.zoonosisBadge(record.zoonosis)}

                        <div class="detail-main-split">

                            <div class="side-boxes">

                                ${this.miniBox("Hostiteľ", this.formatHosts(this.getDisplayHosts(record)))}

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

                        ${this.detailField("Životný cyklus", record.lifeCycle)}

                        ${this.detailField("Patológia", record.pathology)}

                        ${this.diagnosisListField("Diferenciálna diagnostika", record.differentialDiagnosis)}

                        ${this.hostNotesField(record.hostNotes)}

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
        
        // Ak existujú obrázky, zobrazíme prvý a zvyšok pridáme ako galériu.
        // OPRAVA (2026-08-22): klik na ktorúkoľvek fotku (hlavnú aj
        // miniatúru) predtým iba prehodil náhľad v rámci tejto stránky
        // (this.parentElement...src = this.src). Na želanie autorky teraz
        // namiesto toho prejde do Galérie s filtrom nastaveným na tohto
        // parazita (window.showGalleryForParasite), kde sú vidieť
        // všetky jeho fotky pohromade a dajú sa otvoriť v origináli.
        if (parasiteImages.length > 0) {
            // FIX (2026-08-22): predtým sa hlavná fotka určovala vždy ako
            // parasiteImages[0] (prvá v poradí zápisu v images.json), bez
            // možnosti autorky vybrať inú. Teraz sa použije rovnaký zdieľaný
            // výber ako v PrimaryImage.js (pickPrimary) — uprednostní
            // fotku s isPrimary:true (nastaviteľné v tools/captions), inak
            // padne späť na pôvodné správanie (prvá v poradí súboru).
            const mainImage = PrimaryImage.pickPrimary(parasiteImages);
            const thumbnailImages = parasiteImages.filter((img) => img !== mainImage);

            // FIX (2026-08-22): `img.url`/`firstImageUrl` z images.json je absolútna
            // cesta ("/public/images/..."). Na GitHub Pages appka beží pod podcestou
            // (napr. "/VetPara-Atlas/"), takže absolútna cesta sa vyhodnotí od koreňa
            // domény a spôsobí 404 (presne ako v Galérii/PrimaryImage predtým — pozri
            // AI_STATUS §0.9/§0.10). Tento blok predtým používal `img.url` priamo, bez
            // normalizácie — Galéria aj PrimaryImage už normalizáciu majú
            // (resolveImageUrl), tak ju tu len opätovne použijeme namiesto duplikovania.
            const firstImageUrl = PrimaryImage.resolveImageUrl(mainImage.url);
            mainImageContainer.innerHTML = `
                <img src="${firstImageUrl}" class="main-image" alt="${this.escapeHtml(mainImage.alt || record.latinName)}" style="width:100%; height:auto; border-radius:8px; cursor:pointer;">
                <div style="margin-top: 8px; display: flex; gap: 8px; flex-wrap: wrap;">
                    ${thumbnailImages.map(img => `
                        <img src="${PrimaryImage.resolveImageUrl(img.url)}" alt="${this.escapeHtml(img.alt || '')}" class="detail-thumb-image" style="width: 80px; height: 80px; object-fit: cover; border-radius: 4px; cursor: pointer;">
                    `).join('')}
                </div>
            `;

            mainImageContainer.querySelectorAll("img").forEach(imgEl => {
                imgEl.addEventListener("click", () => {
                    if (typeof window.showGalleryForParasite === "function") {
                        window.showGalleryForParasite(id);
                    }
                });
            });
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

    /**
     * Zobrazí sa iba ak je record.zoonosis === true (zaškrtnuté v admin
     * formulári) — pri false/undefined sa nič nevykresľuje, žiadny
     * negatívny badge ("nie je zoonóza") sa zámerne nezobrazuje.
     */
    zoonosisBadge(zoonosis) {

        if (zoonosis !== true) {
            return "";
        }

        return `
            <div class="zoonosis-badge">
                ⚠️ Zoonóza — prenosné na človeka
            </div>
        `;

    },

    /**
     * Rovnaký typ poľa ako detailField(), ale pre pole reťazcov
     * (differentialDiagnosis) namiesto jedného textu — vypíše sa ako
     * odrážkový zoznam. Prázdne/undefined pole sa nezobrazí vôbec.
     */
    diagnosisListField(label, items) {

        if (!Array.isArray(items) || items.length === 0) {
            return "";
        }

        return `
            <div class="detail-field">
                <h4>${label}</h4>
                <div class="detail-field-content">
                    <ul>
                        ${items.map((item) => `<li>${this.escapeHtml(item)}</li>`).join("")}
                    </ul>
                </div>
            </div>
        `;

    },

    /**
     * Alternatívne/synonymné latinské názvy (napr. staršie taxonomické
     * označenie) — pole `synonyms` sa doteraz používalo iba vo fulltext
     * vyhľadávaní (matchesFulltext()), v detaile sa nikdy nevypisovalo.
     * Prázdne pole (bežný prípad) sa nezobrazí vôbec.
     */
    synonymsLine(synonyms) {

        if (!Array.isArray(synonyms) || synonyms.length === 0) {
            return "";
        }

        return `
            <div class="specimen-synonyms">
                Synonymá: ${synonyms.map((name) => `<em>${this.escapeHtml(name)}</em>`).join(", ")}
            </div>
        `;

    },

    /**
     * Poznámky špecifické pre jedného konkrétneho hostiteľa (napr.
     * odchýlka v mikrometrii u daného druhu) — mapa hostiteľ → text.
     * Kľúče bez neprázdnej hodnoty sa vynechajú; prázdny objekt {}
     * (bežný prípad) sa nezobrazí vôbec.
     */
    hostNotesField(hostNotes) {

        if (!hostNotes || typeof hostNotes !== "object") {
            return "";
        }

        const entries = Object.entries(hostNotes)
            .filter(([, note]) => note !== undefined && note !== null && String(note).trim() !== "");

        if (entries.length === 0) {
            return "";
        }

        return `
            <div class="detail-field">
                <h4>Poznámky k hostiteľom</h4>
                <div class="detail-field-content">
                    <ul>
                        ${entries.map(([host, note]) => `
                            <li><strong>${this.escapeHtml(host)}:</strong> ${this.escapeHtml(note)}</li>
                        `).join("")}
                    </ul>
                </div>
            </div>
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
                <div class="detail-field-content">
                    <p>${this.escapeHtml(value)}</p>
                </div>
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