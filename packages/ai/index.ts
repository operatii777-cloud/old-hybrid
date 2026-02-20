export { parseDocument }                         from './src/ingestion/documentParser';
export { extractRecipesFromText }                from './src/extraction/recipeExtractor';
export { matchIngredients }                      from './src/matching/ingredientMatcher';
export { detectAllergensForIngredient,
         calculateRecipeAllergens }              from './src/allergens/allergenDetector';
export { suggestProductPrice }                   from './src/pricing/priceSuggestion';
export { lookupMarketPrice,
         marketPriceInUnit }                     from './src/pricing/marketPrices';
export { generateProductPhoto }                  from './src/photos/photoGenerator';
export { createProductFromRecipe }               from './src/db/productCreator';
export { executeAiDbOperation,
         rollbackDbOperation }                   from './src/db/aiDbWriter';
export { addToSchema,
         autoFixMissingField }                   from './src/schema/schemaManager';
export { runFullAudit }                          from './src/audit/dbAuditor';
export { repairIssues }                          from './src/repair/autoRepair';
export { optimizeMenu }                          from './src/menu/menuOptimizer';
export { syncProductToAllInterfaces }            from './src/sync/catalogSync';

export type { ParsedDocument, SourceType }       from './src/ingestion/documentParser';
export type { ExtractionResult }                 from './src/extraction/recipeExtractor';
export type { MatchResult, MatchStatus }         from './src/matching/ingredientMatcher';
export type { AllergenDetectionResult }          from './src/allergens/allergenDetector';
export type { PricingSuggestion,
              RawIngredientInput }             from './src/pricing/priceSuggestion';
export type { AuditIssue, AuditReport }          from './src/audit/dbAuditor';
export type { RepairResult }                     from './src/repair/autoRepair';
