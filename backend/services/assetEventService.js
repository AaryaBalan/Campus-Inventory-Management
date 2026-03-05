const { db } = require('../firebaseAdmin');
const { v4: uuidv4 } = require('uuid');

/**
 * CITRA – Asset Event Service
 *
 * Instead of editing records directly, the system logs **events** against each
 * asset. This creates a complete, append-only lifecycle timeline that is
 * immutable and fully auditable.
 *
 * Firestore path: asset_events/{assetId}/events/{eventId}
 *
 * Supported event types:
 *   Purchased   – asset entered the institution
 *   Assigned    – asset allocated to a department / user
 *   Transferred – asset moved to a new location or department
 *   Maintenance – maintenance or repair performed
 *   Verified    – asset physically confirmed during an audit
 *   Retired     – asset decommissioned / disposed
 *   Issue       – fault or issue reported against the asset
 */

const EVENTS_COL = 'asset_events';

// ── Event type constants ──────────────────────────────────────────────────────

const EVENT_TYPES = {
    PURCHASED: 'Purchased',
    ASSIGNED: 'Assigned',
    TRANSFERRED: 'Transferred',
    MAINTENANCE: 'Maintenance',
    VERIFIED: 'Verified',
    RETIRED: 'Retired',
    ISSUE: 'Issue',
};

// ── Core write ────────────────────────────────────────────────────────────────

/**
 * Append a lifecycle event to an asset's event log.
 *
 * @param {string} assetId   - The asset identifier (e.g. ECE-OSC-021)
 * @param {object} opts
 * @param {string} opts.type     - One of EVENT_TYPES
 * @param {string} opts.actorId  - UID of the user performing the action
 * @param {string} [opts.from]   - Previous location / department / owner
 * @param {string} [opts.to]     - New location / department / owner
 * @param {string} [opts.notes]  - Free-text notes
 * @returns {Promise<object>}    - The created event object
 */
async function logEvent(assetId, { type, actorId, from = null, to = null, notes = null }) {
    if (!EVENT_TYPES[type] && !Object.values(EVENT_TYPES).includes(type)) {
        throw new Error(`Unknown asset event type: ${type}`);
    }

    const eventId = uuidv4();
    const event = {
        eventId,
        assetId,
        type,
        actorId,
        from,
        to,
        notes,
        timestamp: new Date().toISOString(),
    };

    await db
        .collection(EVENTS_COL)
        .doc(assetId)
        .collection('events')
        .doc(eventId)
        .set(event);

    return event;
}

// ── Queries ───────────────────────────────────────────────────────────────────

/**
 * Retrieve the full event timeline for an asset, ordered oldest → newest.
 *
 * @param {string} assetId
 * @param {object} [opts]
 * @param {number} [opts.limit=100]
 * @returns {Promise<object[]>}
 */
async function getTimeline(assetId, { limit = 100 } = {}) {
    const snap = await db
        .collection(EVENTS_COL)
        .doc(assetId)
        .collection('events')
        .orderBy('timestamp', 'asc')
        .limit(limit)
        .get();

    return snap.docs.map(d => d.data());
}

/**
 * Get the most recent event of a specific type for an asset.
 *
 * @param {string} assetId
 * @param {string} type  - Event type to filter by
 * @returns {Promise<object|null>}
 */
async function getLastEventOfType(assetId, type) {
    const snap = await db
        .collection(EVENTS_COL)
        .doc(assetId)
        .collection('events')
        .where('type', '==', type)
        .orderBy('timestamp', 'desc')
        .limit(1)
        .get();

    return snap.empty ? null : snap.docs[0].data();
}

/**
 * Count events of each type for an asset — useful for lifecycle summary cards.
 *
 * @param {string} assetId
 * @returns {Promise<Record<string, number>>}
 */
async function getEventSummary(assetId) {
    const events = await getTimeline(assetId);
    return events.reduce((acc, e) => {
        acc[e.type] = (acc[e.type] || 0) + 1;
        return acc;
    }, {});
}

// ── Exports ───────────────────────────────────────────────────────────────────

module.exports = {
    EVENT_TYPES,
    logEvent,
    getTimeline,
    getLastEventOfType,
    getEventSummary,
};
