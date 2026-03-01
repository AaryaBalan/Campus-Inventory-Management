const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173,http://localhost:5174')
    .split(',')
    .map(o => o.trim());

module.exports = {
    origin(origin, callback) {
        // Allow requests with no origin (curl, Postman, mobile apps)
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) return callback(null, true);
        callback(new Error(`CORS: origin '${origin}' not allowed`));
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Internal-Key'],
    exposedHeaders: ['X-Total-Count', 'X-Page', 'X-Per-Page'],
    credentials: true,
    maxAge: 86400, // 24h preflight cache
};
