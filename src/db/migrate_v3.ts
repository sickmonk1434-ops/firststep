
import { db } from "./client";

async function migrate() {
    console.log("Starting migration v3...");

    try {
        // Create academic_years table
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

        // Insert default academic years if not exists
        const count = await db.execute("SELECT COUNT(*) as c FROM academic_years");
        if ((count.rows[0].c as number) === 0) {
            await db.execute({
                sql: "INSERT INTO academic_years (name, start_date, end_date, type, is_active) VALUES (?, ?, ?, ?, ?)",
                args: ["2025-2026", "2025-04-01", "2026-03-31", "normal", 0]
            });
            await db.execute({
                sql: "INSERT INTO academic_years (name, start_date, end_date, type, is_active) VALUES (?, ?, ?, ?, ?)",
                args: ["2026-2027", "2026-04-01", "2027-03-31", "normal", 1]
            });
            await db.execute({
                sql: "INSERT INTO academic_years (name, start_date, end_date, type, is_active) VALUES (?, ?, ?, ?, ?)",
                args: ["Summer 2025", "2025-04-01", "2025-06-30", "summer_camp", 0]
            });
             await db.execute({
                sql: "INSERT INTO academic_years (name, start_date, end_date, type, is_active) VALUES (?, ?, ?, ?, ?)",
                args: ["Summer 2026", "2026-04-01", "2026-06-30", "summer_camp", 1]
            });
        }

        console.log("Migration v3 completed successfully.");
    } catch (error) {
        console.error("Migration v3 failed:", error);
    }
}

migrate();
