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
+   ⬜ ZATIAĽ NEOVERENÉ.
3. Sledovať vývojársku konzolu a odchytávať prípadné runtime chyby.
+   ⬜ ZATIAĽ NEOVERENÉ.

### Priorita č. 2: Implementácia reálnych `<img>` značiek a nahratie fotografií
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