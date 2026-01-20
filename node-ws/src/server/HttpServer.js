/**
 * HTTP Server with REST API for WebSocket management
 */

const express = require('express');
const cors = require('cors');
const logger = require('../utils/logger');
const config = require('../config/config');

class HttpServer {
  /**
   * Create HTTP server
   * @param {WebSocketServer} wsServer - WebSocket server instance
   */
  constructor(wsServer) {
    this.app = express();
    this.wsServer = wsServer;
    
    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  /**
   * Setup Express middleware
   */
  setupMiddleware() {
    // CORS configuration
    this.app.use(cors({
      origin: config.corsOrigins,
      credentials: true,
    }));

    // JSON parsing
    this.app.use(express.json({ limit: '1mb' }));
    this.app.use(express.urlencoded({ extended: true }));

    // Request logging
    this.app.use((req, res, next) => {
      logger.info(`${req.method} ${req.path}`, {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        query: req.query,
      });
      next();
    });
  }

  /**
   * Setup REST API routes
   */
  setupRoutes() {
    // Health check endpoint
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        service: 'websocket-server',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
      });
    });

    // Server statistics
    this.app.get('/api/stats', (req, res) => {
      const stats = this.wsServer.getServerStats();
      res.json({
        success: true,
        data: stats,
      });
    });

    // Room statistics
    this.app.get('/api/rooms', (req, res) => {
      const roomStats = this.wsServer.getRoomStats();
      res.json({
        success: true,
        data: roomStats,
      });
    });

    // Client information
    this.app.get('/api/clients/:clientId', (req, res) => {
      const { clientId } = req.params;
      const client = this.wsServer.clients.get(clientId);
      
      if (!client) {
        return res.status(404).json({
          success: false,
          error: 'Client not found',
        });
      }

      res.json({
        success: true,
        data: client.getInfo(),
      });
    });

    // Send message to room (admin only)
    this.app.post('/api/rooms/:roomName/message', (req, res) => {
      const { roomName } = req.params;
      const { message, type = 'admin_message' } = req.body;

      if (!message) {
        return res.status(400).json({
          success: false,
          error: 'Message content required',
        });
      }

      // In production, verify admin authentication here
      const adminMessage = {
        type,
        data: {
          message,
          timestamp: new Date().toISOString(),
          from: 'system',
        },
      };

      this.wsServer.broadcastToRoom(roomName, adminMessage);

      res.json({
        success: true,
        data: {
          room: roomName,
          message: adminMessage,
          sentAt: new Date().toISOString(),
        },
      });
    });

    // Send notification (admin only)
    this.app.post('/api/notify', (req, res) => {
      const { channel, message, data = {} } = req.body;

      if (!channel || !message) {
        return res.status(400).json({
          success: false,
          error: 'Channel and message required',
        });
      }

      const notification = {
        type: 'notification',
        data: {
          channel,
          message,
          ...data,
          timestamp: new Date().toISOString(),
        },
      };

      this.wsServer.broadcastToRoom(`channel:${channel}`, notification);

      logger.info('Admin notification sent via HTTP API', {
        channel,
        message,
      });

      res.json({
        success: true,
        data: {
          notification,
          sentAt: new Date().toISOString(),
        },
      });
    });

    // Simulate vote for testing
    this.app.post('/api/simulate/vote', (req, res) => {
      const voteData = {
        voteId: `vote_${Date.now()}`,
        electionId: req.body.electionId || 'test-election',
        voterId: req.body.voterId || 'test-voter',
        candidateId: req.body.candidateId || 'test-candidate',
        timestamp: new Date().toISOString(),
      };

      this.wsServer.notifyNewVote(voteData);

      res.json({
        success: true,
        data: {
          message: 'Vote simulation sent',
          vote: voteData,
        },
      });
    });

    // Simulate block mined for testing
    this.app.post('/api/simulate/block', (req, res) => {
      const blockData = {
        index: req.body.index || Math.floor(Math.random() * 1000),
        hash: req.body.hash || `0x${Date.now().toString(16)}`,
        transactionCount: req.body.transactionCount || Math.floor(Math.random() * 50),
        miner: req.body.miner || 'test-miner',
        timestamp: new Date().toISOString(),
      };

      this.wsServer.notifyBlockMined(blockData);

      res.json({
        success: true,
        data: {
          message: 'Block simulation sent',
          block: blockData,
        },
      });
    });
  }

  /**
   * Setup error handling middleware
   */
  setupErrorHandling() {
    // 404 handler
    this.app.use((req, res) => {
      res.status(404).json({
        success: false,
        error: 'Endpoint not found',
      });
    });

    // Error handler
    this.app.use((error, req, res, next) => {
      logger.error('HTTP server error:', {
        error: error.message,
        stack: error.stack,
        path: req.path,
        method: req.method,
      });

      res.status(error.status || 500).json({
        success: false,
        error: config.env === 'development' ? error.message : 'Internal server error',
      });
    });
  }

  /**
   * Start HTTP server
   * @returns {Promise} Server start promise
   */
  start() {
    return new Promise((resolve, reject) => {
      this.server = this.app.listen(config.port, config.host, () => {
        logger.info(`HTTP server started on http://${config.host}:${config.port}`, {
          port: config.port,
          host: config.host,
          environment: config.env,
        });
        resolve(this.server);
      });

      this.server.on('error', (error) => {
        logger.error('HTTP server failed to start:', {
          error: error.message,
          port: config.port,
        });
        reject(error);
      });
    });
  }

  /**
   * Stop HTTP server
   * @returns {Promise} Server stop promise
   */
  stop() {
    return new Promise((resolve, reject) => {
      if (this.server) {
        this.server.close((error) => {
          if (error) {
            logger.error('Error stopping HTTP server:', { error: error.message });
            reject(error);
          } else {
            logger.info('HTTP server stopped');
            resolve();
          }
        });
      } else {
        resolve();
      }
    });
  }
}

module.exports = HttpServer;