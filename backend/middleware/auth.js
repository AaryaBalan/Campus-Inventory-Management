const { auth, db } = require('../firebaseAdmin');
const logger = require('../utils/logger');

/**
 * Middleware: verifies Firebase ID token from Authorization header.
 * Attaches decoded user data to req.user.
 *
 * Role resolution order:
 *  1. Firebase custom claims (set via Admin SDK / setClaims script)
 *  2. Firestore `users/{uid}.role`  ← fallback when claims aren't set yet
 *  3. Default: 'department'
 */
async function authenticate(req, res, next) {
    const header = req.headers['authorization'];
    if (!header || !header.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Missing or malformed Authorization header' });
    }

    const idToken = header.slice(7);

    try {
        const decoded = await auth.verifyIdToken(idToken);

        // 1️⃣ Try custom claims first (fastest — no extra DB call)
        let role = decoded.role || null;
        let department = decoded.department || null;

        // 2️⃣ Fall back to Firestore users collection when claims aren't set
        if (!role) {
            try {
                const snap = await db.collection('users').doc(decoded.uid).get();
                if (snap.exists) {
                    const data = snap.data();
                    role = data.role || null;
                    department = data.department || department;
                }
            } catch (dbErr) {
                logger.warn(`[AUTH] Firestore role fallback failed: ${dbErr.message}`);
            }
        }

        req.user = {
            uid: decoded.uid,
            email: decoded.email,
            role: role || 'department',
            department: department,
            name: decoded.name || decoded.email,
        };

        next();
    } catch (err) {
        logger.warn(`[AUTH] Token verification failed: ${err.message}`);
        return res.status(401).json({ error: 'Invalid or expired token', details: err.message });
    }
}

/**
 * Optional authenticate — attaches user if token present but doesn't reject.
 */
async function optionalAuthenticate(req, res, next) {
    const header = req.headers['authorization'];
    if (!header || !header.startsWith('Bearer ')) return next();
    try {
        const decoded = await auth.verifyIdToken(header.slice(7));
        let role = decoded.role || null;
        let department = decoded.department || null;
        if (!role) {
            try {
                const snap = await db.collection('users').doc(decoded.uid).get();
                if (snap.exists) {
                    const data = snap.data();
                    role = data.role || null;
                    department = data.department || department;
                }
            } catch (_) { }
        }
        req.user = {
            uid: decoded.uid,
            email: decoded.email,
            role: role || 'department',
            department: department,
            name: decoded.name || decoded.email,
        };
    } catch (_) {
        // ignore — unauthenticated access allowed
    }
    next();
}



/**
 * Internal service-to-service authentication via X-Internal-Key header.
 */
function internalKey(req, res, next) {
    const key = req.headers['x-internal-key'];
    if (!key || key !== process.env.INTERNAL_API_KEY) {
        return res.status(403).json({ error: 'Invalid internal API key' });
    }
    next();
}

module.exports = { authenticate, optionalAuthenticate, internalKey };
