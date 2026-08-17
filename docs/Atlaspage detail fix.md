--- /mnt/user-data/uploads/AtlasPage.js	2026-08-17 19:28:16.357246000 +0000
+++ work_multiselect_fix.js	2026-08-17 20:05:38.103618865 +0000
@@ -35,13 +35,25 @@
  ******************************************************************************/
 
 import Repository from "../services/Repository.js";
-import hostHierarchy from "../../database/dictionary/host_hierarchy.json" with { type: "json" };
+import DatabaseService from "../services/DatabaseService.js";
+
+// OPRAVA (2026-08-17, bug: pád celej appky): pôvodný statický
+// `import hostHierarchy from ".../host_hierarchy.json" with { type: "json" }`
+// je za behu krehký — ak prehliadač/server nepodporí import attributes
+// alebo súbor 404-uje/zlú MIME hlavičku, ZLYHÁ CELÝ MODUL AtlasPage.js pri
+// parsovaní a appka spadne (presne toto sa stalo). Nahradené bezpečným
+// async fetchom cez DatabaseService.load() (rovnaká konvencia ako pre
+// ostatných 14 databázových súborov) s try/catch fallbackom — pozri
+// loadHostHierarchy() nižšie.
+const HOST_HIERARCHY_FILE = "dictionary/host_hierarchy.json";
 
 // Checkboxové filtre — OR logika v rámci poľa.
-const CHECKBOX_FIELDS = ["host", "sample"];
+const CHECKBOX_FIELDS = ["host"];
 
-// Ostávajú ako <select multiple> na explicitné želanie autorky.
-const MULTI_SELECT_FIELDS = ["shape", "colour"];
+// select-multiple, na explicitné želanie autorky (2026-08-17: "sample" sem
+// preradený na jej výslovnú žiadosť — Materiál má vyzerať a fungovať ako
+// Tvar/Farba).
+const MULTI_SELECT_FIELDS = ["sample", "shape", "colour"];
 
 const AtlasPage = {
 
@@ -57,6 +69,15 @@
         widthMax: ""
     },
 
+    // OPRAVA (2026-08-17): nahrádza pôvodný statický `import ... with { type: "json" }`.
+    // hostHierarchy je {} kým sa async fetch nedokončí — dovtedy
+    // getTopLevelGroup() vráti pre každého hostiteľa null, takže render()
+    // ukáže bezpečný fallback (všetci hostitelia ako "standalone", bez
+    // skupín) namiesto pádu appky. Po dokončení loadHostHierarchy() sa
+    // filter hostiteľov prekreslí so skupinami.
+    hostHierarchy: {},
+    hostHierarchyLoaded: false,
+
     render() {
 
         return `
@@ -256,6 +277,12 @@
 
         });
 
+        // OPRAVA (2026-08-17): async načítanie slovníka skupín, nahrádza
+        // pôvodný statický import, ktorý padal (pozri poznámku pri
+        // HOST_HIERARCHY_FILE). Prekreslí a znovu nabindí len sekciu
+        // filtra hostiteľov, keď fetch doletí.
+        this.loadHostHierarchy();
+
         MULTI_SELECT_FIELDS.forEach(field => {
 
             this.bindMultiFilter(field);
@@ -342,17 +369,70 @@
     getTopLevelGroup(hostName) {
 
         let current = hostName;
-        let parent = hostHierarchy[current];
+        let parent = this.hostHierarchy[current];
 
         while (parent) {
             current = parent;
-            parent = hostHierarchy[current];
+            parent = this.hostHierarchy[current];
         }
 
         return current !== hostName ? current : null;
 
     },
 
+    /**
+     * Bezpečné async načítanie host_hierarchy.json cez DatabaseService.load()
+     * (rovnaká konvencia ako pre 14 databázových súborov v database/). Ak
+     * fetch zlyhá, appka nepadne — hostHierarchy ostane {} a filter
+     * hostiteľov sa jednoducho zobrazí bez skupín (všetko "standalone").
+     */
+    async loadHostHierarchy() {
+
+        try {
+
+            this.hostHierarchy =
+                await DatabaseService.load(HOST_HIERARCHY_FILE);
+
+        }
+        catch (error) {
+
+            console.warn(
+                "VetPara Atlas: host_hierarchy.json sa nepodarilo načítať, " +
+                "hostiteľský filter zostáva bez skupín.",
+                error
+            );
+
+            this.hostHierarchy = {};
+
+        }
+
+        this.hostHierarchyLoaded = true;
+        this.refreshHostFilterSection();
+
+    },
+
+    /**
+     * Prekreslí IBA sekciu filtra hostiteľov (po dokončení
+     * loadHostHierarchy()) a znovu ju nabinduje. Zvyšok stránky sa nemení.
+     */
+    refreshHostFilterSection() {
+
+        const fieldset =
+            document.getElementById("atlas-filter-host");
+
+        const wrapper =
+            fieldset ? fieldset.closest(".filter-section") : null;
+
+        if (!wrapper) {
+            return;
+        }
+
+        wrapper.outerHTML = this.renderHostFilterSection(this.getHostValues());
+
+        this.bindCheckboxFilter("host");
+
+    },
+
     // ------------------------------------------------------------------
     // Formátovanie mikrometrie a hostiteľov na zobrazenie
     // ------------------------------------------------------------------
@@ -403,7 +483,9 @@
             return "";
         }
 
-        return hosts.join(", ");
+        // OPRAVA (2026-08-17): oddeľovač zmenený z ", " na " / " podľa
+        // schváleného referenčného obrázka (autorka, 2026-08-17).
+        return hosts.join(" / ");
 
     },
 
@@ -588,8 +670,32 @@
         }
 
         Array.from(select.options).forEach(option => {
+
             option.selected =
                 this.state[field].includes(option.value);
+
+            // OPRAVA (2026-08-17): natívne <select multiple> vyžaduje na
+            // výber VIACERÝCH položiek podržanie Ctrl/Cmd — bez toho
+            // klik vždy vybral len jednu a ostatné odznačil (nahlásený
+            // problém). Zachytávame mousedown (nie "click" — na <option>
+            // sa v niektorých prehliadačoch nespúšťa spoľahlivo),
+            // potlačíme predvolené správanie a položku prepneme (toggle)
+            // manuálne. Jedno kliknutie tak vždy len pridá/odoberie TÚ
+            // JEDNU položku, ostatné vybrané položky ostanú nedotknuté —
+            // rovnaké správanie ako pri checkboxoch, vizuál <select>
+            // sa nemení.
+            option.addEventListener("mousedown", event => {
+
+                event.preventDefault();
+
+                option.selected = !option.selected;
+
+                select.focus();
+
+                select.dispatchEvent(new Event("change"));
+
+            });
+
         });
 
         select.addEventListener("change", () => {
@@ -1021,63 +1127,125 @@
         const app =
             document.getElementById("app");
 
-        // Layout podľa mockupu (2026-08-15): detail-layout > .card hlavný panel
+        // OPRAVA (2026-08-17): vrátené na triedy zo skutočného atlas.css
+        // (specimen-title / side-boxes / findings-card / img-placeholder-box /
+        // quad-grid / morphology-card-main / taxonomy-table). Predchádzajúca
+        // (medzi-session) verzia používala iné názvy tried (detail-title,
+        // detail-grid, back-button, morphology-card...), ktoré v atlas.css
+        // vôbec neexistujú → stránka sa zobrazovala prakticky bez štýlov.
+        // Vizuál teraz zodpovedá schválenému referenčnému obrázku
+        // (autorka potvrdila 2026-08-17).
         app.innerHTML = `
-            <div id="detail-view" class="view-page active-view detail-layout">
-                <button id="atlas-back" class="back-button">← Späť na Atlas</button>
 
-                <div class="detail-card card">
-                    <h1 class="detail-title">${this.escapeHtml(record.latinName ?? record.id)}</h1>
-                    <p class="detail-subtitle">${this.escapeHtml([record.group, record.taxonomy?.family].filter(Boolean).join(" • ") || `ID: ${record.id}`)}</p>
-
-                    <div class="detail-grid">
-                        ${this.miniBox("Hostiteľ", this.formatHosts(record.host))}
-                        ${this.miniBox("Materiál", record.sample)}
-                        ${this.miniBox("Štádium", record.stage)}
-                    </div>
+            <div id="detail-view" class="view-page active-view">
 
-                    <div class="detail-image-placeholder">
-                        ${record.images && record.images.length > 0
-                            ? "[ Fotografia zatiaľ nie je pripojená v databáze ]"
-                            : "[ Fotografia zatiaľ nie je k dispozícii ]"
-                        }
-                    </div>
+                <button
+                    type="button"
+                    id="atlas-back"
+                    class="atlas-back"
+                >
+                    ← Späť na Atlas
+                </button>
 
-                    <div class="detail-quad-grid">
-                        ${this.quadBox("Veľkosť", this.formatSize(record.micrometry))}
-                        ${this.quadBox("Tvar", record.morphology?.shape)}
-                        ${this.quadBox("Farba", record.morphology?.colour)}
-                        ${this.quadBox("Obal", record.morphology?.shell)}
-                    </div>
+                <div class="detail-layout">
 
-                    ${this.morphologyCard(record.diagnosticSigns)}
-                    ${this.detailField("Poznámka", record.notes)}
+                    <main class="card">
 
-                    <div class="detail-external-links">
-                        ${this.taxonomyExternalLinksButtons(record.latinName)}
-                    </div>
+                        <h2 class="specimen-title">
+                            ${this.escapeHtml(record.latinName ?? record.id)}
+                        </h2>
+
+                        <div class="specimen-sub">
+                            ${this.escapeHtml(
+                                [record.group, record.taxonomy?.family]
+                                    .filter(Boolean)
+                                    .join(" • ")
+                                || `ID: ${record.id}`
+                            )}
+                        </div>
+
+                        <div class="detail-main-split">
+
+                            <div class="side-boxes">
+
+                                ${this.miniBox("Hostiteľ", this.formatHosts(record.host))}
+
+                                ${this.miniBox("Materiál", record.sample)}
+
+                                ${this.miniBox("Štádium", record.stage)}
+
+                            </div>
+
+                            <div class="findings-card card">
+
+                                <div class="img-placeholder-box">
+                                    [ Dynamický mikroskopický nález ]
+                                </div>
+
+                            </div>
+
+                        </div>
+
+                        <div class="quad-grid">
+
+                            ${this.quadBox("Veľkosť", this.formatSize(record.micrometry))}
+
+                            ${this.quadBox("Tvar", record.morphology?.shape)}
+
+                            ${this.quadBox("Farba", record.morphology?.colour)}
+
+                            ${this.quadBox("Obal", record.morphology?.shell)}
+
+                        </div>
+
+                        ${this.morphologyCard(record.diagnosticSigns)}
+
+                        ${this.detailField("Poznámka", record.notes)}
+
+                        <div class="actions-container">
+
+                            ${this.taxonomyExternalLinksButtons(record.latinName)}
+
+                        </div>
+
+                    </main>
+
+                    <aside class="card">
+
+                        <h3 class="taxonomy-title">Taxonomické zaradenie</h3>
+
+                        ${this.taxonomyTable(record.taxonomy)}
+
+                    </aside>
 
-                    <h3 class="taxonomy-heading">Taxonomické zaradenie</h3>
-                    ${this.taxonomyTable(record.taxonomy)}
                 </div>
+
             </div>
+
         `;
 
-        document.getElementById("atlas-back").addEventListener("click", () => {
-            app.innerHTML = this.render();
-            this.init();
-        });
+        document
+            .getElementById("atlas-back")
+            .addEventListener("click", () => {
+
+                app.innerHTML = this.render();
+
+                this.init();
+
+            });
 
     },
 
     // ------------------------------------------------------------------
-    // Pomocné bloky pre nový detail layout (2026-08-15)
+    // Pomocné bloky pre detail layout (triedy podľa atlas.css)
     // ------------------------------------------------------------------
 
     miniBox(label, value) {
 
         if (!value || String(value).trim() === "") {
+
             return "";
+
         }
 
         return `
@@ -1101,49 +1269,66 @@
     },
 
     /**
-     * Nahrádza pôvodný ⚡ zoznam diagnostických znakov (diagnosticSignsList)
-     * novým vizuálom s ✓ (morphology-card-main z mockupu). Rovnaké dáta
-     * (record.diagnosticSigns), iný vizuál.
+     * OPRAVA (2026-08-17): nadpis zmenený z "Diagnostické znaky" na
+     * "Morfológia" (podľa schváleného referenčného obrázka, autorka
+     * 2026-08-17). Dáta (record.diagnosticSigns) sa nemenili.
      */
     morphologyCard(signs) {
 
         if (!Array.isArray(signs) || signs.length === 0) {
+
             return "";
+
         }
 
         return `
-            <div class="morphology-card">
-                <h3 class="morphology-title">Diagnostické znaky</h3>
-                <div class="morphology-list">
+            <div class="morphology-card-main">
+
+                <div class="morph-main-header">Morfológia</div>
+
+                <div class="morph-main-content">
+
                     ${signs.map(sign => `
                         <div class="morph-list-item">
                             <span class="morph-checkmark" aria-hidden="true">✓</span>
                             <span>${this.escapeHtml(sign)}</span>
                         </div>
                     `).join("")}
+
                 </div>
+
             </div>
         `;
 
     },
 
     /**
-     * Taxonómia v tabuľkovom formáte (mockup .taxonomy-table). Riadok
-     * "Doména" z mockupu je ZÁMERNE VYNECHANÝ — pole neexistuje v
-     * 02_DATABASE_SPECIFICATION.md schéme (taxonomy má len kingdom→species).
-     * Pozri AI_STATUS.md v7 bod 0.2.6.
+     * Taxonómia v tabuľkovom formáte (mockup .taxonomy-table).
+     *
+     * OPRAVA (2026-08-17): riadok "Doména" DOPLNENÝ na explicitnú žiadosť
+     * autorky (referenčný obrázok, 2026-08-17) — čaká sa pole
+     * `taxonomy.domain`. POZOR: nepotvrdené, či toto pole reálne existuje
+     * v `02_DATABASE_SPECIFICATION.md`/dátach (nemám k dispozícii ani
+     * schému, ani zdrojové JSON súbory) — hodnota sa NEVYMÝŠĽA, riadok sa
+     * (rovnako ako ostatné) zobrazí len ak `taxonomy.domain` v dátach
+     * skutočne existuje. Ak je kľúč v schéme pomenovaný inak, treba mi to
+     * povedať a upravím len tento jeden riadok v poli `ranks`.
      */
     taxonomyTable(taxonomy) {
 
         if (!taxonomy || Object.keys(taxonomy).length === 0) {
+
             return `
                 <p class="atlas-size-hint">
-                    Taxonomické zaradenie nie je pre tento objekt zatiaľ vyplnené.
+                    Taxonomické zaradenie nie je pre tento objekt zatiaľ
+                    vyplnené.
                 </p>
             `;
+
         }
 
         const ranks = [
+            ["domain", "Doména"],
             ["kingdom", "Ríša"],
             ["phylum", "Kmeň"],
             ["class", "Trieda"],
@@ -1154,30 +1339,35 @@
         ];
 
         const rows = ranks
-            .map(([key, label]) => {
-                const value = taxonomy[key];
-                if (!value) return null;
-                return `
-                    <tr>
-                        <th>${label}</th>
-                        <td>${this.escapeHtml(value)}</td>
-                    </tr>
-                `;
-            })
-            .filter(Boolean)
+            .filter(([key]) =>
+                taxonomy[key] !== null &&
+                taxonomy[key] !== undefined &&
+                String(taxonomy[key]).trim() !== ""
+            )
+            .map(([key, label]) => `
+                <tr>
+                    <td class="tax-row-label">${label}</td>
+                    <td>${this.escapeHtml(taxonomy[key])}</td>
+                </tr>
+            `)
             .join("");
 
         if (!rows) {
+
             return `
                 <p class="atlas-size-hint">
-                    Taxonomické zaradenie nie je pre tento objekt zatiaľ vyplnené.
+                    Taxonomické zaradenie nie je pre tento objekt zatiaľ
+                    vyplnené.
                 </p>
             `;
+
         }
 
         return `
             <table class="taxonomy-table">
-                <tbody>${rows}</tbody>
+                <tbody>
+                    ${rows}
+                </tbody>
             </table>
         `;