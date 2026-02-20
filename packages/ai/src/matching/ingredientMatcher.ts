import Fuse from 'fuse.js';
import { openai } from '../shared/openaiClient';
import { prisma } from '../shared/prismaClient';
import { redis } from '../shared/redisClient';
import { normalizeRo, cosineSim } from '../db/helpers';
import type { ExtractedIngredient } from '../extraction/schemas';

export type MatchStatus = 'EXACT' | 'FUZZY' | 'SEMANTIC' | 'AMBIGUOUS' | 'NEW';

const FUZZY_THRESHOLD = 0.3;

export interface MatchResult {
  inputName:         string;
  quantity:          number;
  unit:              string;
  status:            MatchStatus;
  confidence:        number;
  matchedIngredient: { id: string; name: string; unit: string } | null;
  candidates?:       Array<{ id: string; name: string; score: number }>;
}

async function getEmbedding(text: string, tenantId: string): Promise<number[]> {
  const hash = Buffer.from(text).toString('base64').slice(0, 32);
  const cacheKey = `emb:${tenantId}:${hash}`;

  const cached = await redis.get(cacheKey).catch(() => null);
  if (cached) return JSON.parse(cached) as number[];

  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text,
  });
  const embedding = response.data[0]?.embedding ?? [];
  await redis.setEx(cacheKey, 86400, JSON.stringify(embedding)).catch(() => {});
  return embedding;
}

export async function matchIngredients(
  tenantId: string,
  items: ExtractedIngredient[]
): Promise<MatchResult[]> {
  const dbIngredients = await (prisma as any).ingredient.findMany({
    where: { tenantId, deletedAt: null },
    select: { id: true, name: true, unit: true },
  }) as Array<{ id: string; name: string; unit: string }>;

  const fuse = new Fuse(dbIngredients, {
    keys: ['name'],
    threshold: FUZZY_THRESHOLD,
    includeScore: true,
  });

  const results: MatchResult[] = [];

  for (const item of items) {
    const normalizedInput = normalizeRo(item.name);

    // Level 1: EXACT match
    const exactMatch = dbIngredients.find(
      ing => normalizeRo(ing.name) === normalizedInput
    );
    if (exactMatch) {
      results.push({
        inputName: item.name, quantity: item.quantity, unit: item.unit,
        status: 'EXACT', confidence: 1.0,
        matchedIngredient: exactMatch,
      });
      continue;
    }

    // Level 2: FUZZY match
    const fuzzyResults = fuse.search(item.name);
    if (fuzzyResults.length === 1 && fuzzyResults[0].score !== undefined && fuzzyResults[0].score < FUZZY_THRESHOLD) {
      results.push({
        inputName: item.name, quantity: item.quantity, unit: item.unit,
        status: 'FUZZY', confidence: 1 - (fuzzyResults[0].score ?? 0),
        matchedIngredient: fuzzyResults[0].item,
      });
      continue;
    }

    // AMBIGUOUS: multiple similar fuzzy candidates
    if (fuzzyResults.length > 1) {
      const top = fuzzyResults.slice(0, 3);
      const scores = top.map(r => r.score ?? 0);
      if (scores[0] !== undefined && scores[1] !== undefined && Math.abs(scores[0] - scores[1]) < 0.1) {
        results.push({
          inputName: item.name, quantity: item.quantity, unit: item.unit,
          status: 'AMBIGUOUS', confidence: 0.5,
          matchedIngredient: null,
          candidates: top.map(r => ({ id: r.item.id, name: r.item.name, score: 1 - (r.score ?? 0) })),
        });
        continue;
      }
    }

    // Level 3: SEMANTIC match via embeddings
    try {
      const inputEmb = await getEmbedding(item.name, tenantId);
      let bestSim  = 0;
      let bestItem: { id: string; name: string; unit: string } | null = null;

      for (const ing of dbIngredients) {
        const ingEmb = await getEmbedding(ing.name, tenantId);
        const sim = cosineSim(inputEmb, ingEmb);
        if (sim > bestSim) { bestSim = sim; bestItem = ing; }
      }

      if (bestSim > 0.90 && bestItem) {
        results.push({
          inputName: item.name, quantity: item.quantity, unit: item.unit,
          status: 'SEMANTIC', confidence: bestSim,
          matchedIngredient: bestItem,
        });
        continue;
      }
    } catch {
      // Semantic matching failed, fall through to NEW
    }

    // Level 4: NEW ingredient
    results.push({
      inputName: item.name, quantity: item.quantity, unit: item.unit,
      status: 'NEW', confidence: 0,
      matchedIngredient: null,
    });
  }

  return results;
}
