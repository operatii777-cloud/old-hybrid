import { prisma } from '../shared/prismaClient';
import { detectAllergensForIngredient, calculateRecipeAllergens } from '../allergens/allergenDetector';
import { generateProductPhoto } from '../photos/photoGenerator';
import { openai, AI_MODEL_MINI } from '../shared/openaiClient';
import type { AuditIssue } from '../audit/dbAuditor';

export type RepairStatus = 'FIXED' | 'FAILED' | 'NEEDS_REVIEW' | 'SKIPPED';

const VIP_PRICE_MULTIPLIER = parseFloat(process.env.VIP_PRICE_MULTIPLIER ?? '1.25');

export interface RepairResult {
  issueId:     string;
  issueCode:   string;
  status:      RepairStatus;
  description: string;
}

export async function repairIssues(
  tenantId:  string,
  userId:    string,
  issues:    AuditIssue[],
  opts?:     { dryRun?: boolean; onProgress?: (msg: string) => void }
): Promise<RepairResult[]> {
  const fixable = issues.filter(i => i.autoFixAvailable);
  const results: RepairResult[] = [];
  const auditEntries: Array<Record<string, unknown>> = [];

  for (const issue of fixable) {
    opts?.onProgress?.(`Reparare: ${issue.code} pe ${issue.affectedRecordId}`);

    try {
      switch (issue.code) {
        case 'MISSING_ALLERGENS': {
          const product = await (prisma as any).product.findUnique({
            where:   { id: issue.affectedRecordId },
            include: { recipe: { include: { recipeIngredients: { select: { ingredientId: true } } } } },
          }) as any;
          if (!product?.recipe) { results.push({ issueId: issue.id, issueCode: issue.code, status: 'SKIPPED', description: 'Fără rețetă' }); break; }

          const ingIds = product.recipe.recipeIngredients.map((ri: any) => ri.ingredientId) as string[];
          const allergens = await calculateRecipeAllergens(ingIds);

          if (!opts?.dryRun) {
            await (prisma as any).product.update({
              where: { id: issue.affectedRecordId },
              data:  { allergens },
            });
            auditEntries.push({ tenantId, userId, action: 'AI_REPAIR', model: 'Product', recordId: issue.affectedRecordId, newValue: JSON.stringify({ allergens }) });
          }
          results.push({ issueId: issue.id, issueCode: issue.code, status: 'FIXED', description: `Setați ${allergens.length} alergeni` });
          break;
        }

        case 'NO_PHOTO': {
          const product = await (prisma as any).product.findUnique({
            where:  { id: issue.affectedRecordId },
            select: { name: true, description: true, category: { select: { name: true } } },
          }) as any;
          if (!product) { results.push({ issueId: issue.id, issueCode: issue.code, status: 'FAILED', description: 'Produs negăsit' }); break; }

          const photo = await generateProductPhoto(product.name, product.description ?? '', product.category?.name ?? '', tenantId);
          if (!opts?.dryRun && photo.url) {
            await (prisma as any).product.update({
              where: { id: issue.affectedRecordId },
              data:  { imageUrl: photo.url, thumbnailUrl: photo.thumbnailUrl },
            });
            auditEntries.push({ tenantId, userId, action: 'AI_REPAIR', model: 'Product', recordId: issue.affectedRecordId, newValue: JSON.stringify({ imageUrl: photo.url }) });
          }
          results.push({ issueId: issue.id, issueCode: issue.code, status: 'FIXED', description: 'Fotografie generată' });
          break;
        }

        case 'WRONG_VAT': {
          const product = await (prisma as any).product.findUnique({
            where:  { id: issue.affectedRecordId },
            include: { category: { select: { name: true } } },
          }) as any;
          if (!product) { results.push({ issueId: issue.id, issueCode: issue.code, status: 'FAILED', description: 'Produs negăsit' }); break; }

          const name = product.category?.name?.toLowerCase() ?? '';
          const isAlcohol = name.includes('alcool') || name.includes('vin') || name.includes('bere');
          const correctVat = isAlcohol ? 19 : 9;

          if (!opts?.dryRun) {
            await (prisma as any).product.update({
              where: { id: issue.affectedRecordId },
              data:  { vatRate: correctVat },
            });
            auditEntries.push({ tenantId, userId, action: 'AI_REPAIR', model: 'Product', recordId: issue.affectedRecordId, newValue: JSON.stringify({ vatRate: correctVat }) });
          }
          results.push({ issueId: issue.id, issueCode: issue.code, status: 'FIXED', description: `TVA corectat la ${correctVat}%` });
          break;
        }

        case 'VIP_PRICE_LOWER': {
          const product = await (prisma as any).product.findUnique({
            where:  { id: issue.affectedRecordId },
            select: { priceNormal: true },
          }) as any;
          if (!product) { results.push({ issueId: issue.id, issueCode: issue.code, status: 'FAILED', description: 'Produs negăsit' }); break; }

          const newVip = Math.round(product.priceNormal * VIP_PRICE_MULTIPLIER);
          if (!opts?.dryRun) {
            await (prisma as any).product.update({
              where: { id: issue.affectedRecordId },
              data:  { priceVip: newVip },
            });
            auditEntries.push({ tenantId, userId, action: 'AI_REPAIR', model: 'Product', recordId: issue.affectedRecordId, newValue: JSON.stringify({ priceVip: newVip }) });
          }
          results.push({ issueId: issue.id, issueCode: issue.code, status: 'FIXED', description: `Preț VIP corectat la ${newVip}` });
          break;
        }

        case 'NO_EN_TRANSLATION': {
          const product = await (prisma as any).product.findUnique({
            where:  { id: issue.affectedRecordId },
            select: { name: true, description: true },
          }) as any;
          if (!product) { results.push({ issueId: issue.id, issueCode: issue.code, status: 'FAILED', description: 'Produs negăsit' }); break; }

          const response = await openai.chat.completions.create({
            model:       AI_MODEL_MINI,
            temperature: 0.3,
            messages: [
              { role: 'system', content: 'Translate Romanian food menu items to English. Return JSON: { "nameEn": "...", "descriptionEn": "..." }' },
              { role: 'user',   content: `Name: ${product.name}\nDescription: ${product.description ?? ''}` },
            ],
            response_format: { type: 'json_object' },
          });
          const translation = JSON.parse(response.choices[0]?.message?.content ?? '{}');
          if (!opts?.dryRun) {
            await (prisma as any).product.update({
              where: { id: issue.affectedRecordId },
              data:  { nameEn: translation.nameEn, descriptionEn: translation.descriptionEn },
            });
            auditEntries.push({ tenantId, userId, action: 'AI_REPAIR', model: 'Product', recordId: issue.affectedRecordId, newValue: JSON.stringify(translation) });
          }
          results.push({ issueId: issue.id, issueCode: issue.code, status: 'FIXED', description: 'Traducere EN adăugată' });
          break;
        }

        case 'PRICE_BELOW_COST':
          results.push({ issueId: issue.id, issueCode: issue.code, status: 'NEEDS_REVIEW', description: 'Prețul sub cost necesită revizuire manuală' });
          break;

        default:
          results.push({ issueId: issue.id, issueCode: issue.code, status: 'SKIPPED', description: 'Tip de problemă nesuportat pentru auto-reparare' });
      }
    } catch (err) {
      results.push({ issueId: issue.id, issueCode: issue.code, status: 'FAILED', description: String(err) });
    }
  }

  // Bulk create audit logs for all FIXED results
  if (!opts?.dryRun && auditEntries.length > 0) {
    await (prisma as any).auditLog.createMany({ data: auditEntries }).catch(console.error);
  }

  return results;
}
