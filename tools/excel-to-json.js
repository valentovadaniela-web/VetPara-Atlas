/******************************************************************************
 * VetPara Atlas
 * Excel → JSON Converter
 ******************************************************************************/

const XLSX = require("xlsx");
const fs = require("fs");
const path = require("path");

const workbook = XLSX.readFile(
    path.join(__dirname, "..", "data", "Mikrometria - parazity.xls")
);

const sheet = workbook.Sheets["Psy"];

const rows = XLSX.utils.sheet_to_json(sheet);

console.log(rows.length);