
import { getDatabase } from '../../loaders/database.js';
import { logger } from '../../utils/logger.js';

export const AuditService = {
    /**
     * Log critical human override actions
     * @param {string} userId - ID of the user performing action
     * @param {string} actionType - E.g. 'STOCK_RESET', 'FISCAL_OVERRIDE'
     * @param {string} reason - Mandatory motivation
     * @param {Object} preState - Data before change
     * @param {Object} postState - Data after change
     * @param {string} tenantId - Tenant Context
     */
    async logOverride(userId, actionType, reason, preState, postState, tenantId = 'default') {
        if (!reason || reason.length < 5) {
            throw new Error('AUDIT FAIL: Reason is mandatory and must be descriptive.');
        }

        try {
            const db = getDatabase();
            await db.run(
                `INSERT INTO system_audit_log (user_id, action_type, reason, pre_state, post_state, timestamp, tenant_id)
         VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, ?)`,
                [userId, actionType, reason, JSON.stringify(preState), JSON.stringify(postState), tenantId]
            );
            logger.warn(`⚠️ HUMAN OVERRIDE LOGGED: ${actionType} by ${userId} | Reason: ${reason}`);
        } catch (e) {
            logger.error('CRITICAL: Failed to write Audit Log!', e);
            // Fail-Safe: If audit fails, operation SHOULD fail in high-security mode, but degraded mode might allow logging to file.
            // For now, we throw to enforce Data Integrity Priority (Level 2).
            throw e;
        }
    },

    async getLogs(limit = 50) {
        const db = getDatabase();
        return db.all('SELECT * FROM system_audit_log ORDER BY timestamp DESC LIMIT ?', [limit]);
    }
};
