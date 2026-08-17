# VetPara Atlas – AI STATUS (kompletný stav projektu)

**Dátum poslednej aktualizácie:** 2026-08-17
**Branch:** develop
**Verzia projektu:** v11 (po vyriešení hamburger menu, loga a čistení architektúry)

---

## 1. SÚHRN AKTUÁLNEHO STAVU (2026-08-17)

Projekt je funkčný. Milestone 2 (Vizuálny redizajn) je dokončený. Databáza pre psa (38 záznamov) je naimportovaná, ošetrená, funkčná a zvalidovaná voči `02_DATABASE_SPECIFICATION.md` (bez chýb). Priorita 1 (vyčistenie architektúry) je dokončená.

### 1.1 Vyriešené blokujúce problémy (2026-08-17)
- ✅ **Hamburger menu (mobil):** Kliknutie na hamburger teraz spoľahlivo zobrazí navigáciu.
  - *Príčina:* `width: 100%` a `z-index: 1000` chýbali v `.site-nav-links` v media query.
  - *Riešenie:* Pridané do `src/css/layout.css`.
- ✅ **Logo:** "VetPara" je biele (`#ffffff`), "Atlas" je svetlomodré (`#4a9eff`).
  - *Riešenie:* HTML rozdelené na `<span class="brand-vetpara">` a `<span class="brand-atlas">`, CSS farby nastavené v `layout.css`.
- ✅ **Aktívny stav v menu:** Pri kliknutí na odkaz sa správne zobrazí biely text s modrým podčiarknutím (vďaka JavaScriptu v `main.js`/`App.js` a CSS v `layout.css`).

### 1.2 Vyriešená Priorita 1 – Vyčistenie architektúry (2026-08-17)
- ✅ **`Navbar.js` (mŕtvy kód):** Overené (`App.js`, `Router.js`), že sa nikde neimportuje – header je natvrdo v `index.html`, routing beží cez `App.registerRoutes()`.
  - *Akcia:* Presunutý `src/components/Navbar.js` → `_archive/Navbar.js`. Obsah nezmenený.
- ✅ **CSS čistenie:** Odstránené duplicitné pravidlo `.site-header { background-color: var(--color-bg-header); }` (bolo dvakrát po sebe) v `src/css/layout.css`.
- 📄 Log zmeny: `docs/2026-08-17_priorita1-cleanup.md`

### 1.3 Čo bolo dokončené v predchádzajúcich fázach
- **Databáza (`dog.migrated.json`):**
  - Importovaných 38 záznamov pre psa z `Mikrometria_doplnená__opravená.xlsx`.
  - Ošetrené duplicity (zlúčenie `diphyllobothrium_latum` → `dibothriocephalus_latus_egg`), opravené `kingdom`/`phylum`.
  - 37 záznamov upravených (micrometry, taxonomy, notes).
  - Zvalidované 2026-08-17 voči schéme z `02_DATABASE_SPECIFICATION.md`: 0 chýb (povinné polia, duplicitné ID, jednotky, zakázané placeholder hodnoty).
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

### 2.2 Priorita č. 2: Etapa 2 – Import ďalších hostiteľov (DÁTA)
- V zdrojovej tabuľke `Mikrometria_doplnená__opravená.xlsx` sa nachádza **530 riadkov pre ďalších 14 hostiteľov** (mimo psa).
  - *Akcia:* Spracovať tieto dáta, validovať ich proti schéme (`02_DATABASE_SPECIFICATION.md`) a vytvoriť nové JSON súbory pre jednotlivých hostiteľov (napr. `cat.migrated.json`, atď.).
  - *Poznámka:* Pri importe treba dávať pozor na prípadné chybné údaje (ako pri `Dibothriocephalus_latus_egg`).

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
- **`src/app/App.js`** – Hlavná logika aplikácie (routing, bindovanie theme toggle a nav toggle).
- **`src/app/Router.js`** – Jednoduchý hash router (bez zmien).
- **`src/pages/AtlasPage.js`** – Logika pre filtre, vykreslenie zoznamu a detailov.
- **`src/js/main.js`** – Entry point aplikácie.
- **`database/dog.migrated.json`** – Finálna databáza pre psa (38 záznamov, zvalidovaná).
- **`_archive/Navbar.js`** – Archivovaný mŕtvy kód (nepoužívať, len referencia).
- **`docs/2026-08-17_priorita1-cleanup.md`** – Log dnešnej zmeny (Priorita 1).
- **`docs/2026-08-15_micrometry-taxonomy-import.md`** – Detailný záznam o importe a opravách dát.

---

## 4. DÔLEŽITÉ PRAVIDLÁ PRE ĎALŠIEHO AI (Aby nerozbil projekt)

1. **Databáza:** Nikdy neprepisovať `dog.json` (len `dog.migrated.json`). Pri importe nových hostiteľov vždy vytvárať nové JSON súbory.
2. **Dáta:** Nikdy nedopĺňať odborné údaje (taxonómia, mikrometria) odhadom. Výnimkou sú len explicitné inštrukcie autorky priamo v chate (napr. normalizácia `Animalia/Protozoa/Chromista`).
3. **Architektúra:** `App.js` a `Router.js` sú stabilné. Nemeniť ich bez explicitného súhlasu autorky.
4. **Zdroj pravdy:** Projektový repozitár (súbory na disku) je vždy hlavným zdrojom pravdy, nie text tejto konverzácie. Vždy si pred zmenou načítať aktuálne súbory.
5. **Logovanie:** Každú významnú zmenu (najmä pri importe dát) treba zdokumentovať do samostatného `.md` súboru v priečinku `docs/`.

---
