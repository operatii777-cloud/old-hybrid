import express from 'express';
import { logger } from '../../utils/logger.js';

const router = express.Router();

// In-memory store for resolved alerts (demo mode)
const resolvedAlerts = new Set();

// ===== ALERTE FRAUDĂ =====
router.get('/alerts', async (req, res) => {
  try {
    const alerts = [
      {
        id: 1,
        type: 'excessive_voids',
        operator: 'Ion Popescu',
        description: 'Anulări excesive: 14 anulări în schimbul de azi',
        severity: 'HIGH',
        count: 14,
        value: 312.50,
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        resolved: resolvedAlerts.has(1)
      },
      {
        id: 2,
        type: 'suspicious_discount',
        operator: 'Maria Ionescu',
        description: 'Discount neautorizat aplicat de 8 ori: 15% fără aprobare manager',
        severity: 'HIGH',
        count: 8,
        value: 89.60,
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        resolved: resolvedAlerts.has(2)
      },
      {
        id: 3,
        type: 'ghost_order',
        operator: 'Andrei Dumitrescu',
        description: 'Comandă introdusă și anulată imediat (sub 60 secunde): 3 cazuri',
        severity: 'MEDIUM',
        count: 3,
        value: 67.00,
        timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
        resolved: resolvedAlerts.has(3)
      },
      {
        id: 4,
        type: 'excessive_voids',
        operator: 'Elena Popa',
        description: 'Anulări excesive: 7 anulări după bonul fiscal emis',
        severity: 'MEDIUM',
        count: 7,
        value: 145.20,
        timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
        resolved: resolvedAlerts.has(4)
      },
      {
        id: 5,
        type: 'suspicious_discount',
        operator: 'Gheorghe Marin',
        description: 'Discount 100% aplicat pe 2 produse scumpe',
        severity: 'HIGH',
        count: 2,
        value: 210.00,
        timestamp: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(),
        resolved: resolvedAlerts.has(5)
      },
      {
        id: 6,
        type: 'ghost_order',
        operator: 'Cristina Luca',
        description: 'Comandă repetată de 5 ori pentru același produs, anulate ulterior',
        severity: 'LOW',
        count: 5,
        value: 38.50,
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        resolved: resolvedAlerts.has(6)
      }
    ].map(a => ({ ...a, resolved: resolvedAlerts.has(a.id) }));

    const summary = {
      total: alerts.length,
      high: alerts.filter(a => a.severity === 'HIGH').length,
      medium: alerts.filter(a => a.severity === 'MEDIUM').length,
      low: alerts.filter(a => a.severity === 'LOW').length,
      unresolved: alerts.filter(a => !a.resolved).length,
      total_value_at_risk: alerts.filter(a => !a.resolved).reduce((s, a) => s + a.value, 0)
    };

    res.json({ alerts, summary });
  } catch (error) {
    logger.error('Risk alerts error:', error);
    res.status(500).json({ error: 'Eroare la preluarea alertelor de risc' });
  }
});

// ===== DETECTIE DIMINUARE STOC =====
router.get('/shrinkage', async (req, res) => {
  try {
    const shrinkage = [
      {
        id: 1,
        ingredient: 'Carne de vită',
        unit: 'kg',
        expected_consumption: 12.5,
        actual_consumption: 15.8,
        variance: 3.3,
        variance_percent: 26.4,
        trend: 'up',
        cost_per_unit: 35.00,
        loss_value: 115.50,
        alert_level: 'HIGH',
        period: 'azi'
      },
      {
        id: 2,
        ingredient: 'Mozzarella',
        unit: 'kg',
        expected_consumption: 4.2,
        actual_consumption: 5.1,
        variance: 0.9,
        variance_percent: 21.4,
        trend: 'up',
        cost_per_unit: 22.00,
        loss_value: 19.80,
        alert_level: 'MEDIUM',
        period: 'azi'
      },
      {
        id: 3,
        ingredient: 'Alcool premium (whisky)',
        unit: 'L',
        expected_consumption: 1.2,
        actual_consumption: 2.1,
        variance: 0.9,
        variance_percent: 75.0,
        trend: 'up',
        cost_per_unit: 120.00,
        loss_value: 108.00,
        alert_level: 'HIGH',
        period: 'azi'
      },
      {
        id: 4,
        ingredient: 'Somon afumat',
        unit: 'kg',
        expected_consumption: 1.8,
        actual_consumption: 2.2,
        variance: 0.4,
        variance_percent: 22.2,
        trend: 'stable',
        cost_per_unit: 85.00,
        loss_value: 34.00,
        alert_level: 'MEDIUM',
        period: 'azi'
      },
      {
        id: 5,
        ingredient: 'Ulei de măsline',
        unit: 'L',
        expected_consumption: 2.0,
        actual_consumption: 2.1,
        variance: 0.1,
        variance_percent: 5.0,
        trend: 'stable',
        cost_per_unit: 18.00,
        loss_value: 1.80,
        alert_level: 'LOW',
        period: 'azi'
      },
      {
        id: 6,
        ingredient: 'Creveți tigru',
        unit: 'kg',
        expected_consumption: 2.4,
        actual_consumption: 3.5,
        variance: 1.1,
        variance_percent: 45.8,
        trend: 'up',
        cost_per_unit: 95.00,
        loss_value: 104.50,
        alert_level: 'HIGH',
        period: 'azi'
      }
    ];

    const total_loss = shrinkage.reduce((s, i) => s + i.loss_value, 0);
    res.json({ shrinkage, total_loss });
  } catch (error) {
    logger.error('Shrinkage detection error:', error);
    res.status(500).json({ error: 'Eroare la detectarea diminuărilor de stoc' });
  }
});

// ===== MODELE COLUZIUNE PERSONAL =====
router.get('/collusion', async (req, res) => {
  try {
    const collusion = [
      {
        id: 1,
        employee_a: 'Ion Popescu',
        role_a: 'Ospătar',
        employee_b: 'Maria Ionescu',
        role_b: 'Casier',
        pattern: 'Aprobări reciproce de discounturi',
        occurrences: 23,
        total_value: 487.00,
        risk_score: 87,
        first_detected: '2024-11-15',
        last_seen: new Date().toISOString().split('T')[0],
        details: 'Ion Popescu aplică discount, aprobat de Maria Ionescu. Pattern repetat în 23 din 31 zile.'
      },
      {
        id: 2,
        employee_a: 'Andrei Dumitrescu',
        role_a: 'Ospătar',
        employee_b: 'Gheorghe Marin',
        role_b: 'Bucătar-șef',
        pattern: 'Comenzi anulate după preparare',
        occurrences: 11,
        total_value: 232.50,
        risk_score: 62,
        first_detected: '2024-12-01',
        last_seen: new Date().toISOString().split('T')[0],
        details: 'Comenzi marcate ca pregătite, ulterior anulate de echipă. Produsele nu sunt returnate în stoc.'
      },
      {
        id: 3,
        employee_a: 'Elena Popa',
        role_a: 'Ospătar',
        employee_b: 'Cristina Luca',
        role_b: 'Ospătar',
        pattern: 'Transfer comenzi între mese suspect',
        occurrences: 7,
        total_value: 118.00,
        risk_score: 44,
        first_detected: '2024-12-10',
        last_seen: new Date().toISOString().split('T')[0],
        details: 'Comenzile sunt transferate între mese la finalul turei, modificând totalul bonului.'
      }
    ];

    res.json({ collusion });
  } catch (error) {
    logger.error('Collusion detection error:', error);
    res.status(500).json({ error: 'Eroare la detectarea modelelor de coluziune' });
  }
});

// ===== CLUSTERE RAMBURSĂRI/ANULĂRI =====
router.get('/refund-clusters', async (req, res) => {
  try {
    const clusters = [
      {
        id: 1,
        window_start: '2025-01-08T12:00:00',
        window_end: '2025-01-08T14:00:00',
        window_label: 'Ora prânzului (12:00-14:00)',
        refund_count: 8,
        normal_baseline: 1.2,
        spike_multiplier: 6.7,
        total_value: 234.50,
        operators_involved: ['Ion Popescu', 'Maria Ionescu'],
        risk_level: 'HIGH'
      },
      {
        id: 2,
        window_start: '2025-01-07T19:00:00',
        window_end: '2025-01-07T21:00:00',
        window_label: 'Cina de seară (19:00-21:00)',
        refund_count: 5,
        normal_baseline: 0.8,
        spike_multiplier: 6.25,
        total_value: 187.00,
        operators_involved: ['Andrei Dumitrescu'],
        risk_level: 'HIGH'
      },
      {
        id: 3,
        window_start: '2025-01-06T15:00:00',
        window_end: '2025-01-06T17:00:00',
        window_label: 'După-amiaza (15:00-17:00)',
        refund_count: 3,
        normal_baseline: 0.5,
        spike_multiplier: 6.0,
        total_value: 89.00,
        operators_involved: ['Elena Popa', 'Cristina Luca'],
        risk_level: 'MEDIUM'
      },
      {
        id: 4,
        window_start: '2025-01-05T20:00:00',
        window_end: '2025-01-05T22:00:00',
        window_label: 'Seara târzie (20:00-22:00)',
        refund_count: 2,
        normal_baseline: 0.6,
        spike_multiplier: 3.33,
        total_value: 45.00,
        operators_involved: ['Gheorghe Marin'],
        risk_level: 'LOW'
      }
    ];

    res.json({ clusters });
  } catch (error) {
    logger.error('Refund clusters error:', error);
    res.status(500).json({ error: 'Eroare la detectarea clusterelor de rambursare' });
  }
});

// ===== SCORURI RISC ANGAJAȚI =====
router.get('/risk-scores', async (req, res) => {
  try {
    const scores = [
      {
        employee_id: 1,
        name: 'Ion Popescu',
        role: 'Ospătar',
        risk_score: 87,
        risk_level: 'HIGH',
        void_rate: 18.5,
        discount_rate: 12.3,
        refund_rate: 8.1,
        avg_transaction: 42.50,
        anomaly_flags: 5,
        last_incident: '2025-01-08'
      },
      {
        employee_id: 2,
        name: 'Maria Ionescu',
        role: 'Casier',
        risk_score: 74,
        risk_level: 'HIGH',
        void_rate: 9.2,
        discount_rate: 22.1,
        refund_rate: 5.4,
        avg_transaction: 38.20,
        anomaly_flags: 4,
        last_incident: '2025-01-08'
      },
      {
        employee_id: 3,
        name: 'Andrei Dumitrescu',
        role: 'Ospătar',
        risk_score: 58,
        risk_level: 'MEDIUM',
        void_rate: 8.7,
        discount_rate: 6.4,
        refund_rate: 11.2,
        avg_transaction: 35.80,
        anomaly_flags: 2,
        last_incident: '2025-01-07'
      },
      {
        employee_id: 4,
        name: 'Elena Popa',
        role: 'Ospătar',
        risk_score: 41,
        risk_level: 'MEDIUM',
        void_rate: 5.1,
        discount_rate: 4.8,
        refund_rate: 6.3,
        avg_transaction: 39.10,
        anomaly_flags: 1,
        last_incident: '2025-01-06'
      },
      {
        employee_id: 5,
        name: 'Gheorghe Marin',
        role: 'Bucătar-șef',
        risk_score: 35,
        risk_level: 'MEDIUM',
        void_rate: 3.2,
        discount_rate: 15.6,
        refund_rate: 2.1,
        avg_transaction: 0,
        anomaly_flags: 1,
        last_incident: '2025-01-05'
      },
      {
        employee_id: 6,
        name: 'Cristina Luca',
        role: 'Ospătar',
        risk_score: 18,
        risk_level: 'LOW',
        void_rate: 2.1,
        discount_rate: 1.8,
        refund_rate: 1.5,
        avg_transaction: 44.30,
        anomaly_flags: 0,
        last_incident: null
      }
    ];

    res.json({ scores });
  } catch (error) {
    logger.error('Risk scores error:', error);
    res.status(500).json({ error: 'Eroare la calcularea scorurilor de risc' });
  }
});

// ===== MARCARE ALERTĂ CA REZOLVATĂ =====
const VALID_ALERT_IDS = new Set([1, 2, 3, 4, 5, 6]);

router.put('/alerts/:id/resolve', async (req, res) => {
  try {
    const { id } = req.params;
    const alertId = parseInt(id, 10);
    if (isNaN(alertId)) {
      return res.status(400).json({ error: 'ID alertă invalid' });
    }
    if (!VALID_ALERT_IDS.has(alertId)) {
      return res.status(404).json({ error: `Alerta #${alertId} nu există` });
    }
    resolvedAlerts.add(alertId);
    res.json({ success: true, message: `Alerta #${alertId} a fost marcată ca rezolvată` });
  } catch (error) {
    logger.error('Resolve alert error:', error);
    res.status(500).json({ error: 'Eroare la rezolvarea alertei' });
  }
});

export default router;
