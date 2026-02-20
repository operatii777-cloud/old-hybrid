import { z } from 'zod';

export const ExtractedIngredientSchema = z.object({
  name:     z.string().min(1),
  quantity: z.number().positive(),
  unit:     z.string().min(1),
});

export const ExtractedRecipeSchema = z.object({
  productName:  z.string().min(1),
  category:     z.string().default('General'),
  description:  z.string().optional(),
  servings:     z.number().positive().default(1),
  prepTimeMins: z.number().nonnegative().optional(),
  ingredients:  z.array(ExtractedIngredientSchema),
});

export const ExtractionResultSchema = z.object({
  recipes: z.array(ExtractedRecipeSchema),
  totalFound: z.number(),
  confidence: z.number().min(0).max(1),
});

export type ExtractedIngredient = z.infer<typeof ExtractedIngredientSchema>;
export type ExtractedRecipe     = z.infer<typeof ExtractedRecipeSchema>;
export type ExtractionResult    = z.infer<typeof ExtractionResultSchema>;