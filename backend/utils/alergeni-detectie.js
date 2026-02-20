/**
 * Detectare automată alergeni și aditivi din denumirea ingredientului.
 * Conform Regulamentului (UE) nr. 1169/2011 privind informarea consumatorilor
 * despre produsele alimentare – cei 14 alergeni majori.
 */

/** Cei 14 alergeni majori EU */
export const ALERGENI_EU = [
  { cod: 'A01', denumire: 'Gluten (cereale)', descriere: 'Grâu, secară, orz, ovăz, alac, kamut' },
  { cod: 'A02', denumire: 'Crustacee', descriere: 'Creveți, crabi, homari, langustine' },
  { cod: 'A03', denumire: 'Ouă', descriere: 'Ouă și produse din ouă' },
  { cod: 'A04', denumire: 'Pește', descriere: 'Pește și produse din pește' },
  { cod: 'A05', denumire: 'Arahide', descriere: 'Arahide și produse din arahide' },
  { cod: 'A06', denumire: 'Soia', descriere: 'Soia și produse din soia' },
  { cod: 'A07', denumire: 'Lapte', descriere: 'Lapte și produse lactate (inclusiv lactoză)' },
  { cod: 'A08', denumire: 'Nuci', descriere: 'Migdale, alune, nuci, caju, fistic, nuci pecan, braziliene, macadamia' },
  { cod: 'A09', denumire: 'Țelină', descriere: 'Țelină și produse din țelină' },
  { cod: 'A10', denumire: 'Muștar', descriere: 'Muștar și produse din muștar' },
  { cod: 'A11', denumire: 'Susan', descriere: 'Semințe de susan și produse din susan' },
  { cod: 'A12', denumire: 'Dioxid de sulf / Sulfiți', descriere: 'Concentrații > 10 mg/kg sau 10 mg/l SO₂' },
  { cod: 'A13', denumire: 'Lupin', descriere: 'Lupin și produse din lupin' },
  { cod: 'A14', denumire: 'Moluște', descriere: 'Scoici, midii, caracatiță, calmar' },
];

/** Reguli de mapare ingredient → alergeni detectați */
const REGULI_ALERGENI = [
  // Gluten
  { alergen: 'A01', pattern: /\b(faina|făină|griu|grâu|secara|secară|orz|ovaz|ovăz|alac|kamut|griș|gris|semolina|malț|malt|bere|paine|pâine|toast|croissant|covrigi|biscuiti|biscuiți|pizza|paste|macaroane|spaghete|tagliatelle|spaetzle|crutoane|pesmet|panura|panko|cereale|wheat|flour|gluten|breadcrumb|semolino)\b/i },
  // Ouă
  { alergen: 'A03', pattern: /\b(ou|ouă|oua|albuș|albus|gălbenuș|galbenus|meringue|maioneza|maioneză|hollandaise|bearnaise|custard|ou\s+de\s+gaina|eggs?|egg)\b/i },
  // Lapte/lactate
  { alergen: 'A07', pattern: /\b(lapte|smantana|smântână|frisca|frișcă|unt|branza|brânză|cascaval|cașcaval|iaurt|yogurt|crema\s+de\s+lapte|parmezan|mozzarella|camembert|brie|ricotta|mascarpone|ghee|lactoza|lactoză|whey|casein|zer|telemea|urda|urdă|caș|cas)\b/i },
  // Pește
  { alergen: 'A04', pattern: /\b(peste|pește|somon|ton|hering|anchoa|sardine|scrumbie|tilapia|crap|stiuca|biban|pastrav|păstrăv|cod|halibut|dorada|bar\s+de\s+mare|icre|caviar|worcestershire|fish)\b/i },
  // Crustacee
  { alergen: 'A02', pattern: /\b(creveti|creveți|crab|homar|langustine|langustă|scampi|rac|shrimp|prawn|lobster)\b/i },
  // Arahide
  { alergen: 'A05', pattern: /\b(arahide|alune\s+de\s+pamant|alune\s+de\s+pământ|unt\s+de\s+arahide|peanut|groundnut|satay)\b/i },
  // Soia
  { alergen: 'A06', pattern: /\b(soia|tofu|edamame|tempeh|miso|sos\s+de\s+soia|tamari|soy|soymilk|soja)\b/i },
  // Nuci
  { alergen: 'A08', pattern: /\b(nuci|nuca|alune|migdale|caju|fistic|pecan|macadamia|nut|hazelnut|walnut|almond|cashew|pistachio)\b/i },
  // Țelină
  { alergen: 'A09', pattern: /\b(telina|țelina|celeriac|celery)\b/i },
  // Muștar
  { alergen: 'A10', pattern: /\b(mustar|muștar|mustard)\b/i },
  // Susan
  { alergen: 'A11', pattern: /\b(susan|seminte\s+susan|sesam|tahini|sesame)\b/i },
  // Dioxid de sulf/sulfiți
  { alergen: 'A12', pattern: /\b(sulfiti|sulfiți|sulf|dioxid\s+de\s+sulf|vin|wine|cidru|otet|oțet|fructe\s+uscate|dried\s+fruit|conserve)\b/i },
  // Lupin
  { alergen: 'A13', pattern: /\b(lupin|lupine)\b/i },
  // Moluște
  { alergen: 'A14', pattern: /\b(scoici|midii|caracatita|caracatiță|calmar|squid|octopus|molusc|clam|oyster|mussel)\b/i },
];

/** Aditivi comuni în alimentație */
export const ADITIVI_COMUNI = [
  { cod: 'E100', denumire: 'Curcumină', categorie: 'Colorant' },
  { cod: 'E102', denumire: 'Tartrazină', categorie: 'Colorant' },
  { cod: 'E120', denumire: 'Carmin (Roșu Cochineal)', categorie: 'Colorant' },
  { cod: 'E150a', denumire: 'Caramel', categorie: 'Colorant' },
  { cod: 'E200', denumire: 'Acid sorbic', categorie: 'Conservant' },
  { cod: 'E211', denumire: 'Benzoat de sodiu', categorie: 'Conservant' },
  { cod: 'E220', denumire: 'Dioxid de sulf', categorie: 'Conservant' },
  { cod: 'E250', denumire: 'Nitrit de sodiu', categorie: 'Conservant' },
  { cod: 'E300', denumire: 'Acid ascorbic (Vitamina C)', categorie: 'Antioxidant' },
  { cod: 'E330', denumire: 'Acid citric', categorie: 'Antioxidant/Regulator aciditate' },
  { cod: 'E401', denumire: 'Alginat de sodiu', categorie: 'Emulgator/Stabilizator' },
  { cod: 'E412', denumire: 'Gumă de guar', categorie: 'Îngroșător' },
  { cod: 'E415', denumire: 'Gumă xantan', categorie: 'Îngroșător' },
  { cod: 'E471', denumire: 'Mono- și digliceride', categorie: 'Emulgator' },
  { cod: 'E500', denumire: 'Carbonat de sodiu (Bicarbonat)', categorie: 'Afânător' },
  { cod: 'E621', denumire: 'Glutamat monosodic (MSG)', categorie: 'Potențator aromă' },
  { cod: 'E627', denumire: 'Guanilat disodic', categorie: 'Potențator aromă' },
  { cod: 'E951', denumire: 'Aspartam', categorie: 'Îndulcitor' },
  { cod: 'E954', denumire: 'Zaharină', categorie: 'Îndulcitor' },
  { cod: 'E1442', denumire: 'Fosfat de diamidon hidroxipropilat', categorie: 'Amidon modificat' },
];

/**
 * Detectează alergenii unui ingredient pe baza denumirii.
 * @param {string} denumire - Denumirea ingredientului
 * @returns {string[]} - Array de coduri alergeni detectați (ex: ['A01', 'A07'])
 */
export function detecteazaAlergeni(denumire) {
  if (!denumire || typeof denumire !== 'string') return [];
  const alergeniGasiti = new Set();
  for (const regula of REGULI_ALERGENI) {
    if (regula.pattern.test(denumire)) {
      alergeniGasiti.add(regula.alergen);
    }
  }
  return Array.from(alergeniGasiti);
}

/**
 * Returnează lista completă de alergeni detectați cu detalii.
 * @param {string} denumire
 * @returns {object[]}
 */
export function getAlergeniDetalii(denumire) {
  const coduri = detecteazaAlergeni(denumire);
  return ALERGENI_EU.filter(a => coduri.includes(a.cod));
}

/**
 * Detectează alergenii pentru o rețetă (array de ingrediente).
 * @param {string[]} denumiri - Array cu denumirile ingredientelor
 * @returns {object[]} - Array de alergeni unici cu detalii
 */
export function getAlergeniReteta(denumiri) {
  if (!Array.isArray(denumiri)) return [];
  const coduri = new Set();
  for (const den of denumiri) {
    for (const cod of detecteazaAlergeni(den)) {
      coduri.add(cod);
    }
  }
  return ALERGENI_EU.filter(a => coduri.has(a.cod));
}
