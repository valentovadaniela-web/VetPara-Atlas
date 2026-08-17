--- work_live_fix.js	2026-08-17 19:36:50.249973072 +0000
+++ work_multiselect_fix.js	2026-08-17 19:51:40.015722570 +0000
@@ -668,8 +668,32 @@
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