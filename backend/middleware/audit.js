import { getDatabase } from '../database/init-db.js';
import { logger } from '../utils/logger.js';

const db = () => getDatabase();

// Middleware pentru logging automat al acțiunilor
export const auditMiddleware = (options = {}) => {
  return async (req, res, next) => {
    const originalJson = res.json;
    const originalSend = res.send;
    
    // Capturează răspunsul pentru audit
    res.json = function(body) {
      res.locals.responseBody = body;
      return originalJson.call(this, body);
    };
    
    res.send = function(body) {
      res.locals.responseBody = body;
      return originalSend.call(this, body);
    };
    
    // Determină acțiunea din metodă și rută
    const actiune = determineAction(req.method, req.route?.path, req.originalUrl);
    const entitate = determineEntity(req.originalUrl);
    
    // Salvează informații pentru audit log
    req.auditInfo = {
      actiune,
      entitate,
      ip_address: req.ip || req.connection.remoteAddress,
      user_agent: req.get('User-Agent'),
      sesiune_id: req.sessionID,
      valori_vechi: null, // Va fi populat în controller dacă e nevoie
      ...options
    };
    
    next();
  };
};

// Middleware pentru finalizarea audit log-ului
export const finalizeAudit = async (req, res, next) => {
  try {
    if (req.auditInfo && res.locals.responseBody) {
      // Nu loga GET requests pentru browsing normal
      if (req.method === 'GET' && !req.auditInfo.forceLog) {
        return next();
      }
      
      const user = req.user || { id: 'system', nume: 'System', rol: 'system' };
      
      await logAuditAction({
        user_id: user.id,
        user_nume: user.nume,
        user_rol: user.rol,
        actiune: req.auditInfo.actiune,
        entitate: req.auditInfo.entitate,
        entitate_id: req.auditInfo.entitate_id,
        valori_vechi: req.auditInfo.valori_vechi,
        valori_noi: req.auditInfo.valori_noi,
        descriere: req.auditInfo.descriere,
        ip_address: req.auditInfo.ip_address,
        user_agent: req.auditInfo.user_agent,
        sesiune_id: req.auditInfo.sesiune_id,
        categorie: req.auditInfo.categorie || 'operational',
        nivel_risc: req.auditInfo.nivel_risc || 'low'
      });
    }
  } catch (error) {
    logger.error('Audit logging error:', error);
  }
  
  next();
};

// Funcție pentru logging manual
export const logAuditAction = async (auditData) => {
  try {
    const retentie_pana = new Date();
    retentie_pana.setFullYear(retentie_pana.getFullYear() + 7); // 7 ani pentru conformitate
    
    await db().run(`
      INSERT INTO audit_log (
        user_id, user_nume, user_rol, actiune, entitate, entitate_id,
        valori_vechi, valori_noi, descriere, ip_address, user_agent,
        sesiune_id, categorie, nivel_risc, retentie_pana
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      auditData.user_id,
      auditData.user_nume,
      auditData.user_rol,
      auditData.actiune,
      auditData.entitate,
      auditData.entitate_id,
      typeof auditData.valori_vechi === 'object' ? JSON.stringify(auditData.valori_vechi) : auditData.valori_vechi,
      typeof auditData.valori_noi === 'object' ? JSON.stringify(auditData.valori_noi) : auditData.valori_noi,
      auditData.descriere,
      auditData.ip_address,
      auditData.user_agent,
      auditData.sesiune_id,
      auditData.categorie || 'operational',
      auditData.nivel_risc || 'low',
      retentie_pana.toISOString().split('T')[0]
    ]);
  } catch (error) {
    logger.error('Log audit action error:', error);
  }
};

// Funcție pentru logging sesiuni
export const logSession = async (sessionData) => {
  try {
    await db().run(`
      INSERT OR REPLACE INTO sesiuni_utilizatori (
        id, user_id, user_nume, ip_address, user_agent, device_info,
        login_method, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      sessionData.sesiune_id,
      sessionData.user_id,
      sessionData.user_nume,
      sessionData.ip_address,
      sessionData.user_agent,
      JSON.stringify(sessionData.device_info || {}),
      sessionData.login_method || 'pin',
      'active'
    ]);
  } catch (error) {
    logger.error('Log session error:', error);
  }
};

// Funcție pentru logout sesiune
export const logoutSession = async (sesiuneId, reason = 'logout') => {
  try {
    await db().run(`
      UPDATE sesiuni_utilizatori 
      SET data_logout = CURRENT_TIMESTAMP,
          durata_sesiune_min = (julianday(CURRENT_TIMESTAMP) - julianday(data_login)) * 24 * 60,
          status = ?
      WHERE id = ? AND status = 'active'
    `, [reason, sesiuneId]);
  } catch (error) {
    logger.error('Logout session error:', error);
  }
};

// Funcție pentru alertele de securitate
export const createSecurityAlert = async (alertData) => {
  try {
    const result = await db().run(`
      INSERT INTO alerte_securitate (
        tip_alerta, nivel, titlu, descriere, entitate_afectata,
        record_ids, user_id, user_nume, ip_address
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      alertData.tip_alerta,
      alertData.nivel,
      alertData.titlu,
      alertData.descriere,
      alertData.entitate_afectata,
      JSON.stringify(alertData.record_ids || []),
      alertData.user_id,
      alertData.user_nume,
      alertData.ip_address
    ]);
    
    // Log și în audit pentru tracking
    await logAuditAction({
      user_id: alertData.user_id || 'system',
      user_nume: alertData.user_nume || 'System',
      user_rol: 'security',
      actiune: 'SECURITY_ALERT',
      entitate: 'alerte_securitate',
      entitate_id: result.lastID.toString(),
      descriere: `Alertă de securitate: ${alertData.titlu}`,
      categorie: 'security',
      nivel_risc: alertData.nivel === 'critical' ? 'critical' : 'high',
      ip_address: alertData.ip_address
    });
    
    return result.lastID;
  } catch (error) {
    logger.error('Create security alert error:', error);
    throw error;
  }
};

// Helper functions
function determineAction(method, routePath, url) {
  const methodMap = {
    'GET': 'READ',
    'POST': 'create',
    'PUT': 'update',
    'PATCH': 'update',
    'DELETE': 'delete'
  };
  
  // Acțiuni speciale
  if (url.includes('/login')) return 'login';
  if (url.includes('/logout')) return 'logout';
  if (url.includes('/sesiune')) return 'session_management';
  if (url.includes('/dashboard')) return 'view_dashboard';
  
  return methodMap[method] || 'unknown';
}

function determineEntity(url) {
  // Extrage entitatea din URL
  const segments = url.split('/').filter(segment => segment.length > 0);
  
  if (segments.includes('produse')) return 'produse';
  if (segments.includes('comenzi')) return 'comenzi';
  if (segments.includes('mese')) return 'mese';
  if (segments.includes('ospetari')) return 'ospetari';
  if (segments.includes('delivery')) return 'delivery';
  if (segments.includes('cash-register')) return 'cash_register';
  if (segments.includes('magazie')) return 'magazie';
  if (segments.includes('furnizori')) return 'furnizori';
  if (segments.includes('retete')) return 'retete';
  
  return 'system';
}

export default {
  auditMiddleware,
  finalizeAudit,
  logAuditAction,
  logSession,
  logoutSession,
  createSecurityAlert
};