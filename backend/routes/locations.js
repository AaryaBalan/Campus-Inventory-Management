const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const { checkPermission, adminOnly } = require('../middleware/rbac');
const validate = require('../middleware/validate');
const schemas = require('../models/schemas');
const svc = require('../services/locationService');

router.get('/', authenticate, checkPermission('read', 'locations'), async (req, res, next) => {
    try { res.json(await svc.listLocations()); } catch (e) { next(e); }
});

router.post('/', authenticate, adminOnly, validate({ body: schemas.createLocation }), async (req, res, next) => {
    try { res.status(201).json(await svc.createLocation(req.body, req.user)); } catch (e) { next(e); }
});

router.get('/map-data', authenticate, checkPermission('read', 'locations'), async (req, res, next) => {
    try { res.json(await svc.getMapData()); } catch (e) { next(e); }
});

router.get('/:locationId', authenticate, checkPermission('read', 'locations'), async (req, res, next) => {
    try { res.json(await svc.getLocation(req.params.locationId)); } catch (e) { next(e); }
});

router.put('/:locationId', authenticate, adminOnly, async (req, res, next) => {
    try { await svc.updateLocation(req.params.locationId, req.body, req.user); res.json({ message: 'Updated' }); } catch (e) { next(e); }
});

router.get('/:locationId/assets', authenticate, checkPermission('read', 'locations'), async (req, res, next) => {
    try { res.json(await svc.getAssetsAtLocation(req.params.locationId)); } catch (e) { next(e); }
});

module.exports = router;
