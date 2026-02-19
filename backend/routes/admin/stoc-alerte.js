import express from 'express';
import rateLimit from 'express-rate-limit';
import { getDatabase } from '../../database/init-db.js';
import { logger } from '../../utils/logger.js';

const router = express.Router();
const db = () => getDatabase();

const alertesLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { ok: false, error: 'Prea multe cereri.' }
});

/**
 * GET /api/stoc/alerte
 * Returns unresolved low-stock alerts, checking current stock against minimums.
 * Also upserts new alerts for items below minimum.
 */
router.get('/alerte', alertesLimiter, async (req, res) => {
  try {
    // Detect items below minimum across all gestiuni
    const subMinim = await db().all(`
      SELECT s.cod_material, m.denumire, s.gestiune_id, s.cant_stoc, s.cant_minim
      FROM stocuri s
      LEFT JOIN materii_prime m ON m.cod = s.cod_material
      WHERE s.cant_stoc < s.cant_minim AND s.cant_minim > 0
    `);

    for (const item of subMinim) {
      // Use INSERT OR IGNORE to avoid duplicates (rezolvata=0)
      await db().run(
        `INSERT OR IGNORE INTO alerte_stoc_scazut
           (cod_material, denumire, gestiune_id, stoc_curent, stoc_minim)
         VALUES (?, ?, ?, ?, ?)`,
        [item.cod_material, item.denumire || `Produs ${item.cod_material}`, item.gestiune_id, item.cant_stoc, item.cant_minim]
      ).catch(() => {
        // Update stoc_curent for existing unresolved alert
        return db().run(
          `UPDATE alerte_stoc_scazut SET stoc_curent = ? WHERE cod_material = ? AND gestiune_id = ? AND rezolvata = 0`,
          [item.cant_stoc, item.cod_material, item.gestiune_id]
        );
      });
    }

    // Auto-resolve alerts where stock is now above minimum
    await db().run(`
      UPDATE alerte_stoc_scazut SET rezolvata = 1
      WHERE rezolvata = 0 AND id NOT IN (
        SELECT a.id FROM alerte_stoc_scazut a
        INNER JOIN stocuri s ON s.cod_material = a.cod_material AND s.gestiune_id = a.gestiune_id
        WHERE s.cant_stoc < s.cant_minim AND s.cant_minim > 0 AND a.rezolvata = 0
      )
    `);

    const alerte = await db().all(
      `SELECT * FROM alerte_stoc_scazut WHERE rezolvata = 0 ORDER BY creat_la DESC`
    );
    res.json({ ok: true, data: alerte });
  } catch (error) {
    logger.error('Low stock alerts error:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

// Mark an alert as resolved
router.put('/alerte/:id/rezolva', alertesLimiter, async (req, res) => {
  try {
    await db().run('UPDATE alerte_stoc_scazut SET rezolvata = 1 WHERE id = ?', [req.params.id]);
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

export default router;
