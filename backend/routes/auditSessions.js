/**
 * auditSessions.js — CITRA Audit Mode API
 *
 * POST  /api/audit-sessions              — Start a new audit session
 * GET   /api/audit-sessions              — List recent sessions
 * GET   /api/audit-sessions/:id          — Get session details
 * POST  /api/audit-sessions/:id/scan     — Record a scan (verify an asset)
 * POST  /api/audit-sessions/:id/close    — Close session and generate report
 * GET   /api/audit-sessions/:id/report   — Retrieve the closed session report
 */

const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const auditSessionService = require('../services/auditSessionService');

// ── POST /api/audit-sessions ──────────────────────────────────────────────────
router.post('/', authenticate, async (req, res, next) => {
    try {
        const { department, location, notes } = req.body;
        const session = await auditSessionService.startSession({ department, location, notes }, req.user);
        res.status(201).json(session);
    } catch (e) { next(e); }
});

// ── GET /api/audit-sessions ───────────────────────────────────────────────────
router.get('/', authenticate, async (req, res, next) => {
    try {
        const { department, limit } = req.query;
        // Non-admins can only see their own sessions
        const userId = req.user.role === 'admin' ? undefined : req.user.uid;
        const sessions = await auditSessionService.listSessions({ userId, department, limit });
        res.json({ sessions, total: sessions.length });
    } catch (e) { next(e); }
});

// ── GET /api/audit-sessions/:id ───────────────────────────────────────────────
router.get('/:id', authenticate, async (req, res, next) => {
    try {
        const { db } = require('../firebaseAdmin');
        const doc = await db.collection('auditSessions').doc(req.params.id).get();
        if (!doc.exists) return res.status(404).json({ error: 'Audit session not found' });
        const { report, ...summary } = doc.data();
        res.json(summary);
    } catch (e) { next(e); }
});

// ── POST /api/audit-sessions/:id/scan ────────────────────────────────────────
router.post('/:id/scan', authenticate, async (req, res, next) => {
    try {
        const { assetId, condition, notes } = req.body;
        if (!assetId) return res.status(400).json({ error: 'assetId is required' });
        const result = await auditSessionService.scanAsset(req.params.id, assetId, { condition, notes }, req.user);
        res.status(201).json(result);
    } catch (e) { next(e); }
});

// ── POST /api/audit-sessions/:id/close ───────────────────────────────────────
router.post('/:id/close', authenticate, async (req, res, next) => {
    try {
        const report = await auditSessionService.closeSession(req.params.id, req.user);
        res.json(report);
    } catch (e) { next(e); }
});

// ── GET /api/audit-sessions/:id/report ───────────────────────────────────────
router.get('/:id/report', authenticate, async (req, res, next) => {
    try {
        const report = await auditSessionService.getReport(req.params.id);
        res.json(report);
    } catch (e) { next(e); }
});

module.exports = router;
