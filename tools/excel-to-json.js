/******************************************************************************
 * VetPara Atlas
 * Excel → JSON Converter
 ******************************************************************************/

const XLSX = require("xlsx");
const fs = require("fs");
const path = require("path");

const excelFile = path.join(
    __dirname,
    "..",
    "resources",
    "Mikrometria - parazity.xls"
);

const workbook = XLSX.readFile(excelFile);

const sheet = workbook.Sheets["Psy"];

if (!sheet) {

    console.error("Worksheet 'Psy' not found.");
    process.exit(1);

}

const rows = XLSX.utils.sheet_to_json(sheet, {
    defval: ""
});

const data = rows.map((row, index) => ({

    id: `DOG-${String(index + 1).padStart(4, "0")}`,

    host: row["hostiteľ"],

    taxon: row["druh"],

    size: row["veľkosť"],

    shape: row["tvar"],

    color: row["farba"],

    wall: row["stena"],

    notes: row["ďalšie znaky"]

}));

const output = path.join(
    __dirname,
    "..",
    "database",
    "dog.json"
);

fs.writeFileSync(
    output,
    JSON.stringify(data, null, 2),
    "utf8"
);

console.log(`Created ${output}`);
console.log(`Records: ${data.length}`);