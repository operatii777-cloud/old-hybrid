import express from 'express';
import { getDatabase } from '../../database/init-db.js';
import { logger } from '../../utils/logger.js';

const router = express.Router();
const db = () => getDatabase();

router.get('/', async (req, res) => {
  try {
    const list = await db().all('SELECT * FROM clienti WHERE active = 1 ORDER BY denumire');
    res.json(list);
  } catch (error) {
    logger.error('Clienti list error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const row = await db().get('SELECT * FROM clienti WHERE id = ?', [req.params.id]);
    if (!row) return res.status(404).json({ error: 'Client negăsit' });
    res.json(row);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { cod_client, denumire, cui, reg_com, adresa, judet, oras, cod_postal, telefon, email, pers_contact, observatii } = req.body;
    if (!denumire) return res.status(400).json({ error: 'Denumire obligatorie' });
    const result = await db().run(
      `INSERT INTO clienti (cod_client, denumire, cui, reg_com, adresa, judet, oras, cod_postal, telefon, email, pers_contact, observatii)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [cod_client || null, denumire, cui || null, reg_com || null, adresa || null, judet || null, oras || null, cod_postal || null, telefon || null, email || null, pers_contact || null, observatii || null]
    );
    const created = await db().get('SELECT * FROM clienti WHERE id = ?', [result.lastID]);
    res.status(201).json(created);
  } catch (error) {
    logger.error('Clienti create error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { cod_client, denumire, cui, reg_com, adresa, judet, oras, cod_postal, telefon, email, pers_contact, observatii, active } = req.body;
    if (!denumire) return res.status(400).json({ error: 'Denumire obligatorie' });
    await db().run(
      `UPDATE clienti SET cod_client=?, denumire=?, cui=?, reg_com=?, adresa=?, judet=?, oras=?, cod_postal=?, telefon=?, email=?, pers_contact=?, observatii=?, active=COALESCE(?, active), updated_at=CURRENT_TIMESTAMP WHERE id=?`,
      [cod_client || null, denumire, cui || null, reg_com || null, adresa || null, judet || null, oras || null, cod_postal || null, telefon || null, email || null, pers_contact || null, observatii || null, active, req.params.id]
    );
    const updated = await db().get('SELECT * FROM clienti WHERE id = ?', [req.params.id]);
    res.json(updated);
  } catch (error) {
    logger.error('Clienti update error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await db().run('UPDATE clienti SET active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    logger.error('Clienti delete error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
