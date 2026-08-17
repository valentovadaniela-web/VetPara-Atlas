# 2026-08-17 – Priorita 1: Vyčistenie architektúry

## 1. Navbar.js – archivácia mŕtveho kódu

**Overenie:** Skontrolované `src/app/App.js` a `src/app/Router.js` — `Navbar.js`
sa v žiadnom z nich neimportuje. Router registruje routy priamo v `App.js`
(`registerRoutes()`), header je natvrdo v `index.html`. Potvrdené, že ide
o mŕtvy kód.

**Akcia:**
- Presunuté: `src/components/Navbar.js` → `_archive/Navbar.js`
- Obsah súboru nezmenený, len presunutý.
- `11_SESSION_LOG.md` nebol k dispozícii, takže bola použitá najbližšia
  rozumná konvencia (priečinok `_archive/` v koreni projektu).

## 2. layout.css – duplicitné CSS pravidlo

**Nájdené:** Pravidlo `.site-header { background-color: var(--color-bg-header); }`
bolo v súbore dvakrát po sebe (riadky za sekciou "Header / Navigation (v11)").

**Akcia:** Odstránený duplicitný blok, funkčnosť CSS sa nemení
(druhý blok bol presne identická kópia prvého, žiadna iná pravidlo sa
nemenilo).

## Nedotknuté súbory
- `index.html`, `App.js`, `Router.js` — len prečítané na overenie, obsahovo
  nezmenené.

## Zostávajúce úlohy z Priority 1
Žiadne — obe položky z `AI_STATUS.md` sekcia 2.1 sú vyriešené.
