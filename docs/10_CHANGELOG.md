# 10_CHANGELOG.md

> **Projekt:** VetPara Atlas
>
> **Dokument:** Changelog projektu
>
> **Verzia:** 1.0
>
> **Status:** Living document
>
> **Účel:** Evidencia všetkých významných zmien projektu

---

# Obsah

1. Úvod
2. Pravidlá vedenia changelogu
3. Formát záznamov
4. Typy zmien
5. Verzia 0.1.0
6. Budúce verzie
7. Plánované zmeny
8. Pravidlá verzionovania

---

# 1. Úvod

Tento dokument slúži ako centrálna evidencia všetkých významných zmien v projekte **VetPara Atlas**.

Každá zmena architektúry, databázy, dokumentácie alebo implementácie musí byť zaznamenaná.

Changelog slúži na:

- sledovanie histórie projektu,
- dokumentovanie rozhodnutí,
- uľahčenie návratu k predchádzajúcim verziám,
- koordináciu medzi vývojármi a AI.

---

# 2. Pravidlá vedenia changelogu

Do changelogu sa zapisujú iba významné zmeny.

Patria sem:

- nové moduly,
- zmeny architektúry,
- nové databázové polia,
- zmeny dokumentácie,
- opravy kritických chýb,
- zmeny používateľského rozhrania,
- AI moduly,
- importné a exportné mechanizmy.

Nezapisujú sa:

- preklepy,
- kozmetické úpravy,
- komentáre v kóde,
- drobné úpravy formátovania.

---

# 3. Formát záznamov

Každý záznam používa jednotný formát.

```text
## [Verzia]

Dátum

Typ zmeny

Popis

Dôvod

Súvisiace dokumenty
```

---

# 4. Typy zmien

Používajú sa nasledujúce kategórie.

## Added

Nová funkcionalita.

---

## Changed

Zmena existujúcej funkcionality.

---

## Deprecated

Funkcionalita bude odstránená.

---

## Removed

Odstránená funkcionalita.

---

## Fixed

Oprava chyby.

---

## Security

Bezpečnostná zmena.

---

## Documentation

Zmena dokumentácie.

---

# 5. História projektu

---
## [Unreleased]

## [0.3.0]

**Dátum:** 2026-08-13

### Added

- Doplnené pole `diagnosticSigns` pri **17 z 38** diagnostických objektov — morfologické/
  identifikačné frázy, ktoré po merge z 2026-08-12 skončili nesprávne v poli `notes`,
  boli extrahované a presunuté do `diagnosticSigns` ako samostatné položky poľa, v súlade
  s `03_DATA_ENTRY_STANDARD.md` § 12 (jeden znak = jedna položka, nie voľný text).
  Epidemiologické/klinické poznámky (napr. „nepatogén", „zriedkavý nález") zostali v `notes`.
  Detaily: `docs/2026-08-13_diagnosticSigns-extraction.md`.
- Doplnené pole `taxonomy` (kingdom–phylum–class–order–family–genus–species) pri
  **30 z 38** diagnostických objektov, na základe importu z NCBI taxonomického exportu
  (`Taxonómia.xlsx`, dodaného autorkou projektu), podľa `02_DATABASE_SPECIFICATION.md` § 8.
  22 objektov má taxonómiu do úrovne `species`, 8 iba do úrovne `genus`
  (`species: null` — druh nie je mikroskopicky/zdrojovo jednoznačne určiteľný).
  Zostávajúcich 8 objektov nemá taxonómiu vôbec — nenájdené v zdrojovej tabuľke, zoznam
  odovzdaný autorke projektu v prílohe `Taxonomia_na_doplnenie.xlsx`.
  Detaily: `docs/2026-08-13_taxonomy-import-report.md`.
- Nový diagnostický objekt `echinococcus_sp_egg` (pozri Changed nižšie — vznikol
  rozdelením existujúceho objektu, nie ako nový odborný nález).

### Changed

- **Diagnostický objekt `taenia_spp_echinococcus` rozdelený na 2 samostatné objekty**
  — `taenia_sp_egg` a `echinococcus_sp_egg` — keďže *Taenia* a *Echinococcus* sú odlišné
  rody, aj keď ich vajíčka sú mikroskopicky nerozoznateľné (taeniový typ). Rozhodnutie
  autorky projektu, v súlade s princípom "diagnostický objekt, nie druh"
  (`00_PROJECT_CONTEXT.md`, kap. 10). Oba nové objekty majú zhodné `host`/`sample`/
  `stage`/`group`/`micrometry`/`morphology` (prevzaté z pôvodného záznamu) a zhodnú
  poznámku: *„Vajíčka Taenia a Echinococcus sú morfologicky nerozoznateľné, udávame
  vajíčka taeniového typu."* Oba zachovávajú pôvodné `legacyId: "DOG-0013"` pre
  dohľadateľnosť.
- **Počet diagnostických objektov v `dog.migrated.json` sa zvýšil z 37 na 38** v
  dôsledku vyššie uvedeného rozdelenia. Ak akýkoľvek kód, test alebo dokumentácia
  predpokladá presný počet 37 záznamov, treba to opraviť.
- Pole `taxonomy.kingdom` bolo pri troch prvokoch (`cryptosporidium_parvum`,
  `sarcocystis_spp`, `balantioides_predtym_balantidium_coli`) explicitne nastavené na
  **„Protista"** na základe výslovného pokynu autorky projektu — zdrojová NCBI tabuľka
  mala pre tieto taxóny pole Kingdom prázdne (NCBI formálne nezaraďuje prvoky pod
  Metazoa). Toto je jediné miesto v rámci tejto zmeny, kde `taxonomy` obsahuje hodnotu
  nad rámec priamej zhody so zdrojovou tabuľkou — zapísané na explicitný pokyn, nie ako
  odhad AI.

### Documentation

- Vytvorený `docs/2026-08-13_diagnosticSigns-extraction.md` — kompletný zoznam
  zmenených záznamov (notes → diagnosticSigns) s odôvodnením.
- Vytvorený `docs/2026-08-13_taxonomy-import-report.md` — metóda párovania s NCBI
  tabuľkou, zoznam zhôd/nezhôd, zdôvodnenie splitu Taenia/Echinococcus.
- Vytvorená pracovná príloha `Taxonomia_na_doplnenie.xlsx` (14 riadkov) — odovzdaná
  autorke projektu na doplnenie/rozhodnutie o zvyšných nejasných taxonomických
  priradeniach.
- Aktualizovaný `AI_STATUS.md`.

### Known limitations (prenesené ako TODO)

- 8 diagnostických objektov (`giardia_intestinalis`, `isospora_canis`,
  `isospora_ohioensis`, `isospora_burrowsi`, `isospora_neorivolta`,
  `hammondia_heydornii`, `diphyllobothrium_latum`, `linguatula_serrata`) nemá `taxonomy`
  vôbec vyplnenú — nenájdené v dodanej NCBI tabuľke.
- 8 diagnostických objektov má `taxonomy` iba do úrovne `genus` (`species: null`):
  `sarcocystis_spp`, `mesocestoides_spp`, `physaloptera_spp`, `strongyloides_spp_egg`,
  `strongyloides_spp_larva`, `taenia_sp_egg`, `echinococcus_sp_egg`.
- `diagnosticSigns` zostáva prázdne pri 21 z 38 objektov — pôvodné zdrojové materiály
  pre ne neobsahovali samostatne extrahovateľný diagnostický znak.
- `differentialDiagnosis`, `images`, `references`, `zoonosis`, `methods` zostávajú
  prázdne pri všetkých 38 objektoch.
- `group` pri `demodex_canis`/`demodex_injai` (`"Arthropoda (Acari)"`) a
  `linguatula_serrata` (`"Pentastomida (mimo hlavných skupín — overiť zaradenie)"`)
  naďalej obsahuje hodnoty mimo kontrolovaného zoznamu z `02_DATABASE_SPECIFICATION.md`
  — nerieši sa touto úpravou.
- **UI (`AtlasPage.js`) zatiaľ nezobrazuje ani `diagnosticSigns`, ani `taxonomy`** —
  obe dátové vylepšenia z verzií 0.2.0 a 0.3.0 sú v aplikácii zatiaľ neviditeľné.

### Dôvod

Doplnenie `diagnosticSigns` bolo potrebné, pretože po merge 2026-08-12 skončili
diagnosticky významné frázy nesprávne v poli `notes` namiesto v poli určenom presne na
tento účel (`03_DATA_ENTRY_STANDARD.md` § 12), čo by dlhodobo sťažilo konzistentné
vyhľadávanie a zobrazovanie diagnostických znakov.

Import taxonómie bol potrebný pre modul Detail diagnostického objektu
(`01_PROJECT_SPECIFICATION.md`, modul 3 — sekcia "taxonómia") a pre budúce filtrovanie
podľa taxonomickej skupiny (`Úlohy.txt` bod 5).

Rozdelenie `taenia_spp_echinococcus` na dva objekty bolo potrebné, pretože pôvodný
kombinovaný záznam nebolo možné korektne taxonomicky opísať jedným záznamom (ide o dva
odlišné rody) bez porušenia princípu "jedna hodnota = jeden význam"
(`00_PROJECT_CONTEXT.md`, kap. 4.2).

### Súvisiace dokumenty

- `00_PROJECT_CONTEXT.md`
- `02_DATABASE_SPECIFICATION.md`
- `03_DATA_ENTRY_STANDARD.md`
- `docs/2026-08-13_diagnosticSigns-extraction.md`
- `docs/2026-08-13_taxonomy-import-report.md`
- `AI_STATUS.md`

---

## [0.2.0]

**Dátum:** 2026-08-12

### Added

- Databáza psa (`dog.migrated.json`) rozšírená z 35 na **37 diagnostických objektov** —
  *Alaria alata* a *Strongyloides spp.* rozdelené na samostatné objekty podľa vývojového
  štádia (`alaria_alata_egg` / `alaria_alata_adult`, `strongyloides_spp_egg` /
  `strongyloides_spp_larva`), v súlade s princípom "diagnostický objekt, nie druh"
  (`00_PROJECT_CONTEXT.md`, kap. 10).
- Doplnené polia `host`, `sample`, `stage`, `group` pri všetkých 37 objektoch — zdroj:
  pracovný hárok `dog_worksheet.xlsx`.
- Doplnená/spresnená mikrometria (`micrometry.lengthMin/lengthMax`) tam, kde bola predtým
  neurčená (napr. *Toxocara canis*, *Toxascaris leonina*).

### Changed

- ID diagnostických objektov zmenené z technického tvaru `dog_0001`…`dog_0035`
  (odvodeného slugifikáciou legacy ID) na sémantické ID podľa `03_DATA_ENTRY_STANDARD.md`
  (napr. `toxocara_canis`, `giardia_intestinalis`). Pôvodné legacy ID zachované v novom
  poli `legacyId`.
- Pri 15 objektoch upravené `morphology.shape` / `morphology.colour` / `morphology.shell`
  v prospech hodnôt z `dog_worksheet.xlsx` (podrobný zoznam v prílohe
  `docs/2026-08-12_merge-dog-worksheet-report.md`).
- Pri objekte `toxocara_canis` doplnená šírka (`widthMin`/`widthMax` = 75/90 µm) na základe
  pravidla: zdrojové rozpätie bez „x" (napr. „75-90") pri okrúhlych/guľatých objektoch
  znamená rovnakú dĺžku aj šírku. Pravidlo zámerne **neaplikované** na červovité/vláknité
  tvary (napr. *Dirofilaria repens*), kde by šírka = dĺžka bola biologicky nezmyselná —
  tieto zostávajú so `width = null`, čakajú na doplnenie z literatúry.

### Documentation

- Vytvorený `docs/2026-08-12_merge-dog-worksheet-report.md` — kompletný audit zlúčenia
  (zoznam vyriešených konfliktov, rozdelených objektov, stále chýbajúcich polí).
- Aktualizovaný `AI_STATUS.md`.

### Known limitations (prenesené ako TODO)

- `taxonomy` (kingdom–phylum–class–order–family–genus–species) zostáva prázdne pri všetkých
  37 objektoch — čaká na budúci import kompletného taxonomického stromu.
- `group` pri objektoch *Demodex canis*, *Demodex injai* (`"Arthropoda (Acari)"`) a
  *Linguatula serrata* (`"Pentastomida (mimo hlavných skupín — overiť zaradenie)"`) obsahuje
  hodnoty mimo kontrolovaného zoznamu z `02_DATABASE_SPECIFICATION.md` — dočasne ponechané
  doslovne, čaká na rozhodnutie pri návrhu `taxonomy.json`.
- `diagnosticSigns`, `differentialDiagnosis`, `images`, `references`, `zoonosis`, `methods`
  zostávajú prázdne pri všetkých 37 objektoch.
- Šírka pre *Dirofilaria repens*, *Dirofilaria immitis*, *Oslerus (Filaroides) osleri*
  neurčená — čaká na doplnenie z odbornej literatúry.

### Dôvod

Doplnenie chýbajúcich polí databázy psa bolo nevyhnutné pre spustenie modulov Vyhľadávanie,
Filtre a Diagnostický expert (`01_PROJECT_SPECIFICATION.md`, moduly 4 a 6), ktoré závisia od
vyplnených hodnôt `sample`, `stage` a `group`.

### Súvisiace dokumenty

- `00_PROJECT_CONTEXT.md`
- `02_DATABASE_SPECIFICATION.md`
- `03_DATA_ENTRY_STANDARD.md`
- `docs/2026-08-12_merge-dog-worksheet-report.md`
- `AI_STATUS.md`

---

**Dátum:** 2026-08-11

### Changed

Vytvorená migrácia `database/dog.json` z pôvodnej plochej štruktúry
(`taxon`, `host` ako text, `size` ako text, `shape`/`color`/`wall`)
na schému definovanú v `02_DATABASE_SPECIFICATION.md` sekcii 7
(`latinName`, `host[]`, `micrometry{}`, `morphology{}`, `taxonomy{}` atď.).

Záznam `Strongyloides spp.` (DOG-0027) a `Alaria alata` (DOG-0011) boli
rozdelené na samostatné diagnostické objekty podľa jednotlivých štádií
(vajíčko/larva, resp. vajíčko/dospelý jedinec), v súlade s princípom
"diagnostický objekt, nie druh" z `00_PROJECT_CONTEXT.md` sekcie 10.

**Dôvod:**

Pôvodný `dog.json` nezodpovedal vlastnej databázovej schéme projektu —
`host` bol nekonzistentný text namiesto poľa, `size` bol nestrukturovaný
reťazec namiesto číselnej `micrometry`, chýbali polia `stage`, `sample`,
`group`, `taxonomy`, `diagnosticSigns[]` a ďalšie. To blokovalo správne
fungovanie filtrov v `AtlasPage.js` a bolo v rozpore s
`03_DATA_ENTRY_STANDARD.md`.

**Stav:** ⚠️ Migrácia NIE JE dokončená — `dog_migrated.json` je
prechodný súbor, nie finálna produkčná databáza. Chýba:

- `stage` a `sample` pre všetkých 37 záznamov (vyžaduje odbornú kontrolu),
- potvrdenie `group` (aktuálne len ako `aiSuggested.group`),
- doplnenie mikrometrie pre 5 záznamov (`Mesocestoides spp.`,
  `Oslerus osleri`, `Dirofilaria immitis`, `Demodex canis`,
  `Demodex injai`) — zámerne neprevedené automaticky.

Pridaný nový nástroj `tools/migrate.py` — konvertuje starú plochú
schému na novú štruktúru, s reportom nejednoznačných záznamov.

**Súvisiace dokumenty:**
`02_DATABASE_SPECIFICATION.md`, `03_DATA_ENTRY_STANDARD.md`,
`06_IMPORT_AND_EXPORT.md` (sekcia 19 — zálohovanie pred zmenou databázy),
`11_SESSION_LOG.md`

### Documentation

Vygenerovaný `migration_report.md` s kompletným zoznamom všetkých 37
záznamov a ich stavom migrácie (dostupné mimo `docs/`, ako pracovný
záznam k tejto zmene).

---

## [0.1.0]

**Dátum:** 2026-07-25

### Added

- Založená dokumentácia projektu VetPara Atlas.
- Definovaná filozofia projektu **Data First**.
- Navrhnutá databázová architektúra založená na JSON.
- Definovaný model diagnostického objektu.
- Navrhnutý systém kontrolovaných slovníkov.
- Definovaná architektúra používateľského rozhrania.
- Vytvorená technická architektúra aplikácie.
- Navrhnutý systém importu a exportu údajov.
- Definovaná dlhodobá AI roadmap.
- Vypracovaný Developer Guide.
- Vytvorený Master Prompt pre AI.

### Documentation

Vytvorené dokumenty:

- `00_PROJECT_CONTEXT.md`
- `01_PROJECT_SPECIFICATION.md`
- `02_DATABASE_SPECIFICATION.md`
- `03_DATA_ENTRY_STANDARD.md`
- `04_UI_UX_SPECIFICATION.md`
- `05_TECHNICAL_ARCHITECTURE.md`
- `06_IMPORT_AND_EXPORT.md`
- `07_AI_ROADMAP.md`
- `08_DEVELOPER_GUIDE.md`
- `09_MASTER_PROMPT.md`
- `10_CHANGELOG.md`

### Status

Projekt je vo fáze:

**Architektúra a dokumentácia.**

---

# 6. Budúce verzie

## 0.4.0

Plánované (na základe `Úlohy.txt`):

### Added

- zobrazenie `diagnosticSigns` a `taxonomy` v `AtlasPage.js` (karta + detail),
- externý odkaz na Catalogue of Life / WoRMS v detaile objektu,
- filter podľa veľkosti (rozsah dĺžka/šírka od–do),
- filter podľa `sample`,
- multi-select filtre (farba, tvar, hostiteľ, sample),
- fulltext vyhľadávanie cez všetky relevantné textové polia.

---

## 0.5.0

Plánované:

### Added

- porovnanie objektov,
- export.

---

## 1.0.0

Prvé stabilné vydanie.

Obsahuje:

- kompletnú databázu psa,
- galériu,
- vyhľadávanie,
- export,
- dokumentáciu.

---

## 2.0.0

Plánované:

- ďalší hostitelia,
- diagnostický expert,
- PWA.

---

## 3.0.0

Plánované:

- AI rozpoznávanie fotografií,
- automatická mikrometria,
- OCR.

---

# 7. Evidencia databázových zmien

Každá zmena databázy musí byť zapísaná.

Príklad.

```text
Verzia:

0.4.2

Pole:

diagnosticSigns

Typ:

Changed

Popis:

Rozdelenie textového poľa na pole hodnôt.

Dôvod:

Efektívnejšie filtrovanie.
```

---

# 8. Evidencia architektonických zmien

Každá zmena architektúry obsahuje:

- dátum,
- autora,
- dôvod,
- dopad,
- súvisiace dokumenty.

---

# 9. Evidencia UI zmien

Pri každej zmene rozhrania sa zapisuje:

- zmenená obrazovka,
- dôvod,
- dopad na používateľa,
- kompatibilita.

---

# 10. Evidencia AI zmien

Každý AI modul obsahuje:

- názov,
- stav,
- použitý model,
- zdroj dát,
- presnosť,
- poznámky.

---

# 11. Evidencia importných zmien

Každá zmena importného systému obsahuje:

- podporovaný formát,
- parser,
- nové polia,
- zmeny validácie.

---

# 12. Evidencia exportných zmien

Každá zmena exportu obsahuje:

- formát,
- nové možnosti,
- kompatibilitu.

---

# 13. Pravidlá verzionovania

Projekt používa **Semantic Versioning (SemVer)**.

Formát:

```
MAJOR.MINOR.PATCH
```

Príklady:

```
0.1.0

0.2.0

0.2.1

1.0.0

1.1.0

2.0.0
```

Význam:

### MAJOR

Nezlučiteľné zmeny.

---

### MINOR

Nové funkcionality.

---

### PATCH

Opravy chýb.

---

# 14. Odporúčaný Git Tag

Každá stabilná verzia bude označená Git tagom.

Príklady:

```
v0.1.0

v0.2.0

v1.0.0
```

---

# 15. Release Notes

Pri každej novej verzii sa vytvorí stručný prehľad.

Obsahuje:

- nové funkcie,
- opravy,
- známe obmedzenia,
- migračné poznámky (ak sú potrebné).

---

# 16. Pravidlá pre AI

Ak AI navrhne zmenu projektu, ktorá ovplyvňuje:

- databázu,
- architektúru,
- dokumentáciu,
- import,
- export,
- AI moduly,

musí odporučiť aj aktualizáciu tohto changelogu.

---

# 17. Kontrolný zoznam pred vydaním novej verzie

Pred vytvorením novej verzie overiť:

- ☐ Dokumentácia je aktuálna.
- ☐ Databázová schéma je konzistentná.
- ☐ JSON súbory sú validné.
- ☐ Testy prešli úspešne.
- ☐ Neboli vytvorené duplicity.
- ☐ Changelog obsahuje všetky významné zmeny.
- ☐ Verzia bola označená Git tagom.

---

# Súvisiace dokumenty

- `00_PROJECT_CONTEXT.md`
- `01_PROJECT_SPECIFICATION.md`
- `02_DATABASE_SPECIFICATION.md`
- `03_DATA_ENTRY_STANDARD.md`
- `04_UI_UX_SPECIFICATION.md`
- `05_TECHNICAL_ARCHITECTURE.md`
- `06_IMPORT_AND_EXPORT.md`
- `07_AI_ROADMAP.md`
- `08_DEVELOPER_GUIDE.md`
- `09_MASTER_PROMPT.md`

---

# Poznámka

Tento dokument je jediným oficiálnym záznamom histórie projektu.

Každá významná zmena musí byť zapísaná ešte pred zlúčením do hlavnej vetvy (`main`). Tým sa zabezpečí úplná dohľadateľnosť vývoja projektu a jednoduchá orientácia v histórii rozhodnutí.

---
**Koniec dokumentu**
