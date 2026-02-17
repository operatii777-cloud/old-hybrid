import express from 'express';
import { getDatabase } from '../../database/init-db.js';
import { logger } from '../../utils/logger.js';
import { isIngredientExclus } from '../../utils/ingrediente-excluse.js';

const router = express.Router();
const db = () => getDatabase();

// ===== GESTIUNI (Warehouses) =====
router.get('/gestiuni', async (req, res) => {
  try {
    const gestiuni = await db().all('SELECT id, nume, locatie, responsabil FROM gestiuni ORDER BY id');
    res.json(gestiuni || []);
  } catch (error) {
    logger.error('Gestiuni error:', error);
    res.status(500).json({ error: 'Eroare la preluarea gestiunilor' });
  }
});

// ===== MATERII PRIME (Ingredients) =====
router.get('/materii-prime', async (req, res) => {
  try {
    const materii = await db().all(`
      SELECT * FROM materii_prime ORDER BY denumire
    `);
    res.json(materii);
  } catch (error) {
    logger.error('Materii prime error:', error);
    res.status(500).json({ error: 'Eroare la preluarea materiilor prime' });
  }
});

router.get('/materii-prime/:cod', async (req, res) => {
  try {
    const materie = await db().get(
      'SELECT * FROM materii_prime WHERE cod = ?',
      [req.params.cod]
    );
    res.json(materie || { error: 'Nu gasit' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/materii-prime', async (req, res) => {
  try {
    const { cod, denumire, um, pret, grupa, st_min, coef, zile, tva, barcod } = req.body;

    if (!denumire || !pret) {
      return res.status(400).json({ error: 'Denumire și Preț sunt obligatorii' });
    }
    if (isIngredientExclus(denumire)) {
      return res.status(400).json({ error: 'Acest tip de ingredient (derivat/preparat, ex. apă fierbinte, spumă de lapte) nu se înregistrează ca material de stoc.' });
    }

    await db().run(
      `INSERT INTO materii_prime (cod, denumire, grupa, pret, um, st_min, proces, coef, zile, tva, barcod)
       VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?)`,
      [cod, denumire, grupa || 1, pret, um || 'Kg', st_min || 0, coef || 1, zile || 0, tva || 1.11, barcod || null]
    );

    res.json({ success: true, message: 'Material adăugat cu succes' });
  } catch (error) {
    logger.error('Add materie error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.put('/materii-prime/:cod', async (req, res) => {
  try {
    const { denumire, um, pret, grupa, st_min, coef, zile, tva, barcod } = req.body;

    if (!denumire || !pret) {
      return res.status(400).json({ error: 'Denumire și Preț sunt obligatorii' });
    }
    if (isIngredientExclus(denumire)) {
      return res.status(400).json({ error: 'Acest tip de ingredient (derivat/preparat) nu se înregistrează ca material de stoc.' });
    }

    await db().run(
      `UPDATE materii_prime 
       SET denumire = ?, um = ?, pret = ?, grupa = ?, st_min = ?, coef = ?, zile = ?, tva = ?, barcod = ?
       WHERE cod = ?`,
      [denumire, um || 'Kg', pret, grupa || 1, st_min || 0, coef || 1, zile || 0, tva || 1.11, barcod || null, req.params.cod]
    );

    res.json({ success: true, message: 'Material modificat cu succes' });
  } catch (error) {
    logger.error('Update materie error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.delete('/materii-prime/:cod', async (req, res) => {
  try {
    await db().run('DELETE FROM materii_prime WHERE cod = ?', [req.params.cod]);
    res.json({ success: true, message: 'Material șters cu succes' });
  } catch (error) {
    logger.error('Delete materie error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ===== REȚETE (Recipes) =====
router.get('/retete', async (req, res) => {
  try {
    const retete = await db().all(`
      SELECT r.*, m.denumire as denumire_material
      FROM retete r
      LEFT JOIN materii_prime m ON r.cod_mat = m.cod
      ORDER BY r.cod_ret, r.id
    `);
    res.json(retete);
  } catch (error) {
    logger.error('Retete error:', error);
    res.status(500).json({ error: 'Eroare la preluarea rețetelor' });
  }
});

/** Catalog rețete: toate rețetele cu den_prod (pentru grupare pe categorii în frontend) */
router.get('/retete-catalog', async (req, res) => {
  try {
    const rows = await db().all(`
      SELECT r.id, r.cod_ret, r.cod_mat, r.denumire as denumire_ingredient, r.cant, r.um,
             p.den_prod, p.grupa as grupa_db
      FROM retete r
      LEFT JOIN produse_pos p ON p.cod_prod = r.cod_ret
      ORDER BY p.den_prod, r.id
    `);
    res.json(rows);
  } catch (error) {
    logger.error('Retete catalog error:', error);
    res.status(500).json({ error: 'Eroare la preluarea catalogului de rețete' });
  }
});

router.get('/retete/:cod_ret', async (req, res) => {
  try {
    const reteta = await db().all(`
      SELECT r.*, m.denumire as denumire_material, m.pret
      FROM retete r
      LEFT JOIN materii_prime m ON r.cod_mat = m.cod
      WHERE r.cod_ret = ?
      ORDER BY r.id
    `, [req.params.cod_ret]);
    res.json(reteta);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/retete', async (req, res) => {
  try {
    const { cod_ret, cod_mat, denumire, cant, um, gestiune_id, pret_material, buc, coef } = req.body;

    if (!cod_ret || !cod_mat || !cant) {
      return res.status(400).json({ error: 'Cod rețetă, cod material și cantitate sunt obligatorii' });
    }
    const mat = await db().get('SELECT denumire FROM materii_prime WHERE cod = ?', [cod_mat]);
    if (mat && isIngredientExclus(mat.denumire)) {
      return res.status(400).json({ error: 'Acest ingredient (derivat/preparat) nu se adaugă în rețete; folosiți materialul de bază (ex. Apă, Lapte).' });
    }

    await db().run(
      `INSERT INTO retete 
       (cod_ret, cod_mat, denumire, cant, um, gestiune_id, pret_material, buc, coef)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [cod_ret, cod_mat, denumire || '', cant, um || 'grame', gestiune_id || 1,
        pret_material || 0, buc || 1, coef || 1]
    );

    res.json({ success: true, message: 'Ingredient adăugat la rețetă' });
  } catch (error) {
    logger.error('Add reteta error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.put('/retete/:id', async (req, res) => {
  try {
    const { cant, um } = req.body;
    if (cant == null && um == null) {
      return res.status(400).json({ error: 'cant sau um obligatorii' });
    }
    const updates = [];
    const params = [];
    if (cant != null) { updates.push('cant = ?'); params.push(Number(cant)); }
    if (um != null) { updates.push('um = ?'); params.push(um); }
    params.push(req.params.id);
    await db().run(
      `UPDATE retete SET ${updates.join(', ')} WHERE id = ?`,
      params
    );
    res.json({ success: true, message: 'Rețetă actualizată' });
  } catch (error) {
    logger.error('Update reteta error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.delete('/retete/:id', async (req, res) => {
  try {
    await db().run('DELETE FROM retete WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Ingredient șters din rețetă' });
  } catch (error) {
    logger.error('Delete reteta error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ===== STOCURI (Inventory) =====
// Pentru gestiune_id 2 (Bucătărie) sau 3 (Bar) returnează doar materialele din rețete cu acel gestiune_id
router.get('/stocuri', async (req, res) => {
  try {
    const gestiuneId = Number(req.query.gestiune_id) || 1;
    if (gestiuneId === 1) {
      const stocuri = await db().all(`
        SELECT m.cod as cod_material, m.denumire, m.um, m.pret, m.st_min,
               COALESCE(s.cant_stoc, 0) as cant_stoc, s.id as stoc_id, s.gestiune_id
        FROM materii_prime m
        LEFT JOIN stocuri s ON s.cod_material = m.cod AND s.gestiune_id = 1
        ORDER BY m.denumire
      `);
      return res.json(stocuri);
    }
    const stocuri = await db().all(`
      SELECT m.cod as cod_material, m.denumire, m.um, m.pret, m.st_min,
             COALESCE(s.cant_stoc, 0) as cant_stoc, s.id as stoc_id, s.gestiune_id
      FROM materii_prime m
      INNER JOIN (SELECT DISTINCT cod_mat FROM retete WHERE gestiune_id = ?) r ON r.cod_mat = m.cod
      LEFT JOIN stocuri s ON s.cod_material = m.cod AND s.gestiune_id = ?
      ORDER BY m.denumire
    `, [gestiuneId, gestiuneId]);
    res.json(stocuri);
  } catch (error) {
    logger.error('Stocuri error:', error);
    res.status(500).json({ error: 'Eroare la preluarea stocurilor' });
  }
});

// Materii prime considerate "de bar" (cafea, băuturi, răcoritoare etc.)
const BAR_DENUMIRE_PATTERN = /CAFEA|BERE|VIN|APA\s|COLA|SPRITE|FANTA|PEPSI|CEAI|SUC\s|RED\s*BULL|WHISKY|VODKA|ROM\b|GIN|RACORITOARE|BAUTURI|ABSINTH|METAXA|MIORITA|ZARAZA|SAMPANIE|TONIC|Limonada|ORANGE|PORTOCALE|CAPY|COCTAIL|ESPRESSO|CAPPUCCINO|LAPTE|SIROP|APA MINERALA|PERRIER|VITTEL|NESTEA|ICE TEA|LITRU|st\.\s*0/i;

function isMaterieBar(denumire) {
  return BAR_DENUMIRE_PATTERN.test((denumire || '').toUpperCase());
}

// Populare stocuri DOAR O SINGURĂ DATĂ pentru testare inventar. După aceea stocurile se modifică doar prin NIR și Transfer.
async function populateStocuri() {
  try {
    const testDone = await db().get("SELECT 1 FROM config_sistem WHERE denumire = 'inventar_test_seed'");
    if (testDone) return;

    const gestiuniExist = await db().get('SELECT COUNT(*) as cnt FROM gestiuni WHERE id IN (1, 2, 3)');
    if (!gestiuniExist?.cnt || gestiuniExist.cnt < 2) return;

    const materii = await db().all('SELECT cod, denumire FROM materii_prime');
    if (materii.length === 0) return;

    const CANT_PRINCIPALA_SECUNDARA = 50;
    const CANT_BAR = 30;

    const countG1 = await db().get('SELECT COUNT(*) as cnt FROM stocuri WHERE gestiune_id = 1');
    const countG2 = await db().get('SELECT COUNT(*) as cnt FROM stocuri WHERE gestiune_id = 2');
    const countG3 = await db().get('SELECT COUNT(*) as cnt FROM stocuri WHERE gestiune_id = 3');

    if (!countG1?.cnt) {
      for (const m of materii) {
        if (isIngredientExclus(m.denumire)) continue;
        await db().run(`
          INSERT OR IGNORE INTO stocuri (gestiune_id, cod_material, cant_stoc, cant_minim, pret_unitar)
          VALUES (1, ?, ?, 5, 0)
        `, [m.cod, CANT_PRINCIPALA_SECUNDARA]);
      }
      logger.info('Stocuri Gestiune Principala populate (test, o singură dată).');
    }
    if (!countG2?.cnt) {
      for (const m of materii) {
        if (isIngredientExclus(m.denumire)) continue;
        await db().run(`
          INSERT OR IGNORE INTO stocuri (gestiune_id, cod_material, cant_stoc, cant_minim, pret_unitar)
          VALUES (2, ?, ?, 5, 0)
        `, [m.cod, CANT_PRINCIPALA_SECUNDARA]);
      }
      logger.info('Stocuri Gestiune Secundara populate (test, o singură dată).');
    }
    if (!countG3?.cnt) {
      for (const m of materii) {
        if (isIngredientExclus(m.denumire) || !isMaterieBar(m.denumire)) continue;
        await db().run(`
          INSERT OR IGNORE INTO stocuri (gestiune_id, cod_material, cant_stoc, cant_minim, pret_unitar)
          VALUES (3, ?, ?, 5, 0)
        `, [m.cod, CANT_BAR]);
      }
      logger.info('Stocuri Gestiune Bar populate (test, o singură dată).');
    }
    await db().run(
      "INSERT OR IGNORE INTO config_sistem (denumire, cui) VALUES ('inventar_test_seed', '1')"
    );
  } catch (error) {
    logger.warn('Stock population error:', error?.message || error);
  }
}

// Lista inventar per gestiune: Depozit = toate materialele; Bucătărie/Bar = doar materialele din rețete cu acel gestiune_id
router.get('/stocuri/gestiune/:gestiune_id', async (req, res) => {
  try {
    const gestiuneId = Number(req.params.gestiune_id);
    if (gestiuneId === 1) {
      // Depozit: toate materiile prime (stocuri existente sau toate din catalog)
      const stocuri = await db().all(`
        SELECT m.cod as cod_material, m.denumire, m.um, m.pret, m.st_min,
               COALESCE(s.cant_stoc, 0) as cant_stoc, s.id as stoc_id, s.gestiune_id
        FROM materii_prime m
        LEFT JOIN stocuri s ON s.cod_material = m.cod AND s.gestiune_id = 1
        ORDER BY m.denumire
      `);
      return res.json(stocuri || []);
    }
    // Bucătărie (2) și Bar (3): doar materiale care apar în rețete pentru această gestiune
    const stocuri = await db().all(`
      SELECT m.cod as cod_material, m.denumire, m.um, m.pret, m.st_min,
             COALESCE(s.cant_stoc, 0) as cant_stoc, s.id as stoc_id, s.gestiune_id
      FROM materii_prime m
      INNER JOIN (SELECT DISTINCT cod_mat FROM retete WHERE gestiune_id = ?) r ON r.cod_mat = m.cod
      LEFT JOIN stocuri s ON s.cod_material = m.cod AND s.gestiune_id = ?
      ORDER BY m.denumire
    `, [gestiuneId, gestiuneId]);
    return res.json(stocuri || []);
  } catch (error) {
    logger.error('Stocuri gestiune error:', error);
    if (/no such table|SQLITE_ERROR/.test(error?.message || '')) {
      return res.json([]);
    }
    res.status(500).json({ error: error.message || 'Eroare la preluarea stocurilor' });
  }
});

router.put('/stocuri', async (req, res) => {
  try {
    const { gestiune_id, cod_material, cant_stoc } = req.body;
    if (gestiune_id == null || cod_material == null) {
      return res.status(400).json({ error: 'gestiune_id și cod_material sunt obligatorii' });
    }
    const mat = await db().get('SELECT denumire FROM materii_prime WHERE cod = ?', [cod_material]);
    if (mat && isIngredientExclus(mat.denumire)) {
      return res.status(400).json({ error: 'Acest material (derivat/preparat) nu are stoc propriu; folosiți materialul de bază.' });
    }
    const cant = parseFloat(cant_stoc);
    if (Number.isNaN(cant) || cant < 0) {
      return res.status(400).json({ error: 'cant_stoc trebuie să fie un număr >= 0' });
    }
    const existing = await db().get(
      'SELECT id FROM stocuri WHERE gestiune_id = ? AND cod_material = ?',
      [gestiune_id, cod_material]
    );
    if (existing) {
      await db().run(
        'UPDATE stocuri SET cant_stoc = ?, data_update = CURRENT_TIMESTAMP WHERE id = ?',
        [cant, existing.id]
      );
    } else {
      await db().run(
        `INSERT INTO stocuri (gestiune_id, cod_material, cant_stoc, cant_minim, pret_unitar)
         VALUES (?, ?, ?, 5, 0)`,
        [gestiune_id, cod_material, cant]
      );
    }
    res.json({ success: true, message: 'Stoc actualizat' });
  } catch (error) {
    logger.error('Update stoc error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ===== TRANSFER GESTIUNI =====
router.get('/transfer-gestiuni', async (req, res) => {
  try {
    const transferuri = await db().all(`
      SELECT t.*, m.denumire, gd.nume as din_gestiune, gi.nume as in_gestiune
      FROM transfer_gestiuni t
      LEFT JOIN materii_prime m ON t.cod_material = m.cod
      LEFT JOIN gestiuni gd ON t.din_gestiune_id = gd.id
      LEFT JOIN gestiuni gi ON t.in_gestiune_id = gi.id
      ORDER BY t.data_transfer DESC
    `);
    res.json(transferuri);
  } catch (error) {
    logger.error('Transfer gestiuni error:', error);
    res.status(500).json({ error: 'Eroare la preluarea transferurilor' });
  }
});

router.post('/transfer-gestiuni', async (req, res) => {
  try {
    const { cod_material, cant_transfer, din_gestiune_id, in_gestiune_id, nota_transfer, pret_transfer } = req.body;

    if (!cod_material || cant_transfer == null || !din_gestiune_id || !in_gestiune_id) {
      return res.status(400).json({ error: 'Date incomplete: cod_material, cant_transfer, din_gestiune_id, in_gestiune_id' });
    }

    const cant = parseFloat(cant_transfer);
    if (Number.isNaN(cant) || cant <= 0) {
      return res.status(400).json({ error: 'cant_transfer trebuie să fie > 0' });
    }

    const sursa = await db().get(
      'SELECT id, cant_stoc FROM stocuri WHERE gestiune_id = ? AND cod_material = ?',
      [din_gestiune_id, cod_material]
    );
    if (!sursa || (sursa.cant_stoc || 0) < cant) {
      return res.status(400).json({ error: 'Stoc insuficient în gestiunea sursă' });
    }

    await db().run(
      `INSERT INTO transfer_gestiuni 
       (cod_material, cant_transfer, din_gestiune_id, in_gestiune_id, nota_transfer, pret_transfer)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [cod_material, cant, din_gestiune_id, in_gestiune_id, nota_transfer || '', pret_transfer || 0]
    );

    await db().run(
      'UPDATE stocuri SET cant_stoc = cant_stoc - ?, data_update = CURRENT_TIMESTAMP WHERE id = ?',
      [cant, sursa.id]
    );

    const dest = await db().get(
      'SELECT id, cant_stoc FROM stocuri WHERE gestiune_id = ? AND cod_material = ?',
      [in_gestiune_id, cod_material]
    );
    if (dest) {
      await db().run(
        'UPDATE stocuri SET cant_stoc = cant_stoc + ?, data_update = CURRENT_TIMESTAMP WHERE id = ?',
        [cant, dest.id]
      );
    } else {
      await db().run(
        `INSERT INTO stocuri (gestiune_id, cod_material, cant_stoc, cant_minim, pret_unitar)
         VALUES (?, ?, ?, 5, 0)`,
        [in_gestiune_id, cod_material, cant]
      );
    }

    res.json({ success: true, message: 'Transfer realizat; stocuri actualizate' });
  } catch (error) {
    logger.error('Transfer error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ===== RETUR MATERIALE =====
router.get('/retur-materiale', async (req, res) => {
  try {
    const returi = await db().all(`
      SELECT r.*, m.denumire, g.nume as gestiune
      FROM retur_materiale r
      LEFT JOIN materii_prime m ON r.cod_material = m.cod
      LEFT JOIN gestiuni g ON r.din_gestiune_id = g.id
      ORDER BY r.data_retur DESC
    `);
    res.json(returi);
  } catch (error) {
    logger.error('Retur error:', error);
    res.status(500).json({ error: 'Eroare la preluarea retuurilor' });
  }
});

router.post('/retur-materiale', async (req, res) => {
  try {
    const { cod_material, cant_retur, din_gestiune_id, motiv, pret_retur } = req.body;

    if (!cod_material || cant_retur == null || !din_gestiune_id) {
      return res.status(400).json({ error: 'Date incomplete: cod_material, cant_retur, din_gestiune_id' });
    }
    const cant = parseFloat(cant_retur);
    if (Number.isNaN(cant) || cant <= 0) {
      return res.status(400).json({ error: 'cant_retur trebuie să fie > 0' });
    }

    const stocRow = await db().get(
      'SELECT id, cant_stoc FROM stocuri WHERE gestiune_id = ? AND cod_material = ?',
      [din_gestiune_id, cod_material]
    );
    if (!stocRow || (stocRow.cant_stoc || 0) < cant) {
      return res.status(400).json({ error: 'Stoc insuficient în gestiunea selectată pentru retur' });
    }

    await db().run(
      `INSERT INTO retur_materiale 
       (cod_material, cant_retur, din_gestiune_id, motiv, pret_retur)
       VALUES (?, ?, ?, ?, ?)`,
      [cod_material, cant, din_gestiune_id, motiv || '', pret_retur || 0]
    );

    await db().run(
      'UPDATE stocuri SET cant_stoc = cant_stoc - ?, data_update = CURRENT_TIMESTAMP WHERE id = ?',
      [cant, stocRow.id]
    );

    res.json({ success: true, message: 'Retur înregistrat; stoc actualizat' });
  } catch (error) {
    logger.error('Retur POST error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ===== FURNIZORI (Suppliers) =====
router.get('/furnizori', async (req, res) => {
  try {
    const furnizori = await db().all(`
      SELECT * FROM furnizori WHERE active = 1 ORDER BY denumire
    `);
    res.json(furnizori);
  } catch (error) {
    logger.error('Furnizori error:', error);
    res.status(500).json({ error: 'Eroare la preluarea furnizorilor' });
  }
});

router.get('/furnizori/:id', async (req, res) => {
  try {
    const furnizor = await db().get(
      'SELECT * FROM furnizori WHERE id = ?',
      [req.params.id]
    );
    res.json(furnizor);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/furnizori', async (req, res) => {
  try {
    const { cod_client, denumire, reg_com, adresa, judetul, cont, banca, telefon, tel_mobil, cod_fiscal } = req.body;

    if (!denumire) {
      return res.status(400).json({ error: 'Denumire este obligatorie' });
    }

    await db().run(
      `INSERT INTO furnizori 
       (cod_client, denumire, reg_com, adresa, judetul, cont, banca, telefon, tel_mobil, cod_fiscal, active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
      [cod_client || 0, denumire, reg_com || '', adresa || '', judetul || '',
      cont || '', banca || '', telefon || '', tel_mobil || '', cod_fiscal || '']
    );

    res.json({ success: true, message: 'Furnizor adăugat cu succes' });
  } catch (error) {
    logger.error('Add furnizor error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.put('/furnizori/:id', async (req, res) => {
  try {
    const { denumire, reg_com, adresa, judetul, cont, banca, telefon, tel_mobil, cod_fiscal } = req.body;

    if (!denumire) {
      return res.status(400).json({ error: 'Denumire este obligatorie' });
    }

    await db().run(
      `UPDATE furnizori 
       SET denumire = ?, reg_com = ?, adresa = ?, judetul = ?, cont = ?, banca = ?, 
           telefon = ?, tel_mobil = ?, cod_fiscal = ?
       WHERE id = ?`,
      [denumire, reg_com || '', adresa || '', judetul || '', cont || '', banca || '',
        telefon || '', tel_mobil || '', cod_fiscal || '', req.params.id]
    );

    res.json({ success: true, message: 'Furnizor modificat cu succes' });
  } catch (error) {
    logger.error('Update furnizor error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.delete('/furnizori/:id', async (req, res) => {
  try {
    await db().run('UPDATE furnizori SET active = 0 WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Furnizor șters cu succes' });
  } catch (error) {
    logger.error('Delete furnizor error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ===== NIR (Nota Intrare Marfa) =====
router.get('/nir', async (req, res) => {
  try {
    const { cod_material } = req.query;
    let query = `
      SELECT 
        n.id, n.nr_factura as nr_fact, n.nr_nir, n.cod_material,
        DATE(n.data_factura) as data_fact,
        n.cant_facturata as cant_f, n.cant_primita as cant,
        n.pret_unitar as pret, n.valoare, n.gestiune_id, n.tva_proc, n.data_exp,
        g.nume as gestiune, m.denumire as denumire_material
      FROM nir n
      LEFT JOIN gestiuni g ON n.gestiune_id = g.id
      LEFT JOIN materii_prime m ON n.cod_material = m.cod
      WHERE 1=1
    `;
    const params = [];

    if (cod_material) {
      query += ' AND n.cod_material = ?';
      params.push(cod_material);
    }

    query += ' ORDER BY n.data_factura DESC LIMIT 100';

    const nir = await db().all(query, params);
    res.json(nir);
  } catch (error) {
    logger.error('NIR error:', error);
    res.status(500).json({ error: 'Eroare la preluarea NIR' });
  }
});

// Istoric NIR – toate NIR-urile, opțional filtrate pe gestiune
router.get('/istoric-nir', async (req, res) => {
  try {
    const { gestiune_id } = req.query;
    let query = `
      SELECT 
        n.id, n.nr_nir, n.nr_factura as nr_fact, n.data_factura as data_fact,
        n.cod_material, n.cant_facturata as cant_f, n.cant_primita as cant,
        n.pret_unitar as pret, n.valoare, n.gestiune_id,
        g.nume as gestiune, m.denumire as denumire_material,
        f.denumire as furnizor
      FROM nir n
      LEFT JOIN gestiuni g ON n.gestiune_id = g.id
      LEFT JOIN materii_prime m ON n.cod_material = m.cod
      LEFT JOIN furnizori f ON n.furnizor_id = f.id
      WHERE 1=1
    `;
    const params = [];
    if (gestiune_id !== undefined && gestiune_id !== '' && gestiune_id !== 'toate') {
      query += ' AND n.gestiune_id = ?';
      params.push(gestiune_id);
    }
    query += ' ORDER BY n.data_factura DESC, n.id DESC';
    const list = await db().all(query, params);
    res.json(list);
  } catch (error) {
    logger.error('Istoric NIR error:', error);
    res.status(500).json({ error: 'Eroare la preluarea istoricului NIR' });
  }
});

// Istoric transferuri – toate transferurile, opțional filtrate pe gestiune (din sau în)
router.get('/istoric-transfer', async (req, res) => {
  try {
    const { gestiune_id } = req.query;
    let query = `
      SELECT 
        t.id, t.cod_material, t.cant_transfer, t.data_transfer,
        t.din_gestiune_id, t.in_gestiune_id, t.nota_transfer, t.pret_transfer,
        gd.nume as din_gestiune, gi.nume as in_gestiune, m.denumire as denumire_material
      FROM transfer_gestiuni t
      LEFT JOIN gestiuni gd ON t.din_gestiune_id = gd.id
      LEFT JOIN gestiuni gi ON t.in_gestiune_id = gi.id
      LEFT JOIN materii_prime m ON t.cod_material = m.cod
      WHERE 1=1
    `;
    const params = [];
    if (gestiune_id !== undefined && gestiune_id !== '' && gestiune_id !== 'toate') {
      const gid = Number(gestiune_id);
      query += ' AND (t.din_gestiune_id = ? OR t.in_gestiune_id = ?)';
      params.push(gid, gid);
    }
    query += ' ORDER BY t.data_transfer DESC, t.id DESC';
    const list = await db().all(query, params);
    res.json(list);
  } catch (error) {
    logger.error('Istoric transfer error:', error);
    res.status(500).json({ error: 'Eroare la preluarea istoricului transferuri' });
  }
});

// Istoric retururi – toate retururile, opțional filtrate pe gestiune
router.get('/istoric-retur', async (req, res) => {
  try {
    const { gestiune_id } = req.query;
    let query = `
      SELECT 
        r.id, r.cod_material, r.cant_retur, r.data_retur, r.din_gestiune_id, r.motiv, r.pret_retur,
        g.nume as gestiune, m.denumire as denumire_material
      FROM retur_materiale r
      LEFT JOIN gestiuni g ON r.din_gestiune_id = g.id
      LEFT JOIN materii_prime m ON r.cod_material = m.cod
      WHERE 1=1
    `;
    const params = [];
    if (gestiune_id !== undefined && gestiune_id !== '' && gestiune_id !== 'toate') {
      query += ' AND r.din_gestiune_id = ?';
      params.push(gestiune_id);
    }
    query += ' ORDER BY r.data_retur DESC, r.id DESC';
    const list = await db().all(query, params);
    res.json(list);
  } catch (error) {
    logger.error('Istoric retur error:', error);
    res.status(500).json({ error: 'Eroare la preluarea istoricului retururi' });
  }
});

router.post('/nir', async (req, res) => {
  try {
    const { nr_nir, nr_factura, data_factura, furnizor_id, gestiune_id, cod_material,
      cant_facturata, cant_primita, pret_unitar, valoare } = req.body;

    if (!nr_nir || !nr_factura || !furnizor_id || !gestiune_id || cod_material == null) {
      return res.status(400).json({ error: 'Completați: nr_nir, nr_factura, furnizor_id, gestiune_id, cod_material (materia primă)' });
    }
    const mat = await db().get('SELECT denumire FROM materii_prime WHERE cod = ?', [cod_material]);
    if (mat && isIngredientExclus(mat.denumire)) {
      return res.status(400).json({ error: 'Acest material (derivat/preparat) nu se înregistrează în NIR; folosiți materialul de bază.' });
    }

    const cant = parseFloat(cant_primita) || parseFloat(cant_facturata) || 0;
    const pret = parseFloat(pret_unitar) || 0;
    const val = parseFloat(valoare) || cant * pret;

    await db().run(
      `INSERT INTO nir 
       (nr_nir, nr_factura, data_factura, furnizor_id, gestiune_id, cod_material,
        cant_facturata, cant_primita, pret_unitar, valoare)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [nr_nir, nr_factura, data_factura || new Date().toISOString().slice(0, 10), furnizor_id, gestiune_id, cod_material,
        cant_facturata ?? cant, cant, pret, val]
    );

    const existing = await db().get(
      'SELECT id, cant_stoc FROM stocuri WHERE gestiune_id = ? AND cod_material = ?',
      [gestiune_id, cod_material]
    );
    if (existing) {
      await db().run(
        'UPDATE stocuri SET cant_stoc = cant_stoc + ?, data_update = CURRENT_TIMESTAMP WHERE id = ?',
        [cant, existing.id]
      );
    } else {
      await db().run(
        `INSERT INTO stocuri (gestiune_id, cod_material, cant_stoc, cant_minim, pret_unitar)
         VALUES (?, ?, ?, 5, ?)`,
        [gestiune_id, cod_material, cant, pret]
      );
    }

    res.json({ success: true, message: 'NIR creat; stoc actualizat în gestiune' });
  } catch (error) {
    logger.error('NIR POST error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/nir-bulk', async (req, res) => {
  try {
    const { header, items } = req.body;

    if (!header || !items || items.length === 0) {
      return res.status(400).json({ error: 'Date incomplete pentru salvarca bulk.' });
    }

    // Generare automata NR NIR daca nu exista
    let nrNir = header.nir_nr;
    if (!nrNir) {
      const lastNir = await db().get('SELECT MAX(CAST(nr_nir AS INTEGER)) as max_nir FROM nir');
      nrNir = ((lastNir?.max_nir || 0) + 1).toString();
    }

    for (const item of items) {
      // Valorile primite sunt deja convertite pentru stoc de catre frontend
      const cant = parseFloat(item.cant_stoc) || 0;
      const pret = parseFloat(item.pret_stoc) || 0;
      const val = parseFloat(item.valoare) || 0;

      await db().run(
        `INSERT INTO nir 
         (nr_nir, nr_factura, data_factura, furnizor_id, gestiune_id, cod_material,
          cant_facturata, cant_primita, pret_unitar, valoare)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [nrNir, header.fact_nr, header.data || new Date().toISOString().slice(0, 10),
          header.furnizor_id, header.gestiune_id, item.cod_prod,
          item.cant_factura, cant, pret, val]
      );

      // Actualizare stoc
      const existing = await db().get(
        'SELECT id, cant_stoc FROM stocuri WHERE gestiune_id = ? AND cod_material = ?',
        [header.gestiune_id, item.cod_prod]
      );

      if (existing) {
        await db().run(
          'UPDATE stocuri SET cant_stoc = cant_stoc + ?, data_update = CURRENT_TIMESTAMP WHERE id = ?',
          [cant, existing.id]
        );
      } else {
        await db().run(
          `INSERT INTO stocuri (gestiune_id, cod_material, cant_stoc, cant_minim, pret_unitar)
           VALUES (?, ?, ?, 5, ?)`,
          [header.gestiune_id, item.cod_prod, cant, pret]
        );
      }
    }

    res.json({ success: true, message: `NIR ${nrNir} salvat cu succes; ${items.length} repere procesate.` });
  } catch (error) {
    logger.error('NIR Bulk error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
