const router = require('express').Router();

router.use('/auth', require('./auth'));
router.use('/assets', require('./assets'));
router.use('/inventory', require('./inventory'));
router.use('/', require('./procurement'));    // mounts /purchase-requests & /approval-queue
router.use('/alerts', require('./alerts'));
router.use('/', require('./audit'));          // mounts /audit-logs & /reports
router.use('/', require('./analytics'));      // mounts /analytics & /predictions
router.use('/locations', require('./locations'));
router.use('/users', require('./users'));
router.use('/notifications', require('./notifications'));

// 404 fallback for unmatched API routes
router.use((req, res) => {
    res.status(404).json({ error: `API route ${req.method} ${req.originalUrl} not found` });
});

module.exports = router;
