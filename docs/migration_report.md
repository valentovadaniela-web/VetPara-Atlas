# Migračný report — dog.json → nová schéma

Dátum migrácie: 2026-08-11

Počet záznamov: 35


---

## 0. Čo bolo prevedené automaticky (bezpečné, mechanické zmeny)

- `taxon` → `latinName`

- `host: "pes"` → `host: ["Pes"]` (pole, veľké písmeno)

- `shape` / `color` / `wall` → vnorené do `morphology.shape` / `.colour` / `.shell`

- `size` v jednoznačnom formáte `X-Y x A-B` → `micrometry.lengthMin/Max/widthMin/Max`

- Doplnené všetky chýbajúce polia zo schémy (`02_DATABASE_SPECIFICATION.md` sekcia 7) ako `null`/`[]`, nie ako vymyslené hodnoty

- `id` vygenerované ako slug z `latinName` (malé písmená, podčiarkovníky) — pôvodné `DOG-XXXX` zachované v `legacyId`

- `created` / `modified` / `version` doplnené


## 1. Čo NIKDY nebolo doplnené automaticky (vyžaduje odborníka)

Podľa `09_MASTER_PROMPT.md` bod 4 ("Nikdy nevytváraj odborné údaje bez označenia, že ide o návrh") nasledovné polia zostali zámerne `null` pre **všetkých 35 záznamov**:

- **`stage`** (štádium — vajíčko/larva/cysta/dospelý jedinec...) — nedá sa spoľahlivo odvodiť z pôvodných dát.

- **`sample`** (typ vzorky — trus/krv/koža...) — nedá sa spoľahlivo odvodiť z pôvodných dát.

- **`group`** — AI ponúka návrh v poli `aiSuggested.group`, ale nie je zapísaný priamo do `group`. Treba ho odborne potvrdiť.

- **`taxonomy{}`** (kingdom/phylum/.../species) — úplne prázdne, nebolo v zdroji.

- **`diagnosticSigns[]`**, **`differentialDiagnosis[]`** — pôvodné dáta mali tieto info zmiešané v `notes`, neboli štruktúrované ako pole. Treba ich ručne rozdeliť podľa `03_DATA_ENTRY_STANDARD.md` sekcie 12.

- **`images[]`**, **`references[]`**, **`methods[]`** — v zdroji vôbec neboli.


## 2. Kontrola duplicitných ID

Žiadne duplicitné ID (na úrovni základného slugu) nenájdené — POZOR: to sa môže zmeniť, keď sa ID rozšíria o `stage`.


## 3. Záznamy vyžadujúce mimoriadnu pozornosť (nejednoznačný rozmer)

### `DOG-0011` — Alaria alata

- stage: chýba (vždy nutná ručná kontrola)

- sample: chýba (vždy nutná ručná kontrola)

- host: chýba úplne (pôvodné pole bolo prázdne)

- micrometry: NEPREVEDENÉ automaticky — Reťazec obsahuje text/zátvorky/zmiešané jednotky — pravdepodobne kombinuje viac štádií alebo mier. Vyžaduje ručné rozdelenie/interpretáciu. (pôvodný text: "98-134 × 62-70 (120 x 65), dospelé 2,5 – 6 x 0,5 – 2 mm")

- group: AI navrhuje 'Trematoda' — nutné potvrdiť


### `DOG-0014` — Mesocestoides spp.

- stage: chýba (vždy nutná ručná kontrola)

- sample: chýba (vždy nutná ručná kontrola)

- host: chýba úplne (pôvodné pole bolo prázdne)

- micrometry: NEPREVEDENÉ automaticky — Reťazec obsahuje text/zátvorky/zmiešané jednotky — pravdepodobne kombinuje viac štádií alebo mier. Vyžaduje ručné rozdelenie/interpretáciu. (pôvodný text: "50-50 x 39-39 (30-40)")

- group: AI navrhuje 'Cestoda' — nutné potvrdiť

- morphology: shape/colour/shell boli v zdroji prázdne


### `DOG-0017` — Toxascaris leonina

- stage: chýba (vždy nutná ručná kontrola)

- sample: chýba (vždy nutná ručná kontrola)

- host: chýba úplne (pôvodné pole bolo prázdne)

- micrometry: NEPREVEDENÉ automaticky — Formát rozmeru sa nepodarilo jednoznačne rozpoznať. (pôvodný text: "75 x 85")

- group: AI navrhuje 'Nematoda' — nutné potvrdiť


### `DOG-0022` — Oslerus (Filaroides) osleri

- stage: chýba (vždy nutná ručná kontrola)

- sample: chýba (vždy nutná ručná kontrola)

- host: chýba úplne (pôvodné pole bolo prázdne)

- micrometry: NEPREVEDENÉ automaticky — Iba jedna číselná hodnota (300.0) bez rozsahu a bez jasného významu (dĺžka? priemer? maximum?) — vyžaduje odborné potvrdenie pred zápisom do micrometry. (pôvodný text: "300")

- group: AI navrhuje 'Nematoda' — nutné potvrdiť


### `DOG-0023` — Physaloptera spp.

- stage: chýba (vždy nutná ručná kontrola)

- sample: chýba (vždy nutná ručná kontrola)

- host: chýba úplne (pôvodné pole bolo prázdne)

- micrometry: NEPREVEDENÉ automaticky — Formát rozmeru sa nepodarilo jednoznačne rozpoznať. (pôvodný text: "32 × 55")

- group: AI navrhuje 'Nematoda' — nutné potvrdiť

- morphology: shape/colour/shell boli v zdroji prázdne


### `DOG-0025` — Dirofilaria immitis

- stage: chýba (vždy nutná ručná kontrola)

- sample: chýba (vždy nutná ručná kontrola)

- host: chýba úplne (pôvodné pole bolo prázdne)

- micrometry: NEPREVEDENÉ automaticky — Iba jedna číselná hodnota (300.0) bez rozsahu a bez jasného významu (dĺžka? priemer? maximum?) — vyžaduje odborné potvrdenie pred zápisom do micrometry. (pôvodný text: "300")

- group: AI navrhuje 'Nematoda' — nutné potvrdiť

- morphology: shape/colour/shell boli v zdroji prázdne


### `DOG-0027` — Strongyloides spp.

- stage: chýba (vždy nutná ručná kontrola)

- sample: chýba (vždy nutná ručná kontrola)

- host: chýba úplne (pôvodné pole bolo prázdne)

- micrometry: NEPREVEDENÉ automaticky — Reťazec obsahuje text/zátvorky/zmiešané jednotky — pravdepodobne kombinuje viac štádií alebo mier. Vyžaduje ručné rozdelenie/interpretáciu. (pôvodný text: "v: 62-64 x 32-36, l: 230-350")

- group: AI navrhuje 'Nematoda' — nutné potvrdiť


### `DOG-0033` — Linguatula serrata

- stage: chýba (vždy nutná ručná kontrola)

- sample: chýba (vždy nutná ručná kontrola)

- host: chýba úplne (pôvodné pole bolo prázdne)

- micrometry: NEPREVEDENÉ automaticky — Formát rozmeru sa nepodarilo jednoznačne rozpoznať. (pôvodný text: "90 x 70")

- group: AI navrhuje 'Pentastomida (mimo hlavných skupín — overiť zaradenie)' — nutné potvrdiť



## 4. Kompletný zoznam všetkých záznamov a ich flagov

| legacyId | nové id | latinName | rozmer | poznámky na kontrolu |
|---|---|---|---|---|
| DOG-0001 | `giardia_intestinalis` | Giardia intestinalis | ok_full | stage: chýba (vždy nutná ručná kontrola); sample: chýba (vždy nutná ručná kontrola); group: AI navrhuje 'Protozoa' — nutné potvrdiť |
| DOG-0002 | `isospora_canis` | Isospora canis | ok_full | stage: chýba (vždy nutná ručná kontrola); sample: chýba (vždy nutná ručná kontrola); host: chýba úplne (pôvodné pole bolo prázdne); group: AI navrhuje 'Protozoa' — nutné potvrdiť; morphology: shape/colour/shell boli v zdroji prázdne |
| DOG-0003 | `isospora_ohioensis` | Isospora ohioensis | ok_full | stage: chýba (vždy nutná ručná kontrola); sample: chýba (vždy nutná ručná kontrola); host: chýba úplne (pôvodné pole bolo prázdne); group: AI navrhuje 'Protozoa' — nutné potvrdiť; morphology: shape/colour/shell boli v zdroji prázdne |
| DOG-0004 | `isospora_burrowsi` | Isospora burrowsi | ok_full | stage: chýba (vždy nutná ručná kontrola); sample: chýba (vždy nutná ručná kontrola); host: chýba úplne (pôvodné pole bolo prázdne); group: AI navrhuje 'Protozoa' — nutné potvrdiť; morphology: shape/colour/shell boli v zdroji prázdne |
| DOG-0005 | `isospora_neorivolta` | Isospora neorivolta | ok_full | stage: chýba (vždy nutná ručná kontrola); sample: chýba (vždy nutná ručná kontrola); host: chýba úplne (pôvodné pole bolo prázdne); group: AI navrhuje 'Protozoa' — nutné potvrdiť; morphology: shape/colour/shell boli v zdroji prázdne |
| DOG-0006 | `cryptosporidium_parvum` | Cryptosporidium parvum | ok_full | stage: chýba (vždy nutná ručná kontrola); sample: chýba (vždy nutná ručná kontrola); host: chýba úplne (pôvodné pole bolo prázdne); group: AI navrhuje 'Protozoa' — nutné potvrdiť; morphology: shape/colour/shell boli v zdroji prázdne |
| DOG-0007 | `hammondia_heydornii` | Hammondia heydornii | ok_full | stage: chýba (vždy nutná ručná kontrola); sample: chýba (vždy nutná ručná kontrola); host: chýba úplne (pôvodné pole bolo prázdne); group: AI navrhuje 'Protozoa' — nutné potvrdiť; morphology: shape/colour/shell boli v zdroji prázdne |
| DOG-0008 | `sarcocystis_spp` | Sarcocystis spp. | ok_full | stage: chýba (vždy nutná ručná kontrola); sample: chýba (vždy nutná ručná kontrola); host: chýba úplne (pôvodné pole bolo prázdne); group: AI navrhuje 'Protozoa' — nutné potvrdiť |
| DOG-0009 | `balantioides_predtym_balantidium_coli` | Balantioides (predtým Balantidium) coli | ok_full | stage: chýba (vždy nutná ručná kontrola); sample: chýba (vždy nutná ručná kontrola); host: chýba úplne (pôvodné pole bolo prázdne); group: AI navrhuje 'Protozoa' — nutné potvrdiť |
| DOG-0010 | `fasciola_hepatica` | Fasciola hepatica | ok_full | stage: chýba (vždy nutná ručná kontrola); sample: chýba (vždy nutná ručná kontrola); host: chýba úplne (pôvodné pole bolo prázdne); group: AI navrhuje 'Trematoda' — nutné potvrdiť |
| DOG-0011 | `alaria_alata` | Alaria alata | unparsed | stage: chýba (vždy nutná ručná kontrola); sample: chýba (vždy nutná ručná kontrola); host: chýba úplne (pôvodné pole bolo prázdne); micrometry: NEPREVEDENÉ automaticky — Reťazec obsahuje text/zátvorky/zmiešané jednotky — pravdepodobne kombinuje viac štádií alebo mier. Vyžaduje ručné rozdelenie/interpretáciu. (pôvodný text: "98-134 × 62-70 (120 x 65), dospelé 2,5 – 6 x 0,5 – 2 mm"); group: AI navrhuje 'Trematoda' — nutné potvrdiť |
| DOG-0012 | `dipylidium_caninum` | Dipylidium caninum | ok_full | stage: chýba (vždy nutná ručná kontrola); sample: chýba (vždy nutná ručná kontrola); host: chýba úplne (pôvodné pole bolo prázdne); group: AI navrhuje 'Cestoda' — nutné potvrdiť |
| DOG-0013 | `taenia_spp_echinococcus` | Taenia spp./Echinococcus | ok_full | stage: chýba (vždy nutná ručná kontrola); sample: chýba (vždy nutná ručná kontrola); host: chýba úplne (pôvodné pole bolo prázdne); group: AI navrhuje 'Cestoda' — nutné potvrdiť |
| DOG-0014 | `mesocestoides_spp` | Mesocestoides spp. | unparsed | stage: chýba (vždy nutná ručná kontrola); sample: chýba (vždy nutná ručná kontrola); host: chýba úplne (pôvodné pole bolo prázdne); micrometry: NEPREVEDENÉ automaticky — Reťazec obsahuje text/zátvorky/zmiešané jednotky — pravdepodobne kombinuje viac štádií alebo mier. Vyžaduje ručné rozdelenie/interpretáciu. (pôvodný text: "50-50 x 39-39 (30-40)"); group: AI navrhuje 'Cestoda' — nutné potvrdiť; morphology: shape/colour/shell boli v zdroji prázdne |
| DOG-0015 | `diphyllobothrium_latum` | Diphyllobothrium latum | ok_full | stage: chýba (vždy nutná ručná kontrola); sample: chýba (vždy nutná ručná kontrola); host: chýba úplne (pôvodné pole bolo prázdne); group: AI navrhuje 'Cestoda' — nutné potvrdiť |
| DOG-0016 | `toxocara_canis` | Toxocara canis | ok_partial | stage: chýba (vždy nutná ručná kontrola); sample: chýba (vždy nutná ručná kontrola); host: chýba úplne (pôvodné pole bolo prázdne); micrometry: čiastočne prevedené — Šírka (width) nebola v zdroji vôbec uvedená — widthMin/widthMax ponechané ako null.; group: AI navrhuje 'Nematoda' — nutné potvrdiť |
| DOG-0017 | `toxascaris_leonina` | Toxascaris leonina | unparsed | stage: chýba (vždy nutná ručná kontrola); sample: chýba (vždy nutná ručná kontrola); host: chýba úplne (pôvodné pole bolo prázdne); micrometry: NEPREVEDENÉ automaticky — Formát rozmeru sa nepodarilo jednoznačne rozpoznať. (pôvodný text: "75 x 85"); group: AI navrhuje 'Nematoda' — nutné potvrdiť |
| DOG-0018 | `ancylostoma_caninum` | Ancylostoma caninum | ok_full | stage: chýba (vždy nutná ručná kontrola); sample: chýba (vždy nutná ručná kontrola); host: chýba úplne (pôvodné pole bolo prázdne); group: AI navrhuje 'Nematoda' — nutné potvrdiť |
| DOG-0019 | `uncinaria_stenocephala` | Uncinaria stenocephala | ok_full | stage: chýba (vždy nutná ručná kontrola); sample: chýba (vždy nutná ručná kontrola); host: chýba úplne (pôvodné pole bolo prázdne); group: AI navrhuje 'Nematoda' — nutné potvrdiť |
| DOG-0020 | `angiostrongylus_vasorum` | Angiostrongylus vasorum | ok_partial | stage: chýba (vždy nutná ručná kontrola); sample: chýba (vždy nutná ručná kontrola); host: chýba úplne (pôvodné pole bolo prázdne); micrometry: čiastočne prevedené — Šírka bola zadaná ako jedna hodnota (20.0), nie rozsah — widthMin=widthMax=20.0. Skontrolovať, či nejde o preklep alebo skutočne fixnú hodnotu.; group: AI navrhuje 'Nematoda' — nutné potvrdiť |
| DOG-0021 | `crenosoma_vulpis` | Crenosoma vulpis | ok_partial | stage: chýba (vždy nutná ručná kontrola); sample: chýba (vždy nutná ručná kontrola); host: chýba úplne (pôvodné pole bolo prázdne); micrometry: čiastočne prevedené — Šírka bola zadaná ako jedna hodnota (20.0), nie rozsah — widthMin=widthMax=20.0. Skontrolovať, či nejde o preklep alebo skutočne fixnú hodnotu.; group: AI navrhuje 'Nematoda' — nutné potvrdiť |
| DOG-0022 | `oslerus_filaroides_osleri` | Oslerus (Filaroides) osleri | unparsed | stage: chýba (vždy nutná ručná kontrola); sample: chýba (vždy nutná ručná kontrola); host: chýba úplne (pôvodné pole bolo prázdne); micrometry: NEPREVEDENÉ automaticky — Iba jedna číselná hodnota (300.0) bez rozsahu a bez jasného významu (dĺžka? priemer? maximum?) — vyžaduje odborné potvrdenie pred zápisom do micrometry. (pôvodný text: "300"); group: AI navrhuje 'Nematoda' — nutné potvrdiť |
| DOG-0023 | `physaloptera_spp` | Physaloptera spp. | unparsed | stage: chýba (vždy nutná ručná kontrola); sample: chýba (vždy nutná ručná kontrola); host: chýba úplne (pôvodné pole bolo prázdne); micrometry: NEPREVEDENÉ automaticky — Formát rozmeru sa nepodarilo jednoznačne rozpoznať. (pôvodný text: "32 × 55"); group: AI navrhuje 'Nematoda' — nutné potvrdiť; morphology: shape/colour/shell boli v zdroji prázdne |
| DOG-0024 | `spirocerca_lupi` | Spirocerca lupi | ok_full | stage: chýba (vždy nutná ručná kontrola); sample: chýba (vždy nutná ručná kontrola); host: chýba úplne (pôvodné pole bolo prázdne); group: AI navrhuje 'Nematoda' — nutné potvrdiť; morphology: shape/colour/shell boli v zdroji prázdne |
| DOG-0025 | `dirofilaria_immitis` | Dirofilaria immitis | unparsed | stage: chýba (vždy nutná ručná kontrola); sample: chýba (vždy nutná ručná kontrola); host: chýba úplne (pôvodné pole bolo prázdne); micrometry: NEPREVEDENÉ automaticky — Iba jedna číselná hodnota (300.0) bez rozsahu a bez jasného významu (dĺžka? priemer? maximum?) — vyžaduje odborné potvrdenie pred zápisom do micrometry. (pôvodný text: "300"); group: AI navrhuje 'Nematoda' — nutné potvrdiť; morphology: shape/colour/shell boli v zdroji prázdne |
| DOG-0026 | `dirofilaria_repens` | Dirofilaria repens | ok_partial | stage: chýba (vždy nutná ručná kontrola); sample: chýba (vždy nutná ručná kontrola); host: chýba úplne (pôvodné pole bolo prázdne); micrometry: čiastočne prevedené — Šírka (width) nebola v zdroji vôbec uvedená — widthMin/widthMax ponechané ako null.; group: AI navrhuje 'Nematoda' — nutné potvrdiť; morphology: shape/colour/shell boli v zdroji prázdne |
| DOG-0027 | `strongyloides_spp` | Strongyloides spp. | unparsed | stage: chýba (vždy nutná ručná kontrola); sample: chýba (vždy nutná ručná kontrola); host: chýba úplne (pôvodné pole bolo prázdne); micrometry: NEPREVEDENÉ automaticky — Reťazec obsahuje text/zátvorky/zmiešané jednotky — pravdepodobne kombinuje viac štádií alebo mier. Vyžaduje ručné rozdelenie/interpretáciu. (pôvodný text: "v: 62-64 x 32-36, l: 230-350"); group: AI navrhuje 'Nematoda' — nutné potvrdiť |
| DOG-0028 | `dioctophyme_renale` | Dioctophyme renale | ok_full | stage: chýba (vždy nutná ručná kontrola); sample: chýba (vždy nutná ručná kontrola); host: chýba úplne (pôvodné pole bolo prázdne); group: AI navrhuje 'Nematoda' — nutné potvrdiť |
| DOG-0029 | `trichuris_vulpis` | Trichuris vulpis | ok_full | stage: chýba (vždy nutná ručná kontrola); sample: chýba (vždy nutná ručná kontrola); host: chýba úplne (pôvodné pole bolo prázdne); group: AI navrhuje 'Nematoda' — nutné potvrdiť |
| DOG-0030 | `pearsonema_capillaria_plica` | Pearsonema (Capillaria) plica | ok_full | stage: chýba (vždy nutná ručná kontrola); sample: chýba (vždy nutná ručná kontrola); host: chýba úplne (pôvodné pole bolo prázdne); group: AI navrhuje 'Nematoda' — nutné potvrdiť |
| DOG-0031 | `eucoleus_boehmi` | Eucoleus boehmi | ok_full | stage: chýba (vždy nutná ručná kontrola); sample: chýba (vždy nutná ručná kontrola); host: chýba úplne (pôvodné pole bolo prázdne); group: AI navrhuje 'Nematoda' — nutné potvrdiť |
| DOG-0032 | `eucoleus_aerophilus_capillaria_aerophila` | Eucoleus aerophilus (= Capillaria aerophila) | ok_full | stage: chýba (vždy nutná ručná kontrola); sample: chýba (vždy nutná ručná kontrola); host: chýba úplne (pôvodné pole bolo prázdne); group: AI navrhuje 'Nematoda' — nutné potvrdiť |
| DOG-0033 | `linguatula_serrata` | Linguatula serrata | unparsed | stage: chýba (vždy nutná ručná kontrola); sample: chýba (vždy nutná ručná kontrola); host: chýba úplne (pôvodné pole bolo prázdne); micrometry: NEPREVEDENÉ automaticky — Formát rozmeru sa nepodarilo jednoznačne rozpoznať. (pôvodný text: "90 x 70"); group: AI navrhuje 'Pentastomida (mimo hlavných skupín — overiť zaradenie)' — nutné potvrdiť |
| DOG-0034 | `demodex_canis` | Demodex canis | empty | stage: chýba (vždy nutná ručná kontrola); sample: chýba (vždy nutná ručná kontrola); host: chýba úplne (pôvodné pole bolo prázdne); micrometry: rozmer v zdroji úplne chýba; group: AI navrhuje 'Arthropoda (Acari)' — nutné potvrdiť; morphology: shape/colour/shell boli v zdroji prázdne |
| DOG-0035 | `demodex_injai` | Demodex injai | empty | stage: chýba (vždy nutná ručná kontrola); sample: chýba (vždy nutná ručná kontrola); host: chýba úplne (pôvodné pole bolo prázdne); micrometry: rozmer v zdroji úplne chýba; group: AI navrhuje 'Arthropoda (Acari)' — nutné potvrdiť; morphology: shape/colour/shell boli v zdroji prázdne |

## 5. Odporúčaný ďalší postup

1. Prejsť sekciu 3 (kritické záznamy s nejednoznačným rozmerom) — najmä `Strongyloides spp.` (kombinuje vajíčko aj larvu — podľa filozofie "diagnostický objekt" z `00_PROJECT_CONTEXT.md` sekcie 10 by mali byť **dva samostatné záznamy**, nie jeden).

2. Doplniť `stage` a `sample` pre všetkých 35 záznamov (odborník, nie AI).

3. Potvrdiť alebo opraviť `aiSuggested.group` a prepísať do `group`, potom `aiSuggested` blok odstrániť.

4. Po doplnení `stage` rozšíriť `id` podľa vzoru `03_DATA_ENTRY_STANDARD.md` (napr. `toxocara_canis_egg`) a znovu skontrolovať duplicity.

5. Rozdeliť `notes` do `diagnosticSigns[]` (pole jednotlivých znakov, nie súvislý text) podľa `03_DATA_ENTRY_STANDARD.md` sekcie 12.

6. Zapísať zmenu do `10_CHANGELOG.md` (typ: Changed, pole: celá schéma `dog.json`).
