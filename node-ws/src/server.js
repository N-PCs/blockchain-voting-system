/**
 * Main entry point for WebSocket Server
 */

const http = require('http');
const logger = require('./utils/logger');
const config = require('./config/config');
const HttpServer = require('./server/HttpServer');
const WebSocketServer = require('./server/WebSocketServer');

class VotingWebSocketServer {
  constructor() {
    this.httpServer = null;
    this.wsServer = null;
    this.httpApp = null;
    
    this.setupGracefulShutdown();
  }

  /**
   * Start the WebSocket server
   */
  async start() {
    try {
      logger.info('Starting Voting System WebSocket Server...', {
        version: '1.0.0',
        environment: config.env,
        nodeVersion: process.version,
      });

      // Create HTTP server
      const http = require('http');
      this.httpApp = require('express')();
      this.httpServer = http.createServer(this.httpApp);

      // Create WebSocket server
      this.wsServer = new WebSocketServer(this.httpServer);

      // Create HTTP server with REST API
      this.httpAppServer = new HttpServer(this.wsServer);
      this.httpApp = this.httpAppServer.app;

      // Attach HTTP app to server
      this.httpServer.on('request', this.httpApp);

      // Start HTTP server
      await this.httpAppServer.start();

      logger.info('WebSocket server started successfully', {
        port: config.port,
        wsPath: config.wsPath,
        corsOrigins: config.corsOrigins,
      });

      // Log server statistics periodically
      setInterval(() => {
        const stats = this.wsServer.getServerStats();
        logger.info('Server status', {
          clients: stats.clientCount,
          rooms: stats.roomCount,
          uptime: Math.floor(stats.uptime / 1000),
          memory: Math.round(stats.memoryUsage.heapUsed / 1024 / 1024) + 'MB',
        });
      }, 30000); // Every 30 seconds

    } catch (error) {
      logger.error('Failed to start WebSocket server:', {
        error: error.message,
        stack: error.stack,
      });
      process.exit(1);
    }
  }

  /**
   * Stop the WebSocket server
   */
  async stop() {
    logger.info('Stopping WebSocket server...');

    try {
      if (this.httpAppServer) {
        await this.httpAppServer.stop();
      }

      if (this.wsServer) {
        this.wsServer.handleServerClose();
      }

      logger.info('WebSocket server stopped successfully');
    } catch (error) {
      logger.error('Error stopping WebSocket server:', { error: error.message });
    }
  }

  /**
   * Setup graceful shutdown handlers
   */
  setupGracefulShutdown() {
    const shutdown = async (signal) => {
      logger.info(`Received ${signal}, starting graceful shutdown...`);
      
      // Give connections time to close gracefully
      setTimeout(async () => {
        await this.stop();
        process.exit(0);
      }, 5000);
    };

    // Handle different shutdown signals
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGUSR2', () => shutdown('SIGUSR2')); // For nodemon

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught exception:', {
        error: error.message,
        stack: error.stack,
      });
      shutdown('UNCAUGHT_EXCEPTION');
    });

    // Handle unhandled rejections
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled rejection at:', {
        promise,
        reason,
      });
      shutdown('UNHANDLED_REJECTION');
    });
  }

  /**
   * Get server instance for testing
   */
  getServer() {
    return {
      httpServer: this.httpServer,
      wsServer: this.wsServer,
      httpApp: this.httpApp,
    };
  }
}

// Create and start server if this is the main module
if (require.main === module) {
  const server = new VotingWebSocketServer();
  server.start();
}

module.exports = VotingWebSocketServer;