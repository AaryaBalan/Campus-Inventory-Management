const { db } = require('../firebaseAdmin');
const { v4: uuidv4 } = require('uuid');
const auditService = require('./auditService');
const alertService = require('./alertService');
const notificationService = require('./notificationService');
const { emit } = require('../websocket/wsServer');
const { createError } = require('../middleware/errorHandler');

const INV_COL = 'inventory';

// ── CRUD ───────────────────────────────────────────────────────────────────

async function createItem(data, user) {
    const inventoryId = `INV-${Date.now()}-${uuidv4().slice(0, 4).toUpperCase()}`;
    const status = _computeStatus(data.currentQuantity, data.reorderLevel);

    const item = {
        inventoryId,
        ...data,
        status,
        consumptionRate: 0, // updated by analytics service
        lastUpdated: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        createdBy: user.uid,
    };

    await db.collection(INV_COL).doc(inventoryId).set(item);

    await auditService.log({
        userId: user.uid,
        action: 'CREATE',
        entityType: 'Inventory',
        entityId: inventoryId,
        details: `Inventory item '${data.itemName}' created`,
    });

    return item;
}

async function getItem(inventoryId) {
    const doc = await db.collection(INV_COL).doc(inventoryId).get();
    if (!doc.exists) throw createError('Inventory item not found', 404);
    return doc.data();
}

async function listItems({ limit = 100, status, category, search } = {}) {
    let query = db.collection(INV_COL);
    if (status) query = query.where('status', '==', status);
    if (category) query = query.where('category', '==', category);
    query = query.orderBy('lastUpdated', 'desc');

    const snapshot = await query.limit(parseInt(limit)).get();
    let items = snapshot.docs.map(d => d.data());

    if (search) {
        const s = search.toLowerCase();
        items = items.filter(i =>
            i.itemName?.toLowerCase().includes(s) ||
            i.itemCode?.toLowerCase().includes(s)
        );
    }

    return { items, total: items.length };
}

async function updateItem(inventoryId, data, user) {
    await db.collection(INV_COL).doc(inventoryId).update({
        ...data,
        lastUpdated: new Date().toISOString(),
    });
    await auditService.log({
        userId: user.uid, action: 'UPDATE', entityType: 'Inventory', entityId: inventoryId,
        details: `Inventory item updated`,
    });
}

// ── Stock adjustments ──────────────────────────────────────────────────────

/**
 * Adjust stock quantity (addition, removal, transfer, adjustment).
 * Automatically recomputes status and fires alerts.
 */
async function adjustStock(inventoryId, { type, quantity, reason, referenceId, notes }, user) {
    const item = await getItem(inventoryId);

    let newQty = item.currentQuantity;
    if (type === 'Addition') newQty += quantity;
    else if (type === 'Removal') newQty -= quantity;
    else if (type === 'Adjustment') newQty = quantity;
    else if (type === 'Transfer') newQty -= quantity;

    if (newQty < 0) throw createError('Insufficient stock quantity', 422);

    const newStatus = _computeStatus(newQty, item.reorderLevel);

    await db.collection(INV_COL).doc(inventoryId).update({
        currentQuantity: newQty,
        status: newStatus,
        lastUpdated: new Date().toISOString(),
        ...(type === 'Addition' ? { lastRestockDate: new Date().toISOString() } : {}),
    });

    // Log movement
    const movId = uuidv4();
    await db.collection(INV_COL).doc(inventoryId).collection('movements').doc(movId).set({
        movementId: movId,
        type,
        quantityBefore: item.currentQuantity,
        quantityAfter: newQty,
        quantity,
        reason,
        referenceId: referenceId || null,
        notes: notes || null,
        movedBy: user.uid,
        movedAt: new Date().toISOString(),
    });

    // Fire alert and notification if stock went Critical / Low
    if (newStatus !== item.status && (newStatus === 'Critical' || newStatus === 'Low')) {
        await alertService.createAlert({
            type: 'LowStock',
            severity: newStatus === 'Critical' ? 'Critical' : 'Warning',
            relatedInventoryId: inventoryId,
            message: `${item.itemName} stock is ${newStatus.toLowerCase()} (${newQty} ${item.unit} remaining)`,
            description: `Reorder level: ${item.reorderLevel} ${item.unit}. Current: ${newQty} ${item.unit}.`,
        });
        // Send in-app notification to inventory managers and admins
        notificationService.notifyLowStock(
            { itemName: item.itemName, currentQuantity: newQty, unit: item.unit },
            newStatus === 'Critical' ? 'critical' : 'low'
        ).catch(() => { });
    }

    emit('dashboard', { event: 'STOCK_UPDATED', data: { inventoryId, newQuantity: newQty, status: newStatus } });

    await auditService.log({
        userId: user.uid,
        action: type.toUpperCase(),
        entityType: 'Inventory',
        entityId: inventoryId,
        details: `Stock adjusted: ${type} ${quantity} units. New qty: ${newQty}. Reason: ${reason}`,
    });

    return { inventoryId, newQuantity: newQty, status: newStatus };
}

// ── Movements history ──────────────────────────────────────────────────────

async function getMovements(inventoryId, { limit = 30 } = {}) {
    const snap = await db.collection(INV_COL).doc(inventoryId)
        .collection('movements').orderBy('movedAt', 'desc').limit(limit).get();
    return snap.docs.map(d => d.data());
}

// ── Low stock & reorder ────────────────────────────────────────────────────

async function getLowStock() {
    const snap = await db.collection(INV_COL)
        .where('status', 'in', ['Low', 'Critical']).get();
    return snap.docs.map(d => d.data());
}

async function triggerReorder(inventoryId, user) {
    const item = await getItem(inventoryId);
    // In a real system, this would create a purchase request automatically
    await auditService.log({
        userId: user.uid,
        action: 'REORDER',
        entityType: 'Inventory',
        entityId: inventoryId,
        details: `Reorder triggered for '${item.itemName}' (qty: ${item.reorderLevel * 2})`,
    });
    return { inventoryId, status: 'reorder_triggered', suggestedQuantity: item.reorderLevel * 2 };
}

// ── Consumption trends ─────────────────────────────────────────────────────

async function getConsumptionTrends(inventoryId, days = 90) {
    const since = new Date(Date.now() - days * 86400000).toISOString();
    const snap = await db.collection(INV_COL).doc(inventoryId)
        .collection('movements')
        .where('type', '==', 'Removal')
        .where('movedAt', '>=', since)
        .orderBy('movedAt', 'asc')
        .get();

    const movements = snap.docs.map(d => d.data());
    const totalConsumed = movements.reduce((sum, m) => sum + m.quantity, 0);
    const avgPerDay = totalConsumed / days;

    // Group by week
    const byWeek = {};
    movements.forEach(m => {
        const week = m.movedAt.slice(0, 7); // YYYY-MM
        byWeek[week] = (byWeek[week] || 0) + m.quantity;
    });

    return {
        inventoryId,
        period: `${days} days`,
        totalConsumed,
        avgPerDay: Math.round(avgPerDay * 100) / 100,
        trend: Object.entries(byWeek).map(([month, qty]) => ({ month, qty })),
    };
}

// ── Helper ─────────────────────────────────────────────────────────────────

function _computeStatus(qty, reorderLevel) {
    if (qty === 0) return 'Critical';
    if (qty <= reorderLevel * 0.5) return 'Critical';
    if (qty <= reorderLevel) return 'Low';
    return 'In-Stock';
}

module.exports = {
    createItem, getItem, listItems, updateItem,
    adjustStock, getMovements,
    getLowStock, triggerReorder,
    getConsumptionTrends,
};
