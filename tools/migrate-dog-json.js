```javascript
#!/usr/bin/env node

/**
 * VetPara Atlas
 * Poloautomatická migrácia dog.json
 *
 * Vstup:
 *   database/dog.json
 *
 * Výstup:
 *   database/dog.migrated.json
 *   database/dog.migration-report.json
 *
 * DÔLEŽITÉ:
 * - pôvodný dog.json sa NEPREPISUJE
 * - odborné údaje sa NEHÁDAJÚ
 * - nejednoznačné rozmery idú do reportu
 * - stage/sample/taxonomy sa automaticky nevymýšľajú
 */

const fs = require("fs");
const path = require("path");


// ============================================================
// CESTY
// ============================================================

const ROOT = path.resolve(__dirname, "..");

const INPUT = path.join(
    ROOT,
    "database",
    "dog.json"
);

const OUTPUT = path.join(
    ROOT,
    "database",
    "dog.migrated.json"
);

const REPORT = path.join(
    ROOT,
    "database",
    "dog.migration-report.json"
);


// ============================================================
// POMOCNÉ FUNKCIE
// ============================================================

function readJson(file) {

    return JSON.parse(
        fs.readFileSync(file, "utf8")
    );

}


function writeJson(file, data) {

    fs.writeFileSync(
        file,
        JSON.stringify(data, null, 2) + "\n",
        "utf8"
    );

}


function asArray(value) {

    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {
        return [];
    }

    if (Array.isArray(value)) {

        return value.filter(Boolean);

    }

    return [value];

}


function firstNonEmpty(...values) {

    return values.find(
        value =>
            value !== undefined &&
            value !== null &&
            String(value).trim() !== ""
    );

}


// ============================================================
// NORMALIZÁCIA HOSTITEĽA
// ============================================================

function normalizeHost(value) {

    const values = asArray(value);

    const result = values
        .map(value => {

            const text = String(value).trim();

            if (!text) {
                return null;
            }

            const lower =
                text.toLocaleLowerCase("sk-SK");

            if (
                lower === "pes" ||
                lower === "pes domáci" ||
                lower === "canis familiaris"
            ) {

                return "Pes";

            }

            return text;

        })
        .filter(Boolean);

    return [
        ...new Set(result)
    ];

}


// ============================================================
// NORMALIZÁCIA ID
// ============================================================

function slugifyId(value) {

    return String(value || "")
        .normalize("NFD")
        .replace(
            /[\u0300-\u036f]/g,
            ""
        )
        .replace(
            /[^\p{L}\p{N}\s_-]/gu,
            ""
        )
        .trim()
        .toLowerCase()
        .replace(
            /\s+/g,
            "_"
        )
        .replace(
            /-+/g,
            "_"
        )
        .replace(
            /_+/g,
            "_"
        );

}


// ============================================================
// MIKROMETRIA
// ============================================================
//
// Bezpečne spracujeme napr.:
//
// 75-90 x 65-75
// 75 - 90 x 65 - 75
// 75 x 85
// 34-39 x 31-35
//
// NEBUDEME hádať:
//
// 75-90
// 300
// v: 62-64 x 32-36, l: 230-350
//
// ============================================================

function parseMicrometry(raw) {

    if (
        raw === null ||
        raw === undefined ||
        raw === ""
    ) {

        return {

            value: null,

            status: "missing",

            reason: "missing_size"

        };

    }


    const text = String(raw)

        .replace(/µm/gi, "")
        .replace(/μm/gi, "")

        .replace(
            /\s+/g,
            " "
        )

        .trim();


    // --------------------------------------------------------
    // VIAC STÁDIÍ / VIAC OBJEKTOV
    // --------------------------------------------------------

    if (
        /\b[vl]\s*:/i.test(text) &&
        /[,;]/.test(text)
    ) {

        return {

            value: null,

            status: "manual",

            reason:
                "multiple_stages_or_objects",

            raw: text

        };

    }


    // --------------------------------------------------------
    // RANGE x RANGE
    //
    // napr.
    // 75-90 x 65-75
    // --------------------------------------------------------

    let match = text.match(

        /^
        (\d+(?:[.,]\d+)?)
        \s*[-–]\s*
        (\d+(?:[.,]\d+)?)
        \s*[x×]\s*
        (\d+(?:[.,]\d+)?)
        \s*[-–]\s*
        (\d+(?:[.,]\d+)?)
        $
        /ix

    );


    if (match) {

        return {

            value: {

                lengthMin:
                    Number(
                        match[1].replace(",", ".")
                    ),

                lengthMax:
                    Number(
                        match[2].replace(",", ".")
                    ),

                widthMin:
                    Number(
                        match[3].replace(",", ".")
                    ),

                widthMax:
                    Number(
                        match[4].replace(",", ".")
                    ),

                unit: "µm"

            },

            status: "converted"

        };

    }


    // --------------------------------------------------------
    // RANGE / SINGLE x RANGE / SINGLE
    //
    // napr.
    // 75 x 85
    // 75-90 x 65
    // 75 x 65-75
    // --------------------------------------------------------

    match = text.match(

        /^
        (\d+(?:[.,]\d+)?)
        (?:
            \s*[-–]\s*
            (\d+(?:[.,]\d+)?)
        )?
        \s*[x×]\s*
        (\d+(?:[.,]\d+)?)
        (?:
            \s*[-–]\s*
            (\d+(?:[.,]\d+)?)
        )?
        $
        /ix

    );


    if (match) {

        const lengthMin =
            Number(
                match[1].replace(",", ".")
            );

        const lengthMax =
            match[2]
                ? Number(
                    match[2].replace(",", ".")
                )
                : lengthMin;


        const widthMin =
            Number(
                match[3].replace(",", ".")
            );

        const widthMax =
            match[4]
                ? Number(
                    match[4].replace(",", ".")
                )
                : widthMin;


        return {

            value: {

                lengthMin,

                lengthMax,

                widthMin,

                widthMax,

                unit: "µm"

            },

            status: "converted"

        };

    }


    // --------------------------------------------------------
    // IBA JEDEN ROZSAH
    //
    // napr.
    // 75-90
    //
    // Šírku NEHÁDAME.
    // --------------------------------------------------------

    if (
        /^\d+(?:[.,]\d+)?\s*[-–]\s*\d+(?:[.,]\d+)?$/
            .test(text)
    ) {

        return {

            value: null,

            status: "manual",

            reason:
                "one_dimension_only",

            raw: text

        };

    }


    // --------------------------------------------------------
    // JEDNO ČÍSLO
    //
    // napr.
    // 300
    //
    // Jednotku ani význam nehádam.
    // --------------------------------------------------------

    if (
        /^\d+(?:[.,]\d+)?$/
            .test(text)
    ) {

        return {

            value: null,

            status: "manual",

            reason:
                "bare_number_without_confirmed_unit",

            raw: text

        };

    }


    // --------------------------------------------------------
    // NEZNÁMY FORMÁT
    // --------------------------------------------------------

    return {

        value: null,

        status: "manual",

        reason:
            "unrecognized_size_format",

        raw: text

    };

}


// ============================================================
// NOVÁ ŠTRUKTÚRA ZÁZNAMU
// ============================================================

function createEmptyRecord() {

    return {

        id: "",

        latinName: "",

        slovakName: null,

        taxonomy: {},

        host: [],

        sample: null,

        stage: null,

        group: null,

        methods: [],

        micrometry: null,

        morphology: {

            shape: null,

            colour: null,

            shell: null,

            operculum: null,

            contents: null,

            texture: null,

            remarks: null

        },

        diagnosticSigns: [],

        differentialDiagnosis: [],

        zoonosis: null,

        images: [],

        references: [],

        notes: null

    };

}


// ============================================================
// MIGRÁCIA JEDNÉHO ZÁZNAMU
// ============================================================

function migrateRecord(source, index) {

    const output =
        createEmptyRecord();

    const review = [];


    // --------------------------------------------------------
    // ID
    // --------------------------------------------------------

    output.id =
        slugifyId(

            firstNonEmpty(

                source.id,

                source.latinName,

                source.taxon,

                `record_${index + 1}`

            )

        );


    // --------------------------------------------------------
    // latinName
    //
    // taxon -> latinName
    // --------------------------------------------------------

    output.latinName =

        firstNonEmpty(

            source.latinName,

            source.taxon

        ) || "";


    // --------------------------------------------------------
    // HOST
    // --------------------------------------------------------

    output.host =

        normalizeHost(

            firstNonEmpty(

                source.host,

                source.hosts

            )

        );


    // --------------------------------------------------------
    // POVINNÉ / ZNÁME POLIA
    //
    // Nič nevymýšľame.
    // --------------------------------------------------------

    output.sample =

        firstNonEmpty(

            source.sample,

            source.vzorka

        ) ?? null;


    output.stage =

        firstNonEmpty(

            source.stage,

            source.stadium,

            source["štádium"]

        ) ?? null;


    output.group =

        firstNonEmpty(

            source.group

        ) ?? null;


    // --------------------------------------------------------
    // TAXONÓMIA
    // --------------------------------------------------------

    if (
        source.taxonomy &&
        typeof source.taxonomy === "object"
    ) {

        output.taxonomy =
            source.taxonomy;

    }


    // --------------------------------------------------------
    // METHODS
    // --------------------------------------------------------

    output.methods =

        asArray(

            source.methods ??
            source.method

        );


    // --------------------------------------------------------
    // DIAGNOSTICKÉ ZNAKY
    // --------------------------------------------------------

    output.diagnosticSigns =

        asArray(

            source.diagnosticSigns ??
            source.diagnostic_signs

        );


    // --------------------------------------------------------
    // DIFERENCIÁLNA DIAGNOSTIKA
    // --------------------------------------------------------

    output.differentialDiagnosis =

        asArray(

            source.differentialDiagnosis ??
            source.differential

        );


    // --------------------------------------------------------
    // OSTATNÉ
    // --------------------------------------------------------

    output.images =
        asArray(source.images);

    output.references =
        asArray(source.references);

    output.zoonosis =
        source.zoonosis ?? null;

    output.notes =
        source.notes ?? null;


    // --------------------------------------------------------
    // MORFOLÓGIA
    //
    // shape/color/wall
    // ->
    // morphology
    // --------------------------------------------------------

    const morphologySource =

        source.morphology &&
        typeof source.morphology === "object"

            ? source.morphology

            : {};


    output.morphology = {

        shape:

            firstNonEmpty(

                morphologySource.shape,

                source.shape

            ) ?? null,


        colour:

            firstNonEmpty(

                morphologySource.colour,

                morphologySource.color,

                source.colour,

                source.color

            ) ?? null,


        shell:

            firstNonEmpty(

                morphologySource.shell,

                morphologySource.wall,

                source.shell,

                source.wall

            ) ?? null,


        operculum:

            morphologySource.operculum ??

            source.operculum ??

            null,


        contents:

            morphologySource.contents ??

            source.contents ??

            null,


        texture:

            morphologySource.texture ??

            source.texture ??

            null,


        remarks:

            morphologySource.remarks ??

            null

    };


    // --------------------------------------------------------
    // MIKROMETRIA
    // --------------------------------------------------------

    const rawSize =

        firstNonEmpty(

            source.size,

            source.micrometryText

        );


    if (

        source.micrometry &&

        typeof source.micrometry === "object" &&

        !Array.isArray(source.micrometry)

    ) {

        const mm =
            source.micrometry;


        const numeric =

            [
                "lengthMin",
                "lengthMax",
                "widthMin",
                "widthMax"
            ].every(

                field =>

                    mm[field] === null ||

                    mm[field] === undefined ||

                    Number.isFinite(
                        Number(mm[field])
                    )

            );


        if (numeric) {

            output.micrometry = {

                lengthMin:
                    mm.lengthMin ?? null,

                lengthMax:
                    mm.lengthMax ?? null,

                widthMin:
                    mm.widthMin ?? null,

                widthMax:
                    mm.widthMax ?? null,

                unit:
                    mm.unit || "µm"

            };

        }

        else {

            review.push({

                field: "micrometry",

                reason:
                    "existing_micrometry_contains_non_numeric_values"

            });

        }

    }

    else {

        const parsed =
            parseMicrometry(rawSize);


        if (
            parsed.status === "converted"
        ) {

            output.micrometry =
                parsed.value;

        }

        else if (
            parsed.status === "manual"
        ) {

            review.push({

                field: "micrometry",

                reason:
                    parsed.reason,

                raw:
                    parsed.raw ?? rawSize

            });

        }

    }


    // --------------------------------------------------------
    // POVINNÉ POLIA
    // --------------------------------------------------------

    if (!output.latinName) {

        review.push({

            field: "latinName",

            reason:
                "missing_latinName"

        });

    }


    if (!output.sample) {

        review.push({

            field: "sample",

            reason:
                "missing_sample_cannot_be_safely_inferred"

        });

    }


    if (!output.stage) {

        review.push({

            field: "stage",

            reason:
                "missing_stage_cannot_be_safely_inferred"

        });

    }


    if (
        !output.taxonomy ||
        Object.keys(output.taxonomy).length === 0
    ) {

        review.push({

            field: "taxonomy",

            reason:
                "missing_taxonomy"

        });

    }


    // --------------------------------------------------------
    // PODOZRENIE NA VIAC DIAGNOSTICKÝCH OBJEKTOV
    // --------------------------------------------------------

    const sourceText =
        JSON.stringify(source);


    if (
        /\b[vl]\s*:/i
            .test(sourceText)
    ) {

        review.push({

            field: "diagnosticObject",

            reason:
                "possible_multiple_stages_or_objects_manual_split_required"

        });

    }


    return {

        output,

        review

    };

}


// ============================================================
// KONTROLA VSTUPU
// ============================================================

if (!fs.existsSync(INPUT)) {

    console.error("");

    console.error(
        "CHYBA: Súbor dog.json neexistuje:"
    );

    console.error(INPUT);

    console.error("");

    console.error(
        "Skontroluj, či máš dog.json v:"
    );

    console.error(
        "VetPara-Atlas/database/"
    );

    process.exit(2);

}


// ============================================================
// NAČÍTANIE
// ============================================================

const input =
    readJson(INPUT);


let records;


if (Array.isArray(input)) {

    records = input;

}

else if (
    Array.isArray(input.records)
) {

    records =
        input.records;

}

else {

    console.error(
        "CHYBA: dog.json musí byť pole záznamov alebo objekt s poľom records."
    );

    process.exit(3);

}


// ============================================================
// REPORT
// ============================================================

const migrated = [];

const report = {

    generatedAt:
        new Date().toISOString(),

    input:
        "database/dog.json",

    output:
        "database/dog.migrated.json",

    summary: {

        totalRecords:
            records.length,

        recordsWithoutManualReview:
            0,

        recordsWithManualReview:
            0,

        sizeConverted:
            0,

        sizeManualReview:
            0

    },

    manualReview: [],

    warnings: []

};


const ids =
    new Map();


// ============================================================
// SPRACOVANIE
// ============================================================

records.forEach(

    (source, index) => {

        const result =
            migrateRecord(
                source,
                index
            );


        const output =
            result.output;

        const review =
            result.review;


        // ----------------------------------------------------
        // DUPLICITNÉ ID
        // ----------------------------------------------------

        if (ids.has(output.id)) {

            review.push({

                field: "id",

                reason:
                    `duplicate_id_after_normalization_conflicts_with_record_${ids.get(output.id) + 1}`

            });

        }

        else {

            ids.set(
                output.id,
                index
            );

        }


        // ----------------------------------------------------
        // ŠTATISTIKY
        // ----------------------------------------------------

        if (output.micrometry) {

            report.summary.sizeConverted++;

        }


        const sizeReview =
            review.some(
                item =>
                    item.field === "micrometry"
            );


        if (sizeReview) {

            report.summary.sizeManualReview++;

        }


        if (review.length > 0) {

            report.summary.recordsWithManualReview++;


            report.manualReview.push({

                index,

                id:
                    output.id,

                latinName:
                    output.latinName,

                issues:
                    review

            });

        }

        else {

            report.summary.recordsWithoutManualReview++;

        }


        migrated.push(output);

    }

);


// ============================================================
// ZÁPIS
// ============================================================

writeJson(
    OUTPUT,
    migrated
);

writeJson(
    REPORT,
    report
);


// ============================================================
// VÝSLEDOK
// ============================================================

console.log("");

console.log(
    "=========================================="
);

console.log(
    "VetPara Atlas – migrácia dog.json"
);

console.log(
    "=========================================="
);

console.log("");

console.log(
    `Počet záznamov:        ${report.summary.totalRecords}`
);

console.log(
    `Bez ručnej kontroly:   ${report.summary.recordsWithoutManualReview}`
);

console.log(
    `Vyžaduje kontrolu:     ${report.summary.recordsWithManualReview}`
);

console.log(
    `Mikrometria prevedená: ${report.summary.sizeConverted}`
);

console.log(
    `Mikrometria kontrola:  ${report.summary.sizeManualReview}`
);

console.log("");

console.log(
    "Výstup:"
);

console.log(
    OUTPUT
);

console.log("");

console.log(
    "Report:"
);

console.log(
    REPORT
);

console.log("");

console.log(
    "Pôvodný dog.json NEBOL zmenený."
);

console.log("");
```
