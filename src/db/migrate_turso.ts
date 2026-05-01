import { createClient } from "@libsql/client";
import dotenv from "dotenv";
dotenv.config();

const db = createClient({
    url: process.env.VITE_TURSO_DATABASE_URL!,
    authToken: process.env.VITE_TURSO_AUTH_TOKEN!,
});

async function migrate() {
    console.log("Connecting to:", process.env.VITE_TURSO_DATABASE_URL);
    console.log("Creating academic_years table...");

    await db.execute(`
        CREATE TABLE IF NOT EXISTS academic_years (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            start_date DATE NOT NULL,
            end_date DATE NOT NULL,
            type TEXT NOT NULL CHECK(type IN ('normal', 'summer_camp')),
            is_active BOOLEAN DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);
    console.log("  ✓ Table created");

    // Delete existing rows and re-seed with correct dates
    await db.execute("DELETE FROM academic_years");

    const years = [
        // Normal academic years: June 1 → May 31
        { name: "2023-2024", start: "2023-06-01", end: "2024-05-31", type: "normal",      active: 0 },
        { name: "2024-2025", start: "2024-06-01", end: "2025-05-31", type: "normal",      active: 0 },
        { name: "2025-2026", start: "2025-06-01", end: "2026-05-31", type: "normal",      active: 1 },
        { name: "2026-2027", start: "2026-06-01", end: "2027-05-31", type: "normal",      active: 0 },

        // Summer camp years: May 1 → June 30
        { name: "Summer 2023", start: "2023-05-01", end: "2023-06-30", type: "summer_camp", active: 0 },
        { name: "Summer 2024", start: "2024-05-01", end: "2024-06-30", type: "summer_camp", active: 0 },
        { name: "Summer 2025", start: "2025-05-01", end: "2025-06-30", type: "summer_camp", active: 0 },
        { name: "Summer 2026", start: "2026-05-01", end: "2026-06-30", type: "summer_camp", active: 1 },
    ];

    for (const y of years) {
        await db.execute({
            sql: "INSERT INTO academic_years (name, start_date, end_date, type, is_active) VALUES (?, ?, ?, ?, ?)",
            args: [y.name, y.start, y.end, y.type, y.active],
        });
        console.log(`  ✓ Inserted: ${y.name} (${y.type})`);
    }

    // Verify
    const res = await db.execute("SELECT * FROM academic_years ORDER BY start_date DESC");
    console.log(`\nDone! ${res.rows.length} academic years in production DB.`);
}

migrate();
