import { Client, IMessage } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

export class SocketService {
  private client: Client | null = null;
  private connected: boolean = false;
  private subscriptions: Map<string, any> = new Map();

  connect(
    onConnect?: () => void,
    onError?: (err: any) => void
  ) {
    if (this.client && this.connected) {
      if (onConnect) onConnect();
      return;
    }

    const backendWsUrl = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:8080/ws';

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
      },
    });

    this.client.activate();
  }

  subscribe(topic: string, callback: (data: any) => void) {
    if (!this.client) {
      this.connect(() => this.subscribe(topic, callback));
      return;
    }

    // Unsubscribe existing if any
    if (this.subscriptions.has(topic)) {
      this.subscriptions.get(topic).unsubscribe();
      this.subscriptions.delete(topic);
    }

    if (this.client.connected) {
      const sub = this.client.subscribe(topic, (message: IMessage) => {
        try {
          const parsed = JSON.parse(message.body);
          callback(parsed);
        } catch (e) {
          callback(message.body);
        }
      });
      this.subscriptions.set(topic, sub);
    } else {
      // Re-subscribe once connected
      const prevOnConnect = this.client.onConnect;
      this.client.onConnect = (frame) => {
        if (prevOnConnect) prevOnConnect(frame);
        const sub = this.client!.subscribe(topic, (message: IMessage) => {
          try {
            const parsed = JSON.parse(message.body);
            callback(parsed);
          } catch (e) {
            callback(message.body);
          }
        });
        this.subscriptions.set(topic, sub);
      };
    }
  }

  unsubscribe(topic: string) {
    if (this.subscriptions.has(topic)) {
      this.subscriptions.get(topic).unsubscribe();
      this.subscriptions.delete(topic);
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
    this.subscriptions.forEach((sub) => sub.unsubscribe());
    this.subscriptions.clear();
    if (this.client) {
      this.client.deactivate();
      this.client = null;
      this.connected = false;
    }
  }
}

export const socketService = new SocketService();
