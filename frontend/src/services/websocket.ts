/**
 * WebSocket Service for Real-time Updates
 */

import {
  WebSocketMessage,
  VoteNotification,
  BlockNotification,
  ElectionResultsNotification,
} from '@/types';

type MessageHandler = (message: WebSocketMessage) => void;
type ConnectionHandler = (connected: boolean) => void;

class WebSocketService {
  private ws: WebSocket | null = null;
  private url: string;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private heartbeatInterval: number | null = null;
  private messageHandlers = new Map<string, MessageHandler[]>();
  private connectionHandlers: ConnectionHandler[] = [];
  private isConnected = false;
  private clientId: string | null = null;

  constructor(url: string) {
    this.url = url;
    this.setupDefaultHandlers();
  }

  private setupDefaultHandlers() {
    this.on('welcome', (message) => {
      this.clientId = message.data.clientId;
      console.log('WebSocket connected with ID:', this.clientId);
    });

    this.on('connected', () => {
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.notifyConnectionChange(true);
      console.log('WebSocket connected');
    });

    this.on('disconnected', () => {
      this.isConnected = false;
      this.notifyConnectionChange(false);
      console.log('WebSocket disconnected');
    });

    this.on('error', (message) => {
      console.error('WebSocket error:', message.data);
    });
  }

  connect(): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      console.warn('WebSocket already connected');
      return;
    }

    console.log('Connecting to WebSocket:', this.url);
    this.ws = new WebSocket(this.url);

    this.ws.onopen = this.handleOpen.bind(this);
    this.ws.onclose = this.handleClose.bind(this);
    this.ws.onerror = this.handleError.bind(this);
    this.ws.onmessage = this.handleMessage.bind(this);
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close(1000, 'Client initiated disconnect');
    }
    this.cleanup();
  }

  private handleOpen(): void {
    console.log('WebSocket connection opened');
    this.startHeartbeat();
  }

  private handleClose(event: CloseEvent): void {
    console.log('WebSocket connection closed:', event.code, event.reason);
    this.cleanup();

    if (event.code !== 1000) {
      this.attemptReconnect();
    }

    this.emit('disconnected', { code: event.code, reason: event.reason });
  }

  private handleError(event: Event): void {
    console.error('WebSocket error:', event);
    this.emit('error', { type: 'connection_error', event });
  }

  private handleMessage(event: MessageEvent): void {
    try {
      const message = JSON.parse(event.data) as WebSocketMessage;
      this.emit(message.type, message);

      // Handle heartbeat pong
      if (message.type === 'pong') {
        this.handlePong();
      }
    } catch (error) {
      console.error('Error parsing WebSocket message:', error, event.data);
    }
  }

  private handlePong(): void {
    // Reset heartbeat timeout
    if (this.heartbeatInterval) {
      clearTimeout(this.heartbeatInterval);
      this.heartbeatInterval = window.setTimeout(() => {
        console.warn('Heartbeat timeout, reconnecting...');
        this.reconnect();
      }, 60000); // 60 second timeout
    }
  }

  private startHeartbeat(): void {
    // Send ping every 30 seconds
    setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.send({ type: 'ping' });
      }
    }, 30000);

    // Set initial heartbeat timeout
    this.heartbeatInterval = window.setTimeout(() => {
      console.warn('Heartbeat timeout, reconnecting...');
      this.reconnect();
    }, 60000);
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    console.log(`Attempting reconnect ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${delay}ms`);

    setTimeout(() => {
      this.connect();
    }, delay);
  }

  reconnect(): void {
    this.disconnect();
    this.connect();
  }

  private cleanup(): void {
    if (this.heartbeatInterval) {
      clearTimeout(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    this.isConnected = false;
  }

  send(message: any): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket not connected, cannot send message:', message);
    }
  }

  authenticate(token: string): void {
    this.send({
      type: 'authenticate',
      data: { token },
    });
  }

  joinRoom(room: string): void {
    this.send({
      type: 'join',
      data: { room },
    });
  }

  leaveRoom(room: string): void {
    this.send({
      type: 'leave',
      data: { room },
    });
  }

  subscribe(channel: string): void {
    this.send({
      type: 'subscribe',
      data: { channel },
    });
  }

  unsubscribe(channel: string): void {
    this.send({
      type: 'unsubscribe',
      data: { channel },
    });
  }

  on(event: string, handler: MessageHandler): () => void {
    if (!this.messageHandlers.has(event)) {
      this.messageHandlers.set(event, []);
    }
    this.messageHandlers.get(event)!.push(handler);

    // Return unsubscribe function
    return () => {
      const handlers = this.messageHandlers.get(event);
      if (handlers) {
        const index = handlers.indexOf(handler);
        if (index > -1) {
          handlers.splice(index, 1);
        }
      }
    };
  }

  onVoteCast(handler: (notification: VoteNotification) => void): () => void {
    return this.on('vote_cast', (message) => {
      handler(message.data as VoteNotification);
    });
  }

  onBlockMined(handler: (notification: BlockNotification) => void): () => void {
    return this.on('block_mined', (message) => {
      handler(message.data as BlockNotification);
    });
  }

  onElectionResults(handler: (notification: ElectionResultsNotification) => void): () => void {
    return this.on('election_results', (message) => {
      handler(message.data as ElectionResultsNotification);
    });
  }

  onConnectionChange(handler: ConnectionHandler): () => void {
    this.connectionHandlers.push(handler);
    return () => {
      const index = this.connectionHandlers.indexOf(handler);
      if (index > -1) {
        this.connectionHandlers.splice(index, 1);
      }
    };
  }

  private emit(event: string, message: WebSocketMessage): void {
    const handlers = this.messageHandlers.get(event);
    if (handlers) {
      handlers.forEach((handler) => {
        try {
          handler(message);
        } catch (error) {
          console.error(`Error in handler for event ${event}:`, error);
        }
      });
    }
  }

  private notifyConnectionChange(connected: boolean): void {
    this.connectionHandlers.forEach((handler) => {
      try {
        handler(connected);
      } catch (error) {
        console.error('Error in connection handler:', error);
      }
    });
  }

  getStatus() {
    return {
      connected: this.isConnected,
      clientId: this.clientId,
      reconnectAttempts: this.reconnectAttempts,
      url: this.url,
    };
  }
}

// Singleton instance
export const websocket = new WebSocketService(`ws://${window.location.hostname}:3001/ws`);
export default WebSocketService;