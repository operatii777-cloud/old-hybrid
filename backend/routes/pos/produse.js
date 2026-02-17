import express from 'express';
import { getDatabase } from '../../database/init-db.js';
import { logger } from '../../utils/logger.js';

const router = express.Router();

// Get all products
router.get('/', async (req, res) => {
  try {
    const db = getDatabase();
    const produse = await db.all('SELECT * FROM produse ORDER BY categorie, den_prod');
    res.json(produse);
  } catch (error) {
    logger.error('Get produse error:', error);
    res.status(500).json({ error: 'Failed to get products' });
  }
});

// Get products by category
router.get('/categoria/:categorie', async (req, res) => {
  try {
    const db = getDatabase();
    const produse = await db.all(
      'SELECT * FROM produse WHERE categorie = ? ORDER BY den_prod',
      [req.params.categorie]
    );
    res.json(produse);
  } catch (error) {
    logger.error('Get produse by category error:', error);
    res.status(500).json({ error: 'Failed to get products' });
  }
});

export default router;
