const inventoryService = require('../services/inventoryService');
const alertService = require('../services/alertService');
const logger = require('../utils/logger');

/**
 * Called by the CRON every hour.
 * Checks all inventory items and generates alerts for Low/Critical items.
 */
async function checkStockLevels() {
    logger.info('[CRON:stockLevels] Starting...');
    const lowItems = await inventoryService.getLowStock();

    let created = 0;
    for (const item of lowItems) {
        await alertService.createAlert({
            type: 'LowStock',
            severity: item.status === 'Critical' ? 'Critical' : 'Warning',
            relatedInventoryId: item.inventoryId,
            message: `${item.itemName} is ${item.status.toLowerCase()} (${item.currentQuantity} ${item.unit})`,
            description: `Reorder level: ${item.reorderLevel}. Current: ${item.currentQuantity}.`,
            userId: 'system',
        });
        created++;
    }

    logger.info(`[CRON:stockLevels] Created ${created} alerts for ${lowItems.length} low-stock items`);
}

module.exports = { checkStockLevels };
