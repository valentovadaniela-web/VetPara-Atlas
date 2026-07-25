# 08_DEVELOPER_GUIDE.md

> **Projekt:** VetPara Atlas
>
> **Dokument:** Príručka pre vývojárov
>
> **Verzia:** 1.0
>
> **Status:** Living document
>
> **Nadväzuje na:** všetky predchádzajúce dokumenty projektu

---

# Obsah

1. Úvod
2. Ciele dokumentu
3. Filozofia vývoja
4. Pravidlá projektu
5. Architektúra adresárov
6. Štandard kódu
7. HTML štandard
8. CSS štandard
9. JavaScript štandard
10. JSON štandard
11. Git workflow
12. Testovanie
13. Dokumentácia
14. Performance
15. Bezpečnosť
16. Accessibility
17. AI Coding Rules
18. Konvencie pomenovania
19. Checklist pred commitom
20. Budúce rozšírenia

---

# 1. Úvod

Tento dokument slúži ako hlavná príručka pre všetkých vývojárov projektu VetPara Atlas.

Jeho cieľom je zabezpečiť, aby bol celý projekt vyvíjaný jednotným spôsobom bez ohľadu na to, či na ňom pracuje človek alebo AI.

Každá zmena projektu musí rešpektovať pravidlá uvedené v tomto dokumente.

---

# 2. Ciele dokumentu

Developer Guide zabezpečuje:

- jednotný štýl programovania,
- konzistentnú architektúru,
- jednoduchú údržbu,
- vysokú čitateľnosť kódu,
- jednoduché rozširovanie projektu.

---

# 3. Filozofia vývoja

Projekt je založený na princípoch:

- **Data First**
- **Modular Architecture**
- **Component Based Design**
- **Single Responsibility Principle**
- **Progressive Enhancement**
- **Offline First (budúce verzie)**

Každý modul má riešiť iba jednu úlohu.

---

# 4. Základné pravidlá projektu

## Nikdy

- nekopírovať rovnaký kód na viac miest,
- nepísať odborné údaje priamo do JavaScriptu,
- nevytvárať globálne premenné bez dôvodu,
- nemiešať HTML, CSS a JavaScript do jedného súboru.

## Vždy

- používať komponenty,
- používať JSON databázu,
- dokumentovať zložitejšie časti,
- písať čitateľný kód.

---

# 5. Architektúra projektu

```
VetParaAtlas/

app/

components/

css/

js/

database/

dictionary/

images/

icons/

locales/

services/

utils/

config/

tests/

docs/

exports/
```

Každý priečinok má jednoznačný účel.

---

# 6. HTML štandard

Používa sa HTML5.

Každá stránka obsahuje:

- správnu hierarchiu nadpisov,
- sémantické elementy,
- meta tagy,
- ALT texty obrázkov.

Preferované elementy:

```
<header>

<nav>

<main>

<section>

<article>

<aside>

<footer>
```

---

# 7. CSS štandard

Používa sa:

- CSS Variables,
- Flexbox,
- CSS Grid.

Pravidlá:

- žiadne inline štýly,
- žiadne !important (okrem výnimočných prípadov),
- jedna zodpovednosť na jeden súbor.

Štruktúra:

```
variables.css

layout.css

components.css

responsive.css

print.css
```

---

# 8. JavaScript štandard

Používa sa moderný JavaScript (ES6+).

Odporúčané:

- `const`
- `let`
- arrow functions
- template literals
- async/await

Nepoužívať:

- `var`
- `document.write()`
- inline JavaScript

---

# 9. Štruktúra JavaScript modulov

Každý modul exportuje iba verejné funkcie.

Príklad:

```
SearchService

↓

FilterService

↓

DatabaseService
```

Moduly nesmú byť navzájom pevne previazané.

---

# 10. JSON štandard

Každý JSON súbor:

- UTF-8,
- odsadenie 2 alebo 4 medzery (konzistentne v celom projekte),
- bez komentárov,
- bez duplicitných ID.

Každý objekt musí spĺňať schému definovanú v:

`02_DATABASE_SPECIFICATION.md`

---

# 11. Git workflow

Používajú sa vetvy:

```
main

develop

feature/*

fix/*

docs/*
```

Každá nová funkcionalita vzniká vo vlastnej vetve.

---

# 12. Commit správy

Odporúčaný formát:

```
feat: add search engine

feat: create gallery component

fix: repair filter logic

docs: update database specification

refactor: simplify object renderer

style: improve responsive layout

test: add validation tests
```

---

# 13. Code Review

Každá väčšia zmena musí byť skontrolovaná.

Kontroluje sa:

- funkčnosť,
- čitateľnosť,
- výkon,
- kompatibilita,
- dokumentácia.

---

# 14. Testovanie

Každá verzia musí prejsť:

## Funkčné testy

- vyhľadávanie,
- filtre,
- galéria,
- detail objektu.

## Databázové testy

- duplicity,
- validácia JSON,
- povinné polia.

## UI testy

- responzivita,
- dark mode,
- prístupnosť.

---

# 15. Performance

Požiadavky:

- načítanie stránky < 2 sekundy,
- vyhľadávanie < 100 ms,
- filtrovanie bez obnovy stránky,
- lazy loading obrázkov.

Každá nová funkcia nesmie výrazne znižovať výkon.

---

# 16. Bezpečnosť

Projekt:

- nevyžaduje prihlasovanie,
- neukladá osobné údaje,
- neposiela údaje na server,
- nepoužíva externé skripty bez dôkladného overenia.

Pri budúcich API integráciách musia byť všetky vstupy validované.

---

# 17. Accessibility

Cieľ:

**WCAG 2.1 AA**

Každý komponent musí podporovať:

- ovládanie klávesnicou,
- čítačky obrazovky,
- dostatočný kontrast,
- viditeľný fokus,
- responzívne zobrazenie.

---

# 18. AI Coding Rules

Pri práci s AI (ChatGPT alebo iné modely) platia tieto pravidlá:

## AI nesmie

- meniť databázovú štruktúru bez aktualizácie dokumentácie,
- vytvárať nové polia bez odôvodnenia,
- meniť význam existujúcich polí,
- vkladať odborné údaje natvrdo do kódu.

## AI má

- rešpektovať všetky dokumenty projektu,
- používať existujúce názvy,
- zachovávať spätnú kompatibilitu,
- navrhovať modulárne riešenia.

---

# 19. Konvencie pomenovania

## Súbory

```
gallery.js

database.js

expert.js
```

## Komponenty

```
ObjectCard.js

SearchBar.js

FilterPanel.js
```

## CSS triedy

Používa sa kebab-case.

```
object-card

gallery-grid

search-panel
```

## JavaScript

Premenné:

```
camelCase
```

Triedy:

```
PascalCase
```

Konštanty:

```
UPPER_CASE
```

---

# 20. Dokumentácia

Každá významná funkcionalita musí byť zdokumentovaná.

Pri zmene:

- databázy,
- architektúry,
- importu,
- AI,

musia byť aktualizované príslušné dokumenty.

---

# 21. Checklist pred commitom

Pred každým commitom skontrolovať:

☐ aplikácia funguje

☐ neexistujú chyby JavaScriptu

☐ JSON je validný

☐ nevznikli duplicity

☐ dokumentácia je aktuálna

☐ commit správa má správny formát

☐ nové súbory sú zaradené do správnych priečinkov

---

# 22. Budúce rozšírenia

Developer Guide bude rozšírený o:

- CI/CD pipeline,
- automatické lintovanie,
- automatické testovanie,
- release workflow,
- generovanie dokumentácie,
- Docker prostredie,
- API štandardy,
- plugin systém.

---

# 23. Zásady dlhodobej údržby

Každá nová funkcionalita musí:

- byť modulárna,
- byť spätne kompatibilná,
- mať dokumentáciu,
- byť testovateľná,
- byť pripravená na ďalšie rozšírenie.

Technický dlh sa má minimalizovať priebežným refaktoringom, nie odkladaním problémov.

---

# 24. Súvisiace dokumenty

- `00_PROJECT_CONTEXT.md`
- `01_PROJECT_SPECIFICATION.md`
- `02_DATABASE_SPECIFICATION.md`
- `03_DATA_ENTRY_STANDARD.md`
- `04_UI_UX_SPECIFICATION.md`
- `05_TECHNICAL_ARCHITECTURE.md`
- `06_IMPORT_AND_EXPORT.md`
- `07_AI_ROADMAP.md`
- `09_MASTER_PROMPT.md`
- `10_CHANGELOG.md`

---

# Poznámka pre vývojárov a AI

VetPara Atlas je dlhodobý odborný projekt. Každá zmena by mala zlepšovať kvalitu, čitateľnosť a udržateľnosť systému. Pred implementáciou novej funkcionality je potrebné overiť, či je v súlade s architektúrou projektu, databázovou špecifikáciou a ostatnými dokumentmi.

Ak vznikne konflikt medzi implementáciou a dokumentáciou, **prednosť má dokumentácia**. Najprv sa aktualizuje dokumentácia a až následne implementácia.

---

**Koniec dokumentu**