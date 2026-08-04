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

console.log("Rows:", rows.length);

if (rows.length > 0) {

    console.log("Columns:");

    console.log(Object.keys(rows[0]));

}