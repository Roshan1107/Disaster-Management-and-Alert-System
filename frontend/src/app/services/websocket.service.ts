import { Injectable } from '@angular/core';
import { Client } from '@stomp/stompjs';
import { BehaviorSubject } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class WebSocketService {
    private client: Client | null = null;
    private alertSubject = new BehaviorSubject<any>(null);

    constructor() {
        try {
            this.client = new Client({
                // Direct WebSocket connection to the backend
                brokerURL: 'ws://localhost:8080/ws-disaster-alerts/websocket',
                debug: (str: string) => {
                    console.log('[WS]', str);
                },
                reconnectDelay: 10000,
                heartbeatIncoming: 4000,
                heartbeatOutgoing: 4000,
            });

            this.client.onConnect = (frame: any) => {
                console.log('WebSocket connected:', frame);
                this.client!.subscribe('/topic/alerts', (message: any) => {
                    if (message.body) {
                        this.alertSubject.next(JSON.parse(message.body));
                    }
                });
            };

            this.client.onStompError = (frame: any) => {
                console.warn('WebSocket STOMP error (backend may be offline):', frame.headers['message']);
            };

            this.client.onWebSocketError = (evt: any) => {
                console.warn('WebSocket connection failed (backend may be offline)');
            };

            this.client.activate();
        } catch (err) {
            console.warn('WebSocket initialization skipped:', err);
        }
    }

    getAlerts() {
        return this.alertSubject.asObservable();
    }
}
