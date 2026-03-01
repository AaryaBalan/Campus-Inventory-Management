const { WebSocketServer, WebSocket } = require('ws');
const logger = require('../utils/logger');

/** @type {WebSocketServer | null} */
let wss = null;

// Room → Set<WebSocket>
const rooms = {
    dashboard: new Set(),
    alerts: new Set(),
    procurement: new Set(),
    assets: new Set(),
};

/**
 * Attach WebSocket server to an existing HTTP server.
 * @param {import('http').Server} httpServer
 */
function initWsServer(httpServer) {
    wss = new WebSocketServer({ server: httpServer, path: '/ws' });

    wss.on('connection', (ws, req) => {
        logger.info(`[WS] Client connected from ${req.socket.remoteAddress}`);

        ws._rooms = new Set();

        ws.on('message', raw => {
            try {
                const msg = JSON.parse(raw.toString());

                // Subscribe to a room: { type: 'subscribe', room: 'alerts' }
                if (msg.type === 'subscribe' && rooms[msg.room]) {
                    rooms[msg.room].add(ws);
                    ws._rooms.add(msg.room);
                    ws.send(JSON.stringify({ type: 'subscribed', room: msg.room }));
                    logger.debug(`[WS] Client subscribed to room '${msg.room}'`);
                }

                // Unsubscribe: { type: 'unsubscribe', room: 'alerts' }
                if (msg.type === 'unsubscribe' && rooms[msg.room]) {
                    rooms[msg.room].delete(ws);
                    ws._rooms.delete(msg.room);
                }

                // Ping/pong
                if (msg.type === 'ping') ws.send(JSON.stringify({ type: 'pong' }));

            } catch (e) {
                ws.send(JSON.stringify({ type: 'error', message: 'Invalid JSON' }));
            }
        });

        ws.on('close', () => {
            // Remove from all rooms on disconnect
            ws._rooms.forEach(room => rooms[room]?.delete(ws));
            logger.info('[WS] Client disconnected');
        });

        ws.on('error', err => logger.error('[WS] Client error', err));

        // Welcome message
        ws.send(JSON.stringify({ type: 'connected', availableRooms: Object.keys(rooms) }));
    });

    logger.info('[WS] WebSocket server active on /ws');
    return wss;
}

/**
 * Broadcast a message to all clients subscribed to a room.
 * @param {string} room
 * @param {object} payload
 */
function emit(room, payload) {
    if (!rooms[room]) return;
    const message = JSON.stringify({ ...payload, ts: new Date().toISOString() });
    rooms[room].forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(message);
        }
    });
}

/**
 * Broadcast to ALL connected clients regardless of room.
 */
function broadcast(payload) {
    if (!wss) return;
    const message = JSON.stringify({ ...payload, ts: new Date().toISOString() });
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) client.send(message);
    });
}

module.exports = { initWsServer, emit, broadcast };
