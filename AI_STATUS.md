# VetPara Atlas – AI STATUS
Aktualizované: 2026-08-12
Branch: develop
Git: working tree clean (pred touto zmenou — nezabudni commitnúť nový dog.migrated.json)

## 1. Milestone
Milestone 1 – Core Foundation (Atlas + databáza + migrácia) → **prechod na dopĺňanie odborných dát**

## 2. Posledná vykonaná zmena
1. Merge `dog_worksheet.xlsx` (SAMPLE/STAGE/GROUP/morphology/micrometry) do `dog.migrated.json`.
2. Doplnková oprava: pri `toxocara_canis` (tvar okrúhly, zdrojové rozpätie „75-90" bez „x")
   doplnené `widthMin`/`widthMax` = `lengthMin`/`lengthMax` (75/90), podľa pravidla autorky
   projektu: rozpätie bez „x" pri okrúhlych objektoch znamená rovnakú dĺžku aj šírku.
   Pravidlo **zámerne neaplikované** na červovité/vláknité tvary (`dirofilaria_repens` a i.),
   kde by šírka = dĺžka bola biologicky nezmyselná — tie zostávajú s `width = null`,
   pozri `merge_report.md`, kap. 5b.

Vykonané v Claude chate, výstup treba stiahnuť a nahradiť `database/dog.migrated.json`
v repozitári + commitnúť.

Súbory na stiahnutie z tejto session:
- `dog.migrated.json` (nová verzia, 37 záznamov, nahrádza starú 35-záznamovú)
- `merge_report.md` (kompletný zoznam zmien, konfliktov a TODO, vrátane kap. 5b)

**dog.json (pôvodná surová databáza) NEBOL menený — podľa pravidla.**

## 3. Aktuálny stav projektu
Aplikácia je funkčná, databáza sa načítava, AtlasPage renderuje záznamy podľa novej schémy.
Databáza psa má teraz vyplnené `host`, `sample`, `stage`, `group` a doplnenú/spresnenú
mikrometriu a morfológiu pre všetkých 37 diagnostických objektov.

### 3.1 Funkčné časti
- **App.js** – bootstrap, načítanie databázy, routing
- **Router.js** – hash-based router, stabilný
- **ApplicationState.js** – globálny stav, filtre, ready flag
- **DatabaseService.js** – načítanie databázy, cache, getRecordById
- **Repository.js** – vyhľadávanie, filtrovanie, triedenie
- **AtlasPage.js** – kompletné UI, filtre, detail záznamu
- **dog.migrated.json** – **NOVÁ VERZIA (37 záznamov)**, pozri merge_report.md
- **migrate-dog-json.js** – pôvodná migrácia z dog.json, stále platná ako prvý krok
- **index.html** – základná štruktúra aplikácie
- **main.js** – inicializácia App.start()

### 3.2 Čo funguje technicky
(bez zmeny oproti predchádzajúcemu stavu — App/Router/Repository/AtlasPage neboli v tomto
kroku menené, iba dáta)

### 3.3 Zmena schémy ID — DÔLEŽITÉ
Staré ID tvaru `dog_0001`…`dog_0035` (vznikli slugifikáciou `DOG-00xx`) boli nahradené
sémantickými ID podľa `03_DATA_ENTRY_STANDARD.md` (napr. `toxocara_canis`,
`giardia_intestinalis`, `alaria_alata_egg`). Pôvodné legacy ID je zachované v novom poli
`legacyId`. **Skontroluj, či `AtlasPage.js`/`Repository.js` niekde nepredpokladajú konkrétny
formát `id` (napr. regex na `dog_\d+`) — pri rýchlej kontrole kódu som takú závislosť
nenašiel, ale over pred nasadením.**

### 3.4 Čo nefunguje / je prázdne
- Gallery page – placeholder
- Expert page – placeholder
- Settings page – placeholder
- `taxonomy` je prázdne vo všetkých 37 záznamoch — čaká na budúci import
  kingdom–phylum–class–order–family–genus–species (spomenuté ako budúca priorita)
- `diagnosticSigns` je prázdne — časť dát (napr. "výrastok na chvoste" pri
  Angiostrongylus vasorum) sa oplatí doplniť spätne z pôvodných textov, pozri
  merge_report.md bod 5
- `differentialDiagnosis`, `images`, `references`, `zoonosis`, `methods` — prázdne pri
  všetkých záznamoch
- `group` obsahuje pri 2 objektoch (Demodex spp., Linguatula serrata) hodnoty mimo
  kontrolovaného zoznamu z `02_DATABASE_SPECIFICATION.md` — dočasne ponechané doslovne
  podľa rozhodnutia autorky projektu, čaká na taxonomické rozšírenie
- Repository zatiaľ neaplikuje ApplicationState.filters (iba lokálne filtre v AtlasPage)

### 3.5 Databáza – stav
- **dog.json** – pôvodná schéma, ploché polia, NEMENENÉ
- **dog.migrated.json** – nová schéma, teraz 37 záznamov (bolo 35), doplnené o dáta
  z `dog_worksheet.xlsx`
- **dog_worksheet.xlsx** – zdrojový pracovný hárok (host/sample/stage/group/morphology
  potvrdené), spracovaný, možno archivovať alebo ponechať ako referenciu
- **Mikrometria__parazity.xls** – 16 hárkov podľa hostiteľa; hárok "Psy" už spracovaný
  (duplicitný k dog_worksheet.xlsx), zvyšných 15 hárkov je pripravených pre budúcich
  hostiteľov (Etapa 2)

### 3.6 Architektúra
(bez zmeny — pozri predchádzajúcu verziu AI_STATUS.md)

---

## 4. Posledné zmeny v súboroch
- database/dog.migrated.json – **nahradiť novou verziou z tejto session (37 záznamov)**
- (nový) merge_report.md – zdokumentovať v docs/ alebo priložiť ku commitu ako changelog príloha

---

## 5. Posledný problém
Žiadny aktívny technický problém. Treba len:
1. stiahnuť nový `dog.migrated.json` a nahradiť ním súbor v `database/`,
2. skontrolovať kód na prípadnú závislosť od starého formátu `id`,
3. commitnúť s referenciou na merge_report.md.

---

## 6. Ďalší krok (pre Claude / Gemini / DeepSeek)
1. Overiť/nahradiť `database/dog.migrated.json` v repozitári novou verziou
2. Doplniť `diagnosticSigns` zo stratených opisných fráz (pozri merge_report.md bod 5)
3. Rozhodnúť o štruktúre `taxonomy` a spôsobe zápisu `group` pre Acari/Pentastomida
4. Implementovať Gallery page (zatiaľ placeholder)
5. Implementovať Expert page (diagnostický systém) — má teraz zmysel, keďže `sample`/`stage`
   sú vyplnené
6. Rozšíriť Repository o podporu ApplicationState.filters
7. Pridať error page pre neexistujúce ID
8. Pridať preloader pri načítaní databázy
9. Spracovať zvyšných 15 hárkov z Mikrometria__parazity.xls pre ďalších hostiteľov (Etapa 2)
10. Doplniť šírku pre `dirofilaria_repens`, `dirofilaria_immitis`, `oslerus_filaroides_osleri`
    z odbornej literatúry (mikrofilárie majú šírku rádovo 5–7 µm, nie rovnakú ako dĺžku —
    pozri merge_report.md kap. 5b)

---

## 7. Dôležité pravidlá pre AI
- AI musí vždy načítať aktuálne súbory pred zmenou
- AI musí aktualizovať AI_STATUS.md po každej zmene
- AI nesmie meniť architektúru bez súhlasu
- AI nesmie prepisovať dog.json (iba dog.migrated.json)
- AI nesmie dopĺňať odborné údaje odhadom
- AI musí rešpektovať databázovú štruktúru podľa 02_DATABASE_SPECIFICATION.md
- Projekt je hlavný zdroj pravdy (nie konverzácia)
- Git commit po každej zmene

---
