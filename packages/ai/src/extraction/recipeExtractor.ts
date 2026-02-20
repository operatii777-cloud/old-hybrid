import { openai, AI_MODEL } from '../shared/openaiClient';
import { ExtractionResultSchema } from './schemas';
import type { ExtractionResult, ExtractedIngredient } from './schemas';
import type { SourceType } from '../ingestion/documentParser';

export type { ExtractionResult } from './schemas';

const CHUNK_SIZE = 6000;

function splitIntoChunks(text: string): string[] {
  const chunks: string[] = [];
  for (let i = 0; i < text.length; i += CHUNK_SIZE) {
    chunks.push(text.slice(i, i + CHUNK_SIZE));
  }
  return chunks.length ? chunks : [''];
}

// ── Local mock parser (USE_MOCK_AI=true) ─────────────────────────────────
// Parses Romanian HORECA menu text without any AI API call.
// Format expected:
//   PRODUS NUME [WEIGHT]
//   (ingredient qty unit, ingredient qty unit, ...)
//   [Preț: N RON]

const CATEGORY_HINTS: Array<[RegExp, string]> = [
  [/mic\s*dejun/i,                         'Mic Dejun'],
  [/bruschete|aperitiv|tapa/i,             'Aperitive'],
  [/salat[aă]/i,                           'Salate'],
  [/supa|ciorb[aă]/i,                      'Supe și Ciorbe'],
  [/pizza/i,                               'Pizza'],
  [/paste|spaghetti|tagliatelle/i,         'Paste'],
  [/sandwich|burger|wrap/i,               'Sandwichuri & Burgeri'],
  [/desert|tort|prajitur[aă]|inghetat[aă]/i, 'Desert'],
  [/gratar|grill|fript/i,                  'Grătar'],
];

function detectCategory(name: string): string {
  for (const [re, cat] of CATEGORY_HINTS) {
    if (re.test(name)) return cat;
  }
  return 'General';
}

function parseMockIngredient(raw: string): ExtractedIngredient | null {
  const text = raw.trim();
  if (!text) return null;

  // Match "name N unit" or "name Nu" (quantity attached to unit, e.g. 100g or 2 buc)
  const m = text.match(/^(.*?)\s+(\d+(?:[.,]\d+)?)\s*(g|kg|ml|l|buc|pcs?)\.?$/i);
  if (m) {
    return {
      name:     m[1].trim(),
      quantity: parseFloat(m[2].replace(',', '.')),
      unit:     m[3].toLowerCase().startsWith('buc') ? 'buc' : m[3].toLowerCase(),
    };
  }
  // No quantity found — treat as 1 buc (e.g. "busuioc", "usturoi")
  return { name: text, quantity: 1, unit: 'buc' };
}

function parseMockRecipes(text: string): ExtractionResult {
  const recipes: ExtractionResult['recipes'] = [];

  // Split by blank line(s) — each block is one product
  const blocks = text.split(/\n\s*\n/).map(b => b.trim()).filter(Boolean);

  for (const block of blocks) {
    const lines = block.split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length === 0) continue;

    // First line = product name, optionally followed by a weight spec like "400G"
    const rawName = lines[0].replace(/\s+\d+[gGkKmMlL]+$/, '').trim();
    if (!rawName) continue;

    // Find ingredient list — text inside parentheses anywhere in the block
    const ingText = block.match(/\(([^)]+)\)/)?.[1] ?? '';
    const ingredients = ingText
      .split(',')
      .map(parseMockIngredient)
      .filter((i): i is ExtractedIngredient => i !== null);

    if (ingredients.length === 0) continue;

    recipes.push({
      productName:  rawName,
      category:     detectCategory(rawName),
      description:  undefined,
      servings:     1,
      prepTimeMins: undefined,
      ingredients,
    });
  }

  return { recipes, totalFound: recipes.length, confidence: 0.8 };
}

// ── Main extractor ────────────────────────────────────────────────────────

export async function extractRecipesFromText(
  rawText: string,
  sourceHint?: SourceType
): Promise<ExtractionResult> {
  // Local mock mode — bypass AI API entirely (useful for CI / no API key)
  if (process.env.USE_MOCK_AI === 'true') {
    return parseMockRecipes(rawText);
  }

  const chunks = splitIntoChunks(rawText);
  const allRecipes: ExtractionResult['recipes'] = [];

  for (const chunk of chunks) {
    const response = await openai.chat.completions.create({
      model: AI_MODEL,
      temperature: 0.1,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: `Ești un expert în gastronomie. Extrage rețete complete din textul de meniu.
Returnează un JSON cu structura:
{
  "recipes": [{
    "productName": "string",
    "category": "string",
    "description": "string|null",
    "servings": number,
    "prepTimeMins": number|null,
    "ingredients": [{ "name": "string", "quantity": number, "unit": "string" }]
  }],
  "totalFound": number,
  "confidence": number (0-1)
}
Normalizează unitățile: g, kg, ml, l, buc. Nu lăsa câmpuri goale.`,
        },
        {
          role: 'user',
          content: `Sursă: ${sourceHint ?? 'TEXT'}\n\n${chunk}`,
        },
      ],
    });

    const content = response.choices[0]?.message?.content ?? '{}';
    try {
      const parsed = JSON.parse(content);
      const validated = ExtractionResultSchema.parse(parsed);
      allRecipes.push(...validated.recipes);
    } catch {
      // Skip invalid chunks
    }
  }

  // Deduplicate by productName (case insensitive)
  const seen = new Set<string>();
  const unique = allRecipes.filter(r => {
    const key = r.productName.toLowerCase().trim();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return {
    recipes:    unique,
    totalFound: unique.length,
    confidence: unique.length > 0 ? 0.85 : 0,
  };
}
