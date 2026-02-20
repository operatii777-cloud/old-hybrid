import { openai, AI_MODEL } from '../shared/openaiClient';
import { ExtractionResultSchema } from './schemas';
import type { ExtractionResult } from './schemas';
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

export async function extractRecipesFromText(
  rawText: string,
  sourceHint?: SourceType
): Promise<ExtractionResult> {
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
