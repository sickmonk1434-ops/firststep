
const XLSX = require('xlsx');
const path = require('path');

const filePath = path.join(__dirname, '..', '..', 'Copy of 1st Branch School Expenditure_160624.xlsx');
const workbook = XLSX.readFile(filePath);
const sheet = workbook.Sheets['Expenditure'];
const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

console.log('Columns:', JSON.stringify(data[0]));
console.log('Sample Row:', JSON.stringify(data[1]));
