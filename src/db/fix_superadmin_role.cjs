/**
 * fix_superadmin_role.cjs
 * Recreates the users table to allow 'super_admin' in role CHECK constraint
 * and inserts the super_admin account.
 */

const { createClient } = require('@libsql/client');
require('dotenv').config();

const db = createClient({
  url: process.env.VITE_TURSO_DATABASE_URL,
  authToken: process.env.VITE_TURSO_AUTH_TOKEN,
});

async function fix() {
  console.log('Checking current users table...');
  const ddlRes = await db.execute("SELECT sql FROM sqlite_master WHERE type='table' AND name='users'");
  const currentDDL = ddlRes.rows[0]?.sql || '';
  console.log('Current DDL:', currentDDL.substring(0, 200));

  // Step 1: Rename existing table
  await db.execute('ALTER TABLE users RENAME TO users_old');
  console.log('✓ Renamed users -> users_old');

  // Step 2: Create new table with super_admin in CHECK
  await db.execute(`
    CREATE TABLE users (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      email      TEXT UNIQUE NOT NULL,
      password   TEXT NOT NULL,
      role       TEXT NOT NULL CHECK(role IN ('super_admin','admin','principal','teacher','parent')),
      name       TEXT NOT NULL,
      staff_id   INTEGER,
      school_id  INTEGER REFERENCES schools(id),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  console.log('✓ Created new users table with super_admin role');

  // Step 3: Copy all rows from old table
  // Check if school_id column exists in old table
  const hasSchool = currentDDL.includes('school_id');
  if (hasSchool) {
    await db.execute(`
      INSERT INTO users (id, email, password, role, name, staff_id, school_id, created_at)
      SELECT id, email, password, role, name, staff_id, school_id, created_at FROM users_old
    `);
  } else {
    await db.execute(`
      INSERT INTO users (id, email, password, role, name, staff_id, school_id, created_at)
      SELECT id, email, password, role, name, staff_id, 1, created_at FROM users_old
    `);
  }
  console.log('✓ Copied existing users');

  // Step 4: Drop old table
  await db.execute('DROP TABLE users_old');
  console.log('✓ Dropped users_old');

  // Step 5: Assign all non-super_admin users to school 1
  await db.execute(`UPDATE users SET school_id = 1 WHERE school_id IS NULL AND role != 'super_admin'`);
  console.log('✓ Existing users assigned to Branch 1');

  // Step 6: Insert / update super_admin account
  await db.execute({
    sql: `INSERT OR REPLACE INTO users (email, password, role, name, school_id)
          VALUES ('superadmin@thefirststep.com', 'superadmin123', 'super_admin', 'Super Admin', NULL)`,
    args: []
  });
  console.log('✓ Super Admin account inserted');

  // Verify
  const check = await db.execute("SELECT id,email,role FROM users WHERE email='superadmin@thefirststep.com'");
  console.log('Verified super_admin row:', JSON.stringify(check.rows));
  console.log('\n✅ Fix complete! Login with superadmin@thefirststep.com / superadmin123');
}

fix().catch(err => {
  console.error('❌ Fix failed:', err.message);
  process.exit(1);
});
