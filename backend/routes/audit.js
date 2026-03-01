const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const { checkPermission } = require('../middleware/rbac');
const validate = require('../middleware/validate');
const schemas = require('../models/schemas');
const auditSvc = require('../services/auditService');
const { generatePDF, generateExcel, generateCSV } = require('../utils/export');

// ── Audit Logs ─────────────────────────────────────────────────────────────

router.get('/audit-logs', authenticate, checkPermission('read', 'auditLogs'), validate({ query: schemas.paginationQuery }), async (req, res, next) => {
    try { res.json(await auditSvc.getLogs(req.query)); } catch (e) { next(e); }
});

router.get('/audit-logs/by-asset/:assetId', authenticate, checkPermission('read', 'auditLogs'), async (req, res, next) => {
    try { res.json(await auditSvc.getByAsset(req.params.assetId)); } catch (e) { next(e); }
});

router.get('/audit-logs/by-user/:userId', authenticate, checkPermission('read', 'auditLogs'), async (req, res, next) => {
    try { res.json(await auditSvc.getByUser(req.params.userId)); } catch (e) { next(e); }
});

// ── Reports ────────────────────────────────────────────────────────────────

router.post('/reports/audit', authenticate, checkPermission('create', 'reports'), validate({ body: schemas.generateReport }), async (req, res, next) => {
    try {
        const { dateFrom, dateTo } = req.body;
        const data = await auditSvc.getComplianceData(dateFrom, dateTo);
        res.json({ report: data, generatedAt: new Date().toISOString() });
    } catch (e) { next(e); }
});

router.post('/reports/compliance', authenticate, checkPermission('create', 'reports'), validate({ body: schemas.generateReport }), async (req, res, next) => {
    try {
        const { dateFrom, dateTo } = req.body;
        const data = await auditSvc.getComplianceData(dateFrom, dateTo);
        res.json({
            report: data,
            complianceScore: Math.max(0, 100 - data.summary.failedEvents),
            generatedAt: new Date().toISOString(),
        });
    } catch (e) { next(e); }
});

router.post('/reports/export', authenticate, checkPermission('export', 'reports'), validate({ body: schemas.generateReport }), async (req, res, next) => {
    try {
        const { format, dateFrom, dateTo, templateId } = req.body;
        const data = await auditSvc.getComplianceData(dateFrom, dateTo);

        if (format === 'PDF') {
            const pdf = await generatePDF({
                title: `Compliance Report — ${templateId}`,
                dateFrom, dateTo,
                sections: [
                    {
                        heading: 'Summary', rows: [
                            { label: 'Total Events', value: data.summary.totalEvents },
                            { label: 'Failed Events', value: data.summary.failedEvents },
                        ]
                    },
                    { heading: 'By Action', rows: Object.entries(data.summary.byAction).map(([k, v]) => ({ label: k, value: v })) },
                ],
            });
            res.set({ 'Content-Type': 'application/pdf', 'Content-Disposition': `attachment; filename="report-${dateFrom}-${dateTo}.pdf"` });
            return res.send(pdf);
        }

        if (format === 'XLSX') {
            const buf = generateExcel([{ name: 'Audit Logs', data: data.logs }]);
            res.set({ 'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'Content-Disposition': 'attachment; filename="report.xlsx"' });
            return res.send(buf);
        }

        // CSV default
        const csv = generateCSV(data.logs);
        res.set({ 'Content-Type': 'text/csv', 'Content-Disposition': 'attachment; filename="report.csv"' });
        return res.send(csv);

    } catch (e) { next(e); }
});

// ── Scheduled reports (stub — can be extended with a scheduledReports Firestore collection) ──

const scheduledReports = [];

router.get('/reports/scheduled', authenticate, checkPermission('create', 'reports'), (req, res) => {
    res.json(scheduledReports);
});

router.post('/reports/schedule', authenticate, checkPermission('create', 'reports'), validate({ body: schemas.scheduleReport }), (req, res) => {
    const job = { id: require('uuid').v4(), ...req.body, createdBy: req.user.uid, createdAt: new Date().toISOString() };
    scheduledReports.push(job);
    res.status(201).json({ message: 'Report scheduled', job });
});

module.exports = router;
