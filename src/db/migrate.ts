
import { db } from "./client";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Get __dirname equivalent in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigrations() {
    try {
        const schemaPath = path.resolve(__dirname, "schema.sql");
        const schemaSql = fs.readFileSync(schemaPath, "utf-8");

        // Split by semicolon to run statements individually if needed, 
        // but LibSQL client usually handles multiple statements or we can execute one by one.
        // However, the standard `execute` might only do one. Let's try splitting.
        const statements = schemaSql
            .split(";")
            .map((s) => s.trim())
            .filter((s) => s.length > 0);

        for (const statement of statements) {
            await db.execute(statement);
            console.log("Executed statement.");
        }

        console.log("Migrations completed successfully.");
    } catch (error) {
        console.error("Migration failed:", error);
        process.exit(1);
    }
}

runMigrations();
