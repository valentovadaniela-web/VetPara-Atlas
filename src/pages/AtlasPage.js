/******************************************************************************
 * VetPara Atlas
 * Atlas UI
 *
 * POZNÁMKA (2026-08-11): Prepracované na novú databázovú schému podľa
 * 02_DATABASE_SPECIFICATION.md — polia latinName / host[] / micrometry{} /
 * morphology{shape,colour,shell} nahrádzajú staré ploché polia
 * taxon / host (text) / size (text) / shape / color / wall.
 ******************************************************************************/

import Repository from "../services/Repository.js";

const AtlasPage = {

    state: {
        search: "",
        host: "",
        shape: "",
        colour: ""
    },

    render() {

        return `
            <section class="atlas-page">

                <div class="atlas-header">

                    <h1>Atlas parazitov</h1>

                    <p>
                        Diagnostický atlas veterinárnej parazitológie
                    </p>

                </div>

                <div class="atlas-controls">

                    <div class="atlas-search">

                        <label for="atlas-search-input">
                            Vyhľadávanie
                        </label>

                        <input
                            id="atlas-search-input"
                            type="search"
                            placeholder="Hľadať parazita..."
                            aria-label="Vyhľadávanie parazita"
                            autocomplete="off"
                        >

                    </div>

                    <div class="atlas-filters">

                        ${this.renderFilter(
                            "host",
                            "Hostiteľ",
                            this.getHostValues()
                        )}

                        ${this.renderFilter(
                            "shape",
                            "Tvar",
                            this.getValues("morphology.shape")
                        )}

                        ${this.renderFilter(
                            "colour",
                            "Farba",
                            this.getValues("morphology.colour")
                        )}

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

                </div>

                <div
                    id="atlas-results-count"
                    class="atlas-results-count"
                    aria-live="polite"
                ></div>

                <div
                    id="atlas-records"
                    class="atlas-records"
                ></div>

            </section>
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

        this.bindFilter("host");
        this.bindFilter("shape");
        this.bindFilter("colour");

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

    renderFilter(field, label, values) {

        return `
            <div class="atlas-filter">

                <label for="atlas-filter-${field}">
                    ${label}
                </label>

                <select id="atlas-filter-${field}">

                    <option value="">
                        Všetky
                    </option>

                    ${values.map(value => `
                        <option value="${this.escapeHtml(value)}">
                            ${this.escapeHtml(value)}
                        </option>
                    `).join("")}

                </select>

            </div>
        `;

    },

    bindFilter(field) {

        const select =
            document.getElementById(`atlas-filter-${field}`);

        if (!select) {

            return;

        }

        select.value = this.state[field];

        select.addEventListener("change", (event) => {

            this.state[field] = event.target.value;

            this.renderRecords();

        });

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
                !search ||
                String(record.latinName ?? "")
                    .toLowerCase()
                    .includes(search) ||
                String(record.slovakName ?? "")
                    .toLowerCase()
                    .includes(search);

            const matchesHost =
                !this.state.host ||
                (Array.isArray(record.host) &&
                    record.host.includes(this.state.host));

            const matchesShape =
                !this.state.shape ||
                String(record.morphology?.shape ?? "") === this.state.shape;

            const matchesColour =
                !this.state.colour ||
                String(record.morphology?.colour ?? "") === this.state.colour;

            return (
                matchesSearch &&
                matchesHost &&
                matchesShape &&
                matchesColour
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

        container.innerHTML = filtered.map(record => `

            <article
                class="parasite-card"
                data-id="${this.escapeHtml(record.id)}"
                tabindex="0"
                role="button"
                aria-label="Otvoriť detail: ${this.escapeHtml(record.latinName ?? record.id)}"
            >

                <header class="parasite-card-header">

                    <h2>
                        ${this.escapeHtml(record.latinName ?? record.id)}
                    </h2>

                </header>

                <div class="parasite-card-body">

                    ${this.field("Hostiteľ", this.formatHosts(record.host))}

                    ${this.field("Veľkosť", this.formatSize(record.micrometry))}

                    ${this.field("Tvar", record.morphology?.shape)}

                    ${this.field("Farba", record.morphology?.colour)}

                    ${this.field("Obal", record.morphology?.shell)}

                    ${this.field(
                        "Ďalšie znaky",
                        record.notes
                    )}

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

        if (this.state.host) {

            filters.push({
                key: "host",
                label: "Hostiteľ",
                value: this.state.host
            });

        }

        if (this.state.shape) {

            filters.push({
                key: "shape",
                label: "Tvar",
                value: this.state.shape
            });

        }

        if (this.state.colour) {

            filters.push({
                key: "colour",
                label: "Farba",
                value: this.state.colour
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

                this.state[key] = "";

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

        ["host", "shape", "colour"].forEach(field => {

            const select =
                document.getElementById(`atlas-filter-${field}`);

            if (select) {

                select.value = this.state[field];

            }

        });

    },

    clearFilters() {

        this.state.search = "";
        this.state.host = "";
        this.state.shape = "";
        this.state.colour = "";

        this.syncControls();

        this.renderRecords();

    },

    bindCards() {

        const cards =
            document.querySelectorAll(".parasite-card");

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

        app.innerHTML = `

            <section class="parasite-detail">

                <button
                    type="button"
                    id="atlas-back"
                    class="atlas-back"
                >
                    ← Späť na Atlas
                </button>

                <header class="parasite-detail-header">

                    <h1>
                        ${this.escapeHtml(record.latinName ?? record.id)}
                    </h1>

                    <p>
                        ID:
                        ${this.escapeHtml(record.id)}
                    </p>

                </header>

                <div class="parasite-detail-content">

                    ${this.detailField(
                        "Hostiteľ",
                        this.formatHosts(record.host)
                    )}

                    ${this.detailField(
                        "Štádium",
                        record.stage
                    )}

                    ${this.detailField(
                        "Typ vzorky",
                        record.sample
                    )}

                    ${this.detailField(
                        "Veľkosť",
                        this.formatSize(record.micrometry)
                    )}

                    ${this.detailField(
                        "Tvar",
                        record.morphology?.shape
                    )}

                    ${this.detailField(
                        "Farba",
                        record.morphology?.colour
                    )}

                    ${this.detailField(
                        "Obal",
                        record.morphology?.shell
                    )}

                    ${this.detailField(
                        "Ďalšie znaky",
                        record.notes
                    )}

                </div>

            </section>

        `;

        document
            .getElementById("atlas-back")
            .addEventListener("click", () => {

                app.innerHTML = this.render();

                this.init();

            });

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
