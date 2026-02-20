import { z } from 'zod';
import { openai } from '../shared/openaiClient';
import { prisma } from '../shared/prismaClient';
import { redis } from '../shared/redisClient';
import { previewDbOp, captureSnapshot, executeDbOp } from './helpers';

// All lowercase — compared against op.model.toLowerCase() to guard PascalCase model names
const PROTECTED_TABLES = ['auditlog', 'session', 'tenant', 'user', 'apikey'];

const DbOperationSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('CREATE'),      model: z.string(), data: z.record(z.unknown()) }),
  z.object({ type: z.literal('UPDATE'),      model: z.string(), where: z.record(z.unknown()), data: z.record(z.unknown()) }),
  z.object({ type: z.literal('UPSERT'),      model: z.string(), where: z.record(z.unknown()), create: z.record(z.unknown()), update: z.record(z.unknown()) }),
  z.object({ type: z.literal('DELETE_SOFT'), model: z.string(), where: z.record(z.unknown()) }),
  z.object({ type: z.literal('BULK_UPDATE'), model: z.string(), where: z.record(z.unknown()), data: z.record(z.unknown()), maxRecords: z.number().optional() }),
]);

type DbOperation = z.infer<typeof DbOperationSchema>;

export interface DbWriteResult {
  operation:    DbOperation;
  affectedRows: number;
  preview:      unknown[];
  rollbackKey:  string;
  dryRun:       boolean;
}

export async function executeAiDbOperation(
  tenantId:    string,
  userId:      string,
  instruction: string,
  opts?:       { dryRun?: boolean }
): Promise<DbWriteResult> {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    temperature: 0,
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content: `Ești un expert DB. Traduce instrucțiunea în operație DB JSON:
{ "type": "CREATE"|"UPDATE"|"UPSERT"|"DELETE_SOFT"|"BULK_UPDATE",
  "model": "ModelName", "data": {}, "where": {}, "create": {}, "update": {}, "maxRecords": number }
Nu include tenantId în output - va fi injectat automat.`,
      },
      { role: 'user', content: instruction },
    ],
  });

  const raw = JSON.parse(response.choices[0]?.message?.content ?? '{}');
  const op  = DbOperationSchema.parse(raw);

  if (PROTECTED_TABLES.includes(op.model.toLowerCase())) {
    throw new Error(`Modelul ${op.model} este protejat și nu poate fi modificat prin AI`);
  }

  const preview = await previewDbOp(op, tenantId);
  const rollbackKey = `rollback:${tenantId}:${Date.now()}`;

  if (!opts?.dryRun) {
    const snapshot = await captureSnapshot(op.model, (op as any).where ?? {}, tenantId);
    await redis.setEx(rollbackKey, 3600, JSON.stringify(snapshot)).catch(() => {});

    await (prisma as any).$transaction(async () => {
      await executeDbOp(op, tenantId);
      await (prisma as any).auditLog.create({
        data: {
          tenantId, userId,
          action:   'AI_DB_WRITE',
          model:    op.model,
          recordId: 'bulk',
          newValue: JSON.stringify(op),
        },
      });
    });
  }

  return {
    operation:    op,
    affectedRows: preview.length,
    preview,
    rollbackKey,
    dryRun:       opts?.dryRun ?? false,
  };
}

export async function rollbackDbOperation(
  tenantId:    string,
  userId:      string,
  rollbackKey: string
): Promise<{ restored: number }> {
  const snapshotJson = await redis.get(rollbackKey);
  if (!snapshotJson) throw new Error('Snapshot expirat sau inexistent');

  const snapshot = JSON.parse(snapshotJson) as Array<{ model: string; id: string; prev: Record<string, unknown> }>;
  let restored = 0;

  await (prisma as any).$transaction(async (tx: any) => {
    for (const item of snapshot) {
      const model = tx[item.model.toLowerCase()];
      if (!model) continue;
      await model.update({ where: { id: item.id }, data: item.prev });
      restored++;
    }
    await tx.auditLog.create({
      data: {
        tenantId, userId,
        action:   'AI_ROLLBACK',
        model:    'Multiple',
        recordId: rollbackKey,
        newValue: JSON.stringify({ restored }),
      },
    });
  });

  await redis.del(rollbackKey).catch(() => {});
  return { restored };
}
