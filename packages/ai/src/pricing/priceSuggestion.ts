import { prisma } from '../shared/prismaClient';
import { normalizeQty, psychoRound } from '../db/helpers';
import { lookupMarketPrice, marketPriceInUnit } from './marketPrices';

export interface PricingIngredientInput {
  ingredientId: string;
  quantity:     number;
  unit:         string;
}

const VIP_MULTIPLIER = parseFloat(process.env.VIP_PRICE_MULTIPLIER ?? '1.25');

export interface RawIngredientInput {
  name:     string;
  quantity: number;
  unit:     string;
}

export interface PricingSuggestion {
  costPerServingCents:    number;
  suggestedPriceNormal:   number;
  suggestedPriceVip:      number;
  suggestedPriceDiscount: number;
  confidence:             'HIGH' | 'MEDIUM' | 'LOW';
  foodCostPct:            number;
  /** true when at least one ingredient used a market-price estimate */
  usedMarketPriceFallback: boolean;
  breakdown:              Array<{
    name:            string;
    costCents:       number;
    /** present when cost came from market-price table, not tenant DB */
    marketPriceNote?: string;
  }>;
}

/** Price ingredients that exist in the tenant's DB (by ID). */
async function priceFromDb(
  tenantId: string,
  recipeIngredients: PricingIngredientInput[]
): Promise<{
  totalCostCents: number;
  priced: number;
  usedMarketPriceFallback: boolean;
  breakdown: PricingSuggestion['breakdown'];
}> {
  const breakdown: PricingSuggestion['breakdown'] = [];
  let totalCostCents = 0;
  let priced = 0;
  let usedMarketPriceFallback = false;

  for (const item of recipeIngredients) {
    const ing = await (prisma as any).ingredient.findFirst({
      where: { id: item.ingredientId, tenantId },
      select: { name: true, unit: true, avgWeightedPrice: true, costPrice: true },
    }) as { name: string; unit: string; avgWeightedPrice?: number; costPrice?: number } | null;

    if (!ing) continue;

    let pricePer = ing.avgWeightedPrice ?? ing.costPrice ?? 0;
    let marketPriceNote: string | undefined;

    if (pricePer === 0) {
      const market = lookupMarketPrice(ing.name, ing.unit);
      if (market) {
        pricePer = marketPriceInUnit(market, ing.unit);
        marketPriceNote = `estimare Metro/Selgros/Lidl (~${(pricePer / 100).toFixed(2)} RON/${ing.unit})`;
        usedMarketPriceFallback = true;

        // Persist market price so future lookups skip this fallback.
        // Match rows where costPrice is null OR 0 (both mean "no price recorded").
        await (prisma as any).ingredient.updateMany({
          where: { id: item.ingredientId, tenantId, OR: [{ costPrice: null }, { costPrice: 0 }] },
          data:  { costPrice: Math.max(1, Math.round(pricePer)) },
        });
      }
    }

    if (pricePer === 0) continue;

    priced++;
    const normalizedQty = normalizeQty(item.quantity, item.unit, ing.unit);
    const costCents = Math.round(normalizedQty * pricePer);
    totalCostCents += costCents;
    breakdown.push({ name: ing.name, costCents, ...(marketPriceNote ? { marketPriceNote } : {}) });
  }

  return { totalCostCents, priced, usedMarketPriceFallback, breakdown };
}

/** Price ingredients purely from market table (for dry-run / NEW ingredients not yet in DB). */
function priceFromMarket(rawIngredients: RawIngredientInput[]): {
  totalCostCents: number;
  priced: number;
  usedMarketPriceFallback: boolean;
  breakdown: PricingSuggestion['breakdown'];
} {
  const breakdown: PricingSuggestion['breakdown'] = [];
  let totalCostCents = 0;
  let priced = 0;

  for (const item of rawIngredients) {
    const market = lookupMarketPrice(item.name, item.unit);
    if (!market) continue;

    const pricePer = marketPriceInUnit(market, item.unit);
    const costCents = Math.round(item.quantity * pricePer);
    totalCostCents += costCents;
    priced++;
    breakdown.push({
      name:            item.name,
      costCents,
      marketPriceNote: `estimare Metro/Selgros/Lidl (~${(pricePer / 100).toFixed(2)} RON/${item.unit})`,
    });
  }

  return { totalCostCents, priced, usedMarketPriceFallback: priced > 0, breakdown };
}

export async function suggestProductPrice(
  tenantId:          string,
  recipeIngredients: PricingIngredientInput[],
  servings:          number,
  targetFoodCostPct: number = 30,
  /** Provide raw extracted ingredients for market-price fallback on dry-run / new products */
  rawIngredients?: RawIngredientInput[]
): Promise<PricingSuggestion> {
  // Price ingredients that are in the DB
  const dbResult = await priceFromDb(tenantId, recipeIngredients);

  // For any ingredient not covered by the DB result, try market prices
  // (covers: NEW ingredients on first import, or dry-run where nothing is written to DB)
  const coveredNames = new Set(dbResult.breakdown.map(b => b.name.toLowerCase()));
  const uncovered = (rawIngredients ?? []).filter(
    r => !coveredNames.has(r.name.toLowerCase())
  );
  const marketResult = priceFromMarket(uncovered);

  const totalCostCents = dbResult.totalCostCents + marketResult.totalCostCents;
  const priced         = dbResult.priced + marketResult.priced;
  const breakdown      = [...dbResult.breakdown, ...marketResult.breakdown];
  const usedMarketPriceFallback = dbResult.usedMarketPriceFallback || marketResult.usedMarketPriceFallback;

  const totalIngredients = recipeIngredients.length + (rawIngredients?.length ?? 0);

  const costPerServingCents = servings > 0 ? Math.round(totalCostCents / servings) : totalCostCents;
  const raw = Math.round(costPerServingCents / (targetFoodCostPct / 100));
  const suggestedPriceNormal   = psychoRound(raw);
  const suggestedPriceVip      = psychoRound(Math.round(raw * VIP_MULTIPLIER));
  const suggestedPriceDiscount = psychoRound(Math.round(raw * 0.85));

  const ratio = totalIngredients > 0 ? priced / totalIngredients : 0;
  const confidence: 'HIGH' | 'MEDIUM' | 'LOW' =
    ratio >= 0.8 ? 'HIGH' : ratio >= 0.5 ? 'MEDIUM' : 'LOW';

  return {
    costPerServingCents,
    suggestedPriceNormal,
    suggestedPriceVip,
    suggestedPriceDiscount,
    confidence,
    foodCostPct: targetFoodCostPct,
    usedMarketPriceFallback,
    breakdown,
  };
}
