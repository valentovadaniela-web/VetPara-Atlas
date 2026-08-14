# Zmena: AtlasPage.js — zobrazenie diagnosticSigns/taxonomy + rozšírené filtre

**Dátum:** 2026-08-13
**Súbor:** `src/pages/AtlasPage.js`
**Zdroj úlohy:** `Úlohy.txt` body 1, 3, 4, 5 + `AI_STATUS.md` bod 6.1

`dog.migrated.json` a `Repository.js` **neboli touto zmenou menené** — ide výlučne
o úpravu UI vrstvy, ktorá číta už existujúce dáta (`diagnosticSigns`, `taxonomy`,
`sample`, `micrometry.widthMin/widthMax`), zavedené v predchádzajúcich krokoch
(2026-08-12, 2026-08-13 A/B).

---

## 1. Prečo kombinovaný krok

Namiesto postupných čiastkových úprav (najprv len zobrazenie `diagnosticSigns`,
potom osobitne filtre, potom osobitne `taxonomy`) bola zmena spracovaná naraz,
pretože všetky body zasahujú do rovnakých metód (`render()`, `renderRecords()`,
`showDetail()`) — opakované prepisovanie tých istých blokov by zvyšovalo riziko
regresie. Toto zodpovedá odporúčaniu z `AI_STATUS.md` bod 6 ("Filter & Detail
engine v2").

---

## 2. Zoznam zmien podľa `Úlohy.txt`

### Bod 5 — Taxonomické zaradenie v karte parazita

- Nová metóda `taxonomyBlock()` — zobrazuje Ríša–Kmeň–Trieda–Rad–Čeľaď–Rod–Druh
  (iba vyplnené úrovne, prázdne/`null` sa vynechajú).
- Nová metóda `taxonomyExternalLinks()` — zostaví vyhľadávací odkaz na
  **Catalogue of Life** (`catalogueoflife.org/data/search?q=...`) a **WoRMS**
  (`marinespecies.org/aphia.php?p=search&tName=...`) z `latinName`.
  ⚠️ **Ide výlučne o zostavenie URL, nie o API volanie** — žiadne priradenie
  výsledku sa nedeje automaticky, používateľ si zhodu overí sám kliknutím.
- **Rozhodnutie k umiestneniu:** taxonómia (7 riadkov + 2 odkazy) sa zobrazuje
  iba v **detaile** záznamu (`showDetail()`), nie v karte v mriežke — v karte by
  pri toľkých poliach preplnila dostupný priestor. Ak si "kartou parazita"
  z `Úlohy.txt` predstavovala inak (napr. aj skrátený náhľad v mriežke), daj
  vedieť, doplním.

### Body 1, 3 — Filter podľa veľkosti a materiálu

- Nový blok `atlas-size-filter` so 4 číselnými vstupmi: dĺžka od/do, šírka od/do.
- Logika `matchesSizeRange()`: **prekryvová zhoda** — zobrazí objekt, ak sa jeho
  nameraný rozsah prekrýva so zadaným hľadaným rozsahom (nie presná zhoda).
  Príklad: hľadáš 70–100 µm, objekt s rozsahom 75–90 µm sa zobrazí.
  Ak objekt nemá pre daný rozmer namerané hodnoty (`null`), pri aktívnom filtri
  **sa nezobrazí** (nedá sa potvrdiť zhoda) — týka sa to najmä šírky, ktorá
  chýba pri 3 záznamoch (mikrofilárie, pozri známe obmedzenie v changelogu).
- `sample` ("materiál") pridaný ako plnohodnotný filter — pole `sample` v
  databáze už existovalo (`03_DATA_ENTRY_STANDARD.md` § 8), teraz je aj vo
  filtroch.

### Bod 4 — Multi-select a fulltext

- Filtre `host`, `sample`, `shape`, `colour` prerobené z jednoduchého `<select>`
  (1 hodnota) na `<select multiple>` — možnosť vybrať viac hodnôt naraz s OR
  logikou v rámci poľa (napr. farba: hnedá **alebo** žltá **alebo** žltohnedá).
- Fulltext (`matchesFulltext()`) rozšírený z pôvodného `latinName`/`slovakName`
  na aj: `notes`, `diagnosticSigns[]`, `morphology.shape/colour/shell`.

### Bod (predchádzajúca úloha) — zobrazenie `diagnosticSigns`

- `diagnosticSignsList()` — zoznam znakov so symbolom ⚡ (podľa
  `04_UI_UX_SPECIFICATION.md`/docx príručky), zobrazený v karte aj v detaile.

---

## 3. Ostatné drobné zmeny

- Pole `notes` v karte je teraz popísané ako "Poznámka" namiesto pôvodného
  "Ďalšie znaky" — presnejšie zodpovedá skutočnému obsahu poľa (interná
  poznámka, nie diagnostický znak — ten je teraz oddelene v `diagnosticSigns`).
- Karta v mriežke teraz navyše zobrazuje `sample` ("Materiál").
- Aktívne filtre (`renderActiveFilters()`) podporujú odstránenie jednotlivej
  hodnoty z multi-select filtra (tag s konkrétnou hodnotou), nie len celého poľa.

---

## 4. Čo NEBOLO menené

- `Repository.js` — filtrovacia logika zostáva lokálne v `AtlasPage.js`,
  rovnako ako doteraz. Prepojenie na `ApplicationState.filters` je samostatná
  plánovaná úloha (`AI_STATUS.md` bod 6.7 pôvodného zoznamu), touto zmenou sa
  nerieši.
- `dog.migrated.json` — žiadne dáta neboli menené.
- Databázová schéma — žiadne nové polia, iba čítanie existujúcich.

---

## 5. Otvorené TODO súvisiace s touto zmenou

- ⚠️ **CSS pravidlá pre nové triedy nie sú súčasťou tejto zmeny** — nemám
  k dispozícii obsah `src/styles/atlas.css` ani ostatných CSS súborov, takže
  nové triedy (`atlas-filter-multi`, `atlas-size-filter`, `atlas-size-row`,
  `atlas-size-hint`, `parasite-diagnostic-signs`, `parasite-taxonomy`,
  `taxonomy-row`, `taxonomy-rank`, `taxonomy-value`, `parasite-taxonomy-links`)
  budú vykreslené bez štýlovania, kým nedoplníš/nedoplním zodpovedajúce CSS.
  Ak mi nahráš aktuálny `atlas.css`, pripravím aj štýly v samostatnom kroku.
- Overiť UX multi-selectu na mobile (`<select multiple>` sa na dotykových
  zariadeniach ovláda odlišne než na desktope) — `04_UI_UX_SPECIFICATION.md`
  vyžaduje mobile-first, toto by chcelo reálne otestovať.
- Validácia vstupov veľkosti (napr. záporné čísla, min > max) nie je ošetrená —
  vstup `type="number" min="0"` obmedzuje len čiastočne.

---

## 6. Validácia

- `node --check` na výsledný súbor prešiel bez chyby (validný ES modul).
- Kontrola vyváženosti zátvoriek: OK.
- Manuálne prejdenie logiky filtrovania a väzby na existujúce dáta (`sample`,
  `micrometry.widthMin/widthMax`, `diagnosticSigns`, `taxonomy`) — zodpovedá
  aktuálnej štruktúre `dog.migrated.json` (38 záznamov).
- Reálne spustenie v prehliadači/DOM nebolo možné overiť v tomto prostredí —
  odporúčam funkčný test po nasadení (najmä `<select multiple>` binding a
  `renderActiveFilters` pri kombinácii viacerých typov filtrov naraz).
