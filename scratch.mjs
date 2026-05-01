import { createClient } from "@libsql/client";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const db = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN
});

db.execute("SELECT id, created_at, student_name FROM applications LIMIT 10")
    .then(r => console.log(r.rows))
    .catch(console.error);
