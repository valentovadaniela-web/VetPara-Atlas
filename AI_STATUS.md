# VetPara Atlas – AI STATUS
Aktualizované: 2026-08-13
Branch: develop
Git: working tree clean (pred touto zmenou — nezabudni commitnúť nový dog.migrated.json)

## 1. Milestone
Milestone 1 – Core Foundation (Atlas + databáza + migrácia) → **prechod na dopĺňanie odborných dát**

## 2. Posledná vykonaná zmena

Dve nadväzujúce úpravy `dog.migrated.json` v rámci jednej session (2026-08-13):

**A) Extrakcia `diagnosticSigns` z poľa `notes`** (17 z pôvodných 37 záznamov) —
morfologické/identifikačné frázy, ktoré po merge z 2026-08-12 skončili v `notes`, boli
presunuté do `diagnosticSigns` podľa `03_DATA_ENTRY_STANDARD.md` § 12. Detaily:
`docs/2026-08-13_diagnosticSigns-extraction.md`.

**B) Import taxonómie z NCBI tabuľky (`Taxonómia.xlsx`, dodaná autorkou projektu)**
— zaplnenie poľa `taxonomy` (kingdom–phylum–class–order–family–genus–species) podľa
`02_DATABASE_SPECIFICATION.md` § 8, na základe úlohy č. 5 z `Úlohy.txt`. Detaily:
`docs/2026-08-13_taxonomy-import-report.md`.

Kľúčové body importu B:
- Párovanie podľa `latinName` proti NCBI exportu (96 858 riadkov, hárok `csv`).
- `Kingdom: "Protista"` explicitne priradený pri prvokoch (Cryptosporidium, Sarcocystis,
  Balantioides) — **na výslovný pokyn autorky projektu**, keďže NCBI tabuľka mala pre ne
  `Kingdom` prázdne. Toto je jediné miesto, kde `taxonomy` obsahuje hodnotu nad rámec
  priamej NCBI zhody.
- **`taenia_spp_echinococcus` rozdelený na 2 samostatné záznamy** — `taenia_sp_egg` a
  `echinococcus_sp_egg` — keďže ide o odlišné rody (aj keď mikroskopicky nerozlíšiteľné).
  Oba majú zhodné `host`/`sample`/`stage`/`group`/`micrometry`/`morphology` a `notes`:
  *„Vajíčka Taenia a Echinococcus sú morfologicky nerozoznateľné, udávame vajíčka
  taeniového typu."* **Počet záznamov v databáze sa tým zvýšil z 37 na 38.**
- 22 záznamov má taxonómiu do úrovne `species`, 6 iba do úrovne `genus` (`species: null`,
  vrátane Taenia/Echinococcus splitu), 8 záznamov nemá taxonómiu vôbec (nenájdené v
  NCBI tabuľke) — kompletný zoznam v prílohe `Taxonomia_na_doplnenie.xlsx`, odoslanej
  autorke projektu na doplnenie/rozhodnutie.
- Žiadny odborný údaj nebol vytvorený mimo: (a) priamej NCBI zhody, (b) explicitnej
  inštrukcie autorky projektu (Kingdom Protista, split Taenia/Echinococcus + text poznámky).

Vykonané v Claude chate, výstup treba stiahnuť a nahradiť `database/dog.migrated.json`
v repozitári + commitnúť.

Súbory na stiahnutie z tejto session:
- `dog.migrated.json` (nová verzia, **38 záznamov**)
- `2026-08-13_diagnosticSigns-extraction.md` (diff pre zmenu A)
- `2026-08-13_taxonomy-import-report.md` (diff pre zmenu B)
- `Taxonomia_na_doplnenie.xlsx` (14 riadkov na kontrolu/doplnenie autorkou projektu)

**dog.json (pôvodná surová databáza) NEBOL menený — podľa pravidla.**

## 3. Aktuálny stav projektu
Aplikácia je funkčná, databáza sa načítava, AtlasPage renderuje záznamy podľa novej schémy.
Databáza psa má **38 diagnostických objektov** (bolo 37 — split Taenia/Echinococcus), s
vyplnenými `host`, `sample`, `stage`, `group`, doplnenou/spresnenou mikrometriou a
morfológiou, čiastočne vyplnenými `diagnosticSigns` (17/38) a teraz aj čiastočne
vyplnenou `taxonomy` (30/38 aspoň do úrovne rodu, z toho 22 do úrovne druhu).

### 3.1 Funkčné časti
- **App.js** – bootstrap, načítanie databázy, routing
- **Router.js** – hash-based router, stabilný
- **ApplicationState.js** – globálny stav, filtre, ready flag
- **DatabaseService.js** – načítanie databázy, cache, getRecordById
- **Repository.js** – vyhľadávanie, filtrovanie, triedenie
- **AtlasPage.js** – kompletné UI, filtre, detail záznamu — **zatiaľ nezobrazuje ani
  `diagnosticSigns`, ani `taxonomy`** (pozri bod 3.4)
- **dog.migrated.json** – **NOVÁ VERZIA (38 záznamov)** — diagnosticSigns + taxonomy
- **migrate-dog-json.js** – pôvodná migrácia z dog.json, stále platná ako prvý krok
- **index.html** – základná štruktúra aplikácie
- **main.js** – inicializácia App.start()

### 3.2 Čo funguje technicky
(bez zmeny — App/Router/Repository/AtlasPage neboli v tomto kroku menené, iba dáta)

⚠️ **Naďalej platí zistenie z predchádzajúcej session:** `AtlasPage.js` nezobrazuje
`record.diagnosticSigns`. K tomu teraz pribúda: **ani `record.taxonomy` sa nikde
nezobrazuje** — a to je konkrétne požadované v `Úlohy.txt` bod 5 (karta parazita má
zobraziť Ríša–Kmeň–Trieda–Rad–Čeľaď–Rod–Druh + odkaz na Catalogue of Life/WoRMS).
Dáta sú teraz pripravené, UI ešte nie.

### 3.3 Zmena schémy ID / počtu záznamov
- Sémantické ID + `legacyId` (bez zmeny oproti predchádzajúcej verzii)
- **Nové:** počet diagnostických objektov v `dog.migrated.json` je teraz **38**, nie 37
  (split `taenia_spp_echinococcus` → `taenia_sp_egg` + `echinococcus_sp_egg`, obe so
  `legacyId: "DOG-0013"`). Ak niekde v kóde/testoch existuje predpoklad presného počtu
  37 záznamov, treba ho opraviť.

### 3.4 Čo nefunguje / je prázdne
- Gallery page – placeholder
- Expert page – placeholder
- Settings page – placeholder
- **`taxonomy`** je teraz vyplnená pri 30/38 záznamoch (22 do úrovne druhu, 8 do úrovne
  rodu vrátane Taenia/Echinococcus splitu); 8 záznamov má `taxonomy: {}` — zoznam
  v `Taxonomia_na_doplnenie.xlsx`
- `diagnosticSigns` vyplnené pri 17/38 záznamoch (viď 2026-08-13 zmena A)
- **AtlasPage.js nezobrazuje ani `diagnosticSigns`, ani `taxonomy`** — obe dátové
  vylepšenia sú zatiaľ v UI neviditeľné
- `differentialDiagnosis`, `images`, `references`, `zoonosis`, `methods` — prázdne pri
  všetkých záznamoch
- `group` obsahuje pri 2 objektoch (Demodex spp., Linguatula serrata) hodnoty mimo
  kontrolovaného zoznamu z `02_DATABASE_SPECIFICATION.md` — nerieši sa touto úpravou
- Repository zatiaľ neaplikuje ApplicationState.filters (iba lokálne filtre v AtlasPage)
- **Filtre podľa veľkosti (rozsah dĺžka/šírka od–do) a podľa `sample` (= „materiál" v
  `Úlohy.txt`) ešte nie sú implementované** — pozri `Úlohy.txt` body 1, 3
- **Multi-select filtre (farba/tvar/hostiteľ/sample) a fulltext cez všetky polia** ešte
  nie sú implementované — pozri `Úlohy.txt` bod 4

### 3.5 Databáza – stav
- **dog.json** – pôvodná schéma, ploché polia, NEMENENÉ
- **dog.migrated.json** – **38 záznamov**, `diagnosticSigns` pri 17, `taxonomy` pri 30
  (pozri `2026-08-13_diagnosticSigns-extraction.md` a `2026-08-13_taxonomy-import-report.md`)
- **dog_worksheet.xlsx** – zdrojový pracovný hárok, spracovaný (merge 2026-08-12)
- **Taxonómia.xlsx** – NCBI export (96 858 riadkov), zdroj pre import taxonómie
  2026-08-13, spracovaný
- **Taxonomia_na_doplnenie.xlsx** – 14 riadkov čakajúcich na rozhodnutie/doplnenie
  autorkou projektu (8 nenájdených druhov + 6 len na úrovni rodu)
- **Mikrometria__parazity.xls** – 16 hárkov podľa hostiteľa; hárok "Psy" už spracovaný,
  zvyšných 15 hárkov pripravených pre Etapu 2

### 3.6 Architektúra
(bez zmeny)

---

## 4. Posledné zmeny v súboroch
- database/dog.migrated.json – **nahradiť novou verziou z tejto session** (38 záznamov,
  diagnosticSigns + taxonomy doplnené)
- (nový) docs/2026-08-13_diagnosticSigns-extraction.md
- (nový) docs/2026-08-13_taxonomy-import-report.md
- (nový, mimo repozitára — pracovný dokument pre autorku) Taxonomia_na_doplnenie.xlsx

---

## 5. Posledný problém
Žiadny aktívny dátový/technický problém. Treba:
1. stiahnuť nový `dog.migrated.json` (38 záznamov) a nahradiť ním súbor v `database/`,
2. commitnúť s referenciou na oba reporty z 2026-08-13,
3. **aktualizovať `10_CHANGELOG.md`** — zmena počtu záznamov (37→38) je architektonicky
   významná zmena (split diagnostického objektu), musí byť zapísaná podľa vlastných
   pravidiel projektu (`10_CHANGELOG.md` § 2),
4. skontrolovať kód/testy na predpoklad "37 záznamov" (viď bod 3.3),
5. vyriešiť 14 riadkov v `Taxonomia_na_doplnenie.xlsx` (autorka projektu),
6. naplánovať úpravu `AtlasPage.js` (zobrazenie `diagnosticSigns` + `taxonomy` + odkaz
   na Catalogue of Life/WoRMS, `Úlohy.txt` bod 5).

---

## 6. Ďalší krok (pre Claude / Gemini / DeepSeek)

Zoznam bol prehodnotený na základe `Úlohy.txt` — odporúča sa spracovať ako jeden
kombinovaný krok "Filter & Detail engine v2", aby sa `AtlasPage.js`/`Repository.js`
neupravovali opakovane po častiach:

1. **AtlasPage.js — zobrazenie nových polí:**
   - `diagnosticSigns` v karte aj v detaile (napr. so symbolom ⚡ podľa
     `04_UI_UX_SPECIFICATION.md`/docx príručky)
   - `taxonomy` v detaile (Ríša–Kmeň–Trieda–Rad–Čeľaď–Rod–Druh) + externý odkaz na
     Catalogue of Life / WoRMS zostavený z `latinName` (bez API volania, len
     vyhľadávací link — `Úlohy.txt` bod 5)
2. **Repository.js / AtlasPage.js — rozšírenie filtrov (`Úlohy.txt` body 1, 3, 4):**
   - filter podľa veľkosti — rozsah dĺžka od–do, šírka od–do (`micrometry`)
   - filter podľa `sample` (= „materiál")
   - multi-select pre farbu/tvar/hostiteľa/`sample` (OR logika v rámci jedného poľa)
   - fulltext vyhľadávanie rozšíriť zo `latinName`/`slovakName` na všetky relevantné
     textové polia (`notes`, `diagnosticSigns`, `morphology.*`)
3. Doplniť šírku pre `dirofilaria_repens`, `dirofilaria_immitis`,
   `oslerus_filaroides_osleri` z odbornej literatúry
4. Vyriešiť `group` pre Acari/Pentastomida (mimo kontrolovaného zoznamu)
5. Implementovať Gallery page (zatiaľ placeholder)
6. Implementovať Expert page (diagnostický systém)
7. Rozšíriť Repository o podporu ApplicationState.filters
8. Pridať error page pre neexistujúce ID, preloader pri načítaní databázy
9. Spracovať zvyšných 15 hárkov z Mikrometria__parazity.xls pre ďalších hostiteľov (Etapa 2)
10. Po doplnení `Taxonomia_na_doplnenie.xlsx` autorkou — druhé kolo importu taxonómie

---

## 7. Dôležité pravidlá pre AI
- AI musí vždy načítať aktuálne súbory pred zmenou
- AI musí aktualizovať AI_STATUS.md po každej zmene
- AI nesmie meniť architektúru bez súhlasu
- AI nesmie prepisovať dog.json (iba dog.migrated.json)
- AI nesmie dopĺňať odborné údaje odhadom — výnimkou sú iba explicitné inštrukcie
  autorky projektu priamo v chate (napr. Kingdom Protista, Taenia/Echinococcus split)
- AI musí rešpektovať databázovú štruktúru podľa 02_DATABASE_SPECIFICATION.md
- Projekt je hlavný zdroj pravdy (nie konverzácia)
- Git commit po každej zmene

---
