const rateLimit = require('express-rate-limit');

const windowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10);
const max = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10);

const globalLimiter = rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests. Please slow down and try again later.' },
});

// Stricter limiter for auth endpoints
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 min
    max: 20,
    message: { error: 'Too many authentication attempts. Try again in 15 minutes.' },
});

// Very permissive for internal health checks
const healthLimiter = rateLimit({ windowMs, max: 500 });

module.exports = { globalLimiter, authLimiter, healthLimiter };
