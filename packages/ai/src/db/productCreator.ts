import { prisma } from '../shared/prismaClient';
import { detectAllergensForIngredient, calculateRecipeAllergens } from '../allergens/allergenDetector';
import { findOrCreateCategory, generateNextIngredientCode } from './helpers';
import type { ExtractedRecipe } from '../extraction/schemas';
import type { MatchResult } from '../matching/ingredientMatcher';
import type { PricingSuggestion } from '../pricing/priceSuggestion';

export interface ProductCreationResult {
  productId:           string;
  recipeId:            string;
  newIngredientsCount: number;
}

export async function createProductFromRecipe(
  tenantId:  string,
  recipe:    ExtractedRecipe,
  matches:   MatchResult[],
  pricing:   PricingSuggestion,
  photoUrl:  string,
  userId:    string
): Promise<ProductCreationResult> {
  // Pre-compute allergens OUTSIDE the transaction to avoid tx timeout
  // (AI calls and Prisma queries can take >5 s combined)
  const allergensByName = new Map<string, string[]>();
  for (const match of matches) {
    if (match.status === 'NEW') {
      const result = await detectAllergensForIngredient(match.inputName);
      allergensByName.set(match.inputName, result.allergens.map(a => a.code));
    }
  }

  return (prisma as any).$transaction(async (tx: any) => {
    const categoryId = await findOrCreateCategory(tx, tenantId, recipe.category);

    // Get last ingredient code for sequence
    const lastIng = await tx.ingredient.findFirst({
      where:   { tenantId },
      orderBy: { code: 'desc' },
      select:  { code: true },
    });
    let lastCode: string | undefined = lastIng?.code;

    // Create new ingredients
    let newIngredientsCount = 0;
    const ingredientIdMap: Map<string, string> = new Map();

    for (const match of matches) {
      if (match.status === 'NEW') {
        lastCode = generateNextIngredientCode(lastCode);

        const newIng = await tx.ingredient.create({
          data: {
            tenantId,
            code:      lastCode,
            name:      match.inputName,
            unit:      match.unit,
            allergens: allergensByName.get(match.inputName) ?? [],
          },
          select: { id: true },
        });
        ingredientIdMap.set(match.inputName, newIng.id);
        newIngredientsCount++;
      } else if (match.matchedIngredient) {
        ingredientIdMap.set(match.inputName, match.matchedIngredient.id);
      }
    }

    // Create product (inactive, pending approval)
    const product = await tx.product.create({
      data: {
        tenantId,
        categoryId,
        name:              recipe.productName,
        description:       recipe.description ?? '',
        imageUrl:          photoUrl,
        priceNormal:       pricing.suggestedPriceNormal,
        priceVip:          pricing.suggestedPriceVip,
        priceDiscount:     pricing.suggestedPriceDiscount,
        isActive:          false,
        vatRate:           9,
      },
      select: { id: true },
    });

    // Create recipe
    const dbRecipe = await tx.recipe.create({
      data: {
        tenantId,
        productId:    product.id,
        servings:     recipe.servings,
        prepTimeMins: recipe.prepTimeMins ?? 0,
      },
      select: { id: true },
    });

    // Create recipe ingredients
    for (const match of matches) {
      const ingredientId = ingredientIdMap.get(match.inputName);
      if (!ingredientId) continue;

      await tx.recipeIngredient.create({
        data: {
          tenantId,
          recipeId:     dbRecipe.id,
          ingredientId,
          quantity:     match.quantity,
          unit:         match.unit,
        },
      });
    }

    // Allergens on product — collect from newly-created ingredient IDs
    const allIngredientIds = matches
      .map(m => ingredientIdMap.get(m.inputName))
      .filter(Boolean) as string[];
    // calculateRecipeAllergens reads ingredient rows — use tx to stay in snapshot
    const ingRows = await tx.ingredient.findMany({
      where:  { id: { in: allIngredientIds } },
      select: { allergens: true },
    }) as Array<{ allergens: string[] }>;
    const allergenSet = new Set<string>();
    for (const row of ingRows) for (const a of row.allergens ?? []) allergenSet.add(a);
    const allergens = Array.from(allergenSet);

    await tx.product.update({
      where: { id: product.id },
      data:  { allergens },
    });

    // Create audit log
    await tx.auditLog.create({
      data: {
        tenantId,
        userId,
        action:   'AI_IMPORT',
        model:    'Product',
        recordId: product.id,
        newValue: JSON.stringify({ productName: recipe.productName }),
      },
    });

    return {
      productId:           product.id,
      recipeId:            dbRecipe.id,
      newIngredientsCount,
    };
  });
}