/**
 * WebSocket Server Configuration
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const config = {
  // Server configuration
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3001'),
  host: process.env.HOST || '0.0.0.0',
  wsPath: process.env.WS_PATH || '/ws',

  // Security
  jwtSecret: process.env.JWT_SECRET || 'dev-jwt-secret',
  corsOrigins: process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',')
    : ['http://localhost:3000', 'http://localhost:8000'],

  // Rate limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
    maxConnections: parseInt(process.env.RATE_LIMIT_MAX_CONNECTIONS || '100'),
  },

  // Redis configuration
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    useRedis: process.env.USE_REDIS === 'true',
  },

  // External services
  services: {
    blockchain: {
      url: process.env.BLOCKCHAIN_API_URL || 'http://localhost:5000',
      pollInterval: parseInt(process.env.BLOCKCHAIN_POLL_INTERVAL || '10000'),
    },
    phpApi: {
      url: process.env.PHP_API_URL || 'http://localhost:8000/api/v1',
    },
  },

  // WebSocket settings
  ws: {
    heartbeat: {
      interval: parseInt(process.env.HEARTBEAT_INTERVAL || '30000'),
      timeout: parseInt(process.env.HEARTBEAT_TIMEOUT || '60000'),
    },
    rooms: {
      maxClientsPerRoom: parseInt(process.env.MAX_CLIENTS_PER_ROOM || '1000'),
      maxRooms: parseInt(process.env.MAX_ROOMS || '100'),
    },
    reconnect: {
      maxAttempts: 5,
      initialDelay: 1000,
      maxDelay: 30000,
    },
  },

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    file: process.env.LOG_FILE || 'websocket.log',
  },
};

// Validate configuration
const validateConfig = () => {
  const required = ['jwtSecret'];
  const missing = required.filter((key) => !config[key]);

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  if (config.port < 1 || config.port > 65535) {
    throw new Error(`Invalid port number: ${config.port}`);
  }

  return true;
};

// Validate on load
try {
  validateConfig();
  console.log('Configuration loaded successfully');
} catch (error) {
  console.error('Configuration validation failed:', error.message);
  process.exit(1);
}

module.exports = config;