import { writable } from 'svelte/store';

export type WebSocketStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

export const wsStatus = writable<WebSocketStatus>('disconnected');
export const ws = writable<WebSocket | null>(null);

const RECONNECT_DELAY_MS = 1000;
const MAX_RECONNECT_DELAY_MS = 30000;

function toWsUrl(url: string): string {
    const trimmed = url.trim();
    if (!trimmed) return '';
    if (trimmed.startsWith('ws://') || trimmed.startsWith('wss://')) return trimmed;
    if (trimmed.startsWith('http://')) return 'ws://' + trimmed.slice(7);
    if (trimmed.startsWith('https://')) return 'wss://' + trimmed.slice(8);
    return 'ws://' + trimmed;
}

let socket: WebSocket | null = null;
let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
let reconnectDelay = RECONNECT_DELAY_MS;
let currentUrl = '';
let intentionalClose = false;

function clearReconnectTimeout() {
    if (reconnectTimeout !== null) {
        clearTimeout(reconnectTimeout);
        reconnectTimeout = null;
    }
}

export function connectWebSocket(url: string, reconnecting = false) {
    const wsUrl = toWsUrl(url);
    if (!wsUrl) {
        wsStatus.set('disconnected');
        ws.set(null);
        return;
    }

    if (reconnecting) {
        console.log('[SBM WS] Reconnecting to', wsUrl);
    } else {
        console.log('[SBM WS] Connecting to', wsUrl);
    }

    intentionalClose = false;
    currentUrl = url;
    wsStatus.set('connecting');

    try {
        socket = new WebSocket(wsUrl);
        ws.set(socket);

        socket.onopen = () => {
            reconnectDelay = RECONNECT_DELAY_MS;
            wsStatus.set('connected');
            console.log('[SBM WS] Connected');
        };

        socket.onclose = () => {
            ws.set(null);
            socket = null;

            if (intentionalClose) {
                wsStatus.set('disconnected');
                console.log('[SBM WS] Disconnected');
                return;
            }

            console.log('[SBM WS] Connection closed; reconnecting in', reconnectDelay, 'ms');
            wsStatus.set('disconnected');
            clearReconnectTimeout();
            reconnectTimeout = setTimeout(() => {
                reconnectTimeout = null;
                if (currentUrl) {
                    connectWebSocket(currentUrl, true);
                }
                reconnectDelay = Math.min(reconnectDelay * 2, MAX_RECONNECT_DELAY_MS);
            }, reconnectDelay);
        };

        socket.onerror = () => {
            wsStatus.set('error');
        };
    } catch {
        wsStatus.set('error');
        ws.set(null);
        console.log('[SBM WS] Error; reconnecting in', reconnectDelay, 'ms');
        clearReconnectTimeout();
        reconnectTimeout = setTimeout(() => {
            reconnectTimeout = null;
            if (currentUrl) {
                connectWebSocket(currentUrl, true);
            }
        }, reconnectDelay);
    }
}

export function disconnectWebSocket() {
    intentionalClose = true;
    clearReconnectTimeout();
    currentUrl = '';
    if (socket) {
        socket.close();
        socket = null;
    }
    ws.set(null);
    wsStatus.set('disconnected');
}

export function getWebSocketUrl(): string {
    return currentUrl;
}
