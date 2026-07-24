# 02_DATABASE_SPECIFICATION.md

> **Projekt:** VetPara Atlas
>
> **Dokument:** Databázová špecifikácia
>
> **Verzia:** 1.0
>
> **Status:** Living document
>
> **Nadväzuje na:** `00_PROJECT_CONTEXT.md`, `01_PROJECT_SPECIFICATION.md`

---

# Obsah

1. Úvod
2. Návrhové princípy
3. Databázová architektúra
4. Diagnostický objekt
5. Entity
6. Kontrolované slovníky
7. JSON štruktúra
8. Špecifikácia polí
9. Metadáta fotografií
10. Validácia údajov
11. Import dát
12. Verzionovanie
13. Budúce rozšírenia

---

# 1. Úvod

Databáza predstavuje jadro projektu VetPara Atlas.

Celá aplikácia je navrhnutá tak, aby bola **data-first** – používateľské rozhranie je iba vizualizáciou údajov uložených v databáze.

Databáza musí byť:

- konzistentná,
- normalizovaná,
- rozšíriteľná,
- ľahko importovateľná,
- jednoducho exportovateľná.

---

# 2. Návrhové princípy

Pri návrhu databázy platia tieto pravidlá.

## 2.1 Diagnostický objekt

Databáza neukladá iba biologické druhy.

Každý záznam predstavuje konkrétny diagnostický objekt.

Príklady:

- Toxocara canis – vajíčko
- Giardia intestinalis – cysta
- Demodex canis – dospelý jedinec
- Babesia canis – krvný náter

---

## 2.2 Jedna hodnota = jeden význam

Každá hodnota existuje iba raz.

Príklad:

Hostiteľ:

Pes

Nie:

- pes
- Pes domáci
- Canis familiaris

---

## 2.3 Kontrolované slovníky

Všetky opakujúce sa údaje sa ukladajú do samostatných slovníkov.

Napríklad:

- hostitelia
- vzorky
- diagnostické metódy
- taxonomické skupiny
- štádiá
- tvary

---

## 2.4 Rozšíriteľnosť

Nové druhy nesmú vyžadovať zmenu databázovej štruktúry.

---

# 3. Databázová architektúra

```text
database/

schema.json

dog.json

cat.json

horse.json

cattle.json

pig.json

sheep_goat.json

birds.json

dictionary/

hosts.json

samples.json

methods.json

stages.json

taxonomy.json

shapes.json

colours.json

shells.json
```

---

# 4. Diagnostický objekt

Každý objekt predstavuje jednu pozorovateľnú entitu.

Nie biologický druh.

Príklad:

Giardia intestinalis

↓

Cysta

je jeden objekt.

Trofzoit môže byť ďalší objekt.

---

# 5. Entity

## Diagnostický objekt

Obsahuje kompletné informácie.

## Hostiteľ

Jednotný zoznam hostiteľov.

## Vzorka

Jednotný zoznam typov vzoriek.

## Diagnostická metóda

Jednotný zoznam laboratórnych metód.

## Fotografia

Každý obrázok je samostatný objekt.

## Literatúra

Každý zdroj má vlastný identifikátor.

---

# 6. Kontrolované slovníky

Budú existovať samostatné JSON súbory.

## hosts.json

Príklad

```json
[
  "Pes",
  "Mačka",
  "Kôň",
  "Ovca",
  "Koza",
  "Hovädzí dobytok"
]
```

---

## samples.json

```json
[
  "Trus",
  "Krv",
  "Koža",
  "Moč",
  "Sérum",
  "Srsť",
  "Biopsia"
]
```

---

## methods.json

```json
[
  "Flotácia",
  "Sedimentácia",
  "Baermannova metóda",
  "Knottov test",
  "PCR",
  "ELISA",
  "Mikroskopia"
]
```

---

## stages.json

```json
[
  "Vajíčko",
  "Larva",
  "Oocysta",
  "Cysta",
  "Trofzoit",
  "Dospelý jedinec"
]
```

---

# 7. JSON štruktúra

Každý diagnostický objekt používa jednotnú schému.

```json
{
  "id": "",
  "latinName": "",
  "slovakName": "",
  "taxonomy": {},
  "host": [],
  "sample": "",
  "stage": "",
  "group": "",
  "methods": [],
  "micrometry": {},
  "morphology": {},
  "diagnosticSigns": [],
  "differentialDiagnosis": [],
  "lifeCycle": "",
  "pathology": "",
  "zoonosis": false,
  "images": [],
  "references": [],
  "notes": ""
}
```

---

# 8. Špecifikácia polí

## id

Interný identifikátor.

Pravidlá:

- malé písmená
- bez diakritiky
- podčiarkovníky

Príklad

```
toxocara_canis_egg
```

---

## latinName

Úplný latinský názov.

Príklad

```
Toxocara canis
```

---

## slovakName

Oficiálny slovenský názov.

Ak neexistuje, pole ostáva prázdne.

---

## taxonomy

Obsahuje

- kingdom
- phylum
- class
- order
- family
- genus
- species

---

## host

Pole hostiteľov.

```json
[
  "Pes"
]
```

---

## sample

Typ vzorky.

Príklad

```
Trus
```

---

## stage

Diagnostické štádium.

Príklad

```
Vajíčko
```

---

## methods

Pole odporúčaných metód.

Príklad

```json
[
  "Flotácia",
  "PCR"
]
```

---

## micrometry

```json
{
    "lengthMin":75,
    "lengthMax":90,
    "widthMin":65,
    "widthMax":75,
    "unit":"µm"
}
```

---

## morphology

Obsahuje

- shape
- colour
- shell
- operculum
- contents
- texture
- remarks

---

## diagnosticSigns

Pole charakteristických znakov.

Každý znak tvorí samostatnú položku.

---

## differentialDiagnosis

Pole podobných objektov.

---

## images

Pole ID obrázkov.

Nie názvy súborov.

---

## references

Pole ID literatúry.

---

## notes

Lokálne poznámky.

---

# 9. Metadáta fotografií

Každý obrázok obsahuje.

```json
{
    "id":"",
    "objectId":"",
    "author":"",
    "laboratory":"",
    "year":"",
    "host":"",
    "sample":"",
    "stage":"",
    "method":"",
    "objective":"",
    "magnification":"",
    "license":"",
    "filename":"",
    "description":""
}
```

---

# 10. Validácia údajov

Databáza bude kontrolovať.

Povinné polia

- id
- latinName
- sample
- stage

Jednotky

- µm

Duplicitné ID

Neprípustné.

Neznáme hodnoty

Musia byť označené ako:

```
null
```

Nie:

```
?
```

ani

```
Neznáme
```

---

# 11. Import dát

Zdrojové súbory.

- PowerPoint
- Excel
- Word
- PDF

Importný proces.

```
Zdroj

↓

Parser

↓

Normalizácia

↓

Validácia

↓

JSON

↓

Kontrola

↓

Databáza
```

---

# 12. Verzionovanie

Každý objekt obsahuje.

```json
{
    "created":"",
    "modified":"",
    "version":"1.0"
}
```

---

# 13. Budúce rozšírenia

Databáza je pripravená na pridanie.

- AI skóre podobnosti
- OCR výsledkov
- automatickej mikrometrie
- GIS údajov
- epidemiologických dát
- prepojenia na LIMS
- viacerých jazykov
- laboratórnych protokolov
- molekulárnych markerov
- sekvencií DNA

Bez potreby meniť základnú štruktúru databázy.

---

# Súvisiace dokumenty

- 00_PROJECT_CONTEXT.md
- 01_PROJECT_SPECIFICATION.md
- 03_DATA_ENTRY_STANDARD.md
- 05_TECHNICAL_ARCHITECTURE.md

---

# Poznámka pre vývojárov

Táto špecifikácia opisuje **logický model databázy**, nie jej fyzickú implementáciu.

Konkrétne súbory (`dog.json`, `hosts.json`, `methods.json` atď.) musia vždy rešpektovať pravidlá definované v tomto dokumente. V prípade potreby nových polí sa databáza rozširuje spätne kompatibilným spôsobom, aby zostali funkčné existujúce importy, exporty aj aplikácia.

---
**Koniec dokumentu**