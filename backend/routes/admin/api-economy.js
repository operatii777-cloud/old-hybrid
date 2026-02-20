import express from 'express';
const router = express.Router();

// ── In-memory store ────────────────────────────────────────────────────────

let apiKeysStore = [
  { id: 1, name: 'Delivery Partner – Glovo',  key: 'sk_live_glo_****8f3a', calls: 142800, status: 'active',    tier: 'Premium',  created: '2023-08-15' },
  { id: 2, name: 'Accounting – Saga',          key: 'sk_live_sag_****c4d2', calls:  28400, status: 'active',    tier: 'Standard', created: '2023-11-01' },
  { id: 3, name: 'POS Terminal – Verifone',    key: 'sk_live_vfn_****7e1b', calls: 892100, status: 'active',    tier: 'Premium',  created: '2022-06-20' },
  { id: 4, name: 'Loyalty App – Mobile',       key: 'sk_live_mob_****a9f5', calls: 384200, status: 'active',    tier: 'Standard', created: '2023-02-14' },
  { id: 5, name: 'Rezervări – TripAdvisor',    key: 'sk_live_ta_****3b88',  calls:  21600, status: 'suspended', tier: 'Basic',    created: '2024-01-05' },
];
let nextKeyId = 6;

const endpointsStore = [
  { path: '/api/orders',       method: 'GET/POST',         calls: 892100, avgMs:  45, errorPct: 0.05, description: 'Gestionare comenzi'     },
  { path: '/api/menu',         method: 'GET',              calls: 584300, avgMs:  32, errorPct: 0.01, description: 'Meniu & prețuri'         },
  { path: '/api/inventory',    method: 'GET',              calls: 284200, avgMs:  78, errorPct: 0.08, description: 'Stocuri în timp real'    },
  { path: '/api/reservations', method: 'GET/POST',         calls: 148900, avgMs:  62, errorPct: 0.02, description: 'Rezervări mese'          },
  { path: '/api/loyalty',      method: 'GET/POST/PUT',     calls: 384200, avgMs:  95, errorPct: 0.15, description: 'Program loialitate'      },
  { path: '/api/payments',     method: 'POST',             calls: 228400, avgMs: 210, errorPct: 0.31, description: 'Procesare plăți'         },
];

const webhooksStore = [
  { id: 1, event: 'order.created',   url: 'https://glovo.com/webhook/order',    status: 'active',   firedToday: 284 },
  { id: 2, event: 'order.completed', url: 'https://glovo.com/webhook/complete', status: 'active',   firedToday: 271 },
  { id: 3, event: 'payment.success', url: 'https://saga.ro/api/payment',        status: 'active',   firedToday: 228 },
  { id: 4, event: 'reservation.new', url: 'https://tripadvisor.com/hook/res',   status: 'inactive', firedToday:   0 },
  { id: 5, event: 'inventory.low',   url: 'https://erp.supplier.ro/alert',      status: 'active',   firedToday:  12 },
];

// ── Routes ─────────────────────────────────────────────────────────────────

// GET /api/api-economy/keys
router.get('/keys', (req, res) => {
  try {
    res.json(apiKeysStore);
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// POST /api/api-economy/keys
router.post('/keys', (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ ok: false, error: 'Numele este obligatoriu' });
    }
    const rand = Math.random().toString(36).substring(2, 8);
    const newKey = {
      id:      nextKeyId++,
      name:    name.trim(),
      key:     `sk_live_new_****${rand}`,
      calls:   0,
      status:  'active',
      tier:    'Standard',
      created: new Date().toISOString().split('T')[0],
    };
    apiKeysStore.push(newKey);
    res.status(201).json(newKey);
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// GET /api/api-economy/endpoints
router.get('/endpoints', (req, res) => {
  try {
    res.json(endpointsStore);
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// GET /api/api-economy/usage
router.get('/usage', (req, res) => {
  try {
    const totalCalls = apiKeysStore.reduce((s, k) => s + k.calls, 0);
    const activeKeys = apiKeysStore.filter(k => k.status === 'active').length;
    const topEndpoint = endpointsStore.reduce((a, b) => (b.calls > a.calls ? b : a), endpointsStore[0]);

    res.json({
      totalCalls,
      callsToday:      Math.round(totalCalls * 0.017), // ~1.7% of total is "today"
      avgResponseMs:   Math.round(endpointsStore.reduce((s, e) => s + e.avgMs, 0) / endpointsStore.length),
      errorRate:       parseFloat((endpointsStore.reduce((s, e) => s + e.errorPct, 0) / endpointsStore.length).toFixed(2)),
      activeKeys,
      webhooksFired:   webhooksStore.reduce((s, w) => s + w.firedToday, 0),
      topEndpoint:     topEndpoint.path,
      revenueFromAPI:  12400,
    });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// GET /api/api-economy/webhooks
router.get('/webhooks', (req, res) => {
  try {
    res.json(webhooksStore);
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

export default router;
