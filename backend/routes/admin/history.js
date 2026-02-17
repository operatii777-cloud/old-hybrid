import express from 'express';
import { getDatabase } from '../../database/init-db.js';
import { logger } from '../../utils/logger.js';

const router = express.Router();
const db = () => getDatabase();

// ===== BONURI - RECEIPTS HISTORY =====
router.get('/bonuri', async (req, res) => {
  try {
    const bonuri = await db().all(`
      SELECT * FROM bonuri_istoric 
      ORDER BY data_bon DESC
      LIMIT 100
    `);
    res.json(bonuri);
  } catch (error) {
    logger.error('Bonuri history error:', error);
    res.status(500).json({ error: 'Eroare la preluarea bonurilor' });
  }
});

router.get('/bonuri/:id', async (req, res) => {
  try {
    const bon = await db().get(
      'SELECT * FROM bonuri_istoric WHERE id = ?',
      [req.params.id]
    );
    res.json(bon);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===== COMENZI ISTORIC - ORDER HISTORY =====
router.get('/comenzi-istoric', async (req, res) => {
  try {
    const comenzi = await db().all(`
      SELECT * FROM comenzi_istoric 
      ORDER BY data DESC
      LIMIT 100
    `);
    res.json(comenzi);
  } catch (error) {
    logger.error('Order history error:', error);
    res.status(500).json({ error: 'Eroare la preluarea istoricului comenzilor' });
  }
});

router.get('/comenzi-istoric/masa/:nr_masa', async (req, res) => {
  try {
    const comenzi = await db().all(
      `SELECT * FROM comenzi_istoric WHERE nr_masa = ? ORDER BY data DESC`,
      [req.params.nr_masa]
    );
    res.json(comenzi);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/comenzi-istoric/ospatar/:nr_osp', async (req, res) => {
  try {
    const comenzi = await db().all(
      `SELECT * FROM comenzi_istoric WHERE nr_osp = ? ORDER BY data DESC`,
      [req.params.nr_osp]
    );
    res.json(comenzi);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===== RAPOARTE STOCURI - STOCK REPORTS =====
router.get('/rapoarte-stocuri', async (req, res) => {
  try {
    const rapoarte = await db().all(`
      SELECT * FROM rapoarte_stocuri 
      ORDER BY data DESC
    `);
    res.json(rapoarte);
  } catch (error) {
    logger.error('Reports error:', error);
    res.status(500).json({ error: 'Eroare la preluarea rapoartelor' });
  }
});

router.get('/rapoarte-stocuri/produs/:denumire', async (req, res) => {
  try {
    const rapoarte = await db().all(`
      SELECT * FROM rapoarte_stocuri 
      WHERE denumire LIKE ?
      ORDER BY data DESC
    `, [`%${req.params.denumire}%`]);
    res.json(rapoarte);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===== UNITĂȚI MĂSURĂ - UNIT CONVERSIONS =====
router.get('/um-conversie', async (req, res) => {
  try {
    const um = await db().all('SELECT * FROM um_conversie ORDER BY um1');
    res.json(um);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===== MATERIAL COST - COSTING =====
router.get('/material-cost', async (req, res) => {
  try {
    const materials = await db().all(`
      SELECT * FROM material_cost ORDER BY denumire
    `);
    res.json(materials);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/material-cost/:grupa', async (req, res) => {
  try {
    const materials = await db().all(`
      SELECT * FROM material_cost WHERE grupa = ? ORDER BY denumire
    `, [req.params.grupa]);
    res.json(materials);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===== PRODUSE POS - POS PRODUCTS =====
router.get('/produse-pos', async (req, res) => {
  try {
    const produse = await db().all(`
      SELECT * FROM produse_pos ORDER BY den_prod
    `);
    res.json(produse);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/produse-pos/:cod_prod', async (req, res) => {
  try {
    const produs = await db().get(
      'SELECT * FROM produse_pos WHERE cod_prod = ?',
      [req.params.cod_prod]
    );
    res.json(produs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===== CONFIGURARE SISTEM - SYSTEM CONFIG =====
router.get('/config', async (req, res) => {
  try {
    const config = await db().all('SELECT * FROM config_sistem WHERE active = 1');
    res.json(config);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/config/:key', async (req, res) => {
  try {
    const config = await db().get(
      'SELECT * FROM config_sistem WHERE config_key = ?',
      [req.params.key]
    );
    res.json(config);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===== ANALYTICS / STATISTICS =====
router.get('/stats/bonuri-total', async (req, res) => {
  try {
    const stats = await db().get(`
      SELECT 
        COUNT(*) as count,
        SUM(valoare) as total,
        AVG(valoare) as average,
        MIN(data_bon) as first,
        MAX(data_bon) as last
      FROM bonuri_istoric
    `);
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/stats/comenzi-per-masa', async (req, res) => {
  try {
    const stats = await db().all(`
      SELECT 
        nr_masa,
        COUNT(*) as comenzi_count,
        SUM(valoare) as total_valoare
      FROM comenzi_istoric
      GROUP BY nr_masa
      ORDER BY comenzi_count DESC
    `);
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/stats/rapoarte-by-produs', async (req, res) => {
  try {
    const stats = await db().all(`
      SELECT 
        denumire,
        COUNT(*) as entries,
        SUM(num7) as total_stock,
        MAX(num8) as max_value
      FROM rapoarte_stocuri
      WHERE num7 > 0
      GROUP BY denumire
      ORDER BY total_stock DESC
      LIMIT 50
    `);
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
