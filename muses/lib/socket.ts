import { Client, IMessage } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

export class SocketService {
  private client: Client | null = null;
  private connected: boolean = false;
  private listeners: Map<string, Set<(data: any) => void>> = new Map();
  private stompSubscriptions: Map<string, any> = new Map();

  connect(
    onConnect?: () => void,
    onError?: (err: any) => void
  ) {
    if (this.client && this.connected) {
      if (onConnect) onConnect();
      return;
    }

    const backendWsUrl = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:8080/api/v1/ws';

    this.client = new Client({
      webSocketFactory: () => new SockJS(backendWsUrl),
      reconnectDelay: 3000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      debug: (str) => {
        if (process.env.NODE_ENV === 'development') {
          // console.log('[STOMP]:', str);
        }
      },
      onConnect: () => {
        this.connected = true;
        // Re-subscribe all active topics
        this.resubscribeAll();
        if (onConnect) onConnect();
      },
      onStompError: (frame) => {
        if (onError) onError(frame);
      },
      onWebSocketError: () => {
        this.connected = false;
      },
      onWebSocketClose: () => {
        this.connected = false;
        this.stompSubscriptions.clear();
      },
    });

    this.client.activate();
  }

  private resubscribeAll() {
    if (!this.client || !this.client.connected) return;

    this.listeners.forEach((_, topic) => {
      if (!this.stompSubscriptions.has(topic)) {
        const sub = this.client!.subscribe(topic, (message: IMessage) => {
          this.notifyListeners(topic, message.body);
        });
        this.stompSubscriptions.set(topic, sub);
      }
    });
  }

  private notifyListeners(topic: string, body: string) {
    let parsedData: any = body;
    try {
      parsedData = JSON.parse(body);
    } catch (e) {
      parsedData = body;
    }

    const set = this.listeners.get(topic);
    if (set) {
      set.forEach((cb) => {
        try {
          cb(parsedData);
        } catch (err) {
          console.error(`Error in STOMP listener for topic ${topic}:`, err);
        }
      });
    }
  }

  subscribe(topic: string, callback: (data: any) => void) {
    if (!this.listeners.has(topic)) {
      this.listeners.set(topic, new Set());
    }
    this.listeners.get(topic)!.add(callback);

    if (!this.client || !this.connected) {
      this.connect();
    } else if (this.client.connected && !this.stompSubscriptions.has(topic)) {
      const sub = this.client.subscribe(topic, (message: IMessage) => {
        this.notifyListeners(topic, message.body);
      });
      this.stompSubscriptions.set(topic, sub);
    }
  }

  unsubscribe(topic: string) {
    this.listeners.delete(topic);
    if (this.stompSubscriptions.has(topic)) {
      try {
        this.stompSubscriptions.get(topic).unsubscribe();
      } catch (e) {}
      this.stompSubscriptions.delete(topic);
    }
  }

  send(destination: string, body: any) {
    if (this.client && this.client.connected) {
      this.client.publish({
        destination,
        body: typeof body === 'string' ? body : JSON.stringify(body),
      });
    }
  }

  disconnect() {
    this.stompSubscriptions.forEach((sub) => {
      try { sub.unsubscribe(); } catch (e) {}
    });
    this.stompSubscriptions.clear();
    this.listeners.clear();
    if (this.client) {
      this.client.deactivate();
      this.client = null;
      this.connected = false;
    }
  }
}

export const socketService = new SocketService();
