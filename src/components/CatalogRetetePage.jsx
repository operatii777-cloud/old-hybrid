import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';

const CATEGORII_ORDINE = [
  'RACORITOARE',
  'VINURI',
  'ALCOOLICE',
  'PREP PORC/VITA/PESTE',
  'GARNITURI/SALATE',
  'CAFEA',
  'CIORBE/MIC DEJ/PIZZA',
  'PREP PUI',
  'VINURI/METAXA',
  'DIVERSE/DESERT/SPEC',
  'Altele'
];

const CATEGORII_POS = [
  { pattern: /ESPRESSO|CAPPUCCINO|CAFEA|CAFE LATTE|CEAI|CIOCOLATA CALDA|MOCHACCINO|IRISH COFFEE|AMARETTO COFFEE|AFFOGADO|MADELEINE|NIRVANA|MONTE BIANCO|MONTE NERO|CLASSIC|SHAKERETTO|STEFANO'S|ANGELINA|REGINA|COFFEE CABINET/i, categorie: 'CAFEA' },
  { pattern: /APA |PEPSI|MIRINDA|SEVEN UP|MOUNTAIN DEW|EVERVESS|LIMONADA|FRESH |ICE TEA|ICETEA|SUC FRUCTE|RED BULL|PERRIER|VITTEL|APA PLATA|APA MINERALA|COCA COLA|COLA|FANTA|SPRITE|NESTEA|BURN|RED FORCE|CAPY|SANTAL|NECTAR|PERONI|URSUS|STEJAR|SALITOS|COLINE/i, categorie: 'RACORITOARE' },
  { pattern: /SHAKE /i, categorie: 'RACORITOARE' },
  { pattern: /SNI[TȚ]EL PUI|PUI |PULPE PUI|ARIPIOARE|PIEPT PUI|GRILL PUI|PUI GRILL|PUI LA CUPTOR|PUI PRAJIT|\bPUI\b/i, categorie: 'PREP PUI' },
  { pattern: /SNI[TȚ]EL|COTLET|MICI |PORC |VITA |PESTE |FRIPTUR|GRATAR|CHIFTEL|CARNATI|MUSCHI|FICAT|GULAS|TOCANA|SARMALE|MITITEI/i, categorie: 'PREP PORC/VITA/PESTE' },
  { pattern: /PIZZA/i, categorie: 'CIORBE/MIC DEJ/PIZZA' },
  { pattern: /CIORB[AĂ]|SUPA |CROISSANT|SUNCA SI CASCAVAL|SIMPLU, SERVIT|BREAKFAST|TOAST |CANA LAPTE|SANDWICH|CU CIOCOLATA|CU GEM|CU MIERE|MIC DEJ/i, categorie: 'CIORBE/MIC DEJ/PIZZA' },
  { pattern: /EXTRA |CARTOFI|OREZ |SALAT[AĂ]|GARNITUR|BOEUF|LEGUME LA CUPTOR|MASH|PUREU/i, categorie: 'GARNITURI/SALATE' },
  { pattern: /CABERNET|SAUVIGNON|JIDVEI|CLAUSTHALLER|RECAS|FETEASCA|RO[ȘS]E|CHARDONNAY|MERLOT|PINOT/i, categorie: 'VINURI' },
  { pattern: /METAXA|MIORITA|ZARAZA|SAMPANIE|BUSUIOACA|RAI DE MURFATLAR|BARON'S|VIN ALB FIERT|VIN ROSU FIERT|VIN FIERT/i, categorie: 'VINURI/METAXA' },
  { pattern: /VODKA|WHISKY|JACK DANIEL|CHIVAS|JOHNNIE WALKER|BALLANTINE|J&B|GIN TONIC|CAMPARI|BEEFEATER|BAILEY|FERNET|JAGERMEISTER|COINTREAU|MARTINI\b|SAMBUC[AO]|BACARDI|SMIRNOFF|HEINEKEN|BUDWEISER|CORONA\b|REMY MARTIN|COURVOISIER|TULLAMORE|GLENFIDDICH|AMARETTO\b|ABSINTH/i, categorie: 'ALCOOLICE' },
  { pattern: /BANANA SPLIT|3 CUPE|CHOCOLATE HEAVEN|PECHE MELBA|PINKY|PINEAPPLE DELIGHT|SALATA DE FRUCTE|COCKTAIL DE FRUCTE|CINO'S|PLAISIR|PYRAMID|FESTIVAL|MASCOTTE|DESERT|PLACINTA|TORT|INGHETATA|SPEC /i, categorie: 'DIVERSE/DESERT/SPEC' }
];

function getCategorie(den_prod, grupaDb) {
  const den = (den_prod || '').toString().toUpperCase();
  if (grupaDb != null && grupaDb !== '' && isNaN(Number(grupaDb))) return String(grupaDb).trim();
  for (const { pattern, categorie } of CATEGORII_POS) {
    if (pattern.test(den)) return categorie;
  }
  return grupaDb != null && grupaDb !== '' ? String(grupaDb) : 'Altele';
}

export default function CatalogRetetePage() {
  const [loading, setLoading] = useState(true);
  const [catalog, setCatalog] = useState([]);
  const [expandCategory, setExpandCategory] = useState({});

  useEffect(() => {
    let cancelled = false;
    axios.get('/api/magazie/retete-catalog')
      .then(res => {
        if (!cancelled) setCatalog(res.data || []);
      })
      .catch(() => {
        if (!cancelled) setCatalog([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const byCategory = useMemo(() => {
    const map = {};
    for (const row of catalog) {
      const cat = getCategorie(row.den_prod, row.grupa_db) || 'Altele';
      if (!map[cat]) map[cat] = {};
      const key = `${row.cod_ret}|${row.den_prod || ''}`;
      if (!map[cat][key]) {
        map[cat][key] = { cod_ret: row.cod_ret, den_prod: row.den_prod || `Produs ${row.cod_ret}`, ingrediente: [] };
      }
      map[cat][key].ingrediente.push({
        denumire: row.denumire_ingredient || row.denumire || '–',
        cant: row.cant,
        um: row.um || 'g'
      });
    }
    return map;
  }, [catalog]);

  const toggleCategory = (cat) => {
    setExpandCategory(prev => ({ ...prev, [cat]: !prev[cat] }));
  };

  if (loading) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <div className="text-center py-12 text-gray-600">Se încarcă catalogul de rețete...</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-black mb-2">📖 Catalog Rețete</h1>
        <p className="text-black">Toate rețetele din aplicație, grupate pe categorii</p>
      </div>

      <div className="space-y-4">
        {CATEGORII_ORDINE.map(cat => {
          const products = byCategory[cat] ? Object.values(byCategory[cat]) : [];
          if (products.length === 0) return null;
          const expanded = expandCategory[cat] !== false;
          return (
            <div key={cat} className="bg-white rounded-lg shadow-lg overflow-hidden">
              <button
                type="button"
                onClick={() => toggleCategory(cat)}
                className="w-full px-4 py-3 text-left font-bold text-black bg-green-100 hover:bg-green-200 flex justify-between items-center"
              >
                <span>{cat}</span>
                <span className="text-sm font-normal text-gray-600">({products.length} produse)</span>
                <span>{expanded ? '▼' : '▶'}</span>
              </button>
              {expanded && (
                <div className="border-t border-gray-200 divide-y divide-gray-100">
                  {products.map((prod, idx) => (
                    <div key={`${prod.cod_ret}-${idx}`} className="px-4 py-3">
                      <div className="font-bold text-black mb-2">{prod.den_prod}</div>
                      <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                        {prod.ingrediente.map((ing, i) => (
                          <li key={i}>
                            {ing.denumire}: <strong>{ing.cant}</strong> {ing.um}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {!CATEGORII_ORDINE.some(c => byCategory[c] && Object.keys(byCategory[c]).length > 0) && (
        <div className="text-center py-12 text-gray-600">Nu există rețete în catalog.</div>
      )}
    </div>
  );
}
