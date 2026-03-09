require('dotenv').config();
const admin = require('firebase-admin');
const logger = require('./utils/logger');
const path = require('path');
const fs = require('fs');

let app;

if (!admin.apps.length) {
    let credential;

    // ── Option A: service account JSON file ────────────────────────────────
    const saPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH
        ? path.resolve(__dirname, process.env.FIREBASE_SERVICE_ACCOUNT_PATH)
        : path.resolve(__dirname, 'serviceAccountKey.json');

    if (fs.existsSync(saPath)) {
        try {
            const serviceAccount = JSON.parse(fs.readFileSync(saPath, 'utf8'));
            credential = admin.credential.cert(serviceAccount);
            logger.info(`Firebase Admin: using service account key from ${saPath}`);
        } catch (e) {
            logger.warn(`Could not parse service account key at ${saPath}: ${e.message}`);
        }
    }

    // ── Option B: individual env vars ──────────────────────────────────────
    if (!credential && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
        credential = admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        });
        logger.info('Firebase Admin: using credentials from environment variables');
    }

    // ── Option C: Application Default Credentials (GCP / Cloud Run) ────────
    if (!credential) {
        try {
            credential = admin.credential.applicationDefault();
            logger.info('Firebase Admin: using Application Default Credentials');
        } catch (_) {
            // will fail with a clear message below
        }
    }

    if (!credential) {
        const msg = `
═══════════════════════════════════════════════════════════════
  CITIL Backend — Firebase credentials not found!
  
  To fix this, do ONE of the following:
  
  1. Download your service account key:
     Firebase Console → ⚙ Project Settings → Service Accounts
     → "Generate new private key" → save as:
     ${path.resolve(__dirname, 'serviceAccountKey.json')}
  
  2. OR set these env vars in backend/.env:
     FIREBASE_PROJECT_ID=campus-inventory-project
     FIREBASE_CLIENT_EMAIL=firebase-adminsdk-...@campus-inventory-project.iam.gserviceaccount.com
     FIREBASE_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\\n...\\n-----END RSA PRIVATE KEY-----\\n"
═══════════════════════════════════════════════════════════════`;
        console.error(msg);
        process.exit(1);
    }

    app = admin.initializeApp({
        credential,
        projectId: process.env.FIREBASE_PROJECT_ID,
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
        databaseURL: process.env.FIREBASE_DATABASE_URL,
    });

    logger.info(`Firebase Admin initialised (project: ${process.env.FIREBASE_PROJECT_ID || 'campus-inventory-project'})`);
}

const db = admin.firestore();
const auth = admin.auth();
const storage = admin.storage();

db.settings({ ignoreUndefinedProperties: true });

module.exports = { admin, db, auth, storage };
