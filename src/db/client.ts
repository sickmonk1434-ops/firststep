
import { createClient } from "@libsql/client";

const getDbConfig = () => {
    if (typeof import.meta !== 'undefined' && import.meta.env) {
        return {
            url: import.meta.env.VITE_TURSO_DATABASE_URL,
            authToken: import.meta.env.VITE_TURSO_AUTH_TOKEN
        };
    }
    if (typeof process !== 'undefined' && process.env) {
        return {
            url: process.env.VITE_TURSO_DATABASE_URL,
            authToken: process.env.VITE_TURSO_AUTH_TOKEN
        };
    }
    return { url: undefined, authToken: undefined };
};

const config = getDbConfig();

// In browser, we must have a remote URL. We provide a dummy URL if missing to prevent crash.
const isBrowser = typeof window !== 'undefined';
const defaultUrl = isBrowser ? "https://placeholder-url.turso.io" : "file:local.db";

export const db = createClient({
    url: config.url || defaultUrl,
    authToken: config.authToken || "",
});
