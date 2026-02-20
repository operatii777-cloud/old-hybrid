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

const demoLocations = [
  { id: 1, name: 'București – Floreasca', city: 'București',   status: 'active',   score: 94, revenue: 285000, royalty: 17100, opened: '2020-03-15' },
  { id: 2, name: 'Cluj-Napoca – Centru',  city: 'Cluj-Napoca', status: 'active',   score: 97, revenue: 312000, royalty: 18720, opened: '2019-09-01' },
  { id: 3, name: 'Timișoara – Iulius',    city: 'Timișoara',   status: 'active',   score: 88, revenue: 198000, royalty: 11880, opened: '2021-05-20' },
  { id: 4, name: 'Iași – Palas',          city: 'Iași',        status: 'active',   score: 82, revenue: 176000, royalty: 10560, opened: '2021-11-08' },
  { id: 5, name: 'Brașov – Centrul Nou',  city: 'Brașov',      status: 'active',   score: 91, revenue: 221000, royalty: 13260, opened: '2022-02-14' },
  { id: 6, name: 'Constanța – Mamaia',    city: 'Constanța',   status: 'seasonal', score: 79, revenue: 143000, royalty:  8580, opened: '2022-06-01' },
];

// ── Routes ─────────────────────────────────────────────────────────────────

// GET /api/franchise/locations
router.get('/locations', async (req, res) => {
  try {
    const rows = await db().all(`
      SELECT id, name, city, status, score, revenue, royalty, opened_on AS opened
      FROM franchise_locations ORDER BY score DESC
    `);
    res.json(rows.length > 0 ? rows : demoLocations);
  } catch (err) {
    logger.error('franchise /locations error:', err);
    res.json(demoLocations);
  }
});

// GET /api/franchise/kpis
router.get('/kpis', async (req, res) => {
  try {
    const rows = await db().all('SELECT status, score, revenue, royalty, name FROM franchise_locations');
    if (rows.length === 0) {
      const locs = demoLocations;
      const top  = locs.reduce((a, b) => (b.score > a.score ? b : a), locs[0]);
      return res.json({
        totalLocations: locs.length, activeLocations: locs.filter(l => l.status === 'active').length,
        totalRevenue: locs.reduce((s, l) => s + l.revenue, 0),
        totalRoyalties: locs.reduce((s, l) => s + l.royalty, 0),
        avgScore: 87.4, newThisYear: 5, topPerformer: top.name, networkGrowth: '+18%',
      });
    }
    const top = rows.reduce((a, b) => (b.score > a.score ? b : a), rows[0]);
    res.json({
      totalLocations:  rows.length,
      activeLocations: rows.filter(r => r.status === 'active').length,
      totalRevenue:    rows.reduce((s, r) => s + r.revenue, 0),
      totalRoyalties:  rows.reduce((s, r) => s + r.royalty, 0),
      avgScore:        Math.round(rows.reduce((s, r) => s + r.score, 0) / rows.length * 10) / 10,
      newThisYear:     5,
      topPerformer:    top.name,
      networkGrowth:   '+18%',
    });
  } catch (err) {
    logger.error('franchise /kpis error:', err);
    const top = demoLocations.reduce((a, b) => (b.score > a.score ? b : a), demoLocations[0]);
    res.json({
      totalLocations: demoLocations.length, activeLocations: demoLocations.filter(l => l.status === 'active').length,
      totalRevenue: demoLocations.reduce((s, l) => s + l.revenue, 0),
      totalRoyalties: demoLocations.reduce((s, l) => s + l.royalty, 0),
      avgScore: 87.4, newThisYear: 5, topPerformer: top.name, networkGrowth: '+18%',
    });
  }
});

// GET /api/franchise/compliance
router.get('/compliance', async (req, res) => {
  try {
    const rows = await db().all(`
      SELECT id, category, score, max_score AS maxScore, last_audit AS lastAudit, status
      FROM franchise_compliance ORDER BY id
    `);
    res.json(rows.length > 0 ? rows : [
      { category: 'Standarde Igienă',     score: 96, maxScore: 100, lastAudit: '2024-01-08', status: 'pass'    },
      { category: 'Identitate Vizuală',   score: 92, maxScore: 100, lastAudit: '2024-01-08', status: 'pass'    },
      { category: 'Meniu Standard',       score: 88, maxScore: 100, lastAudit: '2024-01-08', status: 'pass'    },
      { category: 'Training Personal',    score: 74, maxScore: 100, lastAudit: '2023-12-15', status: 'warning' },
      { category: 'Raportare Financiară', score: 100, maxScore: 100, lastAudit: '2024-01-10', status: 'pass'  },
      { category: 'Securitate Date',      score: 83, maxScore: 100, lastAudit: '2024-01-05', status: 'pass'    },
    ]);
  } catch (err) {
    logger.error('franchise /compliance error:', err);
    res.json([]);
  }
});

// GET /api/franchise/royalties
router.get('/royalties', async (req, res) => {
  try {
    const rows = await db().all('SELECT id, month, total, paid, status FROM franchise_royalties ORDER BY id DESC');
    res.json(rows.length > 0 ? rows : [
      { month: 'Ian 2024', total: 24200, paid: 24200, status: 'paid'    },
      { month: 'Dec 2023', total: 22800, paid: 22800, status: 'paid'    },
      { month: 'Nov 2023', total: 21400, paid: 21400, status: 'paid'    },
      { month: 'Oct 2023', total: 23600, paid: 23600, status: 'paid'    },
      { month: 'Sep 2023', total: 19800, paid: 14200, status: 'partial' },
    ]);
  } catch (err) {
    logger.error('franchise /royalties error:', err);
    res.json([]);
  }
});

export default router;
