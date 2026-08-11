# VetPara Atlas – AI STATUS
Aktualizované: 2026-08-11  
Branch: develop  
Git: working tree clean

## 1. Milestone
Milestone 1 – Core Foundation (Atlas + databáza + migrácia)

## 2. Posledná vykonaná zmena
Commit: 945d92a – atlaspage oprava  
Dátum: 2026-08-11

## 3. Aktuálny stav projektu
Aplikácia je funkčná, databáza sa načítava, AtlasPage renderuje záznamy podľa novej schémy.  
Migrácia dog.json → dog.migrated.json je dokončená a stabilná.

### 3.1 Funkčné časti
- **App.js** – bootstrap, načítanie databázy, routing  
- **Router.js** – hash-based router, stabilný  
- **ApplicationState.js** – globálny stav, filtre, ready flag  
- **DatabaseService.js** – načítanie databázy, cache, getRecordById  
- **Repository.js** – vyhľadávanie, filtrovanie, triedenie  
- **AtlasPage.js** – kompletné UI, filtre, detail záznamu  
- **dog.migrated.json** – nová databázová schéma  
- **migrate-dog-json.js** – migrácia je úspešná, report existuje  
- **index.html** – základná štruktúra aplikácie  
- **main.js** – inicializácia App.start()

### 3.2 Čo funguje technicky
- Načítanie databázy (fetch → database/dog.json)  
- Cache databázy  
- Renderovanie atlasu  
- Vyhľadávanie podľa latinName/slovakName  
- Filtre: host, shape, colour  
- Detail záznamu (showDetail)  
- Mikrometria (formatSize)  
- Hostiteľ (formatHosts)  
- Escape HTML (bezpečné renderovanie)  
- Routing: home, atlas, gallery, expert, settings  
- Prístupnosť (Enter/Space na kartách)

### 3.3 Čo nefunguje / je prázdne
- Gallery page – placeholder  
- Expert page – placeholder  
- Settings page – placeholder  
- taxonomy je prázdne vo všetkých záznamoch  
- sample/stage/group sú prázdne vo väčšine záznamov  
- micrometry je null pri niektorých záznamoch (správne označené ako manual review)  
- differentialDiagnosis je prázdne  
- diagnosticSigns je prázdne  
- images/references sú prázdne  
- Repository zatiaľ neaplikuje ApplicationState.filters (iba lokálne filtre v AtlasPage)

### 3.4 Databáza – stav
- **dog.json** – pôvodná schéma, ploché polia  
- **dog.migrated.json** – nová schéma podľa 02_DATABASE_SPECIFICATION.md  
- Migrácia prebehla úspešne  
- Všetky ID sú normalizované (DOG-0001 → dog_0001)  
- Mikrometria je konvertovaná tam, kde je jednoznačná  
- Nejednoznačné záznamy sú označené v migration-report.json  
- Hostiteľ je normalizovaný (pes → Pes)

### 3.5 Architektúra
- src/app – jadro aplikácie  
- src/services – logika a databáza  
- src/pages – UI stránky  
- database – zdroj dát  
- tools – migrácie  
- docs – kompletná dokumentácia projektu  
- public – statické súbory  
- _archive – staré verzie

---

## 4. Posledné zmeny v súboroch
- src/pages/AtlasPage.js – prepracované na novú schému  
- database/dog.migrated.json – aktualizované migráciou  
- tools/migrate-dog-json.js – stabilná verzia  
- src/app/App.js – routing + načítanie databázy

---

## 5. Posledný problém
Žiadny aktívny problém.  
Migrácia je dokončená, aplikácia je funkčná, working tree clean.

---

## 6. Ďalší krok (pre Claude / Gemini / DeepSeek)
1. **Implementovať Gallery page** (zatiaľ placeholder)  
2. **Implementovať Expert page** (diagnostický systém)  
3. **Doplniť taxonomy, sample, stage, group** do databázy (odborné dáta)  
4. **Rozšíriť Repository o podporu ApplicationState.filters**  
5. **Pridať error page pre neexistujúce ID**  
6. **Pridať preloader pri načítaní databázy**  
7. **Pridať lazy loading obrázkov (keď pribudnú)**

---

## 7. Dôležité pravidlá pre AI
- AI musí vždy načítať aktuálne súbory pred zmenou  
- AI musí aktualizovať AI_STATUS.md po každej zmene  
- AI nesmie meniť architektúru bez súhlasu  
- AI nesmie prepisovať dog.json (iba dog.migrated.json)  
- AI nesmie dopĺňať odborné údaje odhadom  
- AI musí rešpektovať databázovú štruktúru podľa 02_DATABASE_SPECIFICATION.md  
- Projekt je hlavný zdroj pravdy (nie konverzácia)  
- Git commit po každej zmene

---