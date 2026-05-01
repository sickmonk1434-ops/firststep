import { createClient } from "@libsql/client";
import dotenv from "dotenv";
dotenv.config();

const db = createClient({
    url: process.env.VITE_TURSO_DATABASE_URL!,
    authToken: process.env.VITE_TURSO_AUTH_TOKEN!,
});

async function check() {
    console.log("Connecting to:", process.env.VITE_TURSO_DATABASE_URL);
    try {
        const tables = await db.execute("SELECT name FROM sqlite_master WHERE type='table'");
        console.log("\nTables in DB:");
        tables.rows.forEach(r => console.log("  -", r.name));

        const res = await db.execute("SELECT * FROM academic_years");
        console.log("\nAcademic years rows:", res.rows.length);
        res.rows.forEach(r => console.log("  ", JSON.stringify(r)));
    } catch (err) {
        console.error("Error:", err);
    }
}
check();
