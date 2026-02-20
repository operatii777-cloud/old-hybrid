import { prisma } from '../shared/prismaClient';
import { normalizeQty, psychoRound } from '../db/helpers';

export interface PricingIngredientInput {
  ingredientId: string;
  quantity:     number;
  unit:         string;
}

export interface PricingSuggestion {
  costPerServingCents:    number;
  suggestedPriceNormal:   number;
  suggestedPriceVip:      number;
  suggestedPriceDiscount: number;
  confidence:             'HIGH' | 'MEDIUM' | 'LOW';
  foodCostPct:            number;
  breakdown:              Array<{ name: string; costCents: number }>;
}

export async function suggestProductPrice(
  tenantId:          string,
  recipeIngredients: PricingIngredientInput[],
  servings:          number,
  targetFoodCostPct: number = 30
): Promise<PricingSuggestion> {
  const breakdown: Array<{ name: string; costCents: number }> = [];
  let totalCostCents = 0;
  let priced = 0;

  for (const item of recipeIngredients) {
    const ing = await (prisma as any).ingredient.findFirst({
      where: { id: item.ingredientId, tenantId },
      select: { name: true, unit: true, avgWeightedPrice: true, costPrice: true },
    }) as { name: string; unit: string; avgWeightedPrice?: number; costPrice?: number } | null;

    if (!ing) continue;
    const pricePer = ing.avgWeightedPrice ?? ing.costPrice ?? 0;
    if (pricePer === 0) continue;

    priced++;
    const normalizedQty = normalizeQty(item.quantity, item.unit, ing.unit);
    const costCents = Math.round(normalizedQty * pricePer);
    totalCostCents += costCents;
    breakdown.push({ name: ing.name, costCents });
  }

  const costPerServingCents = servings > 0 ? Math.round(totalCostCents / servings) : totalCostCents;
  const raw = Math.round((costPerServingCents / (targetFoodCostPct / 100)));
  const suggestedPriceNormal   = psychoRound(raw);
  const suggestedPriceVip      = psychoRound(Math.round(raw * 1.25));
  const suggestedPriceDiscount = psychoRound(Math.round(raw * 0.85));

  const ratio = recipeIngredients.length > 0 ? priced / recipeIngredients.length : 0;
  const confidence: 'HIGH' | 'MEDIUM' | 'LOW' =
    ratio >= 0.8 ? 'HIGH' : ratio >= 0.5 ? 'MEDIUM' : 'LOW';

  return {
    costPerServingCents,
    suggestedPriceNormal,
    suggestedPriceVip,
    suggestedPriceDiscount,
    confidence,
    foodCostPct: targetFoodCostPct,
    breakdown,
  };
}
