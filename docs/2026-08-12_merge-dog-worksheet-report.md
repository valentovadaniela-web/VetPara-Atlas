# Report: Merge dog_worksheet.xlsx → dog.migrated.json

**Dátum:** 2026-08-12
**Zdroje:** `dog_worksheet.xlsx` (list `dog_worksheet`), pôvodný `dog.migrated.json` (35 záznamov)
**Výstup:** nový `dog.migrated.json` (37 záznamov)
**Poznámka:** `dog.json` (pôvodná surová databáza) nebol menený.

---

## 1. Zhrnutie

| | |
|---|---|
| Vstupných záznamov (dog.migrated.json) | 35 |
| Výstupných záznamov (po merge) | 37 |
| Nové diagnostické objekty (rozdelenie podľa štádia) | 4 |
| Doplnené polia `sample`, `stage`, `group`, `host` | pri všetkých 37 |
| Konflikty shape/colour/shell vyriešené v prospech worksheetu | 15 |

## 2. Rozdelenie na samostatné diagnostické objekty

Podľa filozofie projektu (`00_PROJECT_CONTEXT.md`, kap. 10 – diagnostický objekt, nie druh):

- `alaria_alata` → `alaria_alata_egg` (vajíčko) + `alaria_alata_adult` (dospelý jedinec)
- `strongyloides_spp` → `strongyloides_spp_egg` (vajíčko) + `strongyloides_spp_larva` (larva)

## 3. Zmena schémy ID

Pôvodné ID (`dog_0001`…`dog_0035`, vzniknuté slugifikáciou legacy `DOG-00xx`) boli nahradené
sémantickými ID vo formáte podľa `03_DATA_ENTRY_STANDARD.md` (napr. `toxocara_canis`,
`giardia_intestinalis`, `alaria_alata_egg`). Pôvodné ID je zachované v novom poli `legacyId`
pre spätnú dohľadateľnosť.

⚠️ **Toto je zmena primárneho kľúča záznamov.** Ak niekde v kóde, URL alebo poznámkach
existujú odkazy na staré tvary `dog_00xx`, treba ich prejsť a upraviť.

## 4. Doplnené polia (predtým chýbajúce/null)

Pre všetkých 37 záznamov boli doplnené z worksheetu:
- `host` = `["Pes"]`
- `sample` (Trus / Krv / Moč / Koža)
- `stage` (Cysta / Vajíčko / Larva / Dospelý jedinec)
- `group` — **prevzaté doslovne z worksheetu**, vrátane dvoch prípadov mimo kontrolovaného
  zoznamu zo `02_DATABASE_SPECIFICATION.md`:
  - `demodex_canis`, `demodex_injai` → `group: "Arthropoda (Acari)"`
  - `linguatula_serrata` → `group: "Pentastomida (mimo hlavných skupín — overiť zaradenie)"`

  **TODO:** Tieto dve hodnoty nie sú v kontrolovanom slovníku skupín. Zadané ako dočasné
  hodnoty na tvoje želanie, s výhľadom na budúce napojenie na plnú taxonomickú štruktúru
  (kingdom–phylum–class–order–family–genus–species). Odporúčam pri tvorbe `taxonomy.json`
  rozhodnúť, či `group` zostane skratkou fylogenetickej skupiny alebo sa úplne nahradí
  poľom `taxonomy.phylum`/`taxonomy.subclass`.

- `micrometry.lengthMin` / `lengthMax` — doplnené z worksheetu tam, kde predtým chýbali
  (napr. `toxocara_canis`, `toxascaris_leonina` — predtým `micrometry: null`, teraz majú dĺžku).
  `widthMin`/`widthMax` worksheet neobsahuje — tieto hodnoty boli **zachované z pôvodného
  `dog.migrated.json`** tam, kde existovali.

## 5. Vyriešené konflikty shape / colour / shell (worksheet mal prednosť)

| ID | Pole | Pôvodná hodnota | Nová hodnota (z worksheetu) |
|---|---|---|---|
| giardia_intestinalis | shell | hladká | Nevýrazná |
| sarcocystis_spp | shape | oválny, elipsovitý | Oválny |
| diphyllobothrium_latum | shape | oválne | Vajcovitý |
| toxocara_canis | shape | oválny | Okrúhly |
| toxocara_canis | colour | hnedá až žltá | Hnedá |
| toxascaris_leonina | shape | oválny | Okrúhly |
| toxascaris_leonina | colour | svetlohnedá až žltá | Žltohnedá |
| uncinaria_stenocephala | shape | oválny, podlhovastý | Oválny |
| angiostrongylus_vasorum | shape | výrastok na chvoste | Červovitý |
| crenosoma_vulpis | shape | kopijovitý koniec chvosta | Červovitý |
| dioctophyme_renale | colour | hnedá | Žltohnedá |
| trichuris_vulpis | colour | hnedá | Žltohnedá |
| pearsonema_capillaria_plica | shape | citrónovitý, súdkovitý | Citrónovitý |
| eucoleus_boehmi | shape | citrónovitý, súdkovitý | Citrónovitý |
| eucoleus_aerophilus_capillaria_aerophila | shape | citrónovitý, súdkovitý | Citrónovitý |

⚠️ **Všimni si:** v niekoľkých prípadoch (napr. `angiostrongylus_vasorum`,
`crenosoma_vulpis`) pôvodná hodnota v `dog.migrated.json` v skutočnosti nebola tvar objektu,
ale opis diagnostického znaku ("výrastok na chvoste", "kopijovitý koniec chvosta") — tieto
texty teraz **chýbajú** v `morphology.shape` aj v `notes`. Odporúčam doplniť ich do
`diagnosticSigns` (pole je zatiaľ prázdne pri všetkých záznamoch), keďže presne to je ich účel
podľa `03_DATA_ENTRY_STANDARD.md`, kap. 12.

Podobne pri viacerých citrónovitých/súdkovitých tvaroch worksheet zjednodušil dvojhodnotový
popis ("citrónovitý, súdkovitý") na jednu hodnotu ("Citrónovitý") — druhá informácia
("súdkovitý") sa stratila. Over, či to bol zámer.

## 5b. Dodatočná oprava: interpretácia rozpätia bez „x"

Autorka projektu upozornila na pravidlo: ak je v zdrojových materiáloch uvedené iba jedno
rozpätie bez „x" (napr. `75 - 90`), pri **okrúhlych/guľatých** objektoch to znamená, že dĺžka
aj šírka sú rovnaké (`75–90 × 75–90`), keďže sa v praxi meral iba priemer.

Toto pravidlo **neplatí univerzálne** — pri červovitých/vláknitých tvaroch (napr. mikrofilárie)
by šírka = dĺžka bola biologicky nezmyselná (červovitý objekt nie je rovnako široký ako dlhý).
Preto bolo pravidlo aplikované selektívne, len tam, kde `morphology.shape` je okrúhly/guľatý:

| ID | Tvar | Pôvodný raw text | Zmena |
|---|---|---|---|
| `toxocara_canis` | Okrúhly | `75 - 90` (bez x) | `widthMin`/`widthMax` doplnené na `75`/`90` (predtým `null`) |

Nasledujúce podobné prípady **neboli** takto opravené, pretože ich tvar nie je okrúhly —
zostávajú s `widthMin`/`widthMax = null` (čakajú na manuálnu odbornú kontrolu):

| ID | Tvar | Pôvodný raw text | Dôvod ponechania |
|---|---|---|---|
| `dirofilaria_repens` | Červovitý | `280-360` (bez x) | mikrofilária — šírka je rádovo menšia než dĺžka, nerovná sa jej |
| `oslerus_filaroides_osleri` | (opis, nie tvar) | `300` (holé číslo) | pravdepodobne iba dĺžka larvy, nie rozpätie |
| `dirofilaria_immitis` | (chýba) | `300` (holé číslo) | pravdepodobne iba dĺžka mikrofilárie |

Ak sa v budúcnosti nájdu presnejšie zdrojové dáta (šírka mikrofilárií je zvyčajne dostupná
v literatúre, cca 5–7 µm), tieto tri záznamy sa dajú doplniť.

## 6. Stále chýbajúce polia (vo všetkých 37 záznamoch)

- `taxonomy` (kingdom–species) — čaká na budúci import taxonomického stromu
- `diagnosticSigns` — pozri poznámku v bode 5 vyššie, časť dát sa dá získať spätne z pôvodných
  `shape`/`notes` textov
- `differentialDiagnosis`
- `images`, `references`
- `zoonosis`
- `methods`

Tieto polia neboli nijako odhadované ani vypĺňané — zostávajú `null`/`[]`/`{}` v súlade
s pravidlom "AI nesmie dopĺňať odborné údaje odhadom".

## 7. Súbor Mikrometria__parazity.xls

List **„Psy"** v tomto súbore obsahuje v podstate rovnaké údaje, aké už boli spracované do
`dog.json`/`dog_worksheet.xlsx` (35 pôvodných druhov, rovnaké rozmery/tvary/farby). Neslúžil
teda ako nový zdroj dát pre psa — jeho hodnota je v ostatných 15 hárkoch pre **budúcich
hostiteľov** (Mačky, HD, Kone, Ošípaná, Vtáky, Zoo zvieratá, Plazy, Ryby, Slimáky, Ježkovia,
Fretky, Hlodavce, Králiky/zajace, Voľne žijúce prežúvavce, Ovce/kozy) — pripravené na Etapu 2
(rozšírenie o ďalších hostiteľov, `01_PROJECT_SPECIFICATION.md`, kap. 3).
