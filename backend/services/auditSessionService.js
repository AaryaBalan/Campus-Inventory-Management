/**
 * auditSessionService.js
 *
 * CITRA Automated Audit Mode — session-based physical asset verification.
 *
 * Lifecycle:
 *   startSession()  → creates a new audit session document (status: Active)
 *   scanAsset()     → marks an asset as verified within the session
 *   closeSession()  → closes the session, generates a summary report
 *   getReport()     → retrieves the full report for a closed session
 *   listSessions()  → lists recent sessions for a user / department
 *
 * Firestore layout:
 *   auditSessions/{sessionId}
 *     scans/{assetId}       ← one doc per scanned asset
 */

const { db } = require('../firebaseAdmin');
const { v4: uuidv4 } = require('uuid');
const { createError } = require('../middleware/errorHandler');
const assetEventService = require('./assetEventService');
const auditService = require('./auditService');

const SESSIONS_COL = 'auditSessions';
const ASSETS_COL = 'assets';

// ── Start a new audit session ─────────────────────────────────────────────────

/**
 * Create a new audit session.
 *
 * @param {object} opts
 * @param {string} opts.department  - Which department is being audited
 * @param {string} opts.location    - (optional) Restrict to a specific location
 * @param {string} opts.notes       - Auditor's notes
 * @param {object} user             - Authenticated user making the request
 */
async function startSession({ department, location, notes }, user) {
    const sessionId = `AUD-${Date.now()}-${uuidv4().slice(0, 4).toUpperCase()}`;
    const now = new Date().toISOString();

    // Fetch the expected asset list for this scope
    let query = db.collection(ASSETS_COL).where('status', '==', 'Active');
    if (department) query = query.where('currentDepartment', '==', department);
    if (location) query = query.where('currentLocation', '==', location);
    const expectedSnap = await query.get();
    const expectedAssetIds = expectedSnap.docs.map(d => d.data().assetId || d.id);

    const session = {
        sessionId,
        auditorUserId: user.uid,
        auditorName: user.name || user.email || user.uid,
        department: department || null,
        location: location || null,
        notes: notes || null,
        status: 'Active',
        expectedCount: expectedAssetIds.length,
        scannedCount: 0,
        verifiedCount: 0,
        missingCount: 0,
        report: null,
        startedAt: now,
        closedAt: null,
        createdAt: now,
        updatedAt: now,
    };

    await db.collection(SESSIONS_COL).doc(sessionId).set(session);

    await auditService.log({
        userId: user.uid,
        action: 'CREATE',
        entityType: 'AuditSession',
        entityId: sessionId,
        details: `Audit session started for dept=${department || 'all'}, expected ${expectedAssetIds.length} assets.`,
    });

    return { ...session, expectedAssetIds };
}

// ── Scan an asset within a session ───────────────────────────────────────────

/**
 * Mark an individual asset as physically verified.
 *
 * @param {string} sessionId
 * @param {string} assetId
 * @param {object} opts  - { condition, notes }
 * @param {object} user
 */
async function scanAsset(sessionId, assetId, { condition = 'Good', notes } = {}, user) {
    const sessionDoc = await db.collection(SESSIONS_COL).doc(sessionId).get();
    if (!sessionDoc.exists) throw createError('Audit session not found', 404);
    const session = sessionDoc.data();
    if (session.status !== 'Active') throw createError('This audit session is already closed', 422);

    // Look up the asset
    const assetQuery = await db.collection(ASSETS_COL)
        .where('assetId', '==', assetId)
        .limit(1)
        .get();

    const found = !assetQuery.empty;
    const asset = found ? assetQuery.docs[0].data() : null;

    const scanEntry = {
        assetId,
        assetName: asset?.name || null,
        category: asset?.category || null,
        currentLocation: asset?.currentLocation || null,
        currentDepartment: asset?.currentDepartment || null,
        condition,
        notes: notes || null,
        scannedBy: user.uid,
        scannedAt: new Date().toISOString(),
        found,
    };

    // Write scan sub-document (idempotent — overwrites if same asset scanned twice)
    await db.collection(SESSIONS_COL).doc(sessionId)
        .collection('scans').doc(assetId).set(scanEntry);

    // Increment scannedCount on the session
    await db.collection(SESSIONS_COL).doc(sessionId).update({
        scannedCount: (session.scannedCount || 0) + 1,
        updatedAt: new Date().toISOString(),
    });

    // Log a CITRA Verified event on the asset's lifecycle timeline
    if (found) {
        try {
            await assetEventService.logEvent(assetId, 'Verified', {
                performedBy: user.uid,
                details: `Physical verification during audit session ${sessionId}. Condition: ${condition}.`,
                metadata: { sessionId, condition },
            });
        } catch (_) { /* don't fail if event logging fails */ }
    }

    return { ...scanEntry, sessionId };
}

// ── Close a session and generate the report ───────────────────────────────────

/**
 * Close the audit session, compute the summary report.
 */
async function closeSession(sessionId, user) {
    const sessionDoc = await db.collection(SESSIONS_COL).doc(sessionId).get();
    if (!sessionDoc.exists) throw createError('Audit session not found', 404);
    const session = sessionDoc.data();
    if (session.status !== 'Active') throw createError('Session already closed', 422);

    // Fetch all scans
    const scansSnap = await db.collection(SESSIONS_COL).doc(sessionId)
        .collection('scans').get();
    const scans = scansSnap.docs.map(d => d.data());

    // Fetch expected assets again (for missing list)
    let query = db.collection(ASSETS_COL).where('status', '==', 'Active');
    if (session.department) query = query.where('currentDepartment', '==', session.department);
    if (session.location) query = query.where('currentLocation', '==', session.location);
    const expectedSnap = await query.get();
    const expectedAssets = expectedSnap.docs.map(d => d.data());
    const scannedIds = new Set(scans.map(s => s.assetId));

    const missing = expectedAssets
        .filter(a => !scannedIds.has(a.assetId))
        .map(a => ({ assetId: a.assetId, name: a.name, location: a.currentLocation, department: a.currentDepartment }));

    const conditionBreakdown = {};
    scans.forEach(s => {
        conditionBreakdown[s.condition] = (conditionBreakdown[s.condition] || 0) + 1;
    });

    const verifiedCount = scans.filter(s => s.found).length;
    const coveragePercent = session.expectedCount > 0
        ? Math.round((verifiedCount / session.expectedCount) * 100)
        : 0;

    const report = {
        sessionId,
        auditorUserId: session.auditorUserId,
        auditorName: session.auditorName,
        department: session.department,
        location: session.location,
        startedAt: session.startedAt,
        closedAt: new Date().toISOString(),
        expectedCount: session.expectedCount,
        scannedCount: scans.length,
        verifiedCount,
        missingCount: missing.length,
        coveragePercent,
        conditionBreakdown,
        missingAssets: missing,
        scans,
        status: 'Complete',
        // Compliance grade
        grade: coveragePercent >= 95 ? 'A' : coveragePercent >= 80 ? 'B' : coveragePercent >= 60 ? 'C' : 'D',
    };

    await db.collection(SESSIONS_COL).doc(sessionId).update({
        status: 'Closed',
        scannedCount: scans.length,
        verifiedCount,
        missingCount: missing.length,
        report,
        closedAt: report.closedAt,
        updatedAt: report.closedAt,
    });

    await auditService.log({
        userId: user.uid,
        action: 'UPDATE',
        entityType: 'AuditSession',
        entityId: sessionId,
        details: `Session closed. Coverage: ${coveragePercent}% (Grade ${report.grade}). Missing: ${missing.length} assets.`,
    });

    return report;
}

// ── Retrieve report for a closed session ──────────────────────────────────────

async function getReport(sessionId) {
    const doc = await db.collection(SESSIONS_COL).doc(sessionId).get();
    if (!doc.exists) throw createError('Audit session not found', 404);
    const session = doc.data();
    if (session.status === 'Active') throw createError('Session is still active — close it first', 422);
    return session.report;
}

// ── List sessions ─────────────────────────────────────────────────────────────

async function listSessions({ userId, department, limit = 20 } = {}) {
    let query = db.collection(SESSIONS_COL).orderBy('startedAt', 'desc').limit(parseInt(limit));
    const snap = await query.get();
    let sessions = snap.docs.map(d => {
        const s = d.data();
        // Strip the heavy report/scans from the list view
        const { report, ...summary } = s;
        return summary;
    });
    if (userId) sessions = sessions.filter(s => s.auditorUserId === userId);
    if (department) sessions = sessions.filter(s => s.department === department);
    return sessions;
}

module.exports = { startSession, scanAsset, closeSession, getReport, listSessions };
