import express from 'express';
import { getDatabase } from '../../database/init-db.js';
import { logger } from '../../utils/logger.js';

const router = express.Router();

// ── Demo data ──────────────────────────────────────────────────────────────

const demoPsps = [
  { id: 1, name: 'Stripe', logo: '💳', status: 'Active', priority: 1, feePct: 1.4, settlementDays: 2, currencies: 'EUR, USD, GBP, RON', enabled: true },
  { id: 2, name: 'Adyen', logo: '🌍', status: 'Active', priority: 2, feePct: 0.9, settlementDays: 3, currencies: 'EUR, USD, RON', enabled: true },
  { id: 3, name: 'Worldline', logo: '🔵', status: 'Active', priority: 3, feePct: 1.1, settlementDays: 3, currencies: 'EUR, RON', enabled: true },
  { id: 4, name: 'Netopia', logo: '🇷🇴', status: 'Active', priority: 4, feePct: 1.8, settlementDays: 1, currencies: 'RON', enabled: true },
  { id: 5, name: 'PayU', logo: '💰', status: 'Inactive', priority: 5, feePct: 2.0, settlementDays: 2, currencies: 'RON', enabled: false },
];

const demoTransactions = {
  total: 312,
  totalAmount: 28540,
  routingSavings: 342,
  failoverEvents: 3,
  byPsp: [
    { psp: 'Stripe', count: 145, amount: 13200, pct: 46 },
    { psp: 'Adyen', count: 98, amount: 9800, pct: 31 },
    { psp: 'Worldline', count: 42, amount: 3840, pct: 14 },
    { psp: 'Netopia', count: 27, amount: 1700, pct: 9 },
  ]
};

const demoChargebacks = [
  { id: 'TXN-48291', amount: '245 RON', reason: 'Produs nelivrat', status: 'Open', autoResponse: true, psp: 'Stripe' },
  { id: 'TXN-47853', amount: '89 RON', reason: 'Tranzacție neautorizată', status: 'Won', autoResponse: true, psp: 'Adyen' },
  { id: 'TXN-46201', amount: '520 RON', reason: 'Serviciu nesatisfăcător', status: 'Lost', autoResponse: false, psp: 'Worldline' },
  { id: 'TXN-45990', amount: '120 RON', reason: 'Dublă taxare', status: 'Open', autoResponse: true, psp: 'Netopia' },
];

const demoGiftCards = [
  { code: 'GIFT-2024-ABCD', balance: 200, issued: '2024-01-01', expires: '2025-01-01', status: 'Active' },
  { code: 'GIFT-2024-EFGH', balance: 0, issued: '2023-06-15', expires: '2024-06-15', status: 'Used' },
  { code: 'GIFT-2024-IJKL', balance: 150, issued: '2024-01-10', expires: '2025-01-10', status: 'Active' },
  { code: 'GIFT-2023-MNOP', balance: 50, issued: '2023-01-05', expires: '2024-01-05', status: 'Expired' },
];

// ── Routes ─────────────────────────────────────────────────────────────────

// GET /api/payment-orchestration/psps
router.get('/psps', (req, res) => {
  try {
    res.json(demoPsps);
  } catch (err) {
    logger.error('payment-orchestration psps error', err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// PUT /api/payment-orchestration/psps/:id
router.put('/psps/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const psp = demoPsps.find(p => p.id === id);
    if (!psp) {
      return res.status(404).json({ ok: false, error: 'PSP not found' });
    }
    const { enabled, priority } = req.body;
    if (typeof enabled !== 'undefined') {
      psp.enabled = enabled;
      psp.status = enabled ? 'Active' : 'Inactive';
    }
    if (typeof priority !== 'undefined') {
      psp.priority = priority;
    }
    logger.info(`PSP ${psp.name} updated`);
    res.json({ ok: true, psp });
  } catch (err) {
    logger.error('payment-orchestration psps update error', err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// GET /api/payment-orchestration/transactions
router.get('/transactions', (req, res) => {
  try {
    res.json(demoTransactions);
  } catch (err) {
    logger.error('payment-orchestration transactions error', err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// GET /api/payment-orchestration/chargebacks
router.get('/chargebacks', (req, res) => {
  try {
    res.json(demoChargebacks);
  } catch (err) {
    logger.error('payment-orchestration chargebacks error', err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// GET /api/payment-orchestration/gift-cards
router.get('/gift-cards', (req, res) => {
  try {
    res.json(demoGiftCards);
  } catch (err) {
    logger.error('payment-orchestration gift-cards error', err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// POST /api/payment-orchestration/gift-cards
router.post('/gift-cards', (req, res) => {
  try {
    const { balance, expires } = req.body;
    const code = `GIFT-${new Date().getFullYear()}-${Math.random().toString(36).toUpperCase().slice(2, 6)}`;
    const card = {
      code,
      balance: balance || 100,
      issued: new Date().toISOString().split('T')[0],
      expires: expires || new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString().split('T')[0],
      status: 'Active',
    };
    demoGiftCards.push(card);
    logger.info(`Gift card ${code} issued with balance ${card.balance} RON`);
    res.status(201).json({ ok: true, card });
  } catch (err) {
    logger.error('payment-orchestration gift-cards create error', err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

export default router;
