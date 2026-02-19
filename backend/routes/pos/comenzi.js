import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from '../../database/init-db.js';
import { logger } from '../../utils/logger.js';
import { descarcareStocuriLaComanda } from '../../services/descarcare-stocuri-service.js';

const router = express.Router();

// Get comanda deschisă (memorată sau plasată) pentru o masă
router.get('/masa/:masa_id', async (req, res) => {
  try {
    const db = getDatabase();
    const comanda = await db.get(
      `SELECT c.id, c.masa_id, c.ospatar_id, c.status, c.total 
       FROM comenzi c 
       WHERE c.masa_id = ? AND c.status IN ('memorata', 'plasata') 
       ORDER BY c.data DESC LIMIT 1`,
      [req.params.masa_id]
    );
    if (!comanda) return res.json(null);
    const linii = await db.all(
      `SELECT cl.cod_prod, cl.cant, cl.pret_unitar, cl.valoare, pp.den_prod 
       FROM comenzi_linii cl 
       LEFT JOIN produse_pos pp ON pp.cod_prod = cl.cod_prod 
       WHERE cl.comanda_id = ?`,
      [comanda.id]
    );
    res.json({ ...comanda, linii });
  } catch (error) {
    logger.error('Get comanda masa error:', error);
    res.status(500).json({ error: 'Eroare la preluarea comenzii' });
  }
});

// Listă comenzi memorate (pentru plan mese - badge pe mese)
router.get('/memorate', async (req, res) => {
  try {
    const db = getDatabase();
    const { masa_id } = req.query;
    let query = `
      SELECT c.id, c.masa_id, c.ospatar_id, c.status, c.total, c.data
      FROM comenzi c
      WHERE c.status = 'memorata'
    `;
    const params = [];
    if (masa_id) { query += ' AND c.masa_id = ?'; params.push(masa_id); }
    query += ' ORDER BY c.data DESC';
    const list = await db.all(query, params);
    res.json(list);
  } catch (error) {
    logger.error('Get comenzi memorate error:', error);
    res.status(500).json({ error: 'Eroare' });
  }
});

// Create order – produsele trebuie să fie din produse_pos (același catalog folosit la facturare și descărcare stocuri)
// status: 'plasata' (implicit) sau 'memorata' (la MEMO)
router.post('/', async (req, res) => {
  const { masa_id, ospatar_id, linii, status = 'plasata' } = req.body;
  
  if (!masa_id || !ospatar_id || !linii) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  if (!Array.isArray(linii) || linii.length === 0) {
    return res.status(400).json({ error: 'Comanda trebuie să conțină cel puțin o linie' });
  }
  const orderStatus = status === 'memorata' ? 'memorata' : 'plasata';

  try {
    const db = getDatabase();

    // Validare: toate cod_prod din linii trebuie să existe în produse_pos (același catalog ca la facturare și stocuri)
    const coduriUnice = [...new Set(linii.map((l) => l.cod_prod).filter(Boolean))];
    if (coduriUnice.length === 0) {
      return res.status(400).json({ error: 'Fiecare linie trebuie să aibă cod_prod' });
    }
    const placeholders = coduriUnice.map(() => '?').join(',');
    const existente = await db.all(
      `SELECT cod_prod FROM produse_pos WHERE cod_prod IN (${placeholders})`,
      coduriUnice
    );
    const coduriValide = new Set((existente || []).map((r) => r.cod_prod));
    const invalide = coduriUnice.filter((c) => !coduriValide.has(c));
    if (invalide.length > 0) {
      return res.status(400).json({
        error: 'Produse invalide: codurile nu sunt în catalogul POS (produse_pos). Același catalog este folosit la facturare și descărcare stocuri.',
        coduri_invalide: invalide
      });
    }
    const comanda_id = uuidv4();
    let total = 0;

    // Calculate total
    for (const linie of linii) {
      total += linie.valoare;
    }

    // La MEMO: șterge comanda memorată existentă pentru această masă (replace)
    if (orderStatus === 'memorata') {
      const existente = await db.all("SELECT id FROM comenzi WHERE masa_id = ? AND status = 'memorata'", [masa_id]);
      for (const ex of existente || []) {
        await db.run('DELETE FROM comenzi_linii WHERE comanda_id = ?', [ex.id]);
        await db.run('DELETE FROM comenzi WHERE id = ?', [ex.id]);
      }
    }

    // Insert order
    await db.run(
      `INSERT INTO comenzi (id, masa_id, ospatar_id, status, total) 
       VALUES (?, ?, ?, ?, ?)`,
      [comanda_id, masa_id, ospatar_id, orderStatus, total]
    );

    // Insert lines
    for (const linie of linii) {
      const linie_id = uuidv4();
      await db.run(
        `INSERT INTO comenzi_linii (id, comanda_id, cod_prod, cant, pret_unitar, valoare)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [linie_id, comanda_id, linie.cod_prod, linie.cant, linie.pret_unitar, linie.valoare]
      );
    }

    // Update table status
    await db.run('UPDATE mese SET status = ?, ospatar_id = ? WHERE id = ?', 
      ['ocupata', ospatar_id, masa_id]);

    // Queue sync
    if (process.env.CLOUD_ENABLED === 'true') {
      await db.run(
        `INSERT INTO sync_log (id, table_name, record_id, action) 
         VALUES (?, ?, ?, ?)`,
        [uuidv4(), 'comenzi', comanda_id, 'insert']
      );
    }

    logger.info(`Order created: ${comanda_id} at table ${masa_id}`);

    res.json({
      success: true,
      comanda_id: comanda_id,
      total: total
    });
  } catch (error) {
    logger.error('Create order error:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

// Actualizare linii comandă (pentru memorată modificată)
router.put('/:id/linii', async (req, res) => {
  const { id: comandaId } = req.params;
  const { linii } = req.body;
  if (!Array.isArray(linii) || linii.length === 0) {
    return res.status(400).json({ error: 'linii este obligatoriu (array nevid)' });
  }
  try {
    const db = getDatabase();
    const comanda = await db.get('SELECT id FROM comenzi WHERE id = ? AND status IN (?, ?)', [comandaId, 'memorata', 'plasata']);
    if (!comanda) return res.status(404).json({ error: 'Comandă negăsită sau deja finalizată' });
    const coduriUnice = [...new Set(linii.map(l => l.cod_prod).filter(Boolean))];
    const placeholders = coduriUnice.map(() => '?').join(',');
    const existente = await db.all(`SELECT cod_prod FROM produse_pos WHERE cod_prod IN (${placeholders})`, coduriUnice);
    const coduriValide = new Set((existente || []).map(r => r.cod_prod));
    const invalide = coduriUnice.filter(c => !coduriValide.has(c));
    if (invalide.length > 0) return res.status(400).json({ error: 'Produse invalide', coduri_invalide: invalide });
    let total = 0;
    for (const l of linii) total += Number(l.valoare) || 0;
    await db.run('DELETE FROM comenzi_linii WHERE comanda_id = ?', [comandaId]);
    for (const linie of linii) {
      await db.run(
        'INSERT INTO comenzi_linii (id, comanda_id, cod_prod, cant, pret_unitar, valoare) VALUES (?, ?, ?, ?, ?, ?)',
        [uuidv4(), comandaId, linie.cod_prod, linie.cant, linie.pret_unitar, linie.valoare]
      );
    }
    await db.run('UPDATE comenzi SET total = ? WHERE id = ?', [total, comandaId]);
    res.json({ success: true, total });
  } catch (error) {
    logger.error('Update linii error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Finalizare comandă: status finalizat + descărcare stocuri (o singură dată)
router.put('/:id/finalizare', async (req, res) => {
  const { id: comandaId } = req.params;
  const { tip_plata, tip_pret, discount_ordin, voucher_cod, discount_voucher } = req.body;

  try {
    const db = getDatabase();
    const comanda = await db.get('SELECT id, status, stocuri_descarcate, masa_id, total FROM comenzi WHERE id = ?', [comandaId]);
    if (!comanda) {
      return res.status(404).json({ error: 'Comandă negăsită' });
    }

    if (comanda.status === 'finalizat') {
      return res.json({ success: true, message: 'Comanda era deja finalizată' });
    }

    // Descărcare stocuri doar dacă nu s-a făcut deja
    if (!comanda.stocuri_descarcate) {
      const result = await descarcareStocuriLaComanda(comandaId);
      if (!result.ok) {
        return res.status(400).json({
          error: result.error || 'Stocuri insuficiente',
          detalii: result.detalii
        });
      }
    }

    const tipVal = tip_plata != null ? tip_plata : 1;
    const isProtocol = (tipVal === 5 || tipVal === '5');
    const discountVal = isProtocol ? 100 : (Number(discount_ordin) || 0);
    const discountVoucherVal = Number(discount_voucher) || 0;

    await db.run(
      `UPDATE comenzi SET status = ?, stocuri_descarcate = 1, tip_plata = ?, discount = ?,
        discount_voucher = COALESCE(discount_voucher, ?),
        voucher_cod = COALESCE(voucher_cod, ?),
        tip_pret = COALESCE(tip_pret, ?)
       WHERE id = ?`,
      ['finalizat', tipVal, discountVal, discountVoucherVal, voucher_cod || null, tip_pret || 'PRET1', comandaId]
    );
    await db.run('UPDATE mese SET status = ?, ospatar_id = NULL WHERE id = ?', ['libera', comanda.masa_id]);

    // Audit: log finalizare with payment type, discounts, protocol
    try {
      const auditDetails = { tip_plata: tipVal, discount_ordin: discountVal, discount_voucher: discountVoucherVal, voucher_cod, tip_pret, total: comanda.total };
      const { logAuditAction } = await import('../../middleware/audit.js');
      await logAuditAction({
        user_id: 'system',
        user_nume: 'POS',
        user_rol: 'OSPATAR',
        actiune: isProtocol ? 'PROTOCOL_PAYMENT' : 'COMANDA_FINALIZARE',
        entitate: 'comenzi',
        entitate_id: comandaId,
        descriere: `Comandă ${comandaId} finalizată. Plată: ${tipVal}${isProtocol ? ' (PROTOCOL - 0 RON)' : ''}${discountVal > 0 ? `, disc ${discountVal}%` : ''}${voucher_cod ? `, voucher ${voucher_cod}` : ''}`,
        categorie: 'financial',
        nivel_risc: (isProtocol || discountVal > 0 || discountVoucherVal > 0) ? 'medium' : 'low',
        valori_noi: JSON.stringify(auditDetails)
      });
    } catch (auditErr) {
      logger.warn('Audit finalizare error:', auditErr.message);
    }

    // Push to KDS (fire and forget)
    try {
      const linii = await db.all('SELECT * FROM comenzi_linii WHERE comanda_id = ?', [comandaId]);
      if (linii.length > 0) {
        const { getDatabase: getDb } = await import('../../database/init-db.js');
        const { detectStatie } = await import('../../utils/kds-routing.js');
        const coduri = [...new Set(linii.map(l => l.cod_prod))];
        const placeholders = coduri.map(() => '?').join(',');
        const produse = coduri.length > 0 ? await getDb().all(`SELECT cod_prod, den_prod, grupa FROM produse_pos WHERE cod_prod IN (${placeholders})`, coduri) : [];
        const produseMap = Object.fromEntries(produse.map(p => [p.cod_prod, p]));
        for (const linie of linii) {
          const produs = produseMap[linie.cod_prod] || {};
          const statie = detectStatie(produs.den_prod || '', produs.grupa);
          await getDb().run(
            `INSERT OR IGNORE INTO kds_items (comanda_id, linie_id, cod_prod, den_prod, cant, statie, masa_id)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [comandaId, linie.id, linie.cod_prod, produs.den_prod || String(linie.cod_prod), linie.cant, statie, comanda.masa_id]
          ).catch(() => {});
        }
      }
    } catch (kdsErr) {
      logger.warn('KDS push error (non-fatal):', kdsErr.message);
    }

    logger.info(`Comandă finalizată: ${comandaId}`);
    res.json({ success: true, message: 'Comandă finalizată' });
  } catch (error) {
    logger.error('Finalizare comandă error:', error);
    res.status(500).json({ error: error.message || 'Eroare la finalizare' });
  }
});

export default router;
