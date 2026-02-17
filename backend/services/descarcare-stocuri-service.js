/**
 * Descarcă stocuri la finalizarea unei comenzi POS: pentru fiecare linie (cod_prod, cant),
 * aplică rețeta produsului și scade consumul din stocuri (gestiune_id, cod_material).
 */

import { getDatabase } from '../database/init-db.js';
import { logger } from '../utils/logger.js';

/**
 * @param {string} comandaId - ID-ul comenzii
 * @returns {{ ok: true } | { ok: false, error: string, detalii?: string }}
 */
export async function descarcareStocuriLaComanda(comandaId) {
  const db = getDatabase();
  try {
    const linii = await db.all(
      'SELECT cod_prod, cant FROM comenzi_linii WHERE comanda_id = ?',
      [comandaId]
    );
    if (!linii || linii.length === 0) {
      return { ok: true }; // nimic de descărcat
    }

    // Mapă (gestiune_id, cod_material) -> cantitate totală de scăzut (în UM material: Kg, Litru, etc.)
    const consumPerStoc = new Map();
    const materiiUm = await db.all('SELECT cod, um FROM materii_prime').then(rows => new Map(rows.map(m => [Number(m.cod), (m.um || 'Kg').trim()])));
    const materiiDenumire = await db.all('SELECT cod, denumire FROM materii_prime').then(rows => new Map(rows.map(m => [Number(m.cod), (m.denumire || '').toUpperCase()])));

    // Produse care sunt apă / băuturi fără alcool – nu scădem niciodată alcool din rețeta lor (sincronizare POS ↔ rețete)
    const produseDenumire = new Map();
    for (const linie of linii) {
      if (!produseDenumire.has(linie.cod_prod)) {
        const p = await db.get('SELECT den_prod FROM produse_pos WHERE cod_prod = ?', [linie.cod_prod]);
        produseDenumire.set(linie.cod_prod, (p?.den_prod || '').toUpperCase());
      }
    }
    const isProdusApa = (den) => /^APA\s|APA MINERALA|APA PLATA|PERRIER|VITTEL|BORSEC|DORNA\s|Dorna\s/i.test(den || '');

    for (const linie of linii) {
      const { cod_prod, cant: cantVanduta } = linie;
      const denProd = produseDenumire.get(cod_prod) || '';
      const retete = await db.all(
        'SELECT cod_mat, cant, gestiune_id FROM retete WHERE cod_ret = ?',
        [cod_prod]
      );
      for (const r of retete) {
        const denMat = materiiDenumire.get(Number(r.cod_mat)) || '';
        const isAlcool = /\b(VODKA|WHISKY|ROM|GIN|TEQUILA|ABSINTH|JACK\s*DANIEL|GLENFID|CHIVAS|JOHNNIE|J&B|BACARDI|MARTELL|HENNESSY|METAXA|OUZO|ZARAZA)\b/i.test(denMat);
        if (isProdusApa(denProd) && isAlcool) {
          continue; // rețetă greșită: produs apă cu ingredient alcool – nu scădem
        }
        let cantPerBuc = Number(r.cant) || 0;
        const um = materiiUm.get(Number(r.cod_mat)) || 'Kg';
        if (um === 'Litru' && cantPerBuc > 1) {
          cantPerBuc = cantPerBuc / 1000;
        }
        const consum = cantPerBuc * (Number(cantVanduta) || 0);
        if (consum <= 0) continue;
        const key = `${r.gestiune_id ?? 1}|${r.cod_mat}`;
        consumPerStoc.set(key, (consumPerStoc.get(key) || 0) + consum);
      }
    }

    if (consumPerStoc.size === 0) {
      return { ok: true }; // niciun produs cu rețetă
    }

    // Verificare stoc suficient înainte de scădere
    for (const [key, consum] of consumPerStoc) {
      const [gestiuneId, codMaterial] = key.split('|').map(Number);
      const row = await db.get(
        'SELECT cant_stoc FROM stocuri WHERE gestiune_id = ? AND cod_material = ?',
        [gestiuneId, codMaterial]
      );
      const stocActual = row ? Number(row.cant_stoc) || 0 : 0;
      if (stocActual < consum) {
        const mat = await db.get('SELECT denumire FROM materii_prime WHERE cod = ?', [codMaterial]);
        const denumire = mat?.denumire || codMaterial;
        return {
          ok: false,
          error: 'Stoc insuficient',
          detalii: `Material ${denumire} (gestiune ${gestiuneId}): stoc ${stocActual}, necesar ${consum}`
        };
      }
    }

    // Scădere stocuri (am verificat deja că stocul e suficient)
    for (const [key, consum] of consumPerStoc) {
      const [gestiuneId, codMaterial] = key.split('|').map(Number);
      await db.run(
        `UPDATE stocuri SET cant_stoc = cant_stoc - ?, data_update = CURRENT_TIMESTAMP 
         WHERE gestiune_id = ? AND cod_material = ?`,
        [consum, gestiuneId, codMaterial]
      );
    }

    logger.info(`Descărcare stocuri pentru comanda ${comandaId}: ${consumPerStoc.size} articole actualizate.`);
    return { ok: true };
  } catch (e) {
    logger.error('descarcareStocuriLaComanda:', e);
    return { ok: false, error: e.message || 'Eroare la descărcare stocuri' };
  }
}
