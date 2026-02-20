import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import os from 'os';

const router = express.Router();
const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: MAX_FILE_SIZE_BYTES } });

// Auth guard — all AI routes require an authenticated user
function requireAuth(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ ok: false, error: 'Authentication required' });
  }
  next();
}

router.use(requireAuth);

// ── GET /api/ai/audit ────────────────────────────────────────────────────
// Query params: tenantId
router.get('/audit', async (req, res) => {
  try {
    const tenantId = req.query.tenantId || req.user.tenantId;
    if (!tenantId) return res.status(400).json({ ok: false, error: 'tenantId lipsește' });

    const { runFullAudit } = await import('../../packages/ai/src/audit/dbAuditor.js');
    const report = await runFullAudit(tenantId);
    res.json({ ok: true, data: report });
  } catch (err) {
    res.status(500).json({ ok: false, error: String(err) });
  }
});

// ── POST /api/ai/audit/repair ────────────────────────────────────────────
// Body: { tenantId, issues, dryRun? }
router.post('/audit/repair', async (req, res) => {
  try {
    const { tenantId, issues, dryRun } = req.body;
    if (!tenantId || !issues) return res.status(400).json({ ok: false, error: 'tenantId și issues sunt necesare' });

    const { repairIssues } = await import('../../packages/ai/src/repair/autoRepair.js');
    const results = await repairIssues(tenantId, req.user.id, issues, { dryRun: Boolean(dryRun) });
    res.json({ ok: true, data: results });
  } catch (err) {
    res.status(500).json({ ok: false, error: String(err) });
  }
});

// ── POST /api/ai/menu/optimize ───────────────────────────────────────────
// Body: { tenantId, locationId? }
router.post('/menu/optimize', async (req, res) => {
  try {
    const { tenantId, locationId } = req.body;
    if (!tenantId) return res.status(400).json({ ok: false, error: 'tenantId lipsește' });

    const { optimizeMenu } = await import('../../packages/ai/src/menu/menuOptimizer.js');
    const report = await optimizeMenu(tenantId, locationId);
    res.json({ ok: true, data: report });
  } catch (err) {
    res.status(500).json({ ok: false, error: String(err) });
  }
});

// ── POST /api/ai/db/write ────────────────────────────────────────────────
// Body: { tenantId, instruction, dryRun? }
router.post('/db/write', async (req, res) => {
  try {
    const { tenantId, instruction, dryRun } = req.body;
    if (!tenantId || !instruction) return res.status(400).json({ ok: false, error: 'tenantId și instruction sunt necesare' });

    const { executeAiDbOperation } = await import('../../packages/ai/src/db/aiDbWriter.js');
    const result = await executeAiDbOperation(tenantId, req.user.id, instruction, { dryRun: Boolean(dryRun) });
    res.json({ ok: true, data: result });
  } catch (err) {
    res.status(500).json({ ok: false, error: String(err) });
  }
});

// ── POST /api/ai/db/rollback ─────────────────────────────────────────────
// Body: { tenantId, rollbackKey }
router.post('/db/rollback', async (req, res) => {
  try {
    const { tenantId, rollbackKey } = req.body;
    if (!tenantId || !rollbackKey) return res.status(400).json({ ok: false, error: 'tenantId și rollbackKey sunt necesare' });

    const { rollbackDbOperation } = await import('../../packages/ai/src/db/aiDbWriter.js');
    const result = await rollbackDbOperation(tenantId, req.user.id, rollbackKey);
    res.json({ ok: true, data: result });
  } catch (err) {
    res.status(500).json({ ok: false, error: String(err) });
  }
});

// ── POST /api/ai/schema/add ──────────────────────────────────────────────
// Body: { description, targetModel?, dryRun?, autoMigrate? }
router.post('/schema/add', async (req, res) => {
  try {
    const { description, targetModel, dryRun, autoMigrate } = req.body;
    if (!description) return res.status(400).json({ ok: false, error: 'description lipsește' });

    const { addToSchema } = await import('../../packages/ai/src/schema/schemaManager.js');
    const result = await addToSchema(description, { targetModel, dryRun: Boolean(dryRun), autoMigrate: Boolean(autoMigrate) });
    res.json({ ok: true, data: result });
  } catch (err) {
    res.status(500).json({ ok: false, error: String(err) });
  }
});

// ── POST /api/ai/sync/product ────────────────────────────────────────────
// Body: { tenantId, productId, action }
router.post('/sync/product', async (req, res) => {
  try {
    const { tenantId, productId, action } = req.body;
    if (!tenantId || !productId) return res.status(400).json({ ok: false, error: 'tenantId și productId sunt necesare' });

    const { syncProductToAllInterfaces } = await import('../../packages/ai/src/sync/catalogSync.js');
    await syncProductToAllInterfaces(tenantId, productId, action ?? 'UPDATE');
    res.json({ ok: true, message: `Produs ${productId} sincronizat (${action ?? 'UPDATE'})` });
  } catch (err) {
    res.status(500).json({ ok: false, error: String(err) });
  }
});

// ── POST /api/ai/import ──────────────────────────────────────────────────
// Multipart form: file + fields: tenantId, dryRun?, foodCostPct?
router.post('/import', upload.single('file'), async (req, res) => {
  let tempPath = null;
  try {
    const tenantId   = req.body.tenantId || req.user.tenantId;
    const dryRun     = req.body.dryRun === 'true' || req.body.dryRun === true;
    const foodCostPct = parseInt(req.body.foodCostPct ?? '30', 10);
    const userId     = req.user.id;

    if (!tenantId) return res.status(400).json({ ok: false, error: 'tenantId lipsește' });
    if (!req.file)  return res.status(400).json({ ok: false, error: 'Fișierul lipsește' });

    // Write buffer to temp file so documentParser can read it
    const ext = path.extname(req.file.originalname).toLowerCase();
    tempPath = path.join(os.tmpdir(), `hos-ai-import-${Date.now()}${ext}`);
    await fs.writeFile(tempPath, req.file.buffer);

    const { parseDocument }           = await import('../../packages/ai/src/ingestion/documentParser.js');
    const { extractRecipesFromText }  = await import('../../packages/ai/src/extraction/recipeExtractor.js');
    const { matchIngredients }        = await import('../../packages/ai/src/matching/ingredientMatcher.js');
    const { suggestProductPrice }     = await import('../../packages/ai/src/pricing/priceSuggestion.js');
    const { generateProductPhoto }    = await import('../../packages/ai/src/photos/photoGenerator.js');
    const { createProductFromRecipe } = await import('../../packages/ai/src/db/productCreator.js');

    const doc       = await parseDocument(tempPath);
    const extracted = await extractRecipesFromText(doc.rawText, doc.sourceType);
    const results   = [];

    for (const recipe of extracted.recipes) {
      const matches = await matchIngredients(tenantId, recipe.ingredients);
      const pricing = await suggestProductPrice(
        tenantId,
        matches.filter(m => m.matchedIngredient !== null).map(m => ({
          ingredientId: m.matchedIngredient!.id, quantity: m.quantity, unit: m.unit,
        })),
        recipe.servings,
        foodCostPct
      );

      if (!dryRun) {
        const photo  = await generateProductPhoto(recipe.productName, recipe.description ?? '', recipe.category, tenantId)
          .catch(() => ({ url: '', thumbnailUrl: '' }));
        const result = await createProductFromRecipe(tenantId, recipe, matches, pricing, photo.url, userId);
        results.push({ ...result, productName: recipe.productName, suggestedPrice: pricing.suggestedPriceNormal });
      } else {
        results.push({ productName: recipe.productName, suggestedPrice: pricing.suggestedPriceNormal, dryRun: true });
      }
    }

    res.json({
      ok: true,
      data: {
        totalFound: extracted.totalFound,
        confidence: extracted.confidence,
        created:    results.length,
        dryRun,
        results,
      },
    });
  } catch (err) {
    res.status(500).json({ ok: false, error: String(err) });
  } finally {
    if (tempPath) await fs.unlink(tempPath).catch(() => {});
  }
});

export default router;
