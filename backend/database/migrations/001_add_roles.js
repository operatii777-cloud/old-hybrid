import { getDatabase } from '../init-db.js';
import { logger } from '../../utils/logger.js';

/**
 * Migration: Add role-based access control
 * - Add 'rol' column to ospetari table
 * - Add default roles: OSPATAR, CASIER, MANAGER, ADMIN
 */
export async function up() {
  const db = getDatabase();
  
  try {
    // Check if rol column exists
    const columns = await db.all("PRAGMA table_info(ospetari)");
    const hasRol = columns.some(col => col.name === 'rol');
    
    if (!hasRol) {
      // Add rol column with default value
      await db.exec(`
        ALTER TABLE ospetari ADD COLUMN rol TEXT DEFAULT 'OSPATAR';
      `);
      
      // Update existing users based on their ID or assign default roles
      await db.exec(`
        UPDATE ospetari SET rol = 'MANAGER' WHERE id = 'osp_1';
        UPDATE ospetari SET rol = 'OSPATAR' WHERE id != 'osp_1';
      `);
      
      logger.info('✅ Migration: Added rol column to ospetari table');
    } else {
      logger.info('ℹ️  Migration: rol column already exists');
    }
    
    // Create roles table if not exists
    await db.exec(`
      CREATE TABLE IF NOT EXISTS roles (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        description TEXT,
        permissions TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // Insert default roles
    const roles = [
      { id: 'ADMIN', name: 'Administrator', description: 'Full system access', permissions: JSON.stringify(['*']) },
      { id: 'MANAGER', name: 'Manager', description: 'Management access', permissions: JSON.stringify(['admin', 'reports', 'inventory', 'users']) },
      { id: 'CASIER', name: 'Casier', description: 'Cashier access', permissions: JSON.stringify(['pos', 'payments', 'reports_view']) },
      { id: 'OSPATAR', name: 'Ospatar', description: 'Waiter access', permissions: JSON.stringify(['pos', 'tables', 'orders']) }
    ];
    
    for (const role of roles) {
      await db.run(
        `INSERT OR REPLACE INTO roles (id, name, description, permissions) VALUES (?, ?, ?, ?)`,
        [role.id, role.name, role.description, role.permissions]
      );
    }
    
    logger.info('✅ Migration: Created roles table and inserted default roles');
    
  } catch (error) {
    logger.error('❌ Migration error:', error);
    throw error;
  }
}

export async function down() {
  const db = getDatabase();
  
  try {
    // Note: SQLite doesn't support DROP COLUMN directly
    // We would need to recreate the table to remove the column
    logger.info('ℹ️  Migration rollback: Manual intervention required to remove rol column');
    
    // Drop roles table
    await db.exec(`DROP TABLE IF EXISTS roles;`);
    logger.info('✅ Migration rollback: Dropped roles table');
    
  } catch (error) {
    logger.error('❌ Migration rollback error:', error);
    throw error;
  }
}
