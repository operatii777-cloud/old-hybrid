/**
 * Migration 006: Advanced features – Self-Healing, Franchise, API Economy,
 *                Global Data Network, Superapp
 *
 * Creates 11 new tables and seeds them with sensible initial data so that
 * the corresponding route files can serve real DB rows from day one.
 */
import { getDatabase } from '../init-db.js';
import { logger } from '../../utils/logger.js';

export async function up() {
  const db = getDatabase();
  try {

    // ── Self-Healing ─────────────────────────────────────────────────────────

    await db.exec(`
      CREATE TABLE IF NOT EXISTS service_health (
        id          INTEGER PRIMARY KEY AUTOINCREMENT,
        name        TEXT    NOT NULL UNIQUE,
        status      TEXT    NOT NULL DEFAULT 'healthy',
        uptime      REAL    NOT NULL DEFAULT 100.0,
        response_ms INTEGER NOT NULL DEFAULT 0,
        auto_heal   INTEGER NOT NULL DEFAULT 1,
        updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await db.exec(`
      CREATE TABLE IF NOT EXISTS service_incidents (
        id          INTEGER PRIMARY KEY AUTOINCREMENT,
        service_name TEXT NOT NULL,
        type        TEXT NOT NULL,
        detected_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        status      TEXT NOT NULL DEFAULT 'Active',
        duration_seconds INTEGER DEFAULT 0,
        resolved    INTEGER NOT NULL DEFAULT 0,
        resolved_at DATETIME
      )
    `);

    await db.exec(`
      CREATE TABLE IF NOT EXISTS service_healing_log (
        id           INTEGER PRIMARY KEY AUTOINCREMENT,
        service_name TEXT    NOT NULL,
        action       TEXT    NOT NULL,
        result       TEXT    NOT NULL DEFAULT 'In progress',
        automated    INTEGER NOT NULL DEFAULT 1,
        performed_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Seed service_health if empty
    const shCount = await db.get('SELECT COUNT(*) as cnt FROM service_health');
    if (shCount.cnt === 0) {
      const services = [
        ['API Gateway',           'healthy',  99.99,  45,  1],
        ['POS Service',           'healthy',  99.95,  78,  1],
        ['KDS Service',           'healthy',  99.91,  62,  1],
        ['Payment Processor',     'degraded', 98.72, 1240, 1],
        ['Inventory DB',          'healthy',  99.98,  18,  1],
        ['Delivery Tracker',      'healing',  97.40,   0,  1],
        ['Analytics Engine',      'healthy',  99.80, 320,  0],
        ['Notification Service',  'healthy',  99.85,  95,  1],
      ];
      for (const [name, status, uptime, response_ms, auto_heal] of services) {
        await db.run(
          `INSERT INTO service_health (name, status, uptime, response_ms, auto_heal) VALUES (?, ?, ?, ?, ?)`,
          [name, status, uptime, response_ms, auto_heal]
        );
      }
    }

    // Seed service_incidents if empty
    const siCount = await db.get('SELECT COUNT(*) as cnt FROM service_incidents');
    if (siCount.cnt === 0) {
      const incidents = [
        ['Delivery Tracker',  'Timeout',       'Auto-healing', 72,  0],
        ['Payment Processor', 'High Latency',   'Monitoring',  275, 0],
        ['KDS Service',       'Memory Leak',    'Resolved',    128, 1],
        ['API Gateway',       'CPU Spike',      'Resolved',     43, 1],
        ['POS Service',       'Connection Drop','Resolved',    115, 1],
      ];
      for (const [service_name, type, status, duration_seconds, resolved] of incidents) {
        await db.run(
          `INSERT INTO service_incidents (service_name, type, status, duration_seconds, resolved) VALUES (?, ?, ?, ?, ?)`,
          [service_name, type, status, duration_seconds, resolved]
        );
      }
    }

    // Seed service_healing_log if empty
    const shlCount = await db.get('SELECT COUNT(*) as cnt FROM service_healing_log');
    if (shlCount.cnt === 0) {
      const log = [
        ['Delivery Tracker',  'Container restart',          'In progress', 1],
        ['KDS Service',       'Memory flush + restart',     'Success',     1],
        ['API Gateway',       'Load balancer rebalance',    'Success',     1],
        ['POS Service',       'DB connection pool reset',   'Success',     1],
        ['Analytics Engine',  'Manual restart',             'Success',     0],
      ];
      for (const [service_name, action, result, automated] of log) {
        await db.run(
          `INSERT INTO service_healing_log (service_name, action, result, automated) VALUES (?, ?, ?, ?)`,
          [service_name, action, result, automated]
        );
      }
    }

    // ── Franchise ────────────────────────────────────────────────────────────

    await db.exec(`
      CREATE TABLE IF NOT EXISTS franchise_locations (
        id         INTEGER PRIMARY KEY AUTOINCREMENT,
        name       TEXT    NOT NULL,
        city       TEXT    NOT NULL,
        status     TEXT    NOT NULL DEFAULT 'active',
        score      INTEGER NOT NULL DEFAULT 0,
        revenue    REAL    NOT NULL DEFAULT 0,
        royalty    REAL    NOT NULL DEFAULT 0,
        opened_on  DATE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await db.exec(`
      CREATE TABLE IF NOT EXISTS franchise_compliance (
        id         INTEGER PRIMARY KEY AUTOINCREMENT,
        category   TEXT NOT NULL UNIQUE,
        score      INTEGER NOT NULL DEFAULT 100,
        max_score  INTEGER NOT NULL DEFAULT 100,
        last_audit DATE,
        status     TEXT NOT NULL DEFAULT 'pass'
      )
    `);

    await db.exec(`
      CREATE TABLE IF NOT EXISTS franchise_royalties (
        id         INTEGER PRIMARY KEY AUTOINCREMENT,
        month      TEXT NOT NULL,
        total      REAL NOT NULL,
        paid       REAL NOT NULL DEFAULT 0,
        status     TEXT NOT NULL DEFAULT 'paid',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Seed franchise_locations if empty
    const flCount = await db.get('SELECT COUNT(*) as cnt FROM franchise_locations');
    if (flCount.cnt === 0) {
      const locations = [
        ['București – Floreasca', 'București',   'active',   94, 285000, 17100, '2020-03-15'],
        ['Cluj-Napoca – Centru',  'Cluj-Napoca', 'active',   97, 312000, 18720, '2019-09-01'],
        ['Timișoara – Iulius',    'Timișoara',   'active',   88, 198000, 11880, '2021-05-20'],
        ['Iași – Palas',          'Iași',        'active',   82, 176000, 10560, '2021-11-08'],
        ['Brașov – Centrul Nou',  'Brașov',      'active',   91, 221000, 13260, '2022-02-14'],
        ['Constanța – Mamaia',    'Constanța',   'seasonal', 79, 143000,  8580, '2022-06-01'],
      ];
      for (const [name, city, status, score, revenue, royalty, opened_on] of locations) {
        await db.run(
          `INSERT INTO franchise_locations (name, city, status, score, revenue, royalty, opened_on) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [name, city, status, score, revenue, royalty, opened_on]
        );
      }
    }

    // Seed franchise_compliance if empty
    const fcCount = await db.get('SELECT COUNT(*) as cnt FROM franchise_compliance');
    if (fcCount.cnt === 0) {
      const compliance = [
        ['Standarde Igienă',     96,  100, '2024-01-08', 'pass'],
        ['Identitate Vizuală',   92,  100, '2024-01-08', 'pass'],
        ['Meniu Standard',       88,  100, '2024-01-08', 'pass'],
        ['Training Personal',    74,  100, '2023-12-15', 'warning'],
        ['Raportare Financiară', 100, 100, '2024-01-10', 'pass'],
        ['Securitate Date',      83,  100, '2024-01-05', 'pass'],
      ];
      for (const [category, score, max_score, last_audit, status] of compliance) {
        await db.run(
          `INSERT INTO franchise_compliance (category, score, max_score, last_audit, status) VALUES (?, ?, ?, ?, ?)`,
          [category, score, max_score, last_audit, status]
        );
      }
    }

    // Seed franchise_royalties if empty
    const frCount = await db.get('SELECT COUNT(*) as cnt FROM franchise_royalties');
    if (frCount.cnt === 0) {
      const royalties = [
        ['Ian 2024', 24200, 24200, 'paid'],
        ['Dec 2023', 22800, 22800, 'paid'],
        ['Nov 2023', 21400, 21400, 'paid'],
        ['Oct 2023', 23600, 23600, 'paid'],
        ['Sep 2023', 19800, 14200, 'partial'],
      ];
      for (const [month, total, paid, status] of royalties) {
        await db.run(
          `INSERT INTO franchise_royalties (month, total, paid, status) VALUES (?, ?, ?, ?)`,
          [month, total, paid, status]
        );
      }
    }

    // ── API Economy ──────────────────────────────────────────────────────────

    await db.exec(`
      CREATE TABLE IF NOT EXISTS api_keys (
        id          INTEGER PRIMARY KEY AUTOINCREMENT,
        name        TEXT NOT NULL,
        key_preview TEXT NOT NULL UNIQUE,
        calls       INTEGER NOT NULL DEFAULT 0,
        status      TEXT NOT NULL DEFAULT 'active',
        tier        TEXT NOT NULL DEFAULT 'Standard',
        created_at  DATE DEFAULT (date('now'))
      )
    `);

    await db.exec(`
      CREATE TABLE IF NOT EXISTS api_webhooks (
        id          INTEGER PRIMARY KEY AUTOINCREMENT,
        event       TEXT NOT NULL,
        url         TEXT NOT NULL,
        status      TEXT NOT NULL DEFAULT 'active',
        fired_today INTEGER NOT NULL DEFAULT 0,
        created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Seed api_keys if empty
    const akCount = await db.get('SELECT COUNT(*) as cnt FROM api_keys');
    if (akCount.cnt === 0) {
      const keys = [
        ['Delivery Partner – Glovo',  'sk_live_glo_****8f3a', 142800, 'active',    'Premium'],
        ['Accounting – Saga',          'sk_live_sag_****c4d2',  28400, 'active',    'Standard'],
        ['POS Terminal – Verifone',    'sk_live_vfn_****7e1b', 892100, 'active',    'Premium'],
        ['Loyalty App – Mobile',       'sk_live_mob_****a9f5', 384200, 'active',    'Standard'],
        ['Rezervări – TripAdvisor',    'sk_live_ta_****3b88',   21600, 'suspended', 'Basic'],
      ];
      for (const [name, key_preview, calls, status, tier] of keys) {
        await db.run(
          `INSERT INTO api_keys (name, key_preview, calls, status, tier) VALUES (?, ?, ?, ?, ?)`,
          [name, key_preview, calls, status, tier]
        );
      }
    }

    // Seed api_webhooks if empty
    const awCount = await db.get('SELECT COUNT(*) as cnt FROM api_webhooks');
    if (awCount.cnt === 0) {
      const webhooks = [
        ['order.created',   'https://glovo.com/webhook/order',    'active',   284],
        ['order.completed', 'https://glovo.com/webhook/complete', 'active',   271],
        ['payment.success', 'https://saga.ro/api/payment',        'active',   228],
        ['reservation.new', 'https://tripadvisor.com/hook/res',   'inactive',   0],
        ['inventory.low',   'https://erp.supplier.ro/alert',      'active',    12],
      ];
      for (const [event, url, status, fired_today] of webhooks) {
        await db.run(
          `INSERT INTO api_webhooks (event, url, status, fired_today) VALUES (?, ?, ?, ?)`,
          [event, url, status, fired_today]
        );
      }
    }

    // ── Global Data Network ──────────────────────────────────────────────────

    await db.exec(`
      CREATE TABLE IF NOT EXISTS network_insights (
        id          INTEGER PRIMARY KEY AUTOINCREMENT,
        type        TEXT NOT NULL,
        icon        TEXT,
        title       TEXT NOT NULL,
        description TEXT,
        confidence  INTEGER NOT NULL DEFAULT 80,
        impact      TEXT NOT NULL DEFAULT 'Mediu',
        active      INTEGER NOT NULL DEFAULT 1,
        created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Seed network_insights if empty
    const niCount = await db.get('SELECT COUNT(*) as cnt FROM network_insights');
    if (niCount.cnt === 0) {
      const insights = [
        ['trend',      '📈', 'Creștere demand – burgeri artizanali',
         'Rețeaua globală indică +38% creștere în cerere pentru burgeri premium față de luna trecută. Locațiile din Cluj și București au cel mai mare potențial neexploatat.',
         94, 'Ridicat'],
        ['pricing',    '💰', 'Oportunitate de reprețuire – pizza',
         'Analiza de rețea arată că prețul mediu la pizza în zona dvs. este cu 12% sub media pieței. Creșterea cu 8-10% nu ar afecta cererea.',
         87, 'Mediu'],
        ['operations', '⏱️', 'Timp de așteptare ridicat joi 19:00-21:00',
         'Pattern identificat în 840 de restaurante similare: vârful de joi seara necesită +2 angajați în bucătărie pentru a reduce timpii de așteptare.',
         91, 'Mediu'],
        ['loyalty',    '🎯', 'Campanie loialitate recomandată – weekend',
         'Clienții din segmentul "At-Risk" au o rată de reactivare de 42% la ofertele de weekend bazate pe date din rețea.',
         82, 'Ridicat'],
      ];
      for (const [type, icon, title, description, confidence, impact] of insights) {
        await db.run(
          `INSERT INTO network_insights (type, icon, title, description, confidence, impact) VALUES (?, ?, ?, ?, ?, ?)`,
          [type, icon, title, description, confidence, impact]
        );
      }
    }

    // ── Superapp ─────────────────────────────────────────────────────────────

    await db.exec(`
      CREATE TABLE IF NOT EXISTS superapp_modules (
        id          INTEGER PRIMARY KEY AUTOINCREMENT,
        name        TEXT NOT NULL UNIQUE,
        icon        TEXT,
        status      TEXT NOT NULL DEFAULT 'live',
        users       INTEGER NOT NULL DEFAULT 0,
        description TEXT,
        category    TEXT
      )
    `);

    await db.exec(`
      CREATE TABLE IF NOT EXISTS superapp_integrations (
        id     INTEGER PRIMARY KEY AUTOINCREMENT,
        name   TEXT NOT NULL UNIQUE,
        type   TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'active',
        icon   TEXT
      )
    `);

    // Seed superapp_modules if empty
    const smCount = await db.get('SELECT COUNT(*) as cnt FROM superapp_modules');
    if (smCount.cnt === 0) {
      const modules = [
        ['Rezervări & Mese',    '📅', 'live',   18400, 'Rezervare masă, selectare loc, preferințe speciale',            'Dining'],
        ['Comandă & Plată',     '🛒', 'live',   28400, 'Comandă din meniu, plată mobilă, split bill',                   'Dining'],
        ['Delivery',            '🛵', 'live',   22100, 'Livrare la domiciliu, tracking în timp real',                    'Delivery'],
        ['Program Loialitate',  '💎', 'live',   34800, 'Puncte, recompense, tier gold/platinum',                         'Loyalty'],
        ['Wallet Digital',      '💳', 'live',   12400, 'Plată rapidă, credit bonus, abonamente',                         'Payments'],
        ['Experiențe & Events', '🎉', 'live',    8200, 'Cine tematice, chef table, wine tasting',                        'Experience'],
        ['Catering & Corporate','🏢', 'beta',    2400, 'Comenzi corporate, facturare B2B, gestiune bugete',              'B2B'],
        ['Ghost Kitchen Order', '👻', 'beta',    1840, 'Comandă din bucătăriile virtuale disponibile',                   'Delivery'],
        ['AI Food Assistant',   '🤖', 'coming',     0, 'Recomandări personalizate AI bazate pe preferințe',              'AI'],
        ['Social Dining',       '👥', 'coming',     0, 'Invitații prieteni, group ordering, bill sharing',               'Social'],
      ];
      for (const [name, icon, status, users, description, category] of modules) {
        await db.run(
          `INSERT INTO superapp_modules (name, icon, status, users, description, category) VALUES (?, ?, ?, ?, ?, ?)`,
          [name, icon, status, users, description, category]
        );
      }
    }

    // Seed superapp_integrations if empty
    const siIntCount = await db.get('SELECT COUNT(*) as cnt FROM superapp_integrations');
    if (siIntCount.cnt === 0) {
      const integrations = [
        ['Apple Pay / Google Pay',       'Plăți',      'active', '💳'],
        ['Glovo / Bolt Food / Tazz',     'Delivery',   'active', '🛵'],
        ['Google Maps',                  'Navigație',  'active', '🗺️'],
        ['Push Notifications',           'Marketing',  'active', '🔔'],
        ['WhatsApp Business',            'Comunicare', 'active', '💬'],
        ['TripAdvisor / Google Reviews', 'Recenzii',   'active', '⭐'],
        ['Stripe / Netopia',             'Plăți',      'active', '🏦'],
        ['Facebook / Instagram Ads',     'Marketing',  'beta',   '📱'],
      ];
      for (const [name, type, status, icon] of integrations) {
        await db.run(
          `INSERT INTO superapp_integrations (name, type, status, icon) VALUES (?, ?, ?, ?)`,
          [name, type, status, icon]
        );
      }
    }

    logger.info('✅ Migration 006: Advanced features tables created and seeded');
  } catch (error) {
    logger.error('❌ Migration 006 error:', error);
    throw error;
  }
}

export async function down() {
  const db = getDatabase();
  try {
    await db.exec('DROP TABLE IF EXISTS superapp_integrations');
    await db.exec('DROP TABLE IF EXISTS superapp_modules');
    await db.exec('DROP TABLE IF EXISTS network_insights');
    await db.exec('DROP TABLE IF EXISTS api_webhooks');
    await db.exec('DROP TABLE IF EXISTS api_keys');
    await db.exec('DROP TABLE IF EXISTS franchise_royalties');
    await db.exec('DROP TABLE IF EXISTS franchise_compliance');
    await db.exec('DROP TABLE IF EXISTS franchise_locations');
    await db.exec('DROP TABLE IF EXISTS service_healing_log');
    await db.exec('DROP TABLE IF EXISTS service_incidents');
    await db.exec('DROP TABLE IF EXISTS service_health');
    logger.info('✅ Migration 006 rolled back');
  } catch (error) {
    logger.error('❌ Migration 006 rollback error:', error);
    throw error;
  }
}
