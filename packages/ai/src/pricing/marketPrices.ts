/**
 * Romanian HORECA market prices reference table
 *
 * Sources: Metro Romania, Selgros Romania, Lidl Romania — average retail/HoReCa
 * prices as of early 2025, expressed in BANI per BASE UNIT:
 *   - solid ingredients  → bani / g     (e.g. 1 RON/kg = 0.1 bani/g)
 *   - liquid ingredients → bani / ml
 *   - countable items    → bani / buc
 *
 * Values are conservative HoReCa purchase prices (slightly below retail).
 * They serve as a fallback when the tenant has no recorded cost for an ingredient.
 * After use, the price is persisted as `costPrice` on the Ingredient record.
 */

export interface MarketPriceEntry {
  /** price in bani per base unit (g / ml / buc) */
  priceBaniPerUnit: number;
  /** canonical storage unit for this ingredient */
  unit: 'g' | 'ml' | 'buc';
  /** data sources used to estimate this price */
  sources: string[];
}

// All keys are lowercase and diacritic-free (Romanian normalisation applied)
const MARKET_PRICE_TABLE: Record<string, MarketPriceEntry> = {
  // ── Protein ───────────────────────────────────────────────────────────────
  'ou':                  { priceBaniPerUnit: 100,  unit: 'buc', sources: ['Metro', 'Lidl'] },         // ~1 RON/buc
  'oua':                 { priceBaniPerUnit: 100,  unit: 'buc', sources: ['Metro', 'Lidl'] },
  'oua posate':          { priceBaniPerUnit: 100,  unit: 'buc', sources: ['Metro', 'Lidl'] },
  'ou posate':           { priceBaniPerUnit: 100,  unit: 'buc', sources: ['Metro', 'Lidl'] },
  'pui':                 { priceBaniPerUnit: 1.5,  unit: 'g',   sources: ['Metro', 'Selgros'] },       // ~15 RON/kg
  'piept de pui':        { priceBaniPerUnit: 2.0,  unit: 'g',   sources: ['Metro', 'Selgros'] },       // ~20 RON/kg
  'pulpa pui':           { priceBaniPerUnit: 1.5,  unit: 'g',   sources: ['Metro', 'Selgros'] },
  'porc':                { priceBaniPerUnit: 2.2,  unit: 'g',   sources: ['Metro', 'Selgros'] },
  'vita':                { priceBaniPerUnit: 3.5,  unit: 'g',   sources: ['Metro', 'Selgros'] },
  'miel':                { priceBaniPerUnit: 4.0,  unit: 'g',   sources: ['Metro'] },
  'somon':               { priceBaniPerUnit: 5.0,  unit: 'g',   sources: ['Metro', 'Selgros'] },       // ~50 RON/kg
  'somon afumat':        { priceBaniPerUnit: 8.0,  unit: 'g',   sources: ['Metro', 'Selgros'] },       // ~80 RON/kg
  'ton':                 { priceBaniPerUnit: 3.5,  unit: 'g',   sources: ['Metro', 'Lidl'] },
  'creveți':             { priceBaniPerUnit: 6.0,  unit: 'g',   sources: ['Metro', 'Selgros'] },
  'creveti':             { priceBaniPerUnit: 6.0,  unit: 'g',   sources: ['Metro', 'Selgros'] },
  'carne tocata':        { priceBaniPerUnit: 2.5,  unit: 'g',   sources: ['Metro', 'Selgros'] },
  'bacon':               { priceBaniPerUnit: 4.0,  unit: 'g',   sources: ['Metro', 'Lidl'] },
  'sunca':               { priceBaniPerUnit: 3.5,  unit: 'g',   sources: ['Metro', 'Lidl'] },
  'cârnați':             { priceBaniPerUnit: 2.8,  unit: 'g',   sources: ['Metro', 'Selgros'] },
  'carnati':             { priceBaniPerUnit: 2.8,  unit: 'g',   sources: ['Metro', 'Selgros'] },

  // ── Dairy ─────────────────────────────────────────────────────────────────
  'lapte':               { priceBaniPerUnit: 0.7,  unit: 'ml',  sources: ['Metro', 'Lidl'] },          // ~7 RON/l
  'lapte integral':      { priceBaniPerUnit: 0.75, unit: 'ml',  sources: ['Metro', 'Lidl'] },
  'smântână':            { priceBaniPerUnit: 1.5,  unit: 'ml',  sources: ['Metro', 'Lidl'] },          // ~15 RON/l
  'smantana':            { priceBaniPerUnit: 1.5,  unit: 'ml',  sources: ['Metro', 'Lidl'] },
  'frisca':              { priceBaniPerUnit: 2.0,  unit: 'ml',  sources: ['Metro', 'Selgros'] },
  'frișcă':              { priceBaniPerUnit: 2.0,  unit: 'ml',  sources: ['Metro', 'Selgros'] },
  'unt':                 { priceBaniPerUnit: 3.0,  unit: 'g',   sources: ['Metro', 'Lidl'] },          // ~30 RON/kg
  'brânza':              { priceBaniPerUnit: 2.5,  unit: 'g',   sources: ['Metro', 'Selgros'] },
  'branza':              { priceBaniPerUnit: 2.5,  unit: 'g',   sources: ['Metro', 'Selgros'] },
  'mozzarella':          { priceBaniPerUnit: 3.0,  unit: 'g',   sources: ['Metro', 'Selgros'] },       // ~30 RON/kg
  'parmezan':            { priceBaniPerUnit: 7.0,  unit: 'g',   sources: ['Metro', 'Selgros'] },       // ~70 RON/kg
  'cascaval':            { priceBaniPerUnit: 3.5,  unit: 'g',   sources: ['Metro', 'Lidl'] },
  'caşcaval':            { priceBaniPerUnit: 3.5,  unit: 'g',   sources: ['Metro', 'Lidl'] },
  'iaurt':               { priceBaniPerUnit: 0.8,  unit: 'g',   sources: ['Metro', 'Lidl'] },
  'ricotta':             { priceBaniPerUnit: 4.0,  unit: 'g',   sources: ['Metro', 'Selgros'] },
  'branza feta':         { priceBaniPerUnit: 4.5,  unit: 'g',   sources: ['Metro', 'Selgros'] },
  'telemea':             { priceBaniPerUnit: 2.8,  unit: 'g',   sources: ['Metro', 'Selgros'] },

  // ── Vegetables ───────────────────────────────────────────────────────────
  'rosii':               { priceBaniPerUnit: 0.5,  unit: 'g',   sources: ['Metro', 'Lidl'] },          // ~5 RON/kg
  'roșii':               { priceBaniPerUnit: 0.5,  unit: 'g',   sources: ['Metro', 'Lidl'] },
  'castraveti':          { priceBaniPerUnit: 0.4,  unit: 'g',   sources: ['Metro', 'Lidl'] },
  'castraveți':          { priceBaniPerUnit: 0.4,  unit: 'g',   sources: ['Metro', 'Lidl'] },
  'ardei':               { priceBaniPerUnit: 0.6,  unit: 'g',   sources: ['Metro', 'Lidl'] },
  'ardei gras':          { priceBaniPerUnit: 0.6,  unit: 'g',   sources: ['Metro', 'Lidl'] },
  'ardei iute':          { priceBaniPerUnit: 0.8,  unit: 'g',   sources: ['Metro', 'Lidl'] },
  'ceapa':               { priceBaniPerUnit: 0.2,  unit: 'g',   sources: ['Metro', 'Selgros'] },       // ~2 RON/kg
  'ceapă':               { priceBaniPerUnit: 0.2,  unit: 'g',   sources: ['Metro', 'Selgros'] },
  'usturoi':             { priceBaniPerUnit: 1.5,  unit: 'g',   sources: ['Metro', 'Selgros'] },       // ~15 RON/kg
  'morcov':              { priceBaniPerUnit: 0.2,  unit: 'g',   sources: ['Metro', 'Lidl'] },
  'morcovi':             { priceBaniPerUnit: 0.2,  unit: 'g',   sources: ['Metro', 'Lidl'] },
  'cartofi':             { priceBaniPerUnit: 0.15, unit: 'g',   sources: ['Metro', 'Lidl'] },          // ~1.5 RON/kg
  'cartofi prajiti':     { priceBaniPerUnit: 0.3,  unit: 'g',   sources: ['Metro', 'Selgros'] },
  'cartofi prăjiți':     { priceBaniPerUnit: 0.3,  unit: 'g',   sources: ['Metro', 'Selgros'] },
  'salata verde':        { priceBaniPerUnit: 0.5,  unit: 'g',   sources: ['Metro', 'Lidl'] },
  'salată':              { priceBaniPerUnit: 0.5,  unit: 'g',   sources: ['Metro', 'Lidl'] },
  'spanac':              { priceBaniPerUnit: 0.6,  unit: 'g',   sources: ['Metro', 'Lidl'] },
  'avocado':             { priceBaniPerUnit: 1.5,  unit: 'g',   sources: ['Metro', 'Lidl'] },          // ~15 RON/buc ~200g
  'ciuperci':            { priceBaniPerUnit: 0.8,  unit: 'g',   sources: ['Metro', 'Selgros'] },
  'vinete':              { priceBaniPerUnit: 0.5,  unit: 'g',   sources: ['Metro', 'Lidl'] },
  'dovlecel':            { priceBaniPerUnit: 0.4,  unit: 'g',   sources: ['Metro', 'Lidl'] },
  'broccoli':            { priceBaniPerUnit: 0.6,  unit: 'g',   sources: ['Metro', 'Lidl'] },
  'conopida':            { priceBaniPerUnit: 0.5,  unit: 'g',   sources: ['Metro', 'Lidl'] },
  'varza':               { priceBaniPerUnit: 0.2,  unit: 'g',   sources: ['Metro', 'Lidl'] },
  'varză':               { priceBaniPerUnit: 0.2,  unit: 'g',   sources: ['Metro', 'Lidl'] },

  // ── Herbs & spices ────────────────────────────────────────────────────────
  'busuioc':             { priceBaniPerUnit: 30,   unit: 'buc', sources: ['Metro', 'Lidl'] },          // ~0.30 RON/crenguta
  'patrunjel':           { priceBaniPerUnit: 1.5,  unit: 'g',   sources: ['Metro', 'Lidl'] },
  'pătrunjel':           { priceBaniPerUnit: 1.5,  unit: 'g',   sources: ['Metro', 'Lidl'] },
  'marar':               { priceBaniPerUnit: 1.5,  unit: 'g',   sources: ['Metro', 'Lidl'] },
  'mărar':               { priceBaniPerUnit: 1.5,  unit: 'g',   sources: ['Metro', 'Lidl'] },
  'oregano':             { priceBaniPerUnit: 2.0,  unit: 'g',   sources: ['Metro', 'Selgros'] },
  'cimbru':              { priceBaniPerUnit: 2.0,  unit: 'g',   sources: ['Metro', 'Lidl'] },
  'rozmarin':            { priceBaniPerUnit: 2.0,  unit: 'g',   sources: ['Metro', 'Lidl'] },
  'tarhon':              { priceBaniPerUnit: 3.0,  unit: 'g',   sources: ['Metro', 'Lidl'] },
  'sare':                { priceBaniPerUnit: 0.05, unit: 'g',   sources: ['Metro', 'Selgros'] },       // ~0.5 RON/kg
  'piper':               { priceBaniPerUnit: 2.0,  unit: 'g',   sources: ['Metro', 'Selgros'] },
  'boia':                { priceBaniPerUnit: 1.5,  unit: 'g',   sources: ['Metro', 'Lidl'] },
  'turmeric':            { priceBaniPerUnit: 3.0,  unit: 'g',   sources: ['Metro', 'Lidl'] },
  'chimen':              { priceBaniPerUnit: 2.0,  unit: 'g',   sources: ['Metro', 'Selgros'] },
  'nucsoara':            { priceBaniPerUnit: 4.0,  unit: 'g',   sources: ['Metro', 'Lidl'] },
  'nucșoară':            { priceBaniPerUnit: 4.0,  unit: 'g',   sources: ['Metro', 'Lidl'] },

  // ── Oils, fats & condiments ───────────────────────────────────────────────
  'ulei de masline':     { priceBaniPerUnit: 2.0,  unit: 'ml',  sources: ['Metro', 'Selgros'] },       // ~20 RON/l
  'ulei de măsline':     { priceBaniPerUnit: 2.0,  unit: 'ml',  sources: ['Metro', 'Selgros'] },
  'ulei':                { priceBaniPerUnit: 0.8,  unit: 'ml',  sources: ['Metro', 'Lidl'] },          // ~8 RON/l
  'ulei floarea soarelui': { priceBaniPerUnit: 0.8, unit: 'ml', sources: ['Metro', 'Lidl'] },
  'otet':                { priceBaniPerUnit: 0.4,  unit: 'ml',  sources: ['Metro', 'Lidl'] },
  'oțet':                { priceBaniPerUnit: 0.4,  unit: 'ml',  sources: ['Metro', 'Lidl'] },
  'otet balsamic':       { priceBaniPerUnit: 3.0,  unit: 'ml',  sources: ['Metro', 'Selgros'] },
  'sos de soia':         { priceBaniPerUnit: 1.5,  unit: 'ml',  sources: ['Metro', 'Selgros'] },
  'mustar':              { priceBaniPerUnit: 1.0,  unit: 'g',   sources: ['Metro', 'Lidl'] },
  'muștar':              { priceBaniPerUnit: 1.0,  unit: 'g',   sources: ['Metro', 'Lidl'] },
  'ketchup':             { priceBaniPerUnit: 0.8,  unit: 'g',   sources: ['Metro', 'Lidl'] },
  'maioneza':            { priceBaniPerUnit: 1.0,  unit: 'g',   sources: ['Metro', 'Lidl'] },
  'maioneză':            { priceBaniPerUnit: 1.0,  unit: 'g',   sources: ['Metro', 'Lidl'] },

  // ── Bakery & grains ───────────────────────────────────────────────────────
  'faina':               { priceBaniPerUnit: 0.2,  unit: 'g',   sources: ['Metro', 'Selgros'] },       // ~2 RON/kg
  'făină':               { priceBaniPerUnit: 0.2,  unit: 'g',   sources: ['Metro', 'Selgros'] },
  'paine':               { priceBaniPerUnit: 0.8,  unit: 'g',   sources: ['Metro', 'Lidl'] },
  'pâine':               { priceBaniPerUnit: 0.8,  unit: 'g',   sources: ['Metro', 'Lidl'] },
  'paine prajita':       { priceBaniPerUnit: 1.0,  unit: 'g',   sources: ['Metro', 'Lidl'] },
  'pâine prăjită':       { priceBaniPerUnit: 1.0,  unit: 'g',   sources: ['Metro', 'Lidl'] },
  'bagheta':             { priceBaniPerUnit: 0.6,  unit: 'g',   sources: ['Metro', 'Lidl'] },
  'baghetă':             { priceBaniPerUnit: 0.6,  unit: 'g',   sources: ['Metro', 'Lidl'] },
  'orez':                { priceBaniPerUnit: 0.4,  unit: 'g',   sources: ['Metro', 'Selgros'] },
  'paste':               { priceBaniPerUnit: 0.5,  unit: 'g',   sources: ['Metro', 'Selgros'] },
  'paine burger':        { priceBaniPerUnit: 200,  unit: 'buc', sources: ['Metro', 'Selgros'] },       // ~2 RON/buc
  'chifla':              { priceBaniPerUnit: 150,  unit: 'buc', sources: ['Metro', 'Selgros'] },
  'chiflă':              { priceBaniPerUnit: 150,  unit: 'buc', sources: ['Metro', 'Selgros'] },
  'tortilla':            { priceBaniPerUnit: 80,   unit: 'buc', sources: ['Metro', 'Lidl'] },
  'lipie':               { priceBaniPerUnit: 100,  unit: 'buc', sources: ['Metro', 'Lidl'] },

  // ── Fruits ────────────────────────────────────────────────────────────────
  'lamaie':              { priceBaniPerUnit: 0.8,  unit: 'g',   sources: ['Metro', 'Lidl'] },
  'lămâie':              { priceBaniPerUnit: 0.8,  unit: 'g',   sources: ['Metro', 'Lidl'] },
  'portocala':           { priceBaniPerUnit: 0.4,  unit: 'g',   sources: ['Metro', 'Lidl'] },
  'portocală':           { priceBaniPerUnit: 0.4,  unit: 'g',   sources: ['Metro', 'Lidl'] },
  'mere':                { priceBaniPerUnit: 0.3,  unit: 'g',   sources: ['Metro', 'Lidl'] },
  'capsuni':             { priceBaniPerUnit: 1.5,  unit: 'g',   sources: ['Metro', 'Lidl'] },
  'căpșuni':             { priceBaniPerUnit: 1.5,  unit: 'g',   sources: ['Metro', 'Lidl'] },
  'zmeura':              { priceBaniPerUnit: 3.0,  unit: 'g',   sources: ['Metro', 'Selgros'] },
  'zmeur':               { priceBaniPerUnit: 3.0,  unit: 'g',   sources: ['Metro', 'Selgros'] },
  'banana':              { priceBaniPerUnit: 0.5,  unit: 'g',   sources: ['Metro', 'Lidl'] },
  'mango':               { priceBaniPerUnit: 2.0,  unit: 'g',   sources: ['Metro', 'Selgros'] },

  // ── Sweeteners & baking ───────────────────────────────────────────────────
  'zahar':               { priceBaniPerUnit: 0.4,  unit: 'g',   sources: ['Metro', 'Lidl'] },
  'zahăr':               { priceBaniPerUnit: 0.4,  unit: 'g',   sources: ['Metro', 'Lidl'] },
  'miere':               { priceBaniPerUnit: 3.0,  unit: 'g',   sources: ['Metro', 'Lidl'] },
  'cacao':               { priceBaniPerUnit: 3.0,  unit: 'g',   sources: ['Metro', 'Selgros'] },
  'ciocolata':           { priceBaniPerUnit: 4.0,  unit: 'g',   sources: ['Metro', 'Lidl'] },
  'ciocolată':           { priceBaniPerUnit: 4.0,  unit: 'g',   sources: ['Metro', 'Lidl'] },
  'vanilie':             { priceBaniPerUnit: 5.0,  unit: 'g',   sources: ['Metro', 'Selgros'] },
  'bicarbonat':          { priceBaniPerUnit: 1.0,  unit: 'g',   sources: ['Metro', 'Lidl'] },
  'praf de copt':        { priceBaniPerUnit: 1.5,  unit: 'g',   sources: ['Metro', 'Lidl'] },
  'drojdie':             { priceBaniPerUnit: 2.0,  unit: 'g',   sources: ['Metro', 'Lidl'] },
  'gelatina':            { priceBaniPerUnit: 5.0,  unit: 'g',   sources: ['Metro', 'Selgros'] },
  'gelatină':            { priceBaniPerUnit: 5.0,  unit: 'g',   sources: ['Metro', 'Selgros'] },

  // ── Nuts & seeds ─────────────────────────────────────────────────────────
  'nuci':                { priceBaniPerUnit: 4.0,  unit: 'g',   sources: ['Metro', 'Selgros'] },
  'migdale':             { priceBaniPerUnit: 6.0,  unit: 'g',   sources: ['Metro', 'Selgros'] },
  'alune':               { priceBaniPerUnit: 5.0,  unit: 'g',   sources: ['Metro', 'Selgros'] },
  'seminte de susan':    { priceBaniPerUnit: 2.0,  unit: 'g',   sources: ['Metro', 'Selgros'] },
  'seminte floarea soarelui': { priceBaniPerUnit: 1.0, unit: 'g', sources: ['Metro', 'Lidl'] },
  'caju':                { priceBaniPerUnit: 8.0,  unit: 'g',   sources: ['Metro', 'Selgros'] },

  // ── Beverages ────────────────────────────────────────────────────────────
  'apa':                 { priceBaniPerUnit: 0.05, unit: 'ml',  sources: ['Metro', 'Lidl'] },
  'apă':                 { priceBaniPerUnit: 0.05, unit: 'ml',  sources: ['Metro', 'Lidl'] },
  'suc de lamaie':       { priceBaniPerUnit: 0.5,  unit: 'ml',  sources: ['Metro', 'Lidl'] },
  'suc de portocale':    { priceBaniPerUnit: 0.6,  unit: 'ml',  sources: ['Metro', 'Lidl'] },
  'vin alb':             { priceBaniPerUnit: 1.0,  unit: 'ml',  sources: ['Metro', 'Selgros'] },
  'vin rosu':            { priceBaniPerUnit: 1.0,  unit: 'ml',  sources: ['Metro', 'Selgros'] },
  'vin roșu':            { priceBaniPerUnit: 1.0,  unit: 'ml',  sources: ['Metro', 'Selgros'] },
  'bere':                { priceBaniPerUnit: 0.4,  unit: 'ml',  sources: ['Metro', 'Selgros'] },
  'coniac':              { priceBaniPerUnit: 3.0,  unit: 'ml',  sources: ['Metro', 'Selgros'] },
  'cafea':               { priceBaniPerUnit: 10.0, unit: 'g',   sources: ['Metro', 'Selgros'] },       // ~100 RON/kg
  'espresso':            { priceBaniPerUnit: 10.0, unit: 'g',   sources: ['Metro', 'Selgros'] },

  // ── Stock & sauces ────────────────────────────────────────────────────────
  'supa de pui':         { priceBaniPerUnit: 0.3,  unit: 'ml',  sources: ['Metro', 'Selgros'] },
  'supă de pui':         { priceBaniPerUnit: 0.3,  unit: 'ml',  sources: ['Metro', 'Selgros'] },
  'bulion':              { priceBaniPerUnit: 0.8,  unit: 'g',   sources: ['Metro', 'Selgros'] },
  'pasta de rosii':      { priceBaniPerUnit: 0.8,  unit: 'g',   sources: ['Metro', 'Lidl'] },
  'pastă de roșii':      { priceBaniPerUnit: 0.8,  unit: 'g',   sources: ['Metro', 'Lidl'] },
  'sos de rosii':        { priceBaniPerUnit: 0.6,  unit: 'ml',  sources: ['Metro', 'Lidl'] },
  'sos de roșii':        { priceBaniPerUnit: 0.6,  unit: 'ml',  sources: ['Metro', 'Lidl'] },

  // ── Seafood & canned ─────────────────────────────────────────────────────
  'sardine':             { priceBaniPerUnit: 2.5,  unit: 'g',   sources: ['Metro', 'Selgros'] },
  'hamsii':             { priceBaniPerUnit: 3.0,  unit: 'g',   sources: ['Metro', 'Selgros'] },
  'ansoa':               { priceBaniPerUnit: 5.0,  unit: 'g',   sources: ['Metro', 'Selgros'] },
  'masline':             { priceBaniPerUnit: 2.0,  unit: 'g',   sources: ['Metro', 'Selgros'] },
  'măsline':             { priceBaniPerUnit: 2.0,  unit: 'g',   sources: ['Metro', 'Selgros'] },
  'capere':              { priceBaniPerUnit: 4.0,  unit: 'g',   sources: ['Metro', 'Selgros'] },
};

/**
 * Normalise a Romanian ingredient name for lookup:
 * lowercase, remove diacritics, collapse spaces.
 */
export function normaliseName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[ăâÂ]/g, 'a')
    .replace(/[îÎ]/g, 'i')
    .replace(/[șşŞȘ]/g, 's')
    .replace(/[țţŢȚ]/g, 't')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Look up a market price for an ingredient by name.
 *
 * Strategy:
 * 1. Exact match after normalisation
 * 2. Longest prefix / substring match (handles "cartofi prăjiți congelați" → "cartofi prăjiți")
 *
 * Returns `null` if no match found.
 */
export function lookupMarketPrice(name: string, unit: string): MarketPriceEntry | null {
  const normalised = normaliseName(name);

  // 1. Exact match
  if (MARKET_PRICE_TABLE[normalised]) {
    return MARKET_PRICE_TABLE[normalised];
  }

  // 2. Longest key that appears as a substring of the ingredient name
  let bestEntry: MarketPriceEntry | null = null;
  let bestLen = 0;

  for (const [key, entry] of Object.entries(MARKET_PRICE_TABLE)) {
    if (normalised.includes(key) && key.length > bestLen) {
      bestEntry = entry;
      bestLen   = key.length;
    }
  }

  if (bestEntry) return bestEntry;

  // 3. Check if any word in the ingredient name matches a key
  const words = normalised.split(' ');
  for (const word of words) {
    if (word.length >= 4 && MARKET_PRICE_TABLE[word]) {
      return MARKET_PRICE_TABLE[word];
    }
  }

  return null;
}

/**
 * Convert a market price entry to bani-per-requested-unit.
 * For example, if entry is g-based but ingredient is measured in kg.
 */
export function marketPriceInUnit(entry: MarketPriceEntry, requestedUnit: string): number {
  const unitMap: Record<string, number> = {
    g: 1, kg: 1000, mg: 0.001,
    ml: 1, l: 1000,
    buc: 1, bucata: 1,
  };

  const from = entry.unit.toLowerCase();
  const to   = requestedUnit.toLowerCase();

  if (from === to) return entry.priceBaniPerUnit;

  const fromFactor = unitMap[from] ?? 1;
  const toFactor   = unitMap[to]   ?? 1;

  return entry.priceBaniPerUnit * fromFactor / toFactor;
}