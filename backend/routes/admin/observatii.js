import express from 'express';
import { getDatabase } from '../../database/init-db.js';
import { logger } from '../../utils/logger.js';

const router = express.Router();
const db = () => getDatabase();

router.get('/', async (req, res) => {
  try {
    const { tip_entitate, entitate_id } = req.query;
    let query = 'SELECT * FROM observatii WHERE 1=1';
    const params = [];
    if (tip_entitate) { query += ' AND tip_entitate = ?'; params.push(tip_entitate); }
    if (entitate_id) { query += ' AND entitate_id = ?'; params.push(entitate_id); }
    query += ' ORDER BY data_observatie DESC';
    const list = await db().all(query, params);
    res.json(list);
  } catch (error) {
    logger.error('Observatii list error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const row = await db().get('SELECT * FROM observatii WHERE id = ?', [req.params.id]);
    if (!row) return res.status(404).json({ error: 'Observație negăsită' });
    res.json(row);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { tip_entitate, entitate_id, text_observatie, user_id } = req.body;
    if (!tip_entitate || !entitate_id || !text_observatie) return res.status(400).json({ error: 'Tip entitate, entitate_id și text obligatorii' });
    const result = await db().run(
      'INSERT INTO observatii (tip_entitate, entitate_id, text_observatie, user_id) VALUES (?, ?, ?, ?)',
      [tip_entitate, entitate_id, text_observatie, user_id || null]
    );
    const created = await db().get('SELECT * FROM observatii WHERE id = ?', [result.lastID]);
    res.status(201).json(created);
  } catch (error) {
    logger.error('Observatii create error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { text_observatie } = req.body;
    if (!text_observatie) return res.status(400).json({ error: 'Text observație obligatoriu' });
    await db().run('UPDATE observatii SET text_observatie = ? WHERE id = ?', [text_observatie, req.params.id]);
    const updated = await db().get('SELECT * FROM observatii WHERE id = ?', [req.params.id]);
    res.json(updated);
  } catch (error) {
    logger.error('Observatii update error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await db().run('DELETE FROM observatii WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    logger.error('Observatii delete error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
