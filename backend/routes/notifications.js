const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const notificationService = require('../services/notificationService');

// GET /api/notifications — list notifications for the authenticated user
router.get('/', authenticate, async (req, res, next) => {
    try {
        const notifications = await notificationService.listNotifications(req.user.uid);
        const unread = await notificationService.unreadCount(req.user.uid);
        res.json({ notifications, unreadCount: unread });
    } catch (e) { next(e); }
});

// PATCH /api/notifications/:id/read — mark one notification as read
router.patch('/:id/read', authenticate, async (req, res, next) => {
    try {
        const result = await notificationService.markRead(req.user.uid, req.params.id);
        res.json(result);
    } catch (e) { next(e); }
});

// PATCH /api/notifications/read-all — mark all as read
router.patch('/read-all', authenticate, async (req, res, next) => {
    try {
        const result = await notificationService.markAllRead(req.user.uid);
        res.json(result);
    } catch (e) { next(e); }
});

// DELETE /api/notifications/:id — delete one notification
router.delete('/:id', authenticate, async (req, res, next) => {
    try {
        const result = await notificationService.deleteNotification(req.user.uid, req.params.id);
        res.json(result);
    } catch (e) { next(e); }
});

// DELETE /api/notifications — clear all notifications
router.delete('/', authenticate, async (req, res, next) => {
    try {
        const result = await notificationService.clearAll(req.user.uid);
        res.json(result);
    } catch (e) { next(e); }
});

module.exports = router;
