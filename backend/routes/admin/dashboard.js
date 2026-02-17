import express from 'express';
import { getDatabase } from '../../database/init-db.js';
import { logger } from '../../utils/logger.js';

const router = express.Router();

// Dashboard stats
router.get('/stats', async (req, res) => {
  try {
    const db = getDatabase();
    
    const totalOrders = await db.get('SELECT COUNT(*) as cnt FROM comenzi');
    const totalRevenue = await db.get('SELECT SUM(total) as total FROM comenzi');
    const tablesOccupied = await db.get("SELECT COUNT(*) as cnt FROM mese WHERE status = 'ocupata'");

    res.json({
      totalOrders: totalOrders.cnt,
      totalRevenue: totalRevenue.total || 0,
      tablesOccupied: tablesOccupied.cnt,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Stats error:', error);
    res.status(500).json({ error: 'Failed to get stats' });
  }
});

export default router;
