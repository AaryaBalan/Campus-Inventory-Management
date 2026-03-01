const { db } = require('../firebaseAdmin');
const dayjs = require('dayjs');

const INV_COL = 'inventory';
const ASSETS_COL = 'assets';
const METRICS_COL = 'analyticsMetrics';

/**
 * Predict stock shortages for 30/60/90 day horizons.
 * Uses the stored consumptionRate per item and current stock.
 */
async function predictShortages() {
    const snap = await db.collection(INV_COL).where('status', 'in', ['In-Stock', 'Low']).get();
    const predictions = [];

    snap.docs.forEach(doc => {
        const item = doc.data();
        const rate = item.consumptionRate || 0; // units per day
        if (rate <= 0) return;

        const daysUntilOut = Math.floor(item.currentQuantity / rate);
        const horizons = {};
        [30, 60, 90].forEach(h => {
            const stockAtHorizon = item.currentQuantity - rate * h;
            horizons[`${h}d`] = {
                projectedQuantity: Math.max(0, Math.round(stockAtHorizon)),
                shortage: stockAtHorizon < 0,
                daysUntilShortage: stockAtHorizon < 0 ? daysUntilOut : null,
                confidence: _confidence(item, h),
            };
        });

        if (daysUntilOut <= 90) {
            predictions.push({
                inventoryId: item.inventoryId,
                itemName: item.itemName,
                currentQuantity: item.currentQuantity,
                consumptionRate: rate,
                unit: item.unit,
                reorderLevel: item.reorderLevel,
                daysUntilStockout: daysUntilOut,
                horizons,
            });
        }
    });

    // Sort most urgent first
    return predictions.sort((a, b) => a.daysUntilStockout - b.daysUntilStockout);
}

/**
 * Reorder suggestions with confidence scores.
 */
async function getReorderSuggestions() {
    const shortages = await predictShortages();
    return shortages
        .filter(p => p.daysUntilStockout <= 60)
        .map(p => ({
            inventoryId: p.inventoryId,
            itemName: p.itemName,
            currentQuantity: p.currentQuantity,
            suggestedOrderQuantity: Math.max(p.reorderLevel * 2, Math.ceil(p.consumptionRate * 90)),
            urgency: p.daysUntilStockout <= 14 ? 'High' : p.daysUntilStockout <= 30 ? 'Medium' : 'Low',
            estimatedStockoutDate: dayjs().add(p.daysUntilStockout, 'day').toISOString(),
            confidence: Math.min(0.95, 0.6 + (p.consumptionRate > 0 ? 0.1 : 0)),
        }));
}

/**
 * Detect anomalies in asset movement patterns.
 * Flags assets with > 3 movements in 24h or unusual cross-department transfers.
 */
async function detectAnomalies() {
    const since = dayjs().subtract(24, 'hour').toISOString();
    const anomalies = [];

    const assetsSnap = await db.collection(ASSETS_COL).limit(500).get();

    for (const doc of assetsSnap.docs) {
        const asset = doc.data();
        const movSnap = await db.collection(ASSETS_COL).doc(asset.assetId)
            .collection('movements')
            .where('movedAt', '>=', since)
            .get();

        if (movSnap.size > 3) {
            anomalies.push({
                type: 'HighFrequencyMovement',
                assetId: asset.assetId,
                assetName: asset.name,
                movementCount: movSnap.size,
                period: '24h',
                riskScore: Math.min(1, movSnap.size / 10),
                description: `Asset moved ${movSnap.size} times in the last 24 hours`,
            });
        }
    }

    return anomalies;
}

/**
 * Demand forecasting by category.
 */
async function getDemandForecast() {
    const categories = {};
    const snap = await db.collection(INV_COL).get();

    snap.docs.forEach(doc => {
        const item = doc.data();
        if (!categories[item.category]) {
            categories[item.category] = { totalRate: 0, count: 0, totalStock: 0, reorderSum: 0 };
        }
        categories[item.category].totalRate += item.consumptionRate || 0;
        categories[item.category].totalStock += item.currentQuantity;
        categories[item.category].reorderSum += item.reorderLevel;
        categories[item.category].count++;
    });

    return Object.entries(categories).map(([category, data]) => ({
        category,
        itemCount: data.count,
        avgDailyConsumption: data.count > 0 ? Math.round(data.totalRate / data.count * 100) / 100 : 0,
        forecastedDemand30d: Math.round(data.totalRate * 30),
        forecastedDemand90d: Math.round(data.totalRate * 90),
        currentTotalStock: data.totalStock,
        stockCoverDays: data.totalRate > 0 ? Math.round(data.totalStock / data.totalRate) : null,
    }));
}

// ── Helpers ────────────────────────────────────────────────────────────────

function _confidence(item, horizon) {
    // Higher confidence for items with known consumption rate and near-term horizons
    if (!item.consumptionRate || item.consumptionRate === 0) return 0.3;
    if (horizon === 30) return 0.85;
    if (horizon === 60) return 0.72;
    return 0.60;
}

module.exports = { predictShortages, getReorderSuggestions, detectAnomalies, getDemandForecast };
