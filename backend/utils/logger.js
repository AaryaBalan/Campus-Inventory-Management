const { createLogger, format, transports } = require('winston');
const { combine, timestamp, colorize, printf, json, errors } = format;

const isProd = process.env.NODE_ENV === 'production';

const devFormat = combine(
    colorize(),
    timestamp({ format: 'HH:mm:ss' }),
    errors({ stack: true }),
    printf(({ level, message, timestamp, stack }) =>
        `${timestamp} [${level}] ${message}${stack ? '\n' + stack : ''}`)
);

const prodFormat = combine(
    timestamp(),
    errors({ stack: true }),
    json()
);

const logger = createLogger({
    level: isProd ? 'info' : 'debug',
    format: isProd ? prodFormat : devFormat,
    transports: [
        new transports.Console(),
        ...(isProd
            ? [
                new transports.File({ filename: 'logs/error.log', level: 'error' }),
                new transports.File({ filename: 'logs/combined.log' }),
            ]
            : []),
    ],
    exitOnError: false,
});

module.exports = logger;
