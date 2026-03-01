const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const { authLimiter } = require('../config/rateLimiter');
const validate = require('../middleware/validate');
const schemas = require('../models/schemas');
const authService = require('../services/authService');
const { createError } = require('../middleware/errorHandler');

// POST /api/auth/register  (admin creates users)
router.post('/register', authLimiter, authenticate, validate({ body: schemas.authRegister }), async (req, res, next) => {
    try {
        const result = await authService.register(req.body, req.user.uid);
        res.status(201).json({ message: 'User registered', user: result });
    } catch (e) { next(e); }
});

// POST /api/auth/login  — Frontend passes Firebase ID token; backend records login & returns user profile
router.post('/login', authLimiter, authenticate, async (req, res, next) => {
    try {
        // Pass user info so the doc can be created on first login if missing
        await authService.recordLogin(req.user.uid, {
            uid: req.user.uid,
            email: req.user.email,
            name: req.user.name,
            role: req.user.role,
        });
        let profile;
        try {
            profile = await authService.getUser(req.user.uid);
        } catch (_) {
            // If getUser fails (doc just created), return the req.user info
            profile = req.user;
        }
        res.json({ message: 'Login recorded', user: profile });
    } catch (e) { next(e); }
});

// POST /api/auth/reset-password
router.post('/reset-password', authLimiter, validate({ body: schemas.authLogin.fork(['password'], f => f.optional()) }), async (req, res, next) => {
    try {
        await authService.resetPassword(req.body.email);
        res.json({ message: 'Password reset email sent' });
    } catch (e) { next(e); }
});

// POST /api/auth/logout  — Client-side logout; server can revoke refresh token in Firebase
router.post('/logout', authenticate, async (req, res, next) => {
    try {
        // Revoke all refresh tokens for the user
        await require('../firebaseAdmin').auth.revokeRefreshTokens(req.user.uid);
        res.json({ message: 'Logged out successfully' });
    } catch (e) { next(e); }
});

// GET /api/auth/verify  — Verify token and return current user info
router.get('/verify', authenticate, async (req, res, next) => {
    try {
        const profile = await authService.getUser(req.user.uid);
        res.json({ valid: true, user: profile });
    } catch (e) { next(e); }
});

// GET /api/auth/me  — Returns the current user's resolved profile (role from Firestore)
router.get('/me', authenticate, (req, res) => {
    res.json({ user: req.user });
});

module.exports = router;

