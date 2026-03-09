const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const { checkPermission, requireRoles } = require('../middleware/rbac');
const validate = require('../middleware/validate');
const schemas = require('../models/schemas');
const svc = require('../services/procurementService');

// Purchase Requests
router.get('/purchase-requests', authenticate, checkPermission('read', 'purchaseRequests'), validate({ query: schemas.paginationQuery }), async (req, res, next) => {
    try { res.json(await svc.listRequests(req.query)); } catch (e) { next(e); }
});

router.post('/purchase-requests', authenticate, checkPermission('create', 'purchaseRequests'), validate({ body: schemas.createPurchaseRequest }), async (req, res, next) => {
    try {
        const pr = await svc.createRequest(req.body, req.user);
        // Auto-submit: move from Draft → Pending-DeptHead immediately
        try { await svc.submitRequest(pr.requestId, req.user); } catch (_) { /* ignore if already submitted */ }
        res.status(201).json({ ...pr, status: 'Pending-DeptHead' });
    } catch (e) { next(e); }
});

router.get('/purchase-requests/:id', authenticate, checkPermission('read', 'purchaseRequests'), async (req, res, next) => {
    try { res.json(await svc.getRequest(req.params.id)); } catch (e) { next(e); }
});

router.put('/purchase-requests/:id', authenticate, checkPermission('create', 'purchaseRequests'), async (req, res, next) => {
    try { await svc.updateRequest(req.params.id, req.body, req.user); res.json({ message: 'Updated' }); } catch (e) { next(e); }
});

router.post('/purchase-requests/:id/submit', authenticate, checkPermission('create', 'purchaseRequests'), async (req, res, next) => {
    try { res.json(await svc.submitRequest(req.params.id, req.user)); } catch (e) { next(e); }
});

router.post('/purchase-requests/:id/approve', authenticate, checkPermission('approve', 'purchaseRequests'), validate({ body: schemas.approvalAction.fork(['action'], f => f.valid('approve')) }), async (req, res, next) => {
    try { res.json(await svc.approveRequest(req.params.id, req.body, req.user)); } catch (e) { next(e); }
});

router.post('/purchase-requests/:id/reject', authenticate, checkPermission('reject', 'purchaseRequests'), validate({ body: schemas.approvalAction.fork(['action'], f => f.valid('reject')) }), async (req, res, next) => {
    try { res.json(await svc.rejectRequest(req.params.id, req.body, req.user)); } catch (e) { next(e); }
});

router.get('/purchase-requests/:id/approval-history', authenticate, checkPermission('read', 'purchaseRequests'), async (req, res, next) => {
    try { res.json(await svc.getApprovalHistory(req.params.id)); } catch (e) { next(e); }
});

// Approval Queue
router.get('/approval-queue', authenticate, requireRoles('admin', 'finance', 'department'), async (req, res, next) => {
    try { res.json(await svc.getApprovalQueue(req.user)); } catch (e) { next(e); }
});

module.exports = router;
