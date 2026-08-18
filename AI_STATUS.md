# VetPara Atlas – AI STATUS (kompletný stav projektu)

**Dátum poslednej aktualizácie:** 2026-08-18 (session: zásadná zmena dátovej stratégie — deduplikácia parazitov naprieč hostiteľmi)
**Branch:** develop
**Verzia projektu:** v16-in-progress (rozhodnuté o novej architektúre databázy, migrácia PREBIEHA — pozri sekciu 0)

---

## 0. ⚠️ ZÁSADNÁ ZMENA STRATÉGIE (2026-08-18) — PRIORITA PRE KAŽDÉHO ĎALŠIEHO AI

**Toto je najdôležitejšia sekcia tohto dokumentu. Prečítaj ju PRED akoukoľvek prácou na databáze.**

### 0.1 Problém, ktorý sa rieši

Doterajší model (`v15`, 14 súborov `*.migrated.json` — jeden na hostiteľa) spôsoboval, že
rovnaký parazit sa nahrával duplicitne pre každého hostiteľa zvlášť. Príklad: *Giardia
intestinalis – cysta* bola nahraná **10×** (pes, mačka, vtáky, hovädzí dobytok, kôň,
ošípaná, králik, hlodavce, ovca/koza, divé prežúvavce) s **identickými** odbornými údajmi,
líšil sa iba `host`. Analýza naprieč všetkými 14 súbormi (567 záznamov spolu) našla
**46 diagnostických objektov (ID)**, ktoré sa opakujú vo viac ako jednom súbore.

Toto porušuje základný princíp projektu `00_PROJECT_CONTEXT.md` §4.2 ("Jeden zdroj
pravdy — každý údaj existuje iba raz") a bolo už zdrojom nekonzistencie v minulosti
(pozri `10_CHANGELOG.md` [0.3.0] — problém s `taxonomy.kingdom` naprieč záznamami,
riešený manuálne case-by-case).

### 0.2 Nová architektúra (schválené autorkou projektu v chate, 2026-08-18)

**Namiesto 14 host-súborov s duplikovanými parazitmi:**

```
database/
  parasites.json          ← JEDEN záznam na diagnostický objekt (nahrádza všetkých 14 host-súborov)
  images.json             ← NOVÁ samostatná kolekcia fotografií (doteraz žiadne fotky v DB neboli)
  dictionary/
    hosts.json             (beze zmeny)
    host_hierarchy.json     (existuje už z v15 — teraz sa jeho účel mení z "len UI filter"
                             na PRIAMY DÁTOVÝ VZŤAH, pozri 0.3)
```

**Rozšírenie schémy záznamu parazita** (`02_DATABASE_SPECIFICATION.md` §7/§8 — POLIA
PRIBUDLI, nič sa nemaže, spätne kompatibilné):

```json
{
  "id": "giardia_intestinalis_cyst",
  "latinName": "Giardia intestinalis",
  "synonyms": ["Giardia lamblia", "Lamblia intestinalis"],

  "hostGroups": ["Mäsožravce", "Hlodavce", "..."],
  "hosts": [],
  "hostNotes": {
    "Mačka": "Zriedkavý nález, zvyčajne asymptomatický priebeh."
  },

  "...": "...ostatné polia zo súčasnej schémy bez zmeny (taxonomy, sample, stage,
          micrometry, morphology, diagnosticSigns, differentialDiagnosis, notes...)"
}
```

- **`hostGroups`** — názvy skupín z `host_hierarchy.json`. Rozbaľuje sa DYNAMICKY pri
  filtrovaní (nie staticky pri zápise) → pridanie nového hostiteľa do existujúcej skupiny
  v `host_hierarchy.json` automaticky "zdedí" všetkých parazitov tejto skupiny, BEZ
  zásahu do `parasites.json`. Toto je jadro celej zmeny — presne to bol pôvodný
  požiadavok autorky ("keď pridám hostiteľa, len mu priradím miesto vo filtri").
- **`hosts`** — konkrétni hostitelia MIMO skupinovej logiky (výnimky, alebo parazit
  špecifický len pre jedného/dvoch hostiteľov, aj keď v rovnakej skupine sú aj iní).
  Príklad: `Dipylidium caninum` je zapísaný ako `hosts: ["Pes", "Mačka"]`, NIE
  `hostGroups: ["Mäsožravce"]`, pretože nie je potvrdené, že sa vyskytuje aj u
  ostatných mäsožravcov v budúcej databáze.
- **`hostNotes`** — voliteľné, kľúčované menom hostiteľa. Slúži na odchýlky medzi
  hostiteľmi (infekčnosť, raritnosť, atypická forma) — NIE na duplikovanie celého
  záznamu.
- **`synonyms`** — nové pole (požiadavka autorky, 2026-08-18). Iné vedecké názvy, pod
  ktorými sa má objekt tiež nájsť pri vyhľadávaní (napr. *Giardia lamblia* →
  *Giardia intestinalis*). `AtlasPage.js` → `matchesFulltext()` treba rozšíriť o toto pole.

**Fotografie** (nová kolekcia `images.json`, rozšírenie `02_DATABASE_SPECIFICATION.md` §9):

```json
{
  "id": "IMG000045",
  "parasiteId": "giardia_intestinalis_cyst",
  "host": "Pes",
  "sample": "Trus",
  "method": "Flotácia",
  "magnification": "400x",
  "description": "Atypická forma, detail bunkovej steny",
  "primary": true
}
```

Detail parazita zobrazí JEDNU reprezentatívnu fotku (`primary: true`), Galéria bude
filtrovať podľa `parasiteId` + voliteľne `host`.

### 0.3 Dôležité pravidlo pre priraďovanie `hostGroups` vs `hosts`

**NIKDY automaticky nepovyšuj parazita zo špecifického hostiteľa na celú skupinu**, ak to
nie je buď (a) explicitne potvrdené autorkou, alebo (b) záznam sa dnes už reálne
vyskytuje identicky u VŠETKÝCH členov danej skupiny. Toto je priama aplikácia pravidla
`00_PROJECT_CONTEXT.md` §9 ("Projekt nesmie vytvárať odborné údaje, ktoré nie sú
podložené zdrojmi") — vymyslieť, že parazit psa platí aj pre líšku, by bolo presne
takéto vytváranie nepodložených údajov.

Explicitne schválené výnimky (2026-08-18):
- `giardia_intestinalis_cyst` → `hostGroups`: všetky koreňové skupiny OKREM
  "Bezstavovce" a "Ryby" (12 koreňových skupín v `host_hierarchy.json`, z toho 10 sem patrí).
- `taenia_sp_egg`, `strongyloides_sp_egg`, `strongyloides_sp_larva` → `hostGroups: ["Mäsožravce"]`.
- `dipylidium_caninum_egg`, `uncinaria_stenocephala_egg`, `dirofilaria_immitis_larva`,
  `dirofilaria_repens_larva` → ZOSTÁVAJÚ ako `hosts: ["Pes", "Mačka"]` (NIE skupina) —
  explicitne potvrdené autorkou, že sa nemajú automaticky vzťahovať na celú skupinu
  Mäsožravce.
- `crenosoma_vulpis_larva` → `hosts: ["Pes"]` LEN — pôvodný záznam v `cat.migrated.json`
  bol OMYLOM (autorka potvrdila: mačka tohto parazita nemá), pri migrácii sa má
  odstrániť, nie zlúčiť.

### 0.4 Priebeh migrácie — AKTUÁLNY STAV (2026-08-18)

1. ✅ Analyzovaných všetkých 14 `*.migrated.json` súborov (567 záznamov).
2. ✅ Nájdených 46 ID vyskytujúcich sa vo viacerých súboroch naraz.
3. ✅ Autorka rozhodla o riešení pre skupinu prípadov pes/mačka (7 konfliktov + 1 ID
   naming bug + pravidlá pre `hostGroups` vs `hosts`, viď 0.3).
4. 🔶 **OTVORENÉ — čaká na potvrdenie autorky** (6 zvyšných skupín konfliktov naprieč
   ostatnými hostiteľmi — mikrometria/sample/stage sa reálne líšia, potenciálne treba
   rozdeliť na host-špecifické ID s príponou, napr. `__reptiles`, podľa vzoru už
   použitého v `docs/2026-08-17_priorita2-import-hostitelia.md`):
   - `strongyloides_sp_egg`/`_larva` — výskyt aj u Plazov/Ovca-Koza/Divé prežúvavce,
     netriešené, či ide o rovnaký objekt ako u Mäsožravcov.
   - `isospora_sp_oocyst` — vtáky majú inú mikrometriu a podozrivo prekopírovaný
     `species: "Isospora felis"` u mäkkýšov/plazov.
   - `myocoptes_musculinus_adult` — u plazov ide pravdepodobne o pseudoparazita
     (nález z koristi), nie skutočnú infekciu — kandidát na rozdelenie ID.
   - `ligula_intestinalis_plerocercoid` — u vtákov je to iné vývojové štádium
     (`Dospelý jedinec` vs `Plerocerkoid` u rýb) → podľa princípu "diagnostický
     objekt, nie druh" (`00_PROJECT_CONTEXT.md` §10) potrebuje VLASTNÉ ID, nie zdieľané.
   - `cysticercus_tenuicollis_larva`, `coenurus_serialis_larva`,
     `cysticercus_pisiformis_larva` — u králika iná vzorka (`Koža`) než u ostatných
     hostiteľov (`Mezentérium`/`Podkožie`/`Peritoneum`) — pravdepodobne reálny
     rozdiel v lokalizácii nálezu podľa hostiteľa.
   - Drobné nezrovnalosti farby/obalu bez jasného dopadu (`capillaria_sp_egg`,
     `balantioides_coli_cyst`, `cyniclomyces_guttulatus_yeast`, `nematodirus_sp_egg`,
     `ostertagia_sp_egg`) — navrhnuté zlúčiť a použiť presnejší z dvoch opisov.
5. ⬜ **NEVYKONANÉ:** samotné vytvorenie `database/parasites.json` a `database/images.json`
   — čaká na dokončenie bodu 4.
6. ⬜ **NEVYKONANÉ:** úprava kódu (`DatabaseService.js`, `Repository.js`, `AtlasPage.js`)
   na nový dátový model — pozri 0.5.
7. ⬜ **NEVYKONANÉ:** aktualizácia `02_DATABASE_SPECIFICATION.md` (nové polia
   `hostGroups`/`hosts`/`hostNotes`/`synonyms`, schéma `images.json`) a zápis do
   `10_CHANGELOG.md` (zmena významu poľa `host` — vyžaduje `03_DATA_ENTRY_STANDARD.md`
   §20 explicitný zápis pri zmene významu existujúceho poľa).

**Staré súbory `dog.migrated.json` ... `wild_ruminants.migrated.json` sa NEMAŽÚ**, kým
nie je `parasites.json` plne vygenerovaný a overený — slúžia ako záložný zdroj pravdy
počas migrácie.

### 0.5 Dopad na kód (naplánované, ešte nevykonané)

| Súbor | Plánovaná zmena |
|---|---|
| `DatabaseService.js` | `loadAllHostDatabases()` (14× fetch + merge) → nahradiť `load("parasites.json")` + `load("dictionary/host_hierarchy.json")` |
| `Repository.js` | pridať `resolveHosts(record)` — rozbalí `hostGroups` cez hierarchiu na konkrétnych hostiteľov (union s `hosts`), aby filter fungoval identicky ako doteraz |
| `AtlasPage.js` | filter Hostiteľ sa nemení navonok (rovnaké UX); zdroj hodnôt sa mení z `record.host` na `resolveHosts(record)`; `matchesFulltext()` rozšíriť o `record.synonyms` |
| nová stránka Galéria (zatiaľ len `console.log` placeholder) | filter podľa `parasiteId` + `host` z `images.json` |

### 0.6 Plánovaný user-friendly formulár na správu záznamov (schválené, návrh hotový)

Dohodnuté s autorkou (2026-08-18), zatiaľ NEIMPLEMENTOVANÉ:

- **Spôsob ukladania:** appka je statická bez servera (`00_PROJECT_CONTEXT.md` §13),
  formulár teda nezapisuje priamo na disk. Zvolená kombinácia:
  (A) generuje čistý JSON záznam/diff na export, (B) drží rozpracované zmeny v pamäti
  session, kým používateľ neexportuje aktualizovaný `parasites.json` na stiahnutie —
  konzistentné s existujúcim Modulom 8 (Export) z `01_PROJECT_SPECIFICATION.md`.
- **Formulár hostiteľa:** názov + priradenie do skupiny (zápis do `host_hierarchy.json`)
  — žiadne ručné priraďovanie parazitov, dedí sa automaticky cez `hostGroups`.
- **Formulár parazita (wizard, 9 krokov):** Identifikácia (vrát. `synonyms`) → Taxonómia
  → Hostitelia (`hostGroups`/`hosts`/`hostNotes`) → Vzorka/štádium/metódy → Mikrometria
  (dĺžka min/max, šírka min/max — beze zmeny formátu) → Morfológia → Diagnostické znaky
  → Diferenciálna diagnostika/literatúra/poznámky → Náhľad + kontrola duplicity
  (aj cez `latinName`, aj cez `synonyms`).
- **UX pomoc:** vysvetľujúci text pod nadpisom každej sekcie + tooltip (ⓘ) pri
  jednotlivých poliach, aby formulár nevyžadoval školenie (`04_UI_UX_SPECIFICATION.md` §3).
- **Fotografie:** samostatný mini-formulár priraďujúci fotku k `parasiteId` +
  voliteľnému `host` + popisu (napr. "Atypická forma, detail bunkovej steny").
- Otvorená otázka (nerozhodnuté): či bude tento nástroj súčasťou hlavnej appky
  (položka menu "Správa databázy") alebo samostatný interný nástroj mimo verejného
  Atlasu — čaká na rozhodnutie autorky pred implementáciou.

---

## 1. SÚHRN STAVU PRED TOUTO SESSION (2026-08-17, v15 — stále aktuálne pre kód/UI)

Projekt je funkčný na starej architektúre (14 host-súborov). Milestone 2 (Vizuálny
redizajn) je dokončený. VŠETKO NIŽŠIE V TEJTO SEKCII 1 SA VZŤAHUJE NA STARÚ
ARCHITEKTÚRU — po dokončení migrácie z bodu 0 bude potrebné túto sekciu nahradiť.

### 1.0 Oprava pádu appky + filtrov v `AtlasPage.js` (2026-08-17)
- Bug 1 (kritický pád appky): import JSON s `{ type: "json" }` zlyhával → nahradené
  asynchrónnym `DatabaseService.load()` s try/catch fallbackom.
- Bug 2: filter Materiál (sample) sa renderoval ako select, viazal sa ako checkbox →
  presunuté do `MULTI_SELECT_FIELDS`.
- Bug 3: viacnásobný výber v `<select multiple>` teraz funguje na jeden klik (bez Ctrl/Cmd).
- Bug 4: Detail parazita — vrátené na CSS triedy skutočne definované v `atlas.css`.
- Bug 5: `taxonomyExternalLinksButtons()` zachovaná ako funkcia (vracia skrytý
  `<div style="display:none;">`), aby sa neporušilo vykresľovanie — NIKDY túto funkciu
  úplne nemazať zo štruktúry objektu.

### 1.1 Import ďalších hostiteľov (2026-08-17)
- Naimportovaných 529 objektov do 13 host-súborov + `dog.migrated.json` aktualizovaný
  (38 záznamov) = 567 spolu. Log: `docs/2026-08-17_priorita2-import-hostitelia.md`.
- **DÔLEŽITÉ:** tento import bol robený PRED rozhodnutím o deduplikácii (sekcia 0) —
  je to práve zdroj 46 duplicitných ID, ktoré teraz rieši migrácia na `parasites.json`.

### 1.2 Napojenie všetkých host-databáz do appky (2026-08-17)
- `DatabaseService.loadAllHostDatabases()` — načíta 14 súborov paralelne cez `Promise.all`.
  **Toto sa migráciou z bodu 0 nahradí jedným `load("parasites.json")`.**

### 1.3 Predchádzajúce opravy (hamburger menu, logo, aktívny stav v menu, Bootstrap
odstránený) — bez zmeny, zdokumentované v predošlých verziách tohto súboru.

---

## 2. ĎALŠIE KROKY PRE NOVÉHO AI (zoradené podľa priority)

### Priorita č. 1 (AKTUÁLNA, BLOKUJÚCA): Dokončiť migráciu na `parasites.json`
1. Získať od autorky rozhodnutie k 6 otvoreným konfliktom v sekcii 0.4 bod 4.
2. Vygenerovať `database/parasites.json` (deduplikovaný, so schémou zo sekcie 0.2).
3. Vygenerovať `database/images.json` (zatiaľ prázdny/kostra — appka doteraz nemala
   žiadne reálne fotky, len placeholder text v Detaile).
4. Napísať migračný report do `docs/2026-08-18_parasites-dedup-migration.md`
   (rovnaký formát ako `docs/2026-08-15_micrometry-taxonomy-import.md`).
5. Upraviť `DatabaseService.js`, `Repository.js`, `AtlasPage.js` podľa sekcie 0.5.
6. Aktualizovať `02_DATABASE_SPECIFICATION.md` a `10_CHANGELOG.md`.
7. Staré `*.migrated.json` súbory presunúť do `_archive/` (nie zmazať) až PO overení,
   že `parasites.json` obsahuje všetky dáta bez straty.

### Priorita č. 2: Implementovať formulár na správu záznamov (sekcia 0.6)
Návrh je hotový a schválený, čaká na (a) rozhodnutie o umiestnení v appke, (b) dokončenú
Prioritu č. 1 (formulár musí zapisovať do NOVEJ schémy, nie do starej).

### Priorita č. 3: Chýbajúce stránky (Gallery, Expert) — nezmenené oproti v15.

### Priorita č. 4: Assety a drobné opravy — nezmenené oproti v15 (chýbajúci
`home-hero.png`, `group` pre Acari/Pentastomida mimo kontrolovaného zoznamu).

---

## 3. ZOZNAM DÔLEŽITÝCH SÚBOROV

Nezmenené oproti v15 (pozri predošlú verziu), PLUS:
- `docs/2026-08-18_parasites-dedup-migration.md` — (VZNIKNE) log tejto migrácie.
- `database/parasites.json` — (VZNIKNE) nahradí 14 host-súborov.
- `database/images.json` — (VZNIKNE) nová kolekcia fotografií.

---

## 4. DÔLEŽITÉ PRAVIDLÁ PRE ĎALŠIEHO AI

Nezmenené pravidlá z v15 PLUS:

6. **Nikdy automaticky nepovyšuj `host` na `hostGroups`** bez explicitného potvrdenia
   autorky alebo silného dôkazu (identické dáta u všetkých členov skupiny) — pozri
   sekciu 0.3. Toto je najčastejšie riziko chyby pri tejto migrácii.
7. **Rozdielna `micrometry`/`sample`/`stage` pri rovnakom ID naprieč hostiteľmi**
   znamená, že NEJDE o duplicitu, ale o dva rôzne diagnostické objekty — musia dostať
   different ID (host-špecifická prípona), nie zlúčiť do jedného záznamu s priemernými
   alebo náhodne vybranými hodnotami.
8. Staré `*.migrated.json` súbory sa NEMAŽÚ, kým nie je migrácia plne overená.

---
