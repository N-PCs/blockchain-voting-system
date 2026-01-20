/**
 * Main WebSocket Server Class
 * Manages client connections, rooms, and broadcasting
 */

const WebSocket = require('ws');
const WebSocketClient = require('../utils/WebSocketClient');
const logger = require('../utils/logger');
const config = require('../config/config');

class WebSocketServer {
  /**
   * Create a new WebSocket server
   * @param {http.Server} httpServer - HTTP server instance
   */
  constructor(httpServer) {
    this.wss = new WebSocket.Server({
      server: httpServer,
      path: config.wsPath,
      clientTracking: true,
      maxPayload: 1048576, // 1MB max message size
    });

    this.clients = new Map(); // clientId -> WebSocketClient
    this.rooms = new Map(); // roomName -> Set of clientIds
    this.stats = {
      totalConnections: 0,
      currentConnections: 0,
      totalMessages: 0,
      roomsCreated: 0,
      startTime: Date.now(),
    };

    this.setupEventListeners();
    this.startStatsLogger();
    this.startBlockchainPolling();

    logger.info('WebSocket server initialized', {
      port: config.port,
      path: config.wsPath,
      maxClientsPerRoom: config.ws.rooms.maxClientsPerRoom,
    });
  }

  /**
   * Setup WebSocket server event listeners
   */
  setupEventListeners() {
    this.wss.on('connection', (ws, request) => this.handleConnection(ws, request));
    this.wss.on('error', (error) => this.handleServerError(error));
    this.wss.on('close', () => this.handleServerClose());
  }

  /**
   * Handle new WebSocket connection
   * @param {WebSocket} ws - WebSocket connection
   * @param {http.IncomingMessage} request - HTTP request
   */
  handleConnection(ws, request) {
    // Rate limiting check
    if (!this.checkRateLimit(request)) {
      logger.warn('Rate limit exceeded for connection attempt', {
        ip: request.socket.remoteAddress,
      });
      ws.close(1008, 'Rate limit exceeded');
      return;
    }

    // Create new client
    const client = new WebSocketClient(ws, request);
    this.clients.set(client.id, client);

    // Update stats
    this.stats.totalConnections++;
    this.stats.currentConnections++;

    // Send connection success message
    client.send({
      type: 'connected',
      data: {
        clientId: client.id,
        serverTime: new Date().toISOString(),
        totalConnections: this.stats.currentConnections,
      },
    });
  }

  /**
   * Check rate limiting for new connections
   * @param {http.IncomingMessage} request - HTTP request
   * @returns {boolean} True if allowed
   */
  checkRateLimit(request) {
    // Simple IP-based rate limiting
    const ip = request.socket.remoteAddress;
    const connectionsFromIP = Array.from(this.clients.values()).filter(
      (client) => client.ipAddress === ip
    ).length;

    return connectionsFromIP < config.rateLimit.maxConnections;
  }

  /**
   * Broadcast message to all connected clients
   * @param {object} message - Message to broadcast
   * @param {string} excludeClientId - Client ID to exclude
   */
  broadcast(message, excludeClientId = null) {
    const messageString = JSON.stringify(message);
    let count = 0;

    this.wss.clients.forEach((client) => {
      if (
        client.readyState === WebSocket.OPEN &&
        (!excludeClientId || client.id !== excludeClientId)
      ) {
        client.send(messageString);
        count++;
      }
    });

    logger.broadcast('*', message.type || 'broadcast', count);
    this.stats.totalMessages++;
  }

  /**
   * Broadcast message to specific room
   * @param {string} roomName - Room name
   * @param {object} message - Message to broadcast
   * @param {string} excludeClientId - Client ID to exclude
   */
  broadcastToRoom(roomName, message, excludeClientId = null) {
    const roomClients = this.rooms.get(roomName);
    if (!roomClients || roomClients.size === 0) {
      return;
    }

    const messageString = JSON.stringify(message);
    let count = 0;

    roomClients.forEach((clientId) => {
      if (clientId === excludeClientId) return;

      const client = this.clients.get(clientId);
      if (client && client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(messageString);
        count++;
      }
    });

    logger.broadcast(roomName, message.type || 'room_broadcast', count);
    this.stats.totalMessages++;
  }

  /**
   * Add client to room
   * @param {string} clientId - Client ID
   * @param {string} roomName - Room name
   * @returns {boolean} Success status
   */
  addClientToRoom(clientId, roomName) {
    // Validate room name
    if (!this.isValidRoomName(roomName)) {
      logger.error(`Invalid room name: ${roomName}`);
      return false;
    }

    // Check if room exists, create if not
    if (!this.rooms.has(roomName)) {
      this.rooms.set(roomName, new Set());
      this.stats.roomsCreated++;
    }

    const room = this.rooms.get(roomName);

    // Check room capacity
    if (room.size >= config.ws.rooms.maxClientsPerRoom) {
      logger.warn(`Room ${roomName} is at capacity`, {
        roomName,
        currentSize: room.size,
        maxCapacity: config.ws.rooms.maxClientsPerRoom,
      });
      return false;
    }

    // Add client to room
    room.add(clientId);

    // Update client's room list
    const client = this.clients.get(clientId);
    if (client) {
      client.rooms.add(roomName);
    }

    logger.info(`Client ${clientId} added to room ${roomName}`, {
      clientId,
      roomName,
      roomSize: room.size,
    });

    return true;
  }

  /**
   * Remove client from room
   * @param {string} clientId - Client ID
   * @param {string} roomName - Room name
   */
  removeClientFromRoom(clientId, roomName) {
    const room = this.rooms.get(roomName);
    if (room) {
      room.delete(clientId);

      // Remove room if empty
      if (room.size === 0) {
        this.rooms.delete(roomName);
      }

      // Update client's room list
      const client = this.clients.get(clientId);
      if (client) {
        client.rooms.delete(roomName);
      }

      logger.info(`Client ${clientId} removed from room ${roomName}`, {
        clientId,
        roomName,
      });
    }
  }

  /**
   * Remove client from all rooms
   * @param {string} clientId - Client ID
   */
  removeClientFromAllRooms(clientId) {
    const client = this.clients.get(clientId);
    if (client) {
      client.rooms.forEach((roomName) => {
        this.removeClientFromRoom(clientId, roomName);
      });
    }
  }

  /**
   * Validate room name
   * @param {string} roomName - Room name to validate
   * @returns {boolean} True if valid
   */
  isValidRoomName(roomName) {
    // Basic validation: alphanumeric, underscores, hyphens
    const validRoomRegex = /^[a-zA-Z0-9_-]+$/;
    return validRoomRegex.test(roomName) && roomName.length <= 100;
  }

  /**
   * Get list of clients in a room
   * @param {string} roomName - Room name
   * @returns {Array} Array of client info
   */
  getClientsInRoom(roomName) {
    const room = this.rooms.get(roomName);
    if (!room) {
      return [];
    }

    return Array.from(room)
      .map((clientId) => {
        const client = this.clients.get(clientId);
        return client ? client.getInfo() : null;
      })
      .filter(Boolean);
  }

  /**
   * Get all rooms and their client counts
   * @returns {object} Room statistics
   */
  getRoomStats() {
    const stats = {};
    this.rooms.forEach((clients, roomName) => {
      stats[roomName] = {
        clientCount: clients.size,
        clients: Array.from(clients),
      };
    });
    return stats;
  }

  /**
   * Get server statistics
   * @returns {object} Server statistics
   */
  getServerStats() {
    return {
      ...this.stats,
      uptime: Date.now() - this.stats.startTime,
      clientCount: this.clients.size,
      roomCount: this.rooms.size,
      memoryUsage: process.memoryUsage(),
    };
  }

  /**
   * Start periodic stats logging
   */
  startStatsLogger() {
    setInterval(() => {
      const stats = this.getServerStats();
      logger.info('WebSocket server statistics', stats);
    }, 60000); // Log every minute
  }

  /**
   * Start blockchain polling for updates
   */
  startBlockchainPolling() {
    setInterval(async () => {
      try {
        await this.pollBlockchainUpdates();
      } catch (error) {
        logger.error('Blockchain polling error:', { error: error.message });
      }
    }, config.services.blockchain.pollInterval);
  }

  /**
   * Poll blockchain for updates and notify clients
   */
  async pollBlockchainUpdates() {
    // This would make HTTP requests to the Python blockchain service
    // For now, we'll simulate updates
    const update = {
      type: 'blockchain_update',
      data: {
        timestamp: new Date().toISOString(),
        blockCount: Math.floor(Math.random() * 100),
        pendingTransactions: Math.floor(Math.random() * 50),
        message: 'Blockchain status update',
      },
    };

    // Broadcast to blockchain channel
    this.broadcastToRoom('channel:blockchain', update);
  }

  /**
   * Handle server error
   * @param {Error} error - Error object
   */
  handleServerError(error) {
    logger.error('WebSocket server error:', {
      error: error.message,
      stack: error.stack,
    });
  }

  /**
   * Handle server close
   */
  handleServerClose() {
    logger.info('WebSocket server closing', {
      uptime: Date.now() - this.stats.startTime,
      totalConnections: this.stats.totalConnections,
    });

    // Clean up all clients
    this.clients.forEach((client) => {
      client.terminate();
    });
    this.clients.clear();
    this.rooms.clear();
  }

  /**
   * Notify about new vote
   * @param {object} voteData - Vote data
   */
  notifyNewVote(voteData) {
    const message = {
      type: 'vote_cast',
      data: {
        ...voteData,
        timestamp: new Date().toISOString(),
      },
    };

    // Broadcast to votes channel
    this.broadcastToRoom('channel:votes', message);

    // Also broadcast to specific election room
    if (voteData.electionId) {
      const electionRoom = `election:${voteData.electionId}`;
      this.broadcastToRoom(electionRoom, message);
    }

    logger.info('New vote notification sent', {
      voteId: voteData.voteId,
      electionId: voteData.electionId,
    });
  }

  /**
   * Notify about blockchain block mined
   * @param {object} blockData - Block data
   */
  notifyBlockMined(blockData) {
    const message = {
      type: 'block_mined',
      data: {
        ...blockData,
        timestamp: new Date().toISOString(),
      },
    };

    // Broadcast to blockchain channel
    this.broadcastToRoom('channel:blockchain', message);

    logger.info('Block mined notification sent', {
      blockIndex: blockData.index,
      transactionCount: blockData.transactionCount,
    });
  }

  /**
   * Notify about election results update
   * @param {object} resultsData - Election results
   */
  notifyElectionResults(resultsData) {
    const message = {
      type: 'election_results',
      data: {
        ...resultsData,
        timestamp: new Date().toISOString(),
      },
    };

    // Broadcast to elections channel
    this.broadcastToRoom('channel:elections', message);

    // Broadcast to specific election room
    if (resultsData.electionId) {
      const electionRoom = `election:${resultsData.electionId}`;
      this.broadcastToRoom(electionRoom, message);
    }

    logger.info('Election results update sent', {
      electionId: resultsData.electionId,
      candidateCount: resultsData.candidates?.length || 0,
    });
  }

  /**
   * Send admin notification
   * @param {object} notificationData - Notification data
   */
  sendAdminNotification(notificationData) {
    const message = {
      type: 'admin_notification',
      data: {
        ...notificationData,
        timestamp: new Date().toISOString(),
      },
    };

    // Broadcast to admin channel
    this.broadcastToRoom('channel:admin', message);

    logger.info('Admin notification sent', {
      type: notificationData.type,
      message: notificationData.message,
    });
  }
}

module.exports = WebSocketServer;