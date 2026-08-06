/******************************************************************************
 * VetPara Atlas
 * Atlas Page
 ******************************************************************************/

import Repository from "../services/Repository.js";

const AtlasPage = {

    render() {

        const records = Repository.getAll();

        if (records.length === 0) {

            return `
                <h2>Atlas</h2>
                <p>Databáza je prázdna.</p>
            `;

        }

        const items = records.map(record => `

            <li data-id="${record.id}">
                <strong>${record.taxon}</strong><br>
                ${record.size}
            </li>

        `).join("");

        return `

            <section class="atlas-page">

                <h2>Atlas</h2>

                <p>Počet záznamov: ${records.length}</p>

                <ul>

                    ${items}

                </ul>

            </section>

        `;

    }

};

export default AtlasPage;