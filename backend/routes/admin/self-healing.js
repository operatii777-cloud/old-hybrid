import express from 'express';
import rateLimit from 'express-rate-limit';
import { getDatabase } from '../../database/init-db.js';
import { logger } from '../../utils/logger.js';

const router = express.Router();
const db = () => getDatabase();

const limiter = rateLimit({
  windowMs: 60 * 1000, max: 120,
  standardHeaders: true, legacyHeaders: false,
  message: { ok: false, error: 'Prea multe cereri.' },
});
router.use(limiter);

// ── Demo / seed data (fallback when DB is empty) ───────────────────────────

const demoServices = [
  { id: 1, name: 'API Gateway',           status: 'healthy',  uptime: 99.99, responseMs: 45,   autoHeal: true,  lastCheck: '2s ago' },
  { id: 2, name: 'POS Service',           status: 'healthy',  uptime: 99.95, responseMs: 78,   autoHeal: true,  lastCheck: '2s ago' },
  { id: 3, name: 'KDS Service',           status: 'healthy',  uptime: 99.91, responseMs: 62,   autoHeal: true,  lastCheck: '5s ago' },
  { id: 4, name: 'Payment Processor',     status: 'degraded', uptime: 98.72, responseMs: 1240, autoHeal: true,  lastCheck: '3s ago' },
  { id: 5, name: 'Inventory DB',          status: 'healthy',  uptime: 99.98, responseMs: 18,   autoHeal: true,  lastCheck: '1s ago' },
  { id: 6, name: 'Delivery Tracker',      status: 'healing',  uptime: 97.40, responseMs: 0,    autoHeal: true,  lastCheck: '8s ago' },
  { id: 7, name: 'Analytics Engine',      status: 'healthy',  uptime: 99.80, responseMs: 320,  autoHeal: false, lastCheck: '10s ago' },
  { id: 8, name: 'Notification Service',  status: 'healthy',  uptime: 99.85, responseMs: 95,   autoHeal: true,  lastCheck: '4s ago' },
];

const demoIncidents = [
  { id: 1, service: 'Delivery Tracker',   type: 'Timeout',        detected: '14:32:07', status: 'Auto-healing', duration: '1m 12s', resolved: false },
  { id: 2, service: 'Payment Processor',  type: 'High Latency',   detected: '14:28:44', status: 'Monitoring',   duration: '4m 35s', resolved: false },
  { id: 3, service: 'KDS Service',        type: 'Memory Leak',    detected: '13:15:22', status: 'Resolved',     duration: '2m 08s', resolved: true  },
  { id: 4, service: 'API Gateway',        type: 'CPU Spike',      detected: '11:44:10', status: 'Resolved',     duration: '0m 43s', resolved: true  },
  { id: 5, service: 'POS Service',        type: 'Connection Drop', detected: '09:07:55', status: 'Resolved',   duration: '1m 55s', resolved: true  },
];

const demoHealingLog = [
  { time: '14:32:09', service: 'Delivery Tracker',  action: 'Container restart',        result: 'In progress', automated: true  },
  { time: '13:17:30', service: 'KDS Service',        action: 'Memory flush + restart',   result: 'Success',     automated: true  },
  { time: '11:44:53', service: 'API Gateway',        action: 'Load balancer rebalance',  result: 'Success',     automated: true  },
  { time: '09:09:50', service: 'POS Service',        action: 'DB connection pool reset', result: 'Success',     automated: true  },
  { time: '08:02:11', service: 'Analytics Engine',   action: 'Manual restart',           result: 'Success',     automated: false },
];

function formatDuration(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${String(s).padStart(2, '0')}s`;
}

// ── Routes ─────────────────────────────────────────────────────────────────

// GET /api/self-healing/services
router.get('/services', async (req, res) => {
  try {
    const rows = await db().all(`
      SELECT id, name, status, uptime, response_ms AS responseMs,
             auto_heal AS autoHeal, updated_at
      FROM service_health ORDER BY id
    `);
    const result = rows.map(r => ({
      ...r,
      autoHeal: !!r.autoHeal,
      lastCheck: `${Math.floor(Math.random() * 15) + 1}s ago`,
    }));
    res.json(result.length > 0 ? result : demoServices);
  } catch (err) {
    logger.error('self-healing /services error:', err);
    res.json(demoServices);
  }
});

// GET /api/self-healing/incidents
router.get('/incidents', async (req, res) => {
  try {
    const rows = await db().all(`
      SELECT id, service_name AS service, type,
             strftime('%H:%M:%S', detected_at) AS detected,
             status, duration_seconds, resolved
      FROM service_incidents ORDER BY detected_at DESC
    `);
    const result = rows.map(r => ({
      id: r.id,
      service: r.service,
      type: r.type,
      detected: r.detected,
      status: r.status,
      duration: formatDuration(r.duration_seconds),
      resolved: !!r.resolved,
    }));
    res.json(result.length > 0 ? result : demoIncidents);
  } catch (err) {
    logger.error('self-healing /incidents error:', err);
    res.json(demoIncidents);
  }
});

// GET /api/self-healing/log
router.get('/log', async (req, res) => {
  try {
    const rows = await db().all(`
      SELECT service_name AS service, action, result, automated,
             strftime('%H:%M:%S', performed_at) AS time
      FROM service_healing_log ORDER BY performed_at DESC LIMIT 50
    `);
    const result = rows.map(r => ({ ...r, automated: !!r.automated }));
    res.json(result.length > 0 ? result : demoHealingLog);
  } catch (err) {
    logger.error('self-healing /log error:', err);
    res.json(demoHealingLog);
  }
});

// GET /api/self-healing/health
router.get('/health', async (req, res) => {
  try {
    const services = await db().all('SELECT status, response_ms, uptime FROM service_health');
    const healthy  = services.filter(s => s.status === 'healthy').length;
    const upSvcs   = services.filter(s => s.response_ms > 0);
    const avgResponseMs = upSvcs.length
      ? Math.round(upSvcs.reduce((s, r) => s + r.response_ms, 0) / upSvcs.length)
      : 0;

    const { cnt: healingToday } = await db().get(`
      SELECT COUNT(*) AS cnt FROM service_healing_log
      WHERE DATE(performed_at) = DATE('now') AND result != 'In progress'
    `);
    const { cnt: selfHealed } = await db().get(`
      SELECT COUNT(*) AS cnt FROM service_healing_log
      WHERE performed_at >= datetime('now', '-24 hours')
        AND automated = 1 AND result = 'Success'
    `);
    const { avg: avgUptime } = await db().get('SELECT AVG(uptime) AS avg FROM service_health');

    res.json({
      uptime:             parseFloat((avgUptime || 99.97).toFixed(2)),
      healingEventsToday: healingToday ?? 0,
      servicesHealthy:    healthy,
      servicesTotal:      services.length || 8,
      avgResponseMs,
      selfHealedLast24h:  selfHealed ?? 0,
    });
  } catch (err) {
    logger.error('self-healing /health error:', err);
    const healthy = demoServices.filter(s => s.status === 'healthy').length;
    res.json({ uptime: 99.97, healingEventsToday: 3, servicesHealthy: healthy,
               servicesTotal: demoServices.length, avgResponseMs: 142, selfHealedLast24h: 4 });
  }
});

// POST /api/self-healing/heal/:serviceId
router.post('/heal/:serviceId', async (req, res) => {
  try {
    const id  = parseInt(req.params.serviceId);
    const svc = await db().get('SELECT * FROM service_health WHERE id = ?', [id]);
    if (!svc) return res.status(404).json({ ok: false, error: 'Serviciu negăsit' });

    await db().run(
      `UPDATE service_health SET status = 'healing', updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [id]
    );
    // Capture the exact log-row ID to avoid a race condition in the delayed update
    const logInsert = await db().run(
      `INSERT INTO service_healing_log (service_name, action, result, automated) VALUES (?, 'Manual restart', 'In progress', 0)`,
      [svc.name]
    );
    const logId = logInsert.lastID;

    // Simulate recovery after 5 s
    setTimeout(async () => {
      try {
        await db().run(
          `UPDATE service_health SET status = 'healthy', response_ms = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
          [Math.floor(Math.random() * 100) + 30, id]
        );
        // Use the captured ID to update exactly this log entry
        await db().run(
          `UPDATE service_healing_log SET result = 'Success' WHERE id = ?`,
          [logId]
        );
      } catch (e) { logger.error('heal recovery error:', e); }
    }, 5000);

    res.json({ ok: true, serviceId: id, action: 'heal_triggered', timestamp: new Date().toISOString() });
  } catch (err) {
    logger.error('self-healing /heal error:', err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

export default router;
