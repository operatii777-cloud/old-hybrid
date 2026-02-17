import express from 'express';
import { getDatabase } from '../../database/init-db.js';
import { logger } from '../../utils/logger.js';

const router = express.Router();
const db = () => getDatabase();

/** Produse POS fără rețetă definită */
router.get('/produse-fara-reteta', async (req, res) => {
  try {
    const produse = await db().all('SELECT cod_prod, den_prod, grupa FROM produse_pos WHERE status = 1');
    const coduriCuReteta = await db().all('SELECT DISTINCT cod_ret FROM retete WHERE cod_ret IS NOT NULL');
    const setReteta = new Set((coduriCuReteta || []).map(r => Number(r.cod_ret)));
    const fara = (produse || []).filter(p => !setReteta.has(Number(p.cod_prod)));
    res.json(fara);
  } catch (error) {
    logger.error('produse-fara-reteta error:', error);
    res.status(500).json({ error: 'Eroare' });
  }
});

/** Vânzări pe perioadă (comenzi finalizate) */
router.get('/vanzari-perioada', async (req, res) => {
  try {
    const { data_start, data_end } = req.query;
    let where = " WHERE status = 'finalizat' ";
    const params = [];
    if (data_start) { where += ' AND DATE(data) >= ? '; params.push(data_start); }
    if (data_end) { where += ' AND DATE(data) <= ? '; params.push(data_end); }
    const rows = await db().all(`
      SELECT DATE(c.data) as data, COUNT(*) as nr_comenzi, COALESCE(SUM(c.total), 0) as total,
        COALESCE(SUM(CASE WHEN c.tip_plata = 1 THEN c.total ELSE 0 END), 0) as cash,
        COALESCE(SUM(CASE WHEN c.tip_plata = 2 THEN c.total ELSE 0 END), 0) as card,
        COALESCE(SUM(CASE WHEN c.tip_plata = 5 THEN c.total ELSE 0 END), 0) as protocol
      FROM comenzi c ${where}
      GROUP BY DATE(c.data) ORDER BY data DESC LIMIT 90
    `, params);
    res.json(rows);
  } catch (error) {
    logger.error('vanzari-perioada error:', error);
    res.status(500).json({ error: 'Eroare' });
  }
});

/** Jurnal casă - intrări/ieșiri pe tip plată */
router.get('/jurnal-casa', async (req, res) => {
  try {
    const { data_start, data_end } = req.query;
    let where = " WHERE status = 'finalizat' ";
    const params = [];
    if (data_start) { where += ' AND DATE(data) >= ? '; params.push(data_start); }
    if (data_end) { where += ' AND DATE(data) <= ? '; params.push(data_end); }
    const rows = await db().all(`
      SELECT c.id, c.data, c.masa_id, c.total, c.tip_plata, c.discount,
        (SELECT GROUP_CONCAT(cl.cod_prod || ' x' || cl.cant) FROM comenzi_linii cl WHERE cl.comanda_id = c.id) as produse
      FROM comenzi c ${where}
      ORDER BY c.data DESC LIMIT 500
    `, params);
    const tipLabels = { 1: 'CASH', 2: 'CARD', 3: 'VIRAMENT', 4: 'PROF', 5: 'PROTOCOL' };
    res.json((rows || []).map(r => ({ ...r, tip_plata_label: tipLabels[r.tip_plata] || r.tip_plata })));
  } catch (error) {
    logger.error('jurnal-casa error:', error);
    res.status(500).json({ error: 'Eroare' });
  }
});

/** Raport furnizori: lista furnizori cu total NIR (cantitate/valoare) */
router.get('/furnizori', async (req, res) => {
  try {
    const { data_start, data_end } = req.query;
    const params = [];
    const nirFilter = [];
    if (data_start) { nirFilter.push('n.data_factura >= ?'); params.push(data_start); }
    if (data_end) { nirFilter.push('n.data_factura <= ?'); params.push(data_end); }
    const nirWhere = nirFilter.length ? ' AND ' + nirFilter.join(' AND ') : '';
    const query = `
      SELECT f.id, f.cod_client, f.denumire, f.reg_com, f.adresa, f.telefon,
        COUNT(n.id) AS nr_nir,
        COALESCE(SUM(n.valoare), 0) AS total_valoare,
        COALESCE(SUM(n.cant_primita), 0) AS total_cantitate
      FROM furnizori f
      LEFT JOIN nir n ON n.furnizor_id = f.id ${nirWhere}
      WHERE f.active = 1
      GROUP BY f.id
      ORDER BY total_valoare DESC, f.denumire
    `;
    const rows = await db().all(query, params);
    res.json(rows);
  } catch (error) {
    logger.error('Raport furnizori error:', error);
    res.status(500).json({ error: 'Eroare la raport furnizori' });
  }
});

export default router;
