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
# 4. Hlavná migrácia
# ---------------------------------------------------------------------------

migrated = []
report_rows = []

for rec in original:
    legacy_id = rec.get("id", "")
    latin_raw = rec.get("taxon", "").strip()
    latin_name = latin_raw

    id_base = slugify(latin_name) if latin_name else legacy_id.lower()

    host_list, host_missing = normalize_host(rec.get("host", ""))

    size_raw = rec.get("size", "")
    micrometry, size_status, size_note = parse_size(str(size_raw))

    shape = clean_text(rec.get("shape"))
    colour = clean_text(rec.get("color"))
    shell = clean_text(rec.get("wall"))
    notes_original = clean_text(rec.get("notes"))

    group_suggestion = GROUP_SUGGESTIONS.get(latin_name)

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
              "nasledovné polia zostali zámerne `null` pre **všetkých 35 záznamov**:\n")
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
critical = [r for r in report_rows if r["size_status"] == "unparsed"]
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
lines.append("1. Prejsť sekciu 3 (kritické záznamy s nejednoznačným rozmerom) — najmä `Strongyloides spp.` "
              "(kombinuje vajíčko aj larvu — podľa filozofie \"diagnostický objekt\" z `00_PROJECT_CONTEXT.md` "
              "sekcie 10 by mali byť **dva samostatné záznamy**, nie jeden).\n")
lines.append("2. Doplniť `stage` a `sample` pre všetkých 35 záznamov (odborník, nie AI).\n")
lines.append("3. Potvrdiť alebo opraviť `aiSuggested.group` a prepísať do `group`, potom `aiSuggested` blok odstrániť.\n")
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
