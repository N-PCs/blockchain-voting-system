/**
 * React WebSocket Client for Voting System
 */

class VotingWebSocketClient {
  constructor(options = {}) {
    this.options = {
      url: options.url || 'ws://localhost:3001/ws',
      reconnect: options.reconnect !== false,
      maxReconnectAttempts: options.maxReconnectAttempts || 5,
      reconnectDelay: options.reconnectDelay || 1000,
      heartbeatInterval: options.heartbeatInterval || 30000,
      ...options,
    };

    this.ws = null;
    this.clientId = null;
    this.reconnectAttempts = 0;
    this.reconnectTimeout = null;
    this.heartbeatInterval = null;
    this.isConnected = false;
    this.subscriptions = new Map();
    this.messageHandlers = new Map();
    this.connectCallbacks = [];

    this.setupDefaultHandlers();
  }

  setupDefaultHandlers() {
    // Default message handlers
    this.on('welcome', (data) => {
      this.clientId = data.clientId;
      console.log('WebSocket connected with ID:', this.clientId);
    });

    this.on('connected', (data) => {
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.notifyConnectCallbacks(true);
      console.log('WebSocket connection established');
    });

    this.on('disconnected', () => {
      this.isConnected = false;
      this.notifyConnectCallbacks(false);
      this.handleDisconnection();
    });

    this.on('error', (data) => {
      console.error('WebSocket error:', data);
    });

    this.on('vote_cast', (data) => {
      console.log('New vote cast:', data);
      this.notifySubscribers('votes', data);
    });

    this.on('block_mined', (data) => {
      console.log('Block mined:', data);
      this.notifySubscribers('blockchain', data);
    });

    this.on('election_results', (data) => {
      console.log('Election results updated:', data);
      this.notifySubscribers('elections', data);
    });
  }

  connect() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      console.warn('WebSocket already connected');
      return;
    }

    console.log('Connecting to WebSocket:', this.options.url);
    this.ws = new WebSocket(this.options.url);

    this.ws.onopen = this.handleOpen.bind(this);
    this.ws.onclose = this.handleClose.bind(this);
    this.ws.onerror = this.handleError.bind(this);
    this.ws.onmessage = this.handleMessage.bind(this);
  }

  disconnect() {
    if (this.ws) {
      this.ws.close(1000, 'Client initiated disconnect');
    }
    this.cleanup();
  }

  handleOpen() {
    console.log('WebSocket connection opened');
    this.startHeartbeat();
  }

  handleClose(event) {
    console.log('WebSocket connection closed:', event.code, event.reason);
    this.cleanup();

    if (event.code !== 1000 && this.options.reconnect) {
      this.attemptReconnect();
    }

    this.emit('disconnected', { code: event.code, reason: event.reason });
  }

  handleError(event) {
    console.error('WebSocket error:', event);
    this.emit('error', { type: 'connection_error', error: event });
  }

  handleMessage(event) {
    try {
      const message = JSON.parse(event.data);
      this.emit(message.type, message.data);

      // Handle heartbeat pong
      if (message.type === 'pong') {
        this.handlePong();
      }
    } catch (error) {
      console.error('Error parsing WebSocket message:', error, event.data);
    }
  }

  handlePong() {
    // Reset heartbeat timeout
    if (this.heartbeatInterval) {
      clearTimeout(this.heartbeatTimeout);
      this.heartbeatTimeout = setTimeout(() => {
        console.warn('Heartbeat timeout, reconnecting...');
        this.reconnect();
      }, this.options.heartbeatInterval * 2);
    }
  }

  startHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    this.heartbeatInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.send({ type: 'ping' });
      }
    }, this.options.heartbeatInterval);
  }

  attemptReconnect() {
    if (this.reconnectAttempts >= this.options.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.options.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    console.log(`Attempting reconnect ${this.reconnectAttempts}/${this.options.maxReconnectAttempts} in ${delay}ms`);

    this.reconnectTimeout = setTimeout(() => {
      this.connect();
    }, delay);
  }

  reconnect() {
    this.disconnect();
    this.connect();
  }

  cleanup() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }

    if (this.heartbeatTimeout) {
      clearTimeout(this.heartbeatTimeout);
      this.heartbeatTimeout = null;
    }

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    this.isConnected = false;
  }

  send(message) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket not connected, cannot send message:', message);
    }
  }

  authenticate(token) {
    this.send({
      type: 'authenticate',
      data: { token },
    });
  }

  joinRoom(room) {
    this.send({
      type: 'join',
      data: { room },
    });
  }

  leaveRoom(room) {
    this.send({
      type: 'leave',
      data: { room },
    });
  }

  subscribe(channel) {
    this.send({
      type: 'subscribe',
      data: { channel },
    });

    if (!this.subscriptions.has(channel)) {
      this.subscriptions.set(channel, new Set());
    }
  }

  unsubscribe(channel) {
    this.send({
      type: 'unsubscribe',
      data: { channel },
    });

    this.subscriptions.delete(channel);
  }

  on(event, handler) {
    if (!this.messageHandlers.has(event)) {
      this.messageHandlers.set(event, new Set());
    }
    this.messageHandlers.get(event).add(handler);
  }

  off(event, handler) {
    if (this.messageHandlers.has(event)) {
      this.messageHandlers.get(event).delete(handler);
    }
  }

  emit(event, data) {
    if (this.messageHandlers.has(event)) {
      this.messageHandlers.get(event).forEach((handler) => {
        try {
          handler(data);
        } catch (error) {
          console.error(`Error in handler for event ${event}:`, error);
        }
      });
    }
  }

  notifySubscribers(channel, data) {
    if (this.subscriptions.has(channel)) {
      this.subscriptions.get(channel).forEach((callback) => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in subscription callback for channel ${channel}:`, error);
        }
      });
    }
  }

  subscribeToChannel(channel, callback) {
    this.subscribe(channel);

    if (!this.subscriptions.has(channel)) {
      this.subscriptions.set(channel, new Set());
    }
    this.subscriptions.get(channel).add(callback);

    // Return unsubscribe function
    return () => {
      if (this.subscriptions.has(channel)) {
        this.subscriptions.get(channel).delete(callback);
        if (this.subscriptions.get(channel).size === 0) {
          this.unsubscribe(channel);
        }
      }
    };
  }

  onConnect(callback) {
    this.connectCallbacks.push(callback);
    return () => {
      const index = this.connectCallbacks.indexOf(callback);
      if (index > -1) {
        this.connectCallbacks.splice(index, 1);
      }
    };
  }

  notifyConnectCallbacks(connected) {
    this.connectCallbacks.forEach((callback) => {
      try {
        callback(connected);
      } catch (error) {
        console.error('Error in connection callback:', error);
      }
    });
  }

  getStatus() {
    return {
      connected: this.isConnected,
      clientId: this.clientId,
      reconnectAttempts: this.reconnectAttempts,
      url: this.options.url,
    };
  }
}

// Singleton instance for React app
let wsClientInstance = null;

export const getWebSocketClient = (options) => {
  if (!wsClientInstance) {
    wsClientInstance = new VotingWebSocketClient(options);
  }
  return wsClientInstance;
};

export default VotingWebSocketClient;