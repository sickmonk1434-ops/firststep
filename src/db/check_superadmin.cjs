const { createClient } = require('@libsql/client');
require('dotenv').config();

const db = createClient({
  url: process.env.VITE_TURSO_DATABASE_URL,
  authToken: process.env.VITE_TURSO_AUTH_TOKEN,
});

async function check() {
  // Check if super_admin user exists
  const r = await db.execute("SELECT id,email,role FROM users WHERE email='superadmin@thefirststep.com'");
  console.log('super_admin row:', JSON.stringify(r.rows));

  // Check the DDL
  const ddl = await db.execute("SELECT sql FROM sqlite_master WHERE type='table' AND name='users'");
  console.log('DDL:', ddl.rows[0] ? ddl.rows[0].sql : 'NOT FOUND');
}

check().catch(err => console.error('ERROR:', err.message));
