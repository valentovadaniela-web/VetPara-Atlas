# VetPara Atlas – AI STATUS (kompletný stav projektu)

🔥 0.6 Aktuálny stav — doplnené (2026‑08‑20, session: code review implementácie Tab 1 admin nástroja, doručenej externe/iným AI)

## ✅ ČO SA VYRIEŠILO V TEJTO SESSION (2026-08-20, session: review admin nástroja)

### Kontext

Autorka nahrala kompletnú implementáciu Tab 1 (`tools/admin/`) admin nástroja, pripravenú externe (iné AI), spolu so sprievodnou správou `Správa_pre_Claude___Implementácia_Admin_nástroja_VetPara_Atlas.md`. Táto session je **len code review** podľa schválenej špecifikácie `docs/2026-08-19_admin-formular-specifikacia.md` — **žiadny kód sa zatiaľ nezapisoval do repozitára**, súbory zostávajú zatiaľ len nahraté v chate.

**Nahraté a skontrolované súbory:** `index.html`, `admin.css`, `admin.js` (kompletný, doplnený až v druhom kole — pôvodne nahratý len ako čiastočný diff s jedinou funkciou `generateId()`), `forms/parasiteForm.js`, `forms/hostForm.js` (placeholder), `forms/imageForm.js` (placeholder), `forms/bulkExcel.js` (placeholder), `diff.js`, `zipExport.js`.

**Zatiaľ NEnahraté** (potrebné na dokončenie reviewu, pozri nižšie): `docs/02_DATABASE_SPECIFICATION.md`, `database/parasites.json`, `database/images.json`, `dictionary/host_hierarchy.json`.

### 🔴 Nájdené nezrovnalosti oproti schválenej špecifikácii (vyžadujú rozhodnutie autorky)

1. **`methods` pole úplne vynechané z formulára.** Schválená špecifikácia (`2026-08-19_admin-formular-specifikacia.md`, §4 riadok 90 a §4.2) výslovne hovorí, že formulár má pole `methods` **ponúknuť ako multi-select**, aj keď v reálnych dátach (474/474) je zatiaľ vždy prázdne. Implementácia (`parasiteForm.js`) ho namiesto toho úplne odstránila z UI aj z `collectFormData()` (natvrdo `methods: []`), s odôvodnením v sprievodnej správe "nepoužíva sa v reálnych dátach" — čo je v rozpore s tým, čo špecifikácia priamo žiada.
2. **`morphology.operculum` úplne vynechané.** Špecifikácia (§4, riadok 90) ho výslovne uvádza medzi poľami, ktoré "formulár musí pokrývať" (voliteľné true/false). Implementácia ho vynechala s odôvodnením "nie je v schéme" — toto tvrdenie zatiaľ neviem overiť, lebo nemám `docs/02_DATABASE_SPECIFICATION.md`.
3. ➡️ **Čaká na rozhodnutie autorky:** buď (a) doplniť `methods` a `morphology.operculum` do formulára podľa pôvodnej schválenej špecifikácie, alebo (b) formálne schváliť ich vynechanie a upraviť samotnú špecifikáciu, aby sedela s kódom. Nerozhodovať to sám (pravidlo č. 8).

### 🔴 Nájdené funkčné chyby v kompletnom `admin.js` (doručenom v tejto session)

1. **Kontrola duplicity ID nezohľadňuje čakajúce zmeny.** V `parasiteForm.js` sa duplicita nového ID kontroluje len voči `state.parasites` (pôvodné dáta), nikdy voči `state.pendingChanges`/`state.workingCopy`. Ak si autorka v jednej session pripraví dva nové záznamy s rovnakým vygenerovaným ID (napr. rovnaké `latinName`+`stage`), nástroj to pri druhom zázname nezachytí ako duplicitu. Toto bola presne otvorená otázka č. 4 zo sprievodnej správy ("Over: Či kontroluje duplicitu voči state.parasites + state.pendingChanges") — odpoveď: **momentálne nie, treba opraviť.**
2. **`state.workingCopy` je fakticky mŕtvy kód.** Je pripravený a aktualizovaný pri `addPendingChange()`/`removePendingChange()`, ale nikde sa nepoužíva — ani na kontrolu duplicity, ani v `zipExport.js` (ten si finálne dáta skladá znova nezávisle priamo zo `state.parasites` + `state.pendingChanges`). Buď ho napojiť na kontrolu duplicity (viď bod vyššie), alebo odstrániť, aby nezavádzal.
3. **Zmazanie (`delete`) záznamu sa v `state.workingCopy` vôbec nespracuje.** `applyChangeToWorkingCopy()` aj `rebuildWorkingCopy()` riešia len `create`/`update`, nie `delete` — súvisí s bodom vyššie (keďže `workingCopy` sa aj tak nikde nepoužíva, zatiaľ to nespôsobuje viditeľnú chybu, ale treba to doplniť, ak sa `workingCopy` bude reálne využívať).
4. **Bočný panel čakajúcich zmien nesprávne označuje zmazania.** `updatePendingUI()` rozlišuje len `create` (🆕 Nový) vs. hocičo iné (✏️ Úprava) — zmazanie záznamu (`action: 'delete'`) sa tak v paneli zobrazí ako "✏️ Úprava", nie ako zmazanie. Pri deštruktívnej akcii je to zavádzajúce a treba opraviť (pridať samostatný badge, napr. 🗑 Zmazanie).
5. **Tvrdenie v sprievodnej správe o dynamických datalistoch nie je celkom presné.** Správa tvrdí, že nové hodnoty `shape`/`colour`/`shell` pridané počas session sa "automaticky objavia v návrhoch" (datalist). V skutočnosti `extractUniqueValues()` číta len zo `state.parasites` (pôvodné dáta), nie zo `state.pendingChanges`/`workingCopy` — nová hodnota zadaná v ešte neexportovanom zázname sa v datalist nenavrhne, kým sa dáta znova nenačítajú. Netreba nutne opravovať (nie je to kritické), ale treba to buď opraviť, alebo aspoň opraviť tvrdenie v dokumentácii.

### 🟡 Čaká na overenie (chýbajú referenčné súbory)

Bez `docs/02_DATABASE_SPECIFICATION.md`, `database/parasites.json`, `database/images.json` a `dictionary/host_hierarchy.json` (autorka ich pošle v ďalšom kroku) zatiaľ nemôžem nezávisle overiť:
- či `morphology.operculum` naozaj nie je v oficiálnej schéme (bod vyššie),
- či `getAllHostGroups()` v `admin.js` správne parsuje reálnu štruktúru `host_hierarchy.json` (kód počíta s tým, že hodnoty môžu byť buď string, alebo pole — spec §5 hárok 3 ale opisuje čisto plochú mapu dieťa→rodič so string hodnotou; treba overiť, ktorý prípad je reálny),
- generovanie ID (`generateId`) voči reálnym 474 záznamom,
- zoznamy `sample`/`stage`/`group` generované cez `extractUniqueValues` voči reálnym dátam.

### Odpovede na otvorené otázky zo sprievodnej správy (návrhy, čaká sa na potvrdenie autorkou)

Bez zmeny oproti predchádzajúcemu zhrnutiu — pozri nižšie v tomto dokumente (staršia session 2026-08-20 vyššie v histórii bola pred touto). Zhrnuté: ID pre "Dospelý jedinec" bez prípony odporúčam ponechať; front po exporte odporúčam ponechať nevyprázdnený + doplniť tlačidlo na ručné vyčistenie; `sessionNewHostEntries` formát `{key, value}` vyzerá rozumne, ale čaká na `host_hierarchy.json` na finálne potvrdenie.

**Nič sa zatiaľ nezapisovalo do `tools/` ani `src/` — toto je stále len review, žiadny súbor nebol autorke odovzdaný ako finálny/schválený.**

---

🔥 0.5 Aktuálny stav — doplnené (2026‑08‑20, session: finalizácia špecifikácie admin formulára, príprava implementácie)

## ✅ ČO SA VYRIEŠILO V TEJTO SESSION (2026-08-20)

### Admin formulár — architektúra POTVRDENÁ, špecifikácia DOPLNENÁ reálnymi dátami

**Analyzované súbory (nahraté a priamo skontrolované):** `database/parasites.json` (474 záznamov, plný obsah), `database/images.json` (33 záznamov, plný obsah), `dictionary/host_hierarchy.json` (81 kľúčov, plný obsah), `docs/02_DATABASE_SPECIFICATION.md`, `docs/03_DATA_ENTRY_STANDARD.md`, `docs/2026-08-19_admin-formular-specifikacia.md`, `src/services/Repository.js` (znovu, na overenie zhody s formulárom).

**Architektúra potvrdená autorkou:** `tools/admin/index.html`, samostatný lokálny nástroj mimo appky, mimo GitHub Pages nasadenia. Odôvodnenie (statický hosting appky = žiadna route v nej nemôže byť súkromná) zostáva zdokumentované v špecifikácii §1.1.

**Rozhodnutie o synchronizácii `parasites.json[].images`:** formulár bude toto pole aktívne udržiavať (doplní ID fotky pri každom pridaní obrázka), hoci appka toto pole momentálne nikde nečíta — prepojenie funguje opačne, cez `images.json.objectId`. Potvrdené 0/474 záznamov malo `images` vyplnené pred touto session.

**Sekcia 4 špecifikácie (`docs/2026-08-19_admin-formular-specifikacia.md`) doplnená reálnymi hodnotami z dát:**
- Kontrolované zoznamy `sample` (20 hodnôt), `stage` (9), `group` (11) — presné zoznamy priamo v špecifikácii.
- `morphology.shape/colour/shell` (24/24/30 hodnôt) — príliš veľké a variabilné na striktný select → rozhodnuté ako **combobox s datalist** (voľné dopĺňanie + našepkávanie).
- `micrometry.unit` — vždy `"µm"` vo všetkých 474 záznamoch → formulár ho predvyplní a uzamkne.
- `methods` — **prekvapenie:** vo všetkých 474 záznamoch prázdne, kontrolovaný zoznam z `03_DATA_ENTRY_STANDARD.md` nemá zatiaľ oporu v dátach. Formulár ho napriek tomu ponúkne (pole je pripravené v schéme).
- `hostGroups` — použité len 4×/474 → formulár pri výbere zobrazí varovanie a vyžiada extra potvrdenie (pravidlo §0.3/0.4).
- Kvalita dát potvrdená: 0 zakázaných placeholder hodnôt, 0 nesprávnych formátov `id`, `zoonosis` vždy boolean.
- `images.json`: štruktúra polí konzistentná vo všetkých 33 záznamoch, `isPrimary` práve 1×/objectId, `sortOrder` súvislý rad bez medzier → formulár bude vedieť bezpečne navrhnúť ďalšie `sortOrder` a automaticky prepnúť `isPrimary` pri novom primárnom obrázku.

**Stav špecifikácie:** 🟢 SCHVÁLENÁ, pripravená na implementáciu. Ďalší krok: návrh konkrétnej štruktúry `tools/admin/index.html` (sekcie formulára) na schválenie autorkou, potom samotný kód.

**Nič sa v `src/` ani `tools/` zatiaľ nemenilo — implementácia ešte nezačala.**

---

🔥 0.4 Aktuálny stav — doplnené (2026‑08‑19, session: diagnóza filtra hostiteľov v Galérii + príprava admin formulára)

## ✅ ČO SA VYRIEŠILO V TEJTO SESSION (2026-08-19, session 3)

### Filter hostiteľa v Galérii — PRÍČINA POTVRDENÁ, KÓD ZATIAĽ NEZMENENÝ (rozhodnutie autorky)

**Analyzované súbory:** `database/images.json` (nahraný, skontrolovaný celý obsah), `src/services/Repository.js` (nahraný, prvýkrát analyzovaný), `src/pages/GalleryPage.js` (nahraný znova pre kontext).

**Potvrdená príčina (= Hypotéza č. 1 z minulej session):**
Všetkých **33 fotografických záznamov** v `database/images.json` (objekty `aelurostrongylus_abstrusus_larva`, `alaria_alata_egg`, `toxascaris_leonina_egg`) má pole `"host": ""` — úplne prázdne, bez výnimky.

V `GalleryPage.js` → `getFilteredImages()`:
```js
if (matchingHosts && matchingHosts.length > 0) {
  if (!img.host) return true;   // vždy zasiahne, lebo VŠETKY fotky majú host: ""
  if (!matchingHosts.some((h) => img.host.includes(h))) return false;
}
```
Keďže `img.host` je pre každú fotku prázdny reťazec, `!img.host` je vždy `true` → **každá fotka prejde filtrom bez ohľadu na zvoleného hostiteľa**. Riadok s `matchingHosts.some(...)` sa nikdy nevykoná.

**Záver: NIE JE to bug v kóde.** Kód robí presne to, čo hovorí komentár `// FIX BUG: prázdny host = fotka patrí všetkým hostiteľom` — zámerná konvencia (pozri §0.3 nižšie). Problém je čisto **dátový**: kým fotky nemajú vyplnené `host`, filter nemá čo odfiltrovať, takže vizuálne "nič nerobí". Autorka v konzole potvrdila, že `getFilteredImages().length` sa pri zmene `filterHost` skutočne nemení — presne zodpovedá tejto diagnóze.

`Repository.resolveHosts()` je funkčný a nesúvisí s problémom — slúži len na naplnenie `datalist` hodnôt (zoznam hostiteľov na výber), tie sa čerpajú z `parasites.json`, nie z `images.json`.

**Rozhodnutie autorky (2026-08-19):** Kód sa **zatiaľ nemení**. Filter začne reálne fungovať, až keď budú fotky mať vyplnené `host` (Priorita č. 2 — postupné dopĺňanie fotografií). Voliteľná možnosť "dočasne vyplniť testovacie `host` hodnoty pre overenie funkčnosti filtra" bola ponúknutá, ale zatiaľ nevyužitá — ostáva otvorená ako rýchla voľba, ak si to autorka bude chcieť overiť skôr.

➡️ **Priorita č. 1 je týmto UZAVRETÁ ako diagnostikovaná** (nie je to bug). Presúva sa do kategórie "čaká na dáta" — pozri §0.2 a Prioritu č. 2 nižšie. Nie je potrebný ďalší debug, kým nepribudnú reálne `host` hodnoty vo fotkách.

---

## 🆕 NOVÁ ÚLOHA (začatá 2026-08-19) — Admin formulár na správu databázy

Autorka chce user-friendly formulár na **jednotlivé** dopĺňanie/úpravy dát (na rozdiel od hromadných zmien cez tabuľku — pozri nižšie). Toto je **nová funkcia appky**, zatiaľ len v štádiu **plánovania/špecifikácie** — žiadny kód ešte nebol napísaný ani schválený. Podľa pravidla č. 8 (nemeniť architektúru bez explicitného súhlasu) najprv pripravujem návrh a čakám na potvrdenie autorky.

### Požiadavky zozbierané od autorky (2026-08-19):

1. **Pridanie nového parazita** (diagnostického objektu) — s kontrolou duplicity ID.
2. **Pridanie nového hostiteľa** — s kontrolou duplicity.
3. **Pridanie sady obrázkov naraz** (2 dohodnuté formáty/veľkosti, názvy podľa `<objectId>_<poradie>.webp` / `_full.webp`) — s kontrolou duplicity.
4. **Doplnenie ďalších obrázkov k už existujúcemu objektu** (nielen vytvorenie nového).
5. **Editovateľné polia** (okrem existujúceho ID): hostiteľ, materiál (sample), štádium (stage), veľkosť, tvar, farba, obal, poznámky.
6. **Pri fotkách:** možnosť nastaviť metadáta ručne, ALEBO automaticky prevziať hostiteľa podľa ID parazita (t.j. z `parasites.json` daného objektu).
7. **Export do tabuľky** (Excel/CSV) — pre rýchly prehľad autorky.
8. **Spätný import tabuľky** — na aplikovanie hromadných zmien (bulk workflow, alternatíva k jednotlivému formuláru).
9. Po odoslaní formulára sa majú **vygenerovať príslušné ovplyvnené súbory**, ktoré si autorka sama nahradí/doplní v repozitári (t.j. appka beží na GitHub Pages ako statický web bez backendu — nemôže priamo zapisovať na disk/do repozitára).

### Otvorené otázky pred návrhom (čakajú na odpoveď autorky):

Kvôli tomu, že appka je nasadená staticky (GitHub Pages, žiadny server), treba pred návrhom vyjasniť **spôsob výstupu** a **miesto behu nástroja**. Otázky boli položené autorke v chate (viď nasledujúca správa) — odpovede doplniť sem po rozhodnutí.

### Architektonické rozhodnutia (potvrdené autorkou 2026-08-19)

| Otázka | Rozhodnutie |
| --- | --- |
| Kde nástroj beží | Samostatný lokálny nástroj (navrhnuté `tools/admin/index.html`, mimo appky — odôvodnenie: appka je na GitHub Pages verejná, `#admin` v rámci nej by bol technicky prístupný komukoľvek) — **čaká na finálne potvrdenie autorky po prečítaní odôvodnenia** |
| Výstup | Sťahovanie `.zip` s aktualizovanými JSON súbormi + premenovanými obrázkami + `README.txt` s návodom, čo kam nahradiť |
| Excel round-trip | `.xlsx` cez SheetJS (`xlsx`, už v `node_modules`) — autorke čitateľnejší ako CSV |

**Plná špecifikácia:** `docs/2026-08-19_admin-formular-specifikacia.md` (pripravená, ešte neschválená do detailu — chýbajú podklady, pozri nižšie).

### Stav (2026-08-19, aktualizované): Schéma polí POTVRDENÁ

`database/parasites.json` (474 záznamov, reálny obsah nahraný a skontrolovaný), `docs/02_DATABASE_SPECIFICATION.md`, `docs/03_DATA_ENTRY_STANDARD.md` a `dictionary/host_hierarchy.json` (162 kľúčov) boli nahraté a analyzované. Sekcia 4 špecifikácie formulára (presné polia, kontrolované slovníky, validačné pravidlá) je teraz doplnená v `docs/2026-08-19_admin-formular-specifikacia.md`.

**Zistené nezrovnalosti dokumentácia vs. realita** (zapísané do špecifikácie formulára, riešiť pri Priorite č. 3 nižšie):
- `images.json` pole `license` je v dokumentácii, v reálnych dátach sa nepoužíva.
- `thumbnail`, `isPrimary`, `sortOrder` reálne existujú a používa ich kód, dokumentácia ich neuvádza.
- `03_DATA_ENTRY_STANDARD.md` §14 označuje `host` pri fotke ako povinný, realita (kód + dáta) ho berie ako voliteľný ("prázdny = platí pre všetkých"). Formulár sa bude riadiť realitou.
- Kontrolované slovníky `samples.json`, `methods.json`, `stages.json`, `shapes.json`, `colours.json`, `shells.json` spomínané v §6 `02_DATABASE_SPECIFICATION.md` **fyzicky v projekte neexistujú** — hodnoty sú zatiaľ len príklady v dokumentácii. Pri implementácii formulára doplním reálne použité hodnoty priamo z `parasites.json`.

**Ešte čaká:** potvrdenie architektúry nástroja autorkou (umiestnenie `tools/admin/`), potom implementácia.

**Nič sa v `src/` ani `tools/` zatiaľ nemenilo.**

---

## ✅ ĎALŠIA ÚLOHA — VYRIEŠENÉ (2026-08-19) — Fulltext vyhľadávanie v Atlase teraz zahŕňa hostiteľov

`src/pages/AtlasPage.js` nahraný, analyzovaný, upravená funkcia `matchesFulltext()`:
- Doplnené `...Repository.resolveHosts(record)` do `haystackParts` — fulltext teraz hľadá aj v **zjednotenom** zozname hostiteľov (explicitné `hosts` + rozbalené `hostGroups`), rovnako ako existujúci filter hostiteľov (`matchesHost` v `renderRecords()`), takže logika je konzistentná naprieč appkou.
- `Repository` bol v súbore už importovaný, žiadny nový import netreba.
- Žiadna iná časť súboru sa nemenila.

✅ Príklad z zadania: "pe" nájde "Pes" (poznámka: "Prepelica"/"Papagáj pestrý" boli len ilustračný príklad autorky, v `host_hierarchy.json` reálne nie sú a netreba ich dopĺňať).

**Stav:** ✅ HOTOVÉ, upravený súbor odovzdaný autorke na nahradenie v `src/pages/AtlasPage.js`. Čaká na naživo overenie autorkou (Live Server).

---

## ✅ ČO SA VYRIEŠILO V PREDOŠLÝCH SESSIONS (2026-08-19, session: oprava ciest k obrázkom pre GitHub Pages)

### Obrázky sa nezobrazovali po nasadení na GitHub Pages — VYRIEŠENÉ, autorka potvrdila naživo

**Príčina:** Appka beží na GitHub Pages ako projektová stránka (`https://<username>.github.io/VetPara-Atlas/`), nie na koreni domény. Cesty k obrázkom v kóde začínali absolútnou lomkou (`/public/images/...`), ktorá sa vždy vyhodnotí voči koreňu domény — chýbal segment `/VetPara-Atlas/`. Lokálne cez Live Server to fungovalo, lebo appka tam beží priamo na koreni.

**Prečo stačí relatívna cesta bez `./` alebo base-path riešenia:** `Router.js` používa výhradne `window.location.hash` (žiadny `history.pushState`), takže skutočná cesta dokumentu (`index.html`) sa pri navigácii medzi routami nikdy nemení. Relatívna cesta bez úvodnej lomky sa preto vždy vyhodnotí správne voči koreňu appky — lokálne aj na GitHub Pages.

**Oprava (hotová, nasadená a naživo overená autorkou na GitHub Pages):**
Vo všetkých 4 miestach, kde sa vykresľuje `<img src="...">`, zmenené `/public/images/${...}` → `public/images/${...}` (odstránená úvodná lomka):
- `PrimaryImage.js` → `populate()`
- `PrimaryImage.js` → `renderStatic()`
- `GalleryPage.js` → `renderGrid()` (thumbnaily v mriežke)
- `GalleryPage.js` → `openLightbox()` (zväčšená fotka v lightboxe)

✅ **Potvrdené naživo (2026-08-19):** Obrázky sa zobrazujú správne lokálne (Live Server) aj na produkcii (GitHub Pages).

## ✅ ČO SA VYRIEŠILO SKÔR

### Priorita (obrázky sa nenačítavali) — VYRIEŠENÉ, appka bola priamo overená naživo

**Skutočná príčina:** Problém nebol v `<base href="/">` ani v tom, z akého koreňa beží server. Projekt sa spúšťa cez **VS Code Live Server**, ktorý servuje súbory presne tak, ako ležia na disku — nerobí žiadne "public ako webroot" mapovanie.

Fyzicky sú fotky uložené v:
```
public/images/parasites/<objectId>/<objectId>_<poradie>.webp        (thumbnail)
public/images/parasites/<objectId>/<objectId>_<poradie>_full.webp   (zväčšená)
```

Oprava: `/images/...` → `/public/images/...` vo všetkých 4 miestach v `PrimaryImage.js` a `GalleryPage.js`. Neskôr (session vyššie) upravené znova na relatívne cesty bez úvodnej lomky kvôli GitHub Pages.

✅ **Filter podľa diagnostického objektu v Galérii funguje správne.**

⚠️ Bug z Priority č. 2 (`getFilteredImages()` — prázdny `host` mal vracať `true`, nie `false`) bol už v kóde opravený (komentár `// FIX BUG: prázdny host = fotka patrí všetkým hostiteľom`).

---

## 0. ⚠️ STAV MIGRÁCIE NA `parasites.json` — PRIORITA PRE KAŽDÉHO ĎALŠIEHO AI

**Toto je najdôležitejšia sekcia tohto dokumentu. Prečítaj ju PRED akoukoľvek prácou na databáze.**

### 0.1 Čo je HOTOVÉ

1. ✅ Autorka rozhodla o všetkých 6 pôvodne otvorených konfliktoch a 11 pôvodných pes/mačka konfliktoch.
2. ✅ `database/parasites.json` vygenerovaný — 474 diagnostických objektov, nahrádza všetkých 14 pôvodných `*.migrated.json` súborov.
3. ✅ `database/images.json` vytvorený — štruktúra je plne prepojená s aplikačnou logikou. Využíva ju Galéria aj `PrimaryImage.js`.
4. ✅ Migračný report: `docs/2026-08-18_parasites-dedup-migration.md`.
5. ✅ `dictionary/host_hierarchy.json` bez zmeny — použitý ako zdroj pre `hostGroups`.

Staré súbory `dog.json`, `dog.migrated.json` ... `wild_ruminants.migrated.json` sa NEMAZALI — zostávajú ako záložný zdroj pravdy, kým nie je appka overená naživo v prehliadači.

### 0.2 Aktuálny stav obrázkov

✅ **Reálne fotografie nahraté a fungujúce pre 3 diagnostické objekty:**
- `aelurostrongylus_abstrusus_larva` (9 fotiek)
- `alaria_alata_egg` (9 fotiek)
- `toxascaris_leonina_egg` (15 fotiek)

⚠️ **Všetky tieto fotky majú prázdne pole `host: ""`** — preto filter hostiteľa v Galérii momentálne nemá viditeľný efekt (pozri diagnostiku vyššie). Toto sa vyrieši prirodzene s dopĺňaním `host` hodnôt (Priorita č. 2) — buď ručne, alebo cez pripravovaný admin formulár.

⬜ **Zostávajúce diagnostické objekty (471 z 474)** ešte nemajú reálne fotografie — autorka ich postupne dopĺňa podľa schválenej konvencie.

✅ **`<img>` implementácia v `PrimaryImage.js` a `GalleryPage.js` je HOTOVÁ.**

⬜ **Stránka Expert** — stále neimplementovaná (iba `console.log`).

⬜ **Presun starých `*.migrated.json` do `_archive/`** — až PO plnom overení appky naživo v prehliadači.

### 0.3 Dôležité pravidlo (nezmenené)

**Nikdy automaticky nepovyšuj `host` na `hostGroups`** bez explicitného potvrdenia autorkou alebo silného dôkazu. V `parasites.json` je toto pravidlo striktne dodržané.

**Konvencia prázdneho `host` u fotiek:** `host: ""` znamená "fotka platí pre všetkých hostiteľov" — toto je zámerné a zakódované v `GalleryPage.getFilteredImages()`. Neplánovať zmenu tejto logiky bez potvrdenia autorkou.

---

## 1. ĎALŠIE KROKY (zoradené podľa priority, aktualizované 2026-08-19)

### ⭐ Priorita č. 1: Admin formulár na správu databázy (špecifikácia HOTOVÁ, čaká sa na implementáciu)

Pozri sekciu "NOVÁ ÚLOHA — Admin formulár" a session 2026-08-20 vyššie. Architektúra aj schéma polí sú potvrdené (`docs/2026-08-19_admin-formular-specifikacia.md`, stav 🟢 SCHVÁLENÉ). Ďalší krok: návrh konkrétnej štruktúry `tools/admin/index.html` na schválenie, potom implementácia.

### ⭐ Priorita č. 2: Doplniť reálne fotografie a `host` hodnoty pre zostávajúce diagnostické objekty

Konvencia je schválená a funkčná (WebP, thumbnail 480px / plná 1600px, `<objectId>_<poradie>.webp` a `_full.webp`, cesty `public/images/parasites/<objectId>/...`). Autorka postupne dodáva fotky + zápisy do `images.json`. Vyplnenie `host` je teraz o niečo dôležitejšie, keďže od neho priamo závisí funkčnosť filtra v Galérii.

### ⭐ Priorita č. 3: Dokumentačné úpravy

- Doplniť `thumbnail`, `isPrimary`, `sortOrder` do `docs/02_DATABASE_SPECIFICATION.md` §9 (zatiaľ len v kóde).
- Odstrániť staré termíny `parasiteId` zo špecifikácie (kód jednotne používa `objectId`).

### ⭐ Priorita č. 4: Chýbajúca stránka Expert

### ⭐ Priorita č. 5: Presun starých `*.migrated.json` do `_archive/`

Po plnom naživo-overení appky (vrátane funkčného filtra hostiteľov, ktorý teraz čaká na dáta, nie na kód).

---

## 2. ZOZNAM DÔLEŽITÝCH SÚBOROV

- `database/parasites.json` — **HOTOVÝ**, 474 záznamov, nahrádza 14 host-súborov.
- `database/images.json` — štruktúra hotová a funkčná, obsahuje reálne dáta pre 3 objekty (33 fotiek, všetky s `host: ""`), čaká na doplnenie zvyšných 471 + vyplnenie `host`.
- `src/components/PrimaryImage.js` — **HOTOVÝ A NAŽIVO OVERENÝ**, cesty k obrázkom relatívne (`public/images/...`).
- `src/pages/GalleryPage.js` — **ČIASTOČNE HOTOVÝ**: cesty k obrázkom a filter objektov fungujú a sú overené; filter hostiteľov **diagnostikovaný, čaká na dáta** (nie je to bug v kóde).
- `src/services/Repository.js` — **ANALYZOVANÝ (2026-08-19)**: `resolveHosts()` funguje správne, slúži na `datalist` a nesúvisí s problémom filtra fotiek.
- `index.html` — overený, relatívne cesty konzistentné s Live Server aj GitHub Pages.
- `App.js` — **OVERENÝ**: správne sekvenovanie, funkčné `window.showAtlasDetail`.
- `Router.js` — **OVERENÝ**: hash routing, relatívne cesty bezpečné na všetkých routách.
- `AtlasPage.js` — **OVERENÉ**: prepojenia a render fungujú podľa plánu.
- Staré `database/*.migrated.json` (14×) — zatiaľ zachované, nemazať.

---

## 3. DÔLEŽITÉ PRAVIDLÁ PRE ĎALŠIEHO AI

1. Nikdy automaticky nepovyšuj `host`/`hosts` na `hostGroups` bez explicitného potvrdenia autorkou.
2. Rozdielna `micrometry`/`sample`/`stage` pri rovnakom ID naprieč hostiteľmi znamená dva rôzne diagnostické objekty.
3. Staré `*.migrated.json` súbory sa NEMAŽÚ, kým nie je appka naživo plne overená v prehliadači.
4. Pred úpravou akéhokoľvek zdrojového súboru si VŽDY vyžiadaj jeho aktuálny obsah — nikdy nehádaj implementáciu.
5. **Projekt sa spúšťa cez VS Code Live Server** — všetky odkazy na statické súbory z `public/` musia v kóde obsahovať prefix `public/...` (relatívne, bez úvodnej lomky — dôležité aj pre GitHub Pages).
6. **Appka je nasadená staticky na GitHub Pages — žiadny backend/server.** Akýkoľvek nový nástroj (napr. admin formulár) musí s týmto obmedzením počítať: nemôže priamo zapisovať do repozitára, musí generovať výstup, ktorý autorka manuálne nahrá/skopíruje.
7. Filter hostiteľa v Galérii NIE JE bug — je to funkcia čakajúca na dáta (`host` hodnoty vo fotkách). Nemeniť túto logiku bez potvrdenia autorkou.

---
