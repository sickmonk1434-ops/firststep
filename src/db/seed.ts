
import { db } from './src/db/client';

async function seed() {
    try {
        await db.execute("INSERT INTO banner_images (url, alt_text, display_order, is_active) VALUES ('https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?auto=format&fit=crop&w=1200', 'Nurturing Growth', 1, 1)");
        await db.execute("INSERT INTO banner_images (url, alt_text, display_order, is_active) VALUES ('https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=1200', 'Creative Play', 2, 1)");
        console.log('Seeded banners successfully');
    } catch (err) {
        console.error('Seeding failed:', err);
    }
}

seed();
