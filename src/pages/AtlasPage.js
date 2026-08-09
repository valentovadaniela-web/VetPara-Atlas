/******************************************************************************
 * VetPara Atlas
 * Atlas UI
 ******************************************************************************/

import Repository from "../services/Repository.js";

const AtlasPage = {

    render() {

        return `
            <section class="atlas-page">

                <div class="atlas-header">

                    <h1>Atlas parazitov</h1>

                    <p>
                        Diagnostický atlas veterinárnej parazitológie
                    </p>

                </div>

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

        const input = document.getElementById("atlas-search-input");

        if (!input) {

            return;

        }

        this.renderRecords("");

        input.addEventListener("input", (event) => {

            this.renderRecords(event.target.value);

        });

    },

    renderRecords(searchTerm) {

        const container = document.getElementById("atlas-records");
        const count = document.getElementById("atlas-results-count");

        if (!container || !count) {

            return;

        }

        const records = Repository.getAll();

        const search = searchTerm.trim().toLowerCase();

        const filtered = records.filter(record => {

            if (!search) {

                return true;

            }

            return String(record.taxon ?? "")
                .toLowerCase()
                .includes(search);

        });

        count.textContent =
            `Zobrazené záznamy: ${filtered.length} / ${records.length}`;

        if (filtered.length === 0) {

            container.innerHTML = `
                <div class="atlas-empty">
                    <p>Žiadny záznam nevyhovuje vyhľadávaniu.</p>
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

                    <h2>${this.escapeHtml(record.taxon)}</h2>

                </header>

                <div class="parasite-card-body">

                    ${this.field("Hostiteľ", record.host)}

                    ${this.field("Veľkosť", record.size)}

                    ${this.field("Tvar", record.shape)}

                    ${this.field("Farba", record.color)}

                    ${this.field("Stena", record.wall)}

                    ${this.field("Ďalšie znaky", record.notes)}

                </div>

            </article>

        `).join("");

        this.bindCards();

    },

    bindCards() {

        const cards = document.querySelectorAll(".parasite-card");

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

                    <h1>${this.escapeHtml(record.taxon)}</h1>

                    <p>
                        ID: ${this.escapeHtml(record.id)}
                    </p>

                </header>

                <div class="parasite-detail-content">

                    ${this.detailField("Hostiteľ", record.host)}

                    ${this.detailField("Veľkosť", record.size)}

                    ${this.detailField("Tvar", record.shape)}

                    ${this.detailField("Farba", record.color)}

                    ${this.detailField("Stena", record.wall)}

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