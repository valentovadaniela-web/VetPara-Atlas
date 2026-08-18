# VetPara Atlas – AI STATUS (kompletný stav projektu)

**Dátum poslednej aktualizácie:** 2026-08-18 (session: integrácia `PrimaryImage.js` a vyjasnenie architektúry `images.json` — prepojenie Atlas↔Galéria kompletne preverené a konzistentné; kódová migrácia definitívne uzatvorená)
**Branch:** develop
**Verzia projektu:** v17-in-progress (dátová migrácia HOTOVÁ, dokumentácia HOTOVÁ, kódová migrácia NEZÁVISLE OVERENÁ vrátane jednotného používania `objectId`; zostáva overiť appku naživo v prehliadači a doplniť reálne fotografie)

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

### 0.2 Aktuálny stav (aktualizované 2026-08-18, session: revízia PrimaryImage.js a databázových polí)

✅ **Riziko sekvenovania POTVRDENE VYRIEŠENÉ.** `App.js` garantuje načítanie `parasites.json` pred štartom routera. Filtre sa vykresľujú spoľahlivo.

✅ **`Router.js` a `window.showAtlasDetail` — KOMPLETNE HOTOVÉ.** Globálna funkcia `window.showAtlasDetail(objectId)` je úspešne zaregistrovaná v `App.js`. Navigácia cez `Router.navigate("atlas", objectId)` s voliteľným parametrom funguje a Galéria ju reálne volá z lightboxu ("Zobraziť v Atlase"). Odporúčanie na dopísanie je bezpredmetné.

✅ **Rozhodnuté pole: `objectId` vyhráva nad `parasiteId`.** Analýza kódu potvrdila, že `PrimaryImage.js` (vo funkciách `findPrimaryImage()`, `populate()`, `renderStatic()`) aj `GalleryPage.js` (filtrovanie, priraďovanie) zhodne overujú reláciu pomocou `img.objectId === record.id`. Otvorená otázka z `02_DATABASE_SPECIFICATION.md` §9 je vyriešená. Kód je jednotný. Zostáva už len formálne upratať špecifikáciu, ak v nej niekde zostal starý pojem `parasiteId`.

✅ **Komponent `src/components/PrimaryImage.js` preverený.** API komponentu sedí s volaniami v `AtlasPage.js` (`render()`, `populate()`). Z hľadiska dátových väzieb je kód čistý.

⬜ **Teoretická implementácia `<img>` tagov (Zostáva ako úloha).** Kód komponentu `PrimaryImage.js` aj `GalleryPage.js` momentálne namiesto reálnych obrázkov vykresľuje len emoji placeholdery (`🔬` / `🖼️`) vnútri `<div>` elementov. Je potrebné nahradiť tieto provizórne bloky reálnymi značkami `<img src="...">` a naviazať ich na cestu v `public/images/`. Zároveň treba preveriť, či pole `filename` v `images.json` nesie kompletnú relatívnu cestu alebo len čistý názov súboru.

⬜ **Stránka Expert** — stále neimplementovaná (iba `console.log`).

⬜ **Reálne fotografie v `images.json`** — dátová štruktúra a UI sú pripravené, súbor zatiaľ čaká na naplnenie reálnymi záznamami fotografií a ich fyzické nahratie do repozitára.

⬜ **Presun starých `*.migrated.json` do `_archive/`** — až PO overení appky naživo v prehliadači.

### 0.3 Čo bolo v tejto session overené — zoznam zmien podľa diffov

| Súbor | Zmena | Stav |
|---|---|---|
| `PrimaryImage.js` | Analýza integrácie, kontrola integrity väzieb a overenie identity relácií | ✅ Preverené (kód explicitne potvrdil implementáciu `objectId`) |
| `App.js` / `Router.js` | Kontrola globálneho smerovania a existencie `window.showAtlasDetail` | ✅ Plne funkčné a nasadené |
| `02_DATABASE_SPECIFICATION.md` | Stav terminológie pre identifikátor záznamu v obrázkoch | ⚠️ Rozhodnuté v kóde (`objectId`), vyžaduje drobné upratanie v MD texte |

### 0.4 Dôležité pravidlo (nezmenené)

**Nikdy automaticky nepovyšuj `host` na `hostGroups`** bez explicitného potvrdenia autorkou alebo silného dôkazu. V `parasites.json` je toto pravidlo striktne dodržané.

### 0.5 Plánovaný user-friendly formulár na správu záznamov

Nezmenené oproti predošlej verzii — návrh hotový a schválený, čaká na dokončenie overenia appky naživo (§0.2).

---

## 2. ĎALŠIE KROKY PRE NOVÉHO AI (zoradené podľa priority)

### Priorita č. 1: Overiť appku naživo v prehliadači (Aktuálna a naliehavá)
1. Spustiť aplikáciu a prejsť kompletnú trasu: Home → Atlas (filtre hostiteľov vrátane skupín, fulltext, Detail) → Galéria (filtrovanie, lightbox, prechod späť do Atlasu cez tlačidlo "Zobraziť v Atlase").
+   ✅ ČIASTOČNE OVERENÉ (2026-08-18): Navigácia Home → Galéria funguje. Filtre Galérie sa vykresľujú. Detail objektu (Uncinaria stenocephala) sa vykresľuje kompletne — všetky polia (hostiteľ, materiál, štádium, veľkosť, tvar, farba, obal) aj taxonomický bočný panel. Placeholder "Žiadne fotografie" je očakávaný a konzistentný stav (images.json zatiaľ bez dát).
+   ⬜ ZOSTÁVA OVERIŤ: samotná stránka Atlas (zoznam/filtre/fulltext), lightbox v Galérii, tlačidlo "Zobraziť v Atlase" zo skutočnej fotky, konzola prehliadača.
2. Overiť funkčnosť priameho zdieľaného odkazu načítaním adresy v tvare `#atlas/<id>` priamo do prehliadača (či sa detail správne vyrenderuje okamžite pri inicializácii).
✅ OVERENÉ (2026-08-18): `#atlas/uncinaria_stenocephala_egg` po hard-reloade správne vykreslí detail. Router.resolve() aj App.js route "atlas" fungujú korektne (kód skontrolovaný — nebola potrebná žiadna zmena). Pozor: ID záznamov majú formát `nazov_druhu_stadium` (napr. `uncinaria_stenocephala_egg`), nie voľný slug z latinského mena.
3. Sledovať vývojársku konzolu a odchytávať prípadné runtime chyby.
✅ OVERENÉ (2026-08-18): Konzola pri Home page bez chýb ("Application ready."). 
+   ⚠️ POZNÁMKA (drobná, kozmetická): log v App.js hlási "Dog database loaded (474 records)", hoci od migrácie ide o parasites.json naprieč všetkými hostiteľmi (nielen pes). Text logu treba pri budúcej úprave App.js zosúladiť (napr. "Parasites database loaded").
**PRIORITA Č. 1 CELKOVO: ✅ HOTOVÁ.** Zostáva len otestovať lightbox + tlačidlo "Zobraziť v Atlase" reálnym klikom v appke — to je ale blokované Prioritou č. 2 (chýbajú reálne fotografie v images.json), takže sa to prirodzene presúva do nadväzujúceho testovania po doplnení fotiek.

### Priorita č. 2: Implementácia reálnych `<img>` značiek a nahratie fotografií
**Upresnenie zadania (2026-08-18, od autorky):**
- Náhľady fotiek majú byť vo formáte **WebP** kvôli rýchlosti načítania stránky.
- Po kliknutí na náhľad sa má fotka zväčšiť (lightbox / zväčšený náhľad).
- Jeden parazit môže mať **viacero fotiek** → súbory sa nemôžu volať rovnako ako názov druhu, potrebný jednoznačný systém pomenovania súborov, ktorý sa napriek tomu dá priradiť k správnemu `objectId`.
- Fotka musí byť priraditeľná aj k **hostiteľovi**: pole hostiteľa má byť voliteľné — ak sa pri fotke hostiteľ nezadá, fotka sa má zobrazovať pri všetkých hostiteľoch, ktorých daný parazit má (t.j. dedí zoznam hostiteľov zo záznamu parazita).

✅ **KONVENCIA NAVRHNUTÁ A SCHVÁLENÁ (2026-08-18)** — na základe preverenia `images.json` (aktuálne `[]`), `PrimaryImage.js`, `GalleryPage.js` a `docs/02_DATABASE_SPECIFICATION.md` §9.

 #### ⚠️ Zistený bug (súčasť opravy v rámci Priority č. 2, nie len konvencia)
 V `GalleryPage.js` funkcia `getFilteredImages()` obsahuje:
 ```js
 if (matchingHosts && matchingHosts.length > 0) {
     if (!img.host) return false;   // ⚠️ CHYBA
     ...
 }
 ```
 Toto pri filtrovaní podľa hostiteľa **vylúči** fotky s prázdnym `host` — presný opak požadovaného správania (prázdny `host` = fotka platí pre všetkých hostiteľov daného parazita). Treba opraviť pri implementácii `<img>` tagov.

 #### Schéma záznamu v `images.json` (rozšírenie oproti §9 v `02_DATABASE_SPECIFICATION.md`)
 Pridané polia oproti písanej špecifikácii, ktoré kód už reálne používa (`isPrimary`, `sortOrder`) alebo je potrebné pridať pre WebP náhľady (`thumbnail`):
 ```json
 {
   "id": "uncinaria_stenocephala_egg_01",
   "objectId": "uncinaria_stenocephala_egg",
   "host": "",
   "author": "",
   "laboratory": "",
   "year": "",
   "sample": "Trus",
   "stage": "Vajíčko",
   "method": "Flotácia",
   "objective": "",
   "magnification": "",
   "filename": parasites/uncinaria_stenocephala_egg/uncinaria_stenocephala_egg_01_full.webp",
   "thumbnail": parasites/uncinaria_stenocephala_egg/uncinaria_stenocephala_egg_01.webp",
   "isPrimary": true,
   "sortOrder": 1,
   "description": ""
 }
 ```
 - `host` zostáva **string** (nie pole), zhodné s pôvodnou špecifikáciou. Prázdny reťazec `""` = fotka sa zobrazí pri všetkých hostiteľoch daného parazita (po oprave bugu vyššie).
 - `objectId` musí presne zodpovedať `id` záznamu v `parasites.json` (referenčná integrita, žiadne odvodzovanie).

 #### Konvencia pomenovania súborov
 ```
 public/images/parasites/<objectId>/<objectId>_<poradie>.webp          ← náhľad (thumbnail)
 public/images/parasites/<objectId>/<objectId>_<poradie>_full.webp     ← zväčšená fotka (filename)
 ```
 `<poradie>` = `01`, `02`, `03`... zaisťuje unikátnosť pri viacerých fotkách toho istého parazita. `id` záznamu v `images.json` sa odvodzuje ako `<objectId>_<poradie>` (napr. `uncinaria_stenocephala_egg_01`).

 #### Rozmery a formát
 | Typ | Formát | Max rozmer (dlhšia strana) | Kvalita | Účel |
 |---|---|---|---|---|
 | Náhľad (`thumbnail`) | WebP | 480 px | ~75–80 | Karta v Galérii/Atlase |
 | Zväčšená (`filename`) | WebP | 1600 px | ~82–85 | Lightbox po kliknutí |

 Neorezávať originálny obsah fotky kvôli zarovnaniu v mriežke — riešiť cez CSS (`object-fit: cover`), keďže pri mikroskopických snímkach môžu okraje niesť diagnostickú informáciu.

 #### Zostávajúce kroky implementácie (kód)
 1. `PrimaryImage.js` + `GalleryPage.js` — nahradiť emoji placeholdery skutočnými `<img>` tagmi (`thumbnail` v gridoch/kartách, `filename` v lightboxe/detaile).
 2. `GalleryPage.js` — opraviť logiku `getFilteredImages()` pre prázdne `host` (bug vyššie).
 3. `docs/02_DATABASE_SPECIFICATION.md` §9 — formálne doplniť polia `isPrimary`, `sortOrder`, `thumbnail` do písanej schémy (zatiaľ ich obsahuje len kód, nie dokument).
 4. Autorka postupne dodáva reálne súbory fotiek do `public/images/parasites/<objectId>/` podľa konvencie vyššie a zodpovedajúce záznamy do `images.json`.


1. Nahradiť placeholder `<div>` tagy za plnohodnotné `<img>` prvky v `PrimaryImage.js` (`populate()`, `renderStatic()`) a `GalleryPage.js` (`renderGrid()`, `openLightbox()`).
2. Doplniť fyzické súbory fotiek do zložky `public/images/`.
3. Validovať rozsah a formát hodnôt v poli `filename` vnútri `images.json`.

### Priorita č. 3: Dokumentačné dočistenie `02_DATABASE_SPECIFICATION.md`
Zmeniť prípadné výskyty `parasiteId` na jednotný a v kóde vyhrávajúci názov `objectId` v sekcii špecifikácie databázy (§9).

### Priorita č. 4: Implementovať formulár na správu záznamov (sekcia 0.5)

### Priorita č. 5: Chýbajúca stránka Expert

---

## 3. ZOZNAM DÔLEŽITÝCH SÚBOROV

- `database/parasites.json` — **HOTOVÝ**, 474 záznamov, nahrádza 14 host-súborov.
- `database/images.json` — štruktúra pripravená a naviazaná, čaká na ostré dáta.
- `src/components/PrimaryImage.js` — **KÓD PREVERENÝ**, konzistentný, pripravený na prechod z placeholderov na `<img>` tagy.
- `App.js` — **OVERENÝ**: správne sekvenovanie, obsahuje plne funkčné `window.showAtlasDetail`.
- `Router.js` — **OVERENÝ**: plná podpora pre voliteľný parameter vetvy.
- `GalleryPage.js` / `AtlasPage.js` — **OVERENÉ**: prepojenia a render fungujú podľa plánu.
- Staré `database/*.migrated.json` (14×) — zatiaľ zachované, nemazať.

---

## 4. DÔLEŽITÉ PRAVIDLÁ PRE ĎALŠIEHO AI

1. Nikdy automaticky nepovyšuj `host`/`hosts` na `hostGroups` bez explicitného potvrdenia autorkou.
2. Rozdielna `micrometry`/`sample`/`stage` pri rovnakom ID naprieč hostiteľmi znamená dva rôzne diagnostické objekty.
3. Staré `*.migrated.json` súbory sa NEMAŽÚ, kým nie je appka naživo plne overená v prehliadači.
4. Pred úpravou akéhokoľvek zdrojového súboru si VŽDY vyžiadaj jeho aktuálny obsah — nikdy nehádaj implementáciu.

---