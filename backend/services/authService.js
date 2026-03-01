const { auth, db } = require('../firebaseAdmin');
const auditService = require('./auditService');
const logger = require('../utils/logger');

const USERS_COL = 'users';

/**
 * Register a new user in Firebase Auth and Firestore.
 */
async function register({ email, password, name, role, department, phone }, callerUid) {
    // Create Firebase Auth user
    const userRecord = await auth.createUser({ email, password, displayName: name });

    // Set custom claims for RBAC
    await auth.setCustomUserClaims(userRecord.uid, { role, department: department || null });

    // Store user document in Firestore
    const userData = {
        uid: userRecord.uid,
        email,
        name,
        phone: phone || null,
        role,
        department: department || null,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastLogin: null,
        preferences: {
            notifications: { email: true, inApp: true, criticalAlerts: true, approvalUpdates: true, stockAlerts: true },
            theme: 'dark',
        },
    };

    await db.collection(USERS_COL).doc(userRecord.uid).set(userData);

    await auditService.log({
        userId: callerUid || userRecord.uid,
        action: 'CREATE',
        entityType: 'User',
        entityId: userRecord.uid,
        details: `User registered with role '${role}'`,
    });

    logger.info(`[AuthService] Registered user ${email} with role ${role}`);
    return { uid: userRecord.uid, email, name, role };
}

/**
 * Record / create user document on login.
 * Uses set+merge so it works for first-time logins even if no doc exists.
 */
async function recordLogin(uid, userData = {}) {
    await db.collection(USERS_COL).doc(uid).set({
        ...userData,
        lastLogin: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    }, { merge: true });
}

/**
 * Change a user's role (admin only). Updates both Firestore and custom claims.
 */
async function changeRole(targetUid, { role, department }, callerUid) {
    await auth.setCustomUserClaims(targetUid, { role, department: department || null });
    await db.collection(USERS_COL).doc(targetUid).update({
        role,
        department: department || null,
        updatedAt: new Date().toISOString(),
    });

    await auditService.log({
        userId: callerUid,
        action: 'UPDATE',
        entityType: 'User',
        entityId: targetUid,
        details: `Role changed to '${role}'`,
    });
}

/**
 * Initiate password reset via Firebase.
 */
async function resetPassword(email) {
    // Firebase generates and emails the reset link
    const link = await auth.generatePasswordResetLink(email);
    logger.info(`[AuthService] Password reset link generated for ${email}`);
    return link; // in prod, send via SMTP instead of returning
}

/**
 * Deactivate a user (disable Firebase Auth + Firestore flag).
 */
async function deactivate(targetUid, callerUid) {
    await auth.updateUser(targetUid, { disabled: true });
    await db.collection(USERS_COL).doc(targetUid).update({
        isActive: false,
        updatedAt: new Date().toISOString(),
    });
    await auditService.log({
        userId: callerUid,
        action: 'DELETE',
        entityType: 'User',
        entityId: targetUid,
        details: 'User account deactivated',
    });
}

/**
 * Get user document from Firestore.
 */
async function getUser(uid) {
    const doc = await db.collection(USERS_COL).doc(uid).get();
    if (!doc.exists) throw Object.assign(new Error('User not found'), { statusCode: 404 });
    return doc.data();
}

/**
 * List all users (admin only) with optional pagination.
 */
async function listUsers({ page = 1, limit = 20, role } = {}) {
    let query = db.collection(USERS_COL).orderBy('createdAt', 'desc');
    if (role) query = query.where('role', '==', role);

    const snapshot = await query.limit(limit).offset((page - 1) * limit).get();
    const countSnap = await (role ? db.collection(USERS_COL).where('role', '==', role) : db.collection(USERS_COL)).count().get();

    return {
        users: snapshot.docs.map(d => d.data()),
        total: countSnap.data().count,
        page,
        limit,
    };
}

/**
 * Update user preferences.
 */
async function updatePreferences(uid, preferences) {
    await db.collection(USERS_COL).doc(uid).update({
        preferences,
        updatedAt: new Date().toISOString(),
    });
}

module.exports = { register, recordLogin, changeRole, resetPassword, deactivate, getUser, listUsers, updatePreferences };
