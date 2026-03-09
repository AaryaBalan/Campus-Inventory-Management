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
    limit = 100,
    userId,
    entityType,
    entityId,
    action,
    dateFrom,
    dateTo,
} = {}) {
    // Use simple orderBy only — avoid composite indexes by filtering in-memory
    let query = db.collection(AUDIT_COL).orderBy('timestamp', 'desc').limit(parseInt(limit));

    const snap = await query.get();
    let logs = snap.docs.map(d => d.data());

    // In-memory filtering (avoids Firestore composite index requirement)
    if (userId) logs = logs.filter(l => l.userId === userId);
    if (entityType) logs = logs.filter(l => l.entityType === entityType);
    if (entityId) logs = logs.filter(l => l.entityId === entityId);
    if (action) logs = logs.filter(l => l.action === action);
    if (dateFrom) logs = logs.filter(l => l.timestamp >= dateFrom);
    if (dateTo) logs = logs.filter(l => l.timestamp <= dateTo);

    return { logs, total: logs.length, limit };
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
