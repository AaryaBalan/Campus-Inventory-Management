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

/**
 * CITRA – Generate draft asset records from an extracted bill's line items.
 *
 * Converts OCR-extracted invoice line items into structured draft objects
 * that can be reviewed and then passed to assetService.bulkRegister().
 *
 * @param {object} bill               - A saved bill from createBill / getBill
 * @param {string} [defaultDept]      - Department to assign (can be set by user)
 * @param {string} [defaultLocation]  - Location to assign
 * @returns {object[]} Array of draft asset records ready for registration
 */
function generateDraftAssets(bill, defaultDept = '', defaultLocation = '') {
    const items = Array.isArray(bill.items) ? bill.items : [];

    return items
        .filter(item => item && (item.name || item.description))
        .flatMap(item => {
            // Quantity determines how many individual asset records to create
            const qty = Math.max(1, parseInt(item.quantity) || 1);
            const drafts = [];

            for (let i = 0; i < qty; i++) {
                drafts.push({
                    // Identity
                    name: item.name || item.description || 'Unknown Item',
                    category: item.category || _inferCategory(item.name || item.description || ''),

                    // Procurement provenance from the invoice
                    vendor: bill.vendor || null,
                    purchaseDate: bill.date || null,
                    purchaseValue: item.unitPrice ?? item.unit_price ?? null,
                    invoiceBillId: bill.billId,
                    warrantyInfo: item.warranty || bill.warrantyInfo || null,

                    // Location / org — pre-filled with defaults, user can edit before registering
                    currentDepartment: defaultDept,
                    currentLocation: defaultLocation,

                    // Lifecycle defaults
                    status: 'Active',
                    health: 'Good',

                    // Metadata
                    _isDraft: true,          // flag so the UI can show an "edit before save" state
                    _draftIndex: i,          // index within the same line item (unit 1 of 3, etc.)
                    _lineItemQty: qty,
                });
            }

            return drafts;
        });
}

/**
 * Simple heuristic to infer an asset category from the item name.
 * Falls back to 'Equipment' when no keyword matches.
 */
function _inferCategory(name) {
    const n = name.toLowerCase();
    if (/laptop|computer|desktop|monitor|server/.test(n)) return 'Computing';
    if (/oscilloscope|multimeter|signal|generator|spectrum/.test(n)) return 'Instruments';
    if (/microscope|centrifuge|spectrometer/.test(n)) return 'Lab Equipment';
    if (/projector|display|screen|tv/.test(n)) return 'AV Equipment';
    if (/chair|table|desk|cabinet|shelf/.test(n)) return 'Furniture';
    if (/chemical|reagent|solvent/.test(n)) return 'Chemicals';
    if (/cable|adapter|charger|battery/.test(n)) return 'Accessories';
    return 'Equipment';
}

module.exports = { createBill, listBills, getBill, updateBill, deleteBill, generateDraftAssets };
