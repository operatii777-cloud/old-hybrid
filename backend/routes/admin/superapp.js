import express from 'express';
const router = express.Router();

// ── Data store ─────────────────────────────────────────────────────────────

const modulesStore = [
  { id:  1, name: 'Rezervări & Mese',     icon: '📅', status: 'live',   users: 18400, description: 'Rezervare masă, selectare loc, preferințe speciale',            category: 'Dining'    },
  { id:  2, name: 'Comandă & Plată',      icon: '🛒', status: 'live',   users: 28400, description: 'Comandă din meniu, plată mobilă, split bill',                   category: 'Dining'    },
  { id:  3, name: 'Delivery',             icon: '🛵', status: 'live',   users: 22100, description: 'Livrare la domiciliu, tracking în timp real',                    category: 'Delivery'  },
  { id:  4, name: 'Program Loialitate',   icon: '💎', status: 'live',   users: 34800, description: 'Puncte, recompense, tier gold/platinum',                         category: 'Loyalty'   },
  { id:  5, name: 'Wallet Digital',       icon: '💳', status: 'live',   users: 12400, description: 'Plată rapidă, credit bonus, abonamente',                         category: 'Payments'  },
  { id:  6, name: 'Experiențe & Events',  icon: '🎉', status: 'live',   users:  8200, description: 'Cine tematice, chef table, wine tasting',                        category: 'Experience' },
  { id:  7, name: 'Catering & Corporate', icon: '🏢', status: 'beta',   users:  2400, description: 'Comenzi corporate, facturare B2B, gestiune bugete',              category: 'B2B'       },
  { id:  8, name: 'Ghost Kitchen Order',  icon: '👻', status: 'beta',   users:  1840, description: 'Comandă din bucătăriile virtuale disponibile',                   category: 'Delivery'  },
  { id:  9, name: 'AI Food Assistant',    icon: '🤖', status: 'coming', users:     0, description: 'Recomandări personalizate AI bazate pe preferințe',              category: 'AI'        },
  { id: 10, name: 'Social Dining',        icon: '👥', status: 'coming', users:     0, description: 'Invitații prieteni, group ordering, bill sharing',                category: 'Social'    },
];

const userJourneysStore = [
  {
    name: 'Cina la Restaurant',
    steps: ['Deschide app', 'Caută restaurant', 'Rezervă masă', 'Comandă din meniu', 'Plătește digital', 'Câștigă puncte'],
    completionRate: 84,
    avgDuration: '12 min',
  },
  {
    name: 'Comandă Delivery',
    steps: ['Deschide app', 'Selectează locație', 'Alege meniu', 'Adaugă în coș', 'Plătește', 'Urmărește livrarea'],
    completionRate: 91,
    avgDuration: '5 min',
  },
  {
    name: 'Rezervare & Eveniment',
    steps: ['Caută eveniment', 'Selectează date', 'Rezervă locuri', 'Plată avans', 'Confirmare email'],
    completionRate: 72,
    avgDuration: '8 min',
  },
];

const integrationsStore = [
  { name: 'Apple Pay / Google Pay',         type: 'Plăți',       status: 'active', icon: '💳' },
  { name: 'Glovo / Bolt Food / Tazz',       type: 'Delivery',    status: 'active', icon: '🛵' },
  { name: 'Google Maps',                    type: 'Navigație',   status: 'active', icon: '🗺️' },
  { name: 'Push Notifications',             type: 'Marketing',   status: 'active', icon: '🔔' },
  { name: 'WhatsApp Business',              type: 'Comunicare',  status: 'active', icon: '💬' },
  { name: 'TripAdvisor / Google Reviews',   type: 'Recenzii',    status: 'active', icon: '⭐' },
  { name: 'Stripe / Netopia',               type: 'Plăți',       status: 'active', icon: '🏦' },
  { name: 'Facebook / Instagram Ads',       type: 'Marketing',   status: 'beta',   icon: '📱' },
];

// ── Routes ─────────────────────────────────────────────────────────────────

// GET /api/superapp/modules
router.get('/modules', (req, res) => {
  try {
    res.json(modulesStore);
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// GET /api/superapp/stats
router.get('/stats', (req, res) => {
  try {
    const activeUsers = modulesStore.reduce((s, m) => s + m.users, 0);
    res.json({
      activeUsers,
      dailyActiveUsers:  Math.round(activeUsers * 0.258),
      avgSessionMin:     8.4,
      transactionsMonth: 284000,
      revenueApp:        1840000,
      nps:               72,
      appRating:         4.6,
      retentionRate:     68,
    });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// GET /api/superapp/user-journeys
router.get('/user-journeys', (req, res) => {
  try {
    res.json(userJourneysStore);
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// GET /api/superapp/integrations
router.get('/integrations', (req, res) => {
  try {
    res.json(integrationsStore);
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

export default router;
