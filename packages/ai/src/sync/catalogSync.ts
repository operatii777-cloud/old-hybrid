import { prisma } from '../shared/prismaClient';
import { redis } from '../shared/redisClient';
import { io } from '../shared/socketClient';
import { meilisearch } from '../shared/searchClient';

type SyncAction = 'ACTIVATE' | 'UPDATE' | 'DEACTIVATE';

async function purgeCDN(productId: string): Promise<void> {
  const token  = process.env.CLOUDFLARE_API_TOKEN;
  const zoneId = process.env.CLOUDFLARE_ZONE_ID;
  if (!token || !zoneId) return;

  await fetch(`https://api.cloudflare.com/client/v4/zones/${zoneId}/purge_cache`, {
    method:  'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body:    JSON.stringify({ files: [`*/products/${productId}*`] }),
  }).catch(console.error);
}

async function syncToAggregator(url: string | undefined, payload: unknown): Promise<void> {
  if (!url) return;
  await fetch(url, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(payload),
  }).catch(console.error);
}

async function syncToGlovo(product: unknown): Promise<void> {
  await syncToAggregator(process.env.GLOVO_MENU_SYNC_URL, product);
}

async function syncToBolt(product: unknown): Promise<void> {
  await syncToAggregator(process.env.BOLT_MENU_SYNC_URL, product);
}

async function syncToWolt(product: unknown): Promise<void> {
  await syncToAggregator(process.env.WOLT_MENU_SYNC_URL, product);
}

async function syncToTazz(product: unknown): Promise<void> {
  await syncToAggregator(process.env.TAZZ_MENU_SYNC_URL, product);
}

export async function syncProductToAllInterfaces(
  tenantId:  string,
  productId: string,
  action:    SyncAction
): Promise<void> {
  const product = await (prisma as any).product.findUnique({
    where:   { id: productId },
    include: { category: true, allergens: true },
  }) as Record<string, unknown> | null;

  if (!product) throw new Error(`Produsul ${productId} nu a fost găsit`);

  // 1. Invalidate Redis cache
  const keys = await redis.keys(`menu:${tenantId}:*`).catch(() => [] as string[]);
  if (keys.length > 0) {
    await redis.del(keys).catch(() => {});
  }

  // 2. WebSocket broadcast
  io.to(`tenant:${tenantId}`).emit('menu:updated', {
    productId,
    action,
    tenantId,
    timestamp: new Date().toISOString(),
  });

  // 3. Parallel external syncs
  const payload = { ...product, action, tenantId };
  await Promise.allSettled([
    purgeCDN(productId),
    syncToGlovo(payload),
    syncToBolt(payload),
    syncToWolt(payload),
    syncToTazz(payload),
    meilisearch.index(`products_${tenantId}`).addDocuments([{ id: productId, ...product }]).catch(console.error),
  ]);

  // 4. Create audit log
  await (prisma as any).auditLog.create({
    data: {
      tenantId,
      userId:   'system',
      action:   'CATALOG_SYNC',
      model:    'Product',
      recordId: productId,
      newValue: JSON.stringify({ action }),
    },
  }).catch(console.error);
}
