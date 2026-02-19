import { getDatabase } from './init-db.js';
import { logger } from '../utils/logger.js';
import * as migration001 from './migrations/001_add_roles.js';
import * as migration003 from './migrations/003_vouchers_kds.js';

const migrations = [
  { id: '001_add_roles', name: 'Add role-based access control', up: migration001.up, down: migration001.down },
  { id: '003_vouchers_kds', name: 'Add vouchers, KDS and low-stock alerts', up: migration003.up, down: migration003.down }
];

/**
 * Run all pending migrations
 */
export async function runMigrations() {
  const db = getDatabase();
  
  try {
    // Create migrations tracking table
    await db.exec(`
      CREATE TABLE IF NOT EXISTS migrations (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        executed_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // Get executed migrations
    const executed = await db.all('SELECT id FROM migrations');
    const executedIds = new Set(executed.map(m => m.id));
    
    // Run pending migrations
    for (const migration of migrations) {
      if (!executedIds.has(migration.id)) {
        logger.info(`Running migration: ${migration.name}...`);
        await migration.up();
        
        // Record migration
        await db.run(
          'INSERT INTO migrations (id, name) VALUES (?, ?)',
          [migration.id, migration.name]
        );
        
        logger.info(`✅ Migration completed: ${migration.name}`);
      }
    }
    
    logger.info('✅ All migrations completed');
    
  } catch (error) {
    logger.error('❌ Migration error:', error);
    throw error;
  }
}

/**
 * Rollback last migration
 */
export async function rollbackMigration() {
  const db = getDatabase();
  
  try {
    const lastMigration = await db.get(
      'SELECT * FROM migrations ORDER BY executed_at DESC LIMIT 1'
    );
    
    if (!lastMigration) {
      logger.info('No migrations to rollback');
      return;
    }
    
    const migration = migrations.find(m => m.id === lastMigration.id);
    if (migration) {
      logger.info(`Rolling back migration: ${migration.name}...`);
      await migration.down();
      
      await db.run('DELETE FROM migrations WHERE id = ?', [migration.id]);
      logger.info(`✅ Migration rolled back: ${migration.name}`);
    }
    
  } catch (error) {
    logger.error('❌ Rollback error:', error);
    throw error;
  }
}
