const analyticsService = require('../services/analyticsService');
const logger = require('../utils/logger');

/**
 * Called by CRON every day at midnight.
 * Computes and persists a daily analytics snapshot to Firestore.
 */
async function refreshAnalytics() {
    logger.info('[CRON:analyticsRefresh] Refreshing daily metrics snapshot...');
    await analyticsService.persistMetricsSnapshot();
    logger.info('[CRON:analyticsRefresh] Done.');
}

module.exports = { refreshAnalytics };
