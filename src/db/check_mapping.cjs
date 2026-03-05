
const XLSX = require('xlsx');
const path = require('path');

const file = path.join(process.cwd(), '1st Branch School Expenditure_160624.xlsx');
const wb = XLSX.readFile(file);
const ws = wb.Sheets['Expenditure'];
const data = XLSX.utils.sheet_to_json(ws, { header: 1 });

console.log('--- COLUMNS ---');
data[0].forEach((col, i) => console.log(`${i}: ${col}`));
console.log('--- SAMPLE ROW 1 ---');
if (data[1]) data[1].forEach((val, i) => console.log(`${i}: ${val}`));
console.log('--- SAMPLE ROW 2 ---');
if (data[2]) data[2].forEach((val, i) => console.log(`${i}: ${val}`));
