const { db } = require('../firebaseAdmin');
const dayjs = require('dayjs');

const ASSETS_COL = 'assets';
const INV_COL = 'inventory';
const PR_COL = 'purchaseRequests';
const ALERTS_COL = 'alerts';
const METRICS_COL = 'analyticsMetrics';

// ── Dashboard metrics (role-aware) ─────────────────────────────────────────

async function getDashboardMetrics(role) {
    // Pull live counts from Firestore
    const [assetsSnap, invSnap, prSnap, alertsSnap] = await Promise.all([
        db.collection(ASSETS_COL).get(),
        db.collection(INV_COL).get(),
        db.collection(PR_COL).get(),
        db.collection(ALERTS_COL).where('status', '==', 'Active').get(),
    ]);

    const assets = assetsSnap.docs.map(d => d.data());
    const inventory = invSnap.docs.map(d => d.data());
    const prs = prSnap.docs.map(d => d.data());
    const activeAlerts = alertsSnap.docs.map(d => d.data());

    const totalAssets = assets.length;
    const activeAssets = assets.filter(a => a.status === 'Active').length;
    const retiredAssets = assets.filter(a => a.status === 'Retired').length;
    const lostAssets = assets.filter(a => a.status === 'Lost').length;
    const assetTraceability = totalAssets > 0 ? (activeAssets / totalAssets * 100).toFixed(1) : 100;

    const lowStockItems = inventory.filter(i => i.status === 'Low').length;
    const criticalStockItems = inventory.filter(i => i.status === 'Critical').length;

    const pendingApprovals = prs.filter(p => ['Pending-DeptHead', 'Pending-Finance'].includes(p.status)).length;
    const approvedPRs = prs.filter(p => p.status === 'Approved').length;
    const procurementEfficiency = prs.length > 0 ? (approvedPRs / prs.length * 100).toFixed(1) : 0;

    const criticalAlerts = activeAlerts.filter(a => a.severity === 'Critical').length;

    // All roles get core metrics; role-specific ones are added below
    const base = {
        assets: { total: totalAssets, active: activeAssets, retired: retiredAssets, lost: lostAssets },
        traceabilityPercentage: parseFloat(assetTraceability),
        inventory: { lowStock: lowStockItems, critical: criticalStockItems, total: inventory.length },
        procurement: { pending: pendingApprovals, efficiency: parseFloat(procurementEfficiency), total: prs.length },
        alerts: { active: activeAlerts.length, critical: criticalAlerts },
        lastUpdated: new Date().toISOString(),
    };

    if (role === 'finance') {
        const totalSpend = prs.filter(p => p.status === 'Approved').reduce((s, p) => s + (p.totalEstimatedCost || 0), 0);
        base.finance = { totalApprovedSpend: totalSpend, pendingBudget: pendingApprovals };
    }

    if (role === 'inventory') {
        const totalItems = inventory.reduce((s, i) => s + i.currentQuantity, 0);
        base.inventoryDetails = { totalItems, lowStock: lowStockItems };
    }

    return base;
}

// ── Asset analytics ────────────────────────────────────────────────────────

async function getAssetAnalytics() {
    const snap = await db.collection(ASSETS_COL).get();
    const assets = snap.docs.map(d => d.data());

    const byCategory = {};
    const byStatus = {};
    const byHealth = {};
    const byDepartment = {};

    assets.forEach(a => {
        byCategory[a.category] = (byCategory[a.category] || 0) + 1;
        byStatus[a.status] = (byStatus[a.status] || 0) + 1;
        byHealth[a.health] = (byHealth[a.health] || 0) + 1;
        byDepartment[a.currentDepartment] = (byDepartment[a.currentDepartment] || 0) + 1;
    });

    const totalValue = assets.reduce((s, a) => s + (a.purchasePrice || 0), 0);

    return {
        total: assets.length,
        totalValue,
        byCategory: _toArray(byCategory),
        byStatus: _toArray(byStatus),
        byHealth: _toArray(byHealth),
        byDepartment: _toArray(byDepartment),
    };
}

// ── Inventory analytics ────────────────────────────────────────────────────

async function getInventoryAnalytics() {
    const snap = await db.collection(INV_COL).get();
    const items = snap.docs.map(d => d.data());

    const byCategory = {};
    const byStatus = {};

    items.forEach(i => {
        byCategory[i.category] = (byCategory[i.category] || 0) + 1;
        byStatus[i.status] = (byStatus[i.status] || 0) + 1;
    });

    const totalValue = items.reduce((s, i) => s + (i.currentQuantity * (i.unitCost || 0)), 0);

    return {
        total: items.length,
        totalStockValue: totalValue,
        byCategory: _toArray(byCategory),
        byStatus: _toArray(byStatus),
        lowStockItems: items.filter(i => i.status === 'Low').map(i => ({ inventoryId: i.inventoryId, itemName: i.itemName, currentQuantity: i.currentQuantity, reorderLevel: i.reorderLevel })),
        criticalItems: items.filter(i => i.status === 'Critical').map(i => ({ inventoryId: i.inventoryId, itemName: i.itemName, currentQuantity: i.currentQuantity })),
    };
}

// ── Procurement analytics ──────────────────────────────────────────────────

async function getProcurementAnalytics() {
    const snap = await db.collection(PR_COL).get();
    const prs = snap.docs.map(d => d.data());

    const byStatus = {};
    const byPriority = {};
    const monthlySpend = {};

    prs.forEach(p => {
        byStatus[p.status] = (byStatus[p.status] || 0) + 1;
        byPriority[p.priority] = (byPriority[p.priority] || 0) + 1;
        const month = (p.createdAt || '').slice(0, 7); // YYYY-MM
        if (p.status === 'Approved' && month) {
            monthlySpend[month] = (monthlySpend[month] || 0) + (p.totalEstimatedCost || 0);
        }
    });

    const approved = prs.filter(p => p.status === 'Approved');
    const avgApprovalTime = _avgApprovalTime(approved);

    return {
        total: prs.length,
        byStatus: _toArray(byStatus),
        byPriority: _toArray(byPriority),
        totalApprovedValue: approved.reduce((s, p) => s + (p.totalEstimatedCost || 0), 0),
        avgApprovalTimeHours: avgApprovalTime,
        monthlySpend: Object.entries(monthlySpend).sort().map(([month, value]) => ({ month, value })),
    };
}

// ── Persist metrics snapshot ───────────────────────────────────────────────

async function persistMetricsSnapshot() {
    const metrics = await getDashboardMetrics('admin');
    const date = dayjs().format('YYYY-MM-DD');
    await db.collection(METRICS_COL).doc(date).set({
        ...metrics,
        date,
        period: 'daily',
        lastUpdated: new Date().toISOString(),
    });
}

// ── Helpers ────────────────────────────────────────────────────────────────

function _toArray(obj) {
    return Object.entries(obj).map(([name, count]) => ({ name, count }));
}

function _avgApprovalTime(prs) {
    const times = prs
        .filter(p => p.submittedAt && p.completedAt)
        .map(p => dayjs(p.completedAt).diff(dayjs(p.submittedAt), 'hour'));
    if (!times.length) return null;
    return Math.round(times.reduce((a, b) => a + b, 0) / times.length);
}

module.exports = { getDashboardMetrics, getAssetAnalytics, getInventoryAnalytics, getProcurementAnalytics, persistMetricsSnapshot };
