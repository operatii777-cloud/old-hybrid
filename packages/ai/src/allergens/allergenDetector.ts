import { openai, AI_MODEL_MINI } from '../shared/openaiClient';
import { prisma } from '../shared/prismaClient';

export const EU_ALLERGENS: Record<string, { code: string; keywords: string[] }> = {
  GLUTEN:       { code: 'A', keywords: ['grâu', 'wheat', 'orz', 'barley', 'secară', 'rye', 'spelta', 'gluten', 'făină'] },
  CRUSTACEE:    { code: 'B', keywords: ['creveți', 'shrimp', 'crab', 'homar', 'lobster', 'crustacee'] },
  OUA:          { code: 'C', keywords: ['ouă', 'egg', 'ou', 'maioneză', 'mayonnaise', 'meringue'] },
  PESTE:        { code: 'D', keywords: ['pește', 'fish', 'somon', 'salmon', 'cod', 'ton', 'tuna', 'anchoa'] },
  ARAHIDE:      { code: 'E', keywords: ['arahide', 'peanut', 'groundnut', 'alune americane'] },
  SOIA:         { code: 'F', keywords: ['soia', 'soy', 'tofu', 'miso', 'edamame', 'tempeh'] },
  LAPTE:        { code: 'G', keywords: ['lapte', 'milk', 'smântână', 'cream', 'unt', 'butter', 'brânză', 'cheese', 'iaurt', 'yogurt', 'lactoză', 'lactose'] },
  NUCI:         { code: 'H', keywords: ['migdale', 'almond', 'alune', 'hazelnut', 'nuci', 'walnut', 'caju', 'cashew', 'fistic', 'pistachio', 'pecan', 'macadamia'] },
  TELINA:       { code: 'I', keywords: ['țelină', 'celery', 'celeriac'] },
  MUSTAR:       { code: 'J', keywords: ['muștar', 'mustard'] },
  SUSAN:        { code: 'K', keywords: ['susan', 'sesame', 'tahini'] },
  SO2:          { code: 'L', keywords: ['dioxid de sulf', 'sulfur dioxide', 'sulfit', 'sulfite', 'so2'] },
  LUPIN:        { code: 'M', keywords: ['lupin', 'lupine', 'lupini'] },
  MOLUSTE:      { code: 'N', keywords: ['midii', 'mussels', 'stridii', 'oyster', 'scoici', 'clams', 'caracatiță', 'octopus', 'calmar', 'squid'] },
};

export interface AllergenInfo {
  code: string;
  confidence: number;
  source: 'RULE' | 'AI';
}

export interface AllergenDetectionResult {
  allergens:  AllergenInfo[];
  additives:  string[];
}

export async function detectAllergensForIngredient(
  name: string
): Promise<AllergenDetectionResult> {
  const lowerName = name.toLowerCase();
  const ruleAllergens: AllergenInfo[] = [];

  // Rule-based detection
  for (const [, info] of Object.entries(EU_ALLERGENS)) {
    if (info.keywords.some(kw => lowerName.includes(kw))) {
      ruleAllergens.push({ code: info.code, confidence: 1.0, source: 'RULE' });
    }
  }

  // If no rules matched, use GPT-4o-mini for ambiguous cases
  if (ruleAllergens.length === 0) {
    try {
      const response = await openai.chat.completions.create({
        model: AI_MODEL_MINI,
        temperature: 0,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content: `Ești expert în alergeni alimentari EU. Analizează ingredientul și returnează JSON:
{ "allergens": [{"code": "A"|"B"|...|"N", "confidence": 0-1}], "additives": ["E100", ...] }
Coduri EU: A=gluten, B=crustacee, C=ouă, D=pește, E=arahide, F=soia, G=lapte, H=nuci, I=țelină, J=muștar, K=susan, L=SO2, M=lupin, N=moluște`,
          },
          { role: 'user', content: `Ingredient: "${name}"` },
        ],
      });
      const parsed = JSON.parse(response.choices[0]?.message?.content ?? '{}');
      const aiAllergens: AllergenInfo[] = (parsed.allergens ?? []).map(
        (a: { code: string; confidence: number }) => ({ ...a, source: 'AI' as const })
      );
      return { allergens: aiAllergens, additives: parsed.additives ?? [] };
    } catch {
      return { allergens: [], additives: [] };
    }
  }

  return { allergens: ruleAllergens, additives: [] };
}

export async function calculateRecipeAllergens(
  ingredientIds: string[]
): Promise<string[]> {
  const ingredients = await (prisma as any).ingredient.findMany({
    where: { id: { in: ingredientIds } },
    select: { allergens: true },
  }) as Array<{ allergens: string[] }>;

  const allergenSet = new Set<string>();
  for (const ing of ingredients) {
    for (const a of ing.allergens ?? []) {
      allergenSet.add(a);
    }
  }
  return Array.from(allergenSet);
}
