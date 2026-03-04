/**
 * billService.js
 *
 * Firestore CRUD for extracted bills.
 * Collection: bills/{userId}/items/{billId}
 */

const { db } = require('../firebaseAdmin');
const { v4: uuidv4 } = require('uuid');
const { createError } = require('../middleware/errorHandler');

const ROOT_COL = 'bills';

/**
 * Save an extracted (or user-edited) bill for a user.
 * @param {string} userId
 * @param {object} data — shape: { vendor, date, items[], tax, grandTotal, warrantyInfo, rawText, fileName }
 */
async function createBill(userId, data) {
    const billId = uuidv4();
    const now = new Date().toISOString();

    const bill = {
        billId,
        userId,
        vendor: data.vendor || null,
        date: data.date || null,
        items: Array.isArray(data.items) ? data.items : [],
        tax: data.tax ?? null,
        grandTotal: data.grandTotal ?? null,
        warrantyInfo: data.warrantyInfo || null,
        rawText: data.rawText || null,
        fileName: data.fileName || null,
        notes: data.notes || null,
        createdAt: now,
        updatedAt: now,
    };

    await db.collection(ROOT_COL).doc(userId).collection('items').doc(billId).set(bill);
    return bill;
}

/**
 * List all bills for a user, most recent first.
 */
async function listBills(userId) {
    const snap = await db.collection(ROOT_COL).doc(userId)
        .collection('items')
        .orderBy('createdAt', 'desc')
        .limit(50)
        .get();

    return snap.docs.map(d => d.data());
}

/**
 * Get a single bill.
 */
async function getBill(userId, billId) {
    const doc = await db.collection(ROOT_COL).doc(userId).collection('items').doc(billId).get();
    if (!doc.exists) throw createError('Bill not found', 404);
    return doc.data();
}

/**
 * Update fields of a saved bill (after user edits).
 */
async function updateBill(userId, billId, data) {
    // Verify ownership first
    const doc = await db.collection(ROOT_COL).doc(userId).collection('items').doc(billId).get();
    if (!doc.exists) throw createError('Bill not found', 404);

    const allowed = ['vendor', 'date', 'items', 'tax', 'grandTotal', 'warrantyInfo', 'notes'];
    const updates = {};
    for (const key of allowed) {
        if (data[key] !== undefined) updates[key] = data[key];
    }
    updates.updatedAt = new Date().toISOString();

    await db.collection(ROOT_COL).doc(userId).collection('items').doc(billId).update(updates);
    return { billId, ...updates };
}

/**
 * Delete a bill.
 */
async function deleteBill(userId, billId) {
    const doc = await db.collection(ROOT_COL).doc(userId).collection('items').doc(billId).get();
    if (!doc.exists) throw createError('Bill not found', 404);
    await doc.ref.delete();
    return { deleted: true, billId };
}

module.exports = { createBill, listBills, getBill, updateBill, deleteBill };
