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

## 0.2.0

Plánované:

### Added

- vytvorenie adresárovej štruktúry projektu,
- základná HTML aplikácia,
- Bootstrap layout,
- navigácia,
- dashboard.

---

## 0.3.0

Plánované:

### Added

- databáza psa,
- prvé diagnostické objekty,
- vyhľadávanie.

---

## 0.4.0

Plánované:

### Added

- galéria,
- detail objektu,
- filtre.

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