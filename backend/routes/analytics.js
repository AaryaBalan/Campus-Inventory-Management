const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const { checkPermission } = require('../middleware/rbac');
const analyticsSvc = require('../services/analyticsService');
const predictiveSvc = require('../services/predictiveService');

// ── Analytics ──────────────────────────────────────────────────────────────

router.get('/analytics/dashboard', authenticate, checkPermission('read', 'analyticsMetrics'), async (req, res, next) => {
    try { res.json(await analyticsSvc.getDashboardMetrics(req.user.role)); } catch (e) { next(e); }
});

router.get('/analytics/assets', authenticate, checkPermission('read', 'analyticsMetrics'), async (req, res, next) => {
    try { res.json(await analyticsSvc.getAssetAnalytics()); } catch (e) { next(e); }
});

router.get('/analytics/inventory', authenticate, checkPermission('read', 'analyticsMetrics'), async (req, res, next) => {
    try { res.json(await analyticsSvc.getInventoryAnalytics()); } catch (e) { next(e); }
});

router.get('/analytics/procurement', authenticate, checkPermission('read', 'analyticsMetrics'), async (req, res, next) => {
    try { res.json(await analyticsSvc.getProcurementAnalytics()); } catch (e) { next(e); }
});

// ── Predictions ─────────────────────────────────────────────────────────────

router.get('/predictions/shortages', authenticate, checkPermission('read', 'analyticsMetrics'), async (req, res, next) => {
    try { res.json(await predictiveSvc.predictShortages()); } catch (e) { next(e); }
});

router.get('/predictions/reorder-suggestions', authenticate, checkPermission('read', 'analyticsMetrics'), async (req, res, next) => {
    try { res.json(await predictiveSvc.getReorderSuggestions()); } catch (e) { next(e); }
});

router.get('/predictions/anomalies', authenticate, checkPermission('read', 'analyticsMetrics'), async (req, res, next) => {
    try { res.json(await predictiveSvc.detectAnomalies()); } catch (e) { next(e); }
});

router.get('/predictions/demand-forecast', authenticate, checkPermission('read', 'analyticsMetrics'), async (req, res, next) => {
    try { res.json(await predictiveSvc.getDemandForecast()); } catch (e) { next(e); }
});

// ── Manual triggers (admin only) ──────────────────────────────────────────

// POST /analytics/snapshot — persist a daily analytics snapshot now
router.post('/analytics/snapshot', authenticate, checkPermission('*', '*'), async (req, res, next) => {
    try {
        await analyticsSvc.persistMetricsSnapshot();
        res.json({ message: 'Analytics snapshot persisted', timestamp: new Date().toISOString() });
    } catch (e) { next(e); }
});

// POST /analytics/low-stock-check — manually trigger stock level alert scan
router.post('/analytics/low-stock-check', authenticate, checkPermission('*', '*'), async (req, res, next) => {
    try {
        const { checkStockLevels } = require('../functions/scheduledAlerts');
        await checkStockLevels();
        res.json({ message: 'Stock level check completed', timestamp: new Date().toISOString() });
    } catch (e) { next(e); }
});

module.exports = router;

