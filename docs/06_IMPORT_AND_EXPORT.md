# 06_IMPORT_AND_EXPORT.md

> **Projekt:** VetPara Atlas
>
> **Dokument:** Špecifikácia importu a exportu dát
>
> **Verzia:** 1.0
>
> **Status:** Living document
>
> **Nadväzuje na:** `02_DATABASE_SPECIFICATION.md`, `03_DATA_ENTRY_STANDARD.md`, `05_TECHNICAL_ARCHITECTURE.md`

---

# Obsah

1. Úvod
2. Filozofia importu
3. Architektúra importného systému
4. Zdrojové formáty
5. Importný workflow
6. Validácia údajov
7. Import fotografií
8. Aktualizácia databázy
9. Export dát
10. Export obrázkov
11. Audit a logovanie
12. Budúce rozšírenia

---

# 1. Úvod

Jednou z hlavných úloh VetPara Atlasu je digitalizácia existujúcich odborných materiálov.

Importný systém zabezpečuje prevod údajov z rôznych zdrojov do jednotnej databázy JSON.

Každý import musí byť:

- opakovateľný,
- kontrolovateľný,
- validovaný,
- spätne dohľadateľný.

Import nikdy nesmie priamo meniť produkčnú databázu bez kontroly.

---

# 2. Filozofia importu

Import je rozdelený na tri fázy:

```
Zdroj

↓

Dočasné spracovanie

↓

Produkčná databáza
```

Každý údaj musí prejsť validáciou.

---

# 3. Architektúra importného systému

```
Zdrojové súbory

↓

Parser

↓

Normalizácia

↓

Kontrolované slovníky

↓

Validácia

↓

Náhľad importu

↓

Schválenie

↓

JSON databáza
```

---

# 4. Podporované zdrojové formáty

## Microsoft PowerPoint

Použitie:

- prezentácie
- výučbové materiály
- mikrofotografie

Podporovaný formát:

```
.pptx
```

Importované údaje:

- názov objektu
- fotografie
- text
- tabuľky
- poznámky (ak sú dostupné)

---

## Microsoft Excel

Použitie:

- mikrometria
- laboratórne tabuľky
- zoznamy objektov

Podporované formáty

```
.xlsx

.xls
```

Importujú sa:

- rozmery
- jednotky
- poznámky
- odkazy

---

## Microsoft Word

Použitie

- metodiky
- SOP
- odborné texty

Formáty

```
.docx
```

Importujú sa

- text
- tabuľky
- nadpisy

---

## PDF

Použitie

- publikácie
- články
- metodiky

Importuje sa

- text
- tabuľky
- obrázky (ak je to možné)

---

## Obrázky

Podporované formáty

```
jpg

jpeg

png

tif

tiff

webp
```

---

# 5. Importný workflow

Každý import prechádza rovnakým procesom.

```
Výber súboru

↓

Analýza

↓

Extrakcia údajov

↓

Normalizácia

↓

Kontrola slovníkov

↓

Validácia

↓

Náhľad

↓

Schválenie

↓

Uloženie
```

---

# 6. Normalizácia údajov

Pred uložením sa vykoná:

- odstránenie nadbytočných medzier,
- zjednotenie diakritiky,
- zjednotenie jednotiek,
- kontrola názvov,
- kontrola formátu dátumu.

---

# 7. Kontrolované slovníky

Počas importu sa všetky hodnoty porovnávajú so slovníkmi.

Príklady:

```
Hostitelia

Vzorky

Metódy

Štádiá

Tvary

Farby

Obaly
```

Ak hodnota neexistuje:

označí sa ako chyba.

---

# 8. Validácia

Kontrolujú sa:

## Povinné polia

- ID
- latinský názov
- hostiteľ
- vzorka
- štádium

---

## Rozmery

Kontrola:

- minimum ≤ maximum
- jednotka = µm

---

## Duplicity

Kontroluje sa:

- ID
- názov
- fotografie

---

## Taxonómia

Kontrola konzistencie.

---

# 9. Import fotografií

Každá fotografia dostane vlastné ID.

Príklad

```
IMG000001

IMG000002
```

Každá fotografia obsahuje metadáta.

```
Objekt

Hostiteľ

Vzorka

Metóda

Autor

Laboratórium

Dátum

Licencia

Popis
```

---

# 10. Organizácia fotografií

Adresárová štruktúra.

```
images/

dog/

toxocara_canis/

egg/

001.jpg

002.jpg

larva/

001.jpg

giardia/

cyst/

001.jpg
```

---

# 11. Import mikrometrie

Excel tabuľky sa importujú samostatne.

Výsledok.

```
lengthMin

lengthMax

widthMin

widthMax

unit
```

Nikdy sa neukladajú ako text.

---

# 12. Import literatúry

Každý zdroj dostane vlastné ID.

Príklad

```
REF000001
```

Importujú sa.

- autori
- rok
- názov
- časopis
- DOI
- ISBN

---

# 13. Aktualizácia databázy

Import nesmie prepísať existujúce údaje bez potvrdenia.

Možnosti:

- nový objekt
- aktualizovať
- preskočiť
- zlúčiť

---

# 14. Audit importu

Každý import vytvorí log.

Obsahuje.

- dátum
- používateľ
- počet objektov
- počet fotografií
- počet chýb
- čas importu

---

# 15. Chybové hlásenia

Každá chyba obsahuje.

- typ chyby
- objekt
- pole
- popis
- odporúčanie

Príklad.

```
ERROR

Pole sample obsahuje neznámu hodnotu.

"Feces"

Odporúčanie:

Použiť "Trus".
```

---

# 16. Export

Podporované formáty.

## JSON

Kompletná databáza.

---

## CSV

Tabuľkové spracovanie.

---

## PDF

Diagnostické karty.

---

## HTML

Statické stránky.

---

## Markdown

Dokumentácia.

---

# 17. Export diagnostickej karty

Každá karta obsahuje.

- názov
- fotografiu
- hostiteľa
- štádium
- rozmery
- diagnostické znaky
- diferenciálnu diagnostiku
- literatúru

---

# 18. Export galérie

Možnosti.

- ZIP
- PDF katalóg
- HTML galéria

---

# 19. Automatické zálohovanie

Pred každým importom.

```
backup/

2026-07-24/

database/

images/
```

Databáza sa nikdy neupravuje bez zálohy.

---

# 20. Budúce rozšírenia

Plánované.

- OCR import
- AI rozpoznanie tabuliek
- AI rozpoznanie fotografií
- import z LIMS
- import z API
- import z GBIF
- import z NCBI
- import z WoRMS
- import z Catalogue of Life

---

# 21. Výkonnostné požiadavky

Import:

- 100 objektov < 5 sekúnd
- 1 000 fotografií < 60 sekúnd

Export:

- JSON < 2 sekundy
- CSV < 2 sekundy
- PDF podľa počtu strán

---

# 22. Bezpečnostné pravidlá

Import nikdy:

- nemaže produkčné dáta,
- neprepíše existujúce ID bez potvrdenia,
- nevytvára duplicitné objekty,
- nemení kontrolované slovníky automaticky.

---

# 23. Súvisiace dokumenty

- `02_DATABASE_SPECIFICATION.md`
- `03_DATA_ENTRY_STANDARD.md`
- `05_TECHNICAL_ARCHITECTURE.md`
- `08_DEVELOPER_GUIDE.md`
- `10_CHANGELOG.md`

---

# 24. Poznámka pre vývojárov

Importný systém je navrhnutý ako samostatný modul nezávislý od používateľského rozhrania. V budúcnosti bude možné vytvoriť samostatnú desktopovú aplikáciu alebo CLI nástroj na dávkový import údajov bez potreby spúšťať samotný VetPara Atlas.

Každý import musí byť:

- reprodukovateľný,
- auditovateľný,
- vratný (rollback),
- plne zdokumentovaný.

Tým sa zabezpečí dlhodobá kvalita a spoľahlivosť databázy.

---

**Koniec dokumentu**