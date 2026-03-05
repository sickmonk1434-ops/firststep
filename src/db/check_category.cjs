
const XLSX = require('xlsx');
const path = require('path');

const file = path.join(process.cwd(), '1st Branch School Expenditure_160624.xlsx');
const wb = XLSX.readFile(file);
const ws = wb.Sheets['Expenditure'];
const data = XLSX.utils.sheet_to_json(ws, { header: 1 });

console.log('Columns:', JSON.stringify(data[0]));
console.log('Sample Row 1:', JSON.stringify(data[1] || []));
console.log('Sample Row 2:', JSON.stringify(data[2] || []));
