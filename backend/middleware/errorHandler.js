const logger = require('../utils/logger');

/**
 * Centralized Express error handler.
 * Must be registered as the last middleware.
 */
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
    const isProd = process.env.NODE_ENV === 'production';

    // Differentiate known vs unknown errors
    const statusCode = err.statusCode || err.status || 500;
    const message = err.message || 'Internal Server Error';

    logger.error(`[${req.method}] ${req.originalUrl} → ${statusCode}: ${message}`, {
        stack: err.stack,
        user: req.user?.uid,
        body: req.body,
    });

    res.status(statusCode).json({
        error: message,
        ...(isProd ? {} : { stack: err.stack }),
        // Firebase / Firestore specific error codes
        ...(err.code ? { code: err.code } : {}),
    });
}

/** Utility to create a structured API error */
function createError(message, statusCode = 500, code) {
    const err = new Error(message);
    err.statusCode = statusCode;
    if (code) err.code = code;
    return err;
}

/** 404 handler for unmatched routes */
function notFound(req, res) {
    res.status(404).json({ error: `Route ${req.method} ${req.originalUrl} not found` });
}

module.exports = errorHandler;
module.exports.createError = createError;
module.exports.notFound = notFound;
