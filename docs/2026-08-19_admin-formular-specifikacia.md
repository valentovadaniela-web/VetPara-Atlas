# VetPara Atlas — Špecifikácia: Admin formulár na správu databázy

**Dátum:** 2026-08-19
**Stav:** 🔵 NÁVRH — čaká na schválenie autorky a doplnenie chýbajúcich súborov (pozri sekciu 6)
**Súvisiace:** `AI_STATUS.md` §"NOVÁ ÚLOHA — Admin formulár na správu databázy"

---

## 1. Architektonické rozhodnutia (potvrdené autorkou 2026-08-19)

| Otázka | Rozhodnutie |
| --- | --- |
| Kde nástroj beží | **Samostatný lokálny nástroj**, mimo hlavnej appky (odporúčanie nižšie, čaká na finálne potvrdenie) |
| Ako odovzdáva výstup | **Sťahovanie súborov (.zip)** — žiadny priamy zápis na disk |
| Formát tabuľky pre bulk zmeny | **Excel (.xlsx)** cez knižnicu SheetJS (`xlsx`), ktorá je už v `node_modules` |

### 1.1 Odôvodnenie: samostatný nástroj, nie súčasť appky

Odporúčam `tools/admin/index.html` (+ pomocné JS súbory v `tools/admin/`) ako **úplne samostatnú HTML stránku**, nezávislú od `src/app/Router.js` a zvyšku appky. Dôvody:

- Appka beží naživo na GitHub Pages — akákoľvek "skrytá" admin stránka v rámci nej (`#admin`) by bola technicky verejne dostupná (hocikto pozná URL môže tam prísť). Pri statickom hostingu neexistuje spôsob, ako to obmedziť len na teba.
- Projekt už má zavedenú konvenciu `tools/` pre lokálne pomocné skripty (`excel-to-json.js`, `migrate.py`, `migrate-dog-json.js`) — nový admin nástroj do nej zapadá prirodzene.
- Samostatný nástroj sa nemusí riadiť routovaním, štýlmi ani stavom hlavnej appky — jednoduchšie sa bude vyvíjať a nehrozí, že pokazí produkčný web.
- Bude sa spúšťať rovnako ako appka — cez Live Server, len z iného súboru (`tools/admin/index.html` namiesto `index.html`).

➡️ Ak s týmto odôvodnením súhlasíš, potvrď a beriem to ako finálne rozhodnutie. Ak chceš radšej `#admin` v rámci appky (napr. kvôli zdieľanému vzhľadu/štýlom), daj vedieť — dá sa to prerobiť, len s vyššie uvedeným rizikom verejnej dostupnosti.

---

## 2. Prehľad funkcií

### A) Jednotlivé formuláre (pre bežné priebežné dopĺňanie)

1. **Nový parazit** (diagnostický objekt) — vytvorenie záznamu do `parasites.json`.
2. **Nový hostiteľ** — pridanie do `dictionary/host_hierarchy.json`.
3. **Nová sada obrázkov** pre existujúci alebo práve vytváraný objekt — generuje záznamy do `images.json` + premenované súbory obrázkov podľa konvencie.
4. **Doplnenie obrázkov k už existujúcemu objektu** — rovnaký formulár ako 3), len s predvyplneným/vybraným `objectId` z existujúcich záznamov.
5. **Úprava existujúceho záznamu** (parazit alebo obrázok) — všetky polia editovateľné okrem ID.

### B) Hromadný (bulk) workflow cez tabuľku

6. **Export do Excelu** — vyexportuje aktuálny stav `parasites.json` a/alebo `images.json` do `.xlsx`, autorka si prehliadne/upraví v Exceli.
7. **Import Excelu späť** — nástroj načíta upravený `.xlsx`, porovná so stavom v appke (diff), zobrazí prehľad zmien na potvrdenie, vygeneruje aktualizované JSON súbory na stiahnutie.

---

## 3. Spoločná logika (naprieč všetkými formulármi)

### 3.1 Overovanie duplicity

- **Parazit:** kontrola `id` (a pravdepodobne aj kombinácie `latinName` + `stage`, keďže rovnaké ID naprieč hostiteľmi s iným `stage`/`sample`/`micrometry` = iný objekt — pozri pravidlo č. 2 v `AI_STATUS.md`). Presné pravidlo overím podľa `02_DATABASE_SPECIFICATION.md`, ktorý ešte nemám (pozri sekciu 6).
- **Hostiteľ:** kontrola názvu proti existujúcim kľúčom v `host_hierarchy.json` (case-insensitive, aby sa predišlo duplicitám typu "Pes" vs "pes").
- **Obrázok:** kontrola `id` fotky (`<objectId>_<poradie>`) proti existujúcim záznamom v `images.json` pre daný `objectId`, aby sa neprepísalo poradové číslo, ktoré už existuje. Pri "doplnení ďalších obrázkov" nástroj automaticky navrhne ďalšie voľné poradové číslo.

### 3.2 Automatické vyplnenie hostiteľa pri fotkách

Pri nahrávaní obrázkov k existujúcemu `objectId` nástroj načíta príslušný záznam z `parasites.json` a ponúkne **automatické predvyplnenie** poľa hostiteľ (cez `resolveHosts()` logiku zhodnú s `Repository.js`) — s možnosťou ručne prepísať/upraviť, ak fotka platí len pre časť hostiteľov objektu.

### 3.3 Výstup

Po odoslaní formulára (alebo potvrdení importu z Excelu) nástroj vygeneruje **.zip súbor** obsahujúci:
- aktualizované/nové JSON súbory (`parasites.json`, `images.json`, `host_hierarchy.json` — podľa toho, čo sa menilo),
- premenované obrázkové súbory (ak išlo o nahrávanie fotiek), usporiadané v rovnakej priečinkovej štruktúre ako `public/images/parasites/<objectId>/...`,
- `README.txt` v zipe so stručným zoznamom "čo nahradiť/kam skopírovať" pre daný beh.

Autorka si zip rozbalí a súbory ručne nahradí/doplní v repozitári — presne ako je zadané.

### 3.4 Needeštruktívnosť

Nástroj **nikdy neprepíše** dáta ticho — pri úprave existujúceho záznamu vždy zobrazí "pred / po" porovnanie a vyžaduje potvrdenie pred vygenerovaním výstupu. Rovnaká zásada platí pri importe Excelu (diff náhľad pred potvrdením).

---

## 4. Polia formulára (potvrdené podľa `parasites.json`, `02_DATABASE_SPECIFICATION.md`, `03_DATA_ENTRY_STANDARD.md`)

Mapovanie zadania autorky na skutočné polia:

| Požiadavka autorky | Skutočné pole | Poznámka |
| --- | --- | --- |
| hostiteľ | `hosts` (+ `hostGroups`, `hostNotes`) | pozri 4.1 |
| materiál | `sample` | select z kontrolovaného zoznamu |
| štádium | `stage` | select z kontrolovaného zoznamu |
| veľkosť | `micrometry.lengthMin/Max`, `widthMin/Max`, `unit` | jednotka nikdy v texte |
| tvar | `morphology.shape` | select |
| farba | `morphology.colour` | select/combobox |
| obal | `morphology.shell` | select/combobox |
| poznámky | `notes` | voľný text |

Ďalšie polia, ktoré formulár musí pokrývať, aby vytvoril kompletný validný objekt: `latinName`, `synonyms`, `slovakName`, `taxonomy` (7 úrovní), `group`, `methods`, `morphology.operculum` (voliteľné true/false), `diagnosticSigns`, `differentialDiagnosis`, `lifeCycle`, `pathology`, `zoonosis` (checkbox), `references`. Needitovateľné: `id`, `images` (spravuje sa cez formulár na obrázky).

### 4.1 Hostiteľ — logika

- `hosts`: multi-select, hodnoty výhradne z `host_hierarchy.json`.
- `hostGroups`: multi-select zo skupinových názvov, s varovaním a vyžiadaním potvrdenia (pravidlo §0.3/0.4).
- `hostNotes`: mapa {hostiteľ: poznámka}, len pre vybraných hostiteľov.

### 4.2 Kontrolované slovníky (samostatné súbory zatiaľ neexistujú v projekte)

`samples.json`, `methods.json`, `stages.json`, `shapes.json`, `colours.json`, `shells.json` z §6 dokumentácie zatiaľ fyzicky neexistujú. Formulár preto použije hodnoty z dokumentácie ako predvolený zoznam + možnosť pridať novú hodnotu. Pri implementácii doplním reálne použité hodnoty priamo z `parasites.json` (474 záznamov).

### 4.3 Validačné pravidlá

- Povinné: `id`, `latinName`, `sample`, `stage`.
- Zakázané placeholder hodnoty (`?`, `-`, `Neznáme`, `N/A`, `cca`, `~` a pod.) — formulár ich odmietne, vynúti `null`/prázdne pole.
- `id` sa generuje automaticky z `latinName` + `stage`, needituje sa po prvom uložení.
- Jednotka mikrometrie vždy v samostatnom poli `unit`, nikdy v čísle.

### 4.4 Polia pre obrázky (`images.json`)

`id`, `objectId`, `author`, `laboratory`, `year`, `host`, `sample`, `stage`, `method`, `objective`, `magnification`, `filename`, `thumbnail`, `isPrimary`, `sortOrder`, `description`.

⚠️ **Nezrovnalosti dokumentácia vs. realita** (na vedomie, netreba riešiť teraz):
- `license` je v dokumentácii, v reálnych dátach sa nepoužíva.
- `thumbnail`, `isPrimary`, `sortOrder` reálne existujú, dokumentácia ich neuvádza (Priorita č. 3 v `AI_STATUS.md`).
- Dokumentácia označuje `host` pri fotke ako povinný, realita (kód aj dáta) ho berie ako voliteľný s konvenciou "prázdny = platí pre všetkých". Formulár sa riadi realitou (kódom), nie touto časťou dokumentácie.

Formulár pre fotky: nahratie súborov (kontrola, že každá fotka má presne 2 varianty — thumbnail aj `_full`), výber `objectId`, automatické predvyplnenie `host` cez `resolveHosts()` (3.2), ostatné polia voliteľné.

---

## 5. Formát Excel exportu/importu

- Jeden hárok = `parasites.json` (jeden riadok = jeden diagnostický objekt, stĺpce = polia záznamu).
- Druhý hárok = `images.json` (jeden riadok = jedna fotka).
- Prvý stĺpec vždy `id` — needitovateľný vizuálne odlíšený (napr. sivé podfarbenie), aby autorka omylom nezmenila ID pri hromadných úpravách.
- Pri importe: nástroj páruje riadky podľa `id`. Nové riadky (ID, ktoré ešte neexistuje) = návrh na vytvorenie nového záznamu. Zmenené riadky = návrh na úpravu. Chýbajúce riadky (boli v appke, chýbajú v Exceli) sa **nemažú automaticky** — len sa upozorní, že chýbajú, a autorka rozhodne.

---

## 6. Čo ešte potrebujem, aby som mohol spresniť túto špecifikáciu a začať s implementáciou

Aby som nehádal schému dát (čo je proti pravidlám projektu), potrebujem nahrať:

1. **`docs/02_DATABASE_SPECIFICATION.md`** — presná schéma polí `parasites.json` (názvy polí pre veľkosť/tvar/farbu/obal/micrometriu atď.) a `images.json`.
2. **`database/parasites.json`** (stačí aj len niekoľko reálnych záznamov ako ukážka, ak je súbor veľký) — aby som videl reálnu štruktúru, nie len špecifikáciu.
3. **`dictionary/host_hierarchy.json`** — aby som navrhol formulár na pridanie nového hostiteľa podľa reálnej štruktúry hierarchie.
4. **`docs/03_DATA_ENTRY_STANDARD.md`** (ak existuje relevantný obsah k pravidlám zápisu dát) — pre validácie vo formulári (napr. povolené hodnoty pre `stage`, formát `micrometry` a pod.).

Po nahratí týchto súborov doplním sekciu 4 (presné polia) a môžeme prejsť k samotnej implementácii (`tools/admin/index.html`).

---
