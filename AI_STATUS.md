# VetPara Atlas – AI STATUS
Aktualizované: 2026-08-14 (v2)
Branch: develop
Git: working tree clean (pred touto zmenou — nezabudni commitnúť opravený
atlas.css)

## 1. Milestone
Milestone 1 – Core Foundation (Atlas + databáza + migrácia) → **UI dobieha dáta
(diagnosticSigns, taxonomy) + rozšírené filtre (Úlohy.txt) + CSS pre v2 triedy
(OVERENÉ proti skutočnému AtlasPage.js)**

## 2. Posledná vykonaná zmena

**`src/styles/atlas.css` — CSS pre v2 triedy, OPRAVENÉ po nahratí skutočného
`AtlasPage.js`.**

V predchádzajúcom kroku (2026-08-14, prvá verzia) bol CSS napísaný len z opisu
štruktúry v dokumentácii, bez zdrojového kódu. Po nahratí skutočného
`AtlasPage.js` sa porovnaním markupu s CSS našli **4 nezrovnalosti**, teraz
opravené:

1. **Duplicitná ikona ⚡** — markup už obsahuje `<span aria-hidden="true">⚡</span>`
   priamo v `<li>`; pôvodný CSS pridával rovnakú ikonu ešte raz cez
   `li::before { content: "⚡" }`, čo by v UI zobrazilo ⚡⚡. Opravené —
   `::before` odstránené, štýluje sa priamo existujúci `<span>`.
2. **Chýbajúca trieda `.atlas-filter-hint`** — label multi-selectu obsahuje
   `<span class="atlas-filter-hint">(viac možností naraz)</span>`, ktorá
   nemala žiadny štýl. Doplnené (malý, tlmený text).
3. **Zle cielený selektor pre veľkostný filter** — skutočný markup je
   `.atlas-size-filter > fieldset > legend`, nie `.atlas-size-filter > legend`
   priamo. Pôvodný selektor by nič netrafil a natívny browser štýl
   `<fieldset>` (default border/padding) by zostal nepotlačený. Opravené —
   `fieldset` je teraz resetovaný (`border:0; padding:0; margin:0`), `legend`
   cielená cez `.atlas-size-filter legend`.
4. **Dvojitý box okolo taxonómie** — `.parasite-taxonomy` je v skutočnosti
   VŽDY vnorená v `.parasite-detail-field` (tá už má vlastný
   border+padding+border-radius z pôvodného CSS). Pôvodná verzia pridávala
   `.parasite-taxonomy` ešte vlastný border/padding → box v boxe. Opravené —
   `.parasite-taxonomy` má teraz iba `margin-top`, žiadny vlastný rámik.

Menšie doladenie: `.atlas-size-row` prestavaná z predpokladaného 1 label + 1
input + separator na skutočný markup 2× (label + input) v jednom riadku —
`white-space: nowrap` na labeloch namiesto pevnej `min-width`, keďže texty
("Dĺžka od" vs "do") majú rôznu dĺžku.

Overené:
- diff proti pôvodnému `atlas.css`: časť pred v2 sekciou je bit-identická
  (líšia sa len konce riadkov, obsah 1:1)
- zátvorky v CSS vyvážené (84 `{` / 84 `}`)
- CSS teraz zodpovedá reálnemu markupu z nahratého `AtlasPage.js`, nie len
  opisu

**Stále NEOVERENÉ:** skutočné vykreslenie v prehliadači (vizuálny vzhľad,
mobile touch, multi-select UX) — v tomto prostredí nie je možné spustiť DOM.

Súbor na stiahnutie z tejto session: `atlas.css` (finálna, opravená verzia).

## 2b. Predchádzajúca zmena (2026-08-13, nezmenené touto úpravou)

**AtlasPage.js — "Filter & Detail engine v2"** (kombinovaný krok podľa `Úlohy.txt`
body 1, 3, 4, 5 a predchádzajúceho TODO zo zobrazenia `diagnosticSigns`).

Zmeny:
- Karta aj detail teraz zobrazujú `diagnosticSigns` (so symbolom ⚡).
- Detail teraz zobrazuje `taxonomy` (Ríša–Kmeň–Trieda–Rad–Čeľaď–Rod–Druh) +
  externé odkazy na Catalogue of Life a WoRMS (iba zostavenie vyhľadávacieho
  URL z `latinName`, žiadne API volanie ani automatické priradenie výsledku).
- Nový filter podľa veľkosti — dĺžka od/do, šírka od/do, prekryvová zhoda
  s nameraným rozsahom (nie presná zhoda). Objekty bez nameranej hodnoty sa
  pri aktívnom filtri daného rozmeru nezobrazia.
- Nový filter podľa `sample` ("materiál") — pole už v databáze existovalo,
  teraz je aj vo filtroch.
- Filtre `host`/`sample`/`shape`/`colour` prerobené na multi-select (OR logika
  v rámci poľa, napr. farba: hnedá alebo žltá alebo žltohnedá naraz).
- Fulltext rozšírený z `latinName`/`slovakName` aj na `notes`,
  `diagnosticSigns[]`, `morphology.shape/colour/shell`.

Detaily a zoznam otvorených TODO (CSS, mobile UX, validácia vstupov):
`docs/2026-08-13_atlaspage-v2-filters-and-detail.md`.

Vykonané v Claude chate, výstup treba stiahnuť a nahradiť
`src/pages/AtlasPage.js` v repozitári + commitnúť.

Súbory na stiahnutie z tejto session:
- `AtlasPage.js` (nová verzia)
- `2026-08-13_atlaspage-v2-filters-and-detail.md` (kompletný popis zmeny)

**`dog.migrated.json`, `Repository.js`, `dog.json` NEBOLI touto zmenou menené.**

## 3. Aktuálny stav projektu

Aplikácia je funkčná, databáza sa načítava, `AtlasPage.js` teraz zobrazuje
kompletný súbor polí zavedených v predchádzajúcich session (`diagnosticSigns`,
`taxonomy`, `sample`) a podporuje rozšírené filtrovanie podľa `Úlohy.txt`.

### 3.1 Funkčné časti
- **App.js** – bootstrap, načítanie databázy, routing
- **Router.js** – hash-based router, stabilný
- **ApplicationState.js** – globálny stav, filtre, ready flag (zatiaľ
  nepoužívaný Repository/AtlasPage filtrami — pozri bod 3.4)
- **DatabaseService.js** – načítanie databázy, cache, getRecordById
- **Repository.js** – vyhľadávanie, filtrovanie, triedenie (bez zmeny)
- **AtlasPage.js** – **NOVÁ VERZIA** — zobrazuje `diagnosticSigns` + `taxonomy`,
  multi-select filtre, filter veľkosti a materiálu, rozšírený fulltext
- **dog.migrated.json** – 38 záznamov, bez zmeny v tomto kroku
- **migrate-dog-json.js** – pôvodná migrácia z dog.json, stále platná
- **index.html** – základná štruktúra aplikácie
- **main.js** – inicializácia App.start()

### 3.2 Čo funguje technicky
- `node --check` na `AtlasPage.js` prešiel bez chyby, zátvorky vyvážené.
- Logika filtrovania overená manuálne proti aktuálnej štruktúre
  `dog.migrated.json` (38 záznamov).
- **Reálny beh v prehliadači nebol v tomto prostredí overený** — odporúča sa
  funkčný test po nasadení, najmä `<select multiple>` binding.

### 3.3 Zmena schémy ID / počtu záznamov
(bez zmeny — 38 záznamov, sémantické ID + `legacyId`, pozri predchádzajúci
záznam v `10_CHANGELOG.md` [0.3.0])

### 3.4 Čo nefunguje / je prázdne
- Gallery page – placeholder
- Expert page – placeholder
- Settings page – placeholder
- **CSS pre nové triedy je teraz overený proti skutočnému `AtlasPage.js`**
  (2026-08-14, druhá iterácia) — `atlas-filter-multi`, `atlas-filter-hint`,
  `atlas-size-filter`, `atlas-size-row`, `atlas-size-hint`,
  `parasite-diagnostic-signs`, `parasite-taxonomy`, `taxonomy-row`,
  `taxonomy-rank`, `taxonomy-value`, `parasite-taxonomy-links` majú štýly
  zodpovedajúce reálnemu markupu. Stále chýba: skutočné vykreslenie
  v prehliadači (vizuálna kontrola, mobile touch)
- Multi-select (`<select multiple>`) na mobile nebol UX-testovaný —
  `04_UI_UX_SPECIFICATION.md` vyžaduje mobile-first, treba reálne overiť
- Validácia vstupov filtra veľkosti (napr. min > max) nie je ošetrená
- `differentialDiagnosis`, `images`, `references`, `zoonosis`, `methods` —
  stále prázdne pri všetkých záznamoch (nerieši sa touto úpravou)
- `group` pri Acari/Pentastomida stále mimo kontrolovaného zoznamu
- Repository zatiaľ neaplikuje `ApplicationState.filters` (filtre zostávajú
  lokálne v `AtlasPage.js` — architektonické rozhodnutie zachované z
  predchádzajúcej verzie, zmena je samostatná plánovaná úloha)
- Šírka mikrofilárií (`dirofilaria_repens`, `dirofilaria_immitis`,
  `oslerus_filaroides_osleri`) stále chýba — **dôsledok:** tieto 3 záznamy sa
  nezobrazia pri aktívnom filtri šírky, aj keby inak vyhovovali

### 3.5 Databáza – stav
(bez zmeny oproti predchádzajúcej verzii — 38 záznamov, `dog.json` nemenené)
- **Taxonomia_na_doplnenie.xlsx** – autorka projektu pripravuje opravy
  (spracuje sa v samostatnom nasledujúcom kroku po dodaní)
- Súbežne beží spracovanie zvyšných 15 hárkov z `Mikrometria__parazity.xls`
  (Etapa 2, ďalší hostitelia) — **v inom AI nástroji (DeepSeek), mimo tejto
  session**, nezasahuje do súborov upravovaných tu

### 3.6 Architektúra
(bez zmeny)

---

## 4. Posledné zmeny v súboroch
- src/styles/atlas.css – **nahradiť opravenou verziou z tejto session**
  (pridaná + opravená v2 sekcia na konci, pôvodný obsah nezmenený)
- src/pages/AtlasPage.js – bez zmeny (iba prečítaný na overenie CSS)
- (nový, z predchádzajúcej session) docs/2026-08-13_atlaspage-v2-filters-and-detail.md

---

## 5. Posledný problém
Žiadny aktívny dátový problém. Treba:
1. stiahnuť nový `atlas.css` a nahradiť ním súbor v `src/styles/`,
2. **reálne otestovať v prehliadači** (vizuálny vzhľad, multi-select binding,
   filter veľkosti, zobrazenie taxonómie/diagnosticSigns) — v tomto prostredí
   nebolo možné spustiť DOM, iba statická kontrola markup↔CSS,
3. po dodaní opravenej `Taxonomia_na_doplnenie.xlsx` od autorky projektu
   spracovať druhé kolo importu taxonómie (**prebieha mimo tohto chatu**),
4. po dokončení spracovania zvyšných 15 hárkov (DeepSeek, mimo tejto session)
   zosúladiť výstup so schémou pred zaradením do `database/`.

---

## 6. Ďalší krok (pre Claude / Gemini / DeepSeek)

1. ✅ CSS pre nové triedy z `AtlasPage.js` v2 pripravené a **overené proti
   skutočnému zdrojovému kódu** (2026-08-14)
2. Funkčný test v prehliadači po nasadení (vizuálny, nie len statický)
3. Vyriešiť `group` pre Acari/Pentastomida (mimo kontrolovaného zoznamu)
4. Implementovať Gallery page (zatiaľ placeholder)
5. Implementovať Expert page (diagnostický systém)
6. Rozšíriť Repository o podporu ApplicationState.filters (samostatná úloha,
   architektonicky oddelená od tejto zmeny)
7. Pridať error page pre neexistujúce ID, preloader pri načítaní databázy
8. Zapracovať výstup DeepSeek session (15 hárkov ďalších hostiteľov) po jeho
   dodaní — validovať proti schéme pred zaradením do `database/`
9. Taxonómia (`Taxonomia_na_doplnenie.xlsx`) — **rieši sa v inej session/inom
   nástroji podľa pokynu autorky, mimo rozsahu tohto chatu**
10. Doplniť šírku pre `dirofilaria_repens`, `dirofilaria_immitis`,
    `oslerus_filaroides_osleri` z odbornej literatúry

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
- Pri súbežnej práci viacerých AI nástrojov na projekte: každý pracuje na
  vopred vymedzenej, nezávislej sade súborov, aby nedochádzalo ku konfliktom
  (pozri `11_SESSION_LOG.md` bod 4 a rozdelenie práce z 2026-08-13)

---
