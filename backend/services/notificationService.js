/**
 * notificationService.js
 *
 * Manages per-user in-app notifications.
 * Stored under: notifications/{userId}/items/{notificationId}
 *
 * Called automatically by:
 *   - procurementService (submit / approve / reject)
 *   - inventoryService  (low stock / critical stock)
 *   - alertService      (critical alert created)
 */

const { db } = require('../firebaseAdmin');
const { v4: uuidv4 } = require('uuid');
const { emit } = require('../websocket/wsServer');
const logger = require('../utils/logger');

const ROOT_COL = 'notifications';

/**
 * Notification types:
 *   procurement_submitted | procurement_approved | procurement_rejected
 *   low_stock | critical_stock
 *   alert_created | alert_resolved
 *   system
 */

/**
 * Create a notification for one or more users.
 *
 * @param {string|string[]} userIds  Single UID or array of UIDs to notify
 * @param {object}          payload
 * @param {string}          payload.title   Short heading
 * @param {string}          payload.body    Detail text
 * @param {string}          payload.type    See types above
 * @param {string}         [payload.link]   Frontend path to navigate to
 * @param {string}         [payload.severity] 'info' | 'warning' | 'critical'
 */
async function createNotification(userIds, { title, body, type, link, severity = 'info' }) {
    const ids = Array.isArray(userIds) ? userIds : [userIds];
    const now = new Date().toISOString();

    const promises = ids.map(async (userId) => {
        if (!userId) return;
        const notificationId = uuidv4();
        const notification = {
            notificationId,
            userId,
            title,
            body,
            type,
            link: link || null,
            severity,
            read: false,
            createdAt: now,
        };

        try {
            await db.collection(ROOT_COL).doc(userId).collection('items').doc(notificationId).set(notification);

            // Push real-time to connected clients
            emit('notifications', {
                event: 'NOTIFICATION',
                userId,
                data: notification,
            });
        } catch (err) {
            logger.error(`[NotificationService] Failed to create notification for ${userId}: ${err.message}`);
        }

        return notification;
    });

    return Promise.all(promises);
}

/**
 * List notifications for a user (latest 50, unread first).
 */
async function listNotifications(userId) {
    const snap = await db.collection(ROOT_COL).doc(userId).collection('items')
        .orderBy('createdAt', 'desc')
        .limit(50)
        .get();

    return snap.docs.map(d => d.data());
}

/**
 * Count unread notifications for a user.
 */
async function unreadCount(userId) {
    const snap = await db.collection(ROOT_COL).doc(userId).collection('items')
        .where('read', '==', false)
        .get();
    return snap.size;
}

/**
 * Mark a single notification as read.
 */
async function markRead(userId, notificationId) {
    await db.collection(ROOT_COL).doc(userId).collection('items').doc(notificationId).update({
        read: true,
        readAt: new Date().toISOString(),
    });
    return { notificationId, read: true };
}

/**
 * Mark all notifications as read for a user.
 */
async function markAllRead(userId) {
    const snap = await db.collection(ROOT_COL).doc(userId).collection('items')
        .where('read', '==', false).get();

    if (snap.empty) return { updated: 0 };

    const batch = db.batch();
    const now = new Date().toISOString();
    snap.docs.forEach(doc => {
        batch.update(doc.ref, { read: true, readAt: now });
    });
    await batch.commit();
    return { updated: snap.size };
}

/**
 * Delete a notification.
 */
async function deleteNotification(userId, notificationId) {
    await db.collection(ROOT_COL).doc(userId).collection('items').doc(notificationId).delete();
    return { deleted: true };
}

/**
 * Clear all notifications for a user.
 */
async function clearAll(userId) {
    const snap = await db.collection(ROOT_COL).doc(userId).collection('items').get();
    if (snap.empty) return { deleted: 0 };

    const batch = db.batch();
    snap.docs.forEach(doc => batch.delete(doc.ref));
    await batch.commit();
    return { deleted: snap.size };
}

// ── Convenience helpers ──────────────────────────────────────────────────────

/**
 * Notify all users with a given role.
 * Fetches UIDs from Firestore users collection.
 */
async function notifyRole(role, payload) {
    try {
        const snap = await db.collection('users').where('role', '==', role).get();
        if (snap.empty) return;
        const userIds = snap.docs.map(d => d.data().uid || d.id);
        await createNotification(userIds, payload);
    } catch (err) {
        logger.error(`[NotificationService] notifyRole(${role}) failed: ${err.message}`);
    }
}

/**
 * Notify all admins and finance users about a procurement event.
 */
async function notifyProcurement(event, pr, extraUserId = null) {
    const { requestId, requesterUserId, requesterName, items = [], status } = pr;
    const itemName = (items[0] || {}).itemName || 'item';

    const messages = {
        submitted: {
            title: 'New Purchase Request',
            body: `${requesterName} submitted a request for ${itemName} (${requestId})`,
            type: 'procurement_submitted',
            link: '/procurement/approvals',
            severity: 'info',
        },
        approved: {
            title: 'Purchase Request Approved ✓',
            body: `Your request for ${itemName} (${requestId}) has been approved`,
            type: 'procurement_approved',
            link: '/procurement/history',
            severity: 'info',
        },
        rejected: {
            title: 'Purchase Request Rejected',
            body: `Your request for ${itemName} (${requestId}) was rejected`,
            type: 'procurement_rejected',
            link: '/procurement/history',
            severity: 'warning',
        },
        pending_finance: {
            title: 'PR Awaiting Finance Approval',
            body: `Purchase request ${requestId} for ${itemName} is awaiting finance review`,
            type: 'procurement_submitted',
            link: '/procurement/approvals',
            severity: 'info',
        },
    };

    const msg = messages[event];
    if (!msg) return;

    // Notify requester on their own events
    if (['approved', 'rejected'].includes(event) && requesterUserId) {
        await createNotification(requesterUserId, msg);
    }

    // Notify dept heads on new submissions
    if (event === 'submitted') {
        await notifyRole('department', msg);
        await notifyRole('admin', msg);
    }

    // Notify finance on pending finance
    if (event === 'pending_finance') {
        await notifyRole('finance', msg);
        await notifyRole('admin', msg);
    }

    // Extra user (e.g. approver)
    if (extraUserId) {
        await createNotification(extraUserId, msg);
    }
}

/**
 * Notify inventory managers and admins about stock events.
 */
async function notifyLowStock(item, level = 'low') {
    const payload = {
        title: level === 'critical' ? '🚨 Critical Stock Level' : '⚠️ Low Stock Alert',
        body: `${item.itemName} is at ${item.currentQuantity} ${item.unit} (${level})`,
        type: level === 'critical' ? 'critical_stock' : 'low_stock',
        link: '/inventory',
        severity: level === 'critical' ? 'critical' : 'warning',
    };

    await notifyRole('inventory', payload);
    await notifyRole('admin', payload);
}

module.exports = {
    createNotification,
    listNotifications,
    unreadCount,
    markRead,
    markAllRead,
    deleteNotification,
    clearAll,
    notifyRole,
    notifyProcurement,
    notifyLowStock,
};
