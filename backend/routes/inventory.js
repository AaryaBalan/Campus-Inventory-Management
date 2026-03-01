const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const { checkPermission } = require('../middleware/rbac');
const validate = require('../middleware/validate');
const schemas = require('../models/schemas');
const svc = require('../services/inventoryService');

const can = a => checkPermission(a, 'inventory');

router.get('/', authenticate, can('read'), validate({ query: schemas.paginationQuery }), async (req, res, next) => {
    try { res.json(await svc.listItems(req.query)); } catch (e) { next(e); }
});

router.post('/', authenticate, can('create'), validate({ body: schemas.createInventory }), async (req, res, next) => {
    try { res.status(201).json(await svc.createItem(req.body, req.user)); } catch (e) { next(e); }
});

router.get('/low-stock', authenticate, can('read'), async (req, res, next) => {
    try { res.json(await svc.getLowStock()); } catch (e) { next(e); }
});

router.get('/consumption-trends', authenticate, can('read'), async (req, res, next) => {
    try {
        const { inventoryId, days } = req.query;
        if (!inventoryId) return res.status(422).json({ error: 'inventoryId query param required' });
        res.json(await svc.getConsumptionTrends(inventoryId, parseInt(days || '90')));
    } catch (e) { next(e); }
});

router.get('/:id', authenticate, can('read'), async (req, res, next) => {
    try { res.json(await svc.getItem(req.params.id)); } catch (e) { next(e); }
});

router.put('/:id', authenticate, can('update'), async (req, res, next) => {
    try { await svc.updateItem(req.params.id, req.body, req.user); res.json({ message: 'Updated' }); } catch (e) { next(e); }
});

router.post('/:id/adjust', authenticate, checkPermission('adjust', 'inventory'), validate({ body: schemas.adjustInventory }), async (req, res, next) => {
    try { res.json(await svc.adjustStock(req.params.id, req.body, req.user)); } catch (e) { next(e); }
});

router.get('/:id/movements', authenticate, can('read'), async (req, res, next) => {
    try { res.json(await svc.getMovements(req.params.id)); } catch (e) { next(e); }
});

router.post('/reorder', authenticate, can('update'), async (req, res, next) => {
    try {
        const { inventoryId } = req.body;
        res.json(await svc.triggerReorder(inventoryId, req.user));
    } catch (e) { next(e); }
});

module.exports = router;
