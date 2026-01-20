import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from './useAuth';
import { toast } from 'react-toastify';

interface WebSocketMessage {
  type: string;
  data: any;
  timestamp: number;
}

export const useWebSocket = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const [notifications, setNotifications] = useState<WebSocketMessage[]>([]);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;
  const reconnectDelay = 3000;

  const { user } = useAuth();

  const connect = useCallback(() => {
    if (!user || wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    try {
      const wsUrl = `ws://localhost:3001?token=${localStorage.getItem('authToken')}`;
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        reconnectAttemptsRef.current = 0;

        // Send initial connection message
        ws.send(JSON.stringify({
          type: 'auth',
          data: { userId: user.id },
          timestamp: Date.now()
        }));
      };

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          setLastMessage(message);

          // Handle different message types
          switch (message.type) {
            case 'vote_cast':
              toast.success('Your vote has been recorded!');
              break;
            case 'election_started':
              toast.info(`Election "${message.data.title}" has started!`);
              break;
            case 'election_ended':
              toast.warning(`Election "${message.data.title}" has ended.`);
              break;
            case 'block_mined':
              toast.info('New block added to blockchain!');
              break;
            case 'error':
              toast.error(message.data.message || 'An error occurred');
              break;
          }
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      ws.onclose = (event) => {
        console.log('WebSocket disconnected:', event.code, event.reason);
        setIsConnected(false);

        // Attempt to reconnect if not a clean disconnect
        if (event.code !== 1000 && reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current += 1;
          console.log(`Attempting to reconnect... (${reconnectAttemptsRef.current}/${maxReconnectAttempts})`);

          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, reconnectDelay * reconnectAttemptsRef.current);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      wsRef.current = ws;
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
    }
  }, [user]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close(1000, 'Client disconnect');
      wsRef.current = null;
    }

    setIsConnected(false);
    setLastMessage(null);
    reconnectAttemptsRef.current = 0;
  }, []);

  const sendMessage = useCallback((type: string, data: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      const message: WebSocketMessage = {
        type,
        data,
        timestamp: Date.now()
      };

      wsRef.current.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket is not connected. Message not sent:', { type, data });
    }
  }, []);

  // Auto-connect when user logs in
  useEffect(() => {
    if (user) {
      connect();
    } else {
      disconnect();
    }

    return () => {
      disconnect();
    };
  }, [user, connect, disconnect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  // Subscription methods
  const onVoteCast = useCallback((callback: (notification: any) => void) => {
    const handler = (message: WebSocketMessage) => {
      if (message.type === 'vote_cast') {
        callback(message.data);
      }
    };

    // Call immediately for existing notifications
    notifications.forEach(notification => {
      if (notification.type === 'vote_cast') {
        callback(notification.data);
      }
    });

    // Add to message handlers
    if (!this.messageHandlers.has('vote_cast')) {
      this.messageHandlers.set('vote_cast', new Set());
    }
    this.messageHandlers.get('vote_cast')?.add(handler);

    // Return unsubscribe function
    return () => {
      this.messageHandlers.get('vote_cast')?.delete(handler);
    };
  }, [notifications]);

  const onBlockMined = useCallback((callback: (notification: any) => void) => {
    const handler = (message: WebSocketMessage) => {
      if (message.type === 'block_mined') {
        callback(message.data);
      }
    };

    // Call immediately for existing notifications
    notifications.forEach(notification => {
      if (notification.type === 'block_mined') {
        callback(notification.data);
      }
    });

    // Add to message handlers
    if (!this.messageHandlers.has('block_mined')) {
      this.messageHandlers.set('block_mined', new Set());
    }
    this.messageHandlers.get('block_mined')?.add(handler);

    // Return unsubscribe function
    return () => {
      this.messageHandlers.get('block_mined')?.delete(handler);
    };
  }, [notifications]);

  const onElectionUpdate = useCallback((callback: (notification: any) => void) => {
    const handler = (message: WebSocketMessage) => {
      if (message.type === 'election_update') {
        callback(message.data);
      }
    };

    // Call immediately for existing notifications
    notifications.forEach(notification => {
      if (notification.type === 'election_update') {
        callback(notification.data);
      }
    });

    // Add to message handlers
    if (!this.messageHandlers.has('election_update')) {
      this.messageHandlers.set('election_update', new Set());
    }
    this.messageHandlers.get('election_update')?.add(handler);

    // Return unsubscribe function
    return () => {
      this.messageHandlers.get('election_update')?.delete(handler);
    };
  }, [notifications]);

  return {
    isConnected,
    lastMessage,
    notifications,
    connect,
    disconnect,
    sendMessage,
    onVoteCast,
    onBlockMined,
    onElectionUpdate,
  };
};