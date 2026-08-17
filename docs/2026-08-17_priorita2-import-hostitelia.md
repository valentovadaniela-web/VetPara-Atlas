# 2026-08-17 – Priorita 2: Import ďalších hostiteľov

## Zdroj
`Mikrometria_doplnená__opravená.xlsx` (list `vetpara_atlas_taxony`), 570 riadkov,
471 unikátnych `id`. Autorka dáta pred importom manuálne opravila a zjednotila
(pozri body nižšie).

## Výsledok importu
**529 finálnych diagnostických objektov** rozdelených do 13 súborov:

| Súbor | Počet záznamov |
|---|---|
| `birds.migrated.json` | 76 |
| `cat.migrated.json` | 28 |
| `cattle.migrated.json` | 48 |
| `fish.migrated.json` | 8 |
| `hedgehog.migrated.json` | 18 |
| `horse.migrated.json` | 32 |
| `molluscs.migrated.json` | 12 |
| `pig.migrated.json` | 33 |
| `rabbit.migrated.json` | 30 |
| `reptiles.migrated.json` | 65 |
| `rodents.migrated.json` | 74 |
| `sheep_goat.migrated.json` | 54 |
| `wild_ruminants.migrated.json` | 51 |

Vylúčené zo zdroja:
- **38 riadkov `Pes`** – už sú obsiahnuté v `dog.migrated.json` z predchádzajúcej fázy.
- **1 riadok `Pseudoparazity`** (`myobia_sp_adult`) – nie je skutočný hostiteľ, nešpecifikované ako zahrnúť, ostáva mimo databázy.

## Rozšírenie architektúry (schválené autorkou)
1. **Nová sústava host-súborov** nad rámec pôvodných 7 v `02_DATABASE_SPECIFICATION.md`:
   `rabbit.json` (Králik + Zajac spojené ako Zajace, králiky), `hedgehog.json`, `rodents.json`,
   `reptiles.json`, `fish.json`, `molluscs.json`, `wild_ruminants.json`.
2. **`dictionary/host_hierarchy.json`** (nový, prídavný slovník, 67 mapovaní) – mapuje
   konkrétneho hostiteľa na nadradenú kategóriu (napr. `"Varan": "Jaštery"`,
   `"Jaštery": "Plazy"`), viacúrovňovo reťaziteľné. Pole `host` v migrovaných JSON
   súboroch **zostáva nezmenené** (presné pôvodné hodnoty), slovník slúži len
   aplikácii na zoskupovanie/filtrovanie.

## Zlučovanie vs. rozdeľovanie duplicitných `id`
50 `id` sa v zdroji vyskytovalo pre viacero hostiteľov. Pravidlo:
- **Identická mikrometria/dáta naprieč hostiteľmi → zlúčené** do jedného objektu
  s `host: [...]` ako pole (napr. `eimeria_labbeana_oocyst` → host: Hrdlička, Holub).
- **Odlišná mikrometria/vzorka → rozdelené** na samostatné host-špecifické `id`
  so sufixom (napr. `strongylida_egg__gekon`, `strongylida_egg__hady`,
  `eimeria_sp_oocyst__plazy` vs. `eimeria_sp_oocyst__zlcnik` – líšia sa vzorkou
  Trus/Žlčník).

### Prípady riešené priamo s autorkou v chate (2026-08-17):
- `alaria_alata_egg`, `isospora_sp_oocyst`, `strongylida_egg` – ponechané odlišné
  (reálna biologická variabilita).
- `capillaria_sp_egg`, `cryptosporidium_parvum_oocyst`, `eimeria_labbeana_oocyst`,
  `fasciola_hepatica_egg`, `taenia_sp_egg`, `trichostrongylus_sp_egg`,
  `haemonchus_sp_egg`, `moniezia_benedeni_egg`, `paramphistomum_cervi_egg`,
  `sarcocystis_sp_oocyst`, `cysticercus_tenuicollis_larva`,
  `echinococcus_granulosus_larva`, `coenurus_serialis_larva` – autorka opravila
  a zjednotila priamo v zdrojovej tabuľke, teraz zlúčené do jedného objektu.
- `ligula_intestinalis_plerocercoid` – rozdiel medzi hostiteľmi (Vodné vtáky /
  Kaprovité) je v rámci rovnakého rádu veľkosti, ponechané ako 2 samostatné
  záznamy (nezlučovať, keďže presné hodnoty nie sú identické).
- `myocoptes_musculinus_adult` (host `Plazy`) – autorka potvrdila explicitne v
  chate: ide o pseudoparazita (nález v truse plaza kŕmeného hlodavcami). Do
  poľa `notes` doplnená veta: *"Pseudoparazit – nález v truse, pôvod
  pravdepodobne z koristi (hlodavce)."* – nejde o odhadnutý údaj, ale o
  explicitnú inštrukciu autorky (v súlade s pravidlom 2).

## Validácia
Všetkých 529 záznamov vo všetkých 13 súboroch zvalidovaných voči
`02_DATABASE_SPECIFICATION.md`: 0 chýb (povinné polia `id`/`latinName`/`sample`/
`stage`, žiadne duplicitné `id` v rámci súboru, jednotka mikrometrie vždy `µm`).

## Nedotknuté súbory
`dog.json` a `dog.migrated.json` neboli menené (import sa ich netýkal).

## Otvorené pre ďalšiu kontrolu autorkou
Žiadne – všetky sporné prípady boli vyriešené priamo v konverzácii.
