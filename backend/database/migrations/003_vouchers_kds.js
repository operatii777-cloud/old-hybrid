import { getDatabase } from '../init-db.js';
import { logger } from '../../utils/logger.js';

/**
 * Migration 003: Add vouchers, KDS and low-stock alerts tables.
 * Also adds tip_pret, discount_voucher, voucher_cod, discount_linie columns to comenzi.
 */
export async function up() {
  const db = getDatabase();

  // Vouchers table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS vouchers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cod TEXT NOT NULL UNIQUE,
      denumire TEXT NOT NULL,
      discount_percent REAL DEFAULT 0,
      discount_fix REAL DEFAULT 0,
      max_utilizari INTEGER DEFAULT 1,
      utilizari_curente INTEGER DEFAULT 0,
      valabil_de DATE,
      valabil_pana DATE,
      activ INTEGER DEFAULT 1,
      creat_la DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  logger.info('Migration 003: vouchers table ensured');

  // KDS items table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS kds_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      comanda_id TEXT NOT NULL,
      linie_id TEXT,
      cod_prod INTEGER NOT NULL,
      den_prod TEXT NOT NULL,
      cant REAL NOT NULL DEFAULT 1,
      statie TEXT NOT NULL DEFAULT 'bucatarie',
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','preparing','ready','served')),
      prioritate INTEGER DEFAULT 0,
      creat_la DATETIME DEFAULT CURRENT_TIMESTAMP,
      inceput_la DATETIME,
      gata_la DATETIME,
      servit_la DATETIME,
      masa_id INTEGER,
      ospatar_id TEXT
    )
  `);
  logger.info('Migration 003: kds_items table ensured');

  // Low-stock alerts table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS alerte_stoc_scazut (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cod_material INTEGER NOT NULL,
      denumire TEXT NOT NULL,
      gestiune_id INTEGER NOT NULL DEFAULT 1,
      stoc_curent REAL NOT NULL DEFAULT 0,
      stoc_minim REAL NOT NULL DEFAULT 0,
      email_trimis INTEGER DEFAULT 0,
      rezolvata INTEGER DEFAULT 0,
      creat_la DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  logger.info('Migration 003: alerte_stoc_scazut table ensured');

  // Extend comenzi with new columns (graceful - ignore if column already exists)
  const comenziInfo = await db.all('PRAGMA table_info(comenzi)');
  const comenziCols = new Set(comenziInfo.map(c => c.name));
  const newCols = [
    ["tip_pret", "TEXT DEFAULT 'PRET1'"],
    ["discount_voucher", "REAL DEFAULT 0"],
    ["voucher_cod", "TEXT"],
    ["discount_linie", "REAL DEFAULT 0"]
  ];
  for (const [col, def] of newCols) {
    if (!comenziCols.has(col)) {
      try {
        await db.exec(`ALTER TABLE comenzi ADD COLUMN ${col} ${def}`);
        logger.info(`Migration 003: comenzi.${col} added`);
      } catch (e) {
        logger.warn(`Migration 003: skip ${col}: ${e.message}`);
      }
    }
  }
}

export async function down() {
  const db = getDatabase();
  await db.exec('DROP TABLE IF EXISTS vouchers');
  await db.exec('DROP TABLE IF EXISTS kds_items');
  await db.exec('DROP TABLE IF EXISTS alerte_stoc_scazut');
  logger.info('Migration 003 rolled back');
}
