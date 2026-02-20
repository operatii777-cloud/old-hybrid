import { PrismaClient } from '@prisma/client';

export async function findOrCreateCategory(
  tx: Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>,
  tenantId: string,
  name: string
): Promise<string> {
  const existing = await (tx as any).category.findFirst({
    where: { tenantId, name, deletedAt: null },
    select: { id: true }
  });
  if (existing) return existing.id;

  const created = await (tx as any).category.create({
    data: { tenantId, name, sortOrder: 0 },
    select: { id: true }
  });
  return created.id;
}

export async function captureSnapshot(
  model: string,
  where: Record<string, unknown>,
  tenantId: string
): Promise<Array<{ model: string; id: string; prev: unknown }>> {
  const { prisma } = await import('../shared/prismaClient');
  const records = await (prisma as any)[model.toLowerCase()].findMany({
    where: { ...where, tenantId }
  });
  return records.map((r: any) => ({ model, id: r.id, prev: r }));
}

export async function previewDbOp(
  op: DbOperation,
  tenantId: string
): Promise<unknown[]> {
  const { prisma } = await import('../shared/prismaClient');
  try {
    return await (prisma as any)[op.model.toLowerCase()].findMany({
      where: { ...(op.where ?? {}), tenantId },
      take: 20,
    });
  } catch {
    return [];
  }
}

export async function executeDbOp(op: DbOperation, tenantId: string): Promise<void> {
  const { prisma } = await import('../shared/prismaClient');
  const model = (prisma as any)[op.model.toLowerCase()];
  const tenantWhere = { ...op.where, tenantId };

  switch (op.type) {
    case 'CREATE':
      await model.create({ data: { ...op.data, tenantId } });
      break;
    case 'UPDATE':
      await model.updateMany({ where: tenantWhere, data: op.data });
      break;
    case 'UPSERT':
      await model.upsert({
        where: { ...op.where, tenantId },
        create: { ...op.create, tenantId },
        update: op.update,
      });
      break;
    case 'DELETE_SOFT':
      await model.updateMany({ where: tenantWhere, data: { deletedAt: new Date() } });
      break;
    case 'BULK_UPDATE':
      await model.updateMany({
        where: tenantWhere,
        data: op.data,
      });
      break;
  }
}

export async function getCorrectVatForProduct(productId: string): Promise<number> {
  const { prisma } = await import('../shared/prismaClient');
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { type: true, category: { select: { name: true } } }
  });
  if (!product) return 9;
  const name = (product as any).category?.name?.toLowerCase() ?? '';
  if (name.includes('alcool') || name.includes('vin') || name.includes('bere')) return 19;
  if ((product as any).type === 'SERVICE') return 19;
  return 9;
}

export function generateNextIngredientCode(lastCode: string | undefined): string {
  if (!lastCode) return 'ING-001';
  const match = lastCode.match(/^ING-(\d+)$/);
  if (!match) return 'ING-001';
  const num = parseInt(match[1], 10) + 1;
  return `ING-${String(num).padStart(3, '0')}`;
}

export function normalizeRo(s: string): string {
  return s.toLowerCase()
    .replace(/[ăâÂ]/g, 'a')
    .replace(/[îÎ]/g, 'i')
    .replace(/[șşŞȘ]/g, 's')
    .replace(/[țţŢȚ]/g, 't')
    .trim();
}

export function psychoRound(cents: number): number {
  const tiers = [0, 50, 99];
  const base = Math.floor(cents / 100);
  const dec  = cents % 100;
  const near = tiers.reduce((p, c) => Math.abs(c - dec) < Math.abs(p - dec) ? c : p);
  return base * 100 + near;
}

export function normalizeQty(qty: number, from: string, to: string): number {
  const map: Record<string, number> = {
    g: 1, kg: 1000, mg: 0.001,
    ml: 1, l: 1000,
    buc: 1, bucata: 1, bucăți: 1,
    lingura: 15, linguri: 15, linguriță: 5, lingurițe: 5,
    cana: 240, căni: 240,
    plic: 1, pachete: 1,
  };
  const fromN = from.toLowerCase().trim();
  const toN   = to.toLowerCase().trim();
  if (fromN === toN) return qty;
  return qty * (map[fromN] ?? 1) / (map[toN] ?? 1);
}

export function cosineSim(a: number[], b: number[]): number {
  const dot  = a.reduce((s, v, i) => s + v * b[i], 0);
  const magA = Math.sqrt(a.reduce((s, v) => s + v * v, 0));
  const magB = Math.sqrt(b.reduce((s, v) => s + v * v, 0));
  return magA && magB ? dot / (magA * magB) : 0;
}

// Re-export from prismaClient for convenience
export { prisma } from '../shared/prismaClient';

// Type for DB operations used in helpers
export interface DbOperation {
  type: 'CREATE' | 'UPDATE' | 'UPSERT' | 'DELETE_SOFT' | 'BULK_UPDATE';
  model: string;
  data?: Record<string, unknown>;
  where?: Record<string, unknown>;
  create?: Record<string, unknown>;
  update?: Record<string, unknown>;
  maxRecords?: number;
}