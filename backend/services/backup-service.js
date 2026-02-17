import cron from 'node-cron';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { logger } from '../utils/logger.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backupDir = process.env.BACKUP_DIR || './backups';

export function setupBackupService() {
  // Create backup directory if not exists
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  logger.info(`Backup service enabled - dir: ${backupDir}`);

  // Daily backup at 2 AM
  cron.schedule('0 2 * * *', async () => {
    await createBackup();
  });

  // Also backup on startup
  createBackup();
}

async function createBackup() {
  try {
    const dbPath = process.env.DATABASE_URL || './data/restaurant.db';
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(backupDir, `restaurant_${timestamp}.db`);

    if (!fs.existsSync(dbPath)) {
      logger.warn('Database file not found for backup');
      return;
    }

    fs.copyFileSync(dbPath, backupPath);
    logger.info(`✅ Backup created: ${backupPath}`);

    // Clean old backups (keep last 7 days)
    cleanOldBackups();
  } catch (error) {
    logger.error('Backup error:', error);
  }
}

function cleanOldBackups() {
  try {
    const files = fs.readdirSync(backupDir);
    const now = Date.now();
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;

    for (const file of files) {
      const filePath = path.join(backupDir, file);
      const stats = fs.statSync(filePath);
      
      if (now - stats.mtimeMs > sevenDaysMs) {
        fs.unlinkSync(filePath);
        logger.info(`Cleaned old backup: ${file}`);
      }
    }
  } catch (error) {
    logger.error('Error cleaning backups:', error);
  }
}
