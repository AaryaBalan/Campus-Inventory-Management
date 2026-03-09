/**
 * bills.js — Express router for bill extraction and management
 *
 * POST /api/bills/extract   — Upload file → OCR → AI parse → save draft
 * GET  /api/bills            — List user's saved bills
 * GET  /api/bills/:id        — Get single bill
 * PUT  /api/bills/:id        — Update bill (after user edits)
 * DELETE /api/bills/:id      — Delete bill
 */

const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { authenticate } = require('../middleware/auth');
const ocrService = require('../services/ocrService');
const billService = require('../services/billService');
const logger = require('../utils/logger');

// ── Multer config — store in OS temp dir, auto-clean after request ─────────

const ALLOWED_MIMES = [
    'image/jpeg', 'image/png', 'image/webp', 'image/bmp', 'image/tiff',
    'application/pdf',
];
const MAX_FILE_BYTES = 20 * 1024 * 1024; // 20 MB

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, os.tmpdir()),
    filename: (req, file, cb) => {
        const safe = `bill-${Date.now()}-${Math.random().toString(36).slice(2)}${path.extname(file.originalname)}`;
        cb(null, safe);
    },
});

const upload = multer({
    storage,
    limits: { fileSize: MAX_FILE_BYTES },
    fileFilter: (req, file, cb) => {
        if (ALLOWED_MIMES.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(Object.assign(new Error('Unsupported file type. Upload JPEG, PNG, WEBP, or PDF.'), { statusCode: 400 }));
        }
    },
});

/** Safely delete temp file (don't crash if already gone) */
function cleanupFile(filePath) {
    try { if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath); } catch (_) { }
}

// ── POST /api/bills/extract ─────────────────────────────────────────────────

router.post('/extract', authenticate, (req, res, next) => {
    upload.single('file')(req, res, (err) => {
        if (err) {
            if (err.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({ error: 'File too large. Maximum allowed size is 20 MB.' });
            }
            return next(err);
        }
        next();
    });
}, async (req, res, next) => {
    const file = req.file;
    if (!file) {
        return res.status(400).json({ error: 'No file uploaded. Send a file in a multipart/form-data field named "file".' });
    }

    try {
        logger.info(`[Bills] Processing upload: ${file.originalname} (${file.mimetype}) for user ${req.user.uid}`);

        // Step 1 — OCR / text extraction
        const rawText = await ocrService.extractText(file.path, file.mimetype);

        if (!rawText || rawText.length < 5) {
            return res.status(422).json({
                error: 'Could not extract readable text from this file. Try a clearer image or a text-based PDF.',
            });
        }

        // Step 2 — AI parsing
        const parsed = await ocrService.parseWithAI(rawText);

        // Step 3 — Save draft to Firestore
        const bill = await billService.createBill(req.user.uid, {
            ...parsed,
            rawText,
            fileName: file.originalname,
        });

        // Step 4 — CITRA: Generate draft asset records from line items
        const draftAssets = billService.generateDraftAssets(bill);

        logger.info(`[Bills] Saved bill ${bill.billId}, generated ${draftAssets.length} draft assets for user ${req.user.uid}`);
        res.status(201).json({ ...bill, draftAssets });
    } catch (err) {
        next(err);
    } finally {
        cleanupFile(file?.path);
    }
});

// ── GET /api/bills ─────────────────────────────────────────────────────────

router.get('/', authenticate, async (req, res, next) => {
    try {
        const bills = await billService.listBills(req.user.uid);
        res.json({ bills, total: bills.length });
    } catch (e) { next(e); }
});

// ── GET /api/bills/:id ─────────────────────────────────────────────────────

router.get('/:id', authenticate, async (req, res, next) => {
    try {
        const bill = await billService.getBill(req.user.uid, req.params.id);
        res.json(bill);
    } catch (e) { next(e); }
});

// ── PUT /api/bills/:id — update after user edits ───────────────────────────

router.put('/:id', authenticate, async (req, res, next) => {
    try {
        const result = await billService.updateBill(req.user.uid, req.params.id, req.body);
        res.json(result);
    } catch (e) { next(e); }
});

// ── DELETE /api/bills/:id ──────────────────────────────────────────────────

router.delete('/:id', authenticate, async (req, res, next) => {
    try {
        const result = await billService.deleteBill(req.user.uid, req.params.id);
        res.json(result);
    } catch (e) { next(e); }
});

// ── CITRA: GET /api/bills/:id/draft-assets ────────────────────────────────
// Returns structured draft asset records generated from a bill's line items.
// Accepts optional query params: ?department=ECE&location=Electronics+Lab

router.get('/:id/draft-assets', authenticate, async (req, res, next) => {
    try {
        const bill = await billService.getBill(req.user.uid, req.params.id);
        const { department = '', location = '' } = req.query;
        const draftAssets = billService.generateDraftAssets(bill, department, location);
        res.json({
            billId: req.params.id,
            vendor: bill.vendor,
            date: bill.date,
            draftAssets,
            total: draftAssets.length,
        });
    } catch (e) { next(e); }
});

module.exports = router;
