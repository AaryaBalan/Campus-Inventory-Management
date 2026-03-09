const { db } = require('../firebaseAdmin');
const { v4: uuidv4 } = require('uuid');
const auditService = require('./auditService');
const alertService = require('./alertService');
const notificationService = require('./notificationService');
const { emit } = require('../websocket/wsServer');
const { createError } = require('../middleware/errorHandler');

const PR_COL = 'purchaseRequests';
const AQ_COL = 'approvalQueues';
const ASSETS_COL = 'assets';

// ─────────────────────────────────────────────
// PURCHASE REQUEST LIFECYCLE
// Draft → Submitted → Pending-DeptHead → Pending-Finance → Approved / Rejected
// ─────────────────────────────────────────────

async function createRequest(data, user) {
    const requestId = `PR-${Date.now()}-${uuidv4().slice(0, 4).toUpperCase()}`;
    const totalCost = data.items.reduce((sum, i) => sum + i.quantity * i.estimatedUnitCost, 0);

    const pr = {
        requestId,
        requesterUserId: user.uid,
        requesterName: user.name,
        requesterDepartment: user.department || 'General',
        ...data,
        totalEstimatedCost: totalCost,
        status: 'Draft',
        approvals: [],
        currentStage: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        submittedAt: null,
        completedAt: null,
        rejectionReason: null,
        purchaseOrderId: null,
    };

    await db.collection(PR_COL).doc(requestId).set(pr);

    await auditService.log({
        userId: user.uid,
        action: 'CREATE',
        entityType: 'PurchaseRequest',
        entityId: requestId,
        details: `PR created with ${data.items.length} items, total ₹${totalCost.toFixed(2)}`,
    });

    return pr;
}

async function getRequest(requestId) {
    const doc = await db.collection(PR_COL).doc(requestId).get();
    if (!doc.exists) throw createError('Purchase request not found', 404);
    return doc.data();
}

async function listRequests({ page = 1, limit = 50, status, priority, department, userId, dateFrom, dateTo } = {}) {
    let query = db.collection(PR_COL).orderBy('createdAt', 'desc');

    // Note: combining orderBy with where() on a different field requires a composite Firestore index.
    // Only apply these filters if explicitly passed to avoid index issues.
    if (status) query = query.where('status', '==', status);
    if (priority) query = query.where('priority', '==', priority);

    // Use limit only — avoid offset() which requires reading all skipped docs and needs composite index.
    const snap = await query.limit(parseInt(limit)).get();

    return {
        requests: snap.docs.map(d => d.data()),
        total: snap.size,
        page: 1,
        limit: parseInt(limit),
    };
}

async function updateRequest(requestId, data, user) {
    const pr = await getRequest(requestId);
    if (pr.status !== 'Draft') throw createError('Only draft requests can be edited', 422);

    const totalCost = (data.items || pr.items).reduce((sum, i) => sum + i.quantity * i.estimatedUnitCost, 0);
    await db.collection(PR_COL).doc(requestId).update({
        ...data,
        totalEstimatedCost: totalCost,
        updatedAt: new Date().toISOString(),
    });
}

/**
 * Submit a draft request → enters approval queue.
 * CITRA: Runs a duplicate-asset check before submission and attaches warnings.
 */
async function submitRequest(requestId, user) {
    const pr = await getRequest(requestId);
    if (pr.status !== 'Draft') throw createError('Only draft requests can be submitted', 422);
    if (pr.requesterUserId !== user.uid) throw createError('You can only submit your own requests', 403);

    // ── CITRA: Procurement Intelligence ────────────────────────────────────────
    const duplicateWarnings = await checkForDuplicateAssets(pr.items, pr.requesterDepartment);
    // ───────────────────────────────────────────────────────────────────────

    const nextStage = 'Pending-DeptHead';

    await db.collection(PR_COL).doc(requestId).update({
        status: nextStage,
        currentStage: 'DeptHead',
        submittedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        duplicateWarnings,          // store so approvers can see it
    });

    // Create approval queue item for all Department Head users
    await _createApprovalQueueItem(requestId, 'PurchaseRequest', pr.requesterDepartment, 'department', user);

    await alertService.createAlert({
        type: 'PendingApproval',
        severity: pr.priority === 'Urgent' ? 'Critical' : 'Info',
        message: `New purchase request ${requestId} awaiting dept. head approval`,
        description: `Submitted by ${user.name}. Total: ₹${pr.totalEstimatedCost.toFixed(2)}${duplicateWarnings.length ? ` ⚠️ ${duplicateWarnings.length} possible duplicate asset(s) flagged.` : ''
            }`,
    });

    await auditService.log({
        userId: user.uid,
        action: 'SUBMIT',
        entityType: 'PurchaseRequest',
        entityId: requestId,
        details: `PR submitted for approval (stage: ${nextStage}). Duplicate warnings: ${duplicateWarnings.length}`,
    });

    // Notify department heads and admins
    notificationService.notifyProcurement('submitted', { ...pr, requestId }).catch(() => { });

    emit('procurement', { event: 'PR_SUBMITTED', data: { requestId, status: nextStage, duplicateWarnings } });
    return { requestId, status: nextStage, duplicateWarnings };
}

/**
 * Approve a purchase request. Handles multi-stage workflow.
 */
async function approveRequest(requestId, { comments }, user) {
    const pr = await getRequest(requestId);
    _assertCanApprove(pr, user);

    const approval = {
        approvalId: uuidv4(),
        userId: user.uid,
        userName: user.name,
        role: user.role,
        action: 'Approved',
        comments: comments || null,
        timestamp: new Date().toISOString(),
        stage: pr.currentStage,
    };

    let nextStatus, nextStage;

    if (pr.currentStage === 'DeptHead') {
        nextStatus = 'Pending-Finance';
        nextStage = 'Finance';
        await _createApprovalQueueItem(requestId, 'PurchaseRequest', null, 'finance', user);
    } else if (pr.currentStage === 'Finance') {
        nextStatus = 'Approved';
        nextStage = null;
        // In prod: generate PO here
    } else {
        throw createError('Invalid approval stage', 422);
    }

    await db.collection(PR_COL).doc(requestId).update({
        status: nextStatus,
        currentStage: nextStage,
        approvals: [...pr.approvals, approval],
        completedAt: nextStatus === 'Approved' ? new Date().toISOString() : null,
        updatedAt: new Date().toISOString(),
    });

    await _closeQueueItem(requestId, user);

    await auditService.log({
        userId: user.uid,
        action: 'APPROVE',
        entityType: 'PurchaseRequest',
        entityId: requestId,
        details: `PR approved at stage '${pr.currentStage}'. New status: ${nextStatus}`,
    });

    // Notify requester when fully approved, or finance when moving to finance stage
    if (nextStatus === 'Approved') {
        notificationService.notifyProcurement('approved', { ...pr, requestId }).catch(() => { });
    } else if (nextStatus === 'Pending-Finance') {
        notificationService.notifyProcurement('pending_finance', { ...pr, requestId }).catch(() => { });
    }

    emit('procurement', { event: 'PR_STATUS_CHANGED', data: { requestId, status: nextStatus, approvedBy: user.uid } });
    return { requestId, status: nextStatus };
}

/**
 * Reject a purchase request.
 */
async function rejectRequest(requestId, { reason, comments }, user) {
    const pr = await getRequest(requestId);
    _assertCanApprove(pr, user);

    const approval = {
        approvalId: uuidv4(),
        userId: user.uid,
        userName: user.name,
        role: user.role,
        action: 'Rejected',
        reason,
        comments: comments || null,
        timestamp: new Date().toISOString(),
        stage: pr.currentStage,
    };

    await db.collection(PR_COL).doc(requestId).update({
        status: 'Rejected',
        currentStage: null,
        rejectionReason: reason,
        approvals: [...pr.approvals, approval],
        completedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    });

    await _closeQueueItem(requestId, user);

    await auditService.log({
        userId: user.uid,
        action: 'REJECT',
        entityType: 'PurchaseRequest',
        entityId: requestId,
        details: `PR rejected. Reason: ${reason}`,
    });

    emit('procurement', { event: 'PR_STATUS_CHANGED', data: { requestId, status: 'Rejected', rejectedBy: user.uid } });
    // Notify requester of rejection
    notificationService.notifyProcurement('rejected', { ...pr, requestId }).catch(() => { });
    return { requestId, status: 'Rejected' };
}

async function getApprovalHistory(requestId) {
    const pr = await getRequest(requestId);
    return pr.approvals || [];
}

// ── Approval Queue ─────────────────────────────────────────────────────────

async function getApprovalQueue(user) {
    let query = db.collection(AQ_COL).where('status', '==', 'Pending');
    if (user.role === 'department') {
        query = query.where('targetRole', '==', 'department').where('targetDepartment', '==', user.department);
    } else if (user.role === 'finance') {
        query = query.where('targetRole', '==', 'finance');
    } else if (user.role === 'admin') {
        // admin sees all pending
    }
    const snap = await query.orderBy('createdAt', 'desc').get();
    return snap.docs.map(d => d.data());
}

// ── CITRA Procurement Intelligence ────────────────────────────────────────────────

/**
 * For each item in a purchase request, search the assets collection for
 * existing assets with a matching category (and optionally matching department).
 * Returns a warnings array that gets stored on the PR for approvers to review.
 *
 * @param {object[]} items         - PR line items  [{ name, category, quantity, ... }]
 * @param {string}   department    - Requester's department
 * @returns {Promise<object[]>}    - Array of { itemName, matchCount, matches[] }
 */
async function checkForDuplicateAssets(items, department) {
    const warnings = [];

    for (const item of items) {
        if (!item.category) continue;

        // Search by category in the same department first, then globally
        let snap = await db.collection(ASSETS_COL)
            .where('category', '==', item.category)
            .where('currentDepartment', '==', department)
            .where('status', '==', 'Active')
            .limit(5)
            .get();

        // If none in dept, try institution-wide
        if (snap.empty) {
            snap = await db.collection(ASSETS_COL)
                .where('category', '==', item.category)
                .where('status', '==', 'Active')
                .limit(5)
                .get();
        }

        if (!snap.empty) {
            const matches = snap.docs.map(d => ({
                assetId: d.data().assetId,
                name: d.data().name,
                currentDepartment: d.data().currentDepartment,
                currentLocation: d.data().currentLocation,
                health: d.data().health,
            }));

            warnings.push({
                itemName: item.name || item.category,
                category: item.category,
                matchCount: snap.size,
                matches,
                sameDepartment: matches.some(m => m.currentDepartment === department),
            });
        }
    }

    return warnings;
}

// ── Internal helpers ────────────────────────────────────────────────────────

async function _createApprovalQueueItem(requestId, requestType, department, role, user) {
    const queueId = uuidv4();
    const item = {
        queueId,
        requestId,
        requestType,
        targetRole: role,
        targetDepartment: department || null,
        status: 'Pending',
        priority: 'Medium',
        createdAt: new Date().toISOString(),
        createdBy: user.uid,
        dueDate: new Date(Date.now() + 48 * 3600000).toISOString(), // 48h SLA
        actionTaken: null,
        actionAt: null,
        comments: null,
    };
    await db.collection(AQ_COL).doc(queueId).set(item);
}

async function _closeQueueItem(requestId, user) {
    const snap = await db.collection(AQ_COL).where('requestId', '==', requestId).where('status', '==', 'Pending').get();
    const batch = db.batch();
    snap.docs.forEach(doc => {
        batch.update(doc.ref, { status: 'Closed', actionAt: new Date().toISOString(), closedBy: user.uid });
    });
    await batch.commit();
}

function _assertCanApprove(pr, user) {
    const allowedStatuses = {
        department: ['Pending-DeptHead'],
        finance: ['Pending-Finance'],
        admin: ['Pending-DeptHead', 'Pending-Finance'],
    };
    const allowed = allowedStatuses[user.role] || [];
    if (!allowed.includes(pr.status)) {
        throw createError(`Cannot approve/reject PR in status '${pr.status}' with role '${user.role}'`, 403);
    }
}

module.exports = {
    createRequest, getRequest, listRequests, updateRequest,
    submitRequest, approveRequest, rejectRequest,
    getApprovalHistory, getApprovalQueue,
    checkForDuplicateAssets,
};
