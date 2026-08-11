#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
VetPara Atlas — migrácia dog.json na schému z 02_DATABASE_SPECIFICATION.md
a pravidlá z 03_DATA_ENTRY_STANDARD.md.

DÔLEŽITÉ (per 09_MASTER_PROMPT.md bod 4):
AI nikdy nevytvára odborné údaje bez označenia, že ide o návrh.
Preto:
  - stage sa NIKDY needucuje automaticky -> vždy null + flag.
  - sample sa NIKDY needucuje automaticky -> vždy null + flag.
  - group a taxonomy sa ponúkajú iba ako "aiSuggested" (mimo
    autoritatívneho poľa), nikdy sa nezapisujú priamo do group/taxonomy.
  - Nejednoznačné rozmery (size) sa nechajú null a pôvodný text sa
    uchová v rawSize + flag na ručnú kontrolu.
"""

import json
import re
import unicodedata
from datetime import date

TODAY = date.today().isoformat()

# ---------------------------------------------------------------------------
# 1. Načítanie originálu
# ---------------------------------------------------------------------------

with open("dog_original.json", "r", encoding="utf-8") as f:
    original = json.load(f)


# ---------------------------------------------------------------------------
# 2. Pomocné funkcie
# ---------------------------------------------------------------------------

def slugify(latin_name: str) -> str:
    """Vytvorí ID základ z latinského názvu podľa 03_DATA_ENTRY_STANDARD.md
    (malé písmená, bez diakritiky, podčiarkovníky, bez medzier).
    Poznámka: pravidlo aj vzor (napr. toxocara_canis_egg) očakáva, že ID
    obsahuje aj štádium — to však nevieme automaticky doplniť (stage=null),
    takže generujeme iba základ z latinName. Po ručnom doplnení stage
    treba ID rozšíriť, napr. _egg / _larva / _adult / _cyst."""
    text = latin_name.strip()
    text = unicodedata.normalize("NFKD", text)
    text = text.encode("ascii", "ignore").decode("ascii")
    text = text.lower()
    text = re.sub(r"[^a-z0-9]+", "_", text)
    text = re.sub(r"_+", "_", text).strip("_")
    return text


def normalize_host(host_raw: str):
    """host: 'pes' -> ['Pes']; '' -> [] (+ flag)."""
    host_raw = (host_raw or "").strip()
    if not host_raw:
        return [], True  # missing -> flag
    mapping = {
        "pes": "Pes",
        "mačka": "Mačka",
        "macka": "Mačka",
    }
    normalized = mapping.get(host_raw.lower(), host_raw.strip().capitalize())
    return [normalized], False


NUM = r"\d+(?:[.,]\d+)?"

# X-Y x A-B  (plný rozsah dĺžka x šírka)
RE_FULL_RANGE = re.compile(rf"^\s*({NUM})\s*-\s*({NUM})\s*x\s*({NUM})\s*-\s*({NUM})\s*$")
# X-Y x A  (rozsah dĺžky, jedna hodnota šírky)
RE_RANGE_SINGLE_WIDTH = re.compile(rf"^\s*({NUM})\s*-\s*({NUM})\s*x\s*({NUM})\s*$")
# X-Y  (iba jeden rozsah, bez šírky)
RE_RANGE_ONLY = re.compile(rf"^\s*({NUM})\s*-\s*({NUM})\s*$")
# X  (jedno číslo, bez rozsahu)
RE_SINGLE = re.compile(rf"^\s*({NUM})\s*$")
# X x Y  (jedna dĺžka x jedna šírka, BEZ rozsahu na oboch stranách)
RE_SINGLE_PAIR = re.compile(rf"^\s*({NUM})\s*x\s*({NUM})\s*$")


def clean_size_string(raw: str) -> str:
    s = raw.strip()
    s = s.replace("×", "x").replace("X", "x")
    s = s.replace("–", "-").replace("—", "-")
    s = re.sub(r"\s+", " ", s)
    return s


def to_float(s: str) -> float:
    return float(s.replace(",", "."))


def parse_size(raw: str):
    """
    Vracia (micrometry_dict, status, note)
      status: 'ok_full' | 'ok_partial' | 'unparsed' | 'empty'
    Pri čomkoľvek mimo jednoznačného 'X-Y x A-B' alebo 'X-Y' formátu
    sa hodnota NEPOUŽIJE do micrometry a ide do rawSize + flag.
    """
    if not raw or not raw.strip():
        return (
            {"lengthMin": None, "lengthMax": None,
             "widthMin": None, "widthMax": None, "unit": "µm"},
            "empty",
            "Rozmer chýba úplne.",
        )

    cleaned = clean_size_string(raw)

    # Ak obsahuje viacero štádií v jednom reťazci (napr. "v: ... l: ...")
    # alebo zátvorky s druhou hodnotou, alebo mm popri µm -> vždy unparsed.
    if re.search(r"[a-zA-Zµ]", cleaned.replace("x", "")) or "(" in cleaned or "mm" in cleaned:
        return (
            {"lengthMin": None, "lengthMax": None,
             "widthMin": None, "widthMax": None, "unit": "µm"},
            "unparsed",
            "Reťazec obsahuje text/zátvorky/zmiešané jednotky — "
            "pravdepodobne kombinuje viac štádií alebo mier. "
            "Vyžaduje ručné rozdelenie/interpretáciu.",
        )

    m = RE_FULL_RANGE.match(cleaned)
    if m:
        lmin, lmax, wmin, wmax = (to_float(x) for x in m.groups())
        return (
            {"lengthMin": lmin, "lengthMax": lmax,
             "widthMin": wmin, "widthMax": wmax, "unit": "µm"},
            "ok_full",
            "",
        )

    m = RE_RANGE_SINGLE_WIDTH.match(cleaned)
    if m:
        lmin, lmax, w = (to_float(x) for x in m.groups())
        return (
            {"lengthMin": lmin, "lengthMax": lmax,
             "widthMin": w, "widthMax": w, "unit": "µm"},
            "ok_partial",
            f"Šírka bola zadaná ako jedna hodnota ({w}), nie rozsah — "
            f"widthMin=widthMax={w}. Skontrolovať, či nejde o preklep "
            f"alebo skutočne fixnú hodnotu.",
        )

    m = RE_RANGE_ONLY.match(cleaned)
    if m:
        lmin, lmax = (to_float(x) for x in m.groups())
        return (
            {"lengthMin": lmin, "lengthMax": lmax,
             "widthMin": None, "widthMax": None, "unit": "µm"},
            "ok_partial",
            "Šírka (width) nebola v zdroji vôbec uvedená — "
            "widthMin/widthMax ponechané ako null.",
        )

    m = RE_SINGLE_PAIR.match(cleaned)
    if m:
        length_val, width_val = (to_float(x) for x in m.groups())
        return (
            {"lengthMin": length_val, "lengthMax": length_val,
             "widthMin": width_val, "widthMax": width_val, "unit": "µm"},
            "ok_partial",
            f"Zdroj uvádzal jednu hodnotu dĺžky ({length_val}) a jednu "
            f"hodnotu šírky ({width_val}), nie rozsah — "
            f"lengthMin=lengthMax a widthMin=widthMax. Overiť, či ide "
            f"o typickú/priemernú hodnotu alebo chýba skutočný rozsah.",
        )

    m = RE_SINGLE.match(cleaned)
    if m:
        val = to_float(m.group(1))
        return (
            {"lengthMin": None, "lengthMax": None,
             "widthMin": None, "widthMax": None, "unit": "µm"},
            "unparsed",
            f"Iba jedna číselná hodnota ({val}) bez rozsahu a bez "
            f"jasného významu (dĺžka? priemer? maximum?) — "
            f"vyžaduje odborné potvrdenie pred zápisom do micrometry.",
        )

    return (
        {"lengthMin": None, "lengthMax": None,
         "widthMin": None, "widthMax": None, "unit": "µm"},
        "unparsed",
        "Formát rozmeru sa nepodarilo jednoznačne rozpoznať.",
    )


def clean_text(v):
    v = (v or "").strip()
    return v if v else None


# ---------------------------------------------------------------------------
# 3. AI-navrhované (NEZÁVÄZNÉ) taxonomické zaradenie
#    -> nikdy sa nezapisuje priamo do "group"/"taxonomy", iba do
#       samostatného "aiSuggested" bloku, ktorý treba pred použitím overiť.
#    Založené na všeobecne známej taxonómii, NIE na projektových zdrojoch —
#    preto vyžaduje odbornú kontrolu podľa 09_MASTER_PROMPT.md bod 4.
# ---------------------------------------------------------------------------

GROUP_SUGGESTIONS = {
    "Giardia intestinalis": "Protozoa",
    "Isospora canis": "Protozoa",
    "Isospora ohioensis": "Protozoa",
    "Isospora burrowsi": "Protozoa",
    "Isospora neorivolta": "Protozoa",
    "Cryptosporidium parvum": "Protozoa",
    "Hammondia heydornii": "Protozoa",
    "Sarcocystis spp.": "Protozoa",
    "Balantioides (predtým Balantidium) coli": "Protozoa",
    "Fasciola hepatica": "Trematoda",
    "Alaria alata": "Trematoda",
    "Dipylidium caninum": "Cestoda",
    "Taenia spp./Echinococcus": "Cestoda",
    "Mesocestoides spp.": "Cestoda",
    "Diphyllobothrium latum": "Cestoda",
    "Toxocara canis": "Nematoda",
    "Toxascaris leonina": "Nematoda",
    "Ancylostoma caninum": "Nematoda",
    "Uncinaria stenocephala": "Nematoda",
    "Angiostrongylus vasorum": "Nematoda",
    "Crenosoma vulpis": "Nematoda",
    "Oslerus (Filaroides) osleri": "Nematoda",
    "Physaloptera spp.": "Nematoda",
    "Spirocerca lupi": "Nematoda",
    "Dirofilaria immitis": "Nematoda",
    "Dirofilaria repens": "Nematoda",
    "Strongyloides spp.": "Nematoda",
    "Dioctophyme renale": "Nematoda",
    "Trichuris vulpis": "Nematoda",
    "Pearsonema (Capillaria) plica": "Nematoda",
    "Eucoleus boehmi": "Nematoda",
    "Eucoleus aerophilus (= Capillaria aerophila)": "Nematoda",
    "Linguatula serrata": "Pentastomida (mimo hlavných skupín — overiť zaradenie)",
    "Demodex canis": "Arthropoda (Acari)",
    "Demodex injai": "Arthropoda (Acari)",
}


# ---------------------------------------------------------------------------
# 3b. Rozdelenie záznamov, kde zdroj SÁM textovo označuje dve odlišné
#     štádiá v jednom poli "size" (napr. "v: ... l: ..." alebo
#     "..., dospelé ..."). Toto NIE JE odhad AI z všeobecných znalostí —
#     je to priamy prepis toho, čo už zdroj obsahoval, len rozdelené do
#     dvoch diagnostických objektov podľa filozofie projektu
#     (00_PROJECT_CONTEXT.md sekcia 10).
#     Stage sa napriek tomu NEZAPISUJE priamo do "stage" (zostáva null),
#     iba do aiSuggested.stage s vysokou mierou istoty a odôvodnením —
#     odborník má poslednú kontrolu.
# ---------------------------------------------------------------------------

SPLIT_OVERRIDES = {
    "DOG-0027": [  # Strongyloides spp.
        {
            "idSuffix": "egg",
            "stageSuggested": "vajíčko",
            "confidence": "vysoká — priamo z označenia 'v:' v zdrojovom texte",
            "micrometry": {"lengthMin": 62.0, "lengthMax": 64.0,
                            "widthMin": 32.0, "widthMax": 36.0, "unit": "µm"},
            "extraNote": "Rozdelené zo záznamu DOG-0027, pôvodne "
                         "'v: 62-64 x 32-36, l: 230-350'.",
        },
        {
            "idSuffix": "larva",
            "stageSuggested": "larva",
            "confidence": "vysoká — priamo z označenia 'l:' v zdrojovom texte; "
                          "presné larválne štádium (L1 vs L3) NIE JE isté z "
                          "poznámky, treba overiť",
            "micrometry": {"lengthMin": 230.0, "lengthMax": 350.0,
                            "widthMin": None, "widthMax": None, "unit": "µm"},
            "extraNote": "Rozdelené zo záznamu DOG-0027, pôvodne "
                         "'v: 62-64 x 32-36, l: 230-350'. Šírka larvy "
                         "v zdroji vôbec nebola uvedená. Poznámka "
                         "'larva stočená do tvaru U, larva L1 - veľké "
                         "genit. promodium, L3 dlhý ezofágus' naznačuje, "
                         "že ide možno o dve rôzne larválne štádiá "
                         "(L1 aj L3) — over, či toto nemá byť rozdelené "
                         "ešte ďalej.",
        },
    ],
    "DOG-0011": [  # Alaria alata
        {
            "idSuffix": "egg",
            "stageSuggested": "vajíčko",
            "confidence": "stredná — rozsah 98-134 x 62-70 je zo zdroja "
                          "jasný, ale hodnota '(120 x 65)' v zátvorke "
                          "pravdepodobne predstavuje priemer, nie ďalší "
                          "údaj — v migrácii bola zátvorka ignorovaná",
            "micrometry": {"lengthMin": 98.0, "lengthMax": 134.0,
                            "widthMin": 62.0, "widthMax": 70.0, "unit": "µm"},
            "extraNote": "Rozdelené zo záznamu DOG-0011, pôvodne "
                         "'98-134 × 62-70 (120 x 65), dospelé 2,5–6 x "
                         "0,5–2 mm'.",
        },
        {
            "idSuffix": "adult",
            "stageSuggested": "dospelý jedinec",
            "confidence": "stredná — číselný prevod mm→µm je mechanický "
                          "a spoľahlivý, ALE zásadná otázka je klinická: "
                          "dospelý jedinec sa štandardne nezachytáva "
                          "flotáciou trusu ako ostatné objekty v tejto "
                          "databáze — over, či tento objekt vôbec patrí "
                          "do rovnakej kategórie 'sample' ako ostatné, "
                          "alebo či ho treba označiť inou diagnostickou "
                          "metódou (napr. pitva/histológia)",
            "micrometry": {"lengthMin": 2500.0, "lengthMax": 6000.0,
                            "widthMin": 500.0, "widthMax": 2000.0, "unit": "µm"},
            "extraNote": "Rozdelené zo záznamu DOG-0011, pôvodná hodnota "
                         "'2,5–6 x 0,5–2 mm' prevedená na µm "
                         "(1 mm = 1000 µm). Prevod je matematicky "
                         "korektný, ale odborne over jednotku aj "
                         "relevantnosť pre laboratórnu diagnostiku.",
        },
    ],
}

# Záznamy, kde AI VEDOME NEODHADUJE konkrétne číselné rozmery, len
# vysvetľuje, prečo je hodnota nejednoznačná a čo presne treba overiť.
# Toto sú explicitne otvorené otázky pre odborníka, nie návrhy.
NO_GUESS_NOTES = {
    "DOG-0014": (
        "Pôvodná hodnota '50-50 x 39-39 (30-40)' je vnútorne nekonzistentná "
        "(rozsah '50-50' fakticky nie je rozsah, ale opakovaná hodnota; "
        "nie je jasné, či '(30-40)' patrí k dĺžke, šírke, alebo je to "
        "úplne iný údaj, napr. rozsah priemeru embrya). AI zámerne "
        "NEHÁDA výklad — vyžaduje priame nahliadnutie do pôvodného zdroja "
        "(prezentácia/Excel), z ktorého táto hodnota pochádza."
    ),
    "DOG-0022": (
        "Pôvodná hodnota je jedno číslo (300) bez rozsahu. Vzhľadom na "
        "formát ostatných záznamov v tejto skupine (Angiostrongylus, "
        "Crenosoma majú rozsah dĺžky + šírku) je pravdepodobné, že 300 "
        "je len dĺžka (µm) bez uvedenej šírky, možno priemerná/typická "
        "hodnota, nie min-max rozsah. AI zámerne neponúka konkrétny "
        "rozsah min/max — treba overiť v odbornej literatúre alebo "
        "pôvodnom zdroji."
    ),
    "DOG-0025": (
        "Rovnaký prípad ako DOG-0022 — jedno číslo (300) bez rozsahu a "
        "bez jasného významu. AI zámerne neponúka konkrétny rozsah "
        "min/max pre mikrofilárie D. immitis — over v odbornej "
        "literatúre alebo pôvodnom zdroji."
    ),
    "DOG-0034": (
        "Rozmer v zdroji úplne chýba (prázdny reťazec). Demodex canis "
        "sa navyše bežne nezachytáva flotáciou, ale škrabom kože — over, "
        "či pre tento objekt vôbec dáva zmysel vypĺňať pole 'sample' "
        "rovnako ako pri fekálnych nálezoch, a doplň mikrometriu podľa "
        "odbornej literatúry."
    ),
    "DOG-0035": (
        "Rozmer v zdroji úplne chýba (prázdny reťazec). Poznámka "
        "'dlhý, predĺžený koniec' naznačuje, že D. injai sa od D. canis "
        "líši predovšetkým tvarom/dĺžkou tela — mikrometriu treba "
        "doplniť podľa odbornej literatúry, AI ju nevymýšľa."
    ),
}


# ---------------------------------------------------------------------------
# 4. Hlavná migrácia
# ---------------------------------------------------------------------------

migrated = []
report_rows = []

for rec in original:
    legacy_id = rec.get("id", "")
    latin_raw = rec.get("taxon", "").strip()
    latin_name = latin_raw

    host_list, host_missing = normalize_host(rec.get("host", ""))
    shape = clean_text(rec.get("shape"))
    colour = clean_text(rec.get("color"))
    shell = clean_text(rec.get("wall"))
    notes_original = clean_text(rec.get("notes"))
    group_suggestion = GROUP_SUGGESTIONS.get(latin_name)
    size_raw = rec.get("size", "")

    # ---- Prípad A: zdroj sám rozlišuje dve štádiá -> rozdeliť na 2 objekty
    if legacy_id in SPLIT_OVERRIDES:

        for variant in SPLIT_OVERRIDES[legacy_id]:

            id_base = f"{slugify(latin_name)}_{variant['idSuffix']}"

            new_record = {
                "id": id_base,
                "legacyId": legacy_id,
                "latinName": latin_name if latin_name else None,
                "slovakName": None,
                "taxonomy": {
                    "kingdom": None, "phylum": None, "class": None,
                    "order": None, "family": None, "genus": None,
                    "species": None,
                },
                "host": host_list,
                "sample": None,
                "stage": None,
                "group": None,
                "methods": [],
                "micrometry": variant["micrometry"],
                "morphology": {
                    "shape": shape, "colour": colour, "shell": shell,
                    "operculum": None, "contents": None,
                },
                "diagnosticSigns": [],
                "differentialDiagnosis": [],
                "images": [],
                "references": [],
                "notes": notes_original,
                "rawSize": size_raw,
                "aiSuggested": {
                    "group": group_suggestion,
                    "stage": variant["stageSuggested"],
                    "stageConfidence": variant["confidence"],
                    "splitNote": variant["extraNote"],
                    "disclaimer": (
                        "Návrh AI — group je zo všeobecnej taxonómie "
                        "(neoverené), stage je odvodené priamo z "
                        "označenia v pôvodnom zdrojovom texte (vyššia "
                        "istota, ale stále vyžaduje potvrdenie). Pred "
                        "použitím oboje potvrdiť a prepísať do "
                        "'group'/'stage', potom tento blok odstrániť."
                    ),
                },
                "created": TODAY,
                "modified": TODAY,
                "version": "1.0",
            }

            migrated.append(new_record)

            flags = [
                "TENTO ZÁZNAM VZNIKOL ROZDELENÍM PÔVODNÉHO "
                f"{legacy_id} (dva diagnostické objekty namiesto jedného) "
                "— over, či rozdelenie a priradené hodnoty dávajú zmysel",
                f"stage: AI navrhuje '{variant['stageSuggested']}' "
                f"({variant['confidence']}) — potvrdiť a prepísať z "
                f"aiSuggested do stage",
                "sample: chýba (vždy nutná ručná kontrola)",
                f"group: AI navrhuje '{group_suggestion}' — nutné potvrdiť"
                if group_suggestion else
                "group: AI nemá spoľahlivý návrh — nutné doplniť ručne",
                variant["extraNote"],
            ]

            report_rows.append({
                "legacyId": f"{legacy_id} → {id_base}",
                "id": id_base,
                "latinName": latin_name,
                "flags": flags,
                "size_status": "split",
            })

        continue  # pôvodný nerozdelený záznam sa už ďalej nespracováva

    # ---- Prípad B: bežné spracovanie (1 zdrojový záznam = 1 objekt) ----

    id_base = slugify(latin_name) if latin_name else legacy_id.lower()
    micrometry, size_status, size_note = parse_size(str(size_raw))

    new_record = {
        "id": id_base,
        "legacyId": legacy_id,
        "latinName": latin_name if latin_name else None,
        "slovakName": None,
        "taxonomy": {
            "kingdom": None,
            "phylum": None,
            "class": None,
            "order": None,
            "family": None,
            "genus": None,
            "species": None,
        },
        "host": host_list,
        "sample": None,
        "stage": None,
        "group": None,
        "methods": [],
        "micrometry": micrometry,
        "morphology": {
            "shape": shape,
            "colour": colour,
            "shell": shell,
            "operculum": None,
            "contents": None,
        },
        "diagnosticSigns": [],
        "differentialDiagnosis": [],
        "images": [],
        "references": [],
        "notes": notes_original,
        "rawSize": size_raw if size_status != "ok_full" else None,
        "aiSuggested": {
            "group": group_suggestion,
            "disclaimer": (
                "Návrh AI na základe všeobecnej taxonómie, NEOVERENÝ voči "
                "projektovým zdrojom. Pred použitím potvrdiť a až potom "
                "hodnotu skopírovať do poľa 'group' a odstrániť tento blok."
            ) if group_suggestion else None,
        },
        "created": TODAY,
        "modified": TODAY,
        "version": "1.0",
    }

    migrated.append(new_record)

    # --- report riadok ---
    flags = []
    flags.append("stage: chýba (vždy nutná ručná kontrola)")
    flags.append("sample: chýba (vždy nutná ručná kontrola)")

    if host_missing:
        flags.append("host: chýba úplne (pôvodné pole bolo prázdne)")

    if size_status == "empty":
        flags.append("micrometry: rozmer v zdroji úplne chýba")
    elif size_status == "unparsed":
        flags.append(f"micrometry: NEPREVEDENÉ automaticky — {size_note} "
                      f"(pôvodný text: \"{size_raw}\")")
    elif size_status == "ok_partial":
        flags.append(f"micrometry: čiastočne prevedené — {size_note}")

    if legacy_id in NO_GUESS_NOTES:
        flags.append(f"⚠️ AI ZÁMERNE NEHÁDA rozmer: {NO_GUESS_NOTES[legacy_id]}")

    if group_suggestion:
        flags.append(f"group: AI navrhuje '{group_suggestion}' — nutné potvrdiť")
    else:
        flags.append("group: AI nemá spoľahlivý návrh — nutné doplniť ručne")

    if not shape and not colour and not shell:
        flags.append("morphology: shape/colour/shell boli v zdroji prázdne")

    report_rows.append({
        "legacyId": legacy_id,
        "id": id_base,
        "latinName": latin_name,
        "flags": flags,
        "size_status": size_status,
    })


# ---------------------------------------------------------------------------
# 5. Kontrola duplicitných ID (per 03_DATA_ENTRY_STANDARD.md sekcia 17/18)
# ---------------------------------------------------------------------------

id_counts = {}
for r in migrated:
    id_counts[r["id"]] = id_counts.get(r["id"], 0) + 1

duplicate_ids = {k: v for k, v in id_counts.items() if v > 1}


# ---------------------------------------------------------------------------
# 6. Zápis výstupov
# ---------------------------------------------------------------------------

with open("dog_migrated.json", "w", encoding="utf-8") as f:
    json.dump(migrated, f, ensure_ascii=False, indent=2)

# --- Report v Markdowne ---

lines = []
lines.append("# Migračný report — dog.json → nová schéma\n")
lines.append(f"Dátum migrácie: {TODAY}\n")
lines.append(f"Počet záznamov: {len(migrated)}\n")
lines.append("\n---\n")

lines.append("## 0. Čo bolo prevedené automaticky (bezpečné, mechanické zmeny)\n")
lines.append("- `taxon` → `latinName`\n")
lines.append("- `host: \"pes\"` → `host: [\"Pes\"]` (pole, veľké písmeno)\n")
lines.append("- `shape` / `color` / `wall` → vnorené do `morphology.shape` / `.colour` / `.shell`\n")
lines.append("- `size` v jednoznačnom formáte `X-Y x A-B` → `micrometry.lengthMin/Max/widthMin/Max`\n")
lines.append("- Doplnené všetky chýbajúce polia zo schémy (`02_DATABASE_SPECIFICATION.md` sekcia 7) ako `null`/`[]`, nie ako vymyslené hodnoty\n")
lines.append("- `id` vygenerované ako slug z `latinName` (malé písmená, podčiarkovníky) — pôvodné `DOG-XXXX` zachované v `legacyId`\n")
lines.append("- `created` / `modified` / `version` doplnené\n")

lines.append("\n## 1. Čo NIKDY nebolo doplnené automaticky (vyžaduje odborníka)\n")
lines.append("Podľa `09_MASTER_PROMPT.md` bod 4 (\"Nikdy nevytváraj odborné údaje bez označenia, že ide o návrh\") "
              f"nasledovné polia zostali zámerne `null` pre **všetkých {len(migrated)} záznamov**:\n")
lines.append("- **`stage`** (štádium — vajíčko/larva/cysta/dospelý jedinec...) — nedá sa spoľahlivo odvodiť z pôvodných dát.\n")
lines.append("- **`sample`** (typ vzorky — trus/krv/koža...) — nedá sa spoľahlivo odvodiť z pôvodných dát.\n")
lines.append("- **`group`** — AI ponúka návrh v poli `aiSuggested.group`, ale nie je zapísaný priamo do `group`. Treba ho odborne potvrdiť.\n")
lines.append("- **`taxonomy{}`** (kingdom/phylum/.../species) — úplne prázdne, nebolo v zdroji.\n")
lines.append("- **`diagnosticSigns[]`**, **`differentialDiagnosis[]`** — pôvodné dáta mali tieto info zmiešané v `notes`, neboli štruktúrované ako pole. Treba ich ručne rozdeliť podľa `03_DATA_ENTRY_STANDARD.md` sekcie 12.\n")
lines.append("- **`images[]`**, **`references[]`**, **`methods[]`** — v zdroji vôbec neboli.\n")

lines.append("\n## 2. Kontrola duplicitných ID\n")
if duplicate_ids:
    lines.append("⚠️ **Nájdené duplicitné ID po slugifikácii:**\n")
    for dup_id, count in duplicate_ids.items():
        lines.append(f"- `{dup_id}` — {count}× (spôsobené rovnakým základom latinského názvu; "
                      f"po doplnení `stage` sa ID musí rozšíriť, napr. `_egg`, `_larva`, aby boli jedinečné)\n")
else:
    lines.append("Žiadne duplicitné ID (na úrovni základného slugu) nenájdené — "
                  "POZOR: to sa môže zmeniť, keď sa ID rozšíria o `stage`.\n")

lines.append("\n## 3. Záznamy vyžadujúce mimoriadnu pozornosť (nejednoznačný rozmer)\n")
critical = [r for r in report_rows if r["size_status"] in ("unparsed", "empty", "split")]
for r in critical:
    lines.append(f"### `{r['legacyId']}` — {r['latinName']}\n")
    for flag in r["flags"]:
        lines.append(f"- {flag}\n")
    lines.append("")

lines.append("\n## 4. Kompletný zoznam všetkých záznamov a ich flagov\n")
lines.append("| legacyId | nové id | latinName | rozmer | poznámky na kontrolu |")
lines.append("|---|---|---|---|---|")
for r in report_rows:
    flags_short = "; ".join(r["flags"])
    lines.append(f"| {r['legacyId']} | `{r['id']}` | {r['latinName']} | {r['size_status']} | {flags_short} |")

lines.append("\n## 5. Odporúčaný ďalší postup\n")
lines.append("1. Prejsť sekciu 3 (záznamy vyžadujúce pozornosť) — `Strongyloides spp.` a `Alaria alata` už boli "
              "AI rozdelené na samostatné diagnostické objekty (vajíčko/larva, resp. vajíčko/dospelý jedinec) "
              "podľa filozofie z `00_PROJECT_CONTEXT.md` sekcie 10 — over, či je rozdelenie a priradenie "
              "hodnôt správne. `Mesocestoides spp.`, `Oslerus osleri`, `Dirofilaria immitis`, `Demodex canis`, "
              "`Demodex injai` potrebujú rozmer doplniť/overiť z literatúry alebo pôvodného zdroja — AI ho "
              "zámerne nevymýšľala.\n")
lines.append(f"2. Doplniť `stage` a `sample` pre všetkých {len(migrated)} záznamov (odborník, nie AI).\n")
lines.append("3. Potvrdiť alebo opraviť `aiSuggested.group` (a pri rozdelených záznamoch aj `aiSuggested.stage`) "
              "a prepísať do `group`/`stage`, potom `aiSuggested` blok odstrániť.\n")
lines.append("4. Po doplnení `stage` rozšíriť `id` podľa vzoru `03_DATA_ENTRY_STANDARD.md` (napr. `toxocara_canis_egg`) "
              "a znovu skontrolovať duplicity.\n")
lines.append("5. Rozdeliť `notes` do `diagnosticSigns[]` (pole jednotlivých znakov, nie súvislý text) podľa "
              "`03_DATA_ENTRY_STANDARD.md` sekcie 12.\n")
lines.append("6. Zapísať zmenu do `10_CHANGELOG.md` (typ: Changed, pole: celá schéma `dog.json`).\n")

with open("migration_report.md", "w", encoding="utf-8") as f:
    f.write("\n".join(lines))

print("Hotovo.")
print(f"Záznamov spolu: {len(migrated)}")
print(f"Nejednoznačný rozmer (unparsed): {len(critical)}")
print(f"Duplicitné ID: {len(duplicate_ids)}")
