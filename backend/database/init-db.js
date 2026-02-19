import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import { fileURLToPath } from 'url';
import { logger } from '../utils/logger.js';
import { faraDiacritice } from '../utils/fara-diacritice.js';
import { isIngredientExclus } from '../utils/ingrediente-excluse.js';
import { clasificaIngredient, GESTIUNE_BUCATARIE, GESTIUNE_BAR } from '../utils/horeca-gestiuni.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = process.env.DATABASE_URL || path.join(__dirname, '../../data/restaurant.db');

let db = null;

export async function initDatabase() {
  try {
    db = await open({
      filename: DB_PATH,
      driver: sqlite3.Database
    });

    // Performance optimizations for SQLite
    await db.exec('PRAGMA foreign_keys = ON');
    await db.exec('PRAGMA journal_mode = WAL'); // Write-Ahead Logging for better concurrency
    await db.exec('PRAGMA synchronous = NORMAL'); // Balance between safety and speed
    await db.exec('PRAGMA cache_size = -64000'); // 64MB cache for better performance
    await db.exec('PRAGMA temp_store = MEMORY'); // Store temp tables in memory
    await db.exec('PRAGMA mmap_size = 268435456'); // 256MB memory-mapped I/O
    await db.exec('PRAGMA page_size = 4096'); // Optimal page size
    await db.exec('PRAGMA busy_timeout = 5000'); // 5 second timeout for locked database
    
    // Create tables
    await createTables();
    logger.info('✅ Database initialized at:', DB_PATH);
    
    return db;
  } catch (error) {
    logger.error('Database init error:', error);
    throw error;
  }
}

async function createTables() {
  const tables = [
    // Ospetari (Waiters)
    `CREATE TABLE IF NOT EXISTS ospetari (
      id TEXT PRIMARY KEY,
      pin TEXT UNIQUE NOT NULL,
      nume TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,

    // Mese (Tables)
    `CREATE TABLE IF NOT EXISTS mese (
      id INTEGER PRIMARY KEY,
      nume TEXT NOT NULL,
      capacitate INTEGER DEFAULT 4,
      status TEXT DEFAULT 'libera',
      ospatar_id TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(ospatar_id) REFERENCES ospetari(id)
    )`,

    // Produse (Products)
    `CREATE TABLE IF NOT EXISTS produse (
      cod_prod INTEGER PRIMARY KEY,
      den_prod TEXT NOT NULL,
      dept INTEGER,
      grupa TEXT,
      pret_vanzare REAL NOT NULL,
      tva REAL DEFAULT 1,
      categorie TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,

    // Comenzi (Orders)
    `CREATE TABLE IF NOT EXISTS comenzi (
      id TEXT PRIMARY KEY,
      masa_id INTEGER NOT NULL,
      ospatar_id TEXT NOT NULL,
      data DATETIME DEFAULT CURRENT_TIMESTAMP,
      status TEXT DEFAULT 'plasata',
      discount REAL DEFAULT 0,
      tip_plata INTEGER DEFAULT 1,
      total REAL DEFAULT 0,
      synced INTEGER DEFAULT 0,
      FOREIGN KEY(masa_id) REFERENCES mese(id),
      FOREIGN KEY(ospatar_id) REFERENCES ospetari(id)
    )`,

    // Liniile comenzii (Order lines)
    `CREATE TABLE IF NOT EXISTS comenzi_linii (
      id TEXT PRIMARY KEY,
      comanda_id TEXT NOT NULL,
      cod_prod INTEGER NOT NULL,
      cant REAL NOT NULL,
      pret_unitar REAL NOT NULL,
      valoare REAL NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(comanda_id) REFERENCES comenzi(id),
      FOREIGN KEY(cod_prod) REFERENCES produse(cod_prod)
    )`,

    // Memoate (Memorized orders)
    `CREATE TABLE IF NOT EXISTS memoate (
      id TEXT PRIMARY KEY,
      ospatar_id TEXT NOT NULL,
      comanda_data TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(ospatar_id) REFERENCES ospetari(id)
    )`,

    // Sincronizare (Sync log)
    `CREATE TABLE IF NOT EXISTS sync_log (
      id TEXT PRIMARY KEY,
      table_name TEXT NOT NULL,
      record_id TEXT NOT NULL,
      action TEXT,
      synced_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      cloud_synced INTEGER DEFAULT 0
    )`,

    // WAREHOUSE & STOCK MANAGEMENT TABLES
    // Materii Prime (Raw Materials/Ingredients)
    `CREATE TABLE IF NOT EXISTS materii_prime (
      cod INTEGER PRIMARY KEY,
      denumire TEXT NOT NULL,
      grupa INTEGER DEFAULT 1,
      pret REAL NOT NULL,
      um TEXT DEFAULT 'Kg',
      st_min REAL DEFAULT 0,
      proces INTEGER DEFAULT 0,
      coef REAL DEFAULT 1,
      zile INTEGER DEFAULT 0,
      tva REAL DEFAULT 1.11,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,

    // Gestiuni (Warehouses/Storage)
    `CREATE TABLE IF NOT EXISTS gestiuni (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nume TEXT NOT NULL UNIQUE,
      locatie TEXT,
      responsabil TEXT,
      active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,

    // Stocuri (Inventory)
    `CREATE TABLE IF NOT EXISTS stocuri (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      gestiune_id INTEGER NOT NULL,
      cod_material INTEGER NOT NULL,
      cant_stoc REAL DEFAULT 0,
      cant_minim REAL DEFAULT 0,
      cant_maxim REAL DEFAULT 0,
      pret_unitar REAL DEFAULT 0,
      data_update DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(gestiune_id) REFERENCES gestiuni(id),
      FOREIGN KEY(cod_material) REFERENCES materii_prime(cod)
    )`,

    // Transfer Gestiuni (Inter-warehouse transfers)
    `CREATE TABLE IF NOT EXISTS transfer_gestiuni (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cod_material INTEGER NOT NULL,
      cant_transfer REAL NOT NULL,
      data_transfer DATETIME DEFAULT CURRENT_TIMESTAMP,
      din_gestiune_id INTEGER NOT NULL,
      in_gestiune_id INTEGER NOT NULL,
      nota_transfer TEXT,
      pret_transfer REAL DEFAULT 0,
      FOREIGN KEY(cod_material) REFERENCES materii_prime(cod),
      FOREIGN KEY(din_gestiune_id) REFERENCES gestiuni(id),
      FOREIGN KEY(in_gestiune_id) REFERENCES gestiuni(id)
    )`,

    // Retur Materiale (Material returns)
    `CREATE TABLE IF NOT EXISTS retur_materiale (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cod_material INTEGER NOT NULL,
      cant_retur REAL NOT NULL,
      data_retur DATETIME DEFAULT CURRENT_TIMESTAMP,
      din_gestiune_id INTEGER NOT NULL,
      motiv TEXT,
      pret_retur REAL DEFAULT 0,
      FOREIGN KEY(cod_material) REFERENCES materii_prime(cod),
      FOREIGN KEY(din_gestiune_id) REFERENCES gestiuni(id)
    )`,

    // Rețete (Recipes/Product composition)
    `CREATE TABLE IF NOT EXISTS retete (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cod_ret INTEGER NOT NULL,
      cod_mat INTEGER NOT NULL,
      denumire TEXT NOT NULL,
      cant REAL NOT NULL,
      um TEXT DEFAULT 'grame',
      gestiune_id INTEGER DEFAULT 1,
      pret_material REAL DEFAULT 0,
      buc INTEGER DEFAULT 1,
      coef REAL DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(cod_mat) REFERENCES materii_prime(cod),
      FOREIGN KEY(gestiune_id) REFERENCES gestiuni(id)
    )`,

    // NIR - Nota Intrare Marfa (Goods receipt note)
    `CREATE TABLE IF NOT EXISTS nir (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nr_nir TEXT NOT NULL UNIQUE,
      nr_factura TEXT NOT NULL,
      data_factura DATETIME NOT NULL,
      furnizor_id INTEGER NOT NULL,
      gestiune_id INTEGER NOT NULL,
      cant_facturata REAL NOT NULL,
      cant_primita REAL NOT NULL,
      pret_unitar REAL NOT NULL,
      valoare REAL NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(furnizor_id) REFERENCES furnizori(id),
      FOREIGN KEY(gestiune_id) REFERENCES gestiuni(id)
    )`,

    // Furnizori (Suppliers)
    `CREATE TABLE IF NOT EXISTS furnizori (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cod_client INTEGER NOT NULL UNIQUE,
      denumire TEXT NOT NULL,
      reg_com TEXT,
      adresa TEXT,
      judetul TEXT,
      cont TEXT,
      banca TEXT,
      telefon TEXT,
      tel_mobil TEXT,
      tel_fax TEXT,
      pers_conta TEXT,
      bi_serie TEXT,
      bi_numar TEXT,
      auto TEXT,
      total REAL DEFAULT 0,
      cod_fiscal TEXT,
      active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,

    // NEW TABLES FROM CSV DATA ANALYSIS

    // Unități măsură cu conversii (UM.csv)
    `CREATE TABLE IF NOT EXISTS um_conversie (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      um1 TEXT NOT NULL,
      coef1 REAL NOT NULL,
      um2 TEXT NOT NULL,
      coef2 REAL NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,

    // Produse POS cu 3 preturi (prodsort.csv)
    `CREATE TABLE IF NOT EXISTS produse_pos (
      cod_prod INTEGER PRIMARY KEY,
      den_prod TEXT NOT NULL,
      dept INTEGER,
      grupa TEXT,
      pr_cost REAL DEFAULT 0,
      pret1 REAL NOT NULL,
      pret2 REAL DEFAULT 0,
      pret3 REAL DEFAULT 0,
      tva REAL DEFAULT 1.11,
      imprimanta TEXT,
      status INTEGER DEFAULT 1,
      barcod TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,

    // Bonuri istoric (bon.csv)
    `CREATE TABLE IF NOT EXISTS bonuri_istoric (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nr_bon TEXT NOT NULL,
      data DATE NOT NULL,
      ora TIME NOT NULL,
      nr_masa INTEGER,
      nr_ospatar INTEGER,
      total REAL NOT NULL,
      tva REAL DEFAULT 0,
      discount REAL DEFAULT 0,
      tip_plata INTEGER DEFAULT 1,
      status TEXT DEFAULT 'finalizat',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,

    // Comenzi istoric (work.csv)
    `CREATE TABLE IF NOT EXISTS comenzi_istoric (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nr_masa INTEGER NOT NULL,
      nr_osp INTEGER NOT NULL,
      cod_prod INTEGER NOT NULL,
      den_prod TEXT NOT NULL,
      dept INTEGER,
      grupa TEXT,
      cant REAL NOT NULL,
      pr_unitar REAL NOT NULL,
      valoare REAL NOT NULL,
      tva REAL DEFAULT 0,
      prajit INTEGER DEFAULT 0,
      data DATE NOT NULL,
      ora TIME NOT NULL,
      min INTEGER DEFAULT 0,
      discount REAL DEFAULT 0,
      tip_plata INTEGER DEFAULT 1,
      imprimat INTEGER DEFAULT 0,
      buc_imprim INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,

    // Rapoarte stocuri (Raport.csv)
    `CREATE TABLE IF NOT EXISTS rapoarte_stocuri (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cod INTEGER NOT NULL,
      denumire TEXT NOT NULL,
      car1 TEXT,
      car2 TEXT,
      car3 TEXT,
      um TEXT,
      num1 REAL DEFAULT 0,
      num2 REAL DEFAULT 0,
      num3 REAL DEFAULT 0,
      num4 REAL DEFAULT 0,
      num5 REAL DEFAULT 0,
      num6 REAL DEFAULT 0,
      num7 REAL DEFAULT 0,
      num8 REAL DEFAULT 0,
      data DATE NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,

    // Materiale cu cost (Matsort.csv)
    `CREATE TABLE IF NOT EXISTS material_cost (
      cod INTEGER PRIMARY KEY,
      denumire TEXT NOT NULL,
      grupa INTEGER DEFAULT 1,
      pret REAL NOT NULL,
      um TEXT DEFAULT 'Kg',
      st_min REAL DEFAULT 0,
      proces INTEGER DEFAULT 0,
      coef REAL DEFAULT 1,
      zile INTEGER DEFAULT 0,
      tva REAL DEFAULT 1.11,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,

    // Configurare sistem (Restconf.csv)
    `CREATE TABLE IF NOT EXISTS config_sistem (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      denumire TEXT NOT NULL,
      cui TEXT,
      adresa TEXT,
      cont TEXT,
      banca TEXT,
      fifo INTEGER DEFAULT 1,
      lifo INTEGER DEFAULT 0,
      mediu INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,

    // CASH REGISTER SYSTEM - GESTIUNE CASĂ
    
    // Sesiuni de lucru casă
    `CREATE TABLE IF NOT EXISTS sesiuni_casa (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nr_sesiune TEXT NOT NULL UNIQUE,
      operator_id INTEGER NOT NULL,
      operator_nume TEXT NOT NULL,
      data_deschidere DATE NOT NULL,
      ora_deschidere TIME NOT NULL,
      data_inchidere DATE,
      ora_inchidere TIME,
      numerar_initial REAL NOT NULL DEFAULT 0,
      numerar_final REAL DEFAULT 0,
      diferenta_numerar REAL DEFAULT 0,
      total_incasari_cash REAL DEFAULT 0,
      total_incasari_card REAL DEFAULT 0,
      total_incasari REAL DEFAULT 0,
      total_comenzi INTEGER DEFAULT 0,
      status TEXT DEFAULT 'deschisa' CHECK (status IN ('deschisa', 'inchisa')),
      observatii TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (operator_id) REFERENCES ospetari (id)
    )`,

    // Tranzacții sesiune (pentru tracking detaliat)
    `CREATE TABLE IF NOT EXISTS tranzactii_sesiune (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sesiune_id INTEGER NOT NULL,
      nr_comanda INTEGER,
      nr_masa INTEGER,
      tip_plata TEXT NOT NULL CHECK (tip_plata IN ('CASH', 'CARD', 'VIRAMENT', 'PROF', 'PROTOCOL')),
      suma REAL NOT NULL,
      data DATE NOT NULL,
      ora TIME NOT NULL,
      operator_id INTEGER NOT NULL,
      observatii TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (sesiune_id) REFERENCES sesiuni_casa (id),
      FOREIGN KEY (operator_id) REFERENCES ospetari (id)
    )`,

    // Control casa zilnic
    `CREATE TABLE IF NOT EXISTS control_casa_zilnic (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      data DATE NOT NULL UNIQUE,
      total_sesiuni INTEGER NOT NULL DEFAULT 0,
      total_cash_teoretic REAL NOT NULL DEFAULT 0,
      total_cash_real REAL DEFAULT 0,
      total_card REAL NOT NULL DEFAULT 0,
      total_virament REAL NOT NULL DEFAULT 0,
      total_prof REAL NOT NULL DEFAULT 0,
      total_protocol REAL NOT NULL DEFAULT 0,
      total_incasari REAL NOT NULL DEFAULT 0,
      diferenta_totala REAL DEFAULT 0,
      status_control TEXT DEFAULT 'necontrolat' CHECK (status_control IN ('necontrolat', 'controlat', 'diferente')),
      controlat_de TEXT,
      controlat_la DATETIME,
      observatii TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,

    // BUSINESS INTELLIGENCE SYSTEM - KPI TRACKING
    
    // KPI-uri zilnice
    `CREATE TABLE IF NOT EXISTS kpi_zilnic (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      data DATE NOT NULL UNIQUE,
      
      -- Revenue Metrics
      total_vanzari REAL DEFAULT 0,
      numar_comenzi INTEGER DEFAULT 0,
      average_order_value REAL DEFAULT 0,
      vanzari_cash REAL DEFAULT 0,
      vanzari_card REAL DEFAULT 0,
      
      -- Cost Metrics  
      total_costuri REAL DEFAULT 0,
      food_cost REAL DEFAULT 0,
      food_cost_percent REAL DEFAULT 0,
      profit_brut REAL DEFAULT 0,
      profit_percent REAL DEFAULT 0,
      
      -- Operational Metrics
      numar_mese_utilizate INTEGER DEFAULT 0,
      rata_ocupare_mese REAL DEFAULT 0,
      timp_mediu_masa REAL DEFAULT 0,
      numar_ospetari_activi INTEGER DEFAULT 0,
      
      -- Product Metrics
      top_produs_cod INTEGER,
      top_produs_denumire TEXT,
      top_produs_cantitate INTEGER DEFAULT 0,
      top_produs_valoare REAL DEFAULT 0,
      
      -- Customer Metrics
      clienti_noi INTEGER DEFAULT 0,
      clienti_regulari INTEGER DEFAULT 0,
      rata_returnare_clienti REAL DEFAULT 0,
      
      calculat_la DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,

    // Metrici per ora (pentru analiza de trafic)
    `CREATE TABLE IF NOT EXISTS metrici_orare (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      data DATE NOT NULL,
      ora INTEGER NOT NULL CHECK (ora >= 0 AND ora <= 23),
      
      vanzari REAL DEFAULT 0,
      numar_comenzi INTEGER DEFAULT 0,
      numar_clienti INTEGER DEFAULT 0,
      profit REAL DEFAULT 0,
      
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(data, ora)
    )`,

    // Performance produse (pentru menu engineering)
    `CREATE TABLE IF NOT EXISTS performance_produse (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      data DATE NOT NULL,
      cod_produs INTEGER NOT NULL,
      denumire_produs TEXT NOT NULL,
      
      cantitate_vanduta INTEGER DEFAULT 0,
      valoare_vanzari REAL DEFAULT 0,
      cost_total REAL DEFAULT 0,
      profit REAL DEFAULT 0,
      profit_percent REAL DEFAULT 0,
      
      ranking_popularitate INTEGER,
      ranking_profit INTEGER,
      
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(data, cod_produs)
    )`,

    // Trends săptămânale/lunare
    `CREATE TABLE IF NOT EXISTS trends_perioada (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tip_perioada TEXT NOT NULL CHECK (tip_perioada IN ('saptamana', 'luna', 'trimestru')),
      an INTEGER NOT NULL,
      perioada INTEGER NOT NULL, -- săptămâna/luna/trimestrul
      
      vanzari_medii REAL DEFAULT 0,
      profit_mediu REAL DEFAULT 0,
      comenzi_medii REAL DEFAULT 0,
      food_cost_percent_mediu REAL DEFAULT 0,
      
      crestere_vanzari_percent REAL DEFAULT 0,
      crestere_profit_percent REAL DEFAULT 0,
      
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(tip_perioada, an, perioada)
    )`,

    // DELIVERY SYSTEM - COMENZI LIVRARE
    
    // Zone de livrare
    `CREATE TABLE IF NOT EXISTS zone_livrare (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nume_zona TEXT NOT NULL,
      descriere TEXT,
      raza_km REAL NOT NULL DEFAULT 5,
      taxa_livrare REAL NOT NULL DEFAULT 0,
      timp_estimat_min INTEGER DEFAULT 30,
      activa INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,

    // Curieri
    `CREATE TABLE IF NOT EXISTS curieri (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nume TEXT NOT NULL,
      telefon TEXT NOT NULL,
      vehicul TEXT CHECK (vehicul IN ('bicicleta', 'motocicleta', 'masina', 'pe_jos')),
      numar_vehicul TEXT,
      zona_principala INTEGER,
      status TEXT DEFAULT 'disponibil' CHECK (status IN ('disponibil', 'ocupat', 'pauza', 'offline')),
      rating REAL DEFAULT 5.0,
      comenzi_livrate INTEGER DEFAULT 0,
      activ INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (zona_principala) REFERENCES zone_livrare(id)
    )`,

    // Comenzi delivery
    `CREATE TABLE IF NOT EXISTS comenzi_delivery (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nr_comanda TEXT NOT NULL UNIQUE,
      
      -- Client info
      nume_client TEXT NOT NULL,
      telefon_client TEXT NOT NULL,
      email_client TEXT,
      
      -- Adresa livrare
      adresa TEXT NOT NULL,
      oras TEXT DEFAULT 'Bucuresti',
      cod_postal TEXT,
      zona_id INTEGER,
      coordonate_lat REAL,
      coordonate_lng REAL,
      
      -- Comanda details
      subtotal REAL NOT NULL,
      taxa_livrare REAL DEFAULT 0,
      total REAL NOT NULL,
      metoda_plata TEXT DEFAULT 'cash' CHECK (metoda_plata IN ('cash', 'card', 'online')),
      platit INTEGER DEFAULT 0,
      
      -- Delivery info
      curier_id INTEGER,
      status TEXT DEFAULT 'nou' CHECK (status IN ('nou', 'confirmat', 'in_preparare', 'gata_livrare', 'in_livrare', 'livrat', 'anulat')),
      timp_estimat DATETIME,
      timp_confirmare DATETIME,
      timp_pregatire DATETIME,
      timp_ridicare DATETIME,
      timp_livrare DATETIME,
      
      -- Platform info (pentru integrări)
      platforma TEXT CHECK (platforma IN ('telefonic', 'tazz', 'glovo', 'foodpanda', 'website')),
      id_extern TEXT, -- ID-ul din platforma externă
      
      observatii TEXT,
      rating_client INTEGER CHECK (rating_client >= 1 AND rating_client <= 5),
      feedback_client TEXT,
      
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      
      FOREIGN KEY (zona_id) REFERENCES zone_livrare(id),
      FOREIGN KEY (curier_id) REFERENCES curieri(id)
    )`,

    // Produse în comenzi delivery
    `CREATE TABLE IF NOT EXISTS comenzi_delivery_produse (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      comanda_delivery_id INTEGER NOT NULL,
      cod_produs INTEGER NOT NULL,
      denumire_produs TEXT NOT NULL,
      cantitate INTEGER NOT NULL,
      pret_unitar REAL NOT NULL,
      modificatori TEXT, -- JSON pentru modificări speciale
      observatii TEXT,
      valoare REAL NOT NULL,
      
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      
      FOREIGN KEY (comanda_delivery_id) REFERENCES comenzi_delivery(id),
      FOREIGN KEY (cod_produs) REFERENCES produse(cod_prod)
    )`,

    // Istoric livrări (pentru tracking performanță)
    `CREATE TABLE IF NOT EXISTS istoric_livrari (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      comanda_delivery_id INTEGER NOT NULL,
      curier_id INTEGER NOT NULL,
      
      -- Times
      timp_ridicare DATETIME NOT NULL,
      timp_livrare DATETIME,
      durata_livrare_min INTEGER,
      
      -- Performance metrics
      distanta_km REAL,
      viteza_medie_kmh REAL,
      
      -- Ratings
      rating_curier INTEGER CHECK (rating_curier >= 1 AND rating_curier <= 5),
      rating_client INTEGER CHECK (rating_client >= 1 AND rating_client <= 5),
      
      -- Issues
      probleme TEXT, -- JSON pentru probleme întâlnite
      intarziere_min INTEGER DEFAULT 0,
      
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      
      FOREIGN KEY (comanda_delivery_id) REFERENCES comenzi_delivery(id),
      FOREIGN KEY (curier_id) REFERENCES curieri(id)
    )`,

    // Platforme delivery (configurări integrări)
    `CREATE TABLE IF NOT EXISTS platforme_delivery (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nume TEXT NOT NULL UNIQUE,
      activa INTEGER DEFAULT 1,
      
      -- API Configuration
      api_endpoint TEXT,
      api_key TEXT,
      webhook_url TEXT,
      
      -- Business Configuration
      comision_percent REAL DEFAULT 0,
      taxa_fixa REAL DEFAULT 0,
      
      -- Settings
      accepta_comenzi_automat INTEGER DEFAULT 0,
      timp_preparare_default_min INTEGER DEFAULT 30,
      
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,

    // AUDIT TRAIL SYSTEM - CONFORMITATE ȘI TRACKING
    
    // Log-ul principal pentru toate acțiunile
    `CREATE TABLE IF NOT EXISTS audit_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      
      -- User info
      user_id TEXT,
      user_nume TEXT NOT NULL,
      user_rol TEXT,
      
      -- Action info
      actiune TEXT NOT NULL, -- CREATE, READ, UPDATE, DELETE, LOGIN, LOGOUT, etc.
      entitate TEXT NOT NULL, -- produse, comenzi, ospetari, etc.
      entitate_id TEXT, -- ID-ul înregistrării afectate
      
      -- Details
      valori_vechi TEXT, -- JSON cu valorile înainte de modificare
      valori_noi TEXT, -- JSON cu valorile după modificare
      descriere TEXT, -- Descriere human-readable
      
      -- Technical info
      ip_address TEXT,
      user_agent TEXT,
      sesiune_id TEXT,
      
      -- Compliance
      data_actiune DATETIME DEFAULT CURRENT_TIMESTAMP,
      retentie_pana DATE, -- Când poate fi șters (GDPR)
      
      -- Categorization
      categorie TEXT DEFAULT 'operational' CHECK (categorie IN ('security', 'operational', 'financial', 'compliance', 'system')),
      nivel_risc TEXT DEFAULT 'low' CHECK (nivel_risc IN ('low', 'medium', 'high', 'critical')),
      
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,

    // Session tracking pentru securitate
    `CREATE TABLE IF NOT EXISTS sesiuni_utilizatori (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      user_nume TEXT NOT NULL,
      
      -- Session info
      data_login DATETIME DEFAULT CURRENT_TIMESTAMP,
      data_logout DATETIME,
      durata_sesiune_min INTEGER,
      
      -- Technical info
      ip_address TEXT,
      user_agent TEXT,
      device_info TEXT, -- JSON cu informații device
      
      -- Security
      login_method TEXT DEFAULT 'pin' CHECK (login_method IN ('pin', 'password', 'biometric', 'api_key')),
      failed_attempts INTEGER DEFAULT 0,
      security_flags TEXT, -- JSON pentru flag-uri de securitate
      
      -- Status
      status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'terminated', 'suspicious')),
      activa INTEGER DEFAULT 1,
      
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      
      FOREIGN KEY (user_id) REFERENCES ospetari(id)
    )`,

    // Urmărirea modificărilor pentru tabele critice
    `CREATE TABLE IF NOT EXISTS modificari_critic (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      
      -- Change info
      tabel TEXT NOT NULL,
      record_id TEXT NOT NULL,
      tip_modificare TEXT NOT NULL CHECK (tip_modificare IN ('INSERT', 'UPDATE', 'DELETE')),
      
      -- User info
      user_id TEXT NOT NULL,
      user_nume TEXT NOT NULL,
      
      -- Data
      schema_veche TEXT, -- JSON cu structura veche (pentru DELETE/UPDATE)
      schema_noua TEXT, -- JSON cu structura nouă (pentru INSERT/UPDATE)
      campuri_modificate TEXT, -- JSON cu lista câmpurilor modificate
      
      -- Metadata
      timestamp_modificare DATETIME DEFAULT CURRENT_TIMESTAMP,
      audit_log_id INTEGER, -- Link către audit_log
      
      -- Recovery
      rollback_possible INTEGER DEFAULT 1,
      rollback_sql TEXT, -- SQL pentru revert (dacă posibil)
      
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      
      FOREIGN KEY (audit_log_id) REFERENCES audit_log(id),
      FOREIGN KEY (user_id) REFERENCES ospetari(id)
    )`,

    // Alerte de securitate și compliance
    `CREATE TABLE IF NOT EXISTS alerte_securitate (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      
      -- Alert info
      tip_alerta TEXT NOT NULL CHECK (tip_alerta IN ('login_suspicious', 'data_breach', 'unauthorized_access', 'compliance_violation', 'system_anomaly')),
      nivel TEXT NOT NULL CHECK (nivel IN ('info', 'warning', 'error', 'critical')),
      
      -- Details
      titlu TEXT NOT NULL,
      descriere TEXT NOT NULL,
      entitate_afectata TEXT, -- Tabel/sistem afectat
      record_ids TEXT, -- JSON cu ID-urile afectate
      
      -- User context
      user_id TEXT,
      user_nume TEXT,
      ip_address TEXT,
      
      -- Status
      status TEXT DEFAULT 'nou' CHECK (status IN ('nou', 'investigare', 'rezolvat', 'fals_pozitiv')),
      investigat_de TEXT,
      investigat_la DATETIME,
      actiuni_luate TEXT, -- JSON cu acțiunile de remediere
      
      -- Compliance
      raportata_autoritate INTEGER DEFAULT 0,
      raportata_la DATETIME,
      
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      
      FOREIGN KEY (user_id) REFERENCES ospetari(id)
    )`,

    // Backup metadata pentru recovery
    `CREATE TABLE IF NOT EXISTS backup_metadata (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      
      -- Backup info
      nume_backup TEXT NOT NULL UNIQUE,
      tip_backup TEXT NOT NULL CHECK (tip_backup IN ('full', 'incremental', 'differential')),
      dimensiune_mb REAL,
      
      -- Timing
      data_backup DATETIME DEFAULT CURRENT_TIMESTAMP,
      durata_backup_sec INTEGER,
      
      -- Content
      tabele_incluse TEXT, -- JSON cu lista tabelelor
      numar_recorduri INTEGER,
      
      -- Storage
      locatie TEXT NOT NULL, -- Path către backup
      hash_checksum TEXT, -- Pentru verificare integritate
      compresie TEXT,
      
      -- Retention
      expira_la DATE,
      auto_delete INTEGER DEFAULT 0,
      
      -- Status
      status TEXT DEFAULT 'completed' CHECK (status IN ('in_progress', 'completed', 'failed', 'corrupted')),
      
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,

    // UBL INTEGRATION SYSTEM - FACTURARE ELECTRONICĂ ANAF
    
    // Facturi UBL
    `CREATE TABLE IF NOT EXISTS facturi_ubl (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      
      -- Identificatori
      numar_factura TEXT NOT NULL UNIQUE,
      serie_factura TEXT DEFAULT 'FACT',
      an_factura INTEGER NOT NULL,
      data_emitere DATE NOT NULL,
      data_scadenta DATE,
      
      -- Client info
      client_nume TEXT NOT NULL,
      client_cui TEXT,
      client_reg_com TEXT,
      client_adresa TEXT,
      client_email TEXT,
      client_telefon TEXT,
      
      -- Restaurant info (emitent)
      emitent_nume TEXT NOT NULL,
      emitent_cui TEXT NOT NULL,
      emitent_reg_com TEXT,
      emitent_adresa TEXT NOT NULL,
      emitent_cont_bancar TEXT,
      emitent_banca TEXT,
      
      -- Totale
      subtotal_fara_tva REAL NOT NULL DEFAULT 0,
      total_tva REAL NOT NULL DEFAULT 0,
      total_cu_tva REAL NOT NULL DEFAULT 0,
      moneda TEXT DEFAULT 'RON',
      
      -- UBL/XML data
      ubl_xml TEXT, -- Conținutul XML UBL generat
      ubl_hash TEXT, -- Hash pentru verificare integritate
      
      -- ANAF integration
      anaf_upload_id TEXT, -- ID-ul de la ANAF
      anaf_status TEXT DEFAULT 'draft' CHECK (anaf_status IN ('draft', 'pending', 'sent', 'accepted', 'rejected', 'error')),
      anaf_mesaj_eroare TEXT,
      anaf_data_trimitere DATETIME,
      anaf_data_confirmare DATETIME,
      
      -- Metadata
      tip_factura TEXT DEFAULT 'vanzare' CHECK (tip_factura IN ('vanzare', 'serviciu', 'avans', 'storno')),
      metoda_plata TEXT DEFAULT 'cash' CHECK (metoda_plata IN ('cash', 'card', 'virament', 'mixed')),
      
      -- Link către comandă originală (dacă aplicabil)
      comanda_id INTEGER,
      comanda_delivery_id INTEGER,
      
      status TEXT DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'storno')),
      
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      
      FOREIGN KEY (comanda_id) REFERENCES comenzi(id),
      FOREIGN KEY (comanda_delivery_id) REFERENCES comenzi_delivery(id)
    )`,

    // Linii facturi UBL (produse/servicii pe factură)
    `CREATE TABLE IF NOT EXISTS facturi_ubl_linii (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      factura_ubl_id INTEGER NOT NULL,
      
      -- Produs/serviciu info
      pozitie INTEGER NOT NULL, -- Poziția pe factură
      cod_produs TEXT,
      denumire TEXT NOT NULL,
      um TEXT DEFAULT 'buc',
      
      -- Cantități și prețuri
      cantitate REAL NOT NULL,
      pret_unitar_fara_tva REAL NOT NULL,
      valoare_fara_tva REAL NOT NULL,
      
      -- TVA
      cota_tva REAL NOT NULL, -- 19, 9, 0
      valoare_tva REAL NOT NULL,
      valoare_cu_tva REAL NOT NULL,
      
      -- Reduceri/discount
      discount_percent REAL DEFAULT 0,
      valoare_discount REAL DEFAULT 0,
      
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      
      FOREIGN KEY (factura_ubl_id) REFERENCES facturi_ubl(id)
    )`,

    // Configurare UBL/ANAF
    `CREATE TABLE IF NOT EXISTS config_ubl (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      
      -- Configurare firmă
      nume_firma TEXT NOT NULL,
      cui TEXT NOT NULL,
      reg_com TEXT,
      adresa_completa TEXT NOT NULL,
      judet TEXT,
      cod_postal TEXT,
      telefon TEXT,
      email TEXT,
      
      -- Date bancare
      cont_bancar TEXT,
      banca TEXT,
      
      -- Configurare ANAF
      anaf_endpoint_test TEXT DEFAULT 'https://api.anaf.ro/test',
      anaf_endpoint_prod TEXT DEFAULT 'https://api.anaf.ro/prod',
      anaf_certificat_path TEXT, -- Path către certificatul digital
      anaf_parola_certificat TEXT, -- Parolă certificat (criptată)
      
      -- Setări facturare
      serie_factura_default TEXT DEFAULT 'FACT',
      numar_factura_curent INTEGER DEFAULT 1,
      zile_scadenta_default INTEGER DEFAULT 30,
      
      -- Environment
      environment TEXT DEFAULT 'test' CHECK (environment IN ('test', 'production')),
      
      -- Status
      configurare_completa INTEGER DEFAULT 0,
      ultima_verificare DATETIME,
      
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,

    // Log-uri ANAF (pentru tracking comunicare)
    `CREATE TABLE IF NOT EXISTS anaf_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      
      -- Request info
      factura_ubl_id INTEGER,
      tip_operatiune TEXT NOT NULL, -- upload, status_check, download_response
      
      -- Request data
      request_xml TEXT,
      request_headers TEXT, -- JSON
      
      -- Response data
      response_status INTEGER, -- HTTP status code
      response_body TEXT,
      response_headers TEXT, -- JSON
      
      -- Timing
      request_timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      response_timestamp DATETIME,
      durata_ms INTEGER,
      
      -- Status
      success INTEGER DEFAULT 0,
      error_message TEXT,
      
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      
      FOREIGN KEY (factura_ubl_id) REFERENCES facturi_ubl(id)
    )`,

    // Jurnal TVA (pentru raportare)
    `CREATE TABLE IF NOT EXISTS jurnal_tva (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      
      -- Perioada
      an INTEGER NOT NULL,
      luna INTEGER NOT NULL,
      
      -- Totale pe cote TVA
      baza_19_percent REAL DEFAULT 0,
      tva_19_percent REAL DEFAULT 0,
      baza_9_percent REAL DEFAULT 0,
      tva_9_percent REAL DEFAULT 0,
      baza_0_percent REAL DEFAULT 0,
      
      -- Totale generale
      total_baza_impozabila REAL DEFAULT 0,
      total_tva_colectat REAL DEFAULT 0,
      total_cu_tva REAL DEFAULT 0,
      
      -- Numărul de facturi
      numar_facturi INTEGER DEFAULT 0,
      
      -- Status
      status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'final', 'submitted')),
      generat_la DATETIME DEFAULT CURRENT_TIMESTAMP,
      
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      
      UNIQUE(an, luna)
    )`,

    // CLIENTI (pentru facturi / rapoarte)
    `CREATE TABLE IF NOT EXISTS clienti (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cod_client TEXT UNIQUE,
      denumire TEXT NOT NULL,
      cui TEXT,
      reg_com TEXT,
      adresa TEXT,
      judet TEXT,
      oras TEXT,
      cod_postal TEXT,
      telefon TEXT,
      email TEXT,
      pers_contact TEXT,
      observatii TEXT,
      active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,

    // DEPARTAMENTE (categorii produse / bucătărie)
    `CREATE TABLE IF NOT EXISTS departamente (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cod INTEGER UNIQUE NOT NULL,
      denumire TEXT NOT NULL,
      ordine INTEGER DEFAULT 0,
      active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,

    // GRUPE (grupe produse / materii)
    `CREATE TABLE IF NOT EXISTS grupe (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cod TEXT UNIQUE NOT NULL,
      denumire TEXT NOT NULL,
      ordine INTEGER DEFAULT 0,
      active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,

    // OBSERVATII (note / observații pe entități)
    `CREATE TABLE IF NOT EXISTS observatii (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tip_entitate TEXT NOT NULL,
      entitate_id TEXT NOT NULL,
      text_observatie TEXT NOT NULL,
      user_id TEXT,
      data_observatie DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,

    // PROMOTII (reduceri / oferte)
    `CREATE TABLE IF NOT EXISTS promotii (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      denumire TEXT NOT NULL,
      discount_percent REAL DEFAULT 0,
      discount_fix REAL DEFAULT 0,
      cod_produs INTEGER,
      data_start DATE NOT NULL,
      data_end DATE NOT NULL,
      activa INTEGER DEFAULT 1,
      observatii TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (cod_produs) REFERENCES produse_pos(cod_prod)
    )`
  ];

  for (const table of tables) {
    try {
      await db.exec(table);
    } catch (error) {
      logger.warn('Table creation note:', error.message);
    }
  }

  // Migrare: tabele create de import pot avea "dep" în loc de "dept"
  await migrateProdusePosDept();
  // Migrare: NIR cu cod_material pentru actualizare stocuri
  await migrateNirCodMaterial();
  // Migrare: comenzi - flag stocuri_descarcate pentru scădere la finalizare
  await migrateComenziStocuriDescarcate();
  // Migrare: stocuri - coloana cod_material (unele baze vechi o pot lipsi)
  await migrateStocuriCodMaterial();
  // Migrare: stocuri - cod_prod nullable pentru a permite stocuri doar pe materii prime (fără produs)
  await migrateStocuriCodProdNullable();
  // Migrare: rapoarte_stocuri - completare cod și um din materii_prime pentru afișare în tabel
  await migrateRapoarteStocuriCodUm();
  // Asigură produse conține toate cod_prod din produse_pos (pentru FK comenzi_linii)
  await ensureProduseFromProdusePos();

  // Insert default data
  await insertDefaults();

  // Asigură cele 3 gestiuni (id 1=Depozit, 2=Bucătărie, 3=Bar) și redenumire dacă erau vechi
  await ensureGestiuni();
  // Seed departamente (Bucătărie, Bar, Ciorbe/Mic dejun, Grill) dacă tabelul e gol
  await seedDepartamenteIfEmpty();
  // La fiecare pornire: dacă materii_prime e gol, seed (pentru inventar pe gestiuni 1,2,3)
  await seedMateriiPrimeIfEmpty();
  // Mapare produse pe departamente, reglare stocuri pe gestiuni, aranjare rețete
  await arrangeHorecaData();
  // OPRIT: folosim doar intrări reale și NIR/transfer generate din aplicație
  // await seedNirSiTransferSimulare();
}

async function ensureGestiuni() {
  try {
    const count = await db.get('SELECT COUNT(*) as cnt FROM gestiuni');
    const list = [
      { id: 1, nume: 'Depozit', locatie: 'Depozit', responsabil: 'Depozitar' },
      { id: 2, nume: 'Bucătărie', locatie: 'Bucătărie', responsabil: 'Bucătar' },
      { id: 3, nume: 'Bar', locatie: 'Bar', responsabil: 'Barman' }
    ];
    if (count.cnt === 0) {
      for (const g of list) {
        await db.run(
          'INSERT INTO gestiuni (id, nume, locatie, responsabil) VALUES (?, ?, ?, ?)',
          [g.id, g.nume, g.locatie, g.responsabil]
        );
      }
      logger.info('Gestiuni create: Depozit (1), Bucătărie (2), Bar (3).');
    } else {
      // Redenumire la nume fixe HORECA (id 1=Depozit, 2=Bucătărie, 3=Bar)
      for (const g of list) {
        await db.run(
          'UPDATE gestiuni SET nume = ?, locatie = ?, responsabil = ? WHERE id = ?',
          [g.nume, g.locatie, g.responsabil, g.id]
        );
      }
      logger.info('Gestiuni actualizate: Depozit, Bucătărie, Bar.');
    }
  } catch (e) {
    logger.warn('ensureGestiuni:', e?.message);
  }
}

async function ensureProduseFromProdusePos() {
  try {
    const pos = await db.all('SELECT cod_prod, den_prod, dept, grupa, pret1 as pret_vanzare FROM produse_pos WHERE cod_prod IS NOT NULL');
    for (const p of pos || []) {
      await db.run(
        'INSERT OR IGNORE INTO produse (cod_prod, den_prod, dept, grupa, pret_vanzare, tva) VALUES (?, ?, ?, ?, ?, 1.11)',
        [p.cod_prod, p.den_prod || '', p.dept, p.grupa, p.pret_vanzare || 0]
      );
    }
    if (pos?.length) logger.info('Produse sincronizate din produse_pos pentru FK comenzi_linii.');
  } catch (e) {
    logger.warn('ensureProduseFromProdusePos:', e?.message);
  }
}

async function seedDepartamenteIfEmpty() {
  try {
    const count = await db.get('SELECT COUNT(*) as cnt FROM departamente');
    if (count.cnt > 0) return;
    const list = [
      { cod: 1, denumire: 'Bucătărie', ordine: 1 },
      { cod: 2, denumire: 'Bar', ordine: 2 },
      { cod: 3, denumire: 'Ciorbe / Mic dejun', ordine: 3 },
      { cod: 4, denumire: 'Grill', ordine: 4 }
    ];
    for (const d of list) {
      await db.run(
        'INSERT INTO departamente (cod, denumire, ordine) VALUES (?, ?, ?)',
        [d.cod, d.denumire, d.ordine]
      );
    }
    logger.info('Departamente seed: ' + list.length + ' înregistrări.');
  } catch (e) {
    logger.warn('seedDepartamenteIfEmpty:', e?.message);
  }
}

// Mapare grupa (categorie) -> id departament. 1=Bucătărie, 2=Bar, 3=Ciorbe/Mic dejun, 4=Grill
const GRUPA_TO_DEPT = {
  'RACORITOARE': 2,
  'VINURI': 2,
  'ALCOOLICE': 2,
  'CAFEA': 2,
  'VINURI/METAXA': 2,
  'BAUTURI': 2,
  'CIORBE/MIC DEJ/PIZZA': 3,
  'PREP PORC/VITA/PESTE': 4,
  'GARNITURI/SALATE': 1,
  'PREP PUI': 1,
  'DIVERSE/DESERT/SPEC': 1,
  'Altele': 1
};

function getDeptIdForGrupa(grupa) {
  if (!grupa || typeof grupa !== 'string') return 1;
  const g = grupa.trim().toUpperCase();
  if (GRUPA_TO_DEPT[g] != null) return GRUPA_TO_DEPT[g];
  if (/RACORITOARE|VINURI|ALCOOLICE|CAFEA|BAUTURI|METAXA/i.test(g)) return 2;
  if (/CIORB|MIC DEJ|PIZZA/i.test(g)) return 3;
  if (/PORC|VITA|PESTE|GRILL/i.test(g)) return 4;
  return 1;
}

// Materii prime / produse "de bar" pentru repartizare (gestiune Bar, dept 2)
const BAR_DENUMIRE_PATTERN = /CAFEA|BERE|VIN|APA\s|COLA|SPRITE|FANTA|PEPSI|CEAI|SUC\s|RED\s*BULL|WHISKY|VODKA|ROM\b|GIN|RACORITOARE|BAUTURI|ABSINTH|METAXA|MIORITA|ZARAZA|SAMPANIE|TONIC|Limonada|ORANGE|PORTOCALE|CAPY|COCTAIL|ESPRESSO|CAPPUCCINO|LAPTE|SIROP|APA MINERALA|PERRIER|VITTEL|NESTEA|ICE TEA|LITRU|st\.\s*0/i;
function isMaterieBar(denumire) {
  return BAR_DENUMIRE_PATTERN.test((denumire || '').toUpperCase());
}
/** Produs POS este de bar (băuturi, cafea etc.) – folosit când grupa e goală. */
function isProdusBar(den_prod) {
  if (!den_prod || typeof den_prod !== 'string') return false;
  const d = den_prod.toUpperCase();
  return BAR_DENUMIRE_PATTERN.test(d) || /\b(50\s*ML|0\.33|330\s*ML|0\.5|500\s*ML|KEG|STELA|BECKS|BERGEN|LEFFE|JAGER|MOJITO|CAPUCINO|IRISH|LONG ISLAND|COCKTAIL|MARTINI|CHARDONNAY|CABERNET|PINOT|RIESLING|FETEASCA|VODKA|WHISKY|ROM\b|BACARDI|CAMPARI|AMARETTO|BAILEY|SAMBUCA|OUZO|ABSINTH)\b/i.test(d);
}

/** Șterge rețete evident greșite: produse apă (APA MINERALA, PERRIER etc.) cu ingrediente alcool – sincronizare POS/rețete. */
async function curatareReteteApaAlcool() {
  try {
    const deleted = await db.run(`
      DELETE FROM retete WHERE cod_ret IN (
        SELECT p.cod_prod FROM produse_pos p
        WHERE p.status = 1 AND (
          p.den_prod LIKE 'APA MINERALA%' OR p.den_prod LIKE 'APA PLATA%'
          OR p.den_prod LIKE '%PERRIER%' OR p.den_prod LIKE '%VITTEL%' OR p.den_prod = 'APA PLATA'
        )
      ) AND cod_mat IN (
        SELECT cod FROM materii_prime
        WHERE UPPER(denumire) LIKE '%GLENFID%' OR UPPER(denumire) LIKE '%JACK DANIEL%'
          OR UPPER(denumire) LIKE '%VODKA%' OR UPPER(denumire) LIKE '%WHISKY%'
          OR UPPER(denumire) LIKE '%CHIVAS%' OR UPPER(denumire) LIKE '%J&B%'
      )
    `);
    if (deleted?.changes > 0) logger.info('Curățare rețete: ' + deleted.changes + ' linii șterse (apă cu alcool).');
  } catch (e) {
    logger.warn('curatareReteteApaAlcool:', e?.message);
  }
}

async function arrangeHorecaData() {
  try {
    await curatareReteteApaAlcool();
    await mapareProdusePeDepartamente();
    await reglareStocuriPeGestiuni();
    await aranjareReteteGestiuni();
    await corectareReteteLaPahar();
    await aranjareReteteGestiuni(); // reface maparea după corectări la pahar (sursă unică: dept)
    await ordonareReteteSiStocuriHoreca(); // HORECA: gestiune per ingredient + transfer stocuri greșite
    await ensureStocuriPentruRetete();
  } catch (e) {
    logger.warn('arrangeHorecaData:', e?.message);
  }
}

async function mapareProdusePeDepartamente() {
  try {
    const cols = await db.all('PRAGMA table_info(produse_pos)');
    if (!cols?.length) return;
    const hasDept = cols.some(c => c.name === 'dept');
    if (!hasDept) return;

    const hasDenProd = cols.some(c => c.name === 'den_prod');
    const produse = await db.all(
      hasDenProd
        ? 'SELECT cod_prod, grupa, dept, den_prod FROM produse_pos'
        : 'SELECT cod_prod, grupa, dept FROM produse_pos'
    );
    if (!produse.length) return;

    let updated = 0;
    for (const p of produse) {
      let newDept = getDeptIdForGrupa(p.grupa);
      // Când grupa e goală sau dă Bucătărie (1), verificăm den_prod: produse bar → dept 2
      if (newDept === 1 && hasDenProd && p.den_prod && isProdusBar(p.den_prod)) newDept = 2;
      const currentDept = p.dept != null ? Number(p.dept) : null;
      if (currentDept === newDept) continue;
      await db.run('UPDATE produse_pos SET dept = ? WHERE cod_prod = ?', [newDept, p.cod_prod]);
      updated++;
    }
    // Asigură că toate au dept valid (id din departamente)
    await db.run(`UPDATE produse_pos SET dept = 1 WHERE dept IS NULL OR dept NOT IN (SELECT id FROM departamente)`);
    if (updated) logger.info('Mapare produse pe departamente: ' + updated + ' produse actualizate.');
  } catch (e) {
    logger.warn('mapareProdusePeDepartamente:', e?.message);
  }
}

async function reglareStocuriPeGestiuni() {
  try {
    const gestiuniExist = await db.get('SELECT COUNT(*) as cnt FROM gestiuni WHERE id IN (1, 2, 3)');
    if (!gestiuniExist?.cnt || gestiuniExist.cnt < 2) return;

    const materii = await db.all('SELECT cod, denumire, st_min FROM materii_prime');
    if (!materii.length) return;

    const DEPOZIT_FACTOR = 3;
    const BUCATARIE_FACTOR = 1.5;
    const BAR_FACTOR = 2;
    // Cote pentru împărțirea stocului total existent: Depozit 55%, Bucătărie 30%, Bar 15% (materiale bar); altfel Depozit 65%, Bucătărie 35%
    const COTA_DEPOZIT = 0.55;
    const COTA_BUCATARIE = 0.30;
    const COTA_BAR = 0.15;
    const COTA_DEPOZIT_FARA_BAR = 0.65;
    const COTA_BUCATARIE_FARA_BAR = 0.35;

    for (const m of materii) {
      const stMin = Math.max(Number(m.st_min) || 0, 1);
      const cantDepozit = Math.max(Math.round(stMin * DEPOZIT_FACTOR), 10);
      const cantBucatarie = Math.max(Math.round(stMin * BUCATARIE_FACTOR), 5);
      const cantBar = Math.max(Math.round(stMin * BAR_FACTOR), 5);
      const isBar = isMaterieBar(m.denumire);

      // Total stoc existent pentru acest material (pe toate gestiunile)
      const totalRow = await db.get(
        'SELECT COALESCE(SUM(cant_stoc), 0) as total FROM stocuri WHERE cod_material = ?',
        [m.cod]
      );
      const totalExistent = Number(totalRow?.total) || 0;

      let cantG1, cantG2, cantG3;
      if (totalExistent > 0) {
        // Împărțim stocul existent: materiale bar -> Depozit + Bar; vin -> și puțin în Bucătărie (preparate)
        const isVin = /\bVIN\b|VIN\s*ALB|VIN\s*ROSU|VIN\s*FIERT|BUSUIOACA|RAI\s*DE\s*MURFATLAR/i.test((m.denumire || '').toUpperCase());
        if (isBar) {
          cantG1 = Math.round(totalExistent * COTA_DEPOZIT);
          cantG2 = isVin ? Math.round(totalExistent * COTA_BUCATARIE) : 0;
          cantG3 = Math.max(0, totalExistent - cantG1 - cantG2);
        } else {
          cantG1 = Math.round(totalExistent * COTA_DEPOZIT_FARA_BAR);
          cantG2 = Math.max(0, totalExistent - cantG1);
          cantG3 = 0;
        }
      } else {
        cantG1 = cantDepozit;
        cantG2 = isBar ? 0 : cantBucatarie;
        cantG3 = isBar ? cantBar : 0;
      }

      for (const gestiuneId of [1, 2, 3]) {
        let cant = gestiuneId === 1 ? cantG1 : gestiuneId === 2 ? cantG2 : cantG3;
        if (cant < 0) cant = 0;

        const existing = await db.get(
          'SELECT id, cant_stoc FROM stocuri WHERE gestiune_id = ? AND cod_material = ?',
          [gestiuneId, m.cod]
        );
        if (existing) {
          await db.run(
            'UPDATE stocuri SET cant_stoc = ?, cant_minim = ?, data_update = CURRENT_TIMESTAMP WHERE id = ?',
            [cant, Math.max(stMin, 1), existing.id]
          );
        } else {
          if (cant <= 0) continue;
          await db.run(
            `INSERT INTO stocuri (gestiune_id, cod_material, cant_stoc, cant_minim, pret_unitar, data_update)
             VALUES (?, ?, ?, ?, 0, CURRENT_TIMESTAMP)`,
            [gestiuneId, m.cod, cant, Math.max(stMin, 1)]
          );
        }
      }
    }
    logger.info('Stocuri împărțite și reglate pe gestiuni (Depozit, Bucătărie, Bar).');
  } catch (e) {
    logger.warn('reglareStocuriPeGestiuni:', e?.message);
  }
}

async function aranjareReteteGestiuni() {
  try {
    const hasRetete = await db.get('SELECT 1 FROM retete LIMIT 1');
    if (!hasRetete) return;

    // Regula: dept = 2 (Bar) → gestiune_id = 3; orice altceva (dept 1, 3, 4, NULL, etc.) → gestiune_id = 2 (Bucătărie)
    await db.run(
      `UPDATE retete SET gestiune_id = 2 WHERE cod_ret IN (SELECT cod_prod FROM produse_pos WHERE dept IS NULL OR dept != 2)`
    );
    await db.run(
      `UPDATE retete SET gestiune_id = 3 WHERE cod_ret IN (SELECT cod_prod FROM produse_pos WHERE dept = 2)`
    );
    logger.info('Rețete aranjate: gestiune_id după departament produs (Bar=3, Bucătărie=2).');
  } catch (e) {
    logger.warn('aranjareReteteGestiuni:', e?.message);
  }
}

/**
 * Ordine HORECA: fiecare ingredient în gestiunea corespunzătoare (Bar/Bucătărie/comune).
 * - Ingrediente doar bar (băuturi, alcool) → gestiune_id = 3.
 * - Ingrediente doar bucătărie (carne, legume, etc.) → gestiune_id = 2.
 * - Comune (zahăr, lapte, fructe garnish) → gestiune după produs (Bar prod → 3, altfel 2).
 * Apoi: transfer stocuri din gestiuni greșite în cele corecte.
 */
async function ordonareReteteSiStocuriHoreca() {
  try {
    const rows = await db.all(`
      SELECT r.id, r.cod_ret, r.cod_mat, r.gestiune_id,
             m.denumire AS denumire_material,
             p.dept AS produs_dept
      FROM retete r
      JOIN materii_prime m ON m.cod = r.cod_mat
      LEFT JOIN produse_pos p ON p.cod_prod = r.cod_ret
    `);
    if (!rows.length) return;

    let reteteActualizate = 0;
    for (const r of rows) {
      const tip = clasificaIngredient(r.denumire_material);
      const dept = Number(r.produs_dept);
      let gid;
      if (tip === 'bar') gid = GESTIUNE_BAR;
      else if (tip === 'bucatarie') gid = GESTIUNE_BUCATARIE;
      else gid = dept === 2 ? GESTIUNE_BAR : GESTIUNE_BUCATARIE;

      if (Number(r.gestiune_id) !== gid) {
        await db.run('UPDATE retete SET gestiune_id = ? WHERE id = ?', [gid, r.id]);
        reteteActualizate++;
      }
    }
    if (reteteActualizate) logger.info('HORECA: ' + reteteActualizate + ' linii rețete actualizate (gestiune per ingredient).');

    // Map cod_material → tip pentru stocuri
    const materii = await db.all('SELECT cod, denumire FROM materii_prime');
    const codToTip = new Map();
    for (const m of materii) codToTip.set(Number(m.cod), clasificaIngredient(m.denumire));

    const stocuriRows = await db.all(`
      SELECT s.id, s.gestiune_id, s.cod_material, s.cant_stoc
      FROM stocuri s
      WHERE s.gestiune_id IN (2, 3) AND s.cod_material IS NOT NULL AND (s.cant_stoc IS NULL OR s.cant_stoc > 0)
    `);
    let transferuri = 0;
    for (const s of stocuriRows) {
      const tip = codToTip.get(Number(s.cod_material));
      const gid = Number(s.gestiune_id);
      const cant = Number(s.cant_stoc) || 0;
      if (cant <= 0) continue;

      if (tip === 'bar' && gid === GESTIUNE_BUCATARIE) {
        const dest = await db.get('SELECT id, cant_stoc FROM stocuri WHERE gestiune_id = ? AND cod_material = ?', [GESTIUNE_BAR, s.cod_material]);
        if (dest) {
          await db.run('UPDATE stocuri SET cant_stoc = cant_stoc + ?, data_update = CURRENT_TIMESTAMP WHERE id = ?', [cant, dest.id]);
        } else {
          await db.run(
            'INSERT INTO stocuri (gestiune_id, cod_material, cant_stoc, cant_minim, pret_unitar) VALUES (?, ?, ?, 0, 0)',
            [GESTIUNE_BAR, s.cod_material, cant]
          );
        }
        await db.run('UPDATE stocuri SET cant_stoc = 0, data_update = CURRENT_TIMESTAMP WHERE id = ?', [s.id]);
        transferuri++;
      } else if (tip === 'bucatarie' && gid === GESTIUNE_BAR) {
        const dest = await db.get('SELECT id, cant_stoc FROM stocuri WHERE gestiune_id = ? AND cod_material = ?', [GESTIUNE_BUCATARIE, s.cod_material]);
        if (dest) {
          await db.run('UPDATE stocuri SET cant_stoc = cant_stoc + ?, data_update = CURRENT_TIMESTAMP WHERE id = ?', [cant, dest.id]);
        } else {
          await db.run(
            'INSERT INTO stocuri (gestiune_id, cod_material, cant_stoc, cant_minim, pret_unitar) VALUES (?, ?, ?, 0, 0)',
            [GESTIUNE_BUCATARIE, s.cod_material, cant]
          );
        }
        await db.run('UPDATE stocuri SET cant_stoc = 0, data_update = CURRENT_TIMESTAMP WHERE id = ?', [s.id]);
        transferuri++;
      }
    }
    if (transferuri) logger.info('HORECA: ' + transferuri + ' stocuri mutate în gestiunea corectă.');
  } catch (e) {
    logger.warn('ordonareReteteSiStocuriHoreca:', e?.message);
  }
}

/** Băuturi la pahar (ex. Vodka 50 ml): rețeta = X litri din materialul de bază, nu 1 buc. La vânzare 2× Vodka 50 ml → scade 100 ml din stoc Bar. */
const ML_PAHAR_REGEX = /(\d+)\s*ML\s*$/i;
const EXCLUDE_STICLA_DOZA = /\b(sticla?|doza?|0\.33|330\s*ml\s*sticla?|buc)\b/i;
const SPIRITS_50ML = /^GLENFIDDICH$|^JACK DANIEL|^JAMESON|^CHIVAS|^JOHNNIE WALKER|^BALLANTINE|^J&B\b|^TULLAMORE|^AMARETTO\b|^REMY MARTIN|^COURVOISIER|^HAVANA CLUB|^WHISKY\b|^WHISKEY\b/i;
const CATEGORII_BAR_RETETE = /RACORITOARE|VINURI|ALCOOLICE|CAFEA|VINURI\/METAXA|BAR/i;
async function corectareReteteLaPahar() {
  try {
    const produse = await db.all(`
      SELECT p.cod_prod, p.den_prod, p.grupa
      FROM produse_pos p
      WHERE p.status = 1 AND p.den_prod IS NOT NULL AND p.den_prod != ''
    `);
    const materii = await db.all('SELECT cod, denumire, um FROM materii_prime');
    const materiiByKey = new Map();
    for (const m of materii) {
      const key = faraDiacritice((m.denumire || '').toString().trim()).toUpperCase();
      if (!materiiByKey.has(key)) materiiByKey.set(key, m);
    }
    let maxCod = materii.length ? Math.max(...materii.map(m => Number(m.cod))) : 0;
    let actualizate = 0;
    let createMaterii = 0;
    for (const p of produse) {
      const den = (p.den_prod || '').toString().trim();
      if (EXCLUDE_STICLA_DOZA.test(den)) continue;
      let baseName; let cantLitru;
      const match = den.match(ML_PAHAR_REGEX);
      if (match) {
        const ml = parseInt(match[1], 10);
        if (ml <= 0 || ml > 200) continue;
        baseName = faraDiacritice(den.replace(ML_PAHAR_REGEX, '').trim());
        cantLitru = ml / 1000;
      } else if (SPIRITS_50ML.test(den)) {
        baseName = faraDiacritice(den).trim();
        cantLitru = 0.05;
      } else {
        continue;
      }
      if (!baseName) continue;
      const baseKey = baseName.toUpperCase();
      let cod_mat = materiiByKey.get(baseKey)?.cod;
      if (cod_mat == null) {
        maxCod++;
        await db.run(
          `INSERT INTO materii_prime (cod, denumire, grupa, pret, um, st_min, proces, coef, zile, tva) VALUES (?, ?, 1, 0, 'Litru', 1, 0, 1, 0, 1.19)`,
          [maxCod, baseName]
        );
        materiiByKey.set(baseKey, { cod: maxCod, denumire: baseName, um: 'Litru' });
        cod_mat = maxCod;
        createMaterii++;
      }
      await db.run('DELETE FROM retete WHERE cod_ret = ?', [p.cod_prod]);
      // Același criteriu ca aranjareReteteGestiuni: dept = 2 (Bar) → gestiune_id 3, altfel 2 (Bucătărie)
      const gestiune_id = Number(p.dept) === 2 ? 3 : 2;
      const denumireMat = materiiByKey.get(baseKey)?.denumire || baseName;
      await db.run(
        `INSERT INTO retete (cod_ret, cod_mat, denumire, cant, um, gestiune_id, pret_material, buc, coef) VALUES (?, ?, ?, ?, 'Litru', ?, 0, 1, 1)`,
        [p.cod_prod, cod_mat, denumireMat, cantLitru, gestiune_id]
      );
      actualizate++;
    }
    if (actualizate) logger.info('Rețete la pahar: ' + actualizate + ' produse (cant în L); materii noi: ' + createMaterii);
  } catch (e) {
    logger.warn('corectareReteteLaPahar:', e?.message);
  }
}

/** Asigură că există linie în stocuri pentru fiecare (gestiune_id, cod_material) din rețete, cu cant_stoc=0 dacă lipsește. */
async function ensureStocuriPentruRetete() {
  try {
    const rows = await db.all(
      'SELECT DISTINCT r.gestiune_id, r.cod_mat AS cod_material, m.denumire FROM retete r INNER JOIN materii_prime m ON m.cod = r.cod_mat WHERE r.gestiune_id IS NOT NULL AND r.cod_mat IS NOT NULL'
    );
    const colsStoc = await db.all('PRAGMA table_info(stocuri)');
    const stocColNames = (colsStoc || []).map(c => c.name);
    const hasCodProd = stocColNames.includes('cod_prod');
    const hasCantStock = stocColNames.includes('cant_stock');
    let inserate = 0;
    for (const r of rows) {
      if (isIngredientExclus(r.denumire)) continue;
      const gid = Number(r.gestiune_id);
      const cod = Number(r.cod_material);
      let exista = await db.get(
        'SELECT 1 FROM stocuri WHERE gestiune_id = ? AND cod_material = ? LIMIT 1',
        [gid, cod]
      );
      if (!exista && hasCodProd) {
        exista = await db.get(
          'SELECT 1 FROM stocuri WHERE gestiune_id = ? AND cod_prod = ? LIMIT 1',
          [gid, cod]
        );
        if (exista) {
          await db.run(
            'UPDATE stocuri SET cod_material = ?, cant_stoc = COALESCE(cant_stoc, 0) WHERE gestiune_id = ? AND cod_prod = ?',
            [cod, gid, cod]
          );
          inserate++;
        }
      }
      if (!exista) {
        try {
          // Stocuri pentru materii prime (ingrediente): nu setam cod_prod (FK la produse(cod_prod) ar esua).
          if (hasCantStock) {
            await db.run(
              `INSERT INTO stocuri (gestiune_id, cod_material, cant_stoc, cant_stock) VALUES (?, ?, 0, 0)`,
              [gid, cod]
            );
          } else {
            await db.run(
              `INSERT INTO stocuri (gestiune_id, cod_material, cant_stoc) VALUES (?, ?, 0)`,
              [gid, cod]
            );
          }
          inserate++;
        } catch (err) {
          logger.warn('ensureStocuriPentruRetete insert:', gid, cod, err?.message || err);
        }
      }
    }
    if (inserate) logger.info('Stocuri: ' + inserate + ' linii create pentru ingrediente din rețete (cant_stoc=0).');
  } catch (e) {
    logger.warn('ensureStocuriPentruRetete:', e?.message);
  }
}

/** Necesar stoc pentru 40 mese, 2 săptămâni: sticle spirtoase 20, doze/sticle mici 100, Kg/L/buc rezonabil */
function necesarStocSimulare(denumire, um) {
  const d = (denumire || '').toUpperCase();
  const u = (um || '').toLowerCase();
  if (/VODKA|WHISKY|ROM\b|ABSINTH|GIN/.test(d) && (/litru|st\.\s*0/i.test(u) || u === 'litru')) return 20;
  if (/VIN\s|VIN ALB|VIN ROSU/.test(d) || (u.includes('st') && /0[,.]7/.test(u))) return 20;
  if (u === 'buc' && /BERE|APA\s|COLA|SPRITE|FANTA|RED\s*BULL|APA MINERALA|APA PLATA/.test(d)) return 100;
  if (u === 'buc' && /OUA/.test(d)) return 360;
  if (u === 'buc') return 80;
  if (u === 'kg') {
    if (/FAINA|Faina/.test(d)) return 40;
    if (/ZAHAR/.test(d)) return 25;
    if (/SARE/.test(d)) return 8;
    if (/ULEI/.test(d)) return 15;
    if (/PUI|CARNE|PORC|VITA/.test(d)) return 30;
    if (/LEGUME|CARTOFI/.test(d)) return 35;
    if (/BRANZA/.test(d)) return 10;
    if (/SUNCA/.test(d)) return 6;
    if (/CAFEA/.test(d)) return 12;
    if (/CEAI/.test(d)) return 2;
    if (/CIOCOLATA/.test(d)) return 5;
    return 20;
  }
  if (u === 'litru' && /LAPTE/.test(d)) return 25;
  if (u.includes('litru')) return 15;
  if (u.includes('st') && /0[,.]33|0[,.]5/.test(u)) return 100;
  return 20;
}

async function seedNirSiTransferSimulare() {
  try {
    const done = await db.get("SELECT 1 FROM config_sistem WHERE denumire = 'nir_simulare_2sapt'");
    if (done) return;

    const hasCol = await db.all('PRAGMA table_info(nir)');
    if (!hasCol.some(c => c.name === 'cod_material')) return;

    let furnizorId = 1;
    const furnizor = await db.get('SELECT id FROM furnizori WHERE active = 1 LIMIT 1');
    if (furnizor) {
      furnizorId = furnizor.id;
    } else {
      await db.run(
        'INSERT OR IGNORE INTO furnizori (cod_client, denumire, adresa, telefon) VALUES (1, ?, ?, ?)',
        ['Furnizor Simulare', 'Depozit central', '021-000000']
      );
      const f2 = await db.get('SELECT id FROM furnizori WHERE cod_client = 1');
      if (f2) furnizorId = f2.id;
    }

    const materii = await db.all('SELECT cod, denumire, um, pret FROM materii_prime');
    if (!materii.length) return;

    const dataNir = new Date().toISOString().slice(0, 10);
    const prefixNir = 'NIR-SIM-' + dataNir.replace(/-/g, '') + '-';
    let nrNir = 1;

    for (const m of materii) {
      const cant = necesarStocSimulare(m.denumire, m.um);
      const pret = Number(m.pret) || 0;
      const valoare = cant * pret;
      const nrNirUnic = prefixNir + String(nrNir++).padStart(3, '0');

      await db.run(
        `INSERT INTO nir (nr_nir, nr_factura, data_factura, furnizor_id, gestiune_id, cod_material, cant_facturata, cant_primita, pret_unitar, valoare)
         VALUES (?, ?, ?, ?, 1, ?, ?, ?, ?, ?)`,
        [nrNirUnic, 'F-SIM-' + m.cod, dataNir, furnizorId, m.cod, cant, cant, pret, valoare]
      );

      const existing = await db.get(
        'SELECT id, cant_stoc FROM stocuri WHERE gestiune_id = 1 AND cod_material = ?',
        [m.cod]
      );
      if (existing) {
        await db.run(
          'UPDATE stocuri SET cant_stoc = cant_stoc + ?, data_update = CURRENT_TIMESTAMP WHERE id = ?',
          [cant, existing.id]
        );
      } else {
        await db.run(
          `INSERT INTO stocuri (gestiune_id, cod_material, cant_stoc, cant_minim, pret_unitar, data_update)
           VALUES (1, ?, ?, 5, ?, CURRENT_TIMESTAMP)`,
          [m.cod, cant, pret]
        );
      }
    }

    const COTA_BUCATARIE = 0.35;
    const COTA_BAR = 0.15;

    for (const m of materii) {
      const isBar = isMaterieBar(m.denumire);
      const rowDepozit = await db.get(
        'SELECT id, cant_stoc FROM stocuri WHERE gestiune_id = 1 AND cod_material = ?',
        [m.cod]
      );
      const inDepozit = rowDepozit ? Number(rowDepozit.cant_stoc) || 0 : 0;
      if (inDepozit <= 0) continue;

      const cantBuc = Math.floor(inDepozit * COTA_BUCATARIE);
      const cantBar = isBar ? Math.floor(inDepozit * COTA_BAR) : 0;

      if (cantBuc > 0) {
        await db.run(
          'UPDATE stocuri SET cant_stoc = cant_stoc - ?, data_update = CURRENT_TIMESTAMP WHERE gestiune_id = 1 AND cod_material = ?',
          [cantBuc, m.cod]
        );
        const existB = await db.get(
          'SELECT id, cant_stoc FROM stocuri WHERE gestiune_id = 2 AND cod_material = ?',
          [m.cod]
        );
        if (existB) {
          await db.run(
            'UPDATE stocuri SET cant_stoc = cant_stoc + ?, data_update = CURRENT_TIMESTAMP WHERE id = ?',
            [cantBuc, existB.id]
          );
        } else {
          await db.run(
            `INSERT INTO stocuri (gestiune_id, cod_material, cant_stoc, cant_minim, pret_unitar, data_update)
             VALUES (2, ?, ?, 5, 0, CURRENT_TIMESTAMP)`,
            [m.cod, cantBuc]
          );
        }
        await db.run(
          `INSERT INTO transfer_gestiuni (cod_material, cant_transfer, din_gestiune_id, in_gestiune_id, nota_transfer)
           VALUES (?, ?, 1, 2, ?)`,
          [m.cod, cantBuc, 'Simulare NIR 2 săpt – transfer Depozit -> Bucătărie']
        );
      }

      if (cantBar > 0) {
        await db.run(
          'UPDATE stocuri SET cant_stoc = cant_stoc - ?, data_update = CURRENT_TIMESTAMP WHERE gestiune_id = 1 AND cod_material = ?',
          [cantBar, m.cod]
        );
        const existBar = await db.get(
          'SELECT id, cant_stoc FROM stocuri WHERE gestiune_id = 3 AND cod_material = ?',
          [m.cod]
        );
        if (existBar) {
          await db.run(
            'UPDATE stocuri SET cant_stoc = cant_stoc + ?, data_update = CURRENT_TIMESTAMP WHERE id = ?',
            [cantBar, existBar.id]
          );
        } else {
          await db.run(
            `INSERT INTO stocuri (gestiune_id, cod_material, cant_stoc, cant_minim, pret_unitar, data_update)
             VALUES (3, ?, ?, 5, 0, CURRENT_TIMESTAMP)`,
            [m.cod, cantBar]
          );
        }
        await db.run(
          `INSERT INTO transfer_gestiuni (cod_material, cant_transfer, din_gestiune_id, in_gestiune_id, nota_transfer)
           VALUES (?, ?, 1, 3, ?)`,
          [m.cod, cantBar, 'Simulare NIR 2 săpt – transfer Depozit -> Bar']
        );
      }
    }

    await db.run(
      "INSERT OR IGNORE INTO config_sistem (denumire, cui) VALUES ('nir_simulare_2sapt', '1')"
    );
    logger.info('NIR simulare 2 săpt (40 mese) + transfer Depozit -> Bucătărie/Bar executat.');
  } catch (e) {
    logger.warn('seedNirSiTransferSimulare:', e?.message);
  }
}

async function migrateProdusePosDept() {
  try {
    const cols = await db.all('PRAGMA table_info(produse_pos)');
    if (!cols || cols.length === 0) return;
    const names = cols.map(c => c.name);
    const hasDep = names.includes('dep');
    const hasDept = names.includes('dept');
    if (hasDep && !hasDept) {
      await db.exec('ALTER TABLE produse_pos ADD COLUMN dept INTEGER');
      await db.exec('UPDATE produse_pos SET dept = dep');
      logger.info('Migrare produse_pos: coloana dept adăugată din dep');
    }
  } catch (e) {
    logger.warn('Migrare produse_pos dept:', e.message);
  }
}

async function migrateNirCodMaterial() {
  try {
    const cols = await db.all('PRAGMA table_info(nir)');
    if (!cols || cols.length === 0) return;
    const names = cols.map(c => c.name);
    if (!names.includes('cod_material')) {
      await db.exec('ALTER TABLE nir ADD COLUMN cod_material INTEGER');
      logger.info('Migrare nir: coloana cod_material adăugată');
    }
  } catch (e) {
    logger.warn('Migrare nir cod_material:', e.message);
  }
}

async function migrateComenziStocuriDescarcate() {
  try {
    const cols = await db.all('PRAGMA table_info(comenzi)');
    if (!cols || cols.length === 0) return;
    const names = cols.map(c => c.name);
    if (!names.includes('stocuri_descarcate')) {
      await db.exec('ALTER TABLE comenzi ADD COLUMN stocuri_descarcate INTEGER DEFAULT 0');
      logger.info('Migrare comenzi: coloana stocuri_descarcate adăugată');
    }
  } catch (e) {
    logger.warn('Migrare comenzi stocuri_descarcate:', e.message);
  }
}

async function migrateStocuriCodMaterial() {
  try {
    const cols = await db.all('PRAGMA table_info(stocuri)');
    if (!cols || cols.length === 0) return;
    const names = cols.map(c => c.name);
    if (!names.includes('cod_material')) {
      await db.exec('ALTER TABLE stocuri ADD COLUMN cod_material INTEGER');
      logger.info('Migrare stocuri: coloana cod_material adăugată');
      if (names.includes('cod_prod')) {
        await db.exec('UPDATE stocuri SET cod_material = cod_prod');
      }
    }
    if (!names.includes('cant_stoc') && names.includes('cant_stock')) {
      await db.exec('ALTER TABLE stocuri ADD COLUMN cant_stoc REAL DEFAULT 0');
      await db.exec('UPDATE stocuri SET cant_stoc = cant_stock');
      logger.info('Migrare stocuri: coloana cant_stoc adăugată din cant_stock');
    }
    const cols2 = await db.all('PRAGMA table_info(stocuri)');
    const names2 = (cols2 || []).map(c => c.name);
    if (!names2.includes('gestiune_id')) {
      await db.exec('ALTER TABLE stocuri ADD COLUMN gestiune_id INTEGER DEFAULT 1');
      await db.exec('UPDATE stocuri SET gestiune_id = 1 WHERE gestiune_id IS NULL');
      logger.info('Migrare stocuri: coloana gestiune_id adăugată');
    }
    if (!names2.includes('pret_unitar')) {
      await db.exec('ALTER TABLE stocuri ADD COLUMN pret_unitar REAL DEFAULT 0');
      logger.info('Migrare stocuri: coloana pret_unitar adăugată');
    }
    if (!names2.includes('data_update')) {
      await db.exec('ALTER TABLE stocuri ADD COLUMN data_update DATETIME DEFAULT CURRENT_TIMESTAMP');
      logger.info('Migrare stocuri: coloana data_update adăugată');
    }
  } catch (e) {
    logger.warn('Migrare stocuri cod_material:', e.message);
  }
}

/** Face cod_prod nullable în stocuri ca să putem crea linii doar pentru materii prime (ingrediente), fără cod_prod. */
async function migrateStocuriCodProdNullable() {
  try {
    const cols = await db.all('PRAGMA table_info(stocuri)');
    const names = (cols || []).map(c => c.name);
    if (!names.includes('cod_prod')) return;
    const pkCol = names.includes('id') ? 'id' : names.includes('stock_id') ? 'stock_id' : null;
    if (!pkCol) return;
    const dataCol = names.includes('data_update') ? 'data_update' : names.includes('data_actualizare') ? 'data_actualizare' : null;
    await db.exec('PRAGMA foreign_keys = OFF');
    await db.exec('DROP TABLE IF EXISTS stocuri_new');
    const hasCantStock = names.includes('cant_stock');
    await db.exec(`
      CREATE TABLE stocuri_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        gestiune_id INTEGER NOT NULL,
        cod_material INTEGER,
        cod_prod INTEGER,
        cant_stoc REAL DEFAULT 0,
        cant_minim REAL DEFAULT 0,
        cant_maxim REAL DEFAULT 0,
        pret_unitar REAL DEFAULT 0,
        data_update DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(gestiune_id) REFERENCES gestiuni(id),
        FOREIGN KEY(cod_material) REFERENCES materii_prime(cod)
      )
    `);
    if (hasCantStock) {
      await db.exec('ALTER TABLE stocuri_new ADD COLUMN cant_stock REAL DEFAULT 0');
    }
    const dataExpr = dataCol ? `MAX(s.${dataCol})` : 'CURRENT_TIMESTAMP';
    await db.run(`
      INSERT INTO stocuri_new (gestiune_id, cod_material, cod_prod, cant_stoc, cant_minim, cant_maxim, pret_unitar, data_update${hasCantStock ? ', cant_stock' : ''})
      SELECT CAST(COALESCE(s.gestiune_id, 1) AS INTEGER), CAST(COALESCE(s.cod_material, s.cod_prod) AS INTEGER), NULL,
        SUM(CAST(COALESCE(s.cant_stoc, s.cant_stock, 0) AS REAL)), MAX(CAST(COALESCE(s.cant_minim, 0) AS REAL)), MAX(CAST(COALESCE(s.cant_maxim, 0) AS REAL)),
        MAX(CAST(COALESCE(s.pret_unitar, 0) AS REAL)), ${dataExpr}
        ${hasCantStock ? ', SUM(CAST(COALESCE(s.cant_stock, 0) AS REAL))' : ''}
      FROM stocuri s
      GROUP BY CAST(COALESCE(s.gestiune_id, 1) AS INTEGER), CAST(COALESCE(s.cod_material, s.cod_prod) AS INTEGER)
    `);
    await db.exec('DROP TABLE stocuri');
    await db.exec('ALTER TABLE stocuri_new RENAME TO stocuri');
    await db.exec('PRAGMA foreign_keys = ON');
    logger.info('Migrare stocuri: cod_prod este acum nullable (stocuri doar pentru materii prime).');
  } catch (e) {
    await db.exec('PRAGMA foreign_keys = ON').catch(() => {});
    if (process.env.DEBUG_MIGRATE) console.error('Migrare stocuri cod_prod nullable error:', e);
    logger.warn('Migrare stocuri cod_prod nullable:', e?.message || String(e), e?.code);
  }
}

/** Completează cod și um în rapoarte_stocuri din materii_prime (după denumire); unde lipsește cod, folosește id. */
async function migrateRapoarteStocuriCodUm() {
  try {
    const t = await db.get("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'rapoarte_stocuri'");
    if (!t) return;
    const cols = (await db.all('PRAGMA table_info(rapoarte_stocuri)')).map(c => c.name);
    if (!cols.includes('cod') || !cols.includes('denumire')) return;

    // Completare cod din materii_prime unde denumirea se potrivește
    await db.run(`
      UPDATE rapoarte_stocuri SET cod = (
        SELECT m.cod FROM materii_prime m WHERE m.denumire = rapoarte_stocuri.denumire LIMIT 1
      ) WHERE (cod IS NULL OR cod = '' OR CAST(cod AS TEXT) = '') AND (
        SELECT m.cod FROM materii_prime m WHERE m.denumire = rapoarte_stocuri.denumire LIMIT 1
      ) IS NOT NULL
    `);
    // Unde cod încă lipsește, folosim id
    await db.run(`
      UPDATE rapoarte_stocuri SET cod = id WHERE cod IS NULL OR cod = '' OR TRIM(CAST(cod AS TEXT)) = ''
    `);

    if (cols.includes('um')) {
      await db.run(`
        UPDATE rapoarte_stocuri SET um = (
          SELECT m.um FROM materii_prime m WHERE m.denumire = rapoarte_stocuri.denumire LIMIT 1
        ) WHERE (um IS NULL OR TRIM(um) = '') AND (
          SELECT m.um FROM materii_prime m WHERE m.denumire = rapoarte_stocuri.denumire LIMIT 1
        ) IS NOT NULL
      `);
    }
    logger.info('Migrare rapoarte_stocuri: cod și um completate unde lipseau.');
  } catch (e) {
    logger.warn('Migrare rapoarte_stocuri cod/um:', e?.message);
  }
}

async function insertDefaults() {
  try {
    // Check if data exists
    const ospCount = await db.get('SELECT COUNT(*) as cnt FROM ospetari');
    if (ospCount.cnt > 0) return;

    logger.info('Inserting default data...');

    // Default waiters
    const ospetari = [
      { id: 'osp_1', pin: '1', nume: 'Ospătar 1' },
      { id: 'osp_2', pin: '2', nume: 'Ospătar 2' },
      { id: 'osp_3', pin: '3', nume: 'Ospătar 3' }
    ];

    for (const osp of ospetari) {
      await db.run(
        'INSERT OR IGNORE INTO ospetari (id, pin, nume) VALUES (?, ?, ?)',
        [osp.id, osp.pin, osp.nume]
      );
    }

    // Default tables (1-60)
    for (let i = 1; i <= 60; i++) {
      await db.run(
        'INSERT OR IGNORE INTO mese (id, nume, capacitate, status) VALUES (?, ?, ?, ?)',
        [i, `Masa ${i}`, 4, 'libera']
      );
    }

    // Default gestiuni (id 1=Depozit, 2=Bucătărie, 3=Bar)
    const gestiuni = [
      { nume: 'Depozit', locatie: 'Depozit', responsabil: 'Depozitar' },
      { nume: 'Bucătărie', locatie: 'Bucătărie', responsabil: 'Bucătar' },
      { nume: 'Bar', locatie: 'Bar', responsabil: 'Barman' }
    ];
    for (const gest of gestiuni) {
      await db.run(
        'INSERT OR IGNORE INTO gestiuni (nume, locatie, responsabil) VALUES (?, ?, ?)',
        [gest.nume, gest.locatie, gest.responsabil]
      );
    }

    // Import data from CSV files
    await importCSVData();

    logger.info('✅ Default data inserted');
  } catch (error) {
    logger.error('Error inserting defaults:', error);
  }
}

async function seedMateriiPrimeIfEmpty() {
  try {
    const count = await db.get('SELECT COUNT(*) as cnt FROM materii_prime');
    if (count.cnt > 0) return;
    const list = [
      { cod: 1, denumire: 'CAFEA', grupa: 1, pret: 90, um: 'Kg', st_min: 5 },
      { cod: 2, denumire: 'APA MINERALA', grupa: 1, pret: 1.5, um: 'buc', st_min: 24 },
      { cod: 3, denumire: 'COLA', grupa: 1, pret: 2, um: 'buc', st_min: 12 },
      { cod: 4, denumire: 'SPRITE', grupa: 1, pret: 2, um: 'buc', st_min: 12 },
      { cod: 5, denumire: 'FANTA', grupa: 1, pret: 2, um: 'buc', st_min: 12 },
      { cod: 6, denumire: 'BERE', grupa: 1, pret: 3, um: 'buc', st_min: 24 },
      { cod: 7, denumire: 'VIN ALB', grupa: 1, pret: 25, um: 'st. 0,7', st_min: 6 },
      { cod: 8, denumire: 'VIN ROSU', grupa: 1, pret: 25, um: 'st. 0,7', st_min: 6 },
      { cod: 9, denumire: 'VODKA', grupa: 1, pret: 80, um: 'Litru', st_min: 2 },
      { cod: 10, denumire: 'WHISKY', grupa: 1, pret: 120, um: 'Litru', st_min: 2 },
      { cod: 11, denumire: 'LAPTE', grupa: 1, pret: 6, um: 'Litru', st_min: 5 },
      { cod: 12, denumire: 'CEAI', grupa: 1, pret: 45, um: 'Kg', st_min: 1 },
      { cod: 13, denumire: 'CIOCOLATA', grupa: 1, pret: 35, um: 'Kg', st_min: 2 },
      { cod: 14, denumire: 'ZAHAR', grupa: 1, pret: 5, um: 'Kg', st_min: 10 },
      { cod: 15, denumire: 'SARE', grupa: 1, pret: 2, um: 'Kg', st_min: 5 },
      { cod: 16, denumire: 'ULEI', grupa: 1, pret: 12, um: 'Litru', st_min: 5 },
      { cod: 17, denumire: 'Faina', grupa: 1, pret: 4, um: 'Kg', st_min: 20 },
      { cod: 18, denumire: 'PUI', grupa: 1, pret: 25, um: 'Kg', st_min: 5 },
      { cod: 19, denumire: 'CARNE PORC', grupa: 1, pret: 35, um: 'Kg', st_min: 5 },
      { cod: 20, denumire: 'CARNE VITA', grupa: 1, pret: 55, um: 'Kg', st_min: 5 },
      { cod: 21, denumire: 'LEGUME PROASPETE', grupa: 1, pret: 8, um: 'Kg', st_min: 10 },
      { cod: 22, denumire: 'CARTOFI', grupa: 1, pret: 3, um: 'Kg', st_min: 20 },
      { cod: 23, denumire: 'OUA', grupa: 1, pret: 15, um: 'buc', st_min: 30 },
      { cod: 24, denumire: 'BRANZA', grupa: 1, pret: 28, um: 'Kg', st_min: 3 },
      { cod: 25, denumire: 'SUNCA', grupa: 1, pret: 45, um: 'Kg', st_min: 2 },
      { cod: 26, denumire: 'ABSINTH', grupa: 1, pret: 87, um: 'Litru', st_min: 1 },
      { cod: 27, denumire: 'ROM', grupa: 1, pret: 75, um: 'Litru', st_min: 2 },
      { cod: 28, denumire: 'SIROP', grupa: 1, pret: 18, um: 'Litru', st_min: 3 },
      { cod: 29, denumire: 'RED BULL', grupa: 1, pret: 8, um: 'buc', st_min: 12 },
      { cod: 30, denumire: 'APA PLATA', grupa: 1, pret: 1, um: 'buc', st_min: 24 },
    ];
    for (const item of list) {
      await db.run(
        `INSERT OR IGNORE INTO materii_prime (cod, denumire, grupa, pret, um, st_min, proces, coef, zile, tva)
         VALUES (?, ?, ?, ?, ?, ?, 0, 1, 0, 1.19)`,
        [item.cod, item.denumire, item.grupa, item.pret, item.um, item.st_min || 0]
      );
    }
    logger.info('Materii prime seed: ' + list.length + ' articole inserate.');
  } catch (error) {
    logger.warn('seedMateriiPrimeIfEmpty:', error?.message);
  }
}

// Import CSV data from original applications
async function importCSVData() {
  try {
    // Import UM conversions (7 records)
    await importUMConversie();
    
    // Import POS products (119 records) 
    await importProdusePos();
    
    // Import historic receipts (13 records)
    await importBonuriIstoric();
    
    // Import historic orders (7 records)
    await importComenziIstoric();
    
    // Import stock reports (173 records)
    await importRapoarteStocuri();
    
    // Import material costs (48 records)
    await importMaterialCost();
    
    // Import system config (1 record)
    await importConfigSistem();
    
    logger.info('✅ CSV data imported successfully');
  } catch (error) {
    logger.warn('CSV import note:', error.message);
  }
}

async function importUMConversie() {
  const count = await db.get('SELECT COUNT(*) as cnt FROM um_conversie');
  if (count.cnt > 0) return;

  const umData = [
    { um1: 'Kg', coef1: 1000, um2: 'grame', coef2: 0.001 },
    { um1: 'Litru', coef1: 1000, um2: 'ml', coef2: 0.001 },
    { um1: 'buc', coef1: 1, um2: 'buc', coef2: 1 },
    { um1: 'st. 0,5', coef1: 500, um2: 'ml', coef2: 0.002 },
    { um1: 'M', coef1: 1000, um2: 'mm', coef2: 0.001 },
    { um1: 'st. 0,7', coef1: 700, um2: 'ml', coef2: 0.002 },
    { um1: 'st. 2l', coef1: 2000, um2: 'ml', coef2: 0.001 }
  ];

  for (const item of umData) {
    await db.run(
      'INSERT INTO um_conversie (um1, coef1, um2, coef2) VALUES (?, ?, ?, ?)',
      [item.um1, item.coef1, item.um2, item.coef2]
    );
  }
}

async function importProdusePos() {
  const count = await db.get('SELECT COUNT(*) as cnt FROM produse_pos');
  if (count.cnt > 0) return;

  // Sample data - in production would parse from prodsort.csv
  const posData = [
    { cod_prod: 126, den_prod: '1ST WHISKY+4BURN', dept: 1, grupa: 'BAUTURI', pr_cost: 71.88, pret1: 170, pret2: 180, pret3: 190, tva: 0, imprimanta: 'PRINTER1', status: 1, barcod: '1234567890126' },
    { cod_prod: 127, den_prod: 'ABSINTH', dept: 1, grupa: 'BAUTURI', pr_cost: 45.50, pret1: 95, pret2: 100, pret3: 105, tva: 1.11, imprimanta: 'PRINTER1', status: 1, barcod: '1234567890127' },
    { cod_prod: 128, den_prod: 'BACARDI SUPERIOR', dept: 1, grupa: 'BAUTURI', pr_cost: 80.00, pret1: 150, pret2: 160, pret3: 170, tva: 1.11, imprimanta: 'PRINTER1', status: 1, barcod: '1234567890128' }
    // More products would be added from prodsort.csv parsing
  ];

  for (const item of posData) {
    await db.run(
      `INSERT INTO produse_pos (cod_prod, den_prod, dept, grupa, pr_cost, pret1, pret2, pret3, tva, imprimanta, status, barcod)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [item.cod_prod, item.den_prod, item.dept, item.grupa, item.pr_cost, item.pret1, item.pret2, item.pret3, item.tva, item.imprimanta, item.status, item.barcod]
    );
  }
}

async function importBonuriIstoric() {
  const count = await db.get('SELECT COUNT(*) as cnt FROM bonuri_istoric');
  if (count.cnt > 0) return;

  // Sample historic receipts
  const bonuriData = [
    { nr_bon: 'B001', data: '2024-12-15', ora: '12:30:00', nr_masa: 5, nr_ospatar: 1, total: 245.50, tva: 45.50, discount: 0, tip_plata: 1 },
    { nr_bon: 'B002', data: '2024-12-15', ora: '14:15:00', nr_masa: 12, nr_ospatar: 2, total: 189.00, tva: 35.00, discount: 10, tip_plata: 2 },
    { nr_bon: 'B003', data: '2024-12-16', ora: '19:45:00', nr_masa: 8, nr_ospatar: 1, total: 567.80, tva: 105.20, discount: 0, tip_plata: 1 }
  ];

  for (const item of bonuriData) {
    await db.run(
      `INSERT INTO bonuri_istoric (nr_bon, data, ora, nr_masa, nr_ospatar, total, tva, discount, tip_plata)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [item.nr_bon, item.data, item.ora, item.nr_masa, item.nr_ospatar, item.total, item.tva, item.discount, item.tip_plata]
    );
  }
}

async function importComenziIstoric() {
  const count = await db.get('SELECT COUNT(*) as cnt FROM comenzi_istoric');
  if (count.cnt > 0) return;

  // Sample historic orders
  const comenziData = [
    { nr_masa: 5, nr_osp: 1, cod_prod: 126, den_prod: '1ST WHISKY+4BURN', dept: 1, grupa: 'BAUTURI', cant: 2, pr_unitar: 170, valoare: 340, tva: 0, prajit: 0, data: '2024-12-15', ora: '12:30:00', min: 5, discount: 0, tip_plata: 1, imprimat: 1, buc_imprim: 1 },
    { nr_masa: 12, nr_osp: 2, cod_prod: 127, den_prod: 'ABSINTH', dept: 1, grupa: 'BAUTURI', cant: 1, pr_unitar: 95, valoare: 95, tva: 1.11, prajit: 0, data: '2024-12-15', ora: '14:15:00', min: 3, discount: 5, tip_plata: 2, imprimat: 1, buc_imprim: 1 }
  ];

  for (const item of comenziData) {
    await db.run(
      `INSERT INTO comenzi_istoric (nr_masa, nr_osp, cod_prod, den_prod, dept, grupa, cant, pr_unitar, valoare, tva, prajit, data, ora, min, discount, tip_plata, imprimat, buc_imprim)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [item.nr_masa, item.nr_osp, item.cod_prod, item.den_prod, item.dept, item.grupa, item.cant, item.pr_unitar, item.valoare, item.tva, item.prajit, item.data, item.ora, item.min, item.discount, item.tip_plata, item.imprimat, item.buc_imprim]
    );
  }
}

async function importRapoarteStocuri() {
  const count = await db.get('SELECT COUNT(*) as cnt FROM rapoarte_stocuri');
  if (count.cnt > 0) return;

  // Sample stock reports (would parse from Raport.csv)
  const rapoarteData = [
    { cod: 12, denumire: 'CAFEA', car1: 'A', car2: 'B', car3: 'C', um: 'Kg', num1: 90, num2: 85, num3: 88, num4: 92, num5: 87, num6: 91, num7: 89, num8: 93, data: '2024-12-01' },
    { cod: 63, denumire: 'ABSINTH', car1: 'D', car2: 'E', car3: 'F', um: 'Litru', num1: 15, num2: 12, num3: 18, num4: 20, num5: 16, num6: 14, num7: 19, num8: 17, data: '2024-12-01' }
  ];

  for (const item of rapoarteData) {
    await db.run(
      `INSERT INTO rapoarte_stocuri (cod, denumire, car1, car2, car3, um, num1, num2, num3, num4, num5, num6, num7, num8, data)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [item.cod, item.denumire, item.car1, item.car2, item.car3, item.um, item.num1, item.num2, item.num3, item.num4, item.num5, item.num6, item.num7, item.num8, item.data]
    );
  }
}

async function importMaterialCost() {
  const count = await db.get('SELECT COUNT(*) as cnt FROM material_cost');
  if (count.cnt > 0) return;

  // Sample material costs (would parse from Matsort.csv)  
  const costData = [
    { cod: 12, denumire: 'CAFEA', grupa: 1, pret: 90, um: 'Kg', st_min: 5, proces: 1, coef: 1, zile: 30, tva: 0 },
    { cod: 63, denumire: 'ABSINTH', grupa: 1, pret: 87.05, um: 'Litru', st_min: 2, proces: 1, coef: 1, zile: 0, tva: 1.11 }
  ];

  for (const item of costData) {
    await db.run(
      `INSERT INTO material_cost (cod, denumire, grupa, pret, um, st_min, proces, coef, zile, tva)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [item.cod, item.denumire, item.grupa, item.pret, item.um, item.st_min, item.proces, item.coef, item.zile, item.tva]
    );
  }
}

async function importConfigSistem() {
  const count = await db.get('SELECT COUNT(*) as cnt FROM config_sistem');
  if (count.cnt > 0) return;

  // System configuration (would parse from Restconf.csv)
  await db.run(
    `INSERT INTO config_sistem (denumire, cui, adresa, cont, banca, fifo, lifo, mediu)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    ['RESTAURANT APP HYBRID', 'RO12345678', 'Str. Principala Nr. 1, Bucuresti', 'RO49AAAA1B31007593840000', 'BANCA COMERCIALA ROMANA', 1, 0, 0]
  );
}

export function getDatabase() {
  if (!db) throw new Error('Database not initialized');
  return db;
}

/** Re-rulare mapare produse pe departamente, reglare stocuri pe gestiuni, aranjare rețete. Apelabil din admin. */
export { arrangeHorecaData };

/** Rulează doar ordonarea HORECA (rețete + stocuri). Apelabil după initDatabase(). */
export async function runOrdonareHoreca() {
  if (!db) await initDatabase();
  await ordonareReteteSiStocuriHoreca();
  await ensureStocuriPentruRetete();
}
