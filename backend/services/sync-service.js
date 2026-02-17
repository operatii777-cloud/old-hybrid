import cron from 'node-cron';
import axios from 'axios';
import { getDatabase } from '../database/init-db.js';
import { logger } from '../utils/logger.js';

let syncRunning = false;

export function setupSyncService() {
  const syncInterval = process.env.SYNC_INTERVAL || 300000; // 5 min default
  
  logger.info(`Sync service enabled - interval: ${syncInterval}ms`);

  // Sync every 5 minutes
  cron.schedule('*/5 * * * *', async () => {
    if (syncRunning) return;
    await syncToCloud();
  });
}

async function syncToCloud() {
  if (syncRunning) return;
  syncRunning = true;

  try {
    const db = getDatabase();
    const cloudServer = process.env.CLOUD_SERVER_URL;
    const cloudKey = process.env.CLOUD_API_KEY;

    if (!cloudServer || !cloudKey) {
      logger.warn('Cloud sync disabled - missing credentials');
      return;
    }

    // Get unsynced records
    const unsyncedRecords = await db.all(
      'SELECT * FROM sync_log WHERE cloud_synced = 0 LIMIT 100'
    );

    if (unsyncedRecords.length === 0) {
      logger.debug('No records to sync');
      syncRunning = false;
      return;
    }

    logger.info(`Syncing ${unsyncedRecords.length} records to cloud...`);

    // Send to cloud
    const response = await axios.post(`${cloudServer}/api/sync`, {
      records: unsyncedRecords,
      pos_id: process.env.POS_ID || 'pos_1'
    }, {
      headers: { 'X-API-Key': cloudKey },
      timeout: 10000
    });

    if (response.status === 200) {
      // Mark as synced
      for (const record of unsyncedRecords) {
        await db.run(
          'UPDATE sync_log SET cloud_synced = 1 WHERE id = ?',
          [record.id]
        );
      }
      logger.info(`✅ Synced ${unsyncedRecords.length} records`);
    }
  } catch (error) {
    logger.warn('Sync failed (will retry):', error.message);
  } finally {
    syncRunning = false;
  }
}
