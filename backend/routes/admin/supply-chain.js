import express from 'express';
import { getDatabase } from '../../database/init-db.js';
import { logger } from '../../utils/logger.js';

const router = express.Router();

// ── Demo data ──────────────────────────────────────────────────────────────

const demoSurplus = [
  { id: 1, location: 'București – Floreasca', ingredient: 'Cartofi', surplusQty: '15 kg', deficitLocation: 'Cluj – Centru', suggestedTransfer: '10 kg', costSavings: '42 RON', status: 'Pending' },
  { id: 2, location: 'Timișoara – Fabric', ingredient: 'Roșii Cherry', surplusQty: '8 kg', deficitLocation: 'Iași – Copou', suggestedTransfer: '6 kg', costSavings: '28 RON', status: 'Pending' },
  { id: 3, location: 'Brașov – Centru', ingredient: 'Ulei Măsline', surplusQty: '4 L', deficitLocation: 'Timișoara – Fabric', suggestedTransfer: '3 L', costSavings: '55 RON', status: 'Pending' },
  { id: 4, location: 'Cluj – Centru', ingredient: 'Parmezan', surplusQty: '2 kg', deficitLocation: 'București – Floreasca', suggestedTransfer: '1.5 kg', costSavings: '120 RON', status: 'Pending' },
];

const demoPriceVolatility = [
  { ingredient: 'Ulei Floarea Soarelui', currentPrice: 12.50, previousPrice: 10.20, changePct: 22.5, trend: '↑', alertLevel: 'HIGH' },
  { ingredient: 'Ouă (30 buc)', currentPrice: 18.00, previousPrice: 17.50, changePct: 2.9, trend: '↑', alertLevel: 'LOW' },
  { ingredient: 'Carne Vită', currentPrice: 42.00, previousPrice: 45.00, changePct: -6.7, trend: '↓', alertLevel: 'LOW' },
  { ingredient: 'Făină Albă', currentPrice: 3.80, previousPrice: 3.20, changePct: 18.8, trend: '↑', alertLevel: 'HIGH' },
  { ingredient: 'Roșii', currentPrice: 5.50, previousPrice: 5.60, changePct: -1.8, trend: '↓', alertLevel: 'LOW' },
  { ingredient: 'Somon', currentPrice: 88.00, previousPrice: 75.00, changePct: 17.3, trend: '↑', alertLevel: 'HIGH' },
  { ingredient: 'Lapte (1L)', currentPrice: 7.20, previousPrice: 7.20, changePct: 0, trend: '→', alertLevel: 'NONE' },
];

const demoSupplierScores = [
  { supplier: 'Metro Cash & Carry', onTime: 95, quality: 92, invoiceAccuracy: 98, score: 95, trend: '↑' },
  { supplier: 'Selgros', onTime: 88, quality: 85, invoiceAccuracy: 90, score: 88, trend: '→' },
  { supplier: 'Fornetti Distribution', onTime: 72, quality: 78, invoiceAccuracy: 82, score: 77, trend: '↑' },
  { supplier: 'AgroFresh SRL', onTime: 55, quality: 60, invoiceAccuracy: 70, score: 61, trend: '↓' },
  { supplier: 'FreshBio Import', onTime: 45, quality: 50, invoiceAccuracy: 55, score: 50, trend: '↓' },
];

const demoPurchaseOrders = [
  { id: 'PO-2024-001', supplier: 'Metro Cash & Carry', items: 'Cartofi 50kg, Ceapă 20kg', total: '285 RON', createdAt: '2024-01-15 08:00', status: 'Approved' },
  { id: 'PO-2024-002', supplier: 'Selgros', items: 'Ulei 12L, Făină 25kg', total: '198 RON', createdAt: '2024-01-15 08:15', status: 'Sent' },
  { id: 'PO-2024-003', supplier: 'AgroFresh SRL', items: 'Roșii 30kg, Ardei 15kg', total: '342 RON', createdAt: '2024-01-15 09:00', status: 'Pending' },
  { id: 'PO-2024-004', supplier: 'Fornetti Distribution', items: 'Pâine 200 buc', total: '160 RON', createdAt: '2024-01-15 06:30', status: 'Delivered' },
];

// ── Routes ─────────────────────────────────────────────────────────────────

// GET /api/supply-chain/surplus
router.get('/surplus', (req, res) => {
  try {
    res.json(demoSurplus);
  } catch (err) {
    logger.error('supply-chain surplus error', err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// GET /api/supply-chain/price-volatility
router.get('/price-volatility', (req, res) => {
  try {
    res.json(demoPriceVolatility);
  } catch (err) {
    logger.error('supply-chain price-volatility error', err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// GET /api/supply-chain/supplier-scores
router.get('/supplier-scores', (req, res) => {
  try {
    res.json(demoSupplierScores);
  } catch (err) {
    logger.error('supply-chain supplier-scores error', err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// GET /api/supply-chain/purchase-orders
router.get('/purchase-orders', (req, res) => {
  try {
    res.json(demoPurchaseOrders);
  } catch (err) {
    logger.error('supply-chain purchase-orders error', err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// POST /api/supply-chain/purchase-orders/:id/approve
router.post('/purchase-orders/:id/approve', (req, res) => {
  try {
    const { id } = req.params;
    const order = demoPurchaseOrders.find(o => o.id === id);
    if (!order) {
      return res.status(404).json({ ok: false, error: 'Purchase order not found' });
    }
    order.status = 'Approved';
    logger.info(`Purchase order ${id} approved`);
    res.json({ ok: true, order });
  } catch (err) {
    logger.error('supply-chain approve error', err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

export default router;
