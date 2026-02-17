import express from 'express';
import { getDatabase } from '../../database/init-db.js';
import { logger } from '../../utils/logger.js';

const router = express.Router();
const db = () => getDatabase();

// ===== COMENZI DELIVERY =====

// Toate comenzile delivery cu filtrare
router.get('/comenzi', async (req, res) => {
  try {
    const { status, platforma, curier_id, data_start, data_end, limit = 50 } = req.query;
    
    let query = `
      SELECT cd.*, c.nume as curier_nume, c.telefon as curier_telefon, 
             zl.nume_zona, zl.taxa_livrare as zona_taxa
      FROM comenzi_delivery cd
      LEFT JOIN curieri c ON cd.curier_id = c.id
      LEFT JOIN zone_livrare zl ON cd.zona_id = zl.id
      WHERE 1=1
    `;
    const params = [];
    
    if (status) {
      query += ' AND cd.status = ?';
      params.push(status);
    }
    
    if (platforma) {
      query += ' AND cd.platforma = ?';
      params.push(platforma);
    }
    
    if (curier_id) {
      query += ' AND cd.curier_id = ?';
      params.push(curier_id);
    }
    
    if (data_start) {
      query += ' AND DATE(cd.created_at) >= ?';
      params.push(data_start);
    }
    
    if (data_end) {
      query += ' AND DATE(cd.created_at) <= ?';
      params.push(data_end);
    }
    
    query += ' ORDER BY cd.created_at DESC LIMIT ?';
    params.push(parseInt(limit));
    
    const comenzi = await db().all(query, params);
    
    // Pentru fiecare comandă, obține și produsele
    for (let comanda of comenzi) {
      const produse = await db().all(`
        SELECT * FROM comenzi_delivery_produse 
        WHERE comanda_delivery_id = ?
      `, [comanda.id]);
      comanda.produse = produse;
    }
    
    res.json(comenzi);
  } catch (error) {
    logger.error('Get delivery orders error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Comandă delivery specifică
router.get('/comenzi/:id', async (req, res) => {
  try {
    const comanda = await db().get(`
      SELECT cd.*, c.nume as curier_nume, c.telefon as curier_telefon,
             zl.nume_zona, zl.taxa_livrare as zona_taxa
      FROM comenzi_delivery cd
      LEFT JOIN curieri c ON cd.curier_id = c.id
      LEFT JOIN zone_livrare zl ON cd.zona_id = zl.id
      WHERE cd.id = ?
    `, [req.params.id]);
    
    if (!comanda) {
      return res.status(404).json({ error: 'Comanda nu a fost găsită' });
    }
    
    // Obține produsele
    const produse = await db().all(`
      SELECT * FROM comenzi_delivery_produse 
      WHERE comanda_delivery_id = ?
    `, [req.params.id]);
    
    comanda.produse = produse;
    
    // Obține istoricul dacă există
    const istoric = await db().get(`
      SELECT * FROM istoric_livrari 
      WHERE comanda_delivery_id = ?
    `, [req.params.id]);
    
    if (istoric) {
      comanda.istoric_livrare = istoric;
    }
    
    res.json(comanda);
  } catch (error) {
    logger.error('Get delivery order error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Crează comandă delivery nouă
router.post('/comenzi', async (req, res) => {
  try {
    const {
      nume_client, telefon_client, email_client,
      adresa, oras, cod_postal, zona_id,
      produse, metoda_plata, observatii, platforma = 'telefonic'
    } = req.body;
    
    if (!nume_client || !telefon_client || !adresa || !produse || produse.length === 0) {
      return res.status(400).json({ 
        error: 'Nume client, telefon, adresă și produse sunt obligatorii' 
      });
    }
    
    // Calculează total
    let subtotal = 0;
    for (const produs of produse) {
      subtotal += produs.cantitate * produs.pret_unitar;
    }
    
    // Obține taxa de livrare din zona
    let taxa_livrare = 0;
    if (zona_id) {
      const zona = await db().get('SELECT taxa_livrare FROM zone_livrare WHERE id = ?', [zona_id]);
      if (zona) taxa_livrare = zona.taxa_livrare;
    }
    
    const total = subtotal + taxa_livrare;
    const nr_comanda = `DLV${Date.now()}`;
    
    // Estimează timpul de livrare (30min + 5min per produs)
    const timp_estimat = new Date(Date.now() + (30 + produse.length * 5) * 60 * 1000);
    
    // Inserează comanda
    const result = await db().run(`
      INSERT INTO comenzi_delivery (
        nr_comanda, nume_client, telefon_client, email_client,
        adresa, oras, cod_postal, zona_id,
        subtotal, taxa_livrare, total, metoda_plata,
        timp_estimat, observatii, platforma
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      nr_comanda, nume_client, telefon_client, email_client,
      adresa, oras || 'Bucuresti', cod_postal, zona_id,
      subtotal, taxa_livrare, total, metoda_plata,
      timp_estimat.toISOString(), observatii, platforma
    ]);
    
    const comanda_id = result.lastID;
    
    // Inserează produsele
    for (const produs of produse) {
      await db().run(`
        INSERT INTO comenzi_delivery_produse (
          comanda_delivery_id, cod_produs, denumire_produs, cantitate,
          pret_unitar, modificatori, observatii, valoare
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        comanda_id, produs.cod_produs, produs.denumire_produs, produs.cantitate,
        produs.pret_unitar, JSON.stringify(produs.modificatori || {}), 
        produs.observatii, produs.cantitate * produs.pret_unitar
      ]);
    }
    
    // Întoarce comanda creată
    const comandaNoua = await db().get(`
      SELECT * FROM comenzi_delivery WHERE id = ?
    `, [comanda_id]);
    
    logger.info(`Comandă delivery creată: ${nr_comanda} pentru ${nume_client}`);
    
    res.status(201).json({ success: true, comanda: comandaNoua });
  } catch (error) {
    logger.error('Create delivery order error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Actualizează status comandă
router.put('/comenzi/:id/status', async (req, res) => {
  try {
    const { status, curier_id, observatii } = req.body;
    const comandaId = req.params.id;
    
    const validStatuses = ['nou', 'confirmat', 'in_preparare', 'gata_livrare', 'in_livrare', 'livrat', 'anulat'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Status invalid' });
    }
    
    // Actualizează timestamp-urile corespunzătoare
    let updateFields = ['status = ?', 'updated_at = CURRENT_TIMESTAMP'];
    let params = [status];
    
    if (status === 'confirmat') {
      updateFields.push('timp_confirmare = CURRENT_TIMESTAMP');
    } else if (status === 'gata_livrare') {
      updateFields.push('timp_pregatire = CURRENT_TIMESTAMP');
    } else if (status === 'in_livrare') {
      updateFields.push('timp_ridicare = CURRENT_TIMESTAMP');
    } else if (status === 'livrat') {
      updateFields.push('timp_livrare = CURRENT_TIMESTAMP');
    }
    
    if (curier_id) {
      updateFields.push('curier_id = ?');
      params.push(curier_id);
    }
    
    if (observatii) {
      updateFields.push('observatii = ?');
      params.push(observatii);
    }
    
    params.push(comandaId);
    
    await db().run(`
      UPDATE comenzi_delivery 
      SET ${updateFields.join(', ')}
      WHERE id = ?
    `, params);
    
    // Dacă comanda este livrată, creează istoric
    if (status === 'livrat') {
      const comanda = await db().get('SELECT * FROM comenzi_delivery WHERE id = ?', [comandaId]);
      if (comanda && comanda.curier_id && comanda.timp_ridicare) {
        const durata = Math.round((new Date() - new Date(comanda.timp_ridicare)) / 60000); // minute
        
        await db().run(`
          INSERT INTO istoric_livrari (
            comanda_delivery_id, curier_id, timp_ridicare, timp_livrare, durata_livrare_min
          ) VALUES (?, ?, ?, CURRENT_TIMESTAMP, ?)
        `, [comandaId, comanda.curier_id, comanda.timp_ridicare, durata]);
        
        // Actualizează statistici curier
        await db().run(`
          UPDATE curieri 
          SET comenzi_livrate = comenzi_livrate + 1, status = 'disponibil'
          WHERE id = ?
        `, [comanda.curier_id]);
      }
    }
    
    const comandaActualizata = await db().get('SELECT * FROM comenzi_delivery WHERE id = ?', [comandaId]);
    
    res.json({ success: true, comanda: comandaActualizata });
  } catch (error) {
    logger.error('Update delivery status error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ===== CURIERI =====

// Toți curierii
router.get('/curieri', async (req, res) => {
  try {
    const { status, activ } = req.query;
    
    let query = `
      SELECT c.*, zl.nume_zona
      FROM curieri c
      LEFT JOIN zone_livrare zl ON c.zona_principala = zl.id
      WHERE 1=1
    `;
    const params = [];
    
    if (status) {
      query += ' AND c.status = ?';
      params.push(status);
    }
    
    if (activ !== undefined) {
      query += ' AND c.activ = ?';
      params.push(activ);
    }
    
    query += ' ORDER BY c.nume';
    
    const curieri = await db().all(query, params);
    
    // Pentru fiecare curier, calculează statistici
    for (let curier of curieri) {
      const stats = await db().get(`
        SELECT 
          COUNT(*) as comenzi_active,
          AVG(rating_curier) as rating_mediu,
          AVG(durata_livrare_min) as timp_mediu_livrare
        FROM istoric_livrari 
        WHERE curier_id = ? AND timp_livrare >= date('now', '-30 days')
      `, [curier.id]);
      
      curier.statistici = stats;
    }
    
    res.json(curieri);
  } catch (error) {
    logger.error('Get couriers error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Adaugă curier nou
router.post('/curieri', async (req, res) => {
  try {
    const { nume, telefon, vehicul, numar_vehicul, zona_principala } = req.body;
    
    if (!nume || !telefon || !vehicul) {
      return res.status(400).json({ error: 'Nume, telefon și vehicul sunt obligatorii' });
    }
    
    const result = await db().run(`
      INSERT INTO curieri (nume, telefon, vehicul, numar_vehicul, zona_principala)
      VALUES (?, ?, ?, ?, ?)
    `, [nume, telefon, vehicul, numar_vehicul, zona_principala]);
    
    const curier = await db().get('SELECT * FROM curieri WHERE id = ?', [result.lastID]);
    
    res.status(201).json({ success: true, curier });
  } catch (error) {
    logger.error('Add courier error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Actualizează status curier
router.put('/curieri/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['disponibil', 'ocupat', 'pauza', 'offline'];
    
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Status invalid' });
    }
    
    await db().run('UPDATE curieri SET status = ? WHERE id = ?', [status, req.params.id]);
    
    const curier = await db().get('SELECT * FROM curieri WHERE id = ?', [req.params.id]);
    res.json({ success: true, curier });
  } catch (error) {
    logger.error('Update courier status error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ===== ZONE LIVRARE =====

// Toate zonele de livrare
router.get('/zone', async (req, res) => {
  try {
    const zone = await db().all(`
      SELECT zl.*, COUNT(cd.id) as comenzi_active
      FROM zone_livrare zl
      LEFT JOIN comenzi_delivery cd ON zl.id = cd.zona_id 
        AND cd.status IN ('nou', 'confirmat', 'in_preparare', 'gata_livrare', 'in_livrare')
      WHERE zl.activa = 1
      GROUP BY zl.id
      ORDER BY zl.nume_zona
    `);
    
    res.json(zone);
  } catch (error) {
    logger.error('Get delivery zones error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Adaugă zonă de livrare
router.post('/zone', async (req, res) => {
  try {
    const { nume_zona, descriere, raza_km, taxa_livrare, timp_estimat_min } = req.body;
    
    if (!nume_zona || !raza_km || taxa_livrare === undefined) {
      return res.status(400).json({ error: 'Nume zonă, rază și taxă sunt obligatorii' });
    }
    
    const result = await db().run(`
      INSERT INTO zone_livrare (nume_zona, descriere, raza_km, taxa_livrare, timp_estimat_min)
      VALUES (?, ?, ?, ?, ?)
    `, [nume_zona, descriere, raza_km, taxa_livrare, timp_estimat_min || 30]);
    
    const zona = await db().get('SELECT * FROM zone_livrare WHERE id = ?', [result.lastID]);
    
    res.status(201).json({ success: true, zona });
  } catch (error) {
    logger.error('Add delivery zone error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ===== STATISTICI ȘI RAPOARTE =====

// Dashboard delivery
router.get('/dashboard', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // Statistici pentru ziua curentă
    const stats = await db().get(`
      SELECT 
        COUNT(*) as total_comenzi,
        COUNT(CASE WHEN status = 'livrat' THEN 1 END) as comenzi_livrate,
        COUNT(CASE WHEN status IN ('nou', 'confirmat', 'in_preparare', 'gata_livrare', 'in_livrare') THEN 1 END) as comenzi_active,
        COUNT(CASE WHEN status = 'anulat' THEN 1 END) as comenzi_anulate,
        COALESCE(SUM(CASE WHEN status = 'livrat' THEN total ELSE 0 END), 0) as vanzari_livrate,
        COALESCE(AVG(CASE WHEN status = 'livrat' THEN total END), 0) as valoare_medie_comanda
      FROM comenzi_delivery 
      WHERE DATE(created_at) = ?
    `, [today]);
    
    // Curieri activi
    const curieriActivi = await db().get(`
      SELECT COUNT(*) as curieri_activi
      FROM curieri 
      WHERE status IN ('disponibil', 'ocupat') AND activ = 1
    `);
    
    // Timp mediu de livrare
    const timpMediu = await db().get(`
      SELECT AVG(durata_livrare_min) as timp_mediu_livrare_min
      FROM istoric_livrari 
      WHERE DATE(timp_livrare) = ?
    `, [today]);
    
    // Top curieri
    const topCurieri = await db().all(`
      SELECT c.nume, COUNT(*) as comenzi_livrate_azi
      FROM curieri c
      JOIN istoric_livrari il ON c.id = il.curier_id
      WHERE DATE(il.timp_livrare) = ?
      GROUP BY c.id, c.nume
      ORDER BY comenzi_livrate_azi DESC
      LIMIT 5
    `, [today]);
    
    res.json({
      date: today,
      statistici: {
        ...stats,
        ...curieriActivi,
        timp_mediu_livrare_min: Math.round(timpMediu.timp_mediu_livrare_min || 0)
      },
      top_curieri: topCurieri
    });
  } catch (error) {
    logger.error('Delivery dashboard error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ===== PLATFORME EXTERNE =====

// Configurări platforme
router.get('/platforme', async (req, res) => {
  try {
    const platforme = await db().all('SELECT * FROM platforme_delivery ORDER BY nume');
    res.json(platforme);
  } catch (error) {
    logger.error('Get platforms error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Webhook pentru platforme externe (ex: Tazz, Glovo)
router.post('/webhook/:platforma', async (req, res) => {
  try {
    const { platforma } = req.params;
    const webhookData = req.body;
    
    logger.info(`Webhook received from ${platforma}:`, webhookData);
    
    // Procesează webhook-ul în funcție de platformă
    // Aici ar fi logica specifică pentru fiecare platformă
    
    res.json({ success: true, message: 'Webhook processed' });
  } catch (error) {
    logger.error('Webhook processing error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;