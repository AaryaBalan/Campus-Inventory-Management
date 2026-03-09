const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const { adminOnly, ownerOrAdmin } = require('../middleware/rbac');
const validate = require('../middleware/validate');
const schemas = require('../models/schemas');
const authService = require('../services/authService');

// GET /api/users  (admin only)
router.get('/', authenticate, adminOnly, async (req, res, next) => {
    try { res.json(await authService.listUsers(req.query)); } catch (e) { next(e); }
});

// GET /api/users/:userId
router.get('/:userId', authenticate, ownerOrAdmin, async (req, res, next) => {
    try { res.json(await authService.getUser(req.params.userId)); } catch (e) { next(e); }
});

// POST /api/users/:userId/role  (admin only)
router.post('/:userId/role', authenticate, adminOnly, validate({ body: schemas.updateUserRole }), async (req, res, next) => {
    try {
        await authService.changeRole(req.params.userId, req.body, req.user.uid);
        res.json({ message: 'Role updated' });
    } catch (e) { next(e); }
});

// PUT /api/users/:userId/preferences
router.put('/:userId/preferences', authenticate, ownerOrAdmin, validate({ body: schemas.updatePreferences }), async (req, res, next) => {
    try {
        await authService.updatePreferences(req.params.userId, req.body);
        res.json({ message: 'Preferences updated' });
    } catch (e) { next(e); }
});

// DELETE /api/users/:userId  (deactivate — admin only)
router.delete('/:userId', authenticate, adminOnly, async (req, res, next) => {
    try {
        await authService.deactivate(req.params.userId, req.user.uid);
        res.json({ message: 'User deactivated' });
    } catch (e) { next(e); }
});

module.exports = router;
