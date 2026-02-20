import { prisma } from '../shared/prismaClient';
import { normalizeQty } from '../db/helpers';

export type Severity  = 'CRITICAL' | 'WARNING' | 'INFO';
export type IssueCode =
  | 'NO_RECIPE' | 'PRICE_BELOW_COST' | 'MISSING_ALLERGENS' | 'NO_PRICE'
  | 'NO_PHOTO' | 'WRONG_VAT' | 'VIP_PRICE_LOWER' | 'NO_PREP_TIME'
  | 'NO_EN_TRANSLATION' | 'ORPHAN_INGREDIENT';

export interface AuditIssue {
  id:               string;
  code:             IssueCode;
  severity:         Severity;
  message:          string;
  affectedRecordId: string;
  affectedModel:    string;
  autoFixAvailable: boolean;
}

export interface AuditReport {
  tenantId:    string;
  issues:      AuditIssue[];
  healthScore: number;
  summary:     { critical: number; warning: number; info: number };
  analyzedAt:  Date;
}

export async function runFullAudit(tenantId: string): Promise<AuditReport> {
  const issues: AuditIssue[] = [];

  const products = await (prisma as any).product.findMany({
    where:   { tenantId, deletedAt: null },
    include: { recipe: true, category: true },
  }) as Array<any>;

  const ingredients = await (prisma as any).ingredient.findMany({
    where:  { tenantId, deletedAt: null },
    select: { id: true, name: true },
  }) as Array<{ id: string; name: string }>;

  for (const product of products) {
    // NO_RECIPE
    if (!product.recipe) {
      issues.push({
        id: `${product.id}-no-recipe`,
        code: 'NO_RECIPE', severity: 'WARNING',
        message: `Produsul "${product.name}" nu are rețetă`,
        affectedRecordId: product.id, affectedModel: 'Product',
        autoFixAvailable: false,
      });
    }

    // NO_PRICE
    if (!product.priceNormal || product.priceNormal === 0) {
      issues.push({
        id: `${product.id}-no-price`,
        code: 'NO_PRICE', severity: 'CRITICAL',
        message: `Produsul "${product.name}" nu are preț`,
        affectedRecordId: product.id, affectedModel: 'Product',
        autoFixAvailable: false,
      });
    }

    // NO_PHOTO
    if (!product.imageUrl || product.imageUrl === '') {
      issues.push({
        id: `${product.id}-no-photo`,
        code: 'NO_PHOTO', severity: 'INFO',
        message: `Produsul "${product.name}" nu are fotografie`,
        affectedRecordId: product.id, affectedModel: 'Product',
        autoFixAvailable: true,
      });
    }

    // MISSING_ALLERGENS
    if (!product.allergens || product.allergens.length === 0) {
      issues.push({
        id: `${product.id}-no-allergens`,
        code: 'MISSING_ALLERGENS', severity: 'WARNING',
        message: `Produsul "${product.name}" nu are alergeni declarați`,
        affectedRecordId: product.id, affectedModel: 'Product',
        autoFixAvailable: true,
      });
    }

    // WRONG_VAT
    const categoryName = product.category?.name?.toLowerCase() ?? '';
    const isAlcohol = categoryName.includes('alcool') || categoryName.includes('vin') || categoryName.includes('bere');
    const expectedVat = isAlcohol ? 19 : 9;
    if (product.vatRate !== undefined && product.vatRate !== expectedVat) {
      issues.push({
        id: `${product.id}-wrong-vat`,
        code: 'WRONG_VAT', severity: 'CRITICAL',
        message: `Produsul "${product.name}" are TVA ${product.vatRate}% dar ar trebui ${expectedVat}%`,
        affectedRecordId: product.id, affectedModel: 'Product',
        autoFixAvailable: true,
      });
    }

    // VIP_PRICE_LOWER
    if (product.priceVip !== undefined && product.priceNormal !== undefined &&
        product.priceVip < product.priceNormal) {
      issues.push({
        id: `${product.id}-vip-lower`,
        code: 'VIP_PRICE_LOWER', severity: 'WARNING',
        message: `Produsul "${product.name}" are prețul VIP mai mic decât cel normal`,
        affectedRecordId: product.id, affectedModel: 'Product',
        autoFixAvailable: true,
      });
    }

    // NO_PREP_TIME
    if (product.recipe && (!product.recipe.prepTimeMins || product.recipe.prepTimeMins === 0)) {
      issues.push({
        id: `${product.id}-no-prep-time`,
        code: 'NO_PREP_TIME', severity: 'INFO',
        message: `Rețeta produsului "${product.name}" nu are timp de preparare`,
        affectedRecordId: product.recipe.id, affectedModel: 'Recipe',
        autoFixAvailable: false,
      });
    }

    // NO_EN_TRANSLATION
    if (!product.nameEn && !product.descriptionEn) {
      issues.push({
        id: `${product.id}-no-en`,
        code: 'NO_EN_TRANSLATION', severity: 'INFO',
        message: `Produsul "${product.name}" nu are traducere în engleză`,
        affectedRecordId: product.id, affectedModel: 'Product',
        autoFixAvailable: true,
      });
    }
  }

  // ORPHAN_INGREDIENT: ingredients not used in any recipe
  const usedIngredientIds = await (prisma as any).recipeIngredient.findMany({
    where:  { tenantId },
    select: { ingredientId: true },
  }).then((rows: Array<{ ingredientId: string }>) => new Set(rows.map(r => r.ingredientId)));

  for (const ing of ingredients) {
    if (!usedIngredientIds.has(ing.id)) {
      issues.push({
        id: `${ing.id}-orphan`,
        code: 'ORPHAN_INGREDIENT', severity: 'INFO',
        message: `Ingredientul "${ing.name}" nu este folosit în nicio rețetă`,
        affectedRecordId: ing.id, affectedModel: 'Ingredient',
        autoFixAvailable: false,
      });
    }
  }

  // PRICE_BELOW_COST: check if selling price < cost
  const recipesWithCost = await (prisma as any).recipe.findMany({
    where:   { tenantId },
    include: {
      product: { select: { id: true, name: true, priceNormal: true } },
      recipeIngredients: {
        include: { ingredient: { select: { costPrice: true, unit: true } } }
      },
    },
  }) as Array<any>;

  for (const rec of recipesWithCost) {
    let totalCost = 0;
    for (const ri of rec.recipeIngredients ?? []) {
      const normalizedQty = normalizeQty(ri.quantity, ri.unit ?? 'g', ri.ingredient?.unit ?? 'g');
      totalCost += (ri.ingredient?.costPrice ?? 0) * normalizedQty;
    }
    const costPerServing = rec.servings > 0 ? totalCost / rec.servings : totalCost;
    if (rec.product?.priceNormal && costPerServing > rec.product.priceNormal) {
      issues.push({
        id: `${rec.product.id}-price-below-cost`,
        code: 'PRICE_BELOW_COST', severity: 'CRITICAL',
        message: `Produsul "${rec.product.name}" se vinde sub cost (cost: ${costPerServing}, preț: ${rec.product.priceNormal})`,
        affectedRecordId: rec.product.id, affectedModel: 'Product',
        autoFixAvailable: false,
      });
    }
  }

  const critical = issues.filter(i => i.severity === 'CRITICAL').length;
  const warning  = issues.filter(i => i.severity === 'WARNING').length;
  const info     = issues.filter(i => i.severity === 'INFO').length;
  const healthScore = Math.max(0, 100 - critical * 10 - warning * 3 - info * 1);

  return {
    tenantId,
    issues,
    healthScore,
    summary: { critical, warning, info },
    analyzedAt: new Date(),
  };
}
