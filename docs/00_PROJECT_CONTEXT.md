# 00_PROJECT_CONTEXT.md

> **Projekt:** VetPara Atlas
>
> **Verzia dokumentu:** 1.0
>
> **Status:** Living document (priebežne aktualizovaný)
>
> **Posledná aktualizácia:** 2026-07-24

---

# 1. Účel dokumentu

Tento dokument predstavuje hlavný kontext celého projektu VetPara Atlas.

Je to najdôležitejší dokument projektu a slúži ako:

- hlavný zdroj informácií pre vývoj,
- vstupný dokument pre AI,
- referenčný dokument pre všetkých budúcich vývojárov,
- záznam všetkých zásadných rozhodnutí.

Ak existuje rozpor medzi týmto dokumentom a iným dokumentom projektu, **platí tento dokument**.

---

# 2. Vízia projektu

VetPara Atlas nie je klasická webová stránka.

Nie je to ani obyčajný atlas parazitov.

Cieľom projektu je vytvoriť profesionálny digitálny systém pre veterinárnu parazitológiu, ktorý bude možné používať v laboratórnej diagnostike, pri výučbe aj vo výskume.

Projekt musí byť navrhnutý tak, aby bol rozšíriteľný minimálne počas nasledujúcich 10 rokov bez zásadnej zmeny architektúry.

---

# 3. Hlavný cieľ

Vybudovať moderný veterinárny diagnostický systém obsahujúci:

- atlas parazitov,
- laboratórnu databázu,
- diagnostický expert systém,
- databázu mikrofotografií,
- systém mikrometrie,
- porovnávanie diagnostických objektov,
- odbornú literatúru,
- podporu výučby,
- offline použitie.

---

# 4. Filozofia projektu

Projekt je postavený na štyroch princípoch.

## 4.1 Dáta sú dôležitejšie ako aplikácia

Používateľské rozhranie sa môže časom meniť.

Databáza musí zostať kvalitná.

Najväčšiu hodnotu projektu predstavujú kvalitné odborné údaje.

---

## 4.2 Jeden zdroj pravdy

Každý údaj existuje iba raz.

Nikdy nevytvárame duplicitné údaje.

Každá hodnota má jednoznačný význam.

---

## 4.3 Štandardizácia

Všetky údaje používajú jednotnú terminológiu.

Príklad:

Správne:

- Pes
- Trus
- Vajíčko

Nesprávne:

- pes
- feces
- stolica
- vajce

---

## 4.4 Rozšíriteľnosť

Každé rozhodnutie musí umožniť ďalší rozvoj.

Architektúra nesmie byť navrhnutá iba pre prvú verziu.

---

# 5. Charakter projektu

VetPara Atlas je:

- odborný projekt,
- vedecký projekt,
- databázový projekt,
- softvérový projekt,
- open-source projekt.

Nie je to marketingová stránka.

---

# 6. Primárni používatelia

Projekt je určený predovšetkým pre:

- veterinárne diagnostické laboratóriá,
- veterinárnych lekárov,
- laboratórnych diagnostikov,
- študentov veterinárnej medicíny,
- univerzity,
- výskumné pracoviská.

---

# 7. Dlhodobá vízia

Cieľom nie je vytvoriť iba atlas.

Konečným cieľom je vytvoriť kompletný veterinárny diagnostický informačný systém.

Budúce moduly môžu zahŕňať:

- AI diagnostiku,
- automatickú mikrometriu,
- OCR,
- prepojenie na LIMS,
- štatistiky laboratória,
- vzdelávacie moduly.

---

# 8. Rozsah projektu

Projekt bude pokrývať:

- protozoá,
- nematódy,
- cestódy,
- trematódy,
- ektoparazity,
- krvné parazity.

Hostitelia:

- pes,
- mačka,
- hovädzí dobytok,
- ovca,
- koza,
- kôň,
- ošípaná,
- hydina,
- exotické zvieratá.

---

# 9. Zdroje údajov

Primárnym zdrojom údajov sú odborné materiály poskytnuté autorom projektu.

Najmä:

- PowerPoint prezentácie,
- Excel tabuľky,
- Word dokumenty,
- PDF dokumenty,
- mikrofotografie,
- laboratórne metodiky,
- odborné poznámky.

Projekt nesmie vytvárať odborné údaje, ktoré nie sú podložené zdrojmi alebo odbornou literatúrou.

Ak údaje chýbajú, musia byť označené ako chýbajúce.

---

# 10. Základná filozofia databázy

Databáza neobsahuje iba biologické druhy.

Obsahuje diagnostické objekty.

Diagnostický objekt predstavuje to, čo laborant reálne identifikuje.

Príklady:

- Toxocara canis – vajíčko
- Giardia intestinalis – cysta
- Strongyloides stercoralis – larva
- Demodex canis – dospelý jedinec
- Babesia canis – krvný náter

Táto filozofia je základným princípom celej databázy.

---

# 11. Priorita projektu

Prioritou nie je vzhľad.

Prioritou nie je počet funkcií.

Prioritou je:

1. správnosť údajov,
2. konzistentnosť databázy,
3. jednoduché vyhľadávanie,
4. diagnostická použiteľnosť.

---

# 12. Rozhodnutia prijaté počas návrhu

Projekt bude používať:

Frontend:

- HTML5
- CSS3
- Bootstrap 5
- JavaScript ES6+

Databáza:

- JSON

Hosting:

- GitHub Pages

Verzovanie:

- Git
- GitHub

Editor:

- Visual Studio Code

---

# 13. Technológie, ktoré sa nebudú používať

Projekt nebude závislý od servera.

Nebudú použité:

- WordPress
- PHP
- MySQL
- Laravel
- Joomla
- Drupal

Prvá verzia bude plne statická aplikácia.

---

# 14. Offline filozofia

Aplikácia musí byť použiteľná aj bez internetu.

Do budúcnosti bude implementovaná ako Progressive Web App (PWA).

---

# 15. Princíp vývoja

Projekt sa vytvára zdola nahor.

Poradie:

1. analýza zdrojov,
2. databáza,
3. import,
4. aplikácia,
5. AI.

Nikdy opačne.

---

# 16. Architektúra vývoja

Každá nová funkcia prechádza:

Analýza

↓

Návrh

↓

Implementácia

↓

Testovanie

↓

Dokumentácia

↓

Nasadenie

---

# 17. Spôsob spolupráce

Používateľ poskytuje:

- odborné materiály,
- fotografie,
- metodiky,
- pripomienky,
- odbornú kontrolu.

AI zabezpečuje:

- návrh architektúry,
- návrh databázy,
- implementáciu,
- tvorbu dokumentácie,
- kontrolu konzistencie,
- návrh používateľského rozhrania,
- návrh importných nástrojov.

---

# 18. Pravidlá pre AI

Pri práci na projekte AI:

- nikdy nezačína projekt od začiatku,
- pokračuje od aktuálneho stavu,
- navrhuje produkčné riešenia,
- minimalizuje technický dlh,
- rešpektuje existujúcu architektúru,
- upozorní na riziká alebo lepšie riešenia.

---

# 19. Definícia úspechu

Projekt je úspešný, ak:

- údaje sú odborne správne,
- databáza je konzistentná,
- aplikácia je rýchla,
- rozšírenie o ďalšie hostiteľské druhy nevyžaduje zmenu architektúry,
- projekt je použiteľný v laboratórnej praxi.

---

# 20. Aktuálny stav projektu

Fáza:

**Implementácia**

Dokončené:

- definovanie vízie,
- definovanie cieľov,
- výber technológií,
- návrh architektúry,
- identifikácia zdrojových materiálov,
- definovanie filozofie databázy.

Nasledujúce kroky:

1. README.md
2. Database Specification
3. JSON Schema
4. dog.json
5. Import z PowerPoint prezentácií
6. Prvé MVP aplikácie

---

# 21. Zásady, ktoré sa nesmú porušiť

1. Databáza je dôležitejšia ako dizajn.
2. Odborná správnosť má vždy prednosť pred rýchlosťou vývoja.
3. Žiadne duplicitné údaje.
4. Jednotná terminológia.
5. Všetky zmeny musia byť zdokumentované.
6. Architektúra musí byť pripravená na dlhodobý rozvoj.
7. AI nesmie meniť základnú filozofiu projektu bez výslovného schválenia.
8. Projekt sa vyvíja iteratívne – každá verzia musí byť funkčná.

---

# 22. Poslanie projektu

VetPara Atlas má byť dlhodobo udržiavaný odborný referenčný systém pre veterinárnu parazitológiu, postavený na kvalitných dátach, otvorenej architektúre a profesionálnej dokumentácii. Cieľom nie je len vytvoriť aplikáciu, ale vytvoriť spoľahlivý nástroj, ktorý bude užitočný pre diagnostické laboratóriá, veterinárnych lekárov, študentov aj výskumníkov.