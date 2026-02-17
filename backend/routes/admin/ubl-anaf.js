import express from 'express';
import { getDatabase } from '../../database/init-db.js';
import { logger } from '../../utils/logger.js';
import crypto from 'crypto';

const router = express.Router();
const db = () => getDatabase();

// ===== CONFIGURARE UBL/ANAF =====

// Obține configurarea curentă
router.get('/config', async (req, res) => {
  try {
    const config = await db().get('SELECT * FROM config_ubl ORDER BY id DESC LIMIT 1');
    
    if (config) {
      // Nu returna parolele certificate în plain text
      delete config.anaf_parola_certificat;
    }
    
    res.json(config || {});
  } catch (error) {
    logger.error('Get UBL config error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Actualizează configurarea
router.put('/config', async (req, res) => {
  try {
    const {
      nume_firma, cui, reg_com, adresa_completa, judet, cod_postal,
      telefon, email, cont_bancar, banca,
      anaf_certificat_path, anaf_parola_certificat,
      serie_factura_default, zile_scadenta_default,
      environment
    } = req.body;
    
    if (!nume_firma || !cui || !adresa_completa) {
      return res.status(400).json({ 
        error: 'Nume firmă, CUI și adresă sunt obligatorii' 
      });
    }
    
    // Verifică dacă configurarea există
    const existing = await db().get('SELECT id FROM config_ubl ORDER BY id DESC LIMIT 1');
    
    let configId;
    
    if (existing) {
      // Update existing config
      await db().run(`
        UPDATE config_ubl SET 
        nume_firma = ?, cui = ?, reg_com = ?, adresa_completa = ?,
        judet = ?, cod_postal = ?, telefon = ?, email = ?,
        cont_bancar = ?, banca = ?,
        anaf_certificat_path = ?, anaf_parola_certificat = ?,
        serie_factura_default = ?, zile_scadenta_default = ?,
        environment = ?, configurare_completa = 1,
        updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [
        nume_firma, cui, reg_com, adresa_completa, judet, cod_postal,
        telefon, email, cont_bancar, banca,
        anaf_certificat_path, anaf_parola_certificat, // În producție ar trebui criptat
        serie_factura_default || 'FACT',
        zile_scadenta_default || 30,
        environment || 'test',
        existing.id
      ]);
      configId = existing.id;
    } else {
      // Insert new config
      const result = await db().run(`
        INSERT INTO config_ubl (
          nume_firma, cui, reg_com, adresa_completa, judet, cod_postal,
          telefon, email, cont_bancar, banca,
          anaf_certificat_path, anaf_parola_certificat,
          serie_factura_default, zile_scadenta_default,
          environment, configurare_completa
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
      `, [
        nume_firma, cui, reg_com, adresa_completa, judet, cod_postal,
        telefon, email, cont_bancar, banca,
        anaf_certificat_path, anaf_parola_certificat,
        serie_factura_default || 'FACT',
        zile_scadenta_default || 30,
        environment || 'test'
      ]);
      configId = result.lastID;
    }
    
    // Întoarce configurarea actualizată (fără parolă)
    const updatedConfig = await db().get('SELECT * FROM config_ubl WHERE id = ?', [configId]);
    delete updatedConfig.anaf_parola_certificat;
    
    res.json({ success: true, config: updatedConfig });
  } catch (error) {
    logger.error('Update UBL config error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ===== FACTURI UBL =====

// Toate facturile UBL
router.get('/facturi', async (req, res) => {
  try {
    const { anaf_status, data_start, data_end, limit = 50 } = req.query;
    
    let query = 'SELECT * FROM facturi_ubl WHERE 1=1';
    const params = [];
    
    if (anaf_status) {
      query += ' AND anaf_status = ?';
      params.push(anaf_status);
    }
    
    if (data_start) {
      query += ' AND data_emitere >= ?';
      params.push(data_start);
    }
    
    if (data_end) {
      query += ' AND data_emitere <= ?';
      params.push(data_end);
    }
    
    query += ' ORDER BY data_emitere DESC, numar_factura DESC LIMIT ?';
    params.push(parseInt(limit));
    
    const facturi = await db().all(query, params);
    
    res.json(facturi);
  } catch (error) {
    logger.error('Get UBL invoices error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Factură UBL specifică cu linii
router.get('/facturi/:id', async (req, res) => {
  try {
    const factura = await db().get('SELECT * FROM facturi_ubl WHERE id = ?', [req.params.id]);
    
    if (!factura) {
      return res.status(404).json({ error: 'Factura nu a fost găsită' });
    }
    
    // Obține liniile facturii
    const linii = await db().all('SELECT * FROM facturi_ubl_linii WHERE factura_ubl_id = ? ORDER BY pozitie', [req.params.id]);
    
    factura.linii = linii;
    
    res.json(factura);
  } catch (error) {
    logger.error('Get UBL invoice error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Creează factură UBL nouă din comandă
router.post('/facturi/din-comanda/:comandaId', async (req, res) => {
  try {
    const { comandaId } = req.params;
    const { client_data, tip_factura = 'vanzare' } = req.body;
    
    if (!client_data || !client_data.nume) {
      return res.status(400).json({ error: 'Datele clientului sunt obligatorii' });
    }
    
    // Obține comanda (POS sau delivery)
    let comanda = await db().get('SELECT * FROM comenzi WHERE id = ?', [comandaId]);
    let comandaDelivery = null;
    
    if (!comanda) {
      comandaDelivery = await db().get('SELECT * FROM comenzi_delivery WHERE id = ?', [comandaId]);
      if (!comandaDelivery) {
        return res.status(404).json({ error: 'Comanda nu a fost găsită' });
      }
    }
    
    // Obține configurarea firmei
    const config = await db().get('SELECT * FROM config_ubl ORDER BY id DESC LIMIT 1');
    if (!config || !config.configurare_completa) {
      return res.status(400).json({ error: 'Configurarea UBL nu este completă' });
    }
    
    // Generează numărul facturii
    const currentYear = new Date().getFullYear();
    const nextNumber = config.numar_factura_curent;
    const numarFactura = `${config.serie_factura_default}${nextNumber.toString().padStart(6, '0')}`;
    
    // Calculează data scadenței
    const dataEmitere = new Date();
    const dataScadenta = new Date();
    dataScadenta.setDate(dataScadenta.getDate() + config.zile_scadenta_default);
    
    // Creează factura
    const facturaData = {
      numar_factura: numarFactura,
      serie_factura: config.serie_factura_default,
      an_factura: currentYear,
      data_emitere: dataEmitere.toISOString().split('T')[0],
      data_scadenta: dataScadenta.toISOString().split('T')[0],
      
      // Client
      client_nume: client_data.nume,
      client_cui: client_data.cui || null,
      client_reg_com: client_data.reg_com || null,
      client_adresa: client_data.adresa || comandaDelivery?.adresa,
      client_email: client_data.email || comandaDelivery?.email_client,
      client_telefon: client_data.telefon || comandaDelivery?.telefon_client,
      
      // Emitent
      emitent_nume: config.nume_firma,
      emitent_cui: config.cui,
      emitent_reg_com: config.reg_com,
      emitent_adresa: config.adresa_completa,
      emitent_cont_bancar: config.cont_bancar,
      emitent_banca: config.banca,
      
      tip_factura,
      comanda_id: comanda?.id || null,
      comanda_delivery_id: comandaDelivery?.id || null
    };
    
    // Inserează factura
    const result = await db().run(`
      INSERT INTO facturi_ubl (
        numar_factura, serie_factura, an_factura, data_emitere, data_scadenta,
        client_nume, client_cui, client_reg_com, client_adresa, client_email, client_telefon,
        emitent_nume, emitent_cui, emitent_reg_com, emitent_adresa, emitent_cont_bancar, emitent_banca,
        tip_factura, comanda_id, comanda_delivery_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      facturaData.numar_factura, facturaData.serie_factura, facturaData.an_factura,
      facturaData.data_emitere, facturaData.data_scadenta,
      facturaData.client_nume, facturaData.client_cui, facturaData.client_reg_com,
      facturaData.client_adresa, facturaData.client_email, facturaData.client_telefon,
      facturaData.emitent_nume, facturaData.emitent_cui, facturaData.emitent_reg_com,
      facturaData.emitent_adresa, facturaData.emitent_cont_bancar, facturaData.emitent_banca,
      facturaData.tip_factura, facturaData.comanda_id, facturaData.comanda_delivery_id
    ]);
    
    const facturaId = result.lastID;
    
    // Obține produsele din comandă și creează liniile facturii
    let produseCmanda = [];
    if (comanda) {
      produseCmanda = await db().all('SELECT * FROM comenzi_linii WHERE comanda_id = ?', [comandaId]);
    } else {
      produseCmanda = await db().all('SELECT * FROM comenzi_delivery_produse WHERE comanda_delivery_id = ?', [comandaId]);
    }
    
    let subtotalFaraTva = 0;
    let totalTva = 0;
    
    for (let i = 0; i < produseCmanda.length; i++) {
      const produs = produseCmanda[i];
      
      // Determină cota TVA (din baza de date sau default 19%)
      const cotaTva = produs.tva === 1 ? 0 : 19; // Simplificat - în realitate din produse
      const pretFaraTva = produs.pret_unitar || produs.valoare / produs.cantitate;
      const pretFaraTvaUnit = pretFaraTva / (1 + cotaTva / 100);
      const valoareFaraTva = pretFaraTvaUnit * produs.cantitate;
      const valoareTva = valoareFaraTva * (cotaTva / 100);
      const valoareCuTva = valoareFaraTva + valoareTva;
      
      await db().run(`
        INSERT INTO facturi_ubl_linii (
          factura_ubl_id, pozitie, cod_produs, denumire, um,
          cantitate, pret_unitar_fara_tva, valoare_fara_tva,
          cota_tva, valoare_tva, valoare_cu_tva
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        facturaId, i + 1,
        produs.cod_produs || produs.cod_prod,
        produs.denumire_produs || produs.den_prod,
        'buc',
        produs.cantitate,
        Math.round(pretFaraTvaUnit * 100) / 100,
        Math.round(valoareFaraTva * 100) / 100,
        cotaTva,
        Math.round(valoareTva * 100) / 100,
        Math.round(valoareCuTva * 100) / 100
      ]);
      
      subtotalFaraTva += valoareFaraTva;
      totalTva += valoareTva;
    }
    
    const totalCuTva = subtotalFaraTva + totalTva;
    
    // Actualizează totalurile facturii
    await db().run(`
      UPDATE facturi_ubl SET 
        subtotal_fara_tva = ?, total_tva = ?, total_cu_tva = ?
      WHERE id = ?
    `, [
      Math.round(subtotalFaraTva * 100) / 100,
      Math.round(totalTva * 100) / 100,
      Math.round(totalCuTva * 100) / 100,
      facturaId
    ]);
    
    // Actualizează numărul curent al facturii în config
    await db().run(`
      UPDATE config_ubl SET numar_factura_curent = numar_factura_curent + 1
      WHERE id = ?
    `, [config.id]);
    
    // Întoarce factura creată
    const facturaNoua = await db().get('SELECT * FROM facturi_ubl WHERE id = ?', [facturaId]);
    const linii = await db().all('SELECT * FROM facturi_ubl_linii WHERE factura_ubl_id = ?', [facturaId]);
    facturaNoua.linii = linii;
    
    res.status(201).json({ success: true, factura: facturaNoua });
  } catch (error) {
    logger.error('Create UBL invoice error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Generează XML UBL pentru factură
router.post('/facturi/:id/genereaza-xml', async (req, res) => {
  try {
    const factura = await db().get('SELECT * FROM facturi_ubl WHERE id = ?', [req.params.id]);
    
    if (!factura) {
      return res.status(404).json({ error: 'Factura nu a fost găsită' });
    }
    
    const linii = await db().all('SELECT * FROM facturi_ubl_linii WHERE factura_ubl_id = ? ORDER BY pozitie', [req.params.id]);
    
    // Generează XML UBL (simplificat pentru demo - în realitate ar fi mai complex)
    const xmlUBL = generateUBLXML(factura, linii);
    const xmlHash = crypto.createHash('sha256').update(xmlUBL).digest('hex');
    
    // Salvează XML-ul în factură
    await db().run(`
      UPDATE facturi_ubl SET ubl_xml = ?, ubl_hash = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [xmlUBL, xmlHash, req.params.id]);
    
    res.json({ 
      success: true, 
      xml: xmlUBL,
      hash: xmlHash,
      message: 'XML UBL generat cu succes'
    });
  } catch (error) {
    logger.error('Generate UBL XML error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Trimite factură către ANAF
router.post('/facturi/:id/trimite-anaf', async (req, res) => {
  try {
    const factura = await db().get('SELECT * FROM facturi_ubl WHERE id = ?', [req.params.id]);
    
    if (!factura) {
      return res.status(404).json({ error: 'Factura nu a fost găsită' });
    }
    
    if (!factura.ubl_xml) {
      return res.status(400).json({ error: 'XML UBL nu a fost generat încă' });
    }
    
    // Simulează trimiterea către ANAF (în realitate ar fi un request HTTPS cu certificat)
    const anafResponse = await simulateANAFUpload(factura);
    
    // Actualizează statusul facturii
    await db().run(`
      UPDATE facturi_ubl SET 
        anaf_status = ?, anaf_upload_id = ?, anaf_data_trimitere = CURRENT_TIMESTAMP,
        anaf_mesaj_eroare = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [
      anafResponse.success ? 'sent' : 'error',
      anafResponse.upload_id,
      anafResponse.error_message,
      req.params.id
    ]);
    
    // Log operațiunea
    await db().run(`
      INSERT INTO anaf_log (
        factura_ubl_id, tip_operatiune, response_status,
        response_body, success, error_message
      ) VALUES (?, ?, ?, ?, ?, ?)
    `, [
      req.params.id, 'upload', anafResponse.status_code,
      JSON.stringify(anafResponse), anafResponse.success ? 1 : 0,
      anafResponse.error_message
    ]);
    
    res.json({
      success: anafResponse.success,
      anaf_response: anafResponse
    });
  } catch (error) {
    logger.error('Send to ANAF error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ===== JURNAL TVA =====

// Obține jurnalul TVA pentru o lună
router.get('/jurnal-tva/:an/:luna', async (req, res) => {
  try {
    const { an, luna } = req.params;
    
    let jurnal = await db().get('SELECT * FROM jurnal_tva WHERE an = ? AND luna = ?', [an, luna]);
    
    if (!jurnal) {
      // Calculează jurnalul pe baza facturilor din luna respectivă
      jurnal = await calculateTVAJournal(parseInt(an), parseInt(luna));
    }
    
    res.json(jurnal);
  } catch (error) {
    logger.error('Get TVA journal error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ===== FUNCȚII HELPER =====

function generateUBLXML(factura, linii) {
  // XML UBL simplificat pentru demo (în realitate ar fi mult mai complex și conform standardului)
  return `<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2">
  <ID>${factura.numar_factura}</ID>
  <IssueDate>${factura.data_emitere}</IssueDate>
  <DueDate>${factura.data_scadenta}</DueDate>
  <InvoiceTypeCode>380</InvoiceTypeCode>
  <DocumentCurrencyCode>${factura.moneda}</DocumentCurrencyCode>
  
  <AccountingSupplierParty>
    <Party>
      <PartyName>
        <Name>${factura.emitent_nume}</Name>
      </PartyName>
      <PartyTaxScheme>
        <CompanyID>${factura.emitent_cui}</CompanyID>
        <TaxScheme>
          <ID>VAT</ID>
        </TaxScheme>
      </PartyTaxScheme>
      <PartyLegalEntity>
        <RegistrationName>${factura.emitent_nume}</RegistrationName>
        <CompanyID>${factura.emitent_reg_com}</CompanyID>
      </PartyLegalEntity>
      <Contact>
        <ElectronicMail>${factura.emitent_email}</ElectronicMail>
      </Contact>
    </Party>
  </AccountingSupplierParty>
  
  <AccountingCustomerParty>
    <Party>
      <PartyName>
        <Name>${factura.client_nume}</Name>
      </PartyName>
      ${factura.client_cui ? `<PartyTaxScheme>
        <CompanyID>${factura.client_cui}</CompanyID>
        <TaxScheme>
          <ID>VAT</ID>
        </TaxScheme>
      </PartyTaxScheme>` : ''}
    </Party>
  </AccountingCustomerParty>
  
  ${linii.map((linie, index) => `
  <InvoiceLine>
    <ID>${linie.pozitie}</ID>
    <InvoicedQuantity unitCode="C62">${linie.cantitate}</InvoicedQuantity>
    <LineExtensionAmount currencyID="${factura.moneda}">${linie.valoare_fara_tva}</LineExtensionAmount>
    <Item>
      <Description>${linie.denumire}</Description>
      <Name>${linie.denumire}</Name>
      ${linie.cod_produs ? `<SellersItemIdentification><ID>${linie.cod_produs}</ID></SellersItemIdentification>` : ''}
      <ClassifiedTaxCategory>
        <ID>S</ID>
        <Percent>${linie.cota_tva}</Percent>
        <TaxScheme>
          <ID>VAT</ID>
        </TaxScheme>
      </ClassifiedTaxCategory>
    </Item>
    <Price>
      <PriceAmount currencyID="${factura.moneda}">${linie.pret_unitar_fara_tva}</PriceAmount>
    </Price>
  </InvoiceLine>
  `).join('')}
  
  <LegalMonetaryTotal>
    <LineExtensionAmount currencyID="${factura.moneda}">${factura.subtotal_fara_tva}</LineExtensionAmount>
    <TaxExclusiveAmount currencyID="${factura.moneda}">${factura.subtotal_fara_tva}</TaxExclusiveAmount>
    <TaxInclusiveAmount currencyID="${factura.moneda}">${factura.total_cu_tva}</TaxInclusiveAmount>
    <PayableAmount currencyID="${factura.moneda}">${factura.total_cu_tva}</PayableAmount>
  </LegalMonetaryTotal>
  
</Invoice>`;
}

async function simulateANAFUpload(factura) {
  // Simulează răspunsul ANAF (în realitate ar fi un request real către ANAF)
  const uploadId = `ANAF${Date.now()}`;
  
  // Simulează succesul sau eșecul bazat pe validitate
  const success = factura.total_cu_tva > 0 && factura.client_nume.length > 2;
  
  return {
    success,
    status_code: success ? 200 : 400,
    upload_id: success ? uploadId : null,
    message: success ? 'Factura a fost trimisă cu succes către ANAF' : 'Eroare validare factură',
    error_message: success ? null : 'Date incomplete sau invalide'
  };
}

async function calculateTVAJournal(an, luna) {
  // Calculează jurnalul TVA pentru luna specificată
  const startDate = `${an}-${luna.toString().padStart(2, '0')}-01`;
  const endDate = `${an}-${luna.toString().padStart(2, '0')}-31`;
  
  const facturi = await db().all(`
    SELECT * FROM facturi_ubl 
    WHERE data_emitere BETWEEN ? AND ? AND anaf_status = 'accepted'
  `, [startDate, endDate]);
  
  let baza19 = 0, tva19 = 0, baza9 = 0, tva9 = 0, baza0 = 0;
  
  for (const factura of facturi) {
    const linii = await db().all('SELECT * FROM facturi_ubl_linii WHERE factura_ubl_id = ?', [factura.id]);
    
    for (const linie of linii) {
      if (linie.cota_tva === 19) {
        baza19 += linie.valoare_fara_tva;
        tva19 += linie.valoare_tva;
      } else if (linie.cota_tva === 9) {
        baza9 += linie.valoare_fara_tva;
        tva9 += linie.valoare_tva;
      } else {
        baza0 += linie.valoare_fara_tva;
      }
    }
  }
  
  const totalBaza = baza19 + baza9 + baza0;
  const totalTva = tva19 + tva9;
  
  const jurnalData = {
    an,
    luna,
    baza_19_percent: Math.round(baza19 * 100) / 100,
    tva_19_percent: Math.round(tva19 * 100) / 100,
    baza_9_percent: Math.round(baza9 * 100) / 100,
    tva_9_percent: Math.round(tva9 * 100) / 100,
    baza_0_percent: Math.round(baza0 * 100) / 100,
    total_baza_impozabila: Math.round(totalBaza * 100) / 100,
    total_tva_colectat: Math.round(totalTva * 100) / 100,
    total_cu_tva: Math.round((totalBaza + totalTva) * 100) / 100,
    numar_facturi: facturi.length
  };
  
  // Salvează jurnalul calculat
  await db().run(`
    INSERT OR REPLACE INTO jurnal_tva (
      an, luna, baza_19_percent, tva_19_percent, baza_9_percent, tva_9_percent,
      baza_0_percent, total_baza_impozabila, total_tva_colectat, total_cu_tva, numar_facturi
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    jurnalData.an, jurnalData.luna, jurnalData.baza_19_percent, jurnalData.tva_19_percent,
    jurnalData.baza_9_percent, jurnalData.tva_9_percent, jurnalData.baza_0_percent,
    jurnalData.total_baza_impozabila, jurnalData.total_tva_colectat, jurnalData.total_cu_tva,
    jurnalData.numar_facturi
  ]);
  
  return jurnalData;
}

export default router;