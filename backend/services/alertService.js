const { db } = require('../firebaseAdmin');
const { v4: uuidv4 } = require('uuid');
const { emit } = require('../websocket/wsServer');
const { createError } = require('../middleware/errorHandler');

const ALERTS_COL = 'alerts';

/**
 * Create and persist a new alert.
 */
async function createAlert({ type, severity, relatedAssetId, relatedInventoryId, message, description, userId = 'system' }) {
    const alertId = uuidv4();
    const alert = {
        alertId,
        type,
        severity,
        relatedAssetId: relatedAssetId || null,
        relatedInventoryId: relatedInventoryId || null,
        message,
        description: description || null,
        status: 'Active',
        createdAt: new Date().toISOString(),
        acknowledgedAt: null,
        acknowledgedBy: null,
        resolvedAt: null,
        resolvedBy: null,
        resolution: null,
    };

    await db.collection(ALERTS_COL).doc(alertId).set(alert);

    // Push to all connected dashboard clients in real time
    emit('alerts', { event: 'ALERT_CREATED', data: alert });

    return alert;
}

/**
 * Get a single alert.
 */
async function getAlert(alertId) {
    const doc = await db.collection(ALERTS_COL).doc(alertId).get();
    if (!doc.exists) throw createError('Alert not found', 404);
    return doc.data();
}

/**
 * List alerts with filters.
 */
async function listAlerts({ limit = 50, status, severity, type } = {}) {
    let query = db.collection(ALERTS_COL).orderBy('createdAt', 'desc');
    if (status) query = query.where('status', '==', status);
    if (severity) query = query.where('severity', '==', severity);
    if (type) query = query.where('type', '==', type);

    const snap = await query.limit(parseInt(limit)).get();
    return {
        alerts: snap.docs.map(d => d.data()),
        total: snap.size,
    };
}

async function getActiveAlerts() {
    const snap = await db.collection(ALERTS_COL).where('status', '==', 'Active').orderBy('createdAt', 'desc').get();
    return snap.docs.map(d => d.data());
}

async function getAlertsBySeverity(severity) {
    const snap = await db.collection(ALERTS_COL)
        .where('severity', '==', severity)
        .orderBy('createdAt', 'desc').get();
    return snap.docs.map(d => d.data());
}

/**
 * Acknowledge an alert.
 */
async function acknowledge(alertId, user) {
    const alert = await getAlert(alertId);
    if (alert.status !== 'Active') throw createError('Alert is not active', 422);

    await db.collection(ALERTS_COL).doc(alertId).update({
        status: 'Acknowledged',
        acknowledgedAt: new Date().toISOString(),
        acknowledgedBy: user.uid,
    });

    emit('alerts', { event: 'ALERT_ACKNOWLEDGED', data: { alertId, acknowledgedBy: user.uid } });
    return { alertId, status: 'Acknowledged' };
}

/**
 * Resolve an alert with a resolution note.
 */
async function resolve(alertId, { resolution, notes }, user) {
    const alert = await getAlert(alertId);
    if (alert.status === 'Resolved') throw createError('Alert is already resolved', 422);

    await db.collection(ALERTS_COL).doc(alertId).update({
        status: 'Resolved',
        resolvedAt: new Date().toISOString(),
        resolvedBy: user.uid,
        resolution,
        resolutionNotes: notes || null,
    });

    emit('alerts', { event: 'ALERT_RESOLVED', data: { alertId, resolvedBy: user.uid } });
    return { alertId, status: 'Resolved' };
}

module.exports = { createAlert, getAlert, listAlerts, getActiveAlerts, getAlertsBySeverity, acknowledge, resolve };
