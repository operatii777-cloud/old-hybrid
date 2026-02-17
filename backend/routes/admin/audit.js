import express from 'express';
import { getDatabase } from '../../database/init-db.js';
import { logger } from '../../utils/logger.js';
import { logAuditAction, createSecurityAlert, logoutSession } from '../../middleware/audit.js';

const router = express.Router();
const db = () => getDatabase();

// ===== AUDIT LOG VIEWING =====

// Toate intrările din audit log cu filtrare
router.get('/log', async (req, res) => {
  try {
    const { 
      user_id, actiune, entitate, categorie, nivel_risc,
      data_start, data_end, limit = 100, offset = 0 
    } = req.query;
    
    let query = `
      SELECT * FROM audit_log 
      WHERE 1=1
    `;
    const params = [];
    
    if (user_id) {
      query += ' AND user_id = ?';
      params.push(user_id);
    }
    
    if (actiune) {
      query += ' AND actiune = ?';
      params.push(actiune);
    }
    
    if (entitate) {
      query += ' AND entitate = ?';
      params.push(entitate);
    }
    
    if (categorie) {
      query += ' AND categorie = ?';
      params.push(categorie);
    }
    
    if (nivel_risc) {
      query += ' AND nivel_risc = ?';
      params.push(nivel_risc);
    }
    
    if (data_start) {
      query += ' AND DATE(data_actiune) >= ?';
      params.push(data_start);
    }
    
    if (data_end) {
      query += ' AND DATE(data_actiune) <= ?';
      params.push(data_end);
    }
    
    query += ' ORDER BY data_actiune DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));
    
    const logs = await db().all(query, params);
    
    // Parse JSON fields
    logs.forEach(log => {
      try {
        if (log.valori_vechi) log.valori_vechi = JSON.parse(log.valori_vechi);
        if (log.valori_noi) log.valori_noi = JSON.parse(log.valori_noi);
      } catch (e) {
        // Keep as string if not valid JSON
      }
    });
    
    // Get total count
    const countQuery = query.replace('SELECT *', 'SELECT COUNT(*) as total')
                           .replace(/ ORDER BY.*$/, '');
    const countParams = params.slice(0, -2); // Remove limit and offset
    const totalResult = await db().get(countQuery, countParams);
    
    res.json({
      logs,
      total: totalResult.total,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    logger.error('Get audit log error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Detalii specifice pentru o intrare din audit log
router.get('/log/:id', async (req, res) => {
  try {
    const log = await db().get('SELECT * FROM audit_log WHERE id = ?', [req.params.id]);
    
    if (!log) {
      return res.status(404).json({ error: 'Intrarea din audit log nu a fost găsită' });
    }
    
    // Parse JSON fields
    try {
      if (log.valori_vechi) log.valori_vechi = JSON.parse(log.valori_vechi);
      if (log.valori_noi) log.valori_noi = JSON.parse(log.valori_noi);
    } catch (e) {
      // Keep as strings if not valid JSON
    }
    
    // Get related changes if any
    const relatedChanges = await db().all(`
      SELECT * FROM modificari_critic 
      WHERE audit_log_id = ?
    `, [req.params.id]);
    
    res.json({
      log,
      related_changes: relatedChanges
    });
  } catch (error) {
    logger.error('Get audit log entry error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ===== SESIUNI UTILIZATORI =====

// Sesiuni active
router.get('/sesiuni/active', async (req, res) => {
  try {
    const sesiuniActive = await db().all(`
      SELECT * FROM sesiuni_utilizatori 
      WHERE status = 'active' 
      ORDER BY data_login DESC
    `);
    
    // Parse device_info și security_flags
    sesiuniActive.forEach(sesiune => {
      try {
        if (sesiune.device_info) sesiune.device_info = JSON.parse(sesiune.device_info);
        if (sesiune.security_flags) sesiune.security_flags = JSON.parse(sesiune.security_flags);
      } catch (e) {
        // Keep as strings if not valid JSON
      }
    });
    
    res.json(sesiuniActive);
  } catch (error) {
    logger.error('Get active sessions error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Istoric sesiuni pentru un utilizator
router.get('/sesiuni/user/:userId', async (req, res) => {
  try {
    const { limit = 50 } = req.query;
    
    const sesiuni = await db().all(`
      SELECT * FROM sesiuni_utilizatori 
      WHERE user_id = ? 
      ORDER BY data_login DESC 
      LIMIT ?
    `, [req.params.userId, parseInt(limit)]);
    
    res.json(sesiuni);
  } catch (error) {
    logger.error('Get user sessions error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Termină o sesiune (admin action)
router.put('/sesiuni/:sesiuneId/terminate', async (req, res) => {
  try {
    const { reason = 'admin_terminated' } = req.body;
    
    await logoutSession(req.params.sesiuneId, reason);
    
    // Log admin action
    const user = req.user || { id: 'admin', nume: 'Admin', rol: 'admin' };
    await logAuditAction({
      user_id: user.id,
      user_nume: user.nume,
      user_rol: user.rol,
      actiune: 'terminate_session',
      entitate: 'sesiuni_utilizatori',
      entitate_id: req.params.sesiuneId,
      descriere: `Sesiune terminată de admin, motiv: ${reason}`,
      categorie: 'security',
      nivel_risc: 'medium',
      ip_address: req.ip
    });
    
    res.json({ success: true, message: 'Sesiune terminată cu succes' });
  } catch (error) {
    logger.error('Terminate session error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ===== ALERTE SECURITATE =====

// Toate alertele de securitate
router.get('/alerte', async (req, res) => {
  try {
    const { status, nivel, tip_alerta, limit = 50 } = req.query;
    
    let query = 'SELECT * FROM alerte_securitate WHERE 1=1';
    const params = [];
    
    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }
    
    if (nivel) {
      query += ' AND nivel = ?';
      params.push(nivel);
    }
    
    if (tip_alerta) {
      query += ' AND tip_alerta = ?';
      params.push(tip_alerta);
    }
    
    query += ' ORDER BY created_at DESC LIMIT ?';
    params.push(parseInt(limit));
    
    const alerte = await db().all(query, params);
    
    // Parse JSON fields
    alerte.forEach(alerta => {
      try {
        if (alerta.record_ids) alerta.record_ids = JSON.parse(alerta.record_ids);
        if (alerta.actiuni_luate) alerta.actiuni_luate = JSON.parse(alerta.actiuni_luate);
      } catch (e) {
        // Keep as strings if not valid JSON
      }
    });
    
    res.json(alerte);
  } catch (error) {
    logger.error('Get security alerts error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Crează alertă de securitate
router.post('/alerte', async (req, res) => {
  try {
    const {
      tip_alerta, nivel, titlu, descriere, entitate_afectata,
      record_ids, user_id, user_nume
    } = req.body;
    
    if (!tip_alerta || !nivel || !titlu || !descriere) {
      return res.status(400).json({ 
        error: 'Tip alertă, nivel, titlu și descriere sunt obligatorii' 
      });
    }
    
    const alertaId = await createSecurityAlert({
      tip_alerta,
      nivel,
      titlu,
      descriere,
      entitate_afectata,
      record_ids,
      user_id,
      user_nume,
      ip_address: req.ip
    });
    
    const alerta = await db().get('SELECT * FROM alerte_securitate WHERE id = ?', [alertaId]);
    
    res.status(201).json({ success: true, alerta });
  } catch (error) {
    logger.error('Create security alert error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Actualizează status alertă
router.put('/alerte/:id/status', async (req, res) => {
  try {
    const { status, investigat_de, actiuni_luate } = req.body;
    const alertaId = req.params.id;
    
    const validStatuses = ['nou', 'investigare', 'rezolvat', 'fals_pozitiv'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Status invalid' });
    }
    
    let updateFields = ['status = ?', 'updated_at = CURRENT_TIMESTAMP'];
    let params = [status];
    
    if (status === 'investigare' && investigat_de) {
      updateFields.push('investigat_de = ?', 'investigat_la = CURRENT_TIMESTAMP');
      params.push(investigat_de);
    }
    
    if (actiuni_luate) {
      updateFields.push('actiuni_luate = ?');
      params.push(JSON.stringify(actiuni_luate));
    }
    
    params.push(alertaId);
    
    await db().run(`
      UPDATE alerte_securitate 
      SET ${updateFields.join(', ')}
      WHERE id = ?
    `, params);
    
    // Log action
    const user = req.user || { id: 'admin', nume: 'Admin', rol: 'admin' };
    await logAuditAction({
      user_id: user.id,
      user_nume: user.nume,
      user_rol: user.rol,
      actiune: 'update_security_alert',
      entitate: 'alerte_securitate',
      entitate_id: alertaId,
      descriere: `Status alertă schimbat în: ${status}`,
      categorie: 'security',
      nivel_risc: 'medium',
      ip_address: req.ip
    });
    
    const alerta = await db().get('SELECT * FROM alerte_securitate WHERE id = ?', [alertaId]);
    res.json({ success: true, alerta });
  } catch (error) {
    logger.error('Update security alert error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ===== STATISTICI ȘI RAPOARTE =====

// Dashboard audit overview
router.get('/dashboard', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // Statistici audit pentru ziua curentă
    const auditStats = await db().get(`
      SELECT 
        COUNT(*) as total_actiuni,
        COUNT(CASE WHEN categorie = 'security' THEN 1 END) as actiuni_securitate,
        COUNT(CASE WHEN categorie = 'financial' THEN 1 END) as actiuni_financiare,
        COUNT(CASE WHEN nivel_risc = 'high' OR nivel_risc = 'critical' THEN 1 END) as actiuni_risc_mare,
        COUNT(DISTINCT user_id) as utilizatori_activi
      FROM audit_log 
      WHERE DATE(data_actiune) = ?
    `, [today]);
    
    // Sesiuni active
    const sesiuniActive = await db().get(`
      SELECT COUNT(*) as sesiuni_active
      FROM sesiuni_utilizatori 
      WHERE status = 'active'
    `);
    
    // Alerte nerezolvate
    const alerteNerezolvate = await db().get(`
      SELECT 
        COUNT(*) as total_alerte,
        COUNT(CASE WHEN nivel = 'critical' THEN 1 END) as alerte_critice,
        COUNT(CASE WHEN nivel = 'error' THEN 1 END) as alerte_erori
      FROM alerte_securitate 
      WHERE status IN ('nou', 'investigare')
    `);
    
    // Top utilizatori activi
    const topUtilizatori = await db().all(`
      SELECT 
        user_nume,
        COUNT(*) as numar_actiuni,
        COUNT(CASE WHEN nivel_risc IN ('high', 'critical') THEN 1 END) as actiuni_risc
      FROM audit_log 
      WHERE DATE(data_actiune) = ?
      GROUP BY user_id, user_nume
      ORDER BY numar_actiuni DESC
      LIMIT 5
    `, [today]);
    
    // Activitate pe ore
    const activitatePeOre = await db().all(`
      SELECT 
        CAST(strftime('%H', data_actiune) AS INTEGER) as ora,
        COUNT(*) as numar_actiuni
      FROM audit_log 
      WHERE DATE(data_actiune) = ?
      GROUP BY CAST(strftime('%H', data_actiune) AS INTEGER)
      ORDER BY ora
    `, [today]);
    
    res.json({
      date: today,
      audit_stats: auditStats,
      sesiuni_active: sesiuniActive.sesiuni_active,
      alerte_nerezolvate: alerteNerezolvate,
      top_utilizatori: topUtilizatori,
      activitate_pe_ore: activitatePeOre
    });
  } catch (error) {
    logger.error('Audit dashboard error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Raport conformitate pentru o perioadă
router.get('/conformitate/raport', async (req, res) => {
  try {
    const { data_start, data_end } = req.query;
    
    if (!data_start || !data_end) {
      return res.status(400).json({ error: 'data_start și data_end sunt obligatorii' });
    }
    
    // Activități pe categorii
    const activitatiCategorii = await db().all(`
      SELECT 
        categorie,
        COUNT(*) as numar_actiuni,
        COUNT(DISTINCT user_id) as utilizatori_implicati
      FROM audit_log 
      WHERE DATE(data_actiune) BETWEEN ? AND ?
      GROUP BY categorie
    `, [data_start, data_end]);
    
    // Acțiuni cu risc ridicat
    const actiuniRisc = await db().all(`
      SELECT 
        user_nume,
        actiune,
        entitate,
        COUNT(*) as frecventa
      FROM audit_log 
      WHERE DATE(data_actiune) BETWEEN ? AND ?
        AND nivel_risc IN ('high', 'critical')
      GROUP BY user_id, user_nume, actiune, entitate
      ORDER BY frecventa DESC
    `, [data_start, data_end]);
    
    // Alerte de securitate din perioadă
    const alertePerioda = await db().all(`
      SELECT 
        tip_alerta,
        nivel,
        COUNT(*) as numar,
        COUNT(CASE WHEN status = 'rezolvat' THEN 1 END) as rezolvate
      FROM alerte_securitate 
      WHERE DATE(created_at) BETWEEN ? AND ?
      GROUP BY tip_alerta, nivel
      ORDER BY numar DESC
    `, [data_start, data_end]);
    
    res.json({
      perioada: { data_start, data_end },
      activitati_categorii: activitatiCategorii,
      actiuni_risc_ridicat: actiuniRisc,
      alerte_securitate: alertePerioda,
      generat_la: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Compliance report error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ===== MANAGEMENT RETENTIE =====

// Curățare audit log expirat (pentru GDPR compliance)
router.post('/cleanup/expired', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // Doar log entries expirate
    const result = await db().run(`
      DELETE FROM audit_log 
      WHERE retentie_pana < ? 
        AND categorie NOT IN ('security', 'financial')
    `, [today]);
    
    // Log cleanup action
    const user = req.user || { id: 'system', nume: 'System', rol: 'system' };
    await logAuditAction({
      user_id: user.id,
      user_nume: user.nume,
      user_rol: user.rol,
      actiune: 'cleanup_audit_log',
      entitate: 'audit_log',
      descriere: `Curățare audit log expirat: ${result.changes} înregistrări șterse`,
      categorie: 'compliance',
      nivel_risc: 'low',
      ip_address: req.ip
    });
    
    res.json({ 
      success: true, 
      deleted_records: result.changes,
      message: `${result.changes} înregistrări expirate au fost șterse` 
    });
  } catch (error) {
    logger.error('Audit cleanup error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;