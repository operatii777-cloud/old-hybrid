import express from 'express';
const router = express.Router();

// ── Demo data ──────────────────────────────────────────────────────────────

const demoLocations = [
  { id: 1, name: 'București – Floreasca', status: 'green', ordersLast60: 18, revenueToday: 5840, avgPrepTime: 12, activeAlerts: 0 },
  { id: 2, name: 'Cluj-Napoca – Centru', status: 'yellow', ordersLast60: 11, revenueToday: 4120, avgPrepTime: 18, activeAlerts: 2 },
  { id: 3, name: 'Timișoara – Fabric', status: 'red', ordersLast60: 6, revenueToday: 2980, avgPrepTime: 26, activeAlerts: 4 },
  { id: 4, name: 'Iași – Copou', status: 'green', ordersLast60: 9, revenueToday: 3260, avgPrepTime: 13, activeAlerts: 0 },
  { id: 5, name: 'Brașov – Centru Vechi', status: 'grey', ordersLast60: 0, revenueToday: 2220, avgPrepTime: 0, activeAlerts: 1 },
];

const demoAlerts = [
  { id: 1, type: 'KITCHEN_DELAY', location: 'Timișoara – Fabric', severity: 'HIGH', message: 'Timp mediu preparare depășit: 26 min (limită 18 min)', time: '2 min ago' },
  { id: 2, type: 'CRITICAL_STOCK', location: 'Timișoara – Fabric', severity: 'HIGH', message: 'Stoc critic: Cartofi prăjiți – mai puțin de 2kg', time: '5 min ago' },
  { id: 3, type: 'REFUND_SPIKE', location: 'Cluj-Napoca – Centru', severity: 'MEDIUM', message: 'Spike rambursări: 5 comenzi anulate în ultimele 30 min', time: '8 min ago' },
  { id: 4, type: 'REVENUE_ANOMALY', location: 'Cluj-Napoca – Centru', severity: 'MEDIUM', message: 'Venituri cu 35% sub media lunii la această oră', time: '15 min ago' },
  { id: 5, type: 'SYSTEM_OFFLINE', location: 'Brașov – Centru Vechi', severity: 'CRITICAL', message: 'Sistem POS offline – fără conexiune de 22 min', time: '22 min ago' },
  { id: 6, type: 'KITCHEN_DELAY', location: 'Timișoara – Fabric', severity: 'HIGH', message: 'Chef lipsă – tură incompletă', time: '31 min ago' },
];

// ── Routes ─────────────────────────────────────────────────────────────────

// GET /api/hq-warroom/locations
router.get('/locations', (req, res) => {
  try {
    res.json(demoLocations);
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// GET /api/hq-warroom/alerts
router.get('/alerts', (req, res) => {
  try {
    res.json(demoAlerts);
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// GET /api/hq-warroom/network-summary
router.get('/network-summary', (req, res) => {
  try {
    const revenueToday = demoLocations.reduce((sum, l) => sum + l.revenueToday, 0);
    const totalOrdersLast60 = demoLocations.reduce((sum, l) => sum + l.ordersLast60, 0);
    const activeLocs = demoLocations.filter(l => l.avgPrepTime > 0);
    const avgPrepTime = activeLocs.length > 0
      ? Math.round(activeLocs.reduce((sum, l) => sum + l.avgPrepTime, 0) / activeLocs.length)
      : 0;

    res.json({
      liveOrders: totalOrdersLast60,
      revenueToday,
      avgTicket: 38.5,
      avgPrepTime,
      deliverySla: 91.2,
      networkTrend: [
        { day: 'L', revenue: 15200 },
        { day: 'M', revenue: 14800 },
        { day: 'Mi', revenue: 16400 },
        { day: 'J', revenue: 13900 },
        { day: 'V', revenue: 19200 },
        { day: 'S', revenue: 21500 },
        { day: 'D', revenue: revenueToday },
      ],
    });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// POST /api/hq-warroom/actions/broadcast
router.post('/actions/broadcast', (req, res) => {
  try {
    const { message } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ ok: false, error: 'Mesajul este obligatoriu' });
    }
    console.log(`[HQ Broadcast] ${new Date().toISOString()}: ${message}`);
    res.json({ ok: true, sentAt: new Date().toISOString(), recipients: demoLocations.length, message });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

export default router;
