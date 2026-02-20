import { execFileSync } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import { openai, AI_MODEL } from '../shared/openaiClient';

const SCHEMA_PATH = path.resolve(__dirname, '../../prisma/schema.prisma');

export interface SchemaChangeResult {
  definition:    string;
  migrationName: string;
  rollbackSql:   string;
  applied:       boolean;
  dryRun:        boolean;
}

export async function addToSchema(
  description: string,
  opts?: { targetModel?: string; dryRun?: boolean; autoMigrate?: boolean }
): Promise<SchemaChangeResult> {
  const currentSchema = await fs.readFile(SCHEMA_PATH, 'utf-8').catch(() => '');

  const response = await openai.chat.completions.create({
    model: AI_MODEL,
    temperature: 0,
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content: `Ești expert Prisma ORM. Generează un JSON cu:
{ "definition": "model/field Prisma definition string",
  "migrationName": "snake_case_name",
  "rollbackSql": "DROP TABLE / ALTER TABLE ... DROP COLUMN ..." }`,
      },
      {
        role: 'user',
        content: `Schema existentă (ultimele 500 chars): ${currentSchema.slice(-500)}\n\nDescrierea modificării: ${description}${opts?.targetModel ? `\nModel target: ${opts.targetModel}` : ''}`,
      },
    ],
  });

  const parsed = JSON.parse(response.choices[0]?.message?.content ?? '{}');
  const { definition, migrationName, rollbackSql } = parsed;

  if (opts?.dryRun) {
    return { definition, migrationName, rollbackSql, applied: false, dryRun: true };
  }

  if (opts?.autoMigrate) {
    const backupPath = `${SCHEMA_PATH}.backup`;
    await fs.copyFile(SCHEMA_PATH, backupPath);
    try {
      await fs.appendFile(SCHEMA_PATH, `\n\n${definition}\n`);
      const safeName = migrationName.replace(/[^a-z0-9_]/gi, '_');
      execFileSync('npx', ['prisma', 'migrate', 'dev', '--name', safeName], { stdio: 'pipe' });
      execFileSync('npx', ['prisma', 'generate'], { stdio: 'pipe' });
      await fs.unlink(backupPath).catch(() => {});
      return { definition, migrationName, rollbackSql, applied: true, dryRun: false };
    } catch (err) {
      await fs.copyFile(backupPath, SCHEMA_PATH).catch(() => {});
      await fs.unlink(backupPath).catch(() => {});
      throw err;
    }
  }

  return { definition, migrationName, rollbackSql, applied: false, dryRun: false };
}

export async function autoFixMissingField(
  error:    string,
  tenantId: string
): Promise<boolean> {
  const fieldMatch = error.match(/Unknown field `(\w+)`|Column "(\w+)" does not exist/);
  if (!fieldMatch) return false;

  const field = fieldMatch[1] ?? fieldMatch[2];
  try {
    await addToSchema(
      `Adaugă câmpul lipsă: ${field} (detectat din eroarea: ${error.slice(0, 200)})`,
      { autoMigrate: true }
    );
    return true;
  } catch {
    return false;
  }
}