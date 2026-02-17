
import { getDatabase } from '../../loaders/database.js';
import { logger } from '../../utils/logger.js';
import { AuditService } from '../audit/AuditService.js';

export const StockService = {

    /**
     * Consume stock for a list of products (Order Finalization)
     * Uses DFS to handle recursive recipes (Semi-fabs).
     * @param {Array<{cod_prod: number, cantitate: number}>} items 
     * @param {string} gestiuneId - Default kitchen/bar
     */
    async consumeStockForOrder(items, gestiuneId = 1) {
        const db = getDatabase();

        // Recursive function for DFS consumption
        const consumeItem = async (code, qty, depth = 0) => {
            if (depth > 5) {
                logger.warn(`⚠️ Recipe Recursion Depth Limit Reached for Code: ${code}`);
                return;
            }

            // 1. Check if it has a recipe (is it a Product or Semi-Fab?)
            // We look in 'retete' where cod_ret = code. 
            // Note: 'code' can be from 'produse' or 'materii_prime'.
            const recipe = await db.all('SELECT * FROM retete WHERE cod_ret = ?', [code]);

            if (recipe && recipe.length > 0) {
                // It's a compound item. Recurse.
                for (const ing of recipe) {
                    const neededQty = ing.cant * qty; // ing.cant is usually per 1 unit of parent
                    await consumeItem(ing.cod_mat, neededQty, depth + 1);
                }
            } else {
                // It's a leaf node (Raw Material). Deduct from Stock.
                // We look for stock in 'stocuri' table.
                // Optimistic Locking usually requires checking 'updated_at', but for speed we allow negative stock (Degraded Mode STOCK).

                try {
                    const stoc = await db.get(
                        'SELECT * FROM stocuri WHERE cod_material = ? AND gestiune_id = ?',
                        [code, gestiuneId]
                    );

                    if (stoc) {
                        // Direct Update
                        await db.run(
                            'UPDATE stocuri SET cant_stoc = cant_stoc - ?, data_update = CURRENT_TIMESTAMP WHERE id = ?',
                            [qty, stoc.id]
                        );
                    } else {
                        // Create negative stock entry (Degraded Mode: Allow sale even if stock unknown)
                        await db.run(
                            'INSERT INTO stocuri (gestiune_id, cod_material, cant_stoc, cant_minim, pret_unitar) VALUES (?, ?, ?, 0, 0)',
                            [gestiuneId, code, -qty]
                        );
                    }

                } catch (err) {
                    logger.error(`Stock update failed for mat ${code}`, err);
                    // Degraded Mode: Log error but do NOT block order.
                }
            }
        };

        // Process all items in order
        for (const item of items) {
            await consumeItem(item.cod_prod, item.cantitate);
        }

        logger.info(`✅ Stock consumed for ${items.length} items (DFS Recursive).`);
    },

    /**
     * Manual Stock Adjustment with Mandatory Audit (The "NOVA" Rule)
     */
    async adjustStock(userId, materialId, newQty, reason, gestiuneId = 1) {
        const db = getDatabase();

        // 1. Get Pre-State
        const preState = await db.get('SELECT * FROM stocuri WHERE cod_material = ? AND gestiune_id = ?', [materialId, gestiuneId]) || { cant_stoc: 0 };

        // 2. Perform Update
        if (preState.id) {
            await db.run('UPDATE stocuri SET cant_stoc = ?, data_update = CURRENT_TIMESTAMP WHERE id = ?', [newQty, preState.id]);
        } else {
            await db.run('INSERT INTO stocuri (gestiune_id, cod_material, cant_stoc) VALUES (?, ?, ?)', [gestiuneId, materialId, newQty]);
        }

        // 3. Log Audit (Blocking)
        const postState = { ...preState, cant_stoc: newQty };
        await AuditService.logOverride(userId, 'STOCK_ADJUST', reason, preState, postState);
    }
};
