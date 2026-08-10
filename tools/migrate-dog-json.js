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
 * Bezpečnostné pravidlá:
 * - pôvodný dog.json sa nikdy neprepíše
 * - odborné údaje sa nedopĺňajú odhadom
 * - nejednoznačná mikrometria ide do manualReview
 * - kombinované diagnostické objekty sa automaticky nerozdeľujú
 * - created/modified/version sa doplnia ako migračné metadáta
 *
 * Spustenie:
 *   node tools/migrate-dog-json.js
 *
 * Ak má projekt package.json s "type": "module":
 *   premenuj súbor na migrate-dog-json.cjs
 *   a spusti:
 *   node tools/migrate-dog-json.cjs
 */

"use strict";

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

const MIGRATION_TIMESTAMP =
    new Date().toISOString();

const DEFAULT_VERSION = "1.0.0";


// ============================================================
// POMOCNÉ FUNKCIE
// ============================================================

function readJson(file) {

    return JSON.parse(
        fs.readFileSync(
            file,
            "utf8"
        )
    );

}


function writeJson(file, data) {

    fs.writeFileSync(
        file,
        JSON.stringify(
            data,
            null,
            2
        ) + "\n",
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
// HOSTITEĽ
// ============================================================

function normalizeHost(value) {

    const values =
        asArray(value);


    return [

        ...new Set(

            values

                .map(value => {

                    const text =
                        String(value).trim();


                    if (!text) {

                        return null;

                    }


                    const lower =
                        text.toLocaleLowerCase(
                            "sk-SK"
                        );


                    if (

                        lower === "pes" ||
                        lower === "pes domáci" ||
                        lower === "canis familiaris"

                    ) {

                        return "Pes";

                    }


                    return text;

                })

                .filter(Boolean)

        )

    ];

}


// ============================================================
// ID
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

function parseMicrometry(raw) {

    if (
        raw === null ||
        raw === undefined ||
        raw === ""
    ) {

        return {

            value: null,

            status: "missing",

            reason:
                "missing_size"

        };

    }


    const text =

        String(raw)

            .replace(
                /µm/gi,
                ""
            )

            .replace(
                /μm/gi,
                ""
            )

            .replace(
                /\s+/g,
                " "
            )

            .trim();


    // --------------------------------------------------------
    // VIAC STÁDIÍ / OBJEKTOV
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

        /^(\d+(?:[.,]\d+)?)\s*[-–]\s*(\d+(?:[.,]\d+)?)\s*[x×]\s*(\d+(?:[.,]\d+)?)\s*[-–]\s*(\d+(?:[.,]\d+)?)$/i

    );


    if (match) {

        return {

            value: {

                lengthMin:
                    Number(
                        match[1].replace(
                            ",",
                            "."
                        )
                    ),

                lengthMax:
                    Number(
                        match[2].replace(
                            ",",
                            "."
                        )
                    ),

                widthMin:
                    Number(
                        match[3].replace(
                            ",",
                            "."
                        )
                    ),

                widthMax:
                    Number(
                        match[4].replace(
                            ",",
                            "."
                        )
                    ),

                unit: "µm"

            },

            status:
                "converted"

        };

    }


    // --------------------------------------------------------
    // SINGLE / RANGE x SINGLE / RANGE
    //
    // napr.
    // 75 x 85
    // 75-90 x 65
    // 75 x 65-75
    // --------------------------------------------------------

    match = text.match(

        /^(\d+(?:[.,]\d+)?)(?:\s*[-–]\s*(\d+(?:[.,]\d+)?))?\s*[x×]\s*(\d+(?:[.,]\d+)?)(?:\s*[-–]\s*(\d+(?:[.,]\d+)?))?$/i

    );


    if (match) {

        const lengthMin =

            Number(
                match[1].replace(
                    ",",
                    "."
                )
            );


        const lengthMax =

            match[2]

                ? Number(
                    match[2].replace(
                        ",",
                        "."
                    )
                )

                : lengthMin;


        const widthMin =

            Number(
                match[3].replace(
                    ",",
                    "."
                )
            );


        const widthMax =

            match[4]

                ? Number(
                    match[4].replace(
                        ",",
                        "."
                    )
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

            status:
                "converted"

        };

    }


    // --------------------------------------------------------
    // PARENTHETICKÝ RANGE
    //
    // napr.
    // 69,4 x 43,6
    // (60,3-75,9 x 39,8-51,8)
    //
    // Použije sa iba jasne uvedený rozsah.
    // --------------------------------------------------------

    match = text.match(

        /\(\s*(\d+(?:[.,]\d+)?)\s*[-–]\s*(\d+(?:[.,]\d+)?)\s*[x×]\s*(\d+(?:[.,]\d+)?)\s*[-–]\s*(\d+(?:[.,]\d+)?)\s*\)/

    );


    if (match) {

        return {

            value: {

                lengthMin:
                    Number(
                        match[1].replace(
                            ",",
                            "."
                        )
                    ),

                lengthMax:
                    Number(
                        match[2].replace(
                            ",",
                            "."
                        )
                    ),

                widthMin:
                    Number(
                        match[3].replace(
                            ",",
                            "."
                        )
                    ),

                widthMax:
                    Number(
                        match[4].replace(
                            ",",
                            "."
                        )
                    ),

                unit: "µm"

            },

            status:
                "converted",

            reason:
                "parenthetical_range_used"

        };

    }


    // --------------------------------------------------------
    // JEDEN ROZSAH
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

            status:
                "manual",

            reason:
                "one_dimension_only",

            raw:
                text

        };

    }


    // --------------------------------------------------------
    // JEDNO ČÍSLO
    //
    // napr.
    // 300
    //
    // Jednotku NEHÁDAME.
    // --------------------------------------------------------

    if (

        /^\d+(?:[.,]\d+)?$/
            .test(text)

    ) {

        return {

            value: null,

            status:
                "manual",

            reason:
                "bare_number_without_confirmed_unit",

            raw:
                text

        };

    }


    // --------------------------------------------------------
    // NEZNÁMY FORMÁT
    // --------------------------------------------------------

    return {

        value: null,

        status:
            "manual",

        reason:
            "unrecognized_size_format",

        raw:
            text

    };

}


// ============================================================
// NOVÝ ZÁZNAM PODĽA SCHÉMY
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

        notes: null,

        created: null,

        modified: null,

        version: null

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
    //
    // Ak existuje source.id:
    // DOG-0001 -> dog_0001
    //
    // ID zámerne nemeníme na taxon_stage,
    // pretože stage nemusí byť známy.
    // --------------------------------------------------------

    const originalId =
        firstNonEmpty(
            source.id
        );


    output.id =

        slugifyId(

            originalId ||

            source.latinName ||

            source.taxon ||

            ("record_" + (index + 1))

        );


    // --------------------------------------------------------
    // LATIN NAME
    //
    // taxon -> latinName
    // --------------------------------------------------------

    output.latinName =

        firstNonEmpty(

            source.latinName,

            source.taxon

        ) || "";


    // --------------------------------------------------------
    // SLOVAK NAME
    // --------------------------------------------------------

    output.slovakName =

        firstNonEmpty(
            source.slovakName
        ) ?? null;


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
    // SAMPLE
    // --------------------------------------------------------

    output.sample =

        firstNonEmpty(

            source.sample,

            source.vzorka

        ) ?? null;


    // --------------------------------------------------------
    // STAGE
    // --------------------------------------------------------

    output.stage =

        firstNonEmpty(

            source.stage,

            source.stadium,

            source["štádium"]

        ) ?? null;


    // --------------------------------------------------------
    // GROUP
    // --------------------------------------------------------

    output.group =

        firstNonEmpty(
            source.group
        ) ?? null;


    // --------------------------------------------------------
    // TAXONOMY
    // --------------------------------------------------------

    if (

        source.taxonomy &&

        typeof source.taxonomy === "object" &&

        !Array.isArray(source.taxonomy)

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
    // DIAGNOSTIC SIGNS
    // --------------------------------------------------------

    output.diagnosticSigns =

        asArray(

            source.diagnosticSigns ??

            source.diagnostic_signs

        );


    // --------------------------------------------------------
    // DIFFERENTIAL DIAGNOSIS
    // --------------------------------------------------------

    output.differentialDiagnosis =

        asArray(

            source.differentialDiagnosis ??

            source.differential

        );


    // --------------------------------------------------------
    // ZOONOSIS
    // --------------------------------------------------------

    output.zoonosis =

        source.zoonosis ??
        null;


    // --------------------------------------------------------
    // IMAGES / REFERENCES / NOTES
    // --------------------------------------------------------

    output.images =
        asArray(source.images);

    output.references =
        asArray(source.references);

    output.notes =
        source.notes ??
        null;


    // --------------------------------------------------------
    // MORPHOLOGY
    //
    // shape/color/wall
    // ->
    // morphology
    // --------------------------------------------------------

    const morphologySource =

        source.morphology &&

        typeof source.morphology === "object" &&

        !Array.isArray(source.morphology)

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

            firstNonEmpty(

                morphologySource.operculum,

                source.operculum

            ) ?? null,


        contents:

            firstNonEmpty(

                morphologySource.contents,

                source.contents

            ) ?? null,


        texture:

            morphologySource.texture ??
            null,


        remarks:

            morphologySource.remarks ??
            null

    };


    // --------------------------------------------------------
    // MIKROMETRIA
    // --------------------------------------------------------

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

                field:
                    "micrometry",

                reason:
                    "existing_micrometry_contains_non_numeric_values"

            });

        }

    }

    else {

        const rawSize =

            firstNonEmpty(

                source.size,

                source.micrometryText

            );


        const parsed =

            parseMicrometry(
                rawSize
            );


        if (

            parsed.status ===
            "converted"

        ) {

            output.micrometry =
                parsed.value;

        }

        else {

            review.push({

                field:
                    "micrometry",

                reason:
                    parsed.reason,

                raw:
                    parsed.raw ??
                    rawSize

            });

        }

    }


    // ========================================================
    // METADÁTA
    // ========================================================

    /*
     * Ak existujú v pôvodnom zázname,
     * zachováme ich.
     *
     * Ak chýbajú, doplníme:
     *
     * created  = čas migrácie
     * modified = čas migrácie
     * version  = 1.0.0
     *
     * Ide o technické migračné metadáta,
     * nie o tvrdenie, kedy vznikol odborný záznam.
     */

    output.created =

        firstNonEmpty(
            source.created
        ) ||

        MIGRATION_TIMESTAMP;


    output.modified =

        firstNonEmpty(
            source.modified
        ) ||

        MIGRATION_TIMESTAMP;


    output.version =

        firstNonEmpty(
            source.version
        ) ||

        DEFAULT_VERSION;


    // --------------------------------------------------------
    // CHÝBAJÚCE ODBORNÉ ÚDAJE
    // --------------------------------------------------------

    if (!output.latinName) {

        review.push({

            field:
                "latinName",

            reason:
                "missing_latinName"

        });

    }


    if (!output.sample) {

        review.push({

            field:
                "sample",

            reason:
                "missing_sample_cannot_be_safely_inferred"

        });

    }


    if (!output.stage) {

        review.push({

            field:
                "stage",

            reason:
                "missing_stage_cannot_be_safely_inferred"

        });

    }


    if (

        !output.taxonomy ||

        Object.keys(
            output.taxonomy
        ).length === 0

    ) {

        review.push({

            field:
                "taxonomy",

            reason:
                "missing_taxonomy"

        });

    }


    // --------------------------------------------------------
    // VIAC DIAGNOSTICKÝCH OBJEKTOV
    // --------------------------------------------------------

    const sourceText =
        JSON.stringify(source);


    if (

        /\b[vl]\s*:/i.test(
            sourceText
        )

    ) {

        review.push({

            field:
                "diagnosticObject",

            reason:
                "possible_multiple_stages_or_objects_manual_split_required"

        });

    }


    // --------------------------------------------------------
    // NORMALIZÁCIA ID
    // --------------------------------------------------------

    if (originalId) {

        const normalizedId =
            slugifyId(
                originalId
            );


        if (
            normalizedId !==
            originalId
        ) {

            review.push({

                field:
                    "id",

                reason:
                    "id_normalized_from_original",

                original:
                    originalId,

                migrated:
                    normalizedId

            });

        }

    }


    return {

        output,

        review

    };

}


// ============================================================
// DUPLICITNÉ ID
// ============================================================

function checkDuplicateIds(
    migrated,
    report
) {

    const ids =
        new Map();


    migrated.forEach(

        (record, index) => {

            if (
                ids.has(record.id)
            ) {

                report.manualReview.push({

                    index,

                    id:
                        record.id,

                    latinName:
                        record.latinName,

                    issues: [

                        {

                            field:
                                "id",

                            reason:
                                "duplicate_id_after_normalization",

                            conflictsWithRecord:
                                ids.get(record.id) + 1

                        }

                    ]

                });

            }

            else {

                ids.set(
                    record.id,
                    index
                );

            }

        }

    );

}


// ============================================================
// MAIN
// ============================================================

function main() {

    // --------------------------------------------------------
    // EXISTENCIA INPUTU
    // --------------------------------------------------------

    if (!fs.existsSync(INPUT)) {

        console.error("");

        console.error(
            "CHYBA: dog.json neexistuje:"
        );

        console.error(
            INPUT
        );

        console.error("");

        console.error(
            "Skontroluj:"
        );

        console.error(
            "VetPara-Atlas/database/dog.json"
        );

        process.exit(2);

    }


    // --------------------------------------------------------
    // NAČÍTANIE JSON
    // --------------------------------------------------------

    let input;


    try {

        input =
            readJson(INPUT);

    }

    catch (error) {

        console.error("");

        console.error(
            "CHYBA: dog.json nie je platný JSON."
        );

        console.error(
            error.message
        );

        process.exit(3);

    }


    // --------------------------------------------------------
    // ZÍSKANIE ZÁZNAMOV
    // --------------------------------------------------------

    let records;


    if (
        Array.isArray(input)
    ) {

        records =
            input;

    }

    else if (
        Array.isArray(input.records)
    ) {

        records =
            input.records;

    }

    else {

        console.error("");

        console.error(
            "CHYBA: dog.json musí byť pole záznamov alebo objekt s poľom records."
        );

        process.exit(4);

    }


    // --------------------------------------------------------
    // REPORT
    // --------------------------------------------------------

    const report = {

        generatedAt:
            MIGRATION_TIMESTAMP,

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
                0,

            idsNormalized:
                0

        },


        manualReview: [],


        metadata: {

            createdFallback:
                MIGRATION_TIMESTAMP,

            modifiedFallback:
                MIGRATION_TIMESTAMP,

            defaultVersion:
                DEFAULT_VERSION

        }

    };


    // --------------------------------------------------------
    // MIGRÁCIA
    // --------------------------------------------------------

    const migrated = [];


    records.forEach(

        (source, index) => {

            const result =

                migrateRecord(
                    source,
                    index
                );


            migrated.push(
                result.output
            );


            const review =
                result.review;


            // ------------------------------------------------
            // MIKROMETRIA
            // ------------------------------------------------

            if (
                result.output.micrometry
            ) {

                report.summary
                    .sizeConverted++;

            }


            if (

                review.some(
                    item =>
                        item.field ===
                        "micrometry"
                )

            ) {

                report.summary
                    .sizeManualReview++;

            }


            // ------------------------------------------------
            // ID
            // ------------------------------------------------

            if (

                review.some(

                    item =>

                        item.field ===
                        "id" &&

                        item.reason ===
                        "id_normalized_from_original"

                )

            ) {

                report.summary
                    .idsNormalized++;

            }


            // ------------------------------------------------
            // MANUAL REVIEW
            // ------------------------------------------------

            if (
                review.length > 0
            ) {

                report.summary
                    .recordsWithManualReview++;


                report.manualReview.push({

                    index,

                    id:
                        result.output.id,

                    latinName:
                        result.output.latinName,

                    issues:
                        review

                });

            }

            else {

                report.summary
                    .recordsWithoutManualReview++;

            }

        }

    );


    // --------------------------------------------------------
    // DUPLICITY
    // --------------------------------------------------------

    checkDuplicateIds(
        migrated,
        report
    );


    // --------------------------------------------------------
    // ZÁPIS
    // --------------------------------------------------------

    writeJson(
        OUTPUT,
        migrated
    );


    writeJson(
        REPORT,
        report
    );


    // --------------------------------------------------------
    // VÝSTUP
    // --------------------------------------------------------

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
        `Záznamov:              ${report.summary.totalRecords}`
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

    console.log(
        `ID normalizované:      ${report.summary.idsNormalized}`
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

}


main();
```
