import express from 'express';
const router = express.Router();

// ── In-memory store ────────────────────────────────────────────────────────

let servicesStore = [
  { id: 1, name: 'API Gateway',           status: 'healthy',  uptime: 99.99, responseMs: 45,   autoHeal: true,  lastCheck: '2s ago' },
  { id: 2, name: 'POS Service',           status: 'healthy',  uptime: 99.95, responseMs: 78,   autoHeal: true,  lastCheck: '2s ago' },
  { id: 3, name: 'KDS Service',           status: 'healthy',  uptime: 99.91, responseMs: 62,   autoHeal: true,  lastCheck: '5s ago' },
  { id: 4, name: 'Payment Processor',     status: 'degraded', uptime: 98.72, responseMs: 1240, autoHeal: true,  lastCheck: '3s ago' },
  { id: 5, name: 'Inventory DB',          status: 'healthy',  uptime: 99.98, responseMs: 18,   autoHeal: true,  lastCheck: '1s ago' },
  { id: 6, name: 'Delivery Tracker',      status: 'healing',  uptime: 97.40, responseMs: 0,    autoHeal: true,  lastCheck: '8s ago' },
  { id: 7, name: 'Analytics Engine',      status: 'healthy',  uptime: 99.80, responseMs: 320,  autoHeal: false, lastCheck: '10s ago' },
  { id: 8, name: 'Notification Service',  status: 'healthy',  uptime: 99.85, responseMs: 95,   autoHeal: true,  lastCheck: '4s ago' },
];

let incidentsStore = [
  { id: 1, service: 'Delivery Tracker',   type: 'Timeout',      detected: '14:32:07', status: 'Auto-healing', duration: '1m 12s', resolved: false },
  { id: 2, service: 'Payment Processor',  type: 'High Latency',  detected: '14:28:44', status: 'Monitoring',   duration: '4m 35s', resolved: false },
  { id: 3, service: 'KDS Service',        type: 'Memory Leak',   detected: '13:15:22', status: 'Resolved',     duration: '2m 08s', resolved: true  },
  { id: 4, service: 'API Gateway',        type: 'CPU Spike',     detected: '11:44:10', status: 'Resolved',     duration: '0m 43s', resolved: true  },
  { id: 5, service: 'POS Service',        type: 'Connection Drop', detected: '09:07:55', status: 'Resolved',   duration: '1m 55s', resolved: true  },
];

let healingLog = [
  { time: '14:32:09', service: 'Delivery Tracker',  action: 'Container restart',          result: 'In progress', automated: true  },
  { time: '13:17:30', service: 'KDS Service',        action: 'Memory flush + restart',     result: 'Success',     automated: true  },
  { time: '11:44:53', service: 'API Gateway',        action: 'Load balancer rebalance',    result: 'Success',     automated: true  },
  { time: '09:09:50', service: 'POS Service',        action: 'DB connection pool reset',   result: 'Success',     automated: true  },
  { time: '08:02:11', service: 'Analytics Engine',   action: 'Manual restart',             result: 'Success',     automated: false },
];

// ── Routes ─────────────────────────────────────────────────────────────────

// GET /api/self-healing/services
router.get('/services', (req, res) => {
  try {
    // Simulate realistic last-check timestamps
    const updated = servicesStore.map(s => ({ ...s, lastCheck: `${Math.floor(Math.random() * 15) + 1}s ago` }));
    res.json(updated);
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// GET /api/self-healing/incidents
router.get('/incidents', (req, res) => {
  try {
    res.json(incidentsStore);
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// GET /api/self-healing/log
router.get('/log', (req, res) => {
  try {
    res.json(healingLog);
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// GET /api/self-healing/health
router.get('/health', (req, res) => {
  try {
    const healthy = servicesStore.filter(s => s.status === 'healthy').length;
    const total   = servicesStore.length;
    const healingEventsToday = healingLog.filter(l => l.result !== 'In progress').length;
    const avgResponseMs = Math.round(
      servicesStore.filter(s => s.responseMs > 0).reduce((sum, s) => sum + s.responseMs, 0) /
      servicesStore.filter(s => s.responseMs > 0).length
    );

    res.json({
      uptime: 99.97,
      healingEventsToday,
      servicesHealthy: healthy,
      servicesTotal: total,
      avgResponseMs,
      selfHealedLast24h: healingLog.filter(l => l.automated && l.result === 'Success').length,
    });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// POST /api/self-healing/heal/:serviceId
router.post('/heal/:serviceId', (req, res) => {
  try {
    const id  = parseInt(req.params.serviceId);
    const svc = servicesStore.find(s => s.id === id);
    if (!svc) return res.status(404).json({ ok: false, error: 'Serviciu negăsit' });

    // Mark as healing
    servicesStore = servicesStore.map(s =>
      s.id === id ? { ...s, status: 'healing', lastCheck: '0s ago' } : s
    );

    // Add log entry
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
    healingLog.unshift({ time: timeStr, service: svc.name, action: 'Manual restart', result: 'In progress', automated: false });

    // Simulate recovery after 5 seconds (in-memory only)
    setTimeout(() => {
      servicesStore = servicesStore.map(s =>
        s.id === id ? { ...s, status: 'healthy', responseMs: Math.floor(Math.random() * 100) + 30 } : s
      );
      const logEntry = healingLog.find(l => l.time === timeStr && l.service === svc.name);
      if (logEntry) logEntry.result = 'Success';
    }, 5000);

    res.json({ ok: true, serviceId: id, action: 'heal_triggered', timestamp: now.toISOString() });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

export default router;
