import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { DisasterMonitoringService, DisasterEvent } from '../services/disaster-monitoring.service';
import { Subscription } from 'rxjs';

// SockJS and STOMP are loaded via CDN (see index.html)
declare const SockJS: any;
declare const Stomp: any;

@Component({
    selector: 'app-disaster-monitoring',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule],
    templateUrl: './disaster-monitoring.component.html',
    styleUrls: ['./disaster-monitoring.component.css']
})
export class DisasterMonitoringComponent implements OnInit, OnDestroy {
    alerts: DisasterEvent[] = [];
    filteredAlerts: DisasterEvent[] = [];
    loading = false;
    error: string | null = null;

    // WebSocket state
    wsConnected = false;
    liveToast: string | null = null;
    private stompClient: any = null;
    private toastTimer: any = null;

    // OpenStreetMap URL (no API key needed)
    mapUrl!: SafeResourceUrl;

    // Filters
    selectedType: string = '';
    selectedSeverity: string = '';
    selectedRegion: string = '';

    // Filter options
    disasterTypes = ['FLOOD', 'CYCLONE', 'EARTHQUAKE', 'WILDFIRE', 'LANDSLIDE',
        'TSUNAMI', 'DROUGHT', 'HEATWAVE', 'STORM', 'TORNADO',
        'VOLCANIC_ERUPTION', 'OTHER'];
    severityLevels = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

    private pollingSubscription?: Subscription;

    constructor(
        private disasterService: DisasterMonitoringService,
        private sanitizer: DomSanitizer
    ) {
        this.updateMapUrl(68.1766, 7.9655, 97.4026, 35.6745); // India bounding box
    }

    ngOnInit(): void {
        this.loadAlerts();
        this.startPolling();
        this.connectWebSocket();
    }

    ngOnDestroy(): void {
        this.pollingSubscription?.unsubscribe();
        this.disconnectWebSocket();
        if (this.toastTimer) clearTimeout(this.toastTimer);
    }

    updateMapUrl(minLon: number, minLat: number, maxLon: number, maxLat: number): void {
        const url = `https://www.openstreetmap.org/export/embed.html?bbox=${minLon},${minLat},${maxLon},${maxLat}&layer=mapnik`;
        this.mapUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
    }

    // ── WebSocket ──────────────────────────────────────────────────────────

    connectWebSocket(): void {
        try {
            const socket = new SockJS('http://localhost:8080/ws-disaster-alerts');
            this.stompClient = Stomp.over(socket);
            this.stompClient.debug = null; // suppress verbose logs

            this.stompClient.connect({}, () => {
                this.wsConnected = true;
                console.log('[WS] Connected to disaster alerts');

                this.stompClient.subscribe('/topic/alerts', (message: any) => {
                    const newAlert: DisasterEvent = JSON.parse(message.body);
                    this.onLiveAlert(newAlert);
                });
            }, (error: any) => {
                console.warn('[WS] Connection failed, using polling only:', error);
                this.wsConnected = false;
            });
        } catch (e) {
            console.warn('[WS] SockJS/Stomp not available, using polling only');
        }
    }

    disconnectWebSocket(): void {
        if (this.stompClient && this.stompClient.connected) {
            this.stompClient.disconnect();
        }
    }

    onLiveAlert(alert: DisasterEvent): void {
        const exists = this.alerts.some(a => a.id === alert.id);
        if (!exists) {
            this.alerts = [alert, ...this.alerts];
        } else {
            this.alerts = this.alerts.map(a => a.id === alert.id ? alert : a);
        }
        this.applyFilters();
        this.showToast(`🔔 New alert: ${alert.title || alert.disasterType}`);
    }

    showToast(message: string): void {
        this.liveToast = message;
        if (this.toastTimer) clearTimeout(this.toastTimer);
        this.toastTimer = setTimeout(() => { this.liveToast = null; }, 5000);
    }

    // ── Data Loading ───────────────────────────────────────────────────────

    loadAlerts(): void {
        this.loading = true;
        this.error = null;

        const filters: any = {};
        if (this.selectedType) filters.type = this.selectedType;
        if (this.selectedSeverity) filters.severity = this.selectedSeverity;
        if (this.selectedRegion) filters.region = this.selectedRegion;

        this.disasterService.getAlerts(filters).subscribe({
            next: (data) => {
                this.alerts = data;
                this.applyFilters();
                this.loading = false;
            },
            error: (err) => {
                this.error = 'Failed to load disaster alerts. Please try again.';
                this.loading = false;
                console.error('Error loading alerts:', err);
            }
        });
    }

    startPolling(): void {
        this.pollingSubscription = this.disasterService.getAlertsWithPolling(60000).subscribe({
            next: (data) => {
                if (!this.wsConnected) {
                    this.alerts = data;
                    this.applyFilters();
                }
            },
            error: (err) => console.error('Error polling alerts:', err)
        });
    }

    applyFilters(): void {
        this.filteredAlerts = this.alerts.filter(alert => {
            const typeMatch = !this.selectedType || alert.disasterType === this.selectedType;
            const severityMatch = !this.selectedSeverity || alert.severity === this.selectedSeverity;
            const regionMatch = !this.selectedRegion ||
                (alert.region || '').toLowerCase().includes(this.selectedRegion.toLowerCase()) ||
                (alert.locationName || '').toLowerCase().includes(this.selectedRegion.toLowerCase());
            return typeMatch && severityMatch && regionMatch;
        });
    }

    onFilterChange(): void {
        this.loadAlerts();
    }

    clearFilters(): void {
        this.selectedType = '';
        this.selectedSeverity = '';
        this.selectedRegion = '';
        this.loadAlerts();
    }

    // ── Helpers ────────────────────────────────────────────────────────────

    getSeverityClass(severity: string): string {
        switch (severity) {
            case 'CRITICAL': return 'badge-critical';
            case 'HIGH': return 'badge-high';
            case 'MEDIUM': return 'badge-medium';
            case 'LOW': return 'badge-low';
            default: return 'badge-default';
        }
    }

    getSeverityBorderClass(severity: string): string {
        switch (severity) {
            case 'CRITICAL': return 'border-critical';
            case 'HIGH': return 'border-high';
            case 'MEDIUM': return 'border-medium';
            case 'LOW': return 'border-low';
            default: return '';
        }
    }

    formatDate(dateString: string): string {
        if (!dateString) return '';
        return new Date(dateString).toLocaleString();
    }

    getDisasterIcon(type: string): string {
        const icons: Record<string, string> = {
            'FLOOD': '🌊', 'CYCLONE': '🌀', 'EARTHQUAKE': '🏚️',
            'WILDFIRE': '🔥', 'LANDSLIDE': '⛰️', 'TSUNAMI': '🌊',
            'DROUGHT': '🏜️', 'HEATWAVE': '🌡️', 'STORM': '⛈️',
            'TORNADO': '🌪️', 'VOLCANIC_ERUPTION': '🌋', 'OTHER': '⚠️'
        };
        return icons[type] || '⚠️';
    }
}
