import express from 'express';
const router = express.Router();

// ── Data store ─────────────────────────────────────────────────────────────

const locationsStore = [
  { id: 1, name: 'București – Floreasca', city: 'București',    status: 'active',   score: 94, revenue: 285000, royalty: 17100, opened: '2020-03-15' },
  { id: 2, name: 'Cluj-Napoca – Centru',  city: 'Cluj-Napoca', status: 'active',   score: 97, revenue: 312000, royalty: 18720, opened: '2019-09-01' },
  { id: 3, name: 'Timișoara – Iulius',    city: 'Timișoara',   status: 'active',   score: 88, revenue: 198000, royalty: 11880, opened: '2021-05-20' },
  { id: 4, name: 'Iași – Palas',          city: 'Iași',        status: 'active',   score: 82, revenue: 176000, royalty: 10560, opened: '2021-11-08' },
  { id: 5, name: 'Brașov – Centrul Nou',  city: 'Brașov',      status: 'active',   score: 91, revenue: 221000, royalty: 13260, opened: '2022-02-14' },
  { id: 6, name: 'Constanța – Mamaia',    city: 'Constanța',   status: 'seasonal', score: 79, revenue: 143000, royalty:  8580, opened: '2022-06-01' },
];

const complianceStore = [
  { category: 'Standarde Igienă',      score: 96, maxScore: 100, lastAudit: '2024-01-08', status: 'pass'    },
  { category: 'Identitate Vizuală',    score: 92, maxScore: 100, lastAudit: '2024-01-08', status: 'pass'    },
  { category: 'Meniu Standard',        score: 88, maxScore: 100, lastAudit: '2024-01-08', status: 'pass'    },
  { category: 'Training Personal',     score: 74, maxScore: 100, lastAudit: '2023-12-15', status: 'warning' },
  { category: 'Raportare Financiară',  score: 100, maxScore: 100, lastAudit: '2024-01-10', status: 'pass'  },
  { category: 'Securitate Date',       score: 83, maxScore: 100, lastAudit: '2024-01-05', status: 'pass'    },
];

const royaltiesStore = [
  { month: 'Ian 2024', total: 24200, paid: 24200, status: 'paid'    },
  { month: 'Dec 2023', total: 22800, paid: 22800, status: 'paid'    },
  { month: 'Nov 2023', total: 21400, paid: 21400, status: 'paid'    },
  { month: 'Oct 2023', total: 23600, paid: 23600, status: 'paid'    },
  { month: 'Sep 2023', total: 19800, paid: 14200, status: 'partial' },
];

// ── Routes ─────────────────────────────────────────────────────────────────

// GET /api/franchise/locations
router.get('/locations', (req, res) => {
  try {
    res.json(locationsStore);
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// GET /api/franchise/kpis
router.get('/kpis', (req, res) => {
  try {
    const active       = locationsStore.filter(l => l.status === 'active').length;
    const totalRevenue = locationsStore.reduce((s, l) => s + l.revenue, 0);
    const totalRoyalty = locationsStore.reduce((s, l) => s + l.royalty, 0);
    const avgScore     = Math.round(locationsStore.reduce((s, l) => s + l.score, 0) / locationsStore.length * 10) / 10;
    const top          = locationsStore.reduce((a, b) => (b.score > a.score ? b : a), locationsStore[0]);

    res.json({
      totalLocations:  locationsStore.length,
      activeLocations: active,
      totalRevenue,
      totalRoyalties:  totalRoyalty,
      avgScore,
      newThisYear:     5,
      topPerformer:    top.name,
      networkGrowth:   '+18%',
    });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// GET /api/franchise/compliance
router.get('/compliance', (req, res) => {
  try {
    res.json(complianceStore);
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// GET /api/franchise/royalties
router.get('/royalties', (req, res) => {
  try {
    res.json(royaltiesStore);
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

export default router;
