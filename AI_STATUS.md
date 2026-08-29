# VetPara Atlas – AI STATUS (kompletný stav projektu)

🔥 0.23 Aktuálny stav — doplnené (2026‑08‑29, session: vizuálne oddelenie parazitov v tabe Fotografie — karty namiesto tabuľky, zoradenie podľa abecedy, nájdená duplicita `imageForm.js`)

## ✅ ČO SA VYRIEŠILO V TEJTO SESSII

### Kontext

Nadväzuje na §0.22 (Admin nástroj, tab „3. Fotografie"). Autorka nahlásila, že v tabuľkovom zobrazení fotiek boli jednotlivé riadky parazitov oddelené len tenkými čiarami — nebolo dobre vidno, ktorému ID patria ovládacie prvky (URL, Pridať, Vymazať, Vybrať súbory) pod ním. V tej istej session následne požiadala aj o možnosť zoradiť zoznam podľa abecedy.

### 🟡→✅ Zmena 1: tabuľka nahradená kartami (`tools/admin/forms/imageForm.js`, `tools/admin/admin.css`)

**Riešenie:** `renderImageTab()` už negeneruje `<table>`, ale zoznam ohraničených blokov `<section class="parasite-image-card">`, jeden na parazita:
- **Hlavička karty** (tmavé pozadie `#2c3e50`) — ID parazita ako monospace odznak (`.pic-id`) + latinský názov (`.pic-latin`) + počet obrázkov ako odznak vpravo (`.pic-count`).
- **Telo karty** — zoznam URL priradených obrázkov, alebo text „Nie sú priradené žiadne obrázky".
- **Panel akcií** (svetlé pozadie, oddelené prerušovanou čiarou) — tri jasne popísané polia s vlastným `<label>`: „Vybrať súbory", „URL adresa", tlačidlá „➕ Pridať" / „🗑️ Vymazať všetky".
- Parazit bez fotky (`isMissing`) dostal triedu `.is-missing` — oranžový ľavý okraj + oranžová hlavička namiesto tmavej, takže je vizuálne hneď vidno, kde treba doplniť fotky (funguje aj spolu s existujúcim filtrom „len bez fotografie" z §0.22).

**Dôležité:** zmenil sa iba markup/štýl (`div`/`section` namiesto `table`/`tr`/`td`, inline `style` nahradené CSS triedami v `admin.css`). Logika sa nemenila — rovnaké CSS triedy pre event listenery (`.image-file-input`, `.image-url-input`, `.add-image-btn`, `.delete-image-btn`) aj rovnaké `data-id` atribúty, takže existujúce handlery v `imageForm.js` (pridanie cez súbory/URL, mazanie, filter „len bez fotografie", zachovanie scroll pozície z §0.22) fungujú bez zásahu.

- **`tools/admin/admin.css`** — pridaná nová sekcia štýlov: `.parasite-image-card`, `.parasite-image-card-header`, `.pic-title`/`.pic-id`/`.pic-latin`/`.pic-count`, `.parasite-image-card-body`, `.image-urls`/`.image-url-item`/`.image-urls-empty`, `.parasite-image-card-actions`, `.action-field`, `.action-field-buttons`. Nič sa neodstránilo ani nepremenovalo z existujúcich tried.

### 🟡→✅ Zmena 2: zoradenie podľa abecedy (`tools/admin/forms/imageForm.js`)

**Riešenie:** pridaný druhý checkbox v hlavičke „📷 Správa fotografií" vedľa „Zobraziť len parazitov bez fotografie": **„Zoradiť podľa abecedy (latinský názov)"**.
- Nový perzistentný modulový stav `sortAlphabetically` (rovnaký vzor ako `showOnlyMissing`).
- Pri zapnutí sa `visibleParasites` zoradia cez `.sort()` na **kópii** poľa (nie `state.parasites` priamo, aby sa nezmenilo poradie použité inde v appke, napr. pri exporte) podľa `p.latinName || p.id`, cez `localeCompare(..., 'sk', { sensitivity: 'base' })` (správne zoradí aj diakritiku).
- Funguje spolu s existujúcim filtrom „len bez fotografie" (filter aj zoradenie sa aplikujú nezávisle na `visibleParasites`).

### 🔴→✅ Nájdená a opravená príčina, prečo sa zmeny v `imageForm.js` dlho neprejavovali naživo

Autorka nahlásila, že po nahradení `imageForm.js` sa nová funkcia (zoradenie) v prehliadači vôbec neobjavila — ani po hard refresh, disable cache, inkognito okne. Dlhšie hľadanie príčiny (Network tab → Response, porovnanie obsahu súboru) ukázalo, že **v projekte existovali DVA súbory `imageForm.js`** — jeden v `tools/admin/forms/imageForm.js` (ten, ktorý sa upravoval) a druhý priamo v `tools/admin/imageForm.js` (starý, bez úprav). Admin nástroj importoval ten druhý, takže sa reálne vždy servírovala stará verzia bez ohľadu na to, čo sa menilo/ukladalo v `forms/imageForm.js`.

**Oprava:** duplicitný súbor `tools/admin/imageForm.js` (mimo `forms/`) bol vymazaný, zostal iba `tools/admin/forms/imageForm.js` ako jediný zdroj pravdy. Po tomto kroku sa karty aj zoradenie podľa abecedy naživo potvrdili ako funkčné.

**⚠️ Pozor pre ďalšiu session:** ak sa nabudúce zmena v ktoromkoľvek `tools/admin/**` súbore znova neprejaví naživo aj po hard refresh/inkognito, over si HNEĎ na začiatku (cez VS Code Ctrl+Shift+F vyhľadanie naprieč projektom, alebo Ctrl+P), či neexistuje duplicitná kópia toho istého súboru inde v `tools/admin/` stromovej štruktúre — toto bola koreňová príčina v tejto session.

### Zhrnutie vykonaných zmien kódu v tejto session

| Súbor | Zmena | Stav |
| --- | --- | --- |
| `tools/admin/forms/imageForm.js` | `renderImageTab()`: tabuľka → karty na parazita (hlavička ID+latinName+počet, telo so zoznamom URL, panel akcií s labelmi); `.is-missing` zvýraznenie pre parazitov bez fotky; nový checkbox + logika zoradenia podľa abecedy (`sortAlphabetically`) | ✅ hotové (kód), ✅ naživo overené autorkou |
| `tools/admin/admin.css` | nová sekcia štýlov pre `.parasite-image-card` a podprvky | ✅ hotové (kód), ✅ naživo overené autorkou |
| `tools/admin/imageForm.js` (duplicitný súbor mimo `forms/`) | **vymazaný** — bol príčinou, že sa zmeny v `forms/imageForm.js` neprejavovali naživo | ✅ vyriešené |

### 🟡 Otvorené úlohy z tejto session (pre ďalšiu session)

1. Responzívne správanie panelu akcií (`admin.css` media query `@media (max-width: 768px)`) na malej obrazovke — ešte nebolo cielene otestované s novým card layoutom.
2. Diff súbory (`imageForm.diff`, `admin.diff`, `imageForm-sort.diff`) boli odovzdané len v chate, autorka sa rozhodla neukladať ich do `docs/` — reálne zmeny sú priamo v `tools/admin/forms/imageForm.js` a `tools/admin/admin.css`.

---

🔥 0.22 Aktuálny stav — doplnené (2026‑08‑22/23, session: 404 na fotky v Detaile parazita, výber hlavnej fotky (isPrimary), upratovací nástroj na nepoužité súbory, scroll + filter v tabe Fotografie)

## ✅ ČO SA VYRIEŠILO V TEJTO SESSII

### Kontext

Nadväzuje na §0.21. Autorka ručne vyčistila 5 duplicitných `_full` záznamov z §0.21 (potvrdené, žiadne ďalšie duplicity). Nahlásila nový problém: Detail parazita nezobrazoval fotky (404 v konzole), hoci Galéria aj prepojenie z fotky fungovali. Následne v tej istej session požiadala o možnosť explicitne určiť hlavnú fotku, o upratovací nástroj na nepoužité súbory v `public/images/parasites/`, a napokon (táto správa) o opravu scroll-pozície pri pridávaní fotky v Admin nástroji + filter na parazitov bez fotky.

### 🔴→✅ Bug: Detail parazita — 404 na fotky (Galéria fungovala, Detail nie)

**Príčina:** V `AtlasPage.js` existujú dve paralelné vetvy na vykreslenie fotiek v Detaile — `PrimaryImage.render()`/`PrimaryImage.populate()` (má `resolveImageUrl()`, ktorá odstráni úvodnú lomku) a novší blok (`// --- NOVÉ: Zobrazenie obrázkov z images.json ---`, pridaný pri predchádzajúcej úprave klik-správania na fotkách), ktorý ale používal `img.url`/`firstImageUrl` **priamo, bez normalizácie**. `PrimaryImage.populate()` sa navyše volal iba v `else` vetve (keď fotky NEEXISTUJÚ) — teda presne vtedy, keď to je zbytočné. Keďže `img.url` v `images.json` je absolútna cesta (`/public/images/...`) a appka na GitHub Pages beží pod podcestou (`/VetPara-Atlas/`), táto vetva spôsobovala 404 presne podľa vzoru už zdokumentovaného v §0.9/§0.10 pre Galériu — len táto konkrétna vetva vtedy ešte neexistovala/nebola opravená.

**Oprava:** oba výskyty (`firstImageUrl`, `img.url` v miniatúrach) teraz idú cez `PrimaryImage.resolveImageUrl()` (existujúca, už otestovaná funkcia — nič sa neduplikovalo).

### ✅ Nová funkcia: explicitný výber hlavnej fotky (`isPrimary`)

Autorka chcela vedieť/vedieť ovplyvniť, ktorá fotka z galérie sa ukáže ako hlavná v Atlase. Zistené: `Repository.getImagesForParasite()` netriedi vôbec — vracia záznamy v poradí, v akom sú zapísané v `images.json` (documented already v §0.10, riadok s diffom `getImagesForParasite`). `PrimaryImage.js` má vlastné (nepoužívané pre parazitov s fotkami) triedenie podľa najstaršieho `dateAdded`.

**Riešenie (schválené autorkou spomedzi 4 ponúknutých variantov):** nové voliteľné pole `isPrimary: true` v `images.json`, nastaviteľné v `tools/captions/index.html`.

- **`src/components/PrimaryImage.js`** — nová zdieľaná funkcia `pickPrimary(imagesForParasite)`: uprednostní záznam s `isPrimary:true`, inak spätne kompatibilný fallback na najstarší `dateAdded`. Použitá vo `findPrimaryImage()`, `populate()`, `renderStatic()`.
- **`src/pages/AtlasPage.js`** — Detail teraz volá `PrimaryImage.pickPrimary(parasiteImages)` namiesto natvrdo `parasiteImages[0]`; zvolená hlavná fotka sa vyradí zo zoznamu miniatúr pod ňou (`thumbnailImages = parasiteImages.filter(img => img !== mainImage)`), aby sa nezobrazovala 2×.
- **`tools/captions/index.html`** — pri každej fotke buď odznak „★ Hlavná fotka" (aj s poznámkou „(predvolená — najskoršia v poradí)", ak nič nie je explicitne označené — aby bolo vidno aktuálny efektívny stav aj bez zásahu), alebo tlačidlo „☆ Nastaviť ako hlavnú". Klik nastaví `isPrimary:true` na vybranej fotke a **odstráni** (nie `false`, kvôli minimálnemu diffu) toto pole zo všetkých ostatných fotiek toho istého `parasiteId` — vždy platí najviac jedna hlavná fotka na objekt, dá sa kedykoľvek prehodiť na inú.

**Pozor pre ďalšiu session:** `PrimaryImage.js`/`AtlasPage.js` sú jediné dva zdroje potvrdené v tejto session ako "spotrebitelia" obrázka pre jeden objekt — ak by niekde inde v appke (napr. budúci card/list náhľad v Atlase) pribudol ďalší mechanizmus výberu "reprezentatívnej" fotky, treba ho tiež napojiť na `PrimaryImage.pickPrimary()`, inak bude nekonzistentný s tým, čo si autorka nastaví v `tools/captions`.

### ✅ Nová funkcia: nástroj na nájdenie nepoužitých fotiek na disku

Po mazaní záznamov cez `tools/captions/index.html` (§0.21) fyzické súbory na disku ostávajú (nástroj beží v prehliadači, nemôže mazať z disku — rovnaké obmedzenie ako všade v projekte, pravidlo §3.6). Autorka chcela vedieť, ktoré súbory v `public/images/parasites/` už nič nepoužíva.

**Implementácia (`tools/captions/index.html`, nová sekcia „2. Nájsť nepoužité fotky na disku"):**
- `<input type="file" webkitdirectory directory multiple>` — autorka vyberie priečinok (`parasites`, `images` alebo `public`, nástroj hľadá posledný výskyt `"parasites/"` v ceste, takže je jedno, ktorý z nich vyberie).
- Porovná zoznam vybraných súborov s `parasiteId`+súbor odvodeným z `img.url` v načítanom `images.json`.
- **Dôležitá poistka:** súbory `..._full.webp` sa nepočítajú ako nepoužité, pokiaľ je ich "base" (`...webp` bez `_full`) v databáze použité — inak by nástroj falošne nahlásil všetky legitímne zväčšovacie varianty ako nepoužité (presne tie, čo mali podľa §0.21 zostať iba na disku, nie v JSON).
- Bonus: opačný smer — záznam v `images.json`, ku ktorému sa vo vybranom priečinku nenašiel súbor (rozbitý odkaz / neúplný výber priečinka).
- Výstup: zoznam ciest na obrazovke, tlačidlo „Kopírovať zoznam ciest" (do schránky) a tlačidlo „Stiahnuť PowerShell skript na zmazanie" — vygeneruje `.ps1` s `Remove-Item` pre každú cestu (`-Verbose`, `Test-Path` kontrola pred mazaním). **Nič sa nemaže automaticky z prehliadača** — autorka skript stiahne, skontroluje a sama spustí (vysvetlené aj `Unblock-File`/`-ExecutionPolicy Bypass`, keďže Windows blokuje stiahnuté `.ps1` defaultne).

### 🟡 Zadané v tejto správe, čaká na vyriešenie (pozri nižšie „Otvorené úlohy")

Autorka nahlásila v Admin nástroji (`tools/admin/forms/imageForm.js`, tab „3. Fotografie"):
1. Po kliknutí na „Pridať" (pridanie fotky k parazitovi) sa stránka/zoznam vráti navrch — treba sa potom znova rolovať na pôvodné miesto. Žiaduce: zachovať pozíciu scrollovania cez `renderImageTab()`.
2. Chce filter/prepínač „zobraziť len parazitov bez fotografie", aby vedela, kde ešte treba fotky doplniť.

Riešenie týchto dvoch bodov je popísané a odovzdané v tej istej správe, kde vznikla táto sekcia AI_STATUS — pozri commit správu / diff nižšie v tabuľke zmien, prípadne priamo v chate.

### Zhrnutie vykonaných zmien kódu v tejto session

| Súbor | Zmena | Stav |
| --- | --- | --- |
| `src/pages/AtlasPage.js` | `firstImageUrl`/`img.url` v Detaile idú cez `PrimaryImage.resolveImageUrl()` (oprava 404 na GitHub Pages); hlavná fotka sa vyberá cez `PrimaryImage.pickPrimary()`, vyradená z miniatúr | ✅ hotové (kód), ⬜ naživo neoverené |
| `src/components/PrimaryImage.js` | nová `pickPrimary()` (isPrimary → fallback najstarší dateAdded), použitá v `findPrimaryImage()`/`populate()`/`renderStatic()` | ✅ hotové (kód), ⬜ naživo neoverené |
| `tools/captions/index.html` | tlačidlo „Nastaviť ako hlavnú" (`isPrimary`), sekcia „Nájsť nepoužité fotky na disku" (výber priečinka, porovnanie, kopírovanie zoznamu, generovanie `.ps1`) | ✅ hotové (kód), ⬜ naživo neoverené |
| `tools/admin/forms/imageForm.js` | zachovanie scroll pozície v `renderImageTab()` + filter „len bez fotografie" | ✅ hotové (kód) — pozri zvyšok tejto správy, ⬜ naživo neoverené |

### 🟡 Otvorené úlohy z tejto session (pre ďalšiu session)

1. **Naživo overiť všetko vyššie** — žiadna z týchto zmien (§0.21 aj §0.22) ešte nebola potvrdená autorkou naživo v prehliadači/GitHub Pages, iba odovzdaná ako súbory v chate.
2. Konkrétne otestovať Detail parazita na GitHub Pages po nasadení opravy — potvrdiť, že fotky sa už načítavajú (predtým 404).
3. Vyskúšať „Nastaviť ako hlavnú" pri aspoň jednom parazitovi s viacerými fotkami a overiť, že sa v Detaile skutočne zobrazí zvolená fotka (nie prvá v poradí).
4. Vyskúšať nástroj na nepoužité súbory na reálnom `public/images/parasites/` priečinku — najmä overiť, že `_full` súbory k použitým fotkám sa naozaj nehlásia ako nepoužité, a že vygenerovaný `.ps1` skript funguje (autorka používa Windows/PowerShell podľa `tree.txt`).
5. Zvážiť doplnenie `isPrimary` do `docs/02_DATABASE_SPECIFICATION.md` §9 (zatiaľ len v kóde a tu, nie v oficiálnej schéme dokumentácie) — nie je priorita, len poznámka.
6. §0.6 body 1, 2, 5 (viď §0.21, bod 4 otvorených úloh) — stále formálne nezavreté, len vizuálne overené komentármi `FIX #1–#5` v kóde.

---

🔥 0.21 Aktuálny stav — doplnené (2026‑08‑22, session: admin nástroj — sidebar badge zmazania, tab Fotografie nezobrazoval fotky, duplicitné _full záznamy, mazanie v tools/captions)

## ✅ ČO SA VYRIEŠILO V TEJTO SESSII

### Kontext

Nadväzuje na §0.6 (otvorené funkčné chyby v `admin.js` z code reviewu, bod 4 — chybný badge pri mazaní) a §0.15/§0.19 (`tools/captions/index.html`). Autorka nahrala `admin.js`, `admin.css`, `imageForm.js`, `hostForm.js`, `bulkExcel.js`, `diff.js`, `index.html`, `zipExport.js`, neskôr aj `tools/captions/index.html` a výpis z `database/images.json`. Žiadny kód sa v tejto session nezapisoval priamo do repozitára — všetko odovzdané ako súbory na stiahnutie v chate.

### 🔴→✅ Bug 1: Sidebar čakajúcich zmien stále vizuálne nekonzistentný pri mazaní (dokončenie §0.6 bodu 4)

Textový label ("🗑️ Zmazanie") sa v nahratom `admin.js` už zobrazoval správne (`FIX #4` bol implementovaný), zvyšné dve nekonzistencie ale ostali:

- `admin.css` nemala definovanú triedu `.badge-delete` (len `.badge-create`/`.badge-update`) → badge bez farebného odlíšenia.
- `updatePendingUI()` vypisoval `${ch.id || '?'}` — zmeny hostiteľov (`type:'host'`) ale nesú pole `key`, nie `id`, takže sa pri pridaní/zmazaní hostiteľa v sidebari zobrazovalo `🆕 Nový ?` / `🗑️ Zmazanie ?` namiesto mena.

**Oprava:** pridaná `.badge-delete { color:#e74c3c; font-weight:600; }` do `admin.css`; `updatePendingUI()` teraz použije `ch.id || ch.key || '?'`.

### 🔴→✅ Bug 2: Tab "3. Fotografie" nezobrazoval existujúce fotky

`renderImageTab()` v `imageForm.js` čítal fotky výhradne z `p.images` (pole embednuté priamo v zázname parazita v `parasites.json`). Skutočný zdroj fotiek je ale `database/images.json` → `state.images`. Pri `loadData()` sa `p.images` kopírujú DO `state.images` (jednosmerne), nikdy naopak — fotky, ktoré existujú len v `images.json` (bez duplicity v `parasites.json.images`), sa v tabe vôbec nezobrazili, hoci `fetch` prebehol v poriadku (zelený status hore).

**Oprava:** nová funkcia `getImagesForParasite(parasiteId)` zlučuje `state.images` (filtrované podľa `parasiteId`) a `p.images`, deduplikuje podľa URL; použitá aj pre hlavičkové počítadlo, aj pre riadky tabuľky. Popri tom opravené súvisiace nekonzistencie:

- vetva "pridanie cez URL" nerobila rebuild `state.workingCopy` (multi-file vetva áno) — doplnené,
- pridanie fotky (obe vetvy) teraz zapisuje aj do `state.images`, nielen do `p.images`,
- "Vymazať všetky" mazalo `p.images` na `state.parasites`, nie na `state.workingCopy` (ktorý reálne exportuje `zipExport.js`), a vôbec nemazalo zo `state.images` → zmazanie by sa vizuálne prejavilo, ale pri exporte by fotka "ožila" naspäť. Opravené: maže z oboch a rebuilduje `workingCopy`.

### 🔴→✅ Bug 3: Duplicitné fotky v galérii (`_full` varianty ako samostatné záznamy)

Autorka nahlásila, že v galérii vidí tú istú fotku 2×. Porovnaním `dateAdded` v poskytnutom výpise `images.json`: staré fotky (2026‑08‑21) majú vždy jeden záznam na fotku; nové (`alaria_alata_adult`, `dateAdded` `2026‑08‑22T15:16:42.607Z`, zhodný pre každý pár) majú pre každú fotku dva záznamy — napr. `alaria_alata_adult_01.webp` aj `alaria_alata_adult_01_full.webp`. Príčina: hromadný (multi-file) upload v `imageForm.js` vytvorí jeden záznam v `images.json` na každý vybraný súbor bez rozlíšenia, že `_full` varianty sú len sprievodný "zväčšovací" súbor k base fotke — podľa existujúcej konvencie z 21.8. sa `_full` nikdy nezapisoval ako vlastný záznam, frontend si ho dopočítaval podľa názvu.

**Oprava:** nová funkcia `isFullVariantFileName()` (regex `/_full\.[a-z0-9]+$/i`) — pri hromadnom výbere súborov sa `_full` súbory automaticky preskočia (nezapíšu sa ako záznam), toast informuje o počte preskočených a pripomína nakopírovať ich fyzicky na disk (databázový záznam nepotrebujú). Ak by boli vybrané výhradne `_full` súbory bez base páru, zobrazí sa chybová hláška namiesto tichého nepridania ničoho.

**Existujúcich 5 duplicitných záznamov (`alaria_alata_adult_0{1..5}_full.webp`) treba vyčistiť ručne** — pozri Bug 4 nižšie (nový nástroj na mazanie).

### 🔴→✅ Bug 4 (pôvodne bod 2. zo zadania autorky): `tools/captions/index.html` neponúkal mazanie fotiek

Nástroj dovoľoval len úpravu `caption`/`alt`/`credit`, mazanie záznamu bolo treba robiť ručne priamo v súbore. Pridané tlačidlo "🗑 Zmazať fotku" ku každému riadku — po potvrdení (s náhľadom URL a upozornením, že fyzický súbor treba zmazať ručne z disku, vrátane prípadného `_thumb`/`_full` variantu) odstráni záznam z poľa `images`; zmena sa prejaví až po stiahnutí a nahradení `database/images.json` (rovnaký princíp ako doteraz pri úprave popiskov).

### Zhrnutie vykonaných zmien kódu v tejto session

| Súbor | Zmena | Stav |
| --- | --- | --- |
| `tools/admin/admin.css` | pridaná `.badge-delete` | ✅ hotové (kód), ⬜ naživo neoverené |
| `tools/admin/admin.js` | `updatePendingUI()` používa `ch.id \|\| ch.key \|\| '?'` | ✅ hotové (kód), ⬜ naživo neoverené |
| `tools/admin/forms/imageForm.js` | `getImagesForParasite()` zlučuje `state.images`+`p.images`; sync `state.images`/`workingCopy` pri pridaní aj mazaní; `isFullVariantFileName()` preskakuje `_full` súbory pri hromadnom uploade | ✅ hotové (kód), ⬜ naživo neoverené |
| `tools/captions/index.html` | pridané tlačidlo "Zmazať fotku" + `.btn-danger`/`.btn-sm` štýly | ✅ hotové (kód), ⬜ naživo neoverené |

### 🟡 Otvorené úlohy z tejto session (pre ďalšiu session)

1. Naživo overiť všetky 4 opravy v prehliadači (žiadny kód sa ešte nezapisoval do repozitára, len odovzdaný v chate).
2. **Ručne vyčistiť 5 existujúcich duplicitných `_full` záznamov** pre `alaria_alata_adult` v `database/images.json` cez nové tlačidlo "Zmazať fotku" v `tools/captions/index.html`, stiahnuť a nahradiť súbor v repozitári.
3. Skontrolovať, či sa podobná `_full` duplicita nevyskytuje aj pri iných objektoch v `images.json` — v tejto session bol nahraný len čiastočný výpis (nie celý súbor), takže nie je vylúčené, že existujú aj inde.
4. §0.6 body 1 (kontrola duplicity ID voči `pendingChanges`), 2 (`workingCopy` napojený/nie) a 5 (statický `extractUniqueValues`) — v aktuálne nahratom `admin.js` **už vyzerajú opravené** (komentáre `FIX #1`–`FIX #5` priamo v kóde), no nebolo to v tejto session explicitne nezávisle overené/otestované naživo — pri ďalšej príležitosti prejsť a formálne zavrieť v AI_STATUS, ak sa potvrdí funkčnosť.

---

🔥 0.20 Aktuálny stav — doplnené (2026‑08‑22, session: detail parazita — doplnené chýbajúce polia zo schémy + zjednotený vizuál s Morfológiou)

## ✅ ČO SA VYRIEŠILO V TEJTO SESSII

### Kontext

Autorka nahlásila, že detail parazita nezobrazuje všetko, čo sa vyplní v admin formulári — konkrétne spomenula Patológiu, Životný cyklus a zaškrtnutie zoonózy. Nahrané a skontrolované súbory: `AtlasPage.js`, `parasites.json`, `02_DATABASE_SPECIFICATION.md`.

### 🔴→✅ Príčina — polia existovali v dátach, ale `showDetail()` ich nikdy nevykresľoval

`AtlasPage.js` mal detail rozdelený do pomocných blokov (`miniBox`, `quadBox`, `morphologyCard`, `detailField`...), no nikde nevolal `record.pathology`, `record.lifeCycle`, `record.zoonosis`, `record.differentialDiagnosis`, `record.hostNotes` ani `record.synonyms` — hoci v `parasites.json` reálne sú (overené na `alaria_alata_egg`, ktorý má vyplnený dlhý `lifeCycle` text s ručnými zalomeniami riadkov). Nešlo teda o chybu v ukladaní dát z admin formulára, iba v tom, čo sa vypisuje do HTML detailu.

### ✅ Doplnené polia do `showDetail()` (v poradí na stránke)

1. **Synonymá** (`record.synonyms`) — nový riadok kurzívou hneď pod latinským názvom (`synonymsLine()`). Prázdne pole (bežný prípad) sa nezobrazí.
2. **Zoonóza** (`record.zoonosis`) — nový badge pod `.specimen-sub` (`zoonosisBadge()`), zobrazí sa **iba** ak je `zoonosis === true`; pri false/undefined nič (žiadny "nie je zoonóza" text).
3. **Životný cyklus** a **Patológia** (`record.lifeCycle`, `record.pathology`) — cez existujúci `detailField()` helper, za `morphologyCard()`.
4. **Diferenciálna diagnostika** (`record.differentialDiagnosis`) — nová funkcia `diagnosisListField()` (rovnaký vzor ako `detailField`, ale pre pole reťazcov, vypíše odrážkový zoznam).
5. **Poznámky k hostiteľom** (`record.hostNotes`) — nová funkcia `hostNotesField()`, mapa hostiteľ→text sa vypíše ako zoznam `Hostiteľ: text`; kľúče s prázdnou hodnotou sa preskočia.

Všetky nové bloky sa pri prázdnych/chýbajúcich dátach vôbec nevykreslia (rovnaký vzor ako existujúce `miniBox`/`detailField`).

### ✅ Zjednotený vizuál — `Životný cyklus`/`Patológia`/`Poznámka` (+ Diferenciálna diagnostika a Poznámky k hostiteľom) teraz vyzerajú ako Morfológia

Na žiadosť autorky (modré pole s nadpisom, veľkosť fontu, orámovanie — rovnaký formát ako `Morfológia`, zelené fajočky ale **iba** pre Morfológiu): `.detail-field` v `atlas.css` prerobené na rovnaký box ako `.morphology-card-main`/`.morph-main-header`/`.morph-main-content` — orámovaný box, modrý header (`--color-primary`, biely text), padding na obsah (`.detail-field-content`). Zelené fajočky (`.morph-checkmark`) ostávajú definované a použité výhradne v `morphologyCard()`.

Keďže `diagnosisListField()` aj `hostNotesField()` používajú tú istú triedu `.detail-field` (kvôli vizuálnej konzistencii), zmena formátu sa preniesla aj na Diferenciálnu diagnostiku a Poznámky k hostiteľom, nielen na pôvodne spomenuté tri polia — autorka o tom bola informovaná, čaká sa jej potvrdenie/pripomienka.

**Bonusová oprava (súvisiaca):** `record.lifeCycle`/`record.notes` v dátach často obsahujú ručné `\n` zalomenia riadkov — bez CSS úpravy by sa dlhý text zlial do jedného odstavca. Pridané `white-space: pre-line` na `.detail-field-content p`.

### Zhrnutie vykonaných zmien kódu v tejto session

| Súbor | Zmena | Stav |
| --- | --- | --- |
| `src/pages/AtlasPage.js` | doplnené volania `synonymsLine()`, `zoonosisBadge()`, `detailField("Životný cyklus"...)`, `detailField("Patológia"...)`, `diagnosisListField()`, `hostNotesField()` do `showDetail()`; pridané 4 nové pomocné funkcie | ✅ hotové (kód), ⬜ naživo neoverené |
| `src/styles/atlas.css` | `.detail-field` prerobené na orámovaný box s modrým headerom (rovnaký vzor ako Morfológia); pridané `.detail-field h4`, `.detail-field-content` (+ `p`/`ul`/`li`), `.zoonosis-badge`, `.specimen-synonyms` | ✅ hotové (kód), ⬜ naživo neoverené |

### 🟡 Otvorené úlohy z tejto session (pre ďalšiu session)

1. **Naživo overiť v prehliadači**, že sa všetkých 6 nových polí zobrazuje správne pri objektoch, ktoré majú dáta vyplnené (napr. `alaria_alata_egg` pre Životný cyklus), a že sa nevykresľujú (nie prázdny box) pri objektoch, kde dáta chýbajú.
2. Potvrdiť s autorkou, či jej vyhovuje, že Diferenciálna diagnostika a Poznámky k hostiteľom teraz majú rovnaký "modrý box" formát ako Morfológia/Životný cyklus/Patológia/Poznámka (zdieľajú triedu `.detail-field`), alebo ich má mať inak.
3. Overiť vizuálne zalomenie dlhého `lifeCycle` textu (`white-space: pre-line`) na reálnych dátach v prehliadači — najmä dlhý text pri `alaria_alata_egg`.

---

🔥 0.19 Aktuálny stav — doplnené (2026‑08‑22, session: `tools/captions/index.html` — oprava cesty k fotkám + odkaz z hlavného menu)

## ✅ ČO SA VYRIEŠILO V TEJTO SESSII

### Kontext

Nadväzuje na §0.15 (vytvorenie `tools/captions/index.html`, naživo neoverené). Autorka prvýkrát otestovala nástroj naživo: JSON dáta (a teda aj popisky) sa načítali, ale náhľady fotiek nie. Nahrané a skontrolované súbory v tejto session: `tools/captions/index.html`, `App.js`, `Router.js`, `index.html` (koreňový).

### 🔴→✅ Príčina a oprava — `tools/captions/index.html`

`resolveImageUrl()` v nástroji odstraňoval len úvodnú lomku (rovnaká konvencia ako `PrimaryImage.js`/`GalleryPage.js`) — to ale funguje len appke, ktorá beží z koreňa repozitára. `tools/captions/index.html` je vnorený o dva priečinky nižšie, takže cesta `public/images/parasites/...` sa prehliadaču vyhodnotila ako `tools/captions/public/images/parasites/...` → 404. JSON sa načítal normálne, lebo `tryAutoLoad()` už mal explicitne správnu relatívnu cestu (`../../database/images.json`).

**Oprava:** pridaná premenná `imageBasePath` (predvolene `"../../"`), ktorá sa v `tryAutoLoad()` prepíše presne podľa toho, ktorá kandidátna cesta k `images.json` reálne zabrala (`path.replace(/database\/images\.json$/, "")`) — takže prefix pre fotky vždy zodpovedá skutočnému umiestneniu, nielen predpokladu. `resolveImageUrl()` teraz vráti `imageBasePath + cleaned`.

Poznámka: pri manuálnom nahratí súboru cez "Vybrať súbor ručne…" ostáva `imageBasePath` na predvolenej hodnote `"../../"` (FileReader nevie zistiť adresár, z ktorého bola stránka otvorená) — zodpovedá zdokumentovanému umiestneniu nástroja.

### ✅ Pridaný odkaz na nástroj do hlavného menu (koreňový `index.html`)

Vedľa existujúceho odkazu na Admin pridaný rovnaký typ odkazu:
```html
<a class="nav-link" href="tools/captions/index.html" target="_blank">📝 Popisky fotiek</a>
```
Rovnaký vzor ako Admin — `target="_blank"`, relatívna cesta bez úvodnej lomky, mimo hash routingu appky (nie je to route v `Router.js`/`App.js`, tie sa nemenili).

### Zhrnutie vykonaných zmien kódu v tejto session

| Súbor | Zmena | Stav |
| --- | --- | --- |
| `tools/captions/index.html` | pridaná `imageBasePath`, odvodzovaná z úspešnej kandidátnej cesty v `tryAutoLoad()`; `resolveImageUrl()` ju použije ako prefix | ✅ hotové (kód), ⬜ naživo neoverené |
| `index.html` (koreňový) | pridaný nav odkaz „📝 Popisky fotiek" na `tools/captions/index.html` vedľa Admin odkazu | ✅ hotové (kód), ⬜ naživo neoverené |

### 🟡 Otvorené úlohy z tejto session (pre ďalšiu session)

1. **Naživo overiť**, že sa po tejto oprave fotky v `tools/captions/index.html` reálne načítajú (cez auto-load aj cez manuálny výber súboru).
2. Naživo overiť, že nový odkaz „📝 Popisky fotiek" v hlavnom menu funguje a otvára nástroj v novej karte.
3. Bod z §0.15 stále otvorený: umiestniť `tools/captions/index.html` reálne do `tools/captions/` v repozitári (ak sa tak ešte nestalo).

---

🔥 0.18 Aktuálny stav — doplnené (2026‑08‑22, session: oprava „biely priestor okolo fotky" v detaile parazita — `.findings-card`/`.primary-image-*` v `atlas.css`)

## ✅ ČO SA VYRIEŠILO V TEJTO SESSII

### Kontext

Autorka nahlásila (screenshot detailu `Alaria alata`): fotka sa v detaile parazita nezobrazuje na celú plochu bielej karty — okolo mikroskopickej fotky je veľký prázdny biely priestor (hore aj dole). Nahrané a skontrolované súbory: `atlas.css`, `PrimaryImage.js`.

### 🔴→✅ Skutočná príčina — v dvoch krokoch

**1. krok (čiastočná diagnóza):** `atlas.css` neobsahoval **žiadne** pravidlá pre triedy, ktoré generuje `PrimaryImage.js` (`.primary-image-container`, `.primary-image-img`) — obrázok sa preto vykresľoval v prirodzenej pixelovej veľkosti, kým `.findings-card` (obalový kontajner v detaile) sa naťahoval na výšku susedného stĺpca v `.detail-main-split` grid layoute. Pridané pravidlá `width/height: 100%` + `object-fit: contain`.

**2. krok — autorka nahlásila, že sa nič nezmenilo.** Skutočná príčina: `.findings-card` mal iba `min-height: 200px`, nie skutočnú `height`. Percentuálna výška (`height: 100%`) na potomkovi (`.primary-image-container`/`.primary-image-img`) sa podľa CSS špecifikácie **ignoruje**, ak rodič nemá explicitne definovanú (nie len minimálnu) výšku — takže pravidlá z 1. kroku nemali na čo nadviazať.

**Finálna oprava (`atlas.css`, sekcia „7. DETAIL"):**
```css
.findings-card {
    padding: var(--space-md);
    display: flex;
    align-items: center;
    justify-content: center;
    height: 500px;
    min-height: 200px;
    overflow: hidden;
}

.primary-image-container {
    width: 100%;
    height: 100%;
    overflow: hidden;
}

.primary-image-img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: contain;
    border-radius: var(--radius-md);
}
```

### Zhrnutie vykonaných zmien kódu v tejto session

| Súbor | Zmena | Stav |
| --- | --- | --- |
| `src/styles/atlas.css` | `.findings-card` dostal explicitnú `height: 500px` (namiesto len `min-height`) a `overflow: hidden`; pridané chýbajúce pravidlá `.primary-image-container` a `.primary-image-img` (`object-fit: contain`) | ✅ hotové (kód), ⬜ naživo neoverené |

### 🟡 Otvorené úlohy z tejto session (pre ďalšiu session)

1. **Naživo overiť v prehliadači** (ideálne s tvrdým refreshom / vyprázdnenou cache), že sa fotka v detaile teraz naozaj prispôsobuje ploche karty bez veľkého bieleho priestoru.
2. Ak sa aj po tejto oprave nič vizuálne nezmení, je vysoko pravdepodobné, že `AtlasPage.js` odovzdáva `PrimaryImage.render()`/`renderStatic()` iný `containerClass` než `findings-card` (alebo obaľuje komponent inak) — treba vyžiadať a skontrolovať `AtlasPage.js`, než sa robí čokoľvek ďalšie s `atlas.css`.
3. Keďže `.primary-image-container`/`.primary-image-img` sú zdieľané triedy naprieč appkou (generuje ich `PrimaryImage.js`), skontrolovať aj ostatné miesta, kde sa `PrimaryImage` používa (napr. karty v zozname/databáze), či im nová pevná `height: 100%`/`object-fit: contain` logika nezmenila vzhľad neželaným spôsobom — zatiaľ overené len pre `.findings-card` v detaile.
4. Pevná hodnota `height: 500px` na `.findings-card` je zatiaľ odhad podľa screenshotu — ak autorka bude chcieť inú výšku karty s fotkou, treba ju doladiť (prípadne cez media queries pre mobil, kde môže byť 500px príliš veľa — pozri sekciu „12. Mobile doladenie").

---

🔥 0.17 Aktuálny stav — doplnené (2026‑08‑22, session: lightbox v Galérii teraz zobrazuje `_full.webp` verziu namiesto thumbnailu)

## ✅ ČO SA VYRIEŠILO V TEJTO SESSII

### Kontext

Nadväzuje na §0.16 (po doplnení chýbajúceho `<link>` na `gallery.css` sa lightbox už vizuálne zobrazuje ako prekrývajúci panel). Zostávajúci nedostatok: lightbox v `openLightbox()` používal na zväčšenú fotku rovnaké `image.url`, aké sa použije aj pre náhľad v mriežke — teda **thumbnail** (480px), nie plnú (1600px) verziu. `images.json` má v poli `url` uloženú iba thumbnail cestu (`<objectId>_<poradie>.webp`), nie plnú.

### 🔴→✅ Oprava (`GalleryPage.js`)

Pridaná nová metóda `resolveFullImageUrl(url)`, ktorá plnú cestu **odvodí** zo schválenej konvencie pomenovania (Priorita č. 2 v §1: `<objectId>_<poradie>.webp` = thumbnail, `<objectId>_<poradie>_full.webp` = plná/zväčšená verzia) — nahradí príponu `.webp` za `_full.webp` (s ochranou proti zdvojeniu `_full`, ak by už v budúcnosti dáta obsahovali plnú cestu priamo).

`openLightbox()` teraz pre `<img src="...">` v `.gallery-lightbox-image` volá `this.resolveFullImageUrl(image.url)` namiesto `this.resolveImageUrl(image.url)`. Náhľad v mriežke (`renderGrid()`) zostáva bezo zmeny — naďalej `resolveImageUrl(img.url)` (thumbnail).

### Zhrnutie vykonaných zmien kódu v tejto session

| Súbor | Zmena | Stav |
| --- | --- | --- |
| `src/pages/GalleryPage.js` | pridaná `resolveFullImageUrl()`; `openLightbox()` použije `_full.webp` verziu pre zväčšenú fotku | ✅ hotové (kód), ⬜ naživo neoverené |

### 🟡 Otvorené úlohy z tejto session (pre ďalšiu session)

1. **Naživo overiť v prehliadači**, že lightbox skutočne načíta `_full.webp` súbor (a nie 404), pre všetky 3 diagnostické objekty s reálnymi fotkami (`aelurostrongylus_abstrusus_larva`, `alaria_alata_egg`, `toxascaris_leonina_egg`) — teda že kýmkoľvek nahratým `*_full.webp` naozaj existuje párový thumbnail (a naopak) na disku/v `public/images/parasites/<objectId>/`.
2. Zvážiť (nepotvrdené autorkou, nemeniť bez schválenia), či `resolveFullImageUrl()` potrebuje `onerror` fallback späť na thumbnail pre prípad, že by pre niektorú fotku `_full` súbor chýbal — zatiaľ sa spolieha na to, že konvencia (thumbnail + full vždy spolu) je dodržaná pri každom nahratí.

---

🔥 0.16 Aktuálny stav — doplnené (2026‑08‑22, session: potvrdená a opravená skutočná príčina bodov 1–2 z §0.15 — chýbajúci `<link>` na `gallery.css`)

## ✅ ČO SA VYRIEŠILO V TEJTO SESSII

### Kontext

Nadväzuje priamo na §0.15 (podozrenie na CSS cesty pri bodoch 1–2 zo zadania §0.13). Autorka nahrala `index.html`.

### 🔴→✅ Skutočná príčina — NÁJDENÁ (hypotéza z §0.15 bola nesprávna)

Hypotéza o absolútnych cestách na CSS **nebola potvrdená** — všetky `<link>` cesty v `index.html` sú relatívne a v poriadku (`src/styles/atlas.css`, `src/css/variables.css`, `src/css/reset.css`, `src/css/typography.css`, `src/css/layout.css`).

**Skutočná príčina je oveľa jednoduchšia:** `<head>` v `index.html` **vôbec neobsahoval `<link>` na `gallery.css`**. Boli tam linknuté `atlas.css`, `variables.css`, `reset.css`, `typography.css`, `layout.css`, ale nie `gallery.css` — súbor teda nikdy nebol súčasťou stránky, bez ohľadu na to, čo v ňom je. To presne vysvetľuje nahlásený vzorec zo screenshotu:
- Bod 1 (layout) — `.gallery-layout`/`.gallery-grid` (grid, stĺpce, sidebar) sa nikdy neaplikovali → filter aj fotky padli do obyčajného blokového toku na celú šírku.
- Bod 2 (lightbox) — `.gallery-lightbox` (vrátane `position: fixed`, ktoré ho robí prekrývajúcim panelom) sa nikdy neaplikovalo → kliknutie na fotku síce spustilo JS (`lightbox.style.display = "flex"`), ale bez CSS to vizuálne nepôsobilo ako "zväčšenie fotky".
- Bod 3 (JS prepojenie detail → Galéria) fungoval, lebo je to čisto JS/import logika, nezávislá od `<link>` tagov.

**Oprava (`index.html`):** pridaný chýbajúci riadok:
```html
<link rel="stylesheet" href="src/styles/atlas.css">
<link rel="stylesheet" href="src/styles/gallery.css">
```

Žiadny iný súbor sa v tejto session nemenil — `gallery.css` samotný už bol opravený a hotový z §0.14 (max. 2 stĺpce fotiek, `object-fit: contain` v lightboxe), iba sa doteraz nikdy reálne nenačítal.

### Zhrnutie vykonaných zmien kódu v tejto session

| Súbor | Zmena | Stav |
| --- | --- | --- |
| `index.html` | doplnený chýbajúci `<link rel="stylesheet" href="src/styles/gallery.css">` v `<head>` | ✅ hotové |

### 🟡 Otvorené úlohy z tejto session (pre ďalšiu session)

1. **Naživo overiť v prehliadači** (po tejto oprave), že sa body 1 a 2 zo zadania §0.13 teraz reálne prejavujú: filter v ľavom sidebari, fotky v 1–2 stĺpcoch, fotka po kliknutí zväčšená v origináli (bez orezania).
2. Naživo umiestniť a overiť `tools/captions/index.html` z §0.15 (auto-fetch aj manuálne nahratie súboru neboli testované mimo simulácie kódu).
3. Bod 4 zo zadania §0.13 (kontrola mobilu) — stále čaká na autorku.
4. Všeobecné poučenie pre ďalšie session: pri pridávaní nového `*.css` súboru pre novú stránku vždy skontrolovať, že je aj reálne nalinkovaný v `index.html` — v tejto appke `<head>` linkuje CSS súbory ručne (žiadny bundler), takže chýbajúci `<link>` je ľahká a ťažko postrehnuteľná chyba (kód aj markup vyzerajú správne, iba sa CSS nikdy nenačíta).

---

🔥 0.15 Aktuálny stav — doplnené (2026‑08‑22, session: prvá naživo spätná väzba k §0.14 + vytvorený `tools/captions/index.html`)

## ✅ / 🔴 ČO SA ZISTILO V TEJTO SESSII

Autorka po nasadení zmien z §0.14 prvýkrát otestovala appku naživo a poslala screenshot Galérie. Spätná väzba k jednotlivým bodom:

1. 🔴 **NEOPRAVENÉ** — layout je stále rovnaký ako predtým: filter je roztiahnutý na celú šírku stránky (nie v ľavom sidebari) a fotky sú pod ním v jednom stĺpci na celú šírku.
2. 🔴 **NEOPRAVENÉ** — kliknutím na fotku v Galérii sa nič nezväčší (lightbox sa nezobrazuje / neotvorí v origináli).
3. ✅ **funguje korektne** — prepojenie detail parazita → Galéria s filtrom na toho parazita (§0.14 bod 3).
4. ⬜ zatiaľ neskontrolované autorkou (mobil).
5. 🔴 `tools/captions/index.html` z §0.14 **neexistoval** — v §0.14 bol iba navrhnutý slovom v tomto dokumente, nebol reálne vytvorený ako súbor. **Opravené v tejto session (pozri nižšie).**

### 🔴→🟡 Podozrenie na príčinu bodov 1 a 2 (zatiaľ NEPOTVRDENÉ, čaká na `index.html`)

Body 1 a 2 sú výhradne CSS zmeny (`gallery.css`, hotové už v §0.14). Bod 3 je výhradne JS zmena (`App.js`/`GalleryPage.js`/`AtlasPage.js`, tiež §0.14) a funguje. Zo screenshotu je navyše vidno, že sa neaplikuje ani základné `.card` orámovanie (definované v `layout.css`, malo by platiť globálne) — vyzerá to, akoby sa na stránke Galérie nenačítaval takmer žiadny vlastný CSS súbor.

**Pracovná hypotéza:** `index.html` pravdepodobne linkuje CSS súbory absolútnou cestou (začínajúcou `/`). Appka beží na GitHub Pages pod podcestou `/VetPara-Atlas/...` (rovnaký problém, kvôli ktorému má `DatabaseService.js` už dynamický `basePath` pre `database/...` a prečo pravidlo §3.5 vyžaduje relatívne cesty bez úvodnej lomky pre `public/...`). Ak `<link>` na CSS používa absolútnu cestu, na GitHub Pages by to spôsobilo 404 na CSS súboroch, zatiaľ čo relatívne JS `import`y (`main.js` → `App.js` → ...) fungujú ďalej normálne — presne vzorec, ktorý autorka nahlásila (JS OK, CSS OK vôbec neaplikované).

**Ďalší krok (blokované, čaká sa na súbor):** vyžiadaný `index.html` od autorky, aby sa dalo overiť/opraviť. **V tejto session ešte nedodaný — treba dourobiť v ďalšej session ako prvé, predtým než sa čokoľvek ďalšie mení v `gallery.css`/`atlas.css`.**

### ✅ Vytvorený `tools/captions/index.html` (bod 5 zo zadania v §0.13/§0.14)

Samostatná statická HTML stránka, presne podľa návrhu z §0.14 ("najjednoduchšie" riešenie) — beží celá v prehliadači, žiadny backend, žiadny zápis do repozitára (v súlade s pravidlom §3.6):

- **Načítanie:** skúsi automaticky nájsť `database/images.json` cez relatívny `fetch()` (funguje pri spustení cez Live Server/GitHub Pages, ak súbor zostane v `tools/captions/`); ak to zlyhá (napr. otvorené priamo cez `file://`, kde prehliadače `fetch()` na lokálne súbory blokujú), autorka použije tlačidlo "Vybrať súbor ručne…" (`<input type="file">`, číta sa cez `FileReader`, nikam sa needuploaduje).
- **Editácia:** zoznam všetkých fotiek s náhľadom (rovnaké `resolveImageUrl()` pravidlo ako `PrimaryImage.js`/`GalleryPage.js` — odstráni úvodnú lomku), pre každú editovateľné polia `caption` / `alt` / `credit`; textové hľadanie podľa ID objektu/popisu/alt textu; upravené riadky sú vizuálne odlíšené (modré orámovanie) a spočítané v spodnej lište.
- **Export:** tlačidlo "Stiahnuť upravený images.json" vygeneruje JSON v presne rovnakej štruktúre ako originál (žiadne pridané/odobraté polia, iba prepísané `caption`/`alt`/`credit`) a stiahne ho pod pôvodným názvom súboru — autorka ho ručne nahradí v `database/images.json` (rovnaký manuálny krok ako pri nahrávaní fotiek).
- Vlastný CSS priamo v súbore (žiadna závislosť na `atlas.css`/`gallery.css`), farby/písmo zladené s vizuálom appky (`--color-primary`, `--color-secondary` atď. prevzaté z `variables.css`), min. 44px dotykové ciele, `focus-visible` outline.

Overené: extrahovaný `<script>` blok syntax-checknutý cez `node --check` — bez chýb. **NEVYKONANÉ:** naživo overenie v prehliadači (auto-fetch cesty ani manuálne nahratie súboru neboli testované mimo simulácie kódu).

### 🟡 Otvorené úlohy z tejto session (pre ďalšiu session, v poradí priority)

1. **Vyžiadať a skontrolovať `index.html`** — potvrdiť/vyvrátiť hypotézu o absolútnych cestách na CSS, opraviť podľa nálezu. Toto je teraz blokujúci krok pre body 1 a 2 zo zadania v §0.13.
2. Po oprave CSS ciest naživo overiť v prehliadači, že sa filter presunul do ľavého sidebaru, fotky sú v 1–2 stĺpcoch a lightbox zobrazuje fotku v origináli bez orezania.
3. Naživo overiť `tools/captions/index.html` (auto-fetch aj manuálne nahratie súboru), umiestniť ho do repozitára do `tools/captions/`.
4. Bod 4 zo zadania (kontrola mobilu) — čaká na autorku.

### Zhrnutie vykonaných zmien kódu v tejto session

| Súbor | Zmena | Stav |
| --- | --- | --- |
| `tools/captions/index.html` | **nový súbor** — samostatný editor popiskov fotiek (caption/alt/credit) bez potreby VS Code, žiadny backend | ✅ hotové (kód), ⬜ naživo neoverené |
| `gallery.css`, `App.js`, `GalleryPage.js`, `AtlasPage.js` | bezo zmeny v tejto session — čaká sa na `index.html`, aby sa dala potvrdiť/vyvrátiť príčina bodov 1–2 | — bez zmeny |

---

🔥 0.14 Aktuálny stav — doplnené (2026‑08‑22, session: layout Galérie, lightbox v origináli, prepojenie detail parazita → Galéria, kontrola mobilu, návrh zadávania popiskov)

## ✅ ČO SA VYRIEŠILO V TEJTO SESSII

Nadväzuje na §0.13 (nové zadanie, 5 bodov). Nahraté a upravené súbory: `GalleryPage.js`, `AtlasPage.js`, `App.js`, `gallery.css`. `Repository.js`, `HostFilterTree.js`, `Router.js`, `ApplicationState.js`, `PrimaryImage.js`, `DatabaseService.js`, `atlas.css` a základné CSS (`layout.css`, `reset.css`, `typography.css`, `variables.css`) boli tiež nahraté a skontrolované, ale bezo zmeny.

### 1. ✅ Layout Galérie — filter vľavo, fotky max. 2 stĺpce (`gallery.css`)

**Zistenie:** filter už bol v `GalleryPage.js`/`gallery.css` umiestnený v ľavom sidebari rovnako ako v Atlase (`.gallery-layout { grid-template-columns: 280px 1fr }` od 992px) — to už bolo hotové z predošlej session. Skutočný problém bol `.gallery-grid { grid-template-columns: repeat(auto-fill, minmax(260px/280px, 1fr)) }`, ktorý pri širokom pravom paneli (~1080px na desktope) vytváral **3 stĺpce** úzkych kariet namiesto 1–2, čo pôsobilo ako "veľa prázdneho miesta" okolo drobných kariet.

**Oprava:** `.gallery-grid` prepísaný na pevný počet stĺpcov (rovnaká filozofia ako `.grid-results` v Atlase): 1 stĺpec do 480px šírky, **presne 2 stĺpce** od 480px vyššie (vrátane desktopu) — žiadny auto-fill, žiadne 3+ stĺpce. Staré prepisy v `@media (min-width:992px)` a `@media (max-width:700px)` boli odstránené, keďže sú teraz nadbytočné.

### 2. ✅ Fotka v Galérii po kliknutí — originálna veľkosť (`gallery.css`)

**Príčina:** `.gallery-lightbox-image` mala natvrdo `aspect-ratio: 4/3` + `overflow: hidden` → fotka sa reálne **orezávala** na 4:3 box, ak mal originál iný pomer strán (napr. na výšku).

**Oprava:** box sa teraz prispôsobí obsahu (bez vynúteného pomeru strán, bez orezania). Nová trieda `.gallery-lightbox-img` (v `GalleryPage.js` sa už používala, len nemala štýl) nastavuje `max-width:100%; max-height:75vh; object-fit:contain` — fotka sa zobrazí v origináli, zmenší sa iba natoľko, aby sa zmestila na obrazovku (nikdy sa neorezáva ani nedeformuje). Mimochodom doplnená aj chýbajúca `.gallery-thumb-img` (predtým bez akéhokoľvek CSS, teraz `object-fit:cover` pre úhľadné miniatúry v karte).

### 3. ✅ Prepojenie: klik na fotku v detaile parazita → Galéria s filtrom na toho parazita

**Predtým:** klik na miniatúru v detaile (`AtlasPage.showDetail()`) iba prehodil `src` hlavného náhľadu **v rámci tej istej stránky** (`this.parentElement...src = this.src`) — do Galérie sa vôbec neprechádzalo.

**Riešenie (rovnaký vzor ako existujúci `window.showAtlasDetail`):**
- **`App.js`** — pridaný nový globálny helper `window.showGalleryForParasite(objectId)`, ktorý zavolá `Router.navigate("gallery", objectId)`. Route `"gallery"` teraz prijíma `objectId` a posiela ho do `GalleryPage.init(objectId)`.
- **`GalleryPage.js`** — `init(objectId = null)`: ak je `objectId` zadané, nájde príslušný záznam a predvyplní `state.filterObjectId` jeho `latinName` (fallback `id`) ešte pred prvým `renderGrid()`; textový filter v sidebari sa zároveň predvyplní tou istou hodnotou (`#gallery-filter-object`).
- **`AtlasPage.js`** — klik na hlavnú fotku aj ktorúkoľvek miniatúru v detaile parazita teraz volá `window.showGalleryForParasite(id)` namiesto pôvodného lokálneho prehadzovania náhľadu — používateľ sa dostane priamo do Galérie, kde vidí všetky fotky daného parazita pohromade a môže ich otvoriť v origináli (bod 2 vyššie).

Overené simuláciou v Node.js (bez DOM/prehliadača): `filterObjectId` sa správne nastaví z `record.latinName` pri platnom ID, ostáva prázdne pri `objectId = null` aj pri neexistujúcom ID (žiadny pád).

### 4. ✅ Kontrola vhodnosti pre mobil

Skontrolované: `.gallery-layout` sa na mobile/tablete (`<992px`) rovnako ako Atlas skladá do jedného stĺpca (filter hore, fotky dole) — to je zámerne konzistentné so správaním Atlasu (`.database-layout`), ktorý žiadny osobitný "skryť filter" prepínač na mobile nemá. Hierarchický strom hostiteľov je defaultne zbalený (`<details>` bez `open`, kým nie je nič zaškrtnuté) — nezaberá veľa miesta pri prvom zobrazení. Kontrolné body (dotykové ciele checkboxov 44px, zatváracie tlačidlo lightboxu 44×44px) už boli v poriadku z predošlej session.

**Doplnené v tejto session:** nová 2-stĺpcová (namiesto 3-stĺpcovej) mriežka fotiek a `object-fit` na miniatúrach/lightboxe (body 1–2) zároveň zlepšujú aj mobilné/tabletové zobrazenie — predtým sa na užších desktop/tablet šírkach mohli objaviť veľmi úzke karty.

⚠️ **NEVYKONANÉ:** naživo overenie v reálnom prehliadači (mobil aj desktop) — len statická kontrola CSS/JS a simulácia v Node.js.

### 5. 🟡 Návrh riešenia — zadávanie popiskov k fotkám bez VS Code (zatiaľ NEIMPLEMENTOVANÉ)

Appka beží staticky na GitHub Pages bez backendu (pravidlo §3.6) — akýkoľvek nástroj preto nemôže zapisovať priamo do `images.json` v repozitári, iba vygenerovať výstup, ktorý si autorka manuálne skopíruje/nahradí. Navrhované riešenie, ktoré s týmto počíta a nadväzuje na už schválený Admin formulár (Priorita č. 1, `docs/2026-08-19_admin-formular-specifikacia.md`):

- **Najjednoduchšie (odporúčané ako prvý krok):** samostatná statická HTML stránka `tools/captions/index.html` (rovnaký vzor ako plánovaný `tools/admin/index.html`) — autorka do nej vloží/vyberie aktuálny `images.json` (napr. cez `<input type="file">`, číta sa lokálne v prehliadači, nikam sa needuploaduje), pre každú fotku sa zobrazí náhľad + editovateľné polia `caption`/`alt`/`credit`, a tlačidlo "Stiahnuť upravený images.json" vygeneruje nový súbor na stiahnutie — ten potom autorka nahradí v `database/images.json` (rovnaký manuálny krok ako pri fotkách samotných).
- **Dlhodobo:** zjednotiť s pripravovaným Admin formulárom — pri nahrávaní/zázname fotky rovno v tom istom formulári vyplniť aj `caption`, nie ako samostatný nástroj.

**Otvorené pre ďalšiu session:** potvrdiť s autorkou, či chce najprv rýchly samostatný nástroj (`tools/captions`), alebo počkať a spraviť to rovno v rámci Admin formulára (Priorita č. 1) — od toho sa odvíja, čo sa implementuje ďalej.

### Zhrnutie vykonaných zmien kódu v tejto session

| Súbor | Zmena | Stav |
| --- | --- | --- |
| `gallery.css` | `.gallery-grid` prepísaný z auto-fill na pevné 1/2 stĺpce; `.gallery-lightbox-image`/`.gallery-lightbox-img` prerobené z orezávajúceho 4:3 boxu na `object-fit:contain` (originál, bez orezania); doplnená chýbajúca `.gallery-thumb-img` | ✅ hotové |
| `App.js` | nový globálny helper `window.showGalleryForParasite(objectId)`; route `"gallery"` prijíma `objectId` a posiela ho do `GalleryPage.init()` | ✅ hotové |
| `GalleryPage.js` | `init(objectId)` predvyplní textový filter objektu latinským názvom parazita pri prechode z detailu | ✅ hotové |
| `AtlasPage.js` | klik na fotku v detaile parazita presmeruje do Galérie (`window.showGalleryForParasite`) namiesto pôvodného lokálneho prehadzovania náhľadu | ✅ hotové |
| — | Bod 5 (zadávanie popiskov) — iba návrh, zatiaľ neimplementované, čaká na rozhodnutie autorky | 🟡 otvorené |

⚠️ **Dôležité pre ďalšiu session:** rovnako ako v §0.13, žiadny z bodov vyššie nebol naživo overený v prehliadači — iba statickou kontrolou kódu a simuláciou v Node.js.

---

🔥 0.13 Aktuálny stav — doplnené (2026‑08‑22, session: oprava nefunkčného filtra hostiteľa v Galérii + zdieľaná komponenta `HostFilterTree.js`)

## ✅ ČO SA VYRIEŠILO V TEJTO SESSII

### Kontext

Filter hostiteľa v Galérii nefungoval. Predošlý predpoklad v tomto dokumente (§0.2, §2, §3 bod 7) — že ide iba o čakanie na doplnenie `host` hodnôt do `images.json` — **bol nesprávny a je týmto nahradený**. Skutočná príčina je štrukturálna.

### 🔴→✅ Príčina — NÁJDENÁ A OPRAVENÁ

`images.json` v novom formáte **nikdy nemalo pole `host`** — záznam fotky obsahuje len `parasiteId/url/alt/caption/credit/dateAdded`. Informáciu o hostiteľovi nesie samotný parazit (`hostGroups`/`hosts` v `parasites.json`), nie fotka. Pôvodný filter v Galérii preto porovnával pole, ktoré v dátach neexistuje.

**Oprava:**
- **Nový zdieľaný súbor `src/components/HostFilterTree.js`** — obsahuje presne tú istú rekurzívnu logiku viacúrovňového rozbaľovacieho stromu, akú mal doteraz iba `AtlasPage.js` (accordiony, hromadný výber celej kategórie, indeterminate stav). Čisto funkčný modul (render + bind cez callback), znovupoužiteľný z ktorejkoľvek stránky.
- **`AtlasPage.js`** — pôvodná stromová logika (`buildHostChildrenMap`, `getHostHierarchyRoots`, `renderHostNode`, `bindHostGroupSelectors`, `updateHostGroupSelectStates`) odstránená a nahradená delegovaním na `HostFilterTree.js`. Výstupný markup aj správanie zostávajú 1:1 identické.
- **`GalleryPage.js`** — filter hostiteľa prerobený z textového inputu na rovnaký accordion strom ako v Atlase:
  - `state.filterHost` (string) → `state.filterHosts` (pole vybraných hostiteľov)
  - pridané `loadHostHierarchy()` (rovnaký bezpečný fetch vzor ako v Atlase)
  - `getFilteredImages()` teraz nájde záznam parazita cez `img.parasiteId` a porovná `Repository.resolveHosts(record)` voči vybraným hostiteľom — **toto je skutočná oprava**
  - filter umiestnený v ľavom sidebari, presne tam kde bol pôvodný textový filter
- **`gallery.css`** — pridané len ID-scoped rozloženie `#gallery-filter-host`; vizuálne štýly accordionu (`.host-accordion`, `.checkbox-group`...) sa preberajú z `atlas.css`, keďže sú globálne a neprefixované — netreba ich duplikovať.

### Overenie

Skontrolované `Repository.js` proti predpokladom a spustená end-to-end simulácia s reálnym `Repository.js` + `HostFilterTree.js`:
- `Repository.getAll()`, `Repository.loadHostHierarchy()`, `Repository.resolveHosts(record)` majú presne také signatúry a správanie, aké boli predpokladané.
- `resolveHosts()` číta internú kópiu `this.hostHierarchy`, naplnenú výhradne cez `Repository.loadHostHierarchy()` — v `GalleryPage.init()` sa táto metóda volá (`await Repository.loadHostHierarchy();`) pred akýmkoľvek pokusom o rozbaľovanie hostiteľov, poradie volaní je správne.
- Simulácia (syntetické dáta, nezmenený reálny `Repository.js`): `resolveHosts(p1, hostGroups:["Plazy"])` → `['Jašterica','Gekon','Jaštery','Korytnačka']`; `resolveHosts(p2, hosts:["Pes"])` → `['Pes']`. Filter so zvoleným hostiteľom "Jašterica" (list vnorený pod Plazy → Jaštery) správne vrátil iba fotku p1 — filter teraz funguje aj pre záznamy priradené len cez skupinu, nielen cez explicitné `hosts`.
- Vedľajší postreh (nie regresia): v testovacom `host_hierarchy.json` kľúč `"Pes": null` spôsobí, že sa "Pes" zobrazí ako vlastný jednopoložkový accordion namiesto medzi samostatnými hostiteľmi — rovnaké správanie ako v pôvodnom `AtlasPage.js` (algoritmus je 1:1 prevzatý); v reálnych dátach sa netýka, keďže samostatní hostitelia sa v `host_hierarchy.json` ako kľúče nevyskytujú.

**Záver:** `HostFilterTree.js`, upravený `AtlasPage.js` a `GalleryPage.js` sú plne kompatibilné s reálnym `Repository.js` bez akýchkoľvek úprav.

⚠️ **NEVYKONANÉ (dôležité pre ďalšiu session):** žiadne naživo overenie v prehliadači (Live Server/GitHub Pages) — iba simulácia v Node.js.

### Zhrnutie vykonaných zmien kódu v tejto session

| Súbor | Zmena | Stav |
| --- | --- | --- |
| `src/components/HostFilterTree.js` | **nový súbor** — zdieľaná rekurzívna logika viacúrovňového filtra hostiteľa (accordiony, hromadný výber, indeterminate) | ✅ hotové |
| `src/pages/AtlasPage.js` | pôvodná stromová logika nahradená delegovaním na `HostFilterTree.js`; markup/správanie nezmenené | ✅ hotové |
| `src/pages/GalleryPage.js` | filter hostiteľa prerobený z textového inputu na accordion strom (`state.filterHosts`, `loadHostHierarchy()`, filtrovanie cez `parasiteId` → `Repository.resolveHosts()`) | ✅ hotové |
| `gallery.css` | pridané ID-scoped rozloženie `#gallery-filter-host`, vizuálne štýly zdieľané z `atlas.css` | ✅ hotové |

### ⚠️ Dôležitá zmena oproti predošlému stavu dokumentu

Poznámky nižšie v tomto dokumente (§0.2 "filter hostiteľa v Galérii momentálne nemá viditeľný efekt... vyrieši sa prirodzene s dopĺňaním `host` hodnôt", §2 riadok o `GalleryPage.js`, §3 bod 7 "Filter hostiteľa v Galérii NIE JE bug — je to funkcia čakajúca na dáta") **sú zastarané**. Skutočná príčina bola štrukturálna (chýbajúce pole `host` v novom formáte `images.json`, treba čerpať z `parasites.json` cez `parasiteId`), nie chýbajúce dáta. Ponechané v dokumente pre históriu, ale ďalší AI by sa nimi nemal riadiť.

### 🟡 Nové zadanie od autorky (pre ďalšiu session)

1. **Layout Galérie** — fotky momentálne nie sú v prehliadači pod filtrom, je tam veľa zbytočného miesta. Filter dať na ľavú stranu (rovnako ako v Atlase) a fotky napravo do 1–2 stĺpcov.
2. **Zväčšenie fotky** — po kliknutí na fotku v Galérii zobraziť ju v originálnej veľkosti (lightbox/modal).
3. **Prepojenie detail parazita → Galéria** — po kliknutí na fotku v detaile parazita prejsť do Galérie s filtrom nastaveným na daného parazita, tak aby boli vidieť aj ostatné jeho fotky.
4. **Mobilné zobrazenie** — skontrolovať vhodnosť zobrazenia Galérie (vrátane nového filtra a layoutu) pre mobil, prípadne upraviť.
5. **Zadávanie popisov k fotkám** — vymyslieť spôsob, ako zadávať popisky fotografií bez nutnosti upravovať `images.json` priamo cez VS Code (súvisí s pripravovaným admin formulárom, Priorita č. 1 nižšie).

---

🔥 0.12 Aktuálny stav — doplnené (2026‑08‑22, session: zobrazenie hostiteľov v detaile parazita a v karte zoznamu skrátené na najvyššiu priradenú kategóriu v `AtlasPage.js`)

## ✅ ČO SA VYRIEŠILO V TEJTO SESSII (2026-08-22, pokračovanie po §0.11)

### Kontext

Autorka poslala screenshot detailu parazita "Giardia intestinalis" — pole "HOSTITEĽ" vypisovalo cez 25 konkrétnych druhov plazov (Varan, Gekon, Jašterice, Agamy...) namiesto jednoducho "Plazy", čím zbytočne naťahovalo náhľad (rovnaký problém sa týkal aj karty záznamu v zozname výsledkov Atlasu). Požiadavka: ak je parazit priradený k celej kategórii (napr. "Plazy" cez `hostGroups`), stačí zobraziť názov kategórie; konkrétny druh sa má vypísať iba vtedy, ak sa parazit týka len jeho.

V priebehu session bol nahraný a priamo skontrolovaný `src/services/Repository.js` (predtým nebol k dispozícii) — potvrdil presnú štruktúru dát.

### 🔴→✅ Príčina — NÁJDENÁ A OPRAVENÁ

**Príčina:** `record.hostGroups` (napr. `["Plazy"]`) sa na zobrazenie posielal cez `Repository.resolveHosts(record)`, ktorá ho **zámerne rozbaľuje** na všetky konkrétne druhy z `dictionary/host_hierarchy.json` (potrebné pre filtrovanie a fulltext, pozri §0.9/`Repository.isHostInGroup()`). Presne tá istá rozbalená hodnota sa ale používala aj priamo na vykreslenie poľa "Hostiteľ" — v detaile (`miniBox("Hostiteľ", ...)`) aj v karte záznamu (`<strong>Hostiteľ:</strong> ...`).

**Oprava (`src/pages/AtlasPage.js`):** pridaná nová metóda `getDisplayHosts(record)`, ktorá na rozdiel od `Repository.resolveHosts()` **nerozbaľuje** `hostGroups` — vráti presne `record.hostGroups` (názvy kategórií tak, ako sú v dátach) zjednotené s `record.hosts` (konkrétni hostitelia mimo skupinovej logiky):

```js
getDisplayHosts(record) {
    const groups = Array.isArray(record?.hostGroups) ? record.hostGroups : [];
    const explicitHosts = Array.isArray(record?.hosts) ? record.hosts : [];
    return [...new Set([...groups, ...explicitHosts])];
}
```

Použitá na 2 miestach, kde sa nahradilo `this.formatHosts(Repository.resolveHosts(record))` za `this.formatHosts(this.getDisplayHosts(record))`:
- detail parazita — `miniBox("Hostiteľ", ...)`
- karta záznamu v zozname — riadok `<strong>Hostiteľ:</strong> ...`

**Zámerne NEZMENENÉ (`Repository.resolveHosts(record)` ponechané bezo zmeny na 3 miestach):**
- `getHostValues()` — zoznam hodnôt pre checkboxy vo filtri (musí poznať konkrétne druhy, aby sa dali jednotlivo vyklikávať)
- fulltext vyhľadávanie (`haystackParts`) — aby sa "Giardia intestinalis" našla aj pri zadaní "Gekon", nielen "Plazy"
- samotná filtrovacia OR-logika (`matchesHost`) — porovnáva zaškrtnuté hodnoty voči rozbalenému zoznamu

Overené v Node.js na 5 scenároch (skupina samotná, konkrétny druh samotný, kombinácia skupina+druh, viacero skupín, žiadny hostiteľ) — výstup zodpovedá očakávaniu, napr. `hostGroups: ["Plazy"], hosts: []` → zobrazí sa **"Plazy"** (namiesto 28 vymenovaných druhov).

### Zhrnutie vykonaných zmien kódu v tejto session

| Súbor | Zmena | Stav |
| --- | --- | --- |
| `src/pages/AtlasPage.js` | nová metóda `getDisplayHosts(record)` — vráti `hostGroups` + `hosts` bez rozbaľovania cez `host_hierarchy.json` | ✅ hotové |
| `src/pages/AtlasPage.js` | detail parazita (`miniBox("Hostiteľ", ...)`) prepnutý z `Repository.resolveHosts(record)` na `this.getDisplayHosts(record)` | ✅ hotové |
| `src/pages/AtlasPage.js` | karta záznamu v zozname (`<strong>Hostiteľ:</strong>`) prepnutá rovnako | ✅ hotové |
| `src/services/Repository.js` | bezo zmeny — iba nahraný a skontrolovaný kvôli overeniu presnej štruktúry `hosts`/`hostGroups`/`resolveHosts()` | — bez zmeny |

**Testovanie vykonané:** syntax-check cez Node.js, diff oproti predošlej verzii (zmena izolovaná na 3 miesta), simulácia `getDisplayHosts()` nad 5 testovacími záznamami priamo v Node.js.

**NEVYKONANÉ (dôležité pre ďalšiu session):** **žiadne naživo overenie v prehliadači** — nepozreté, ako presne vyzerá detail "Giardia intestinalis" po tejto oprave reálne v appke (Live Server/GitHub Pages), ani ako to pôsobí vizuálne v karte záznamu pri parazitoch s viacerými kombinovanými skupinami naraz (napr. `hostGroups: ["Plazy", "Vtáky"]`).

### 🟡 Otvorené úlohy z tejto session (pre ďalšiu session)

1. **Overiť naživo v prehliadači**, že sa "Giardia intestinalis" a ďalšie parazity priradené k celým kategóriám teraz zobrazujú skrátene (napr. "Plazy" namiesto všetkých druhov) — v detaile aj v karte zoznamu.
2. Zvážiť, či by autorka chcela rovnaké skrátené zobrazenie kategórie aj v Galérii (`GalleryPage.js`) — nebolo súčasťou tejto session, `GalleryPage.js` nebol v tejto session nahraný ani kontrolovaný.
3. Ostatné otvorené body z §0.11, §0.10 a §0.9 (naživo-overenie filtra hostiteľov, fotografie, `manifest.json`, `docs/03_DATA_ENTRY_STANDARD.md`, admin formulár, chýbajúca stránka Expert) zostávajú nezmenené a neriešené v tejto session.

---

🔥 0.11 Aktuálny stav — doplnené (2026‑08‑22, session: viacúrovňové rozbaľovanie filtra hostiteľov + hromadný výber celej kategórie v `AtlasPage.js`/`atlas.css`)

## ✅ ČO SA VYRIEŠILO V TEJTO SESSII (2026-08-22)

### Kontext

Autorka nahlásila, že filter "Hostiteľ" v Atlase (zavedený v §0.9 ako hierarchické zoskupovanie) je aj tak veľmi dlhý — top-level accordion (napr. "Plazy (28)") sa síce dal rozbaliť/zbaliť ako celok, ale VŠETKY medziľahlé úrovne (Jaštery, Chameleóny, Korytnačky, Suchozemské korytnačky, Hady...) sa vykresľovali naplocho vnútri neho, bez vlastného rozbaľovania. V priebehu session boli nahraté a priamo skontrolované: `AtlasPage.js`, `dictionary/host_hierarchy.json`, následne aj `atlas.css`.

### 🔴→✅ Vec č. 1: iba najvyššia úroveň bola rozbaľovacia — OPRAVENÉ (viacúrovňové vnáranie)

**Príčina:** pôvodná `renderHostFilterSection()` (§0.9) počítala pre každého hostiteľa iba `getTopLevelGroup()` — prešla stromom `host_hierarchy.json` až po koreň a všetky medziľahlé úrovne zbalila do jedného plochého `checkbox-group` pod jediným `<details>`.

**Oprava:** `renderHostFilterSection()` prepísaná na skutočný rekurzívny prechod celého stromu:
- `buildHostChildrenMap()` — invertuje `host_hierarchy.json` (formát `{dieťa: rodič}`) na mapu `rodič → [deti]`.
- `getHostHierarchyRoots()` — nájde korene stromu (uzly bez rodiča, napr. "Plazy", "Mäsožravce", "Ťavy, lamy"...).
- `renderHostNode(node, childrenMap, hostsInUse)` — rekurzívne vykreslí KAŽDÚ úroveň (nielen koreň) ako samostatný `<details class="host-accordion">`, ktorý sa dá rozbaľovať/zbaľovať nezávisle. Vracia aj zoznam `matched` (skutočne použité hodnoty `host` pod danou vetvou) kvôli počítadlu `(N)` pri názve a kvôli veci č. 2 nižšie.
- Ak je samotný názov skupiny (napr. "Jaštery") priamo použitý ako hodnota `host` pri nejakom zázname (bez konkrétneho druhu), zobrazí sa navyše ako checkbox `"Jaštery (všeobecne)"` v hornej časti obsahu danej skupiny.
- Hostitelia úplne mimo `host_hierarchy.json` (nemajú predka ani potomkov) zostávajú ako predtým — samostatné položky mimo accordionov (`standalone-group`).
- Overené simuláciou v Node.js nad reálnym `host_hierarchy.json` (bez prehliadača): pre testovaciu množinu hostiteľov sa správne vygenerovalo `Plazy (28)` → `Jaštery (18)` → vnorené `Chameleóny (9)`, `Korytnačky (7)` → vnorené `Suchozemské korytnačky (5)`, `Hady (3)` — presne požadovaná viacúrovňová štruktúra.

### 🔴→✅ Vec č. 2: výber celej kategórie jedným klikom — DOPLNENÉ

Autorka následne požiadala o možnosť odfiltrovať celú kategóriu (napr. "Mäsožravce") bez ručného vyklikávania všetkých potomkov.

**Riešenie:** do hlavičky (`<summary>`) každej skupiny/podskupiny pribudol samostatný checkbox `"vybrať skupinu"`:
- Zaškrtnutím sa naraz zaškrtnú/odškrtnú VŠETCI hostitelia v danej vetve vrátane vnorených podskupín (zoznam nesie atribút `data-hosts` s presnými hodnotami z `matched`).
- Klik naň nemá otvoriť/zavrieť `<details>` (`onclick="event.stopPropagation()"` priamo v markupe) — rozbaľovanie/zbaľovanie naďalej vyvolá iba klik na text/šípku.
- Ak je zaškrtnutá len časť potomkov, checkbox skupiny sa zobrazí ako čiastočne zaškrtnutý (`indeterminate`) — nastavuje sa dynamicky cez JS, keďže HTML `indeterminate` atribút neexistuje.
- Zmena sa prejavuje aj smerom nahor: zaškrtnutie celej "Jaštery" spôsobí prepočet stavu nadradených "Plazy" (plne/čiastočne/vôbec).
- Nové funkcie `bindHostGroupSelectors()` a `updateHostGroupSelectStates(fieldset)` v `AtlasPage.js`, volané z `init()` aj z `refreshHostFilterSection()` (po doletení `host_hierarchy.json`).
- **Dôležitá súvisiaca oprava:** `bindCheckboxFilter(field)` predtým selektoval `input[type=checkbox]` bez ohľadu na `data-field` — po pridaní `.host-group-select` checkboxov (ktoré zámerne NEMAJÚ `data-field`) by sa inak dostali do `state.host` ako neplatná hodnota `"on"`. Selektor zúžený na `input[type="checkbox"][data-field="${field}"]`.

### Zhrnutie vykonaných zmien kódu v tejto session

| Súbor | Zmena | Stav |
| --- | --- | --- |
| `src/pages/AtlasPage.js` | `renderHostFilterSection()` prepísaná na rekurzívny strom (`buildHostChildrenMap`, `getHostHierarchyRoots`, `renderHostNode`) namiesto plochého zoskupovania cez `getTopLevelGroup()` | ✅ hotové |
| `src/pages/AtlasPage.js` | pridaný checkbox "vybrať skupinu" do `<summary>` každej úrovne (`data-hosts`, `onclick="event.stopPropagation()"`) | ✅ hotové |
| `src/pages/AtlasPage.js` | nové funkcie `bindHostGroupSelectors()`, `updateHostGroupSelectStates()`; napojené v `init()` a `refreshHostFilterSection()` | ✅ hotové |
| `src/pages/AtlasPage.js` | `bindCheckboxFilter()` — selektor zúžený na `[data-field="${field}"]`, aby sa doň nedostali nové skupinové checkboxy | ✅ hotové |
| `atlas.css` | `.host-accordion-summary` upravený layout (checkbox + `.accordion-title-wrap` namiesto priameho `justify-content: space-between` na dvoch spans) | ✅ hotové |
| `atlas.css` | nové pravidlá `.host-group-select-label`, `.accordion-title-wrap`, `.accordion-content.host-subgroups` (odsadenie vnorených úrovní), `.host-subgroups .host-accordion` (ľavý okraj) | ✅ hotové |
| `getTopLevelGroup(hostName)` | ponechaná v kóde bez zmeny, ale už sa nikde nepoužíva (nahradená stromovým prechodom) — neškodné, možno neskôr odstrániť | ⬜ voliteľný cleanup |

**Testovanie vykonané:** syntax-check cez Node.js (`new Function(...)` nad celým súborom bez importov), diff oproti pôvodným súborom (zmeny izolované len na dotknuté sekcie), simulovaný render `renderHostFilterSection()` nad reálnym `host_hierarchy.json` s overením `data-hosts` atribútov pre vnorené skupiny (Jaštery vs. Plazy).

**NEVYKONANÉ (dôležité pre ďalšiu session):** **žiadne naživo overenie v prehliadači** (ani Live Server, ani GitHub Pages) — všetko overené iba simulačne v Node.js mimo DOM. Treba potvrdiť, že:
1. Vnorené `<details>` sa v reálnom prehliadači rozbaľujú/zbaľujú nezávisle a `open` atribút sa správne prejavuje pri už zaškrtnutých hostiteľoch po znovunačítaní stránky.
2. Checkbox "vybrať skupinu" reálne nespôsobuje otvorenie/zatvorenie `<details>` vo všetkých bežných prehliadačoch (test `stopPropagation` cez `onclick` atribút v stringovom markupe, nie cez `addEventListener` — malo by fungovať, ale nebolo overené naživo).
3. `CSS.escape()` použité v selektoroch (`updateHostGroupSelectStates`, `bindHostGroupSelectors`) — dostupné vo všetkých moderných prehliadačoch, ale neoverené v cieľovom prostredí autorky.
4. Vizuálne odsadenie vnorených skupín (`.host-subgroups`) v skutočnom layoute sidebaru — CSS premenné (`--space-lg`, `--color-secondary` a pod.) neboli overované vizuálne, len skontrolované, že v `atlas.css` existujú a používajú sa konzistentne s okolitým kódom.

### 🟡 Otvorené úlohy z tejto session (pre ďalšiu session)

1. **Overiť naživo v prehliadači** (Live Server aj GitHub Pages) celý filter hostiteľov — vnorenie, otváranie/zatváranie, hromadný výber, indeterminate stav, aj v kombinácii s existujúcim vyhľadávaním a ostatnými filtrami.
2. Zvážiť odstránenie nepoužívanej `getTopLevelGroup()` (nahradená stromovým riešením, ale ponechaná bez zmeny kvôli minimalizácii rozsahu úprav v tejto session).
3. Ostatné otvorené body z §0.10 a §0.9 (naživo-overenie fotografií, `manifest.json`, `docs/03_DATA_ENTRY_STANDARD.md`, admin formulár, chýbajúca stránka Expert) zostávajú nezmenené a neriešené v tejto session.

---

🔥 0.10 Aktuálny stav — doplnené (2026‑08‑21, session: oprava zobrazovania fotografií — absolútne cesty v `images.json` + `PrimaryImage.js` nekompatibilný so `parasiteId`/`url` formátom)

## ✅ ČO SA VYRIEŠILO V TEJTO SESSII (2026-08-21, pokračovanie po §0.9)

### Kontext

Po oprave `basePath` z §0.9 (nahratá a funkčná — `parasites.json` aj `host_hierarchy.json` sa na GitHub Pages načítavajú správne, `Repository ready: 475 records`) autorka nahlásila nové 404 chyby, tentoraz na obrázky (`.webp` súbory). Skontrolované a opravené: `GalleryPage.js`, `PrimaryImage.js`, `index.html` (len na overenie — bez zmeny).

### 🔴→✅ Príčina 404 na obrázky — NÁJDENÁ A OPRAVENÁ

**Príčina:** Pole `url` v `database/images.json` obsahuje cestu s úvodnou lomkou, napr. `/public/images/parasites/.../subor.webp`. Úvodná `/` robí z cesty **absolútnu cestu od koreňa domény**, nie relatívnu k aktuálnej stránke.

- Na **GitHub Pages** appka beží v podadresári `https://valentovadaniela-web.github.io/VetPara-Atlas/`, takže `/public/images/...` sa vyhodnotí ako `https://valentovadaniela-web.github.io/public/images/...` — bez `VetPara-Atlas` v ceste → 404.
- Lokálne cez **Live Server** appka beží v koreni servera, takže `/public/...` od koreňa vyzerá byť správne — preto sa problém lokálne neprejavil.

V `index.html` sa žiadny `<base>` tag nenachádza (overené) — problém je čisto v tom, že sa `img.url` / `image.url` používalo priamo ako `src` bez normalizácie.

**Oprava (vykonaná, odovzdaná autorke, aplikovaná v oboch súboroch):** pridaná pomocná metóda, ktorá odstráni úvodnú lomku/lomky, a jej použitie všade, kde sa hodnota `url` reálne posiela do `src="..."`:

```js
resolveImageUrl(url) {
  if (!url) return "";
  return url.replace(/^\/+/, "");
},
```

- `src/pages/GalleryPage.js` — pridaná metóda `resolveImageUrl`, použitá v `renderGrid()` (`<img src="${this.resolveImageUrl(img.url)}">`) a v `openLightbox()` (`<img src="${this.resolveImageUrl(image.url)}">`).
  - **Zámerne NEZMENENÉ:** `data-image-url="${this.escapeHtml(img.url)}"` a `this.state.images.find((img) => img.url === url)` — obe zostávajú na pôvodnej (nenormalizovanej) hodnote `url`, keďže slúžia len na párovanie kliknutého elementu s objektom v `state.images`, nie na reálne vykreslenie `src`. Normalizácia sa aplikuje výhradne pri vykresľovaní `src`.
- `src/components/PrimaryImage.js` — rovnaká metóda `resolveImageUrl` pridaná vedľa `escapeHtml`, použitá v `populate()` a `renderStatic()`.

**Stav: hotové, aplikované v oboch súboroch, čaká na finálne otestovanie autorkou naživo (GitHub Pages aj Live Server).**

### 🔴→✅ `PrimaryImage.js` bol celý nekompatibilný so súčasným formátom `images.json` — OPRAVENÉ

Nezávisle od problému s cestami sa zistilo, že `PrimaryImage.js` **nebol nikdy prepísaný** na aktuálny formát `images.json` (na rozdiel od toho, čo tvrdilo predchádzajúce zhrnutie v §0.9 — tam bol `PrimaryImage.js` označený ako "žiadna zmena potrebná", čo bolo nesprávne, keďže sa vtedy neoveroval priamo tento súbor). Používal výhradne staré názvy polí, ktoré v reálnych dátach už neexistujú:

| Používané v kóde (staré, nefunkčné) | Skutočný formát `images.json` |
| --- | --- |
| `img.objectId` | `img.parasiteId` |
| `img.isPrimary` | — pole neexistuje |
| `img.sortOrder` | — pole neexistuje |
| `img.filename` (+ natvrdo `public/images/${filename}`) | `img.url` (hotová relatívna cesta) |

**Dôsledok pred opravou:** `findPrimaryImage()`, `populate()` aj `renderStatic()` filtrovali podľa `img.objectId === record.id` — keďže `objectId` v dátach vôbec nie je, filter vždy vrátil prázdne pole → **hlavná fotografia sa nezobrazovala nikde v appke**, nezávisle od problému s cestami vyššie.

**Oprava (vykonaná vo všetkých 3 miestach v `PrimaryImage.js`):**
```diff
    const candidates = images
-     .filter((img) => img.objectId === record.id)
-     .sort((a, b) => {
-       if (a.isPrimary && !b.isPrimary) return -1;
-       if (!a.isPrimary && b.isPrimary) return 1;
-       return (a.sortOrder || 0) - (b.sortOrder || 0);
-     });
+     .filter((img) => img.parasiteId === record.id)
+     .sort((a, b) => (a.dateAdded || "").localeCompare(b.dateAdded || ""));
```
(analogicky v `findPrimaryImage()` a `populate()`, plus `src="public/images/${image.filename}"` → `src="${this.resolveImageUrl(image.url)}"`)

Keďže nový formát `images.json` neobsahuje `isPrimary`/`sortOrder`, ako náhrada za "hlavnú" fotografiu sa použije zoradenie podľa `dateAdded` (najstaršia nahratá fotka = prvá/hlavná). **Ak by autorka v budúcnosti chcela explicitné určenie hlavnej fotky, treba pole `isPrimary` (alebo ekvivalent) doplniť späť do schémy `images.json` a admin formulára — momentálne to nie je implementované ani požadované.**

**Stav: hotové, aplikované, čaká na otestovanie naživo.**

### Zhrnutie vykonaných zmien kódu v tejto session

| Súbor | Zmena | Stav |
| --- | --- | --- |
| `src/pages/GalleryPage.js` | pridaná `resolveImageUrl()`, použitá v `renderGrid()` a `openLightbox()` pri `<img src>` | ✅ hotové |
| `src/components/PrimaryImage.js` | pridaná `resolveImageUrl()`; `objectId`/`isPrimary`/`sortOrder`/`filename` → `parasiteId`/`dateAdded`-sort/`url` vo `findPrimaryImage()`, `populate()`, `renderStatic()` | ✅ hotové |
| `index.html` | skontrolovaný (žiadny `<base>` tag, žiadna zmena potrebná) | — bez zmeny |

### 🟡 Otvorené úlohy z tejto session (pre ďalšiu session)

1. **Overiť naživo v prehliadači** (GitHub Pages aj Live Server), že sa fotografie v Galérii a hlavné fotografie na Atlase reálne zobrazujú po tejto oprave — session skončila pred týmto krokom.
2. ⚠️ **Dôležité pre ďalšie AI:** predchádzajúce zhrnutie (§0.9) mylne označilo `PrimaryImage.js` ako plne kompatibilný s novým formátom bez toho, aby bol súbor v tej session priamo skontrolovaný. Ukazuje sa, že **"overené priamou kontrolou kódu" v predchádzajúcich zápisoch treba brať s rezervou, ak sa netýkalo súboru, ktorý sa reálne otváral v danej session** — vždy si radšej vyžiadaj aktuálny obsah súboru nanovo, aj keď staršia session tvrdí, že je hotový.
3. Zvážiť, či doplniť explicitné `isPrimary`/poradie fotiek do formátu `images.json` (momentálne nahradené triedením podľa `dateAdded`) — nie je to priorita, len poznámka pre budúcu session.
4. Ostatné otvorené body z §0.9 (pole `host` v Galérii, `manifest.json`, `docs/03_DATA_ENTRY_STANDARD.md`, chyby v `admin.js`) zostávajú nezmenené a neriešené v tejto session — pozri §0.9 nižšie.

---

🔥 0.9 Aktuálny stav — doplnené (2026‑08‑21, session: oprava GitHub Pages 404 + zosúladenie `images.json` formátu s admin formulárom)

## ✅ ČO SA VYRIEŠILO V TEJTO SESSII (2026-08-21)

### Kontext

Autorka nahlásila, že appka funguje lokálne cez VS Code Live Server, ale na GitHub Pages sa nezobrazuje správne (404 na `database/parasites.json` a `database/dictionary/host_hierarchy.json`, syntax error na `manifest.json`). V priebehu session boli nahraté a priamo skontrolované: `DatabaseService.js`, `Repository.js`, `index.html`, `manifest.json`, následne aj `AtlasPage.js`, `GalleryPage.js`, `tools/admin/forms/imageForm.js`, `tools/admin/zipExport.js` a reálny `database/images.json`.

### 🔴→✅ Príčina 404 na GitHub Pages — NÁJDENÁ A OPRAVENÁ

**Príčina:** `DatabaseService.js` mal v `load()` natvrdo zapísaný basePath pre GitHub Pages ako `/VetParaAtlas/database/` (bez spojovníka), ale skutočný názov repozitára je **`VetPara-Atlas`** (so spojovníkom) — `https://github.com/valentovadaniela-web/VetPara-Atlas`. Prehliadač sa preto na produkcii pýtal na neexistujúcu cestu → 404 na `parasites.json` aj `dictionary/host_hierarchy.json`. Lokálne (Live Server) to fungovalo, lebo tam sa použije vetva `isGitHub === false` → `/database/`.

**Oprava (vykonaná, súbor odovzdaný autorke na nahradenie):**
```diff
- const basePath = isGitHub ? '/VetParaAtlas/database/' : '/database/';
+ const basePath = isGitHub ? '/VetPara-Atlas/database/' : '/database/';
```
Súbor: `src/services/DatabaseService.js`. **Stav: hotové, čaká na nahradenie v repozitári a push.**

### 🔴→✅ Formát `database/images.json` sa zmenil — `Repository.js` bol dočasne nesynchronizovaný, teraz OPRAVENÝ

Priebeh (dôležité zdokumentovať kvôli budúcim session):

1. Na začiatku session bol `Repository.getImagesForParasite()` opravený z `img.parasiteId` na `img.objectId` — **správne vzhľadom na vtedy platný stav `images.json`** (starý formát, 33 záznamov, polia `objectId`/`thumbnail`/`isPrimary`/`sortOrder`, potvrdené v §0.7/§0.8 predchádzajúcich session).
2. Autorka následne upozornila, že admin nástroj (`tools/admin/forms/imageForm.js` + `tools/admin/zipExport.js`) už generuje **nový formát**: `parasiteId` (nie `objectId`) + `url` (nie `thumbnail`/`filename`) + `alt`/`caption`/`credit`/`dateAdded`.
3. Priama kontrola reálneho nahratého `database/images.json` toto potvrdila — súbor bol už prepísaný do nového formátu (parasiteId + url), starý formát s `objectId` už na disku nie je.
4. **`Repository.js` bol preto vrátený späť** na `img.parasiteId`:

```diff
  getImagesForParasite(id) {
-     return this.images.filter(img => img.objectId === id);
+     return this.images.filter(img => img.parasiteId === id);
  }
```

**Overené priamou kontrolou kódu (netreba meniť):**
- `GalleryPage.js` — `getFilteredImages()`, `getRecordForImage()`, `renderGrid()`, `openLightbox()` už dôsledne používajú `img.parasiteId` a `img.url`. Nikde sa nepoužíva `objectId`/`thumbnail`/`filename`. **Už je kompatibilný s novým formátom.**
- `AtlasPage.js` (riadky ~1270–1289, ~1478–1479) — `Repository.getImagesForParasite(id)` + vykresľovanie `img.url` priamo do `<img src>`. **Už je kompatibilný s novým formátom.**

**Aktuálny záväzný formát `database/images.json` (potvrdené admin nástrojom aj reálnymi dátami):**
```json
{
  "parasiteId": "id_parazita",
  "url": "/public/images/parasites/.../subor.webp",
  "alt": "",
  "caption": "",
  "credit": "",
  "dateAdded": "2026-08-21T10:00:00.000Z"
}
```
Staré polia `objectId`, `thumbnail`, `isPrimary`, `sortOrder`, `host` (pozri nižšie) **v tomto formáte už neexistujú.**

⚠️ **Pre ďalšie AI:** ak niekedy v budúcnosti príde požiadavka znova zmeniť/opraviť `Repository.getImagesForParasite()`, VŽDY si najprv vyžiadaj aktuálny reálny `database/images.json` priamo z disku/repozitára — formát sa už raz zmenil bez toho, aby to bolo vopred zdokumentované tu, a mohol by sa zmeniť znova.

### 🔴 NOVÝ NÁJDENÝ PROBLÉM — Filter hostiteľa v Galérii je teraz funkčne MŔTVY (nie len "čaká na dáta")

V predchádzajúcich session (§0.2–§0.4 nižšie) bolo diagnostikované, že filter hostiteľa v Galérii nemá viditeľný efekt, lebo všetky fotky mali `host: ""` (prázdny reťazec) — a to bolo popísané ako dočasný stav, ktorý sa vyrieši, keď fotky dostanú vyplnené `host` hodnoty.

**Toto už NEPLATÍ.** Nový formát `images.json` generovaný admin formulárom (`parasiteId`/`url`/`alt`/`caption`/`credit`/`dateAdded`) **pole `host` vôbec neobsahuje** — nie je prázdne, jednoducho v schéme chýba. Priamo v `GalleryPage.js` → `getFilteredImages()` je to aj priznané v kóde:

```js
// FIX BUG: prázdny host = fotka patrí všetkým hostiteľom
if (matchingHosts && matchingHosts.length > 0) {
  return true; // V novom formáte nemáme "host" – vždy zobrazíme
}
```

**Dôsledok:** filter hostiteľa v Galérii je momentálne **vždy no-op** pre všetky obrázky pridané cez nový admin formulár (t.j. pre všetky obrázky vôbec, keďže formulár je teraz jediná cesta, ako sa obrázky do `images.json` dostávajú). Nejde už o chýbajúce dáta v existujúcom poli — chýba samotné pole v štruktúre.

**Riešenie (odsúhlasené autorkou, zatiaľ NEIMPLEMENTOVANÉ, NIE JE PRIORITA):** doplniť pole `host` do formátu `images.json` — t.j. rozšíriť:
- schému v `docs/02_DATABASE_SPECIFICATION.md` §9,
- `tools/admin/forms/imageForm.js` (pridať `host` pri vytváraní nového `pendingChange`, ideálne s možnosťou prevziať automaticky z `parasites.json` daného parazita — pozri pôvodnú požiadavku autorky v §0.5, bod 6),
- `tools/admin/zipExport.js` (premietnuť `host` aj pri skladaní `finalImages`),
- `GalleryPage.js` → `getFilteredImages()` (vrátiť reálnu filtrovaciu logiku namiesto `return true`).

Autorka toto vedome odkladá — **nie je to aktuálna priorita**, len zdokumentovaný stav pre budúcu session.

### 🟡 `manifest.json` — rozhodnutie autorky: NECHAŤ PRÁZDNY/NERIEŠIŤ TERAZ

Nahratý `manifest.json` je prázdny (0 bajtov), čo spôsobuje kozmetický `Syntax error` v konzole — nič nerozbíja funkčnosť appky. Autorka potvrdila: súbor bol založený pri prvotnej štruktúre projektu, momentálne nie je jasné, či je vôbec potrebný.

**Rozhodnutie:** ak by v budúcnosti autorka chcela appku "inštalovať" na mobil/plochu (PWA funkcia), bude treba doplniť minimálny obsah (`name`, `short_name`, `start_url`, `icons`, `theme_color`) a skontrolovať `<link rel="manifest">` v `index.html`. **Momentálne to NIE JE priorita**, súbor sa nechá tak, ako je. Ak sa doplní obsah, zapísať zmenu sem.

### Zhrnutie vykonaných zmien kódu v tejto session

| Súbor | Zmena | Stav |
| --- | --- | --- |
| `src/services/DatabaseService.js` | `basePath` GitHub Pages: `/VetParaAtlas/` → `/VetPara-Atlas/` | ✅ hotové, odovzdané na nahradenie |
| `src/services/Repository.js` | `getImagesForParasite()`: `img.objectId` → `img.parasiteId` (finálny, overený stav) | ✅ hotové, odovzdané na nahradenie |
| `src/pages/GalleryPage.js` | žiadna zmena potrebná — už kompatibilný s novým formátom | — bez zmeny |
| `src/pages/AtlasPage.js` | žiadna zmena potrebná — už kompatibilný s novým formátom | — bez zmeny |
| `manifest.json` | žiadna zmena — vedomé rozhodnutie autorky nechať zatiaľ tak | — bez zmeny, nízka priorita do budúcna |

### 🟡 Otvorené úlohy z tejto session (pre ďalšiu session)

1. **Doplniť pole `host` do formátu `images.json`** (viď vyššie) — obnoví reálnu funkčnosť filtra hostiteľa v Galérii. Nie je to priorita, autorka ju odložila.
2. **`manifest.json`** — doplniť minimálny obsah, len ak/keď bude aktuálna potreba PWA inštalácie. Nie je to priorita.
3. Stále nevyriešené z predchádzajúcich session (pozri §0.7/§0.8 nižšie): `docs/03_DATA_ENTRY_STANDARD.md` neoverený kvôli `methods`/`operculum`/`license`; funkčné chyby v `admin.js` (kontrola duplicity ID voči `pendingChanges`, mŕtvy `workingCopy`, nespracované `delete`, chybný badge zmazania, statický `extractUniqueValues()`) — **stále neopravené**, nesúviseli s touto session.
4. Autorka avizovala, že sa k bodu "overiť, ktorá metóda (`getImages()` vs `getImagesForParasite()`) sa reálne používa" (pôvodne položené v predchádzajúcej správe) vráti neskôr — v tejto session sa to už fakticky zodpovedalo priamou kontrolou `AtlasPage.js`: používa sa výhradne `Repository.getImagesForParasite()`, `DatabaseService.getImages()` sa v `AtlasPage.js`/`GalleryPage.js` nikde nevolá (môže byť mŕtvy kód — netreba riešiť teraz, len poznámka).

---

🔥 0.8 Aktuálny stav — doplnené (2026‑08‑20, session: dokumentačné úpravy podľa §0.7 — časť Priority č. 3 DOKONČENÁ)

## ✅ ČO SA VYRIEŠILO V TEJTO SESSII (2026-08-20, pokračovanie — dokumentačný cleanup)

### Kontext

Nová session, nová konverzácia (bez pamäti predošlých session). Autorka nahrala `AI_STATUS.md`, `02_DATABASE_SPECIFICATION.md` a `2026-08-19_admin-formular-specifikacia.md`. Súbory `database/parasites.json`, `database/images.json`, `dictionary/host_hierarchy.json` ani implementačné súbory nástroja (`admin.js`, `parasiteForm.js`, `index.html`, ...) **neboli v tejto session nahraté** — preto sa táto session obmedzila len na tú časť Priority č. 3, ktorá sa dala spraviť výhradne z dvoch nahraných dokumentov.

### ✅ Priorita č. 3 — čiastočne DOKONČENÁ (dokumentačné úpravy z §0.7)

Upravené a autorke odovzdané na nahradenie v repozitári:

**`docs/02_DATABASE_SPECIFICATION.md`:**
- §8 `morphology` — odstránené `operculum`, `contents`, `texture`, `remarks` (ostáva `shape`/`colour`/`shell`), doplnená poznámka o rozhodnutí autorky.
- §8 `methods` — pole odstránené zo schémy (poznámka o vypustení namiesto pôvodného popisu), odstránené aj z JSON kostry v §7.
- §9 metadáta fotografií — odstránené `license`, doplnené `thumbnail`, `isPrimary`, `sortOrder` (chýbali, kód a dáta ich reálne používajú), doplnená poznámka že `host` je voliteľné pole (konvencia "prázdne = platí pre všetkých").

**`docs/2026-08-19_admin-formular-specifikacia.md`:**
- §4 — odstránené `methods` a `morphology.operculum` zo zoznamu polí formulára.
- §4.2 — poznámka o `methods` prepísaná na finálne rozhodnutie o vypustení (namiesto "ponúkne sa napriek tomu").
- §4.4 — poznámka o `license`/`thumbnail`/`isPrimary`/`sortOrder` označená ako vyriešená.
- §5 (Excel hárok 1) — odstránený riadok `methods` z tabuľky stĺpcov.

**Nevyriešené v rámci Priority č. 3:** `docs/03_DATA_ENTRY_STANDARD.md` nebol v tejto session nahraný — treba ho ešte skontrolovať/upraviť, ak tam boli `methods`/`operculum`/`license` tiež spomenuté (pôvodne zapísané ako otvorené v §0.7).

### 🟡 Stále otvorené (nezmenené oproti §0.7/§0.6, nezávislé od tejto session)

- Funkčné chyby v `admin.js` z predchádzajúceho code review (kontrola duplicity ID ignoruje `pendingChanges`, mŕtvy `workingCopy`, nespracované `delete`, chybný badge zmazania, statický `extractUniqueValues()`) — **neboli v tejto session riešené**, keďže `admin.js` ani ostatné implementačné súbory neboli nahraté. Potrebné nahrať pri ďalšom kroku, ak má pokračovať oprava kódu.
- `docs/03_DATA_ENTRY_STANDARD.md` — treba overiť/upraviť kvôli `methods`/`operculum`/`license`.

---

## ✅ ČO SA VYRIEŠILO V TEJTO SESSII (2026-08-20, pokračovanie reviewu)

### Kontext

Autorka dodatočne nahrala všetky predtým chýbajúce referenčné súbory: `02_DATABASE_SPECIFICATION.md`, `database/parasites.json` (474 záznamov), `database/images.json` (33 záznamov), `dictionary/host_hierarchy.json` (78 kľúčov). Review implementácie Tab 1 je týmto **dokončený** — nižšie sú finálne zistenia a rozhodnutia autorky. Stále platí: **žiadny kód sa zatiaľ nezapisoval do repozitára**, súbory zostávajú len nahraté v chate.

### 🔴→✅ Nezrovnalosť `methods`/`morphology.operculum` — ROZHODNUTÉ AUTORKOU

Kontrolou `02_DATABASE_SPECIFICATION.md` §8 sa potvrdilo, že `morphology.operculum` **je** oficiálne v schéme (spolu s `contents`, `texture`, `remarks` — teda 7 polí, nie 3 ako v aktuálnej implementácii formulára). Odôvodnenie v sprievodnej správe iného AI ("operculum nie je v schéme") bolo teda **nesprávne**. Zároveň sa v reálnych dátach potvrdilo: `operculum`/`contents`/`texture`/`remarks` sa nepoužívajú **0×/474**, rovnako ako `methods` **0×/474**. Situácia `operculum` a `methods` je teda identická.

**Rozhodnutie autorky (2026-08-20):** Polia `methods`, `morphology.operculum`, `morphology.contents`, `morphology.texture`, `morphology.remarks` a `images.json.license` sa **formálne vynechávajú úplne** — z formulára aj zo schémy. Nie je to dočasné, je to konečné zjednodušenie. Dôsledky:
- Implementácia `parasiteForm.js` (vynechanie `methods` a `operculum`) je tým **spätne schválená ako správna**, aj keď pôvodné odôvodnenie autora kódu bolo pre `operculum` nesprávne (mal tvrdiť "nepoužíva sa v dátach", nie "nie je v schéme").
- **`docs/02_DATABASE_SPECIFICATION.md` treba upraviť** — zo schémy v §7/§8 odstrániť `morphology.contents/texture/remarks/operculum` (ponechať len `shape/colour/shell`) a z §9 (metadáta fotografií) odstrániť `license`. Toto sa premietne aj do `docs/03_DATA_ENTRY_STANDARD.md`, ak tam boli tieto polia tiež spomenuté (nebol nahraný v tejto session, treba overiť pri budúcej príležitosti).
- `docs/2026-08-19_admin-formular-specifikacia.md` (špecifikácia formulára) treba tiež upraviť — pôvodne žiadala `methods` ako multi-select a `operculum` ako voliteľné pole (§4), toto už neplatí.
- Priorita č. 3 (dokumentačné úpravy, pozri nižšie) je rozšírená o toto vypustenie.

### ✅ Ostatné potvrdené v tejto sesii

- `dictionary/host_hierarchy.json` — reálna štruktúra (78 kľúčov, výhradne string hodnoty dieťa→rodič, 8 z nich je zároveň vnorená skupina) presne zodpovedá oprave v §6 `02_DATABASE_SPECIFICATION.md` aj tomu, ako s ním pracuje `getAllHostGroups()` v `admin.js`. Nič sa tu meniť nemusí.
- `objectId` (nie `parasiteId`) je potvrdený ako správny názov poľa — 33/33 záznamov v `images.json` ho tak reálne používa. Otvorená otázka zo `Správa pre Claude...md` (§4.5, čaká na overenie) je vyriešená.
- Žiadne duplicitné `id` v 474 záznamoch, `hostGroups` naozaj len 4×/474, `zoonosis` vždy boolean.

### 🟡 Stále otvorené (nezávislé od tejto session)

Funkčné chyby v `admin.js` nájdené v predchádzajúcom kole reviewu (kontrola duplicity ID ignoruje `state.pendingChanges`, mŕtvy `state.workingCopy`, nespracované `delete` v ňom, chybný badge pre zmazanie v sidebari, statický `extractUniqueValues()` datalist) **ostávajú v platnosti** — nesúviseli s chýbajúcimi referenčnými súbormi a treba ich opraviť bez ohľadu na rozhodnutie o `methods`/`operculum`. Pozri sekciu nižšie (pôvodne §0.6).

---

🔥 0.6 Aktuálny stav — doplnené (2026‑08‑20, session: code review implementácie Tab 1 admin nástroja, doručenej externe/iným AI)

## ✅ ČO SA VYRIEŠILO V TEJTO SESSION (2026-08-20, session: review admin nástroja)

### Kontext

Autorka nahrala kompletnú implementáciu Tab 1 (`tools/admin/`) admin nástroja, pripravenú externe (iné AI), spolu so sprievodnou správou `Správa_pre_Claude___Implementácia_Admin_nástroja_VetPara_Atlas.md`. Táto session je **len code review** podľa schválenej špecifikácie `docs/2026-08-19_admin-formular-specifikacia.md` — **žiadny kód sa zatiaľ nezapisoval do repozitára**, súbory zostávajú zatiaľ len nahraté v chate.

**Nahraté a skontrolované súbory:** `index.html`, `admin.css`, `admin.js` (kompletný, doplnený až v druhom kole — pôvodne nahratý len ako čiastočný diff s jedinou funkciou `generateId()`), `forms/parasiteForm.js`, `forms/hostForm.js` (placeholder), `forms/imageForm.js` (placeholder), `forms/bulkExcel.js` (placeholder), `diff.js`, `zipExport.js`.

**Zatiaľ NEnahraté** (potrebné na dokončenie reviewu, pozri nižšie): `docs/02_DATABASE_SPECIFICATION.md`, `database/parasites.json`, `database/images.json`, `dictionary/host_hierarchy.json` — ✅ **doplnené, pozri §0.7 vyššie.**

### 🔴 Nájdené nezrovnalosti oproti schválenej špecifikácii (vyžadujú rozhodnutie autorky)

1. **`methods` pole úplne vynechané z formulára.** ✅ **VYRIEŠENÉ v §0.7** — autorka formálne schválila vynechanie, špecifikácia sa opraví.
2. **`morphology.operculum` úplne vynechané.** ✅ **VYRIEŠENÉ v §0.7** — spolu s `contents`/`texture`/`remarks` a `images.json.license` formálne vynechané na základe rozhodnutia autorky, nezávisle od pôvodne (nesprávneho) odôvodnenia "nie je v schéme".
3. ~~➡️ Čaká na rozhodnutie autorky~~ — rozhodnuté, pozri §0.7.

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

- ✅ Doplniť `thumbnail`, `isPrimary`, `sortOrder` do `docs/02_DATABASE_SPECIFICATION.md` §9 — **HOTOVÉ (§0.8)**.
- ⬜ Odstrániť staré termíny `parasiteId` zo špecifikácie (kód jednotne používa `objectId`) — potvrdené v §0.7, **fyzicky ešte neskontrolované/neodstránené** v nahratých dokumentoch (v tejto session sa taký výskyt nenašiel priamo v texte, ale treba prejsť aj iné dokumenty mimo tejto session, napr. `03_DATA_ENTRY_STANDARD.md`).
- ✅ Z `docs/02_DATABASE_SPECIFICATION.md` odstrániť zo schémy `morphology` polia `operculum`, `contents`, `texture`, `remarks` (ponechať len `shape`/`colour`/`shell`), odstrániť `methods`, a z metadát fotografií (§9) odstrániť `license` — **HOTOVÉ (§0.8)**.
- ✅ Z `docs/2026-08-19_admin-formular-specifikacia.md` (§4) odstrániť požiadavku na `methods` multi-select aj `operculum` — **HOTOVÉ (§0.8)**.
- ⬜ Overiť aj `docs/03_DATA_ENTRY_STANDARD.md`, ak tieto polia spomína — **nebol nahraný v žiadnej session doteraz, stále otvorené.**

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