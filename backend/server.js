require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const cron = require('node-cron');

const corsConfig = require('./config/cors');
const { globalLimiter } = require('./config/rateLimiter');
const errorHandler = require('./middleware/errorHandler');
const requestLogger = require('./middleware/requestLogger');
const routes = require('./routes');
const { initWsServer } = require('./websocket/wsServer');
const logger = require('./utils/logger');

// ── Scheduled jobs ──────────────────────────────────────────────────────────
const { checkStockLevels } = require('./functions/scheduledAlerts');
const { expireApprovals } = require('./functions/approvalExpiry');
const { refreshAnalytics } = require('./functions/analyticsRefresh');

const app = express();
const server = http.createServer(app);

// ── Core middleware ─────────────────────────────────────────────────────────
app.use(helmet());
app.use(cors(corsConfig));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(requestLogger);
app.use(globalLimiter);

// ── Health check ────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        service: 'CITIL Backend',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
    });
});

// ── API routes ──────────────────────────────────────────────────────────────
app.use('/api', routes);

// ── Error handling (must be last) ───────────────────────────────────────────
app.use(errorHandler);

// ── WebSocket server ────────────────────────────────────────────────────────
initWsServer(server);

// ── Cron jobs ───────────────────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'test') {
    cron.schedule(process.env.CRON_STOCK_CHECK || '0 * * * *', () => {
        logger.info('[CRON] Running stock level check');
        checkStockLevels().catch(e => logger.error('[CRON] stockCheck error', e));
    });

    cron.schedule(process.env.CRON_APPROVAL_CHECK || '0 */6 * * *', () => {
        logger.info('[CRON] Running approval expiry check');
        expireApprovals().catch(e => logger.error('[CRON] approvalExpiry error', e));
    });

    cron.schedule(process.env.CRON_ANALYTICS_REFRESH || '0 0 * * *', () => {
        logger.info('[CRON] Refreshing analytics metrics');
        refreshAnalytics().catch(e => logger.error('[CRON] analyticsRefresh error', e));
    });
}

// ── Start server ────────────────────────────────────────────────────────────
const PORT = parseInt(process.env.PORT || '5000', 10);

server.listen(PORT, () => {
    logger.info(`🚀 CITIL API running on port ${PORT} [${process.env.NODE_ENV}]`);
});

module.exports = { app, server }; // for testing
