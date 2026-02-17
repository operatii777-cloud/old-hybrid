import express from 'express';
import { getDatabase } from '../../database/init-db.js';
import { logger } from '../../utils/logger.js';

const router = express.Router();
const db = () => getDatabase();

router.get('/', async (req, res) => {
  try {
    const list = await db().all('SELECT * FROM promotii ORDER BY data_start DESC');
    res.json(list);
  } catch (error) {
    logger.error('Promotii list error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const row = await db().get('SELECT * FROM promotii WHERE id = ?', [req.params.id]);
    if (!row) return res.status(404).json({ error: 'Promoție negăsită' });
    res.json(row);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { denumire, discount_percent, discount_fix, cod_produs, data_start, data_end, observatii } = req.body;
    if (!denumire || !data_start || !data_end) return res.status(400).json({ error: 'Denumire, data start și data end obligatorii' });
    const result = await db().run(
      `INSERT INTO promotii (denumire, discount_percent, discount_fix, cod_produs, data_start, data_end, observatii)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [denumire, discount_percent || 0, discount_fix || 0, cod_produs || null, data_start, data_end, observatii || null]
    );
    const created = await db().get('SELECT * FROM promotii WHERE id = ?', [result.lastID]);
    res.status(201).json(created);
  } catch (error) {
    logger.error('Promotii create error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { denumire, discount_percent, discount_fix, cod_produs, data_start, data_end, activa, observatii } = req.body;
    await db().run(
      `UPDATE promotii SET denumire=COALESCE(?, denumire), discount_percent=COALESCE(?, discount_percent), discount_fix=COALESCE(?, discount_fix),
        cod_produs=?, data_start=COALESCE(?, data_start), data_end=COALESCE(?, data_end), activa=COALESCE(?, activa), observatii=? WHERE id=?`,
      [denumire, discount_percent, discount_fix, cod_produs, data_start, data_end, activa, observatii, req.params.id]
    );
    const updated = await db().get('SELECT * FROM promotii WHERE id = ?', [req.params.id]);
    res.json(updated);
  } catch (error) {
    logger.error('Promotii update error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await db().run('DELETE FROM promotii WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    logger.error('Promotii delete error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
