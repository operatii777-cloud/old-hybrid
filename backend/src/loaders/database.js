
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import { fileURLToPath } from 'url';
import { logger } from '../../utils/logger.js';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config();

const DB_PATH = process.env.DATABASE_URL || path.join(__dirname, '../../../data/restaurant.db');

let db = null;

export async function initDatabase() {
    if (db) return db;

    try {
        db = await open({
            filename: DB_PATH,
            driver: sqlite3.Database
        });

        // WAL Mode for massive concurrency
        await db.run('PRAGMA journal_mode = WAL;');
        await db.run('PRAGMA synchronous = NORMAL;');
        await db.run('PRAGMA foreign_keys = ON;');

        logger.info(`✅ NOVA v10.0 Database Initialized at: ${DB_PATH} [WAL MODE]`);

        // Ensure Audit Log table exists (Critical for NOVA compliance)
        await db.run(`
      CREATE TABLE IF NOT EXISTS system_audit_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT,
        action_type TEXT NOT NULL,
        reason TEXT NOT NULL,
        pre_state TEXT,
        post_state TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        tenant_id TEXT DEFAULT 'default'
      )
    `);

        // Ensure System Status (Circuit Breakers)
        await db.run(`
      CREATE TABLE IF NOT EXISTS system_status (
        key TEXT PRIMARY KEY,
        value TEXT,
        last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

        // --- MIGRATION: NOVA v10.0 Schema Updates ---
        try {
            // Add snapshot columns if missing
            const tableInfo = await db.all("PRAGMA table_info(comenzi_linii)");
            const hasTva = tableInfo.some(c => c.name === 'tva_snap');
            const hasTenant = tableInfo.some(c => c.name === 'tenant_id');

            if (!hasTva) {
                await db.run("ALTER TABLE comenzi_linii ADD COLUMN tva_snap REAL DEFAULT 1.19");
                logger.info("🔧 Migrated: Added 'tva_snap' to comenzi_linii");
            }
            if (!hasTenant) {
                await db.run("ALTER TABLE comenzi_linii ADD COLUMN tenant_id TEXT DEFAULT 'default'");
                logger.info("🔧 Migrated: Added 'tenant_id' to comenzi_linii");
            }

            // Add tenant_id to 'comenzi'
            const ordersInfo = await db.all("PRAGMA table_info(comenzi)");
            if (!ordersInfo.some(c => c.name === 'tenant_id')) {
                await db.run("ALTER TABLE comenzi ADD COLUMN tenant_id TEXT DEFAULT 'default'");
                logger.info("🔧 Migrated: Added 'tenant_id' to comenzi");
            }

        } catch (e) {
            logger.warn("Schema migration warning:", e.message);
        }

        return db;
    } catch (error) {
        logger.error('❌ Database init error:', error);
        process.exit(1);
    }
}

export function getDatabase() {
    if (!db) {
        throw new Error('Database not initialized! Call initDatabase() first.');
    }
    return db;
}
