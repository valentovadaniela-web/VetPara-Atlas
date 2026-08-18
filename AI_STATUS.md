# VetPara Atlas – AI STATUS (kompletný stav projektu)

🔥 0.2 Aktuálny stav — doplnené (2026‑08‑18, session: oprava načítania obrázkov, nový bug – filter hostiteľov v Galérii)

## ✅ ČO SA VYRIEŠILO V TEJTO SESSION

### Priorita č. 1 (obrázky sa nenačítavali) — VYRIEŠENÉ, appka bola priamo overená naživo

**Skutočná príčina (nie tá, ktorú predpokladal predošlý AI):**
Problém nebol v `<base href="/">` ani v tom, z akého koreňa beží server. Projekt sa spúšťa cez **VS Code Live Server**, ktorý servuje súbory presne tak, ako ležia na disku — nerobí žiadne "public ako webroot" mapovanie (na rozdiel od Vite / CRA).

Fyzicky sú fotky uložené v:
```
public/images/parasites/<objectId>/<objectId>_<poradie>.webp        (thumbnail)
public/images/parasites/<objectId>/<objectId>_<poradie>_full.webp   (zväčšená)
```

Ale kód (`PrimaryImage.js`, `GalleryPage.js`) na ne odkazoval ako `/images/...` — chýbal segment `public/`. `index.html` mimochodom tento segment správne používal (`href="public/favicon.ico"`), takže nekonzistencia bola len v komponentoch obrázkov.

**Oprava (hotová, nasadená a naživo overená):**
Vo všetkých 4 miestach, kde sa vykresľuje `<img src="...">`, zmenené `/images/${...}` → `/public/images/${...}`:
- `PrimaryImage.js` → `populate()` (dynamické načítanie v Atlase)
- `PrimaryImage.js` → `renderStatic()` (statické vykreslenie v Atlase)
- `GalleryPage.js` → `renderGrid()` (thumbnaily v mriežke Galérie)
- `GalleryPage.js` → `openLightbox()` (zväčšená fotka v lightboxe)

✅ **Potvrdené naživo (2026-08-18):** Fotky sa v Galérii aj v Atlase (`PrimaryImage`) zobrazujú správne pre všetky 3 objekty, ktoré majú v `public/images/parasites/` reálne súbory:
- `aelurostrongylus_abstrusus_larva`
- `alaria_alata_egg`
- `toxascaris_leonina_egg`

✅ **Filter podľa diagnostického objektu v Galérii funguje správne.**

⚠️ **Bug z Priority č. 2 (`getFilteredImages()` — prázdny `host` mal vracať `true`, nie `false`) bol už v kóde opravený** (obsahuje komentár `// FIX BUG: prázdny host = fotka patrí všetkým hostiteľom`) — nebolo potrebné nič meniť, len potvrdené v kóde.

---

## 🆕 NOVÝ BLOKUJÚCI PROBLÉM — filter podľa hostiteľa v Galérii nefunguje

**Popis:** Vo filteroch Galérie funguje vyhľadávanie podľa diagnostického objektu (`gallery-filter-object`), ale filter podľa hostiteľa (`gallery-filter-host`) **nemá žiadny viditeľný efekt** — výsledky sa nezmenia bez ohľadu na to, aký hostiteľ sa zadá/vyberie.

**Zatiaľ NEOVERENÉ (úloha na zajtra) — pravdepodobné hypotézy, zoradené podľa pravdepodobnosti:**

1. **Najpravdepodobnejšia príčina:** Všetky fotky, ktoré sú momentálne v `database/images.json`, majú pole `host` prázdne (`""`) — čo je podľa dohodnutej konvencie správne pre "fotka platí pre všetkých hostiteľov", ALE má to nežiaduci vedľajší efekt: keď je `img.host` prázdny, `getFilteredImages()` fotku **vždy prepustí** (`if (!img.host) return true;`), takže výber ľubovoľného hostiteľa vizuálne nič nezmení — všetky fotky prejdú filtrom vždy. Toto môže byť "correct by design", ale z pohľadu užívateľa to vypadá ako "filter nefunguje", pretože nikdy nič neodfiltruje.
   → **Treba overiť:** otvoriť `database/images.json` a skontrolovať, či majú existujúce 3 fotografické objekty vyplnené `host` (napr. `"pes"`, `"mačka"`) alebo je pole prázdne u všetkých.

2. **Alternatívna príčina:** `Repository.resolveHosts(record)` (volaná v `getFilteredImages()` aj `populateHostDatalist()`) môže vracať formát hostiteľov, ktorý sa nezhoduje s tým, čo je uložené v `img.host` (napr. rôzne veľké/malé písmená, diakritika, plurál/singulár, alebo kód vs. slovenský názov typu `"dog"` vs. `"pes"`). Porovnanie `img.host.includes(h)` je case-sensitive a nerobí normalizáciu.
   → **Treba overiť:** obsah `Repository.js`, konkrétne `resolveHosts()`, a porovnať výstupné stringy s hodnotami `host` v `images.json`.

3. **Menej pravdepodobné:** event listener na `gallery-filter-host` inpute sa nespúšťa alebo `datalist` (`gallery-host-list`) sa nenaplní žiadnymi hodnotami, takže užívateľ fakticky nemá z čoho vyberať a text, ktorý napíše, sa nezhoduje s ničím v `matchingHosts` (čo by ale znamenalo filtered.length === 0, nie "žiadny efekt" — treba overiť, čo presne užívateľ vidí: nezmenia sa výsledky vôbec, alebo zmenia sa na prázdny zoznam?).

**Súbory, ktoré bude na debugovanie potrebné znova otvoriť:**
- `database/images.json` (obsah `host` poľa u reálnych záznamov)
- `src/services/Repository.js` (funkcia `resolveHosts()`) — **tento súbor ešte neboli v tejto session nahraný ani analyzovaný**
- `src/pages/GalleryPage.js` (`getFilteredImages()`, `populateHostDatalist()`) — už analyzované, kód vyzerá logicky OK, podozrenie smeruje k dátam alebo k `Repository.resolveHosts()`

**Odporúčaný prvý krok na zajtra:** Otvoriť DevTools konzolu, do Galérie zadať `console.log(GalleryPage.state.images.map(i => i.host))` a `console.log(GalleryPage.getFilteredImages().length)` s vyplneným aj prázdnym `filterHost`, aby sa hneď zistilo, či ide o dátový problém (hypotéza 1) alebo o nezhodu stringov (hypotéza 2).

---

## 🔧 Historické zistenia (predošlé sessions, kontext k pôvodnému image-loading bugu — už vyriešené, zachované pre históriu)

Projekt bol presunutý z dvojitého koreňa VetParaAtlas/VetPara-Atlas do jedného koreňa.
Štruktúra je teraz správna, server sa spúšťa z koreňa projektu (VS Code Live Server).

Predošlé sessions sa nazdávali, že príčina 404 je nesprávny `<base href="/">` alebo že server beží z podadresára. Toto sa **NEPOTVRDILO**. Skutočná príčina bola nekonzistencia ciest medzi kódom (`/images/...`) a fyzickým umiestnením (`public/images/...`) — pozri vyriešenú sekciu vyššie.

| Súbor | Zmena | Stav |
| --- | --- | --- |
| `PrimaryImage.js` | Cesty `/images/...` → `/public/images/...` v `populate()` a `renderStatic()` | ✅ Hotové a naživo overené |
| `GalleryPage.js` | Cesty `/images/...` → `/public/images/...` v `renderGrid()` a `openLightbox()` | ✅ Hotové a naživo overené |
| `GalleryPage.js` | Bug `if (!img.host) return false` → `return true` | ✅ Už bolo opravené v predošlej session, potvrdené |
| `images.json` | Overený proti fyzickým súborom, všetky položky sú validné | ✅ Hotové |
| Štruktúra projektu | Presun z dvojitého koreňa do jedného | ✅ Hotové |

**Dátum aktualizácie:** 2026-08-18 (session: oprava ciest k obrázkom v `PrimaryImage.js` a `GalleryPage.js`, naživo overené v prehliadači; zistený nový bug — filter hostiteľov v Galérii nemá efekt)
**Branch:** develop
**Verzia projektu:** v17-in-progress (obrázky HOTOVÉ a naživo overené, filter podľa objektu HOTOVÝ a overený, filter podľa hostiteľa NEFUNKČNÝ — čaká na debug)

---

## 0. ⚠️ STAV MIGRÁCIE NA `parasites.json` — PRIORITA PRE KAŽDÉHO ĎALŠIEHO AI

**Toto je najdôležitejšia sekcia tohto dokumentu. Prečítaj ju PRED akoukoľvek prácou na databáze.**

### 0.1 Čo je HOTOVÉ (2026-08-18, predošlé sessions)

1. ✅ Autorka rozhodla o všetkých 6 pôvodne otvorených konfliktoch a 11 pôvodných pes/mačka konfliktoch.
2. ✅ `database/parasites.json` vygenerovaný — 474 diagnostických objektov, nahrádza všetkých 14 pôvodných `*.migrated.json` súborov.
3. ✅ `database/images.json` vytvorený — štruktúra je plne prepojená s aplikačnou logikou. Využíva ju Galéria aj `PrimaryImage.js`.
4. ✅ Migračný report: `docs/2026-08-18_parasites-dedup-migration.md`.
5. ✅ `dictionary/host_hierarchy.json` bez zmeny — použitý ako zdroj pre `hostGroups`.

Staré súbory `dog.json`, `dog.migrated.json` ... `wild_ruminants.migrated.json` sa NEMAZALI — zostávajú ako záložný zdroj pravdy, kým nie je appka overená naživo v prehliadači.

### 0.2 Aktuálny stav obrázkov (aktualizované 2026-08-18)

✅ **Reálne fotografie nahraté a fungujúce pre 3 diagnostické objekty:**
- `aelurostrongylus_abstrusus_larva` (9 fotiek)
- `alaria_alata_egg` (9 fotiek)
- `toxascaris_leonina_egg` (15 fotiek)

⬜ **Zostávajúce diagnostické objekty (471 z 474)** ešte nemajú reálne fotografie — autorka ich postupne dopĺňa podľa schválenej konvencie (§0.2 nižšie v pôvodnej sekcii Priority č. 2).

✅ **`<img>` implementácia v `PrimaryImage.js` a `GalleryPage.js` je HOTOVÁ** (emoji placeholdery nahradené reálnymi `<img>` tagmi, cesty opravené, naživo overené).

⬜ **Stránka Expert** — stále neimplementovaná (iba `console.log`).

⬜ **Presun starých `*.migrated.json` do `_archive/`** — až PO plnom overení appky naživo v prehliadači (blokuje ho ešte nedoriešený filter hostiteľov).

### 0.3 Dôležité pravidlo (nezmenené)

**Nikdy automaticky nepovyšuj `host` na `hostGroups`** bez explicitného potvrdenia autorkou alebo silného dôkazu. V `parasites.json` je toto pravidlo striktne dodržané.

---

## 1. ĎALŠIE KROKY (zoradené podľa priority, aktualizované 2026-08-18)

### ⭐ Priorita č. 1: Opraviť filter hostiteľov v Galérii (NOVÉ, kritické pre dokončenie Galérie)

Pozri detailnú diagnostiku vyššie v sekcii "NOVÝ BLOKUJÚCI PROBLÉM". Skrátený checklist na zajtra:

1. Otvoriť `database/images.json`, skontrolovať hodnoty poľa `host` pre 3 existujúce fotografické objekty.
2. Nahrať/skontrolovať `src/services/Repository.js`, konkrétne `resolveHosts()` — porovnať formát výstupu s hodnotami v `images.json`.
3. V DevTools konzole overiť `GalleryPage.state.images` a výstup `getFilteredImages()` s a bez `filterHost`.
4. Podľa zistenia oprava buď v dátach (`images.json`), alebo v `Repository.resolveHosts()`, alebo v porovnávacej logike `getFilteredImages()`.

### ⭐ Priorita č. 2: Doplniť reálne fotografie pre zostávajúce diagnostické objekty

Konvencia je schválená a funkčná (WebP, thumbnail 480px / plná 1600px, `<objectId>_<poradie>.webp` a `_full.webp`, cesty `public/images/parasites/<objectId>/...`, cesty v kóde `/public/images/...`).
Autorka postupne dodáva fotky + zápisy do `images.json` podľa tejto konvencie pre zostávajúcich 471 objektov.

### ⭐ Priorita č. 3: Dokumentačné úpravy

- Doplniť `thumbnail`, `isPrimary`, `sortOrder` do `docs/02_DATABASE_SPECIFICATION.md` §9 (zatiaľ len v kóde).
- Odstrániť staré termíny `parasiteId` zo špecifikácie (kód jednotne používa `objectId`).

### ⭐ Priorita č. 4: Implementovať formulár na správu záznamov (sekcia 0.5, nezmenené)

### ⭐ Priorita č. 5: Chýbajúca stránka Expert

---

## 2. ZOZNAM DÔLEŽITÝCH SÚBOROV

- `database/parasites.json` — **HOTOVÝ**, 474 záznamov, nahrádza 14 host-súborov.
- `database/images.json` — štruktúra hotová a funkčná, obsahuje reálne dáta pre 3 objekty (33 fotiek), čaká na doplnenie zvyšných 471.
- `src/components/PrimaryImage.js` — **HOTOVÝ A NAŽIVO OVERENÝ**, cesty k obrázkom opravené (`/public/images/...`).
- `src/pages/GalleryPage.js` — **ČIASTOČNE HOTOVÝ**: cesty k obrázkom a filter objektov fungujú a sú overené; **filter hostiteľov nefunguje** (pozri Priorita č. 1).
- `src/services/Repository.js` — **NEBOL v tejto session analyzovaný ani nahraný** — potrebný pre debug filtra hostiteľov (funkcia `resolveHosts()`).
- `index.html` — overený, používa relatívne cesty konzistentné s Live Server (koreň = koreň projektu).
- `App.js` — **OVERENÝ**: správne sekvenovanie, obsahuje plne funkčné `window.showAtlasDetail`.
- `Router.js` — **OVERENÝ**: plná podpora pre voliteľný parameter vetvy.
- `AtlasPage.js` — **OVERENÉ**: prepojenia a render fungujú podľa plánu.
- Staré `database/*.migrated.json` (14×) — zatiaľ zachované, nemazať.

---

## 3. DÔLEŽITÉ PRAVIDLÁ PRE ĎALŠIEHO AI

1. Nikdy automaticky nepovyšuj `host`/`hosts` na `hostGroups` bez explicitného potvrdenia autorkou.
2. Rozdielna `micrometry`/`sample`/`stage` pri rovnakom ID naprieč hostiteľmi znamená dva rôzne diagnostické objekty.
3. Staré `*.migrated.json` súbory sa NEMAŽÚ, kým nie je appka naživo plne overená v prehliadači (vrátane funkčného filtra hostiteľov).
4. Pred úpravou akéhokoľvek zdrojového súboru si VŽDY vyžiadaj jeho aktuálny obsah — nikdy nehádaj implementáciu.
5. **Projekt sa spúšťa cez VS Code Live Server**, ktorý servuje súbory presne podľa fyzickej štruktúry na disku (žiadne "public ako webroot" mapovanie). Všetky odkazy na statické súbory z `public/` musia v kóde obsahovať prefix `/public/...`.

---
