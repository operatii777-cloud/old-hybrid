import express from 'express';
const router = express.Router();

// ── Data store ─────────────────────────────────────────────────────────────

const dataPointsStore = [
  { category: 'Comenzi & POS',            records: 42800000, growth: '+22%', freshness: 'Timp real', value: 'Ridicat' },
  { category: 'Comportament Clienți',      records: 18400000, growth: '+31%', freshness: '< 1h',       value: 'Ridicat' },
  { category: 'Prețuri Competitori',       records:  2840000, growth: '+18%', freshness: 'Zilnic',      value: 'Mediu'   },
  { category: 'Tendințe Menuri',           records:  8200000, growth: '+45%', freshness: '< 6h',        value: 'Ridicat' },
  { category: 'Date Meteo × Consum',       records:  1200000, growth: '+12%', freshness: '< 3h',        value: 'Mediu'   },
  { category: 'Performanță Livrări',       records:  9800000, growth: '+28%', freshness: '< 30min',     value: 'Ridicat' },
];

const insightsStore = [
  {
    type: 'trend', icon: '📈',
    title: 'Creștere demand – burgeri artizanali',
    description: 'Rețeaua globală indică +38% creștere în cerere pentru burgeri premium față de luna trecută. Locațiile din Cluj și București au cel mai mare potențial neexploatat.',
    confidence: 94, impact: 'Ridicat',
  },
  {
    type: 'pricing', icon: '💰',
    title: 'Oportunitate de reprețuire – pizza',
    description: 'Analiza de rețea arată că prețul mediu la pizza în zona dvs. este cu 12% sub media pieței. Creșterea cu 8-10% nu ar afecta cererea.',
    confidence: 87, impact: 'Mediu',
  },
  {
    type: 'operations', icon: '⏱️',
    title: 'Timp de așteptare ridicat joi 19:00-21:00',
    description: 'Pattern identificat în 840 de restaurante similare: vârful de joi seara necesită +2 angajați în bucătărie pentru a reduce timpii de așteptare.',
    confidence: 91, impact: 'Mediu',
  },
  {
    type: 'loyalty', icon: '🎯',
    title: 'Campanie loialitate recomandată – weekend',
    description: 'Clienții din segmentul "At-Risk" au o rată de reactivare de 42% la ofertele de weekend bazate pe date din rețea.',
    confidence: 82, impact: 'Ridicat',
  },
];

const benchmarksStore = [
  { metric: 'Bilet Mediu',         yourValue:   78, networkAvg:   72, networkTop:   95, unit: 'RON'    },
  { metric: 'Timp Preparare',      yourValue:   18, networkAvg:   22, networkTop:   12, unit: 'min'    },
  { metric: 'Satisfacție Client',  yourValue:  4.2, networkAvg:  4.0, networkTop:  4.8, unit: '/5'     },
  { metric: 'Rată Retur Clienți',  yourValue:   34, networkAvg:   28, networkTop:   52, unit: '%'      },
  { metric: 'Consum Ingrediente',  yourValue:   31, networkAvg:   34, networkTop:   26, unit: '% waste' },
  { metric: 'Revenue per mp',      yourValue: 1840, networkAvg: 1620, networkTop: 2480, unit: 'RON/mp' },
];

// ── Routes ─────────────────────────────────────────────────────────────────

// GET /api/global-data-network/stats
router.get('/stats', (req, res) => {
  try {
    const totalRecords = dataPointsStore.reduce((s, d) => s + d.records, 0);
    res.json({
      totalProperties:      1840,
      countriesActive:      18,
      dataPointsPerDay:     42800000,
      anonymizedRecords:    totalRecords,
      networkEffect:        '+34%',
      predictiveAccuracy:   91.2,
      sharedInsights:       insightsStore.length * 71, // scale for realism
      lastSync:             '2 minute în urmă',
    });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// GET /api/global-data-network/data-points
router.get('/data-points', (req, res) => {
  try {
    res.json(dataPointsStore);
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// GET /api/global-data-network/insights
router.get('/insights', (req, res) => {
  try {
    res.json(insightsStore);
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// GET /api/global-data-network/benchmarks
router.get('/benchmarks', (req, res) => {
  try {
    res.json(benchmarksStore);
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

export default router;
