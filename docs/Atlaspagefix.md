--- /mnt/user-data/uploads/AtlasPage.js	2026-08-17 19:28:16.357246000 +0000
+++ work_live_fix.js	2026-08-17 19:36:50.249973072 +0000
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