import { db } from "./client";

async function seed() {
    console.log("Seeding academic years with correct dates...");

    try {
        // Wipe existing rows and re-insert with correct dates
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

        console.log("\nDone! Academic years seeded successfully.");
    } catch (err) {
        console.error("Seeding failed:", err);
    }
}

seed();
