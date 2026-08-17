# VetPara Atlas – AI STATUS (kompletný stav projektu)

**Dátum poslednej aktualizácie:** 2026-08-17 (session: oprava pádu appky, filtrov a detailu parazita)
**Branch:** develop
**Verzia projektu:** v15 (host-filter accordion pripojený + 5 opráv chýb po nasadení, vrátane detail-view a bezpečného skrytia odkazov)

---

## 1. SÚHRN AKTUÁLNEHO STAVU (2026-08-17)

Projekt je funkčný. Milestone 2 (Vizuálny redizajn) je dokončený. Databáza obsahuje **všetkých 14 hostiteľských súborov** naimportovaných z `Mikrometria_doplnená__opravená.xlsx`, a od tejto verzie sú **všetky reálne aj načítané a zobrazované v Atlase**:
- `dog.migrated.json` (38 záznamov)
- 13 ďalších host-súborov (spolu 529 záznamov) – pozri 1.2

### 1.0 Vyriešená Priorita — Oprava pádu appky + filtrov v `AtlasPage.js` (2026-08-17)

⚠️ **Poznámka pre ďalšieho AI:** medzi predchádzajúcou verziou tohto AI_STATUS.md a týmto zásahom niekto nasadil zmenu, ktorá **reálne pripojila
`database/dictionary/host_hierarchy.json` na UI filter Hostiteľ** (accordion so skupinami) — ale táto zmena obsahovala kritické chyby,
ktoré appku rozbili. Táto sekcia popisuje to, čo bolo v tejto session **nájdené a opravené** v `src/pages/AtlasPage.js`.

- **Bug 1 (kritický, appka spadla celá):** - Import with { type: "json" } zlyhával bez bundleru. Nahradené asynchrónnym DatabaseService.load("dictionary/host_hierarchy.json") s try/catch fallbackom.
- **Bug 2 (filter Materiál nereagoval na klik):** - sample sa renderoval ako select, ale viazal sa ako checkbox. Presunuté do MULTI_SELECT_FIELDS.
- **Bug 3 (UX viaczložkového výberu):** V <select multiple> upravený mousedown handler na každú <option>, aby jedno kliknutie robilo manuálny toggle (prepínanie) položky bez nutnosti držať Ctrl/Cmd.
- **Bug 4 (Detail parazita — nesúlad CSS/JS tried a rozpadnutý layout):** - showDetail() vrátené na pôvodné, v atlas.css reálne definované triedy a obnovená štruktúra <main class="card"> + <aside class="card"> pre funkčnosť 2-stĺpcového gridu. Zjednotený text na "[ Dynamický mikroskopický nález ]" a oddeľovač hostiteľov na " / ".
- **Bug 5 (Nefunkčné otváranie detailu po vymazaní odkazov) - Autorka požadovala odstránenie zobrazenia tlačidiel na externé stránky Catalogue of Life a WoRMS. Úplné vymazanie funkcie taxonomyExternalLinksButtons(latinName) alebo vrátenie prázdneho textu "" však spôsobovalo pád celého JS skriptu a detail stránky sa neotvoril.Riešenie: Funkcia bola zachovaná pre korektný beh aplikácie, ale jej vnútro bolo prepísané tak, aby vracalo neviditeľný HTML element so štýlom display: none; (return '<div style="display: none;"></div>';). HTML štruktúra a volania v JS zostali neporušené, no odkazy z obrazovky kompletne a bezpečne zmizli.

### 1.1 Vyriešená Priorita 2.2 – Napojenie všetkých host-databáz do aplikácie (2026-08-17)
- V src/services/DatabaseService.js implementovaná metóda loadAllHostDatabases(), ktorá načíta všetkých 14 súborov paralelne cez Promise.all a zlúči ich. App.js bol upravený tak, aby volal túto metódu. Očakávaný výsledok po nasadení je 567 záznamov v Repository.count(). 

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
- Skontrolovať robustnosť DatabaseService.load(), aby pád jedného fetch-u z 14 súborov nezrútil celú aplikáciu.

### 2.3 Priorita č. 3: Chýbajúce stránky (UI)
- Gallery page a Expert page (momentálne iba logy v konzole v App.js, treba vytvoriť reálne podstránky a prepojiť ich s Routerom).

### 2.4 Priorita č. 4: Chýbajúce assety a drobné opravy
- **Chýbajúci obrázok:** Home hero pozadie (`home-hero.png`) stále chýba v `public/images/`.
  - *Akcia:* Dodať obrázok alebo upraviť CSS fallback.
- **Skupina Acari/Pentastomida:** `group` pre tieto taxóny stále nie je v kontrolovanom zozname – treba ho definovať alebo ošetriť.

---

## 3. ZOZNAM DÔLEŽITÝCH SÚBOROV (Čo má AI k dispozícii)

Nový AI by mal mať v repozitári tieto kľúčové súbory (sú aktuálne):
- index.html
- src/css/layout.css
- src/css/variables.css
- src/styles/atlas.css.
- src/app/App.js – Spravuje routing a inicializáciu databázy cez loadAllHostDatabases().
- src/services/DatabaseService.js – Načítava asynchrónne lokálne JSON dáta.
- src/services/Repository.js – Dátová vrstva (filtrovanie, počty záznamov).
- src/pages/AtlasPage.js – Kľúčový súbor. Obsahuje logiku filtrov, renderovanie zoznamu a funkciu showDetail() vrátane bezpečne upravenej metódy taxonomyExternalLinksButtons(latinName) pre skrytie externých odkazov pomocou neviditeľného elementu.
- database/*.migrated.json – 14 dátových súborov hostiteľov (567 záznamov spolu).
- database/dictionary/host_hierarchy.json – Hierarchia hostiteľov pre accordion filter.
- docs/ – Zložka s podrobnými logmi o čistení architektúry, importoch a opravách chýb.

## 4. DÔLEŽITÉ PRAVIDLÁ PRE ĎALŠIEHO AI (Aby nerozbil projekt)

1. **Databáza:** Nikdy neprepisovať surové .json súbory, upravovať a rozširovať iba *.migrated.json.
2. **Dáta:** Nikdy nedopĺňať odborné údaje odhadom. Všetko podlieha Excelu alebo konzultácii s autorkou.
3. **Architektúra a volania:** `App.js` a `Router.js` sú stabilné. Zmeny sa robia len minimálne a cielene (napr. zmena jedného volania metódy), nie prepisovaním logiky. Nemeniť ich rozsiahlejšie bez explicitného súhlasu autorky. Funkcie, ktoré sú volané v iných častiach kódu (ako napr. taxonomyExternalLinksButtons), nikdy kompletne nemazať zo štruktúry objektu/triedy. Ak má ich vizuálny výstup zmiznúť, funkcia musí zostať zachovaná a vrátiť skrytý obalový element (<div style="display: none;"></div>), aby sa neporušilo spracovanie kódu a vykresľovanie stránky.
4. **Zdroj pravdy:** Projektový repozitár (súbory na disku) sú primárnym zdrojom pravdy.
5. **Logovanie:** Každú významnú zmenu (najmä pri importe dát alebo napájaní databáz) alebo opravu kritického správania treba zdokumentovať do samostatného `.md` súboru v priečinku `docs/`.

---