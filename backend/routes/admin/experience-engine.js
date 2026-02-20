import express from 'express';
import { getDatabase } from '../../database/init-db.js';
import { logger } from '../../utils/logger.js';

const router = express.Router();

// ── Demo data ──────────────────────────────────────────────────────────────

const demoScenes = [
  { id: 1, name: 'Prânz Energic', music: 'Pop/Electronic', lighting: 'Luminos 100%', signage: 'Meniu Prânz Special', temp: '20°C', trigger: 'time:12:00', active: false, icon: '☀️' },
  { id: 2, name: 'Seara Romantică', music: 'Jazz/Lounge', lighting: 'Cald 40%', signage: 'Meniu Cină & Vinuri', temp: '22°C', trigger: 'time:19:00', active: true, icon: '🕯️' },
  { id: 3, name: 'Happy Hour', music: 'R&B/Soul', lighting: 'Colorat 70%', signage: 'Oferte Băuturi -30%', temp: '21°C', trigger: 'time:17:00', active: false, icon: '🎉' },
  { id: 4, name: 'Închidere Treptată', music: 'Ambient/Chill', lighting: 'Dimmer 20%', signage: 'Mulțumim! Ne vedem mâine', temp: '19°C', trigger: 'time:22:30', active: false, icon: '🌙' },
];

const demoDevices = [
  { id: 1, type: 'light', name: 'Lumini Sală Principală', icon: '💡', status: 'Online', value: 40, unit: '%' },
  { id: 2, type: 'light', name: 'Lumini Bar', icon: '💡', status: 'Online', value: 75, unit: '%' },
  { id: 3, type: 'speaker', name: 'Sound System Main', icon: '🔊', status: 'Online', value: 60, unit: '%' },
  { id: 4, type: 'speaker', name: 'Terasă Exterior', icon: '🔊', status: 'Offline', value: 0, unit: '%' },
  { id: 5, type: 'display', name: 'Afișaj Intrare', icon: '📺', status: 'Online', value: 100, unit: '%' },
  { id: 6, type: 'display', name: 'Meniu Digital Bar', icon: '📺', status: 'Online', value: 100, unit: '%' },
  { id: 7, type: 'hvac', name: 'Climatizare Sală', icon: '🌡️', status: 'Online', value: 22, unit: '°C' },
  { id: 8, type: 'hvac', name: 'Climatizare Bucătărie', icon: '🌡️', status: 'Online', value: 18, unit: '°C' },
];

const demoOccupancy = {
  current: 68,
  capacity: 80,
  pct: 85,
  prediction: [
    { hour: '18:00', pct: 70 },
    { hour: '19:00', pct: 90 },
    { hour: '20:00', pct: 100 },
    { hour: '21:00', pct: 85 },
    { hour: '22:00', pct: 50 },
  ]
};

const demoSignageSchedule = [
  { time: '08:00–11:00', mon: 'Mic Dejun', tue: 'Mic Dejun', wed: 'Mic Dejun', thu: 'Mic Dejun', fri: 'Mic Dejun', sat: 'Brunch', sun: 'Brunch' },
  { time: '11:00–15:00', mon: 'Prânz Special', tue: 'Prânz Special', wed: 'Prânz Special', thu: 'Prânz Special', fri: 'Prânz Special', sat: 'Meniu Complet', sun: 'Meniu Complet' },
  { time: '15:00–17:00', mon: 'Cafea & Desert', tue: 'Cafea & Desert', wed: 'Cafea & Desert', thu: 'Cafea & Desert', fri: 'Cafea & Desert', sat: 'Cafea & Desert', sun: 'Cafea & Desert' },
  { time: '17:00–19:00', mon: 'Happy Hour', tue: 'Happy Hour', wed: 'Happy Hour', thu: 'Happy Hour', fri: 'Happy Hour 2x', sat: 'Happy Hour 2x', sun: '-' },
  { time: '19:00–23:00', mon: 'Cină', tue: 'Cină', wed: 'Cină', thu: 'Cină', fri: 'Cină Romantică', sat: 'Cină Gală', sun: 'Cină' },
];

// ── Routes ─────────────────────────────────────────────────────────────────

// GET /api/experience-engine/scenes
router.get('/scenes', (req, res) => {
  try {
    res.json(demoScenes);
  } catch (err) {
    logger.error('experience-engine scenes error', err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// GET /api/experience-engine/devices
router.get('/devices', (req, res) => {
  try {
    res.json(demoDevices);
  } catch (err) {
    logger.error('experience-engine devices error', err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// GET /api/experience-engine/occupancy
router.get('/occupancy', (req, res) => {
  try {
    res.json(demoOccupancy);
  } catch (err) {
    logger.error('experience-engine occupancy error', err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// GET /api/experience-engine/signage-schedule
router.get('/signage-schedule', (req, res) => {
  try {
    res.json(demoSignageSchedule);
  } catch (err) {
    logger.error('experience-engine signage-schedule error', err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// POST /api/experience-engine/scenes/:id/activate
router.post('/scenes/:id/activate', (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const scene = demoScenes.find(s => s.id === id);
    if (!scene) {
      return res.status(404).json({ ok: false, error: 'Scene not found' });
    }
    demoScenes.forEach(s => { s.active = s.id === id; });
    logger.info(`Scene ${id} (${scene.name}) activated`);
    res.json({ ok: true, activeScene: scene });
  } catch (err) {
    logger.error('experience-engine activate error', err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// PUT /api/experience-engine/devices/:id/control
router.put('/devices/:id/control', (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { value } = req.body;
    const device = demoDevices.find(d => d.id === id);
    if (!device) {
      return res.status(404).json({ ok: false, error: 'Device not found' });
    }
    device.value = value;
    logger.info(`Device ${id} (${device.name}) set to ${value}`);
    res.json({ ok: true, device });
  } catch (err) {
    logger.error('experience-engine device control error', err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

export default router;
