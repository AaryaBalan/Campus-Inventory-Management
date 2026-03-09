const { hasPermission } = require('../config/permissions');

/**
 * RBAC guard factory.
 * Usage: router.get('/assets', authenticate, checkPermission('read', 'assets'), handler)
 *
 * @param {string} action   e.g. 'read', 'create', 'approve'
 * @param {string} resource e.g. 'assets', 'purchaseRequests'
 */
function checkPermission(action, resource) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }
        const { role } = req.user;
        if (!hasPermission(role, action, resource)) {
            return res.status(403).json({
                error: 'Access denied',
                detail: `Role '${role}' cannot perform '${action}' on '${resource}'`,
            });
        }
        next();
    };
}

/**
 * Admin-only guard.
 */
function adminOnly(req, res, next) {
    if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
    }
    next();
}

/**
 * Allow only the roles listed.
 */
function requireRoles(...roles) {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({
                error: 'Access denied',
                detail: `Required roles: ${roles.join(', ')}`,
            });
        }
        next();
    };
}

/**
 * Ownership guard: only the resource owner or admin can proceed.
 * Assumes req.params.userId or req.params.uid is the target user.
 */
function ownerOrAdmin(req, res, next) {
    const { role, uid } = req.user || {};
    const targetId = req.params.userId || req.params.uid;
    if (role === 'admin' || uid === targetId) return next();
    return res.status(403).json({ error: 'You can only access your own resources' });
}

module.exports = { checkPermission, adminOnly, requireRoles, ownerOrAdmin };
