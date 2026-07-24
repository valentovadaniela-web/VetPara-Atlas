# 04_UI_UX_SPECIFICATION.md

> **Projekt:** VetPara Atlas
>
> **Dokument:** Špecifikácia používateľského rozhrania (UI) a používateľskej skúsenosti (UX)
>
> **Verzia:** 1.0
>
> **Status:** Living document
>
> **Nadväzuje na:** `00_PROJECT_CONTEXT.md`, `01_PROJECT_SPECIFICATION.md`, `02_DATABASE_SPECIFICATION.md`

---

# Obsah

1. Úvod
2. Dizajnová filozofia
3. Cieľové skupiny
4. Dizajnové princípy
5. Informačná architektúra
6. Navigácia
7. Obrazovky aplikácie
8. Komponenty
9. Vyhľadávanie
10. Filtre
11. Detail diagnostického objektu
12. Galéria
13. Diagnostický expert
14. Responsívny dizajn
15. Prístupnosť
16. Farebná schéma
17. Typografia
18. Ikony
19. Animácie
20. Budúce rozšírenia

---

# 1. Úvod

Používateľské rozhranie VetPara Atlasu musí podporovať odbornú diagnostickú prácu.

Rozhranie nesmie používateľa rozptyľovať.

Musí byť:

- rýchle,
- jednoduché,
- konzistentné,
- čitateľné,
- použiteľné aj počas laboratórnej práce.

---

# 2. Dizajnová filozofia

Pri návrhu UI platia štyri základné pravidlá.

## Odbornosť

Aplikácia pôsobí ako laboratórny nástroj.

Nie ako marketingová stránka.

---

## Jednoduchosť

Používateľ nájde informáciu maximálne na tri kliknutia.

---

## Konzistentnosť

Každý komponent sa správa rovnako.

Rovnaké farby.

Rovnaké ikony.

Rovnaké ovládanie.

---

## Čitateľnosť

Najdôležitejšie sú údaje.

Nie grafické efekty.

---

# 3. Cieľové skupiny

Rozhranie je navrhnuté pre:

- laboratórnych diagnostikov,
- veterinárnych lekárov,
- študentov,
- výskumníkov.

Skúsenosti používateľov môžu byť veľmi rozdielne.

Rozhranie preto nesmie vyžadovať školenie.

---

# 4. Dizajnové princípy

Používajú sa princípy:

- mobile first,
- responsive design,
- progressive enhancement,
- accessibility first.

---

# 5. Informačná architektúra

```
Dashboard

│

├── Atlas

│     ├── Hostitelia

│     ├── Skupiny

│     ├── Vyhľadávanie

│

├── Diagnostický expert

│

├── Galéria

│

├── Porovnanie

│

├── Literatúra

│

├── Nastavenia

│

└── O projekte
```

---

# 6. Hlavná navigácia

Horný panel obsahuje:

- Logo
- Dashboard
- Atlas
- Diagnostický expert
- Galéria
- Nastavenia

Na mobiloch:

Hamburger menu.

---

# 7. Dashboard

Dashboard predstavuje úvodnú obrazovku.

Obsahuje:

- počet diagnostických objektov,
- počet fotografií,
- počet hostiteľov,
- posledné aktualizácie,
- rýchle vyhľadávanie,
- najčastejšie používané položky.

---

# 8. Atlas

Atlas zobrazuje databázu.

Podporované zobrazenia:

## Zoznam

Najrýchlejšie.

Vhodné na vyhľadávanie.

---

## Karty

Každý objekt je samostatná karta.

Obsahuje:

- fotografiu,
- názov,
- skupinu,
- hostiteľa.

---

## Galéria

Veľké náhľady fotografií.

Určená na vizuálne porovnávanie.

---

# 9. Vyhľadávanie

Vyhľadávací panel je dostupný na každej stránke.

Podporuje:

- latinské názvy,
- slovenské názvy,
- synonymá,
- ID objektu.

Vyhľadávanie prebieha okamžite počas písania.

---

# 10. Filtre

Možné filtre:

## Hostiteľ

- Pes
- Mačka
- Kôň
- ...

---

## Skupina

- Protozoa
- Nematoda
- Cestoda
- Trematoda
- Arthropoda

---

## Vzorka

- Trus
- Krv
- Koža
- Moč
- Sérum

---

## Diagnostické štádium

- Vajíčko
- Larva
- Cysta
- Oocysta
- Trofozoit
- Dospelý jedinec

---

## Diagnostická metóda

- Flotácia
- Sedimentácia
- PCR
- ELISA
- Knottov test

---

## Zoonóza

Áno / Nie

---

# 11. Detail diagnostického objektu

Každý objekt obsahuje sekcie.

## Základné údaje

- názov,
- hostiteľ,
- vzorka,
- štádium.

---

## Taxonómia

Kompletný taxonomický strom.

---

## Mikrometria

Tabuľka rozmerov.

---

## Morfológia

Opis.

Podporovaný fotografiami.

---

## Diagnostické znaky

Zoznam najdôležitejších znakov.

---

## Diferenciálna diagnostika

Podobné objekty.

---

## Fotografie

Galéria.

---

## Literatúra

Použitá odborná literatúra.

---

# 12. Galéria

Fotografie možno filtrovať podľa:

- hostiteľa,
- objektu,
- metódy,
- zväčšenia,
- autora.

Kliknutím sa fotografia otvorí vo väčšom zobrazení.

---

# 13. Diagnostický expert

Najdôležitejší budúci modul.

Používateľ zadáva:

Hostiteľ

↓

Vzorka

↓

Veľkosť

↓

Tvar

↓

Farba

↓

Obal

↓

Štádium

↓

Diagnostická metóda

↓

Výsledok

Systém zobrazí najpravdepodobnejšie objekty zoradené podľa podobnosti.

---

# 14. Porovnanie objektov

Používateľ môže porovnať dva alebo viac objektov.

Porovnávajú sa:

- rozmery,
- tvar,
- obal,
- obsah,
- fotografie,
- diagnostické znaky.

---

# 15. Responsívny dizajn

Podporované zariadenia.

Desktop

Notebook

Tablet

Mobil

Šírka:

≥ 320 px

---

# 16. Prístupnosť (Accessibility)

Cieľ:

WCAG 2.1 AA

Požiadavky:

- dostatočný kontrast,
- ovládanie klávesnicou,
- ALT texty obrázkov,
- správna hierarchia nadpisov,
- viditeľný fokus,
- čitateľné písmo.

---

# 17. Farebná schéma

Primárna farba

Tmavomodrá

Sekundárna

Zelená

Varovanie

Oranžová

Chyba

Červená

Úspech

Zelená

Pozadie

Biela

Dark mode

Tmavosivá.

Farby budú definované pomocou CSS premenných.

---

# 18. Typografia

Predvolený font:

Inter

Alternatíva:

Roboto

Veľkosti:

Nadpis 1

36 px

Nadpis 2

30 px

Nadpis 3

24 px

Text

16 px

Poznámky

14 px

---

# 19. Ikony

Používa sa jedna ikonová knižnica.

Odporúčaná:

Bootstrap Icons

alebo

Font Awesome.

Ikony musia mať jednotný štýl.

---

# 20. Tmavý režim

Aplikácia podporuje:

- Light mode
- Dark mode

Prepínanie bez obnovenia stránky.

---

# 21. Animácie

Používajú sa iba jemné animácie.

Povolené:

- fade,
- slide,
- hover,
- loading.

Nepoužívať:

- blikajúce prvky,
- zbytočné animácie,
- parallax efekty.

---

# 22. Výkon používateľského rozhrania

Požiadavky:

- prvé načítanie do 2 sekúnd,
- okamžité filtrovanie,
- minimálne prekresľovanie stránky,
- načítanie obrázkov až pri potrebe (lazy loading).

---

# 23. Budúce rozšírenia

Plánované funkcie:

- označenie obľúbených objektov,
- história vyhľadávania,
- poznámky používateľa,
- tlač diagnostickej karty,
- export fotografie,
- AI rozpoznanie z obrázka,
- režim výučby,
- režim skúšania študentov.

---

# 24. UX zásady

Každá nová funkcia musí odpovedať na otázku:

**Pomôže používateľovi diagnostikovať objekt rýchlejšie alebo presnejšie?**

Ak nie, funkcia nebude implementovaná.

---

# Súvisiace dokumenty

- `00_PROJECT_CONTEXT.md`
- `01_PROJECT_SPECIFICATION.md`
- `02_DATABASE_SPECIFICATION.md`
- `03_DATA_ENTRY_STANDARD.md`
- `05_TECHNICAL_ARCHITECTURE.md`
- `08_DEVELOPER_GUIDE.md`

---

# Poznámka pre vývojárov

Používateľské rozhranie musí zostať oddelené od dátovej vrstvy. Všetky údaje sa načítavajú z JSON databázy a komponenty ich iba zobrazujú. Rozhranie nesmie obsahovať napevno zapísané odborné údaje, aby bolo možné databázu aktualizovať bez úprav aplikácie.

---
**Koniec dokumentu**