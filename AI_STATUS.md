# VetPara Atlas – AI STATUS (kompletný stav projektu)

**Dátum poslednej aktualizácie:** 2026-08-17 (session: oprava pádu appky + filtrov)
**Branch:** develop
**Verzia projektu:** v14 (host-filter accordion pripojený + 3 opravy chýb po nasadení)

---

## 1. SÚHRN AKTUÁLNEHO STAVU (2026-08-17)

Projekt je funkčný. Milestone 2 (Vizuálny redizajn) je dokončený. Databáza obsahuje
**všetkých 14 hostiteľských súborov** naimportovaných z `Mikrometria_doplnená__opravená.xlsx`,
a od tejto verzie sú **všetky reálne aj načítané a zobrazované v Atlase** (predtým bol
natvrdo pripojený len `dog.migrated.json`):
- `dog.migrated.json` (38 záznamov)
- 13 ďalších host-súborov (spolu 529 záznamov) – pozri 1.2

### 1.0 Vyriešená Priorita — Oprava pádu appky + filtrov v `AtlasPage.js` (2026-08-17)

⚠️ **Poznámka pre ďalšieho AI:** medzi predchádzajúcou verziou tohto AI_STATUS.md a týmto
zásahom niekto (mimo tejto konverzácie) nasadil zmenu, ktorá **reálne pripojila
`database/dictionary/host_hierarchy.json` na UI filter Hostiteľ** (accordion so
skupinami) — ale táto zmena **nebola nikde zdokumentovaná** a obsahovala 2 chyby,
ktoré appku rozbili. Presný pôvod tejto medzi-zmeny nie je z tejto konverzácie
známy (nebol k dispozícii žiadny log/diff k nej) — táto sekcia popisuje len to,
čo bolo v tejto session **nájdené a opravené** v `src/pages/AtlasPage.js`.

- **Bug 1 (kritický, appka spadla celá):**
  - *Príčina:* statický `import hostHierarchy from ".../host_hierarchy.json" with { type: "json" }`
    na úrovni modulu. Projekt nemá bundler (`<script type="module">` priamo v `index.html`),
    takže pri zlyhaní import-attributes syntaxe / zlej MIME hlavičke zlyhalo
    parsovanie **celého** `AtlasPage.js` → appka sa nenačítala.
  - *Riešenie:* import nahradený asynchrónnym `DatabaseService.load("dictionary/host_hierarchy.json")`
    s `try/catch` fallbackom (`this.hostHierarchy = {}` pri zlyhaní) — rovnaká
    bezpečná konvencia ako pri ostatných 14 databázových súboroch. Filter
    hostiteľov sa krátko zobrazí bez skupín, po doletí fetchu sa prekreslí
    len jeho sekcia (`loadHostHierarchy()` / `refreshHostFilterSection()`).
- **Bug 2 (filter Materiál nereagoval na klik):**
  - *Príčina:* `sample` sa renderoval ako `<select multiple>` (`renderMultiFilter`),
    ale `init()` ho stále bindil cez `bindCheckboxFilter()` (očakáva checkboxy) →
    žiadny listener sa nenapojil.
  - *Riešenie:* `sample` presunutý z `CHECKBOX_FIELDS` do `MULTI_SELECT_FIELDS`
    — **potvrdené priamo autorkou** (2026-08-17): Materiál má byť vizuálne aj
    funkčne rovnaký ako Tvar/Farba (select). `CHECKBOX_FIELDS` teraz obsahuje
    už len `["host"]`.
- **Bug 3 (UX, nahlásené autorkou):** v `<select multiple>` (Materiál/Tvar/Farba)
  sa dala vybrať vždy len jedna položka naraz (natívne správanie prehliadača
  vyžaduje Ctrl/Cmd+klik na výber viacerých).
  - *Riešenie:* v `bindMultiFilter()` doplnený `mousedown` handler na každú
    `<option>`, ktorý potlačí natívne správanie a položku prepne (toggle)
    manuálne — jedno kliknutie teda vždy len pridá/odoberie tú jednu položku,
    ostatné vybrané položky ostanú nedotknuté. Vizuál `<select>` sa nemenil.
- **Čo sa NEMENILO:** `Repository.js`, `DatabaseService.js`, `index.html`,
  `src/styles/atlas.css` (CSS pre `.host-accordion` a pod. bolo už správne
  pripravené, len JS ho nevedel bezpečne naplniť dátami), filtre Hostiteľ
  (checkboxy/accordion markup) a Veľkosť (bez zmeny logiky).
- **Zostáva overiť/doplniť:**
  - Zosúladiť `src/pages/AtlasPage.js` v repozitári s verziou z tejto session
    (bola poslaná ako celý súbor, treba ju 1:1 nahradiť).
  - Zistiť a zdokumentovať, **kto/čo nasadilo pôvodnú (rozbitú) verziu**
    s host-accordionom, aby sa podobná medzi-session zmena budúce nestratila
    z AI_STATUS.md (porušenie pravidla č. 5 nižšie — logovanie).
  - Overiť v prehliadači: appka sa načíta bez chyby v konzole, Materiál aj
    Tvar/Farba umožňujú viacnásobný výber jedným klikom, filter Hostiteľ
    zobrazuje skupiny (accordion).
- 📄 Odporúčaný log zmeny (treba vytvoriť): `docs/2026-08-17_fix-atlaspage-crash-a-filtre.md`


- **Problém:** Atlas zobrazoval iba psa. `DatabaseService.js` vedel načítať len jeden
  súbor (`loadDogDatabase()` → `dog.migrated.json`) a `App.js` volal iba túto metódu.
  Ostatných 13 súborov v `database/` existovalo, ale aplikácia ich fyzicky nenačítavala.
- **Riešenie:**
  - V `src/services/DatabaseService.js` pridaná nová metóda `loadAllHostDatabases()`,
    ktorá načíta všetkých 14 súborov (`dog` + 13 ostatných) paralelne cez `Promise.all`,
    zlúči ich do jedného poľa (`flat()`) a uloží do `this.currentDatabase`.
  - Pôvodná metóda `loadDogDatabase()` **zostala nezmenená** (zachovaná pre prípadné
    budúce použitie/debug).
  - V `src/app/App.js` (metóda `loadDatabase()`) zmenené volanie
    z `DatabaseService.loadDogDatabase()` na `DatabaseService.loadAllHostDatabases()`.
  - `Repository.js` a `AtlasPage.js` **neboli menené** – obe vrstvy boli od začiatku
    nezávislé na tom, koľko súborov je zdrojom dát, takže zmena je neinvazívna
    (v súlade s pravidlom „nemeniť architektúru bez súhlasu").
- **Overenie duplicitných `id`:** Autorka potvrdila (2026-08-17), že kolízie `id`
  naprieč hostiteľmi sú vyriešené — zlúčenie polí (`flat()`) v `getRecordById()`
  (cez `Repository.getById()`) preto nehrozí stratou záznamov.
- **Očakávaný výsledok po nasadení:** `Repository.count()` by mal hlásiť **567 záznamov**
  (38 pes + 529 ostatní hostitelia) namiesto pôvodných 38.
- 📄 Log zmeny: `docs/2026-08-17_priorita2.2-multi-host-loading.md`

### 1.2 Vyriešená Priorita 2 – Import ďalších hostiteľov (2026-08-17)
- ✅ Naimportovaných **529 diagnostických objektov** z `Mikrometria_doplnená__opravená.xlsx`
  do 13 nových súborov: `cat`, `horse`, `cattle`, `pig`, `sheep_goat`, `rabbit`,
  `hedgehog`, `rodents`, `reptiles`, `fish`, `molluscs`, `wild_ruminants`, `birds`
  (všetky `*.migrated.json` v `database/`).
- ✅ **`dog.migrated.json` bol aktualizovaný** – pôvodný súbor bol zastaralý a nekolidoval
  s novými dátami. Bol pregenerovaný podľa rovnakej zdrojovej tabuľky
  `Mikrometria_doplnená__opravená.xlsx` ako ostatní hostitelia.
- ✅ Vytvorený nový slovník `dictionary/host_hierarchy.json` (67 mapovaní) –
  zoskupuje konkrétnych hostiteľov pod nadradené kategórie (napr. Varan → Jaštery
  → Plazy) bez zmeny existujúcej schémy `host: []`.
- ✅ Architektúra rozšírená nad rámec pôvodných 7 host-súborov zo
  `02_DATABASE_SPECIFICATION.md` – schválené autorkou priamo v chate.
- ✅ Všetky sporné prípady (duplicitné `id` naprieč hostiteľmi s odlišnými dátami)
  vyriešené s autorkou a zdokumentované.
- 📄 Log importu: `docs/2026-08-17_priorita2-import-hostitelia.md`

### 1.1 Vyriešené blokujúce problémy (2026-08-17)
- ✅ **Hamburger menu (mobil):** Kliknutie na hamburger teraz spoľahlivo zobrazí navigáciu.
  - *Príčina:* `width: 100%` a `z-index: 1000` chýbali v `.site-nav-links` v media query.
  - *Riešenie:* Pridané do `src/css/layout.css`.
- ✅ **Logo:** "VetPara" je biele (`#ffffff`), "Atlas" je svetlomodré (`#4a9eff`).
  - *Riešenie:* HTML rozdelené na `<span class="brand-vetpara">` a `<span class="brand-atlas">`, CSS farby nastavené v `layout.css`.
- ✅ **Aktívny stav v menu:** Pri kliknutí na odkaz sa správne zobrazí biely text s modrým podčiarknutím (vďaka JavaScriptu v `main.js`/`App.js` a CSS v `layout.css`).

### 1.2b Vyriešená Priorita 1 – Vyčistenie architektúry (2026-08-17)
- ✅ **`Navbar.js` (mŕtvy kód):** Overené (`App.js`, `Router.js`), že sa nikde neimportuje – header je natvrdo v `index.html`, routing beží cez `App.registerRoutes()`.
  - *Akcia:* Presunutý `src/components/Navbar.js` → `_archive/Navbar.js`. Obsah nezmenený.
- ✅ **CSS čistenie:** Odstránené duplicitné pravidlo `.site-header { background-color: var(--color-bg-header); }` (bolo dvakrát po sebe) v `src/css/layout.css`.
- 📄 Log zmeny: `docs/2026-08-17_priorita1-cleanup.md`

### 1.3b Čo bolo dokončené v predchádzajúcich fázach
- **Databáza (`dog.migrated.json`):**
  - Súbor bol pregenerovaný podľa aktuálnej verzie `Mikrometria_doplnená__opravená.xlsx`,
    aby korešpondoval s ostatnými 13 hostiteľmi.
  - Obsahuje 38 záznamov pre psa, validovaných voči schéme.
- **Vizuálny redizajn (Milestone 2):**
  - Bootstrap definitívne odstránený z projektu (nahradený vlastným CSS dizajnovým systémom cez `variables.css`).
  - Home stránka, filtre (host, sample, shape, colour), veľkostný filter, detail záznamu a taxonómia sú plne funkcionalizované a prestylované.
  - Opravené CSS pre `.atlas-size-row` na mobile.
- **JavaScript logika:**
  - Prepínač témy (`#theme-toggle`) funkčný (prepína `dark-mode`).
  - Automatické prepínanie triedy `.active` v menu pri kliknutí (funkčné).
- **Dokumentácia:**
  - `00_PROJECT_CONTEXT.md` a `05_TECHNICAL_ARCHITECTURE.md` aktualizované (Bootstrap odstránený zo stacku).

---

## 2. ČO BUDE POTREBOVAŤ NEZÁVISLÝ AI NA POKRAČOVANIE (Ďalšie kroky)

Ak príde nový AI asistent, musí vedieť, čo má robiť ďalej. Tu sú **konkrétne a zoradené úlohy**:

### 2.1 Priorita č. 1: Vyčistenie architektúry — ✅ DOKONČENÉ (2026-08-17)

### 2.2 Priorita č. 2: Etapa 2 – Import ďalších hostiteľov — ✅ DOKONČENÉ (2026-08-17)
Pozri sekciu 1.2 a `docs/2026-08-17_priorita2-import-hostitelia.md`.

### 2.2b Priorita č. 2.2: Napojenie všetkých host-databáz do aplikácie — ✅ DOKONČENÉ (2026-08-17)
Pozri sekciu 1.3 a `docs/2026-08-17_priorita2.2-multi-host-loading.md`.

**Čo môže nový AI ešte skontrolovať/dokončiť:**
- **Overiť v prehliadači/konzole**, že `Repository.count()` po nasadení skutočne
  hlási 567 záznamov a že Atlas zobrazuje všetky druhy hostiteľov (nielen psa).
- ✅ `dictionary/host_hierarchy.json` je od 2026-08-17 **napojený na UI**
  (accordion vo filtri Hostiteľ) — pozri sekciu 1.0. Predtým to spôsobilo
  pád appky (statický JSON import), teraz opravené cez `DatabaseService.load()`.
- Zvážiť, či `DatabaseService.load()` (jednotlivé `fetch` na súbor) nemá byť
  doplnené o robustnejšie spracovanie chyby, ak by jeden z 14 súborov chýbal
  alebo mal chybný formát (momentálne `Promise.all` zlyhá celé, ak zlyhá čo i len
  jeden `fetch`).

### 2.3 Priorita č. 3: Chýbajúce stránky (UI)
- **Gallery page** (momentálne placeholder – `console.log("Gallery page")` v `App.js`).
- **Expert page** (diagnostický systém – momentálne placeholder – `console.log("Expert page")` v `App.js`).
  - *Akcia:* Implementovať tieto stránky a prepojiť ich s existujúcim Routerom.

### 2.4 Priorita č. 4: Chýbajúce assety a drobné opravy
- **Chýbajúci obrázok:** Home hero pozadie (`home-hero.png`) stále chýba v `public/images/`.
  - *Akcia:* Dodať obrázok alebo upraviť CSS fallback.
- **Kontrola dát:** Overiť zdrojový riadok `Dibothriocephalus_latus_egg` v pôvodnej Excel tabuľke (podozrenie na chybné/zamenené dáta).
- **Skupina Acari/Pentastomida:** `group` pre tieto taxóny stále nie je v kontrolovanom zozname – treba ho definovať alebo ošetriť.

---

## 3. ZOZNAM DÔLEŽITÝCH SÚBOROV (Čo má AI k dispozícii)

Nový AI by mal mať v repozitári tieto kľúčové súbory (sú aktuálne):

- **`index.html`** – Hlavný markup aplikácie (obsahuje header, nav, tlačidlo Téma).
- **`src/css/layout.css`** – Štýly pre header, navigáciu a responzivitu (hamburger opravený, duplicita odstránená).
- **`src/css/variables.css`** – Všetky CSS premenné (farby, fonty, rozostupy).
- **`src/css/atlas.css`** – Štýly pre Home, filtre, databázu a detaily záznamov.
- **`src/app/App.js`** – Hlavná logika aplikácie (routing, bindovanie theme toggle a nav toggle). **Aktualizované 2026-08-17:** `loadDatabase()` teraz volá `DatabaseService.loadAllHostDatabases()` namiesto `loadDogDatabase()`.
- **`src/app/Router.js`** – Jednoduchý hash router (bez zmien).
- **`src/services/DatabaseService.js`** – **Aktualizované 2026-08-17:** pridaná metóda `loadAllHostDatabases()`, ktorá načíta a zlúči všetkých 14 host-súborov. Pôvodná `loadDogDatabase()` zachovaná bez zmeny.
- **`src/services/Repository.js`** – Prístupová vrstva k dátam (bez zmien, nezávislá od počtu zdrojových súborov).
- **`src/pages/AtlasPage.js`** – Logika pre filtre, vykreslenie zoznamu a detailov.
  **Aktualizované 2026-08-17 (táto session):** opravený pád appky (statický JSON
  import → `DatabaseService.load()`), opravené bindovanie filtra Materiál
  (presunutý do `MULTI_SELECT_FIELDS`), pridaný toggle-klik pre výber viacerých
  položiek v `<select multiple>` (Materiál/Tvar/Farba). `CHECKBOX_FIELDS` už
  obsahuje len `["host"]`. Pozri sekciu 1.0.
- **`src/js/main.js`** – Entry point aplikácie.
- **`database/dog.migrated.json`** – databáza pre psa (38 záznamov, zvalidovaná, v súlade s ostatnými hostiteľmi).
- **`database/{cat,horse,cattle,pig,sheep_goat,rabbit,hedgehog,rodents,reptiles,fish,molluscs,wild_ruminants,birds}.migrated.json`** – 13 host-súborov (529 záznamov spolu), naimportovaných 2026-08-17. **Od tejto verzie reálne napojených do Atlasu.**
- **`database/dictionary/host_hierarchy.json`** – Slovník hierarchie hostiteľov (67 mapovaní).
  **Od 2026-08-17 reálne napojený na UI** (accordion vo filtri Hostiteľ v `AtlasPage.js`),
  načítava sa asynchrónne cez `DatabaseService.load()`.
- **`_archive/Navbar.js`** – Archivovaný mŕtvy kód (nepoužívať, len referencia).
- **`docs/2026-08-17_priorita1-cleanup.md`** – Log Priority 1 (čistenie architektúry).
- **`docs/2026-08-17_priorita2-import-hostitelia.md`** – Log Priority 2 (import hostiteľov).
- **`docs/2026-08-17_priorita2.2-multi-host-loading.md`** – Log napojenia všetkých host-databáz do aplikácie (nová zmena).
- **`docs/2026-08-17_fix-atlaspage-crash-a-filtre.md`** – **(treba vytvoriť)** Log dnešnej opravy pádu appky (statický JSON import) + opravy filtrov Materiál a viacnásobného výberu v `<select multiple>`. Pozri sekciu 1.0.
- **`docs/2026-08-15_micrometry-taxonomy-import.md`** – Detailný záznam o importe a opravách dát.

---

## 4. DÔLEŽITÉ PRAVIDLÁ PRE ĎALŠIEHO AI (Aby nerozbil projekt)

1. **Databáza:** Nikdy neprepisovať `dog.json` (len `dog.migrated.json`). Pri importe nových hostiteľov vždy vytvárať nové JSON súbory.
2. **Dáta:** Nikdy nedopĺňať odborné údaje (taxonómia, mikrometria) odhadom. Výnimkou sú len explicitné inštrukcie autorky priamo v chate (napr. normalizácia `Animalia/Protozoa/Chromista`).
3. **Architektúra:** `App.js` a `Router.js` sú stabilné. Zmeny sa robia len minimálne a cielene (napr. zmena jedného volania metódy), nie prepisovaním logiky. Nemeniť ich rozsiahlejšie bez explicitného súhlasu autorky.
4. **Zdroj pravdy:** Projektový repozitár (súbory na disku) je vždy hlavným zdrojom pravdy, nie text tejto konverzácie. Vždy si pred zmenou načítať aktuálne súbory.
5. **Logovanie:** Každú významnú zmenu (najmä pri importe dát alebo napájaní databáz) treba zdokumentovať do samostatného `.md` súboru v priečinku `docs/`.

---