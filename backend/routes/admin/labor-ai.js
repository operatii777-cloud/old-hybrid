import express from 'express';
const router = express.Router();

// ── Demo data helpers ──────────────────────────────────────────────────────

const generateDemandForecast = () => {
  const days = [
    { day: 'today', label: 'Azi' },
    { day: 'tomorrow', label: 'Mâine' },
    { day: 'Mon', label: 'Luni' },
    { day: 'Tue', label: 'Marți' },
    { day: 'Wed', label: 'Miercuri' },
    { day: 'Thu', label: 'Joi' },
    { day: 'Fri', label: 'Vineri' },
  ];
  return days.map(({ day, label }) => ({
    day,
    label,
    slots: Array.from({ length: 32 }, (_, i) => {
      const hour = 8 + Math.floor(i * 0.5);
      const min = (i % 2) * 30;
      const isPeak = (hour >= 12 && hour <= 14) || (hour >= 19 && hour <= 21);
      return {
        time: `${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`,
        demand: isPeak ? Math.floor(Math.random() * 10) + 15 : Math.floor(Math.random() * 6) + 2,
        isPeak,
      };
    }),
    peakHours: ['12:00-14:00', '19:00-21:00'],
    maxDemand: 26,
  }));
};

const demoShiftSuggestions = [
  { id: 1, role: 'Kitchen', date: 'Azi 18:00', headcount: 3, reason: 'Cerere ridicată estimată vineri seară', laborCostImpact: '+120 RON', status: 'pending' },
  { id: 2, role: 'Waiter', date: 'Mâine 12:00', headcount: 4, reason: 'Prânz weekend – istoric +40% comenzi', laborCostImpact: '+80 RON', status: 'pending' },
  { id: 3, role: 'Bar', date: 'Sâmbătă 20:00', headcount: 2, reason: 'Event rezervat – 60 persoane', laborCostImpact: '+60 RON', status: 'approved' },
  { id: 4, role: 'Courier', date: 'Azi 19:00', headcount: 2, reason: 'Spike de livrări estimat', laborCostImpact: '+50 RON', status: 'pending' },
  { id: 5, role: 'Cashier', date: 'Duminică 11:00', headcount: 1, reason: 'Reducere trafic – oră liniștită', laborCostImpact: '-30 RON', status: 'pending' },
];

let shiftSuggestionsState = [...demoShiftSuggestions];

// ── Routes ─────────────────────────────────────────────────────────────────

// GET /api/labor-ai/demand-forecast
router.get('/demand-forecast', (req, res) => {
  try {
    res.json(generateDemandForecast());
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// GET /api/labor-ai/shift-suggestions
router.get('/shift-suggestions', (req, res) => {
  try {
    res.json(shiftSuggestionsState);
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// GET /api/labor-ai/labor-cost
router.get('/labor-cost', (req, res) => {
  try {
    res.json({
      currentHour: { percent: 34.2, target: 30, alert: true },
      dailyTrend: [
        { day: 'L', percent: 28.1 }, { day: 'M', percent: 29.5 }, { day: 'Mi', percent: 31.2 },
        { day: 'J', percent: 27.8 }, { day: 'V', percent: 33.4 }, { day: 'S', percent: 30.1 },
        { day: 'D', percent: 34.2 },
      ],
      target: 30,
    });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// GET /api/labor-ai/overtime-risk
router.get('/overtime-risk', (req, res) => {
  try {
    res.json([
      { id: 1, name: 'Andrei Popa', role: 'Bucătar', hours_this_week: 38, threshold: 40, risk_level: 'HIGH' },
      { id: 2, name: 'Maria Ionescu', role: 'Ospătar', hours_this_week: 36, threshold: 40, risk_level: 'MEDIUM' },
      { id: 3, name: 'Cosmin Radu', role: 'Barman', hours_this_week: 33, threshold: 40, risk_level: 'LOW' },
      { id: 4, name: 'Elena Dumitrescu', role: 'Casier', hours_this_week: 39, threshold: 40, risk_level: 'HIGH' },
      { id: 5, name: 'Florin Munteanu', role: 'Curier', hours_this_week: 35, threshold: 40, risk_level: 'MEDIUM' },
    ]);
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// GET /api/labor-ai/burnout-signals
router.get('/burnout-signals', (req, res) => {
  try {
    res.json([
      { id: 1, name: 'Andrei Popa', role: 'Bucătar', burnoutScore: 82, lateClockIns: 7, efficiencyDrop: -18, voids: 12, managerNote: 'A cerut 3 zile libere luna trecută. Sugerăm o discuție.' },
      { id: 2, name: 'Elena Dumitrescu', role: 'Casier', burnoutScore: 67, lateClockIns: 4, efficiencyDrop: -11, voids: 8, managerNote: 'Performanță în scădere constantă ultimele 2 săptămâni.' },
      { id: 3, name: 'Maria Ionescu', role: 'Ospătar', burnoutScore: 45, lateClockIns: 2, efficiencyDrop: -5, voids: 3, managerNote: null },
    ]);
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// POST /api/labor-ai/shift-suggestions/:id/approve
router.post('/shift-suggestions/:id/approve', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    shiftSuggestionsState = shiftSuggestionsState.map(s =>
      s.id === id ? { ...s, status: 'approved' } : s
    );
    res.json({ ok: true, id, status: 'approved' });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// POST /api/labor-ai/shift-suggestions/:id/reject
router.post('/shift-suggestions/:id/reject', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    shiftSuggestionsState = shiftSuggestionsState.map(s =>
      s.id === id ? { ...s, status: 'rejected' } : s
    );
    res.json({ ok: true, id, status: 'rejected' });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

export default router;
