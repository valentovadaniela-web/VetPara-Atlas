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
                data-id="${record.id}"
            >

                <header class="parasite-card-header">

                    <h2>${this.escapeHtml(record.taxon)}</h2>

                </header>

                <div class="parasite-card-body">

                    ${this.field(
                        "Veľkosť",
                        record.size
                    )}

                    ${this.field(
                        "Tvar",
                        record.shape
                    )}

                    ${this.field(
                        "Farba",
                        record.color
                    )}

                    ${this.field(
                        "Stena",
                        record.wall
                    )}

                    ${this.field(
                        "Ďalšie znaky",
                        record.notes
                    )}

                </div>

            </article>

        `).join("");

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