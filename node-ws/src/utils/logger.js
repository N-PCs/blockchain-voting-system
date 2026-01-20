/**
 * Winston logger configuration for WebSocket server
 */

const winston = require('winston');
const path = require('path');
const config = require('../config/config');

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json(),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const metaString = Object.keys(meta).length ? JSON.stringify(meta) : '';
    return `${timestamp} [${level.toUpperCase()}] ${message} ${metaString}`;
  })
);

// Create logger instance
const logger = winston.createLogger({
  level: config.logging.level,
  format: logFormat,
  defaultMeta: { service: 'websocket-server' },
  transports: [
    // Console transport for all environments
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
    // File transport for production
    ...(config.env === 'production'
      ? [
          new winston.transports.File({
            filename: path.join(__dirname, '../../logs', config.logging.file),
            maxsize: 5242880, // 5MB
            maxFiles: 5,
          }),
          new winston.transports.File({
            filename: path.join(__dirname, '../../logs', 'error.log'),
            level: 'error',
            maxsize: 5242880,
            maxFiles: 5,
          }),
        ]
      : []),
  ],
  exitOnError: false,
});

// Create logs directory if it doesn't exist
const fs = require('fs');
const logDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Log unhandled exceptions and rejections
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Helper methods for different log levels
const log = {
  info: (message, meta = {}) => logger.info(message, meta),
  error: (message, meta = {}) => logger.error(message, meta),
  warn: (message, meta = {}) => logger.warn(message, meta),
  debug: (message, meta = {}) => logger.debug(message, meta),
  verbose: (message, meta = {}) => logger.verbose(message, meta),

  // WebSocket specific logging
  connection: (clientId, meta = {}) =>
    logger.info(`Client connected: ${clientId}`, { clientId, ...meta }),

  disconnection: (clientId, reason, meta = {}) =>
    logger.info(`Client disconnected: ${clientId}`, {
      clientId,
      reason,
      ...meta,
    }),

  message: (clientId, messageType, meta = {}) =>
    logger.debug(`Message from ${clientId}: ${messageType}`, {
      clientId,
      messageType,
      ...meta,
    }),

  broadcast: (room, messageType, clientCount, meta = {}) =>
    logger.debug(
      `Broadcast to room ${room}: ${messageType} (${clientCount} clients)`,
      { room, messageType, clientCount, ...meta }
    ),

  errorWithContext: (context, error, meta = {}) =>
    logger.error(`Error in ${context}:`, {
      context,
      error: error.message,
      stack: error.stack,
      ...meta,
    }),
};

module.exports = log;