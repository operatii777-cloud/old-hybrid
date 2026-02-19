import express from 'express';
import rateLimit from 'express-rate-limit';
import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from '../../database/init-db.js';
import { logger } from '../../utils/logger.js';
import { logAuditAction } from '../../middleware/audit.js';

const router = express.Router();
const db = () => getDatabase();

// Rate limit for voucher redemption: max 20 redemptions per minute per IP
const redeemLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { ok: false, error: 'Prea multe cereri. Încercați din nou mai târziu.' }
});

// List all vouchers
router.get('/', async (req, res) => {
  try {
    const list = await db().all('SELECT * FROM vouchers ORDER BY creat_la DESC');
    res.json({ ok: true, data: list });
  } catch (error) {
    logger.error('Vouchers list error:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

// Get single voucher
router.get('/:cod', async (req, res) => {
  try {
    const row = await db().get('SELECT * FROM vouchers WHERE cod = ?', [req.params.cod]);
    if (!row) return res.status(404).json({ ok: false, error: 'Voucher negăsit' });
    res.json({ ok: true, data: row });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

// Validate & redeem a voucher (POST /api/vouchers/:cod/redeem)
router.post('/:cod/redeem', redeemLimiter, async (req, res) => {
  const { comanda_id, total, ospatar_id, ospatar_nume } = req.body;
  try {
    const today = new Date().toISOString().split('T')[0];
    const row = await db().get(
      `SELECT * FROM vouchers WHERE cod = ? AND activ = 1
        AND (valabil_de IS NULL OR valabil_de <= ?)
        AND (valabil_pana IS NULL OR valabil_pana >= ?)`,
      [req.params.cod, today, today]
    );
    if (!row) return res.status(400).json({ ok: false, error: 'Voucher invalid sau expirat' });
    if (row.max_utilizari > 0 && row.utilizari_curente >= row.max_utilizari) {
      return res.status(400).json({ ok: false, error: 'Voucher epuizat (număr maxim utilizări atins)' });
    }

    const subtotal = Number(total) || 0;
    let discount = 0;
    if (row.discount_percent > 0) discount = Math.round(subtotal * row.discount_percent / 100 * 100) / 100;
    else if (row.discount_fix > 0) discount = Math.min(row.discount_fix, subtotal);

    // Increment usage counter
    await db().run('UPDATE vouchers SET utilizari_curente = utilizari_curente + 1 WHERE id = ?', [row.id]);

    // Audit
    try {
      await logAuditAction({
        user_id: ospatar_id || 'system',
        user_nume: ospatar_nume || 'Ospătar',
        user_rol: 'OSPATAR',
        actiune: 'VOUCHER_REDEEM',
        entitate: 'vouchers',
        entitate_id: String(row.id),
        descriere: `Voucher ${row.cod} aplicat la comanda ${comanda_id || '-'}, discount ${discount} RON`,
        categorie: 'financial',
        nivel_risc: 'medium',
        valori_noi: JSON.stringify({ cod: row.cod, discount, comanda_id })
      });
    } catch (auditErr) {
      logger.warn('Audit voucher redeem error:', auditErr.message);
    }

    res.json({ ok: true, data: { discount, discount_percent: row.discount_percent, discount_fix: row.discount_fix, voucher: row } });
  } catch (error) {
    logger.error('Voucher redeem error:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

// Create voucher
router.post('/', async (req, res) => {
  try {
    const { cod, denumire, discount_percent, discount_fix, max_utilizari, valabil_de, valabil_pana } = req.body;
    if (!cod || !denumire) return res.status(400).json({ ok: false, error: 'Cod și denumire obligatorii' });
    await db().run(
      `INSERT INTO vouchers (cod, denumire, discount_percent, discount_fix, max_utilizari, valabil_de, valabil_pana)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [cod, denumire, discount_percent || 0, discount_fix || 0, max_utilizari || 1, valabil_de || null, valabil_pana || null]
    );
    const created = await db().get('SELECT * FROM vouchers WHERE cod = ?', [cod]);
    res.status(201).json({ ok: true, data: created });
  } catch (error) {
    if (error.message?.includes('UNIQUE')) return res.status(409).json({ ok: false, error: 'Codul de voucher există deja' });
    logger.error('Create voucher error:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

// Update voucher
router.put('/:id', async (req, res) => {
  try {
    const { denumire, discount_percent, discount_fix, max_utilizari, valabil_de, valabil_pana, activ } = req.body;
    await db().run(
      `UPDATE vouchers SET denumire=COALESCE(?,denumire), discount_percent=COALESCE(?,discount_percent),
        discount_fix=COALESCE(?,discount_fix), max_utilizari=COALESCE(?,max_utilizari),
        valabil_de=COALESCE(?,valabil_de), valabil_pana=COALESCE(?,valabil_pana),
        activ=COALESCE(?,activ) WHERE id=?`,
      [denumire, discount_percent, discount_fix, max_utilizari, valabil_de, valabil_pana, activ, req.params.id]
    );
    const updated = await db().get('SELECT * FROM vouchers WHERE id = ?', [req.params.id]);
    res.json({ ok: true, data: updated });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

// Delete voucher
router.delete('/:id', async (req, res) => {
  try {
    await db().run('DELETE FROM vouchers WHERE id = ?', [req.params.id]);
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

export default router;
