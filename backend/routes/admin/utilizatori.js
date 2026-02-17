import express from 'express';
import { getDatabase } from '../../database/init-db.js';
import { logger } from '../../utils/logger.js';

const router = express.Router();
const db = () => getDatabase();

/** Lista utilizatori (ospetari) */
router.get('/', async (req, res) => {
  try {
    const list = await db().all('SELECT id, nume, pin, created_at FROM ospetari ORDER BY nume');
    res.json(list);
  } catch (error) {
    logger.error('Utilizatori list error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const row = await db().get('SELECT id, nume, pin, created_at FROM ospetari WHERE id = ?', [req.params.id]);
    if (!row) return res.status(404).json({ error: 'Utilizator negăsit' });
    res.json(row);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { id, nume, pin } = req.body;
    if (!id || !nume || !pin) return res.status(400).json({ error: 'Id, nume și pin obligatorii' });
    await db().run('INSERT INTO ospetari (id, nume, pin) VALUES (?, ?, ?)', [id, nume, pin]);
    const created = await db().get('SELECT id, nume, pin, created_at FROM ospetari WHERE id = ?', [id]);
    res.status(201).json(created);
  } catch (error) {
    logger.error('Utilizatori create error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { nume, pin } = req.body;
    if (!nume) return res.status(400).json({ error: 'Nume obligatoriu' });
    await db().run('UPDATE ospetari SET nume = ?, pin = COALESCE(?, pin) WHERE id = ?', [nume, pin, req.params.id]);
    const updated = await db().get('SELECT id, nume, pin, created_at FROM ospetari WHERE id = ?', [req.params.id]);
    res.json(updated);
  } catch (error) {
    logger.error('Utilizatori update error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await db().run('DELETE FROM ospetari WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    logger.error('Utilizatori delete error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
