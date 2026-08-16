# 05_TECHNICAL_ARCHITECTURE.md

> **Projekt:** VetPara Atlas
>
> **Dokument:** Technická architektúra
>
> **Verzia:** 1.0
>
> **Status:** Living document
>
> **Nadväzuje na:** `00_PROJECT_CONTEXT.md`, `01_PROJECT_SPECIFICATION.md`, `02_DATABASE_SPECIFICATION.md`, `04_UI_UX_SPECIFICATION.md`

---

# Obsah

1. Úvod
2. Architektonická filozofia
3. Ciele architektúry
4. Technologický stack
5. Architektúra aplikácie
6. Štruktúra projektu
7. Dátová vrstva
8. Prezentačná vrstva
9. Aplikačná logika
10. Komponenty
11. Konfigurácia
12. Vyhľadávací systém
13. Modul filtrovania
14. Diagnostický expert
15. Import dát
16. Export dát
17. Výkon
18. Bezpečnosť
19. Testovanie
20. Verzionovanie
21. Budúci vývoj

---

# 1. Úvod

VetPara Atlas je navrhnutý ako **statická webová aplikácia**, ktorá funguje bez serverovej logiky.

Celá aplikácia je postavená na princípe:

```
Dáta

↓

JavaScript

↓

Používateľské rozhranie
```

Databáza predstavuje jediný zdroj odborných údajov.

---

# 2. Architektonická filozofia

Projekt využíva architektúru **Data First**.

To znamená, že:

- databáza je nezávislá od používateľského rozhrania,
- aplikácia iba zobrazuje údaje,
- odborné údaje nikdy nie sú pevne zapísané v kóde.

---

# 3. Ciele architektúry

Architektúra musí byť:

- jednoduchá,
- modulárna,
- rozšíriteľná,
- prenositeľná,
- ľahko testovateľná,
- nezávislá od servera.

---

# 4. Technologický stack

## Frontend

- HTML5
- CSS3
- Vlastný CSS dizajnový systém (CSS Custom Properties, bez frameworku)
- JavaScript ES6+

## Dáta

- JSON

## Vývoj

- Visual Studio Code
- Git
- GitHub

## Nasadenie

- GitHub Pages

**Aktualizácia 2026-08-16:** Pôvodne bol vo Frontend zozname uvedený
Bootstrap 5. Počas vizuálneho redizajnu (`AI_STATUS.md` v8) bol Bootstrap
z celej aplikácie odstránený a nahradený vlastným CSS dizajnovým systémom
postaveným na CSS Custom Properties (`src/css/variables.css` +
`src/styles/atlas.css`), aby Home, Databáza aj Detail používali jeden
konzistentný štýlovací systém namiesto dvoch paralelných. Zoznam vyššie už
odráža aktuálny stav; pozri aj `00_PROJECT_CONTEXT.md` §12 (rovnaká zmena)
a `10_CHANGELOG.md`.

---

# 5. Architektúra aplikácie

```
Používateľ

↓

UI

↓

Komponenty

↓

Business Logic

↓

Database API

↓

JSON databáza
```

Každá vrstva je oddelená.

---

# 6. Štruktúra projektu

```
VetParaAtlas/

README.md

LICENSE

.gitignore

docs/

database/

dictionary/

images/

icons/

app/

css/

js/

components/

utils/

services/

tests/

exports/

assets/
```

---

# 7. Štruktúra frontendu

```
app/

index.html

atlas.html

gallery.html

expert.html

settings.html
```

---

# 8. CSS

```
css/

variables.css

layout.css

components.css

cards.css

gallery.css

expert.css

responsive.css

print.css
```

Každý súbor rieši iba jednu oblasť.

---

# 9. JavaScript

```
js/

app.js

router.js

database.js

search.js

filter.js

gallery.js

expert.js

compare.js

settings.js

utils.js
```

---

# 10. Komponenty

```
components/

Navbar.js

Sidebar.js

Footer.js

SearchBar.js

FilterPanel.js

ObjectCard.js

ObjectDetail.js

Gallery.js

ImageViewer.js

ComparisonTable.js

Breadcrumb.js

Modal.js
```

Každý komponent rieši jednu úlohu.

---

# 11. Utility

```
utils/

helpers.js

validators.js

formatters.js

constants.js
```

Obsahujú pomocné funkcie.

---

# 12. Services

Services zabezpečujú komunikáciu s databázou.

```
services/

DatabaseService.js

SearchService.js

FilterService.js

ImportService.js

ExportService.js
```

---

# 13. Databázová vrstva

JSON súbory sa načítavajú dynamicky.

Príklad:

```
database/

dog.json

cat.json

horse.json

dictionary/

hosts.json

methods.json

samples.json
```

Žiadne údaje nesmú byť uložené priamo v JavaScripte.

---

# 14. Database Service

DatabaseService zabezpečuje:

- načítanie databázy,
- cache,
- validáciu,
- filtrovanie,
- vyhľadávanie.

Aplikácia nikdy nepristupuje k JSON priamo.

---

# 15. Search Engine

Vyhľadáva podľa:

- názvu,
- synonym,
- hostiteľa,
- vzorky,
- skupiny,
- štádia.

Budúce rozšírenia:

- fuzzy search,
- fulltext,
- AI odporúčanie.

---

# 16. Filter Engine

Filtre sú navrhnuté ako samostatný modul.

Každý filter možno zapnúť alebo vypnúť.

Príklady:

- hostiteľ
- skupina
- vzorka
- štádium
- diagnostická metóda
- zoonóza

---

# 17. Diagnostický expert

Expert System bude oddelený od Atlasu.

Používa vlastný algoritmus.

Vstupy:

- hostiteľ
- vzorka
- veľkosť
- tvar
- obal
- farba
- obsah
- diagnostická metóda

Výstup:

zoznam objektov zoradených podľa podobnosti.

---

# 18. Import dát

Import bude modulárny.

```
PowerPoint

↓

Parser

↓

Normalizácia

↓

Validácia

↓

JSON
```

Podporované zdroje:

- PPTX
- XLSX
- DOCX
- PDF

---

# 19. Export dát

Podporované exporty:

- JSON
- CSV
- PDF

Budúce:

- XML
- Darwin Core
- Excel

---

# 20. Konfigurácia

Všetky globálne nastavenia budú uložené v jednom súbore.

```
config/

config.js
```

Obsahuje napríklad:

- názov aplikácie,
- jazyk,
- predvolený hostiteľ,
- tmavý režim,
- maximálny počet výsledkov.

---

# 21. Lokalizácia

Texty nebudú pevne uložené v HTML.

Budú uložené v:

```
locales/

sk.json

en.json
```

Budúca podpora:

- čeština
- nemčina
- maďarčina

---

# 22. Lazy Loading

Veľké fotografie sa načítajú až pri otvorení.

Výhody:

- menšia spotreba pamäte,
- rýchlejšie načítanie.

---

# 23. Cache

Načítaná databáza zostáva v pamäti.

Nebude sa opakovane načítavať.

---

# 24. Offline režim

Budúca verzia:

Progressive Web App.

Service Worker zabezpečí:

- cache dát,
- cache obrázkov,
- offline používanie.

---

# 25. Bezpečnosť

Aplikácia neodosiela údaje používateľa.

Nevyžaduje účet.

Nevyžaduje prihlasovanie.

Nepoužíva cookies na odborné údaje.

---

# 26. Výkon

Požiadavky:

Načítanie:

< 2 sekundy

Vyhľadávanie:

< 100 ms

Filtrovanie:

okamžité

---

# 27. Testovanie

Každá verzia musí prejsť:

- kontrolou JSON,
- kontrolou odkazov,
- kontrolou obrázkov,
- kontrolou duplicít,
- funkčnými testami.

---

# 28. Verzionovanie

Používa sa Git.

Odporúčané vetvy:

```
main

develop

feature/*
```

Každá nová funkcia vzniká vo vlastnej vetve.

---

# 29. Štýl commit správ

Odporúčaný formát:

```
feat: add Giardia database

fix: repair search filter

docs: update architecture

refactor: simplify gallery component
```

---

# 30. Rozšíriteľnosť

Architektúra musí umožniť pridanie:

- nového hostiteľa,
- novej diagnostickej metódy,
- nového jazyka,
- nového modulu,

bez zásahu do existujúceho kódu.

---

# 31. Budúce moduly

Plánované:

- AI rozpoznávanie fotografie,
- automatická mikrometria,
- OCR,
- LIMS Connector,
- štatistiky laboratória,
- synchronizácia medzi zariadeniami,
- používateľské účty (voliteľné),
- cloudová databáza (voliteľná).

---

# 32. Architektonické zásady

Každý nový modul musí:

- byť nezávislý,
- mať jasné rozhranie,
- byť testovateľný,
- byť dokumentovaný.

Žiadny modul nesmie obsahovať odborné údaje natvrdo v kóde.

---

# 33. Kritériá architektúry

Architektúra je úspešná, ak:

- nové údaje možno pridať bez úprav aplikácie,
- nové hostiteľské druhy možno pridať iba doplnením JSON databázy,
- aplikácia zostane rýchla aj pri tisícoch diagnostických objektov,
- všetky moduly zostanú navzájom nezávislé.

---

# Súvisiace dokumenty

- `00_PROJECT_CONTEXT.md`
- `01_PROJECT_SPECIFICATION.md`
- `02_DATABASE_SPECIFICATION.md`
- `03_DATA_ENTRY_STANDARD.md`
- `04_UI_UX_SPECIFICATION.md`
- `06_IMPORT_AND_EXPORT.md`
- `08_DEVELOPER_GUIDE.md`

---

# Poznámka pre vývojárov

Táto architektúra je navrhnutá pre dlhodobý rozvoj projektu. Nové technológie (napr. AI, databázový server alebo cloudová synchronizácia) môžu byť v budúcnosti pridané ako samostatné moduly, pričom základná filozofia projektu zostane zachovaná: **odborné údaje sú uložené v štandardizovanej databáze a aplikácia ich bezpečne, rýchlo a konzistentne sprístupňuje používateľovi.**

---

**Koniec dokumentu**