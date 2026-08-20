# 02_DATABASE_SPECIFICATION.md

> **Projekt:** VetPara Atlas
>
> **Dokument:** Databázová špecifikácia
>
> **Verzia:** 1.1
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

> **Zmena od v1.1 (2026-08-18):** pôvodná architektúra "jeden súbor na hostiteľa"
> (`dog.json`, `cat.json`, `horse.json` ...) bola nahradená jedným zlúčeným
> a deduplikovaným súborom `database/parasites.json`. Pôvodné súbory
> `*.migrated.json` zostávajú dočasne zachované ako záložný zdroj pravdy
> (pozri `AI_STATUS.md` §0), kým nie je kódová migrácia plne overená
> v prehliadači — potom sa presunú do `_archive/`. Nové diagnostické objekty
> sa odteraz zapisujú **iba** do `parasites.json`.

```text
database/

parasites.json         ← jediný zdroj diagnostických objektov (nahrádza dog.json,
                          cat.json, horse.json, cattle.json, pig.json,
                          sheep_goat.json, birds.json a ďalšie host-súbory)

images.json             ← jediný zdroj metadát fotografií (pozri sekciu 9)

dictionary/

  host_hierarchy.json    ← stromová/reťaziteľná hierarchia hostiteľských skupín
                            (napr. Plazy → Jaštery → Varan), zdroj pre rozbaľovanie
                            poľa hostGroups na konkrétnych hostiteľov
  samples.json
  methods.json
  stages.json
  taxonomy.json
  shapes.json
  colours.json
  shells.json

_archive/

  dog.migrated.json, cat.migrated.json, ... (14×)   ← staré host-súbory,
                            zachované len do overenia migrácie, NEPOUŽÍVAJÚ SA appkou
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

Jednotný zoznam hostiteľov, usporiadaný do hierarchie skupín
(`dictionary/host_hierarchy.json`) — pozri sekciu 8, `hostGroups`/`hosts`.

## Vzorka

Jednotný zoznam typov vzoriek.

## Diagnostická metóda

Jednotný zoznam laboratórnych metód.

## Fotografia

Každý obrázok je samostatný objekt, uložený v `database/images.json`.

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

## host_hierarchy.json

> **Nové od v1.1.** Nahrádza plochý `hosts.json` tam, kde je potrebné vyjadriť
> vzťah nadradenej skupiny a konkrétnych hostiteľov (napr. pri objektoch,
> ktoré sa diagnostikujú rovnako naprieč celou skupinou hostiteľov).
>
> ⚠️ **Opravené 2026-08-18 (kontrola kódu):** táto sekcia predtým (v1.1,
> prvý zápis) popisovala nesprávnu štruktúru (`{"Skupina": ["dieťa1",
> "dieťa2"]}`). Po nahliadnutí do skutočnej implementácie
> (`Repository.isHostInGroup()`, `AtlasPage.getTopLevelGroup()`) je zjavné,
> že kód očakáva **plochú mapu dieťa → rodič**, nie mapu rodič → [deti].
> Príklad nižšie je opravený podľa kódu. **Samotný `host_hierarchy.json`
> nebol tomuto AI nikdy nahraný** — štruktúra je odvodená z toho, ako s ním
> pracuje kód, nie potvrdená priamo zo súboru. Pred ďalšou zmenou pošli
> reálny obsah súboru na overenie.

Každý kľúč je meno hostiteľa alebo podskupiny, hodnota je meno jeho
**priamej nadradenej skupiny** (reťazí sa cez viacero úrovní smerom nahor,
až kým sa nenarazí na meno, ktoré už v slovníku ako kľúč nie je):

```json
{
  "Pes": "Mäsožravce",
  "Mačka": "Mäsožravce",
  "Varan": "Jaštery",
  "Leguán": "Jaštery",
  "Gekon": "Jaštery",
  "Jaštery": "Plazy",
  "Hady": "Plazy",
  "Korytnačky": "Plazy"
}
```

Rozbaľovanie skupiny na konkrétnych hostiteľov (napr. `Plazy` → `Varan`,
`Leguán`, `Gekon`, `Hady`, `Korytnačky`) prechádza **všetky kľúče** slovníka
a pre každý testuje, či sa pri postupnom prechode reťazcom rodičov narazí na
hľadanú skupinu (`Repository.isHostInGroup()`). Toto je vecou aplikačnej
logiky (`Repository.resolveHosts()`), nie dátovej štruktúry — slovník iba
definuje vzťahy dieťa→rodič.

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

> **Zmena od v1.1 (2026-08-18):** pole `host: []` bolo nahradené trojicou
> `hostGroups`/`hosts`/`hostNotes` (pozri sekciu 8) a bolo pridané pole
> `synonyms`. Toto je zmena významu existujúceho poľa v zmysle
> `03_DATA_ENTRY_STANDARD.md` §20 — zapísaná aj v `10_CHANGELOG.md`.

```json
{
  "id": "",
  "latinName": "",
  "synonyms": [],
  "slovakName": "",
  "taxonomy": {},
  "hostGroups": [],
  "hosts": [],
  "hostNotes": {},
  "sample": "",
  "stage": "",
  "group": "",
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

## synonyms

> **Nové pole od v1.1.**

Pole alternatívnych/synonymných latinských názvov diagnostického objektu
(napr. staršie taxonomické označenie). Používa sa aj vo fulltextovom
vyhľadávaní (`AtlasPage.matchesFulltext()`), aby sa objekt našiel aj pod
starším názvom.

Príklad

```json
["Diphyllobothrium latum"]
```

pre objekt s `id: "dibothriocephalus_latus_egg"`.

Ak objekt nemá synonymá, pole ostáva prázdne `[]` — nie `null`.

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

## hostGroups

> **Nové pole od v1.1. Nahrádza časť pôvodnej funkcie poľa `host`.**

Pole názvov hostiteľských **skupín** z `dictionary/host_hierarchy.json`
(napr. `"Mäsožravce"`, `"Plazy"`). Skupina sa pri zobrazení dynamicky
rozbaľuje na konkrétnych hostiteľov cez `Repository.resolveHosts()`.

Príklad

```json
["Mäsožravce"]
```

**Pravidlo:** `hostGroups` sa smie použiť **iba** vtedy, keď je diagnostický
nález identický u všetkých členov skupiny, a to len po explicitnom
potvrdení autorkou projektu alebo na základe silného dôkazu (identické
zdrojové dáta naprieč celou skupinou). Toto pole sa **nikdy nesmie
automaticky odvodiť** — pozri `AI_STATUS.md` §0.4. Vo väčšine prípadov
ostáva prázdne `[]` a hostitelia sa uvádzajú explicitne v poli `hosts`.

---

## hosts

> **Zmenené od v1.1** — predtým `host`.

Pole konkrétnych, explicitne vymenovaných hostiteľov (nie skupín).

```json
[
  "Pes"
]
```

Ak má objekt priradenú aspoň jednu hodnotu v `hostGroups`, výsledný zoznam
hostiteľov zobrazovaný v UI je **zjednotenie** (union) rozbaleného
`hostGroups` a explicitného `hosts` (funkcia `resolveHosts()`) — nie iba
jedno z nich.

---

## hostNotes

> **Nové pole od v1.1.**

Objekt (mapa) s poznámkami špecifickými pre jedného konkrétneho hostiteľa
z `hosts`/rozbaleného `hostGroups` — napr. odchýlka v mikrometrii alebo
klinickom priebehu u daného druhu.

```json
{
  "Mačka": "U mačky mierne menšie rozmery cysty ako uvádza priemer."
}
```

Kľúč musí byť názov hostiteľa presne podľa `dictionary/host_hierarchy.json`
alebo `hosts.json`. Ak nie sú žiadne poznámky, pole ostáva prázdny objekt
`{}`.

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

> **Vypustené od v1.1 (2026-08-20, rozhodnutie autorky, `AI_STATUS.md` §0.7):**
> pole sa formálne vynecháva zo schémy aj z formulára (0/474 reálnych
> záznamov ho malo vyplnené). Konečné zjednodušenie, nie dočasný stav.

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

> **Zmena od v1.1 (2026-08-20, rozhodnutie autorky, `AI_STATUS.md` §0.7):**
> polia `operculum`, `contents`, `texture`, `remarks` boli formálne
> vypustené zo schémy (nepoužívali sa v žiadnom z 474 reálnych záznamov).
> Nie je to dočasné — konečné zjednodušenie.

Obsahuje

- shape
- colour
- shell

---

## diagnosticSigns

Pole charakteristických znakov.

Každý znak tvorí samostatnú položku.

---

## differentialDiagnosis

Pole podobných objektov.

---

## images

Pole ID obrázkov (referencie na `database/images.json`).

Nie názvy súborov.

---

## references

Pole ID literatúry.

---

## notes

Lokálne poznámky.

---

# 9. Metadáta fotografií

> **Zmena od v1.1:** fotografie sa ukladajú do samostatného súboru
> `database/images.json` (zatiaľ prázdna kostra `[]` — appka doteraz
> nemala žiadne reálne fotografie). Schéma jednotlivého záznamu ostáva
> nezmenená oproti v1.0. Plánovaná stránka Galéria filtruje podľa
> `objectId` (referencia na diagnostický objekt v `parasites.json`) a
> voliteľne podľa `host`.
>
> ⚠️ **Otvorená otázka, neoverené:** v komunikácii o Galérii bol použitý aj
> názov poľa `parasiteId` namiesto `objectId`. Keďže `images.json` v tejto
> session nebol nahraný, ponechávam pôvodný, už zdokumentovaný názov
> `objectId` — pred implementáciou stránky Galéria potvrď, ktorý názov poľa
> sa má reálne použiť, aby nedošlo k nesúladu medzi kódom a dátami.

> **Zmena od v1.1 (2026-08-20, `AI_STATUS.md` §0.7 / Priorita č. 3):**
> `license` bolo v dokumentácii, ale nepoužívalo sa v žiadnom z 33 reálnych
> záznamov — vypustené zo schémy (rozhodnutie autorky). Naopak `thumbnail`,
> `isPrimary`, `sortOrder` reálne existujú vo všetkých 33 záznamoch a
> používa ich appka (`GalleryPage.js`, `PrimaryImage.js`) aj admin
> formulár — doplnené do schémy nižšie.
>
> Pole `host` je v praxi **voliteľné**, nie povinné: prázdny reťazec
> znamená "fotka platí pre všetkých hostiteľov objektu" — zámerná
> konvencia zakódovaná v `GalleryPage.getFilteredImages()`
> (pozri `AI_STATUS.md` §0.3).

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
    "filename":"",
    "thumbnail":"",
    "isPrimary":false,
    "sortOrder":0,
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

Konkrétny súbor (`parasites.json`) musí vždy rešpektovať pravidlá definované v tomto dokumente. V prípade potreby nových polí sa databáza rozširuje spätne kompatibilným spôsobom, aby zostali funkčné existujúce importy, exporty aj aplikácia.

---
**Koniec dokumentu**
