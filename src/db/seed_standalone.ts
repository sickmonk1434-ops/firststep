
import { createClient } from "@libsql/client";

async function seed() {
    const url = "libsql://firststep-sickmonk1434-ops.aws-ap-south-1.turso.io";
    const authToken = "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3Njg5MDA0MDYsImlkIjoiNzA5OGU4YTEtNzJkYy00NDVmLWJmNDAtYmQ0MjVmZTZhYTM4IiwicmlkIjoiNzZlM2UwMTYtMjIyNS00MjE5LWE5NGEtMTgwMzJhNDcwMWYwIn0.-FoMEXiqTTXk_3PSlxmd7zm0ixNLre5-m7wbimtgbhC3dVidTzEn2zSL9i9XZ8K6uTnKJw_jcw6mCh_grkDwCw";

    const db = createClient({ url, authToken });

    try {
        await db.execute("INSERT INTO banner_images (url, alt_text, display_order, is_active) VALUES ('https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?auto=format&fit=crop&w=1200', 'Nurturing Growth', 1, 1)");
        await db.execute("INSERT INTO banner_images (url, alt_text, display_order, is_active) VALUES ('https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=1200', 'Creative Play', 2, 1)");
        console.log('Seeded banners successfully');
    } catch (err) {
        console.error('Seeding failed:', err);
    }
}

seed();
