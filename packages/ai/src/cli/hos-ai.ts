#!/usr/bin/env tsx
import 'dotenv/config';

import { Command } from 'commander';
import chalk from 'chalk';
import Table from 'cli-table3';
import ora from 'ora';
import fs from 'fs/promises';

const program = new Command();

program
  .name('hos-ai')
  .description('HOS AI Engine CLI — HORECA Operations System')
  .version('1.0.0');

// ── AUDIT ──────────────────────────────────────────────────────────────────
program
  .command('audit')
  .description('Rulează auditul complet al bazei de date')
  .requiredOption('--tenant <tenantId>', 'ID-ul tenantului')
  .option('--fix', 'Repară automat problemele fixable')
  .option('--dry-run', 'Simulare fără modificări reale')
  .action(async (opts) => {
    const spinner = ora('Analizare bază de date...').start();
    try {
      const { runFullAudit } = await import('../audit/dbAuditor');
      const report = await runFullAudit(opts.tenant);
      spinner.succeed(`Audit complet — Health Score: ${chalk.bold(report.healthScore)}/100`);

      const table = new Table({
        head: [chalk.cyan('Cod'), chalk.cyan('Severitate'), chalk.cyan('Mesaj'), chalk.cyan('Auto-fix')],
        colWidths: [20, 12, 60, 10],
      });

      for (const issue of report.issues) {
        const sev = issue.severity === 'CRITICAL'
          ? chalk.red(issue.severity)
          : issue.severity === 'WARNING'
            ? chalk.yellow(issue.severity)
            : chalk.gray(issue.severity);
        table.push([issue.code, sev, issue.message, issue.autoFixAvailable ? chalk.green('DA') : 'NU']);
      }
      console.log(table.toString());
      console.log(chalk.bold(`\nRezumat: ${report.summary.critical} critical, ${report.summary.warning} warning, ${report.summary.info} info`));

      if (opts.fix && report.issues.some(i => i.autoFixAvailable)) {
        const { repairIssues } = await import('../repair/autoRepair');
        const spinner2 = ora('Reparare probleme...').start();
        const results = await repairIssues(opts.tenant, 'cli', report.issues, {
          dryRun:     opts.dryRun,
          onProgress: (msg) => { spinner2.text = msg; },
        });
        spinner2.succeed('Reparare completă');

        const fixed       = results.filter(r => r.status === 'FIXED').length;
        const failed      = results.filter(r => r.status === 'FAILED').length;
        const needsReview = results.filter(r => r.status === 'NEEDS_REVIEW').length;
        console.log(chalk.green(`✔ Fixate: ${fixed}`) + '  ' + chalk.red(`✖ Eșuate: ${failed}`) + '  ' + chalk.yellow(`⚠ Necesită revizuire: ${needsReview}`));
      }
    } catch (err) {
      spinner.fail(String(err));
      process.exit(1);
    }
  });

// ── IMPORT ─────────────────────────────────────────────────────────────────
program
  .command('import')
  .description('Importă un fișier meniu și creează produse')
  .requiredOption('--file <path>', 'Calea către fișierul de importat')
  .requiredOption('--tenant <tenantId>', 'ID-ul tenantului')
  .option('--dry-run', 'Simulare fără creare în DB')
  .option('--food-cost <pct>', 'Procentul food cost țintă', '30')
  .option('--user <userId>', 'ID-ul utilizatorului', 'cli')
  .action(async (opts) => {
    const spinner = ora(`Procesare fișier: ${opts.file}`).start();
    try {
      const { parseDocument }           = await import('../ingestion/documentParser');
      const { extractRecipesFromText }  = await import('../extraction/recipeExtractor');
      const { matchIngredients }        = await import('../matching/ingredientMatcher');
      const { suggestProductPrice }     = await import('../pricing/priceSuggestion');
      const { generateProductPhoto }    = await import('../photos/photoGenerator');
      const { createProductFromRecipe } = await import('../db/productCreator');

      spinner.text = 'Parsare document...';
      const doc = await parseDocument(opts.file);

      spinner.text = 'Extragere rețete cu AI...';
      const extracted = await extractRecipesFromText(doc.rawText, doc.sourceType);
      spinner.succeed(`Găsite ${extracted.totalFound} rețete`);

      const foodCost = parseInt(opts.foodCost, 10);
      if (isNaN(foodCost) || foodCost <= 0) throw new Error('Procentul food cost trebuie să fie un număr pozitiv');
      const results = [];

      for (const recipe of extracted.recipes) {
        const s = ora(`  → ${recipe.productName}`).start();

        const matches = await matchIngredients(opts.tenant, recipe.ingredients);
        const pricing = await suggestProductPrice(
          opts.tenant,
          matches.filter(m => m.matchedIngredient !== null).map(m => ({
            ingredientId: m.matchedIngredient!.id, quantity: m.quantity, unit: m.unit,
          })),
          recipe.servings,
          foodCost,
          // Pass raw extracted ingredients so market-price fallback works for NEW items
          recipe.ingredients.map(i => ({ name: i.name, quantity: i.quantity, unit: i.unit }))
        );

        if (!opts.dryRun) {
          const photo = await generateProductPhoto(recipe.productName, recipe.description ?? '', recipe.category, opts.tenant)
            .catch(() => ({ url: '', thumbnailUrl: '' }));
          const result = await createProductFromRecipe(opts.tenant, recipe, matches, pricing, photo.url, opts.user);
          results.push({ ...result, productName: recipe.productName });
          const priceLabel = pricing.suggestedPriceNormal > 0
            ? `${(pricing.suggestedPriceNormal / 100).toFixed(2)} RON`
            : chalk.yellow('preț indisponibil (lipsă date furnizori)');
          const fallbackNote = pricing.usedMarketPriceFallback ? chalk.yellow(' ⚠ prețuri estimate Metro/Selgros/Lidl') : '';
          s.succeed(`  ✔ ${recipe.productName} — preț sugerat: ${priceLabel}${fallbackNote}`);
        } else {
          const priceLabel = pricing.suggestedPriceNormal > 0
            ? `${(pricing.suggestedPriceNormal / 100).toFixed(2)} RON`
            : chalk.yellow('preț indisponibil (lipsă date furnizori)');
          const fallbackNote = pricing.usedMarketPriceFallback ? chalk.yellow(' ⚠ prețuri estimate Metro/Selgros/Lidl') : '';
          s.succeed(`  [DRY-RUN] ${recipe.productName} — preț sugerat: ${priceLabel}${fallbackNote}`);
        }

        // Show cost breakdown if market-price fallback was used
        if (pricing.usedMarketPriceFallback && pricing.breakdown.length > 0) {
          for (const item of pricing.breakdown) {
            if (item.marketPriceNote) {
              console.log(chalk.gray(`       • ${item.name}: ${(item.costCents / 100).toFixed(2)} RON — ${item.marketPriceNote}`));
            }
          }
        }
      }

      console.log(chalk.green.bold(`\n✔ Import complet: ${results.length} produse${opts.dryRun ? ' (dry-run, necreat în DB)' : ' create (status: INACTIVE, necesită aprobare)'}`));
    } catch (err) {
      spinner.fail(String(err));
      process.exit(1);
    }
  });

// ── OPTIMIZE ───────────────────────────────────────────────────────────────
program
  .command('optimize')
  .description('Optimizează meniul cu AI')
  .requiredOption('--tenant <tenantId>', 'ID-ul tenantului')
  .option('--location <locationId>', 'ID-ul locației (opțional)')
  .action(async (opts) => {
    const spinner = ora('Analizare meniu...').start();
    try {
      const { optimizeMenu } = await import('../menu/menuOptimizer');
      const report = await optimizeMenu(opts.tenant, opts.location);
      spinner.succeed(`Optimizare completă — Score: ${report.overallScore}/100`);

      console.log(chalk.bold('\n📊 Recomandări:'));
      report.recommendations.forEach(r => console.log(`  • ${r}`));

      if (report.menuGaps.length > 0) {
        console.log(chalk.bold('\n⚠ Lipsuri în meniu:'));
        report.menuGaps.forEach(g => console.log(`  • ${g}`));
      }

      if (report.descriptionsFixed > 0) {
        console.log(chalk.green(`\n✔ Descrieri generate automat: ${report.descriptionsFixed}`));
      }
    } catch (err) {
      spinner.fail(String(err));
      process.exit(1);
    }
  });

// ── SYNC ───────────────────────────────────────────────────────────────────
program
  .command('sync')
  .description('Sincronizează un produs cu toate interfețele')
  .requiredOption('--tenant <tenantId>', 'ID-ul tenantului')
  .requiredOption('--product <productId>', 'ID-ul produsului')
  .option('--action <action>', 'Acțiunea: ACTIVATE|UPDATE|DEACTIVATE', 'UPDATE')
  .action(async (opts) => {
    const spinner = ora('Sincronizare produs...').start();
    try {
      const { syncProductToAllInterfaces } = await import('../sync/catalogSync');
      await syncProductToAllInterfaces(opts.tenant, opts.product, opts.action as 'ACTIVATE' | 'UPDATE' | 'DEACTIVATE');
      spinner.succeed(`Produs ${opts.product} sincronizat (${opts.action})`);
    } catch (err) {
      spinner.fail(String(err));
      process.exit(1);
    }
  });

// ── DB WRITE ───────────────────────────────────────────────────────────────
program
  .command('db-write')
  .description('Execută o operație DB prin AI (cu rollback)')
  .requiredOption('--tenant <tenantId>', 'ID-ul tenantului')
  .requiredOption('--instruction <text>', 'Instrucțiunea în limbaj natural')
  .option('--dry-run', 'Previzualizare fără execuție')
  .option('--user <userId>', 'ID-ul utilizatorului', 'cli')
  .action(async (opts) => {
    const spinner = ora('Procesare instrucțiune AI...').start();
    try {
      const { executeAiDbOperation } = await import('../db/aiDbWriter');
      const result = await executeAiDbOperation(opts.tenant, opts.user, opts.instruction, { dryRun: opts.dryRun });
      spinner.succeed('Operație completă');
      console.log(chalk.cyan('\nOperație:'), JSON.stringify(result.operation, null, 2));
      console.log(chalk.cyan('Rânduri afectate:'), result.affectedRows);
      if (!opts.dryRun) console.log(chalk.green('Rollback key:'), result.rollbackKey);
    } catch (err) {
      spinner.fail(String(err));
      process.exit(1);
    }
  });

program.parse(process.argv);
