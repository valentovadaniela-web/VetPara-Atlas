# VetPara Atlas — Špecifikácia: Admin formulár na správu databázy

**Dátum:** 2026-08-19 (aktualizované 2026-08-20)
**Stav:** 🟢 SCHVÁLENÉ — architektúra aj schéma polí potvrdené, pripravené na implementáciu
**Súvisiace:** `AI_STATUS.md` §"NOVÁ ÚLOHA — Admin formulár na správu databázy"

---

## 1. Architektonické rozhodnutia (potvrdené autorkou 2026-08-19)

| Otázka | Rozhodnutie |
| --- | --- |
| Kde nástroj beží | **Samostatný lokálny nástroj**, mimo hlavnej appky — `tools/admin/index.html` — ✅ **finálne potvrdené autorkou 2026-08-20** |
| Ako odovzdáva výstup | **Sťahovanie súborov (.zip)** — žiadny priamy zápis na disk |
| Formát tabuľky pre bulk zmeny | **Excel (.xlsx)** cez knižnicu SheetJS (`xlsx`), ktorá je už v `node_modules` |
| Synchronizácia `parasites.json[].images` | ✅ **Potvrdené 2026-08-20:** formulár pri pridaní/úprave fotky doplní ID fotky aj do `images` poľa príslušného diagnostického objektu (dosiaľ sa toto pole nepoužívalo — 0/474 záznamov ho malo vyplnené, appka číta prepojenie opačným smerom cez `images.json.objectId`; formulár ho odteraz udržiava pre budúcu konzistenciu). |

### 1.1 Odôvodnenie: samostatný nástroj, nie súčasť appky

Odporúčam `tools/admin/index.html` (+ pomocné JS súbory v `tools/admin/`) ako **úplne samostatnú HTML stránku**, nezávislú od `src/app/Router.js` a zvyšku appky. Dôvody:

- Appka beží naživo na GitHub Pages — akákoľvek "skrytá" admin stránka v rámci nej (`#admin`) by bola technicky verejne dostupná (hocikto pozná URL môže tam prísť). Pri statickom hostingu neexistuje spôsob, ako to obmedziť len na teba.
- Projekt už má zavedenú konvenciu `tools/` pre lokálne pomocné skripty (`excel-to-json.js`, `migrate.py`, `migrate-dog-json.js`) — nový admin nástroj do nej zapadá prirodzene.
- Samostatný nástroj sa nemusí riadiť routovaním, štýlmi ani stavom hlavnej appky — jednoduchšie sa bude vyvíjať a nehrozí, že pokazí produkčný web.
- Bude sa spúšťať rovnako ako appka — cez Live Server, len z iného súboru (`tools/admin/index.html` namiesto `index.html`).

✅ **Potvrdené autorkou 2026-08-20.** Toto je finálne architektonické rozhodnutie — `tools/admin/index.html`, mimo appky, mimo GitHub Pages nasadenia.

---

## 2. Prehľad funkcií

### A) Jednotlivé formuláre (pre bežné priebežné dopĺňanie)

1. **Nový parazit** (diagnostický objekt) — vytvorenie záznamu do `parasites.json`.
2. **Nový hostiteľ** — pridanie do `dictionary/host_hierarchy.json`.
3. **Nová sada obrázkov** pre existujúci alebo práve vytváraný objekt — generuje záznamy do `images.json` + premenované súbory obrázkov podľa konvencie.
4. **Doplnenie obrázkov k už existujúcemu objektu** — rovnaký formulár ako 3), len s predvyplneným/vybraným `objectId` z existujúcich záznamov.
5. **Úprava existujúceho záznamu** (parazit alebo obrázok) — všetky polia editovateľné okrem ID.

### B) Hromadný (bulk) workflow cez tabuľku

6. **Export do Excelu** — vyexportuje aktuálny stav `parasites.json` a/alebo `images.json` do `.xlsx`, autorka si prehliadne/upraví v Exceli.
7. **Import Excelu späť** — nástroj načíta upravený `.xlsx`, porovná so stavom v appke (diff), zobrazí prehľad zmien na potvrdenie, vygeneruje aktualizované JSON súbory na stiahnutie.

---

## 3. Spoločná logika (naprieč všetkými formulármi)

### 3.1 Overovanie duplicity

- **Parazit:** kontrola `id` (a pravdepodobne aj kombinácie `latinName` + `stage`, keďže rovnaké ID naprieč hostiteľmi s iným `stage`/`sample`/`micrometry` = iný objekt — pozri pravidlo č. 2 v `AI_STATUS.md`). Presné pravidlo overím podľa `02_DATABASE_SPECIFICATION.md`, ktorý ešte nemám (pozri sekciu 6).
- **Hostiteľ:** kontrola názvu proti existujúcim kľúčom v `host_hierarchy.json` (case-insensitive, aby sa predišlo duplicitám typu "Pes" vs "pes").
- **Obrázok:** kontrola `id` fotky (`<objectId>_<poradie>`) proti existujúcim záznamom v `images.json` pre daný `objectId`, aby sa neprepísalo poradové číslo, ktoré už existuje. Pri "doplnení ďalších obrázkov" nástroj automaticky navrhne ďalšie voľné poradové číslo.

### 3.2 Automatické vyplnenie hostiteľa pri fotkách

Pri nahrávaní obrázkov k existujúcemu `objectId` nástroj načíta príslušný záznam z `parasites.json` a ponúkne **automatické predvyplnenie** poľa hostiteľ (cez `resolveHosts()` logiku zhodnú s `Repository.js`) — s možnosťou ručne prepísať/upraviť, ak fotka platí len pre časť hostiteľov objektu.

### 3.3 Výstup

Po odoslaní formulára (alebo potvrdení importu z Excelu) nástroj vygeneruje **.zip súbor** obsahujúci:
- aktualizované/nové JSON súbory (`parasites.json`, `images.json`, `host_hierarchy.json` — podľa toho, čo sa menilo),
- premenované obrázkové súbory (ak išlo o nahrávanie fotiek), usporiadané v rovnakej priečinkovej štruktúre ako `public/images/parasites/<objectId>/...`,
- `README.txt` v zipe so stručným zoznamom "čo nahradiť/kam skopírovať" pre daný beh.

Autorka si zip rozbalí a súbory ručne nahradí/doplní v repozitári — presne ako je zadané.

### 3.4 Needeštruktívnosť

Nástroj **nikdy neprepíše** dáta ticho — pri úprave existujúceho záznamu vždy zobrazí "pred / po" porovnanie a vyžaduje potvrdenie pred vygenerovaním výstupu. Rovnaká zásada platí pri importe Excelu (diff náhľad pred potvrdením).

---

## 4. Polia formulára (potvrdené podľa `parasites.json`, `02_DATABASE_SPECIFICATION.md`, `03_DATA_ENTRY_STANDARD.md`)

Mapovanie zadania autorky na skutočné polia:

| Požiadavka autorky | Skutočné pole | Poznámka |
| --- | --- | --- |
| hostiteľ | `hosts` (+ `hostGroups`, `hostNotes`) | pozri 4.1 |
| materiál | `sample` | select z kontrolovaného zoznamu |
| štádium | `stage` | select z kontrolovaného zoznamu |
| veľkosť | `micrometry.lengthMin/Max`, `widthMin/Max`, `unit` | jednotka nikdy v texte |
| tvar | `morphology.shape` | select |
| farba | `morphology.colour` | select/combobox |
| obal | `morphology.shell` | select/combobox |
| poznámky | `notes` | voľný text |

Ďalšie polia, ktoré formulár musí pokrývať, aby vytvoril kompletný validný objekt: `latinName`, `synonyms`, `slovakName`, `taxonomy` (7 úrovní), `group`, `diagnosticSigns`, `differentialDiagnosis`, `lifeCycle`, `pathology`, `zoonosis` (checkbox), `references`. Needitovateľné: `id`, `images` (spravuje sa cez formulár na obrázky).

> **Vypustené (2026-08-20, rozhodnutie autorky, `AI_STATUS.md` §0.7):** `methods` a `morphology.operculum` (spolu s `contents`/`texture`/`remarks`) sa formálne nezahŕňajú do formulára ani do schémy — konečné zjednodušenie, nie dočasný stav. Implementácia `parasiteForm.js`, ktorá tieto polia už vynechávala, je tým spätne schválená ako správna.

### 4.1 Hostiteľ — logika

- `hosts`: multi-select, hodnoty výhradne z `host_hierarchy.json`.
- `hostGroups`: multi-select zo skupinových názvov, s varovaním a vyžiadaním potvrdenia (pravidlo §0.3/0.4).
- `hostNotes`: mapa {hostiteľ: poznámka}, len pre vybraných hostiteľov.

### 4.2 Kontrolované slovníky — reálne hodnoty z `parasites.json` (474 záznamov, overené 2026-08-20)

`samples.json`, `methods.json`, `stages.json`, `shapes.json`, `colours.json`, `shells.json` z §6 dokumentácie zatiaľ fyzicky neexistujú. Formulár použije nasledujúce reálne použité hodnoty ako predvolený zoznam (select) + možnosť pridať novú hodnotu (formulár ju v tom prípade zapíše priamo do záznamu; samostatné dictionary súbory sa zatiaľ nezakladajú — mimo rozsahu tejto úlohy, pozri Prioritu č. 3 v `AI_STATUS.md`).

**`sample`** (20 hodnôt, select s možnosťou pridať): Trus, Koža, Žlčník, Moč, Pečeň, Sval, Pľúca, Plášťová dutina, Nozdry, Krv, Črevo, Podkožie, Brušná dutina, Mezentérium, Peritoneum, Mozog, Vzdušné vaky, Pohlavné orgány, Žalúdok, Ústna dutina.

**`stage`** (9 hodnôt, select s možnosťou pridať): Vajíčko, Oocysta, Dospelý jedinec, Larva, Cysta, Trofozoit, Plerocerkoid, Kvasinka, Mesocerkária.

**`group`** (11 hodnôt, select s možnosťou pridať): Protozoa, Nematoda, Cestoda, Arachnida, Insecta, Trematoda, Acanthocephala, Crustacea, Monogenea, Fungi, Pentastomida.

**`morphology.shape`** (24 hodnôt), **`.colour`** (24 hodnôt), **`.shell`** (30 hodnôt): vysoký počet variantov vrátane kombinovaných formulácií (napr. "Okrúhly až oválny", "Bezfarebný až svetlo hnedý", "Hrubá, embryofor s radiálnym pruhovaním") → tieto tri polia budú **combobox s voľným dopĺňaním** (datalist), nie striktný uzavretý select — kontrolovaný zoznam slúži len ako našepkávač, autorka môže vždy zapísať vlastnú kombináciu. Presné zoznamy hodnôt doplním priamo do kódu pri implementácii (sú príliš dlhé na túto špecifikáciu).

**`micrometry.unit`**: vo všetkých 474 záznamoch výhradne `"µm"` → formulár toto pole **predvyplní a uzamkne** (needituje sa, eliminuje riziko preklepu), s možnosťou odomknúť len ak by v budúcnosti pribudla iná jednotka.

**`methods`**: vo všetkých 474 záznamoch bolo pole prázdne (`[]`). **Rozhodnutie autorky (2026-08-20, `AI_STATUS.md` §0.7):** pole sa formálne vypúšťa zo schémy aj z formulára — nebude ponúkané ako multi-select. Konečné zjednodušenie, nie dočasný stav.

**`hostGroups`**: použité len v **4 zo 474** záznamov (`strongyloides_sp_egg`, `strongyloides_sp_larva`, `taenia_sp_egg`, `giardia_intestinalis_cyst`). Formulár pri zaškrtnutí/výbere akejkoľvek hodnoty v `hostGroups` zobrazí explicitné varovanie s odkazom na pravidlo §0.3/0.4 (`AI_STATUS.md`) a vyžiada dodatočné potvrdenie — ide o výnimku, nie normu.

**Kvalita dát (potvrdené, žiadny zásah netreba):** 0 záznamov so zakázanými placeholder hodnotami, 0 nesprávnych formátov `id`, `zoonosis` je vo všetkých záznamoch typu boolean.

### 4.3 Validačné pravidlá

- Povinné: `id`, `latinName`, `sample`, `stage`.
- Zakázané placeholder hodnoty (`?`, `-`, `Neznáme`, `N/A`, `cca`, `~` a pod.) — formulár ich odmietne, vynúti `null`/prázdne pole.
- `id` sa generuje automaticky z `latinName` + `stage`, needituje sa po prvom uložení.
- Jednotka mikrometrie vždy v samostatnom poli `unit`, nikdy v čísle.

### 4.4 Polia pre obrázky (`images.json`)

`id`, `objectId`, `author`, `laboratory`, `year`, `host`, `sample`, `stage`, `method`, `objective`, `magnification`, `filename`, `thumbnail`, `isPrimary`, `sortOrder`, `description`.

✅ **Vyriešené (2026-08-20, Priorita č. 3):** `02_DATABASE_SPECIFICATION.md` §9 bol upravený — `license` odstránené zo schémy, `thumbnail`/`isPrimary`/`sortOrder` doplnené. Dokumentácia teraz zodpovedá realite (kódu aj dátam).

⚠️ **Stále na vedomie:**
- Dokumentácia (pred touto úpravou) označovala `host` pri fotke ako povinný, realita (kód aj dáta) ho berie ako voliteľný s konvenciou "prázdny = platí pre všetkých". Formulár sa riadi realitou (kódom). Túto poznámku treba overiť aj v `03_DATA_ENTRY_STANDARD.md` §14 (nebol nahraný v tejto session).

Formulár pre fotky: nahratie súborov (kontrola, že každá fotka má presne 2 varianty — thumbnail aj `_full`), výber `objectId`, automatické predvyplnenie `host` cez `resolveHosts()` (3.2), ostatné polia voliteľné.

**Overené na reálnych 33 záznamoch (3 objekty, 2026-08-20):** štruktúra polí je vo všetkých záznamoch identická (žiadne chýbajúce/navyše kľúče), `isPrimary: true` sa vyskytuje **presne raz na `objectId`**, `sortOrder` tvorí súvislý rad `1..N` bez medzier. Formulár pri "doplnení ďalších obrázkov" k existujúcemu `objectId`:
- navrhne ďalšie `sortOrder` ako `max(existujúce sortOrder pre daný objectId) + 1`,
- ak autorka označí novú fotku ako `isPrimary: true`, formulár automaticky nastaví `isPrimary: false` na predošlej primárnej fotke toho istého `objectId` (nikdy nesmú byť dve primárne súčasne — pred zápisom zobrazí v "pred/po" náhľade aj túto vedľajšiu zmenu, pozri 3.4),
- doplní ID novej fotky do `parasites.json[objectId].images` (pozri potvrdenie v sekcii 1).

---

## 5. Formát Excel exportu/importu

Zošit má **3 hárky**:

### Hárok 1 — "Parazity" (`parasites.json`, 1 riadok = 1 diagnostický objekt)

Vnorené polia sa rozbaľujú do samostatných stĺpcov, zoznamy sa zapisujú ako text oddelený `;`:

| Stĺpec | Zdrojové pole | Formát |
| --- | --- | --- |
| `id` | `id` | needitovateľný (podfarbený), pri novom riadku prázdny |
| `latinName` | `latinName` | text |
| `synonyms` | `synonyms` | `;`-zoznam |
| `slovakName` | `slovakName` | text |
| `taxonomy.kingdom` … `taxonomy.species` | `taxonomy` | 7 samostatných stĺpcov |
| `hostGroups` | `hostGroups` | `;`-zoznam, stĺpec vizuálne zvýraznený (výnimočné pole, pozri §0.3/0.4) |
| `hosts` | `hosts` | `;`-zoznam |
| `hostNotes` | `hostNotes` | `Hostiteľ: poznámka; Hostiteľ2: poznámka2` |
| `sample`, `stage`, `group` | — | text |
| `micrometry.lengthMin/Max`, `widthMin/Max` | `micrometry` | 4 číselné stĺpce |
| `micrometry.unit` | — | needitovateľný, vždy `µm` |
| `morphology.shape/colour/shell` | `morphology` | 3 stĺpce |
| `diagnosticSigns`, `differentialDiagnosis`, `references` | — | `;`-zoznam |
| `lifeCycle`, `pathology`, `notes` | — | voľný text |
| `zoonosis` | — | `TRUE`/`FALSE` |
| `images` | — | `;`-zoznam ID fotiek, **needitovateľný** — spravuje sa výhradne cez hárok "Fotografie" alebo Tab 3, nie ručne tu |

### Hárok 2 — "Fotografie" (`images.json`, 1 riadok = 1 fotka)

Stĺpce: `id`, `objectId`, `host`, `author`, `laboratory`, `year`, `sample`, `stage`, `method`, `objective`, `magnification`, `filename`, `thumbnail`, `isPrimary` (`TRUE`/`FALSE`), `sortOrder` (číslo), `description`. `id` needitovateľný rovnako ako v hárku 1.

### Hárok 3 — "Hostitelia" (`dictionary/host_hierarchy.json`, 1 riadok = 1 kľúč hierarchie) — nové, doplnené 2026-08-20

Plochá mapa dieťa→rodič sa premietne priamo do dvoch stĺpcov:

| Stĺpec | Význam |
| --- | --- |
| `nazov` | kľúč zo slovníka (konkrétny hostiteľ **alebo** skupina — pozri §4.1, v tejto štruktúre niet medzi nimi rozdielu) |
| `nadradena_skupina` | hodnota (priamy rodič); prázdne = najvyššia úroveň. V reálnych dátach (78 kľúčov, overené 2026-08-20) existuje **12 najvyšších skupín, ktoré samy nemajú rodiča** a teda nie sú kľúčom v súbore, len hodnotou v stĺpci `nadradena_skupina` iných riadkov: `Vtáky`, `Plazy`, `Mäsožravce`, `Hlodavce`, `Domáce prežúvavce`, `Voľne žijúce prežúvavce`, `Zajace, králiky`, `Ošípané, diviaky`, `Nepárnokopytníky`, `Hmyzožravce`, `Ryby`, `Bezstavovce`. Tieto sa v Exceli **nezobrazujú ako vlastný riadok** (nie sú kľúčom), pokiaľ ich autorka sama nezadá ako nový riadok s vlastným `nadradena_skupina` (napr. `Cicavce`). |

Autorka mení/dopĺňa zriedkavo — hárok slúži hlavne na **prehľad** celej hierarchie na jednom mieste (namiesto prechádzania Tab 2 formulárom po jednom zázname) a na hromadnú opravu, ak by bolo treba prekvalifikovať viac hostiteľov naraz (napr. presun skupiny hostiteľov pod iného rodiča).

**Validácia pri importe:** ak `nadradena_skupina` odkazuje na hodnotu, ktorá nie je ani existujúcim kľúčom, ani novým riadkom v tom istom importe, nástroj to nahlási ako chybu (visiaci odkaz na neexistujúcu skupinu) a import pre daný riadok odmietne, kým sa neopraví.

### Spoločné pravidlá pre všetky 3 hárky

- Prvý stĺpec `id` (hárky 1–2) / `nazov` (hárok 3) je vždy needitovateľný, vizuálne odlíšený (sivé podfarbenie).
- **Detekcia nového záznamu:** prázdny `id`/`nazov` pri importe = návrh na vytvorenie. Pre hárky 1–2 sa `id` vygeneruje automaticky (rovnaká logika ako v Tab 1/3 formulári — `latinName`+`stage`, resp. `<objectId>_<ďalšie voľné číslo>`); pre hárok 3 je `nazov` vždy zadaný autorkou priamo (skupiny/hostitelia nemajú automaticky generovaný názov).
- **Ochrana pred omylom premenovaným `id`:** pri exporte sa do každého hárku pridá skrytý pomocný stĺpec s pôvodnou hodnotou `id`/`nazov`. Ak sa pri importe viditeľná hodnota u riadku, ktorý predtým mal `id`/`nazov` vyplnené, líši od skrytej pôvodnej hodnoty, nástroj to **nevyhodnotí ticho ako "zmizol starý + pribudol nový"** — označí to ako podozrivú zmenu vyžadujúcu explicitné potvrdenie v diff náhľade.
- Zmenené riadky = návrh na úpravu (diff pred/po). Chýbajúce riadky (boli v appke, chýbajú v Exceli) sa **nemažú automaticky** — len sa upozorní, autorka rozhodne.

---

## 6. Čo ešte potrebujem, aby som mohol spresniť túto špecifikáciu a začať s implementáciou

Aby som nehádal schému dát (čo je proti pravidlám projektu), potrebujem nahrať:

1. **`docs/02_DATABASE_SPECIFICATION.md`** — presná schéma polí `parasites.json` (názvy polí pre veľkosť/tvar/farbu/obal/micrometriu atď.) a `images.json`.
2. **`database/parasites.json`** (stačí aj len niekoľko reálnych záznamov ako ukážka, ak je súbor veľký) — aby som videl reálnu štruktúru, nie len špecifikáciu.
3. **`dictionary/host_hierarchy.json`** — aby som navrhol formulár na pridanie nového hostiteľa podľa reálnej štruktúry hierarchie.
4. **`docs/03_DATA_ENTRY_STANDARD.md`** (ak existuje relevantný obsah k pravidlám zápisu dát) — pre validácie vo formulári (napr. povolené hodnoty pre `stage`, formát `micrometry` a pod.).

Po nahratí týchto súborov doplním sekciu 4 (presné polia) a môžeme prejsť k samotnej implementácii (`tools/admin/index.html`).

---