
const XLSX = require('xlsx');
const path = require('path');

const file1 = path.join(process.cwd(), '1st Branch School Expenditure_160624.xlsx');
const file2 = path.join(process.cwd(), 'Copy of 1st Branch School Expenditure_160624.xlsx');

function checkFile(filePath) {
    try {
        const wb = XLSX.readFile(filePath);
        const ws = wb.Sheets['Expenditure'];
        const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
        console.log(`File: ${path.basename(filePath)}`);
        console.log(`Columns: ${JSON.stringify(data[0])}`);
        console.log(`Sample: ${JSON.stringify(data[1] || [])}`);
        console.log('---');
    } catch (e) {
        console.log(`Error reading ${filePath}: ${e.message}`);
    }
}

checkFile(file1);
checkFile(file2);
