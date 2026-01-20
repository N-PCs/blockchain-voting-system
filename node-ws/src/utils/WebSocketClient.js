/**
 * WebSocket Client Class
 * Manages individual client connections with heartbeat and reconnection
 */

const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');
const logger = require('./logger');
const config = require('../config/config');

class WebSocketClient {
  /**
   * Create a new WebSocket client
   * @param {WebSocket} ws - WebSocket connection
   * @param {http.IncomingMessage} request - HTTP request
   */
  constructor(ws, request) {
    this.id = uuidv4();
    this.ws = ws;
    this.request = request;
    this.authenticated = false;
    this.userId = null;
    this.userRole = null;
    this.rooms = new Set();
    this.ipAddress = this.getClientIP();
    this.userAgent = request.headers['user-agent'] || 'unknown';
    this.connectedAt = Date.now();
    this.lastHeartbeat = Date.now();
    this.heartbeatInterval = null;
    this.reconnectAttempts = 0;
    this.isAlive = true;

    this.setupEventListeners();
    this.startHeartbeat();
    this.sendWelcomeMessage();

    logger.connection(this.id, {
      ip: this.ipAddress,
      userAgent: this.userAgent,
    });
  }

  /**
   * Get client IP address
   * @returns {string} IP address
   */
  getClientIP() {
    const forwardedFor = this.request.headers['x-forwarded-for'];
    if (forwardedFor) {
      return forwardedFor.split(',')[0].trim();
    }
    return this.request.socket.remoteAddress;
  }

  /**
   * Setup WebSocket event listeners
   */
  setupEventListeners() {
    this.ws.on('message', (data) => this.handleMessage(data));
    this.ws.on('close', (code, reason) => this.handleClose(code, reason));
    this.ws.on('error', (error) => this.handleError(error));
    this.ws.on('pong', () => this.handlePong());
  }

  /**
   * Start heartbeat mechanism
   */
  startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      if (!this.isAlive) {
        logger.warn(`Client ${this.id} heartbeat failed, terminating`);
        return this.terminate();
      }

      this.isAlive = false;
      this.ws.ping();

      // Check if heartbeat timeout exceeded
      const timeSinceLastHeartbeat = Date.now() - this.lastHeartbeat;
      if (timeSinceLastHeartbeat > config.ws.heartbeat.timeout) {
        logger.warn(`Client ${this.id} heartbeat timeout`);
        this.terminate();
      }
    }, config.ws.heartbeat.interval);
  }

  /**
   * Handle pong from client
   */
  handlePong() {
    this.isAlive = true;
    this.lastHeartbeat = Date.now();
  }

  /**
   * Send welcome message to client
   */
  sendWelcomeMessage() {
    this.send({
      type: 'welcome',
      data: {
        clientId: this.id,
        serverTime: new Date().toISOString(),
        heartbeatInterval: config.ws.heartbeat.interval,
        maxReconnectAttempts: config.ws.reconnect.maxAttempts,
      },
    });
  }

  /**
   * Handle incoming message
   * @param {string|Buffer} data - Message data
   */
  handleMessage(data) {
    try {
      const message = JSON.parse(data.toString());
      logger.message(this.id, message.type || 'unknown', { message });

      // Route message based on type
      this.routeMessage(message);
    } catch (error) {
      logger.error(`Error parsing message from client ${this.id}:`, {
        error: error.message,
        data: data.toString(),
      });

      this.sendError('Invalid message format');
    }
  }

  /**
   * Route message to appropriate handler
   * @param {object} message - Message object
   */
  routeMessage(message) {
    const handlers = {
      authenticate: this.handleAuthentication.bind(this),
      join: this.handleJoin.bind(this),
      leave: this.handleLeave.bind(this),
      subscribe: this.handleSubscribe.bind(this),
      unsubscribe: this.handleUnsubscribe.bind(this),
      ping: this.handlePing.bind(this),
    };

    const handler = handlers[message.type];
    if (handler) {
      handler(message);
    } else {
      this.sendError(`Unknown message type: ${message.type}`);
    }
  }

  /**
   * Handle authentication message
   * @param {object} message - Authentication message
   */
  handleAuthentication(message) {
    try {
      const { token } = message.data || {};

      if (!token) {
        throw new Error('Authentication token required');
      }

      // In production, verify JWT token
      // For now, simple token validation
      if (token === 'admin-token' || token.startsWith('user-')) {
        this.authenticated = true;
        this.userId = token;
        this.userRole = token === 'admin-token' ? 'admin' : 'user';

        logger.info(`Client ${this.id} authenticated as ${this.userId}`, {
          userId: this.userId,
          role: this.userRole,
        });

        this.send({
          type: 'authenticated',
          data: {
            userId: this.userId,
            role: this.userRole,
            authenticatedAt: new Date().toISOString(),
          },
        });
      } else {
        throw new Error('Invalid authentication token');
      }
    } catch (error) {
      logger.error(`Authentication failed for client ${this.id}:`, {
        error: error.message,
      });

      this.sendError(`Authentication failed: ${error.message}`);
    }
  }

  /**
   * Handle join room message
   * @param {object} message - Join message
   */
  handleJoin(message) {
    if (!this.authenticated) {
      return this.sendError('Authentication required to join rooms');
    }

    const { room } = message.data || {};
    if (!room) {
      return this.sendError('Room name required');
    }

    // Validate room name format
    const validRoomRegex = /^[a-zA-Z0-9_-]+$/;
    if (!validRoomRegex.test(room)) {
      return this.sendError('Invalid room name format');
    }

    // Check room limit
    if (this.rooms.size >= 10) {
      return this.sendError('Maximum room limit reached (10 rooms)');
    }

    this.rooms.add(room);
    logger.info(`Client ${this.id} joined room ${room}`, {
      userId: this.userId,
      room,
    });

    this.send({
      type: 'joined',
      data: {
        room,
        joinedAt: new Date().toISOString(),
        currentRooms: Array.from(this.rooms),
      },
    });
  }

  /**
   * Handle leave room message
   * @param {object} message - Leave message
   */
  handleLeave(message) {
    const { room } = message.data || {};
    if (!room) {
      return this.sendError('Room name required');
    }

    if (this.rooms.has(room)) {
      this.rooms.delete(room);
      logger.info(`Client ${this.id} left room ${room}`, {
        userId: this.userId,
        room,
      });

      this.send({
        type: 'left',
        data: {
          room,
          leftAt: new Date().toISOString(),
          currentRooms: Array.from(this.rooms),
        },
      });
    }
  }

  /**
   * Handle subscription message
   * @param {object} message - Subscribe message
   */
  handleSubscribe(message) {
    if (!this.authenticated) {
      return this.sendError('Authentication required to subscribe');
    }

    const { channel } = message.data || {};
    if (!channel) {
      return this.sendError('Channel name required');
    }

    // Validate subscription based on user role
    const allowedChannels = this.getAllowedChannels();
    if (!allowedChannels.includes(channel)) {
      return this.sendError(`Not authorized to subscribe to ${channel}`);
    }

    // Add to rooms based on channel
    const channelRoom = `channel:${channel}`;
    this.rooms.add(channelRoom);

    this.send({
      type: 'subscribed',
      data: {
        channel,
        subscribedAt: new Date().toISOString(),
      },
    });
  }

  /**
   * Handle unsubscription message
   * @param {object} message - Unsubscribe message
   */
  handleUnsubscribe(message) {
    const { channel } = message.data || {};
    if (!channel) {
      return this.sendError('Channel name required');
    }

    const channelRoom = `channel:${channel}`;
    if (this.rooms.has(channelRoom)) {
      this.rooms.delete(channelRoom);

      this.send({
        type: 'unsubscribed',
        data: {
          channel,
          unsubscribedAt: new Date().toISOString(),
        },
      });
    }
  }

  /**
   * Handle ping message
   */
  handlePing() {
    this.send({
      type: 'pong',
      data: {
        serverTime: new Date().toISOString(),
      },
    });
  }

  /**
   * Get allowed channels based on user role
   * @returns {string[]} Array of allowed channel names
   */
  getAllowedChannels() {
    const baseChannels = ['votes', 'blockchain', 'elections'];

    if (this.userRole === 'admin') {
      return [...baseChannels, 'admin', 'audit', 'notifications'];
    }

    return baseChannels;
  }

  /**
   * Send message to client
   * @param {object} message - Message object
   */
  send(message) {
    if (this.ws.readyState === WebSocket.OPEN) {
      try {
        const messageString = JSON.stringify(message);
        this.ws.send(messageString);
      } catch (error) {
        logger.error(`Error sending message to client ${this.id}:`, {
          error: error.message,
          message,
        });
      }
    }
  }

  /**
   * Send error message to client
   * @param {string} errorMessage - Error message
   * @param {string} code - Error code
   */
  sendError(errorMessage, code = 'ERROR') {
    this.send({
      type: 'error',
      data: {
        code,
        message: errorMessage,
        timestamp: new Date().toISOString(),
      },
    });
  }

  /**
   * Broadcast message to all rooms client is in
   * @param {object} message - Message to broadcast
   * @param {WebSocketServer} wss - WebSocket server instance
   */
  broadcastToRooms(message, wss) {
    this.rooms.forEach((room) => {
      wss.broadcastToRoom(room, message, this.id);
    });
  }

  /**
   * Handle WebSocket close
   * @param {number} code - Close code
   * @param {string} reason - Close reason
   */
  handleClose(code, reason) {
    clearInterval(this.heartbeatInterval);
    logger.disconnection(this.id, reason || 'Unknown reason', {
      code,
      duration: Date.now() - this.connectedAt,
      rooms: Array.from(this.rooms),
      authenticated: this.authenticated,
    });
  }

  /**
   * Handle WebSocket error
   * @param {Error} error - Error object
   */
  handleError(error) {
    logger.error(`WebSocket error for client ${this.id}:`, {
      error: error.message,
      stack: error.stack,
    });
  }

  /**
   * Terminate connection
   */
  terminate() {
    clearInterval(this.heartbeatInterval);
    if (this.ws.readyState === WebSocket.OPEN) {
      this.ws.terminate();
    }
  }

  /**
   * Get client information
   * @returns {object} Client information
   */
  getInfo() {
    return {
      id: this.id,
      authenticated: this.authenticated,
      userId: this.userId,
      userRole: this.userRole,
      ipAddress: this.ipAddress,
      connectedAt: new Date(this.connectedAt).toISOString(),
      duration: Date.now() - this.connectedAt,
      rooms: Array.from(this.rooms),
      isAlive: this.isAlive,
      lastHeartbeat: new Date(this.lastHeartbeat).toISOString(),
    };
  }
}

module.exports = WebSocketClient;