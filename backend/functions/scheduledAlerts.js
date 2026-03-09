const inventoryService = require('../services/inventoryService');
const alertService = require('../services/alertService');
const notificationService = require('../services/notificationService');
const logger = require('../utils/logger');

/**
 * Called by the CRON every hour.
 * Checks all inventory items and generates alerts + notifications for Low/Critical items.
 */
async function checkStockLevels() {
    logger.info('[CRON:stockLevels] Starting...');
    const lowItems = await inventoryService.getLowStock();

    let created = 0;
    for (const item of lowItems) {
        const isCritical = item.status === 'Critical';

        // Prevent duplicate alerts: check if an active LowStock alert already exists for this item
        const existingAlerts = await alertService.listAlerts({
            type: 'LowStock',
            status: 'Active',
            limit: 5,
        });
        const alreadyAlerted = existingAlerts.alerts.some(a => a.relatedInventoryId === item.inventoryId);

        if (!alreadyAlerted) {
            await alertService.createAlert({
                type: 'LowStock',
                severity: isCritical ? 'Critical' : 'Warning',
                relatedInventoryId: item.inventoryId,
                message: `${item.itemName} is ${item.status.toLowerCase()} (${item.currentQuantity} ${item.unit})`,
                description: `Reorder level: ${item.reorderLevel}. Current: ${item.currentQuantity}.`,
                userId: 'system',
            });

            // Also send in-app notifications to inventory managers and admins
            await notificationService.notifyLowStock(
                { itemName: item.itemName, currentQuantity: item.currentQuantity, unit: item.unit },
                isCritical ? 'critical' : 'low'
            );

            created++;
        }
    }

    logger.info(`[CRON:stockLevels] Created ${created} alerts for ${lowItems.length} low-stock items`);
}

module.exports = { checkStockLevels };
