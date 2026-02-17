import express from 'express';
import { getDatabase } from '../../database/init-db.js';
import { logger } from '../../utils/logger.js';

const router = express.Router();

// Get all tables
router.get('/', async (req, res) => {
  try {
    const db = getDatabase();
    const mese = await db.all('SELECT * FROM mese');
    res.json(mese);
  } catch (error) {
    logger.error('Get mese error:', error);
    res.status(500).json({ error: 'Failed to get tables' });
  }
});

// Get table details
router.get('/:id', async (req, res) => {
  try {
    const db = getDatabase();
    const masa = await db.get('SELECT * FROM mese WHERE id = ?', [req.params.id]);
    if (!masa) return res.status(404).json({ error: 'Table not found' });
    res.json(masa);
  } catch (error) {
    logger.error('Get masa error:', error);
    res.status(500).json({ error: 'Failed to get table' });
  }
});

// Update table
router.put('/:id', async (req, res) => {
  const { status, ospatar_id } = req.body;
  try {
    const db = getDatabase();
    await db.run(
      'UPDATE mese SET status = ?, ospatar_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [status, ospatar_id, req.params.id]
    );
    res.json({ success: true });
  } catch (error) {
    logger.error('Update masa error:', error);
    res.status(500).json({ error: 'Failed to update table' });
  }
});

export default router;
