/******************************************************************************
 * VetPara Atlas
 * Atlas UI
 ******************************************************************************/

import Repository from "../services/Repository.js";

const AtlasPage = {

    state: {
        search: "",
        host: "",
        shape: "",
        color: ""
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
                            autocomplete="off"
                        >

                    </div>

                    <div class="atlas-filters">

                        ${this.renderFilter(
                            "host",
                            "Hostiteľ",
                            this.getValues("host")
                        )}

                        ${this.renderFilter(
                            "shape",
                            "Tvar",
                            this.getValues("shape")
                        )}

                        ${this.renderFilter(
                            "color",
                            "Farba",
                            this.getValues("color")
                        )}

                    </div>

                    <button
                        type="button"
                        id="atlas-clear-filters"
                        class="atlas-clear-filters"
                    >
                        Zrušiť filtre
                    </button>

                </div>

                <div
                    id="atlas-results-count"
                    class="atlas-results-count"
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
        this.bindFilter("color");

        const clearButton =
            document.getElementById("atlas-clear-filters");

        if (clearButton) {

            clearButton.addEventListener("click", () => {

                this.state.search = "";
                this.state.host = "";
                this.state.shape = "";
                this.state.color = "";

                this.render();

                const app = document.getElementById("app");

                app.innerHTML = this.render();

                this.init();

            });

        }

        this.renderRecords();

    },

    getValues(field) {

        const values = Repository.getAll()
            .map(record => record[field])
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

        if (!container || !count) {

            return;

        }

        const records = Repository.getAll();

        const search =
            this.state.search.trim().toLowerCase();

        const filtered = records.filter(record => {

            const matchesSearch =
                !search ||
                String(record.taxon ?? "")
                    .toLowerCase()
                    .includes(search);

            const matchesHost =
                !this.state.host ||
                String(record.host ?? "") === this.state.host;

            const matchesShape =
                !this.state.shape ||
                String(record.shape ?? "") === this.state.shape;

            const matchesColor =
                !this.state.color ||
                String(record.color ?? "") === this.state.color;

            return (
                matchesSearch &&
                matchesHost &&
                matchesShape &&
                matchesColor
            );

        });

        count.textContent =
            `Zobrazené záznamy: ${filtered.length} / ${records.length}`;

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
            >

                <header class="parasite-card-header">

                    <h2>
                        ${this.escapeHtml(record.taxon)}
                    </h2>

                </header>

                <div class="parasite-card-body">

                    ${this.field("Hostiteľ", record.host)}

                    ${this.field("Veľkosť", record.size)}

                    ${this.field("Tvar", record.shape)}

                    ${this.field("Farba", record.color)}

                    ${this.field("Stena", record.wall)}

                    ${this.field(
                        "Ďalšie znaky",
                        record.notes
                    )}

                </div>

            </article>

        `).join("");

        this.bindCards();

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

        const app = document.getElementById("app");

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
                        ${this.escapeHtml(record.taxon)}
                    </h1>

                    <p>
                        ID:
                        ${this.escapeHtml(record.id)}
                    </p>

                </header>

                <div class="parasite-detail-content">

                    ${this.detailField(
                        "Hostiteľ",
                        record.host
                    )}

                    ${this.detailField(
                        "Veľkosť",
                        record.size
                    )}

                    ${this.detailField(
                        "Tvar",
                        record.shape
                    )}

                    ${this.detailField(
                        "Farba",
                        record.color
                    )}

                    ${this.detailField(
                        "Stena",
                        record.wall
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

                const app = document.getElementById("app");

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