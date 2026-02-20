import express from 'express';
const router = express.Router();

// ── In-memory store for demo ───────────────────────────────────────────────

let brandsStore = [
  {
    id: 1, name: 'BurgerCity', emoji: '🍔', description: 'Burgeri artizanali cu ingrediente locale',
    cuisineType: 'Fast Food', platforms: ['GLOVO', 'BOLT', 'WOLT'],
    status: 'active', todayOrders: 87, todayRevenue: 2610, ghostMenu: false,
  },
  {
    id: 2, name: 'PizzaExpress Virtual', emoji: '🍕', description: 'Pizzerie virtuală – cuptoare tradiționale',
    cuisineType: 'Italiană', platforms: ['GLOVO', 'TAZZ', 'WOLT'],
    status: 'active', todayOrders: 64, todayRevenue: 1920, ghostMenu: false,
  },
  {
    id: 3, name: 'SaladBar Online', emoji: '🥗', description: 'Salate fresh & bowl-uri sănătoase',
    cuisineType: 'Healthy', platforms: ['BOLT', 'WOLT'],
    status: 'inactive', todayOrders: 0, todayRevenue: 0, ghostMenu: false,
  },
];

let nextId = Math.max(...brandsStore.map(b => b.id)) + 1;

// ── Routes ─────────────────────────────────────────────────────────────────

// GET /api/dark-kitchen/brands
router.get('/brands', (req, res) => {
  try {
    res.json(brandsStore);
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// POST /api/dark-kitchen/brands
router.post('/brands', (req, res) => {
  try {
    const { name, description, cuisineType, platforms, ghostMenu } = req.body;
    const brand = {
      id: nextId++,
      name,
      description,
      cuisineType,
      platforms: platforms || [],
      ghostMenu: !!ghostMenu,
      emoji: '🍽️',
      status: 'active',
      todayOrders: 0,
      todayRevenue: 0,
    };
    brandsStore.push(brand);
    res.status(201).json(brand);
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// PUT /api/dark-kitchen/brands/:id
router.put('/brands/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const idx = brandsStore.findIndex(b => b.id === id);
    if (idx === -1) return res.status(404).json({ ok: false, error: 'Brand negăsit' });
    brandsStore[idx] = { ...brandsStore[idx], ...req.body, id };
    res.json(brandsStore[idx]);
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// GET /api/dark-kitchen/performance
router.get('/performance', (req, res) => {
  try {
    const perf = brandsStore.map(b => ({
      id: b.id,
      name: b.name,
      emoji: b.emoji,
      ordersToday: b.todayOrders,
      revenue: b.todayRevenue,
      avgTicket: b.todayOrders > 0 ? Math.round(b.todayRevenue / b.todayOrders) : 0,
      cogs: Math.round(b.todayRevenue * 0.35),
      platformFees: Math.round(b.todayRevenue * 0.16),
      netMargin: b.todayRevenue > 0
        ? parseFloat((((b.todayRevenue - b.todayRevenue * 0.35 - b.todayRevenue * 0.16) / b.todayRevenue) * 100).toFixed(1))
        : 0,
    }));
    res.json(perf);
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// GET /api/dark-kitchen/capacity-slots
router.get('/capacity-slots', (req, res) => {
  try {
    const hours = ['10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00'];
    const colors = ['bg-purple-400', 'bg-violet-400', 'bg-fuchsia-300'];
    const slots = hours.map(hour => ({
      hour,
      slots: brandsStore.map((brand, i) => {
        const isPeakLunch = hour >= '12:00' && hour <= '14:00';
        const isPeakDinner = hour >= '19:00' && hour <= '21:00';
        const pctMap = [
          isPeakLunch ? 50 : 35,
          isPeakDinner ? 45 : 30,
          20,
        ];
        return {
          brand: brand.name,
          emoji: brand.emoji,
          pct: pctMap[i] || 20,
          color: colors[i] || 'bg-gray-300',
        };
      }),
    }));
    res.json(slots);
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

export default router;
