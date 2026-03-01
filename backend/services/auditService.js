const { db } = require('../firebaseAdmin');
const { v4: uuidv4 } = require('uuid');
const { emit } = require('../websocket/wsServer');
const logger = require('../utils/logger');

const AUDIT_COL = 'auditLogs';

/**
 * Create an immutable audit log entry.
 *
 * @param {object} opts
 * @param {string} opts.userId
 * @param {string} opts.action  CREATE | UPDATE | DELETE | TRANSFER | APPROVE | REJECT | LOGIN | EXPORT | REORDER | BULK_CREATE
 * @param {string} opts.entityType  Asset | Inventory | PurchaseRequest | User | ...
 * @param {string} opts.entityId
 * @param {object} [opts.entityData]  Before/after snapshot (optional)
 * @param {string} [opts.details]
 * @param {string} [opts.ipAddress]
 * @param {string} [opts.status]  Success | Failed
 */
async function log({ userId, action, entityType, entityId, entityData, details, ipAddress, status = 'Success' }) {
    const logId = uuidv4();
    const entry = {
        logId,
        userId: userId || 'system',
        action,
        entityType,
        entityId,
        entityData: entityData || null,
        details: details || null,
        ipAddress: ipAddress || null,
        status,
        timestamp: new Date().toISOString(),
    };

    try {
        // Write to Firestore — no updates or deletes ever on this collection
        await db.collection(AUDIT_COL).doc(logId).set(entry);
    } catch (err) {
        // Never throw from audit logging — log the failure instead
        logger.error('[AuditService] Failed to write audit log', err);
    }

    return logId;
}

/**
 * Get audit logs with advanced filtering and pagination.
 */
async function getLogs({
    page = 1,
    limit = 50,
    userId,
    entityType,
    entityId,
    action,
    dateFrom,
    dateTo,
} = {}) {
    let query = db.collection(AUDIT_COL).orderBy('timestamp', 'desc');

    if (userId) query = query.where('userId', '==', userId);
    if (entityType) query = query.where('entityType', '==', entityType);
    if (entityId) query = query.where('entityId', '==', entityId);
    if (action) query = query.where('action', '==', action);
    if (dateFrom) query = query.where('timestamp', '>=', dateFrom);
    if (dateTo) query = query.where('timestamp', '<=', dateTo);

    const snap = await query.limit(limit).offset((page - 1) * limit).get();
    const logs = snap.docs.map(d => d.data());

    return { logs, page, limit };
}

/**
 * Get audit history for a specific asset.
 */
async function getByAsset(assetId, limit = 50) {
    return getLogs({ entityId: assetId, entityType: 'Asset', limit });
}

/**
 * Get all actions taken by a specific user.
 */
async function getByUser(userId, limit = 50) {
    return getLogs({ userId, limit });
}

/**
 * Get audit data for compliance report generation (date range).
 */
async function getComplianceData(dateFrom, dateTo) {
    const { logs } = await getLogs({ dateFrom, dateTo, limit: 1000 });

    const summary = {
        totalEvents: logs.length,
        byAction: {},
        byEntityType: {},
        failedEvents: logs.filter(l => l.status === 'Failed').length,
    };

    logs.forEach(l => {
        summary.byAction[l.action] = (summary.byAction[l.action] || 0) + 1;
        summary.byEntityType[l.entityType] = (summary.byEntityType[l.entityType] || 0) + 1;
    });

    return { dateFrom, dateTo, summary, logs };
}

module.exports = { log, getLogs, getByAsset, getByUser, getComplianceData };
