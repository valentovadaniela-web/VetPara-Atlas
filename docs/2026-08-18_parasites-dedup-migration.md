# 2026-08-18 – Deduplikácia databázy: `database/parasites.json`

## Cieľ
Nahradiť 14 host-súborov (`birds.migrated.json` … `wild_ruminants.migrated.json`,
567 záznamov) jedným súborom `database/parasites.json` s **jedným záznamom na
diagnostický objekt**, podľa novej architektúry schválenej autorkou 2026-08-18
(pozri `AI_STATUS.md` sekcia 0).

## Zdroj
Všetkých 14 `*.migrated.json` súborov, stav k 2026-08-18 (567 záznamov spolu).
`dog.json` (pôvodné, nemigrované dáta) **nebol použitý ani menený**.

## Výsledok
- **474 finálnych diagnostických objektov** v `database/parasites.json`.
- **567 vstupných záznamov** → **46 ID** sa vyskytovalo vo viac ako jednom
  zdrojovom súbore (100 raw záznamov spolu za tieto ID) → zlúčených na
  **45 záznamov** (44 zlúčení 1:1 + `ligula_intestinalis_*`, ktoré sa naopak
  **rozdelilo** na 2 samostatné ID, pozri nižšie) → **427 jednohostiteľských
  záznamov** prevzatých bez zmeny obsahu (iba zmena schémy `host` → `hosts`).
- `database/images.json` vytvorený ako prázdna kostra `[]` (appka doteraz
  nemala žiadne reálne fotografie, iba placeholder text v Detaile).

Kontrola: 567 (vstup) − 100 (raw záznamy v 46 duplicitných ID skupinách)
+ 46 (zlúčené záznamy vrátane ligula split) = 474 (nesedí presne kvôli
ligula split +1) → reálne overené priamo skriptom, žiadna strata dát.

## Zmena schémy (`02_DATABASE_SPECIFICATION.md` čaká na doplnenie)
Každý záznam teraz namiesto `host: [...]` má:
- `synonyms: []` — nové pole, iné vedecké názvy.
- `hostGroups: []` — názvy skupín z `dictionary/host_hierarchy.json`,
  rozbaľované dynamicky.
- `hosts: []` — konkrétni hostitelia mimo skupinovej logiky.
- `hostNotes: {}` — voliteľné poznámky kľúčované menom hostiteľa.

Pre **427 pôvodne jednohostiteľských záznamov** bolo pole `host` premenované
priamo na `hosts` (žiadna automatická povýšenie na `hostGroups`, presne podľa
pravidla `AI_STATUS.md` §0.3/bod 6 — hostGroups sa priraďuje LEN pri
explicitnom potvrdení autorkou).

## Rozhodnutia aplikované pri zlučovaní (autorka, chat 2026-08-18)

### Skupina pes/mačka (7 konfliktov + 1 naming bug)
| ID | Výsledok |
|---|---|
| `alaria_alata_egg` | zlúčené, `shape=Vajcovitý`, `widthMax=70`, `hosts=[Pes, Mačka]` |
| `toxascaris_leonina_egg` | zlúčené, `shape="Okrúhly až oválny"`, `hosts=[Pes, Mačka]` |
| `sarcocystis_sp_oocyst` | zlúčené aj s Plazmi, `shell=Tenká`, `phylum=Apicomplexa`, `hosts=[Pes, Mačka, Plazy]` |
| `eucoleus_aerophilus_egg` | zlúčené aj s Ježkom, `synonyms=["Capillaria aerophila"]`, `notes="Zátky rovné"`, `hosts=[Mačka, Pes, Ježko]` |
| `strongyloides_sp_egg` | `species` vždy `"neurčené do druhu"`, `hostGroups=["Mäsožravce","Plazy","Domáce prežúvavce","Voľne žijúce prežúvavce"]` |
| `strongyloides_sp_larva` | rovnako, `latinName="Strongyloides sp."`, `species="neurčené do druhu"` (aj u pôvodne "Strongyloides stercoralis" pri mačke) |
| `dibothriocephalus_latus_egg` | ID zjednotené na malé písmená (bug fix), `genus=Dibothriocephalus`, `synonyms=["Diphyllobothrium latum"]`, `hosts=[Mačka, Pes]` |
| `crenosoma_vulpis_larva` | `hosts=[Pes]` LEN — záznam v `cat.migrated.json` bol chybný, odstránený |
| `taenia_sp_egg` | `hostGroups=["Mäsožravce"]` |
| `dipylidium_caninum_egg`, `uncinaria_stenocephala_egg`, `dirofilaria_immitis_larva`, `dirofilaria_repens_larva` | zlúčené (dáta identické), `hosts=[Pes, Mačka]` (NIE `hostGroups`) |
| `giardia_intestinalis_cyst` | `hostGroups` = 10 koreňových skupín z `host_hierarchy.json` OKREM "Bezstavovce" a "Ryby" |

### 6 pôvodne otvorených skupín (vyriešené v tejto session)
| ID | Rozhodnutie |
|---|---|
| `strongyloides_sp_egg`/`_larva` | pripočítané `hostGroups` podľa vyššie |
| `isospora_sp_oocyst` | nerozdelené, `hosts=[Krkavec, Slimáky, Plazy]`, mikrometria zjednotená na 10–40 / 10–35 µm, `species="neurčené do druhu"`, poznámka o budúcom doplnení rozdielov pri fotkách |
| `myocoptes_musculinus_adult` | nerozdelené, `hosts=[Myš, Plazy]`, kanonické dáta (mikrometria/morfológia) z hlodavčej verzie, `hostNotes.Plazy` = "Pseudoparazit – nález v truse, pôvod pravdepodobne z koristi (hlodavce)." |
| `ligula_intestinalis_plerocercoid` | **ROZDELENÉ** na 2 ID: `ligula_intestinalis_adult` (Vodné vtáky, stage Dospelý jedinec) a `ligula_intestinalis_plerocercoid` (Kaprovité, stage Plerocerkoid) — rôzne vývojové štádium = rôzny diagnostický objekt (`00_PROJECT_CONTEXT.md` §10) |
| `cysticercus_tenuicollis_larva`, `coenurus_serialis_larva`, `cysticercus_pisiformis_larva` (králik) | `cysticercus_tenuicollis_larva` — u králika **neexistuje**, záznam z `rabbit.migrated.json` úplne vymazaný, zostáva `hosts=[Hovädzí dobytok, Ošípaná, Ovca, Voľne žijúce prežúvavce]`. `cysticercus_pisiformis_larva` — kanonické dáta prevzaté z hlodavčej verzie (`sample=Peritoneum`, anatomicky správne), `hosts=[Králik, Hlodavce]`. `coenurus_serialis_larva` — kanonické dáta z ovčej verzie (`sample=Podkožie`), `hosts=[Králik, Ovca]` |
| Drobné nezrovnalosti (`capillaria_sp_egg`, `balantioides_coli_cyst`, `cyniclomyces_guttulatus_yeast`, `nematodirus_sp_egg`, `ostertagia_sp_egg`) | zlúčené podľa všeobecného pravidla "presnejší popis vyhráva" |

### Ostatné duplicitné ID (cattle/sheep_goat/wild_ruminants/pig/horse/rabbit, spolu 20 ID)
Všetky boli v zdrojovej tabuľke autorkou už zjednotené (viď
`docs/2026-08-17_priorita2-import-hostitelia.md`), zvyšné drobné rozdiely v
poli `notes` (napr. "Číra tekutina" vs "Zriedkavo", "Mnohokomorový mechúrik"
vs "Mnohokomorový") boli zlúčené podľa toho istého pravidla "presnejší popis
vyhráva". Zoznam: `cryptosporidium_parvum_oocyst`, `fasciola_hepatica_egg`,
`fascioloides_magna_adult`, `paramphistomum_cervi_egg`,
`dicrocoelium_dendriticum_egg`, `cysticercus_bovis_larva`,
`echinococcus_granulosus_larva`, `echinococcus_multilocularis_larva`,
`moniezia_expanza_egg`, `moniezia_benedeni_egg`, `trichostrongylus_sp_egg`,
`haemonchus_sp_egg`, `strongyloides_papillosus_egg/_larva`, `trichuris_sp_egg`,
`ixodes_ricinus_adult`, `cysticercus_cellulosae_larva`,
`coenurus_cerebralis_larva`, `chabertia_ovina_egg`, `oesophagostomum_sp_egg`,
`dictyocaulus_filaria_larva`.

## Validácia
- 474/474 záznamov má nenulové `id`/`latinName`/`sample`/`stage`.
- 0 duplicitných `id` vo výslednom súbore.
- Všetky jednotky mikrometrie `µm`.
- Žiadny záznam nemá prázdne `hosts` AJ `hostGroups` súčasne (každý objekt je
  priraditeľný aspoň k jednému hostiteľovi/skupine).
- Súčet asociácií hostiteľ↔parazit skontrolovaný skriptom, žiadna strata dát
  oproti pôvodným 14 súborom (mimo explicitne schválených vymazaní: `cat`
  verzia `crenosoma_vulpis_larva`, `rabbit` verzia `cysticercus_tenuicollis_larva`).

## Nedotknuté súbory
`dog.json`, všetkých 14 pôvodných `*.migrated.json` súborov — **NEZMAZANÉ**,
zostávajú v `database/` ako záložný zdroj pravdy, kým nie je zmena kódu
(`DatabaseService.js`, `Repository.js`, `AtlasPage.js`) overená proti novému
`parasites.json` (pozri `AI_STATUS.md` Priorita č. 1, bod 5–7).

## Čo ešte chýba (pozri `AI_STATUS.md` pre presný stav)
1. Úprava `DatabaseService.js`, `Repository.js`, `AtlasPage.js` — **potrebné
   nahrať aktuálny obsah týchto 3 súborov**, doteraz neboli poskytnuté, takže
   diff nebolo možné pripraviť v tejto session (viď návrh nižšie v chate).
2. Doplnenie `02_DATABASE_SPECIFICATION.md` a `10_CHANGELOG.md` — rovnako
   potrebný aktuálny obsah týchto súborov na prípravu presného diffu.
3. Presun starých 14 `*.migrated.json` do `_archive/` — až PO overení kódu.
