/**
 * Migration 005: Logistics - Alergeni, Sub-rețete, Fișe tehnice, HACCP, Trasabilitate
 */
import { getDatabase } from '../init-db.js';
import { logger } from '../../utils/logger.js';

export async function up() {
  const db = getDatabase();
  try {
    // Alergeni per ingredient (materie primă)
    await db.exec(`
      CREATE TABLE IF NOT EXISTS ingrediente_alergeni (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        cod_material INTEGER NOT NULL,
        cod_alergen TEXT NOT NULL,
        confirmat INTEGER DEFAULT 1,
        nota TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(cod_material) REFERENCES materii_prime(cod),
        UNIQUE(cod_material, cod_alergen)
      )
    `);

    // Aditivi per ingredient
    await db.exec(`
      CREATE TABLE IF NOT EXISTS ingrediente_aditivi (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        cod_material INTEGER NOT NULL,
        cod_aditiv TEXT NOT NULL,
        denumire_aditiv TEXT NOT NULL,
        cantitate TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(cod_material) REFERENCES materii_prime(cod),
        UNIQUE(cod_material, cod_aditiv)
      )
    `);

    // Sub-rețete (semi-preparate)
    await db.exec(`
      CREATE TABLE IF NOT EXISTS sub_retete (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        cod_sub_ret INTEGER NOT NULL UNIQUE,
        denumire TEXT NOT NULL,
        um TEXT DEFAULT 'portie',
        cantitate_rezultata REAL DEFAULT 1,
        gestiune_id INTEGER DEFAULT 2,
        nota TEXT,
        activ INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(gestiune_id) REFERENCES gestiuni(id)
      )
    `);

    // Ingrediente sub-rețetă
    await db.exec(`
      CREATE TABLE IF NOT EXISTS sub_retete_ingrediente (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        cod_sub_ret INTEGER NOT NULL,
        cod_mat INTEGER NOT NULL,
        denumire TEXT NOT NULL,
        cant REAL NOT NULL,
        um TEXT DEFAULT 'grame',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(cod_sub_ret) REFERENCES sub_retete(cod_sub_ret),
        FOREIGN KEY(cod_mat) REFERENCES materii_prime(cod)
      )
    `);

    // Fișe tehnice de produs
    await db.exec(`
      CREATE TABLE IF NOT EXISTS fise_tehnice (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        cod_produs INTEGER NOT NULL UNIQUE,
        denumire_produs TEXT NOT NULL,
        descriere TEXT,
        mod_preparare TEXT,
        conditii_pastrare TEXT,
        temperatura_servire TEXT,
        termen_valabilitate TEXT,
        valoare_energetica_kcal REAL,
        proteine_g REAL,
        grasimi_g REAL,
        carbohidrati_g REAL,
        fibre_g REAL,
        sare_g REAL,
        portie_g REAL,
        observatii TEXT,
        versiune INTEGER DEFAULT 1,
        data_versiune DATETIME DEFAULT CURRENT_TIMESTAMP,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Checklist HACCP
    await db.exec(`
      CREATE TABLE IF NOT EXISTS haccp_checklist (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        categorie TEXT NOT NULL,
        punct_control TEXT NOT NULL,
        limita_critica TEXT,
        actiune_corectiva TEXT,
        frecventa TEXT DEFAULT 'zilnic',
        responsabil TEXT,
        activ INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Înregistrări HACCP (completări zilnice)
    await db.exec(`
      CREATE TABLE IF NOT EXISTS haccp_inregistrari (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        checklist_id INTEGER NOT NULL,
        data_control DATETIME DEFAULT CURRENT_TIMESTAMP,
        valoare_masurata TEXT,
        conform INTEGER DEFAULT 1,
        actiune_luata TEXT,
        operator TEXT,
        observatii TEXT,
        FOREIGN KEY(checklist_id) REFERENCES haccp_checklist(id)
      )
    `);

    // Trasabilitate: mișcări ingrediente
    await db.exec(`
      CREATE TABLE IF NOT EXISTS trasabilitate (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        cod_material INTEGER NOT NULL,
        tip_miscare TEXT NOT NULL,
        cantitate REAL NOT NULL,
        um TEXT,
        sursa_id INTEGER,
        sursa_tip TEXT,
        gestiune_id INTEGER,
        lot TEXT,
        data_expirare DATE,
        furnizor_id INTEGER,
        nota TEXT,
        data_miscare DATETIME DEFAULT CURRENT_TIMESTAMP,
        operator TEXT,
        FOREIGN KEY(cod_material) REFERENCES materii_prime(cod)
      )
    `);

    // Seed HACCP checklist implicit
    const count = await db.get('SELECT COUNT(*) as cnt FROM haccp_checklist');
    if (count.cnt === 0) {
      const checklistDefault = [
        { categorie: 'Temperaturi', punct_control: 'Temperatura frigider produse crude', limita_critica: '0°C - 4°C', actiune_corectiva: 'Reglare frigider, eliminare produse compromise', frecventa: 'de 2x/zi', responsabil: 'Bucătar șef' },
        { categorie: 'Temperaturi', punct_control: 'Temperatura congelator', limita_critica: '-18°C sau mai scăzut', actiune_corectiva: 'Reglare congelator, verificare produse', frecventa: 'zilnic', responsabil: 'Bucătar șef' },
        { categorie: 'Temperaturi', punct_control: 'Temperatura de gătire carne de pui', limita_critica: 'minim 75°C în centru', actiune_corectiva: 'Continuare gătire până la atingerea temperaturii', frecventa: 'la fiecare preparare', responsabil: 'Bucătar' },
        { categorie: 'Temperaturi', punct_control: 'Temperatura de servire preparate calde', limita_critica: 'minim 63°C', actiune_corectiva: 'Reîncălzire sau eliminare produs', frecventa: 'la fiecare serviciu', responsabil: 'Ospătar' },
        { categorie: 'Igienă personală', punct_control: 'Spălare mâini înainte de lucru', limita_critica: 'Obligatoriu înainte de manipularea alimentelor', actiune_corectiva: 'Instruire personal, avertizare', frecventa: 'permanent', responsabil: 'Întreg personalul' },
        { categorie: 'Igienă personală', punct_control: 'Echipament de protecție curat', limita_critica: 'Halat, bonetă, mănuși curate', actiune_corectiva: 'Schimbare echipament', frecventa: 'zilnic', responsabil: 'Întreg personalul' },
        { categorie: 'Curățenie', punct_control: 'Curățare și dezinfectare suprafețe de lucru', limita_critica: 'Conform programului de curățenie', actiune_corectiva: 'Curățare imediată', frecventa: 'de 3x/zi', responsabil: 'Personal curățenie' },
        { categorie: 'Curățenie', punct_control: 'Curățare echipamente (grătar, friteuze, cuptoare)', limita_critica: 'Fără reziduuri carbonizate', actiune_corectiva: 'Curățare profundă', frecventa: 'zilnic', responsabil: 'Bucătar' },
        { categorie: 'Aprovizionare', punct_control: 'Verificare temperatură la recepție produse refrigerate', limita_critica: 'Max 8°C pentru produse refrigerate', actiune_corectiva: 'Refuz marfă neconformă', frecventa: 'la fiecare livrare', responsabil: 'Gestionar' },
        { categorie: 'Aprovizionare', punct_control: 'Verificare termen valabilitate la recepție', limita_critica: 'Termen valabilitate neexpirat', actiune_corectiva: 'Refuz marfă expirată', frecventa: 'la fiecare livrare', responsabil: 'Gestionar' },
        { categorie: 'Depozitare', punct_control: 'Separare produse crude de produse gata preparate', limita_critica: 'Fără contact direct', actiune_corectiva: 'Reorganizare depozitare', frecventa: 'permanent', responsabil: 'Bucătar șef' },
        { categorie: 'Depozitare', punct_control: 'Etichetare produse deschise/preparate', limita_critica: 'Data deschidere + termen consum', actiune_corectiva: 'Etichetare imediată', frecventa: 'permanent', responsabil: 'Bucătar' },
      ];
      for (const item of checklistDefault) {
        await db.run(
          `INSERT INTO haccp_checklist (categorie, punct_control, limita_critica, actiune_corectiva, frecventa, responsabil) VALUES (?, ?, ?, ?, ?, ?)`,
          [item.categorie, item.punct_control, item.limita_critica, item.actiune_corectiva, item.frecventa, item.responsabil]
        );
      }
      logger.info('✅ Migration 005: HACCP checklist seeded with default items');
    }

    logger.info('✅ Migration 005: Logistics tables created');
  } catch (error) {
    logger.error('❌ Migration 005 error:', error);
    throw error;
  }
}

export async function down() {
  const db = getDatabase();
  try {
    await db.exec('DROP TABLE IF EXISTS trasabilitate');
    await db.exec('DROP TABLE IF EXISTS haccp_inregistrari');
    await db.exec('DROP TABLE IF EXISTS haccp_checklist');
    await db.exec('DROP TABLE IF EXISTS fise_tehnice');
    await db.exec('DROP TABLE IF EXISTS sub_retete_ingrediente');
    await db.exec('DROP TABLE IF EXISTS sub_retete');
    await db.exec('DROP TABLE IF EXISTS ingrediente_aditivi');
    await db.exec('DROP TABLE IF EXISTS ingrediente_alergeni');
    logger.info('✅ Migration 005 rolled back');
  } catch (error) {
    logger.error('❌ Migration 005 rollback error:', error);
    throw error;
  }
}
