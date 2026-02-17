import express from 'express';
import { getDatabase } from '../../database/init-db.js';
import { logger } from '../../utils/logger.js';

const router = express.Router();
const db = () => getDatabase();

router.get('/', async (req, res) => {
  try {
    const list = await db().all('SELECT * FROM grupe WHERE active = 1 ORDER BY ordine, cod');
    res.json(list);
  } catch (error) {
    logger.error('Grupe list error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const row = await db().get('SELECT * FROM grupe WHERE id = ?', [req.params.id]);
    if (!row) return res.status(404).json({ error: 'Grupă negăsită' });
    res.json(row);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { cod, denumire, ordine } = req.body;
    if (!cod || !denumire) return res.status(400).json({ error: 'Cod și denumire obligatorii' });
    const result = await db().run(
      'INSERT INTO grupe (cod, denumire, ordine) VALUES (?, ?, ?)',
      [cod, denumire, ordine != null ? ordine : 0]
    );
    const created = await db().get('SELECT * FROM grupe WHERE id = ?', [result.lastID]);
    res.status(201).json(created);
  } catch (error) {
    logger.error('Grupe create error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { cod, denumire, ordine, active } = req.body;
    if (!denumire) return res.status(400).json({ error: 'Denumire obligatorie' });
    await db().run(
      'UPDATE grupe SET cod=COALESCE(?, cod), denumire=?, ordine=COALESCE(?, ordine), active=COALESCE(?, active) WHERE id=?',
      [cod, denumire, ordine, active, req.params.id]
    );
    const updated = await db().get('SELECT * FROM grupe WHERE id = ?', [req.params.id]);
    res.json(updated);
  } catch (error) {
    logger.error('Grupe update error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await db().run('DELETE FROM grupe WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    logger.error('Grupe delete error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
