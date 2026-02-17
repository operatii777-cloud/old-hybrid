import express from 'express';
import { getDatabase } from '../../database/init-db.js';
import { logger } from '../../utils/logger.js';

const router = express.Router();
const db = () => getDatabase();

// ===== SESIUNI CASA =====

// Obține sesiunea activă pentru operator
router.get('/sesiune-activa/:operatorId', async (req, res) => {
  try {
    const sesiune = await db().get(`
      SELECT * FROM sesiuni_casa 
      WHERE operator_id = ? AND status = 'deschisa'
      ORDER BY id DESC LIMIT 1
    `, [req.params.operatorId]);
    
    res.json(sesiune || null);
  } catch (error) {
    logger.error('Error getting active session:', error);
    res.status(500).json({ error: 'Eroare la preluarea sesiunii active' });
  }
});

// Deschide sesiune nouă
router.post('/deschide-sesiune', async (req, res) => {
  try {
    const { operator_id, operator_nume, numerar_initial, observatii } = req.body;
    
    // Verifică dacă operatorul are deja o sesiune deschisă
    const sesiuneExistenta = await db().get(`
      SELECT id FROM sesiuni_casa 
      WHERE operator_id = ? AND status = 'deschisa'
    `, [operator_id]);
    
    if (sesiuneExistenta) {
      return res.status(400).json({ 
        error: 'Operatorul are deja o sesiune deschisă',
        sesiune_id: sesiuneExistenta.id
      });
    }
    
    const now = new Date();
    const data = now.toISOString().split('T')[0];
    const ora = now.toTimeString().split(' ')[0];
    const nr_sesiune = `S${Date.now()}`;
    
    const result = await db().run(`
      INSERT INTO sesiuni_casa (
        nr_sesiune, operator_id, operator_nume, data_deschidere, ora_deschidere, 
        numerar_initial, observatii
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [nr_sesiune, operator_id, operator_nume, data, ora, numerar_initial || 0, observatii]);
    
    // Obține sesiunea creată
    const sesiune = await db().get('SELECT * FROM sesiuni_casa WHERE id = ?', [result.lastID]);
    
    logger.info(`Sesiune deschisă: ${nr_sesiune} pentru ${operator_nume}`);
    res.json({ success: true, sesiune });
  } catch (error) {
    logger.error('Error opening session:', error);
    res.status(500).json({ error: error.message });
  }
});

// Închide sesiune
router.put('/inchide-sesiune/:sesiuneId', async (req, res) => {
  try {
    const { numerar_final, observatii } = req.body;
    
    // Obține sesiunea
    const sesiune = await db().get('SELECT * FROM sesiuni_casa WHERE id = ? AND status = "deschisa"', [req.params.sesiuneId]);
    if (!sesiune) {
      return res.status(404).json({ error: 'Sesiune nu a fost găsită sau este deja închisă' });
    }
    
    // Calculează totalurile din tranzacții
    const stats = await db().get(`
      SELECT 
        COUNT(*) as total_comenzi,
        COALESCE(SUM(CASE WHEN tip_plata = 'CASH' THEN suma ELSE 0 END), 0) as total_cash,
        COALESCE(SUM(CASE WHEN tip_plata = 'CARD' THEN suma ELSE 0 END), 0) as total_card,
        COALESCE(SUM(suma), 0) as total_incasari
      FROM tranzactii_sesiune 
      WHERE sesiune_id = ?
    `, [req.params.sesiuneId]);
    
    const diferenta_numerar = (numerar_final || 0) - (sesiune.numerar_initial + stats.total_cash);
    
    const now = new Date();
    const data = now.toISOString().split('T')[0];
    const ora = now.toTimeString().split(' ')[0];
    
    await db().run(`
      UPDATE sesiuni_casa SET 
        data_inchidere = ?, ora_inchidere = ?, numerar_final = ?, diferenta_numerar = ?,
        total_incasari_cash = ?, total_incasari_card = ?, total_incasari = ?, 
        total_comenzi = ?, status = 'inchisa', observatii = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [
      data, ora, numerar_final || 0, diferenta_numerar,
      stats.total_cash, stats.total_card, stats.total_incasari,
      stats.total_comenzi, observatii, req.params.sesiuneId
    ]);
    
    // Actualizează controlul zilnic
    await updateControlZilnic(data);
    
    const sesiuneInchisa = await db().get('SELECT * FROM sesiuni_casa WHERE id = ?', [req.params.sesiuneId]);
    
    logger.info(`Sesiune închisă: ${sesiune.nr_sesiune} - Diferență: ${diferenta_numerar} RON`);
    res.json({ success: true, sesiune: sesiuneInchisa });
  } catch (error) {
    logger.error('Error closing session:', error);
    res.status(500).json({ error: error.message });
  }
});

// Adaugă tranzacție în sesiune
router.post('/adauga-tranzactie', async (req, res) => {
  try {
    const { sesiune_id, nr_comanda, nr_masa, tip_plata, suma, operator_id, observatii } = req.body;
    
    // Verifică dacă sesiunea este deschisă
    const sesiune = await db().get('SELECT * FROM sesiuni_casa WHERE id = ? AND status = "deschisa"', [sesiune_id]);
    if (!sesiune) {
      return res.status(400).json({ error: 'Sesiune nu este deschisă sau nu există' });
    }
    
    const now = new Date();
    const data = now.toISOString().split('T')[0];
    const ora = now.toTimeString().split(' ')[0];
    
    const result = await db().run(`
      INSERT INTO tranzactii_sesiune (
        sesiune_id, nr_comanda, nr_masa, tip_plata, suma, data, ora, operator_id, observatii
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [sesiune_id, nr_comanda, nr_masa, tip_plata, suma, data, ora, operator_id, observatii]);
    
    const tranzactie = await db().get('SELECT * FROM tranzactii_sesiune WHERE id = ?', [result.lastID]);
    
    res.json({ success: true, tranzactie });
  } catch (error) {
    logger.error('Error adding transaction:', error);
    res.status(500).json({ error: error.message });
  }
});

// Obține tranzacțiile unei sesiuni
router.get('/tranzactii/:sesiuneId', async (req, res) => {
  try {
    const tranzactii = await db().all(`
      SELECT t.*, o.nume as operator_nume 
      FROM tranzactii_sesiune t
      LEFT JOIN ospetari o ON t.operator_id = o.id
      WHERE t.sesiune_id = ?
      ORDER BY t.data DESC, t.ora DESC
    `, [req.params.sesiuneId]);
    
    res.json(tranzactii);
  } catch (error) {
    logger.error('Error getting transactions:', error);
    res.status(500).json({ error: error.message });
  }
});

// ===== ISTORIC SESIUNI =====

// Toate sesiunile (cu filtrare opțională)
router.get('/sesiuni', async (req, res) => {
  try {
    const { data_start, data_end, operator_id, status } = req.query;
    let query = 'SELECT * FROM sesiuni_casa WHERE 1=1';
    const params = [];
    
    if (data_start) {
      query += ' AND data_deschidere >= ?';
      params.push(data_start);
    }
    
    if (data_end) {
      query += ' AND data_deschidere <= ?';
      params.push(data_end);
    }
    
    if (operator_id) {
      query += ' AND operator_id = ?';
      params.push(operator_id);
    }
    
    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }
    
    query += ' ORDER BY data_deschidere DESC, ora_deschidere DESC';
    
    const sesiuni = await db().all(query, params);
    res.json(sesiuni);
  } catch (error) {
    logger.error('Error getting sessions:', error);
    res.status(500).json({ error: error.message });
  }
});

// Detalii sesiune specifică
router.get('/sesiuni/:sesiuneId', async (req, res) => {
  try {
    const sesiune = await db().get('SELECT * FROM sesiuni_casa WHERE id = ?', [req.params.sesiuneId]);
    if (!sesiune) {
      return res.status(404).json({ error: 'Sesiune nu a fost găsită' });
    }
    
    const tranzactii = await db().all('SELECT * FROM tranzactii_sesiune WHERE sesiune_id = ?', [req.params.sesiuneId]);
    
    res.json({ sesiune, tranzactii });
  } catch (error) {
    logger.error('Error getting session details:', error);
    res.status(500).json({ error: error.message });
  }
});

// ===== CONTROL ZILNIC =====

// Control casa pentru o anumită dată
router.get('/control-zilnic/:data', async (req, res) => {
  try {
    let control = await db().get('SELECT * FROM control_casa_zilnic WHERE data = ?', [req.params.data]);
    
    if (!control) {
      // Creează controlul zilnic dacă nu există
      await updateControlZilnic(req.params.data);
      control = await db().get('SELECT * FROM control_casa_zilnic WHERE data = ?', [req.params.data]);
    }
    
    // Obține și sesiunile din ziua respectivă
    const sesiuni = await db().all(`
      SELECT * FROM sesiuni_casa 
      WHERE data_deschidere = ?
      ORDER BY ora_deschidere
    `, [req.params.data]);
    
    res.json({ control, sesiuni });
  } catch (error) {
    logger.error('Error getting daily control:', error);
    res.status(500).json({ error: error.message });
  }
});

// Marchează controlul zilnic ca fiind verificat
router.put('/control-zilnic/:data/marcheaza-controlat', async (req, res) => {
  try {
    const { controlat_de, observatii } = req.body;
    
    await db().run(`
      UPDATE control_casa_zilnic SET 
        status_control = CASE 
          WHEN ABS(diferenta_totala) < 0.01 THEN 'controlat' 
          ELSE 'diferente' 
        END,
        controlat_de = ?, controlat_la = CURRENT_TIMESTAMP, observatii = ?
      WHERE data = ?
    `, [controlat_de, observatii, req.params.data]);
    
    const control = await db().get('SELECT * FROM control_casa_zilnic WHERE data = ?', [req.params.data]);
    res.json({ success: true, control });
  } catch (error) {
    logger.error('Error marking daily control:', error);
    res.status(500).json({ error: error.message });
  }
});

// ===== RAPOARTE =====

// Raport perioada
router.get('/raport-perioada', async (req, res) => {
  try {
    const { data_start, data_end } = req.query;
    
    const raport = await db().get(`
      SELECT 
        COUNT(*) as total_sesiuni,
        COUNT(CASE WHEN status = 'deschisa' THEN 1 END) as sesiuni_deschise,
        COUNT(CASE WHEN status = 'inchisa' THEN 1 END) as sesiuni_inchise,
        COALESCE(SUM(total_incasari_cash), 0) as total_cash,
        COALESCE(SUM(total_incasari_card), 0) as total_card,
        COALESCE(SUM(total_incasari), 0) as total_incasari,
        COALESCE(SUM(total_comenzi), 0) as total_comenzi,
        COALESCE(SUM(diferenta_numerar), 0) as total_diferente,
        COALESCE(AVG(diferenta_numerar), 0) as diferenta_medie
      FROM sesiuni_casa 
      WHERE data_deschidere BETWEEN ? AND ?
    `, [data_start || '1900-01-01', data_end || '9999-12-31']);
    
    // Top operatori
    const topOperatori = await db().all(`
      SELECT 
        operator_nume,
        COUNT(*) as numar_sesiuni,
        COALESCE(SUM(total_incasari), 0) as total_incasari,
        COALESCE(AVG(diferenta_numerar), 0) as diferenta_medie
      FROM sesiuni_casa 
      WHERE data_deschidere BETWEEN ? AND ? AND status = 'inchisa'
      GROUP BY operator_id, operator_nume
      ORDER BY total_incasari DESC
    `, [data_start || '1900-01-01', data_end || '9999-12-31']);
    
    res.json({ raport, topOperatori });
  } catch (error) {
    logger.error('Error getting period report:', error);
    res.status(500).json({ error: error.message });
  }
});

// ===== FUNCȚII HELPER =====

async function updateControlZilnic(data) {
  try {
    const stats = await db().get(`
      SELECT 
        COUNT(*) as total_sesiuni,
        COALESCE(SUM(total_incasari_cash), 0) as total_cash_teoretic,
        COALESCE(SUM(numerar_final - numerar_initial), 0) as total_cash_real,
        COALESCE(SUM(total_incasari_card), 0) as total_card,
        COALESCE(SUM(total_incasari), 0) as total_incasari,
        COALESCE(SUM(diferenta_numerar), 0) as diferenta_totala
      FROM sesiuni_casa 
      WHERE data_deschidere = ? AND status = 'inchisa'
    `, [data]);
    
    // Calculează și alte tipuri de plată din tranzacții
    const plati = await db().get(`
      SELECT 
        COALESCE(SUM(CASE WHEN tip_plata = 'VIRAMENT' THEN suma ELSE 0 END), 0) as total_virament,
        COALESCE(SUM(CASE WHEN tip_plata = 'PROF' THEN suma ELSE 0 END), 0) as total_prof,
        COALESCE(SUM(CASE WHEN tip_plata = 'PROTOCOL' THEN suma ELSE 0 END), 0) as total_protocol
      FROM tranzactii_sesiune t
      JOIN sesiuni_casa s ON t.sesiune_id = s.id
      WHERE t.data = ?
    `, [data]);
    
    await db().run(`
      INSERT OR REPLACE INTO control_casa_zilnic (
        data, total_sesiuni, total_cash_teoretic, total_cash_real, total_card,
        total_virament, total_prof, total_protocol, total_incasari, diferenta_totala
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      data, stats.total_sesiuni, stats.total_cash_teoretic, stats.total_cash_real,
      stats.total_card, plati.total_virament, plati.total_prof, plati.total_protocol,
      stats.total_incasari, stats.diferenta_totala
    ]);
    
  } catch (error) {
    logger.error('Error updating daily control:', error);
  }
}

export default router;