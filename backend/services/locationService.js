const { db } = require('../firebaseAdmin');
const { v4: uuidv4 } = require('uuid');
const auditService = require('./auditService');
const { createError } = require('../middleware/errorHandler');

const LOC_COL = 'locations';
const ASSETS_COL = 'assets';

async function createLocation(data, user) {
    const locationId = `LOC-${uuidv4().slice(0, 8).toUpperCase()}`;
    const location = {
        locationId,
        ...data,
        currentAssetCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: user.uid,
    };
    await db.collection(LOC_COL).doc(locationId).set(location);
    await auditService.log({ userId: user.uid, action: 'CREATE', entityType: 'Location', entityId: locationId, details: `Location '${data.name}' created` });
    return location;
}

async function getLocation(locationId) {
    const doc = await db.collection(LOC_COL).doc(locationId).get();
    if (!doc.exists) throw createError('Location not found', 404);
    return doc.data();
}

async function listLocations() {
    const snap = await db.collection(LOC_COL).orderBy('building').get();
    return snap.docs.map(d => d.data());
}

async function updateLocation(locationId, data, user) {
    await db.collection(LOC_COL).doc(locationId).update({ ...data, updatedAt: new Date().toISOString() });
    await auditService.log({ userId: user.uid, action: 'UPDATE', entityType: 'Location', entityId: locationId, details: 'Location updated' });
}

async function getAssetsAtLocation(locationId) {
    const snap = await db.collection(ASSETS_COL).where('currentLocation', '==', locationId).get();
    return snap.docs.map(d => d.data());
}

/**
 * Aggregate map data for the campus digital twin view.
 * Returns locations with their asset counts and status breakdown.
 */
async function getMapData() {
    const locations = await listLocations();
    const assetsSnap = await db.collection(ASSETS_COL).get();
    const assets = assetsSnap.docs.map(d => d.data());

    return locations.map(loc => {
        const locAssets = assets.filter(a => a.currentLocation === loc.locationId);
        const byStatus = {};
        locAssets.forEach(a => { byStatus[a.status] = (byStatus[a.status] || 0) + 1; });
        return { ...loc, assetCount: locAssets.length, assetsByStatus: byStatus };
    });
}

module.exports = { createLocation, getLocation, listLocations, updateLocation, getAssetsAtLocation, getMapData };
