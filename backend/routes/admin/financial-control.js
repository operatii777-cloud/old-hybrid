import express from 'express';
import rateLimit from 'express-rate-limit';
import { getDatabase } from '../../database/init-db.js';
import { logger } from '../../utils/logger.js';

const router = express.Router();
const db = () => getDatabase();

const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: { ok: false, error: 'Prea multe cereri.' }
});

router.use(limiter);

// ===== DEMO DATA =====

const demoCashSessions = [
  { id: 1, sesiune: 'Tura 1 (08:00-16:00)', expected_cash: 1240.50, actual_cash: 1238.00, diferenta: -2.50, status: 'Flagged' },
  { id: 2, sesiune: 'Tura 2 (16:00-24:00)', expected_cash: 2185.00, actual_cash: 2185.00, diferenta: 0.00,  status: 'OK' },
  { id: 3, sesiune: 'Tura 3 (00:00-08:00)', expected_cash: 320.00,  actual_cash: 321.50,  diferenta: 1.50,  status: 'OK' },
];

const demoProductCOGS = [
  { produs: 'Ciorba de burta',      pret_vanzare: 22, cogs_target: 6.60, cogs_actual: 6.85, food_cost_percent: 31.1 },
  { produs: 'Mici cu mustar',       pret_vanzare: 18, cogs_target: 5.40, cogs_actual: 5.38, food_cost_percent: 29.9 },
  { produs: 'Sarmale cu mamaliga',  pret_vanzare: 35, cogs_target: 9.80, cogs_actual: 10.20, food_cost_percent: 29.1 },
  { produs: 'Friptura de porc',     pret_vanzare: 48, cogs_target: 16.80, cogs_actual: 16.50, food_cost_percent: 34.4 },
  { produs: 'Papanasi',             pret_vanzare: 19, cogs_target: 4.75, cogs_actual: 4.80, food_cost_percent: 25.3 },
];

const demoAccruals = [
  { id: 1, denumire: 'Chirie spatiu',       suma: 8500.00, zi_scadenta: 1,  categorie: 'Chirie',    status: 'Planificat' },
  { id: 2, denumire: 'Electricitate',       suma: 1200.00, zi_scadenta: 10, categorie: 'Utilitati', status: 'Planificat' },
  { id: 3, denumire: 'Gaz metan',           suma: 650.00,  zi_scadenta: 10, categorie: 'Utilitati', status: 'Platit' },
  { id: 4, denumire: 'Internet & telefon',  suma: 180.00,  zi_scadenta: 15, categorie: 'Utilitati', status: 'Platit' },
  { id: 5, denumire: 'Leasing echipamente', suma: 420.00,  zi_scadenta: 20, categorie: 'Leasing',   status: 'Planificat' },
  { id: 6, denumire: 'Abonament POS',       suma: 95.00,   zi_scadenta: 25, categorie: 'Software',  status: 'Planificat' },
];

// Generate rolling 30-day EBITDA demo data
function generateEBITDADemo() {
  const days = [];
  const today = new Date();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const revenue = 2800 + Math.random() * 1200;
    const cogs = revenue * (0.28 + Math.random() * 0.06);
    const labor = revenue * (0.22 + Math.random() * 0.04);
    const overhead = revenue * (0.12 + Math.random() * 0.03);
    const ebitda = revenue - cogs - labor - overhead;
    days.push({
      data: d.toISOString().split('T')[0],
      revenue: parseFloat(revenue.toFixed(2)),
      cogs: parseFloat(cogs.toFixed(2)),
      labor: parseFloat(labor.toFixed(2)),
      overhead: parseFloat(overhead.toFixed(2)),
      ebitda: parseFloat(ebitda.toFixed(2)),
      ebitda_percent: parseFloat(((ebitda / revenue) * 100).toFixed(1))
    });
  }
  return days;
}

// ===== GET /daily-pl =====
router.get('/daily-pl', async (req, res) => {
  try {
    const date = req.query.date || new Date().toISOString().split('T')[0];
    let revenue = 0, cogs = 0;

    try {
      const database = db();
      const row = await database.get(`
        SELECT
          COALESCE(SUM(c.total), 0) AS revenue,
          COALESCE(SUM(c.total * 0.30), 0) AS cogs
        FROM comenzi c
        WHERE DATE(c.created_at) = ?
          AND c.status NOT IN ('anulata', 'stornata')
      `, [date]);
      if (row && row.revenue > 0) {
        revenue = row.revenue;
        cogs = row.cogs;
      }
    } catch (_) { /* use fallback */ }

    if (revenue === 0) {
      revenue = 3420.80;
      cogs    = 1026.24;
    }

    const grossProfit = revenue - cogs;
    const laborCost   = revenue * 0.22;
    const overhead    = revenue * 0.13;
    const ebitda      = grossProfit - laborCost - overhead;

    res.json({
      ok: true,
      data: {
        date,
        revenue:      parseFloat(revenue.toFixed(2)),
        cogs:         parseFloat(cogs.toFixed(2)),
        gross_profit: parseFloat(grossProfit.toFixed(2)),
        labor_cost:   parseFloat(laborCost.toFixed(2)),
        overhead:     parseFloat(overhead.toFixed(2)),
        ebitda:       parseFloat(ebitda.toFixed(2)),
        ebitda_percent: parseFloat(((ebitda / revenue) * 100).toFixed(1)),
        gross_margin_percent: parseFloat(((grossProfit / revenue) * 100).toFixed(1))
      }
    });
  } catch (error) {
    logger.error('financial-control /daily-pl error:', error);
    res.status(500).json({ ok: false, error: 'Eroare server' });
  }
});

// ===== GET /cash-reconciliation =====
router.get('/cash-reconciliation', async (req, res) => {
  try {
    res.json({ ok: true, data: demoCashSessions });
  } catch (error) {
    logger.error('financial-control /cash-reconciliation error:', error);
    res.status(500).json({ ok: false, error: 'Eroare server' });
  }
});

// ===== POST /cash-reconciliation =====
router.post('/cash-reconciliation', async (req, res) => {
  try {
    const { sesiune, expected_cash, actual_cash } = req.body;
    if (!sesiune || expected_cash == null || actual_cash == null) {
      return res.status(400).json({ ok: false, error: 'Date incomplete' });
    }
    const diferenta = parseFloat((actual_cash - expected_cash).toFixed(2));
    const status = Math.abs(diferenta) > 2 ? 'Flagged' : 'OK';
    res.json({ ok: true, data: { sesiune, expected_cash, actual_cash, diferenta, status } });
  } catch (error) {
    logger.error('financial-control POST /cash-reconciliation error:', error);
    res.status(500).json({ ok: false, error: 'Eroare server' });
  }
});

// ===== GET /ebitda =====
router.get('/ebitda', async (req, res) => {
  try {
    const days = generateEBITDADemo();
    const totalRevenue = days.reduce((s, d) => s + d.revenue, 0);
    const totalEBITDA  = days.reduce((s, d) => s + d.ebitda, 0);
    res.json({
      ok: true,
      data: {
        days,
        summary: {
          avg_ebitda_percent: parseFloat(((totalEBITDA / totalRevenue) * 100).toFixed(1)),
          total_revenue_30d:  parseFloat(totalRevenue.toFixed(2)),
          total_ebitda_30d:   parseFloat(totalEBITDA.toFixed(2))
        },
        scenarios: {
          pessimist: parseFloat((totalEBITDA * 0.80).toFixed(2)),
          realist:   parseFloat(totalEBITDA.toFixed(2)),
          optimist:  parseFloat((totalEBITDA * 1.20).toFixed(2))
        }
      }
    });
  } catch (error) {
    logger.error('financial-control /ebitda error:', error);
    res.status(500).json({ ok: false, error: 'Eroare server' });
  }
});

// ===== GET /tax-liability =====
router.get('/tax-liability', async (req, res) => {
  try {
    res.json({
      ok: true,
      data: {
        vat_collected:      2850.40,
        vat_deductible:     620.15,
        vat_net_payable:    2230.25,
        vat_due_date:       '2025-02-25',
        income_tax_estimate: 1840.00,
        income_tax_due_date: '2025-03-25',
        total_tax_liability: 4070.25
      }
    });
  } catch (error) {
    logger.error('financial-control /tax-liability error:', error);
    res.status(500).json({ ok: false, error: 'Eroare server' });
  }
});

// ===== GET /accruals =====
router.get('/accruals', async (req, res) => {
  try {
    const total = demoAccruals.reduce((s, a) => s + a.suma, 0);
    const paid  = demoAccruals.filter(a => a.status === 'Platit').reduce((s, a) => s + a.suma, 0);
    res.json({
      ok: true,
      data: {
        items: demoAccruals,
        total_lunar: parseFloat(total.toFixed(2)),
        total_platit: parseFloat(paid.toFixed(2)),
        total_ramas: parseFloat((total - paid).toFixed(2))
      }
    });
  } catch (error) {
    logger.error('financial-control /accruals error:', error);
    res.status(500).json({ ok: false, error: 'Eroare server' });
  }
});

// ===== GET /cogs =====
router.get('/cogs', async (req, res) => {
  try {
    res.json({
      ok: true,
      data: {
        food_cost_percent_today: 30.2,
        food_cost_target: 30.0,
        products: demoProductCOGS
      }
    });
  } catch (error) {
    logger.error('financial-control /cogs error:', error);
    res.status(500).json({ ok: false, error: 'Eroare server' });
  }
});

export default router;
