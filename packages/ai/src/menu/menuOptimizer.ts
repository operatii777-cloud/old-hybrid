import { prisma } from '../shared/prismaClient';
import { openai } from '../shared/openaiClient';

export interface MenuOptimizationReport {
  overallScore:       number;
  recommendations:    string[];
  menuGaps:           string[];
  topPerformers:      Array<{ id: string; name: string; score: number }>;
  descriptionsFixed:  number;
  analyzedAt:         Date;
}

export async function optimizeMenu(
  tenantId:   string,
  locationId?: string
): Promise<MenuOptimizationReport> {
  const whereClause: Record<string, unknown> = { tenantId, deletedAt: null };
  if (locationId) whereClause['locationId'] = locationId;

  const categories = await (prisma as any).category.findMany({
    where:   whereClause,
    include: {
      products: {
        where:  { deletedAt: null },
        select: {
          id: true, name: true, description: true,
          priceNormal: true, orderCount: true, marginCents: true,
        },
      },
    },
  }) as Array<any>;

  // Build menu summary for GPT analysis
  const menuSummary = categories.map((cat: any) => ({
    category: cat.name,
    products: (cat.products ?? []).map((p: any) => ({
      name:       p.name,
      price:      p.priceNormal,
      orders:     p.orderCount ?? 0,
      margin:     p.marginCents ?? 0,
      hasDesc:    Boolean(p.description),
    })),
  }));

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    temperature: 0.3,
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content: `Ești consultant HORECA expert. Analizează meniul și returnează JSON:
{ "overallScore": 0-100, "recommendations": ["..."], "menuGaps": ["..."], "topPerformers": [{"name": "...", "score": 0-100}] }`,
      },
      { role: 'user', content: JSON.stringify(menuSummary) },
    ],
  });

  const analysis = JSON.parse(response.choices[0]?.message?.content ?? '{}');
  let descriptionsFixed = 0;

  // Auto-fix: generate descriptions for products without one
  const allProducts = categories.flatMap((c: any) => c.products ?? []) as Array<any>;
  for (const product of allProducts) {
    if (!product.description || product.description.trim() === '') {
      try {
        const descResp = await openai.chat.completions.create({
          model:       'gpt-4o-mini',
          temperature: 0.5,
          messages: [
            { role: 'system', content: 'Generează o descriere scurtă și apetisantă (max 80 cuvinte) pentru un produs de meniu românesc.' },
            { role: 'user',   content: `Produs: ${product.name}` },
          ],
        });
        const desc = descResp.choices[0]?.message?.content ?? '';
        await (prisma as any).product.update({
          where: { id: product.id },
          data:  { description: desc },
        });
        descriptionsFixed++;
      } catch { /* Skip on error */ }
    }
  }

  // Reorder products in each category: margin×0.6 + orders×0.4 descending
  for (const category of categories) {
    const sorted = [...(category.products ?? [])].sort((a: any, b: any) => {
      const scoreA = (a.marginCents ?? 0) * 0.6 + (a.orderCount ?? 0) * 0.4;
      const scoreB = (b.marginCents ?? 0) * 0.6 + (b.orderCount ?? 0) * 0.4;
      return scoreB - scoreA;
    });
    for (let i = 0; i < sorted.length; i++) {
      await (prisma as any).product.update({
        where: { id: sorted[i].id },
        data:  { sortOrder: i },
      }).catch(() => {});
    }
  }

  const topPerformers = (analysis.topPerformers ?? []).map((tp: any) => {
    const product = allProducts.find((p: any) => p.name === tp.name);
    return { id: product?.id ?? '', name: tp.name, score: tp.score ?? 0 };
  });

  return {
    overallScore:      analysis.overallScore ?? 70,
    recommendations:   analysis.recommendations ?? [],
    menuGaps:          analysis.menuGaps ?? [],
    topPerformers,
    descriptionsFixed,
    analyzedAt:        new Date(),
  };
}
