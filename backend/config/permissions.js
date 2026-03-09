const ROLES = {
    ADMIN: 'admin',
    FINANCE: 'finance',
    INVENTORY: 'inventory',
    DEPARTMENT: 'department',
    AUDITOR: 'auditor',
    EXECUTIVE: 'executive',
};

/**
 * PERMISSION MATRIX
 *
 * Format: 'action:resource'
 * Wildcard '*' means all actions or all resources.
 */
const PERMISSIONS = {
    [ROLES.ADMIN]: ['*:*'],

    [ROLES.FINANCE]: [
        'read:assets', 'read:inventory', 'read:users',
        'read:purchaseRequests', 'read:analyticsMetrics', 'read:auditLogs',
        'read:locations', 'read:alerts',
        'approve:purchaseRequests', 'reject:purchaseRequests',
        'create:reports', 'export:reports',
        'update:alerts',
    ],

    [ROLES.INVENTORY]: [
        'read:assets', 'read:inventory', 'read:locations',
        'create:inventory', 'update:inventory', 'delete:inventory',
        'read:purchaseRequests', 'create:purchaseRequests',
        'read:alerts', 'update:alerts',
        'read:analyticsMetrics',
        'adjust:inventory',
        'transfer:assets',
    ],

    [ROLES.DEPARTMENT]: [
        'read:assets', 'read:inventory',
        'create:purchaseRequests', 'read:purchaseRequests',
        'approve:purchaseRequests', // dept-level only
        'read:alerts', 'read:analyticsMetrics',
        'read:locations',
    ],

    [ROLES.AUDITOR]: [
        'read:assets', 'read:inventory', 'read:users',
        'read:purchaseRequests', 'read:auditLogs',
        'read:alerts', 'read:analyticsMetrics', 'read:locations',
        'create:reports', 'export:reports',
    ],

    [ROLES.EXECUTIVE]: [
        'read:analyticsMetrics', 'read:assets',
        'read:purchaseRequests', 'read:alerts',
        'read:auditLogs',
        'create:reports', 'export:reports',
    ],
};

/**
 * Check if a role has a given permission.
 * @param {string} role
 * @param {string} action  e.g. 'read'
 * @param {string} resource e.g. 'assets'
 */
function hasPermission(role, action, resource) {
    const rolePerms = PERMISSIONS[role] || [];
    return rolePerms.some(p => {
        const [a, r] = p.split(':');
        return (a === '*' || a === action) && (r === '*' || r === resource);
    });
}

module.exports = { ROLES, PERMISSIONS, hasPermission };
