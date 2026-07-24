# 01_PROJECT_SPECIFICATION.md

> **Projekt:** VetPara Atlas
>
> **Dokument:** Funkčná špecifikácia projektu
>
> **Verzia:** 1.0
>
> **Status:** Living document
>
> **Nadväzuje na:** `00_PROJECT_CONTEXT.md`

---

# Obsah

1. Úvod
2. Ciele projektu
3. Rozsah projektu
4. Cieľové skupiny
5. Hlavné princípy
6. Funkčné moduly
7. Databázový model
8. Diagnostický model
9. Pracovný postup používateľa
10. Architektúra aplikácie
11. MVP
12. Roadmap
13. Budúci vývoj
14. Nefunkčné požiadavky
15. Kritériá úspechu

---

# 1. Úvod

VetPara Atlas je moderná webová aplikácia určená pre veterinárnu parazitológiu.

Projekt vzniká ako odborná platforma pre:

- veterinárne laboratóriá,
- veterinárnych lekárov,
- diagnostikov,
- študentov,
- univerzity,
- výskumné pracoviská.

Primárnym cieľom nie je vytvoriť atlas obrázkov, ale profesionálny diagnostický informačný systém.

---

# 2. Ciele projektu

## Primárne ciele

- vytvoriť jednotnú databázu diagnostických objektov,
- umožniť rýchlu identifikáciu parazitov,
- podporiť laboratórnu diagnostiku,
- digitalizovať existujúce odborné materiály,
- vytvoriť dlhodobo rozšíriteľný systém.

## Sekundárne ciele

- podpora výučby,
- zdieľanie odborných poznatkov,
- štandardizácia terminológie,
- jednoduchá aktualizácia údajov,
- budúca AI diagnostika.

---

# 3. Rozsah projektu

Projekt bude pokrývať:

## Taxonomické skupiny

- Protozoa
- Nematoda
- Cestoda
- Trematoda
- Arthropoda
- Krvné parazity

## Hostitelia

Verzia 1.0

- Pes

Budúce verzie

- Mačka
- Kôň
- Hovädzí dobytok
- Ovca
- Koza
- Ošípaná
- Hydina
- Exotické zvieratá

---

# 4. Cieľové skupiny

## Primárni používatelia

- veterinárni diagnostici
- laboratórni technici
- veterinárni lekári

## Sekundárni používatelia

- študenti
- pedagógovia
- výskumní pracovníci

---

# 5. Hlavné princípy

Projekt je navrhnutý podľa nasledujúcich princípov.

## Odbornosť

Každý údaj musí byť odborne overiteľný.

## Konzistentnosť

Všetky údaje používajú jednotnú terminológiu.

## Rozšíriteľnosť

Architektúra musí umožniť pridanie nových druhov bez zásadných zmien.

## Jednoduchosť

Používateľ musí nájsť výsledok v čo najmenšom počte krokov.

---

# 6. Funkčné moduly

## Modul 1 – Dashboard

Úvodná obrazovka.

Obsahuje:

- počet diagnostických objektov,
- počet fotografií,
- posledné aktualizácie,
- obľúbené položky,
- rýchle vyhľadávanie.

---

## Modul 2 – Atlas

Zobrazuje všetky diagnostické objekty.

Možnosti:

- zoznam
- karta
- galéria

Každý objekt obsahuje kompletné odborné informácie.

---

## Modul 3 – Detail objektu

Obsahuje:

- názov,
- taxonómiu,
- hostiteľov,
- vzorku,
- diagnostické štádium,
- mikrometriu,
- morfológiu,
- fotografie,
- diagnostické znaky,
- diferenciálnu diagnostiku,
- odporúčanú metódu,
- literatúru,
- poznámky.

---

## Modul 4 – Vyhľadávanie

Vyhľadávanie podľa:

- názvu,
- hostiteľa,
- vzorky,
- štádia,
- taxonomickej skupiny.

Budúce filtre:

- veľkosť,
- farba,
- tvar,
- obal,
- metóda,
- zoonóza.

---

## Modul 5 – Galéria

Fotografie budú zobraziteľné:

- podľa druhu,
- podľa hostiteľa,
- podľa štádia,
- podľa vzorky,
- podľa diagnostickej metódy.

Každá fotografia obsahuje metadáta.

---

## Modul 6 – Diagnostický expert

Používateľ nebude vyberať názov.

Zadá vlastnosti objektu.

Príklad:

Vzorka

↓

Trus

↓

Veľkosť

↓

80 µm

↓

Tvar

↓

Guľatý

↓

Obal

↓

Hrubý

↓

Výsledok

↓

Najpravdepodobnejšie druhy

---

## Modul 7 – Porovnanie

Používateľ vyberie dva objekty.

Aplikácia zobrazí:

- spoločné znaky,
- rozdiely,
- diagnostické odporúčania.

---

## Modul 8 – Export

Možnosti:

- JSON
- CSV
- PDF

---

## Modul 9 – Nastavenia

Budú obsahovať:

- jazyk,
- tmavý režim,
- veľkosť písma,
- predvolené filtre.

---

# 7. Databázový model

Databáza je založená na diagnostických objektoch.

Nie na biologických druhoch.

Príklad:

Giardia intestinalis – cysta

je samostatný objekt.

Strongyloides stercoralis – larva

je ďalší objekt.

To umožňuje presnejšie vyhľadávanie.

---

# 8. Diagnostický model

Používateľ identifikuje objekt podľa:

- hostiteľa,
- vzorky,
- diagnostickej metódy,
- vývojového štádia,
- veľkosti,
- tvaru,
- farby,
- morfológie.

Systém následne vyhodnotí najpravdepodobnejšie výsledky.

---

# 9. Pracovný postup používateľa

## Diagnostika

Otvorenie aplikácie

↓

Výber hostiteľa

↓

Výber vzorky

↓

Filtrovanie

↓

Výber objektu

↓

Porovnanie fotografie

↓

Diagnostické znaky

↓

Výsledok

---

# 10. Architektúra aplikácie

Frontend

- HTML5
- CSS3
- Bootstrap 5
- JavaScript ES6

Databáza

- JSON

Hosting

- GitHub Pages

Budúcnosť

- PWA
- AI
- LIMS

---

# 11. MVP (Minimum Viable Product)

Prvá verzia bude obsahovať:

- databázu psa,
- približne 50 diagnostických objektov,
- vyhľadávanie,
- filtre,
- detail objektu,
- galériu,
- základný export.

---

# 12. Roadmap

## Verzia 0.1

- databáza
- import
- základná aplikácia

## Verzia 0.2

- detail objektu
- galéria

## Verzia 0.3

- diagnostický expert

## Verzia 0.4

- export

## Verzia 1.0

- stabilná verzia pre psa

## Verzia 2.0

- ďalší hostitelia
- PWA
- AI

---

# 13. Budúci vývoj

Plánované moduly:

- AI rozpoznávanie z fotografie,
- automatická mikrometria,
- OCR,
- LIMS integrácia,
- štatistiky laboratória,
- školiaci režim,
- testovanie študentov,
- synchronizácia používateľov.

---

# 14. Nefunkčné požiadavky

## Výkon

Načítanie aplikácie do 2 sekúnd.

## Dostupnosť

Fungovanie bez internetu (PWA).

## Prenositeľnosť

Podpora:

- Windows
- Linux
- macOS
- Android
- iOS

## Prístupnosť

Cieľ:

WCAG 2.1 AA.

## Bezpečnosť

Žiadne údaje používateľa sa neposielajú na server.

---

# 15. Kritériá úspechu

Projekt bude považovaný za úspešný, ak:

- databáza bude odborne správna,
- vyhľadávanie bude intuitívne,
- architektúra umožní jednoduché rozširovanie,
- aplikácia bude použiteľná v laboratórnej diagnostike,
- dokumentácia bude kompletná a aktuálna.

---

# Príloha A – Rozhodnutia prijaté počas návrhu

- Projekt bude postavený ako statická webová aplikácia.
- Primárnym úložiskom údajov budú JSON súbory.
- Prvá verzia bude zameraná na diagnostické objekty psa.
- Zdrojom údajov budú odborné prezentácie, Excel súbory, metodiky a fotografie.
- Databáza bude navrhnutá tak, aby sa dala rozšíriť bez zmeny architektúry.

---

# Príloha B – Súvisiace dokumenty

- `00_PROJECT_CONTEXT.md`
- `02_DATABASE_SPECIFICATION.md`
- `03_DATA_ENTRY_STANDARD.md`
- `04_UI_UX_SPECIFICATION.md`
- `05_TECHNICAL_ARCHITECTURE.md`
- `06_IMPORT_AND_EXPORT.md`
- `07_AI_ROADMAP.md`
- `08_DEVELOPER_GUIDE.md`
- `09_MASTER_PROMPT.md`
- `10_CHANGELOG.md`

---
**Koniec dokumentu**