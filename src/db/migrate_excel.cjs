// migrate_excel.cjs — Plain Node.js CJS script
// Run with: node src/db/migrate_excel.cjs

const XLSX = require("xlsx");
const { createClient } = require("@libsql/client");
const fs = require("fs");
const path = require("path");

// Load env from .env file manually
const envPath = path.join(__dirname, "../../.env");
if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, "utf8").split("\n");
    for (const line of lines) {
        const [k, ...v] = line.trim().split("=");
        if (k && v.length) process.env[k.trim()] = v.join("=").trim();
    }
}

const db = createClient({
    url: process.env.VITE_TURSO_DATABASE_URL,
    authToken: process.env.VITE_TURSO_AUTH_TOKEN,
});

// Helper: Convert Excel serial date number to ISO date string
function excelDateToISO(serial) {
    if (!serial && serial !== 0) return "";
    if (typeof serial === "string") return serial;
    if (typeof serial !== "number") return String(serial);
    const parsed = XLSX.SSF.parse_date_code(serial);
    if (!parsed) return String(serial);
    const d = new Date(parsed.y, parsed.m - 1, parsed.d);
    return d.toISOString().split("T")[0];
}

function safeNum(v) {
    const n = Number(v);
    return isNaN(n) ? 0 : n;
}

function safeStr(v) {
    if (v === null || v === undefined) return "";
    return String(v).trim();
}

async function createTables() {
    const sqlPath = path.join(__dirname, "schema_excel.sql");
    const sql = fs.readFileSync(sqlPath, "utf8");
    const statements = sql.split(";").map(s => s.trim()).filter(s => s.length > 0);
    for (const stmt of statements) {
        await db.execute(stmt);
    }
    console.log("✅ Tables created/verified");
}

async function seedExpenditure(ws) {
    await db.execute("DELETE FROM expenditure");
    const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });
    let count = 0;
    for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        const category = safeStr(row[1]);
        const desc = safeStr(row[2]);
        const type = safeStr(row[3]);
        const amount = safeNum(row[4]);
        const mode = safeStr(row[5]) || "Cash";
        const remark = safeStr(row[6]);
        const estimation = safeNum(row[7]);
        if (!desc && !category) continue;
        await db.execute({
            sql: "INSERT INTO expenditure (date, category, description, type, amount, mode, remark, estimation) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            args: [excelDateToISO(row[0]), category, desc, type, amount, mode, remark, estimation],
        });
        count++;
    }
    console.log(`✅ Expenditure: ${count} rows`);
}

async function seedAdmissions(ws, year) {
    const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });
    let count = 0;
    for (let i = 2; i < rows.length; i++) {
        const row = rows[i];
        const studentId = safeStr(row[0]);
        const studentName = safeStr(row[3]);
        if (!studentId && !studentName) continue;
        await db.execute({
            sql: `INSERT INTO admissions 
                  (student_id, class, status, student_name, parent_name, primary_phone, alternate_phone, email, join_date, end_date, fee_registered, book_fee, admission_fee, term1, term2, term3, others, total_paid, fee_balance, followup, year)
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            args: [
                studentId,
                safeStr(row[1]),
                safeStr(row[2]) || "Active",
                studentName,
                safeStr(row[4]),
                safeStr(row[5]),
                safeStr(row[6]),
                safeStr(row[7]),
                excelDateToISO(row[8]),
                excelDateToISO(row[9]),
                safeNum(row[10]),
                safeNum(row[13]),
                safeNum(row[12]),
                safeNum(row[14]),
                safeNum(row[15]),
                safeNum(row[16]),
                safeNum(row[17]),
                safeNum(row[18]),
                safeNum(row[19]),
                safeStr(row[20]),
                year,
            ],
        });
        count++;
    }
    console.log(`✅ Admissions ${year}: ${count} rows`);
}

async function seedSalaries(ws) {
    await db.execute("DELETE FROM salaries");
    const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });
    let count = 0;
    for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        const staffName = safeStr(row[1]);
        if (!staffName) continue;
        await db.execute({
            sql: `INSERT INTO salaries 
                  (type, staff_name, phone, working_month, salary_paid_date, salary_agreed, working_days, leaves, salary_to_pay, advance, salary_paid, status, remarks)
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            args: [
                safeStr(row[0]),
                staffName,
                safeStr(row[2]),
                safeStr(row[3]),
                excelDateToISO(row[4]),
                safeNum(row[5]),
                safeNum(row[6]),
                safeNum(row[7]),
                safeNum(row[8]),
                safeNum(row[9]),
                safeNum(row[10]),
                safeStr(row[12]) || "Pending",
                safeStr(row[13]),
            ],
        });
        count++;
    }
    console.log(`✅ Salaries: ${count} rows`);
}

async function seedEmployees(ws) {
    await db.execute("DELETE FROM employees");
    const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });
    let count = 0;
    for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        const empNo = safeStr(row[0]);
        const name = safeStr(row[3]);
        if (!empNo && !name) continue;
        await db.execute({
            sql: `INSERT INTO employees (emp_no, type, status, name, phone, address, joining_date, end_date, salary_agreed)
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            args: [
                empNo,
                safeStr(row[1]),
                safeStr(row[2]) || "Active",
                name,
                safeStr(row[4]),
                safeStr(row[5]),
                excelDateToISO(row[6]),
                excelDateToISO(row[7]),
                safeNum(row[8]),
            ],
        });
        count++;
    }
    console.log(`✅ Employees: ${count} rows`);
}

async function seedInvestments(ws) {
    await db.execute("DELETE FROM investments");
    const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });
    let count = 0;
    for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        const investor = safeStr(row[2]);
        const amount = safeNum(row[3]);
        if (!investor && amount === 0) continue;
        await db.execute({
            sql: "INSERT INTO investments (sno, date, investor, amount, remarks) VALUES (?, ?, ?, ?, ?)",
            args: [
                safeNum(row[0]),
                excelDateToISO(row[1]),
                investor,
                amount,
                safeStr(row[4]),
            ],
        });
        count++;
    }
    console.log(`✅ Investments: ${count} rows`);
}

async function seedSummerCamp(ws, year) {
    const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });
    let count = 0;
    for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        const studentId = safeStr(row[0]);
        const studentName = safeStr(row[2]);
        if (!studentId && !studentName) continue;
        await db.execute({
            sql: `INSERT INTO summer_camp 
                  (student_id, status, student_name, parent_name, phone, email, joining_date, end_date, admission_type, payment_period, fee_registered, paid, fee_balance, year)
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            args: [
                studentId,
                safeStr(row[1]) || "Active",
                studentName,
                safeStr(row[3]),
                safeStr(row[4]),
                safeStr(row[5]),
                excelDateToISO(row[6]),
                excelDateToISO(row[7]),
                safeStr(row[8]) || "Summer Camp",
                safeStr(row[9]) || "Monthly",
                safeNum(row[10]),
                safeNum(row[11]),
                safeNum(row[12]),
                year,
            ],
        });
        count++;
    }
    console.log(`✅ Summer Camp ${year}: ${count} rows`);
}

async function seedEnquiries(ws) {
    await db.execute("DELETE FROM enquiries");
    const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });
    let count = 0;
    for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        const name = safeStr(row[1]);
        if (!name) continue;
        await db.execute({
            sql: `INSERT INTO enquiries (timestamp, name, phone, email, student_age, interested_class, address, remarks)
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            args: [
                excelDateToISO(row[0]),
                name,
                safeStr(row[2]),
                safeStr(row[3]),
                safeStr(row[4]),
                safeStr(row[5]),
                safeStr(row[6]),
                safeStr(row[7]),
            ],
        });
        count++;
    }
    console.log(`✅ Enquiries: ${count} rows`);
}

async function main() {
    const excelPath = path.join(process.cwd(), "1st Branch School Expenditure_160624.xlsx");
    console.log("📖 Reading Excel file:", excelPath);
    const wb = XLSX.readFile(excelPath);

    console.log("🗄️  Creating tables...");
    await createTables();

    console.log("🌱 Seeding data...");
    await seedExpenditure(wb.Sheets["Expenditure"]);

    await db.execute("DELETE FROM admissions");
    await seedAdmissions(wb.Sheets["Admission 2025"], 2025);
    await seedAdmissions(wb.Sheets["Admission 2024"], 2024);

    await seedSalaries(wb.Sheets["Salaries"]);
    await seedEmployees(wb.Sheets["Employees"]);
    await seedInvestments(wb.Sheets["Investment"]);

    await db.execute("DELETE FROM summer_camp");
    await seedSummerCamp(wb.Sheets["Summer Camp 2025"], 2025);
    await seedSummerCamp(wb.Sheets["Summer Camp 2024"], 2024);

    await seedEnquiries(wb.Sheets["Preschool Enquiries"]);

    console.log("\n🎉 Migration complete!");
    process.exit(0);
}

main().catch((err) => {
    console.error("❌ Migration failed:", err.message || err);
    process.exit(1);
});
