# 07_AI_ROADMAP.md

> **Projekt:** VetPara Atlas
>
> **Dokument:** Roadmap umelej inteligencie (AI)
>
> **Verzia:** 1.0
>
> **Status:** Strategický dokument
>
> **Nadväzuje na:** `00_PROJECT_CONTEXT.md`, `01_PROJECT_SPECIFICATION.md`, `02_DATABASE_SPECIFICATION.md`, `05_TECHNICAL_ARCHITECTURE.md`

---

# Obsah

1. Účel dokumentu
2. Vízia AI vo VetPara Atlas
3. Základné princípy
4. Etapy vývoja AI
5. AI moduly
6. Diagnostický expert
7. Počítačové videnie
8. Automatická mikrometria
9. OCR
10. NLP
11. AI asistent
12. Databáza znalostí
13. Strojové učenie
14. LIMS integrácia
15. Cloud vs lokálna AI
16. Etické zásady
17. Roadmap verzií
18. Budúce možnosti

---

# 1. Účel dokumentu

Tento dokument opisuje dlhodobý plán využitia umelej inteligencie v projekte VetPara Atlas.

AI nie je cieľ projektu.

AI je nástroj, ktorý má pomáhať laboratórnemu diagnostikovi.

Rozhodnutie o diagnóze zostáva vždy na odborníkovi.

---

# 2. Vízia

VetPara Atlas sa má stať inteligentným laboratórnym systémom, ktorý bude schopný:

- pomáhať pri diagnostike,
- rozpoznávať objekty na mikrofotografiách,
- automaticky merať objekty,
- odporúčať diferenciálnu diagnostiku,
- vyhľadávať podobné nálezy,
- analyzovať laboratórne údaje,
- podporovať výučbu.

---

# 3. Filozofia AI

Projekt je založený na princípe:

**Human in the Loop**

To znamená:

AI navrhuje.

Človek rozhoduje.

Nikdy opačne.

---

# 4. Etapy vývoja

## Fáza 1

Databáza.

Žiadna AI.

---

## Fáza 2

Pravidlový diagnostický expert.

---

## Fáza 3

Počítačové videnie.

---

## Fáza 4

Automatická mikrometria.

---

## Fáza 5

Strojové učenie.

---

## Fáza 6

Prediktívna diagnostika.

---

# 5. AI Moduly

Plánované moduly.

## AI-01

Diagnostický expert

---

## AI-02

Rozpoznávanie obrázkov

---

## AI-03

Automatická mikrometria

---

## AI-04

OCR

---

## AI-05

Vyhľadávanie podobných objektov

---

## AI-06

Chat asistent

---

## AI-07

Automatická klasifikácia

---

## AI-08

Predikcia diagnózy

---

# 6. AI-01 Diagnostický expert

Prvá AI nebude neurónová sieť.

Bude založená na pravidlách.

Používateľ zadá:

- hostiteľa,
- vzorku,
- veľkosť,
- tvar,
- farbu,
- obal,
- obsah,
- diagnostickú metódu.

Systém vypočíta pravdepodobnosť jednotlivých objektov.

Výstup:

| Objekt | Zhoda |
|---------|------:|
| Toxocara canis | 98 % |
| Toxascaris leonina | 67 % |
| Ascaris spp. | 12 % |

---

# 7. AI-02 Rozpoznávanie fotografií

Používateľ nahrá mikrofotografiu.

AI vykoná:

- detekciu objektov,
- segmentáciu,
- klasifikáciu,
- odhad kvality snímky.

Výstup:

- označené objekty,
- pravdepodobnosť,
- odporúčané druhy.

---

# 8. AI-03 Automatická mikrometria

AI automaticky:

- nájde objekt,
- určí jeho obrys,
- zmeria dĺžku,
- zmeria šírku,
- vypočíta priemer,
- uloží výsledok.

Budú podporované:

- vajíčka,
- larvy,
- cysty,
- oocysty,
- dospelé jedince.

---

# 9. AI-04 OCR

OCR umožní automaticky čítať údaje z:

- laboratórnych formulárov,
- mikroskopických protokolov,
- PDF,
- starších dokumentov.

Výstup:

štruktúrovaný JSON.

---

# 10. AI-05 Vyhľadávanie podobných objektov

Po výbere objektu AI nájde:

- morfologicky podobné objekty,
- podobné rozmery,
- podobné fotografie.

Použitie:

diferenciálna diagnostika.

---

# 11. AI-06 Chat Asistent

Integrovaný odborný asistent.

Bude vedieť odpovedať na otázky ako:

"Aký je rozdiel medzi Toxocara canis a Toxascaris leonina?"

"Ktorá metóda je vhodná na diagnostiku Giardia?"

Odpovede budú vychádzať z databázy VetPara Atlas.

---

# 12. AI-07 Automatická klasifikácia

AI navrhne:

- hostiteľa,
- skupinu,
- štádium,
- taxonómiu.

Použije sa pri importe nových objektov.

---

# 13. AI-08 Prediktívna diagnostika

V budúcnosti môže AI využívať:

- geografickú lokalitu,
- ročné obdobie,
- vek zvieraťa,
- klinické príznaky,
- laboratórne výsledky.

Výsledkom bude zoznam najpravdepodobnejších diagnóz.

---

# 14. Databáza znalostí

AI nebude používať iba všeobecné modely.

Primárnym zdrojom budú:

- databáza VetPara Atlas,
- interné metodiky,
- odborná literatúra,
- fotografie.

Tým sa zabezpečí konzistentnosť odpovedí.

---

# 15. Machine Learning

Budúce modely môžu využívať:

- CNN,
- Vision Transformer,
- YOLO,
- Segment Anything,
- CLIP.

Výber modelu bude závisieť od konkrétnej úlohy.

---

# 16. Tréningové dáta

Každý obrázok musí mať:

- správnu identifikáciu,
- overeného autora,
- metadáta,
- označené objekty (bounding box alebo maska).

Bez kvalitných anotácií nebude model trénovaný.

---

# 17. LIMS Integrácia

AI bude môcť analyzovať údaje priamo z laboratórneho informačného systému.

Možnosti:

- import výsledkov,
- kontrola konzistencie,
- upozornenie na nezvyčajné nálezy.

---

# 18. Cloud vs Lokálne spracovanie

Preferovaný režim:

Lokálne spracovanie.

Výhody:

- ochrana údajov,
- vyššia dostupnosť,
- možnosť práce offline.

Cloud bude voliteľný.

---

# 19. Etické zásady

AI:

- nenahrádza veterinárneho lekára,
- nenahrádza laboratórneho diagnostika,
- neposkytuje definitívnu diagnózu.

Každé odporúčanie musí byť prezentované ako návrh.

---

# 20. Roadmap

## Verzia 1.x

Bez AI.

---

## Verzia 2.x

Diagnostický expert.

---

## Verzia 3.x

Automatická mikrometria.

---

## Verzia 4.x

Rozpoznávanie obrázkov.

---

## Verzia 5.x

Strojové učenie.

---

## Verzia 6.x

Prediktívna diagnostika.

---

# 21. Technické požiadavky

Budúca AI musí byť:

- modulárna,
- nezávislá od UI,
- dokumentovaná,
- testovateľná,
- spätne kompatibilná.

---

# 22. Kritériá úspechu

AI modul je úspešný, ak:

- zrýchli diagnostiku,
- nezníži odbornú presnosť,
- umožní laborantovi jednoduchšie rozhodovanie,
- bude transparentný a vysvetliteľný.

---

# 23. Súvisiace dokumenty

- `00_PROJECT_CONTEXT.md`
- `01_PROJECT_SPECIFICATION.md`
- `02_DATABASE_SPECIFICATION.md`
- `05_TECHNICAL_ARCHITECTURE.md`
- `08_DEVELOPER_GUIDE.md`

---

# Poznámka pre budúci vývoj

VetPara Atlas nebude vytvárať "čiernu skrinku", ktorá vydáva diagnózy bez vysvetlenia. Každé odporúčanie AI musí byť **vysvetliteľné (Explainable AI – XAI)**. Používateľ musí vždy vidieť, na základe ktorých znakov, rozmerov alebo fotografií AI dospela k svojmu odporúčaniu.

Tým sa zabezpečí odborná dôveryhodnosť systému a jeho využiteľnosť vo veterinárnej laboratórnej praxi.

---

**Koniec dokumentu**