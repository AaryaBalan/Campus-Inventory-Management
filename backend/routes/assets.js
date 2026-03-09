const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const { checkPermission, adminOnly } = require('../middleware/rbac');
const validate = require('../middleware/validate');
const schemas = require('../models/schemas');
const svc = require('../services/assetService');
const eventSvc = require('../services/assetEventService');

const can = (action) => checkPermission(action, 'assets');

// GET /api/assets
router.get('/', authenticate, can('read'), validate({ query: schemas.assetQuery }), async (req, res, next) => {
    try { res.json(await svc.listAssets(req.query)); } catch (e) { next(e); }
});

// POST /api/assets
router.post('/', authenticate, can('create'), validate({ body: schemas.createAsset }), async (req, res, next) => {
    try { res.status(201).json(await svc.createAsset(req.body, req.user)); } catch (e) { next(e); }
});

// POST /api/assets/bulk-register
router.post('/bulk-register', authenticate, can('create'), async (req, res, next) => {
    try {
        if (!Array.isArray(req.body)) return res.status(422).json({ error: 'Body must be an array of assets' });
        res.status(201).json(await svc.bulkRegister(req.body, req.user));
    } catch (e) { next(e); }
});

// POST /api/assets/verify  (QR scanner)
router.post('/verify', authenticate, async (req, res, next) => {
    try {
        const { qrValue } = req.body;
        if (!qrValue) return res.status(422).json({ error: 'qrValue is required' });
        // Pass req.user so verifyByQr can log a Verified lifecycle event
        res.json(await svc.verifyByQr(qrValue, req.user));
    } catch (e) { next(e); }
});

// GET /api/assets/by-location/:locationId
router.get('/by-location/:locationId', authenticate, can('read'), async (req, res, next) => {
    try { res.json(await svc.getByLocation(req.params.locationId)); } catch (e) { next(e); }
});

// GET /api/assets/by-category/:category
router.get('/by-category/:category', authenticate, can('read'), async (req, res, next) => {
    try { res.json(await svc.getByCategory(req.params.category)); } catch (e) { next(e); }
});

// GET /api/assets/:assetId
router.get('/:assetId', authenticate, can('read'), async (req, res, next) => {
    try { res.json(await svc.getAsset(req.params.assetId)); } catch (e) { next(e); }
});

// PUT /api/assets/:assetId
router.put('/:assetId', authenticate, can('update'), validate({ body: schemas.updateAsset }), async (req, res, next) => {
    try { res.json(await svc.updateAsset(req.params.assetId, req.body, req.user)); } catch (e) { next(e); }
});

// DELETE /api/assets/:assetId  (retire)
router.delete('/:assetId', authenticate, can('delete'), async (req, res, next) => {
    try {
        const { reason } = req.body || {};
        if (!reason) return res.status(422).json({ error: 'reason is required for retirement' });
        res.json(await svc.retireAsset(req.params.assetId, reason, req.user));
    } catch (e) { next(e); }
});

// POST /api/assets/:assetId/transfer
router.post('/:assetId/transfer', authenticate, checkPermission('transfer', 'assets'), validate({ body: schemas.transferAsset }), async (req, res, next) => {
    try { res.json(await svc.transferAsset(req.params.assetId, req.body, req.user)); } catch (e) { next(e); }
});

// GET /api/assets/:assetId/movements
router.get('/:assetId/movements', authenticate, can('read'), async (req, res, next) => {
    try { res.json(await svc.getMovements(req.params.assetId)); } catch (e) { next(e); }
});

// GET /api/assets/:assetId/qr
router.get('/:assetId/qr', authenticate, can('read'), async (req, res, next) => {
    try { res.json({ qrCode: await svc.getQrCode(req.params.assetId) }); } catch (e) { next(e); }
});

// ── CITRA Lifecycle Events ──────────────────────────────────────────────────

// GET /api/assets/:assetId/events
// Returns the full chronological lifecycle timeline for an asset.
router.get('/:assetId/events', authenticate, can('read'), async (req, res, next) => {
    try {
        const { limit } = req.query;
        const timeline = await eventSvc.getTimeline(
            req.params.assetId,
            { limit: limit ? parseInt(limit) : 100 }
        );
        res.json({ assetId: req.params.assetId, events: timeline, total: timeline.length });
    } catch (e) { next(e); }
});

// GET /api/assets/:assetId/events/summary
// Returns event counts per type — useful for dashboard summary cards.
router.get('/:assetId/events/summary', authenticate, can('read'), async (req, res, next) => {
    try {
        const summary = await eventSvc.getEventSummary(req.params.assetId);
        res.json({ assetId: req.params.assetId, summary });
    } catch (e) { next(e); }
});

module.exports = router;
