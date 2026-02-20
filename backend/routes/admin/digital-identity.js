import express from 'express';
import { getDatabase } from '../../database/init-db.js';
import { logger } from '../../utils/logger.js';

const router = express.Router();

// ── Demo data ──────────────────────────────────────────────────────────────

const demoGuests = [
  {
    id: 'UUID-8f3a-4b2c',
    name: 'Andrei Popescu',
    phone: '+40 722 345 678',
    email: 'andrei.popescu@email.ro',
    visitCount: 47,
    totalSpend: 4320,
    loyaltyPoints: 8640,
    riskScore: 'Low',
    tier: 'Gold',
    joinedAt: '2022-03-14',
    lastVisit: '2024-01-12',
    crossBrandVisits: [
      { brand: 'Restaurant Principal', location: 'București – Floreasca', visits: 32, spend: 2980 },
      { brand: 'Terasa de Vară', location: 'București – Herăstrău', visits: 9, spend: 820 },
      { brand: 'Delivery App', location: 'Online', visits: 6, spend: 520 },
    ]
  },
  {
    id: 'UUID-9c1d-5e3f',
    name: 'Maria Ionescu',
    phone: '+40 744 123 456',
    email: 'maria.ionescu@gmail.com',
    visitCount: 12,
    totalSpend: 980,
    loyaltyPoints: 1960,
    riskScore: 'Medium',
    tier: 'Silver',
    joinedAt: '2023-06-01',
    lastVisit: '2023-11-20',
    crossBrandVisits: [
      { brand: 'Restaurant Principal', location: 'Cluj – Centru', visits: 10, spend: 820 },
      { brand: 'Delivery App', location: 'Online', visits: 2, spend: 160 },
    ]
  },
];

const demoWallets = {
  'UUID-8f3a-4b2c': {
    points: 8640,
    tier: 'Gold',
    nextTierPoints: 10000,
    nextTier: 'Platinum',
    pointHistory: [
      { date: '2024-01-12', description: 'Cină Valentines', points: 320 },
      { date: '2024-01-05', description: 'Prânz Business', points: 180 },
      { date: '2023-12-28', description: 'Reward utilizat', points: -500 },
      { date: '2023-12-20', description: 'Petrecere Crăciun', points: 640 },
    ],
    rewards: [
      { name: 'Desert Gratuit', points: 500, available: true },
      { name: 'Reducere 20%', points: 1000, available: true },
      { name: 'Cină pentru 2', points: 3000, available: true },
      { name: 'Weekend Break', points: 8000, available: true },
    ],
    brandBreakdown: [
      { brand: 'Restaurant Principal', points: 5960, pct: 69 },
      { brand: 'Terasa de Vară', points: 1640, pct: 19 },
      { brand: 'Delivery', points: 1040, pct: 12 },
    ]
  },
};

const demoSegments = {
  risingStars: 142,
  loyalCore: 389,
  atRisk: 67,
  dormant: 234,
  champions: 55,
};

const demoRiskOverview = {
  clean: 712,
  low: 189,
  medium: 78,
  high: 24,
};

// ── Routes ─────────────────────────────────────────────────────────────────

// GET /api/digital-identity/search?q=
router.get('/search', (req, res) => {
  try {
    const q = (req.query.q || '').toLowerCase();
    const guest = demoGuests.find(g =>
      g.name.toLowerCase().includes(q) ||
      g.email.toLowerCase().includes(q) ||
      g.phone.includes(q)
    ) || demoGuests[0];
    res.json(guest);
  } catch (err) {
    logger.error('digital-identity search error', err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// GET /api/digital-identity/wallet/:guestId
router.get('/wallet/:guestId', (req, res) => {
  try {
    const { guestId } = req.params;
    const wallet = demoWallets[guestId] || demoWallets['UUID-8f3a-4b2c'];
    res.json(wallet);
  } catch (err) {
    logger.error('digital-identity wallet error', err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// GET /api/digital-identity/segments
router.get('/segments', (req, res) => {
  try {
    res.json(demoSegments);
  } catch (err) {
    logger.error('digital-identity segments error', err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// GET /api/digital-identity/risk-overview
router.get('/risk-overview', (req, res) => {
  try {
    res.json(demoRiskOverview);
  } catch (err) {
    logger.error('digital-identity risk-overview error', err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

export default router;
