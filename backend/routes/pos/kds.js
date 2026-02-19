import express from 'express';
import rateLimit from 'express-rate-limit';
import { getDatabase } from '../../database/init-db.js';
import { logger } from '../../utils/logger.js';
import { logAuditAction } from '../../middleware/audit.js';
import { detectStatie } from '../../utils/kds-routing.js';

const router = express.Router();
const db = () => getDatabase();

// Rate limit for KDS status updates: max 120 per minute (typical busy kitchen)
const statusLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: { ok: false, error: 'Prea multe cereri.' }
});

// Get KDS board for a station
router.get('/board', async (req, res) => {
  try {
    const { statie = 'bucatarie', status } = req.query;
    let query = `SELECT k.* FROM kds_items k WHERE k.statie = ?`;
    const params = [statie];
    if (status) { query += ' AND k.status = ?'; params.push(status); }
    else query += " AND k.status IN ('pending','preparing','ready')";
    query += ' ORDER BY k.prioritate DESC, k.creat_la ASC';
    const items = await db().all(query, params);
    res.json({ ok: true, data: items });
  } catch (error) {
    logger.error('KDS board error:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

// Get all KDS items for a comanda
router.get('/comanda/:comanda_id', async (req, res) => {
  try {
    const items = await db().all('SELECT * FROM kds_items WHERE comanda_id = ? ORDER BY creat_la', [req.params.comanda_id]);
    res.json({ ok: true, data: items });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

// Update status of a KDS item (status transitions: pending→preparing→ready→served)
router.put('/:id/status', statusLimiter, async (req, res) => {
  const { status, ospatar_id, ospatar_nume } = req.body;
  const validStatuses = ['pending', 'preparing', 'ready', 'served'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ ok: false, error: 'Status invalid' });
  }
  try {
    const item = await db().get('SELECT * FROM kds_items WHERE id = ?', [req.params.id]);
    if (!item) return res.status(404).json({ ok: false, error: 'Item KDS negăsit' });

    const now = new Date().toISOString();
    const updates = { status };
    if (status === 'preparing' && !item.inceput_la) updates.inceput_la = now;
    if (status === 'ready' && !item.gata_la) updates.gata_la = now;
    if (status === 'served' && !item.servit_la) updates.servit_la = now;

    const setClauses = Object.keys(updates).map(k => `${k} = ?`).join(', ');
    await db().run(`UPDATE kds_items SET ${setClauses} WHERE id = ?`, [...Object.values(updates), req.params.id]);

    // Audit
    try {
      await logAuditAction({
        user_id: ospatar_id || 'system',
        user_nume: ospatar_nume || 'KDS',
        user_rol: 'OSPATAR',
        actiune: 'KDS_STATUS_UPDATE',
        entitate: 'kds_items',
        entitate_id: String(req.params.id),
        descriere: `KDS item ${item.den_prod} → ${status}`,
        categorie: 'operational',
        nivel_risc: 'low',
        valori_noi: JSON.stringify({ status, ...updates })
      });
    } catch (auditErr) {
      logger.warn('Audit KDS status error:', auditErr.message);
    }

    const updated = await db().get('SELECT * FROM kds_items WHERE id = ?', [req.params.id]);
    res.json({ ok: true, data: updated });
  } catch (error) {
    logger.error('KDS status update error:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

// Bulk status update for all items of a comanda
router.put('/comanda/:comanda_id/status', async (req, res) => {
  const { status, statie } = req.body;
  const validStatuses = ['pending', 'preparing', 'ready', 'served'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ ok: false, error: 'Status invalid' });
  }
  try {
    const now = new Date().toISOString();
    let query = 'UPDATE kds_items SET status = ?';
    const params = [status];
    if (status === 'preparing') { query += ', inceput_la = COALESCE(inceput_la, ?)'; params.push(now); }
    if (status === 'ready') { query += ', gata_la = COALESCE(gata_la, ?)'; params.push(now); }
    if (status === 'served') { query += ', servit_la = COALESCE(servit_la, ?)'; params.push(now); }
    query += ' WHERE comanda_id = ?';
    params.push(req.params.comanda_id);
    if (statie) { query += ' AND statie = ?'; params.push(statie); }
    await db().run(query, params);
    res.json({ ok: true });
  } catch (error) {
    logger.error('KDS bulk status error:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

// Push all lines of a comanda to KDS (called from finalizare order flow)
router.post('/push', async (req, res) => {
  const { comanda_id, masa_id, ospatar_id, linii } = req.body;
  if (!comanda_id || !Array.isArray(linii) || linii.length === 0) {
    return res.status(400).json({ ok: false, error: 'comanda_id și linii sunt obligatorii' });
  }
  try {
    // Get product groups for station routing
    const coduri = [...new Set(linii.map(l => l.cod_prod))];
    const placeholders = coduri.map(() => '?').join(',');
    const produse = coduri.length > 0
      ? await db().all(`SELECT cod_prod, den_prod, grupa FROM produse_pos WHERE cod_prod IN (${placeholders})`, coduri)
      : [];
    const produseMap = Object.fromEntries(produse.map(p => [p.cod_prod, p]));

    for (const linie of linii) {
      const produs = produseMap[linie.cod_prod] || {};
      const statie = detectStatie(linie.den_prod || produs.den_prod, produs.grupa);
      await db().run(
        `INSERT INTO kds_items (comanda_id, linie_id, cod_prod, den_prod, cant, statie, masa_id, ospatar_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [comanda_id, linie.id || null, linie.cod_prod, linie.den_prod, linie.cant, statie, masa_id || null, ospatar_id || null]
      );
    }
    res.json({ ok: true });
  } catch (error) {
    logger.error('KDS push error:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

export default router;
