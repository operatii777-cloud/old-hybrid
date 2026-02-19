/**
 * Migration: Add Performance Indexes
 * Purpose: Create indexes on frequently queried columns to improve database performance
 * Date: 2026-02-19
 */

export async function up(db) {
  // Indexes for 'comenzi' table - frequently queried by masa_id, ospatar_id, status, and date
  await db.run(`
    CREATE INDEX IF NOT EXISTS idx_comenzi_masa_id 
    ON comenzi(masa_id)
  `);
  
  await db.run(`
    CREATE INDEX IF NOT EXISTS idx_comenzi_ospatar_id 
    ON comenzi(ospatar_id)
  `);
  
  await db.run(`
    CREATE INDEX IF NOT EXISTS idx_comenzi_status 
    ON comenzi(status)
  `);
  
  await db.run(`
    CREATE INDEX IF NOT EXISTS idx_comenzi_data 
    ON comenzi(data DESC)
  `);
  
  await db.run(`
    CREATE INDEX IF NOT EXISTS idx_comenzi_synced 
    ON comenzi(synced)
  `);

  // Composite index for common query patterns
  await db.run(`
    CREATE INDEX IF NOT EXISTS idx_comenzi_status_data 
    ON comenzi(status, data DESC)
  `);

  // Indexes for 'comenzi_linii' table
  await db.run(`
    CREATE INDEX IF NOT EXISTS idx_comenzi_linii_comanda_id 
    ON comenzi_linii(comanda_id)
  `);
  
  await db.run(`
    CREATE INDEX IF NOT EXISTS idx_comenzi_linii_cod_prod 
    ON comenzi_linii(cod_prod)
  `);

  // Indexes for 'mese' table
  await db.run(`
    CREATE INDEX IF NOT EXISTS idx_mese_status 
    ON mese(status)
  `);
  
  await db.run(`
    CREATE INDEX IF NOT EXISTS idx_mese_ospatar_id 
    ON mese(ospatar_id)
  `);

  // Indexes for 'produse' table
  await db.run(`
    CREATE INDEX IF NOT EXISTS idx_produse_dept 
    ON produse(dept)
  `);
  
  await db.run(`
    CREATE INDEX IF NOT EXISTS idx_produse_grupa 
    ON produse(grupa)
  `);
  
  await db.run(`
    CREATE INDEX IF NOT EXISTS idx_produse_categorie 
    ON produse(categorie)
  `);

  // Indexes for 'stoc' table if it exists
  try {
    await db.run(`
      CREATE INDEX IF NOT EXISTS idx_stoc_cod_prod 
      ON stoc(cod_prod)
    `);
    
    await db.run(`
      CREATE INDEX IF NOT EXISTS idx_stoc_cantitate 
      ON stoc(cantitate)
    `);
  } catch (error) {
    // Table might not exist, ignore
  }

  // Indexes for 'kds_items' table if it exists
  try {
    await db.run(`
      CREATE INDEX IF NOT EXISTS idx_kds_items_comanda_id 
      ON kds_items(comanda_id)
    `);
    
    await db.run(`
      CREATE INDEX IF NOT EXISTS idx_kds_items_status 
      ON kds_items(status)
    `);
    
    await db.run(`
      CREATE INDEX IF NOT EXISTS idx_kds_items_statie 
      ON kds_items(statie)
    `);
    
    await db.run(`
      CREATE INDEX IF NOT EXISTS idx_kds_items_status_statie 
      ON kds_items(status, statie)
    `);
  } catch (error) {
    // Table might not exist, ignore
  }

  // Indexes for 'audit_log' table if it exists
  try {
    await db.run(`
      CREATE INDEX IF NOT EXISTS idx_audit_log_user_id 
      ON audit_log(user_id)
    `);
    
    await db.run(`
      CREATE INDEX IF NOT EXISTS idx_audit_log_action 
      ON audit_log(action)
    `);
    
    await db.run(`
      CREATE INDEX IF NOT EXISTS idx_audit_log_timestamp 
      ON audit_log(timestamp DESC)
    `);
  } catch (error) {
    // Table might not exist, ignore
  }

  console.log('✅ Performance indexes created successfully');
}

export async function down(db) {
  // Drop all indexes created in 'up'
  const indexes = [
    'idx_comenzi_masa_id',
    'idx_comenzi_ospatar_id',
    'idx_comenzi_status',
    'idx_comenzi_data',
    'idx_comenzi_synced',
    'idx_comenzi_status_data',
    'idx_comenzi_linii_comanda_id',
    'idx_comenzi_linii_cod_prod',
    'idx_mese_status',
    'idx_mese_ospatar_id',
    'idx_produse_dept',
    'idx_produse_grupa',
    'idx_produse_categorie',
    'idx_stoc_cod_prod',
    'idx_stoc_cantitate',
    'idx_kds_items_comanda_id',
    'idx_kds_items_status',
    'idx_kds_items_statie',
    'idx_kds_items_status_statie',
    'idx_audit_log_user_id',
    'idx_audit_log_action',
    'idx_audit_log_timestamp'
  ];

  for (const index of indexes) {
    try {
      await db.run(`DROP INDEX IF EXISTS ${index}`);
    } catch (error) {
      // Ignore errors for non-existent indexes
    }
  }

  console.log('✅ Performance indexes removed successfully');
}
