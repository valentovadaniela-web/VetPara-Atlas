# Report: Import mikrometrie a taxonómie z `Mikrometria_doplnená__opravená.xlsx`

**Dátum:** 2026-08-15
**Zdroj:** `Mikrometria_doplnená__opravená.xlsx`, hárok `vetpara_atlas_taxony` (569 riadkov,
všetci hostitelia — pre tento krok použitý iba podmnožina `host = "Pes"`, 38 riadkov,
plus 1 riadok `host = "Mačka"` pre `dipylidium_caninum_egg`).
**Vstup:** `dog.migrated.json` (38 záznamov)
**Výstup:** `dog.migrated.json` (39 záznamov)
**Nezmenené:** `dog.json` (pôvodné surové dáta) — nebol dotknutý.

---

## 1. Zhrnutie

| | |
|---|---|
| Vstupných záznamov | 38 |
| Výstupných záznamov | 39 (+1 nový) |
| Záznamy so zmenou `micrometry` | 13 |
| Záznamy so zmenou `taxonomy` | 37 |
| Záznamy so zmenou `notes` | 6 |
| Záznamy plne prevzaté z iného hostiteľa (na explicitný pokyn) | 1 (`dipylidium_caninum`) |
| Nové záznamy | 1 (`dibothriocephalus_latus_egg`) |
| Záznamy bez zmeny | `linguatula_serrata` iba doplnená taxonómia (viď nižšie), žiadny záznam nezostal úplne bez zásahu spomedzi 37 mapovaných |

## 2. Párovanie záznamov (dog.migrated.json ↔ tabuľka)

Tabuľka nepoužíva rovnaké ID ako databáza (napr. `toxocara_canis` v DB vs
`toxocara_canis_egg` v tabuľke) a niektoré `latinName` sa líšia kvôli aktuálnejšej
taxonomickej nomenklatúre v tabuľke (napr. `Isospora canis` → `Cystoisospora canis`,
`Oslerus osleri` vs `Filaroides osleri`). Párovanie bolo urobené na základe zhody druhu
(nie doslovného reťazca), s explicitnou tabuľkou mapovania — pozri prílohu skriptu tejto
session. Pole `latinName` v databáze **nebolo touto zmenou menené** (mimo zadania úlohy).

## 3. Politika prepisovania (schválená autorkou projektu v chate)

1. **micrometry** — hodnoty z tabuľky sú autoritatívne, prepisujú aj už vyplnené hodnoty
   (tabuľka je označená ako "opravená/doplnená").
2. **taxonomy** — pri konflikte (DB má hodnotu, tabuľka inú) je **autoritatívna tabuľka**,
   OKREM explicitných odborných korekcií autorky (pozri bod 4).
3. **notes** — dopĺňané iba tam, kde stĺpec "Čo treba doplniť" obsahoval explicitný pokyn
   typu "do poznámky napíš/daj: ...", textom prevzatým doslovne z tabuľky.
4. **Kingdom normalizácia** — na explicitný pokyn autorky: `Metazoa` → `Animalia`,
   `Protista` sa nepoužíva (tabuľka už používala `Protozoa`/`Chromista` podľa
   konkrétneho taxónu, tieto hodnoty boli prevzaté bez zmeny).

## 4. Explicitné odborné korekcie autorky (majú prednosť pred tabuľkou)

Pri týchto poliach autorka potvrdila, že **pôvodná hodnota v databáze je správna**,
napriek tomu, že tabuľka obsahovala inú hodnotu — tabuľková hodnota bola preto
**ignorovaná**:

| Záznam | Pole | Ponechaná hodnota (DB) | Ignorovaná hodnota (tabuľka) |
|---|---|---|---|
| `toxocara_canis` | family | Toxocaridae | Ascarididae |
| `crenosoma_vulpis` | family | Crenosomatidae | Metastrongylidae |
| `oslerus_filaroides_osleri` | genus | Oslerus | Filaroides |
| `oslerus_filaroides_osleri` | species | Oslerus osleri | Filaroides osleri |
| `dioctophyme_renale` | class | Enoplea | Chromadorea |
| `trichuris_vulpis` | class | Enoplea | Chromadorea |
| `pearsonema_capillaria_plica` | class | Enoplea | Chromadorea |
| `pearsonema_capillaria_plica` | family | Capillariidae | Trichuridae |
| `eucoleus_boehmi` | class | Enoplea | Chromadorea |
| `demodex_canis` | family | Demodicidae | Demodecidae |
| `demodex_injai` | family | Demodicidae | Demodecidae |

`spirocerca_lupi.family` bolo zmenené na **Spirocercidae** (z pôvodného Thelaziidae) —
toto sa zhoduje s tabuľkou AJ s explicitným potvrdením autorky, teda nejde o konflikt.

## 5. Zmeny `micrometry` (13 záznamov)

Doplnené (predtým `null`): `alaria_alata_egg` (šírka), `alaria_alata_adult` (šírka),
`mesocestoides_spp` (celé), `oslerus_filaroides_osleri` (celé),
`dirofilaria_immitis` (celé), `dirofilaria_repens` (šírka),
`strongyloides_spp_egg` (šírka), `strongyloides_spp_larva` (šírka),
`demodex_canis` (celé), `demodex_injai` (celé).

Opravené (mali inú hodnotu, tabuľka ju zmenila — pravdepodobne oprava chyby/transpozície
z predchádzajúceho importu):
- `toxocara_canis.widthMax`: 90.0 → 75.0
- `toxascaris_leonina.lengthMax`: 75.0 → 85.0, `widthMin`: 85 → 75.0
- `physaloptera_spp.lengthMax`: 32.0 → 55.0, `widthMin`: 55 → 32.0

⚠️ Posledné tri prípady vyzerajú ako oprava zámeny dĺžka/šírka z predchádzajúceho
importu — ponechané tak, ako uvádza nová tabuľka (autoritatívny zdroj podľa bodu 3.1
schválenej politiky).

## 6. Zmeny `taxonomy` (37 záznamov)

Pri väčšine záznamov (najmä mnohobunkovce) šlo primárne o doplnenie `kingdom` z
`Metazoa`/prázdne na `Animalia`. Kompletný taxonomický strom (kingdom–species) bol
doplnený od nuly pri: `giardia_intestinalis`, `isospora_canis`, `isospora_ohioensis`,
`isospora_burrowsi`, `isospora_neorivolta`, `hammondia_heydornii`,
`diphyllobothrium_latum`, `linguatula_serrata` — presne tie záznamy, ktoré
`10_CHANGELOG.md` [0.3.0] uvádzal ako "nenájdené v NCBI tabuľke" pri predchádzajúcom
importe. Táto tabuľka teda dopĺňa presne ten TODO zoznam.

Pri druhoch určených iba do úrovne `sp.` (`sarcocystis_spp`, `mesocestoides_spp`,
`physaloptera_spp`, `strongyloides_spp_egg`, `strongyloides_spp_larva`,
`taenia_sp_egg`, `echinococcus_sp_egg`) bolo pole `taxonomy.species` doplnené hodnotou
v tvare `"Rod sp."` (na explicitný pokyn autorky — "nechaj len rodovú úroveň").

## 7. Zmeny `notes` (6 záznamov)

Doplnené presne podľa pokynov v stĺpci "Čo treba doplniť" tabuľky:

- `giardia_intestinalis`: „Giardia intestinalis je synonymum názvu Giardia duodenalis."
- `isospora_canis`: „Cystoisospora canis je synonymom pre Isospora canis."
- `isospora_ohioensis`, `isospora_burrowsi`, `isospora_neorivolta`: „Patrí medzi malé
  druhy rodu Cystoisospora (súčasť komplexu C. ohioensis)."
- `hammondia_heydornii`: „Morfologicky neodlíšiteľné od Neospora canis."

Pri `taenia_sp_egg`/`echinococcus_sp_egg` mala tabuľka podobný pokyn („Uvádza sa ako
vajíčka taeniového typu."), ale existujúca poznámka to už obsahovala — **nebolo
duplikované**.

## 8. `dipylidium_caninum` — plné prevzatie dát z hostiteľa Mačka

Autorka explicitne potvrdila: „skopíruj pre pes tie isté údaje ako má mačka, tam sú
správne". Tabuľka pre psa **neobsahovala žiadny riadok** pre Dipylidium caninum
(chýbajúci zdrojový údaj), preto boli prevzaté kompletné hodnoty z riadku
`dipylidium_caninum_egg` (host = Mačka):

| Pole | Pred | Po |
|---|---|---|
| micrometry.lengthMin/Max | 38 / 45 | 35 / 60 |
| micrometry.widthMin/Max | 38 / 45 | 35 / 60 |
| morphology.colour | Svetlá | Sivobiely |
| taxonomy.kingdom | Metazoa | Animalia |
| notes | „v kokónoch, viditeľné háčiky vo vajíčkach" | + „V kokónoch (120–200 μm)." (zlúčené) |

`host`, `sample`, `stage`, `group`, `id`, `legacyId` zostali nezmenené (Pes-špecifické).

## 9. Nový záznam: `dibothriocephalus_latus_egg`

Tabuľka obsahovala pre psa navyše riadok `Dibothriocephalus_latus_egg`
(*Dibothriocephalus latus* — aktuálny/synonymný názov k *Diphyllobothrium latum*, ktoré
v databáze už ako samostatný záznam existuje: `diphyllobothrium_latum`). Na explicitný
pokyn autorky („vytvor nový záznam, aj keď v databáze nebol") bol vytvorený **nový,
samostatný diagnostický objekt** s ID `dibothriocephalus_latus_egg`, `legacyId: null`,
kompletnými údajmi z tabuľky (micrometry, morphology, taxonomy) a poznámkou o
synonymickom vzťahu k `Diphyllobothrium latum`.

⚠️ **TODO na zváženie:** databáza teraz obsahuje DVA samostatné diagnostické objekty pre
prakticky rovnaký nález (`diphyllobothrium_latum` a `dibothriocephalus_latus_egg`) —
tabuľka ich sama uvádza ako dva rôzne riadky so zhodnou veľkosťou. Toto môže byť zámer
(dva platné vedecké názvy v obehu), ale odporúčam do budúcna rozhodnúť, či majú byť
zlúčené alebo trvalo oddelené (napr. `differentialDiagnosis` odkaz medzi nimi).

## 10. TODO — vyžaduje tvoju pozornosť

- **`dipylidium_caninum`**: hodnoty prevzaté od mačky — over, či je to skutočne v poriadku
  pre druhovo-špecifickú diagnostiku psa (rozmery vajíčka *D. caninum* sa medzi
  hostiteľmi zvyčajne nelíšia, ale odporúčam potvrdiť).
- **`dibothriocephalus_latus_egg`** vs **`diphyllobothrium_latum`** — zvážiť zlúčenie
  alebo prepojenie cez `differentialDiagnosis` (pozri bod 9).
- **`cryptosporidium_parvum`**: kingdom zmenený na `Chromista`, phylum na `Myzozoa` — toto
  bola jediná zmena kingdom mimo vzorca Metazoa→Animalia / Protista→Protozoa
  (Apicomplexa je v tejto klasifikácii zaradené pod Chromista/Myzozoa). Over, že to
  zodpovedá tvojmu zámeru.
- **`group`** pole pri `demodex_canis`/`demodex_injai` (`"Arthropoda (Acari)"`) a
  `linguatula_serrata` (`"Pentastomida (mimo hlavných skupín...)"`) **nebolo touto
  zmenou riešené** — zostáva mimo kontrolovaného zoznamu z
  `02_DATABASE_SPECIFICATION.md`, ako už bolo zaznamenané v `10_CHANGELOG.md` [0.3.0].
- **`differentialDiagnosis`, `images`, `references`, `zoonosis`, `methods`** — stále
  prázdne pri všetkých záznamoch, mimo rozsahu tejto úlohy.
- Tabuľka obsahuje dáta pre **ďalších 14 hostiteľov** (530 riadkov mimo Pes/Mačka
  dipylidium) — pripravené na budúcu Etapu 2 (import ostatných hostiteľov), mimo
  rozsahu tejto session.

## 12. DODATOK (2026-08-15, druhé kolo — po spätnej väzbe autorky)

Po odovzdaní súhrnu autorka potvrdila/upravila tri otvorené TODO body z tejto
session:

### 12.1 `dipylidium_caninum` — potvrdené
Autorka potvrdila: „rozmery/farba rovnaké u psa aj u mačky - ten istý druh,
takže to sedí". Žiadna ďalšia zmena.

### 12.2 Zlúčenie `dibothriocephalus_latus_egg` + `diphyllobothrium_latum`
Autorka: „nový aktuálny názov je Dibothriocephalus latus, jeho synonymum a
zároveň starší názov bol Diphyllobothrium latum" → **zlúčené do jedného
záznamu**.

- **Prežívajúce ID:** `dibothriocephalus_latus_egg` (odráža aktuálne platný
  názov).
- **`legacyId` zachované z `diphyllobothrium_latum`:** `DOG-0015` (kvôli
  dohľadateľnosti pôvodného importu).
- **`latinName`:** `Dibothriocephalus latus`.
- **`taxonomy.genus`/`species`:** `Dibothriocephalus` / `Dibothriocephalus latus`.
- **`micrometry` a `morphology` PONECHANÉ z pôvodného `diphyllobothrium_latum`**
  (67–73 × 45–51 µm, vajcovitý, žltý, operculum s výčnelkom) — **NEPREVZATÉ**
  z tabuľkového riadku `Dibothriocephalus_latus_egg` (38–45 × 38–45 µm, oválny,
  bezfarebný, tenká škrupina, „v kokónoch").

  ⚠️ **Dôvod, prečo neboli hodnoty z druhého riadku prevzaté (flag, nie
  tichý výber):** biologicky nesedia k čeľade Diphyllobothriidae — vajíčka
  tejto čeľade sú operkulátne (majú viečko), zatiaľ čo tabuľkový riadok
  `Dibothriocephalus_latus_egg` uvádza „bez operkula, v kokónoch" — čo je typ
  vajíčka skôr pre čeľaď Dipylidiidae (napr. *Dipylidium caninum*, ktoré má
  v tej istej tabuľke veľmi podobný popis: oválny, v kokónoch). Toto pôsobí
  ako možná chyba/prehodenie riadkov v zdrojovej tabuľke, nie ako alternatívna
  platná hodnota. **Autorka toto explicitne nepotvrdila** — odporúčam
  skontrolovať zdrojový riadok `Dibothriocephalus_latus_egg` v tabuľke, či
  nejde o omylom skopírované dáta z iného druhu.
- `notes`: „rybožravé zvieratá. Diphyllobothrium latum je starší (synonymný)
  názov pre aktuálne platný názov Dibothriocephalus latus."
- Počet záznamov: **39 → 38** (návrat na pôvodný počet, keďže šlo o zlúčenie,
  nie o čisté pridanie).

### 12.3 `cryptosporidium_parvum` — kingdom opravené
Autorka: „daj ako Protozoa (nie Chromista)".

- `taxonomy.kingdom`: `Chromista` → `Protozoa`
- `taxonomy.phylum`: `Myzozoa` → `Apicomplexa`

  ⚠️ Zmena `phylum` **nebola explicitne vyžiadaná** — urobená pre konzistenciu
  s ostatnými Apicomplexa v databáze zo série (napr. `isospora_*`,
  `hammondia_heydornii`), ktoré majú `phylum: Apicomplexa` pod
  `kingdom: Protozoa`. Ak si predstavovala iný `phylum` pri `kingdom: Protozoa`,
  daj vedieť, opravím.

**Finálny počet záznamov po tomto dodatku: 38** (rovnaký ako pred touto
session — čistý efekt session je: doplnená/opravená mikrometria+taxonómia pri
37 záznamoch, `dipylidium_caninum` prevzaté od mačky, `diphyllobothrium_latum`
a `dibothriocephalus_latus_egg` zlúčené do jedného, `cryptosporidium_parvum`
opravené kingdom/phylum).

