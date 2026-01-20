
import { createClient } from "@libsql/client";

const url = import.meta.env?.VITE_TURSO_DATABASE_URL || process.env.VITE_TURSO_DATABASE_URL;
const authToken = import.meta.env?.VITE_TURSO_AUTH_TOKEN || process.env.VITE_TURSO_AUTH_TOKEN;

if (!url) {
    console.error("VITE_TURSO_DATABASE_URL is not defined");
}

export const db = createClient({
    url: url || "file:local.db",
    authToken: authToken,
});
