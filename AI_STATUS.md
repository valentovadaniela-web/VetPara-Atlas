# VetPara Atlas – AI STATUS

## 1e. NEDOKONČENÉ 2026-08-16 (v11 pokračovanie): Hamburger menu — klik nefunguje, príčina NEZNÁMA

### Stav
Hamburger menu (bod 4 z dohodnutého poradia 3,2,1,4,5) bolo implementované
(index.html, layout.css, App.js — viď v11 nižšie), ale **po kliknutí na
hamburger sa navigácia nezobrazí**. Toto NIE JE vyriešené, dlhá diagnostika
v tejto session nenašla koreňovú príčinu.

### Čo bolo overené a FUNGUJE správne:
- HTML: `#nav-toggle` a `#site-nav-links` existujú so správnymi ID
  (potvrdené cez `document.getElementById`).
- CSS sa načítava správne z `http://127.0.0.1:5500/VetPara-Atlas/src/css/layout.css`
  (potvrdené cez `fetch()` — obsahuje `@media (max-width: 768px)` aj
  `.site-nav-links.is-open`).
- CSSOM potvrdzuje správnu štruktúru pravidiel:
  - GLOBAL: `.site-nav-links { display: flex }`
  - IN MEDIA (max-width: 768px): `.site-nav-links { display: none }`
  - IN MEDIA (max-width: 768px): `.site-nav-links.is-open { display: flex }`
- Pri šírke okna 578px (`window.matchMedia("(max-width: 768px)").matches`
  = `true`) je `getComputedStyle(...).display` = `'none'` — SPRÁVNE.
- `atlas.css`, `reset.css`, `typography.css` boli skontrolované — neobsahujú
  žiadne konfliktné pravidlo cielené na `nav`/`site-nav-links`, ani
  `!important` na `display`.
- Service Worker NIE je zaregistrovaný pre stránku (overené v Application
  → Service Workers).
- Žiadny inline `style` atribút na `#site-nav-links`
  (`getAttribute("style")` vrátilo `null`).
- Žiadne chyby v Console pri načítaní ani pri kliknutí.
- **Manuálne** spustenie `document.getElementById("site-nav-links").classList.add("is-open")`
  cez Console TIEŽ nezobrazilo navigáciu vizuálne (v jednom z testov) —
  toto je dôležitá stopa, nasvedčuje že problém nie je len v event listeneri,
  ale možno aj v samotnom zobrazení/CSS aplikovaní triedy `is-open` v
  reálnom čase v prehliadači (hoci CSSOM report vyzerá korektne).
- Theme toggle (`#theme-toggle`) funguje bez problémov v tom istom
  prostredí (potvrdzuje, že App.js/main.js sa načítava a spúšťa správne,
  vrátane `bindNavToggle()`, ktorá je volaná hneď po `bindThemeToggle()`
  synchrónne bez chyby medzi nimi).

### Posledný neuzavretý test
Pri šírke 578px (matches768: true), reálne kliknutie myšou na hamburger →
`document.getElementById("site-nav-links").className` ostáva `'site-nav-links'`
(bez `is-open`) — **listener sa buď nespúšťa pri reálnom kliku myšou, alebo
niečo triedu okamžite odstraňuje.**

### Nasledujúce diagnostické kroky (odporúčané na ďalšiu session)
1. Pridať `console.log("nav toggle clicked")` priamo do `bindNavToggle()`
   click handlera v `App.js` a overiť, či sa vôbec vypíše pri reálnom
   kliknutí myšou (odlíši JS-listener problém od CSS-timing problému).
2. Skontrolovať, či nie je `bindNavToggle()` volaná viackrát (napr. cez
   HMR/live-reload duplicitne registrujúci listenery) — pridať
   `console.count("bindNavToggle called")` na začiatok metódy.
3. Skontrolovať `main.js` a `Router.js` (NEBOLI v tejto session nahraté) —
   možné, že `Router.start()` alebo iná časť re-renderuje/manipuluje DOM
   spôsobom, ktorý odstraňuje pridanú triedu tesne po kliknutí.
4. Skúsiť `getEventListeners(document.getElementById("nav-toggle"))`
   v Console (funguje len keď je element aktuálne vybraný v Elements
   tabe, alebo cez `$0` po kliknutí naň v Elements) — over počet
   pripojených listenerov.
5. Live Server (`127.0.0.1:5500`) má "Live reload enabled" — over, že sa
   medzi testami nespúšťa reload, ktorý mätie stav.

### Súbory potrebné pre pokračovanie (ešte nenahraté v tejto session)
- `src/js/main.js`
- `src/app/Router.js`

### Aktuálny stav súborov (v11, funkčné, NEMENIŤ kým sa nevyrieši hamburger bug)
- `index.html` — Bootstrap odstránený, header/nav Atlas/Galéria/Diagnostický
  expert/Téma, hamburger markup pridaný — DORUČENÉ, funguje vizuálne
  (font, farby, theme toggle potvrdené OK).
- `src/css/layout.css` — obsahuje malý kozmetický duplicitný blok
  `.site-header { background-color: var(--color-bg-header); }` (dvakrát
  po sebe) — NEŠKODNÉ, ale odporúča sa vyčistiť pri ďalšej úprave súboru.
- `src/css/variables.css` — `--transition-fast`, `--container-max-width`
  doplnené — OK.
- `src/app/App.js` — `bindThemeToggle()` OK (potvrdené funkčné),
  `bindNavToggle()` implementovaná, ale VIZUÁLNE NEFUNGUJE (viď vyššie).

### Otvorené TODO (poradie 3,2,1,4,5)
- Bod 3 (nav obsah) — ✅ hotovo
- Bod 2 (Navbar.js) — TODO presun do `_archive/`, zatiaľ nevykonané
- Bod 1 (test v prehliadači) — ✅ potvrdené pre header/font/theme toggle;
  ❌ hamburger klik NEFUNGUJE (táto session)
- Bod 4 (hamburger menu) — ČIASTOČNE hotové (markup+CSS OK), FUNKČNOSŤ
  NEDORIEŠENÁ — pokračovať v ďalšej session s `main.js`/`Router.js`
- Bod 5 — čaká

Aktualizované: 2026-08-16 (v11, nedokončené)
Branch: develop

### Stále NEOVERENÉ
-- Skutočné vykreslenie v prehliadači po v11 (header farba, font, funkčnosť
-  theme toggle) — **čaká sa na test autorkou**, výsledok zatiaľ nenahlásený.
-- `--font-family-base`, `--color-background`, `--color-heading` —
+- `--font-family-base`, `--color-background`, `--color-heading` —
   `reset.css`/`typography.css` neboli v tejto session nahraté, ich stav
   voči týmto premenným nepotvrdený.

### Otvorené TODO (poradie: 3 hotové, 2 hotové/TODO zapísané → čaká sa na 1, potom 4, 5)
-- **Bod 1 (test v prehliadači)** — autorka testuje, výsledok sa nahlási
-  v ďalšej session/správe.
+- **Bod 1 (test v prehliadači)** — ✅ POTVRDENÉ autorkou 2026-08-16,
+  header/farba/font/theme toggle fungujú správne.
 - **Bod 4 (hamburger menu pre mobil)** — odložené, čaká na výsledok bodu 1.
   `04_UI_UX_SPECIFICATION.md` §6 ho vyžaduje.
 - **`Navbar.js` → presun do `_archive/`** — TODO, zatiaľ nevykonané.

## 1d. Zmena 2026-08-16 (v11): Header dokončený (nav obsah, Bootstrap-free, theme toggle, font-fix)

Nadväzuje na v10 — DÔLEŽITÉ ZISTENIE: súbory nahraté do tejto session
(`index.html`, `Navbar.js`, `App.js`) NEZODPOVEDALI popisu v10 (stále
obsahovali pôvodný Bootstrap `navbar-dark bg-primary` markup, žiadny
`#theme-toggle`, žiadnu `bindThemeToggle()`). V10 zmeny buď neboli
commitnuté, alebo AI_STATUS.md v10 popisoval stav, ktorý sa nedostal
do repozitára. Táto session vychádza z reálne nahratých súborov.

### Rozhodnutia autorky (2026-08-16)
- Nav obsah: **Atlas / Galéria / Diagnostický expert / Téma** (4 položky,
  bez samostatného "Domov" — kliknutie na logo "VetPara Atlas" vedie na
  Home) a bez "Nastavenia".
- Karta na Home "Databáza" premenovaná na "Atlas" (rovnaký `data-route="atlas"`).
- Bootstrap definitívne odstránený z `index.html` (CSS aj JS), header
  prerobený na vlastný `.site-header`/`.site-nav` markup.
- Theme toggle logika (`bindThemeToggle()`) pridaná rovno v tejto session.
- `Navbar.js` potvrdene mŕtvy kód (nikdy neimportovaný) — **TODO: presunúť
  do `_archive/`** podľa precedensu z `11_SESSION_LOG.md` bodu 3. Zatiaľ
  nepresunuté, súbor stále leží na pôvodnom mieste
  `src/components/Navbar.js` — čaká na vykonanie.

### Vykonané zmeny
1. `index.html` — Bootstrap CDN odstránený, header prepísaný, nav =
   Atlas/Galéria/Diagnostický expert + tlačidlo Téma, `<header>` dostal
   triedu `site-header`.
2. `src/css/layout.css` — nové pravidlá `.site-header`, `.site-nav`,
   `.site-brand`, `.site-nav-links`, `.theme-toggle-btn`; doplnené
   `.site-header a, .site-header button { font-family: var(--font-sans); }`
   (oprava nekonzistentného fontu v nav položkách, nahlásené autorkou po
   nasadení v11).
3. `src/css/variables.css` — doplnené `--transition-fast`,
   `--container-max-width` (chýbali, layout.css ich referencoval).
4. `src/app/App.js` — karta "Databáza" → "Atlas"; nová metóda
   `bindThemeToggle()`, volaná v `start()`.

### Stále NEOVERENÉ
- Skutočné vykreslenie v prehliadači po v11 (header farba, font, funkčnosť
  theme toggle) — **čaká sa na test autorkou**, výsledok zatiaľ nenahlásený.
- `--font-family-base`, `--color-background`, `--color-heading` —
  `reset.css`/`typography.css` neboli v tejto session nahraté, ich stav
  voči týmto premenným nepotvrdený.

### Otvorené TODO (poradie: 3 hotové, 2 hotové/TODO zapísané → čaká sa na 1, potom 4, 5)
- **Bod 1 (test v prehliadači)** — autorka testuje, výsledok sa nahlási
  v ďalšej session/správe.
- **Bod 4 (hamburger menu pre mobil)** — odložené, čaká na výsledok bodu 1.
  `04_UI_UX_SPECIFICATION.md` §6 ho vyžaduje.
- **`Navbar.js` → presun do `_archive/`** — TODO, zatiaľ nevykonané.

### Súbory na stiahnutie a nahradenie v repozitári (v11)
- `index.html`
- `src/css/layout.css`
- `src/css/variables.css`
- `src/app/App.js`

Aktualizované: 2026-08-16 (v11)
Branch: develop

## 1c. Zmena 2026-08-16 (v10): Header, font-fix, funkčný theme toggle

Nadväzuje na v9 (blokované chyby #1 a #3). Súbory `index.html`,
`Navbar.js`, `layout.css`, `typography.css`, `reset.css`, `main.js` boli
nahraté a skontrolované.

### Zistenia
- **`Navbar.js` je mŕtvy kód** — nikdy nebol importovaný (`main.js`
  importuje iba `App.js`). Header bol vždy natvrdo napísaný priamo v
  `index.html`, s Bootstrap `navbar navbar-dark bg-primary` markupom —
  to bol zdroj svetlomodrej farby headeru (chyba #1 z v9).
- **`reset.css`/`typography.css`/`layout.css` odkazovali na CSS premenné,
  ktoré vo `variables.css` neexistovali** (`--font-family-base`,
  `--color-background`, `--color-heading`, `--transition-fast`,
  `--container-max-width`) — rovnaký typ problému, aký sa riešil pre
  `atlas.css` vo v8/v9, teraz pre zvyšné súbory (chyba #2 z v9).
- **Nezrovnalosť medzi screenshotom (nav: Domov/Databáza/Téma) a nahratým
  `index.html` (nav: Domov/Atlas/Galéria/Diagnostický expert/Nastavenia)**
  — flagnuté, opravy urobené podľa nahratého `index.html` (5 položiek +
  nové tlačidlo Téma), keďže iný zdroj nebol dodaný.

### Vykonané zmeny
1. **`index.html`** — Bootstrap CDN (CSS aj JS) odstránený. Header
   prepísaný z Bootstrap `navbar` markupu na vlastný `.site-header`/
   `.site-nav`/`.site-nav-links` + nové tlačidlo `#theme-toggle`
   ("Téma"). Bootstrap toggler (hamburger pre mobil) bol súčasťou
   odstráneného markupu a **nebol nahradený** — nové TODO (bod nižšie).
2. **`src/css/variables.css`** — doplnené mostíkové aliasy:
   `--font-family-base`, `--color-background`, `--color-heading`,
   `--transition-fast`, `--container-max-width`. Nič sa nepremenovalo,
   iba doplnilo (rovnaký prístup ako aliasy z v8).
3. **`src/css/layout.css`** — nové štýly `.site-header`/`.site-nav`/
   `.site-brand`/`.site-nav-links`/`.theme-toggle-btn`, využívajú už
   existujúce (doteraz nepoužité) premenné `--color-bg-header`,
   `--color-nav-text`, `--color-nav-text-active` z `variables.css`.
4. **`src/app/App.js`** — nová metóda `bindThemeToggle()`, volaná raz v
   `start()`. Klikom na `#theme-toggle` sa prepína
   `document.body.classList.toggle("dark-mode")`.
   **Rozsah potvrdený autorkou 2026-08-16: iba Home.** Na
   Databáze/Detaile zostáva svetlý režim zamknutý cez existujúce
   `!important` pravidlá vo `variables.css` (`#database-view`,
   `#detail-view`) — tie sa touto zmenou nedotkli, takže tlačidlo tam
   nemá viditeľný efekt bez potreby ho špeciálne skrývať. Home route
   naďalej pri každom vstupe force-nastavuje `dark-mode` (nezmenené) —
   tlačidlo umožňuje návštevníkovi to po príchode manuálne prepnúť.

### Stále NEOVERENÉ
- Skutočné vykreslenie v prehliadači (font, farba headeru, funkčnosť
  toggle) — v tomto prostredí nebolo možné spustiť DOM.

### Nové TODO
- **Hamburger menu pre mobil chýba** — bolo súčasťou odstráneného
  Bootstrap togglera, vlastná náhrada nebola vytvorená (nebolo
  zadané, `04_UI_UX_SPECIFICATION.md` §6 ju vyžaduje).
- **`Navbar.js` zostáva mŕtvy kód** — buď ho reálne zapojiť (nahradiť
  natvrdo písaný header v `index.html`), alebo presunúť do `_archive/`
  podľa precedensu z `11_SESSION_LOG.md` bodu 3.
- **Nezrovnalosť screenshot vs. index.html** (3 vs. 5 nav položiek) —
  nepotvrdené, ktorá verzia je zamýšľaná; ak treba redukovať nav na
  Domov/Databáza/Téma, treba to explicitne zadať.

### Súbory na stiahnutie a nahradenie v repozitári (v10)
- `index.html`
- `src/css/variables.css`
- `src/css/layout.css`
- `src/app/App.js`

`Navbar.js`, `reset.css`, `typography.css`, `main.js` — **nezmenené**
(iba prečítané kvôli diagnostike).




Aktualizované: 2026-08-16 (v9)
Branch: develop
Git: working tree clean (pred touto zmenou — nezabudni commitnúť
`database/dog.migrated.json` z v6, štyri súbory `src/*` z v8 (ak ešte neboli),
AJ upravené `src/styles/atlas.css` a dokumenty `00_PROJECT_CONTEXT.md`,
`05_TECHNICAL_ARCHITECTURE.md` z tejto session (v9).

## 1. Milestone
Milestone 1 – Core Foundation → hotové. Milestone 2 – Vizuálny redizajn:
implementované (v8), **teraz prvý reálny vizuálny test od autorky (v9,
screenshot Home stránky) — časť chýb opravená, časť BLOKOVANÁ chýbajúcimi
súbormi (index.html / Navbar.js / layout.css / typography.css / reset.css —
nikdy neboli nahraté do tejto konverzácie).**

## 1b. POSLEDNÁ VYKONANÁ ZMENA — 2026-08-16 (v9): Vizuálny bug-report z prehliadača + čiastočná oprava

Autorka nahrala screenshot reálne vykreslenej Home stránky a nahlásila 3 chyby.

### 1b.1 Nahlásené chyby a stav

| # | Chyba (ako nahlásená) | Stav | Root cause (hypotéza) |
|---|---|---|---|
| 1 | Horný pás (header/nav) má byť vo farbe pozadia, je svetlomodrý | **BLOKOVANÉ** — potrebujem `index.html` / `Navbar.js` | Header s logom "VetPara Atlas" a nav odkazmi ("Domov", "Databáza", "Téma") viditeľný na screenshote **nebol nikdy súčasťou `App.js`** (potvrdené už v `AI_STATUS.md` v8, bod 1a.3 #5). Musí byť statický v `index.html` alebo v `src/components/Navbar.js` — ani jeden súbor som doteraz nevidel. Svetlomodrá farba je pravdepodobne zvyšok pôvodného Bootstrap `.navbar`/CDN linku, ktorý som nemal ako odstrániť, keďže som ho nikdy nevidel. |
| 2 | Nejednotný font, chce Inter Sans všade | **ČIASTOČNE OPRAVENÉ** v `atlas.css` (viď 1b.2) | `.hero-home-title` používal `var(--font-serif)` (Merriweather) podľa pôvodného zámeru z master-promptu ("Inter pre dáta / Merriweather pre titulky") — autorka teraz explicitne chce jednu rodinu všade. Opravené v rámci súborov, ktoré kontrolujem. **Nemôžem zaručiť dôsledky mimo `atlas.css`** — ak `typography.css`/`reset.css`/`index.html` nastavujú/načítavajú iný font (alebo Merriweather/Inter vôbec nie je pripojený cez `<link>`/CDN), zostane nekonzistentné. |
| 3 | Prepínanie režimov (svetlý/tmavý) nefunguje | **BLOKOVANÉ** — potrebujem `index.html` / `Navbar.js` | V `App.js` existuje iba automatické prepínanie podľa route (Home = tmavý, všetko ostatné = svetlý) — **žiadne manuálne tlačidlo/toggle som nikdy nevytvoril** (viď v8, bod 1a.3 #5). Nav na screenshote má odkaz "Téma" — ak je to zamýšľané ako prepínač, musí byť v súbore, ktorý nemám, a nie je napojený na žiadnu JS logiku, ktorú poznám. |

### 1b.2 Čo bolo opravené (v rámci súborov, ktoré mám)

**`src/styles/atlas.css`:**
- `.hero-home-title`: `font-family: var(--font-serif)` → `var(--font-sans)` (Inter namiesto Merriweather).
- Pridané obranné pravidlo:
  ```css
  #home-view, #database-view, #detail-view {
      font-family: var(--font-sans);
  }
  ```
  Vynucuje Inter na všetkých troch pohľadoch, ktoré spravuje táto stránka/CSS,
  bez ohľadu na to, čo (ne)nastavuje neznámy globálny reset. Ak je globálny
  reset už rovnaký, pravidlo je no-op; ak nie, opravuje nekonzistentnosť.
- **`--font-serif` v `variables.css` NEBOL odstránený** (autorka ho tam mala,
  mohol by byť použitý inde, mimo môjho pohľadu) — iba `atlas.css` ho už
  nepoužíva. Ak sa ukáže, že sa nepoužíva nikde inak, môže sa v budúcnosti
  vymazať z `variables.css` úplne.

**Dokumentácia (dlžné z v8, dokončené teraz):**
- `00_PROJECT_CONTEXT.md` §12 — Bootstrap 5 nahradený „Vlastný CSS dizajnový
  systém (CSS Custom Properties, bez frameworku)", pridaná poznámka o zmene
  s dátumom a dôvodom.
- `05_TECHNICAL_ARCHITECTURE.md` §4 — rovnaká zmena, rovnaká poznámka.
- Oba súbory majú CRLF (Windows) konce riadkov — zachované pri úprave.

### 1b.3 Čo BLOKUJE dokončenie (potrebujem tieto súbory v ďalšom chate)

Aby som mohol opraviť header/nav farbu a funkčné prepínanie režimov, potrebujem:

1. **`index.html`** (koreňový súbor projektu) — na overenie, či header/nav je
   tam natvrdo napísaný, či je ešte pripojený Bootstrap CDN `<link>`, a či sú
   pripojené webfonty (Google Fonts Inter/Merriweather — bez `<link>` fonty
   nefungujú, aj keď `variables.css` na ne odkazuje).
2. **`src/components/Navbar.js`** (ak existuje a je reálne použitý — v
   `štruktúra.txt` je uvedený, ale `App.js` ho v žiadnej verzii, ktorú som
   robil, neimportoval — treba overiť, kade sa do stránky reálne dostáva).
3. **`src/css/layout.css`**, **`src/css/typography.css`**,
   **`src/css/reset.css`** — na zistenie, čo tieto súbory už nastavujú
   (font-family, farby headeru), aby som nevytváral duplicitné/konfliktné
   pravidlá.
4. **`src/js/main.js`** — entry point, na overenie poradia načítania CSS/JS
   a toho, čo presne sa spúšťa pri štarte appky.

**Bez týchto súborov nemôžem opraviť header (bod 1) ani theme toggle (bod 3)
— znamenalo by to hádať obsah súborov, ktoré som nikdy nevidel, čo je proti
pravidlám tejto konverzácie ("nikdy nevytváraj odborné/technické údaje bez
podloženia zdrojom").**

### 1b.4 Pokyny pre ďalší chat

1. Nahraj `index.html`, `src/components/Navbar.js` (ak existuje),
   `src/css/layout.css`, `src/css/typography.css`, `src/css/reset.css`,
   `src/js/main.js`.
2. Priložiť nový screenshot (alebo ten istý) pre porovnanie po oprave.
3. Skontrolovať, či je Bootstrap CDN `<link>` v `index.html` — ak áno, treba
   ho odstrániť (nadväzuje na `AI_STATUS.md` v8 rozhodnutie zrušiť Bootstrap
   všade).
4. Skontrolovať, či sú pripojené webfonty pre Inter (Google Fonts `<link>`
   alebo lokálne `@font-face`) — bez toho `var(--font-sans)` padá na systémový
   fallback, čo môže byť ešte jeden zdroj nekonzistentného vzhľadu.
5. Zistiť, kde má byť definovaná logika prepínania témy (Navbar.js tlačidlo
   „Téma"?) a prepojiť ju s `document.body.classList.toggle("dark-mode")`
   (rovnaký mechanizmus, aký už `App.js` používa pri routing).
6. Znovu vizuálne overiť Home stránku a v prípade zhody s priloženým mockup
   screenshotom aktualizovať `AI_STATUS.md` na v10 (Milestone 2 → hotové
   a vizuálne overené).

### 1b.5 Súbory na stiahnutie a nahradenie v repozitári (táto session, v9)

- `src/styles/atlas.css` (font fix)
- `00_PROJECT_CONTEXT.md` (Bootstrap odstránený zo zoznamu)
- `05_TECHNICAL_ARCHITECTURE.md` (rovnaká zmena)

`variables.css`, `App.js`, `AtlasPage.js` — **nezmenené touto session**
(zostávajú platné z v8).

---

## 1a. Predchádzajúca zmena (2026-08-15 v8): Implementácia vizuálneho reskinu

Nadväzuje na plánovaciu session v7 (nižšie, teraz historická). Rozdiel oproti
pôvodnému plánu z v7: **autorka sa počas session rozhodla proti dual-range
sliderom pre veľkostný filter — pôvodné 4 number inputy (dĺžka/šírka od-do)
boli ZACHOVANÉ bez zmeny logiky**, iba vizuálne prestylované do nového
`.filter-section` obalu. Zvyšok plánu z v7 implementovaný podľa dohody.

### 1a.1 Zmenené súbory (4× kompletná nová verzia, nie diff)

| Súbor | Rozsah zmeny |
|---|---|
| `src/css/variables.css` | Pridané mostíkové aliasy (`--font-size-*`, `--color-surface`, `--color-surface-alt`, `--color-warning`, `--color-text`) — pôvodný obsah od autorky nezmenený |
| `src/app/App.js` | Home route kompletne prepísaná: Bootstrap triedy zrušené, nahradené `.hero-home`/`.home-cards-grid`/`.btn-open-atlas` markupom; pridaný wrapper `id="home-view"`; pridaná dark-mode toggle logika (`document.body.classList`) vo všetkých registrovaných routes; `atlas` route wrapuje výstup s `id="database-view"` (cez `AtlasPage.render()`) |
| `src/pages/AtlasPage.js` | `host`/`sample` filtre: `<select multiple>` → skupina checkboxov (`CHECKBOX_FIELDS`), rovnaká OR logika. `shape`/`colour`: zachované ako `<select multiple>` (`MULTI_SELECT_FIELDS`). Veľkostný filter: **beze zmeny logiky**, len obal. Karta v zozname: nový stručný `.specimen-row-card` (názov + host/materiál/veľkosť v jednom riadku) namiesto plnej karty — plný obsah presunutý do Detailu. Detail: nový `.quad-grid` (Veľkosť/Tvar/Farba/Obal), `.morphology-card-main` (✓ namiesto ⚡, rovnaké dáta `diagnosticSigns`), `.taxonomy-table` (BEZ riadku "Doména" — nie je v DB schéme). `render()`/`showDetail()` teraz vracajú koreňový element s `id="database-view"`/`id="detail-view"`. Odstránené mŕtve staré metódy (`diagnosticSignsList`, `taxonomyBlock`, `taxonomyExternalLinks`, `diagnosticSignsSection`, `taxonomySection`) — nahradené novými (`morphologyCard`, `taxonomyTable`, `taxonomyExternalLinksButtons`, `miniBox`, `quadBox`) |
| `src/styles/atlas.css` | **Kompletne nový súbor** (nie patch pôvodného). Obsahuje: základnú `.card` komponentu (mockup ju nikde nedefinoval, len prepisy farieb — doplnené tu), Home štýly bez Bootstrapu, `.database-layout`/`.filter-sidebar`/`.checkbox-group` pre nové filtre, zachovaný `.atlas-filter-multi`/`.atlas-size-row` pre shape/colour a veľkosť, `.detail-layout`/`.quad-grid`/`.morphology-card-main`/`.taxonomy-table` pre detail, `.atlas-active-filters`/`.atlas-filter-tags` zachované funkčne beze zmeny |

### 1a.2 Overené (staticky, v tomto prostredí)

- `node --check` prešiel na `App.js` aj `AtlasPage.js` bez chyby.
- CSS zátvorky vyvážené (123 `{` / 123 `}` v `atlas.css`).
- Všetky triedy použité v novom markupe `AtlasPage.js`/`App.js` majú
  zodpovedajúce pravidlo v `atlas.css` (manuálne prekontrolované krížovo).
- Filtrovacia logika (`matchesSizeRange`, `matchesFulltext`, `renderRecords`
  filter chain) sa nezmenila — iba widget typ pre `host`/`sample`.

### 1a.3 NEOVERENÉ / otvorené TODO

1. **Skutočný beh v prehliadači nebol testovaný** (žiaden DOM v tomto
   prostredí) — nutné otestovať checkboxy, karty, detail, responzivitu na
   mobile aj desktope po nasadení.
2. **Chýbajúci obrázok pre Home hero pozadie.** `atlas.css` odkazuje na
   `../../public/images/home-hero.png` (relatívna cesta z
   `src/styles/atlas.css` do `public/images/`, podľa `štruktúra.txt`) — tento
   súbor **neexistuje**, treba ho dodať. Bez neho bude hero sekcia na Home
   len s farbou pozadia (fallback), nie s obrázkom parazitov z pôvodného
   mockupu (`image_C05HpU.png`, ktorý tiež nebol nahraný).
3. **`00_PROJECT_CONTEXT.md` §12 a `05_TECHNICAL_ARCHITECTURE.md` §4 ešte
   NEBOLI aktualizované** — stále tam je zapísaný Bootstrap 5 ako súčasť
   stacku, hoci kód ho už nepoužíva. Treba opraviť, aby dokumentácia
   zodpovedala realite (`09_MASTER_PROMPT.md` §5, §7).
4. **Riadok „Doména" v taxonómii** — potvrdené vynechaný (nie je v DB
   schéme). Ak by ho autorka predsa chcela, treba najprv rozšíriť
   `02_DATABASE_SPECIFICATION.md` a zdokumentovať v `10_CHANGELOG.md`.
5. Nav/header (`.site-header`, `.theme-toggle` tlačidlo z mockupu) **nebol
   implementovaný** — `App.js` ho nikdy neobsahoval a `index.html`/
   `Navbar.js` neboli v tejto session nahraté, takže dark-mode toggle beží
   iba automaticky podľa route (Home = tmavý, všetko ostatné = svetlý), bez
   manuálneho prepínača pre používateľa.
6. Gallery/Expert/Settings routes stále iba `console.log(...)` placeholder —
   nedotknuté touto zmenou, teraz majú navyše `dark-mode` cleanup pre
   konzistenciu.

### 1a.4 Súbory na stiahnutie a nahradenie v repozitári

- `src/css/variables.css`
- `src/app/App.js`
- `src/pages/AtlasPage.js`
- `src/styles/atlas.css`

`dog.json`, `dog.migrated.json`, `Repository.js`, `DatabaseService.js`,
`Router.js`, `ApplicationState.js` — **NEBOLI touto zmenou dotknuté.**

---

## 2a. PLÁNOVACIA SESSION 2026-08-15 (v7) — teraz historická, implementované vyššie (1a)

**Poznámka:** obsah tejto sekcie je pôvodný plán z v7. Časť rozhodnutí bola
počas implementácie (v8) upravená — konkrétne veľkostný filter zostal pri
pôvodných number inputoch namiesto plánovaných dual-range sliderov (viď 1a
vyššie). Sekcia ponechaná pre históriu rozhodovania.

### 0.1 Kontext a zdroj podnetu

Autorka nahrala 3 nové súbory z inej AI konverzácie (mimo tohto vlákna):
- `KOMPLETNÝ_MASTER-PROMPT_PRE_CLAUDE_-_Implementácia_Vizuálneho_Systému_VetPara_Atlas.docx`
- `mockup.html` (statická HTML/CSS/JS ukážka nového vzhľadu)
- `variables.css` (nová sada CSS premenných zodpovedajúca mockupu)

Cieľ: zjednotiť vizuál Home/Databáza/Detail podľa tohto nového dizajnového
systému. **Toto NIE JE súčasť pôvodného Developer Guide/Master Prompt
(`08_DEVELOPER_GUIDE.md`, `09_MASTER_PROMPT.md`) — je to nový, externe
navrhnutý vizuálny systém, ktorý autorka chce do projektu zaviesť.**

### 0.2 Zistené konflikty s existujúcim projektom (analyzované, nie ešte vyriešené kódom)

1. **`atlas.css` (v2, overená sekcia z 2026-08-14) používa CSS premenné, ktoré
   v novom `variables.css` vôbec nie sú definované:**
   `--font-size-xs/sm/base` (nové má `--fs-xs/sm/base` — iný názov),
   `--color-surface`, `--color-surface-alt`, `--color-warning`, `--color-text`.
   Bez opravy by nasadenie nového `variables.css` **rozbilo už funkčné a
   overené štýly** (multi-select filtre, veľkostný filter, diagnostické znaky,
   taxonómia).
   **Rozhodnutie:** doplniť do `variables.css` mostíkové aliasy (napr.
   `--font-size-xs: var(--fs-xs);`), NEPREMENOVÁVAŤ nič v už overenom
   `atlas.css` naviac k tomu, čo aj tak ide prerobiť (viď bod 4).

2. **Architektonický nesúlad: perzistentné view-divy vs. Router/innerHTML swap.**
   `variables.css` aj mockup cielia na trvalé `#database-view`/`#detail-view`
   elementy (viditeľnosť prepínaná triedou). Skutočná appka (`Router.js` +
   `App.js`) vykresľuje každú route cez `innerHTML` swap do jediného
   `<div id="app">`, žiadne `#database-view`/`#detail-view` neexistujú.
   **Rozhodnutie:** Router/App.js architektúru NEMENIŤ (žiadny prechod na
   perzistentné divy). Namiesto toho koreňový element, ktorý
   `AtlasPage.render()`/`showDetail()` vracia, dostane `id="database-view"`
   resp. `id="detail-view"`, aby CSS selektory z `variables.css` mali čo
   zasiahnuť. Minimálny zásah, žiadna zmena `Router.js`.

3. **Bootstrap konflikt.** Master-prompt vyžaduje „žiadny framework/Bootstrap",
   ale `00_PROJECT_CONTEXT.md` §12 a `05_TECHNICAL_ARCHITECTURE.md` §4
   explicitne definujú Bootstrap 5 ako rozhodnutú technológiu a súčasný
   `App.js` (Home route) Bootstrap triedy reálne používa (`container`, `row`,
   `col-lg-7`, `btn btn-primary btn-lg`, `card h-100 shadow-sm`).
   **Rozhodnutie autorky (odsúhlasené v chate 2026-08-15):** Bootstrap sa
   **RUŠÍ v celej aplikácii vrátane Home** — jednotný vlastný CSS systém
   (`variables.css`) všade. Toto je zmena zdokumentovanej architektúry →
   **`00_PROJECT_CONTEXT.md` §12 a `05_TECHNICAL_ARCHITECTURE.md` §4 treba
   aktualizovať** (odstrániť Bootstrap zo zoznamu technológií) — **zatiaľ
   NEVYKONANÉ, je to TODO**.

4. **Veľkostný filter — zmena zo statických min/max inputov na dual-range
   slidery s prepínačom jednotiek.** Pôvodne (2026-08-13/14) boli `lengthMin/
   Max`, `widthMin/Max` číselné inputy. Autorka chce namiesto toho posuvníky,
   s prepínačom µm/mm (kvôli budúcemu rozšíreniu na ďalších hostiteľov s
   väčšími dospelými štádiami).

   **Zistenie z reálnych dát (`dog_migrated.json`, 38 záznamov, výpočet
   vykonaný v tejto session):**
   - `lengthMax` rozsah: 4 µm (`cryptosporidium_parvum`) až 6000 µm
     (`alaria_alata_adult`).
   - **37 z 38 záznamov má `lengthMax ≤ 500 µm`** — jediný odľahlý záznam je
     `alaria_alata_adult` (dospelá motolica, 2500–6000 µm = 2,5–6 mm).
   - Lineárny slider 0–6000 µm by stlačil 97 % databázy do ~7 % dráhy
     posuvníka — nepoužiteľné.

   **Rozhodnutie (odsúhlasené autorkou):**
   - Prepínač jednotiek: **µm a mm, BEZ cm** (cm zatiaľ nemá v databáze psa
     využitie — max hodnota je 0,6 cm; cm sa doplní v Etape 2 pri importe
     ďalších hostiteľov s reálne centimetrovými dospelými štádiami).
   - Rozsah µm slidera: **0–500 µm** (pokrýva 37/38 záznamov).
   - Rozsah mm slidera: **0–10 mm** (pokrýva `alaria_alata_adult` + rezerva).
   - Databáza zostáva vždy v µm (`03_DATA_ENTRY_STANDARD.md` §10 — jednotka
     sa nemení). Prepínač je čisto UI vrstva — hodnota zo slidera v mm sa pred
     porovnaním v `matchesSizeRange()` prevedie ×1000 na µm; samotná funkcia
     `matchesSizeRange()` sa nemení.
   - Technicky: keďže `<input type="range">` má iba jeden bod, „od–do" sa
     implementuje ako **2 prekrývajúce sa range inputy na dimenziu** (vanilla
     JS/CSS technika, žiadna externá knižnica — `08_DEVELOPER_GUIDE.md` §8).
     Spolu 4 slidery viditeľné naraz (dĺžka od/do, šírka od/do) pre aktuálne
     zvolenú jednotku.

5. **Filtre `shape`/`colour` (tvar/farba) — ZACHOVAŤ.** Mockup ich vo
   filter-sidebar nemá, ale autorka potvrdila, že ich chce ponechať (ako
   multi-select, rovnako ako doteraz).

6. **Taxonómia — mockup pridáva riadok „Doména" (napr. Eukaryota), ktorý
   NEEXISTUJE v `02_DATABASE_SPECIFICATION.md` schéme** (`taxonomy` obsahuje
   len kingdom→species, bez domain). **Rozhodnutie zatiaľ nepadlo explicitne
   — plán počíta s vynechaním riadku „Doména", pokým autorka
   nerozhodne inak** (pridanie poľa by vyžadovalo najprv rozšíriť schému a
   zdokumentovať v `02_DATABASE_SPECIFICATION.md` + `10_CHANGELOG.md`, podľa
   `09_MASTER_PROMPT.md` §5).

7. **Terminológia mockupu nesedí s kontrolovaným slovníkom** — mockup používa
   „Fekálie" (má byť `Trus`, `03_DATA_ENTRY_STANDARD.md` §8) a hostiteľov s
   vedeckým menom v labeli („Pes (Canis lupus)" — `hosts.json` slovník obsahuje
   iba čisté `Pes`). Pri implementácii sa použijú skutočné hodnoty z databázy,
   nie text z mockupu.

8. **Chýbajúci asset** `image_C05HpU.png` (pozadie hero sekcie Home) — nebol
   nahraný, treba ho dodať alebo použiť placeholder.

9. **CSS triedy — rozhodnutie o prístupe (autorka delegovala na AI):**
   **Rozhodnuté: existujúce overené triedy v `atlas.css` (v2 sekcia) sa
   PREMENUJÚ na nové názvy z mockupu** (napr. `.atlas-filter-multi` →
   zodpovedajúci mockup ekvivalent), namiesto ponechania dvoch paralelných
   sád tried. Dôvod: vyhnúť sa mŕtvemu/duplicitnému CSS, jeden konzistentný
   systém (`08_DEVELOPER_GUIDE.md`: „nekopírovať rovnaký kód na viac miest").

### 0.3 Zhrnutie rozhodnutí tejto session

| Téma | Rozhodnutie | Stav |
|---|---|---|
| Prístup k implementácii | Reskin — zachovať JS filter/detail logiku, zmeniť markup+CSS | odsúhlasené |
| `variables.css` chýbajúce premenné | Doplniť mostíkové aliasy, neprepisovať `atlas.css` | naplánované |
| Perzistentné view-divy vs Router swap | Zachovať Router/innerHTML swap, len pridať `id="database-view"`/`id="detail-view"` na koreňový element | odsúhlasené |
| Bootstrap | **Zrušiť všade** (aj Home) | **odsúhlasené — vyžaduje aj update `00_PROJECT_CONTEXT.md` §12 a `05_TECHNICAL_ARCHITECTURE.md` §4** |
| Veľkostný filter | Dual-range slidery, prepínač µm (0–500)/mm (0–10), bez cm | odsúhlasené |
| Shape/colour filter | Zachovať ako doteraz (multi-select) | odsúhlasené |
| Taxonómia „Doména" | Vynechať (nie je v DB schéme) | predbežné, čaká na explicitné potvrdenie |
| Terminológia (Fekálie, vedecké mená v host labeloch) | Pri implementácii použiť skutočné hodnoty z DB, nie text z mockupu | odsúhlasené |
| Názvy CSS tried | Premenovať existujúce na nové (mockup), nie ponechať duplicitne | rozhodnuté (AI, na základe delegovania) |
| Chýbajúci obrázok `image_C05HpU.png` | Treba dodať alebo placeholder | otvorené |

### 0.4 Čo NEBOLO v tejto session urobené

- **Žiadny súbor v `src/` ani `database/` nebol zmenený.**
- `variables.css` mostíkové aliasy — pripravené na papieri, nie zapísané.
- `App.js`, `AtlasPage.js`, `atlas.css` diffy — ešte nenapísané (nasledujúci krok).
- `00_PROJECT_CONTEXT.md` a `05_TECHNICAL_ARCHITECTURE.md` — Bootstrap
  odkazy ešte nezmazané.

### 0.5 Ďalší krok

1. Napísať konkrétne diffy pre `variables.css`, `App.js`, `AtlasPage.js`,
   `atlas.css` (markup + CSS pre checkboxy, dual-range slidery s
   µm/mm prepínačom, `.quad-grid`, `.morphology-card-main`, `.taxonomy-table`,
   Home bez Bootstrapu).
2. Po schválení diffov aplikovať zmeny a znova aktualizovať `AI_STATUS.md`
   (táto sekcia sa presunie do „Predchádzajúca zmena", pribudne nová `## 2.`).
3. Aktualizovať `00_PROJECT_CONTEXT.md` §12 a `05_TECHNICAL_ARCHITECTURE.md`
   §4 (odstrániť Bootstrap).
4. Vyriešiť chýbajúci `image_C05HpU.png`.
5. Potvrdiť/zamietnuť riadok „Doména" v taxonómii.

---

## 2b. Posledná databázová zmena (2026-08-15 v6 — databázový import, kód nemenený)

**Import mikrometrie a taxonómie z `Mikrometria_doplnená__opravená.xlsx` do
`database/dog.migrated.json`.** Toto je zmena DÁT, nie kódu — nedotýka sa
`AtlasPage.js` ani `atlas.css` z predchádzajúcej session (tie zostávajú
nezmenené a nepresunuté do repozitára, pozri hlavičku vyššie).

Kontext: autorka nahrala novú, opravenú/doplnenú tabuľku (569 riadkov, všetci
hostitelia; hárok `vetpara_atlas_taxony`), z ktorej bola pre tento krok použitá
podmnožina `host = Pes` (38 riadkov) + 1 riadok `host = Mačka` (na explicitný
pokyn, pozri nižšie).

### 2.1 Politika prepisovania (schválená autorkou v chate pred zápisom)

1. `micrometry` — tabuľka je autoritatívna, prepisuje aj vyplnené hodnoty.
2. `taxonomy` — pri konflikte je autoritatívna tabuľka, OKREM 11 explicitných
   odborných korekcií od autorky (zoznam nižšie — tam zostala pôvodná DB
   hodnota).
3. `notes` — doplnené len tam, kde tabuľka mala explicitný pokyn „do poznámky
   napíš/daj: ...", textom prevzatým doslovne.
4. Kingdom normalizácia: `Metazoa` → `Animalia`, `Protista` sa nepoužíva
   (nahradené `Protozoa`/`Chromista` podľa konkrétneho taxónu z tabuľky).

### 2.2 Explicitné odborné korekcie autorky (DB hodnota ponechaná, tabuľka ignorovaná)

| Záznam | Pole | Ponechané (DB) | Ignorované (tabuľka) |
|---|---|---|---|
| `toxocara_canis` | family | Toxocaridae | Ascarididae |
| `crenosoma_vulpis` | family | Crenosomatidae | Metastrongylidae |
| `oslerus_filaroides_osleri` | genus/species | Oslerus / Oslerus osleri | Filaroides / Filaroides osleri |
| `dioctophyme_renale`, `trichuris_vulpis`, `pearsonema_capillaria_plica`, `eucoleus_boehmi` | class | Enoplea | Chromadorea |
| `pearsonema_capillaria_plica` | family | Capillariidae | Trichuridae |
| `demodex_canis`, `demodex_injai` | family | Demodicidae | Demodecidae |

`spirocerca_lupi.family` bolo zmenené na **Spirocercidae** — zhoduje sa
s tabuľkou aj s explicitným potvrdením autorky, nejde o konflikt.

### 2.3 Výsledné čísla (po druhom kole spätnej väzby)

- **37 z 38** pôvodných záznamov zmenených (13× `micrometry`, 37× `taxonomy`,
  6× `notes`).
- **`dipylidium_caninum`** — kompletne prevzaté hodnoty z riadku pre mačku
  (tabuľka nemala riadok pre psa) — **autorka potvrdila správnosť** („ten istý
  druh, sedí").
- **`diphyllobothrium_latum` + `dibothriocephalus_latus_egg` ZLÚČENÉ do
  jedného záznamu** (na pokyn autorky: Dibothriocephalus latus je aktuálny
  názov, Diphyllobothrium latum starší/synonymný). Výsledné ID:
  `dibothriocephalus_latus_egg`, `legacyId` zachované ako `DOG-0015`.
  `micrometry`/`morphology` ponechané z pôvodného (overeného) záznamu —
  hodnoty z druhého tabuľkového riadku (`Dibothriocephalus_latus_egg`, bez
  operkula, "v kokónoch") NEBOLI prevzaté, pretože biologicky nesedia k tejto
  čeľadi (podozrenie na chybu/zámenu riadkov v zdrojovej tabuľke) — **flagnuté,
  autorka toto explicitne nepotvrdila, len názvoslovný merge**.
- **`cryptosporidium_parvum`** — `kingdom`: `Chromista` → `Protozoa` (na pokyn
  autorky), `phylum`: `Myzozoa` → `Apicomplexa` (dodatočná úprava pre
  konzistenciu s ostatnými Apicomplexa v DB — **nebola explicitne vyžiadaná,
  over**).
- Databáza psa: **38 → 39 → 38 záznamov** (čistý výsledok: rovnaký počet ako
  na začiatku, ale výrazne doplnený/opravený/zlúčený obsah).
- Zmenené záznamy z 1. kola: `modified = 2026-08-15T00:00:00.000000+00:00`,
  `version 1.2.0`. Záznamy dotknuté 2. kolom (zlúčenie, kingdom fix):
  `modified = 2026-08-15T01:00:00.000000+00:00`, `version 1.3.0`.

Kompletný detail (presné hodnoty pred/po, per-záznam zoznam, zdôvodnenia,
vrátane dodatku so zlúčením): `docs/2026-08-15_micrometry-taxonomy-import.md`
sekcia 12.

### 2.4 Otvorené TODO z tejto zmeny

- ~~`dipylidium_caninum` — hodnoty prevzaté od mačky~~ — **POTVRDENÉ
  autorkou**, žiadna ďalšia akcia.
- ~~`dibothriocephalus_latus_egg` vs `diphyllobothrium_latum`~~ —
  **ZLÚČENÉ**, ale mikrometria/morfológia z druhého tabuľkového riadku bola
  zámerne NEpoužitá kvôli podozreniu na chybu v zdroji — **odporúčam
  skontrolovať tento konkrétny riadok v pôvodnej tabuľke**.
- ~~`cryptosporidium_parvum.taxonomy.kingdom`~~ — **OPRAVENÉ** na `Protozoa`;
  `phylum` zmenený na `Apicomplexa` ako súvisiaca úprava — potvrď, či to
  zodpovedá zámeru.
- `group` pri `demodex_canis`/`demodex_injai`/`linguatula_serrata` naďalej mimo
  kontrolovaného zoznamu — nerieši sa touto zmenou (pozri aj bod 3.4 nižšie).
- Tabuľka obsahuje dáta pre ďalších **14 hostiteľov** (530 riadkov) —
  pripravené na budúcu Etapu 2, mimo rozsahu tejto session.

**Súbory na stiahnutie z tejto session:**
- `dog.migrated.json` (finálna verzia po oboch kolách, 38 záznamov)
- `2026-08-15_micrometry-taxonomy-import.md` (kompletný popis zmeny vrátane
  dodatku so zlúčením — sekcia 12)

**`dog.json`, `Repository.js`, `AtlasPage.js`, `atlas.css` NEBOLI touto zmenou
menené.**

## 2b. Predchádzajúca zmena (2026-08-14, Ctrl/Cmd hint)

**Doplnená poznámka pre desktop používateľov o Ctrl/Cmd+click pri multi-select
filtroch.**

Kontext: autorka na mobile otestovala appku (`raw.githack.com`) — potvrdila, že
multi-select filtre aj taxonomické zaradenie fungujú správne (predchádzajúce
podozrenie na chýbajúcu taxonómiu bolo len tým, že sa pozerala na záznam, kde
`taxonomy` skutočne je prázdna — nie chyba). Požiadala o jasnejšiu nápovedu
na desktope, keďže výber viacerých hodnôt vyžaduje podržanie Ctrl/Cmd, čo nie
je zjavné z UI.

### 2.1 Zmena v `src/pages/AtlasPage.js` (PRVÁ ZMENA JS SÚBORU V TEJTO SÉRII)

V metóde `renderMultiFilter()` pridaný nový `<span>` vedľa existujúceho
`.atlas-filter-hint`:

```diff
                 <label for="atlas-filter-${field}">
                     ${label}
                     <span class="atlas-filter-hint">
                         (viac možností naraz)
                     </span>
+                    <span class="atlas-filter-hint atlas-filter-hint-desktop">
+                        — na výber viacerých podrž Ctrl (Windows) / Cmd (Mac)
+                    </span>
                 </label>
```

Presne 3 pridané riadky, nič iné v súbore nezmenené (potvrdené diffom).
`node --check` prešiel bez chyby (validný ES modul).

### 2.2 Zmena v `src/styles/atlas.css`

Nová trieda `.atlas-filter-hint-desktop` — viditeľná na desktope
(`display: inline-block`), skrytá pod rovnakým breakpointom, aký používa
zvyšok súboru pre mobile štýly (`@media (max-width: 700px)`), pretože na
mobile sa vyberá dotykom/zaškrtávaním a poznámka o klávesách by mátala.

Zátvorky vyvážené (89 `{` / 89 `}`).

**Prečo textová poznámka v HTML, nie cez CSS `::before`/`::after` s
`content:`:** inštrukčný text (nie dekorácia) patrí do markupu kvôli
prístupnosti (čítačky obrazovky spoľahlivo nečítajú generovaný CSS obsah,
navyše sa nedá označiť/skopírovať) — v súlade s WCAG 2.1 AA cieľom
z `04_UI_UX_SPECIFICATION.md` § 16.

**Stále NEOVERENÉ vizuálne** — treba znova pozrieť na desktope (a potvrdiť,
že sa na mobile poznámka správne skrýva).

Súbory na stiahnutie z tejto session: `atlas.css`, `AtlasPage.js` (obe
kompletné, s vyznačenou zmenou).

## 2b. Predchádzajúca zmena (2026-08-14, oprava .atlas-size-row na mobile)

**Reálny test na mobile (autorka projektu, cez `raw.githack.com/.../develop/`)
+ oprava nájdeného CSS bugu vo veľkostnom filtri.**

### 2.1 Zistenia z testu na mobile

1. **Multi-select filtre fungujú správne** — na mobile sa correctly správajú
   ako zaškrtávacie zoznamy (natívne mobilné UI pre `<select multiple>`).
2. **Na desktope ide vybrať vždy len jedna hodnota kliknutím** — toto NIE JE
   chyba, je to natívne správanie `<select multiple>`: viac hodnôt sa vyberá
   podržaním Ctrl (Windows) / Cmd (Mac) pri klikaní. Autorke to bolo
   vysvetlené. **Otvorená otázka pre budúcnosť:** ak by sa mal tento control
   prerobiť na skutočné checkboxy (rovnaké UX na desktope aj mobile), ide
   o zásah do `AtlasPage.js` (markup + JS), nie len CSS — čaká na explicitné
   rozhodnutie autorky, zatiaľ NEROBENÉ.
3. **Bug: veľkostný filter na mobile** — pole "do" sa zalamovalo pod pole "od"
   a naťahovalo sa na celú šírku namiesto zarovnania vedľa "od" v jednom
   riadku, s rovnakou šírkou. **Opravené** (pozri 2.2).
4. ~~Taxonomické zaradenie sa na mobile nezobrazovalo~~ — **OPRAVA (dodatočne
   potvrdené autorkou):** toto NEBOL bug. Autorka sa pri prvom teste pozerala
   na záznam, ktorý reálne má `taxonomy: {}` (prázdne pole) — pri zázname
   s vyplnenou taxonómiou sa blok zobrazuje správne. Import taxonómie
   (`Taxonomia_na_doplnenie.xlsx`) naďalej prebieha samostatne/v inom chate,
   ale nejde o UI problém.

### 2.2 CSS oprava — `.atlas-size-row`

Príčina: riadok mal 4 flex-položky (label, input, label, input) s
`flex-wrap: wrap`. Pri nedostatku miesta sa posledná položka ("do" input)
zalomila sama na nový riadok, a keďže mala `flex-grow: 1` a bola na riadku
sama, roztiahla sa na celú šírku kontajnera.

Oprava: `.atlas-size-row` prerobený z `display: flex` na `display: grid`
so `grid-template-columns: auto 1fr auto 1fr` — label/input dvojice teraz
vždy zostávajú v jednom riadku, oba inputy majú rovnakú šírku (`1fr` stĺpce),
na akejkoľvek šírke obrazovky. Odstránená zastaraná mobilná úprava
`.atlas-size-row label { min-width: 5rem }` (už netreba, grid stĺpce sa
sizujú automaticky), pridaný jemný doplnok pre veľmi úzke obrazovky
(`max-width: 380px` — menší gap a font-size labelov).

Overené: zátvorky vyvážené (86 `{` / 86 `}`), diff izolovaný presne na
`.atlas-size-row` blok a nový `@media (max-width: 380px)` blok — nič iné
v súbore sa nezmenilo.

**Stále NEOVERENÉ vizuálne po tejto konkrétnej oprave** — treba znova
otestovať na mobile cez `raw.githack.com` link.

Súbor na stiahnutie z tejto session: `atlas.css` (opravená verzia).

## 2b. Predchádzajúca zmena (2026-08-14, prvá+druhá iterácia CSS v2)

**`src/styles/atlas.css` — CSS pre v2 triedy, OPRAVENÉ po nahratí skutočného
`AtlasPage.js`.**

V predchádzajúcom kroku (2026-08-14, prvá verzia) bol CSS napísaný len z opisu
štruktúry v dokumentácii, bez zdrojového kódu. Po nahratí skutočného
`AtlasPage.js` sa porovnaním markupu s CSS našli **4 nezrovnalosti**, teraz
opravené:

1. **Duplicitná ikona ⚡** — markup už obsahuje `<span aria-hidden="true">⚡</span>`
   priamo v `<li>`; pôvodný CSS pridával rovnakú ikonu ešte raz cez
   `li::before { content: "⚡" }`, čo by v UI zobrazilo ⚡⚡. Opravené —
   `::before` odstránené, štýluje sa priamo existujúci `<span>`.
2. **Chýbajúca trieda `.atlas-filter-hint`** — label multi-selectu obsahuje
   `<span class="atlas-filter-hint">(viac možností naraz)</span>`, ktorá
   nemala žiadny štýl. Doplnené (malý, tlmený text).
3. **Zle cielený selektor pre veľkostný filter** — skutočný markup je
   `.atlas-size-filter > fieldset > legend`, nie `.atlas-size-filter > legend`
   priamo. Pôvodný selektor by nič netrafil a natívny browser štýl
   `<fieldset>` (default border/padding) by zostal nepotlačený. Opravené —
   `fieldset` je teraz resetovaný (`border:0; padding:0; margin:0`), `legend`
   cielená cez `.atlas-size-filter legend`.
4. **Dvojitý box okolo taxonómie** — `.parasite-taxonomy` je v skutočnosti
   VŽDY vnorená v `.parasite-detail-field` (tá už má vlastný
   border+padding+border-radius z pôvodného CSS). Pôvodná verzia pridávala
   `.parasite-taxonomy` ešte vlastný border/padding → box v boxe. Opravené —
   `.parasite-taxonomy` má teraz iba `margin-top`, žiadny vlastný rámik.

Menšie doladenie: `.atlas-size-row` prestavaná z predpokladaného 1 label + 1
input + separator na skutočný markup 2× (label + input) v jednom riadku —
`white-space: nowrap` na labeloch namiesto pevnej `min-width`, keďže texty
("Dĺžka od" vs "do") majú rôznu dĺžku.

Overené:
- diff proti pôvodnému `atlas.css`: časť pred v2 sekciou je bit-identická
  (líšia sa len konce riadkov, obsah 1:1)
- zátvorky v CSS vyvážené (84 `{` / 84 `}`)
- CSS teraz zodpovedá reálnemu markupu z nahratého `AtlasPage.js`, nie len
  opisu

**Stále NEOVERENÉ:** skutočné vykreslenie v prehliadači (vizuálny vzhľad,
mobile touch, multi-select UX) — v tomto prostredí nie je možné spustiť DOM.

Súbor na stiahnutie z tejto session: `atlas.css` (finálna, opravená verzia).

## 2b. Predchádzajúca zmena (2026-08-13, nezmenené touto úpravou)

**AtlasPage.js — "Filter & Detail engine v2"** (kombinovaný krok podľa `Úlohy.txt`
body 1, 3, 4, 5 a predchádzajúceho TODO zo zobrazenia `diagnosticSigns`).

Zmeny:
- Karta aj detail teraz zobrazujú `diagnosticSigns` (so symbolom ⚡).
- Detail teraz zobrazuje `taxonomy` (Ríša–Kmeň–Trieda–Rad–Čeľaď–Rod–Druh) +
  externé odkazy na Catalogue of Life a WoRMS (iba zostavenie vyhľadávacieho
  URL z `latinName`, žiadne API volanie ani automatické priradenie výsledku).
- Nový filter podľa veľkosti — dĺžka od/do, šírka od/do, prekryvová zhoda
  s nameraným rozsahom (nie presná zhoda). Objekty bez nameranej hodnoty sa
  pri aktívnom filtri daného rozmeru nezobrazia.
- Nový filter podľa `sample` ("materiál") — pole už v databáze existovalo,
  teraz je aj vo filtroch.
- Filtre `host`/`sample`/`shape`/`colour` prerobené na multi-select (OR logika
  v rámci poľa, napr. farba: hnedá alebo žltá alebo žltohnedá naraz).
- Fulltext rozšírený z `latinName`/`slovakName` aj na `notes`,
  `diagnosticSigns[]`, `morphology.shape/colour/shell`.

Detaily a zoznam otvorených TODO (CSS, mobile UX, validácia vstupov):
`docs/2026-08-13_atlaspage-v2-filters-and-detail.md`.

Vykonané v Claude chate, výstup treba stiahnuť a nahradiť
`src/pages/AtlasPage.js` v repozitári + commitnúť.

Súbory na stiahnutie z tejto session:
- `AtlasPage.js` (nová verzia)
- `2026-08-13_atlaspage-v2-filters-and-detail.md` (kompletný popis zmeny)

**`dog.migrated.json`, `Repository.js`, `dog.json` NEBOLI touto zmenou menené.**

## 3. Aktuálny stav projektu

Aplikácia je funkčná, databáza sa načítava, `AtlasPage.js` teraz zobrazuje
kompletný súbor polí zavedených v predchádzajúcich session (`diagnosticSigns`,
`taxonomy`, `sample`) a podporuje rozšírené filtrovanie podľa `Úlohy.txt`.

### 3.1 Funkčné časti
- **App.js** – bootstrap, načítanie databázy, routing
- **Router.js** – hash-based router, stabilný
- **ApplicationState.js** – globálny stav, filtre, ready flag (zatiaľ
  nepoužívaný Repository/AtlasPage filtrami — pozri bod 3.4)
- **DatabaseService.js** – načítanie databázy, cache, getRecordById
- **Repository.js** – vyhľadávanie, filtrovanie, triedenie (bez zmeny)
- **AtlasPage.js** – **NOVÁ VERZIA** — zobrazuje `diagnosticSigns` + `taxonomy`,
  multi-select filtre, filter veľkosti a materiálu, rozšírený fulltext
- **dog.migrated.json** – **38 záznamov** (2026-08-15: doplnená/opravená
  mikrometria a taxonómia z novej tabuľky pri 37 záznamoch, `dipylidium_caninum`
  prevzaté od mačky, `diphyllobothrium_latum`+`dibothriocephalus_latus_egg`
  zlúčené do jedného záznamu, `cryptosporidium_parvum` kingdom/phylum
  opravené — pozri sekciu 2)
- **migrate-dog-json.js** – pôvodná migrácia z dog.json, stále platná
- **index.html** – základná štruktúra aplikácie
- **main.js** – inicializácia App.start()

### 3.2 Čo funguje technicky
- `node --check` na `AtlasPage.js` prešiel bez chyby, zátvorky vyvážené
  (kód z tejto session nebol menený — týka sa predchádzajúcej verzie).
- `dog.migrated.json` (finálna verzia po 2. kole, 38 záznamov) overená ako
  validný JSON, bez duplicitných ID.
- Logika filtrovania (v `AtlasPage.js`) nebola v tejto session prepočítaná
  proti novej štruktúre — polia použité vo filtroch (`host`, `sample`,
  `morphology.shape/colour`, `micrometry.*`) neboli touto zmenou premenované,
  filtre by mali fungovať bez zásahu, ale odporúča sa funkčný test.
- **Reálny beh v prehliadači nebol v tomto prostredí overený** — odporúča sa
  funkčný test po nasadení, najmä `<select multiple>` binding.

### 3.3 Zmena schémy ID / počtu záznamov
**38 záznamov** (2026-08-15, obsahovo zmenené — pozri sekciu 2). Sémantické
ID + `legacyId` konvencia zachovaná; ID `diphyllobothrium_latum` bolo
premenované na `dibothriocephalus_latus_egg` (odráža aktuálne platný
vedecký názov), `legacyId: "DOG-0015"` zachované pre dohľadateľnosť. Ak
niekde v kóde/URL/poznámkach existuje odkaz na staré ID
`diphyllobothrium_latum`, treba ho opraviť.

### 3.4 Čo nefunguje / je prázdne
- Gallery page – placeholder
- Expert page – placeholder
- Settings page – placeholder
- **CSS pre nové triedy je teraz overený proti skutočnému `AtlasPage.js`**
  (2026-08-14, druhá iterácia) — `atlas-filter-multi`, `atlas-filter-hint`,
  `atlas-size-filter`, `atlas-size-row`, `atlas-size-hint`,
  `parasite-diagnostic-signs`, `parasite-taxonomy`, `taxonomy-row`,
  `taxonomy-rank`, `taxonomy-value`, `parasite-taxonomy-links` majú štýly
  zodpovedajúce reálnemu markupu. Stále chýba: skutočné vykreslenie
  v prehliadači (vizuálna kontrola, mobile touch)
- Multi-select (`<select multiple>`) na mobile nebol UX-testovaný —
  `04_UI_UX_SPECIFICATION.md` vyžaduje mobile-first, treba reálne overiť
- Validácia vstupov filtra veľkosti (napr. min > max) nie je ošetrená
- `differentialDiagnosis`, `images`, `references`, `zoonosis`, `methods` —
  stále prázdne pri všetkých záznamoch (nerieši sa touto úpravou)
- `group` pri Acari/Pentastomida stále mimo kontrolovaného zoznamu
- Repository zatiaľ neaplikuje `ApplicationState.filters` (filtre zostávajú
  lokálne v `AtlasPage.js` — architektonické rozhodnutie zachované z
  predchádzajúcej verzie, zmena je samostatná plánovaná úloha)
- ~~Šírka mikrofilárií (`dirofilaria_repens`, `dirofilaria_immitis`,
  `oslerus_filaroides_osleri`) stále chýba~~ — **OPRAVENÉ 2026-08-15**,
  doplnené z novej tabuľky (pozri sekciu 2).

### 3.5 Databáza – stav
**38 záznamov** (2026-08-15, obsahovo zmenené/opravené/zlúčené oproti
predchádzajúcej verzii), `dog.json` naďalej nemenené (iba
`dog.migrated.json`).
- ✅ **Taxonómia pre psa** — doplnená/opravená z `Mikrometria_doplnená__opravená.xlsx`
  (pozri sekciu 2) — TOTO NAHRÁDZA predchádzajúci plán so
  `Taxonomia_na_doplnenie.xlsx` (zdá sa, že autorka doručila výsledok
  spracovania cez novú tabuľku namiesto pôvodne plánovaného súboru — over,
  či `Taxonomia_na_doplnenie.xlsx` ešte treba spracovať samostatne, alebo je
  týmto krokom nahradený).
- Nová tabuľka obsahuje dáta pre **14 ďalších hostiteľov** (530 riadkov mimo
  Pes/Mačka-dipylidium) — pripravené na budúcu Etapu 2, zatiaľ nespracované.
- Súbežné spracovanie zvyšných hárkov z `Mikrometria__parazity.xls` v DeepSeek
  (mimo tejto session) — status neznámy, over či je stále aktuálne alebo bolo
  nahradené novou tabuľkou.

### 3.6 Architektúra
(bez zmeny)

---

## 4. Posledné zmeny v súboroch
- src/pages/AtlasPage.js – **nahradiť verziou z tejto session** (pridané 3
  riadky v `renderMultiFilter()` — Ctrl/Cmd hint span, nič iné zmenené)
- src/styles/atlas.css – **nahradiť verziou z tejto session** (pridaná
  trieda `.atlas-filter-hint-desktop` + jej mobile skrytie, ostatný obsah
  vrátane predošlej opravy `.atlas-size-row` zachovaný)
- taxonómia (samostatná téma) – nová session/nový chat, prompt bol pripravený
  v predchádzajúcom kroku tejto konverzácie

---

## 5. Posledný problém
Žiadny aktívny dátový problém pri importe (JSON validný, žiadne duplicitné
ID). Treba:
1. **nahradiť `database/dog.migrated.json` v repozitári** novým súborom
   z tejto session (38 záznamov, finálna verzia po zlúčení) + commitnúť,
2. skontrolovať zdrojový riadok `Dibothriocephalus_latus_egg` v tabuľke —
   podozrenie na chybné/zamenené dáta (pozri 2.4),
3. stiahnuť `atlas.css` a `AtlasPage.js` z predchádzajúcej session
   (2026-08-14) a nahradiť nimi súbory v `src/` — **stále nepotvrdené, či boli
   commitnuté**,
4. **reálne otestovať v prehliadači** (vizuálny vzhľad, multi-select binding,
   filter veľkosti, zobrazenie taxonómie/diagnosticSigns) — v tomto prostredí
   nebolo možné spustiť DOM, iba statická kontrola markup↔CSS,
5. overiť, či `Taxonomia_na_doplnenie.xlsx` (pôvodne plánované ako samostatný
   krok) je týmto importom nahradený, alebo treba spracovať zvlášť,
6. spracovať zvyšných 14 hostiteľov z novej tabuľky (Etapa 2) — mimo rozsahu
   tejto session.

---

## 6. Ďalší krok (pre Claude / Gemini / DeepSeek)

1. ✅ CSS pre nové triedy z `AtlasPage.js` v2 pripravené a **overené proti
   skutočnému zdrojovému kódu** (2026-08-14)
2. ✅ Mikrometria a taxonómia pre psa doplnená/opravená z novej tabuľky,
   vrátane zlúčenia duplicity a kingdom-opravy (2026-08-15) — **treba
   nahradiť súbor v repozitári + commit**
3. Funkčný test v prehliadači po nasadení (vizuálny, nie len statický)
4. Vyriešiť `group` pre Acari/Pentastomida (mimo kontrolovaného zoznamu)
5. Implementovať Gallery page (zatiaľ placeholder)
6. Implementovať Expert page (diagnostický systém)
7. Rozšíriť Repository o podporu ApplicationState.filters (samostatná úloha,
   architektonicky oddelená od tejto zmeny)
8. Pridať error page pre neexistujúce ID, preloader pri načítaní databázy
9. Spracovať zvyšných 14 hostiteľov z `Mikrometria_doplnená__opravená.xlsx`
   (Etapa 2) — validovať proti schéme pred zaradením do `database/`
10. Skontrolovať zdrojový riadok `Dibothriocephalus_latus_egg` v tabuľke
    (podozrenie na chybné dáta — pozri 2.4)
11. Overiť/rozhodnúť osud `Taxonomia_na_doplnenie.xlsx` (pravdepodobne
    nahradený týmto krokom, ale nepotvrdené)

---

## 7. Dôležité pravidlá pre AI
- AI musí vždy načítať aktuálne súbory pred zmenou
- AI musí aktualizovať AI_STATUS.md po každej zmene
- AI nesmie meniť architektúru bez súhlasu
- AI nesmie prepisovať dog.json (iba dog.migrated.json)
- AI nesmie dopĺňať odborné údaje odhadom — výnimkou sú iba explicitné inštrukcie
  autorky projektu priamo v chate (napr. Taenia/Echinococcus split,
  Kingdom-normalizácia Animalia/Protozoa/Chromista namiesto zastaraných
  Metazoa/Protista — rozhodnuté 2026-08-15, pozri sekciu 2.1)
- AI musí rešpektovať databázovú štruktúru podľa 02_DATABASE_SPECIFICATION.md
- Projekt je hlavný zdroj pravdy (nie konverzácia)
- Git commit po každej zmene
- Pri súbežnej práci viacerých AI nástrojov na projekte: každý pracuje na
  vopred vymedzenej, nezávislej sade súborov, aby nedochádzalo ku konfliktom
  (pozri `11_SESSION_LOG.md` bod 4 a rozdelenie práce z 2026-08-13)

---
