# 03_DATA_ENTRY_STANDARD.md

> **Projekt:** VetPara Atlas
>
> **Dokument:** Štandard zadávania údajov
>
> **Verzia:** 1.0
>
> **Status:** Living document
>
> **Nadväzuje na:** `00_PROJECT_CONTEXT.md`, `01_PROJECT_SPECIFICATION.md`, `02_DATABASE_SPECIFICATION.md`

---

# Obsah

1. Účel dokumentu
2. Základné princípy
3. Pravidlá zápisu
4. Názvoslovie
5. Štandard pre diagnostické objekty
6. Štandard pre taxonómiu
7. Štandard pre hostiteľov
8. Štandard pre vzorky
9. Štandard pre diagnostické metódy
10. Štandard pre mikrometriu
11. Štandard pre morfológiu
12. Štandard pre fotografie
13. Štandard pre literatúru
14. Pravidlá kontroly kvality
15. Zakázané hodnoty
16. Checklist pri vytváraní záznamu

---

# 1. Účel dokumentu

Tento dokument definuje jednotné pravidlá zapisovania údajov do databázy VetPara Atlas.

Jeho cieľom je zabezpečiť:

- jednotnosť údajov,
- jednoduché filtrovanie,
- bezchybný import,
- konzistentnosť databázy,
- jednoduchú údržbu.

Tieto pravidlá platia pre všetky budúce záznamy.

---

# 2. Základné princípy

Pri zadávaní údajov vždy platí:

- jeden údaj = jeden význam,
- jedna hodnota = jeden zápis,
- žiadne synonymá v databáze,
- žiadne voľné texty tam, kde existuje kontrolovaný slovník,
- všetky údaje musia byť overiteľné.

---

# 3. Všeobecné pravidlá zápisu

## Text

- používa sa správna diakritika,
- bez nadbytočných medzier,
- prvé písmeno veľké iba tam, kde je to gramaticky správne.

Správne:

```
Pes
```

Nesprávne

```
pes
PES
Pes 
 Pes
```

---

## Prázdne hodnoty

Ak údaj nie je známy:

```
null
```

Nepoužívať:

```
?
-
Neznáme
N/A
```

---

## Jednotky

Jednotka sa nikdy nepíše do číselného poľa.

Správne

```
lengthMin = 75
unit = "µm"
```

Nesprávne

```
75 µm
```

---

# 4. Názvoslovie

## Latinské názvy

Používa sa aktuálne platná taxonómia.

Príklad

```
Toxocara canis
```

Nie

```
TOXOCARA CANIS
toxocara canis
```

---

## Slovenské názvy

Používajú sa iba oficiálne alebo odborne zaužívané názvy.

Ak názov neexistuje:

```
null
```

---

## ID objektov

Pravidlá

- malé písmená,
- bez diakritiky,
- podčiarkovníky,
- bez medzier.

Príklady

```
toxocara_canis_egg

giardia_intestinalis_cyst

babesia_canis_blood_smear
```

---

# 5. Diagnostické objekty

Každý objekt predstavuje jednu konkrétnu pozorovateľnú entitu.

Nie celý druh.

Príklady

✔

```
Giardia intestinalis – cysta
```

✔

```
Giardia intestinalis – trofozoit
```

Nie

```
Giardia intestinalis
```

ak nie je určené štádium.

---

# 6. Taxonómia

Vyplňujú sa všetky dostupné úrovne.

```
Kingdom

Phylum

Class

Order

Family

Genus

Species
```

Ak úroveň nie je známa:

```
null
```

---

# 7. Hostitelia

Používajú sa výhradne hodnoty zo slovníka.

Povolené

```
Pes

Mačka

Kôň

Ovca

Koza

Hovädzí dobytok

Ošípaná

Hydina
```

Zakázané

```
pes

Canis familiaris

Pes domáci
```

---

# 8. Typ vzorky

Používa sa kontrolovaný slovník.

Príklady

```
Trus

Krv

Koža

Moč

Sérum

Srsť

Biopsia

Výter
```

Nie

```
Feces

Stolica

Výkaly
```

---

# 9. Diagnostické metódy

Používajú sa iba názvy zo slovníka.

Príklady

```
Flotácia

Sedimentácia

Baermannova metóda

Knottov test

PCR

ELISA

Mikroskopia

IFAT

MAT
```

Ak sa používa modifikovaná metóda, uvedie sa v poli `notes`.

---

# 10. Mikrometria

Všetky rozmery sa zapisujú numericky.

Príklad

```
lengthMin = 75

lengthMax = 90

widthMin = 65

widthMax = 75

unit = µm
```

---

## Rozsahy

Správne

```
75–90 µm
```

Databáza

```
75

90
```

Nie

```
75-90

cca 80

80±5
```

---

# 11. Morfológia

Používajú sa kontrolované slovníky.

## Tvar

Príklady

```
Guľatý

Oválny

Elipsovitý

Vajcovitý

Hruškovitý

Nepravidelný
```

---

## Farba

Príklady

```
Bezfarebný

Svetložltý

Žltohnedý

Tmavohnedý

Zelenkastý
```

---

## Obal

Príklady

```
Hrubý

Tenký

Dvojvrstvový

Radiálne pruhovaný

Drsný

Hladký
```

---

## Operkulum

Používajú sa iba hodnoty

```
true

false
```

---

# 12. Diagnostické znaky

Každý znak tvorí samostatnú položku.

Správne

```json
[
  "Hrubý obal",
  "Radiálne ryhovanie",
  "Tmavohnedá farba"
]
```

Nie

```
Hrubý obal, radiálne ryhovanie, tmavohnedá farba.
```

---

# 13. Diferenciálna diagnostika

Uvádzajú sa iba diagnosticky významné podobné objekty.

Príklad

```json
[
  "Toxocara cati",
  "Toxascaris leonina"
]
```

---

# 14. Fotografie

Každá fotografia je samostatný objekt.

Povinné polia

- ID
- objekt
- autor
- laboratórium
- hostiteľ
- vzorka
- štádium
- metóda
- zväčšenie
- licencia

---

## Názvy súborov

Používajú sa malé písmená.

Príklad

```
toxocara_canis_egg_001.jpg
```

Nie

```
IMG001.JPG

foto1.jpg

Toxocara.JPG
```

---

# 15. Literatúra

Každý zdroj dostane jedinečné ID.

Príklad

```
REF0001

REF0002
```

Odporúčaný formát:

- Autori
- Rok
- Názov
- Časopis alebo vydavateľ
- DOI alebo ISBN (ak existuje)

---

# 16. Poznámky

Pole `notes` slúži iba na interné odborné poznámky.

Nepoužíva sa na údaje, ktoré patria do iných polí.

---

# 17. Kontrola kvality

Každý nový záznam musí prejsť kontrolou.

Kontroluje sa:

- správnosť názvu,
- taxonómia,
- hostiteľ,
- vzorka,
- štádium,
- rozmery,
- jednotky,
- fotografie,
- duplicity,
- literatúra.

---

# 18. Zakázané hodnoty

Nikdy nepoužívať

```
???

Neznáme

Asi

Pravdepodobne

cca

~

-

N/A

Bez údajov
```

Používa sa

```
null
```

---

# 19. Checklist pred uložením

Každý objekt musí mať:

☐ Jedinečné ID

☐ Latinský názov

☐ Taxonómiu

☐ Hostiteľa

☐ Typ vzorky

☐ Diagnostické štádium

☐ Diagnostické metódy

☐ Mikrometriu

☐ Morfológiu

☐ Diagnostické znaky

☐ Diferenciálnu diagnostiku

☐ Minimálne jednu referenciu

☐ Aspoň jednu fotografiu (ak je dostupná)

☐ Kontrolu duplicít

---

# 20. Pravidlá budúcich zmien

Nové polia možno pridávať iba vtedy, ak:

- riešia reálnu odbornú potrebu,
- sú spätne kompatibilné,
- sú zdokumentované v `02_DATABASE_SPECIFICATION.md`,
- sú zaznamenané v `10_CHANGELOG.md`.

Nikdy sa nesmie meniť význam existujúceho poľa bez aktualizácie dokumentácie.

---

# Súvisiace dokumenty

- `00_PROJECT_CONTEXT.md`
- `01_PROJECT_SPECIFICATION.md`
- `02_DATABASE_SPECIFICATION.md`
- `05_TECHNICAL_ARCHITECTURE.md`
- `08_DEVELOPER_GUIDE.md`
- `10_CHANGELOG.md`

---

**Koniec dokumentu**