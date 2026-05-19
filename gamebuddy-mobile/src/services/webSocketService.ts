import { WS_URL } from './apiConfig';

type WebSocketListener = (data: any) => void;

class WebSocketService {
    private socket: WebSocket | null = null;
    private listeners: Map<string, Set<WebSocketListener>> = new Map();

    connect(token: string) {
        if (this.socket) {
            this.disconnect();
        }

        const wsUri = `${WS_URL}?token=${encodeURIComponent(token)}`;
        this.socket = new WebSocket(wsUri);

        this.socket.onopen = () => {
            console.log('Global WebSocket connected');
        };

        this.socket.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                const type = data.type || 'MESSAGE'; // fallback
                this.notify(type.toLowerCase(), data);
            } catch (e) {
                console.error('Error parsing global WS message:', e);
            }
        };

        this.socket.onclose = (e) => {
            console.log('Global WebSocket closed', e.code, e.reason);
            this.socket = null;
        };

        this.socket.onerror = (e) => {
            console.error('Global WebSocket error', e);
        };
    }

    disconnect() {
        if (this.socket) {
            this.socket.close();
            this.socket = null;
        }
    }

    send(payload: any) {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify(payload));
            return true;
        }
        return false;
    }

    isOpen() {
        return this.socket !== null && this.socket.readyState === WebSocket.OPEN;
    }

    addEventListener(event: string, callback: WebSocketListener) {
        const evName = event.toLowerCase();
        if (!this.listeners.has(evName)) {
            this.listeners.set(evName, new Set());
        }
        this.listeners.get(evName)!.add(callback);
    }

    removeEventListener(event: string, callback: WebSocketListener) {
        const evName = event.toLowerCase();
        if (this.listeners.has(evName)) {
            this.listeners.get(evName)!.delete(callback);
        }
    }

    private notify(event: string, data: any) {
        const evName = event.toLowerCase();
        if (this.listeners.has(evName)) {
            this.listeners.get(evName)!.forEach((cb) => {
                try {
                    cb(data);
                } catch (err) {
                    console.error('Listener callback error:', err);
                }
            });
        }
    }
}

export const webSocketService = new WebSocketService();
