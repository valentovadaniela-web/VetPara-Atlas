# Zmena: Import taxonómie z NCBI tabuľky + rozdelenie Taenia/Echinococcus

**Dátum:** 2026-08-13
**Vstup:** `dog.migrated.json` (37 záznamov, po úprave diagnosticSigns z predchádzajúceho kroku), `Taxonómia.xlsx` (NCBI export, 96 858 riadkov, hárok `csv`)
**Výstup:** `dog.migrated.json` (**38 záznamov**, +1 zo split Taenia/Echinococcus)

`dog.json` (pôvodná surová databáza) **nebol menený.**

---

## 1. Zdroj a metóda párovania

Tabuľka `Taxonómia.xlsx` (hárok `csv`) obsahuje NCBI taxonomický export so stĺpcami
`Kingdom name`, `Phylum name`, `Class name`, `Order name`, `Family name`, `Genus name`,
`Species name`, `Rank` (SPECIES/GENUS) a `Tax name`.

Párovanie prebehlo podľa `latinName` v `dog.migrated.json` voči `Tax name` v tabuľke,
s týmito normalizačnými krokmi (skúšané v poradí, prvá zhoda sa použila):
1. presná zhoda `latinName`,
2. bez prípony „spp."/"spp",
3. bez zátvorkového dodatku (napr. `(predtým Balantidium)`, `(= Capillaria aerophila)`),
4. rozdelenie kombinovaných názvov na `/` (napr. „Taenia spp./Echinococcus").

Nič sa neodhadovalo mimo tejto tabuľky — kde nebola jednoznačná zhoda, `taxonomy`
ostalo prázdne `{}`.

---

## 2. Kingdom „Protista" pre prvoky

Na tvoj výslovný pokyn bolo pole `kingdom` prepísané na **„Protista"** pri záznamoch,
kde NCBI tabuľka mala `Kingdom name` prázdne a `Phylum` patrí medzi Apicomplexa/
Ciliophora/Metamonada:

- `cryptosporidium_parvum` (Apicomplexa)
- `sarcocystis_spp` (Apicomplexa)
- `balantioides_predtym_balantidium_coli` (Ciliophora)

Toto je jediné miesto, kde sa do `taxonomy` zapísala hodnota, ktorá nebola priamo
v NCBI tabuľke — na základe tvojho explicitného odborného rozhodnutia, nie ako
odhad AI.

---

## 3. Rozdelenie `taenia_spp_echinococcus` na 2 záznamy

Pôvodný kombinovaný diagnostický objekt bol podľa pokynu **rozdelený na dva
samostatné záznamy**, keďže ide o odlišné rody, hoci mikroskopicky nerozlíšiteľné:

| Nové ID | latinName | taxonomy.genus | taxonomy.species |
|---|---|---|---|
| `taenia_sp_egg` | Taenia sp. | Taenia | `null` |
| `echinococcus_sp_egg` | Echinococcus sp. | Echinococcus | `null` |

Oba záznamy:
- majú zhodné `host`, `sample`, `stage`, `group`, `micrometry`, `morphology`
  (prevzaté z pôvodného kombinovaného záznamu — mikroskopicky sa neodlišujú),
- majú zhodné `legacyId: "DOG-0013"` (dohľadateľnosť k pôvodnému zdroju),
- majú `notes`: *„Vajíčka Taenia a Echinococcus sú morfologicky nerozoznateľné,
  udávame vajíčka taeniového typu."*
- majú `taxonomy` do úrovne `family` (Taeniidae) zhodnú, `genus` odlišný,
  `species: null` (úmyselne — nie je mikroskopicky určiteľné).

Pôvodný záznam `taenia_spp_echinococcus` bol z databázy **odstránený** (nahradený
týmito dvoma). Počet záznamov v databáze sa tým zvýšil z 37 na **38**.

⚠️ Toto je zmena v počte diagnostických objektov — treba ju premietnuť aj do
`10_CHANGELOG.md` pri commite (rovnako ako pri predchádzajúcom split
`alaria_alata`/`strongyloides_spp` v merge z 2026-08-12).

---

## 4. Výsledok párovania — súhrn

| Kategória | Počet |
|---|---|
| Nájdené na úrovni druhu (`species` vyplnený) | 22 |
| Nájdené len na úrovni rodu (`species: null`) | 4 (Sarcocystis, Mesocestoides, Physaloptera, Strongyloides — pri poslednom 2 diagnostické objekty egg/larva) |
| Rozdelené Taenia/Echinococcus (rodová úroveň) | 2 |
| Nenájdené v tabuľke (`taxonomy: {}`) | 8 |
| **Spolu** | **38** (pôvodných 37 + 1 zo splitu) |

Kompletný zoznam nejasných/chýbajúcich položiek je v samostatnej prílohe
**`Taxonomia_na_doplnenie.xlsx`** (14 riadkov: 8 úplne nenájdených + 4 iba rodová
úroveň + 1 riadok pre Taenia/Echinococcus split na kontrolu).

---

## 5. Validácia po zmene

- Počet záznamov: **38**
- Duplicitné ID: **0**
- Všetky povinné polia schémy (`02_DATABASE_SPECIFICATION.md` § 7): **prítomné vo
  všetkých záznamoch**
- `dog.json`: **nemenený**
- `Kingdom: Protista` správne aplikovaný pri 3 zázname (overené)
- `modified` pri všetkých upravených/nových záznamoch: `2026-08-13T00:00:00.000000+00:00`

---

## 6. Zostávajúce otvorené body

- 8 druhov bez taxonómie čaká na iný zdroj (Catalogue of Life alebo doplnenie do
  tabuľky) — pozri `Taxonomia_na_doplnenie.xlsx`
- 4+1 záznamov s taxonómiou len po `genus` — `species` môžeš doplniť, ak máš
  istotu o konkrétnom druhu
- `differentialDiagnosis`, `images`, `references`, `zoonosis`, `methods` — stále
  prázdne pri všetkých záznamoch (nerieši sa touto úpravou)
- Šírka mikrofilárií (`dirofilaria_repens`, `dirofilaria_immitis`,
  `oslerus_filaroides_osleri`) stále chýba (nerieši sa touto úpravou)
- **UI zatiaľ nezobrazuje `taxonomy`** ani `diagnosticSigns` — `AtlasPage.js`
  vyžaduje úpravu (pozri `AI_STATUS.md` bod 6)
