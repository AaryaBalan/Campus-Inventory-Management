const { db } = require('../firebaseAdmin');
const alertService = require('../services/alertService');
const logger = require('../utils/logger');
const dayjs = require('dayjs');

/**
 * Called by CRON every 6 hours.
 * Finds approval queue items past their due date and generates escalation alerts.
 */
async function expireApprovals() {
    logger.info('[CRON:approvalExpiry] Checking overdue approvals...');
    const now = dayjs().toISOString();

    const snap = await db.collection('approvalQueues')
        .where('status', '==', 'Pending')
        .where('dueDate', '<', now)
        .get();

    if (snap.empty) {
        logger.info('[CRON:approvalExpiry] No overdue approvals');
        return;
    }

    const batch = db.batch();
    let count = 0;

    for (const doc of snap.docs) {
        const item = doc.data();
        batch.update(doc.ref, { escalated: true, escalatedAt: now });

        await alertService.createAlert({
            type: 'PendingApproval',
            severity: 'Warning',
            message: `Approval overdue: ${item.requestId}`,
            description: `Queue item ${item.queueId} for ${item.requestType} passed its ${item.dueDate} SLA.`,
            userId: 'system',
        });
        count++;
    }

    await batch.commit();
    logger.info(`[CRON:approvalExpiry] Escalated ${count} overdue approvals`);
}

module.exports = { expireApprovals };
