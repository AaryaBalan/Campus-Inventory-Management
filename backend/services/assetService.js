const { db } = require('../firebaseAdmin');
const { v4: uuidv4 } = require('uuid');
const dayjs = require('dayjs');
const qrCodeUtil = require('../utils/qrCode');
const auditService = require('./auditService');
const alertService = require('./alertService');
const { emit } = require('../websocket/wsServer');
const { createError } = require('../middleware/errorHandler');

const ASSETS_COL = 'assets';

// ── Helpers ────────────────────────────────────────────────────────────────

function buildStatusFromHealth(health) {
    if (health === 'Poor') return 'Under Maintenance';
    return 'Active';
}

// ── CRUD ───────────────────────────────────────────────────────────────────

/**
 * Create a new asset. Generates a unique QR code.
 */
async function createAsset(data, user) {
    const assetId = `AST-${Date.now()}-${uuidv4().slice(0, 4).toUpperCase()}`;
    const qrCode = await qrCodeUtil.generateAssetQR(assetId);

    const asset = {
        assetId,
        ...data,
        qrCode,
        status: data.status || 'Active',
        health: data.health || 'Good',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastVerified: null,
        createdBy: user.uid,
    };

    await db.collection(ASSETS_COL).doc(assetId).set(asset);

    // Initial movement log
    await _logMovement(assetId, {
        action: 'Registered',
        fromLocation: null,
        toLocation: data.currentLocation,
        fromOwner: null,
        toOwner: data.assignedTo || null,
        movedBy: user.uid,
        reason: 'Initial registration',
    });

    await auditService.log({
        userId: user.uid,
        action: 'CREATE',
        entityType: 'Asset',
        entityId: assetId,
        entityData: asset,
        details: `Asset '${data.name}' registered`,
        ipAddress: null,
    });

    emit('assets', { event: 'ASSET_CREATED', data: { assetId, name: data.name, status: asset.status } });

    return asset;
}

/**
 * Get a single asset by ID.
 */
async function getAsset(assetId) {
    const doc = await db.collection(ASSETS_COL).doc(assetId).get();
    if (!doc.exists) throw createError('Asset not found', 404);
    return doc.data();
}

/**
 * List assets with filtering, search, and pagination.
 */
async function listAssets({ page = 1, limit = 20, search, category, status, department, health, sortBy = 'createdAt', sortOrder = 'desc' } = {}) {
    let query = db.collection(ASSETS_COL);

    if (category) query = query.where('category', '==', category);
    if (status) query = query.where('status', '==', status);
    if (department) query = query.where('currentDepartment', '==', department);
    if (health) query = query.where('health', '==', health);

    query = query.orderBy(sortBy, sortOrder);

    const snapshot = await query.limit(limit).offset((page - 1) * limit).get();
    let assets = snapshot.docs.map(d => d.data());

    // In-memory search (Firestore full-text search requires Algolia/Typesense in prod)
    if (search) {
        const s = search.toLowerCase();
        assets = assets.filter(a =>
            a.name?.toLowerCase().includes(s) ||
            a.assetId?.toLowerCase().includes(s) ||
            a.category?.toLowerCase().includes(s) ||
            a.assignedTo?.toLowerCase().includes(s)
        );
    }

    const totalSnap = await db.collection(ASSETS_COL).count().get();
    return { assets, total: totalSnap.data().count, page, limit };
}

/**
 * Update asset fields.
 */
async function updateAsset(assetId, data, user) {
    const existing = await getAsset(assetId);
    const updated = {
        ...data,
        updatedAt: new Date().toISOString(),
    };
    await db.collection(ASSETS_COL).doc(assetId).update(updated);

    await auditService.log({
        userId: user.uid,
        action: 'UPDATE',
        entityType: 'Asset',
        entityId: assetId,
        entityData: { before: existing, after: { ...existing, ...updated } },
        details: `Asset '${existing.name}' updated`,
    });

    emit('assets', { event: 'ASSET_UPDATED', data: { assetId, changes: Object.keys(data) } });
    return { assetId, ...updated };
}

/**
 * Retire / decommission an asset.
 */
async function retireAsset(assetId, reason, user) {
    const asset = await getAsset(assetId);
    await db.collection(ASSETS_COL).doc(assetId).update({
        status: 'Retired',
        updatedAt: new Date().toISOString(),
        retiredAt: new Date().toISOString(),
        retiredBy: user.uid,
        retirementReason: reason,
    });

    await _logMovement(assetId, {
        action: 'Retired',
        fromLocation: asset.currentLocation,
        toLocation: null,
        movedBy: user.uid,
        reason,
    });

    await auditService.log({
        userId: user.uid,
        action: 'DELETE',
        entityType: 'Asset',
        entityId: assetId,
        details: `Asset '${asset.name}' retired. Reason: ${reason}`,
    });

    emit('assets', { event: 'ASSET_RETIRED', data: { assetId } });
    return { assetId, status: 'Retired' };
}

// ── Transfer ───────────────────────────────────────────────────────────────

/**
 * Transfer asset to new location/department/owner.
 */
async function transferAsset(assetId, { toLocation, toDepartment, toOwner, reason, notes }, user) {
    const asset = await getAsset(assetId);

    const update = {
        currentLocation: toLocation,
        currentDepartment: toDepartment,
        assignedTo: toOwner || asset.assignedTo,
        updatedAt: new Date().toISOString(),
    };

    await db.collection(ASSETS_COL).doc(assetId).update(update);

    const movId = await _logMovement(assetId, {
        action: 'Transfer',
        fromLocation: asset.currentLocation,
        toLocation,
        fromDepartment: asset.currentDepartment,
        toDepartment,
        fromOwner: asset.assignedTo,
        toOwner: toOwner || null,
        movedBy: user.uid,
        reason,
        notes,
    });

    await auditService.log({
        userId: user.uid,
        action: 'TRANSFER',
        entityType: 'Asset',
        entityId: assetId,
        details: `Asset transferred from '${asset.currentLocation}' to '${toLocation}'. Reason: ${reason}`,
    });

    emit('assets', { event: 'ASSET_MOVED', data: { assetId, toLocation, toDepartment } });
    return { assetId, movementId: movId, ...update };
}

// ── Movement history ───────────────────────────────────────────────────────

async function getMovements(assetId, { limit = 20 } = {}) {
    const snap = await db.collection(ASSETS_COL).doc(assetId)
        .collection('movements').orderBy('movedAt', 'desc').limit(limit).get();
    return snap.docs.map(d => d.data());
}

async function _logMovement(assetId, movementData) {
    const movId = uuidv4();
    await db.collection(ASSETS_COL).doc(assetId).collection('movements').doc(movId).set({
        movementId: movId,
        ...movementData,
        movedAt: new Date().toISOString(),
    });
    return movId;
}

// ── QR code ────────────────────────────────────────────────────────────────

async function getQrCode(assetId) {
    const asset = await getAsset(assetId);
    if (asset.qrCode) return asset.qrCode;
    // Regenerate if missing
    const qrCode = await qrCodeUtil.generateAssetQR(assetId);
    await db.collection(ASSETS_COL).doc(assetId).update({ qrCode });
    return qrCode;
}

/**
 * Verify asset by QR code — used by QR scanner page.
 */
async function verifyByQr(qrValue) {
    // QR value is the assetId directly
    try {
        const asset = await getAsset(qrValue);
        return { found: true, asset };
    } catch (_) {
        // Try searching by qrCode field value
        const snap = await db.collection(ASSETS_COL).where('qrCode', '==', qrValue).limit(1).get();
        if (snap.empty) return { found: false };
        return { found: true, asset: snap.docs[0].data() };
    }
}

// ── Bulk operations ────────────────────────────────────────────────────────

async function bulkRegister(assetsData, user) {
    const results = [];
    const batch = db.batch();

    for (const data of assetsData) {
        const assetId = `AST-${Date.now()}-${uuidv4().slice(0, 4).toUpperCase()}`;
        const qrCode = await qrCodeUtil.generateAssetQR(assetId);
        const asset = {
            assetId,
            ...data,
            qrCode,
            status: 'Active',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            createdBy: user.uid,
        };
        batch.set(db.collection(ASSETS_COL).doc(assetId), asset);
        results.push({ assetId, name: data.name });
    }

    await batch.commit();

    await auditService.log({
        userId: user.uid,
        action: 'BULK_CREATE',
        entityType: 'Asset',
        entityId: 'BULK',
        details: `Bulk registered ${assetsData.length} assets`,
    });

    return results;
}

// ── Location / category queries ────────────────────────────────────────────

async function getByLocation(locationId) {
    const snap = await db.collection(ASSETS_COL).where('currentLocation', '==', locationId).get();
    return snap.docs.map(d => d.data());
}

async function getByCategory(category) {
    const snap = await db.collection(ASSETS_COL).where('category', '==', category).get();
    return snap.docs.map(d => d.data());
}

module.exports = {
    createAsset, getAsset, listAssets, updateAsset, retireAsset,
    transferAsset, getMovements,
    getQrCode, verifyByQr,
    bulkRegister, getByLocation, getByCategory,
};
