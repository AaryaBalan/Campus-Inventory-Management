const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const { checkPermission } = require('../middleware/rbac');
const validate = require('../middleware/validate');
const schemas = require('../models/schemas');
const svc = require('../services/alertService');

const can = a => checkPermission(a, 'alerts');

router.get('/', authenticate, can('read'), validate({ query: schemas.paginationQuery }), async (req, res, next) => {
    try { res.json(await svc.listAlerts(req.query)); } catch (e) { next(e); }
});

router.get('/active', authenticate, can('read'), async (req, res, next) => {
    try { res.json(await svc.getActiveAlerts()); } catch (e) { next(e); }
});

router.get('/by-severity/:severity', authenticate, can('read'), async (req, res, next) => {
    try { res.json(await svc.getAlertsBySeverity(req.params.severity)); } catch (e) { next(e); }
});

router.get('/:alertId', authenticate, can('read'), async (req, res, next) => {
    try { res.json(await svc.getAlert(req.params.alertId)); } catch (e) { next(e); }
});

router.post('/:alertId/acknowledge', authenticate, can('update'), async (req, res, next) => {
    try { res.json(await svc.acknowledge(req.params.alertId, req.user)); } catch (e) { next(e); }
});

router.post('/:alertId/resolve', authenticate, can('update'), validate({ body: schemas.resolveAlert }), async (req, res, next) => {
    try { res.json(await svc.resolve(req.params.alertId, req.body, req.user)); } catch (e) { next(e); }
});

module.exports = router;
