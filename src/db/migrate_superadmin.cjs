/**
 * migrate_superadmin.cjs
 * Adds super_admin role and schools table to Turso DB
 * Run: node src/db/migrate_superadmin.cjs
 */

const { createClient } = require('@libsql/client');
require('dotenv').config();

const db = createClient({
  url: process.env.VITE_TURSO_DATABASE_URL,
  authToken: process.env.VITE_TURSO_AUTH_TOKEN,
});

async function migrate() {
  console.log('🚀 Starting Super Admin migration...\n');

  // 1. Create schools table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS schools (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      name        TEXT NOT NULL,
      branch_code TEXT UNIQUE NOT NULL,
      address     TEXT,
      phone       TEXT,
      email       TEXT,
      created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  console.log('✓ schools table created');

  // 2. Seed default school
  await db.execute(`
    INSERT OR IGNORE INTO schools (id, name, branch_code, address)
    VALUES (1, 'The First Step – Branch 1', 'TFS-BN-01', 'Branch 1 Address')
  `);
  console.log('✓ Default school seeded');

  // 3. Add school_id column to users (if not exists)
  try {
    await db.execute(`ALTER TABLE users ADD COLUMN school_id INTEGER REFERENCES schools(id)`);
    console.log('✓ school_id column added to users');
  } catch (e) {
    if (e.message && e.message.includes('duplicate column')) {
      console.log('ℹ school_id column already exists, skipping');
    } else {
      throw e;
    }
  }

  // 4. Assign existing users to default school
  await db.execute(`UPDATE users SET school_id = 1 WHERE school_id IS NULL AND role != 'super_admin'`);
  console.log('✓ Existing users assigned to Branch 1');

  // 5. Seed Super Admin account
  await db.execute({
    sql: `INSERT OR IGNORE INTO users (email, password, role, name, school_id)
          VALUES ('superadmin@thefirststep.com', 'superadmin123', 'super_admin', 'Super Admin', NULL)`,
    args: []
  });
  console.log('✓ Super Admin seeded (superadmin@thefirststep.com / superadmin123)');

  console.log('\n✅ Migration complete!');
}

migrate().catch(err => {
  console.error('❌ Migration failed:', err.message);
  process.exit(1);
});
