
import { db } from "./client";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigrationsV2() {
    try {
        const schemaPath = path.resolve(__dirname, "schema_v2.sql");
        const schemaSql = fs.readFileSync(schemaPath, "utf-8");

        const statements = schemaSql
            .split(";")
            .map((s) => s.trim())
            .filter((s) => s.length > 0);

        for (const statement of statements) {
            try {
                await db.execute(statement);
                console.log("Executed statement.");
            } catch (err: any) {
                // Ignore errors about existing columns or tables
                if (err.message?.includes("duplicate column name")) {
                    console.log("Column already exists, skipping...");
                } else {
                    console.error("Statement failed:", statement);
                    console.error(err);
                }
            }
        }

        console.log("Migrations V2 completed successfully.");
    } catch (error) {
        console.error("Migration V2 failed:", error);
        process.exit(1);
    }
}

runMigrationsV2();
