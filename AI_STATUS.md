# VetPara Atlas – AI STATUS (kompletný stav projektu)

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

### ⭐ Priorita č. 1: Admin formulár na správu databázy (v štádiu návrhu, polia potvrdené)

Pozri sekciu "NOVÁ ÚLOHA — Admin formulár" vyššie. Schéma polí je potvrdená (`docs/2026-08-19_admin-formular-specifikacia.md`). Čaká sa na potvrdenie architektúry nástroja (umiestnenie mimo appky, `tools/admin/`).

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
