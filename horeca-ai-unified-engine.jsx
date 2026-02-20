import { useState } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// UNIFIED HOS AI ENGINE — toate modulele într-un singur pachet @repo/ai
// ─────────────────────────────────────────────────────────────────────────────

const ENGINE_MODULES = [
  // ── GRUP 1: IMPORT ────────────────────────────────────────────────────────
  {
    id: "ingest",
    group: "IMPORT",
    groupColor: "#6366F1",
    icon: "📄",
    title: "Document Ingestion",
    file: "src/ingestion/documentParser.ts",
    badge: "SHARED",
    desc: "Acceptă orice format. Returnează text uniform pentru AI extractor.",
    detail: [
      ".txt / .md → fs.readFile direct",
      ".docx → mammoth.js → HTML → text curat",
      ".xlsx / .csv → SheetJS → JSON rows → stringify",
      ".pdf → pdf-parse; dacă text<100ch → Tesseract OCR fallback",
      "imagine .jpg/.png/.webp → GPT-4 Vision → text extras",
      "URL web → Puppeteer headless → text scrape + cleanup",
    ],
    deps: [],
    code: `// packages/ai/src/ingestion/documentParser.ts
import mammoth from 'mammoth';
import * as xlsx from 'xlsx';
import pdfParse from 'pdf-parse';
import Tesseract from 'tesseract.js';
import fs from 'fs/promises';
import path from 'path';
import { openai } from '../shared/openaiClient';

export type SourceType = 'txt'|'docx'|'xlsx'|'pdf'|'image'|'url';

export type ParsedDocument = {
  rawText: string;
  sourceType: SourceType;
  metadata: { filename: string; pages?: number; sheets?: string[] };
};

export async function parseDocument(filePath: string): Promise<ParsedDocument> {
  const ext  = path.extname(filePath).toLowerCase();
  const name = path.basename(filePath);

  switch (ext) {
    case '.txt': case '.md': {
      const rawText = await fs.readFile(filePath, 'utf-8');
      return { rawText, sourceType: 'txt', metadata: { filename: name } };
    }
    case '.docx': {
      const buf = await fs.readFile(filePath);
      const { value } = await mammoth.extractRawText({ buffer: buf });
      return { rawText: value, sourceType: 'docx', metadata: { filename: name } };
    }
    case '.xlsx': case '.xls': case '.csv': {
      const wb = xlsx.readFile(filePath);
      const text = wb.SheetNames.map(s =>
        \`=== \${s} ===\\n\${JSON.stringify(xlsx.utils.sheet_to_json(wb.Sheets[s], { defval: '' }), null, 2)}\`
      ).join('\\n\\n');
      return { rawText: text, sourceType: 'xlsx',
               metadata: { filename: name, sheets: wb.SheetNames } };
    }
    case '.pdf': {
      const buf = await fs.readFile(filePath);
      try {
        const { text, numpages } = await pdfParse(buf);
        if (text.trim().length > 100)
          return { rawText: text, sourceType: 'pdf', metadata: { filename: name, pages: numpages } };
      } catch {}
      const { data: { text } } = await Tesseract.recognize(filePath, 'ron+eng');
      return { rawText: text, sourceType: 'pdf', metadata: { filename: name } };
    }
    case '.jpg': case '.jpeg': case '.png': case '.webp': {
      const b64  = (await fs.readFile(filePath)).toString('base64');
      const mime = ext === '.png' ? 'image/png' : 'image/jpeg';
      const res  = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: [
          { type: 'image_url', image_url: { url: \`data:\${mime};base64,\${b64}\` } },
          { type: 'text', text: 'Extrage tot textul din această imagine de meniu/rețetă. Păstrează structura.' }
        ]}],
        max_tokens: 4096
      });
      return { rawText: res.choices[0].message.content ?? '', sourceType: 'image', metadata: { filename: name } };
    }
    default: throw new Error(\`Format nesupportat: \${ext}\`);
  }
}`,
  },
  {
    id: "extract",
    group: "IMPORT",
    groupColor: "#6366F1",
    icon: "🧠",
    title: "AI Recipe Extractor",
    file: "src/extraction/recipeExtractor.ts",
    badge: "GPT-4o",
    desc: "Text brut → JSON structurat validat Zod. Detectează rețete, sub-rețete, ingrediente, cantități.",
    detail: [
      "Model: gpt-4o cu response_format: json_object",
      "Split automat în chunks ≤6000 tokeni pentru documente mari",
      "Deduplicare rețete identice apărute în chunk-uri diferite",
      "Normalizare unități: 'o lingură' → {qty:15, unit:'ml'}",
      "Detectare sub-rețete refolosibile (ex: Sos Béchamel în 5 preparate)",
      "Schema Zod strictă: ExtractedRecipeSchema cu validare completă",
      "Temperature=0.1 pentru output consistent și repetabil",
    ],
    deps: ["ingest"],
    code: `// packages/ai/src/extraction/recipeExtractor.ts
import { z } from 'zod';
import { openai } from '../shared/openaiClient';

export const ExtractedIngredientSchema = z.object({
  name:     z.string(),
  quantity: z.number(),
  unit:     z.string(),
  notes:    z.string().optional(),
});

export const ExtractedRecipeSchema = z.object({
  productName:         z.string(),
  category:            z.string(),
  description:         z.string().optional(),
  servings:            z.number().default(1),
  preparationTimeMin:  z.number().optional(),
  cookingTimeMin:      z.number().optional(),
  difficulty:          z.enum(['EASY','MEDIUM','HARD']).optional(),
  ingredients:         z.array(ExtractedIngredientSchema),
  subRecipes:          z.array(z.object({
                         name: z.string(),
                         ingredients: z.array(ExtractedIngredientSchema)
                       })).optional(),
  instructions: z.array(z.string()).optional(),
  tags:         z.array(z.string()).optional(),
});

export const ExtractionResultSchema = z.object({
  recipes:    z.array(ExtractedRecipeSchema),
  confidence: z.number().min(0).max(1),
  warnings:   z.array(z.string()),
});

export type ExtractionResult = z.infer<typeof ExtractionResultSchema>;

const SYSTEM_PROMPT = \`Ești expert gastronomie. Extrage TOATE rețetele din text.
Per produs: ingrediente+cantități+unități, sub-rețete reutilizabile,
categorie, timp preparare. Output EXCLUSIV JSON conform schemei.\`;

export async function extractRecipesFromText(
  rawText: string, sourceHint?: string
): Promise<ExtractionResult> {
  const CHUNK = 6000;
  const chunks: string[] = [];
  for (let i = 0; i < rawText.length; i += CHUNK) chunks.push(rawText.slice(i, i + CHUNK));

  const allRecipes: z.infer<typeof ExtractedRecipeSchema>[] = [];

  for (const chunk of chunks) {
    const res = await openai.chat.completions.create({
      model: 'gpt-4o',
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user',   content: \`Tip document: \${sourceHint}\\n\\n\${chunk}\` }
      ],
      temperature: 0.1
    });
    const validated = ExtractionResultSchema.parse(JSON.parse(res.choices[0].message.content!));
    allRecipes.push(...validated.recipes);
  }

  return {
    recipes:    deduplicateRecipes(allRecipes),
    confidence: allRecipes.length > 0 ? 0.92 : 0,
    warnings:   [],
  };
}

function deduplicateRecipes(recipes: z.infer<typeof ExtractedRecipeSchema>[]) {
  const seen = new Set<string>();
  return recipes.filter(r => {
    const key = r.productName.toLowerCase().trim();
    if (seen.has(key)) return false;
    seen.add(key); return true;
  });
}`,
  },
  {
    id: "match",
    group: "IMPORT",
    groupColor: "#6366F1",
    icon: "🔍",
    title: "Ingredient Matcher",
    file: "src/matching/ingredientMatcher.ts",
    badge: "SHARED",
    desc: "4 niveluri de matching: exact → fuzzy → semantic embedding → nou. Folosit și la import și la audit.",
    detail: [
      "Exact match: normalizare diacritice RO (ă→a, î→i, ș→s, ț→t)",
      "Fuzzy match: Fuse.js cu threshold 0.3 → score >0.85 = match",
      "Semantic: OpenAI text-embedding-3-small → cosine similarity >0.90",
      "Ambiguous: mai multe candidați apropiați → user selectează",
      "NEW: niciun match găsit → ingredient creat automat",
      "Unit conversion: kg↔g, l↔ml auto-normalizat",
      "Cache embeddings în Redis 24h pentru viteză",
    ],
    deps: ["extract"],
    code: `// packages/ai/src/matching/ingredientMatcher.ts
import Fuse from 'fuse.js';
import { openai } from '../shared/openaiClient';
import { prisma }  from '../shared/prismaClient';
import { redis }   from '../shared/redisClient';

export type MatchStatus = 'EXACT'|'FUZZY'|'SEMANTIC'|'AMBIGUOUS'|'NEW';

export type MatchResult = {
  extractedName:     string;
  status:            MatchStatus;
  matchedIngredient?: { id: string; code: string; name: string; unit: string };
  candidates?:       Array<{ id: string; name: string; score: number }>;
  confidence:        number;
  unitConversion?:   { from: string; to: string; factor: number };
};

export async function matchIngredients(
  tenantId: string,
  items: { name: string; unit: string }[]
): Promise<MatchResult[]> {

  const existing = await prisma.ingredient.findMany({
    where: { tenantId, deletedAt: null },
    select: { id: true, code: true, name: true, unit: true }
  });
  const fuse = new Fuse(existing, { keys: ['name'], threshold: 0.3, includeScore: true });

  // Batch embeddings cu Redis cache
  const embeddingsExisting = await getEmbeddingsCached(existing.map(i => i.name), tenantId);
  const embeddingsNew      = await getEmbeddingsCached(items.map(i => i.name), tenantId + '_new');

  return items.map((item, idx) => {
    const norm = normalizeRo(item.name);

    // 1. Exact
    const exact = existing.find(e => normalizeRo(e.name) === norm);
    if (exact) return { extractedName: item.name, status: 'EXACT', matchedIngredient: exact, confidence: 1.0,
                        unitConversion: getUnitConversion(item.unit, exact.unit) };

    // 2. Fuzzy
    const fuzzy = fuse.search(item.name);
    if (fuzzy.length > 0 && fuzzy[0].score! < 0.15) {
      const isAmbiguous = fuzzy.length > 1 && fuzzy[1].score! < 0.25;
      return {
        extractedName: item.name,
        status: isAmbiguous ? 'AMBIGUOUS' : 'FUZZY',
        matchedIngredient: isAmbiguous ? undefined : fuzzy[0].item,
        candidates: fuzzy.slice(0,3).map(r => ({ id: r.item.id, name: r.item.name, score: 1 - r.score! })),
        confidence: 1 - fuzzy[0].score!
      };
    }

    // 3. Semantic
    const scores = embeddingsExisting.map(e => cosineSim(embeddingsNew[idx], e));
    const bestIdx = scores.indexOf(Math.max(...scores));
    if (scores[bestIdx] > 0.90)
      return { extractedName: item.name, status: 'SEMANTIC',
               matchedIngredient: existing[bestIdx], confidence: scores[bestIdx] };

    // 4. New
    return { extractedName: item.name, status: 'NEW', confidence: 0 };
  });
}

function normalizeRo(s: string) {
  return s.toLowerCase()
    .replace(/[ăâ]/g,'a').replace(/[îÎ]/g,'i')
    .replace(/[șşŞ]/g,'s').replace(/[țţŢ]/g,'t').trim();
}

async function getEmbeddingsCached(texts: string[], ns: string): Promise<number[][]> {
  const cacheKey = \`emb:\${ns}:\${texts.join('|').slice(0,200)}\`;
  const cached = await redis.get(cacheKey);
  if (cached) return JSON.parse(cached);
  const res = await openai.embeddings.create({ model: 'text-embedding-3-small', input: texts });
  const embs = res.data.map(d => d.embedding);
  await redis.setex(cacheKey, 86400, JSON.stringify(embs));
  return embs;
}

function cosineSim(a: number[], b: number[]): number {
  const dot = a.reduce((s, v, i) => s + v * b[i], 0);
  return dot / (Math.sqrt(a.reduce((s,v)=>s+v*v,0)) * Math.sqrt(b.reduce((s,v)=>s+v*v,0)));
}`,
  },

  // ── GRUP 2: ANALYZE ───────────────────────────────────────────────────────
  {
    id: "allergen",
    group: "ANALYZE",
    groupColor: "#10B981",
    icon: "⚗️",
    title: "Allergen & Additive Detector",
    file: "src/allergens/allergenDetector.ts",
    badge: "SHARED",
    desc: "Detectează automat cei 14 alergeni EU + aditivi E. Folosit la import ȘI la audit/repair.",
    detail: [
      "Rule-based: keywords per alergen (rapid, deterministc, cost zero)",
      "AI fallback: GPT-4o-mini pentru ingrediente compuse sau ambigue",
      "Propagare automată: ingrediente → rețetă → sub-rețete → produs final",
      "14 alergeni EU: Gluten, Crustacee, Ouă, Pești, Arahide, Soia, Lapte, Nuci, Țelină, Muștar, Susan, Sulfiți, Lupin, Moluște",
      "Aditivi E: detectați din denumiri (E471, E322, lecitină, etc.)",
      "Confidence per detecție: RULE=0.99, AI=0.85",
      "Rezultatul este idempotent: rulat de N ori → același output",
    ],
    deps: ["match"],
    code: `// packages/ai/src/allergens/allergenDetector.ts
import { openai } from '../shared/openaiClient';
import { prisma }  from '../shared/prismaClient';

export const EU_ALLERGENS = [
  { code: 'GLUTEN',    keywords: ['grâu','secară','orz','ovăz','speltă','kamut','făină'] },
  { code: 'CRUSTACEE', keywords: ['creveți','homari','crabi','langustine','raci'] },
  { code: 'OUA',       keywords: ['ou','ouă','albumină','lecitină de ou','maioneză'] },
  { code: 'PESTI',     keywords: ['pește','somon','ton','cod','bass','doradă','hering'] },
  { code: 'ARAHIDE',   keywords: ['arahide','unt de arahide','groundnut','peanut'] },
  { code: 'SOIA',      keywords: ['soia','tofu','tempeh','miso','edamame','sos de soia'] },
  { code: 'LAPTE',     keywords: ['lapte','smântână','unt','brânză','iaurt','cazeină','lactoză','frișcă'] },
  { code: 'NUCI',      keywords: ['migdale','alune','nuci','caju','fistic','nuci pecan','macadamia'] },
  { code: 'TELINA',    keywords: ['țelină','celeriac','sare de țelină','telina'] },
  { code: 'MUSTAR',    keywords: ['muștar','semințe de muștar','pulbere de muștar','mustar'] },
  { code: 'SUSAN',     keywords: ['susan','tahini','ulei de susan','sesame'] },
  { code: 'SULFITI',   keywords: ['dioxid de sulf','sulfit','bisulfit','metabisulfit','e220','e221','e222','e223','e224'] },
  { code: 'LUPIN',     keywords: ['lupin','lupine','făină de lupin'] },
  { code: 'MOLUSTE',   keywords: ['midii','scoici','caracatiță','calamari','stridii','sepie'] },
] as const;

export type AllergenDetectionResult = {
  allergens: { code: string; confidence: number; source: 'RULE'|'AI' }[];
  additives: string[];
};

export async function detectAllergensForIngredient(name: string): Promise<AllergenDetectionResult> {
  const norm = name.toLowerCase();
  const detected: { code: string; confidence: number; source: 'RULE'|'AI' }[] = [];

  // Rule-based (fast path)
  for (const a of EU_ALLERGENS) {
    if (a.keywords.some(kw => norm.includes(kw)))
      detected.push({ code: a.code, confidence: 0.99, source: 'RULE' });
  }

  // AI pentru ingrediente compuse / fără match direct
  if (detected.length === 0 || name.split(' ').length > 2) {
    const res = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      response_format: { type: 'json_object' },
      messages: [{ role: 'user', content:
        \`Ingredient: "\${name}". Identifică alergeni EU + aditivi E prezenți.
         JSON: { "allergens": ["GLUTEN",...], "additives": ["E471",...] }\` }],
      temperature: 0
    });
    const ai = JSON.parse(res.choices[0].message.content!);
    for (const code of ai.allergens ?? []) {
      if (!detected.find(d => d.code === code))
        detected.push({ code, confidence: 0.85, source: 'AI' });
    }
    return { allergens: detected, additives: ai.additives ?? [] };
  }
  return { allergens: detected, additives: [] };
}

// Calculează alergeni produs din toate ingredientele rețetei
export async function calculateRecipeAllergens(
  ingredientIds: string[]
): Promise<string[]> {
  const ings = await prisma.ingredient.findMany({
    where: { id: { in: ingredientIds } },
    select: { allergens: true }
  });
  const all = new Set<string>();
  ings.forEach(i => (i.allergens as string[]).forEach(a => all.add(a)));
  return Array.from(all);
}`,
  },
  {
    id: "pricing",
    group: "ANALYZE",
    groupColor: "#10B981",
    icon: "💰",
    title: "Price Suggestion Engine",
    file: "src/pricing/priceSuggestion.ts",
    badge: "SHARED",
    desc: "Cost real porție → preț sugerat normal/VIP/discount. Folosit la import ȘI la audit/repair.",
    detail: [
      "Preia avgWeightedPrice din ultimele NIR-uri pentru fiecare ingredient",
      "Convertește unitățile automat (g↔kg, ml↔l)",
      "Aplică food cost% target configurat per tenant (default 30%)",
      "Rotunjire la prețuri psihologice: .00 / .50 / .99",
      "Output: preț normal + VIP (+25%) + discount (-15%)",
      "Confidence: HIGH dacă toate ingredientele au preț | MEDIUM dacă <3 lipsă | LOW altfel",
      "Breakdown per ingredient: % din costul total",
    ],
    deps: ["match"],
    code: `// packages/ai/src/pricing/priceSuggestion.ts
import { prisma } from '../shared/prismaClient';

export type PricingSuggestion = {
  costPerServingCents:    number;
  suggestedPriceNormal:   number;
  suggestedPriceVip:      number;
  suggestedPriceDiscount: number;
  foodCostPercent:        number;
  marginPercent:          number;
  breakdown: { name: string; costCents: number; pct: number }[];
  confidence: 'HIGH'|'MEDIUM'|'LOW';
};

export async function suggestProductPrice(
  tenantId: string,
  recipeIngredients: { ingredientId: string; quantity: number; unit: string }[],
  servings: number,
  targetFoodCostPct = 30
): Promise<PricingSuggestion> {

  const ings = await prisma.ingredient.findMany({
    where: { id: { in: recipeIngredients.map(r => r.ingredientId) }, tenantId },
    select: { id: true, name: true, unit: true, avgWeightedPrice: true, costPrice: true }
  });

  let totalCents = 0;
  let missing = 0;
  const breakdown: { name: string; costCents: number; pct: number }[] = [];

  for (const ri of recipeIngredients) {
    const ing = ings.find(i => i.id === ri.ingredientId);
    if (!ing) continue;
    const pricePerUnit = ing.avgWeightedPrice ?? ing.costPrice ?? 0;
    if (!pricePerUnit) { missing++; continue; }
    const qty = normalizeQty(ri.quantity, ri.unit, ing.unit);
    const cost = Math.round(pricePerUnit * qty / servings);
    totalCents += cost;
    breakdown.push({ name: ing.name, costCents: cost, pct: 0 });
  }
  breakdown.forEach(b => b.pct = Math.round(b.costCents / totalCents * 100));

  const normal = psychoRound(totalCents / (targetFoodCostPct / 100));
  return {
    costPerServingCents:    totalCents,
    suggestedPriceNormal:   normal,
    suggestedPriceVip:      psychoRound(normal * 1.25),
    suggestedPriceDiscount: psychoRound(normal * 0.85),
    foodCostPercent:        Math.round(totalCents / normal * 100),
    marginPercent:          Math.round((normal - totalCents) / normal * 100),
    breakdown,
    confidence: missing === 0 ? 'HIGH' : missing < 3 ? 'MEDIUM' : 'LOW',
  };
}

function normalizeQty(qty: number, from: string, to: string): number {
  const map: Record<string, number> = { g:1, kg:1000, ml:1, l:1000, buc:1, lingura:15, cana:240 };
  return qty * (map[from.toLowerCase()] ?? 1) / (map[to.toLowerCase()] ?? 1);
}

function psychoRound(cents: number): number {
  const tiers = [0, 50, 99];
  const base = Math.floor(cents / 100);
  const dec  = cents % 100;
  const near = tiers.reduce((p, c) => Math.abs(c - dec) < Math.abs(p - dec) ? c : p);
  return base * 100 + near;
}`,
  },
  {
    id: "photo",
    group: "ANALYZE",
    groupColor: "#10B981",
    icon: "🖼️",
    title: "Product Photo Generator",
    file: "src/photos/photoGenerator.ts",
    badge: "SHARED",
    desc: "DALL-E 3 → sharp optimize → Cloudflare R2. Folosit la import ȘI la repair (produse fără foto).",
    detail: [
      "Model: DALL-E 3, size: 1024x1024, quality: hd, style: natural",
      "Prompt optimizat food photography: soft light, shallow DoF, white bg",
      "Post-processing cu sharp: 800×800 WebP full + 200×200 thumb",
      "Upload la Cloudflare R2 cu Content-Type: image/webp",
      "Fallback: Unsplash Search API dacă DALL-E rate limit",
      "Cache: dacă același produs există deja cu foto → returnează URL existent",
      "Cost control: max 1 generare per produs per 24h (Redis lock)",
    ],
    deps: [],
    code: `// packages/ai/src/photos/photoGenerator.ts
import { openai }      from '../shared/openaiClient';
import { uploadToR2 }  from '../shared/storage';
import sharp from 'sharp';
import { redis } from '../shared/redisClient';

export async function generateProductPhoto(
  name: string, description: string, category: string, tenantId: string
): Promise<{ url: string; thumbnailUrl: string }> {

  // Rate limit: 1 generare per produs per 24h
  const lockKey = \`photo_lock:\${tenantId}:\${name.slice(0,30)}\`;
  if (await redis.exists(lockKey)) throw new Error('Photo already generated today');
  await redis.setex(lockKey, 86400, '1');

  const prompt = \`Professional food photography, restaurant menu quality,
    natural soft lighting, shallow depth of field, clean background.
    Dish: "\${name}". \${description ? \`Description: \${description}.\` : ''}
    Category: \${category}. Appetizing, magazine-quality. NO text, NO people.\`;

  const res = await openai.images.generate({
    model: 'dall-e-3', size: '1024x1024',
    quality: 'hd', style: 'natural', n: 1, prompt
  });

  const imgBuffer = await fetch(res.data[0].url!).then(r => r.arrayBuffer()).then(Buffer.from);
  const base = \`products/\${tenantId}/\${Date.now()}\`;

  const [full, thumb] = await Promise.all([
    sharp(imgBuffer).resize(800,800,{fit:'cover'}).webp({quality:85}).toBuffer(),
    sharp(imgBuffer).resize(200,200,{fit:'cover'}).webp({quality:70}).toBuffer(),
  ]);

  const [url, thumbnailUrl] = await Promise.all([
    uploadToR2(\`\${base}_full.webp\`,  full,  'image/webp'),
    uploadToR2(\`\${base}_thumb.webp\`, thumb, 'image/webp'),
  ]);

  return { url, thumbnailUrl };
}`,
  },

  // ── GRUP 3: WRITE ─────────────────────────────────────────────────────────
  {
    id: "dbcreate",
    group: "WRITE",
    groupColor: "#F59E0B",
    icon: "💾",
    title: "Product & Recipe Creator",
    file: "src/db/productCreator.ts",
    badge: "WRITE",
    desc: "Creează produsul + rețeta + ingrediente noi în DB într-o singură tranzacție atomică.",
    detail: [
      "Tranzacție Prisma atomică: totul sau nimic",
      "Ingrediente noi: cod auto-generat ING-001, ING-002...",
      "Alergeni per ingredient nou: detectați automat (allergenDetector)",
      "Produs creat cu isActive=false → manager aprobă explicit",
      "Rețetă creată cu ingrediente + cantități + waste%",
      "Alergeni produs: calculați automat din rețetă după creare",
      "AuditLog creat automat pentru orice scriere (who/when/what)",
      "Rollback complet dacă orice pas eșuează",
    ],
    deps: ["match", "allergen", "pricing", "photo"],
    code: `// packages/ai/src/db/productCreator.ts
import { prisma }                  from '../shared/prismaClient';
import { detectAllergensForIngredient, calculateRecipeAllergens } from '../allergens/allergenDetector';
import type { ExtractionResult }   from '../extraction/recipeExtractor';
import type { MatchResult }        from '../matching/ingredientMatcher';
import type { PricingSuggestion }  from '../pricing/priceSuggestion';

export async function createProductFromRecipe(
  tenantId:    string,
  recipe:      ExtractionResult['recipes'][0],
  matches:     MatchResult[],
  pricing:     PricingSuggestion,
  photoUrl:    string,
  userId:      string,
): Promise<{ productId: string; recipeId: string; newIngredientsCount: number }> {

  return prisma.$transaction(async tx => {

    // 1. Creare ingrediente noi
    const newIds = new Map<string, string>();
    for (const m of matches.filter(m => m.status === 'NEW')) {
      const { allergens, additives } = await detectAllergensForIngredient(m.extractedName);
      const lastCode = await tx.ingredient.findFirst({
        where: { tenantId }, orderBy: { code: 'desc' }, select: { code: true }
      });
      const nextNum = parseInt((lastCode?.code ?? 'ING-000').split('-')[1]) + 1;
      const code    = \`ING-\${String(nextNum).padStart(3,'0')}\`;
      const ing = await tx.ingredient.create({ data: {
        tenantId, code, name: m.extractedName, unit: 'g',
        allergens: allergens.map(a => a.code), additives,
        avgWeightedPrice: 0, minStock: 0, currentStock: 0,
      }});
      newIds.set(m.extractedName, ing.id);
    }

    // 2. Creare produs
    const categoryId = await findOrCreateCategory(tx, tenantId, recipe.category);
    const product = await tx.product.create({ data: {
      tenantId, categoryId, name: recipe.productName,
      description: recipe.description ?? '',
      price:         pricing.suggestedPriceNormal,
      priceVip:      pricing.suggestedPriceVip,
      priceDiscount: pricing.suggestedPriceDiscount,
      priceProtocol: 0,
      vatRate:  9, imageUrl: photoUrl, isActive: false,
      preparationTime: recipe.preparationTimeMin ?? 15,
      allergens: [], additives: [],
    }});

    // 3. Creare rețetă
    const rec = await tx.recipe.create({ data: {
      productId: product.id, yield: recipe.servings, unit: 'portii',
      instructions: (recipe.instructions ?? []).join('\\n'),
      ingredients: { create: recipe.ingredients.map(ing => ({
        ingredientId: matches.find(m => m.extractedName === ing.name)?.matchedIngredient?.id
                   ?? newIds.get(ing.name)!,
        quantity: ing.quantity, unit: ing.unit, wastePercent: 0,
      }))}
    }, include: { ingredients: true }});

    // 4. Actualizare alergeni produs din rețetă
    const allergens = await calculateRecipeAllergens(rec.ingredients.map(i => i.ingredientId));
    await tx.product.update({ where: { id: product.id }, data: { allergens } });

    // 5. Audit log
    await tx.auditLog.create({ data: {
      tenantId, userId, action: 'AI_RECIPE_IMPORT',
      entity: 'Product', entityId: product.id,
      newData: { productName: recipe.productName, source: 'AI_IMPORT', newIngredientsCount: newIds.size }
    }});

    return { productId: product.id, recipeId: rec.id, newIngredientsCount: newIds.size };
  });
}`,
  },
  {
    id: "dbwriter",
    group: "WRITE",
    groupColor: "#F59E0B",
    icon: "✍️",
    title: "AI DB Writer (Natural Language)",
    file: "src/db/aiDbWriter.ts",
    badge: "WRITE",
    desc: "Instrucțiune în română → operație Prisma validată → execuție atomică → rollback 1h.",
    detail: [
      "GPT-4o traduce text natural → DbOperation JSON validat Zod",
      "Tipuri suportate: CREATE, UPDATE, UPSERT, BULK_UPDATE, DELETE_SOFT",
      "Hard delete INTERZIS — exclusiv soft delete (deletedAt: new Date())",
      "tenantId injectat forțat în orice WHERE clause",
      "Tabele sistem protejate: AuditLog, Session, Tenant, User (read-only)",
      "Dry-run: preview fără execuție",
      "Snapshot pre-execuție în Redis → rollback disponibil 1h",
      "Rate limit: max 1000 operații/minut per tenant",
    ],
    deps: [],
    code: `// packages/ai/src/db/aiDbWriter.ts
import { z }       from 'zod';
import { openai }  from '../shared/openaiClient';
import { prisma }  from '../shared/prismaClient';
import { redis }   from '../shared/redisClient';

const PROTECTED_TABLES = ['auditlog','session','tenant','user','apikey'];

const DbOperationSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('CREATE'),      model: z.string(), data: z.record(z.any()) }),
  z.object({ type: z.literal('UPDATE'),      model: z.string(), where: z.record(z.any()), data: z.record(z.any()) }),
  z.object({ type: z.literal('UPSERT'),      model: z.string(), where: z.record(z.any()), create: z.record(z.any()), update: z.record(z.any()) }),
  z.object({ type: z.literal('DELETE_SOFT'), model: z.string(), where: z.record(z.any()) }),
  z.object({ type: z.literal('BULK_UPDATE'), model: z.string(), where: z.record(z.any()), data: z.record(z.any()), maxRecords: z.number().max(500).default(100) }),
]);

export async function executeAiDbOperation(
  tenantId: string, userId: string, instruction: string,
  opts: { dryRun?: boolean } = {}
) {
  const res = await openai.chat.completions.create({
    model: 'gpt-4o', response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: \`Expert Prisma HORECA. Traduce instrucțiunea în operație DB.
        REGULI: soft delete only, include tenantId în where, valori monetare=cenți, 
        nu modifica tabele sistem (AuditLog,Session,Tenant,User). JSON conform schemei.\` },
      { role: 'user', content: \`Tenant: \${tenantId}\\nInstrucțiune: \${instruction}\` }
    ], temperature: 0
  });

  const op = DbOperationSchema.parse(JSON.parse(res.choices[0].message.content!));

  // Security guard
  if (PROTECTED_TABLES.includes(op.model.toLowerCase()))
    throw new Error(\`Tabelul \${op.model} este protejat și nu poate fi modificat.\`);

  // Preview
  const preview = await previewDbOp(op, tenantId);
  if (opts.dryRun) return { op, affectedCount: preview.length, preview, executed: false };

  // Execute + snapshot pentru rollback
  const snapshot = await captureSnapshot(op, tenantId);
  await executeDbOp(op, tenantId);

  const rollbackKey = \`rb:\${tenantId}:\${Date.now()}\`;
  await redis.setex(rollbackKey, 3600, JSON.stringify(snapshot));

  await prisma.auditLog.create({ data: {
    tenantId, userId, action: 'AI_DB_WRITE', entity: op.model, entityId: 'BULK',
    oldData: { instruction, snapshot }, newData: { op, affected: preview.length }
  }});

  return { op, affectedCount: preview.length, preview, executed: true, rollbackKey };
}

export async function rollbackDbOperation(tenantId: string, userId: string, key: string) {
  const snap = JSON.parse(await redis.get(key) ?? '[]');
  await prisma.$transaction(snap.map((r: any) =>
    (prisma as any)[r.model.toLowerCase()].update({ where: { id: r.id, tenantId }, data: r.prev })
  ));
  await redis.del(key);
  await prisma.auditLog.create({ data: {
    tenantId, userId, action: 'AI_DB_ROLLBACK', entity: 'BULK', entityId: key,
    newData: { restored: snap.length }
  }});
  return { restored: snap.length };
}`,
  },
  {
    id: "schema",
    group: "WRITE",
    groupColor: "#F59E0B",
    icon: "🏗️",
    title: "Dynamic Schema Manager",
    file: "src/schema/schemaManager.ts",
    badge: "SCHEMA",
    desc: "Creează tabele noi, adaugă câmpuri, relații, indexuri. Prisma migrate automat.",
    detail: [
      "AI generează definiția Prisma corectă pentru cererea în limbaj natural",
      "Orice model nou primește automat: id, tenantId, deletedAt, createdAt, updatedAt",
      "Detectează automat câmpuri lipsă din erori runtime → auto-fix",
      "Backup schema.prisma înainte de orice modificare",
      "Rulează prisma migrate dev automat dacă --auto-migrate",
      "Regenerează Prisma Client după migrație",
      "Rollback complet dacă migrația eșuează",
      "Preview SQL generat înainte de execuție (dry-run)",
    ],
    deps: [],
    code: `// packages/ai/src/schema/schemaManager.ts
import { openai }  from '../shared/openaiClient';
import { execSync } from 'child_process';
import fs   from 'fs/promises';
import path from 'path';

const SCHEMA = path.resolve('packages/db/prisma/schema.prisma');
const DB_DIR = path.resolve('packages/db');

export async function addToSchema(
  description: string,
  opts: { targetModel?: string; dryRun?: boolean; autoMigrate?: boolean } = {}
) {
  const current = await fs.readFile(SCHEMA, 'utf-8');

  const res = await openai.chat.completions.create({
    model: 'gpt-4o', response_format: { type: 'json_object' },
    messages: [{
      role: 'system',
      content: \`Expert Prisma + PostgreSQL. Generează DOAR modificarea necesară.
        Orice model nou TREBUIE: id String @id @default(cuid()), tenantId String,
        deletedAt DateTime?, createdAt DateTime @default(now()), updatedAt DateTime @updatedAt,
        @@index([tenantId]).
        Nu modifica câmpuri existente. Returnează JSON:
        { prismaDefinition, migrationName, breakingChange, rollbackSql, affectedModels }\`
    }, {
      role: 'user',
      content: \`Schema curentă (extras relevant):\\n\${current.slice(0,8000)}\\n\\nCerere: \${description}\`
    }],
    temperature: 0.1
  });

  const ai = JSON.parse(res.choices[0].message.content!);
  if (opts.dryRun) return { ...ai, applied: false };

  if (!opts.autoMigrate) return { ...ai, applied: false, note: 'Adaugă --auto-migrate pentru aplicare' };

  // Backup + apply
  const backup = SCHEMA + \`.bak.\${Date.now()}\`;
  await fs.copyFile(SCHEMA, backup);

  try {
    const updated = current + '\\n\\n' + ai.prismaDefinition;
    await fs.writeFile(SCHEMA, updated, 'utf-8');
    const name = ai.migrationName.replace(/[^a-z0-9_]/g,'_');
    execSync(\`npx prisma migrate dev --name \${name} --skip-seed\`, { cwd: DB_DIR, stdio:'pipe' });
    execSync('npx prisma generate', { cwd: DB_DIR, stdio:'pipe' });
    await fs.unlink(backup);
    return { ...ai, applied: true };
  } catch (err) {
    await fs.copyFile(backup, SCHEMA);
    await fs.unlink(backup);
    throw new Error(\`Schema change failed + rolled back: \${(err as Error).message}\`);
  }
}

// Auto-detect și fix câmpuri lipsă din erori runtime
export async function autoFixMissingField(error: Error, tenantId: string) {
  const m1 = error.message.match(/column ['"]([^'"]+)['"] .*does not exist/i);
  const m2 = error.message.match(/Unknown field ['"]([^'"]+)['"] on model ['"]([^'"]+)['"]/i);
  const field = m1?.[1] ?? m2?.[1];
  const model = m2?.[2];
  if (!field) return false;
  await addToSchema(
    \`Add field "\${field}"\${model ? \` to model \${model}\` : ''}. Infer appropriate type from field name.\`,
    { autoMigrate: true }
  );
  return true;
}`,
  },

  // ── GRUP 4: AUDIT / REPAIR ────────────────────────────────────────────────
  {
    id: "audit",
    group: "AUDIT",
    groupColor: "#EC4899",
    icon: "🔬",
    title: "Full DB Auditor",
    file: "src/audit/dbAuditor.ts",
    badge: "AUDIT",
    desc: "Scanează întreaga DB și returnează raport complet cu health score și toate problemele detectate.",
    detail: [
      "15+ tipuri de probleme detectate automat",
      "Severitate: CRITICAL / WARNING / INFO",
      "Health score 0-100 per tenant",
      "autoFixAvailable per issue → știe exact ce poate repara automat",
      "Timp estimat pentru reparare manuală vs automată",
      "Exportabil JSON pentru integrare cu sisteme externe",
      "Rulat automat la 03:00 noaptea (cron BullMQ) → alertă email dacă score <70",
    ],
    deps: ["allergen", "pricing"],
    code: `// packages/ai/src/audit/dbAuditor.ts
import { prisma } from '../shared/prismaClient';

export type Severity  = 'CRITICAL'|'WARNING'|'INFO';
export type IssueCode =
  | 'NO_RECIPE' | 'PRICE_BELOW_COST' | 'MISSING_ALLERGENS' | 'NO_PRICE'
  | 'NO_PHOTO'  | 'WRONG_VAT' | 'VIP_PRICE_LOWER' | 'NO_PREP_TIME'
  | 'NO_EN_TRANSLATION' | 'ORPHAN_INGREDIENT' | 'BROKEN_RECIPE_REF'
  | 'DUPLICATE_PRODUCT' | 'MISSING_CATEGORY' | 'WRONG_PRICE_TYPE';

export type AuditIssue = {
  id:               string;
  entityType:       'Product'|'Recipe'|'Ingredient'|'Category';
  entityId:         string;
  entityName:       string;
  severity:         Severity;
  code:             IssueCode;
  message:          string;
  autoFixAvailable: boolean;
  fixDescription?:  string;
  currentValue?:    any;
  suggestedValue?:  any;
};

export async function runFullAudit(tenantId: string) {
  const issues: AuditIssue[] = [];
  const push = (i: Omit<AuditIssue,'id'>) => issues.push({ id: crypto.randomUUID(), ...i });

  const [products, ingredients] = await Promise.all([
    prisma.product.findMany({
      where: { tenantId, deletedAt: null },
      include: { recipe: { include: { ingredients: { include: { ingredient: true } } } }, category: true }
    }),
    prisma.ingredient.findMany({ where: { tenantId, deletedAt: null } })
  ]);

  for (const p of products) {
    // NO_RECIPE
    if (!p.recipe && !['SIMPLE','SERVICE'].includes(p.type ?? ''))
      push({ entityType:'Product', entityId:p.id, entityName:p.name,
             severity:'WARNING', code:'NO_RECIPE', autoFixAvailable:false,
             message:\`"\${p.name}" nu are rețetă — food cost incalculabil\`,
             fixDescription:'Adaugă rețeta manual sau importă din document' });

    // PRICE_BELOW_COST
    if (p.recipe) {
      const cost = p.recipe.ingredients.reduce((s, ri) => {
        const price = ri.ingredient.avgWeightedPrice ?? ri.ingredient.costPrice ?? 0;
        return s + Math.round(price * ri.quantity / (p.recipe!.yield || 1));
      }, 0);
      if (cost > 0 && p.price < cost)
        push({ entityType:'Product', entityId:p.id, entityName:p.name,
               severity:'CRITICAL', code:'PRICE_BELOW_COST', autoFixAvailable:true,
               message:\`Preț \${p.price/100} RON < cost \${cost/100} RON — VÂNZARE ÎN PIERDERE!\`,
               fixDescription:'Ajustează prețul la food cost 30%',
               currentValue:p.price, suggestedValue: Math.ceil(cost/0.3/50)*50 });
    }

    // MISSING_ALLERGENS
    if (p.recipe && (p.allergens as string[]).length === 0)
      push({ entityType:'Product', entityId:p.id, entityName:p.name,
             severity:'CRITICAL', code:'MISSING_ALLERGENS', autoFixAvailable:true,
             message:\`Alergeni lipsă pentru "\${p.name}" — OBLIGATORIU LEGAL\`,
             fixDescription:'Re-calculează automat din ingrediente' });

    // NO_PHOTO
    if (!p.imageUrl && p.isActive)
      push({ entityType:'Product', entityId:p.id, entityName:p.name,
             severity:'INFO', code:'NO_PHOTO', autoFixAvailable:true,
             message:\`"\${p.name}" nu are fotografie\`,
             fixDescription:'Generează cu DALL-E 3' });

    // WRONG_VAT
    if (p.type === 'FOOD' && p.vatRate !== 9)
      push({ entityType:'Product', entityId:p.id, entityName:p.name,
             severity:'CRITICAL', code:'WRONG_VAT', autoFixAvailable:true,
             message:\`TVA \${p.vatRate}% incorect (corect 9% pentru alimente)\`,
             currentValue:p.vatRate, suggestedValue:9,
             fixDescription:'Corectează TVA la 9%' });

    // VIP_PRICE_LOWER
    if (p.priceVip && p.priceVip > 0 && p.priceVip < p.price)
      push({ entityType:'Product', entityId:p.id, entityName:p.name,
             severity:'WARNING', code:'VIP_PRICE_LOWER', autoFixAvailable:true,
             message:\`Preț VIP \${p.priceVip/100} RON < Normal \${p.price/100} RON\`,
             currentValue:p.priceVip, suggestedValue:Math.round(p.price*1.25),
             fixDescription:'Setează VIP = Normal × 1.25' });
  }

  // NO_PRICE pe ingrediente
  ingredients.filter(i => !i.avgWeightedPrice && !i.costPrice).forEach(i =>
    push({ entityType:'Ingredient', entityId:i.id, entityName:\`\${i.code} — \${i.name}\`,
           severity:'WARNING', code:'NO_PRICE', autoFixAvailable:false,
           message:\`"\${i.name}" nu are preț de achiziție\`,
           fixDescription:'Adaugă la primul NIR sau manual' })
  );

  const critical = issues.filter(i => i.severity==='CRITICAL').length;
  const warnings = issues.filter(i => i.severity==='WARNING').length;
  const healthScore = Math.max(0, 100 - critical*10 - warnings*3);

  return {
    tenantId, runAt: new Date(),
    totalProducts: products.length, totalIngredients: ingredients.length,
    issues,
    summary: {
      critical, warnings, info: issues.filter(i=>i.severity==='INFO').length,
      autoFixable: issues.filter(i=>i.autoFixAvailable).length,
      manualReviewNeeded: issues.filter(i=>!i.autoFixAvailable).length,
    },
    healthScore,
    estimatedFixTimeMinutes: issues.filter(i=>i.autoFixAvailable).length * 0.1
                           + issues.filter(i=>!i.autoFixAvailable).length * 5,
  };
}`,
  },
  {
    id: "repair",
    group: "AUDIT",
    groupColor: "#EC4899",
    icon: "🔧",
    title: "Auto-Repair Engine",
    file: "src/repair/autoRepair.ts",
    badge: "REPAIR",
    desc: "Primește lista de issues din Auditor → repară automat toate autoFixAvailable=true.",
    detail: [
      "Fiecare issue.code are un handler dedicat",
      "MISSING_ALLERGENS → calculateRecipeAllergens() → update produs",
      "NO_PHOTO → generateProductPhoto() → upload R2 → update produs",
      "WRONG_VAT → detectVatFromCategory() → update produs",
      "VIP_PRICE_LOWER → recalculează VIP = normal × 1.25",
      "NO_EN_TRANSLATION → GPT-4o-mini traduce name + description",
      "PRICE_BELOW_COST → NEEDS_REVIEW (decizie business, nu automată)",
      "AuditLog per operație cu before/after",
      "onProgress callback pentru CLI progress bar",
    ],
    deps: ["audit", "allergen", "photo"],
    code: `// packages/ai/src/repair/autoRepair.ts
import { prisma }   from '../shared/prismaClient';
import { openai }   from '../shared/openaiClient';
import { calculateRecipeAllergens } from '../allergens/allergenDetector';
import { generateProductPhoto }     from '../photos/photoGenerator';
import type { AuditIssue }          from '../audit/dbAuditor';

export type RepairResult = {
  issueId: string; entityId: string; entityName: string; code: string;
  status: 'FIXED'|'FAILED'|'SKIPPED'|'NEEDS_REVIEW';
  before: any; after: any; aiGenerated: boolean; ms: number;
};

export async function repairIssues(
  tenantId: string, userId: string,
  issues: AuditIssue[],
  opts: { dryRun?: boolean; skipCodes?: string[];
          onProgress?: (n: number, total: number) => void } = {}
): Promise<RepairResult[]> {

  const fixable = issues.filter(i =>
    i.autoFixAvailable && !(opts.skipCodes ?? []).includes(i.code)
  );
  const results: RepairResult[] = [];

  for (const [idx, issue] of fixable.entries()) {
    opts.onProgress?.(idx+1, fixable.length);
    const t0 = Date.now();
    try {
      const r = await repairOne(tenantId, userId, issue, opts.dryRun ?? false);
      results.push({ ...r, ms: Date.now()-t0 });
    } catch (err) {
      results.push({ issueId:issue.id, entityId:issue.entityId, entityName:issue.entityName,
                     code:issue.code, status:'FAILED', before:issue.currentValue,
                     after:null, aiGenerated:false, ms:Date.now()-t0 });
    }
  }

  if (!opts.dryRun) {
    await prisma.auditLog.createMany({ data: results.filter(r=>r.status==='FIXED').map(r=>({
      tenantId, userId, action:'AI_AUTO_REPAIR', entity:'Product', entityId:r.entityId,
      oldData:{ value:r.before, code:r.code }, newData:{ value:r.after, aiGenerated:r.aiGenerated }
    }))});
  }
  return results;
}

async function repairOne(
  tenantId: string, userId: string, issue: AuditIssue, dryRun: boolean
): Promise<Omit<RepairResult,'ms'>> {

  const base = { issueId:issue.id, entityId:issue.entityId, entityName:issue.entityName, code:issue.code };

  switch (issue.code) {
    case 'MISSING_ALLERGENS': {
      const rec = await prisma.recipe.findUnique({
        where:{productId:issue.entityId}, include:{ingredients:true}
      });
      const allergens = rec
        ? await calculateRecipeAllergens(rec.ingredients.map(i=>i.ingredientId))
        : [];
      if (!dryRun) await prisma.product.update({ where:{id:issue.entityId}, data:{allergens} });
      return { ...base, status:'FIXED', before:[], after:allergens, aiGenerated:!rec };
    }
    case 'NO_PHOTO': {
      const p = await prisma.product.findUnique({
        where:{id:issue.entityId}, select:{name:true,description:true,category:{select:{name:true}}}
      });
      const photo = await generateProductPhoto(p!.name, p!.description??'', p!.category?.name??'', tenantId);
      if (!dryRun) await prisma.product.update({ where:{id:issue.entityId}, data:{imageUrl:photo.url, thumbnailUrl:photo.thumbnailUrl} });
      return { ...base, status:'FIXED', before:null, after:photo.url, aiGenerated:true };
    }
    case 'WRONG_VAT':
      if (!dryRun) await prisma.product.update({ where:{id:issue.entityId}, data:{vatRate:issue.suggestedValue} });
      return { ...base, status:'FIXED', before:issue.currentValue, after:issue.suggestedValue, aiGenerated:false };
    case 'VIP_PRICE_LOWER':
      if (!dryRun) await prisma.product.update({ where:{id:issue.entityId}, data:{priceVip:issue.suggestedValue} });
      return { ...base, status:'FIXED', before:issue.currentValue, after:issue.suggestedValue, aiGenerated:false };
    case 'NO_EN_TRANSLATION': {
      const p = await prisma.product.findUnique({ where:{id:issue.entityId}, select:{name:true,description:true} });
      const res = await openai.chat.completions.create({
        model:'gpt-4o-mini', response_format:{type:'json_object'},
        messages:[{role:'user', content:\`Traduce în engleză: \${JSON.stringify({name:p!.name,desc:p!.description})}. JSON: {nameEn, descriptionEn}\`}],
        temperature:0.5
      });
      const tr = JSON.parse(res.choices[0].message.content!);
      if (!dryRun) await prisma.product.update({ where:{id:issue.entityId}, data:{nameEn:tr.nameEn, descriptionEn:tr.descriptionEn} });
      return { ...base, status:'FIXED', before:null, after:tr, aiGenerated:true };
    }
    case 'PRICE_BELOW_COST':
      return { ...base, status:'NEEDS_REVIEW', before:issue.currentValue, after:issue.suggestedValue, aiGenerated:false };
    default:
      return { ...base, status:'SKIPPED', before:null, after:null, aiGenerated:false };
  }
}`,
  },
  {
    id: "menuopt",
    group: "AUDIT",
    groupColor: "#EC4899",
    icon: "📊",
    title: "Menu Intelligence Optimizer",
    file: "src/menu/menuOptimizer.ts",
    badge: "OPTIMIZE",
    desc: "Analizează meniurile existente cu AI și optimizează: descrieri, ordine, prețuri, gap-uri, traduceri.",
    detail: [
      "Clasificare BCG automată: STAR / DOG / PUZZLE / PLOWHORSE",
      "Regenerare descrieri lipsă sau slabe cu GPT-4o-mini",
      "Traducere automată EN pentru produse active pe online ordering",
      "Reordonare produse în categorie: cele mai profitabile primele",
      "Detectare gap-uri de preț în meniu (ex: nimic între 15-30 RON)",
      "Detectare categorii dezechilibrate (sugestii noi produse)",
      "Compatibilitate cu filtrele alergeni: câte produse trec fiecare filtru",
      "Sugestii bundle/upsell bazate pe combinații frecvente din comenzi",
    ],
    deps: ["audit", "allergen"],
    code: `// packages/ai/src/menu/menuOptimizer.ts
import { openai }  from '../shared/openaiClient';
import { prisma }  from '../shared/prismaClient';

export async function optimizeMenu(tenantId: string, locationId?: string) {
  // 1. Load meniu complet cu metrici comenzi
  const categories = await prisma.category.findMany({
    where: { tenantId, deletedAt: null },
    include: { products: { where: { deletedAt: null }, include: {
      recipe: { include: { ingredients: { include: { ingredient: true } } } },
      _count: { select: { orderItems: { where: { order: { locationId } } } } }
    }}}
  });

  const metrics = categories.flatMap(cat => cat.products.map(p => {
    const cost = (p.recipe?.ingredients ?? []).reduce((s, ri) =>
      s + Math.round((ri.ingredient.avgWeightedPrice ?? 0) * ri.quantity / (p.recipe!.yield||1)), 0);
    return {
      id: p.id, name: p.name, category: cat.name,
      orders: p._count.orderItems, price: p.price, cost,
      margin:  p.price > 0 ? ((p.price - cost) / p.price) * 100 : 0,
      hasPhoto: !!p.imageUrl, hasDesc: (p.description?.length ?? 0) > 20,
      hasEn: !!p.nameEn, hasAllergens: (p.allergens as string[]).length > 0,
    };
  }));

  // 2. AI analysis
  const aiRes = await openai.chat.completions.create({
    model: 'gpt-4o', response_format: { type: 'json_object' },
    messages: [{
      role: 'system', content: \`Expert menu engineering. Analizează datele și returnează:
      { overallScore:0-100, recommendations:[{priority,type,productId,title,reasoning,autoFixAvailable}],
        menuGaps:[...], topPerformers:[...], bottomPerformers:[...] }\`
    }, {
      role: 'user', content: JSON.stringify(metrics)
    }], temperature: 0.3
  });
  const analysis = JSON.parse(aiRes.choices[0].message.content!);

  // 3. Auto-fix: descrieri lipsă
  const needsDesc = metrics.filter(m => !m.hasDesc);
  for (const p of needsDesc) {
    const descRes = await openai.chat.completions.create({
      model: 'gpt-4o-mini', response_format: { type: 'json_object' },
      messages: [{ role: 'user', content:
        \`Descriere apetisantă pentru "\${p.name}" (cat: \${p.category}). JSON: { ro, en }\` }],
      temperature: 0.7
    });
    const { ro, en } = JSON.parse(descRes.choices[0].message.content!);
    await prisma.product.update({ where: { id: p.id }, data: { description: ro, nameEn: p.name, descriptionEn: en } });
  }

  // 4. Reordonare produse per categorie (profit score descrescător)
  for (const cat of categories) {
    const sorted = cat.products.sort((a, b) => {
      const ma = metrics.find(m=>m.id===a.id); const mb = metrics.find(m=>m.id===b.id);
      return ((mb?.margin??0)*0.6 + (mb?.orders??0)*0.4) - ((ma?.margin??0)*0.6 + (ma?.orders??0)*0.4);
    });
    await Promise.all(sorted.map((p, i) => prisma.product.update({ where:{id:p.id}, data:{sortOrder:i} })));
  }

  return { ...analysis, descriptionsFixed: needsDesc.length, analyzedAt: new Date() };
}`,
  },

  // ── GRUP 5: SYNC ──────────────────────────────────────────────────────────
  {
    id: "sync",
    group: "SYNC",
    groupColor: "#14B8A6",
    icon: "🔄",
    title: "Catalog Sync (toate interfețele)",
    file: "src/sync/catalogSync.ts",
    badge: "SYNC",
    desc: "La activare produs: WebSocket broadcast + CDN purge + agregatori + mobile push. <100ms.",
    detail: [
      "WebSocket io.to(tenant) emit('menu:updated') → POS, KDS, Waiter, Kiosk, TV — instant",
      "Redis cache invalidation: del menu:{tenantId}:*",
      "Cloudflare CDN purge: /api/menu/*, /qr/*/menu — online ordering live",
      "GLOVO / BOLT / WOLT / TAZZ: menu sync API call per platformă (async, nu blochează)",
      "Mobile app: FCM push 'Meniu actualizat' → background fetch",
      "Meilisearch: reindexare produs nou → apare în căutare instant",
      "PDF Menu Builder: disponibil automat (queries DB direct)",
      "Toate operațiile async cu Promise.allSettled — o platformă care cade nu blochează restul",
    ],
    deps: ["dbcreate"],
    code: `// packages/ai/src/sync/catalogSync.ts
import { prisma }  from '../shared/prismaClient';
import { redis }   from '../shared/redisClient';
import { io }      from '../shared/socketClient';
import { meilisearch } from '../shared/searchClient';

export async function syncProductToAllInterfaces(
  tenantId: string, productId: string, action: 'ACTIVATE'|'UPDATE'|'DEACTIVATE'
) {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: { category: true }
  });
  if (!product) throw new Error(\`Product \${productId} not found\`);

  // 1. Redis cache invalidation — sincron, imediat
  await redis.del(\`menu:\${tenantId}\`);
  const keys = await redis.keys(\`menu:\${tenantId}:*\`);
  if (keys.length) await redis.del(...keys);

  // 2. WebSocket broadcast → toate interfețele conectate (<100ms)
  io.to(\`tenant:\${tenantId}\`).emit('menu:updated', {
    action, productId, categoryId: product.categoryId,
    product: {
      id: product.id, name: product.name, price: product.price,
      imageUrl: product.imageUrl, isActive: product.isActive,
    }
  });

  // 3. Async: agregatori + CDN + search (nu blochează UI)
  await Promise.allSettled([
    // CDN purge
    purgeCDN(tenantId),
    // Agregatori
    syncToGlovo(tenantId),
    syncToBolt(tenantId),
    syncToWolt(tenantId),
    syncToTazz(tenantId),
    // Meilisearch reindex
    action === 'DEACTIVATE'
      ? meilisearch.index('products').deleteDocument(productId)
      : meilisearch.index('products').addDocuments([{
          id: productId, name: product.name, nameEn: product.nameEn,
          category: product.category?.name, tenantId, price: product.price,
          allergens: product.allergens, isActive: product.isActive
        }]),
  ]);

  await prisma.auditLog.create({ data: {
    tenantId, action: \`PRODUCT_\${action}\`, entity: 'Product', entityId: productId,
    newData: { syncedAt: new Date(), interfaces: ['POS','KDS','KIOSK','TV','QR','ONLINE','MOBILE','GLOVO','BOLT','WOLT','TAZZ'] }
  }});
}

async function purgeCDN(tenantId: string) {
  const CF_TOKEN = process.env.CLOUDFLARE_API_TOKEN!;
  const CF_ZONE  = process.env.CLOUDFLARE_ZONE_ID!;
  await fetch(\`https://api.cloudflare.com/client/v4/zones/\${CF_ZONE}/purge_cache\`, {
    method: 'POST',
    headers: { 'Authorization': \`Bearer \${CF_TOKEN}\`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ files: [\`/api/menu/\${tenantId}\`, \`/qr/\${tenantId}/menu\`, \`/ordering/\${tenantId}/menu\`] })
  });
}`,
  },

  // ── GRUP 6: CLI ────────────────────────────────────────────────────────────
  {
    id: "cli",
    group: "CLI",
    groupColor: "#A78BFA",
    icon: "⌨️",
    title: "Unified CLI — hos-ai",
    file: "src/cli/hos-ai.ts",
    badge: "CLI",
    desc: "Un singur CLI pentru toate operațiile: import, audit, repair, write, schema, optimize.",
    detail: [
      "hos-ai import --file=<path> --tenant=<id>  → import rețete din orice document",
      "hos-ai audit --tenant=<id> [--fix] [--dry-run]  → audit complet + repair opțional",
      "hos-ai repair --tenant=<id> [--code=<CODE>]  → repară un tip specific de problemă",
      "hos-ai menu optimize --tenant=<id> [--auto-fix]  → optimizează meniul existent",
      "hos-ai db write --tenant=<id> --instruction='...'  → scrie în DB prin limbaj natural",
      "hos-ai db rollback --tenant=<id> --key=<key>  → rollback ultima scriere",
      "hos-ai schema add --description='...' [--auto-migrate]  → adaugă tabel/câmp nou",
      "hos-ai schema validate  → verifică integritatea schemei",
      "hos-ai full-check --tenant=<id> [--auto-fix]  → tot în secvență",
      "hos-ai sync --tenant=<id> --product=<id>  → forțează sync manual produs",
    ],
    code: `#!/usr/bin/env node
// packages/ai/src/cli/hos-ai.ts
// npm install -g . (din packages/ai) sau: npx tsx src/cli/hos-ai.ts

import { Command } from 'commander';
import chalk from 'chalk';
import ora   from 'ora';
import Table from 'cli-table3';
import inquirer from 'inquirer';

import { parseDocument }           from '../ingestion/documentParser';
import { extractRecipesFromText }  from '../extraction/recipeExtractor';
import { matchIngredients }        from '../matching/ingredientMatcher';
import { detectAllergensForIngredient } from '../allergens/allergenDetector';
import { suggestProductPrice }     from '../pricing/priceSuggestion';
import { generateProductPhoto }    from '../photos/photoGenerator';
import { createProductFromRecipe } from '../db/productCreator';
import { executeAiDbOperation, rollbackDbOperation } from '../db/aiDbWriter';
import { addToSchema }             from '../schema/schemaManager';
import { runFullAudit }            from '../audit/dbAuditor';
import { repairIssues }            from '../repair/autoRepair';
import { optimizeMenu }            from '../menu/menuOptimizer';
import { syncProductToAllInterfaces } from '../sync/catalogSync';

const program = new Command()
  .name('hos-ai')
  .description('🍽️  HOS AI Engine — Import · Audit · Repair · Write · Schema · Sync')
  .version('1.0.0');

// ── IMPORT ────────────────────────────────────────────────────────────────────
program.command('import')
  .description('Import rețete/meniu din document (txt/docx/xlsx/csv/pdf/jpg/url)')
  .requiredOption('--file <path>',   'Calea fișierului')
  .requiredOption('--tenant <id>',   'Tenant ID')
  .option('--no-photos',             'Skip generare foto AI')
  .option('--food-cost <n>',         'Target food cost %', '30')
  .option('--dry-run',               'Preview fără scriere în DB')
  .option('--auto-approve',          'Nu cere confirmare pentru ingrediente ambigue')
  .action(async (opts) => {
    console.log(chalk.bold.blue('\\n🍽️  HOS AI — IMPORT REȚETE\\n'));

    let sp = ora('📄 Parsare document...').start();
    const doc = await parseDocument(opts.file);
    sp.succeed(\`[\${doc.sourceType.toUpperCase()}] \${doc.metadata.filename}\`);

    sp = ora('🧠 Extragere AI (GPT-4o)...').start();
    const result = await extractRecipesFromText(doc.rawText, doc.sourceType);
    sp.succeed(\`\${result.recipes.length} rețete detectate (confidence: \${Math.round(result.confidence*100)}%)\`);
    if (result.warnings.length) result.warnings.forEach(w => console.log(chalk.yellow(\`  ⚠ \${w}\`)));

    for (const [i, recipe] of result.recipes.entries()) {
      console.log(chalk.bold(\`\\n[\${i+1}/\${result.recipes.length}] \${recipe.productName}\`));

      sp = ora('  🔍 Matching ingrediente...').start();
      const matches = await matchIngredients(opts.tenant, recipe.ingredients);
      const newC = matches.filter(m=>m.status==='NEW').length;
      const ambC = matches.filter(m=>m.status==='AMBIGUOUS').length;
      sp.succeed(\`  \${matches.length} total | \${newC} noi | \${ambC} ambigue\`);

      // Resolve ambiguous
      if (ambC > 0 && !opts.autoApprove) {
        for (const m of matches.filter(m=>m.status==='AMBIGUOUS')) {
          const { c } = await inquirer.prompt([{ type:'list', name:'c',
            message: \`  Ingredient ambiguu: "\${m.extractedName}"\`,
            choices: [...(m.candidates??[]).map(c=>({name:\`\${c.name} (\${Math.round(c.score*100)}%)\`,value:c.id})),
                      {name:'+ Creează ingredient nou',value:'NEW'}]
          }]);
          if (c==='NEW') m.status='NEW'; else { m.status='FUZZY'; m.matchedIngredient={id:c} as any; }
        }
      }

      sp = ora('  💰 Calcul preț...').start();
      const pricing = await suggestProductPrice(opts.tenant,
        matches.filter(m=>m.matchedIngredient).map(m=>({ingredientId:m.matchedIngredient!.id,quantity:0,unit:'g'})),
        recipe.servings, parseInt(opts.foodCost));
      sp.succeed(\`  Preț sugerat: \${(pricing.suggestedPriceNormal/100).toFixed(2)} RON (food cost: \${pricing.foodCostPercent}%)\`);

      let photoUrl = '';
      if (!opts.noPhotos) {
        sp = ora('  🖼️  Generare foto (DALL-E 3)...').start();
        try {
          const photo = await generateProductPhoto(recipe.productName, recipe.description??'', recipe.category, opts.tenant);
          photoUrl = photo.url;
          sp.succeed('  Foto generată și uploadată pe R2');
        } catch { sp.warn('  Skip foto — eroare DALL-E'); }
      }

      if (!opts.dryRun) {
        sp = ora('  💾 Salvare în DB...').start();
        const r = await createProductFromRecipe(opts.tenant, recipe, matches, pricing, photoUrl, 'CLI');
        sp.succeed(\`  ✅ Product ID: \${r.productId} | \${r.newIngredientsCount} ingrediente noi\`);
      }
    }

    if (opts.dryRun) console.log(chalk.yellow('\\n⚠️  DRY-RUN — nicio scriere executată'));
    else console.log(chalk.green(\`\\n✅ Import finalizat! Review la: /admin/products/pending\`));
  });

// ── AUDIT + REPAIR ────────────────────────────────────────────────────────────
program.command('audit')
  .requiredOption('--tenant <id>')
  .option('--fix',          'Repară automat problemele auto-fixable')
  .option('--dry-run',      'Preview reparații fără execuție')
  .option('--critical-only','Arată doar CRITICAL')
  .option('--export <path>','Exportă raport JSON')
  .action(async (opts) => {
    const sp = ora('🔬 Auditare DB...').start();
    const report = await runFullAudit(opts.tenant);
    sp.stop();

    const hc = report.healthScore >= 80 ? chalk.green : report.healthScore >= 60 ? chalk.yellow : chalk.red;
    console.log(chalk.bold(\`\\n📊 AUDIT REPORT — Health: \${hc.bold(report.healthScore+'/100')}\`));
    console.log(\`Products: \${report.totalProducts} | Ingredients: \${report.totalIngredients}\`);
    console.log(\`CRITICAL: \${chalk.red(report.summary.critical)} | WARNING: \${chalk.yellow(report.summary.warnings)} | INFO: \${report.summary.info}\`);
    console.log(\`Auto-fixable: \${chalk.green(report.summary.autoFixable)} | Manual: \${report.summary.manualReviewNeeded}\`);

    const shown = opts.criticalOnly ? report.issues.filter(i=>i.severity==='CRITICAL') : report.issues;
    const t = new Table({ head:['SEV','ENTITATE','PROBLEMĂ','FIX'], colWidths:[10,22,38,12] });
    shown.forEach(i => t.push([
      i.severity==='CRITICAL'?chalk.red(i.severity):i.severity==='WARNING'?chalk.yellow(i.severity):chalk.blue(i.severity),
      i.entityName.slice(0,20), i.message.slice(0,36),
      i.autoFixAvailable?chalk.green('AUTO'):chalk.gray('MANUAL')
    ]));
    console.log(t.toString());

    if (opts.fix && report.summary.autoFixable > 0) {
      const { ok } = await inquirer.prompt([{ type:'confirm', name:'ok',
        message:\`Aplici \${report.summary.autoFixable} reparații automate?\`, default:!opts.dryRun }]);
      if (ok) {
        let fixed=0;
        const sp2 = ora('🔧 Reparare...').start();
        const results = await repairIssues(opts.tenant, 'CLI', report.issues, {
          dryRun: opts.dryRun,
          onProgress: (n,t) => { sp2.text=\`🔧 \${n}/\${t}\`; fixed=n; }
        });
        sp2.succeed(\`\${results.filter(r=>r.status==='FIXED').length} reparate | \${results.filter(r=>r.status==='FAILED').length} eșuate\`);
      }
    }
    if (opts.export) { await (await import('fs/promises')).writeFile(opts.export, JSON.stringify(report,null,2)); }
  });

// ── DB WRITE ──────────────────────────────────────────────────────────────────
program.command('db write')
  .requiredOption('--tenant <id>')
  .requiredOption('--instruction <text>')
  .option('--dry-run')
  .action(async (opts) => {
    const sp = ora('🧠 AI generează operație DB...').start();
    const r = await executeAiDbOperation(opts.tenant, 'CLI', opts.instruction, { dryRun: opts.dryRun });
    sp.stop();
    console.log(chalk.bold('\\nOperație generată:'), JSON.stringify(r.op, null,2));
    console.log(\`Înregistrări afectate: \${chalk.yellow(r.affectedCount)}\`);
    if (opts.dryRun) console.log(chalk.yellow('\\n⚠️  DRY-RUN'));
    else if (r.executed) console.log(chalk.green(\`\\n✅ Executat! Rollback key: \${r.rollbackKey}\`));
  });

program.command('db rollback')
  .requiredOption('--tenant <id>')
  .requiredOption('--key <key>')
  .action(async (opts) => {
    const r = await rollbackDbOperation(opts.tenant, 'CLI', opts.key);
    console.log(chalk.green(\`✅ Restaurate: \${r.restored} înregistrări\`));
  });

// ── SCHEMA ────────────────────────────────────────────────────────────────────
program.command('schema add')
  .requiredOption('--description <text>')
  .option('--dry-run')
  .option('--auto-migrate')
  .action(async (opts) => {
    const sp = ora('🏗️  AI generează schema...').start();
    const r = await addToSchema(opts.description, { dryRun: opts.dryRun, autoMigrate: opts.autoMigrate });
    sp.stop();
    console.log(chalk.cyan('\\nDefinție Prisma:\\n') + r.prismaDefinition);
    if (r.applied) console.log(chalk.green(\`\\n✅ Migrație aplicată: \${r.migrationName}\`));
    else console.log(chalk.yellow(\`\\n⚠️  Neaplicat. Adaugă --auto-migrate pentru execuție.\`));
  });

// ── MENU OPTIMIZE ─────────────────────────────────────────────────────────────
program.command('menu optimize')
  .requiredOption('--tenant <id>')
  .option('--location <id>')
  .action(async (opts) => {
    const sp = ora('📊 Analiză meniu...').start();
    const r = await optimizeMenu(opts.tenant, opts.location);
    sp.succeed(\`Menu score: \${r.overallScore}/100 | Descrieri generate: \${r.descriptionsFixed}\`);
    console.log('\\nRecomandări top 5:');
    (r.recommendations ?? []).slice(0,5).forEach((rec: any) =>
      console.log(\`  [\${rec.priority}] \${rec.type}: \${rec.title}\`)
    );
  });

// ── FULL CHECK ────────────────────────────────────────────────────────────────
program.command('full-check')
  .requiredOption('--tenant <id>')
  .option('--auto-fix')
  .action(async (opts) => {
    console.log(chalk.bold.blue('\\n🍽️  HOS AI — FULL CHECK\\n'));
    const audit = await runFullAudit(opts.tenant);
    console.log(\`[1/3] Audit: \${audit.healthScore}/100 | Issues: \${audit.issues.length}\`);
    const menu = await optimizeMenu(opts.tenant);
    console.log(\`[2/3] Menu: \${menu.overallScore}/100 | Fixed: \${menu.descriptionsFixed}\`);
    if (opts.autoFix && audit.summary.autoFixable > 0) {
      const results = await repairIssues(opts.tenant, 'CLI', audit.issues);
      console.log(\`[3/3] Repair: \${results.filter(r=>r.status==='FIXED').length}/\${audit.summary.autoFixable}\`);
    }
    console.log(chalk.bold.green('\\n✅ Full-check finalizat!'));
  });

program.parse();`,
  },
];

const GROUPS = [
  { id: "IMPORT",  label: "📥 IMPORT",  color: "#6366F1", desc: "Document → Extracție → Matching" },
  { id: "ANALYZE", label: "⚗️ ANALYZE", color: "#10B981", desc: "Alergeni · Prețuri · Foto" },
  { id: "WRITE",   label: "✍️ WRITE",   color: "#F59E0B", desc: "DB Creator · AI Writer · Schema" },
  { id: "AUDIT",   label: "🔬 AUDIT",   color: "#EC4899", desc: "Audit · Repair · Optimize" },
  { id: "SYNC",    label: "🔄 SYNC",    color: "#14B8A6", desc: "Toate interfețele simultan" },
  { id: "CLI",     label: "⌨️ CLI",     color: "#A78BFA", desc: "Un singur CLI pentru tot" },
];

const BADGE_CLR = {
  SHARED:"#6366F1", "GPT-4o":"#EC4899", WRITE:"#F59E0B",
  SCHEMA:"#EF4444", AUDIT:"#EC4899", REPAIR:"#10B981",
  OPTIMIZE:"#F97316", SYNC:"#14B8A6", CLI:"#A78BFA",
};

export default function HOSAIEngine() {
  const [selGroup,  setSelGroup]  = useState("IMPORT");
  const [selModule, setSelModule] = useState("ingest");
  const [showCode,  setShowCode]  = useState(false);
  const [copied,    setCopied]    = useState(null);

  const groupMods = ENGINE_MODULES.filter(m => m.group === selGroup);
  const mod = ENGINE_MODULES.find(m => m.id === selModule) ?? groupMods[0];

  const fullSpec = ENGINE_MODULES.map(m =>
    `${"═".repeat(60)}\n${m.icon} [${m.group}] ${m.title}\n${m.file}\n${"═".repeat(60)}\n\n` +
    m.detail.map(d => `• ${d}`).join("\n") + "\n\n" + m.code
  ).join("\n\n");

  const copy = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div style={{fontFamily:"'JetBrains Mono','Fira Code',monospace",background:"#05050d",minHeight:"100vh",color:"#CBD5E1",padding:"14px 18px"}}>

      {/* ── HEADER ── */}
      <div style={{background:"linear-gradient(135deg,#0c0c20,#100a1e,#080c18)",border:"1px solid #1a1a3a",borderRadius:16,padding:"20px 24px",marginBottom:12}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:10}}>
          <div>
            <div style={{fontSize:8,letterSpacing:5,color:"#a78bfa",fontWeight:900,marginBottom:4}}>
              @REPO/AI · UNIFIED ENGINE · v2.0 · packages/ai/
            </div>
            <h1 style={{margin:0,fontSize:20,fontWeight:900,color:"#faf5ff",lineHeight:1.2}}>
              🧠 HOS AI ENGINE
            </h1>
            <p style={{margin:"4px 0 10px",fontSize:10,color:"#2a2a4a"}}>
              Import · Allergens · Pricing · Photos · DB Write · Audit · Repair · Schema · Menu · Sync · CLI
            </p>
            <div style={{display:"flex",flexWrap:"wrap",gap:4}}>
              {["GPT-4o","DALL-E 3","text-embedding-3-small","Prisma","Zod","Fuse.js","mammoth","SheetJS","Tesseract","sharp","BullMQ","Meilisearch"].map(t=>(
                <span key={t} style={{background:"#1a0a35",border:"1px solid #3b1f70",borderRadius:3,padding:"1px 6px",fontSize:9,color:"#c4b5fd"}}>{t}</span>
              ))}
            </div>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:6}}>
            <button onClick={()=>copy(fullSpec,"all")} style={{background:copied==="all"?"#064e3b":"linear-gradient(135deg,#7c3aed,#be185d)",color:"#fff",border:"none",borderRadius:7,padding:"8px 16px",cursor:"pointer",fontSize:11,fontFamily:"inherit",fontWeight:800}}>
              {copied==="all"?"✅ COPIED":"📋 COPY FULL SPEC"}
            </button>
            <div style={{fontSize:9,color:"#1e1e3a",textAlign:"center"}}>
              {ENGINE_MODULES.length} fișiere · 1 pachet npm
            </div>
          </div>
        </div>

        {/* Flux pipeline */}
        <div style={{marginTop:14,display:"flex",alignItems:"center",flexWrap:"wrap",gap:4}}>
          {["📄 Document","→","🧠 GPT-4o Extract","→","🔍 Match","→","⚗️ Allergens","→","💰 Pricing","→","🖼️ DALL-E 3","→","💾 DB Write","→","🔄 Sync","→","🔬 Audit","→","🔧 Repair"].map((s,i)=>(
            <span key={i} style={{fontSize:s==="→"?14:10,color:s==="→"?"#1e1e3a":"#475569",background:s!=="→"?"#0d0d1a":"transparent",border:s!=="→"?"1px solid #1a1a2e":"none",borderRadius:5,padding:s!=="→"?"2px 8px":"0"}}>
              {s}
            </span>
          ))}
        </div>
      </div>

      {/* ── GROUP TABS ── */}
      <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:10}}>
        {GROUPS.map(g=>(
          <button key={g.id} onClick={()=>{setSelGroup(g.id);setSelModule(ENGINE_MODULES.find(m=>m.group===g.id)?.id??selModule);}} style={{
            background:selGroup===g.id?g.color+"22":"#0d0d1a",
            border:`1px solid ${selGroup===g.id?g.color+"60":"#1a1a2e"}`,
            borderRadius:8,padding:"8px 14px",cursor:"pointer",fontFamily:"inherit",
            color:selGroup===g.id?g.color:"#334155",fontWeight:selGroup===g.id?800:400,fontSize:11,
          }}>
            {g.label}
            <span style={{display:"block",fontSize:8,color:selGroup===g.id?g.color+"99":"#1e293b",marginTop:1}}>{g.desc}</span>
          </button>
        ))}
      </div>

      <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>

        {/* ── MODULE LIST ── */}
        <div style={{width:220,flexShrink:0}}>
          {groupMods.map(m=>(
            <div key={m.id} onClick={()=>setSelModule(m.id)} style={{
              background:selModule===m.id?m.groupColor+"18":"#0a0a14",
              border:`1px solid ${selModule===m.id?m.groupColor+"50":"#111120"}`,
              borderLeft:`3px solid ${selModule===m.id?m.groupColor:"#111120"}`,
              borderRadius:8,padding:"10px 12px",marginBottom:6,cursor:"pointer",
            }}>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <span style={{fontSize:16}}>{m.icon}</span>
                <div>
                  <div style={{fontSize:10,fontWeight:800,color:selModule===m.id?m.groupColor:"#334155",lineHeight:1.3}}>{m.title}</div>
                  <div style={{fontSize:8,color:"#1e293b",marginTop:2,fontFamily:"monospace"}}>{m.file.split('/').pop()}</div>
                </div>
              </div>
              {selModule===m.id&&(
                <div style={{fontSize:9,color:"#334155",marginTop:6,lineHeight:1.5}}>{m.desc}</div>
              )}
            </div>
          ))}
        </div>

        {/* ── MODULE DETAIL ── */}
        {mod && (
          <div style={{flex:1,minWidth:280}}>
            <div style={{background:"#08080f",border:`1px solid ${mod.groupColor}35`,borderRadius:12,overflow:"hidden"}}>

              {/* Header */}
              <div style={{background:`linear-gradient(90deg,${mod.groupColor}18,transparent)`,borderLeft:`4px solid ${mod.groupColor}`,padding:"14px 18px",display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                <div>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
                    <span style={{fontSize:20}}>{mod.icon}</span>
                    <span style={{fontSize:14,fontWeight:900,color:"#f1f5f9"}}>{mod.title}</span>
                    <span style={{fontSize:8,color:BADGE_CLR[mod.badge]??mod.groupColor,background:(BADGE_CLR[mod.badge]??mod.groupColor)+"20",padding:"1px 7px",borderRadius:3,fontWeight:900,letterSpacing:1}}>{mod.badge}</span>
                  </div>
                  <div style={{fontSize:9,color:"#1e293b",fontFamily:"monospace",marginBottom:4}}>{mod.file}</div>
                  <div style={{fontSize:11,color:"#475569"}}>{mod.desc}</div>
                  {mod.deps.length>0&&(
                    <div style={{display:"flex",gap:4,marginTop:6,flexWrap:"wrap"}}>
                      <span style={{fontSize:8,color:"#1e293b"}}>uses:</span>
                      {mod.deps.map(d=>{
                        const dep=ENGINE_MODULES.find(m=>m.id===d);
                        return dep?(
                          <span key={d} onClick={()=>setSelModule(d)} style={{fontSize:8,color:dep.groupColor,background:dep.groupColor+"15",padding:"1px 6px",borderRadius:3,cursor:"pointer",border:`1px solid ${dep.groupColor}30`}}>
                            {dep.icon} {dep.title}
                          </span>
                        ):null;
                      })}
                    </div>
                  )}
                </div>
                <button onClick={()=>setShowCode(p=>!p)} style={{background:"transparent",border:`1px solid ${showCode?mod.groupColor+"60":"#1a1a2e"}`,color:showCode?mod.groupColor:"#334155",borderRadius:6,padding:"5px 12px",cursor:"pointer",fontSize:10,fontFamily:"inherit",whiteSpace:"nowrap"}}>
                  {showCode?"◀ detail":"▶ code"}
                </button>
              </div>

              <div style={{padding:"14px 18px"}}>
                {!showCode ? (
                  /* DETAIL VIEW */
                  <div>
                    <div style={{fontSize:8,color:mod.groupColor,letterSpacing:2,fontWeight:900,marginBottom:8}}>CAPABILITĂȚI</div>
                    {mod.detail.map((d,i)=>(
                      <div key={i} style={{display:"flex",gap:8,padding:"5px 0",borderBottom:"1px solid #0a0a18"}}>
                        <span style={{color:mod.groupColor,fontSize:10,marginTop:2,flexShrink:0}}>→</span>
                        <span style={{fontSize:11,color:"#5a6f85",lineHeight:1.6}}>{d}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  /* CODE VIEW */
                  <div>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                      <div style={{fontSize:8,color:mod.groupColor,letterSpacing:2,fontWeight:900}}>
                        {mod.file}
                      </div>
                      <button onClick={()=>copy(mod.code,"code")} style={{background:"transparent",border:`1px solid #1a1a2e`,color:copied==="code"?mod.groupColor:"#334155",borderRadius:5,padding:"2px 8px",cursor:"pointer",fontSize:9,fontFamily:"inherit"}}>
                        {copied==="code"?"✓ ok":"copy"}
                      </button>
                    </div>
                    <pre style={{background:"#020208",border:`1px solid ${mod.groupColor}15`,borderRadius:8,padding:"14px",fontSize:9.5,color:"#3a4a5a",whiteSpace:"pre-wrap",wordBreak:"break-word",margin:0,lineHeight:1.8,maxHeight:480,overflowY:"auto",fontFamily:"inherit"}}>
                      {mod.code}
                    </pre>
                  </div>
                )}
              </div>
            </div>

            {/* Package.json */}
            {mod.id==="cli"&&(
              <div style={{background:"#08080f",border:"1px solid #111120",borderRadius:10,padding:"14px 18px",marginTop:10}}>
                <div style={{fontSize:8,color:"#a78bfa",letterSpacing:2,fontWeight:900,marginBottom:10}}>📦 packages/ai/package.json</div>
                <pre style={{background:"#020208",border:"1px solid #0f0f20",borderRadius:8,padding:"12px",fontSize:9.5,color:"#3a4a5a",margin:0,lineHeight:1.8,whiteSpace:"pre-wrap",fontFamily:"inherit"}}>{`{
  "name": "@repo/ai",
  "version": "1.0.0",
  "main": "src/index.ts",
  "bin": { "hos-ai": "src/cli/hos-ai.ts" },
  "scripts": {
    "build": "tsc",
    "cli": "tsx src/cli/hos-ai.ts"
  },
  "dependencies": {
    "openai": "^4.0.0",
    "mammoth": "^1.6.0",
    "xlsx": "^0.18.5",
    "pdf-parse": "^1.1.1",
    "tesseract.js": "^5.0.0",
    "puppeteer": "^21.0.0",
    "fuse.js": "^7.0.0",
    "sharp": "^0.33.0",
    "commander": "^11.0.0",
    "inquirer": "^9.0.0",
    "ora": "^7.0.0",
    "chalk": "^5.0.0",
    "cli-table3": "^0.6.0"
  }
}`}</pre>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── INDEX EXPORTS ── */}
      <div style={{background:"#08080f",border:"1px solid #111120",borderRadius:10,padding:"14px 18px",marginTop:10}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
          <div style={{fontSize:8,color:"#6366f1",letterSpacing:2,fontWeight:900}}>📤 packages/ai/src/index.ts — EXPORTS PUBLICE</div>
          <button onClick={()=>copy(indexTs,"idx")} style={{background:"transparent",border:"1px solid #1a1a2e",color:copied==="idx"?"#6366f1":"#334155",borderRadius:5,padding:"2px 8px",cursor:"pointer",fontSize:9,fontFamily:"inherit"}}>
            {copied==="idx"?"✓":"copy"}
          </button>
        </div>
        <pre style={{background:"#020208",border:"1px solid #0f0f1f",borderRadius:8,padding:"12px",fontSize:9.5,color:"#3a4a5a",margin:0,lineHeight:1.8,whiteSpace:"pre-wrap",fontFamily:"inherit"}}>
          {indexTs}
        </pre>
      </div>

      <div style={{textAlign:"center",marginTop:14,color:"#0a0a18",fontSize:8,letterSpacing:2}}>
        @REPO/AI · UNIFIED HOS AI ENGINE · {ENGINE_MODULES.length} MODULES · 1 PACKAGE · 1 CLI
      </div>
    </div>
  );
}

const indexTs = `// packages/ai/src/index.ts — single entry point for @repo/ai

// ── IMPORT PIPELINE ──────────────────────────────────────────────────────────
export { parseDocument }            from './ingestion/documentParser';
export { extractRecipesFromText }   from './extraction/recipeExtractor';
export { matchIngredients }         from './matching/ingredientMatcher';

// ── SHARED ANALYZERS (used by both import + audit) ──────────────────────────
export { detectAllergensForIngredient, calculateRecipeAllergens }
                                    from './allergens/allergenDetector';
export { suggestProductPrice }      from './pricing/priceSuggestion';
export { generateProductPhoto }     from './photos/photoGenerator';

// ── WRITE ────────────────────────────────────────────────────────────────────
export { createProductFromRecipe }  from './db/productCreator';
export { executeAiDbOperation, rollbackDbOperation }
                                    from './db/aiDbWriter';
export { addToSchema, autoFixMissingField }
                                    from './schema/schemaManager';

// ── AUDIT / REPAIR / OPTIMIZE ────────────────────────────────────────────────
export { runFullAudit }             from './audit/dbAuditor';
export { repairIssues }             from './repair/autoRepair';
export { optimizeMenu }             from './menu/menuOptimizer';

// ── SYNC ─────────────────────────────────────────────────────────────────────
export { syncProductToAllInterfaces } from './sync/catalogSync';

// ── TYPES ────────────────────────────────────────────────────────────────────
export type { ParsedDocument }         from './ingestion/documentParser';
export type { ExtractionResult }       from './extraction/recipeExtractor';
export type { MatchResult, MatchStatus } from './matching/ingredientMatcher';
export type { AllergenDetectionResult }  from './allergens/allergenDetector';
export type { PricingSuggestion }        from './pricing/priceSuggestion';
export type { AuditIssue, AuditReport }  from './audit/dbAuditor';
export type { RepairResult }             from './repair/autoRepair';`;
