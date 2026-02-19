/**
 * KDS station routing utility.
 * Shared by kds.js and comenzi.js to avoid duplication.
 */
export const BAR_GRUPE = new Set([
  'RACORITOARE', 'VINURI', 'ALCOOLICE', 'CAFEA', 'VINURI/METAXA'
]);

export const BAR_NAME_PATTERN =
  /CAFEA|ESPRESSO|CAPPUCCINO|LATTE|CEAI|COCKTAIL|SMOOTHIE|SODA|BERE|VIN |VODKA|WHISKY|BRANDY|GIN |RUM |TEQUILA/i;

/**
 * Determine which KDS station a product belongs to.
 * @param {string} den_prod - Product name
 * @param {string} grupa - Product group
 * @returns {'bar'|'bucatarie'}
 */
export function detectStatie(den_prod, grupa) {
  const g = (grupa || '').toUpperCase().trim();
  if (BAR_GRUPE.has(g)) return 'bar';
  if (BAR_NAME_PATTERN.test(den_prod || '')) return 'bar';
  return 'bucatarie';
}
