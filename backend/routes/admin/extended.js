import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getDatabase, arrangeHorecaData } from '../../database/init-db.js';
import { logger } from '../../utils/logger.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const router = express.Router();
const db = () => getDatabase();

// Încarcă categorii din aplicația originală (RestWin/RestGest) – sursă unică: data/categorii-produse-original.json
function getCategoriiOriginale() {
  try {
    const pathJson = path.join(__dirname, '../../../data/categorii-produse-original.json');
    const raw = fs.readFileSync(pathJson, 'utf8');
    const data = JSON.parse(raw);
    if (Array.isArray(data.categorii) && data.categorii.length > 0) return data.categorii;
  } catch (e) {
    logger.warn('Categorii originale: nu s-a putut citi data/categorii-produse-original.json, se folosește lista implicită.');
  }
  return [
    'RACORITOARE', 'VINURI', 'ALCOOLICE', 'PREP PORC/VITA/PESTE', 'GARNITURI/SALATE',
    'CAFEA', 'CIORBE/MIC DEJ/PIZZA', 'PREP PUI', 'VINURI/METAXA', 'DIVERSE/DESERT/SPEC'
  ];
}

const LISTA_CATEGORII_POS = getCategoriiOriginale();

// Mapare grupa numerică sau după denumire -> nume categorie POS (RestWin). Ordinea contează.
const CATEGORII_POS = [
  // Cafea (înainte de ALCOOLICE ca IRISH COFFEE să fie CAFEA)
  { pattern: /ESPRESSO|CAPPUCCINO|CAFEA|CAFE LATTE|CEAI|CIOCOLATA CALDA|MOCHACCINO|IRISH COFFEE|AMARETTO COFFEE|AFFOGADO|MADELEINE|NIRVANA|MONTE BIANCO|MONTE NERO|CLASSIC|SHAKERETTO|STEFANO'S|ANGELINA|REGINA|COFFEE CABINET/i, categorie: 'CAFEA' },
  // Răcoritoare și băuturi răcoritoare
  { pattern: /APA |PEPSI|MIRINDA|SEVEN UP|MOUNTAIN DEW|EVERVESS|LIMONADA|FRESH |ICE TEA|ICETEA|SUC FRUCTE|RED BULL|PERRIER|VITTEL|APA PLATA|APA MINERALA|COCA COLA|COLA|FANTA|SPRITE|NESTEA|BURN|RED FORCE|CAPY|SANTAL|NECTAR|PERONI|URSUS|STEJAR|SALITOS|COLINE/i, categorie: 'RACORITOARE' },
  { pattern: /SHAKE /i, categorie: 'RACORITOARE' },
  // Preparate pui (înainte de porc ca SNITEL PUI să fie la pui)
  { pattern: /SNI[TȚ]EL PUI|PUI |PULPE PUI|ARIPIOARE|PIEPT PUI|GRILL PUI|PUI GRILL|PUI LA CUPTOR|PUI PRAJIT|\bPUI\b/i, categorie: 'PREP PUI' },
  // Preparate porc/vită/peste
  { pattern: /SNI[TȚ]EL|COTLET|MICI |PORC |VITA |PESTE |FRIPTUR|GRATAR|CHIFTEL|CARNATI|MUSCHI|FICAT|GULAS|TOCANA|SARMALE|MITITEI/i, categorie: 'PREP PORC/VITA/PESTE' },
  // Pizza
  { pattern: /PIZZA/i, categorie: 'CIORBE/MIC DEJ/PIZZA' },
  // Ciorbe, mic dejun
  { pattern: /CIORB[AĂ]|SUPA |CROISSANT|SUNCA SI CASCAVAL|SIMPLU, SERVIT|BREAKFAST|TOAST |CANA LAPTE|SANDWICH|CU CIOCOLATA|CU GEM|CU MIERE|MIC DEJ/i, categorie: 'CIORBE/MIC DEJ/PIZZA' },
  // Garnituri și salate
  { pattern: /EXTRA |CARTOFI|OREZ |SALAT[AĂ]|GARNITUR|BOEUF|LEGUME LA CUPTOR|MASH|PUREU/i, categorie: 'GARNITURI/SALATE' },
  // Vinuri
  { pattern: /CABERNET|SAUVIGNON|JIDVEI|CLAUSTHALLER|RECAS|FETEASCA|RO[ȘS]E|CHARDONNAY|MERLOT|PINOT/i, categorie: 'VINURI' },
  // Vinuri / Metaxa (conform aplicației originale: Metaxa, șampanie, rachiuri, vin fiert)
  { pattern: /METAXA|MIORITA|ZARAZA|SAMPANIE|BUSUIOACA|RAI DE MURFATLAR|BARON'S|VIN ALB FIERT|VIN ROSU FIERT|VIN FIERT/i, categorie: 'VINURI/METAXA' },
  // Alcoolice (bere, spirtoase)
  { pattern: /VODKA|WHISKY|JACK DANIEL|CHIVAS|JOHNNIE WALKER|BALLANTINE|J&B|GIN TONIC|CAMPARI|BEEFEATER|BAILEY|FERNET|JAGERMEISTER|COINTREAU|MARTINI\b|SAMBUC[AO]|BACARDI|SMIRNOFF|HEINEKEN|BUDWEISER|CORONA\b|REMY MARTIN|COURVOISIER|TULLAMORE|GLENFIDDICH|AMARETTO\b|ABSINTH/i, categorie: 'ALCOOLICE' },
  // Diverse / desert / specialități
  { pattern: /BANANA SPLIT|3 CUPE|CHOCOLATE HEAVEN|PECHE MELBA|PINKY|PINEAPPLE DELIGHT|SALATA DE FRUCTE|COCKTAIL DE FRUCTE|CINO'S|PLAISIR|PYRAMID|FESTIVAL|MASCOTTE|DESERT|PLACINTA|TORT|INGHETATA|SPEC /i, categorie: 'DIVERSE/DESERT/SPEC' }
];

function getCategoriePos(den_prod, grupaDb) {
  const den = (den_prod || '').toString().toUpperCase();
  const grupaNum = Number(grupaDb);
  // Dacă grupa din DB e deja text (ex. 'RACORITOARE'), păstrăm
  if (grupaDb != null && grupaDb !== '' && isNaN(grupaNum)) return String(grupaDb).trim();
  // Dacă avem grupa numerică nenulă și o mapare (pentru viitor), o putem folosi aici
  for (const { pattern, categorie } of CATEGORII_POS) {
    if (pattern.test(den)) return categorie;
  }
  return grupaDb != null && grupaDb !== '' ? String(grupaDb) : 'Altele';
}

// ===== ARANJARE HORECA (mapare produse pe dept, stocuri pe gestiuni, rețete) =====
router.post('/arrange-horeca', async (req, res) => {
  try {
    await arrangeHorecaData();
    res.json({ success: true, message: 'Mapare produse, stocuri și rețete actualizate.' });
  } catch (error) {
    logger.error('arrange-horeca error:', error);
    res.status(500).json({ error: error.message || 'Eroare la aranjare' });
  }
});

// ===== UNITĂȚI MĂSURĂ CU CONVERSII =====
router.get('/um-conversie', async (req, res) => {
  try {
    const unitati = await db().all('SELECT * FROM um_conversie ORDER BY um1');
    res.json(unitati);
  } catch (error) {
    logger.error('UM conversie error:', error);
    res.status(500).json({ error: 'Eroare la preluarea unităților de măsură' });
  }
});

router.post('/um-conversie', async (req, res) => {
  try {
    const { um1, coef1, um2, coef2 } = req.body;
    
    if (!um1 || !coef1 || !um2 || !coef2) {
      return res.status(400).json({ error: 'Toate câmpurile sunt obligatorii' });
    }

    await db().run(
      'INSERT INTO um_conversie (um1, coef1, um2, coef2) VALUES (?, ?, ?, ?)',
      [um1, coef1, um2, coef2]
    );

    res.json({ success: true, message: 'Unitate de măsură adăugată cu succes' });
  } catch (error) {
    logger.error('Add UM error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.put('/um-conversie/:id', async (req, res) => {
  try {
    const { um1, coef1, um2, coef2 } = req.body;
    
    await db().run(
      'UPDATE um_conversie SET um1 = ?, coef1 = ?, um2 = ?, coef2 = ? WHERE id = ?',
      [um1, coef1, um2, coef2, req.params.id]
    );

    res.json({ success: true, message: 'Unitate de măsură actualizată cu succes' });
  } catch (error) {
    logger.error('Update UM error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.delete('/um-conversie/:id', async (req, res) => {
  try {
    await db().run('DELETE FROM um_conversie WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Unitate de măsură ștearsă cu succes' });
  } catch (error) {
    logger.error('Delete UM error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Helper function for UM conversion
router.get('/um-conversie/convert/:value/:fromUM/:toUM', async (req, res) => {
  try {
    const { value, fromUM, toUM } = req.params;
    
    // Find conversion factor
    const conversion = await db().get(`
      SELECT coef1, coef2, um1, um2 FROM um_conversie 
      WHERE (um1 = ? AND um2 = ?) OR (um1 = ? AND um2 = ?)
    `, [fromUM, toUM, toUM, fromUM]);

    if (!conversion) {
      return res.status(404).json({ error: 'Conversie nu a fost găsită' });
    }

    let convertedValue;
    if (conversion.um1 === fromUM && conversion.um2 === toUM) {
      convertedValue = parseFloat(value) * conversion.coef1;
    } else {
      convertedValue = parseFloat(value) * conversion.coef2;
    }

    res.json({ 
      originalValue: parseFloat(value),
      originalUM: fromUM,
      convertedValue: Math.round(convertedValue * 1000) / 1000,
      convertedUM: toUM
    });
  } catch (error) {
    logger.error('UM conversion error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ===== CATEGORII POS (listă fixă pentru toate tab-urile) =====
router.get('/categorii-pos', (req, res) => {
  res.json(['TOATE', ...LISTA_CATEGORII_POS, 'Altele']);
});

// ===== PRODUSE POS CU 3 PRETURI =====
router.get('/produse-pos', async (req, res) => {
  try {
    const { dept, grupa } = req.query;
    let query = 'SELECT * FROM produse_pos WHERE status = 1';
    const params = [];

    if (dept) {
      query += ' AND dept = ?';
      params.push(dept);
    }

    query += ' ORDER BY den_prod';
    let produse = await db().all(query, params);

    // Mapare grupa + compatibilitate dep -> dept (tabele create de import)
    produse = produse.map(p => {
      if (p.dept === undefined && p.dep !== undefined) p.dept = p.dep;
      return { ...p, grupa: getCategoriePos(p.den_prod, p.grupa) };
    });

    if (grupa) {
      produse = produse.filter(p => p.grupa === grupa);
    }

    res.json(produse);
  } catch (error) {
    logger.error('Produse POS error:', error);
    res.status(500).json({ error: 'Eroare la preluarea produselor POS' });
  }
});

router.get('/produse-pos/categorii', async (req, res) => {
  try {
    const rows = await db().all('SELECT DISTINCT grupa FROM produse_pos WHERE grupa IS NOT NULL AND grupa != "" ORDER BY grupa');
    const dinDb = (rows || []).map(r => r.grupa).filter(Boolean);
    const categorii = [...new Set([...LISTA_CATEGORII_POS, ...dinDb])].sort();
    res.json(categorii);
  } catch (error) {
    logger.error('Categorii POS error:', error);
    res.status(500).json({ error: 'Eroare la preluarea categoriilor' });
  }
});

router.get('/produse-pos/:cod', async (req, res) => {
  try {
    const produs = await db().get(
      'SELECT * FROM produse_pos WHERE cod_prod = ?',
      [req.params.cod]
    );

    if (!produs) {
      return res.status(404).json({ error: 'Produs nu a fost găsit' });
    }

    if (produs.dept === undefined && produs.dep !== undefined) {
      produs.dept = produs.dep;
    }
    produs.grupa = getCategoriePos(produs.den_prod, produs.grupa);
    res.json(produs);
  } catch (error) {
    logger.error('Get produs POS error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/produse-pos', async (req, res) => {
  try {
    const { cod_prod, den_prod, dept, grupa, pr_cost, pret1, pret2, pret3, tva, imprimanta, barcod } = req.body;
    
    if (!cod_prod || !den_prod || !pret1) {
      return res.status(400).json({ error: 'Cod produs, denumire și preț1 sunt obligatorii' });
    }

    await db().run(
      `INSERT INTO produse_pos (cod_prod, den_prod, dept, grupa, pr_cost, pret1, pret2, pret3, tva, imprimanta, barcod)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [cod_prod, den_prod, dept, grupa, pr_cost || 0, pret1, pret2 || 0, pret3 || 0, tva || 1.11, imprimanta, barcod]
    );

    res.json({ success: true, message: 'Produs POS adăugat cu succes' });
  } catch (error) {
    logger.error('Add produs POS error:', error);
    res.status(500).json({ error: error.message });
  }
});

function parseNum(v) {
  if (v === undefined || v === null || v === '') return null;
  const n = Number(v);
  return Number.isNaN(n) ? null : n;
}

router.put('/produse-pos/:cod', async (req, res) => {
  try {
    const { cod } = req.params;
    const { den_prod, dept, grupa, pr_cost, pret1, pret2, pret3, tva, imprimanta, barcod } = req.body;

    const produs = await db().get('SELECT cod_prod FROM produse_pos WHERE cod_prod = ?', [cod]);
    if (!produs) {
      return res.status(404).json({ error: 'Produs nu a fost găsit' });
    }

    const deptNum = parseNum(dept);
    if (deptNum != null) {
      const deptRow = await db().get('SELECT id FROM departamente WHERE id = ? AND active = 1', [deptNum]);
      if (!deptRow) {
        return res.status(400).json({ error: 'Departament invalid. Alegeți un departament din listă.' });
      }
    }

    const params = [
      den_prod || undefined,
      deptNum,
      grupa !== undefined && grupa !== '' ? grupa : undefined,
      parseNum(pr_cost),
      parseNum(pret1),
      parseNum(pret2),
      parseNum(pret3),
      parseNum(tva),
      imprimanta !== undefined && imprimanta !== '' ? imprimanta : undefined,
      barcod !== undefined && barcod !== '' ? barcod : undefined,
      cod
    ];

    await db().run(
      `UPDATE produse_pos SET 
        den_prod = COALESCE(?, den_prod),
        dept = COALESCE(?, dept),
        grupa = COALESCE(?, grupa),
        pr_cost = COALESCE(?, pr_cost),
        pret1 = COALESCE(?, pret1),
        pret2 = COALESCE(?, pret2),
        pret3 = COALESCE(?, pret3),
        tva = COALESCE(?, tva),
        imprimanta = COALESCE(?, imprimanta),
        barcod = COALESCE(?, barcod)
       WHERE cod_prod = ?`,
      params
    );

    res.json({ success: true, message: 'Produs actualizat cu succes' });
  } catch (error) {
    logger.error('Update produs POS error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/produse-pos/:cod/preturi', async (req, res) => {
  try {
    const produs = await db().get(
      'SELECT cod_prod, den_prod, pret1, pret2, pret3, tva FROM produse_pos WHERE cod_prod = ?',
      [req.params.cod]
    );
    
    if (!produs) {
      return res.status(404).json({ error: 'Produs nu a fost găsit' });
    }
    
    res.json({
      cod_prod: produs.cod_prod,
      denumire: produs.den_prod,
      preturi: {
        pret1: produs.pret1,
        pret2: produs.pret2,
        pret3: produs.pret3
      },
      tva: produs.tva
    });
  } catch (error) {
    logger.error('Get preturi POS error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ===== BONURI ISTORIC =====
router.get('/bonuri-istoric', async (req, res) => {
  try {
    const { data_start, data_end, nr_masa, nr_ospatar } = req.query;
    let query = 'SELECT * FROM bonuri_istoric WHERE 1=1';
    const params = [];

    if (data_start) {
      query += ' AND data >= ?';
      params.push(data_start);
    }
    
    if (data_end) {
      query += ' AND data <= ?';
      params.push(data_end);
    }
    
    if (nr_masa) {
      query += ' AND nr_masa = ?';
      params.push(nr_masa);
    }
    
    if (nr_ospatar) {
      query += ' AND nr_ospatar = ?';
      params.push(nr_ospatar);
    }

    query += ' ORDER BY id DESC';
    
    const bonuri = await db().all(query, params);
    res.json(bonuri);
  } catch (error) {
    logger.error('Bonuri istoric error:', error);
    res.status(500).json({ error: 'Eroare la preluarea bonurilor istorice' });
  }
});

router.get('/bonuri-istoric/statistici', async (req, res) => {
  try {
    const stats = await db().get(`
      SELECT 
        COUNT(*) as total_bonuri,
        SUM(total) as total_vanzari,
        AVG(total) as media_bon,
        SUM(tva) as total_tva,
        SUM(discount) as total_discount
      FROM bonuri_istoric
    `);
    res.json(stats);
  } catch (error) {
    logger.error('Bonuri statistici error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ===== COMENZI ISTORIC =====
router.get('/comenzi-istoric', async (req, res) => {
  try {
    const { data_start, data_end, nr_masa, nr_osp } = req.query;
    let query = 'SELECT * FROM comenzi_istoric WHERE 1=1';
    const params = [];

    if (data_start) {
      query += ' AND data >= ?';
      params.push(data_start);
    }
    
    if (data_end) {
      query += ' AND data <= ?';
      params.push(data_end);
    }
    
    if (nr_masa) {
      query += ' AND nr_masa = ?';
      params.push(nr_masa);
    }
    
    if (nr_osp) {
      query += ' AND nr_osp = ?';
      params.push(nr_osp);
    }

    query += ' ORDER BY id DESC';
    
    const comenzi = await db().all(query, params);
    res.json(comenzi);
  } catch (error) {
    logger.error('Comenzi istoric error:', error);
    res.status(500).json({ error: 'Eroare la preluarea comenzilor istorice' });
  }
});

router.get('/comenzi-istoric/produs/:cod_prod', async (req, res) => {
  try {
    const comenzi = await db().all(`
      SELECT * FROM comenzi_istoric 
      WHERE cod_prod = ?
      ORDER BY id DESC
    `, [req.params.cod_prod]);
    res.json(comenzi);
  } catch (error) {
    logger.error('Comenzi istoric produs error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ===== RAPOARTE STOCURI =====
// Returnează cod (fallback la id când e gol) și um (fallback la materii_prime.um când e gol) pentru afișare corectă în tabel
router.get('/rapoarte-stocuri', async (req, res) => {
  try {
    const { cod, denumire, data } = req.query;
    let query = `
      SELECT r.id,
             COALESCE(NULLIF(TRIM(CAST(r.cod AS TEXT)), ''), r.id) AS cod,
             r.denumire,
             r.car1, r.car2, r.car3,
             COALESCE(NULLIF(TRIM(r.um), ''), m.um) AS um,
             r.num1, r.num2, r.num3, r.num4, r.num5, r.num6, r.num7, r.num8,
             r.data
      FROM rapoarte_stocuri r
      LEFT JOIN materii_prime m ON m.denumire = r.denumire
      WHERE 1=1
    `;
    const params = [];

    if (cod) {
      query += ' AND (r.cod = ? OR r.id = ?)';
      params.push(cod, cod);
    }
    
    if (denumire) {
      query += ' AND r.denumire LIKE ?';
      params.push(`%${denumire}%`);
    }
    
    if (data) {
      query += ' AND r.data = ?';
      params.push(data);
    }

    query += ' ORDER BY r.data DESC, r.denumire';
    
    const rapoarte = await db().all(query, params);
    res.json(rapoarte);
  } catch (error) {
    logger.error('Rapoarte stocuri error:', error);
    res.status(500).json({ error: 'Eroare la preluarea rapoartelor stocuri' });
  }
});

router.get('/rapoarte-stocuri/perioade/:cod', async (req, res) => {
  try {
    const raport = await db().get(`
      SELECT cod, denumire, um, num1, num2, num3, num4, num5, num6, num7, num8, data
      FROM rapoarte_stocuri 
      WHERE cod = ?
      ORDER BY data DESC
      LIMIT 1
    `, [req.params.cod]);
    
    if (!raport) {
      return res.status(404).json({ error: 'Raport nu a fost găsit' });
    }
    
    res.json({
      cod: raport.cod,
      denumire: raport.denumire,
      um: raport.um,
      perioade: {
        perioada1: raport.num1,
        perioada2: raport.num2,
        perioada3: raport.num3,
        perioada4: raport.num4,
        perioada5: raport.num5,
        perioada6: raport.num6,
        perioada7: raport.num7,
        perioada8: raport.num8
      },
      data: raport.data
    });
  } catch (error) {
    logger.error('Rapoarte perioade error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ===== MATERIALE CU COST =====
router.get('/material-cost', async (req, res) => {
  try {
    const { grupa } = req.query;
    let query = 'SELECT * FROM material_cost WHERE 1=1';
    const params = [];

    if (grupa) {
      query += ' AND grupa = ?';
      params.push(grupa);
    }

    query += ' ORDER BY denumire';
    
    const materiale = await db().all(query, params);
    res.json(materiale);
  } catch (error) {
    logger.error('Material cost error:', error);
    res.status(500).json({ error: 'Eroare la preluarea materialelor cu cost' });
  }
});

router.get('/material-cost/:cod', async (req, res) => {
  try {
    const material = await db().get(
      'SELECT * FROM material_cost WHERE cod = ?',
      [req.params.cod]
    );
    
    if (!material) {
      return res.status(404).json({ error: 'Material nu a fost găsit' });
    }
    
    res.json(material);
  } catch (error) {
    logger.error('Get material cost error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ===== CONFIGURARE SISTEM =====
router.get('/config-sistem', async (req, res) => {
  try {
    const config = await db().get('SELECT * FROM config_sistem LIMIT 1');
    res.json(config || {});
  } catch (error) {
    logger.error('Config sistem error:', error);
    res.status(500).json({ error: 'Eroare la preluarea configurării sistemului' });
  }
});

router.put('/config-sistem', async (req, res) => {
  try {
    const { denumire, cui, adresa, cont, banca, fifo, lifo, mediu } = req.body;
    
    // Check if config exists
    const existing = await db().get('SELECT id FROM config_sistem LIMIT 1');
    
    if (existing) {
      await db().run(
        `UPDATE config_sistem SET 
         denumire = ?, cui = ?, adresa = ?, cont = ?, banca = ?, fifo = ?, lifo = ?, mediu = ?
         WHERE id = ?`,
        [denumire, cui, adresa, cont, banca, fifo || 1, lifo || 0, mediu || 0, existing.id]
      );
    } else {
      await db().run(
        `INSERT INTO config_sistem (denumire, cui, adresa, cont, banca, fifo, lifo, mediu)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [denumire, cui, adresa, cont, banca, fifo || 1, lifo || 0, mediu || 0]
      );
    }

    res.json({ success: true, message: 'Configurare sistem actualizată cu succes' });
  } catch (error) {
    logger.error('Update config sistem error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/config-sistem/metoda-evaluare', async (req, res) => {
  try {
    const config = await db().get('SELECT fifo, lifo, mediu FROM config_sistem LIMIT 1');
    
    if (!config) {
      return res.json({ metoda: 'FIFO' }); // default
    }
    
    let metoda = 'FIFO'; // default
    if (config.lifo === 1) metoda = 'LIFO';
    else if (config.mediu === 1) metoda = 'MEDIU';
    
    res.json({ 
      metoda,
      fifo: config.fifo,
      lifo: config.lifo,
      mediu: config.mediu
    });
  } catch (error) {
    logger.error('Config metoda error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;