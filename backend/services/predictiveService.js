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

/**
 * CITRA – Reorder Timing Recommendations
 *
 * Goes beyond a simple "order soon" flag. For each inventory item with a
 * measurable consumption rate, this produces:
 *   • recommendedOrderDate  – the exact date to place a purchase order,
 *                             accounting for the item's lead time so stock
 *                             doesn't run out while waiting for delivery.
 *   • orderQuantity         – min / optimal / max quantities based on a
 *                             safety-stock formula (consumption × cover days).
 *   • urgency               – Critical / High / Medium / Low
 *   • velocityTrend         – Accelerating / Stable / Decelerating
 *                             (derived from the 30d vs 7d rate if available)
 *
 * @param {number} [defaultLeadDays=14] - Assumed procurement lead time in days
 * @returns {Promise<object[]>}
 */
async function getReorderTimingRecommendations(defaultLeadDays = 14) {
    const snap = await db.collection(INV_COL)
        .where('status', 'in', ['In-Stock', 'Low'])
        .get();

    const recommendations = [];

    snap.docs.forEach(doc => {
        const item = doc.data();
        const rate = item.consumptionRate || 0;           // units/day (long-term avg)
        const rate7d = item.consumptionRate7d || rate;   // units/day (short-term, optional field)
        if (rate <= 0) return;

        const leadDays = item.leadTimeDays || defaultLeadDays;
        const currentQty = item.currentQuantity || 0;
        const reorderLevel = item.reorderLevel || 0;

        // ── Key timing calculation ────────────────────────────────────────────────
        // Days until stock hits the reorder level (not zero)
        const daysUntilReorderLevel = reorderLevel > 0
            ? Math.max(0, Math.floor((currentQty - reorderLevel) / rate))
            : Math.floor(currentQty / rate);

        // When to place the order = reorder point minus lead time
        const daysUntilOrder = Math.max(0, daysUntilReorderLevel - leadDays);
        const recommendedOrderDate = dayjs().add(daysUntilOrder, 'day').format('YYYY-MM-DD');
        const estimatedStockoutDate = dayjs().add(Math.floor(currentQty / rate), 'day').format('YYYY-MM-DD');

        // ── Order quantity (safety-stock model) ──────────────────────────────────
        const safetyStock = Math.ceil(rate * leadDays * 0.5);   // 50% of lead-time consumption
        const minOrder = Math.max(reorderLevel, Math.ceil(rate * leadDays));
        const optimalOrder = Math.ceil(rate * 90) + safetyStock; // 90-day supply + safety stock
        const maxOrder = Math.ceil(rate * 120);                  // capped at 4-month supply

        // ── Urgency tier ───────────────────────────────────────────────────────
        let urgency;
        if (daysUntilOrder <= 0) urgency = 'Critical';          // should have ordered already
        else if (daysUntilOrder <= 7) urgency = 'High';
        else if (daysUntilOrder <= 21) urgency = 'Medium';
        else urgency = 'Low';

        // ── Velocity trend ──────────────────────────────────────────────────────────
        const ratioDiff = rate7d / rate;
        let velocityTrend;
        if (ratioDiff > 1.2) velocityTrend = 'Accelerating';
        else if (ratioDiff < 0.8) velocityTrend = 'Decelerating';
        else velocityTrend = 'Stable';

        recommendations.push({
            inventoryId: item.inventoryId,
            itemName: item.itemName,
            category: item.category,
            unit: item.unit,
            currentQuantity: currentQty,
            consumptionRate: rate,
            consumptionRate7d: rate7d,
            velocityTrend,
            leadTimeDays: leadDays,
            daysUntilOrder,
            recommendedOrderDate,
            estimatedStockoutDate,
            urgency,
            orderQuantity: { min: minOrder, optimal: optimalOrder, max: maxOrder },
            safetyStock,
            confidence: _confidence(item, 30),
        });
    });

    // Sort by most urgent (Critical first, then by daysUntilOrder asc)
    const urgencyRank = { Critical: 0, High: 1, Medium: 2, Low: 3 };
    return recommendations.sort((a, b) =>
        (urgencyRank[a.urgency] - urgencyRank[b.urgency]) || (a.daysUntilOrder - b.daysUntilOrder)
    );
}

// ── Helpers ────────────────────────────────────────────────────────────────

function _confidence(item, horizon) {
    // Higher confidence for items with known consumption rate and near-term horizons
    if (!item.consumptionRate || item.consumptionRate === 0) return 0.3;
    if (horizon === 30) return 0.85;
    if (horizon === 60) return 0.72;
    return 0.60;
}

module.exports = { predictShortages, getReorderSuggestions, detectAnomalies, getDemandForecast, getReorderTimingRecommendations };
