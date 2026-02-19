/**
 * Migration: Add reservations table
 * Date: 2024-02-19
 */

export async function up(db) {
  await db.exec(`
    CREATE TABLE IF NOT EXISTS reservations (
      id TEXT PRIMARY KEY,
      client_name TEXT NOT NULL,
      client_phone TEXT NOT NULL,
      client_email TEXT,
      date TEXT NOT NULL,
      time TEXT NOT NULL,
      num_people INTEGER NOT NULL,
      table_id TEXT,
      notes TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (table_id) REFERENCES mese(id) ON DELETE SET NULL
    )
  `);
  
  console.log('✓ Created reservations table');
}

export async function down(db) {
  await db.exec('DROP TABLE IF EXISTS reservations');
  console.log('✓ Dropped reservations table');
}
