import express from 'express';
import rateLimit from 'express-rate-limit';
import { getDatabase } from '../../database/init-db.js';
import { logger } from '../../utils/logger.js';
import { detecteazaAlergeni, getAlergeniDetalii, getAlergeniReteta, ALERGENI_EU, ADITIVI_COMUNI } from '../../utils/alergeni-detectie.js';

const router = express.Router();
const db = () => getDatabase();

// Apply rate limiting to all logistica routes
router.use(logisticaLimiter);

const logisticaLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: { ok: false, error: 'Prea multe cereri.' }
});

// ===== ALERGENI =====

/** Returnează lista celor 14 alergeni EU */
router.get('/alergeni-eu', (req, res) => {
  res.json(ALERGENI_EU);
});

/** Detectare automată alergeni pentru un ingredient după denumire */
router.get('/alergeni-detectie', (req, res) => {
  const { denumire } = req.query;
  if (!denumire) return res.json([]);
  res.json(getAlergeniDetalii(denumire));
});

/** Alergeni per ingredient (materie primă) */
router.get('/alergeni/:cod_material', logisticaLimiter, async (req, res) => {
  try {
    const rows = await db().all(
      'SELECT * FROM ingrediente_alergeni WHERE cod_material = ?',
      [req.params.cod_material]
    );
    res.json(rows);
  } catch (e) {
    logger.error('Alergeni get:', e);
    res.status(500).json({ error: e.message });
  }
});

/** Salvează alergenii unui ingredient (înlocuire completă) */
router.post('/alergeni/:cod_material', logisticaLimiter, async (req, res) => {
  const { cod_material } = req.params;
  const { alergeni } = req.body;
  if (!Array.isArray(alergeni)) return res.status(400).json({ error: 'alergeni trebuie să fie array' });
  try {
    await db().run('DELETE FROM ingrediente_alergeni WHERE cod_material = ?', [cod_material]);
    for (const cod_alergen of alergeni) {
      await db().run(
        'INSERT OR IGNORE INTO ingrediente_alergeni (cod_material, cod_alergen, confirmat) VALUES (?, ?, 1)',
        [cod_material, cod_alergen]
      );
    }
    res.json({ success: true });
  } catch (e) {
    logger.error('Alergeni save:', e);
    res.status(500).json({ error: e.message });
  }
});

// ===== ADITIVI =====

/** Returnează lista aditivilor comuni */
router.get('/aditivi-comuni', (req, res) => {
  res.json(ADITIVI_COMUNI);
});

/** Aditivi per ingredient */
router.get('/aditivi/:cod_material', logisticaLimiter, async (req, res) => {
  try {
    const rows = await db().all(
      'SELECT * FROM ingrediente_aditivi WHERE cod_material = ?',
      [req.params.cod_material]
    );
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/** Salvează aditivii unui ingredient */
router.post('/aditivi/:cod_material', logisticaLimiter, async (req, res) => {
  const { cod_material } = req.params;
  const { aditivi } = req.body;
  if (!Array.isArray(aditivi)) return res.status(400).json({ error: 'aditivi trebuie să fie array' });
  try {
    await db().run('DELETE FROM ingrediente_aditivi WHERE cod_material = ?', [cod_material]);
    for (const a of aditivi) {
      await db().run(
        'INSERT OR IGNORE INTO ingrediente_aditivi (cod_material, cod_aditiv, denumire_aditiv, cantitate) VALUES (?, ?, ?, ?)',
        [cod_material, a.cod_aditiv, a.denumire_aditiv, a.cantitate || null]
      );
    }
    res.json({ success: true });
  } catch (e) {
    logger.error('Aditivi save:', e);
    res.status(500).json({ error: e.message });
  }
});

// ===== SUB-REȚETE =====

router.get('/sub-retete', logisticaLimiter, async (req, res) => {
  try {
    const rows = await db().all('SELECT * FROM sub_retete WHERE activ = 1 ORDER BY denumire');
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/sub-retete/:cod', logisticaLimiter, async (req, res) => {
  try {
    const header = await db().get('SELECT * FROM sub_retete WHERE cod_sub_ret = ?', [req.params.cod]);
    if (!header) return res.status(404).json({ error: 'Sub-rețetă negăsită' });
    const ingrediente = await db().all(
      `SELECT sri.*, mp.denumire as denumire_material, mp.um as um_stoc
       FROM sub_retete_ingrediente sri
       LEFT JOIN materii_prime mp ON mp.cod = sri.cod_mat
       WHERE sri.cod_sub_ret = ?
       ORDER BY sri.id`,
      [req.params.cod]
    );
    res.json({ ...header, ingrediente });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/sub-retete', logisticaLimiter, async (req, res) => {
  const { denumire, um, cantitate_rezultata, gestiune_id, nota } = req.body;
  if (!denumire) return res.status(400).json({ error: 'Denumirea este obligatorie' });
  try {
    const maxCod = await db().get('SELECT COALESCE(MAX(cod_sub_ret), 0) as max_cod FROM sub_retete');
    const cod = maxCod.max_cod + 1;
    await db().run(
      'INSERT INTO sub_retete (cod_sub_ret, denumire, um, cantitate_rezultata, gestiune_id, nota) VALUES (?, ?, ?, ?, ?, ?)',
      [cod, denumire, um || 'portie', cantitate_rezultata || 1, gestiune_id || 2, nota || null]
    );
    res.json({ success: true, cod_sub_ret: cod });
  } catch (e) {
    logger.error('Sub-retete POST:', e);
    res.status(500).json({ error: e.message });
  }
});

router.put('/sub-retete/:cod', logisticaLimiter, async (req, res) => {
  const { denumire, um, cantitate_rezultata, gestiune_id, nota } = req.body;
  try {
    await db().run(
      'UPDATE sub_retete SET denumire=?, um=?, cantitate_rezultata=?, gestiune_id=?, nota=? WHERE cod_sub_ret=?',
      [denumire, um, cantitate_rezultata, gestiune_id, nota, req.params.cod]
    );
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.delete('/sub-retete/:cod', logisticaLimiter, async (req, res) => {
  try {
    await db().run('UPDATE sub_retete SET activ=0 WHERE cod_sub_ret=?', [req.params.cod]);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/sub-retete/:cod/ingrediente', logisticaLimiter, async (req, res) => {
  const { cod_mat, denumire, cant, um } = req.body;
  if (!cod_mat || !cant) return res.status(400).json({ error: 'cod_mat și cant sunt obligatorii' });
  try {
    await db().run(
      'INSERT INTO sub_retete_ingrediente (cod_sub_ret, cod_mat, denumire, cant, um) VALUES (?, ?, ?, ?, ?)',
      [req.params.cod, cod_mat, denumire, cant, um || 'grame']
    );
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.delete('/sub-retete-ingrediente/:id', logisticaLimiter, async (req, res) => {
  try {
    await db().run('DELETE FROM sub_retete_ingrediente WHERE id=?', [req.params.id]);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ===== FIȘE TEHNICE =====

router.get('/fise-tehnice', logisticaLimiter, async (req, res) => {
  try {
    const rows = await db().all(
      `SELECT ft.*, p.den_prod
       FROM fise_tehnice ft
       LEFT JOIN produse_pos p ON p.cod_prod = ft.cod_produs
       ORDER BY ft.denumire_produs`
    );
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/fise-tehnice/:cod_produs', logisticaLimiter, async (req, res) => {
  try {
    const fisa = await db().get('SELECT * FROM fise_tehnice WHERE cod_produs = ?', [req.params.cod_produs]);
    if (!fisa) return res.json(null);

    // Adaugă rețeta
    const reteta = await db().all(
      `SELECT r.*, mp.denumire as denumire_material, mp.um as um_stoc
       FROM retete r
       LEFT JOIN materii_prime mp ON mp.cod = r.cod_mat
       WHERE r.cod_ret = ?
       ORDER BY r.id`,
      [req.params.cod_produs]
    );

    // Detectează alergeni din toate ingredientele
    const denumiriIngrediente = reteta.map(r => r.denumire_material || r.denumire);
    const alergeni = getAlergeniReteta(denumiriIngrediente);

    res.json({ ...fisa, reteta, alergeni });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/fise-tehnice', logisticaLimiter, async (req, res) => {
  const { cod_produs, denumire_produs, descriere, mod_preparare, conditii_pastrare,
    temperatura_servire, termen_valabilitate, valoare_energetica_kcal,
    proteine_g, grasimi_g, carbohidrati_g, fibre_g, sare_g, portie_g, observatii } = req.body;
  if (!cod_produs || !denumire_produs) return res.status(400).json({ error: 'cod_produs și denumire_produs sunt obligatorii' });
  try {
    await db().run(
      `INSERT OR REPLACE INTO fise_tehnice 
       (cod_produs, denumire_produs, descriere, mod_preparare, conditii_pastrare, temperatura_servire,
        termen_valabilitate, valoare_energetica_kcal, proteine_g, grasimi_g, carbohidrati_g, fibre_g, sare_g, portie_g, observatii, data_versiune)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      [cod_produs, denumire_produs, descriere, mod_preparare, conditii_pastrare, temperatura_servire,
        termen_valabilitate, valoare_energetica_kcal, proteine_g, grasimi_g, carbohidrati_g, fibre_g, sare_g, portie_g, observatii]
    );
    res.json({ success: true, message: 'Fișa tehnică salvată cu succes' });
  } catch (e) {
    logger.error('Fisa tehnica POST:', e);
    res.status(500).json({ error: e.message });
  }
});

router.delete('/fise-tehnice/:cod_produs', logisticaLimiter, async (req, res) => {
  try {
    await db().run('DELETE FROM fise_tehnice WHERE cod_produs=?', [req.params.cod_produs]);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ===== HACCP =====

router.get('/haccp-checklist', logisticaLimiter, async (req, res) => {
  try {
    const rows = await db().all('SELECT * FROM haccp_checklist WHERE activ=1 ORDER BY categorie, id');
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/haccp-checklist', logisticaLimiter, async (req, res) => {
  const { categorie, punct_control, limita_critica, actiune_corectiva, frecventa, responsabil } = req.body;
  if (!categorie || !punct_control) return res.status(400).json({ error: 'categorie și punct_control sunt obligatorii' });
  try {
    const result = await db().run(
      'INSERT INTO haccp_checklist (categorie, punct_control, limita_critica, actiune_corectiva, frecventa, responsabil) VALUES (?, ?, ?, ?, ?, ?)',
      [categorie, punct_control, limita_critica, actiune_corectiva, frecventa || 'zilnic', responsabil]
    );
    res.json({ success: true, id: result.lastID });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.put('/haccp-checklist/:id', logisticaLimiter, async (req, res) => {
  const { categorie, punct_control, limita_critica, actiune_corectiva, frecventa, responsabil, activ } = req.body;
  try {
    await db().run(
      'UPDATE haccp_checklist SET categorie=?, punct_control=?, limita_critica=?, actiune_corectiva=?, frecventa=?, responsabil=?, activ=? WHERE id=?',
      [categorie, punct_control, limita_critica, actiune_corectiva, frecventa, responsabil, activ ?? 1, req.params.id]
    );
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.delete('/haccp-checklist/:id', logisticaLimiter, async (req, res) => {
  try {
    await db().run('UPDATE haccp_checklist SET activ=0 WHERE id=?', [req.params.id]);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/** Înregistrări HACCP */
router.get('/haccp-inregistrari', logisticaLimiter, async (req, res) => {
  const { data } = req.query;
  try {
    let query = `SELECT hi.*, hc.categorie, hc.punct_control, hc.limita_critica
                 FROM haccp_inregistrari hi
                 JOIN haccp_checklist hc ON hc.id = hi.checklist_id`;
    const params = [];
    if (data) {
      query += ' WHERE DATE(hi.data_control) = ?';
      params.push(data);
    }
    query += ' ORDER BY hi.data_control DESC';
    const rows = await db().all(query, params);
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/haccp-inregistrari', logisticaLimiter, async (req, res) => {
  const { checklist_id, valoare_masurata, conform, actiune_luata, operator, observatii } = req.body;
  if (!checklist_id) return res.status(400).json({ error: 'checklist_id este obligatoriu' });
  try {
    const result = await db().run(
      'INSERT INTO haccp_inregistrari (checklist_id, valoare_masurata, conform, actiune_luata, operator, observatii) VALUES (?, ?, ?, ?, ?, ?)',
      [checklist_id, valoare_masurata, conform ?? 1, actiune_luata, operator, observatii]
    );
    res.json({ success: true, id: result.lastID });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ===== TRASABILITATE =====

router.get('/trasabilitate/:cod_material', logisticaLimiter, async (req, res) => {
  try {
    const miscare = await db().all(
      `SELECT t.*, mp.denumire as denumire_material, g.nume as gestiune_nume, f.denumire as furnizor_name
       FROM trasabilitate t
       LEFT JOIN materii_prime mp ON mp.cod = t.cod_material
       LEFT JOIN gestiuni g ON g.id = t.gestiune_id
       LEFT JOIN furnizori f ON f.id = t.furnizor_id
       WHERE t.cod_material = ?
       ORDER BY t.data_miscare DESC
       LIMIT 200`,
      [req.params.cod_material]
    );
    res.json(miscare);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/** Unde este folosit un ingredient (în ce rețete) */
router.get('/trasabilitate-retete/:cod_material', logisticaLimiter, async (req, res) => {
  try {
    const retete = await db().all(
      `SELECT r.cod_ret, r.cant, r.um, r.gestiune_id, p.den_prod, p.dept, p.pret1
       FROM retete r
       LEFT JOIN produse_pos p ON p.cod_prod = r.cod_ret
       WHERE r.cod_mat = ?
       ORDER BY p.den_prod`,
      [req.params.cod_material]
    );
    res.json(retete);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/** Înregistrare mișcare trasabilitate */
router.post('/trasabilitate', logisticaLimiter, async (req, res) => {
  const { cod_material, tip_miscare, cantitate, um, sursa_id, sursa_tip, gestiune_id, lot, data_expirare, furnizor_id, nota, operator } = req.body;
  if (!cod_material || !tip_miscare || cantitate == null) {
    return res.status(400).json({ error: 'cod_material, tip_miscare și cantitate sunt obligatorii' });
  }
  try {
    await db().run(
      `INSERT INTO trasabilitate (cod_material, tip_miscare, cantitate, um, sursa_id, sursa_tip, gestiune_id, lot, data_expirare, furnizor_id, nota, operator)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [cod_material, tip_miscare, cantitate, um, sursa_id, sursa_tip, gestiune_id, lot, data_expirare, furnizor_id, nota, operator]
    );
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ===== AUTO-COD INGREDIENT =====

/** Generează un cod unic disponibil pentru un ingredient nou */
router.get('/next-cod-ingredient', logisticaLimiter, async (req, res) => {
  try {
    const row = await db().get('SELECT COALESCE(MAX(cod), 0) as max_cod FROM materii_prime');
    res.json({ next_cod: (row.max_cod || 0) + 1 });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ===== CONVERTOR UNITĂȚI MĂSURĂ =====

router.get('/um-conversie', logisticaLimiter, async (req, res) => {
  try {
    const rows = await db().all('SELECT * FROM um_conversie ORDER BY um1');
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/** Convertește o cantitate între două unități */
router.get('/um-conversie/convert', logisticaLimiter, async (req, res) => {
  const { cantitate, um_din, um_spre } = req.query;
  if (!cantitate || !um_din || !um_spre) {
    return res.status(400).json({ error: 'cantitate, um_din și um_spre sunt obligatorii' });
  }
  if (um_din === um_spre) return res.json({ rezultat: parseFloat(cantitate), um: um_spre });
  try {
    // Căutăm conversia directă sau indirectă prin coeficienți
    const conv = await db().get(
      'SELECT * FROM um_conversie WHERE (um1=? AND um2=?) OR (um2=? AND um1=?)',
      [um_din, um_spre, um_din, um_spre]
    );
    if (!conv) return res.json({ rezultat: null, mesaj: `Nu există conversie definită între ${um_din} și ${um_spre}` });
    const cant = parseFloat(cantitate);
    let rezultat;
    if (conv.um1 === um_din) {
      rezultat = cant / conv.coef1;
    } else {
      rezultat = cant / conv.coef2;
    }
    res.json({ rezultat: Math.round(rezultat * 10000) / 10000, um: um_spre });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
