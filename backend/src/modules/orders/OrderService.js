
import { getDatabase } from '../../loaders/database.js';
import { logger } from '../../utils/logger.js';
import { StockService } from '../stock/StockService.js';

export const OrderService = {

    /**
     * Create a new order with FULL SNAPSHOTTING (Fiscal Invincibility)
     * Stores current price, name, and VAT rate to prevent history rewrite.
     */
    async createOrder(tableId, waiterId, tenantId = 'default') {
        const db = getDatabase();

        // Generate UUID or similar
        const orderId = `${tableId}-${Date.now()}`; // Simplified to match existing pattern or use UUID

        await db.run(
            `INSERT INTO comenzi (id, masa_id, ospatar_id, data, status, tenant_id)
       VALUES (?, ?, ?, CURRENT_TIMESTAMP, 'deschisa', ?)`,
            [orderId, tableId, waiterId, tenantId]
        );

        return { orderId, status: 'deschisa' };
    },

    /**
     * Add items to order (Snapshotting Logic)
     */
    async addItems(orderId, items, tenantId = 'default') {
        const db = getDatabase();

        // items = [{ cod_prod, cant, options... }]

        for (const item of items) {
            // 1. Fetch CURRENT Product Data (The Source of Truth for Snapshot)
            const product = await db.get('SELECT * FROM produse WHERE cod_prod = ?', [item.cod_prod]);

            if (!product) {
                logger.error(`Product ${item.cod_prod} not found! Skipping.`);
                continue;
            }

            // 2. Snapshot Critical Data
            const snapshot = {
                name: product.den_prod,
                price: product.pret_vanzare, // Raw price
                vat: product.tva || 1.19,     // VAT Rate (e.g. 1.09)
                dept: product.dept
            };

            // 3. Calculate Value
            const valoare = item.cant * snapshot.price;

            // 4. Insert Line with SNAPSHOT
            // We assume 'comenzi_linii' has extra columns for snapshotting, or we store JSON in a specific column?
            // Since schema might be strict, we rely on standard columns + maybe a 'meta' column if available.
            // But standard 'valoare' and 'pret_unitar' ARE snapshots of price.
            // Name is 'den_prod'. 
            // We just ensure we use 'product.den_prod' logic.

            await db.run(
                `INSERT INTO comenzi_linii (id, comanda_id, cod_prod, den_prod, cant, pret_unitar, valoare, tva_snap, tenant_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    `${orderId}-${item.cod_prod}-${Date.now()}`,
                    orderId,
                    item.cod_prod,
                    snapshot.name, // Snapshot Name
                    item.cant,
                    snapshot.price, // Snapshot Price
                    valoare,
                    snapshot.vat,   // Snapshot VAT (New Column)
                    tenantId
                ]
            );
        }

        // 5. Update Order Total
        // Recalculate full total
        const total = await db.get('SELECT SUM(valoare) as t FROM comenzi_linii WHERE comanda_id = ?', [orderId]);
        await db.run('UPDATE comenzi SET total = ? WHERE id = ?', [total.t || 0, orderId]);

        return { success: true };
    },

    /**
     * Finalize Order (Stock Consumption + Fiscal)
     */
    async finalizeOrder(orderId, tenantId = 'default') {
        const db = getDatabase();

        // 1. Get Items
        const items = await db.all('SELECT cod_prod, cant FROM comenzi_linii WHERE comanda_id = ?', [orderId]);

        // 2. Consume Stock (Recursive)
        await StockService.consumeStockForOrder(items); // Fire and forget or await? Await for consistency.

        // 3. Close Order
        await db.run("UPDATE comenzi SET status = 'finalizata' WHERE id = ?", [orderId]);

        return { success: true };
    }
};
